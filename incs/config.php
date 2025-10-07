<?php
/**
 * Code for /incs/config.php
 *
 * MyDayHub - Core Configuration
 *
 * Reads credentials from a .env file for security and portability.
 * Manages session start and CSRF token generation.
 *
 * @version 7.4 Jaco
 * @author Alex & Gemini & Claude & Cursor
 */

// --- FILE PATHS ---
define('INCS_PATH', __DIR__);
define('ROOT_PATH', dirname(INCS_PATH));

// --- LOAD ENVIRONMENT VARIABLES FROM .env FILE ---
$envPath = ROOT_PATH . '/.env';
if (file_exists($envPath)) {
	$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
	foreach ($lines as $line) {
		if (strpos(trim($line), '#') === 0) continue;
		if (strpos($line, '=') !== false) {
			list($name, $value) = explode('=', $line, 2);
			$name = trim($name);
			$value = trim($value, " \t\n\r\0\x0B\"");
			putenv("$name=$value");
		}
	}
}

// --- CORE CONSTANTS & ERROR REPORTING ---
define('DEVMODE', getenv('DEV_MODE') === 'true');

if (DEVMODE) {
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);
} else {
	ini_set('display_errors', 0);
	ini_set('display_startup_errors', 0);
	error_reporting(E_ALL);
}

// Modified for In-Browser Debugging
// --- CUSTOM ERROR & DEBUG HANDLER (FOR DEVMODE) ---
global $__DEBUG_MESSAGES__;
$__DEBUG_MESSAGES__ = [];

/**
 * Adds a message to the global debug array if DEVMODE is active.
 * @param string $message The debug message to log.
 */
function log_debug_message(string $message): void {
	if (DEVMODE) {
		global $__DEBUG_MESSAGES__;
		$timestamp = date('H:i:s');
		$__DEBUG_MESSAGES__[] = "[$timestamp] " . $message;
	}
}

if (DEVMODE) {
	function mydayhub_error_handler($errno, $errstr, $errfile, $errline) {
		if (!(error_reporting() & $errno)) {
			return false;
		}
		$logMessage = "Error [$errno]: $errstr in $errfile on line $errline";
		log_debug_message($logMessage);
		return true; // Prevent default PHP error handler
	}
	set_error_handler('mydayhub_error_handler');
}


// --- APPLICATION URL & VERSION ---
define('APP_VER', 'Beta 7.4 - Jaco');

// Smart APP_URL detection - uses stable hostnames only (no dynamic IPs)
function detectAppUrl() {
	// First, check if APP_URL is explicitly set in environment
	$envUrl = getenv('APP_URL');
	if ($envUrl && $envUrl !== 'http://localhost') {
		return $envUrl;
	}
	
	// Auto-detect using stable hostnames only
	if (isset($_SERVER['HTTP_HOST'])) {
		$host = $_SERVER['HTTP_HOST'];
		$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
		
		// Only use known stable hostnames, avoid dynamic IPs
		if ($host === 'jagmac.local' || $host === 'localhost') {
			return $protocol . '://' . $host;
		}
		
		// For IP addresses, use them directly (Web Crypto API works with IPs on localhost)
		if (filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
			// This is a private IP address (like 10.0.0.3), use it directly
			return $protocol . '://' . $host;
		}
		
		// For any other host, default to localhost
		return 'http://localhost';
	}
	
	// Fallback to environment variable or localhost
	return $envUrl ?: 'http://localhost';
}

define('APP_URL', detectAppUrl());

// --- DATABASE CREDENTIALS (from Environment Variables) ---
define('DB_HOST', getenv('DB_HOST'));
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));

// --- SESSION & SECURITY --- //
define('SESSION_TIMEOUT_SECONDS', 28800);

if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

if (empty($_SESSION['csrf_token'])) {
	$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}


// Modified for Session Timeout - Track activity and validate session age
if (isset($_SESSION['user_id'])) {
	$now = time();
	
	// Load user's timeout preference from database if not in session
	if (!isset($_SESSION['session_timeout'])) {
		$_SESSION['session_timeout'] = 1800; // Set safe default first
		
		try {
			if (file_exists(__DIR__ . '/db.php')) {
				require_once __DIR__ . '/db.php';
				if (function_exists('get_pdo')) {
					$pdo = get_pdo();
					$stmt = $pdo->prepare("SELECT preferences FROM users WHERE user_id = :userId");
					$stmt->execute([':userId' => $_SESSION['user_id']]);
					$result = $stmt->fetch(PDO::FETCH_ASSOC);
					
					if ($result && $result['preferences']) {
						$prefs = json_decode($result['preferences'], true);
						if (is_array($prefs) && isset($prefs['session_timeout'])) {
							$_SESSION['session_timeout'] = (int)$prefs['session_timeout'];
						}
					}
				}
			}
		} catch (Exception $e) {
			// Silently fail with default timeout
			if (DEVMODE) {
				error_log('Session timeout preference load failed: ' . $e->getMessage());
			}
		}
	}
	
	$timeoutSeconds = $_SESSION['session_timeout'];
	
	// Check if session has expired due to inactivity
	if (isset($_SESSION['last_activity']) && ($now - $_SESSION['last_activity']) > $timeoutSeconds) {
		// Session expired - destroy it and mark for redirect
		session_unset();
		session_destroy();
		session_start();
		$_SESSION['session_expired'] = true;
	} else {
		// Update last activity timestamp
		$_SESSION['last_activity'] = $now;
		
		// Set initial activity time if not set
		if (!isset($_SESSION['session_started'])) {
			$_SESSION['session_started'] = $now;
		}
	}
}

	
$timeoutSeconds = $_SESSION['session_timeout'];


// --- SMTP (MAIL) SERVICE (from Environment Variables) --- //
define('SMTP_HOST', getenv('SMTP_HOST'));
define('SMTP_USER', getenv('SMTP_USER'));
define('SMTP_PASS', getenv('SMTP_PASS'));
define('SMTP_PORT', getenv('SMTP_PORT'));
define('SMTP_FROM_EMAIL', getenv('SMTP_FROM_EMAIL'));
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME'));


// --- ADMIN CONFIGURATION ---
define('ADMIN_EMAILS', array_map('trim', explode(',', getenv('ADMIN_EMAILS') ?: '')));

// --- SUBSCRIPTION QUOTAS ---
define('QUOTA_FREE_COLUMNS', 3);
define('QUOTA_FREE_TASKS_PER_COLUMN', 10);
define('QUOTA_FREE_STORAGE_MB', 10);
define('QUOTA_FREE_SHARED_TASKS', 2);

define('QUOTA_BASE_COLUMNS', 10);
define('QUOTA_BASE_TASKS_PER_COLUMN', 50);
define('QUOTA_BASE_STORAGE_MB', 100);
define('QUOTA_BASE_SHARED_TASKS', 20);

define('QUOTA_PRO_COLUMNS', 50);
define('QUOTA_PRO_TASKS_PER_COLUMN', 200);
define('QUOTA_PRO_STORAGE_MB', 500);
define('QUOTA_PRO_SHARED_TASKS', 100);

define('QUOTA_ELITE_COLUMNS', -1); // Unlimited
define('QUOTA_ELITE_TASKS_PER_COLUMN', -1); // Unlimited
define('QUOTA_ELITE_STORAGE_MB', 2048); // 2GB
define('QUOTA_ELITE_SHARED_TASKS', -1); // Unlimited

/**
 * Check if the current user is an admin based on their email
 */
function is_admin_user(int $userId): bool {
	if (empty(ADMIN_EMAILS)) return false;
	
	try {
		// Make sure db.php is loaded
		if (!function_exists('get_pdo')) {
			require_once __DIR__ . '/db.php';
		}
		
		$pdo = get_pdo();
		$stmt = $pdo->prepare("SELECT email FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $userId]);
		$userEmail = $stmt->fetchColumn();
		
		return $userEmail && in_array($userEmail, ADMIN_EMAILS);
	} catch (Exception $e) {
		return false;
	}
}

/**
 * Get user's subscription quota limits
 */
function get_user_quotas(string $subscriptionLevel): array {
	switch ($subscriptionLevel) {
		case 'base':
			return [
				'columns' => QUOTA_BASE_COLUMNS,
				'tasks_per_column' => QUOTA_BASE_TASKS_PER_COLUMN,
				'storage_bytes' => QUOTA_BASE_STORAGE_MB * 1024 * 1024,
				'shared_tasks' => QUOTA_BASE_SHARED_TASKS
			];
		case 'pro':
			return [
				'columns' => QUOTA_PRO_COLUMNS,
				'tasks_per_column' => QUOTA_PRO_TASKS_PER_COLUMN,
				'storage_bytes' => QUOTA_PRO_STORAGE_MB * 1024 * 1024,
				'shared_tasks' => QUOTA_PRO_SHARED_TASKS
			];
		case 'elite':
			return [
				'columns' => QUOTA_ELITE_COLUMNS,
				'tasks_per_column' => QUOTA_ELITE_TASKS_PER_COLUMN,
				'storage_bytes' => QUOTA_ELITE_STORAGE_MB * 1024 * 1024,
				'shared_tasks' => QUOTA_ELITE_SHARED_TASKS
			];
		default: // 'free'
			return [
				'columns' => QUOTA_FREE_COLUMNS,
				'tasks_per_column' => QUOTA_FREE_TASKS_PER_COLUMN,
				'storage_bytes' => QUOTA_FREE_STORAGE_MB * 1024 * 1024,
				'shared_tasks' => QUOTA_FREE_SHARED_TASKS
			];
	}
}

/**
 * Check if user can perform an action based on their quota
 */
function check_user_quota(int $userId, string $action): array {
	try {
		$pdo = get_pdo();
		
		// Get user's subscription level and status
		$stmt = $pdo->prepare("SELECT subscription_level, status FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $userId]);
		$user = $stmt->fetch();
		
		if (!$user) {
			return ['allowed' => false, 'reason' => 'User not found'];
		}
		
		if ($user['status'] !== 'active') {
			return ['allowed' => false, 'reason' => 'Account suspended'];
		}
		
		$quotas = get_user_quotas($user['subscription_level']);
		
		switch ($action) {
			case 'create_column':
				if ($quotas['columns'] === -1) return ['allowed' => true];
				
				$stmt = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL");
				$stmt->execute([':userId' => $userId]);
				$currentColumns = (int)$stmt->fetchColumn();
				
				if ($currentColumns >= $quotas['columns']) {
					return [
						'allowed' => false,
						'reason' => "Column limit reached ({$quotas['columns']}). Upgrade your subscription for more columns."
					];
				}
				break;
				
			case 'create_task':
				if ($quotas['tasks_per_column'] === -1) return ['allowed' => true];
				
				// We'll pass column_id as a parameter when checking
				$columnId = func_get_args()[2] ?? null;
				if (!$columnId) return ['allowed' => true]; // Can't check without column
				
				$stmt = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE user_id = :userId AND column_id = :columnId AND deleted_at IS NULL");
				$stmt->execute([':userId' => $userId, ':columnId' => $columnId]);
				$currentTasks = (int)$stmt->fetchColumn();
				
				if ($currentTasks >= $quotas['tasks_per_column']) {
					return [
						'allowed' => false,
						'reason' => "Task limit reached ({$quotas['tasks_per_column']} per column). Upgrade your subscription for more tasks."
					];
				}
				break;
				
			case 'upload_attachment':
				$fileSize = func_get_args()[2] ?? 0;
				
				$stmt = $pdo->prepare("SELECT storage_used_bytes FROM users WHERE user_id = :userId");
				$stmt->execute([':userId' => $userId]);
				$currentStorage = (int)$stmt->fetchColumn();
				
				if (($currentStorage + $fileSize) > $quotas['storage_bytes']) {
					$maxMB = $quotas['storage_bytes'] / (1024 * 1024);
					return [
						'allowed' => false,
						'reason' => "Storage limit reached ({$maxMB}MB). Upgrade your subscription for more storage."
					];
				}
				break;
				
			case 'share_task':
				if ($quotas['shared_tasks'] === -1) return ['allowed' => true];
				
				$stmt = $pdo->prepare("SELECT COUNT(*) FROM shared_items WHERE owner_id = :userId AND item_type = 'task'");
				$stmt->execute([':userId' => $userId]);
				$currentShares = (int)$stmt->fetchColumn();
				
				if ($currentShares >= $quotas['shared_tasks']) {
					return [
						'allowed' => false,
						'reason' => "Sharing limit reached ({$quotas['shared_tasks']} shared tasks). Upgrade your subscription to share more tasks."
					];
				}
				break;
		}
		
		return ['allowed' => true];
		
	} catch (Exception $e) {
		error_log('Quota check error: ' . $e->getMessage());
		return ['allowed' => false, 'reason' => 'Error checking quota'];
	}
}