<?php
/**
 * Code for /login/register.php
 *
 * MyDayHub - Register Script
 *
 * @version 8.0 Herradura
 * @author Alex & Gemini & Claude & Cursor
 */


// Modified for robust API pathing
require_once __DIR__ . '/../incs/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Register - MyDayHub</title>
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
		<h1>Create Account</h1>

		<div id="message-container"></div>

		<form id="register-form">
			<div class="form-group">
				<label for="username">Username</label>
				<input type="text" id="username" name="username" required>
			</div>
			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" name="email" required>
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input type="password" id="password" name="password" required>
			</div>
			<button type="submit" class="btn">Register</button>
		</form>
		<!-- Modified for Email Verification - Add verification step -->
		<div id="verification-step" style="display: none;">
			<h2>Check Your Email</h2>
			<p>We've sent a 6-digit verification code to <span id="verification-email"></span></p>
			<div class="form-group">
				<label for="verification-code">Verification Code</label>
				<input type="text" id="verification-code" name="verification-code" maxlength="6" pattern="[0-9]{6}" required>
			</div>
			<button type="button" id="verify-button" class="btn">Verify Email</button>
			<button type="button" id="resend-code-button" class="btn-secondary">Resend Code</button>
		</div>
		<div class="auth-link">
			<p>Already have an account? <a href="login.php">Log In</a></p>
		</div>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>