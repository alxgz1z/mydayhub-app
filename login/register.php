<?php
/**
 * Code for /login/register.php
 *
 * MyDayHub - Register Script
 *
 * @version 7.3 Tamarindo
 * @author Alex & Gemini & Claude
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

	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
</head>
<body>

	<div class="auth-container">
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