<?php
/**
 * MyDayHub Beta 5 - Core Configuration
 *
 * Reads credentials from a .env file for security and portability.
 */

// --- FILE PATHS ---
define('INCS_PATH', __DIR__);
define('ROOT_PATH', dirname(INCS_PATH));

// --- LOAD ENVIRONMENT VARIABLES FROM .env FILE ---
// Note: This is a simple, manual parser. For production, consider using a library like vlucas/phpdotenv.
$envPath = ROOT_PATH . '/.env';
if (file_exists($envPath)) {
	$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
	foreach ($lines as $line) {
		if (strpos(trim($line), '#') === 0) continue; // Skip comments
		if (strpos($line, '=') !== false) {
			list($name, $value) = explode('=', $line, 2);
			$name = trim($name);
			$value = trim($value, " \t\n\r\0\x0B\""); // Trim whitespace and quotes
			putenv("$name=$value");
		}
	}
}

// --- CORE CONSTANTS & ERROR REPORTING ---
// DEVMODE is loaded from .env, but we default to false if not set.
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

// --- CUSTOM ERROR HANDLER (FOR DEVMODE) ---
if (DEVMODE) {
	function mydayhub_error_handler($errno, $errstr, $errfile, $errline) {
		if (!(error_reporting() & $errno)) {
			return false;
		}
		$logMessage = "[" . date('Y-m-d H:i:s') . "] Error [$errno]: $errstr in $errfile on line $errline" . PHP_EOL;
		file_put_contents(ROOT_PATH . '/debug.log', $logMessage, FILE_APPEND);
		return true;
	}
	set_error_handler('mydayhub_error_handler');
}

// --- APPLICATION URL & VERSION ---
define('APP_VER', 'Beta 5.1.2');
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$script_name = str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']);
$base_url = rtrim(str_replace(DIRECTORY_SEPARATOR, '/', dirname($script_name)), '/');
define('APP_URL', $protocol . '://' . $host . $base_url);

// --- DATABASE CREDENTIALS (from Environment Variables) ---
// Modified for .env consistency: Removed fallback credentials.
define('DB_HOST', getenv('DB_HOST'));
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));

// --- SESSION & SECURITY --- //
define('SESSION_TIMEOUT_SECONDS', 28800); // 8 hours

// --- SMTP (MAIL) SERVICE (from Environment Variables) --- //
// Modified for .env consistency: Removed fallback credentials.
define('SMTP_HOST', getenv('SMTP_HOST'));
define('SMTP_USER', getenv('SMTP_USER'));
define('SMTP_PASS', getenv('SMTP_PASS'));
define('SMTP_PORT', getenv('SMTP_PORT'));
define('SMTP_FROM_EMAIL', getenv('SMTP_FROM_EMAIL'));
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME'));