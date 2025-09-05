<?php
/**
 * MyDayHub Beta 5 - Main API Gateway
 *
 * This file is the single entry point for all data-related API calls.
 * It handles session security, request routing, and dispatches to module handlers.
 *
 * @version 5.1.3
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
	// Modified for Case-Insensitive Header Check
	$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

	if (stripos($contentType, 'application/json') !== false) {
		// Standard JSON request
		$json_data = file_get_contents('php://input');
		$input = json_decode($json_data, true);
		$module = $input['module'] ?? null;
		$action = $input['action'] ?? null;
		$data = $input['data'] ?? [];
	} elseif (stripos($contentType, 'multipart/form-data') !== false) {
		// File upload request
		$module = $_POST['module'] ?? null;
		$action = $_POST['action'] ?? null;
		// The handler will access the actual file data from $_FILES.
		// Other non-file data can be passed in the 'data' field.
		$data = $_POST['data'] ?? [];
		// If 'data' is sent as a JSON string (a common practice), decode it.
		if (is_string($data)) {
			$decodedData = json_decode($data, true);
			if (json_last_error() === JSON_ERROR_NONE) {
				$data = $decodedData;
			}
		}
	} else {
		// Unsupported content type for POST requests
		http_response_code(415); // Unsupported Media Type
		echo json_encode(['status' => 'error', 'message' => 'Unsupported content type for POST requests.']);
		exit();
	}
	// End of modification
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
	if (defined('DEV_MODE') && DEV_MODE) {
		error_log("API Gateway Error: " . $e->getMessage());
	}
	http_response_code(500);
	echo json_encode(['status' => 'error', 'message' => 'An internal server error occurred.']);
}