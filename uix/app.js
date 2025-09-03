/**
 * MyDayHub Beta 5 - Main Application Logic
 *
 * This script initializes the application, handles view switching,
 * and contains global UI functions like toasts and modals.
 *
 * @version 5.1.0
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

	const toast = document.createElement('div');
	toast.className = `toast ${type}`;
	toast.textContent = message;

	container.appendChild(toast);

	setTimeout(() => {
		toast.classList.add('visible');
	}, 10);

	setTimeout(() => {
		toast.classList.remove('visible');
		
		toast.addEventListener('transitionend', () => {
			toast.remove();
		});

	}, duration);
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

		yesBtn.addEventListener('click', handleYes, { once: true });
		noBtn.addEventListener('click', handleNo, { once: true });

		function cleanup() {
			modalOverlay.classList.add('hidden');
			yesBtn.removeEventListener('click', handleYes);
			noBtn.removeEventListener('click', handleNo);
		}
	});
}


// ==========================================================================
// --- DATE PICKER MODAL SYSTEM ---
// Added for Due Date feature
// ==========================================================================

/**
 * Displays a date picker modal.
 * @param {string} [currentDate=''] The current date in YYYY-MM-DD format.
 * @returns {Promise<string|null>} A promise that resolves to the new date string (YYYY-MM-DD),
 * an empty string if cleared, or null if canceled.
 */
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
		const handleSave = () => {
			cleanup();
			resolve(input.value);
		};

		const handleRemove = () => {
			cleanup();
			resolve(''); // Resolve with empty string to signify removal
		};

		const handleCancel = () => {
			cleanup();
			resolve(null); // Resolve with null to signify no change
		};
		
		const handleOverlayClick = (e) => {
			if (e.target === modalOverlay) {
				handleCancel();
			}
		};

		const handleEscKey = (e) => {
			if (e.key === 'Escape') {
				handleCancel();
			}
		};

		saveBtn.addEventListener('click', handleSave);
		removeBtn.addEventListener('click', handleRemove);
		cancelBtn.addEventListener('click', handleCancel);
		modalOverlay.addEventListener('click', handleOverlayClick);
		document.addEventListener('keydown', handleEscKey);

		function cleanup() {
			modalOverlay.classList.add('hidden');
			saveBtn.removeEventListener('click', handleSave);
			removeBtn.removeEventListener('click', handleRemove);
			cancelBtn.removeEventListener('click', handleCancel);
			modalOverlay.removeEventListener('click', handleOverlayClick);
			document.removeEventListener('keydown', handleEscKey);
		}
	});
}