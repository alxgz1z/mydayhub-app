<?php
/**
 * MyDayHub Beta 5 - Main API Gateway
 *
 * This file is the single entry point for all data-related API calls.
 * It handles session security, request routing, and dispatches to module handlers.
 *
 * @version 5.9.2
 * @author Alex & Gemini
 */

declare(strict_types=1);

// Set the content type to JSON for all responses.
header('Content-Type: application/json');

// --- BOOTSTRAP ---
require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';

// --- SESSION SECURITY ---
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

// Protect the entire API. No user ID in session means they are not logged in.
if (!isset($_SESSION['user_id'])) {
	http_response_code(401); // Unauthorized
	echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
	exit();
}

// --- ROUTING ---
$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$data = [];

if ($method === 'GET') {
	$module = $_GET['module'] ?? null;
	$action = $_GET['action'] ?? null;
} elseif ($method === 'POST') {
	// Modified for CSRF Validation
	// For all POST (mutating) requests, we must validate the CSRF token.
	$csrf_token_header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
	if (!isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrf_token_header)) {
		http_response_code(403); // Forbidden
		echo json_encode(['status' => 'error', 'message' => 'Invalid or missing CSRF token. Please refresh the page.']);
		exit();
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
		http_response_code(415); // Unsupported Media Type
		echo json_encode(['status' => 'error', 'message' => 'Unsupported content type for POST requests.']);
		exit();
	}
} else {
	http_response_code(405); // Method Not Allowed
	echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
	exit();
}


if (!$module || !$action) {
	http_response_code(400); // Bad Request
	echo json_encode(['status' => 'error', 'message' => 'Module and action are required.']);
	exit();
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
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Module '{$module}' not found."]);
			break;
	}
} catch (Exception $e) {
	if (defined('DEVMODE') && DEVMODE) {
		error_log("API Gateway Error: " . $e->getMessage());
	}
	http_response_code(500);
	echo json_encode(['status' => 'error', 'message' => 'An internal server error occurred.']);
}