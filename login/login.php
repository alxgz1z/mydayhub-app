<?php
/**
 * Code for /login/login.php
 *
 * MyDayHub - Login Script
 *
 * @version 6.3.1
 * @author Alex & Gemini
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

	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
</head>
<body>

	<div class="auth-container">
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
			<a href="forgot-password.php">Forgot Password?</a>
		</div>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>