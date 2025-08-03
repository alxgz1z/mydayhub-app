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
 * [cite_start]and extra console output. [cite: 32, 185, 192]
 * [cite_start]Set to FALSE for production environments. [cite: 10, 11]
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


// --- DATABASE CREDENTIALS --- //
define('DB_HOST', 'localhost');
define('DB_USER', 'u258668246_dbuser');
define('DB_PASS', 'F1123581321i');
define('DB_NAME', 'u258668246_tnj');


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

?>