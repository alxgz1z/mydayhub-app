<?php
/**
 * MyDayHub v4.4.4
 * Tasks Module Handler
 *
 * Business logic for all "tasks" module actions.
 * Included by /api/api.php (gateway).
 *
 * Gateway calls:
 *   handle_tasks_action($action, $data, $pdo, $userId)
 */

declare(strict_types=1);

function handle_tasks_action($action, $data, $pdo, $userId) {
	switch ($action) {
		case 'getAll':          get_all_board_data($pdo, (int)$userId);         break;
		case 'createTask':      create_task($pdo, (int)$userId, $data);         break;
		case 'moveTask':        move_task($pdo, (int)$userId, $data);           break;
		case 'toggleComplete':  toggle_complete($pdo, (int)$userId, $data);     break;
		case 'togglePriority':  toggle_priority($pdo, (int)$userId, $data);     break;
		case 'reorderColumn':   reorder_column($pdo, (int)$userId, $data);      break;

		// Columns
		case 'createColumn':    create_column($pdo, (int)$userId, $data);       break;
		case 'deleteColumn':    delete_column($pdo, (int)$userId, $data);       break;

		// NEW: Tasks – persistence for quick actions
		case 'deleteTask':      delete_task($pdo, (int)$userId, $data);         break;
		case 'duplicateTask':   duplicate_task($pdo, (int)$userId, $data);      break;

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."]);
			break;
	}
}

/** ---------------------------------------------------------------------- **
 * Board (columns + tasks)
 ** ---------------------------------------------------------------------- */
function get_all_board_data(PDO $pdo, int $userId): void {
	try {
		$stmtColumns = $pdo->prepare(
			"SELECT column_id, column_name, position
			   FROM `columns`
			  WHERE user_id = :uid
			  ORDER BY position ASC"
		);
		$stmtColumns->execute([':uid' => $userId]);

		$columnsMap = [];
		while ($row = $stmtColumns->fetch(PDO::FETCH_ASSOC)) {
			$row['column_id'] = (int)$row['column_id'];
			$row['position']  = (int)$row['position'];
			$row['tasks']     = [];
			$columnsMap[$row['column_id']] = $row;
		}

		$stmtTasks = $pdo->prepare(
			"SELECT task_id, column_id, encrypted_data, position, status
			   FROM tasks
			  WHERE user_id = :uid
			  ORDER BY position ASC"
		);
		$stmtTasks->execute([':uid' => $userId]);

		while ($task = $stmtTasks->fetch(PDO::FETCH_ASSOC)) {
			$cid = (int)$task['column_id'];
			if (!isset($columnsMap[$cid])) continue;
			$data = json_decode($task['encrypted_data'], true);
			$columnsMap[$cid]['tasks'][] = [
				'task_id'   => (int)$task['task_id'],
				'column_id' => $cid,
				'position'  => (int)$task['position'],
				'status'    => $task['status'],
				'data'      => (json_last_error() === JSON_ERROR_NONE) ? $data : ['title' => 'Untitled Task']
			];
		}

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => array_values($columnsMap)]);
	} catch (PDOException $e) {
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A database error occurred.']);
	}
}

/** ---------------------------------------------------------------------- **
 * Tasks: create / move / toggle / reorder
 ** ---------------------------------------------------------------------- */
function create_task(PDO $pdo, int $userId, array $data): void {
	try {
		$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
		$title    = isset($data['title']) ? trim((string)$data['title']) : '';
		$status   = (isset($data['status']) &&
					 in_array($data['status'], ['normal','priority','completed'], true))
				   ? $data['status'] : 'normal';

		if ($columnId <= 0 || $title === '') {
			http_response_code(400);
			echo json_encode(['status' => 'error', 'message' => 'Invalid column_id or title.']);
			return;
		}

		$cstmt = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
		$cstmt->execute([':cid' => $columnId, ':uid' => $userId]);
		if (!$cstmt->fetchColumn()) {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		$pstmt = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid"
		);
		$pstmt->execute([':uid' => $userId, ':cid' => $columnId]);
		$nextPos = (int)$pstmt->fetchColumn();

		$edata = json_encode(['title' => $title], JSON_UNESCAPED_UNICODE);

		$istmt = $pdo->prepare(
			"INSERT INTO tasks (user_id, column_id, encrypted_data, position, status, created_at, updated_at)
			 VALUES (:uid, :cid, :edata, :pos, :status, NOW(), NOW())"
		);
		$istmt->execute([
			':uid'    => $userId,
			':cid'    => $columnId,
			':edata'  => $edata,
			':pos'    => $nextPos,
			':status' => $status
		]);

		$newId = (int)$pdo->lastInsertId();
		http_response_code(201);
		echo json_encode([
			'status' => 'success',
			'data'   => [
				'task_id'   => $newId,
				'column_id' => $columnId,
				'position'  => $nextPos,
				'status'    => $status,
				'data'      => ['title' => $title]
			]
		]);
	} catch (PDOException $e) {
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not create task.']);
	}
}

function move_task(PDO $pdo, int $userId, array $data): void {
	$taskId     = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$toColumnId = isset($data['to_column_id']) ? (int)$data['to_column_id'] : 0;

	if ($taskId <= 0 || $toColumnId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id or to_column_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$tstmt = $pdo->prepare(
			"SELECT task_id, user_id, column_id, position, status, encrypted_data
			   FROM tasks
			  WHERE task_id = :tid AND user_id = :uid
			  FOR UPDATE"
		);
		$tstmt->execute([':tid' => $taskId, ':uid' => $userId]);
		$task = $tstmt->fetch(PDO::FETCH_ASSOC);
		if (!$task) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}

		$fromColumnId = (int)$task['column_id'];
		if ($fromColumnId === $toColumnId) {
			$pdo->commit();
			http_response_code(200);
			echo json_encode(['status' => 'success', 'data' => _normalize_task($task)]);
			return;
		}

		$cstmt = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
		$cstmt->execute([':cid' => $toColumnId, ':uid' => $userId]);
		if (!$cstmt->fetchColumn()) {
			$pdo->rollBack();
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		$pstmt = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid"
		);
		$pstmt->execute([':uid' => $userId, ':cid' => $toColumnId]);
		$nextPos = (int)$pstmt->fetchColumn();

		$ustmt = $pdo->prepare(
			"UPDATE tasks
				SET column_id = :to_cid, position = :pos, updated_at = NOW()
			  WHERE task_id = :tid AND user_id = :uid"
		);
		$ustmt->execute([
			':to_cid' => $toColumnId,
			':pos'    => $nextPos,
			':tid'    => $taskId,
			':uid'    => $userId
		]);

		$sstmt = $pdo->prepare(
			"SELECT task_id
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid
			  ORDER BY position ASC"
		);
		$sstmt->execute([':uid' => $userId, ':cid' => $fromColumnId]);

		$newPos = 0;
		$up = $pdo->prepare("UPDATE tasks SET position = :p, updated_at = NOW() WHERE task_id = :tid");
		while ($id = $sstmt->fetchColumn()) {
			$up->execute([':p' => $newPos++, ':tid' => (int)$id]);
		}

		$dstmt = $pdo->prepare(
			"SELECT task_id, column_id, position, status, encrypted_data
			   FROM tasks
			  WHERE task_id = :tid"
		);
		$dstmt->execute([':tid' => $taskId]);
		$final = $dstmt->fetch(PDO::FETCH_ASSOC);

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => _normalize_task($final)]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not move task.']);
	}
}

function toggle_complete(PDO $pdo, int $userId, array $data): void {
	$taskId    = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$completed = isset($data['completed']) ? (bool)$data['completed'] : false;

	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$ustatus = $completed ? 'completed' : 'normal';
		$pdo->prepare(
			"UPDATE tasks SET status = :st, updated_at = NOW()
			  WHERE task_id = :tid AND user_id = :uid"
		)->execute([':st' => $ustatus, ':tid' => $taskId, ':uid' => $userId]);

		$sel = $pdo->prepare(
			"SELECT task_id, column_id, position, status, encrypted_data
			   FROM tasks
			  WHERE task_id = :tid AND user_id = :uid"
		);
		$sel->execute([':tid' => $taskId, ':uid' => $userId]);
		$row = $sel->fetch(PDO::FETCH_ASSOC);
		if (!$row) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => _normalize_task($row)]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not update completion.']);
	}
}

function toggle_priority(PDO $pdo, int $userId, array $data): void {
	$taskId   = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$priority = isset($data['priority']) ? (bool)$data['priority'] : false;

	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id.']);
		return;
	}

	try {
		$cur = $pdo->prepare(
			"SELECT status FROM tasks WHERE task_id = :tid AND user_id = :uid"
		);
		$cur->execute([':tid' => $taskId, ':uid' => $userId]);
		$st = $cur->fetchColumn();
		if ($st === false) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}
		if ($st === 'completed') { // keep completed immutable to priority toggles
			http_response_code(200);
			echo json_encode(['status' => 'success']);
			return;
		}

		$newStatus = $priority ? 'priority' : 'normal';
		$pdo->prepare(
			"UPDATE tasks SET status = :st, updated_at = NOW()
			  WHERE task_id = :tid AND user_id = :uid"
		)->execute([':st' => $newStatus, ':tid' => $taskId, ':uid' => $userId]);

		http_response_code(200);
		echo json_encode(['status' => 'success']);
	} catch (PDOException $e) {
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not update priority.']);
	}
}

function reorder_column(PDO $pdo, int $userId, array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
	$ordered  = isset($data['ordered']) && is_array($data['ordered']) ? $data['ordered'] : [];

	if ($columnId <= 0 || empty($ordered)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid column_id or empty order.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$c = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
		$c->execute([':cid' => $columnId, ':uid' => $userId]);
		if (!$c->fetchColumn()) {
			$pdo->rollBack();
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		$u = $pdo->prepare(
			"UPDATE tasks
				SET position = :pos, updated_at = NOW()
			  WHERE task_id = :tid AND user_id = :uid AND column_id = :cid"
		);
		foreach ($ordered as $i => $taskId) {
			$u->execute([
				':pos' => (int)$i,
				':tid' => (int)$taskId,
				':uid' => $userId,
				':cid' => $columnId
			]);
		}

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success']);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not reorder column.']);
	}
}

/** ---------------------------------------------------------------------- **
 * Columns
 ** ---------------------------------------------------------------------- */
function create_column(PDO $pdo, int $userId, array $data): void {
	$name = isset($data['column_name']) ? trim((string)$data['column_name']) : '';
	if ($name === '') {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Column name required.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$q = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1 FROM `columns` WHERE user_id = :uid"
		);
		$q->execute([':uid' => $userId]);
		$nextPos = (int)$q->fetchColumn();

		try {
			$ins = $pdo->prepare(
				"INSERT INTO `columns` (user_id, column_name, position, created_at, updated_at)
				 VALUES (:uid, :name, :pos, NOW(), NOW())"
			);
			$ins->execute([':uid' => $userId, ':name' => $name, ':pos' => $nextPos]);
		} catch (PDOException $e) {
			if ($e->getCode() !== '42S22') throw $e; // unknown column
			$ins2 = $pdo->prepare(
				"INSERT INTO `columns` (user_id, column_name, position)
				 VALUES (:uid, :name, :pos)"
			);
			$ins2->execute([':uid' => $userId, ':name' => $name, ':pos' => $nextPos]);
		}

		$newId = (int)$pdo->lastInsertId();
		$pdo->commit();

		http_response_code(201);
		echo json_encode(['status' => 'success', 'data' => [
			'column_id'   => $newId,
			'column_name' => $name,
			'position'    => $nextPos
		]]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not create column.']);
	}
}

function delete_column(PDO $pdo, int $userId, array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
	if ($columnId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid column_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$chk = $pdo->prepare(
			"SELECT position FROM `columns` WHERE column_id = :cid AND user_id = :uid FOR UPDATE"
		);
		$chk->execute([':cid' => $columnId, ':uid' => $userId]);
		if (!$chk->fetch(PDO::FETCH_ASSOC)) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Column not found.']);
			return;
		}

		$pdo->prepare(
			"DELETE FROM tasks WHERE user_id = :uid AND column_id = :cid"
		)->execute([':uid' => $userId, ':cid' => $columnId]);

		$pdo->prepare(
			"DELETE FROM `columns` WHERE column_id = :cid AND user_id = :uid"
		)->execute([':cid' => $columnId, ':uid' => $userId]);

		$sel = $pdo->prepare(
			"SELECT column_id FROM `columns` WHERE user_id = :uid ORDER BY position ASC"
		);
		$sel->execute([':uid' => $userId]);

		$pos = 0;
		$withUpdated = true;
		while ($cid = $sel->fetchColumn()) {
			try {
				if ($withUpdated) {
					$up = $pdo->prepare(
						"UPDATE `columns` SET position = :p, updated_at = NOW() WHERE column_id = :cid"
					);
				} else {
					$up = $pdo->prepare(
						"UPDATE `columns` SET position = :p WHERE column_id = :cid"
					);
				}
				$up->execute([':p' => $pos++, ':cid' => (int)$cid]);
			} catch (PDOException $e) {
				if ($e->getCode() === '42S22' && $withUpdated) {
					$withUpdated = false;
					$pdo->prepare(
						"UPDATE `columns` SET position = :p WHERE column_id = :cid"
					)->execute([':p' => $pos - 1, ':cid' => (int)$cid]);
				} else {
					throw $e;
				}
			}
		}

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => ['column_id' => $columnId]]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not delete column.']);
	}
}

/** ---------------------------------------------------------------------- **
 * NEW: Tasks – delete / duplicate
 ** ---------------------------------------------------------------------- */

/**
 * Delete a task and recompact the positions in the same column.
 * Expects: data = { task_id: int }
 */
function delete_task(PDO $pdo, int $userId, array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$sel = $pdo->prepare(
			"SELECT column_id FROM tasks WHERE task_id = :tid AND user_id = :uid FOR UPDATE"
		);
		$sel->execute([':tid' => $taskId, ':uid' => $userId]);
		$row = $sel->fetch(PDO::FETCH_ASSOC);
		if (!$row) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}
		$columnId = (int)$row['column_id'];

		$pdo->prepare("DELETE FROM tasks WHERE task_id = :tid AND user_id = :uid")
			->execute([':tid' => $taskId, ':uid' => $userId]);

		// Compact positions in that column
		$ids = $pdo->prepare(
			"SELECT task_id FROM tasks WHERE user_id = :uid AND column_id = :cid ORDER BY position ASC"
		);
		$ids->execute([':uid' => $userId, ':cid' => $columnId]);

		$posU = $pdo->prepare("UPDATE tasks SET position = :p, updated_at = NOW() WHERE task_id = :tid");
		$p = 0;
		while ($id = $ids->fetchColumn()) {
			$posU->execute([':p' => $p++, ':tid' => (int)$id]);
		}

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => ['task_id' => $taskId]]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not delete task.']);
	}
}

/**
 * Duplicate a task into the same column at the end.
 * Resets status to 'normal'. Returns the newly created task.
 * Expects: data = { task_id: int }
 */
function duplicate_task(PDO $pdo, int $userId, array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Lock source task
		$src = $pdo->prepare(
			"SELECT column_id, encrypted_data
			   FROM tasks
			  WHERE task_id = :tid AND user_id = :uid
			  FOR UPDATE"
		);
		$src->execute([':tid' => $taskId, ':uid' => $userId]);
		$row = $src->fetch(PDO::FETCH_ASSOC);
		if (!$row) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}
		$columnId = (int)$row['column_id'];

		// Next position at end of the same column
		$pstmt = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid"
		);
		$pstmt->execute([':uid' => $userId, ':cid' => $columnId]);
		$nextPos = (int)$pstmt->fetchColumn();

		// Build new title "… (Copy)"
		$srcData  = json_decode($row['encrypted_data'], true);
		if (json_last_error() !== JSON_ERROR_NONE || !is_array($srcData)) {
			$srcData = ['title' => 'Untitled Task'];
		}
		$srcTitle = (string)($srcData['title'] ?? 'Untitled Task');
		$newTitle = $srcTitle . ' (Copy)';
		$edata    = json_encode(['title' => $newTitle], JSON_UNESCAPED_UNICODE);

		// Insert duplicate with status 'normal'
		$ins = $pdo->prepare(
			"INSERT INTO tasks (user_id, column_id, encrypted_data, position, status, created_at, updated_at)
			 VALUES (:uid, :cid, :edata, :pos, 'normal', NOW(), NOW())"
		);
		$ins->execute([
			':uid'   => $userId,
			':cid'   => $columnId,
			':edata' => $edata,
			':pos'   => $nextPos
		]);

		$newId = (int)$pdo->lastInsertId();
		$pdo->commit();

		http_response_code(201);
		echo json_encode([
			'status' => 'success',
			'data'   => [
				'task_id'   => $newId,
				'column_id' => $columnId,
				'position'  => $nextPos,
				'status'    => 'normal',
				'data'      => ['title' => $newTitle]
			]
		]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not duplicate task.']);
	}
}

/** ---------------------------------------------------------------------- **
 * Helpers
 ** ---------------------------------------------------------------------- */
function _normalize_task(array $row): array {
	$data = json_decode($row['encrypted_data'], true);
	return [
		'task_id'   => (int)$row['task_id'],
		'column_id' => (int)$row['column_id'],
		'position'  => (int)$row['position'],
		'status'    => $row['status'],
		'data'      => (json_last_error() === JSON_ERROR_NONE) ? $data : ['title' => 'Untitled Task']
	];
}

function _log_pdo(string $file, PDOException $e): void {
	if (defined('DEVMODE') && DEVMODE === true) {
		@file_put_contents(__DIR__ . '/../../debug.log',
			'[' . date('Y-m-d H:i:s') . "] PDOException in {$file}: {$e->getMessage()}\n",
			FILE_APPEND
		);
	}
}