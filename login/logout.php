<?php
/**
 * Code for /login/logout.php
 *
 * MyDayHub - Logout Script
 *
 * This script handles the user logout process by destroying the
 * current session and redirecting to the login page.
 *
 * @version 7.9 Jaco
 * @author Alex & Gemini & Claude & Cursor
 */

// We need the config file to get the APP_URL for a reliable redirect.
require_once __DIR__ . '/../incs/config.php';

// Start the session so we can access its data.
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

// 1. Unset all of the session variables.
$_SESSION = [];

// 2. If it's desired to kill the session, also delete the session cookie.
// Note: This will destroy the session, and not just the session data!
if (ini_get("session.use_cookies")) {
	$params = session_get_cookie_params();
	setcookie(session_name(), '', time() - 42000,
		$params["path"], $params["domain"],
		$params["secure"], $params["httponly"]
	);
}

// 3. Finally, destroy the session.
session_destroy();

// 4. Redirect to the login page.
header('Location: ' . APP_URL . '/login/login.php');
exit(); // Important to prevent further script execution.