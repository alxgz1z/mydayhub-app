<?php
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
		<div class="auth-link">
			<p>Already have an account? <a href="login.php">Log In</a></p>
		</div>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>