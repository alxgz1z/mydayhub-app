<?php
/**
 * MyDayHub v4.1.0
 * Tasks Module Handler
 *
 * Business logic for all "tasks" module actions.
 * Included by /api/api.php (gateway).
 */

/**
 * Main routing function for task-related actions.
 *
 * @param string $action The action to perform ('getAll', 'createTask', …).
 * @param array  $data   The data payload from the client.
 * @param PDO    $pdo    The database connection object.
 * @param int    $userId The authenticated user id.
 */
function handle_tasks_action($action, $data, $pdo, $userId) {
	switch ($action) {
		case 'getAll':
			get_all_board_data($pdo, $userId);
			break;

		case 'createTask':
			create_task($pdo, $userId, $data);
			break;

		case 'moveTask':
			move_task($pdo, $userId, $data);
			break;

		// Future: toggleComplete, togglePriority, deleteTask, duplicateTask

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."]);
			break;
	}
}

/**
 * Fetch all columns and their tasks for a given user.
 */
function get_all_board_data($pdo, $userId) {
	try {
		// 1) Columns
		$stmtColumns = $pdo->prepare(
			"SELECT column_id, column_name
			   FROM `columns`
			  WHERE user_id = :userId
			  ORDER BY position ASC"
		);
		$stmtColumns->execute([':userId' => $userId]);
		$columnsMap = [];
		while ($row = $stmtColumns->fetch(PDO::FETCH_ASSOC)) {
			$row['tasks'] = [];
			$columnsMap[$row['column_id']] = $row;
		}

		// 2) Tasks
		$stmtTasks = $pdo->prepare(
			"SELECT task_id, column_id, encrypted_data, position, status
			   FROM tasks
			  WHERE user_id = :userId
			  ORDER BY position ASC"
		);
		$stmtTasks->execute([':userId' => $userId]);
		$tasks = $stmtTasks->fetchAll(PDO::FETCH_ASSOC);

		// 3) Attach to columns
		foreach ($tasks as $task) {
			$columnId = $task['column_id'];
			if (isset($columnsMap[$columnId])) {
				$taskData = json_decode($task['encrypted_data'], true);
				$task['data'] = (json_last_error() === JSON_ERROR_NONE)
					? $taskData
					: ['title' => 'Error: Invalid Task Data'];
				unset($task['encrypted_data']);

				$columnsMap[$columnId]['tasks'][] = $task;
			}
		}

		$boardData = array_values($columnsMap);
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => $boardData]);

	} catch (PDOException $e) {
		http_response_code(500);
		if (defined('DEVMODE') && DEVMODE === true) {
			$logMessage = "[" . date('Y-m-d H:i:s') . "] PDOException in " . __FILE__ . ": " . $e->getMessage() . "\n";
			file_put_contents(__DIR__ . '/../../debug.log', $logMessage, FILE_APPEND);
		}
		echo json_encode(['status' => 'error', 'message' => 'A database error occurred.']);
	}
}

/**
 * Create a new task in a column for the current user.
 * Expects: data = { column_id: int, title: string, status?: 'normal'|'priority' }
 * Returns: { task_id, column_id, position, status, data: { title } }
 */
function create_task(PDO $pdo, int $userId, array $data): void {
	try {
		$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
		$title    = isset($data['title']) ? trim((string)$data['title']) : '';
		$status   = isset($data['status']) && in_array($data['status'], ['normal','priority'], true)
			? $data['status']
			: 'normal';

		if ($columnId <= 0 || $title === '') {
			http_response_code(400);
			echo json_encode(['status' => 'error', 'message' => 'Invalid column_id or title.']);
			return;
		}

		// Ownership check: column must belong to user
		$cstmt = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
		$cstmt->execute([':cid' => $columnId, ':uid' => $userId]);
		if (!$cstmt->fetchColumn()) {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		// Next position in the column for this user
		$pstmt = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
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
			':uid'   => $userId,
			':cid'   => $columnId,
			':edata' => $edata,
			':pos'   => $nextPos,
			':status'=> $status
		]);

		$newId = (int)$pdo->lastInsertId();
		$responseTask = [
			'task_id'   => $newId,
			'column_id' => $columnId,
			'position'  => $nextPos,
			'status'    => $status,
			'data'      => ['title' => $title]
		];

		http_response_code(201);
		echo json_encode(['status' => 'success', 'data' => $responseTask]);

	} catch (PDOException $e) {
		http_response_code(500);
		if (defined('DEVMODE') && DEVMODE === true) {
			$logMessage = "[" . date('Y-m-d H:i:s') . "] PDOException in " . __FILE__ . ": " . $e->getMessage() . "\n";
			file_put_contents(__DIR__ . '/../../debug.log', $logMessage, FILE_APPEND);
		}
		echo json_encode(['status' => 'error', 'message' => 'Could not create task.']);
	}
}

/**
 * Move a task to another column (append to end) and compact source positions.
 * Expects: data = { task_id: int, to_column_id: int }
 * Optional: data.to_position (ignored for now; we append)
 * Returns: { task_id, column_id, position, status, data: { title } }
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

		// Get task and ensure it belongs to user
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
			// Nothing to do; return current state
			$taskData = json_decode($task['encrypted_data'], true);
			$responseTask = [
				'task_id'   => (int)$task['task_id'],
				'column_id' => $fromColumnId,
				'position'  => (int)$task['position'],
				'status'    => $task['status'],
				'data'      => (json_last_error() === JSON_ERROR_NONE) ? $taskData : ['title' => 'Untitled Task']
			];
			$pdo->commit();
			http_response_code(200);
			echo json_encode(['status' => 'success', 'data' => $responseTask]);
			return;
		}

		// Ownership check for destination column
		$cstmt = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
		$cstmt->execute([':cid' => $toColumnId, ':uid' => $userId]);
		if (!$cstmt->fetchColumn()) {
			$pdo->rollBack();
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		// Next dest position
		$pstmt = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid"
		);
		$pstmt->execute([':uid' => $userId, ':cid' => $toColumnId]);
		$nextPos = (int)$pstmt->fetchColumn();

		// Move task
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

		// Compact source positions (dense 0..n-1)
		$sstmt = $pdo->prepare(
			"SELECT task_id FROM tasks
			  WHERE user_id = :uid AND column_id = :cid
			  ORDER BY position ASC"
		);
		$sstmt->execute([':uid' => $userId, ':cid' => $fromColumnId]);
		$ids = $sstmt->fetchAll(PDO::FETCH_COLUMN, 0);

		$newPos = 0;
		$up = $pdo->prepare("UPDATE tasks SET position = :p, updated_at = NOW() WHERE task_id = :tid");
		foreach ($ids as $id) {
			$up->execute([':p' => $newPos++, ':tid' => (int)$id]);
		}

		// Build response
		$dstmt = $pdo->prepare(
			"SELECT task_id, column_id, position, status, encrypted_data
			   FROM tasks
			  WHERE task_id = :tid"
		);
		$dstmt->execute([':tid' => $taskId]);
		$final = $dstmt->fetch(PDO::FETCH_ASSOC);

		$pdo->commit();

		$taskData = json_decode($final['encrypted_data'], true);
		$responseTask = [
			'task_id'   => (int)$final['task_id'],
			'column_id' => (int)$final['column_id'],
			'position'  => (int)$final['position'],
			'status'    => $final['status'],
			'data'      => (json_last_error() === JSON_ERROR_NONE) ? $taskData : ['title' => 'Untitled Task']
		];

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => $responseTask]);

	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		http_response_code(500);
		if (defined('DEVMODE') && DEVMODE === true) {
			$logMessage = "[" . date('Y-m-d H:i:s') . "] PDOException in " . __FILE__ . ": " . $e->getMessage() . "\n";
			file_put_contents(__DIR__ . '/../../debug.log', $logMessage, FILE_APPEND);
		}
		echo json_encode(['status' => 'error', 'message' => 'Could not move task.']);
	}
}
