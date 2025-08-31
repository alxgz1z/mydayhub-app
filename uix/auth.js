/**
 * MyDayHub Beta 5 - Authentication Handler (Client-Side)
 *
 * Handles form submissions for registration and login pages.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */
document.addEventListener('DOMContentLoaded', () => {
	// Shared elements for both forms
	const messageContainer = document.getElementById('message-container');

	// --- Registration Form Logic ---
	const registerForm = document.getElementById('register-form');
	if (registerForm) {
		registerForm.addEventListener('submit', async (e) => {
			// Prevent the browser's default form submission, which reloads the page.
			e.preventDefault();

			// Clear any previous messages.
			messageContainer.style.display = 'none';
			messageContainer.textContent = '';
			messageContainer.className = '';

			// Gather the data from the form into a simple object.
			const formData = new FormData(registerForm);
			const data = Object.fromEntries(formData.entries());

			// Basic client-side validation.
			if (!data.username || !data.email || !data.password) {
				displayMessage('All fields are required.', 'error');
				return;
			}

			try {
				// Send the data to our backend API using the Fetch API.
				const response = await fetch('/api/auth.php?action=register', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data),
				});

				// Get the JSON response from the API.
				const result = await response.json();

				if (response.ok) {
					// The server responded with a success status (e.g., 201 Created).
					displayMessage(result.message, 'success');
					registerForm.reset(); // Clear the form on success.
				} else {
					// The server responded with an error status (e.g., 400, 409, 500).
					displayMessage(result.message || 'An unknown error occurred.', 'error');
				}

			} catch (error) {
				// This catches network errors (e.g., server is down, can't connect).
				console.error('Registration fetch error:', error);
				displayMessage('Could not connect to the server. Please try again later.', 'error');
			}
		});
	}

	// --- Login Form Logic ---
	// Modified to add login handling
	const loginForm = document.getElementById('login-form');
	if (loginForm) {
		loginForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			messageContainer.style.display = 'none';
			messageContainer.textContent = '';
			messageContainer.className = '';

			const formData = new FormData(loginForm);
			const data = Object.fromEntries(formData.entries());

			if (!data.username || !data.password) {
				displayMessage('Please enter both username and password.', 'error');
				return;
			}

			try {
				const response = await fetch('/api/auth.php?action=login', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data),
				});

				const result = await response.json();

				if (response.ok) {
					// Modified for correct path
					// On successful login, redirect to the main application at the root level.
					window.location.href = '/index.php';
				} else {
					displayMessage(result.message || 'An unknown error occurred.', 'error');
				}

			} catch (error) {
				console.error('Login fetch error:', error);
				displayMessage('Could not connect to the server. Please try again later.', 'error');
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
			messageContainer.className = type; // Applies the .success or .error class for styling.
			messageContainer.style.display = 'block';
		}
	}
});