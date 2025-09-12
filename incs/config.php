<?php
/**
 * Code for /incs/config.php
 *
 * MyDayHub - Core Configuration
 *
 * Reads credentials from a .env file for security and portability.
 * Manages session start and CSRF token generation.
 *
 * @version 6.7.0
 * @author Alex & Gemini
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
define('APP_VER', 'Beta 6.7.0');
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$script_name = str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']);
$base_url = rtrim(str_replace(DIRECTORY_SEPARATOR, '/', dirname($script_name)), '/');
define('APP_URL', $protocol . '://' . $host . $base_url);

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


// --- SMTP (MAIL) SERVICE (from Environment Variables) --- //
define('SMTP_HOST', getenv('SMTP_HOST'));
define('SMTP_USER', getenv('SMTP_USER'));
define('SMTP_PASS', getenv('SMTP_PASS'));
define('SMTP_PORT', getenv('SMTP_PORT'));
define('SMTP_FROM_EMAIL', getenv('SMTP_FROM_EMAIL'));
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME'));