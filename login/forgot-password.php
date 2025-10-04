<?php
/**
 * Code for /login/forgot-password.php
 *
 * MyDayHub - Forgot Password Script
 *
 * @version 7.3 Tamarindo
 * @author Alex & Gemini & Claude
 */

require_once __DIR__ . '/../incs/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reset Password - MyDayHub</title>
	<link rel="stylesheet" href="../uix/login.css">

	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
</head>
<body>

	<div class="auth-container">
		<h1>Reset Password</h1>

		<div id="message-container"></div>

		<form id="forgot-form">
			<p class="form-instructions">Enter the email address associated with your account, and we'll send you a link to reset your password.</p>
			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" name="email" required>
			</div>
			<button type="submit" class="btn">Send Reset Link</button>
		</form>
		<div class="auth-link">
			<p>Remembered your password? <a href="login.php">Log In</a></p>
		</div>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>