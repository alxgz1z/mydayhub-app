/**
 * MyDayHub Beta 5 - Authentication Handler (Client-Side)
 *
 * Handles form submissions for registration and login pages.
 *
 * @version 5.1.0
 * @author Alex & Gemini
 */
document.addEventListener('DOMContentLoaded', () => {
	// Shared elements for all forms
	const messageContainer = document.getElementById('message-container');

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
			const data = Object.fromEntries(formData.entries());

			if (!data.username || !data.email || !data.password) {
				displayMessage('All fields are required.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Register';
				return;
			}

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php?action=register`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				const result = await response.json();
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
			const data = Object.fromEntries(formData.entries());

			if (!data.username || !data.password) {
				displayMessage('Please enter both username and password.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Log In';
				return;
			}

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php?action=login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				const result = await response.json();
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

	// Modified for Forgot Password
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
			const data = Object.fromEntries(formData.entries());

			if (!data.email) {
				displayMessage('Please enter your email address.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Send Reset Link';
				return;
			}

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php?action=requestPasswordReset`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				// We don't need the result, as we show a generic message for security.
				await response.json(); 

				// For security reasons, always show a success message to prevent email enumeration.
				displayMessage('If an account with that email exists, a password reset link has been sent.', 'success');
				forgotForm.reset();

			} catch (error) {
				console.error('Forgot password fetch error:', error);
				// Still show the generic success message on the frontend.
				displayMessage('If an account with that email exists, a password reset link has been sent.', 'success');
			} finally {
				// Keep the button disabled to prevent spamming
				// The user should check their email now.
			}
		});
	}


	/**
	 * A helper function to display messages in the designated container.
	 * @param {string} message The message to show.
	 * @param {string} type 'success' or 'error'.
	 */
	function displayMessage(message, type) {
		if (messageContainer) {
			messageContainer.textContent = message;
			messageContainer.className = type;
			messageContainer.style.display = 'block';
		}
	}
});