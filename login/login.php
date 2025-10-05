<?php
/**
 * Code for /login/login.php
 *
 * MyDayHub - Login Script
 *
 * @version 7.4 Jaco
 * @author Alex & Gemini & Claude
 */

require_once __DIR__ . '/../incs/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Log In - MyDayHub</title>
	<link rel="stylesheet" href="../uix/login.css">
	<!-- Favicon and App Icons -->
	<link rel="icon" type="image/svg+xml" href="../media/favico.svg">
	<link rel="icon" type="image/png" sizes="32x32" href="../media/favico.svg">
	<link rel="icon" type="image/png" sizes="16x16" href="../media/favico.svg">
	<link rel="apple-touch-icon" href="../media/favico.svg">
	<link rel="apple-touch-icon" sizes="180x180" href="../media/favico.svg">
	<link rel="apple-touch-icon" sizes="152x152" href="../media/favico.svg">
	<link rel="apple-touch-icon" sizes="144x144" href="../media/favico.svg">
	<link rel="apple-touch-icon" sizes="120x120" href="../media/favico.svg">
	<link rel="apple-touch-icon" sizes="114x114" href="../media/favico.svg">
	<link rel="apple-touch-icon" sizes="76x76" href="../media/favico.svg">
	<link rel="apple-touch-icon" sizes="72x72" href="../media/favico.svg">
	<link rel="apple-touch-icon" sizes="60x60" href="../media/favico.svg">
	<link rel="apple-touch-icon" sizes="57x57" href="../media/favico.svg">
	<link rel="icon" type="image/png" sizes="192x192" href="../media/favico.svg">
	<link rel="icon" type="image/png" sizes="512x512" href="../media/favico.svg">

	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
</head>
<body>

	<!-- Theme Selector -->
	<div class="auth-theme-selector">
		<button class="theme-btn active" data-theme="dark">Dark</button>
		<button class="theme-btn" data-theme="light">Light</button>
		<button class="theme-btn" data-theme="high-contrast">High Contrast</button>
	</div>

	<div class="auth-container">
		<img src="../media/leaf.svg" alt="MyDayHub Logo" class="auth-logo">
		<h1>Log In</h1>

		<div id="message-container"></div>

		<form id="login-form">
			<div class="form-group">
				<label for="username">Username</label>
				<input type="text" id="username" name="username" required>
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input type="password" id="password" name="password" required>
			</div>
			<button type="submit" class="btn">Log In</button>
		</form>
		<div class="auth-link">
			<p>Don't have an account? <a href="register.php">Register</a></p>
		</div>
		<div class="auth-sub-link">
			<a href="forgot.php">Forgot Password?</a>
		</div>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>