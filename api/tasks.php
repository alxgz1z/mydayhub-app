<?php
/**
 * Code for /api/tasks.php
 *
 * MyDayHub - Tasks Module Handler
 *
 * Contains all business logic for task-related API actions.
 * This file is included and called by the main API gateway.
 *
 * @version 6.6.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

// Modified for Debugging Hardening: Include the global helpers file.
// Note: While the gateway includes this, including it here makes the module self-contained and runnable in isolation for testing.
require_once __DIR__ . '/../incs/helpers.php';


// Define constants for the attachment feature
define('ATTACHMENT_UPLOAD_DIR', __DIR__ . '/../media/imgs/');
define('MAX_FILE_SIZE_BYTES', 5 * 1024 * 1024); // 5 MB
define('USER_STORAGE_QUOTA_BYTES', 50 * 1024 * 1024); // 50 MB
// Modified for PDF Support
define('ALLOWED_MIME_TYPES', [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'application/pdf'
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
		
		// Modified for Soft Deletes
		case 'restoreItem':
			if ($method === 'POST') {
				handle_restore_item($pdo, $userId, $data);
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
		
		// Modified for Mobile Move Mode
		case 'moveTask':
			if ($method === 'POST') {
				handle_move_task($pdo, $userId, $data);
			}
			break;

		// Modified for Classification Popover
		case 'toggleClassification':
			if ($method === 'POST') {
				handle_toggle_classification($pdo, $userId, $data);
			}
			break;

		// Modified for Privacy Feature
		case 'togglePrivacy':
			if ($method === 'POST') {
				handle_toggle_privacy($pdo, $userId, $data);
			}
			break;

		case 'uploadAttachment':
			if ($method === 'POST') {
				handle_upload_attachment($pdo, $userId, $data);
			}
			break;
		case 'deleteAttachment':
			if ($method === 'POST') {
				handle_delete_attachment($pdo, $userId, $data);
			}
			break;
		// Modified for Snooze Feature
		case 'snoozeTask':
			if ($method === 'POST') {
				handle_snooze_task($pdo, $userId, $data);
			}
			break;
		
		case 'unsnoozeTask':
			if ($method === 'POST') {
				handle_unsnooze_task($pdo, $userId, $data);
			}
			break;
		default:
			send_json_response(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."], 404);
			break;
	}
}

// Modified for Snooze Feature
/**
 * Snoozes a task with specified duration or custom date, auto-classifies to backlog.
 */
function handle_snooze_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$durationType = $data['duration_type'] ?? null;
	$customDate = $data['custom_date'] ?? null;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid task_id is required.'], 400);
		return;
	}

	if (empty($durationType) || !in_array($durationType, ['1week', '1month', '1quarter', 'custom'])) {
		send_json_response(['status' => 'error', 'message' => 'Valid duration_type is required (1week, 1month, 1quarter, custom).'], 400);
		return;
	}

	if ($durationType === 'custom' && empty($customDate)) {
		send_json_response(['status' => 'error', 'message' => 'custom_date is required when duration_type is custom.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Verify task ownership
		$stmt = $pdo->prepare("SELECT classification FROM tasks WHERE task_id = :taskId AND user_id = :userId AND deleted_at IS NULL");
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt->fetch();

		if ($task === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		// Calculate wake time (9 AM user local time, stored as UTC)
		$wakeTimeUtc = null;
		if ($durationType === 'custom') {
			// For custom date, validate format and set to 9 AM UTC on that date
			if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $customDate)) {
				$pdo->rollBack();
				send_json_response(['status' => 'error', 'message' => 'Invalid custom_date format. Use YYYY-MM-DD.'], 400);
				return;
			}
			// Set wake time to 9 AM UTC on the specified date
			$wakeTimeUtc = $customDate . ' 09:00:00';
		} else {
			// Calculate preset durations from current UTC time
			$now = new DateTime('now', new DateTimeZone('UTC'));
			
			switch ($durationType) {
				case '1week':
					$now->add(new DateInterval('P7D'));
					break;
				case '1month':
					$now->add(new DateInterval('P1M'));
					break;
				case '1quarter':
					$now->add(new DateInterval('P3M'));
					break;
			}
			
			// Set to 9 AM on the calculated day
			$now->setTime(9, 0, 0);
			$wakeTimeUtc = $now->format('Y-m-d H:i:s');
		}

		// Update task: snooze it and set classification to backlog
		$stmt = $pdo->prepare(
			"UPDATE tasks 
			 SET snoozed_until = :wakeTime, snoozed_at = UTC_TIMESTAMP(), 
				 classification = 'backlog', updated_at = UTC_TIMESTAMP()
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt->execute([
			':wakeTime' => $wakeTimeUtc,
			':taskId' => $taskId,
			':userId' => $userId
		]);

		$pdo->commit();

		send_json_response([
			'status' => 'success',
			'data' => [
				'task_id' => $taskId,
				'snoozed_until' => $wakeTimeUtc,
				'classification' => 'backlog'
			]
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_snooze_task: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while snoozing the task.'], 500);
	}
}


// Modified for Snooze Feature
/**
 * Manually unsnoozes a task (wakes it up early).
 */
function handle_unsnooze_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid task_id is required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Verify task ownership and that it's currently snoozed
		$stmt = $pdo->prepare(
			"SELECT snoozed_until FROM tasks 
			 WHERE task_id = :taskId AND user_id = :userId AND deleted_at IS NULL 
			 AND snoozed_until IS NOT NULL"
		);
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt->fetch();

		if ($task === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found, permission denied, or task is not snoozed.'], 404);
			return;
		}

		// Clear snooze fields
		$stmt = $pdo->prepare(
			"UPDATE tasks 
			 SET snoozed_until = NULL, snoozed_at = NULL, updated_at = UTC_TIMESTAMP()
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);

		$pdo->commit();

		send_json_response([
			'status' => 'success',
			'data' => ['task_id' => $taskId]
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_unsnooze_task: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while unsnoozing the task.'], 500);
	}
}

// Modified for Mobile Move Mode
/**
 * Moves a task to a new column and updates task positions in both columns.
 */
function handle_move_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$toColumnId = isset($data['to_column_id']) ? (int)$data['to_column_id'] : 0;

	if ($taskId <= 0 || $toColumnId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid task_id and to_column_id are required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		// 1. Get the task's current column_id
		$stmt_find = $pdo->prepare("SELECT column_id FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			throw new Exception('Task not found or permission denied.');
		}
		$fromColumnId = $task['column_id'];

		// If moving to the same column, do nothing.
		if ($fromColumnId == $toColumnId) {
			$pdo->commit();
			send_json_response(['status' => 'success', 'message' => 'Task already in the destination column.'], 200);
			return;
		}

		// 2. Determine the new position for the task (at the end of the destination column)
		$stmt_pos = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE column_id = :toColumnId AND user_id = :userId AND deleted_at IS NULL");
		$stmt_pos->execute([':toColumnId' => $toColumnId, ':userId' => $userId]);
		$newPosition = (int)$stmt_pos->fetchColumn();

		// 3. Update the task to move it
		$stmt_move = $pdo->prepare(
			"UPDATE tasks SET column_id = :toColumnId, position = :newPosition, updated_at = UTC_TIMESTAMP() 
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_move->execute([
			':toColumnId' => $toColumnId,
			':newPosition' => $newPosition,
			':taskId' => $taskId,
			':userId' => $userId
		]);

		// 4. Re-compact the positions in the source column
		$stmt_get_source_tasks = $pdo->prepare(
			"SELECT task_id FROM tasks WHERE column_id = :fromColumnId AND user_id = :userId AND deleted_at IS NULL ORDER BY position ASC"
		);
		$stmt_get_source_tasks->execute([':fromColumnId' => $fromColumnId, ':userId' => $userId]);
		$source_tasks = $stmt_get_source_tasks->fetchAll(PDO::FETCH_COLUMN);
		
		$stmt_update_source_pos = $pdo->prepare("UPDATE tasks SET position = :position, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId");
		foreach ($source_tasks as $index => $id) {
			$stmt_update_source_pos->execute([':position' => $index, ':taskId' => $id, ':userId' => $userId]);
		}
		
		$pdo->commit();

		send_json_response(['status' => 'success'], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_move_task: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => $e->getMessage() ?: 'A server error occurred while moving the task.'], 500);
	}
}


// Modified for Soft Deletes
/**
 * Restores a soft-deleted item (task or column) by setting its deleted_at to NULL.
 */
function handle_restore_item(PDO $pdo, int $userId, ?array $data): void {
	$type = $data['type'] ?? null;
	$id = isset($data['id']) ? (int)$data['id'] : 0;

	if (empty($type) || !in_array($type, ['task', 'column']) || $id <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid type (task/column) and ID are required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		if ($type === 'task') {
			$stmtFind = $pdo->prepare("SELECT column_id FROM tasks WHERE task_id = :id AND user_id = :userId");
			$stmtFind->execute([':id' => $id, ':userId' => $userId]);
			$task = $stmtFind->fetch();
			if (!$task) { throw new Exception(ucfirst($type) . ' not found or permission denied.'); }
			$columnId = $task['column_id'];

			$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL");
			$stmtPos->execute([':columnId' => $columnId, ':userId' => $userId]);
			$newPosition = (int)$stmtPos->fetchColumn();
			
			$stmtRestore = $pdo->prepare(
				"UPDATE tasks SET deleted_at = NULL, position = :pos, updated_at = UTC_TIMESTAMP() WHERE task_id = :id AND user_id = :userId"
			);
			$stmtRestore->execute([':pos' => $newPosition, ':id' => $id, ':userId' => $userId]);
			
		} else { // type is 'column'
			$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL");
			$stmtPos->execute([':userId' => $userId]);
			$newPosition = (int)$stmtPos->fetchColumn();

			$stmtRestore = $pdo->prepare(
				"UPDATE `columns` SET deleted_at = NULL, position = :pos, updated_at = UTC_TIMESTAMP() WHERE column_id = :id AND user_id = :userId"
			);
			$stmtRestore->execute([':pos' => $newPosition, ':id' => $id, ':userId' => $userId]);

			$stmtRestoreTasks = $pdo->prepare(
				"UPDATE tasks SET deleted_at = NULL, updated_at = UTC_TIMESTAMP() WHERE column_id = :id AND user_id = :userId"
			);
			$stmtRestoreTasks->execute([':id' => $id, ':userId' => $userId]);
		}
		
		if ($stmtRestore->rowCount() === 0) {
			throw new Exception(ucfirst($type) . ' not found or permission denied.');
		}

		if ($type === 'task') {
			$stmtSelect = $pdo->prepare("SELECT * FROM tasks WHERE task_id = :id");
			$stmtSelect->execute([':id' => $id]);
			$restoredItem = $stmtSelect->fetch(PDO::FETCH_ASSOC);
		} else { // 'column'
			$stmtSelectCol = $pdo->prepare("SELECT * FROM `columns` WHERE column_id = :id");
			$stmtSelectCol->execute([':id' => $id]);
			$restoredItem = $stmtSelectCol->fetch(PDO::FETCH_ASSOC);
			
			$stmtSelectTasks = $pdo->prepare("SELECT * FROM tasks WHERE column_id = :id AND deleted_at IS NULL ORDER BY position ASC");
			$stmtSelectTasks->execute([':id' => $id]);
			$restoredItem['tasks'] = $stmtSelectTasks->fetchAll(PDO::FETCH_ASSOC);
		}

		$pdo->commit();

		send_json_response([
			'status' => 'success',
			'message' => ucfirst($type) . ' restored successfully.',
			'data' => $restoredItem
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_restore_item: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => $e->getMessage() ?: 'A server error occurred while restoring the item.'], 500);
	}
}

// Modified for Privacy Feature
/**
 * Toggles the 'is_private' flag for a given task or column.
 */
function handle_toggle_privacy(PDO $pdo, int $userId, ?array $data): void {
	$type = $data['type'] ?? null;
	$id = isset($data['id']) ? (int)$data['id'] : 0;

	if (empty($type) || !in_array($type, ['task', 'column']) || $id <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid type (task/column) and ID are required.'], 400);
		return;
	}

	$table = ($type === 'task') ? 'tasks' : 'columns';
	$idColumn = ($type === 'task') ? 'task_id' : 'column_id';

	try {
		$pdo->beginTransaction();

		$updateSql = "UPDATE `{$table}` SET is_private = NOT is_private, updated_at = UTC_TIMESTAMP() WHERE {$idColumn} = :id AND user_id = :userId";
		$stmtUpdate = $pdo->prepare($updateSql);
		$stmtUpdate->execute([':id' => $id, ':userId' => $userId]);

		if ($stmtUpdate->rowCount() === 0) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => ucfirst($type) . ' not found or permission denied.'], 404);
			return;
		}

		$selectSql = "SELECT is_private FROM `{$table}` WHERE {$idColumn} = :id";
		$stmtSelect = $pdo->prepare($selectSql);
		$stmtSelect->execute([':id' => $id]);
		$newPrivateState = (bool)$stmtSelect->fetchColumn();

		$pdo->commit();

		send_json_response([
			'status' => 'success',
			'data' => [
				'type' => $type,
				'id' => $id,
				'is_private' => $newPrivateState
			]
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_toggle_privacy: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while updating privacy status.'], 500);
	}
}


/**
 * Saves details (notes and/or due date) to a task.
 */
function handle_save_task_details(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$notes = $data['notes'] ?? null;

	if ($taskId <= 0 || ($notes === null && !array_key_exists('dueDate', $data))) {
		send_json_response(['status' => 'error', 'message' => 'Task ID and at least one field to update (notes or dueDate) are required.'], 400);
		return;
	}

	$dueDateForDb = null;
	if (array_key_exists('dueDate', $data)) {
		if (empty($data['dueDate'])) {
			$dueDateForDb = null;
		} elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['dueDate'])) {
			$dueDateForDb = $data['dueDate'];
		} else {
			send_json_response(['status' => 'error', 'message' => 'Invalid dueDate format. Please use YYYY-MM-DD.'], 400);
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
			send_json_response(['status' => 'error', 'message' => 'Task not found or you do not have permission to edit it.'], 404);
			return;
		}

		$currentData = json_decode($task['encrypted_data'], true) ?: [];


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

		send_json_response(['status' => 'success'], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message('Error in tasks.php handle_save_task_details(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while saving the task details.'], 500);
	}
}


/**
 * Reorders tasks within a column and handles moving tasks between columns.
 */
function handle_reorder_tasks(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_id']) || !isset($data['tasks'])) {
		send_json_response(['status' => 'error', 'message' => 'Column ID and tasks array are required.'], 400);
		return;
	}

	$columnId = (int)$data['column_id'];
	$taskIds = $data['tasks'];

	if (!is_array($taskIds)) {
		send_json_response(['status' => 'error', 'message' => 'Tasks must be an array.'], 400);
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
		send_json_response(['status' => 'success'], 200);
	} catch (Exception $e) {
		$pdo->rollBack();
		log_debug_message('Error in tasks.php handle_reorder_tasks(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while reordering tasks.'], 500);
	}
}


/**
 * Fetches all columns, tasks, and user preferences.
 */
function handle_get_all_board_data(PDO $pdo, int $userId): void {
	try {
		$stmtUser = $pdo->prepare("SELECT preferences, storage_used_bytes FROM users WHERE user_id = :userId");
		$stmtUser->execute([':userId' => $userId]);
		$userData = $stmtUser->fetch(PDO::FETCH_ASSOC);
		$userPrefs = json_decode($userData['preferences'] ?? '{}', true);
		$storageUsed = (int)($userData['storage_used_bytes'] ?? 0);

		// Modified for Snooze Feature: Check for awakened tasks
		$stmtAwakened = $pdo->prepare(
			"SELECT COUNT(*) FROM tasks 
			 WHERE user_id = :userId AND deleted_at IS NULL 
			 AND snoozed_until IS NOT NULL AND snoozed_until <= UTC_TIMESTAMP()"
		);
		$stmtAwakened->execute([':userId' => $userId]);
		$awakenedCount = (int)$stmtAwakened->fetchColumn();
		$hasAwakenedTasks = $awakenedCount > 0;
		
		// If there are awakened tasks, clear their snooze status automatically
		if ($hasAwakenedTasks) {
			$stmtClearAwakened = $pdo->prepare(
				"UPDATE tasks 
				 SET snoozed_until = NULL, snoozed_at = NULL, updated_at = UTC_TIMESTAMP()
				 WHERE user_id = :userId AND deleted_at IS NULL 
				 AND snoozed_until IS NOT NULL AND snoozed_until <= UTC_TIMESTAMP()"
			);
			$stmtClearAwakened->execute([':userId' => $userId]);
		}

		$stmtColumns = $pdo->prepare(
			"SELECT column_id, column_name, position, is_private 
			 FROM `columns` 
			 WHERE user_id = :userId AND deleted_at IS NULL 
			 ORDER BY position ASC"
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
				t.task_id, t.column_id, t.encrypted_data, t.position, t.classification, t.is_private,
				t.updated_at, t.due_date, t.snoozed_until, t.snoozed_at, 
				COUNT(ta.attachment_id) as attachments_count
			 FROM tasks t
			 LEFT JOIN task_attachments ta ON t.task_id = ta.task_id
			 WHERE t.user_id = :userId AND t.deleted_at IS NULL
			 GROUP BY t.task_id
			 ORDER BY t.position ASC"
		);
		$stmtTasks->execute([':userId' => $userId]);

		while ($task = $stmtTasks->fetch()) {
			if (isset($columnMap[$task['column_id']])) {
				$encryptedData = json_decode($task['encrypted_data'], true);
				$task['has_notes'] = !empty($encryptedData['notes']);
				// Modified for Snooze Feature: Add snooze status indicator
				$task['is_snoozed'] = !empty($task['snoozed_until']);
				$columnMap[$task['column_id']]['tasks'][] = $task;
			}
		}

		send_json_response([
			'status' => 'success', 
			'data' => [
				'board' => $boardData,
				'user_prefs' => $userPrefs,
				'user_storage' => ['used' => $storageUsed, 'quota' => USER_STORAGE_QUOTA_BYTES],
				// Modified for Snooze Feature: Include wake notification flag
				'wake_notification' => $hasAwakenedTasks
			]
		], 200);

	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_get_all_board_data(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while fetching board data.'], 500);
	}
}

/**
 * Creates a new column for the authenticated user.
 */
function handle_create_column(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_name'])) {
		send_json_response(['status' => 'error', 'message' => 'Column name is required.'], 400);
		return;
	}
	$columnName = trim($data['column_name']);

	try {
		$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL");
		$stmtPos->execute([':userId' => $userId]);
		$position = (int)$stmtPos->fetchColumn();

		$stmt = $pdo->prepare(
			"INSERT INTO `columns` (user_id, column_name, position, created_at, updated_at) VALUES (:userId, :columnName, :position, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt->execute([':userId' => $userId, ':columnName' => $columnName, ':position' => $position]);
		$newColumnId = (int)$pdo->lastInsertId();

		send_json_response([
			'status' => 'success',
			'data' => [
				'column_id' => $newColumnId,
				'column_name' => $columnName,
				'position' => $position,
				'is_private' => false,
				'tasks' => []
			]
		], 201);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_create_column(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while creating the column.'], 500);
	}
}

/**
 * Creates a new task in a specified column for the authenticated user.
 */
function handle_create_task(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_id']) || empty($data['task_title'])) {
		send_json_response(['status' => 'error', 'message' => 'Column ID and task title are required.'], 400);
		return;
	}
	$columnId = (int)$data['column_id'];
	$taskTitle = trim($data['task_title']);

	try {
		$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM `tasks` WHERE user_id = :userId AND column_id = :columnId AND deleted_at IS NULL");
		$stmtPos->execute([':userId' => $userId, ':columnId' => $columnId]);
		$position = (int)$stmtPos->fetchColumn();
		$encryptedData = json_encode(['title' => $taskTitle, 'notes' => '']);
		$stmt = $pdo->prepare(
			"INSERT INTO `tasks` (user_id, column_id, encrypted_data, position, created_at, updated_at) VALUES (:userId, :columnId, :encryptedData, :position, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt->execute([':userId' => $userId, ':columnId' => $columnId, ':encryptedData' => $encryptedData, ':position' => $position]);
		$newTaskId = (int)$pdo->lastInsertId();

		send_json_response([
			'status' => 'success',
			'data' => [
				'task_id' => $newTaskId, 'column_id' => $columnId, 'encrypted_data' => $encryptedData,
				'position' => $position, 'classification' => 'support', 'is_private' => false,
				'due_date' => null, 'has_notes' => false, 'attachments_count' => 0,
				// Modified for Snooze Feature: Add snooze fields
				'snoozed_until' => null, 'snoozed_at' => null, 'is_snoozed' => false
			]
		], 201);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_create_task(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while creating the task.'], 500);
	}
}

/**
 * Toggles a task's classification between its current state and 'completed'.
 */
function handle_toggle_complete(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['task_id'])) {
		send_json_response(['status' => 'error', 'message' => 'Task ID is required.'], 400);
		return;
	}
	$taskId = (int)$data['task_id'];

	try {
		$stmtGet = $pdo->prepare("SELECT classification FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmtGet->execute([':taskId' => $taskId, ':userId' => $userId]);
		$currentClassification = $stmtGet->fetchColumn();

		if ($currentClassification === false) {
			send_json_response(['status' => 'error', 'message' => 'Task not found.'], 404);
			return;
		}

		$newClassification = ($currentClassification === 'completed') ? 'support' : 'completed';
		$stmtUpdate = $pdo->prepare(
			"UPDATE tasks SET classification = :newClassification, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmtUpdate->execute([':newClassification' => $newClassification, ':taskId' => $taskId, ':userId' => $userId]);
		send_json_response(['status' => 'success', 'data' => ['new_classification' => $newClassification]], 200);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_toggle_complete(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while updating the task.'], 500);
	}
}

/**
 * Sets a task's classification to a specific value (Signal, Support, or Backlog).
 */
function handle_toggle_classification(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$newClassification = $data['classification'] ?? null;

	if ($taskId <= 0 || empty($newClassification) || !in_array($newClassification, ['signal', 'support', 'backlog'])) {
		send_json_response(['status' => 'error', 'message' => 'Task ID and a valid classification are required.'], 400);
		return;
	}

	try {
		$stmtUpdate = $pdo->prepare(
			"UPDATE tasks 
			 SET classification = :newClassification, updated_at = UTC_TIMESTAMP() 
			 WHERE task_id = :taskId AND user_id = :userId AND classification != 'completed'"
		);
		$stmtUpdate->execute([':newClassification' => $newClassification, ':taskId' => $taskId, ':userId' => $userId]);

		if ($stmtUpdate->rowCount() === 0) {
			send_json_response(['status' => 'error', 'message' => 'Task not found, permission denied, or task is already completed.'], 404);
			return;
		}
		send_json_response(['status' => 'success', 'data' => ['new_classification' => $newClassification]], 200);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_toggle_classification(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Renames a column for the authenticated user.
 */
function handle_rename_column(PDO $pdo, int $userId, ?array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
	$newName = isset($data['new_name']) ? trim($data['new_name']) : '';

	if ($columnId <= 0 || $newName === '') {
		send_json_response(['status' => 'error', 'message' => 'Column ID and a non-empty new name are required.'], 400);
		return;
	}

	try {
		$stmt = $pdo->prepare(
			"UPDATE `columns` SET column_name = :newName, updated_at = UTC_TIMESTAMP() WHERE column_id = :columnId AND user_id = :userId"
		);
		$stmt->execute([':newName' => $newName, ':columnId' => $columnId, ':userId' => $userId]);

		if ($stmt->rowCount() === 0) {
			send_json_response(['status' => 'error', 'message' => 'Column not found or permission denied.'], 404);
			return;
		}
		send_json_response(['status' => 'success', 'data' => ['column_id' => $columnId, 'new_name' => $newName]], 200);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_rename_column(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Soft-deletes a column and all its tasks for the authenticated user.
 */
function handle_delete_column(PDO $pdo, int $userId, ?array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;

	if ($columnId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Invalid Column ID.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt_delete_tasks = $pdo->prepare(
			"UPDATE tasks SET deleted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() 
			 WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL"
		);
		$stmt_delete_tasks->execute([':columnId' => $columnId, ':userId' => $userId]);
		$stmt_delete_column = $pdo->prepare(
			"UPDATE `columns` SET deleted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
			 WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL"
		);
		$stmt_delete_column->execute([':columnId' => $columnId, ':userId' => $userId]);

		if ($stmt_delete_column->rowCount() === 0) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Column not found or permission denied.'], 404);
			return;
		}

		$stmt_get_columns = $pdo->prepare(
			"SELECT column_id FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL ORDER BY position ASC"
		);
		$stmt_get_columns->execute([':userId' => $userId]);
		$remaining_columns = $stmt_get_columns->fetchAll(PDO::FETCH_COLUMN);
		
		$stmt_update_pos = $pdo->prepare("UPDATE `columns` SET position = :position, updated_at = UTC_TIMESTAMP() WHERE column_id = :columnId AND user_id = :userId");
		foreach ($remaining_columns as $index => $id) {
			$stmt_update_pos->execute([':position' => $index, ':columnId' => $id, ':userId' => $userId]);
		}

		$pdo->commit();
		send_json_response(['status' => 'success', 'data' => ['deleted_column_id' => $columnId]], 200);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		log_debug_message('Error in tasks.php handle_delete_column(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}


/**
 * Updates the positions of all columns based on a provided order.
 */
function handle_reorder_columns(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_ids']) || !is_array($data['column_ids'])) {
		send_json_response(['status' => 'error', 'message' => 'An ordered array of column_ids is required.'], 400);
		return;
	}
	$columnIds = $data['column_ids'];

	try {
		$pdo->beginTransaction();
		$stmt = $pdo->prepare(
			"UPDATE `columns` SET position = :position, updated_at = UTC_TIMESTAMP() WHERE column_id = :columnId AND user_id = :userId"
		);
		foreach ($columnIds as $position => $columnId) {
			$stmt->execute([':position' => $position, ':columnId' => (int)$columnId, ':userId' => $userId]);
		}
		$pdo->commit();
		send_json_response(['status' => 'success'], 200);
	} catch (Exception $e) {
		$pdo->rollBack();
		log_debug_message('Error in tasks.php handle_reorder_columns(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Soft-deletes a task and re-compacts the positions of remaining tasks in its column.
 */
function handle_delete_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Invalid Task ID.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt_find = $pdo->prepare("SELECT column_id FROM tasks WHERE task_id = :taskId AND user_id = :userId AND deleted_at IS NULL");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}
		$columnId = $task['column_id'];

		$stmt_delete = $pdo->prepare(
			"UPDATE tasks SET deleted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() 
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_delete->execute([':taskId' => $taskId, ':userId' => $userId]);

		$stmt_get_tasks = $pdo->prepare(
			"SELECT task_id FROM tasks WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL ORDER BY position ASC"
		);
		$stmt_get_tasks->execute([':columnId' => $columnId, ':userId' => $userId]);
		$remaining_tasks = $stmt_get_tasks->fetchAll(PDO::FETCH_COLUMN);

		$stmt_update_pos = $pdo->prepare("UPDATE tasks SET position = :position, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId");
		foreach ($remaining_tasks as $index => $id) {
			$stmt_update_pos->execute([':position' => $index, ':taskId' => $id, ':userId' => $userId]);
		}

		$pdo->commit();
		send_json_response(['status' => 'success', 'data' => ['deleted_task_id' => $taskId]], 200);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		log_debug_message('Error in tasks.php handle_delete_task(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}


/**
 * Renames a task's title by updating its encrypted_data JSON blob.
 */
function handle_rename_task_title(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$newTitle = isset($data['new_title']) ? trim($data['new_title']) : '';

	if ($taskId <= 0 || $newTitle === '') {
		send_json_response(['status' => 'error', 'message' => 'Task ID and a non-empty new title are required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt_find = $pdo->prepare("SELECT encrypted_data FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		$currentData = json_decode($task['encrypted_data'], true) ?: [];
		$currentData['title'] = $newTitle;
		$newDataJson = json_encode($currentData);
		$stmt_update = $pdo->prepare(
			"UPDATE tasks SET encrypted_data = :newDataJson, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_update->execute([':newDataJson' => $newDataJson, ':taskId' => $taskId, ':userId' => $userId]);
		$pdo->commit();
		send_json_response(['status' => 'success'], 200);
	} catch (Exception $e) {
		$pdo->rollBack();
		log_debug_message('Error in tasks.php handle_rename_task_title(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Duplicates a task, placing the copy at the bottom of the same column.
 */
function handle_duplicate_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Invalid Task ID.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt_find = $pdo->prepare(
			"SELECT column_id, encrypted_data, classification, due_date FROM tasks WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$originalTask = $stmt_find->fetch(PDO::FETCH_ASSOC);

		if ($originalTask === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task to duplicate not found or permission denied.'], 404);
			return;
		}
		
		$columnId = $originalTask['column_id'];
		$stmt_pos = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL");
		$stmt_pos->execute([':columnId' => $columnId, ':userId' => $userId]);
		$newPosition = (int)$stmt_pos->fetchColumn();

		$stmt_insert = $pdo->prepare(
			"INSERT INTO tasks (user_id, column_id, encrypted_data, position, classification, due_date, created_at, updated_at) 
			 VALUES (:userId, :columnId, :encryptedData, :position, :classification, :dueDate, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt_insert->execute([
			':userId' => $userId, ':columnId' => $columnId, ':encryptedData' => $originalTask['encrypted_data'],
			':position' => $newPosition, ':classification' => $originalTask['classification'], ':dueDate' => $originalTask['due_date']
		]);
		$newTaskId = (int)$pdo->lastInsertId();
		$pdo->commit();
		
		$encryptedDataDecoded = json_decode($originalTask['encrypted_data'], true);
		
		send_json_response([
			'status' => 'success',
			'data' => [
				'task_id' => $newTaskId, 'column_id' => $columnId, 'encrypted_data' => $originalTask['encrypted_data'],
				'position' => $newPosition, 'classification' => $originalTask['classification'], 'due_date' => $originalTask['due_date'],
				'has_notes' => !empty($encryptedDataDecoded['notes']), 'attachments_count' => 0, 'is_private' => false,
				// Modified for Snooze Feature: Duplicated tasks are not snoozed
				'snoozed_until' => null, 'snoozed_at' => null, 'is_snoozed' => false
			]
		], 201);
	} catch (Exception $e) {
		$pdo->rollBack();
		log_debug_message('Error in tasks.php handle_duplicate_task(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Handles the upload of a file attachment for a specific task.
 */
function handle_upload_attachment(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($_POST['task_id']) ? (int)$_POST['task_id'] : 0;
	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid Task ID is required.'], 400);
		return;
	}
	if (empty($_FILES['attachment']) || $_FILES['attachment']['error'] !== UPLOAD_ERR_OK) {
		send_json_response(['status' => 'error', 'message' => 'File upload error or no file provided.'], 400);
		return;
	}
	$file = $_FILES['attachment'];
	if ($file['size'] > MAX_FILE_SIZE_BYTES) {
		send_json_response(['status' => 'error', 'message' => 'File is too large.'], 413);
		return;
	}
	$fileMimeType = mime_content_type($file['tmp_name']);
	if (!in_array($fileMimeType, ALLOWED_MIME_TYPES)) {
		send_json_response(['status' => 'error', 'message' => 'Invalid file type.'], 415);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt = $pdo->prepare("SELECT user_id FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		if ($stmt->fetch() === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		$stmt = $pdo->prepare("SELECT storage_used_bytes FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $userId]);
		$storageUsed = (int)$stmt->fetchColumn();

		if (($storageUsed + $file['size']) > USER_STORAGE_QUOTA_BYTES) {
			$stmt = $pdo->prepare("SELECT attachment_id, filename_on_server, filesize_bytes FROM task_attachments WHERE user_id = :userId ORDER BY created_at ASC LIMIT 1");
			$stmt->execute([':userId' => $userId]);
			$oldest = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($oldest) {
				if (file_exists(ATTACHMENT_UPLOAD_DIR . $oldest['filename_on_server'])) {
					unlink(ATTACHMENT_UPLOAD_DIR . $oldest['filename_on_server']);
				}
				$stmtDel = $pdo->prepare("DELETE FROM task_attachments WHERE attachment_id = :id");
				$stmtDel->execute([':id' => $oldest['attachment_id']]);
				$storageUsed -= (int)$oldest['filesize_bytes'];
			}
		}

		$originalFilename = basename($file['name']);
		$fileExtension = pathinfo($originalFilename, PATHINFO_EXTENSION);
		$newFilename = "user{$userId}_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $fileExtension;
		if (!move_uploaded_file($file['tmp_name'], ATTACHMENT_UPLOAD_DIR . $newFilename)) {
			throw new Exception("Failed to move uploaded file.");
		}

		$stmt = $pdo->prepare(
			"INSERT INTO task_attachments (task_id, user_id, filename_on_server, original_filename, filesize_bytes, mime_type, created_at)
			 VALUES (:taskId, :userId, :newFilename, :originalFilename, :filesize, :mimeType, UTC_TIMESTAMP())"
		);
		$stmt->execute([
			':taskId' => $taskId, ':userId' => $userId, ':newFilename' => $newFilename,
			':originalFilename' => $originalFilename, ':filesize' => $file['size'], ':mimeType' => $fileMimeType
		]);
		$newAttachmentId = (int)$pdo->lastInsertId();

		$newStorageUsed = $storageUsed + $file['size'];
		$stmt = $pdo->prepare("UPDATE users SET storage_used_bytes = :storage WHERE user_id = :userId");
		$stmt->execute([':storage' => $newStorageUsed, ':userId' => $userId]);

		$pdo->commit();
		send_json_response([
			'status' => 'success',
			'data' => [
				'attachment_id' => $newAttachmentId, 'task_id' => $taskId, 'filename_on_server' => $newFilename,
				'original_filename' => $originalFilename, 'filesize_bytes' => $file['size'],
				'user_storage_used' => $newStorageUsed, 'user_storage_quota' => USER_STORAGE_QUOTA_BYTES
			]
		], 201);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		log_debug_message('Error in handle_upload_attachment: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
	}
}

/**
 * Deletes an attachment, removes the file, and updates user storage quota.
 */
function handle_delete_attachment(PDO $pdo, int $userId, ?array $data): void {
	$attachmentId = isset($data['attachment_id']) ? (int)$data['attachment_id'] : 0;
	if ($attachmentId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid Attachment ID is required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt = $pdo->prepare("SELECT filename_on_server, filesize_bytes FROM task_attachments WHERE attachment_id = :attachmentId AND user_id = :userId");
		$stmt->execute([':attachmentId' => $attachmentId, ':userId' => $userId]);
		$attachment = $stmt->fetch(PDO::FETCH_ASSOC);

		if ($attachment === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Attachment not found or permission denied.'], 404);
			return;
		}

		if (file_exists(ATTACHMENT_UPLOAD_DIR . $attachment['filename_on_server'])) {
			unlink(ATTACHMENT_UPLOAD_DIR . $attachment['filename_on_server']);
		}
		$stmt = $pdo->prepare("DELETE FROM task_attachments WHERE attachment_id = :attachmentId");
		$stmt->execute([':attachmentId' => $attachmentId]);
		$stmt = $pdo->prepare("UPDATE users SET storage_used_bytes = GREATEST(0, storage_used_bytes - :filesize) WHERE user_id = :userId");
		$stmt->execute([':filesize' => (int)$attachment['filesize_bytes'], ':userId' => $userId]);
		$pdo->commit();
		send_json_response(['status' => 'success', 'data' => ['deleted_attachment_id' => $attachmentId]], 200);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		log_debug_message('Error in handle_delete_attachment: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
	}
}


/**
 * Fetches all attachments for a specific task.
 */
function handle_get_attachments(PDO $pdo, int $userId): void {
	$taskId = isset($_GET['task_id']) ? (int)$_GET['task_id'] : 0;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid Task ID is required.'], 400);
		return;
	}

	try {
		$stmt = $pdo->prepare("SELECT user_id FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		if ($stmt->fetch() === false) {
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		$stmt = $pdo->prepare(
			"SELECT attachment_id, task_id, filename_on_server, original_filename, filesize_bytes, created_at 
			 FROM task_attachments 
			 WHERE task_id = :taskId AND user_id = :userId 
			 ORDER BY created_at DESC"
		);
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		$attachments = $stmt->fetchAll(PDO::FETCH_ASSOC);

		send_json_response(['status' => 'success', 'data' => $attachments], 200);

	} catch (Exception $e) {
		log_debug_message('Error in handle_get_attachments: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
	}
}