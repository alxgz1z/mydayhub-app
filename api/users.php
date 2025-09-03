<?php
/**
 * MyDayHub Beta 5 - Users Module Handler
 *
 * Contains all business logic for user-related API actions,
 * such as managing preferences.
 *
 * @version 5.1.0
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

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in users module."]);
			break;
	}
}

/**
 * Saves a single key-value pair to the user's preferences JSON blob.
 */
function handle_save_user_preference(PDO $pdo, int $userId, ?array $data): void {
	$key = isset($data['key']) ? (string)$data['key'] : '';
	// We check for `isset` but not `empty` because the value could legitimately be 0, false, or an empty string.
	if ($key === '' || !isset($data['value'])) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'A preference key and value are required.']);
		return;
	}
	$value = $data['value'];

	try {
		$pdo->beginTransaction();

		// Lock the row for update to prevent race conditions
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

		// If JSON is invalid or null, start with a fresh array
		if (json_last_error() !== JSON_ERROR_NONE) {
			$prefs = [];
		}

		// Update the specific key with the new value
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