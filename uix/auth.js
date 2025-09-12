/**
 * MyDayHub Beta 5 - Authentication Handler (Client-Side)
 *
 * Handles form submissions for registration, login, and password reset pages.
 *
 * @version 6.5.2-debug-response
 * @author Alex & Gemini
 */
document.addEventListener('DOMContentLoaded', () => {
	// Shared elements for all forms
	const messageContainer = document.getElementById('message-container');

	// Modified for In-Browser Debugging: New helper to log debug info from the server.
	function logServerDebug(result) {
		if (result && result.debug && Array.isArray(result.debug)) {
			console.warn('--- MyDayHub Server Debug ---');
			result.debug.forEach(msg => console.log(msg));
			console.warn('-----------------------------');
		}
	}

	// --- Registration Form Logic ---
	const registerForm = document.getElementById('register-form');
	if (registerForm) {
		registerForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = registerForm.querySelector('button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Registering...';

			messageContainer.style.display = 'none';
			messageContainer.textContent = '';
			messageContainer.className = '';

			const formData = new FormData(registerForm);
			const data = { action: 'register', ...Object.fromEntries(formData.entries()) };

			if (!data.username || !data.email || !data.password) {
				displayMessage('All fields are required.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Register';
				return;
			}

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				const result = await response.json();
				logServerDebug(result); // Log debug info
				if (response.ok) {
					displayMessage(result.message, 'success');
					registerForm.reset();
				} else {
					displayMessage(result.message || 'An unknown error occurred.', 'error');
				}
			} catch (error) {
				console.error('Registration fetch error:', error);
				displayMessage('Could not connect to the server. Please try again later.', 'error');
			} finally {
				submitButton.disabled = false;
				submitButton.textContent = 'Register';
			}
		});
	}

	// --- Login Form Logic ---
	const loginForm = document.getElementById('login-form');
	if (loginForm) {
		loginForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = loginForm.querySelector('button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Logging In...';
			
			messageContainer.style.display = 'none';
			messageContainer.textContent = '';
			messageContainer.className = '';

			const formData = new FormData(loginForm);
			const data = { action: 'login', ...Object.fromEntries(formData.entries()) };

			if (!data.username || !data.password) {
				displayMessage('Please enter both username and password.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Log In';
				return;
			}

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				const result = await response.json();
				logServerDebug(result); // Log debug info
				if (response.ok) {
					window.location.href = `${appURL}/index.php`;
				} else {
					displayMessage(result.message || 'An unknown error occurred.', 'error');
					submitButton.disabled = false;
					submitButton.textContent = 'Log In';
				}
			} catch (error) {
				console.error('Login fetch error:', error);
				displayMessage('Could not connect to the server. Please try again later.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Log In';
			}
		});
	}

	// --- Forgot Password Form Logic ---
	const forgotForm = document.getElementById('forgot-form');
	if (forgotForm) {
		forgotForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = forgotForm.querySelector('button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Sending...';
			messageContainer.style.display = 'none';

			const formData = new FormData(forgotForm);
			const data = { action: 'requestPasswordReset', ...Object.fromEntries(formData.entries()) };

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				
				// Modified for Raw Response Debugging
				const responseText = await response.text();
				console.log('Raw server response:', responseText);
				console.log('Response status:', response.status);
				
				let result;
				try {
					result = JSON.parse(responseText);
				} catch (parseError) {
					console.error('JSON parse failed:', parseError);
					console.error('Response text:', responseText);
					displayMessage('Server returned invalid response. Check console for details.', 'error');
					return;
				}

				logServerDebug(result); // Log debug info

				if (response.ok) {
					displayMessage(result.message, 'success');
					forgotForm.reset();
				} else {
					// In DEVMODE, the server might send a real error. Show it.
					displayMessage(result.message, 'error');
				}

			} catch (error) {
				console.error('Forgot password fetch error:', error);
				displayMessage('A network error occurred. Please try again.', 'error');
			} finally {
				// Keep the button disabled on success to prevent spamming
				if(messageContainer.classList.contains('error')) {
					submitButton.disabled = false;
					submitButton.textContent = 'Send Reset Link';
				}
			}
		});
	}
	
	// --- Reset Password Form Logic ---
	const resetPasswordForm = document.getElementById('reset-password-form');
	if (resetPasswordForm) {
		resetPasswordForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Resetting...';
			messageContainer.style.display = 'none';

			const formData = new FormData(resetPasswordForm);
			const data = { action: 'performPasswordReset', ...Object.fromEntries(formData.entries()) };

			// Client-side validation
			if (data.new_password !== data.confirm_password) {
				displayMessage('Passwords do not match.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Reset Password';
				return;
			}
			if (data.new_password.length < 8) {
				displayMessage('Password must be at least 8 characters long.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Reset Password';
				return;
			}

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				});

				const result = await response.json();
				logServerDebug(result); // Log debug info

				if (response.ok) {
					displayMessage(result.message, 'success');
					resetPasswordForm.reset();
					// Redirect to login page after a short delay
					setTimeout(() => {
						window.location.href = `${appURL}/login/login.php`;
					}, 3000);
				} else {
					displayMessage(result.message || 'An unknown error occurred.', 'error');
					submitButton.disabled = false;
					submitButton.textContent = 'Reset Password';
				}

			} catch (error) {
				console.error('Reset password fetch error:', error);
				displayMessage('A network error occurred. Please try again.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Reset Password';
			}
		});
	}


	/**
	 * A helper function to display messages in the designated container.
	 */
	function displayMessage(message, type) {
		if (messageContainer) {
			messageContainer.textContent = message;
			messageContainer.className = type;
			messageContainer.style.display = 'block';
		}
	}
});