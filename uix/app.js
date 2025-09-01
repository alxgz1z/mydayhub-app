/**
 * MyDayHub Beta 5 - Main Application Logic
 *
 * This script initializes the application, handles view switching,
 * and loads the necessary modules for the active view.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */
document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	// For now, we only have the Tasks view.
	// We check if the function to initialize it exists before calling it.
	if (typeof initTasksView === 'function') {
		initTasksView();
	}

	// Future logic for view tabs and other global UI will go here.
});


// ==========================================================================
// --- TOAST NOTIFICATION SYSTEM ---
// Added for Toast Notifications
// ==========================================================================

/**
 * Displays a toast notification message.
 * @param {string} message The message to display.
 * @param {string} [type='info'] The type of toast ('info', 'success', 'error').
 * @param {number} [duration=3000] The duration in milliseconds for the toast to be visible.
 */
function showToast(message, type = 'info', duration = 3000) {
	const container = document.getElementById('toast-container');
	if (!container) {
		console.error('Toast container not found!');
		return;
	}

	// Create the toast element
	const toast = document.createElement('div');
	toast.className = `toast ${type}`; // e.g., 'toast success'
	toast.textContent = message;

	// Add to the DOM
	container.appendChild(toast);

	// Animate it in
	// We use a short timeout to allow the browser to render the initial state before transitioning
	setTimeout(() => {
		toast.classList.add('visible');
	}, 10);

	// Set a timeout to remove the toast
	setTimeout(() => {
		toast.classList.remove('visible');
		
		// Remove the element from the DOM after the fade-out animation has completed
		toast.addEventListener('transitionend', () => {
			toast.remove();
		});

	}, duration);
}