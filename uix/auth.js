/**
 * Code for /uix/auth.js
 *
 * MyDayHub - Authentication Handler (Client-Side)
 *
 * Handles form submissions for registration, login, and password reset pages.
 *
 * @version 8.1 Tamarindo
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
					// Store password temporarily for encryption setup (if needed)
					sessionStorage.setItem('temp_login_password', data.password);
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
	
	// Load user's accent color preference
	loadAccentColorPreference();
	
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

/**
 * Load user's accent color preference for auth pages
 */
async function loadAccentColorPreference() {
	try {
		// For login pages, only use localStorage since user isn't authenticated yet
		const localAccentColor = localStorage.getItem('accent_color');
		console.log('Auth: Local accent color:', localAccentColor);
		
		if (localAccentColor) {
			applyAccentColorToAuthUI(localAccentColor);
			console.log('Auth: Applied local accent color:', localAccentColor);
		} else {
			// Fall back to default if no preference is stored
			applyAccentColorToAuthUI('#22c55e');
			console.log('Auth: No accent color found, using default green');
		}
	} catch (error) {
		console.log('Auth: Could not load accent color preference:', error);
		// Fall back to default if nothing else works
		applyAccentColorToAuthUI('#22c55e');
	}
}

/**
 * Apply accent color to auth page UI elements
 */
function applyAccentColorToAuthUI(accentColor) {
	console.log('Auth: Applying accent color to UI:', accentColor);
	const root = document.documentElement;
	
	// Generate color variations
	const colorVariations = generateAccentColorVariations(accentColor);
	console.log('Auth: Generated color variations:', colorVariations);
	
	// Apply CSS custom properties with !important to override hardcoded values
	root.style.setProperty('--accent-color', accentColor, 'important');
	root.style.setProperty('--accent-gradient', colorVariations.gradient, 'important');
	root.style.setProperty('--accent-gradient-light', colorVariations.gradientLight, 'important');
	root.style.setProperty('--input-focus-border', accentColor, 'important');
	root.style.setProperty('--btn-bg', accentColor, 'important');
	root.style.setProperty('--btn-hover-bg', colorVariations.hover, 'important');
	root.style.setProperty('--link-color', accentColor, 'important');
	root.style.setProperty('--link-hover', colorVariations.hover, 'important');
	
	console.log('Auth: Applied CSS properties:', {
		'--accent-color': accentColor,
		'--btn-bg': accentColor,
		'--link-color': accentColor
	});
}

/**
 * Generate accent color variations for auth pages
 */
function generateAccentColorVariations(baseColor) {
	const hover = adjustBrightness(baseColor, -20);
	const gradient = `linear-gradient(135deg, ${baseColor}, ${hover})`;
	const gradientLight = `linear-gradient(135deg, ${adjustBrightness(baseColor, 20)}, ${baseColor})`;
	
	return {
		hover,
		gradient,
		gradientLight
	};
}

/**
 * Adjust brightness of a color
 */
function adjustBrightness(color, percent) {
	const num = parseInt(color.replace('#', ''), 16);
	const amt = Math.round(2.55 * percent);
	const R = (num >> 16) + amt;
	const G = (num >> 8 & 0x00FF) + amt;
	const B = (num & 0x0000FF) + amt;
	return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
		(G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
		(B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}