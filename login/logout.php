<?php
/**
MyDayHub Beta 5 - Logout Handler
Destroys the user session and redirects to the login page.
@version 5.9.1
@author Alex & Gemini
*/
// Include the configuration to get access to APP_URL for a robust redirect.
require_once DIR . '/../incs/config.php';

// Start the session to access its data.
if (session_status() === PHP_SESSION_NONE) {
session_start();
}

// Unset all of the session variables.
$_SESSION = array();

// If it's desired to kill the session, also delete the session cookie.
// Note: This will destroy the session, and not just the session data!
if (ini_get("session.use_cookies")) {
$params = session_get_cookie_params();
setcookie(session_name(), '', time() - 42000,
$params["path"], $params["domain"],
$params["secure"], $params["httponly"]
);
}

// Finally, destroy the session.
session_destroy();

// Redirect to the login page.
header('Location: ' . APP_URL . '/login/login.php');
exit(); // Ensure no further code is executed.

?>