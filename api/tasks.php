<?php
/**
 * MyDayHub Beta 5 - Tasks Module Handler
 *
 * Contains all business logic for task-related API actions.
 * This file is included and called by the main API gateway.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

/**
 * Main router for all actions within the 'tasks' module.
 */
function handle_tasks_action(string $action, string $method, PDO $pdo, int $userId, array $data): void {
	switch ($action) {
		case 'getAll':
			if ($method === 'GET') {
				handle_get_all_board_data($pdo, $userId);
			}
			break;
		
		case 'createColumn':
			if ($method === 'POST') {
				handle_create_column($pdo, $userId, $data);
			}
			break;

		case 'createTask':
			if ($method === 'POST') {
				handle_create_task($pdo, $userId, $data);
			}
			break;

		case 'toggleComplete':
			if ($method === 'POST') {
				handle_toggle_complete($pdo, $userId, $data);
			}
			break;

		// Modified for drag and drop
		case 'reorderTasks':
			if ($method === 'POST') {
				handle_reorder_tasks($pdo, $userId, $data);
			}
			break;

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."]);
			break;
	}
}

/**
 * Reorders tasks within a column and handles moving tasks between columns.
 */
// Modified for cross-column DnD
function handle_reorder_tasks(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_id']) || !isset($data['tasks'])) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Column ID and tasks array are required.']);
		return;
	}

	$columnId = (int)$data['column_id'];
	$taskIds = $data['tasks'];

	// Ensure tasks is an array
	if (!is_array($taskIds)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Tasks must be an array.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		// This new query updates the column_id as well as the position.
		// It finds the task by its ID and user ID alone, allowing it to move columns.
		$stmt = $pdo->prepare(
			"UPDATE tasks 
			 SET position = :position, column_id = :columnId 
			 WHERE task_id = :taskId AND user_id = :userId"
		);

		foreach ($taskIds as $position => $taskId) {
			$stmt->execute([
				':position'  => $position,
				':columnId'  => $columnId,
				':taskId'    => (int)$taskId,
				':userId'    => $userId
			]);
		}

		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success']);

	} catch (Exception $e) {
		$pdo->rollBack();
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_reorder_tasks(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while reordering tasks.']);
	}
}


/**
 * Fetches all columns and their associated tasks for a given user.
 */
function handle_get_all_board_data(PDO $pdo, int $userId): void {
	try {
		$stmtColumns = $pdo->prepare(
			"SELECT column_id, column_name, position FROM `columns` WHERE user_id = :userId ORDER BY position ASC"
		);
		$stmtColumns->execute([':userId' => $userId]);
		$columns = $stmtColumns->fetchAll();

		$boardData = [];
		$columnMap = [];

		foreach ($columns as $column) {
			$column['tasks'] = [];
			$boardData[] = $column;
			$columnMap[$column['column_id']] = &$boardData[count($boardData) - 1];
		}

		$stmtTasks = $pdo->prepare(
			"SELECT task_id, column_id, encrypted_data, position, classification FROM tasks WHERE user_id = :userId ORDER BY position ASC"
		);
		$stmtTasks->execute([':userId' => $userId]);

		while ($task = $stmtTasks->fetch()) {
			$columnId = $task['column_id'];
			if (isset($columnMap[$columnId])) {
				$columnMap[$columnId]['tasks'][] = $task;
			}
		}

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => $boardData]);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_get_all_board_data(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while fetching board data.']);
	}
}

/**
 * Creates a new column for the authenticated user.
 */
function handle_create_column(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_name'])) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Column name is required.']);
		return;
	}

	$columnName = trim($data['column_name']);

	try {
		$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE user_id = :userId");
		$stmtPos->execute([':userId' => $userId]);
		$position = (int)$stmtPos->fetchColumn();

		$stmt = $pdo->prepare(
			"INSERT INTO `columns` (user_id, column_name, position) VALUES (:userId, :columnName, :position)"
		);
		$stmt->execute([
			':userId' => $userId,
			':columnName' => $columnName,
			':position' => $position
		]);

		$newColumnId = (int)$pdo->lastInsertId();

		http_response_code(201);
		echo json_encode([
			'status' => 'success',
			'data' => [
				'column_id' => $newColumnId,
				'column_name' => $columnName,
				'position' => $position,
				'tasks' => []
			]
		]);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_create_column(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while creating the column.']);
	}
}

/**
 * Creates a new task in a specified column for the authenticated user.
 */
function handle_create_task(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_id']) || empty($data['task_title'])) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Column ID and task title are required.']);
		return;
	}

	$columnId = (int)$data['column_id'];
	$taskTitle = trim($data['task_title']);

	try {
		$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM `tasks` WHERE user_id = :userId AND column_id = :columnId");
		$stmtPos->execute([':userId' => $userId, ':columnId' => $columnId]);
		$position = (int)$stmtPos->fetchColumn();

		$encryptedData = json_encode(['title' => $taskTitle]);

		$stmt = $pdo->prepare(
			"INSERT INTO `tasks` (user_id, column_id, encrypted_data, position) VALUES (:userId, :columnId, :encryptedData, :position)"
		);
		$stmt->execute([
			':userId' => $userId,
			':columnId' => $columnId,
			':encryptedData' => $encryptedData,
			':position' => $position
		]);

		$newTaskId = (int)$pdo->lastInsertId();

		http_response_code(201);
		echo json_encode([
			'status' => 'success',
			'data' => [
				'task_id' => $newTaskId,
				'column_id' => $columnId,
				'encrypted_data' => $encryptedData,
				'position' => $position,
				'classification' => 'support'
			]
		]);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_create_task(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while creating the task.']);
	}
}

/**
 * Toggles a task's classification between its current state and 'completed'.
 */
function handle_toggle_complete(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['task_id'])) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Task ID is required.']);
		return;
	}

	$taskId = (int)$data['task_id'];

	try {
		$stmtGet = $pdo->prepare("SELECT classification FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmtGet->execute([':taskId' => $taskId, ':userId' => $userId]);
		$currentClassification = $stmtGet->fetchColumn();

		if ($currentClassification === false) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}

		$newClassification = ($currentClassification === 'completed') ? 'support' : 'completed';

		$stmtUpdate = $pdo->prepare(
			"UPDATE tasks SET classification = :newClassification WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmtUpdate->execute([
			':newClassification' => $newClassification,
			':taskId' => $taskId,
			':userId' => $userId
		]);

		http_response_code(200);
		echo json_encode([
			'status' => 'success',
			'data' => ['new_classification' => $newClassification]
		]);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_toggle_complete(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while updating the task.']);
	}
}