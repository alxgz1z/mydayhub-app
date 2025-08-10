<?php
/**
 * MyDayHub 4.0.0 Beta - Core Configuration
 *
 * This file contains the essential configuration settings for the application.
 * It initializes constants for directory paths, database credentials, and
 * operational modes like DEVMODE. This centralized approach ensures that all
 * other scripts can access these core settings reliably.
 *
 * @version 4.0.0
 * @author Alex & Gemini
 */

// --- CORE CONSTANTS & ERROR REPORTING --- //

/**
 * DEVMODE: The master switch for debugging.
 * Set to TRUE to enable detailed error logging, visual debug markers,
 * and extra console output.
 * Set to FALSE for production environments.
 */
define('DEVMODE', true);

// Set error reporting based on DEVMODE.
if (DEVMODE) {
    // Report all possible errors and display them directly in the output.
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    // Disable error display in production and rely on server logs.
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}


// --- CUSTOM ERROR HANDLER (FOR DEVMODE) --- //
// This block defines a custom error handler to log errors to a file
// instead of outputting them as HTML, which would break JSON responses.
if (DEVMODE) {
    /**
     * Custom error handler to log errors to debug.log.
     * @param int $errno The error level.
     * @param string $errstr The error message.
     * @param string $errfile The file where the error occurred.
     * @param int $errline The line number of the error.
     */
    function mydayhub_error_handler($errno, $errstr, $errfile, $errline) {
        // Only handle the error if it's included in the current error_reporting level.
        if (!(error_reporting() & $errno)) {
            return false;
        }

        $logMessage = "[" . date('Y-m-d H:i:s') . "] ";
        switch ($errno) {
            case E_USER_ERROR:   $logMessage .= "Fatal Error"; break;
            case E_USER_WARNING: $logMessage .= "Warning"; break;
            case E_USER_NOTICE:  $logMessage .= "Notice"; break;
            default:             $logMessage .= "Error ($errno)"; break;
        }

        $logMessage .= ": {$errstr} in {$errfile} on line {$errline}\n";

        // Use ROOT_PATH (defined below) to ensure we log to the project root.
        file_put_contents(ROOT_PATH . '/debug.log', $logMessage, FILE_APPEND);

        // Don't execute the default PHP internal error handler, and halt the script
        // to prevent broken output from being sent to the client.
        exit(1);
    }

    // Set our custom function as the default error handler for the application.
    set_error_handler('mydayhub_error_handler');
}


// --- DATABASE CREDENTIALS (UPDATED FOR LOCAL MAMP) --- //
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
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


// --- FILE PATHS --- //
define('INCLUDES_PATH', __DIR__);
define('ROOT_PATH', dirname(INCLUDES_PATH));

// The stray `}` that was causing the parse error has been removed from the end.