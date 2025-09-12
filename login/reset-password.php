<?php
// MyDayHub - Password Reset Page

require_once __DIR__ . '/../incs/config.php';

// Get the token from the URL. We will pass this to the JavaScript.
$token = $_GET['token'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reset Password - MyDayHub</title>
	<link rel="stylesheet" href="../uix/login.css">
	<script>
		// Expose the app URL to our JavaScript file.
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
</head>
<body>

	<div class="auth-container">
		<h1>Set New Password</h1>

		<div id="message-container"></div>

		<form id="reset-password-form">
			<input type="hidden" id="token" name="token" value="<?php echo htmlspecialchars($token); ?>">

			<div class="form-group">
				<label for="new_password">New Password</label>
				<input type="password" id="new_password" name="new_password" required minlength="8">
			</div>
			<div class="form-group">
				<label for="confirm_password">Confirm New Password</label>
				<input type="password" id="confirm_password" name="confirm_password" required>
			</div>
			<button type="submit" class="btn">Reset Password</button>
		</form>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>