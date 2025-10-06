/**
 * Code for /uix/auth.js
 *
 * MyDayHub - Authentication Handler (Client-Side)
 *
 * Handles form submissions for registration, login, and password reset pages.
 *
 * @version 7.4 Jaco
 * @author Alex & Gemini & Claude & Cursor
 */
document.addEventListener('DOMContentLoaded', () => {
	// Initialize theme system for auth pages
	initAuthThemeSystem();
	
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

// --- Registration Form Logic (Modified for Email Verification) ---
	const registerForm = document.getElementById('register-form');
	const verificationStep = document.getElementById('verification-step');
	const verificationEmailSpan = document.getElementById('verification-email');
	const verifyButton = document.getElementById('verify-button');
	const resendButton = document.getElementById('resend-code-button');
	
	if (registerForm) {
		registerForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = registerForm.querySelector('button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Sending Code...';
	
			messageContainer.style.display = 'none';
	
			const formData = new FormData(registerForm);
			const data = { action: 'sendVerificationCode', ...Object.fromEntries(formData.entries()) };
	
			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				const result = await response.json();
				logServerDebug(result);
				
				if (response.ok) {
					// Show verification step
					registerForm.style.display = 'none';
					verificationStep.style.display = 'block';
					verificationEmailSpan.textContent = data.email;
					displayMessage(result.message, 'success');
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
	
		// Verification step handler
		if (verifyButton) {
			verifyButton.addEventListener('click', async () => {
				const code = document.getElementById('verification-code').value;
				const email = verificationEmailSpan.textContent;
				
				if (!code || code.length !== 6) {
					displayMessage('Please enter the 6-digit verification code.', 'error');
					return;
				}
	
				verifyButton.disabled = true;
				verifyButton.textContent = 'Verifying...';
	
				try {
					const appURL = window.MyDayHub_Config?.appURL || '';
					const response = await fetch(`${appURL}/api/auth.php`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ action: 'verifyEmailCode', email, code }),
					});
					const result = await response.json();
					logServerDebug(result);
					
					if (response.ok && result.redirect) {
						displayMessage('Account created successfully! Redirecting...', 'success');
						setTimeout(() => {
							window.location.href = `${appURL}/index.php`;
						}, 1500);
					} else {
						displayMessage(result.message || 'Verification failed.', 'error');
					}
				} catch (error) {
					console.error('Verification fetch error:', error);
					displayMessage('Could not connect to the server. Please try again later.', 'error');
				} finally {
					verifyButton.disabled = false;
					verifyButton.textContent = 'Verify Email';
				}
			});
		}
	
		// Resend code handler
		if (resendButton) {
			resendButton.addEventListener('click', () => {
				verificationStep.style.display = 'none';
				registerForm.style.display = 'block';
				displayMessage('Please submit the form again to receive a new code.', 'info');
			});
		}
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

/**
 * Initialize theme system for authentication pages
 */
function initAuthThemeSystem() {
	// Load theme preference from main app's localStorage or default to dark
	const lightMode = localStorage.getItem('light_mode') === 'true';
	const highContrast = localStorage.getItem('high_contrast_mode') === 'true';
	
	let theme = 'dark'; // default
	if (highContrast) {
		theme = 'high-contrast';
	} else if (lightMode) {
		theme = 'light';
	}
	
	applyAuthTheme(theme);
	
	// Set up theme selector buttons
	const themeButtons = document.querySelectorAll('.theme-btn');
	themeButtons.forEach(button => {
		button.addEventListener('click', () => {
			const selectedTheme = button.dataset.theme;
			applyAuthTheme(selectedTheme);
			saveAuthTheme(selectedTheme);
		});
	});
}

/**
 * Apply theme to authentication pages
 */
function applyAuthTheme(theme) {
	// Remove existing theme classes
	document.body.classList.remove('light-mode', 'dark-mode', 'high-contrast');
	
	// Apply new theme class
	if (theme === 'light') {
		document.body.classList.add('light-mode');
	} else if (theme === 'high-contrast') {
		document.body.classList.add('high-contrast');
	} else {
		document.body.classList.add('dark-mode');
	}
	
	// Update theme selector buttons
	const themeButtons = document.querySelectorAll('.theme-btn');
	themeButtons.forEach(button => {
		button.classList.remove('active');
		if (button.dataset.theme === theme) {
			button.classList.add('active');
		}
	});
}

/**
 * Save theme preference using main app's system
 */
function saveAuthTheme(theme) {
	// Save using the same localStorage keys as the main app
	switch (theme) {
		case 'light':
			localStorage.setItem('light_mode', 'true');
			localStorage.setItem('high_contrast_mode', 'false');
			break;
		case 'high-contrast':
			localStorage.setItem('light_mode', 'false');
			localStorage.setItem('high_contrast_mode', 'true');
			break;
		case 'dark':
		default:
			localStorage.setItem('light_mode', 'false');
			localStorage.setItem('high_contrast_mode', 'false');
			break;
	}
}