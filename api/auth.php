<?php
/**
 * Code for /api/auth.php
 *
 * MyDayHub - Authentication API
 *
 * Handles user registration, login, and other authentication actions.
 *
 * @version 6.5.2-debug-complete
 * @author Alex & Gemini
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';
require_once __DIR__ . '/../incs/mailer.php';

if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

/**
 * Helper function to send JSON responses with debug info when in DEVMODE
 */
function send_debug_response(array $data, int $http_code = 200): void {
	global $__DEBUG_MESSAGES__;
	if (DEVMODE && !empty($__DEBUG_MESSAGES__)) {
		$data['debug'] = $__DEBUG_MESSAGES__;
	}
	http_response_code($http_code);
	header('Content-Type: application/json');
	echo json_encode($data);
	exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = null;
$input = [];

if ($method === 'POST') {
	$input = json_decode(file_get_contents('php://input'), true) ?? [];
	$action = $input['action'] ?? null;
} else {
	$action = $_GET['action'] ?? null;
}


switch ($action) {
	case 'register':
		handle_register($input);
		break;
	case 'login':
		handle_login($input);
		break;
	case 'requestPasswordReset':
		handle_request_password_reset($input);
		break;
	case 'performPasswordReset':
		handle_perform_password_reset($input);
		break;
	default:
		http_response_code(404);
		echo json_encode(['status' => 'error', 'message' => 'Unknown API action.']);
		break;
}


/**
 * Handles the final step of the password reset process.
 */
function handle_perform_password_reset(?array $data): void {
	$token = $data['token'] ?? '';
	$newPassword = $data['new_password'] ?? '';
	$confirmPassword = $data['confirm_password'] ?? '';

	if (empty($token) || empty($newPassword) || empty($confirmPassword)) {
		send_debug_response(['status' => 'error', 'message' => 'All fields are required.'], 400);
		return;
	}
	if ($newPassword !== $confirmPassword) {
		send_debug_response(['status' => 'error', 'message' => 'Passwords do not match.'], 400);
		return;
	}
	if (strlen($newPassword) < 8) {
		send_debug_response(['status' => 'error', 'message' => 'Password must be at least 8 characters long.'], 400);
		return;
	}

	try {
		$pdo = get_pdo();
		$pdo->beginTransaction();

		$tokenHash = hash('sha256', $token);
		
		$stmt = $pdo->prepare(
			"SELECT user_id, expires_at FROM password_resets WHERE token_hash = :tokenHash"
		);
		$stmt->execute([':tokenHash' => $tokenHash]);
		$resetRequest = $stmt->fetch();

		if (!$resetRequest || strtotime($resetRequest['expires_at']) < time()) {
			if ($resetRequest) {
				$stmt_delete = $pdo->prepare("DELETE FROM password_resets WHERE token_hash = :tokenHash");
				$stmt_delete->execute([':tokenHash' => $tokenHash]);
			}
			$pdo->commit();
			send_debug_response(['status' => 'error', 'message' => 'This reset link is invalid or has expired. Please request a new one.'], 400);
			return;
		}

		$userId = (int)$resetRequest['user_id'];
		
		$newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
		
		$stmt_update = $pdo->prepare("UPDATE users SET password_hash = :passwordHash WHERE user_id = :userId");
		$stmt_update->execute([
			':passwordHash' => $newPasswordHash,
			':userId' => $userId
		]);

		$stmt_delete = $pdo->prepare("DELETE FROM password_resets WHERE user_id = :userId");
		$stmt_delete->execute([':userId' => $userId]);

		$pdo->commit();

		send_debug_response(['status' => 'success', 'message' => 'Your password has been reset successfully. You can now log in.'], 200);

	} catch (Exception $e) {
		if (isset($pdo) && $pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in handle_perform_password_reset: ' . $e->getMessage());
		}
		send_debug_response(['status' => 'error', 'message' => 'A server error occurred. Please try again.'], 500);
	}
}


/**
 * Handles a request to initiate a password reset.
 */
// Modified for Complete Debug System Integration
function handle_request_password_reset(?array $data): void {
	error_log('DIRECT ERROR LOG: Password reset function called');
	log_debug_message('--- DEBUG: handle_request_password_reset CALLED ---');

	if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
		log_debug_message('DEBUG: Invalid or empty email provided. Exiting.');
		send_debug_response(['status' => 'error', 'message' => 'A valid email address is required.'], 400);
		return;
	}
	
	log_debug_message("DEBUG: Email validated: {$data['email']}");
	$genericSuccessResponse = ['status' => 'success', 'message' => 'If an account with that email exists, a password reset link has been sent.'];

	try {
		log_debug_message('DEBUG: Inside try block. Getting PDO connection.');
		$pdo = get_pdo();
		log_debug_message('DEBUG: PDO connection successful.');
		
		$stmt = $pdo->prepare("SELECT user_id, username FROM users WHERE email = :email");
		log_debug_message('DEBUG: Prepared statement to find user by email.');
		$stmt->execute([':email' => $data['email']]);
		log_debug_message('DEBUG: Executed statement to find user.');
		$user = $stmt->fetch();

		if ($user) {
			log_debug_message("DEBUG: User found with ID: {$user['user_id']}");
			$userId = (int)$user['user_id'];
			$username = $user['username'];
			
			$token = bin2hex(random_bytes(32));
			$tokenHash = hash('sha256', $token);
			$expiresAt = date('Y-m-d H:i:s', time() + 3600);
			log_debug_message('DEBUG: Token generated and hashed.');

			$pdo->beginTransaction();
			log_debug_message('DEBUG: Began database transaction.');
			
			$stmt_invalidate = $pdo->prepare("DELETE FROM password_resets WHERE user_id = :userId");
			$stmt_invalidate->execute([':userId' => $userId]);
			log_debug_message('DEBUG: Invalidated old tokens.');

			$stmt = $pdo->prepare(
				"INSERT INTO password_resets (user_id, token_hash, expires_at, created_at) VALUES (:userId, :tokenHash, :expiresAt, UTC_TIMESTAMP())"
			);
			$stmt->execute([
				':userId' => $userId,
				':tokenHash' => $tokenHash,
				':expiresAt' => $expiresAt
			]);
			log_debug_message('DEBUG: Inserted new token into password_resets table.');

			send_password_reset_email($data['email'], $username, $token);
			log_debug_message('DEBUG: Called send_password_reset_email function.');

			$pdo->commit();
			log_debug_message('DEBUG: Committed transaction.');
		} else {
			log_debug_message("DEBUG: No user found for email {$data['email']}. Proceeding without error.");
		}
		
		log_debug_message('DEBUG: About to send generic success response.');
		send_debug_response($genericSuccessResponse, 200);

	} catch (Exception $e) {
		log_debug_message('--- CATCH BLOCK EXCEPTION --- : ' . $e->getMessage());
		if (isset($pdo) && $pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			send_debug_response(['status' => 'error', 'message' => 'Failed to process reset request: ' . $e->getMessage()], 500);
			return;
		}
		send_debug_response($genericSuccessResponse, 200);
	}
}


/**
 * Constructs and sends the password reset email.
 */
function send_password_reset_email(string $email, string $username, string $token): void {
	$resetLink = APP_URL . '/login/reset-password.php?token=' . urlencode($token);
	$subject = 'Your MyDayHub Password Reset Request';
	$htmlBody = "
		<div style='font-family: sans-serif; line-height: 1.6;'>
			<h2>Password Reset for MyDayHub</h2>
			<p>Hello {$username},</p>
			<p>We received a request to reset your password. If you did not make this request, you can safely ignore this email.</p>
			<p>To reset your password, please click the link below:</p>
			<p style='margin: 20px 0;'>
				<a href='{$resetLink}' style='background-color: #8ab4f8; color: #202124; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>
					Reset Your Password
				</a>
			</p>
			<p>This link is valid for one hour.</p>
			<p>Thanks,<br>The MyDayHub Team</p>
		</div>
	";
	send_email($email, $username, $subject, $htmlBody);
}


/**
 * Handles the user registration process.
 */
function handle_register(?array $data): void {
	if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
		send_debug_response(['status' => 'error', 'message' => 'All fields are required.'], 400);
		return;
	}
	if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
		send_debug_response(['status' => 'error', 'message' => 'Please provide a valid email address.'], 400);
		return;
	}
	if (strlen($data['password']) < 8) {
		send_debug_response(['status' => 'error', 'message' => 'Password must be at least 8 characters long.'], 400);
		return;
	}
	try {
		$pdo = get_pdo();
		$stmt = $pdo->prepare("SELECT user_id FROM users WHERE username = :username OR email = :email");
		$stmt->execute([':username' => $data['username'], ':email' => $data['email']]);
		if ($stmt->fetch()) {
			send_debug_response(['status' => 'error', 'message' => 'Username or email is already taken.'], 409);
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
		send_debug_response(['status' => 'success', 'message' => 'Registration successful! You can now log in.'], 201);
	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in auth.php handle_register(): ' . $e->getMessage());
		}
		send_debug_response(['status' => 'error', 'message' => 'A server error occurred. Please try again later.'], 500);
	}
}


/**
 * Handles the user login process.
 */
function handle_login(?array $data): void {
	if (empty($data['username']) || empty($data['password'])) {
		send_debug_response(['status' => 'error', 'message' => 'Username and password are required.'], 400);
		return;
	}
	try {
		$pdo = get_pdo();
		$stmt = $pdo->prepare("SELECT user_id, username, password_hash FROM users WHERE username = :username");
		$stmt->execute([':username' => $data['username']]);
		$user = $stmt->fetch();
		if (!$user || !password_verify($data['password'], $user['password_hash'])) {
			send_debug_response(['status' => 'error', 'message' => 'Invalid credentials.'], 401);
			return;
		}
		session_regenerate_id(true);
		$_SESSION['user_id'] = $user['user_id'];
		$_SESSION['username'] = $user['username'];
		send_debug_response(['status' => 'success', 'message' => 'Login successful!'], 200);
	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in auth.php handle_login(): ' . $e->getMessage());
		}
		send_debug_response(['status' => 'error', 'message' => 'A server error occurred. Please try again later.'], 500);
	}
}