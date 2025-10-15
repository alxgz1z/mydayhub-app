<?php
/**
 * Code for /api/users.php
 *
 * MyDayHub - Users Module Handler
 *
 * Contains all business logic for user-related API actions,
 * such as managing preferences.
 *
 * @version 8.1 Tamarindo
 * @author Alex & Gemini & Claude & Cursor
 */

declare(strict_types=1);

/**
 * Main router for all actions within the 'users' module.
 */
function handle_users_action(string $action, string $method, PDO $pdo, int $userId, array $data): void {
	switch ($action) {
		case 'saveUserPreference':
			if ($method === 'POST') {
				handle_save_user_preference($pdo, $userId, $data);
			}
			break;
		
		case 'getUserPreferences':
			if ($method === 'GET' || $method === 'POST') {
				handle_get_user_preferences($pdo, $userId);
			}
			break;
		
		// Modified for Change Password
		case 'changePassword':
			if ($method === 'POST') {
				handle_change_password($pdo, $userId, $data);
			}
			break;
			
		case 'getUserUsageStats':
		if ($method === 'POST') {
			handle_get_user_usage_stats($pdo, $userId);
		}
		break;

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in users module."]);
			break;
	}
}

// Modified for Change Password
/**
 * Handles a password change request for the currently authenticated user.
 */
function handle_change_password(PDO $pdo, int $userId, ?array $data): void {
	$currentPassword = $data['current_password'] ?? '';
	$newPassword = $data['new_password'] ?? '';

	if (empty($currentPassword) || empty($newPassword)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'All password fields are required.']);
		return;
	}

	if (strlen($newPassword) < 8) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'New password must be at least 8 characters long.']);
		return;
	}

	try {
		// 1. Fetch the current user's hashed password
		$stmt = $pdo->prepare("SELECT password_hash FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $userId]);
		$user = $stmt->fetch(PDO::FETCH_ASSOC);

		if (!$user) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'User not found.']);
			return;
		}

		// 2. Verify the provided current password against the stored hash
		if (!password_verify($currentPassword, $user['password_hash'])) {
			http_response_code(401); // Unauthorized
			echo json_encode(['status' => 'error', 'message' => 'Incorrect current password.']);
			return;
		}
		
		// 3. Hash the new password
		$newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);

		// 4. Update the user's record with the new hash
		$stmt = $pdo->prepare("UPDATE users SET password_hash = :newHash WHERE user_id = :userId");
		$stmt->execute([
			':newHash' => $newPasswordHash,
			':userId' => $userId
		]);

		http_response_code(200);
		echo json_encode(['status' => 'success', 'message' => 'Password changed successfully.']);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in users.php handle_change_password(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while changing the password.']);
	}
}


/**
 * Retrieves all user preferences as a JSON object.
 */
function handle_get_user_preferences(PDO $pdo, int $userId): void {
	try {
		// Check if preferences column exists, if not return empty preferences
		$stmt = $pdo->prepare("SELECT preferences FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $userId]);
		$result = $stmt->fetch(PDO::FETCH_ASSOC);

		if ($result === false) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'User not found.']);
			return;
		}

		$prefsJson = $result['preferences'] ?? '{}';
		$prefs = json_decode($prefsJson, true);

		if (json_last_error() !== JSON_ERROR_NONE || !is_array($prefs)) {
			$prefs = [];
		}

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => $prefs]);

	} catch (PDOException $e) {
		// If preferences column doesn't exist, return empty preferences instead of error
		if (strpos($e->getMessage(), 'Unknown column') !== false) {
			http_response_code(200);
			echo json_encode(['status' => 'success', 'data' => []]);
			return;
		}
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in users.php handle_get_user_preferences(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while retrieving preferences.']);
	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in users.php handle_get_user_preferences(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while retrieving preferences.']);
	}
}

/**
 * Saves a single key-value pair to the user's preferences JSON blob.
 */
function handle_save_user_preference(PDO $pdo, int $userId, ?array $data): void {
	$key = isset($data['key']) ? (string)$data['key'] : '';
	if ($key === '' || !isset($data['value'])) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'A preference key and value are required.']);
		return;
	}
	$value = $data['value'];

	try {
		$pdo->beginTransaction();

		$stmt_find = $pdo->prepare("SELECT preferences FROM users WHERE user_id = :userId FOR UPDATE");
		$stmt_find->execute([':userId' => $userId]);
		$result = $stmt_find->fetch(PDO::FETCH_ASSOC);

		if ($result === false) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'User not found.']);
			return;
		}

		$currentPrefsJson = $result['preferences'] ?? '{}';
		$prefs = json_decode($currentPrefsJson, true);

		if (json_last_error() !== JSON_ERROR_NONE || !is_array($prefs)) {
			$prefs = [];
		}

		$prefs[$key] = $value;
		$newPrefsJson = json_encode($prefs);

		$stmt_update = $pdo->prepare("UPDATE users SET preferences = :preferences WHERE user_id = :userId");
		$stmt_update->execute([
			':preferences' => $newPrefsJson,
			':userId'      => $userId
		]);

		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success', 'message' => "Preference '{$key}' saved."]);

	} catch (PDOException $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		// If preferences column doesn't exist, silently succeed (can't save without column)
		if (strpos($e->getMessage(), 'Unknown column') !== false) {
			http_response_code(200);
			echo json_encode(['status' => 'success', 'message' => "Preference '{$key}' saved (localStorage only)."]);
			return;
		}
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in users.php handle_save_user_preference(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while saving the preference.']);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in users.php handle_save_user_preference(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while saving the preference.']);
	}
}

// Add this function to check if current user is admin
function handle_check_admin_status(PDO $pdo, int $userId): void {
	$isAdmin = is_admin_user($userId);
	
	send_json_response([
		'status' => 'success',
		'data' => ['is_admin' => $isAdmin]
	], 200);
}

/**
 * Modified for Subscription Usage Modal - Get user's current usage statistics
 * Returns subscription limits and current usage for tasks, columns, storage, and sharing
 */
function handle_get_user_usage_stats(PDO $pdo, int $userId): void {
	try {
		// Get user subscription level and calculate limits
		$stmt = $pdo->prepare("SELECT subscription_level, storage_used_bytes FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $userId]);
		$userData = $stmt->fetch(PDO::FETCH_ASSOC);
		
		if (!$userData) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'User not found.']);
			return;
		}
		
		$subscriptionLevel = $userData['subscription_level'] ?? 'free';
		$storageUsed = (int)($userData['storage_used_bytes'] ?? 0);
		
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
		
		$userLimits = $limits[$subscriptionLevel] ?? $limits['free'];
		
		// Get current usage counts
		$stmtColumns = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL");
		$stmtColumns->execute([':userId' => $userId]);
		$columnsUsed = (int)$stmtColumns->fetchColumn();
		
		$stmtTasks = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE user_id = :userId AND deleted_at IS NULL");
		$stmtTasks->execute([':userId' => $userId]);
		$tasksUsed = (int)$stmtTasks->fetchColumn();
		
		// Convert storage to MB for display
		$storageLimitMB = $userLimits['storage_mb'];
		$storageUsedMB = round($storageUsed / (1024 * 1024), 2);
		
		// Calculate percentages
		$columnsPercentage = ($userLimits['max_columns'] > 0) ? round(($columnsUsed / $userLimits['max_columns']) * 100, 1) : 0;
		$tasksPercentage = ($userLimits['max_tasks'] > 0) ? round(($tasksUsed / $userLimits['max_tasks']) * 100, 1) : 0;
		$storagePercentage = ($storageLimitMB > 0) ? round(($storageUsedMB / $storageLimitMB) * 100, 1) : 0;
		
		http_response_code(200);
		echo json_encode([
			'status' => 'success',
			'data' => [
				'subscription_level' => strtoupper($subscriptionLevel),
				'usage' => [
					'columns' => [
						'used' => $columnsUsed,
						'limit' => $userLimits['max_columns'],
						'percentage' => $columnsPercentage
					],
					'tasks' => [
						'used' => $tasksUsed,
						'limit' => $userLimits['max_tasks'],
						'percentage' => $tasksPercentage
					],
					'storage' => [
						'used_mb' => $storageUsedMB,
						'limit_mb' => $storageLimitMB,
						'percentage' => $storagePercentage
					]
				],
				'features' => [
					'sharing_enabled' => $userLimits['sharing_enabled']
				]
			]
		]);
		
	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in users.php handle_get_user_usage_stats(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while fetching usage statistics.']);
	}
}