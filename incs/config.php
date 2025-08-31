<?php
/**
 * MyDayHub Beta 5 - Core Configuration
 *
 * This file defines essential constants for the application, including
 * database credentials, file paths, and operational modes. It now reads
 * sensitive credentials from environment variables for improved security.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */

// --- CORE CONSTANTS & ERROR REPORTING --- //
define('DEVMODE', true);

if (DEVMODE) {
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);
} else {
	ini_set('display_errors', 0);
	ini_set('display_startup_errors', 0);
	error_reporting(E_ALL);
}

// --- FILE PATHS --- //
define('INCS_PATH', __DIR__);
define('ROOT_PATH', dirname(INCS_PATH));

// --- CUSTOM ERROR HANDLER (FOR DEVMODE) --- //
if (DEVMODE) {
	// ... (Your existing error handler function remains here) ...
}

// --- APPLICATION URL ---
// Modified for robust API pathing
// Dynamically determine the base URL of the application.
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
$script_name = str_replace(basename($_SERVER['SCRIPT_NAME']), '', $_SERVER['SCRIPT_NAME']);
$base_url = rtrim(str_replace(DIRECTORY_SEPARATOR, '/', dirname($script_name)), '/');
define('APP_URL', $protocol . '://' . $host . $base_url);


// --- DATABASE CREDENTIALS (from Environment Variables) --- //
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('DB_NAME') ?: 'mydayhub');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// --- SESSION & SECURITY --- //
define('SESSION_TIMEOUT_SECONDS', 28800); // 8 hours

// --- SMTP (MAIL) SERVICE (from Environment Variables) --- //
define('SMTP_HOST', getenv('SMTP_HOST') ?: '');
define('SMTP_USER', getenv('SMTP_USER') ?: '');
define('SMTP_PASS', getenv('SMTP_PASS') ?: '');
define('SMTP_PORT', getenv('SMTP_PORT') ?: 587);
define('SMTP_FROM_EMAIL', getenv('SMTP_FROM_EMAIL') ?: '');
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME') ?: 'MyDayHub');