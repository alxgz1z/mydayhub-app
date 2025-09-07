/**
 * MyDayHub Beta 5 - Main Application Logic
 *
 * This script initializes the application, handles view switching,
 * and contains global UI functions like toasts and modals.
 *
 * @version 5.6.5
 * @author Alex & Gemini
 */
document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	updateFooterDate();

	// Modified for Settings Panel: Initialize the panel listeners
	initSettingsPanel();

	// For now, we only have the Tasks view.
	// We check if the function to initialize it exists before calling it.
	if (typeof initTasksView === 'function') {
		initTasksView();
	}
});

// ==========================================================================
// --- SETTINGS PANEL ---
// Modified for Animation Bug Fix
// ==========================================================================

/**
 * Initializes all event listeners for the settings panel.
 */
function initSettingsPanel() {
	const toggleBtn = document.getElementById('btn-settings-toggle');
	const closeBtn = document.getElementById('btn-settings-close');
	const overlay = document.getElementById('settings-panel-overlay');

	if (!toggleBtn || !closeBtn || !overlay) {
		console.error('Settings panel elements could not be found.');
		return;
	}

	toggleBtn.addEventListener('click', openSettingsPanel);
	closeBtn.addEventListener('click', closeSettingsPanel);
	
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) {
			closeSettingsPanel();
		}
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
			closeSettingsPanel();
		}
	});
}

/**
 * Opens the settings panel by removing the .hidden class from its overlay.
 */
function openSettingsPanel() {
	const overlay = document.getElementById('settings-panel-overlay');
	if (overlay) {
		overlay.classList.remove('hidden');
	}
}

/**
 * Closes the settings panel by adding the .hidden class to its overlay.
 */
function closeSettingsPanel() {
	const overlay = document.getElementById('settings-panel-overlay');
	if (overlay) {
		overlay.classList.add('hidden');
	}
}


// ==========================================================================
// --- UI HELPERS ---
// Added for dynamic date
// ==========================================================================

/**
 * Updates the date in the footer to the current date in "dd mmm yy" format.
 */
function updateFooterDate() {
	const dateEl = document.getElementById('footer-date');
	if (!dateEl) return;

	const now = new Date();
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	
	const day = String(now.getDate()).padStart(2, '0');
	const month = months[now.getMonth()];
	const year = String(now.getFullYear()).slice(-2);

	dateEl.textContent = `${day} ${month} ${year}`;
}


// ==========================================================================
// --- TOAST NOTIFICATION SYSTEM ---
// ==========================================================================

/**
 * Displays a toast notification message.
 * @param {object} options - The options for the toast.
 * @param {string} options.message - The message to display.
 * @param {string} [options.type='info'] - The type of toast ('info', 'success', 'error').
 * @param {number} [options.duration=5000] - The duration in ms for the toast to be visible.
 * @param {object|null} [options.action=null] - An object for an action button.
 * @param {string} options.action.text - The text for the action button (e.g., 'Undo').
 * @param {function} options.action.callback - The function to execute on button click.
 */
// Modified for Soft Deletes and UI Polish
function showToast(options) {
	const { message, type = 'info', duration = 5000, action = null } = options;

	const container = document.getElementById('toast-container');
	if (!container) {
		console.error('Toast container not found!');
		return;
	}

	// Create toast element and its main content wrapper
	const toast = document.createElement('div');
	toast.className = `toast ${type}`;
	
	const toastContent = document.createElement('div');
	toastContent.className = 'toast-content';

	// Message
	const messageEl = document.createElement('span');
	messageEl.textContent = message;
	toastContent.appendChild(messageEl);

	// Action Button (if provided)
	if (action && typeof action.callback === 'function') {
		const actionBtn = document.createElement('button');
		actionBtn.className = 'toast-action-btn';
		actionBtn.textContent = action.text || 'Action';
		actionBtn.addEventListener('click', () => {
			action.callback();
			removeToast(); // Close toast immediately on action
		}, { once: true });
		toastContent.appendChild(actionBtn);
	}
	
	toast.appendChild(toastContent);

	// Close Button
	const closeBtn = document.createElement('button');
	closeBtn.className = 'toast-close-btn';
	closeBtn.innerHTML = '&times;';
	closeBtn.addEventListener('click', () => removeToast(), { once: true });
	toast.appendChild(closeBtn);

	// Add to DOM and animate in
	container.appendChild(toast);
	setTimeout(() => toast.classList.add('visible'), 10);

	// Set up removal logic
	const timeoutId = setTimeout(() => removeToast(), duration);

	function removeToast() {
		clearTimeout(timeoutId); // Prevent multiple removals
		toast.classList.remove('visible');
		toast.addEventListener('transitionend', () => toast.remove());
	}
}


// ==========================================================================
// --- CONFIRMATION MODAL SYSTEM ---
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
		
		// Use { once: true } to automatically remove listeners after they fire once.
		yesBtn.addEventListener('click', handleYes, { once: true });
		noBtn.addEventListener('click', handleNo, { once: true });

		function cleanup() {
			modalOverlay.classList.add('hidden');
			// Although {once: true} handles the fired event, we still remove the other one
			// in case the modal is closed via other means in the future.
			yesBtn.removeEventListener('click', handleYes);
			noBtn.removeEventListener('click', handleNo);
		}
	});
}


// ==========================================================================
// --- DATE PICKER MODAL SYSTEM ---
// ==========================================================================

/**
 * Displays a date picker modal.
 * @param {string} [currentDate=''] The current date in YYYY-MM-DD format.
 * @returns {Promise<string|null>} A promise that resolves to the new date string (YYYY-MM-DD),
 * an empty string if cleared, or null if canceled.
 */
// Modified for Double Toast Bug
function showDueDateModal(currentDate = '') {
	const modalOverlay = document.getElementById('date-modal-overlay');
	const input = document.getElementById('date-modal-input');
	const saveBtn = document.getElementById('btn-date-save');
	const removeBtn = document.getElementById('btn-date-remove');
	const cancelBtn = document.getElementById('btn-date-cancel');

	if (!modalOverlay || !input || !saveBtn || !removeBtn || !cancelBtn) {
		console.error('Date modal elements not found!');
		return Promise.resolve(null); // Fails safely
	}

	input.value = currentDate;
	modalOverlay.classList.remove('hidden');

	return new Promise(resolve => {
		let isResolved = false;

		const resolveOnce = (value) => {
			if (isResolved) return;
			isResolved = true;
			cleanup();
			resolve(value);
		};

		const handleSave = () => resolveOnce(input.value);
		const handleRemove = () => resolveOnce('');
		const handleCancel = () => resolveOnce(null);
		
		const handleOverlayClick = (e) => {
			if (e.target === modalOverlay) handleCancel();
		};

		const handleEscKey = (e) => {
			if (e.key === 'Escape') handleCancel();
		};

		// Add listeners
		saveBtn.addEventListener('click', handleSave);
		removeBtn.addEventListener('click', handleRemove);
		cancelBtn.addEventListener('click', handleCancel);
		modalOverlay.addEventListener('click', handleOverlayClick);
		document.addEventListener('keydown', handleEscKey);

		function cleanup() {
			modalOverlay.classList.add('hidden');
			// Remove all listeners to prevent duplicates on next open
			saveBtn.removeEventListener('click', handleSave);
			removeBtn.removeEventListener('click', handleRemove);
			cancelBtn.removeEventListener('click', handleCancel);
			modalOverlay.removeEventListener('click', handleOverlayClick);
			document.removeEventListener('keydown', handleEscKey);
		}
	});
}