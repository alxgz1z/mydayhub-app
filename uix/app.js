/**
 * Code for /uix/app.js
 *
 *  MyDayHub - Main Application Logic
 *
 * This script initializes the application, handles view switching,
 * and contains global UI functions like toasts and modals.
 *
 * @version 7.4 Jaco
 * @author Alex & Gemini & Claude & Cursor
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

// Make mission focus chart function globally available
window.updateMissionFocusChart = updateMissionFocusChart;

/**
 * Toggle header date visibility
 */
function toggleHeaderDateVisibility(state) {
	const headerDateOffBtn = document.getElementById('header-date-off');
	const headerDateOnBtn = document.getElementById('header-date-on');
	const headerDateElement = document.getElementById('header-date');
	
	if (!headerDateOffBtn || !headerDateOnBtn || !headerDateElement) return;
	
	const isVisible = state === 'on';
	
	// Update button states
	headerDateOffBtn.classList.toggle('active', !isVisible);
	headerDateOnBtn.classList.toggle('active', isVisible);
	
	// Show/hide date
	headerDateElement.style.display = isVisible ? 'block' : 'none';
	
	// Save preference
	localStorage.setItem('showHeaderDate', isVisible ? 'true' : 'false');
}

/**
 * Load header date visibility preference
 */
function loadHeaderDatePreference() {
	const headerDateOffBtn = document.getElementById('header-date-off');
	const headerDateOnBtn = document.getElementById('header-date-on');
	const headerDateElement = document.getElementById('header-date');
	
	if (!headerDateOffBtn || !headerDateOnBtn || !headerDateElement) return;
	
	const savedPreference = localStorage.getItem('showHeaderDate');
	const shouldShow = savedPreference !== null ? savedPreference === 'true' : true; // Default to true
	
	// Update button states
	headerDateOffBtn.classList.toggle('active', !shouldShow);
	headerDateOnBtn.classList.toggle('active', shouldShow);
	
	// Show/hide date
	headerDateElement.style.display = shouldShow ? 'block' : 'none';
}

/**
 * Toggle mission focus chart visibility
 */
function toggleMissionFocusChart(state) {
	const missionFocusOffBtn = document.getElementById('mission-focus-off');
	const missionFocusOnBtn = document.getElementById('mission-focus-on');
	const missionFocusChart = document.getElementById('mission-focus-chart');
	
	if (!missionFocusOffBtn || !missionFocusOnBtn || !missionFocusChart) return;
	
	const isVisible = state === 'on';
	
	// Update button states
	missionFocusOffBtn.classList.toggle('active', !isVisible);
	missionFocusOnBtn.classList.toggle('active', isVisible);
	
	// Show/hide chart
	missionFocusChart.style.display = isVisible ? 'block' : 'none';
	
	// Save preference
	localStorage.setItem('showMissionFocusChart', isVisible ? 'true' : 'false');
	
	// Update chart if showing
	if (isVisible) {
		updateMissionFocusChart();
	}
}

/**
 * Load mission focus chart visibility preference
 */
function loadMissionFocusPreference() {
	const missionFocusOffBtn = document.getElementById('mission-focus-off');
	const missionFocusOnBtn = document.getElementById('mission-focus-on');
	const missionFocusChart = document.getElementById('mission-focus-chart');
	
	if (!missionFocusOffBtn || !missionFocusOnBtn || !missionFocusChart) return;
	
	const savedPreference = localStorage.getItem('showMissionFocusChart');
	const shouldShow = savedPreference !== null ? savedPreference === 'true' : false; // Default to false
	
	// Update button states
	missionFocusOffBtn.classList.toggle('active', !shouldShow);
	missionFocusOnBtn.classList.toggle('active', shouldShow);
	
	// Show/hide chart
	missionFocusChart.style.display = shouldShow ? 'block' : 'none';
	
	// Update chart if showing
	if (shouldShow) {
		updateMissionFocusChart();
	}
}

/**
 * Update mission focus chart with current task data
 */
function updateMissionFocusChart() {
	const missionFocusChart = document.getElementById('mission-focus-chart');
	if (!missionFocusChart || missionFocusChart.style.display === 'none') return;
	
	// Safety check to prevent infinite loops
	if (window._updatingMissionChart) return;
	window._updatingMissionChart = true;
	
	try {
		// Get all tasks that are not completed
		const tasks = document.querySelectorAll('.task-card:not(.completed)');
	
		let signalCount = 0;
		let supportCount = 0;
		let backlogCount = 0;
		
		tasks.forEach(task => {
			const colorBand = task.querySelector('.task-color-band');
			if (!colorBand) return;
			
			const classList = colorBand.classList;
			if (classList.contains('signal')) {
				signalCount++;
			} else if (classList.contains('support')) {
				supportCount++;
			} else if (classList.contains('backlog')) {
				backlogCount++;
			}
		});
		
		const total = signalCount + supportCount + backlogCount;
		
		if (total === 0) {
			// No tasks, show empty state
			missionFocusChart.innerHTML = `
				<svg viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="10" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>
				</svg>
			`;
			missionFocusChart.setAttribute('data-tooltip', 'No active tasks');
			window._updatingMissionChart = false;
			return;
		}
		
		const signalPercent = (signalCount / total) * 100;
		const supportPercent = (supportCount / total) * 100;
		const backlogPercent = (backlogCount / total) * 100;
		
		// Generate concentric rings SVG (like Apple Fitness)
		// Outer ring (Backlog - Orange), Middle ring (Support - Blue), Inner ring (Signal - Green)
		const centerX = 12;
		const centerY = 12;
		const strokeWidth = 2;
		
		// Calculate ring progress (0-1) based on task counts
		const maxTasks = Math.max(signalCount, supportCount, backlogCount, 1);
		const signalProgress = signalCount / maxTasks;
		const supportProgress = supportCount / maxTasks;
		const backlogProgress = backlogCount / maxTasks;
		
		missionFocusChart.innerHTML = `
			<svg viewBox="0 0 24 24">
				<!-- Outer ring - Backlog (Orange) -->
				<circle cx="${centerX}" cy="${centerY}" r="9" 
					fill="none" 
					stroke="#e5e7eb" 
					stroke-width="${strokeWidth}"
					stroke-dasharray="${2 * Math.PI * 9}" 
					stroke-dashoffset="${2 * Math.PI * 9 * (1 - backlogProgress)}"
					stroke-linecap="round"
					transform="rotate(-90 ${centerX} ${centerY})" />
				<circle cx="${centerX}" cy="${centerY}" r="9" 
					fill="none" 
					stroke="#f97316" 
					stroke-width="${strokeWidth}"
					stroke-dasharray="${2 * Math.PI * 9}" 
					stroke-dashoffset="${2 * Math.PI * 9 * (1 - backlogProgress)}"
					stroke-linecap="round"
					transform="rotate(-90 ${centerX} ${centerY})" />
				
				<!-- Middle ring - Support (Blue) -->
				<circle cx="${centerX}" cy="${centerY}" r="6" 
					fill="none" 
					stroke="#e5e7eb" 
					stroke-width="${strokeWidth}"
					stroke-dasharray="${2 * Math.PI * 6}" 
					stroke-dashoffset="${2 * Math.PI * 6 * (1 - supportProgress)}"
					stroke-linecap="round"
					transform="rotate(-90 ${centerX} ${centerY})" />
				<circle cx="${centerX}" cy="${centerY}" r="6" 
					fill="none" 
					stroke="#3b82f6" 
					stroke-width="${strokeWidth}"
					stroke-dasharray="${2 * Math.PI * 6}" 
					stroke-dashoffset="${2 * Math.PI * 6 * (1 - supportProgress)}"
					stroke-linecap="round"
					transform="rotate(-90 ${centerX} ${centerY})" />
				
				<!-- Inner ring - Signal (Green) -->
				<circle cx="${centerX}" cy="${centerY}" r="3" 
					fill="none" 
					stroke="#e5e7eb" 
					stroke-width="${strokeWidth}"
					stroke-dasharray="${2 * Math.PI * 3}" 
					stroke-dashoffset="${2 * Math.PI * 3 * (1 - signalProgress)}"
					stroke-linecap="round"
					transform="rotate(-90 ${centerX} ${centerY})" />
				<circle cx="${centerX}" cy="${centerY}" r="3" 
					fill="none" 
					stroke="#22c55e" 
					stroke-width="${strokeWidth}"
					stroke-dasharray="${2 * Math.PI * 3}" 
					stroke-dashoffset="${2 * Math.PI * 3 * (1 - signalProgress)}"
					stroke-linecap="round"
					transform="rotate(-90 ${centerX} ${centerY})" />
			</svg>
		`;
		
		// Set tooltip
		missionFocusChart.setAttribute('data-tooltip', 
			`${Math.round(signalPercent)}% Signal, ${Math.round(supportPercent)}% Support, ${Math.round(backlogPercent)}% Backlog`
		);
		
		// Clear the safety flag
		window._updatingMissionChart = false;
	} catch (error) {
		console.error('Error updating mission focus chart:', error);
		window._updatingMissionChart = false;
	}
}


document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	updateFooterDate();
	initSettingsPanel();

	if (typeof initTasksView === 'function') {
		initTasksView();
		// Ensure date is updated after tasks view loads
		setTimeout(updateFooterDate, 100);
	}
	
	// Initialize calendar overlay after settings panel and tasks view are ready
	setTimeout(() => {
		if (typeof initCalendarOverlay === 'function') {
			initCalendarOverlay();
		}
	}, 100);
	
	// Update mission focus chart when tasks change (disabled to prevent infinite loop)
	// TODO: Implement proper task change detection without MutationObserver
});

// ==========================================================================
// --- MODAL MANAGEMENT SYSTEM ---
// ==========================================================================

/**
 * Modal stack management for proper ESC key handling
 */
const modalStack = [];

/**
 * Registers a modal in the stack for proper ESC key handling
 * @param {string} modalId - The modal identifier
 * @param {Function} closeFunction - Function to call when ESC is pressed
 */
function registerModal(modalId, closeFunction) {
	modalStack.push({ id: modalId, close: closeFunction });
}

/**
 * Unregisters a modal from the stack
 * @param {string} modalId - The modal identifier
 */
function unregisterModal(modalId) {
	const index = modalStack.findIndex(modal => modal.id === modalId);
	if (index !== -1) {
		modalStack.splice(index, 1);
	}
}

/**
 * Global ESC key handler that respects modal stack order
 */
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		// Close the topmost modal first
		if (modalStack.length > 0) {
			const topModal = modalStack[modalStack.length - 1];
			topModal.close();
			e.preventDefault();
			e.stopPropagation();
		}
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
	const themeDarkBtn = document.getElementById('theme-dark');
	const themeLightBtn = document.getElementById('theme-light');
	const themeHighContrastBtn = document.getElementById('theme-high-contrast');
	// Modified for Change Password
	const changePasswordBtn = document.getElementById('btn-change-password');


	if (!toggleBtn || !closeBtn || !overlay || !themeDarkBtn || !themeLightBtn || !themeHighContrastBtn || !changePasswordBtn) {
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

	// ESC key handling now managed by modal stack system

	// Modified for Trust Management Regression Fix
	// Initialize Trust Management button in settings
	const trustButton = document.getElementById('btn-trust-management');
	if (trustButton) {
		trustButton.addEventListener('click', openTrustManagementModal);
	}

	// Theme selector event listeners
	themeDarkBtn.addEventListener('click', () => {
		setTheme('dark');
	});

	themeLightBtn.addEventListener('click', () => {
		setTheme('light');
	});

	themeHighContrastBtn.addEventListener('click', () => {
		setTheme('high-contrast');
	});

	// Font Size Selector
	const fontSmallerBtn = document.getElementById('font-smaller');
	const fontResetBtn = document.getElementById('font-reset');
	const fontLargerBtn = document.getElementById('font-larger');
	if (fontSmallerBtn && fontResetBtn && fontLargerBtn) {
		fontSmallerBtn.addEventListener('click', () => adjustFontSize('smaller'));
		fontResetBtn.addEventListener('click', () => adjustFontSize('reset'));
		fontLargerBtn.addEventListener('click', () => adjustFontSize('larger'));
		
		// Load font size preference
		loadFontSizePreference();
	}
	
	// Header Date Visibility Toggle
	const headerDateOffBtn = document.getElementById('header-date-off');
	const headerDateOnBtn = document.getElementById('header-date-on');
	if (headerDateOffBtn && headerDateOnBtn) {
		headerDateOffBtn.addEventListener('click', () => toggleHeaderDateVisibility('off'));
		headerDateOnBtn.addEventListener('click', () => toggleHeaderDateVisibility('on'));
		// Load saved preference
		loadHeaderDatePreference();
	}
	
	// Mission Focus Chart Toggle
	const missionFocusOffBtn = document.getElementById('mission-focus-off');
	const missionFocusOnBtn = document.getElementById('mission-focus-on');
	if (missionFocusOffBtn && missionFocusOnBtn) {
		missionFocusOffBtn.addEventListener('click', () => toggleMissionFocusChart('off'));
		missionFocusOnBtn.addEventListener('click', () => toggleMissionFocusChart('on'));
		// Load saved preference
		loadMissionFocusPreference();
	}

	// Completion Sound Selector
	const soundOffBtn = document.getElementById('sound-off');
	const soundOnBtn = document.getElementById('sound-on');
	if (soundOffBtn && soundOnBtn) {
		// Load saved preference
		loadCompletionSoundPreference();
		
		// Add event listeners for button clicks
		soundOffBtn.addEventListener('click', () => {
			setCompletionSound(false);
		});
		
		soundOnBtn.addEventListener('click', () => {
			setCompletionSound(true);
		});
	}

	// Modified for Change Password
	changePasswordBtn.addEventListener('click', openChangePasswordModal);
	initPasswordModalListeners();
	
	// Initialize theme selector state
	loadThemePreferences();
	
	// Modified for Usage Stats Modal
	const usageStatsBtn = document.getElementById('btn-usage-stats');
	if (usageStatsBtn) {
		usageStatsBtn.addEventListener('click', openUsageStatsModal);
	}
}

/**
 * Sets the application theme
 * @param {string} theme - The theme to set ('dark', 'light', or 'high-contrast')
 */
function setTheme(theme) {
	// Remove all theme classes
	document.body.classList.remove('light-mode', 'high-contrast');
	
	// Remove active class from all theme buttons
	document.getElementById('theme-dark').classList.remove('active');
	document.getElementById('theme-light').classList.remove('active');
	document.getElementById('theme-high-contrast').classList.remove('active');
	
	// Apply the selected theme
	switch (theme) {
		case 'light':
			document.body.classList.add('light-mode');
			document.getElementById('theme-light').classList.add('active');
			// Save to both localStorage (immediate) and backend (persistent)
			localStorage.setItem('light_mode', 'true');
			localStorage.setItem('high_contrast_mode', 'false');
			saveUserPreference('light_mode', true);
			saveUserPreference('high_contrast_mode', false);
			break;
		case 'high-contrast':
			document.body.classList.add('high-contrast');
			document.getElementById('theme-high-contrast').classList.add('active');
			// Save to both localStorage (immediate) and backend (persistent)
			localStorage.setItem('light_mode', 'false');
			localStorage.setItem('high_contrast_mode', 'true');
			saveUserPreference('light_mode', false);
			saveUserPreference('high_contrast_mode', true);
			break;
		case 'dark':
		default:
			document.getElementById('theme-dark').classList.add('active');
			// Save to both localStorage (immediate) and backend (persistent)
			localStorage.setItem('light_mode', 'false');
			localStorage.setItem('high_contrast_mode', 'false');
			saveUserPreference('light_mode', false);
			saveUserPreference('high_contrast_mode', false);
			break;
	}
}

/**
 * Loads and applies saved theme preferences
 * This function is called during app initialization and will be overridden
 * by the backend preferences when they are loaded in tasks.js
 */
function loadThemePreferences() {
	// Use localStorage as fallback during initial load
	// Backend preferences will override this when tasks.js loads
	const lightMode = localStorage.getItem('light_mode') === 'true';
	const highContrast = localStorage.getItem('high_contrast_mode') === 'true';
	
	if (highContrast) {
		document.body.classList.add('high-contrast');
		document.body.classList.remove('light-mode');
		const themeHighContrastBtn = document.getElementById('theme-high-contrast');
		const themeLightBtn = document.getElementById('theme-light');
		const themeDarkBtn = document.getElementById('theme-dark');
		if (themeHighContrastBtn) themeHighContrastBtn.classList.add('active');
		if (themeLightBtn) themeLightBtn.classList.remove('active');
		if (themeDarkBtn) themeDarkBtn.classList.remove('active');
	} else if (lightMode) {
		document.body.classList.add('light-mode');
		document.body.classList.remove('high-contrast');
		const themeHighContrastBtn = document.getElementById('theme-high-contrast');
		const themeLightBtn = document.getElementById('theme-light');
		const themeDarkBtn = document.getElementById('theme-dark');
		if (themeHighContrastBtn) themeHighContrastBtn.classList.remove('active');
		if (themeLightBtn) themeLightBtn.classList.add('active');
		if (themeDarkBtn) themeDarkBtn.classList.remove('active');
	} else {
		// Default to dark theme
		document.body.classList.remove('light-mode', 'high-contrast');
		const themeHighContrastBtn = document.getElementById('theme-high-contrast');
		const themeLightBtn = document.getElementById('theme-light');
		const themeDarkBtn = document.getElementById('theme-dark');
		if (themeHighContrastBtn) themeHighContrastBtn.classList.remove('active');
		if (themeLightBtn) themeLightBtn.classList.remove('active');
		if (themeDarkBtn) themeDarkBtn.classList.add('active');
	}
}

/**
 * Loads the completion sound preference from localStorage and updates the UI
 */
function loadCompletionSoundPreference() {
	const soundOffBtn = document.getElementById('sound-off');
	const soundOnBtn = document.getElementById('sound-on');
	if (soundOffBtn && soundOnBtn) {
		// Default to enabled if no preference is saved
		const isEnabled = localStorage.getItem('completion_sound_enabled') !== 'false';
		updateSoundSelectorUI(isEnabled);
	}
}

/**
 * Updates the sound selector UI to show the active state
 * @param {boolean} isEnabled - Whether sound is enabled
 */
function updateSoundSelectorUI(isEnabled) {
	const soundOffBtn = document.getElementById('sound-off');
	const soundOnBtn = document.getElementById('sound-on');
	
	if (soundOffBtn && soundOnBtn) {
		// Remove active class from both buttons
		soundOffBtn.classList.remove('active');
		soundOnBtn.classList.remove('active');
		
		// Add active class to the correct button
		if (isEnabled) {
			soundOnBtn.classList.add('active');
		} else {
			soundOffBtn.classList.add('active');
		}
	}
}

/**
 * Sets the completion sound preference and updates UI
 * @param {boolean} isEnabled - Whether completion sound should be enabled
 */
function setCompletionSound(isEnabled) {
	updateSoundSelectorUI(isEnabled);
	saveCompletionSoundPreference(isEnabled);
}

/**
 * Saves the completion sound preference to both localStorage and backend
 * @param {boolean} isEnabled - Whether completion sound should be enabled
 */
async function saveCompletionSoundPreference(isEnabled) {
	// Save to localStorage for immediate access
	localStorage.setItem('completion_sound_enabled', isEnabled.toString());
	
	// Save to backend for persistence
	try {
		await saveUserPreference('completion_sound_enabled', isEnabled);
	} catch (error) {
		console.error('Error saving completion sound preference:', error);
	}
}

/**
 * Checks if completion sound is enabled
 * @returns {boolean} - Whether completion sound should play
 */
function isCompletionSoundEnabled() {
	return localStorage.getItem('completion_sound_enabled') !== 'false';
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
 * Syncs localStorage with backend preferences
 * This should be called after backend preferences are loaded
 */
window.syncThemeWithBackend = function(lightMode, highContrast) {
	// Update localStorage to match backend
	localStorage.setItem('light_mode', lightMode ? 'true' : 'false');
	localStorage.setItem('high_contrast_mode', highContrast ? 'true' : 'false');
	
	// Apply the theme
	if (highContrast) {
		document.body.classList.add('high-contrast');
		document.body.classList.remove('light-mode');
		const themeHighContrastBtn = document.getElementById('theme-high-contrast');
		const themeLightBtn = document.getElementById('theme-light');
		const themeDarkBtn = document.getElementById('theme-dark');
		if (themeHighContrastBtn) themeHighContrastBtn.classList.add('active');
		if (themeLightBtn) themeLightBtn.classList.remove('active');
		if (themeDarkBtn) themeDarkBtn.classList.remove('active');
	} else if (lightMode) {
		document.body.classList.add('light-mode');
		document.body.classList.remove('high-contrast');
		const themeHighContrastBtn = document.getElementById('theme-high-contrast');
		const themeLightBtn = document.getElementById('theme-light');
		const themeDarkBtn = document.getElementById('theme-dark');
		if (themeHighContrastBtn) themeHighContrastBtn.classList.remove('active');
		if (themeLightBtn) themeLightBtn.classList.add('active');
		if (themeDarkBtn) themeDarkBtn.classList.remove('active');
	} else {
		// Default to dark theme
		document.body.classList.remove('light-mode', 'high-contrast');
		const themeHighContrastBtn = document.getElementById('theme-high-contrast');
		const themeLightBtn = document.getElementById('theme-light');
		const themeDarkBtn = document.getElementById('theme-dark');
		if (themeHighContrastBtn) themeHighContrastBtn.classList.remove('active');
		if (themeLightBtn) themeLightBtn.classList.remove('active');
		if (themeDarkBtn) themeDarkBtn.classList.add('active');
	}
};


/**
 * Opens the settings panel by removing the .hidden class from its overlay.
 */
function openSettingsPanel() {
	const overlay = document.getElementById('settings-panel-overlay');
	if (overlay) {
		overlay.classList.remove('hidden');
		// Register settings panel in modal stack
		registerModal('settings-panel', closeSettingsPanel);
	}
}

/**
 * Closes the settings panel by adding the .hidden class to its overlay.
 */
function closeSettingsPanel() {
	const overlay = document.getElementById('settings-panel-overlay');
	if (overlay) {
		overlay.classList.add('hidden');
		// Unregister settings panel from modal stack
		unregisterModal('settings-panel');
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
		// Register password change modal in modal stack
		registerModal('password-change-modal', closeChangePasswordModal);
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
		// Unregister password change modal from modal stack
		unregisterModal('password-change-modal');
		document.getElementById('change-password-form').reset();
	}
}


// ==========================================================================
// --- UI HELPERS ---
// ==========================================================================

/**
 * Updates the date in both header and footer to the current date in "dd mmm yy" format.
 */
function updateFooterDate() {
	const footerDateEl = document.getElementById('footer-date');
	const headerDateEl = document.getElementById('header-date');
	
	const now = new Date();
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	
	const day = String(now.getDate()).padStart(2, '0');
	const month = months[now.getMonth()];
	const year = String(now.getFullYear()).slice(-2);
	const dateString = `${day} ${month} ${year}`;

	if (footerDateEl) {
		footerDateEl.textContent = dateString;
	}
	if (headerDateEl) {
		headerDateEl.textContent = dateString;
	}
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
	
	// Prevent empty toast messages
	const displayMessage = message || '<insert notification here>';

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
	messageEl.textContent = displayMessage;
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
	
	// Register confirm modal in modal stack
	registerModal('confirm-modal', handleNo);

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
			unregisterModal('confirm-modal');
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
	
	// Register date modal in modal stack
	registerModal('date-modal', handleCancel);

	return new Promise(resolve => {
		let isResolved = false;

		const resolveOnce = (value) => {
			if (isResolved) return;
			isResolved = true;
			cleanup();
			resolve(value);
		};
		
		const cleanup = () => {
			modalOverlay.classList.add('hidden');
			unregisterModal('date-modal');
			document.removeEventListener('keydown', handleEscKey);
			modalOverlay.removeEventListener('click', handleOverlayClick);
			saveBtn.removeEventListener('click', handleSave);
			removeBtn.removeEventListener('click', handleRemove);
			cancelBtn.removeEventListener('click', handleCancel);
		};

		const handleSave = () => resolveOnce(input.value);
		const handleRemove = () => resolveOnce('');
		const handleCancel = () => resolveOnce(null);
		
		const handleOverlayClick = (e) => {
			if (e.target === modalOverlay) handleCancel();
		};

		// ESC key handling now managed by modal stack system

		saveBtn.addEventListener('click', handleSave);
		removeBtn.addEventListener('click', handleRemove);
		cancelBtn.addEventListener('click', handleCancel);
		modalOverlay.addEventListener('click', handleOverlayClick);
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
	
	// Register usage stats modal in modal stack
	registerModal('usage-stats-modal', closeUsageStatsModal);
	
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
		// Unregister usage stats modal from modal stack
		unregisterModal('usage-stats-modal');
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
	
	// Register trust management modal in modal stack
	registerModal('trust-management-modal', closeTrustManagementModal);
	
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
	// Unregister trust management modal from modal stack
	unregisterModal('trust-management-modal');
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

/**
 * Play a subtle completion sound using Web Audio API
 * No external files needed - generates audio programmatically
 */
function playCompletionSound() {
	try {
		// Create audio context (reuse existing one if available)
		const audioContext = window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
		window.audioContext = audioContext;
		
		// Resume context if it's suspended (required by some browsers)
		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}
		
		// Create a subtle, pleasant completion chime
		// Two-tone chime: higher note followed by lower note
		const now = audioContext.currentTime;
		
		// First tone (higher, celebratory)
		const oscillator1 = audioContext.createOscillator();
		const gain1 = audioContext.createGain();
		
		oscillator1.connect(gain1);
		gain1.connect(audioContext.destination);
		
		oscillator1.frequency.setValueAtTime(800, now); // Pleasant high frequency
		oscillator1.type = 'sine'; // Smooth sine wave
		
		// Envelope for first tone - quick attack, gentle decay
		gain1.gain.setValueAtTime(0, now);
		gain1.gain.linearRampToValueAtTime(0.15, now + 0.01); // Quick attack
		gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2); // Gentle decay
		
		oscillator1.start(now);
		oscillator1.stop(now + 0.2);
		
		// Second tone (lower, satisfying resolution)
		const oscillator2 = audioContext.createOscillator();
		const gain2 = audioContext.createGain();
		
		oscillator2.connect(gain2);
		gain2.connect(audioContext.destination);
		
		oscillator2.frequency.setValueAtTime(600, now + 0.1); // Slightly lower frequency
		oscillator2.type = 'sine';
		
		// Envelope for second tone
		gain2.gain.setValueAtTime(0, now + 0.1);
		gain2.gain.linearRampToValueAtTime(0.12, now + 0.11);
		gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
		
		oscillator2.start(now + 0.1);
		oscillator2.stop(now + 0.4);
		
	} catch (error) {
		// Silently fail if Web Audio API is not supported or user interaction required
		console.log('Completion sound not available:', error.message);
	}
}

// Make completion sound functions globally available
window.playCompletionSound = playCompletionSound;
window.isCompletionSoundEnabled = isCompletionSoundEnabled;
window.updateSoundSelectorUI = updateSoundSelectorUI;

/**
 * DEBUG: Function to check task classifications - call from browser console
 */
window.debugTaskClassifications = function() {
	const tasks = document.querySelectorAll('.task-card');
	console.log('=== TASK CLASSIFICATION DEBUG ===');
	tasks.forEach((task, index) => {
		const taskId = task.dataset.taskId;
		const classification = task.dataset.classification;
		const classes = Array.from(task.classList).filter(c => c.startsWith('classification-'));
		const statusBand = task.querySelector('.task-status-band');
		const computedStyle = statusBand ? window.getComputedStyle(statusBand) : null;
		
		console.log(`Task ${index + 1}:`, {
			taskId,
			classification,
			classes,
			statusBandExists: !!statusBand,
			backgroundColor: computedStyle ? computedStyle.backgroundColor : 'N/A',
			background: computedStyle ? computedStyle.background : 'N/A'
		});
	});
	console.log('=== END DEBUG ===');
};

/**
 * Adjust global font size
 */
function adjustFontSize(action) {
	const currentSize = parseInt(localStorage.getItem('global_font_size') || '100');
	let newSize = currentSize;
	
	switch (action) {
		case 'smaller':
			newSize = Math.max(80, currentSize - 10); // Minimum 80%
			break;
		case 'larger':
			newSize = Math.min(150, currentSize + 10); // Maximum 150%
			break;
		case 'reset':
		default:
			newSize = 100; // Default 100%
			break;
	}
	
	// Apply font size
	applyFontSize(newSize);
	
	// Save preference
	saveFontSizePreference(newSize);
	
	// Update UI
	updateFontSizeUI(newSize);
}

/**
 * Apply font size to the document
 */
function applyFontSize(size) {
	document.documentElement.style.fontSize = size + '%';
}

/**
 * Load font size preference and apply it
 */
function loadFontSizePreference() {
	const savedSize = parseInt(localStorage.getItem('global_font_size') || '100');
	applyFontSize(savedSize);
	updateFontSizeUI(savedSize);
}

/**
 * Save font size preference to localStorage and backend
 */
async function saveFontSizePreference(size) {
	// Save to localStorage for immediate access
	localStorage.setItem('global_font_size', size.toString());
	
	// Save to backend for persistence
	try {
		await saveUserPreference('global_font_size', size);
	} catch (error) {
		console.error('Error saving font size preference:', error);
	}
}

/**
 * Update font size UI buttons
 */
function updateFontSizeUI(size) {
	const fontSmallerBtn = document.getElementById('font-smaller');
	const fontResetBtn = document.getElementById('font-reset');
	const fontLargerBtn = document.getElementById('font-larger');
	
	if (fontSmallerBtn && fontResetBtn && fontLargerBtn) {
		// Remove active class from all buttons
		fontSmallerBtn.classList.remove('active');
		fontResetBtn.classList.remove('active');
		fontLargerBtn.classList.remove('active');
		
		// Add active class to appropriate button
		if (size === 100) {
			fontResetBtn.classList.add('active');
		} else if (size < 100) {
			fontSmallerBtn.classList.add('active');
		} else {
			fontLargerBtn.classList.add('active');
		}
	}
}

// Make font size functions globally available
window.applyFontSize = applyFontSize;
window.updateFontSizeUI = updateFontSizeUI;

// Make modal management functions globally available
window.registerModal = registerModal;
window.unregisterModal = unregisterModal;