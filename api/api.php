<?php
/**
 * MyDayHub Beta 5 - Main API Gateway
 *
 * This file is the single entry point for all data-related API calls.
 * It handles session security, request routing, and dispatches to module handlers.
 *
 * @version 6.6.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

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

try {
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

		default:
			send_json_response(['status' => 'error', 'message' => "Module '{$module}' not found."], 404);
			break;
	}
} catch (Exception $e) {
	// Modified for In-Browser Debugging: Log the exception before sending the response.
	log_debug_message("API Gateway Exception: " . $e->getMessage());
	send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
}