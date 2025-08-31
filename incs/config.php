<?php
/**
 * MyDayHub Beta 5 - Core Configuration
 *
 * This file defines essential constants for the application, including
 * database credentials, file paths, and operational modes. It is the
 * single source of truth for configuration.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */

// --- CORE CONSTANTS & ERROR REPORTING --- //

/**
 * DEVMODE: Master switch for debugging.
 * true:  Enables detailed error logging to /debug.log and other dev features.
 * false: Disables visible errors for production environments.
 */
define('DEVMODE', true);

// Set error reporting based on DEVMODE.
if (DEVMODE) {
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);
} else {
	ini_set('display_errors', 0);
	ini_set('display_startup_errors', 0);
	error_reporting(E_ALL); // Log all errors, just don't display them.
}

// --- FILE PATHS --- //
// MODIFIED for Beta 5: Defined paths early and using the new '/incs/' directory structure.
define('INCS_PATH', __DIR__);
define('ROOT_PATH', dirname(INCS_PATH));


// --- CUSTOM ERROR HANDLER (FOR DEVMODE) --- //
// This block defines a custom error handler to log errors to a file.
if (DEVMODE) {
	function mydayhub_error_handler($errno, $errstr, $errfile, $errline) {
		if (!(error_reporting() & $errno)) {
			return false; // Error reporting is turned off for this error.
		}
		$logMessage = "[" . date('Y-m-d H:i:s') . "] Error [$errno]: $errstr in $errfile on line $errline" . PHP_EOL;
		// Safely log to a file in the project root.
		file_put_contents(ROOT_PATH . '/debug.log', $logMessage, FILE_APPEND);
		// To prevent broken JSON responses, we don't output the error here.
		// In a real API, we'd exit with a generic JSON error.
		return true; // Don't execute the default PHP error handler.
	}
	set_error_handler('mydayhub_error_handler');
}


// --- DATABASE CREDENTIALS (for local XAMPP environment) --- //
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
// MODIFIED for Beta 5: Using a new database name to keep B5 isolated.
define('DB_NAME', 'mydayhub');


// --- SESSION & SECURITY --- //
define('SESSION_TIMEOUT_SECONDS', 28800); // 8 hours


// --- SMTP (MAIL) SERVICE --- //
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_USER', 'app@mytsks.com');
define('SMTP_PASS', 'F1123581321i@');
define('SMTP_PORT', 587);
define('SMTP_FROM_EMAIL', 'app@mytsks.com');
define('SMTP_FROM_NAME', 'MyTsks App');

// A closing PHP tag is omitted intentionally for files that contain only PHP code.
// This prevents accidental whitespace from being sent to the browser.