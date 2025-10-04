<?php
/**
 * Code for /api/admin.php
 *
 * MyDayHub - Admin API Module
 *
 * Handles admin-only operations like user management, subscription changes,
 * and system administration.
 *
 * @version 7.3 Tamarindo
 * @author Alex & Gemini & Claude
 */

declare(strict_types=1);

require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';
require_once __DIR__ . '/../incs/helpers.php';

// --- SESSION SECURITY ---
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

if (!isset($_SESSION['user_id'])) {
	send_json_response(['status' => 'error', 'message' => 'Authentication required.'], 401);
}

$userId = (int)$_SESSION['user_id'];

// --- ADMIN AUTHORIZATION ---
if (!is_admin_user($userId)) {
	send_json_response(['status' => 'error', 'message' => 'Admin access required.'], 403);
}

// --- ROUTING ---
$method = $_SERVER['REQUEST_METHOD'];
$data = [];

if ($method === 'GET') {
	$action = $_GET['action'] ?? null;
} elseif ($method === 'POST') {
	$csrf_token_header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
	if (!isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrf_token_header)) {
		send_json_response(['status' => 'error', 'message' => 'Invalid or missing CSRF token.'], 403);
	}

	$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
	if (stripos($contentType, 'application/json') !== false) {
		$json_data = file_get_contents('php://input');
		$input = json_decode($json_data, true) ?: [];
		$action = $input['action'] ?? null;
		$data = $input['data'] ?? $input;
	} else {
		send_json_response(['status' => 'error', 'message' => 'JSON content type required.'], 415);
	}
} else {
	send_json_response(['status' => 'error', 'message' => 'Method not allowed.'], 405);
}

if (!$action) {
	send_json_response(['status' => 'error', 'message' => 'Action is required.'], 400);
}

try {
	$pdo = get_pdo();
	handle_admin_action($action, $method, $pdo, $userId, $data);
} catch (Exception $e) {
	log_debug_message("Admin API Exception: " . $e->getMessage());
	send_json_response(['status' => 'error', 'message' => 'Server error (admin): ' . $e->getMessage()], 500);
}

/**
 * Main router for admin actions
 */
function handle_admin_action(string $action, string $method, PDO $pdo, int $adminUserId, array $data): void {
	switch ($action) {
		case 'getUsers':
			if ($method === 'GET') {
				handle_get_users($pdo, $adminUserId);
			}
			break;
		
		case 'getUserDetails':
			if ($method === 'GET') {
				handle_get_user_details($pdo, $adminUserId);
			}
			break;
			
		case 'updateUserSubscription':
			if ($method === 'POST') {
				handle_update_user_subscription($pdo, $adminUserId, $data);
			}
			break;
			
		case 'suspendUser':
			if ($method === 'POST') {
				handle_suspend_user($pdo, $adminUserId, $data);
			}
			break;
			
		case 'unsuspendUser':
			if ($method === 'POST') {
				handle_unsuspend_user($pdo, $adminUserId, $data);
			}
			break;
			
		case 'deleteUser':
			if ($method === 'POST') {
				handle_delete_user($pdo, $adminUserId, $data);
			}
			break;
			
		case 'exportUserData':
			if ($method === 'GET') {
				handle_export_user_data($pdo, $adminUserId);
			}
			break;
			
		case 'getAdminStats':
			if ($method === 'GET') {
				handle_get_admin_stats($pdo, $adminUserId);
			}
			break;
			
		case 'updateAdminNotes':
			if ($method === 'POST') {
				handle_update_admin_notes($pdo, $adminUserId, $data);
			}
			break;
			
		case 'getAdminActions':
		if ($method === 'GET') {
			handle_get_admin_actions($pdo, $adminUserId);
		}
		break;
			
		default:
			send_json_response(['status' => 'error', 'message' => "Admin action '{$action}' not found."], 404);
			break;
	}
}

/**
 * Get paginated list of users with basic info
 */
function handle_get_users(PDO $pdo, int $adminUserId): void {
	$page = max(1, (int)($_GET['page'] ?? 1));
	$limit = min(100, max(10, (int)($_GET['limit'] ?? 25)));
	$search = trim($_GET['search'] ?? '');
	$status = $_GET['status'] ?? 'all';
	$subscription = $_GET['subscription'] ?? 'all';
	
	$offset = ($page - 1) * $limit;
	
	try {
		// Build WHERE clause
		$whereConditions = [];
		$params = [];
		
		if (!empty($search)) {
			$whereConditions[] = "(username LIKE :search OR email LIKE :search)";
			$params[':search'] = "%{$search}%";
		}
		
		if ($status !== 'all') {
			$whereConditions[] = "status = :status";
			$params[':status'] = $status;
		}
		
		if ($subscription !== 'all') {
			$whereConditions[] = "subscription_level = :subscription";
			$params[':subscription'] = $subscription;
		}
		
		$whereClause = empty($whereConditions) ? '' : 'WHERE ' . implode(' AND ', $whereConditions);
		
		// Get total count
		$countSql = "SELECT COUNT(*) FROM users {$whereClause}";
		$countStmt = $pdo->prepare($countSql);
		$countStmt->execute($params);
		$totalUsers = (int)$countStmt->fetchColumn();
		
		// Get users
		$sql = "
			SELECT 
				user_id, username, email, subscription_level, status, 
				created_at, storage_used_bytes, suspended_at, suspended_reason
			FROM users 
			{$whereClause}
			ORDER BY created_at DESC
			LIMIT :limit OFFSET :offset
		";
		
		$stmt = $pdo->prepare($sql);
		$stmt->execute(array_merge($params, [':limit' => $limit, ':offset' => $offset]));
		$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		// Add quota info to each user
		foreach ($users as &$user) {
			$quotas = get_user_quotas($user['subscription_level']);
			$user['quotas'] = $quotas;
			$user['storage_used_mb'] = round($user['storage_used_bytes'] / (1024 * 1024), 2);
		}
		
		send_json_response([
			'status' => 'success',
			'data' => [
				'users' => $users,
				'pagination' => [
					'current_page' => $page,
					'total_pages' => ceil($totalUsers / $limit),
					'total_users' => $totalUsers,
					'per_page' => $limit
				]
			]
		], 200);
		
	} catch (Exception $e) {
		log_debug_message("Error in handle_get_users: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to fetch users.'], 500);
	}
}

/**
 * Get detailed information about a specific user
 */
function handle_get_user_details(PDO $pdo, int $adminUserId): void {
	$targetUserId = (int)($_GET['user_id'] ?? 0);
	
	if ($targetUserId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid user_id required.'], 400);
		return;
	}
	
	try {
		// Get user details
		$stmt = $pdo->prepare("
			SELECT 
				user_id, username, email, subscription_level, status, 
				created_at, storage_used_bytes, suspended_at, suspended_reason,
				preferences, admin_notes
			FROM users 
			WHERE user_id = :userId
		");
		$stmt->execute([':userId' => $targetUserId]);
		$user = $stmt->fetch(PDO::FETCH_ASSOC);
		
		if (!$user) {
			send_json_response(['status' => 'error', 'message' => 'User not found.'], 404);
			return;
		}
		
		// Get usage statistics
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL");
		$stmt->execute([':userId' => $targetUserId]);
		$columnCount = (int)$stmt->fetchColumn();
		
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE user_id = :userId AND deleted_at IS NULL");
		$stmt->execute([':userId' => $targetUserId]);
		$taskCount = (int)$stmt->fetchColumn();
		
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM shared_items WHERE owner_id = :userId AND item_type = 'task'");
		$stmt->execute([':userId' => $targetUserId]);
		$sharedTaskCount = (int)$stmt->fetchColumn();
		
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM task_attachments WHERE user_id = :userId");
		$stmt->execute([':userId' => $targetUserId]);
		$attachmentCount = (int)$stmt->fetchColumn();
		
		// Add computed fields
		$quotas = get_user_quotas($user['subscription_level']);
		$user['quotas'] = $quotas;
		$user['storage_used_mb'] = round($user['storage_used_bytes'] / (1024 * 1024), 2);
		$user['usage_stats'] = [
			'columns' => $columnCount,
			'tasks' => $taskCount,
			'shared_tasks' => $sharedTaskCount,
			'attachments' => $attachmentCount
		];
		
		// Parse preferences
		$user['preferences'] = json_decode($user['preferences'] ?? '{}', true);
		
		send_json_response([
			'status' => 'success',
			'data' => ['user' => $user]
		], 200);
		
	} catch (Exception $e) {
		log_debug_message("Error in handle_get_user_details: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to fetch user details.'], 500);
	}
}

/**
 * Update user's subscription level
 */
function handle_update_user_subscription(PDO $pdo, int $adminUserId, array $data): void {
	$targetUserId = (int)($data['user_id'] ?? 0);
	$newSubscription = $data['subscription_level'] ?? '';
	$reason = trim($data['reason'] ?? '');
	
	if ($targetUserId <= 0 || empty($newSubscription)) {
		send_json_response(['status' => 'error', 'message' => 'user_id and subscription_level required.'], 400);
		return;
	}
	
	if (!in_array($newSubscription, ['free', 'base', 'pro', 'elite'])) {
		send_json_response(['status' => 'error', 'message' => 'Invalid subscription level.'], 400);
		return;
	}
	
	try {
		$pdo->beginTransaction();
		
		// Get current subscription
		$stmt = $pdo->prepare("SELECT subscription_level FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $targetUserId]);
		$currentSubscription = $stmt->fetchColumn();
		
		if ($currentSubscription === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'User not found.'], 404);
			return;
		}
		
		if ($currentSubscription === $newSubscription) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'User already has this subscription level.'], 400);
			return;
		}
		
		// Update subscription
		$stmt = $pdo->prepare("
			UPDATE users 
			SET subscription_level = :subscription 
			WHERE user_id = :userId
		");
		$stmt->execute([':subscription' => $newSubscription, ':userId' => $targetUserId]);
		
		// Log admin action
		log_admin_action($pdo, $adminUserId, $targetUserId, 'subscription_change', 
						$currentSubscription, $newSubscription, $reason);
		
		$pdo->commit();
		
		send_json_response([
			'status' => 'success',
			'message' => 'Subscription updated successfully.'
		], 200);
		
	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_update_user_subscription: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to update subscription.'], 500);
	}
}

/**
 * Suspend a user account
 */
function handle_suspend_user(PDO $pdo, int $adminUserId, array $data): void {
	$targetUserId = (int)($data['user_id'] ?? 0);
	$reason = trim($data['reason'] ?? '');
	
	if ($targetUserId <= 0 || empty($reason)) {
		send_json_response(['status' => 'error', 'message' => 'user_id and reason required.'], 400);
		return;
	}
	
	try {
		$pdo->beginTransaction();
		
		// Check current status
		$stmt = $pdo->prepare("SELECT status FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $targetUserId]);
		$currentStatus = $stmt->fetchColumn();
		
		if ($currentStatus === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'User not found.'], 404);
			return;
		}
		
		if ($currentStatus === 'suspended') {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'User is already suspended.'], 400);
			return;
		}
		
		// Suspend user
		$stmt = $pdo->prepare("
			UPDATE users 
			SET status = 'suspended', suspended_reason = :reason, suspended_at = CURRENT_TIMESTAMP
			WHERE user_id = :userId
		");
		$stmt->execute([':reason' => $reason, ':userId' => $targetUserId]);
		
		// Log admin action
		log_admin_action($pdo, $adminUserId, $targetUserId, 'status_change', 
						$currentStatus, 'suspended', $reason);
		
		$pdo->commit();
		
		send_json_response([
			'status' => 'success',
			'message' => 'User suspended successfully.'
		], 200);
		
	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_suspend_user: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to suspend user.'], 500);
	}
}

/**
 * Unsuspend a user account
 */
function handle_unsuspend_user(PDO $pdo, int $adminUserId, array $data): void {
	$targetUserId = (int)($data['user_id'] ?? 0);
	$reason = trim($data['reason'] ?? '');
	
	if ($targetUserId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'user_id required.'], 400);
		return;
	}
	
	try {
		$pdo->beginTransaction();
		
		// Check current status
		$stmt = $pdo->prepare("SELECT status FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $targetUserId]);
		$currentStatus = $stmt->fetchColumn();
		
		if ($currentStatus === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'User not found.'], 404);
			return;
		}
		
		if ($currentStatus !== 'suspended') {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'User is not suspended.'], 400);
			return;
		}
		
		// Unsuspend user
		$stmt = $pdo->prepare("
			UPDATE users 
			SET status = 'active', suspended_reason = NULL, suspended_at = NULL
			WHERE user_id = :userId
		");
		$stmt->execute([':userId' => $targetUserId]);
		
		// Log admin action
		log_admin_action($pdo, $adminUserId, $targetUserId, 'status_change', 
						'suspended', 'active', $reason);
		
		$pdo->commit();
		
		send_json_response([
			'status' => 'success',
			'message' => 'User unsuspended successfully.'
		], 200);
		
	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_unsuspend_user: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to unsuspend user.'], 500);
	}
}

/**
 * Soft delete a user account (sets status to 'deleted')
 */
function handle_delete_user(PDO $pdo, int $adminUserId, array $data): void {
	$targetUserId = (int)($data['user_id'] ?? 0);
	$reason = trim($data['reason'] ?? '');
	
	if ($targetUserId <= 0 || empty($reason)) {
		send_json_response(['status' => 'error', 'message' => 'user_id and reason required.'], 400);
		return;
	}
	
	try {
		$pdo->beginTransaction();
		
		// Check current status
		$stmt = $pdo->prepare("SELECT status FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $targetUserId]);
		$currentStatus = $stmt->fetchColumn();
		
		if ($currentStatus === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'User not found.'], 404);
			return;
		}
		
		if ($currentStatus === 'deleted') {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'User is already deleted.'], 400);
			return;
		}
		
		// Soft delete user
		$stmt = $pdo->prepare("
			UPDATE users 
			SET status = 'deleted', suspended_reason = :reason, suspended_at = CURRENT_TIMESTAMP
			WHERE user_id = :userId
		");
		$stmt->execute([':reason' => $reason, ':userId' => $targetUserId]);
		
		// Log admin action
		log_admin_action($pdo, $adminUserId, $targetUserId, 'user_delete', 
						$currentStatus, 'deleted', $reason);
		
		$pdo->commit();
		
		send_json_response([
			'status' => 'success',
			'message' => 'User deleted successfully. Data will be retained for 30 days.'
		], 200);
		
	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_delete_user: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to delete user.'], 500);
	}
}

/**
 * Export user data as JSON
 */
function handle_export_user_data(PDO $pdo, int $adminUserId): void {
	$targetUserId = (int)($_GET['user_id'] ?? 0);
	
	if ($targetUserId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'user_id required.'], 400);
		return;
	}
	
	try {
		// Get user basic info
		$stmt = $pdo->prepare("
			SELECT user_id, username, email, subscription_level, status, created_at, preferences
			FROM users WHERE user_id = :userId
		");
		$stmt->execute([':userId' => $targetUserId]);
		$user = $stmt->fetch(PDO::FETCH_ASSOC);
		
		if (!$user) {
			send_json_response(['status' => 'error', 'message' => 'User not found.'], 404);
			return;
		}
		
		// Get columns
		$stmt = $pdo->prepare("
			SELECT column_id, column_name, position, is_private, created_at
			FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL
			ORDER BY position
		");
		$stmt->execute([':userId' => $targetUserId]);
		$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		// Get tasks
		$stmt = $pdo->prepare("
			SELECT task_id, column_id, encrypted_data, position, classification, 
				   is_private, due_date, created_at, updated_at
			FROM tasks WHERE user_id = :userId AND deleted_at IS NULL
			ORDER BY column_id, position
		");
		$stmt->execute([':userId' => $targetUserId]);
		$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		// Get shared items
		$stmt = $pdo->prepare("
			SELECT si.*, u.username as recipient_username, u.email as recipient_email
			FROM shared_items si
			JOIN users u ON u.user_id = si.recipient_id
			WHERE si.owner_id = :userId
		");
		$stmt->execute([':userId' => $targetUserId]);
		$sharedItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		$exportData = [
			'user' => $user,
			'columns' => $columns,
			'tasks' => $tasks,
			'shared_items' => $sharedItems,
			'exported_at' => date('Y-m-d H:i:s'),
			'exported_by_admin' => $adminUserId
		];
		
		// Log admin action
		log_admin_action($pdo, $adminUserId, $targetUserId, 'data_export', 
						null, 'exported', 'Data export requested');
		
		header('Content-Type: application/json');
		header('Content-Disposition: attachment; filename="user_' . $targetUserId . '_data_' . date('Y-m-d') . '.json"');
		echo json_encode($exportData, JSON_PRETTY_PRINT);
		exit;
		
	} catch (Exception $e) {
		log_debug_message("Error in handle_export_user_data: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to export user data.'], 500);
	}
}

/**
 * Get admin dashboard statistics
 */
function handle_get_admin_stats(PDO $pdo, int $adminUserId): void {
	try {
		// User counts by status
		$stmt = $pdo->prepare("
			SELECT status, COUNT(*) as count 
			FROM users 
			GROUP BY status
		");
		$stmt->execute();
		$usersByStatus = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
		
		// User counts by subscription
		$stmt = $pdo->prepare("
			SELECT subscription_level, COUNT(*) as count 
			FROM users 
			GROUP BY subscription_level
		");
		$stmt->execute();
		$usersBySubscription = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
		
		// New registrations last 30 days
		$stmt = $pdo->prepare("
			SELECT COUNT(*) 
			FROM users 
			WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
		");
		$stmt->execute();
		$newUsers30Days = (int)$stmt->fetchColumn();
		
		// Storage usage
		$stmt = $pdo->prepare("SELECT SUM(storage_used_bytes) FROM users");
		$stmt->execute();
		$totalStorageUsed = (int)$stmt->fetchColumn();
		
		// Total items
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE deleted_at IS NULL");
		$stmt->execute();
		$totalColumns = (int)$stmt->fetchColumn();
		
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL");
		$stmt->execute();
		$totalTasks = (int)$stmt->fetchColumn();
		
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM shared_items WHERE item_type = 'task'");
		$stmt->execute();
		$totalShares = (int)$stmt->fetchColumn();
		
		send_json_response([
			'status' => 'success',
			'data' => [
				'users_by_status' => $usersByStatus,
				'users_by_subscription' => $usersBySubscription,
				'new_users_30_days' => $newUsers30Days,
				'total_storage_used_mb' => round($totalStorageUsed / (1024 * 1024), 2),
				'total_columns' => $totalColumns,
				'total_tasks' => $totalTasks,
				'total_shares' => $totalShares
			]
		], 200);
		
	} catch (Exception $e) {
		log_debug_message("Error in handle_get_admin_stats: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to fetch admin statistics.'], 500);
	}
}

/**
 * Get admin action history
 */
function handle_get_admin_actions(PDO $pdo, int $adminUserId): void {
	$page = max(1, (int)($_GET['page'] ?? 1));
	$limit = min(100, max(10, (int)($_GET['limit'] ?? 25)));
	$offset = ($page - 1) * $limit;
	
	try {
		// Get total count
		$countStmt = $pdo->prepare("SELECT COUNT(*) FROM admin_actions");
		$countStmt->execute();
		$totalActions = (int)$countStmt->fetchColumn();
		
		// Get actions with user details
		$stmt = $pdo->prepare("
			SELECT 
				aa.id, aa.action_type, aa.old_value, aa.new_value, aa.reason, aa.created_at,
				admin_user.username as admin_username,
				target_user.username as target_username,
				target_user.email as target_email
			FROM admin_actions aa
			JOIN users admin_user ON admin_user.user_id = aa.admin_user_id
			JOIN users target_user ON target_user.user_id = aa.target_user_id
			ORDER BY aa.created_at DESC
			LIMIT :limit OFFSET :offset
		");
		$stmt->execute([':limit' => $limit, ':offset' => $offset]);
		$actions = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		send_json_response([
			'status' => 'success',
			'data' => [
				'actions' => $actions,
				'pagination' => [
					'current_page' => $page,
					'total_pages' => ceil($totalActions / $limit),
					'total_actions' => $totalActions,
					'per_page' => $limit
				]
			]
		], 200);
		
	} catch (Exception $e) {
		log_debug_message("Error in handle_get_admin_actions: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to fetch admin actions.'], 500);
	}
}

/**
 * Update admin notes for a user
 */
function handle_update_admin_notes(PDO $pdo, int $adminUserId, array $data): void {
	$targetUserId = (int)($data['user_id'] ?? 0);
	$notes = trim($data['admin_notes'] ?? '');
	
	if ($targetUserId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'user_id required.'], 400);
		return;
	}
	
	try {
		$pdo->beginTransaction();
		
		// Get current notes for logging
		$stmt = $pdo->prepare("SELECT admin_notes FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $targetUserId]);
		$currentNotes = $stmt->fetchColumn();
		
		if ($currentNotes === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'User not found.'], 404);
			return;
		}
		
		// Update notes
		$stmt = $pdo->prepare("
			UPDATE users 
			SET admin_notes = :notes
			WHERE user_id = :userId
		");
		$stmt->execute([':notes' => $notes, ':userId' => $targetUserId]);
		
		// Log admin action (using a truncated version for the log)
		$logOldValue = $currentNotes ? (strlen($currentNotes) > 50 ? substr($currentNotes, 0, 50) . '...' : $currentNotes) : null;
		$logNewValue = $notes ? (strlen($notes) > 50 ? substr($notes, 0, 50) . '...' : $notes) : null;
		
		log_admin_action($pdo, $adminUserId, $targetUserId, 'notes_update', 
						$logOldValue, $logNewValue, 'Admin notes updated');
		
		$pdo->commit();
		
		send_json_response([
			'status' => 'success',
			'message' => 'Admin notes updated successfully.'
		], 200);
		
	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_update_admin_notes: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'Failed to update admin notes.'], 500);
	}
}
function log_admin_action(PDO $pdo, int $adminUserId, int $targetUserId, string $actionType, 
						 ?string $oldValue, ?string $newValue, ?string $reason): void {
	try {
		$stmt = $pdo->prepare("
			INSERT INTO admin_actions 
			(admin_user_id, target_user_id, action_type, old_value, new_value, reason)
			VALUES (:adminUserId, :targetUserId, :actionType, :oldValue, :newValue, :reason)
		");
		$stmt->execute([
			':adminUserId' => $adminUserId,
			':targetUserId' => $targetUserId,
			':actionType' => $actionType,
			':oldValue' => $oldValue,
			':newValue' => $newValue,
			':reason' => $reason
		]);
	} catch (Exception $e) {
		error_log("Failed to log admin action: " . $e->getMessage());
	}
}