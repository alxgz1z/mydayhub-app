<?php
/**
 * Code for /api/tasks.php
 *
 * MyDayHub - Tasks Module Handler
 *
 * Contains all business logic for task-related API actions.
 * This file is included and called by the main API gateway.
 *
 * @version 8.1 Tamarindo
 * @author Alex & Gemini & Claude & Cursor
 */

declare(strict_types=1);

// Modified for Debugging Hardening: Include the global helpers file.
// Note: While the gateway includes this, including it here makes the module self-contained and runnable in isolation for testing.
require_once __DIR__ . '/../incs/helpers.php';
require_once __DIR__ . '/../incs/crypto.php';


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
 * Modified for Subscription Quota Enforcement - Get user's subscription limits
 */
function getUserSubscriptionLimits(PDO $pdo, int $userId): array {
	$stmt = $pdo->prepare("SELECT subscription_level FROM users WHERE user_id = :userId");
	$stmt->execute([':userId' => $userId]);
	$subscriptionLevel = $stmt->fetchColumn() ?: 'free';
	
	// Define limits per subscription tier
	$limits = [
		'free' => [
			'storage_mb' => 10,
			'max_columns' => 3,
			'max_tasks' => 60,
			'sharing_enabled' => false
		],
		'base' => [
			'storage_mb' => 10,
			'max_columns' => 5,
			'max_tasks' => 200,
			'sharing_enabled' => true
		],
		'pro' => [
			'storage_mb' => 50,
			'max_columns' => 10,
			'max_tasks' => 500,
			'sharing_enabled' => true
		],
		'elite' => [
			'storage_mb' => 1024, // 1GB
			'max_columns' => 999,
			'max_tasks' => 9999,
			'sharing_enabled' => true
		]
	];
	
	return $limits[$subscriptionLevel] ?? $limits['free'];
}

/**
 * Modified for Subscription Quota Enforcement - Check if user can create a new column
 */
function canCreateColumn(PDO $pdo, int $userId): array {
	$limits = getUserSubscriptionLimits($pdo, $userId);
	
	$stmt = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL");
	$stmt->execute([':userId' => $userId]);
	$currentCount = (int)$stmt->fetchColumn();
	
	$canCreate = $currentCount < $limits['max_columns'];
	
	return [
		'can_create' => $canCreate,
		'current_count' => $currentCount,
		'limit' => $limits['max_columns'],
		'message' => $canCreate ? '' : "You've reached your column limit ({$limits['max_columns']}). Upgrade your subscription to create more columns."
	];
}

/**
 * Modified for Subscription Quota Enforcement - Check if user can create a new task
 */
function canCreateTask(PDO $pdo, int $userId): array {
	$limits = getUserSubscriptionLimits($pdo, $userId);
	
	$stmt = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE user_id = :userId AND deleted_at IS NULL");
	$stmt->execute([':userId' => $userId]);
	$currentCount = (int)$stmt->fetchColumn();
	
	$canCreate = $currentCount < $limits['max_tasks'];
	
	return [
		'can_create' => $canCreate,
		'current_count' => $currentCount,
		'limit' => $limits['max_tasks'],
		'message' => $canCreate ? '' : "You've reached your task limit ({$limits['max_tasks']}). Upgrade your subscription to create more tasks."
	];
}


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
		// Modified for Sharing Foundation - Error handling improvements
		case 'shareTask':
			if ($method === 'POST') {
				handle_share_task($pdo, $userId, $data);
			}
			break;
		
		case 'unshareTask':
			if ($method === 'POST') {
				handle_unshare_task($pdo, $userId, $data);
			}
			break;
		
		case 'listTaskShares':
			if ($method === 'POST' || $method === 'GET') {
				handle_list_task_shares($pdo, $userId, $data);
			}
			break;
			
		// Modified for Ready for Review - New action for recipient status toggle
		case 'toggleReadyForReview':
			if ($method === 'POST') {
				handle_toggle_ready_for_review($pdo, $userId, $data);
			}
			break;
			
		case 'getAllUserAttachments':
		if ($method === 'GET') {
			handle_get_all_user_attachments($pdo, $userId);
		}
		break;
		
		case 'getTrustRelationships':
		if ($method === 'GET' || $method === 'POST') {
			handle_get_trust_relationships($pdo, $userId);
		}
		break;
		
		case 'getSharedTasksInColumn':
		if ($method === 'POST') {
			handle_get_shared_tasks_in_column($pdo, $userId, $data);
		}
		break;
		
		case 'decryptTaskData':
		if ($method === 'GET') {
			handle_decrypt_task_data($pdo, $userId, $_GET);
		}
		break;
		
		case 'leaveSharedTask':
		if ($method === 'POST') {
			handle_leave_shared_task($pdo, $userId, $data);
		}
		break;
		
		default:
			send_json_response(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."], 404);
			break;
	}
}


// Add this function to your /api/tasks.php file to include share data when fetching tasks:

/**
 * Get share information for tasks owned by the current user
 * Returns array with task_id as key and shares array as value
 */
function getTaskShares($pdo, $userId, $taskIds) {
	 if (empty($taskIds)) return [];
	 
	 $placeholders = str_repeat('?,', count($taskIds) - 1) . '?';
	 $sql = "
		 SELECT s.item_id as task_id, u.user_id, u.username, u.email, s.permission, COALESCE(s.ready_for_review, 0) as ready_for_review
		 FROM shared_items s
		 JOIN users u ON u.user_id = s.recipient_id
		 WHERE s.item_type = 'task' 
		 AND s.item_id IN ($placeholders) 
		 AND s.owner_id = ? 
		 ORDER BY u.username
	 ";
	 
	 $params = array_merge($taskIds, [$userId]);
	 $stmt = $pdo->prepare($sql);
	 $stmt->execute($params);
	 $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
	 
	 // Group shares by task_id
	 $taskShares = [];
	 foreach ($results as $share) {
		 $taskId = $share['task_id'];
		 if (!isset($taskShares[$taskId])) {
			 $taskShares[$taskId] = [];
		 }
		 $taskShares[$taskId][] = $share;
	 }
	 
	 return $taskShares;
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

		// Get current private state
		if ($type === 'task') {
			$selectSql = "SELECT is_private, encrypted_data FROM `{$table}` WHERE {$idColumn} = :id AND user_id = :userId";
		} else {
			$selectSql = "SELECT is_private FROM `{$table}` WHERE {$idColumn} = :id AND user_id = :userId";
		}
		$stmtSelect = $pdo->prepare($selectSql);
		$stmtSelect->execute([':id' => $id, ':userId' => $userId]);
		$currentData = $stmtSelect->fetch(PDO::FETCH_ASSOC);
		
		if (!$currentData) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => ucfirst($type) . ' not found or permission denied.'], 404);
			return;
		}

		$currentPrivateState = (bool)$currentData['is_private'];
		$newPrivateState = !$currentPrivateState;

		// Update privacy status
		$updateSql = "UPDATE `{$table}` SET is_private = NOT is_private, updated_at = UTC_TIMESTAMP() WHERE {$idColumn} = :id AND user_id = :userId";
		$stmtUpdate = $pdo->prepare($updateSql);
		$stmtUpdate->execute([':id' => $id, ':userId' => $userId]);

		// Handle encryption for tasks
		if ($type === 'task' && isEncryptionEnabled($pdo, $userId) && isset($currentData['encrypted_data'])) {
			if ($newPrivateState) {
				// Task is being made private - encrypt the data
				$decryptedData = decryptTaskData($pdo, $userId, $id, $currentData['encrypted_data']);
				if ($decryptedData) {
					$encryptedData = encryptTaskData($pdo, $userId, $id, $decryptedData);
					$stmtEncrypt = $pdo->prepare("UPDATE tasks SET encrypted_data = :encryptedData WHERE task_id = :id");
					$stmtEncrypt->execute([':encryptedData' => $encryptedData, ':id' => $id]);
				}
			} else {
				// Task is being made public - decrypt the data
				$decryptedData = decryptTaskData($pdo, $userId, $id, $currentData['encrypted_data']);
				if ($decryptedData) {
					$stmtDecrypt = $pdo->prepare("UPDATE tasks SET encrypted_data = :encryptedData WHERE task_id = :id");
					$stmtDecrypt->execute([':encryptedData' => json_encode($decryptedData), ':id' => $id]);
				}
			}
		}

		// Handle column privacy inheritance
		if ($type === 'column') {
			if ($newPrivateState) {
				// Column is being made private - make all tasks private and track inheritance
				
				// Check if column has shared tasks
				$stmtShared = $pdo->prepare("
					SELECT COUNT(*) FROM tasks t 
					JOIN shared_items s ON s.item_id = t.task_id AND s.item_type = 'task'
					WHERE t.column_id = :columnId AND t.user_id = :userId AND t.deleted_at IS NULL
				");
				$stmtShared->execute([':columnId' => $id, ':userId' => $userId]);
				$sharedTaskCount = (int)$stmtShared->fetchColumn();
				
				if ($sharedTaskCount > 0) {
					// Auto-unshare all shared tasks in the column (both active and completed)
					$stmtUnshareAll = $pdo->prepare("
						DELETE s FROM shared_items s 
						JOIN tasks t ON t.task_id = s.item_id AND s.item_type = 'task'
						WHERE t.column_id = :columnId AND t.user_id = :userId AND t.deleted_at IS NULL
					");
					$stmtUnshareAll->execute([':columnId' => $id, ':userId' => $userId]);
					$unsharedCount = $stmtUnshareAll->rowCount();
					
					// Log the auto-unsharing
					log_debug_message("Auto-unshared {$unsharedCount} shared tasks in column {$id} for user {$userId}");
				}
				
				// Make all tasks in the column private and track inheritance
				if (isEncryptionEnabled($pdo, $userId)) {
					$stmtTasks = $pdo->prepare("SELECT task_id, encrypted_data FROM tasks WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL AND is_private = 0");
					$stmtTasks->execute([':columnId' => $id, ':userId' => $userId]);
					
					while ($task = $stmtTasks->fetch(PDO::FETCH_ASSOC)) {
						// Mark task as private and set privacy_inherited = TRUE
						$stmtUpdateTask = $pdo->prepare("UPDATE tasks SET is_private = 1, privacy_inherited = 1 WHERE task_id = :taskId");
						$stmtUpdateTask->execute([':taskId' => $task['task_id']]);
						
						// Encrypt the task data
						$decryptedData = decryptTaskData($pdo, $userId, $task['task_id'], $task['encrypted_data']);
						if ($decryptedData) {
							$encryptedData = encryptTaskData($pdo, $userId, $task['task_id'], $decryptedData);
							$stmtEncryptTask = $pdo->prepare("UPDATE tasks SET encrypted_data = :encryptedData WHERE task_id = :taskId");
							$stmtEncryptTask->execute([':encryptedData' => $encryptedData, ':taskId' => $task['task_id']]);
						}
					}
				} else {
					// Just mark tasks as private and track inheritance without encryption
					$stmtUpdateTasks = $pdo->prepare("UPDATE tasks SET is_private = 1, privacy_inherited = 1 WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL AND is_private = 0");
					$stmtUpdateTasks->execute([':columnId' => $id, ':userId' => $userId]);
				}
			} else {
				// Column is being made public - restore original privacy states for inherited tasks
				
				if (isEncryptionEnabled($pdo, $userId)) {
					$stmtInheritedTasks = $pdo->prepare("SELECT task_id, encrypted_data FROM tasks WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL AND privacy_inherited = 1");
					$stmtInheritedTasks->execute([':columnId' => $id, ':userId' => $userId]);
					
					while ($task = $stmtInheritedTasks->fetch(PDO::FETCH_ASSOC)) {
						// Restore task to public and clear inheritance flag
						$stmtRestoreTask = $pdo->prepare("UPDATE tasks SET is_private = 0, privacy_inherited = 0 WHERE task_id = :taskId");
						$stmtRestoreTask->execute([':taskId' => $task['task_id']]);
						
						// Decrypt the task data back to plain JSON
						$decryptedData = decryptTaskData($pdo, $userId, $task['task_id'], $task['encrypted_data']);
						if ($decryptedData) {
							$stmtDecryptTask = $pdo->prepare("UPDATE tasks SET encrypted_data = :encryptedData WHERE task_id = :taskId");
							$stmtDecryptTask->execute([':encryptedData' => json_encode($decryptedData), ':taskId' => $task['task_id']]);
						}
					}
				} else {
					// Just restore privacy states for inherited tasks without encryption
					$stmtRestoreTasks = $pdo->prepare("UPDATE tasks SET is_private = 0, privacy_inherited = 0 WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL AND privacy_inherited = 1");
					$stmtRestoreTasks->execute([':columnId' => $id, ':userId' => $userId]);
				}
			}
		}

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
		// Check if user is owner or has edit permission
		$stmt_find = $pdo->prepare("
			SELECT t.encrypted_data, t.user_id,
				   CASE WHEN t.user_id = ? THEN 'owner'
						WHEN s.permission = 'edit' THEN 'edit'
						ELSE 'view' END as access_level
			FROM tasks t
			LEFT JOIN shared_items s ON s.item_id = t.task_id AND s.item_type = 'task' AND s.recipient_id = ?
			WHERE t.task_id = ? AND t.deleted_at IS NULL
			AND (t.user_id = ? OR s.recipient_id = ?)
		");
		$stmt_find->execute([$userId, $userId, $taskId, $userId, $userId]);
		$task = $stmt_find->fetch();
		
		if ($task === false || $task['access_level'] === 'view') {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or you do not have permission to edit it.'], 404);
			return;
		}
		// Decrypt current data if encrypted
		$currentData = decryptTaskData($pdo, $userId, $taskId, $task['encrypted_data']) ?: [];
		if ($notes !== null) {
			$currentData['notes'] = $notes;
		}
		
		// Encrypt the updated data
		$newDataJson = encryptTaskData($pdo, $userId, $taskId, $currentData);
		$sql_parts = [];
		$params = [':taskId' => $taskId];
		if ($notes !== null) {
			$sql_parts[] = "encrypted_data = :newDataJson";
			$params[':newDataJson'] = $newDataJson;
		}
		if (array_key_exists('dueDate', $data)) {
			$sql_parts[] = "due_date = :dueDate";
			$params[':dueDate'] = $dueDateForDb;
		}
		
		if (!empty($sql_parts)) {
			// Modified for Shared Task Notes - Remove user_id restriction since permission already verified
			$sql = "UPDATE tasks SET " . implode(', ', $sql_parts) . ", updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId";
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
 * Modified for Column Duplication Fix - Fixed columnMap reference corruption
 */
function handle_get_all_board_data(PDO $pdo, int $userId): void {
	try {
		$stmtUser = $pdo->prepare("SELECT preferences, storage_used_bytes, subscription_level FROM users WHERE user_id = :userId");
		$stmtUser->execute([':userId' => $userId]);
		$userData = $stmtUser->fetch(PDO::FETCH_ASSOC);
		$userPrefs = json_decode($userData['preferences'] ?? '{}', true);
		$storageUsed = (int)($userData['storage_used_bytes'] ?? 0);
		$subscriptionLevel = $userData['subscription_level'] ?? 'free';

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

		// Get user's own columns
		$stmtColumns = $pdo->prepare(
			"SELECT column_id, column_name, position, is_private 
			 FROM `columns` 
			 WHERE user_id = :userId AND deleted_at IS NULL 
			 ORDER BY position ASC"
		);
		$stmtColumns->execute([':userId' => $userId]);
		$columns = $stmtColumns->fetchAll();
		$boardData = [];
		
		// Add user's own columns
		foreach ($columns as $column) {
			$column['tasks'] = [];
			$boardData[] = $column;
		}

		// Modified for Deleted User Cleanup - Exclude shared tasks from deleted/suspended users
		// Modified for Shared Task Completion - Exclude completed shared tasks from receiver view
		$stmtSharedTasks = $pdo->prepare(
			"SELECT 
				t.task_id, t.encrypted_data, t.position, t.classification, t.is_private,
				t.updated_at, t.due_date, t.snoozed_until, t.snoozed_at,
				COUNT(ta.attachment_id) as attachments_count,
				s.permission as access_type,
				COALESCE(s.ready_for_review, 0) as ready_for_review,
				u.username as owner_username
			 FROM tasks t
			 JOIN shared_items s ON s.item_id = t.task_id AND s.item_type = 'task'
			 JOIN users u ON u.user_id = t.user_id
			 LEFT JOIN task_attachments ta ON t.task_id = ta.task_id
			 WHERE s.recipient_id = :userId 
			 AND t.deleted_at IS NULL 
			 AND u.status = 'active'
			 AND t.classification != 'completed'
			 GROUP BY t.task_id
			 ORDER BY t.position ASC"
		);
		$stmtSharedTasks->execute([':userId' => $userId]);
		$sharedTasks = $stmtSharedTasks->fetchAll();

		// Modified for Virtual Column Fix - Only add "Shared with Me" column if shared tasks exist
		$sharedColumnId = null;
		if (!empty($sharedTasks)) {
			$sharedColumnId = 'shared-with-me';
			$sharedColumn = [
				'column_id' => $sharedColumnId,
				'column_name' => 'Shared with Me',
				'position' => 9999, // Place at the end
				'is_private' => false,
				'tasks' => []
			];
			$boardData[] = $sharedColumn;
		}

		// Sort board data
		usort($boardData, function($a, $b) {
			return $a['position'] <=> $b['position'];
		});
		
		// Modified for Column Duplication Fix - Create index-based columnMap to prevent reference corruption
		$columnMap = [];
		foreach ($boardData as $index => $column) {
			$columnMap[$column['column_id']] = $index; // Store INDEX, not reference
		}

		// Get user's own tasks
		$stmtTasks = $pdo->prepare(
			"SELECT 
				t.task_id, t.column_id, t.encrypted_data, t.position, t.classification, t.is_private,
				t.updated_at, t.due_date, t.snoozed_until, t.snoozed_at, t.journal_entry_id,
				COUNT(ta.attachment_id) as attachments_count,
				'owner' as access_type
			 FROM tasks t
			 LEFT JOIN task_attachments ta ON t.task_id = ta.task_id
			 WHERE t.user_id = :userId AND t.deleted_at IS NULL
			 GROUP BY t.task_id
			 ORDER BY t.position ASC"
		);
		$stmtTasks->execute([':userId' => $userId]);

		// Process owned tasks
		$taskIds = [];
		$tasksArray = [];
		while ($task = $stmtTasks->fetch()) {
			if (isset($columnMap[$task['column_id']])) {
				// Decrypt task data if encrypted for display
				// This is a hybrid approach - server can decrypt for display but maintains zero-knowledge for storage
				if ($task['is_private']) {
					$decryptedData = decryptTaskData($pdo, $userId, $task['task_id'], $task['encrypted_data']);
					if ($decryptedData) {
						$task['encrypted_data'] = json_encode($decryptedData); // Send decrypted data
					}
				}
				$task['has_notes'] = !empty($decryptedData['notes'] ?? '');
				$task['is_snoozed'] = !empty($task['snoozed_until']);
				$tasksArray[] = $task;
				$taskIds[] = $task['task_id'];
			}
		}

		// Process shared tasks - add to "Shared with Me" column only if it exists
		foreach ($sharedTasks as $task) {
			// For shared tasks, we don't decrypt them as they belong to other users
			// The frontend will handle decryption if needed
			$encryptedData = json_decode($task['encrypted_data'], true);
			$task['has_notes'] = !empty($encryptedData['notes']);
			$task['is_snoozed'] = !empty($task['snoozed_until']);
			$task['column_id'] = $sharedColumnId; // Assign to shared column
			$task['shared_by'] = $task['owner_username']; // Track who shared it
			$tasksArray[] = $task;
			$taskIds[] = $task['task_id'];
		}

		// Get share data for all tasks
		$taskShares = [];
		if (!empty($taskIds)) {
			$taskShares = getTaskShares($pdo, $userId, $taskIds);
		}

		// Modified for Column Duplication Fix - Add tasks using index lookup to prevent reference corruption
		foreach ($tasksArray as $task) {
			$task['shares'] = $taskShares[$task['task_id']] ?? [];
			if (isset($columnMap[$task['column_id']])) {
				$boardData[$columnMap[$task['column_id']]]['tasks'][] = $task;
			}
		}

		// Modified for Subscription Quota Enforcement - Include quota status for proactive UI
		$limits = getUserSubscriptionLimits($pdo, $userId);
		$storageQuotaBytes = $limits['storage_mb'] * 1024 * 1024;
		
		// Get current usage counts for quota status
		$currentColumns = count($boardData) - (array_search('shared-with-me', array_column($boardData, 'column_id')) !== false ? 1 : 0);
		$currentTasks = 0;
		foreach ($boardData as $column) {
			if ($column['column_id'] !== 'shared-with-me') {
				$currentTasks += count($column['tasks'] ?? []);
			}
		}
		
		$quotaStatus = [
			'columns' => [
				'used' => $currentColumns,
				'limit' => $limits['max_columns'],
				'at_limit' => $currentColumns >= $limits['max_columns']
			],
			'tasks' => [
				'used' => $currentTasks,
				'limit' => $limits['max_tasks'],
				'at_limit' => $currentTasks >= $limits['max_tasks']
			],
			'sharing_enabled' => $limits['sharing_enabled'],
			'subscription_level' => strtoupper($subscriptionLevel)
		];
		
		send_json_response([
			'status' => 'success', 
			'data' => [
				'board' => $boardData,
				'user_prefs' => $userPrefs,
				'user_storage' => ['used' => $storageUsed, 'quota' => $storageQuotaBytes],
				'quota_status' => $quotaStatus,
				'wake_notification' => $hasAwakenedTasks
			]
		], 200);

	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_get_all_board_data(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while fetching board data.'], 500);
	}
}

/**
 * Decrypts task data for frontend display
 */
function handle_decrypt_task_data(PDO $pdo, int $userId, array $data): void {
	$taskId = $data['task_id'] ?? null;
	
	if (!$taskId) {
		send_json_response(['status' => 'error', 'message' => 'Task ID is required.'], 400);
		return;
	}
	
	try {
		// Get the encrypted data for the task
		$stmt = $pdo->prepare("SELECT encrypted_data FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt->fetch(PDO::FETCH_ASSOC);
		
		if (!$task) {
			send_json_response(['status' => 'error', 'message' => 'Task not found.'], 404);
			return;
		}
		
		// Decrypt the task data
		$decryptedData = decryptTaskData($pdo, $userId, $taskId, $task['encrypted_data']);
		
		if ($decryptedData) {
			send_json_response(['status' => 'success', 'data' => $decryptedData], 200);
		} else {
			send_json_response(['status' => 'error', 'message' => 'Failed to decrypt task data.'], 500);
		}
	} catch (Exception $e) {
		log_debug_message('Error in handle_decrypt_task_data: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while decrypting task data.'], 500);
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
	
	// Modified for Subscription Quota Enforcement - Check column limits
	$quotaCheck = canCreateColumn($pdo, $userId);
	if (!$quotaCheck['can_create']) {
		send_json_response([
			'status' => 'error', 
			'message' => $quotaCheck['message'],
			'quota_exceeded' => true,
			'current_count' => $quotaCheck['current_count'],
			'limit' => $quotaCheck['limit']
		], 403);
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
	
	// Modified for Subscription Quota Enforcement - Check task limits
	$quotaCheck = canCreateTask($pdo, $userId);
	if (!$quotaCheck['can_create']) {
		send_json_response([
			'status' => 'error',
			'message' => $quotaCheck['message'],
			'quota_exceeded' => true,
			'current_count' => $quotaCheck['current_count'],
			'limit' => $quotaCheck['limit']
		], 403);
		return;
	}
	
	$columnId = (int)$data['column_id'];
	$taskTitle = trim($data['task_title']);

	try {
		$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM `tasks` WHERE user_id = :userId AND column_id = :columnId AND deleted_at IS NULL");
		$stmtPos->execute([':userId' => $userId, ':columnId' => $columnId]);
		$position = (int)$stmtPos->fetchColumn();
		
		// Create task data
		$taskData = ['title' => $taskTitle, 'notes' => ''];
		
		// Insert task first to get the ID
		$stmt = $pdo->prepare(
			"INSERT INTO `tasks` (user_id, column_id, encrypted_data, position, created_at, updated_at) VALUES (:userId, :columnId, :encryptedData, :position, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt->execute([':userId' => $userId, ':columnId' => $columnId, ':encryptedData' => json_encode($taskData), ':position' => $position]);
		$newTaskId = (int)$pdo->lastInsertId();
		
		// Encrypt the data if encryption is enabled and task is private
		if (isEncryptionEnabled($pdo, $userId)) {
			$encryptedData = encryptTaskData($pdo, $userId, $newTaskId, $taskData);
			$stmtUpdate = $pdo->prepare("UPDATE tasks SET encrypted_data = :encryptedData WHERE task_id = :taskId");
			$stmtUpdate->execute([':encryptedData' => $encryptedData, ':taskId' => $newTaskId]);
		}

		// Get the final encrypted data for response
		$finalEncryptedData = isEncryptionEnabled($pdo, $userId) ? $encryptedData : json_encode($taskData);
		
		send_json_response([
			'status' => 'success',
			'data' => [
				'task_id' => $newTaskId, 'column_id' => $columnId, 'encrypted_data' => $finalEncryptedData,
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
		send_json_response(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()], 500);
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

		// BLOCK DELETION IF SHARED (owner must unshare first)
		$checkShare = $pdo->prepare("
			SELECT 1
			FROM shared_items
			WHERE owner_id = :owner
			  AND item_type = 'task'
			  AND item_id = :tid
			LIMIT 1
		");
		$checkShare->execute([':owner' => $userId, ':tid' => $taskId]);
		if ($checkShare->fetchColumn()) {
			$pdo->rollBack();
			send_json_response([
				'status'  => 'error',
				'message' => 'This task is shared. Unshare it first before deleting.'
			], 409);
			return;
		}


		$stmt_delete = $pdo->prepare(
			"UPDATE tasks SET deleted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() 
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_delete->execute([':taskId' => $taskId, ':userId' => $userId]);

		// Remove journal task links (independence rule: task deletion doesn't affect journal entry)
		$unlinkStmt = $pdo->prepare("DELETE FROM journal_task_links WHERE task_id = :taskId");
		$unlinkStmt->execute([':taskId' => $taskId]);

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
			"SELECT column_id, encrypted_data, classification, due_date, is_private FROM tasks WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$originalTask = $stmt_find->fetch(PDO::FETCH_ASSOC);

		if ($originalTask === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task to duplicate not found or permission denied.'], 404);
			return;
		}
		
		// Prevent duplication of private tasks for security reasons
		if ($originalTask['is_private']) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Private tasks cannot be duplicated for security reasons.'], 403);
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

		// Modified for Subscription Quota Enforcement - Use dynamic storage limits
		$limits = getUserSubscriptionLimits($pdo, $userId);
		$storageQuotaBytes = $limits['storage_mb'] * 1024 * 1024;

		if (($storageUsed + $file['size']) > $storageQuotaBytes) {
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
				'user_storage_used' => $newStorageUsed, 'user_storage_quota' => $storageQuotaBytes
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

/**
 * Share a task with another user.
 * Requires: data.task_id, data.recipient_identifier (email or username), data.permission ('edit'|'view')
 * Policy: only the owner can share. Uses shared_items (item_type='task').
 */
function handle_share_task(PDO $pdo, int $userId, ?array $data): void {
	try {
		log_debug_message("Starting share task process");
		log_debug_message("Received data: " . json_encode($data));
		log_debug_message("Current user ID: " . $userId);
		
		// Validate required data fields
		if (!isset($data['task_id'])) {
			send_json_response(['status' => 'error', 'message' => 'Task ID is required.'], 400);
			return;
		}
		
		if (!isset($data['recipient_identifier']) || $data['recipient_identifier'] === null) {
			send_json_response(['status' => 'error', 'message' => 'Recipient identifier is required.'], 400);
			return;
		}
		
		if (!isset($data['permission'])) {
			send_json_response(['status' => 'error', 'message' => 'Permission is required.'], 400);
			return;
		}
		
		$taskId = intval($data['task_id']);
		$recipientIdentifier = trim($data['recipient_identifier']);
		$permission = $data['permission']; // 'edit' or 'view'
		log_debug_message("Task ID: $taskId, Recipient: $recipientIdentifier, Permission: $permission");
		
		// Validate permission
		if (!in_array($permission, ['edit', 'view'])) {
			send_json_response(['status' => 'error', 'message' => 'Invalid permission level.'], 400);
			return;
		}
		
		// Validate recipient identifier is not empty after trimming
		if (empty($recipientIdentifier)) {
			send_json_response(['status' => 'error', 'message' => 'Recipient identifier cannot be empty.'], 400);
			return;
		}
		
		// 1) Verify the task exists and current user owns it
		log_debug_message("Checking task ownership");
		$stmt = $pdo->prepare("SELECT task_id, user_id FROM tasks WHERE task_id = ? AND deleted_at IS NULL");
		$stmt->execute([$taskId]);
		$task = $stmt->fetch(PDO::FETCH_ASSOC);
		
		if (!$task) {
			send_json_response(['status' => 'error', 'message' => 'Task not found.'], 404);
			return;
		}
		
		if ($task['user_id'] != $userId) {
			send_json_response(['status' => 'error', 'message' => 'You can only share tasks you own.'], 403);
			return;
		}
		
		log_debug_message("Task ownership verified");
		
		$limits = getUserSubscriptionLimits($pdo, $userId);
		if (!$limits['sharing_enabled']) {
			send_json_response([
				'status' => 'error', 
				'message' => 'Sharing is not available with your current subscription. Upgrade to BASE or higher to share tasks.',
				'feature_restricted' => true
			], 403);
			return;
		}
		
		// 2) Find the recipient user by email or username
		log_debug_message("Looking up recipient user");
		$stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ? OR username = ?");
		$stmt->execute([$recipientIdentifier, $recipientIdentifier]);
		$recipientUser = $stmt->fetch(PDO::FETCH_ASSOC);
		
		if (!$recipientUser) {
			send_json_response(['status' => 'error', 'message' => 'Recipient user not found.'], 404);
			return;
		}
		
		$recipientUserId = $recipientUser['user_id'];
		log_debug_message("Recipient user found: ID $recipientUserId");
		
		// 3) Prevent self-sharing
		if ($recipientUserId == $userId) {
			send_json_response(['status' => 'error', 'message' => 'You cannot share a task with yourself.'], 400);
			return;
		}
		
		// 4) Check if already shared with this user - Modified for Hard Delete: removed status filter
		log_debug_message("Checking for existing share");
		$stmt = $pdo->prepare("SELECT id FROM shared_items WHERE item_type = 'task' AND item_id = ? AND owner_id = ? AND recipient_id = ?");
		$stmt->execute([$taskId, $userId, $recipientUserId]);
		if ($stmt->fetch()) {
			send_json_response(['status' => 'error', 'message' => 'Task is already shared with this user.'], 409);
			return;
		}
		
		log_debug_message("No existing share found, proceeding with insert");
		
		// 5) Insert the share record - Modified for Hard Delete: removed status field
		$stmt = $pdo->prepare("INSERT INTO shared_items (item_type, item_id, owner_id, recipient_id, permission, created_at, updated_at) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())");
		$stmt->execute(['task', $taskId, $userId, $recipientUserId, $permission]);
		
		log_debug_message("Share record inserted successfully");
		log_debug_message("Sending success response");
		
		send_json_response([
			'status' => 'success',
			'message' => 'Task shared successfully.',
			'data' => [
				'task_id' => $taskId,
				'recipient_id' => $recipientUserId,
				'permission' => $permission
			]
		], 201);
		
	} catch (Exception $e) {
		log_debug_message("Exception in handle_share_task: " . $e->getMessage());
		if (defined('DEV_MODE') && DEV_MODE) {
			send_json_response(['status' => 'error', 'message' => 'Share failed: ' . $e->getMessage()], 500);
		} else {
			send_json_response(['status' => 'error', 'message' => 'Failed to share task.'], 500);
		}
	}
}

/**
 * Unshare a task (owner only) - deletes the share record completely.
 * Modified for Sharing Foundation - Simplified to delete record instead of revoke status
 * Requires: data.task_id, data.recipient_user_id
 */
function handle_unshare_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$recipientId = isset($data['recipient_user_id']) ? (int)$data['recipient_user_id'] : 0;

	if ($taskId <= 0 || $recipientId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid task_id and recipient_user_id are required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Verify task ownership
		$taskCheck = $pdo->prepare("SELECT user_id FROM tasks WHERE task_id = :tid AND deleted_at IS NULL");
		$taskCheck->execute([':tid' => $taskId]);
		$task = $taskCheck->fetch(PDO::FETCH_ASSOC);
		
		if (!$task || (int)$task['user_id'] !== $userId) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		// Delete the share record completely
		$deleteShare = $pdo->prepare("
			DELETE FROM shared_items
			WHERE owner_id = :owner AND recipient_id = :rec AND item_type = 'task' AND item_id = :tid
		");
		$deleteResult = $deleteShare->execute([':owner' => $userId, ':rec' => $recipientId, ':tid' => $taskId]);

		if (!$deleteResult || $deleteShare->rowCount() === 0) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Share not found or already removed.'], 404);
			return;
		}

		$pdo->commit();
		
		log_debug_message("Successfully deleted share for task $taskId from user $recipientId");
		send_json_response(['status' => 'success', 'message' => 'Task unshared successfully.'], 200);
		
	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message('unshareTask error: ' . $e->getMessage());
		
		$errorMessage = 'Server error while unsharing task.';
		if (defined('DEV_MODE') && DEV_MODE) {
			$errorMessage .= ' Details: ' . $e->getMessage();
		}
		
		send_json_response(['status' => 'error', 'message' => $errorMessage], 500);
	}
}


/**
 * List all users who have access to a specific task.
 * Modified for Sharing Foundation - Enhanced error handling and exclude revoked shares
 * Requires: data.task_id
 */
function handle_list_task_shares(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	if ($taskId <= 0) {
		send_json_response(['status'=>'error','message'=>'Invalid task ID.'], 400);
		return;
	}
	try {
		// 1) Verify the task exists and current user owns it
		$own = $pdo->prepare("SELECT user_id FROM tasks WHERE task_id = :tid AND deleted_at IS NULL");
		$own->execute([':tid'=>$taskId]);
		$row = $own->fetch(PDO::FETCH_ASSOC);
		if (!$row || (int)$row['user_id'] !== $userId) {
			send_json_response(['status'=>'error','message'=>'Not found or no permission.'], 404);
			return;
		}
		
		// 2) Fetch active shares (exclude revoked)
		$shares = $pdo->prepare("
			SELECT u.user_id, u.username, u.email, s.permission
			FROM shared_items s
			JOIN users u ON u.user_id = s.recipient_id
			WHERE s.item_type = 'task' AND s.item_id = :tid AND s.owner_id = :owner
			ORDER BY u.username
		");
		$shares->execute([':tid'=>$taskId, ':owner'=>$userId]);
		$result = $shares->fetchAll(PDO::FETCH_ASSOC);
		
		send_json_response(['status'=>'success','data'=>['shares'=>$result]], 200);
	} catch (Exception $e) {
		log_debug_message('listTaskShares error: ' . $e->getMessage());
		
		// Include detailed error in response when in dev mode
		$errorMessage = 'Server error while listing shares.';
		if (defined('DEV_MODE') && DEV_MODE) {
			$errorMessage .= ' Details: ' . $e->getMessage();
		}
		
		send_json_response(['status'=>'error','message'=>$errorMessage], 500);
	}
}

/**
 * Toggle ready-for-review status for a shared task recipient.
 * Modified for Ready for Review - Allow recipients to mark tasks as ready
 */
function handle_toggle_ready_for_review(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$readyForReview = isset($data['ready_for_review']) ? (bool)$data['ready_for_review'] : false;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid task_id is required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Verify this user has access to the task (either as owner or recipient)
		$accessCheck = $pdo->prepare("
			SELECT t.user_id as owner_id, s.permission, s.recipient_id
			FROM tasks t
			LEFT JOIN shared_items s ON s.item_id = t.task_id AND s.item_type = 'task' AND s.recipient_id = ?
			WHERE t.task_id = ? AND t.deleted_at IS NULL
			AND (t.user_id = ? OR s.recipient_id = ?)
		");
		$accessCheck->execute([$userId, $taskId, $userId, $userId]);
		$access = $accessCheck->fetch(PDO::FETCH_ASSOC);

		if (!$access) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		$isOwner = ($access['owner_id'] == $userId);
		$isRecipient = ($access['recipient_id'] == $userId);

		// Only recipients can toggle ready-for-review status
		if (!$isRecipient) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Only shared task recipients can mark tasks as ready for review.'], 403);
			return;
		}

		// Update the ready_for_review status in shared_items table
		$updateShare = $pdo->prepare("
			UPDATE shared_items 
			SET ready_for_review = :readyStatus, updated_at = UTC_TIMESTAMP()
			WHERE item_type = 'task' AND item_id = :taskId AND recipient_id = :userId
		");
		$updateResult = $updateShare->execute([
			':readyStatus' => $readyForReview ? 1 : 0,
			':taskId' => $taskId,
			':userId' => $userId
		]);

		if (!$updateResult || $updateShare->rowCount() === 0) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Failed to update ready status.'], 500);
			return;
		}

		$pdo->commit();

		send_json_response([
			'status' => 'success',
			'data' => [
				'task_id' => $taskId,
				'ready_for_review' => $readyForReview
			]
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_toggle_ready_for_review: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while updating ready status.'], 500);
	}
}



/**
 * Fetches all attachments for the current user across all tasks with sorting options.
 * Modified for File Management Feature - New endpoint for global attachment management
 */
function handle_get_all_user_attachments(PDO $pdo, int $userId): void {
	$sortBy = $_GET['sort_by'] ?? 'date'; // 'date' or 'size'
	$sortOrder = $_GET['sort_order'] ?? 'desc'; // 'asc' or 'desc'

	// Validate sort parameters
	if (!in_array($sortBy, ['date', 'size'])) {
		$sortBy = 'date';
	}
	if (!in_array($sortOrder, ['asc', 'desc'])) {
		$sortOrder = 'desc';
	}

	try {
		// Get user's current storage usage
		$storageStmt = $pdo->prepare("SELECT storage_used_bytes FROM users WHERE user_id = :userId");
		$storageStmt->execute([':userId' => $userId]);
		$storageUsed = (int)$storageStmt->fetchColumn();

		// Build the ORDER BY clause based on sort parameters
		$orderByClause = '';
		if ($sortBy === 'size') {
			$orderByClause = "ORDER BY ta.filesize_bytes {$sortOrder}";
		} else { // date
			$orderByClause = "ORDER BY ta.created_at {$sortOrder}";
		}

		// Get all attachments for the user with task information
		$stmt = $pdo->prepare("
			SELECT 
				ta.attachment_id,
				ta.task_id,
				ta.filename_on_server,
				ta.original_filename,
				ta.filesize_bytes,
				ta.mime_type,
				ta.created_at,
				t.encrypted_data,
				t.column_id,
				c.column_name
			FROM task_attachments ta
			JOIN tasks t ON t.task_id = ta.task_id
			LEFT JOIN `columns` c ON c.column_id = t.column_id
			WHERE ta.user_id = :userId
			AND t.deleted_at IS NULL
			{$orderByClause}
		");
		$stmt->execute([':userId' => $userId]);
		$attachments = $stmt->fetchAll(PDO::FETCH_ASSOC);

		// Process attachments to include task titles
		foreach ($attachments as &$attachment) {
			$taskData = json_decode($attachment['encrypted_data'], true);
			$attachment['task_title'] = $taskData['title'] ?? 'Untitled Task';
			unset($attachment['encrypted_data']); // Remove encrypted data from response
		}

		send_json_response([
			'status' => 'success',
			'data' => [
				'attachments' => $attachments,
				'storage_used' => $storageUsed,
				'storage_quota' => USER_STORAGE_QUOTA_BYTES,
				'total_count' => count($attachments)
			]
		], 200);

	} catch (Exception $e) {
		log_debug_message('Error in handle_get_all_user_attachments: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
	}
}

/**
 * Gets shared tasks in a specific column for privacy conflict checking.
 */
function handle_get_shared_tasks_in_column(PDO $pdo, int $userId, array $data): void {
	try {
		$columnId = (int)($data['column_id'] ?? 0);
		
		if (!$columnId) {
			send_json_response(['status' => 'error', 'message' => 'Column ID is required.'], 400);
			return;
		}
		
		// Get shared tasks in the column
		$stmt = $pdo->prepare("
			SELECT 
				t.task_id,
				t.classification,
				t.is_private,
				s.permission,
				u.username as recipient_username
			FROM tasks t
			JOIN shared_items s ON s.item_id = t.task_id AND s.item_type = 'task'
			JOIN users u ON u.user_id = s.recipient_id
			WHERE t.column_id = :columnId 
			AND t.user_id = :userId 
			AND t.deleted_at IS NULL
			ORDER BY t.classification, t.task_id
		");
		
		$stmt->execute([':columnId' => $columnId, ':userId' => $userId]);
		$sharedTasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		send_json_response([
			'status' => 'success',
			'data' => $sharedTasks
		]);
		
	} catch (Exception $e) {
		log_debug_message('Error in handle_get_shared_tasks_in_column: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
	}
}

/**
 * Gets all trust relationships for the current user - both outgoing and incoming shares.
 * Modified for Trust Management System - Comprehensive sharing relationship overview
 */
function handle_get_trust_relationships(PDO $pdo, int $userId): void {
	try {
		// Get outgoing shares (tasks I've shared with others)
		$outgoingStmt = $pdo->prepare("
			SELECT 
				s.item_id as task_id,
				s.recipient_id,
				s.permission,
				s.created_at as shared_at,
				COALESCE(s.ready_for_review, 0) as ready_for_review,
				t.encrypted_data,
				c.column_name,
				u.username as recipient_username,
				u.email as recipient_email
			FROM shared_items s
			JOIN tasks t ON t.task_id = s.item_id
			JOIN users u ON u.user_id = s.recipient_id
			LEFT JOIN `columns` c ON c.column_id = t.column_id
			WHERE s.item_type = 'task' 
			AND s.owner_id = :userId 
			AND t.deleted_at IS NULL
			AND u.status = 'active'
			ORDER BY s.created_at DESC
		");
		$outgoingStmt->execute([':userId' => $userId]);
		$outgoingShares = $outgoingStmt->fetchAll(PDO::FETCH_ASSOC);

		// Process outgoing shares to include task titles
		foreach ($outgoingShares as &$share) {
			$taskData = json_decode($share['encrypted_data'], true);
			$share['task_title'] = $taskData['title'] ?? 'Untitled Task';
			unset($share['encrypted_data']); // Remove from response
		}

		// Get incoming shares (tasks others have shared with me)
		// Modified for Shared Task Completion - Exclude completed shared tasks from trust relationships
		$incomingStmt = $pdo->prepare("
			SELECT 
				s.item_id as task_id,
				s.owner_id,
				s.permission,
				s.created_at as shared_at,
				COALESCE(s.ready_for_review, 0) as ready_for_review,
				t.encrypted_data,
				u.username as owner_username,
				u.email as owner_email
			FROM shared_items s
			JOIN tasks t ON t.task_id = s.item_id
			JOIN users u ON u.user_id = s.owner_id
			WHERE s.item_type = 'task' 
			AND s.recipient_id = :userId 
			AND t.deleted_at IS NULL
			AND u.status = 'active'
			AND t.classification != 'completed'
			ORDER BY s.created_at DESC
		");
		$incomingStmt->execute([':userId' => $userId]);
		$incomingShares = $incomingStmt->fetchAll(PDO::FETCH_ASSOC);

		// Process incoming shares to include task titles
		foreach ($incomingShares as &$share) {
			$taskData = json_decode($share['encrypted_data'], true);
			$share['task_title'] = $taskData['title'] ?? 'Untitled Task';
			unset($share['encrypted_data']); // Remove from response
		}

		// Get summary statistics
		$stats = [
			'tasks_shared_by_me' => count($outgoingShares),
			'tasks_shared_with_me' => count($incomingShares),
			'unique_people_i_share_with' => count(array_unique(array_column($outgoingShares, 'recipient_id'))),
			'unique_people_sharing_with_me' => count(array_unique(array_column($incomingShares, 'owner_id'))),
			'ready_for_review_count' => count(array_filter($outgoingShares, function($share) {
				return $share['ready_for_review'];
			}))
		];

		send_json_response([
			'status' => 'success',
			'data' => [
				'outgoing_shares' => $outgoingShares,
				'incoming_shares' => $incomingShares,
				'statistics' => $stats
			]
		], 200);

	} catch (Exception $e) {
		log_debug_message('Error in handle_get_trust_relationships: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while fetching trust relationships.'], 500);
	}
}

/**
 * Allows a recipient to leave a shared task (remove themselves as recipient).
 * Modified for Trust Management System - Complete recipient control over sharing relationships
 */
function handle_leave_shared_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid task_id is required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Verify that the user is actually a recipient of this task
		$checkStmt = $pdo->prepare("
			SELECT s.owner_id, u.username as owner_username
			FROM shared_items s
			JOIN users u ON u.user_id = s.owner_id
			WHERE s.item_type = 'task' 
			AND s.item_id = :taskId 
			AND s.recipient_id = :userId
		");
		$checkStmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		$shareRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);

		if (!$shareRecord) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'You are not a recipient of this shared task.'], 404);
			return;
		}

		// Delete the share record (hard delete for clean state management)
		$deleteStmt = $pdo->prepare("
			DELETE FROM shared_items 
			WHERE item_type = 'task' 
			AND item_id = :taskId 
			AND recipient_id = :userId
		");
		$deleteResult = $deleteStmt->execute([':taskId' => $taskId, ':userId' => $userId]);

		if (!$deleteResult || $deleteStmt->rowCount() === 0) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Failed to leave shared task.'], 500);
			return;
		}

		$pdo->commit();

		log_debug_message("User $userId left shared task $taskId owned by {$shareRecord['owner_id']}");
		
		send_json_response([
			'status' => 'success', 
			'message' => 'You have left the shared task.',
			'data' => [
				'task_id' => $taskId,
				'owner_username' => $shareRecord['owner_username']
			]
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_leave_shared_task: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while leaving the shared task.'], 500);
	}
}