<?php
/**
 * MyDayHub Beta 5 - Main Application Shell
 *
 * This page is the main entry point for authenticated users.
 * It establishes the session and redirects to login if the user is not authenticated.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */

// Start a session if one is not already active.
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

// SECURITY: Redirect to the login page if the user is not authenticated.
if (!isset($_SESSION['user_id'])) {
	// Use an absolute path for the redirect.
	header('Location: /login/login.php');
	exit(); // Always call exit() after a header redirect.
}

// Make the username available for display.
$username = $_SESSION['username'] ?? 'User';

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>MyDayHub</title>
	<link rel="stylesheet" href="/uix/style.css">
</head>
<body>

	<div id="main-app-container">

		<header id="app-header">
			<div class="header-left">
				<h1 id="app-title">MyDayHub</h1>
				<nav class="view-tabs">
					<button class="view-tab active" data-view="tasks">Tasks</button>
					</nav>
			</div>
			<div class="header-right">
				</div>
		</header>

		<main id="main-content">
			<div id="task-board-container">
				<p>Loading Task Board...</p>
			</div>
		</main>

		<footer id="app-footer">
			<div class="footer-left">
				<span id="footer-date">August 30, 2025</span>
			</div>
			<div class="footer-center">
				</div>
			<div class="footer-right">
				<span>[<?php echo htmlspecialchars($username); ?>]</span>
				<a href="/login/logout.php">Logout</a>
			</div>
		</footer>

	</div>

	<script src="/uix/app.js" defer></script>
	<script src="/uix/tasks.js" defer></script>

</body>
</html>