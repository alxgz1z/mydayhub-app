<?php
/**
 * MyDayHub Beta 5 - Authentication API
 *
 * Handles user registration, login, and other authentication actions.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */

// TEMPORARY DEBUGGING: Force display of errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set the content type to JSON for all responses.
header('Content-Type: application/json');

// --- BOOTSTRAP ---
require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';

// --- SESSION MANAGEMENT ---
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

// --- INPUT HANDLING ---
$json_data = file_get_contents('php://input');
$input = json_decode($json_data, true);

// --- ROUTING ---
$action = $_GET['action'] ?? '';

switch ($action) {
	case 'register':
		handle_register($input);
		break;

	case 'login':
		handle_login($input);
		break;

	default:
		http_response_code(404);
		echo json_encode(['status' => 'error', 'message' => 'Unknown API action.']);
		break;
}

/**
 * Handles the user registration process.
 *
 * @param array|null $data The input data from the client (username, email, password).
 * @return void
 */
function handle_register(?array $data): void {
	if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
		http_response_code(400); // Bad Request
		echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
		return;
	}

	if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Please provide a valid email address.']);
		return;
	}

	if (strlen($data['password']) < 8) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Password must be at least 8 characters long.']);
		return;
	}

	try {
		$pdo = get_pdo();

		$stmt = $pdo->prepare("SELECT user_id FROM users WHERE username = :username OR email = :email");
		$stmt->execute([
			':username' => $data['username'],
			':email' => $data['email']
		]);

		if ($stmt->fetch()) {
			http_response_code(409); // Conflict
			echo json_encode(['status' => 'error', 'message' => 'Username or email is already taken.']);
			return;
		}

		$password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
		if ($password_hash === false) {
			 throw new Exception('Password hashing failed.');
		}

		$stmt = $pdo->prepare(
			"INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)"
		);
		$stmt->execute([
			':username' => $data['username'],
			':email' => $data['email'],
			':password_hash' => $password_hash
		]);

		http_response_code(201); // Created
		echo json_encode(['status' => 'success', 'message' => 'Registration successful! You can now log in.']);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in auth.php handle_register(): ' . $e->getMessage());
		}
		http_response_code(500); // Internal Server Error
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred. Please try again later.']);
	}
}


/**
 * Handles the user login process.
 *
 * @param array|null $data The input data from the client (username, password).
 * @return void
 */
function handle_login(?array $data): void {
	if (empty($data['username']) || empty($data['password'])) {
		http_response_code(400); // Bad Request
		echo json_encode(['status' => 'error', 'message' => 'Username and password are required.']);
		return;
	}

	try {
		$pdo = get_pdo();

		$stmt = $pdo->prepare("SELECT user_id, username, password_hash FROM users WHERE username = :username");
		$stmt->execute([':username' => $data['username']]);
		$user = $stmt->fetch();

		if (!$user || !password_verify($data['password'], $user['password_hash'])) {
			http_response_code(401); // Unauthorized
			echo json_encode(['status' => 'error', 'message' => 'Invalid credentials.']);
			return;
		}

		session_regenerate_id(true);

		$_SESSION['user_id'] = $user['user_id'];
		$_SESSION['username'] = $user['username'];

		http_response_code(200); // OK
		echo json_encode(['status' => 'success', 'message' => 'Login successful!']);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in auth.php handle_login(): ' . $e->getMessage());
		}
		http_response_code(500); // Internal Server Error
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred. Please try again later.']);
	}
}