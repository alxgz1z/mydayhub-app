<?php
/**
 * MyDayHub Beta 5 - Main API Gateway
 *
 * This file is the single entry point for all data-related API calls.
 * It handles session security, request routing, and dispatches to module handlers.
 *
 * @version 5.0.0
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
// Get the authenticated user's ID from the session.
$userId = (int)$_SESSION['user_id'];

// Get module and action from the request (e.g., ?module=tasks&action=getAll).
$module = $_GET['module'] ?? null;
$action = $_GET['action'] ?? null;

if (!$module || !$action) {
	http_response_code(400); // Bad Request
	echo json_encode(['status' => 'error', 'message' => 'Module and action are required.']);
	exit();
}

try {
	$pdo = get_pdo();

	// Route the request to the appropriate module handler.
	switch ($module) {
		case 'tasks':
			// Modified for your file name
			// Require the tasks handler file.
			require_once __DIR__ . '/tasks.php';
			
			// Route to the specific action within the tasks module.
			if ($action === 'getAll') {
				handle_get_all_board_data($pdo, $userId);
			} else {
				http_response_code(404);
				echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."]);
			}
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