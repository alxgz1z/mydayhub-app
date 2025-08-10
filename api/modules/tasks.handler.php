<?php
/**
 * MyDayHub v4.0.0
 * Tasks Module Handler
 *
 * Business logic for all "tasks" actions. Included by the main API gateway.
 */

/**
 * Main routing function for task-related actions.
 *
 * @param string $action The specific action to perform (e.g., 'getAll', 'createTask').
 * @param array  $data   The data payload from the client.
 * @param PDO    $pdo    The database connection object.
 * @param int    $userId The ID of the currently authenticated user.
 */
function handle_tasks_action($action, $data, $pdo, $userId) {
	switch ($action) {
		case 'getAll':
			get_all_board_data($pdo, $userId);
			break;

		case 'createTask':
			create_task($pdo, $userId, $data);
			break;

		// Future actions: updateTask, toggleComplete, togglePriority, moveTask, deleteTask, etc.

		default:
			http_response_code(404); // Not Found
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."]);
			break;
	}
}

/**
 * Fetches all columns and their associated tasks for a given user.
 * Efficient and robust.
 *
 * @param PDO $pdo
 * @param int $userId
 */
function get_all_board_data($pdo, $userId) {
	try {
		// 1) Columns
		$stmtColumns = $pdo->prepare("
			SELECT column_id, column_name
			FROM `columns`
			WHERE user_id = :userId
			ORDER BY position ASC
		");
		$stmtColumns->execute([':userId' => $userId]);
		$columnsMap = [];
		while ($row = $stmtColumns->fetch(PDO::FETCH_ASSOC)) {
			$row['tasks'] = [];
			$columnsMap[$row['column_id']] = $row;
		}

		// 2) Tasks
		$stmtTasks = $pdo->prepare("
			SELECT task_id, column_id, encrypted_data, position, status
			FROM tasks
			WHERE user_id = :userId
			ORDER BY position ASC
		");
		$stmtTasks->execute([':userId' => $userId]);
		$tasks = $stmtTasks->fetchAll(PDO::FETCH_ASSOC);

		// 3) Distribute
		foreach ($tasks as $task) {
			$columnId = $task['column_id'];
			if (!isset($columnsMap[$columnId])) continue;

			$taskData = json_decode($task['encrypted_data'], true);
			$task['data'] = (json_last_error() === JSON_ERROR_NONE)
				? $taskData
				: ['title' => 'Error: Invalid Task Data'];
			unset($task['encrypted_data']);

			$columnsMap[$columnId]['tasks'][] = $task;
		}

		// 4) Flatten
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
 * Creates a task in the specified column, at the end (max position + 1).
 * Expects: $data['column_id'], $data['title']; optional $data['status'].
 *
 * @param PDO $pdo
 * @param int $userId
 * @param array $data
 */
function create_task($pdo, $userId, $data) {
	try {
		$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
		$title    = isset($data['title']) ? trim((string)$data['title']) : '';
		$status   = isset($data['status']) ? (string)$data['status'] : 'normal';

		if ($columnId <= 0 || $title === '') {
			http_response_code(400);
			echo json_encode(['status' => 'error', 'message' => 'column_id and title are required.']);
			return;
		}

		// Ensure column belongs to user
		$check = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
		$check->execute([':cid' => $columnId, ':uid' => $userId]);
		if (!$check->fetchColumn()) {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Column not found or not owned by user.']);
			return;
		}

		// Find next position
		$posStmt = $pdo->prepare("
			SELECT COALESCE(MAX(position), -1) AS maxpos
			FROM tasks
			WHERE user_id = :uid AND column_id = :cid
		");
		$posStmt->execute([':uid' => $userId, ':cid' => $columnId]);
		$maxpos = (int)($posStmt->fetch(PDO::FETCH_ASSOC)['maxpos'] ?? -1);
		$newPos = $maxpos + 1;

		// Insert
		$enc = json_encode(['title' => $title], JSON_UNESCAPED_UNICODE);
		$ins = $pdo->prepare("
			INSERT INTO tasks (user_id, column_id, position, status, encrypted_data)
			VALUES (:uid, :cid, :pos, :status, :edata)
		");
		$ins->execute([
			':uid'    => $userId,
			':cid'    => $columnId,
			':pos'    => $newPos,
			':status' => $status,
			':edata'  => $enc
		]);

		$newId = (int)$pdo->lastInsertId();

		http_response_code(200);
		echo json_encode([
			'status' => 'success',
			'data'   => [
				'task_id'   => $newId,
				'column_id' => $columnId,
				'position'  => $newPos,
				'status'    => $status,
				'data'      => ['title' => $title]
			]
		]);

	} catch (PDOException $e) {
		http_response_code(500);
		if (defined('DEVMODE') && DEVMODE === true) {
			$logMessage = "[" . date('Y-m-d H:i:s') . "] PDOException in " . __FILE__ . ": " . $e->getMessage() . "\n";
			file_put_contents(__DIR__ . '/../../debug.log', $logMessage, FILE_APPEND);
		}
		echo json_encode(['status' => 'error', 'message' => 'Failed to create task.']);
	}
}
