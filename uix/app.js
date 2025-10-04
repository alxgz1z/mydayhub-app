/**
 * Code for /uix/app.js
 *
 *  MyDayHub - Main Application Logic
 *
 * This script initializes the application, handles view switching,
 * and contains global UI functions like toasts and modals.
 *
 * @version 7.3 Tamarindo
 * @author Alex & Gemini & Claude
 */

/**
  * A global wrapper for the fetch API that automatically includes the CSRF token.
  * @param {object} bodyPayload - The JSON payload to send.
  * @returns {Promise<any>} - The JSON response from the server.
  */
async function apiFetch(bodyPayload = {}) {
	 const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
	 if (!csrfToken) {
		 throw new Error('CSRF token not found. Please refresh the page.');
	 }
	 const headers = {
		 'Content-Type': 'application/json',
		 'X-CSRF-TOKEN': csrfToken,
	 };
	 const appURL = window.MyDayHub_Config?.appURL || '';
	 const response = await fetch(`${appURL}/api/api.php`, {
		 method: 'POST',
		 headers,
		 body: JSON.stringify(bodyPayload),
	 });
	 
	 // Get the raw response text for debugging
	 const responseText = await response.text();
	 console.log('Raw server response:', responseText);
	 
	 if (!response.ok) {
		 let errorData;
		 try {
			 errorData = JSON.parse(responseText);
		 } catch (e) {
			 // Server returned HTML/text instead of JSON
			 console.error('Server returned non-JSON response:', responseText);
			 throw new Error(`Server error: ${response.status} - Check console for details`);
		 }
		 throw new Error(errorData.message || 'An unknown API error occurred.');
	 }
	 
	 // Try to parse the response as JSON
	 try {
		 return JSON.parse(responseText);
	 } catch (parseError) {
		 console.error('JSON Parse Error:', parseError);
		 console.error('Server returned HTML/text instead of JSON:', responseText);
		 throw new Error('Server returned invalid JSON response. Check console for details.');
	 }
}

// ==========================================================================
// --- SESSION TIMEOUT SYSTEM ---
// ==========================================================================

let sessionWarningShown = false;
let logoutTimer = null;
let warningTimer = null;
let currentTimeoutSeconds = 1800; // Default 30 minutes

/**
 * Initializes the session timeout system with user's preferred duration.
 */
function initSessionTimeout(timeoutSeconds = 1800) {
	currentTimeoutSeconds = timeoutSeconds;
	resetSessionTimer();
	
	// Track user activity to reset timers
	const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
	activityEvents.forEach(event => {
		document.addEventListener(event, resetSessionTimer, true);
	});
}

/**
 * Resets session timeout timers on user activity.
 */
function resetSessionTimer() {
	clearTimeout(logoutTimer);
	clearTimeout(warningTimer);
	sessionWarningShown = false;
	
	const WARNING_SECONDS = 300; // Warn 5 minutes before timeout
	
	// Set warning timer (5 minutes before logout)
	if (currentTimeoutSeconds > WARNING_SECONDS) {
		warningTimer = setTimeout(showSessionWarning, (currentTimeoutSeconds - WARNING_SECONDS) * 1000);
	}
	
	// Set logout timer
	logoutTimer = setTimeout(handleSessionTimeout, currentTimeoutSeconds * 1000);
}

/**
 * Shows session timeout warning with option to extend.
 */
function showSessionWarning() {
	if (!sessionWarningShown) {
		sessionWarningShown = true;
		showToast('Your session will expire in 5 minutes due to inactivity. Click anywhere to extend.', 'warning', {
			duration: 10000,
			action: 'Extend Session',
			callback: resetSessionTimer
		});
	}
}

/**
 * Handles automatic session timeout by redirecting to logout.
 */
function handleSessionTimeout() {
	const appURL = window.MyDayHub_Config?.appURL || '';
	window.location.href = `${appURL}/login/logout.php?reason=timeout`;
}

// Make session timeout functions globally available
window.initSessionTimeout = initSessionTimeout;
window.resetSessionTimer = resetSessionTimer;

// Modified for Global apiFetch Architecture Fix
// Make apiFetch globally available
window.apiFetch = apiFetch;

// Modified for Global apiFetch Architecture Fix
// Make apiFetch globally available
window.apiFetch = apiFetch;

document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	updateFooterDate();
	initSettingsPanel();

	if (typeof initTasksView === 'function') {
		initTasksView();
	}
});

// ==========================================================================
// --- SETTINGS PANEL ---
// ==========================================================================

/**
 * Initializes all event listeners for the settings panel.
 */
function initSettingsPanel() {
	const toggleBtn = document.getElementById('btn-settings-toggle');
	const closeBtn = document.getElementById('btn-settings-close');
	const overlay = document.getElementById('settings-panel-overlay');
	const highContrastToggle = document.getElementById('toggle-high-contrast');
	const lightModeToggle = document.getElementById('toggle-light-mode');
	// Modified for Change Password
	const changePasswordBtn = document.getElementById('btn-change-password');


	if (!toggleBtn || !closeBtn || !overlay || !highContrastToggle || !lightModeToggle || !changePasswordBtn) {
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

	// Modified for Trust Management Regression Fix
	// Initialize Trust Management button in settings
	const trustButton = document.getElementById('btn-trust-management');
	if (trustButton) {
		trustButton.addEventListener('click', openTrustManagementModal);
	}

	lightModeToggle.addEventListener('change', (e) => {
		const isEnabled = e.target.checked;
		document.body.classList.toggle('light-mode', isEnabled);
		saveUserPreference('light_mode', isEnabled);
		if (isEnabled) {
			highContrastToggle.checked = false;
			document.body.classList.remove('high-contrast');
			saveUserPreference('high_contrast_mode', false);
		}
	});

	highContrastToggle.addEventListener('change', (e) => {
		const isEnabled = e.target.checked;
		document.body.classList.toggle('high-contrast', isEnabled);
		saveUserPreference('high_contrast_mode', isEnabled);
		if (isEnabled) {
			lightModeToggle.checked = false;
			document.body.classList.remove('light-mode');
			saveUserPreference('light_mode', false);
		}
	});

	// Modified for Change Password
	changePasswordBtn.addEventListener('click', openChangePasswordModal);
	initPasswordModalListeners();
	
	// Modified for Usage Stats Modal
	const usageStatsBtn = document.getElementById('btn-usage-stats');
	if (usageStatsBtn) {
		usageStatsBtn.addEventListener('click', openUsageStatsModal);
	}
}

/**
 * Saves a user preference to the backend.
 * @param {string} key - The preference key to save.
 * @param {any} value - The value to save.
 */
async function saveUserPreference(key, value) {
	try {
		await window.apiFetch({
			module: 'users',
			action: 'saveUserPreference',
			key: key,
			value: value
		});
	} catch (error) {
		console.error(`Error saving preference '${key}':`, error);
	}
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
// --- PASSWORD CHANGE MODAL ---
// ==========================================================================

// Modified for Change Password
/**
 * Sets up event listeners for the password change modal.
 */
function initPasswordModalListeners() {
	const form = document.getElementById('change-password-form');
	const cancelBtn = document.getElementById('btn-password-cancel');
	const overlay = document.getElementById('password-modal-overlay');

	if (!form || !cancelBtn || !overlay) return;

	cancelBtn.addEventListener('click', closeChangePasswordModal);
	overlay.addEventListener('click', (e) => {
		if(e.target === overlay) closeChangePasswordModal();
	});

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const currentPassword = document.getElementById('current_password').value;
		const newPassword = document.getElementById('new_password').value;
		const confirmPassword = document.getElementById('confirm_password').value;

		if (newPassword !== confirmPassword) {
			showToast({ message: "New passwords do not match.", type: 'error' });
			return;
		}
		if (newPassword.length < 8) {
			showToast({ message: "New password must be at least 8 characters.", type: 'error' });
			return;
		}

		try {
			const result = await window.apiFetch({
				module: 'users',
				action: 'changePassword',
				current_password: currentPassword,
				new_password: newPassword
			});

			if (result.status === 'success') {
				showToast({ message: "Password updated successfully.", type: 'success' });
				closeChangePasswordModal();
			}
		} catch (error) {
			showToast({ message: error.message, type: 'error' });
		}
	});
}

/**
 * Opens the password change modal.
 */
function openChangePasswordModal() {
	const overlay = document.getElementById('password-modal-overlay');
	if (overlay) {
		overlay.classList.remove('hidden');
		document.getElementById('current_password').focus();
	}
}

/**
 * Closes the password change modal and resets the form.
 */
function closeChangePasswordModal() {
	const overlay = document.getElementById('password-modal-overlay');
	if (overlay) {
		overlay.classList.add('hidden');
		document.getElementById('change-password-form').reset();
	}
}


// ==========================================================================
// --- UI HELPERS ---
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
 */
function showToast(options) {
	const { message, type = 'info', duration = 5000, action = null } = options;

	const container = document.getElementById('toast-container');
	if (!container) {
		console.error('Toast container not found!');
		return;
	}

	const toast = document.createElement('div');
	toast.className = `toast ${type}`;
	
	const toastContent = document.createElement('div');
	toastContent.className = 'toast-content';

	const messageEl = document.createElement('span');
	messageEl.textContent = message;
	toastContent.appendChild(messageEl);

	if (action && typeof action.callback === 'function') {
		const actionBtn = document.createElement('button');
		actionBtn.className = 'toast-action-btn';
		actionBtn.textContent = action.text || 'Action';
		actionBtn.addEventListener('click', () => {
			action.callback();
			removeToast();
		}, { once: true });
		toastContent.appendChild(actionBtn);
	}
	
	toast.appendChild(toastContent);

	const closeBtn = document.createElement('button');
	closeBtn.className = 'toast-close-btn';
	closeBtn.innerHTML = '&times;';
	closeBtn.addEventListener('click', () => removeToast(), { once: true });
	toast.appendChild(closeBtn);

	container.appendChild(toast);
	setTimeout(() => toast.classList.add('visible'), 10);

	const timeoutId = setTimeout(() => removeToast(), duration);

	function removeToast() {
		clearTimeout(timeoutId);
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
		return Promise.resolve(false);
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
// ==========================================================================

/**
 * Displays a date picker modal.
 * @param {string} [currentDate=''] The current date in YYYY-MM-DD format.
 * @returns {Promise<string|null>} A promise that resolves to the new date string or null if canceled.
 */
function showDueDateModal(currentDate = '') {
	const modalOverlay = document.getElementById('date-modal-overlay');
	const input = document.getElementById('date-modal-input');
	const saveBtn = document.getElementById('btn-date-save');
	const removeBtn = document.getElementById('btn-date-remove');
	const cancelBtn = document.getElementById('btn-date-cancel');

	if (!modalOverlay || !input || !saveBtn || !removeBtn || !cancelBtn) {
		console.error('Date modal elements not found!');
		return Promise.resolve(null);
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

// ==========================================================================
// --- USAGE STATS MODAL SYSTEM ---
// ==========================================================================

/**
 * Opens the usage stats modal and loads current subscription usage data.
 */
async function openUsageStatsModal() {
	const overlay = document.getElementById('usage-stats-modal-overlay');
	if (!overlay) {
		console.error('Usage stats modal overlay not found');
		return;
	}
	
	overlay.classList.remove('hidden');
	
	// Initialize close button listener if not already done
	const closeBtn = document.getElementById('usage-stats-close-btn');
	if (closeBtn && !closeBtn.hasAttribute('data-listener-added')) {
		closeBtn.addEventListener('click', closeUsageStatsModal);
		closeBtn.setAttribute('data-listener-added', 'true');
	}
	
	// Initialize overlay click to close
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) {
			closeUsageStatsModal();
		}
	});
	
	// Load usage data
	try {
		await fetchAndPopulateUsageStats();
	} catch (error) {
		console.error('Failed to load usage stats:', error);
		showToast({
			message: 'Failed to load usage statistics. Please try again.',
			type: 'error'
		});
	}
}

/**
 * Closes the usage stats modal.
 */
function closeUsageStatsModal() {
	const overlay = document.getElementById('usage-stats-modal-overlay');
	if (overlay) {
		overlay.classList.add('hidden');
	}
}

/**
 * Fetches usage statistics from the API and populates the modal.
 */
async function fetchAndPopulateUsageStats() {
	try {
		const response = await window.apiFetch({
			module: 'users',
			action: 'getUserUsageStats'
		});
		
		if (response.status === 'success') {
			populateUsageStatsModal(response.data);
		} else {
			throw new Error(response.message || 'Failed to fetch usage statistics');
		}
	} catch (error) {
		console.error('Error fetching usage stats:', error);
		throw error;
	}
}

/**
 * Populates the usage stats modal with data from the API.
 * @param {object} data - Usage statistics data from the API
 */
function populateUsageStatsModal(data) {
	// Update subscription tier
	const tierElement = document.getElementById('current-tier');
	if (tierElement) {
		tierElement.textContent = data.subscription_level;
	}
	
	// Update tasks usage
	updateUsageCategory('tasks', data.usage.tasks);
	
	// Update columns usage
	updateUsageCategory('columns', data.usage.columns);
	
	// Update storage usage
	updateStorageUsage(data.usage.storage);
	
	// Update sharing status
	updateSharingStatus(data.features.sharing_enabled);
}

/**
 * Updates a usage category (tasks or columns) with current data.
 * @param {string} category - The category name ('tasks' or 'columns')
 * @param {object} usage - Usage data with used, limit, and percentage properties
 */
function updateUsageCategory(category, usage) {
	const textElement = document.getElementById(`${category}-usage-text`);
	const fillElement = document.getElementById(`${category}-usage-fill`);
	const percentageElement = document.getElementById(`${category}-usage-percentage`);
	
	if (textElement) {
		textElement.textContent = `${usage.used} of ${usage.limit}`;
	}
	
	if (fillElement) {
		fillElement.style.width = `${usage.percentage}%`;
		
		// Apply color coding based on usage percentage
		if (usage.percentage >= 95) {
			fillElement.style.backgroundColor = 'var(--toast-error-bg)';
		} else if (usage.percentage >= 80) {
			fillElement.style.backgroundColor = '#f59e0b';
		} else {
			fillElement.style.backgroundColor = 'var(--accent-color)';
		}
	}
	
	if (percentageElement) {
		percentageElement.textContent = `${usage.percentage}%`;
	}
}

/**
 * Updates storage usage display with formatted MB values.
 * @param {object} storage - Storage usage data with used_mb, limit_mb, and percentage
 */
function updateStorageUsage(storage) {
	const textElement = document.getElementById('storage-usage-text');
	const fillElement = document.getElementById('storage-usage-fill');
	const percentageElement = document.getElementById('storage-usage-percentage');
	
	if (textElement) {
		textElement.textContent = `${storage.used_mb} MB of ${storage.limit_mb} MB`;
	}
	
	if (fillElement) {
		fillElement.style.width = `${storage.percentage}%`;
		
		// Apply color coding based on usage percentage
		if (storage.percentage >= 95) {
			fillElement.style.backgroundColor = 'var(--toast-error-bg)';
		} else if (storage.percentage >= 80) {
			fillElement.style.backgroundColor = '#f59e0b';
		} else {
			fillElement.style.backgroundColor = 'var(--accent-color)';
		}
	}
	
	if (percentageElement) {
		percentageElement.textContent = `${storage.percentage}%`;
	}
}

/**
 * Updates the sharing status display.
 * @param {boolean} enabled - Whether sharing is enabled for the current subscription
 */
function updateSharingStatus(enabled) {
	const statusElement = document.getElementById('sharing-status');
	if (statusElement) {
		statusElement.textContent = enabled ? 'Available' : 'Not Available';
		statusElement.style.color = enabled ? 'var(--toast-success-bg)' : 'var(--text-secondary)';
	}
}

// Make usage stats functions globally available
window.openUsageStatsModal = openUsageStatsModal;
window.closeUsageStatsModal = closeUsageStatsModal;

// ==========================================================================
// --- TRUST MANAGEMENT SYSTEM ---
// ==========================================================================

// Modified for Custom Confirmation Modal Integration - Trust Management functions moved from tasks.js
/**
 * Opens the Trust Management modal and loads sharing data
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
async function openTrustManagementModal() {
	const overlay = document.getElementById('trust-management-modal-overlay');
	overlay.classList.remove('hidden');
	
	// Load trust relationship data
	await loadTrustRelationships();
	
	// Set up event listeners if not already done
	setupTrustManagementEventListeners();
}

/**
 * Closes the Trust Management modal
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
function closeTrustManagementModal() {
	const overlay = document.getElementById('trust-management-modal-overlay');
	overlay.classList.add('hidden');
}

/**
 * Sets up event listeners for Trust Management modal
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
function setupTrustManagementEventListeners() {
	// Close button
	const closeBtn = document.getElementById('trust-management-close-btn');
	if (closeBtn && !closeBtn.hasAttribute('data-listener-added')) {
		closeBtn.addEventListener('click', closeTrustManagementModal);
		closeBtn.setAttribute('data-listener-added', 'true');
	}
	
	// Tab switching
	const tabButtons = document.querySelectorAll('.trust-tab');
	tabButtons.forEach(button => {
		if (!button.hasAttribute('data-listener-added')) {
			button.addEventListener('click', (e) => {
				const tabName = e.target.getAttribute('data-tab');
				switchTrustTab(tabName);
			});
			button.setAttribute('data-listener-added', 'true');
		}
	});
	
	// Close on overlay click
	const overlay = document.getElementById('trust-management-modal-overlay');
	if (overlay && !overlay.hasAttribute('data-listener-added')) {
		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) {
				closeTrustManagementModal();
			}
		});
		overlay.setAttribute('data-listener-added', 'true');
	}
}

/**
 * Switches between trust management tabs
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
function switchTrustTab(tabName) {
	// Update tab buttons
	document.querySelectorAll('.trust-tab').forEach(tab => {
		tab.classList.remove('active');
	});
	document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
	
	// Update tab content
	document.querySelectorAll('.trust-tab-content').forEach(content => {
		content.classList.remove('active');
	});
	document.getElementById(`trust-tab-${tabName}`).classList.add('active');
}

/**
 * Loads and displays trust relationship data
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
async function loadTrustRelationships() {
	try {
		const response = await window.apiFetch({
			module: 'tasks',
			action: 'getTrustRelationships'
		});
		
		if (response.status === 'success') {
			displayTrustStatistics(response.data.statistics);
			displayOutgoingShares(response.data.outgoing_shares);
			displayIncomingShares(response.data.incoming_shares);
		} else {
			showToast({ message: `Error loading trust data: ${response.message}`, type: 'error' });
		}
	} catch (error) {
		console.error('Error loading trust relationships:', error);
		showToast({ message: 'Failed to load trust relationships', type: 'error' });
	}
}

/**
 * Displays trust relationship statistics
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
function displayTrustStatistics(stats) {
	document.getElementById('tasks-shared-by-me').textContent = stats.tasks_shared_by_me;
	document.getElementById('tasks-shared-with-me').textContent = stats.tasks_shared_with_me;
	document.getElementById('people-i-share-with').textContent = stats.unique_people_i_share_with;
	document.getElementById('ready-for-review-count').textContent = stats.ready_for_review_count;
}

/**
 * Displays outgoing shares (tasks I've shared)
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
function displayOutgoingShares(shares) {
	const container = document.getElementById('outgoing-shares-list');
	
	if (shares.length === 0) {
		container.innerHTML = '<p class="no-shares-message">You haven\'t shared any tasks yet.</p>';
		return;
	}
	
	container.innerHTML = shares.map(share => `
		<div class="share-item" data-task-id="${share.task_id}" data-recipient-id="${share.recipient_id}">
			<div class="share-info">
				<div class="share-task-title">${escapeHtml(share.task_title)}</div>
				<div class="share-details">
					<div class="share-user">
						<svg class="share-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
							<circle cx="12" cy="7" r="4"></circle>
						</svg>
						<span>${escapeHtml(share.recipient_username)}</span>
					</div>
					<span class="share-permission ${share.permission}">${share.permission}</span>
					<span class="share-date">Shared ${formatShareDate(share.shared_at)}</span>
					${share.column_name ? `<span class="share-column">in ${escapeHtml(share.column_name)}</span>` : ''}
				</div>
			</div>
			<div class="share-actions">
				${share.ready_for_review ? '<span class="ready-badge">Ready</span>' : ''}
				<button class="share-action-btn revoke" onclick="revokeTaskShare(${share.task_id}, ${share.recipient_id}, '${escapeHtml(share.recipient_username)}')">
					Revoke
				</button>
			</div>
		</div>
	`).join('');
}

/**
 * Displays incoming shares (tasks shared with me)
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
function displayIncomingShares(shares) {
	const container = document.getElementById('incoming-shares-list');
	
	if (shares.length === 0) {
		container.innerHTML = '<p class="no-shares-message">No tasks have been shared with you yet.</p>';
		return;
	}
	
	container.innerHTML = shares.map(share => `
		<div class="share-item" data-task-id="${share.task_id}" data-owner-id="${share.owner_id}">
			<div class="share-info">
				<div class="share-task-title">${escapeHtml(share.task_title)}</div>
				<div class="share-details">
					<div class="share-user">
						<svg class="share-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
							<circle cx="12" cy="7" r="4"></circle>
						</svg>
						<span>${escapeHtml(share.owner_username)}</span>
					</div>
					<span class="share-permission ${share.permission}">${share.permission}</span>
					<span class="share-date">Shared ${formatShareDate(share.shared_at)}</span>
				</div>
			</div>
			<div class="share-actions">
				${share.ready_for_review ? '<span class="ready-badge">Ready</span>' : ''}
				<button class="share-action-btn leave" onclick="leaveSharedTask(${share.task_id}, '${escapeHtml(share.owner_username)}')">
					Leave
				</button>
			</div>
		</div>
	`).join('');
}

/**
 * Formats share date for display
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
function formatShareDate(dateString) {
	const date = new Date(dateString);
	const now = new Date();
	const diffTime = Math.abs(now - date);
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	
	if (diffDays === 1) return 'yesterday';
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
	return date.toLocaleDateString();
}

/**
 * Revokes access to a shared task
 * Modified for Custom Confirmation Modal Integration - Replace browser confirm with custom modal
 */
async function revokeTaskShare(taskId, recipientId, recipientName) {
	// Modified for Custom Confirmation Modal Integration - Replace browser confirm with custom modal
	const confirmed = await showConfirm(`Remove ${recipientName}'s access to this task?`);
	if (!confirmed) {
		return;
	}
	
	try {
		const response = await window.apiFetch({
			module: 'tasks',
			action: 'unshareTask',
			data: {
				task_id: taskId,
				recipient_user_id: recipientId
			}
		});
		
		if (response.status === 'success') {
			showToast({ message: 'Access revoked successfully', type: 'success' });
			await loadTrustRelationships(); // Reload data
			if (typeof fetchAndRenderBoard === 'function') {
				await fetchAndRenderBoard(); // Refresh main board if function exists
			}
		} else {
			showToast({ message: `Error: ${response.message}`, type: 'error' });
		}
	} catch (error) {
		console.error('Error revoking share:', error);
		showToast({ message: 'Failed to revoke access', type: 'error' });
	}
}

/**
 * Leaves a shared task (removes self as recipient)
 * Modified for Custom Confirmation Modal Integration - Replace browser confirm with custom modal
 */
async function leaveSharedTask(taskId, ownerName) {
	// Modified for Custom Confirmation Modal Integration - Replace browser confirm with custom modal
	const confirmed = await showConfirm(`Stop receiving updates for this task from ${ownerName}?`);
	if (!confirmed) {
		return;
	}
	
	try {
		const response = await window.apiFetch({
			module: 'tasks',
			action: 'leaveSharedTask',
			data: {
				task_id: taskId
			}
		});
		
		if (response.status === 'success') {
			showToast({ message: 'Successfully left shared task', type: 'success' });
			await loadTrustRelationships(); // Reload data
			if (typeof fetchAndRenderBoard === 'function') {
				await fetchAndRenderBoard(); // Refresh main board if function exists
			}
		} else {
			showToast({ message: `Error: ${response.message}`, type: 'error' });
		}
	} catch (error) {
		console.error('Error leaving shared task:', error);
		showToast({ message: 'Failed to leave shared task', type: 'error' });
	}
}

/**
 * Escapes HTML to prevent XSS
 * Modified for Custom Confirmation Modal Integration - Moved from tasks.js to app.js
 */
function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// Modified for Custom Confirmation Modal Integration - Make Trust Management functions globally available
window.openTrustManagementModal = openTrustManagementModal;
window.closeTrustManagementModal = closeTrustManagementModal;
window.revokeTaskShare = revokeTaskShare;
window.leaveSharedTask = leaveSharedTask;