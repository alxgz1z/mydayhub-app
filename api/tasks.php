<?php
/**
 * MyDayHub Beta 5 - Tasks Module Handler
 *
 * Contains all business logic for task-related API actions.
 * This file is included and called by the main API gateway.
 *
 * @version 5.2.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

// Define constants for the attachment feature
define('ATTACHMENT_UPLOAD_DIR', __DIR__ . '/../media/imgs/');
define('MAX_FILE_SIZE_BYTES', 5 * 1024 * 1024); // 5 MB
define('USER_STORAGE_QUOTA_BYTES', 50 * 1024 * 1024); // 50 MB
define('ALLOWED_MIME_TYPES', [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp'
]);

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

		case 'getAttachments':
			if ($method === 'GET') {
				handle_get_attachments($pdo, $userId);
			}
			break;
		
		case 'createColumn':
			if ($method === 'POST') {
				handle_create_column($pdo, $userId, $data);
			}
			break;
		
		case 'renameColumn':
			if ($method === 'POST') {
				handle_rename_column($pdo, $userId, $data);
			}
			break;
		
		case 'deleteColumn':
			if ($method === 'POST') {
				handle_delete_column($pdo, $userId, $data);
			}
			break;

		case 'reorderColumns':
			if ($method === 'POST') {
				handle_reorder_columns($pdo, $userId, $data);
			}
			break;

		case 'createTask':
			if ($method === 'POST') {
				handle_create_task($pdo, $userId, $data);
			}
			break;
		
		case 'deleteTask':
			if ($method === 'POST') {
				handle_delete_task($pdo, $userId, $data);
			}
			break;

		case 'renameTaskTitle':
			if ($method === 'POST') {
				handle_rename_task_title($pdo, $userId, $data);
			}
			break;
		
		case 'saveTaskDetails':
			if ($method === 'POST') {
				handle_save_task_details($pdo, $userId, $data);
			}
			break;

		case 'duplicateTask':
			if ($method === 'POST') {
				handle_duplicate_task($pdo, $userId, $data);
			}
			break;

		case 'toggleComplete':
			if ($method === 'POST') {
				handle_toggle_complete($pdo, $userId, $data);
			}
			break;

		case 'reorderTasks':
			if ($method === 'POST') {
				handle_reorder_tasks($pdo, $userId, $data);
			}
			break;

		case 'toggleClassification':
			if ($method === 'POST') {
				handle_toggle_classification($pdo, $userId, $data);
			}
			break;

		case 'uploadAttachment':
			if ($method === 'POST') {
				handle_upload_attachment($pdo, $userId, $data);
			}
			break;

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."]);
			break;
	}
}

/**
 * Saves details (notes and/or due date) to a task.
 */
function handle_save_task_details(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	
	$notes = isset($data['notes']) ? (string)$data['notes'] : null;
	$dueDate = isset($data['dueDate']) ? $data['dueDate'] : null;

	if ($taskId <= 0 || ($notes === null && !array_key_exists('dueDate', $data))) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Task ID and at least one field to update (notes or dueDate) are required.']);
		return;
	}

	$dueDateForDb = null;
	if (array_key_exists('dueDate', $data)) {
		if (empty($data['dueDate'])) {
			$dueDateForDb = null;
		} elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['dueDate'])) {
			$dueDateForDb = $data['dueDate'];
		} else {
			http_response_code(400);
			echo json_encode(['status' => 'error', 'message' => 'Invalid dueDate format. Please use YYYY-MM-DD.']);
			return;
		}
	}

	try {
		$pdo->beginTransaction();

		$stmt_find = $pdo->prepare("SELECT encrypted_data FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found or you do not have permission to edit it.']);
			return;
		}

		$currentData = json_decode($task['encrypted_data'], true);
		if (json_last_error() !== JSON_ERROR_NONE) {
			$currentData = [];
		}

		if ($notes !== null) {
			$currentData['notes'] = $notes;
		}
		$newDataJson = json_encode($currentData);

		$sql_parts = [];
		$params = [':taskId' => $taskId, ':userId' => $userId];

		if ($notes !== null) {
			$sql_parts[] = "encrypted_data = :newDataJson";
			$params[':newDataJson'] = $newDataJson;
		}

		if (array_key_exists('dueDate', $data)) {
			$sql_parts[] = "due_date = :dueDate";
			$params[':dueDate'] = $dueDateForDb;
		}
		
		if (!empty($sql_parts)) {
			$sql = "UPDATE tasks SET " . implode(', ', $sql_parts) . ", updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId";
			$stmt_update = $pdo->prepare($sql);
			$stmt_update->execute($params);
		}

		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success']);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_save_task_details(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while saving the task details.']);
	}
}


/**
 * Reorders tasks within a column and handles moving tasks between columns.
 */
function handle_reorder_tasks(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_id']) || !isset($data['tasks'])) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Column ID and tasks array are required.']);
		return;
	}

	$columnId = (int)$data['column_id'];
	$taskIds = $data['tasks'];

	if (!is_array($taskIds)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Tasks must be an array.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$stmt = $pdo->prepare(
			"UPDATE tasks 
			 SET position = :position, column_id = :columnId, updated_at = UTC_TIMESTAMP()
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
 * Fetches all columns, tasks, and user preferences.
 */
function handle_get_all_board_data(PDO $pdo, int $userId): void {
	try {
		$stmtPrefs = $pdo->prepare("SELECT preferences FROM users WHERE user_id = :userId");
		$stmtPrefs->execute([':userId' => $userId]);
		$prefsJson = $stmtPrefs->fetchColumn();
		$userPrefs = json_decode($prefsJson ?: '{}', true);

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
			"SELECT 
				t.task_id, t.column_id, t.encrypted_data, t.position, t.classification, 
				t.updated_at, t.due_date, COUNT(ta.attachment_id) as attachments_count
			 FROM 
				tasks t
			 LEFT JOIN 
				task_attachments ta ON t.task_id = ta.task_id
			 WHERE 
				t.user_id = :userId
			 GROUP BY 
				t.task_id
			 ORDER BY 
				t.position ASC"
		);

		$stmtTasks->execute([':userId' => $userId]);

		while ($task = $stmtTasks->fetch()) {
			$columnId = $task['column_id'];
			if (isset($columnMap[$columnId])) {
				$encryptedData = json_decode($task['encrypted_data'], true);
				$hasNotes = false;
				if (json_last_error() === JSON_ERROR_NONE && !empty($encryptedData['notes'])) {
					$hasNotes = true;
				}
				$task['has_notes'] = $hasNotes;

				$columnMap[$columnId]['tasks'][] = $task;
			}
		}

		http_response_code(200);
		echo json_encode([
			'status' => 'success', 
			'data' => [
				'board' => $boardData,
				'user_prefs' => $userPrefs
			]
		]);

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
			"INSERT INTO `columns` (user_id, column_name, position, created_at, updated_at) VALUES (:userId, :columnName, :position, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
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

		$encryptedData = json_encode(['title' => $taskTitle, 'notes' => '']);

		$stmt = $pdo->prepare(
			"INSERT INTO `tasks` (user_id, column_id, encrypted_data, position, created_at, updated_at) VALUES (:userId, :columnId, :encryptedData, :position, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
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
				'classification' => 'support',
				'due_date' => null,
				'has_notes' => false,
				'attachments_count' => 0
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
			"UPDATE tasks SET classification = :newClassification, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId"
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

/**
 * Cycles a task's classification through Signal, Support, and Noise.
 */
function handle_toggle_classification(PDO $pdo, int $userId, ?array $data): void {
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

		$newClassification = 'signal'; // Default
		switch ($currentClassification) {
			case 'signal':
				$newClassification = 'support';
				break;
			case 'support':
				$newClassification = 'noise';
				break;
			case 'noise':
				$newClassification = 'signal';
				break;
		}

		$stmtUpdate = $pdo->prepare(
			"UPDATE tasks SET classification = :newClassification, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId"
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
			error_log('Error in tasks.php handle_toggle_classification(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while updating the task classification.']);
	}
}

/**
 * Renames a column for the authenticated user.
 */
function handle_rename_column(PDO $pdo, int $userId, ?array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
	$newName = isset($data['new_name']) ? trim($data['new_name']) : '';

	if ($columnId <= 0 || $newName === '') {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Column ID and a non-empty new name are required.']);
		return;
	}

	try {
		$stmt = $pdo->prepare(
			"UPDATE `columns` SET column_name = :newName, updated_at = UTC_TIMESTAMP() WHERE column_id = :columnId AND user_id = :userId"
		);
		
		$stmt->execute([
			':newName' => $newName,
			':columnId' => $columnId,
			':userId' => $userId
		]);

		if ($stmt->rowCount() === 0) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Column not found or you do not have permission to edit it.']);
			return;
		}

		http_response_code(200);
		echo json_encode([
			'status' => 'success',
			'data' => [
				'column_id' => $columnId,
				'new_name' => $newName
			]
		]);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_rename_column(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while renaming the column.']);
	}
}

/**
 * Deletes a column and all its tasks for the authenticated user.
 */
function handle_delete_column(PDO $pdo, int $userId, ?array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;

	if ($columnId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid Column ID.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$stmt_delete_tasks = $pdo->prepare("DELETE FROM tasks WHERE column_id = :columnId AND user_id = :userId");
		$stmt_delete_tasks->execute([':columnId' => $columnId, ':userId' => $userId]);

		$stmt_delete_column = $pdo->prepare("DELETE FROM `columns` WHERE column_id = :columnId AND user_id = :userId");
		$stmt_delete_column->execute([':columnId' => $columnId, ':userId' => $userId]);

		if ($stmt_delete_column->rowCount() === 0) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Column not found or you do not have permission to delete it.']);
			return;
		}

		$stmt_get_columns = $pdo->prepare("SELECT column_id FROM `columns` WHERE user_id = :userId ORDER BY position ASC");
		$stmt_get_columns->execute([':userId' => $userId]);
		$remaining_columns = $stmt_get_columns->fetchAll(PDO::FETCH_COLUMN);
		
		$stmt_update_pos = $pdo->prepare("UPDATE `columns` SET position = :position, updated_at = UTC_TIMESTAMP() WHERE column_id = :columnId AND user_id = :userId");
		foreach ($remaining_columns as $index => $id) {
			$stmt_update_pos->execute([':position' => $index, ':columnId' => $id, ':userId' => $userId]);
		}

		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => ['deleted_column_id' => $columnId]]);

	} catch (Exception $e) {
		$pdo->rollBack();
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_delete_column(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while deleting the column.']);
	}
}

/**
 * Updates the positions of all columns based on a provided order.
 */
function handle_reorder_columns(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_ids']) || !is_array($data['column_ids'])) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'An ordered array of column_ids is required.']);
		return;
	}

	$columnIds = $data['column_ids'];

	try {
		$pdo->beginTransaction();

		$stmt = $pdo->prepare(
			"UPDATE `columns` SET position = :position, updated_at = UTC_TIMESTAMP() WHERE column_id = :columnId AND user_id = :userId"
		);

		foreach ($columnIds as $position => $columnId) {
			$stmt->execute([
				':position' => $position,
				':columnId' => (int)$columnId,
				':userId'   => $userId
			]);
		}

		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success']);

	} catch (Exception $e) {
		$pdo->rollBack();
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_reorder_columns(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while reordering columns.']);
	}
}

/**
 * Deletes a task and re-compacts the positions of remaining tasks in its column.
 */
function handle_delete_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;

	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid Task ID.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$stmt_find = $pdo->prepare("SELECT column_id FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found or you do not have permission to delete it.']);
			return;
		}
		$columnId = $task['column_id'];

		$stmt_delete = $pdo->prepare("DELETE FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt_delete->execute([':taskId' => $taskId, ':userId' => $userId]);

		$stmt_get_tasks = $pdo->prepare(
			"SELECT task_id FROM tasks WHERE column_id = :columnId AND user_id = :userId ORDER BY position ASC"
		);
		$stmt_get_tasks->execute([':columnId' => $columnId, ':userId' => $userId]);
		$remaining_tasks = $stmt_get_tasks->fetchAll(PDO::FETCH_COLUMN);

		$stmt_update_pos = $pdo->prepare("UPDATE tasks SET position = :position, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId");
		foreach ($remaining_tasks as $index => $id) {
			$stmt_update_pos->execute([':position' => $index, ':taskId' => $id, ':userId' => $userId]);
		}

		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => ['deleted_task_id' => $taskId]]);

	} catch (Exception $e) {
		$pdo->rollBack();
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_delete_task(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while deleting the task.']);
	}
}

/**
 * Renames a task's title by updating its encrypted_data JSON blob.
 */
function handle_rename_task_title(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$newTitle = isset($data['new_title']) ? trim($data['new_title']) : '';

	if ($taskId <= 0 || $newTitle === '') {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Task ID and a non-empty new title are required.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$stmt_find = $pdo->prepare("SELECT encrypted_data FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found or you do not have permission to edit it.']);
			return;
		}

		$currentData = json_decode($task['encrypted_data'], true);
		if (json_last_error() !== JSON_ERROR_NONE) {
			if (defined('DEVMODE') && DEVMODE) {
				error_log("Corrupted JSON found for task_id: {$taskId}. Data: " . $task['encrypted_data']);
			}
			$currentData = [];
		}

		$currentData['title'] = $newTitle;
		$newDataJson = json_encode($currentData);

		$stmt_update = $pdo->prepare(
			"UPDATE tasks SET encrypted_data = :newDataJson, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_update->execute([
			':newDataJson' => $newDataJson,
			':taskId' => $taskId,
			':userId' => $userId
		]);

		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success']);

	} catch (Exception $e) {
		$pdo->rollBack();
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_rename_task_title(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while renaming the task.']);
	}
}

/**
 * Duplicates a task, placing the copy at the bottom of the same column.
 */
function handle_duplicate_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;

	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid Task ID.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Step 1: Fetch the original task's data
		$stmt_find = $pdo->prepare(
			"SELECT column_id, encrypted_data, classification, due_date FROM tasks WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$originalTask = $stmt_find->fetch(PDO::FETCH_ASSOC);

		if ($originalTask === false) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task to duplicate not found or you do not have permission.']);
			return;
		}
		
		$columnId = $originalTask['column_id'];
		$encryptedData = $originalTask['encrypted_data'];
		$classification = $originalTask['classification'];
		$dueDate = $originalTask['due_date'];

		// Step 2: Determine the new position (at the end of the column)
		$stmt_pos = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE column_id = :columnId AND user_id = :userId");
		$stmt_pos->execute([':columnId' => $columnId, ':userId' => $userId]);
		$newPosition = (int)$stmt_pos->fetchColumn();

		// Step 3: Insert the new (duplicated) task
		$stmt_insert = $pdo->prepare(
			"INSERT INTO tasks (user_id, column_id, encrypted_data, position, classification, due_date, created_at, updated_at) 
			 VALUES (:userId, :columnId, :encryptedData, :position, :classification, :dueDate, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt_insert->execute([
			':userId' => $userId,
			':columnId' => $columnId,
			':encryptedData' => $encryptedData,
			':position' => $newPosition,
			':classification' => $classification,
			':dueDate' => $dueDate
		]);

		$newTaskId = (int)$pdo->lastInsertId();

		$pdo->commit();
		
		$encryptedDataDecoded = json_decode($encryptedData, true);
		$hasNotes = !empty($encryptedDataDecoded['notes']);

		// Step 4: Respond with the complete new task object
		http_response_code(201);
		echo json_encode([
			'status' => 'success',
			'data' => [
				'task_id' => $newTaskId,
				'column_id' => $columnId,
				'encrypted_data' => $encryptedData,
				'position' => $newPosition,
				'classification' => $classification,
				'due_date' => $dueDate,
				'has_notes' => $hasNotes,
				'attachments_count' => 0
			]
		]);

	} catch (Exception $e) {
		$pdo->rollBack();
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.php handle_duplicate_task(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while duplicating the task.']);
	}
}

/**
 * Handles the upload of a file attachment for a specific task.
 */
// Modified for Final Bug Fix
function handle_upload_attachment(PDO $pdo, int $userId, ?array $data): void {
	// 1. --- VALIDATION ---
	$taskId = isset($_POST['task_id']) ? (int)$_POST['task_id'] : 0;
	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'A valid Task ID is required.']);
		return;
	}

	if (empty($_FILES['attachment']) || $_FILES['attachment']['error'] !== UPLOAD_ERR_OK) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'File upload error or no file provided.']);
		return;
	}

	$file = $_FILES['attachment'];
	$fileSize = $file['size'];
	$fileMimeType = mime_content_type($file['tmp_name']);

	if ($fileSize > MAX_FILE_SIZE_BYTES) {
		http_response_code(413); // Payload Too Large
		echo json_encode(['status' => 'error', 'message' => 'File is too large. Max size is ' . (MAX_FILE_SIZE_BYTES / 1024 / 1024) . 'MB.']);
		return;
	}

	if (!in_array($fileMimeType, ALLOWED_MIME_TYPES)) {
		http_response_code(415); // Unsupported Media Type
		echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Allowed types are JPG, PNG, GIF, WebP.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		// 2. --- PERMISSIONS & QUOTA CHECK ---
		$stmt = $pdo->prepare("SELECT user_id FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		if ($stmt->fetch() === false) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found or permission denied.']);
			return;
		}

		$stmt = $pdo->prepare("SELECT storage_used_bytes FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $userId]);
		$storageUsed = (int)$stmt->fetchColumn();

		// 3. --- PRUNING LOGIC ---
		if (($storageUsed + $fileSize) > USER_STORAGE_QUOTA_BYTES) {
			$stmt = $pdo->prepare(
				"SELECT attachment_id, filename_on_server, filesize_bytes FROM task_attachments 
				 WHERE user_id = :userId ORDER BY created_at ASC LIMIT 1"
			);
			$stmt->execute([':userId' => $userId]);
			$oldestAttachment = $stmt->fetch(PDO::FETCH_ASSOC);

			if ($oldestAttachment) {
				$oldFilePath = ATTACHMENT_UPLOAD_DIR . $oldestAttachment['filename_on_server'];
				if (file_exists($oldFilePath)) {
					unlink($oldFilePath);
				}
				$stmt = $pdo->prepare("DELETE FROM task_attachments WHERE attachment_id = :id");
				$stmt->execute([':id' => $oldestAttachment['attachment_id']]);
				
				$storageUsed -= (int)$oldestAttachment['filesize_bytes'];
			}
		}

		// 4. --- FILE PROCESSING ---
		$originalFilename = basename($file['name']);
		$fileExtension = pathinfo($originalFilename, PATHINFO_EXTENSION);
		$newFilename = "user{$userId}_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $fileExtension;
		$destinationPath = ATTACHMENT_UPLOAD_DIR . $newFilename;

		if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
			$pdo->rollBack();
			throw new Exception("Failed to move uploaded file.");
		}

		// 5. --- DATABASE UPDATES ---
		$stmt = $pdo->prepare(
			"INSERT INTO task_attachments (task_id, user_id, filename_on_server, original_filename, filesize_bytes, mime_type, created_at)
			 VALUES (:taskId, :userId, :filename_on_server, :original_filename, :filesize_bytes, :mime_type, UTC_TIMESTAMP())"
		);
		$stmt->execute([
			':taskId' => $taskId,
			':userId' => $userId,
			':filename_on_server' => $newFilename,
			':original_filename' => $originalFilename,
			':filesize_bytes' => $fileSize,
			':mime_type' => $fileMimeType
		]);
		$newAttachmentId = (int)$pdo->lastInsertId();

		$newStorageUsed = $storageUsed + $fileSize;
		$stmt = $pdo->prepare("UPDATE users SET storage_used_bytes = :storage WHERE user_id = :userId");
		$stmt->execute([':storage' => $newStorageUsed, ':userId' => $userId]);

		$pdo->commit();

		// 6. --- RESPOND ---
		http_response_code(201);
		echo json_encode([
			'status' => 'success',
			'data' => [
				'attachment_id' => $newAttachmentId,
				'task_id' => $taskId,
				'filename_on_server' => $newFilename,
				'original_filename' => $originalFilename,
				'filesize_bytes' => $fileSize,
				'user_storage_used' => $newStorageUsed,
				'user_storage_quota' => USER_STORAGE_QUOTA_BYTES
			]
		]);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in handle_upload_attachment: ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'An internal server error occurred during file upload.']);
	}
}

/**
 * Fetches all attachments for a specific task.
 */
function handle_get_attachments(PDO $pdo, int $userId): void {
	$taskId = isset($_GET['task_id']) ? (int)$_GET['task_id'] : 0;

	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'A valid Task ID is required.']);
		return;
	}

	try {
		// Security Check: Ensure the user owns the task they are requesting attachments for.
		$stmt = $pdo->prepare("SELECT user_id FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		if ($stmt->fetch() === false) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found or permission denied.']);
			return;
		}

		// Fetch the attachments
		$stmt = $pdo->prepare(
			"SELECT attachment_id, task_id, filename_on_server, original_filename, filesize_bytes, created_at 
			 FROM task_attachments 
			 WHERE task_id = :taskId AND user_id = :userId 
			 ORDER BY created_at DESC"
		);
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		$attachments = $stmt->fetchAll(PDO::FETCH_ASSOC);

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => $attachments]);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in handle_get_attachments: ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'An internal server error occurred while fetching attachments.']);
	}
}