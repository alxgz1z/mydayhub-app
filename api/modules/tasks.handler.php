<?php
/**
 * MyDayHub v4.0.0
 * Tasks Module Handler
 *
 * This file contains the business logic for all "tasks" module actions.
 * It is included by the main API gateway.
 */

/**
 * Main routing function for task-related actions.
 *
 * @param string $action The specific action to perform (e.g., 'getAll').
 * @param array $data The data payload from the client.
 * @param PDO $pdo The database connection object.
 * @param int $userId The ID of the currently authenticated user.
 */
function handle_tasks_action($action, $data, $pdo, $userId) {
	switch ($action) {
		case 'getAll':
			get_all_board_data($pdo, $userId);
			break;
		// Future actions like 'createTask', 'updateTask', etc., will go here.
		default:
			http_response_code(404); // Not Found
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."]);
			break;
	}
}

/**
 * Fetches all columns and their associated tasks for a given user.
 * This updated version is more efficient and robust.
 *
 * @param PDO $pdo The database connection object.
 * @param int $userId The ID of the user whose data is being requested.
 */
function get_all_board_data($pdo, $userId) {
	try {
		// 1. Fetch columns and create a map keyed by column_id for efficiency.
		$stmtColumns = $pdo->prepare("SELECT column_id, column_name FROM `columns` WHERE user_id = :userId ORDER BY position ASC");
		$stmtColumns->execute([':userId' => $userId]);
		$columnsMap = [];
		while ($row = $stmtColumns->fetch(PDO::FETCH_ASSOC)) {
			$row['tasks'] = []; // Pre-initialize the tasks array.
			$columnsMap[$row['column_id']] = $row;
		}

		// 2. Fetch all tasks for the user.
		$stmtTasks = $pdo->prepare("SELECT task_id, column_id, encrypted_data, position, status FROM tasks WHERE user_id = :userId ORDER BY position ASC");
		$stmtTasks->execute([':userId' => $userId]);
		$tasks = $stmtTasks->fetchAll(PDO::FETCH_ASSOC);

		// 3. Distribute tasks into the 'tasks' array of the correct column.
		foreach ($tasks as $task) {
			$columnId = $task['column_id'];
			// Only add task if its column exists in our map.
			if (isset($columnsMap[$columnId])) {
				// Safely decode the JSON data for the task title.
				$taskData = json_decode($task['encrypted_data'], true);
				$task['data'] = (json_last_error() === JSON_ERROR_NONE) ? $taskData : ['title' => 'Error: Invalid Task Data'];
				unset($task['encrypted_data']);

				$columnsMap[$columnId]['tasks'][] = $task;
			}
		}

		// 4. Convert the map back to a simple indexed array for the JSON response.
		$boardData = array_values($columnsMap);

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => $boardData]);

	} catch (PDOException $e) {
		// UPDATED: This block now writes directly to our debug.log file.
		http_response_code(500);
		if (defined('DEVMODE') && DEVMODE === true) {
			$logMessage = "[" . date('Y-m-d H:i:s') . "] PDOException in " . __FILE__ . ": " . $e->getMessage() . "\n";
			// The path goes up two levels from /api/modules/ to the app root.
			file_put_contents(__DIR__ . '/../../debug.log', $logMessage, FILE_APPEND);
		}
		echo json_encode(['status' => 'error', 'message' => 'A database error occurred.']);
	}
}