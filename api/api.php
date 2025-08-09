<?php
/**
 * MyDayHub v4.0.0
 * Main API Gateway (Single Pipe)
 *
 * All frontend requests are sent to this single endpoint.
 * This script routes requests to the appropriate module handler.
 */

// This will be replaced by a real session handler later.
$userId = 1; 

// Load the core application configuration and database connection.
// The custom error handler in config.php will manage any errors from here.
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php'; // Establishes $pdo connection

// Set the content type to JSON for all responses
header('Content-Type: application/json');

// --- Main Request Handling ---

// Get the raw POST data from the request body
$request_body = file_get_contents('php://input');
$payload = json_decode($request_body, true);

// Validate the payload
if (json_last_error() !== JSON_ERROR_NONE || !isset($payload['module']) || !isset($payload['action'])) {
	http_response_code(400); // Bad Request
	echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload or missing module/action.']);
	exit;
}

$module = $payload['module'];
$action = $payload['action'];
$data = $payload['data'] ?? []; // Optional data for the action

// Route to the appropriate module handler
switch ($module) {
	case 'tasks':
		// Load the handler for task-related actions
		require_once __DIR__ . '/modules/tasks.handler.php';
		// Call the appropriate function within the handler
		handle_tasks_action($action, $data, $pdo, $userId);
		break;

	// We can add more cases here later (e.g., 'journal', 'users')

	default:
		http_response_code(404); // Not Found
		echo json_encode(['status' => 'error', 'message' => "Module '{$module}' not found."]);
		break;
}