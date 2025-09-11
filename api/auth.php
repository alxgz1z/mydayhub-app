<?php
/**
 * MyDayHub Beta 5 - Authentication API
 *
 * Handles user registration, login, and other authentication actions.
 *
 * @version 6.4.0
 * @author Alex & Gemini
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';

if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

$json_data = file_get_contents('php://input');
$input = json_decode($json_data, true);

$action = $_GET['action'] ?? '';

switch ($action) {
	case 'register':
		handle_register($input);
		break;

	case 'login':
		handle_login($input);
		break;
	
	// Modified for Forgot Password
	case 'requestPasswordReset':
		handle_request_password_reset($input);
		break;

	default:
		http_response_code(404);
		echo json_encode(['status' => 'error', 'message' => 'Unknown API action.']);
		break;
}

// Modified for Forgot Password
/**
 * Handles a request to initiate a password reset.
 *
 * @param array|null $data The input data containing the user's email.
 * @return void
 */
function handle_request_password_reset(?array $data): void {
	if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'A valid email address is required.']);
		return;
	}
	
	// We will always return a generic success message to prevent email enumeration.
	$genericSuccessResponse = ['status' => 'success', 'message' => 'If an account with that email exists, a password reset link has been sent.'];

	try {
		$pdo = get_pdo();
		require_once __DIR__ . '/../incs/mailer.php';

		$stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = :email");
		$stmt->execute([':email' => $data['email']]);
		$user = $stmt->fetch();

		if ($user) {
			// User exists, so we proceed with token generation and email sending.
			$userId = (int)$user['user_id'];
			
			// 1. Generate a secure token
			$token = bin2hex(random_bytes(32));
			
			// 2. Hash the token for database storage
			$tokenHash = hash('sha256', $token);
			
			// 3. Set an expiration time (e.g., 1 hour from now)
			$expiresAt = date('Y-m-d H:i:s', time() + 3600);

			// 4. Store the hashed token in the database
			$stmt = $pdo->prepare(
				"INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (:userId, :tokenHash, :expiresAt)"
			);
			$stmt->execute([
				':userId' => $userId,
				':tokenHash' => $tokenHash,
				':expiresAt' => $expiresAt
			]);

			// 5. Send the email with the raw token
			send_password_reset_email($data['email'], $token);
		}
		
		// Important: Always send the same response whether the user was found or not.
		http_response_code(200);
		echo json_encode($genericSuccessResponse);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in auth.php handle_request_password_reset(): ' . $e->getMessage());
		}
		// In case of a server or mailer error, we STILL send a generic success response to the user.
		// This prevents leaking information about the state of our server.
		http_response_code(200);
		echo json_encode($genericSuccessResponse);
	}
}

/**
 * Handles the user registration process.
 *
 * @param array|null $data The input data from the client (username, email, password).
 * @return void
 */
function handle_register(?array $data): void {
	if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
		http_response_code(400);
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
		$stmt->execute([':username' => $data['username'], ':email' => $data['email']]);

		if ($stmt->fetch()) {
			http_response_code(409);
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
		$stmt->execute([':username' => $data['username'], ':email' => $data['email'], ':password_hash' => $password_hash]);

		http_response_code(201);
		echo json_encode(['status' => 'success', 'message' => 'Registration successful! You can now log in.']);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in auth.php handle_register(): ' . $e->getMessage());
		}
		http_response_code(500);
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
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Username and password are required.']);
		return;
	}

	try {
		$pdo = get_pdo();

		$stmt = $pdo->prepare("SELECT user_id, username, password_hash FROM users WHERE username = :username");
		$stmt->execute([':username' => $data['username']]);
		$user = $stmt->fetch();

		if (!$user || !password_verify($data['password'], $user['password_hash'])) {
			http_response_code(401);
			echo json_encode(['status' => 'error', 'message' => 'Invalid credentials.']);
			return;
		}

		session_regenerate_id(true);

		$_SESSION['user_id'] = $user['user_id'];
		$_SESSION['username'] = $user['username'];

		http_response_code(200);
		echo json_encode(['status' => 'success', 'message' => 'Login successful!']);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in auth.php handle_login(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred. Please try again later.']);
	}
}