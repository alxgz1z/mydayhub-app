/**
 * MyDayHub Beta 5 - Main Application Logic
 *
 * This script initializes the application, handles view switching,
 * and contains global UI functions like toasts and modals.
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


// ==========================================================================
// --- CONFIRMATION MODAL SYSTEM ---
// Added for Confirmation Modal
// ==========================================================================

/**
 * Displays a confirmation modal and returns a Promise that resolves with the user's choice.
 * @param {string} message The confirmation message to display.
 * @returns {Promise<boolean>} A promise that resolves to `true` if confirmed, `false` otherwise.
 */
function showConfirm(message) {
	const modalOverlay = document.getElementById('confirm-modal-overlay');
	const messageEl = document.getElementById('confirm-modal-message');
	const yesBtn = document.getElementById('btn-confirm-yes');
	const noBtn = document.getElementById('btn-confirm-no');

	if (!modalOverlay || !messageEl || !yesBtn || !noBtn) {
		console.error('Confirmation modal elements not found!');
		return Promise.resolve(false); // Fails safely
	}

	messageEl.textContent = message;
	modalOverlay.classList.remove('hidden');

	return new Promise(resolve => {
		const handleYes = () => {
			cleanup();
			resolve(true);
		};

		const handleNo = () => {
			cleanup();
			resolve(false);
		};

		// Use { once: true } to automatically remove the listener after it fires once.
		// This is a clean way to prevent memory leaks.
		yesBtn.addEventListener('click', handleYes, { once: true });
		noBtn.addEventListener('click', handleNo, { once: true });

		// The cleanup function to hide the modal and remove listeners
		function cleanup() {
			modalOverlay.classList.add('hidden');
			// Although { once: true } removes the listener that fired, we should ensure the other one is also removed.
			yesBtn.removeEventListener('click', handleYes);
			noBtn.removeEventListener('click', handleNo);
		}
	});
}