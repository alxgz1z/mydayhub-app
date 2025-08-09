<?php
/**
 * MyDayHub 4.0.0 Beta - Tasks API Endpoint
 *
 * This file is the central API for all CRUD (Create, Read, Update, Delete)
 * operations related to tasks. It receives requests from the client-side
 * JavaScript, interacts with the database, and returns JSON responses.
 */

// Set the content type of the response to JSON
header('Content-Type: application/json');

// Load the core application configuration and database connection.
// The __DIR__ ensures the path is always correct, regardless of where this script is called from.
require_once __DIR__ . '/../includes/config.php';

// A simple routing mechanism based on the HTTP request method.
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
	case 'GET':
		// Handles fetching tasks. E.g., loading all tasks for the board.
		http_response_code(200);
		echo json_encode(['status' => 'success', 'message' => 'GET request received. Ready to fetch tasks.']);
		break;

	case 'POST':
		// Handles creating a new task.
		http_response_code(200);
		echo json_encode(['status' => 'success', 'message' => 'POST request received. Ready to create a task.']);
		break;

	case 'PUT':
		// UPDATED: This now handles updating an existing task.
		
		// Get the raw POST data from the request body
		$putdata = file_get_contents('php://input');
		// Decode the JSON data into a PHP associative array
		$data = json_decode($putdata, true);

		// --- Data Validation (Basic) ---
		// For now, we just check if the essential data exists.
		if (!isset($data['taskId']) || !isset($data['notes']) || !isset($data['dueDate'])) {
			http_response_code(400); // Bad Request
			echo json_encode(['status' => 'error', 'message' => 'Missing required task data.']);
			exit;
		}

		$taskId = $data['taskId'];
		$notes = $data['notes'];
		$dueDate = $data['dueDate'];

		// --- Database Logic (Placeholder) ---
		// In the next step, we will add the actual code here to
		// update the task in the database.
		
		// For now, we will just echo the received data back to the client
		// to confirm that the entire round trip was successful.
		$response = [
			'status' => 'success',
			'message' => 'Task data received successfully. Database update pending.',
			'received_data' => $data
		];

		http_response_code(200);
		echo json_encode($response);
		break;

	case 'DELETE':
		// Handles deleting a task.
		http_response_code(200);
		echo json_encode(['status' => 'success', 'message' => 'DELETE request received. Ready to delete a task.']);
		break;

	default:
		// Handle any other methods or invalid requests.
		http_response_code(405); // Method Not Allowed
		echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
		break;
}