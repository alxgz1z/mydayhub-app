<?php
/**
 * MyDayHub Beta 5 - Authentication API
 *
 * Handles user registration, login, and other authentication actions.
 *
 * @version 6.4.4-debug
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
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
		return;
	}
	if ($newPassword !== $confirmPassword) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Passwords do not match.']);
		return;
	}
	if (strlen($newPassword) < 8) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Password must be at least 8 characters long.']);
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
			http_response_code(400);
			echo json_encode(['status' => 'error', 'message' => 'This reset link is invalid or has expired. Please request a new one.']);
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

		http_response_code(200);
		echo json_encode(['status' => 'success', 'message' => 'Your password has been reset successfully. You can now log in.']);

	} catch (Exception $e) {
		if (isset($pdo) && $pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in handle_perform_password_reset: ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred. Please try again.']);
	}
}


/**
 * Handles a request to initiate a password reset.
 */
// Modified for Manual Debug Logging
function handle_request_password_reset(?array $data): void {
	$logFile = ROOT_PATH . '/debug.log';
	$timestamp = date('Y-m-d H:i:s');
	file_put_contents($logFile, "[$timestamp] --- DEBUG: handle_request_password_reset CALLED ---\n", FILE_APPEND);

	if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
		file_put_contents($logFile, "[$timestamp] DEBUG: Invalid or empty email provided. Exiting.\n", FILE_APPEND);
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'A valid email address is required.']);
		return;
	}
	
	file_put_contents($logFile, "[$timestamp] DEBUG: Email validated: {$data['email']}\n", FILE_APPEND);
	$genericSuccessResponse = ['status' => 'success', 'message' => 'If an account with that email exists, a password reset link has been sent.'];

	try {
		file_put_contents($logFile, "[$timestamp] DEBUG: Inside try block. Getting PDO connection.\n", FILE_APPEND);
		$pdo = get_pdo();
		file_put_contents($logFile, "[$timestamp] DEBUG: PDO connection successful.\n", FILE_APPEND);
		
		$stmt = $pdo->prepare("SELECT user_id, username FROM users WHERE email = :email");
		file_put_contents($logFile, "[$timestamp] DEBUG: Prepared statement to find user by email.\n", FILE_APPEND);
		$stmt->execute([':email' => $data['email']]);
		file_put_contents($logFile, "[$timestamp] DEBUG: Executed statement to find user.\n", FILE_APPEND);
		$user = $stmt->fetch();

		if ($user) {
			file_put_contents($logFile, "[$timestamp] DEBUG: User found with ID: {$user['user_id']}\n", FILE_APPEND);
			$userId = (int)$user['user_id'];
			$username = $user['username'];
			
			$token = bin2hex(random_bytes(32));
			$tokenHash = hash('sha256', $token);
			$expiresAt = date('Y-m-d H:i:s', time() + 3600);
			file_put_contents($logFile, "[$timestamp] DEBUG: Token generated and hashed.\n", FILE_APPEND);

			$pdo->beginTransaction();
			file_put_contents($logFile, "[$timestamp] DEBUG: Began database transaction.\n", FILE_APPEND);
			
			$stmt_invalidate = $pdo->prepare("DELETE FROM password_resets WHERE user_id = :userId");
			$stmt_invalidate->execute([':userId' => $userId]);
			file_put_contents($logFile, "[$timestamp] DEBUG: Invalidated old tokens.\n", FILE_APPEND);

			$stmt = $pdo->prepare(
				"INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (:userId, :tokenHash, :expiresAt)"
			);
			$stmt->execute([
				':userId' => $userId,
				':tokenHash' => $tokenHash,
				':expiresAt' => $expiresAt
			]);
			file_put_contents($logFile, "[$timestamp] DEBUG: Inserted new token into password_resets table.\n", FILE_APPEND);

			send_password_reset_email($data['email'], $username, $token);
			file_put_contents($logFile, "[$timestamp] DEBUG: Called send_password_reset_email function.\n", FILE_APPEND);

			$pdo->commit();
			file_put_contents($logFile, "[$timestamp] DEBUG: Committed transaction.\n", FILE_APPEND);
		} else {
			file_put_contents($logFile, "[$timestamp] DEBUG: No user found for email {$data['email']}. Proceeding without error.\n", FILE_APPEND);
		}
		
		http_response_code(200);
		echo json_encode($genericSuccessResponse);
		file_put_contents($logFile, "[$timestamp] DEBUG: Sent generic success response.\n", FILE_APPEND);

	} catch (Exception $e) {
		file_put_contents($logFile, "[$timestamp] --- CATCH BLOCK EXCEPTION --- : " . $e->getMessage() . "\n", FILE_APPEND);
		if (isset($pdo) && $pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			http_response_code(500);
			echo json_encode(['status' => 'error', 'message' => 'Failed to process reset request: ' . $e->getMessage()]);
			return;
		}
		http_response_code(200);
		echo json_encode($genericSuccessResponse);
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