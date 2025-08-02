<?php
/**
 * MyDayHub 4.0.0 Beta - Main Application Shell
 *
 * This file is the single entry point for the Single Page Application (SPA).
 * It includes the core configuration, sets up the HTML document structure,
 * and serves as the primary container where all views (like the Tasks board
 * and Journal) will be dynamically rendered by JavaScript.
 *
 * @version 4.0.0
 * @author Alex & Gemini
 */

// Load the core application configuration.
// We use require_once because the config is essential for the app to run.
require_once __DIR__ . '/includes/config.php';

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">

	<title>MyDayHub</title>

	<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body <?php if (DEVMODE) echo 'class="dev-mode-active"'; ?>>

	<div id="app-container">

		<main id="main-content">
			</main>

	</div>

	<script defer src="/assets/js/app.js"></script>

</body>
</html>