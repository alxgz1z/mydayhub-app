<?php
/**
 * Code for /api/api.php
 *
 * Signal - Main API Gateway
 *
 * This file is the single entry point for all data-related API calls.
 * It handles error logging, session security, request routing, and dispatches to module handlers.
 *
 * @version 8.5 Avellanas
 * @author Alex & Gemini & Claude & Cursor
 */

declare(strict_types=1);

// --- ERROR HANDLING SETUP ---
ini_set("log_errors", "1");
ini_set("error_log", "/tmp/php_app.log");
error_reporting(E_ALL);
ob_start();

try {
	// --- BOOTSTRAP ---
	// config.php sets up error handling and the debug message collector.
	require_once __DIR__ . '/../incs/config.php';
	require_once __DIR__ . '/../incs/db.php';
	// Modified for Debugging Hardening: Include the global helpers file.
	require_once __DIR__ . '/../incs/helpers.php';

	// --- SESSION SECURITY ---
	if (session_status() === PHP_SESSION_NONE) {
		session_start();
	}

	if (!isset($_SESSION['user_id'])) {
		send_json_response(['status' => 'error', 'message' => 'Authentication required.'], 401);
	}

	// --- ROUTING ---
	$userId = (int)$_SESSION['user_id'];
	$method = $_SERVER['REQUEST_METHOD'];
	$data = [];

	if ($method === 'GET') {
		$module = $_GET['module'] ?? null;
		$action = $_GET['action'] ?? null;
		$data = $_GET; // Pass all GET parameters as data
	} elseif ($method === 'POST') {
		$csrf_token_header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
		if (!isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrf_token_header)) {
			send_json_response(['status' => 'error', 'message' => 'Invalid or missing CSRF token.'], 403);
		}

		$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

		if (stripos($contentType, 'application/json') !== false) {
			$json_data = file_get_contents('php://input');
			$input = json_decode($json_data, true) ?: [];
			$module = $input['module'] ?? null;
			$action = $input['action'] ?? null;
			$data = $input['data'] ?? $input;

		} elseif (stripos($contentType, 'multipart/form-data') !== false) {
			$module = $_POST['module'] ?? null;
			$action = $_POST['action'] ?? null;
			$data = $_POST['data'] ?? [];
			if (is_string($data)) {
				$decodedData = json_decode($data, true);
				if (json_last_error() === JSON_ERROR_NONE) {
					$data = $decodedData;
				}
			}
		} else {
			send_json_response(['status' => 'error', 'message' => 'Unsupported content type.'], 415);
		}
	} else {
		send_json_response(['status' => 'error', 'message' => 'Method not allowed.'], 405);
	}

	if (!$module || !$action) {
		send_json_response(['status' => 'error', 'message' => 'Module and action are required.'], 400);
	}

	// --- MODULE ROUTING ---
	$pdo = get_pdo();

	switch ($module) {
		case 'tasks':
			require_once __DIR__ . '/tasks.php';
			handle_tasks_action($action, $method, $pdo, $userId, $data);
			break;

		case 'users':
			require_once __DIR__ . '/users.php';
			handle_users_action($action, $method, $pdo, $userId, $data);
			break;

        case 'calendar_events':
            require_once __DIR__ . '/calevents.php';
            handle_calendar_events_action($action, $method, $pdo, $userId, $data);
            break;

        case 'calendar_preferences':
            require_once __DIR__ . '/calprefs.php';
            handle_calendar_preferences_action($action, $method, $pdo, $userId, $data);
            break;

		case 'security_questions':
			require_once __DIR__ . '/secquestions.php';
			$result = handle_security_questions_action($action, $method, $pdo, $userId, $data);
			send_json_response($result);
			break;

		case 'encryption':
			require_once __DIR__ . '/encryption.php';
			$result = handle_encryption_action($action, $method, $pdo, $userId, $data);
			send_json_response($result);
			break;

		case 'journal':
			require_once __DIR__ . '/journal.php';
			$result = handle_journal_action($action, $method, $pdo, $userId, $data);
			send_json_response($result);
			break;

		case 'storyboards':
			require_once __DIR__ . '/../incs/sb_access.php';
			require_once __DIR__ . '/storyboards.php';
			// The module speaks in participants, not user ids, because a
			// codeword guest arriving at /sb/api.php has no account. An account
			// gets its participant row here, on first use.
			$actor = sb_participant_for_user($pdo, $userId);
			$result = handle_storyboards_action($action, $method, $pdo, $actor, $data);
			$httpCode = $result['http_code'] ?? 200;
			unset($result['http_code']);
			send_json_response($result, (int)$httpCode);
			break;

		default:
			send_json_response(['status' => 'error', 'message' => "Module '{$module}' not found."], 404);
			break;
	}

} catch (Throwable $e) {
	// Modified for In-Browser Debugging: Log the exception before sending the response.
	log_debug_message("API Gateway Exception: " . $e->getMessage());
	
	// Error handling from original wrapper
	http_response_code(500);
	header("Content-Type: application/json");
	$out = [
		"status"  => "error",
		"where"   => "api.php",
		"type"    => get_class($e),
		"message" => $e->getMessage(),
		"file"    => $e->getFile(),
		"line"    => $e->getLine()
	];
	echo json_encode($out);
	error_log("API500: ".$e->getMessage()." @ ".$e->getFile().":".$e->getLine());
	if (ob_get_level()) { ob_end_flush(); }
}