<?php
/**
 * Code for /api/users.php
 *
 * MyDayHub - Users Module Handler
 *
 * Contains all business logic for user-related API actions,
 * such as managing preferences.
 *
 * @version 7.3.0 
 * @author Alex & Gemini
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
		
		// Modified for Change Password
		case 'changePassword':
			if ($method === 'POST') {
				handle_change_password($pdo, $userId, $data);
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

		$currentPrefsJson = $result['preferences'];
		$prefs = json_decode($currentPrefsJson, true);

		if (json_last_error() !== JSON_ERROR_NONE) {
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