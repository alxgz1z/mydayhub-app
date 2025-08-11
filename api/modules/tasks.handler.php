<?php
/**
 * MyDayHub v4.3.0
 * Tasks Module Handler
 *
 * Business logic for all "tasks" module actions.
 * Included by /api/api.php (gateway).
 */

// No strict_types for compatibility with existing gateway.

/**
 * Main routing function for task-related actions.
 *
 * @param string $action The action to perform.
 * @param array  $data   The data payload from the client.
 * @param PDO    $pdo    The database connection object.
 * @param int    $userId The authenticated user id.
 */
function handle_tasks_action($action, $data, $pdo, $userId) {
	switch ($action) {
		case 'getAll':
			get_all_board_data($pdo, (int)$userId);
			break;

		case 'createTask':
			create_task($pdo, (int)$userId, $data);
			break;

		case 'moveTask':
			move_task($pdo, (int)$userId, $data);
			break;

		case 'toggleComplete':
			toggle_complete($pdo, (int)$userId, $data);
			break;

		case 'togglePriority':
			toggle_priority($pdo, (int)$userId, $data);
			break;

		case 'reorderColumn':
			reorder_column($pdo, (int)$userId, $data);
			break;

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."]);
			break;
	}
}

/**
 * Fetch all columns and their tasks for a given user.
 */
function get_all_board_data(PDO $pdo, int $userId): void {
	try {
		$stmtColumns = $pdo->prepare(
			"SELECT column_id, column_name
			   FROM `columns`
			  WHERE user_id = :uid
			  ORDER BY position ASC"
		);
		$stmtColumns->execute([':uid' => $userId]);
		$columnsMap = [];
		while ($row = $stmtColumns->fetch(PDO::FETCH_ASSOC)) {
			$row['tasks'] = [];
			$columnsMap[(int)$row['column_id']] = $row;
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
			$taskData = json_decode($task['encrypted_data'], true);
			$task['data'] = (json_last_error() === JSON_ERROR_NONE)
				? $taskData : ['title' => 'Untitled Task'];
			unset($task['encrypted_data']);
			$columnsMap[$cid]['tasks'][] = $task;
		}

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => array_values($columnsMap)]);

	} catch (PDOException $e) {
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A database error occurred.']);
	}
}

/**
 * Create a new task at end of a column.
 * data: { column_id:int, title:string, status?:"normal"|"priority" }
 */
function create_task(PDO $pdo, int $userId, array $data): void {
	try {
		$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
		$title    = isset($data['title']) ? trim((string)$data['title']) : '';
		$status   = (isset($data['status']) && in_array($data['status'], ['normal','priority'], true))
			? $data['status'] : 'normal';

		if ($columnId <= 0 || $title === '') {
			http_response_code(400);
			echo json_encode(['status' => 'error', 'message' => 'Invalid column_id or title.']);
			return;
		}

		if (!_column_owned_by($pdo, $columnId, $userId)) {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		$nextPos = _next_position($pdo, $userId, $columnId);

		$edata = json_encode(['title' => $title], JSON_UNESCAPED_UNICODE);
		$ins = $pdo->prepare(
			"INSERT INTO tasks (user_id, column_id, encrypted_data, position, status, created_at, updated_at)
			 VALUES (:uid, :cid, :edata, :pos, :status, NOW(), NOW())"
		);
		$ins->execute([
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

/**
 * Move a task to another column, append to end, compact source.
 * data: { task_id:int, to_column_id:int }
 */
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

		$task = _load_task_for_update($pdo, $userId, $taskId);
		if (!$task) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}

		$fromColumnId = (int)$task['column_id'];
		if ($fromColumnId === $toColumnId) {
			// Nothing to do
			$pdo->commit();
			http_response_code(200);
			echo json_encode(['status' => 'success', 'data' => _normalize_task_row($task)]);
			return;
		}

		if (!_column_owned_by($pdo, $toColumnId, $userId)) {
			$pdo->rollBack();
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		$nextPos = _next_position($pdo, $userId, $toColumnId);

		$upd = $pdo->prepare(
			"UPDATE tasks
				SET column_id = :to_cid, position = :pos, updated_at = NOW()
			  WHERE task_id = :tid AND user_id = :uid"
		);
		$upd->execute([
			':to_cid' => $toColumnId,
			':pos'    => $nextPos,
			':tid'    => $taskId,
			':uid'    => $userId
		]);

		_compact_positions($pdo, $userId, $fromColumnId);

		$final = _load_task($pdo, $userId, $taskId);
		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => _normalize_task_row($final)]);

	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not move task.']);
	}
}

/**
 * Toggle completion.
 * data: { task_id:int, completed:bool }
 * MVP: completed=true → 'completed'; false → 'normal'
 */
function toggle_complete(PDO $pdo, int $userId, array $data): void {
	$taskId    = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$completed = isset($data['completed']) ? (bool)$data['completed'] : null;

	if ($taskId <= 0 || $completed === null) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id or completed.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$task = _load_task_for_update($pdo, $userId, $taskId);
		if (!$task) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}

		$newStatus = $completed ? 'completed' : 'normal';
		_set_task_status($pdo, $taskId, $userId, $newStatus);

		$final = _load_task($pdo, $userId, $taskId);
		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => _normalize_task_row($final)]);

	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not update completion.']);
	}
}

/**
 * Toggle priority.
 * data: { task_id:int, on:bool }
 * Rules: on=true → 'priority'; on=false → 'normal'
 * Note: If it was 'completed', enabling priority will un-complete it.
 */
function toggle_priority(PDO $pdo, int $userId, array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$on     = isset($data['on']) ? (bool)$data['on'] : null;

	if ($taskId <= 0 || $on === null) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id or on.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$task = _load_task_for_update($pdo, $userId, $taskId);
		if (!$task) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}

		$newStatus = $on ? 'priority' : 'normal';
		_set_task_status($pdo, $taskId, $userId, $newStatus);

		$final = _load_task($pdo, $userId, $taskId);
		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => _normalize_task_row($final)]);

	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not update priority.']);
	}
}

/**
 * Reorder every task in a column according to client-provided order.
 * data: { column_id:int, ordered:int[] } — ordered contains task_ids in final order.
 * We validate ownership and normalize: any missing tasks from the column are
 * appended after the provided list to keep positions dense.
 */
function reorder_column(PDO $pdo, int $userId, array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
	$ordered  = isset($data['ordered']) && is_array($data['ordered']) ? $data['ordered'] : [];

	if ($columnId <= 0 || empty($ordered)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid column_id or ordered array.']);
		return;
	}

	try {
		if (!_column_owned_by($pdo, $columnId, $userId)) {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		$pdo->beginTransaction();

		// Get current tasks in the column
		$sel = $pdo->prepare(
			"SELECT task_id
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid
			  ORDER BY position ASC"
		);
		$sel->execute([':uid' => $userId, ':cid' => $columnId]);
		$currentIds = array_map('intval', $sel->fetchAll(PDO::FETCH_COLUMN, 0));

		// Sanitize provided order (intersection)
		$ordered = array_values(array_unique(array_map('intval', $ordered)));
		$ordered = array_values(array_intersect($ordered, $currentIds));

		// Append any missing ids to keep a total ordering
		$missing = array_values(array_diff($currentIds, $ordered));
		$finalOrder = array_merge($ordered, $missing);

		// Apply positions
		$upd = $pdo->prepare("UPDATE tasks SET position = :p, updated_at = NOW() WHERE task_id = :tid AND user_id = :uid");
		$pos = 0;
		foreach ($finalOrder as $tid) {
			$upd->execute([':p' => $pos++, ':tid' => $tid, ':uid' => $userId]);
		}

		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => ['column_id' => $columnId, 'count' => count($finalOrder)]]);

	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not reorder column.']);
	}
}

/* =========================
 * Internal helper functions
 * ========================= */

function _column_owned_by(PDO $pdo, int $columnId, int $userId): bool {
	$st = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
	$st->execute([':cid' => $columnId, ':uid' => $userId]);
	return (bool)$st->fetchColumn();
}

function _next_position(PDO $pdo, int $userId, int $columnId): int {
	$st = $pdo->prepare(
		"SELECT COALESCE(MAX(position), -1) + 1
		   FROM tasks
		  WHERE user_id = :uid AND column_id = :cid"
	);
	$st->execute([':uid' => $userId, ':cid' => $columnId]);
	return (int)$st->fetchColumn();
}

function _compact_positions(PDO $pdo, int $userId, int $columnId): void {
	$sel = $pdo->prepare(
		"SELECT task_id
		   FROM tasks
		  WHERE user_id = :uid AND column_id = :cid
		  ORDER BY position ASC"
	);
	$sel->execute([':uid' => $userId, ':cid' => $columnId]);
	$ids = $sel->fetchAll(PDO::FETCH_COLUMN, 0);

	$newPos = 0;
	$upd = $pdo->prepare("UPDATE tasks SET position = :p, updated_at = NOW() WHERE task_id = :tid");
	foreach ($ids as $id) {
		$upd->execute([':p' => $newPos++, ':tid' => (int)$id]);
	}
}

function _load_task(PDO $pdo, int $userId, int $taskId): ?array {
	$st = $pdo->prepare(
		"SELECT task_id, user_id, column_id, position, status, encrypted_data
		   FROM tasks
		  WHERE task_id = :tid AND user_id = :uid"
	);
	$st->execute([':tid' => $taskId, ':uid' => $userId]);
	$row = $st->fetch(PDO::FETCH_ASSOC);
	return $row ?: null;
}

function _load_task_for_update(PDO $pdo, int $userId, int $taskId): ?array {
	$st = $pdo->prepare(
		"SELECT task_id, user_id, column_id, position, status, encrypted_data
		   FROM tasks
		  WHERE task_id = :tid AND user_id = :uid
		  FOR UPDATE"
	);
	$st->execute([':tid' => $taskId, ':uid' => $userId]);
	$row = $st->fetch(PDO::FETCH_ASSOC);
	return $row ?: null;
}

function _set_task_status(PDO $pdo, int $taskId, int $userId, string $status): void {
	if (!in_array($status, ['normal','priority','completed'], true)) {
		throw new InvalidArgumentException('Invalid status');
	}
	$st = $pdo->prepare(
		"UPDATE tasks
			SET status = :s, updated_at = NOW()
		  WHERE task_id = :tid AND user_id = :uid"
	);
	$st->execute([':s' => $status, ':tid' => $taskId, ':uid' => $userId]);
}

function _normalize_task_row(array $row): array {
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
		$logMessage = "[" . date('Y-m-d H:i:s') . "] PDOException in {$file}: " . $e->getMessage() . "\n";
		file_put_contents(__DIR__ . '/../../debug.log', $logMessage, FILE_APPEND);
	}
}
