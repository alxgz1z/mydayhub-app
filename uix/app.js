/**
 * Code for /uix/app.js
 *
 *  MyDayHub - Main Application Logic
 *
 * This script initializes the application, handles view switching,
 * and contains global UI functions like toasts and modals.
 *
 * @version 8.1 Tamarindo
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
		// Raw server response logged for debugging (removed for production)
	 
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
window.loadHeaderDatePreference = loadHeaderDatePreference;

/**
 * Toggle header date visibility
 */
async function toggleHeaderDateVisibility(state) {
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
	
	// Save preference to both localStorage (immediate) and backend (persistent)
	localStorage.setItem('showHeaderDate', isVisible ? 'true' : 'false');
	
	try {
		await saveUserPreference('show_header_date', isVisible);
	} catch (error) {
		console.error('Error saving header date preference:', error);
	}
}

/**
 * Load header date visibility preference
 */
function loadHeaderDatePreference(userPrefs = null) {
	const headerDateOffBtn = document.getElementById('header-date-off');
	const headerDateOnBtn = document.getElementById('header-date-on');
	const headerDateElement = document.getElementById('header-date');
	
	if (!headerDateOffBtn || !headerDateOnBtn || !headerDateElement) return;
	
	// Check backend preference first, then localStorage fallback, then default to true
	let shouldShow = true; // Default to true
	
	if (userPrefs && typeof userPrefs.show_header_date !== 'undefined') {
		shouldShow = userPrefs.show_header_date;
	} else {
		const savedPreference = localStorage.getItem('showHeaderDate');
		shouldShow = savedPreference !== null ? savedPreference === 'true' : true;
	}
	
	// Update button states
	headerDateOffBtn.classList.toggle('active', !shouldShow);
	headerDateOnBtn.classList.toggle('active', shouldShow);
	
	// Show/hide date
	headerDateElement.style.display = shouldShow ? 'block' : 'none';
}

/**
 * Initialize mobile viewport height fix for browser UI overlays
 */
function initMobileViewportFix() {
	// Only apply on mobile devices
	if (window.innerWidth > 768) return;
	
	function setViewportHeight() {
		const vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	}
	
	// Set initial viewport height
	setViewportHeight();
	
	// Update on resize (handles browser UI show/hide)
	window.addEventListener('resize', setViewportHeight);
	window.addEventListener('orientationchange', () => {
		// Delay to ensure orientation change is complete
		setTimeout(setViewportHeight, 100);
	});
}

/**
 * Wait for task board to load, then update mission focus chart
 */
function waitForTaskBoardAndUpdateChart() {
	const checkForTasks = () => {
		const columns = document.querySelectorAll('.column');
		const tasks = document.querySelectorAll('.task-card:not(.completed)');
		
		if (columns.length > 0 || tasks.length > 0) {
			// Task board is loaded, update chart if visible
			const missionFocusChart = document.getElementById('mission-focus-chart');
			if (missionFocusChart && missionFocusChart.style.display !== 'none') {
				updateMissionFocusChart();
			}
		} else {
			// Task board not loaded yet, check again in 500ms
			setTimeout(checkForTasks, 500);
		}
	};
	
	checkForTasks();
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
		// Wait for task board to load before updating chart
		waitForTaskBoardAndUpdateChart();
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
	const shouldShow = savedPreference !== null ? savedPreference === 'true' : true; // Default to true
	
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
 * Update mission focus chart with current task data and journal entries from last 30 days using Chart.js
 * This function can be called manually or automatically when tasks change
 */
async function updateMissionFocusChart() {
	const missionFocusChart = document.getElementById('mission-focus-chart');
	if (!missionFocusChart || missionFocusChart.style.display === 'none') return;
	
	// Safety check to prevent infinite loops
    if (window._updatingMissionChart) {
        // Queue a trailing update so rapid changes (e.g., quick reclassification)
        // still result in a fresh chart once the current update finishes.
        window._pendingMissionChartUpdate = true;
        return;
    }
	window._updatingMissionChart = true;
	
	// Chart.js available check is redundant - we already check it in waitForTaskBoardAndUpdateChart
	
	try {
        // Prefer DOM when Tasks view is active; fallback to API when not
        let signalCount = 0;
        let supportCount = 0;
        let backlogCount = 0;

        const allTasks = document.querySelectorAll('.task-card:not(.completed)');
        if (allTasks.length > 0) {
            // Count from DOM (Tasks view loaded)
            Array.from(allTasks).forEach(task => {
                const accessType = task.dataset.accessType || 'owner';
                if (accessType === 'recipient') return; // exclude received shared

                let classification = task.getAttribute('data-classification');
                if (!classification) {
                    const classes = Array.from(task.classList);
                    const classMatch = classes.find(c => c.startsWith('classification-'));
                    if (classMatch) classification = classMatch.replace('classification-', '').trim();
                }
                if (!classification) return;
                if (classification === 'signal') signalCount++;
                else if (classification === 'support') supportCount++;
                else if (classification === 'backlog') backlogCount++;
            });
        } else {
            // Fallback: fetch task data via API so chart works on Journal view without rendering Tasks
            try {
                const appURL = window.MyDayHub_Config?.appURL || '';
                const apiURL = `${appURL}/api/api.php?module=tasks&action=getAll`;
                const resp = await fetch(apiURL, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
                if (resp.ok) {
                    const result = await resp.json();
                    // API returns { status: 'success', data: { board: [...] } }
                    if (result.status === 'success' && result.data && Array.isArray(result.data.board)) {
                        result.data.board.forEach(col => {
                            if (!Array.isArray(col.tasks)) return;
                            col.tasks.forEach(t => {
                                // Exclude completed tasks and received shared tasks
                                if (t.classification === 'completed') return;
                                if ((t.access_type || '') === 'recipient') return;
                                if (t.classification === 'signal') signalCount++;
                                else if (t.classification === 'support') supportCount++;
                                else if (t.classification === 'backlog') backlogCount++;
                            });
                        });
                    }
                }
            } catch (e) {
                console.warn('Mission chart fallback fetch failed:', e);
            }
        }
		
		// Count journal entries from last 30 calendar days
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const startDate = thirtyDaysAgo.toISOString().split('T')[0];
		const endDate = new Date().toISOString().split('T')[0];
		
	try {
		const journalResponse = await fetch(`${window.MyDayHub_Config.appURL}/api/api.php?module=journal&action=getEntries&start_date=${startDate}&end_date=${endDate}`);
		if (journalResponse.ok) {
			const text = await journalResponse.text();
			if (text && text.trim()) {
				try {
					const response = JSON.parse(text);
					
					// The API returns {status: 'success', data: [...]}
					const journalEntries = response?.data || response;
					
					// Count journal entry classifications
					if (Array.isArray(journalEntries)) {
						journalEntries.forEach(entry => {
							if (!entry.classification) return; // Skip entries without classification
							
							switch (entry.classification) {
								case 'signal':
									signalCount++;
									break;
								case 'support':
									supportCount++;
									break;
								case 'backlog':
									backlogCount++;
									break;
								default:
									// Skip unknown classifications silently
							}
						});
					}
				} catch (parseError) {
					console.warn('Could not parse journal entries JSON:', parseError, 'Response:', text.substring(0, 100));
				}
			}
		}
	} catch (error) {
		console.warn('Could not fetch journal entries for mission focus chart:', error);
	}
		
        const total = signalCount + supportCount + backlogCount;
		
		// Get canvas element
		const canvas = document.getElementById('mission-focus-canvas');
		if (!canvas) {
			console.error('Mission focus canvas not found');
			window._updatingMissionChart = false;
			return;
		}
		
		// Destroy existing chart if it exists
		if (window.missionFocusChartInstance) {
			window.missionFocusChartInstance.destroy();
		}
		
		if (total === 0) {
			// No tasks found - check if we should retry or show empty state
			const taskColumns = document.querySelectorAll('.column');
			
			if (taskColumns.length > 0 && !window._missionChartRetried) {
				// Tasks might still be loading, retry once after a delay
				window._missionChartRetried = true;
				setTimeout(() => {
					window._updatingMissionChart = false;
					updateMissionFocusChart();
				}, 1000);
				return;
			}
			
			// No tasks, show empty state
			window.missionFocusChartInstance = new Chart(canvas, {
				type: 'doughnut',
				data: {
					datasets: [{
						data: [1],
						backgroundColor: ['#e5e7eb'],
						borderWidth: 0
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: true,
					aspectRatio: 1,
					cutout: '70%',
					plugins: {
						legend: { display: false },
						tooltip: { enabled: false }
					},
					animation: {
						duration: 0
					}
				}
			});
            missionFocusChart.setAttribute('data-tooltip', 'No recent tasks or entries');
			window._updatingMissionChart = false;
			window._missionChartRetried = false; // Reset retry flag
			return;
		}
		
		const signalPercent = Math.round((signalCount / total) * 100);
		const supportPercent = Math.round((supportCount / total) * 100);
		const backlogPercent = Math.round((backlogCount / total) * 100);
		
		// Create doughnut chart
		
		window.missionFocusChartInstance = new Chart(canvas, {
			type: 'doughnut',
			data: {
				labels: ['Signal', 'Support', 'Backlog'],
				datasets: [{
					data: [signalCount, supportCount, backlogCount],
					backgroundColor: [
						'#22c55e', // Signal - Fixed mission green
						'#3b82f6', // Support - Blue
						'#f97316'  // Backlog - Orange
					],
					borderWidth: 0
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: { enabled: false }
				},
				animation: false
			}
		});
		
		// Chart created successfully
		
		// Set tooltip
		missionFocusChart.setAttribute('data-tooltip', 
			`${signalPercent}% Signal, ${supportPercent}% Support, ${backlogPercent}% Backlog (Tasks + Last 30 Days)`
		);
		
        // Clear the safety flag and process any pending request
        window._updatingMissionChart = false;
        if (window._pendingMissionChartUpdate) {
            window._pendingMissionChartUpdate = false;
            setTimeout(() => updateMissionFocusChart(), 0);
        }
	} catch (error) {
		console.error('Error updating mission focus chart:', error);
        window._updatingMissionChart = false;
        if (window._pendingMissionChartUpdate) {
            window._pendingMissionChartUpdate = false;
            setTimeout(() => updateMissionFocusChart(), 50);
        }
	}
}


// Suppress browser extension errors in console (specifically Comet and similar extensions)
window.addEventListener('error', function(event) {
    // Ignore extension-related errors, particularly from Comet
    if (event.message && (
        event.message.includes('Extension context invalidated') ||
        event.message.includes('content.js') ||
        event.filename && (
            event.filename.includes('extension') ||
            event.filename.includes('comet') ||
            event.filename.includes('chrome-extension')
        )
    )) {
        event.preventDefault();
        return false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	updateFooterDate();
	initSettingsPanel();

	// Do not eagerly initialize tasks or journal here; ViewManager will lazy-load
	
	// Initialize calendar overlay after settings panel and tasks view are ready
	setTimeout(() => {
		if (typeof initCalendarOverlay === 'function') {
			initCalendarOverlay();
		}
	}, 100);
	
	// Update mission focus chart when task board is loaded
	waitForTaskBoardAndUpdateChart();
	
	// Initialize mobile viewport height fix
	initMobileViewportFix();
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
    const inlineToggle = document.getElementById('btn-settings-inline-toggle');
	const closeBtn = document.getElementById('btn-settings-close');
	const overlay = document.getElementById('settings-panel-overlay');
	const themeDarkBtn = document.getElementById('theme-dark');
	const themeLightBtn = document.getElementById('theme-light');
	const themeHighContrastBtn = document.getElementById('theme-high-contrast');
	// Modified for Change Password
	const changePasswordBtn = document.getElementById('btn-change-password');
	// Encryption setup button
	const encryptionSetupBtn = document.getElementById('btn-encryption-setup');


    if (!toggleBtn || !closeBtn || !overlay || !themeDarkBtn || !themeLightBtn || !themeHighContrastBtn || !changePasswordBtn) {
		console.error('Settings panel elements could not be found.');
		return;
	}

    // Toggle behavior: clicking the hamburger closes when open
    toggleBtn.addEventListener('click', () => {
        const isOpen = !overlay.classList.contains('hidden');
        if (isOpen) {
            closeSettingsPanel();
        } else {
            openSettingsPanel();
        }
    });
    if (inlineToggle) {
        inlineToggle.addEventListener('click', () => {
            const isOpen = !overlay.classList.contains('hidden');
            if (isOpen) {
                closeSettingsPanel();
            } else {
                openSettingsPanel();
            }
        });
    }
	closeBtn.addEventListener('click', closeSettingsPanel);
	
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) {
			closeSettingsPanel();
		}
	});

    // ESC key handling via modal stack; also close if ESC pressed while panel open
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSettingsPanel();
        }
    });

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
		headerDateOffBtn.addEventListener('click', async () => await toggleHeaderDateVisibility('off'));
		headerDateOnBtn.addEventListener('click', async () => await toggleHeaderDateVisibility('on'));
		// Load saved preference (will be overridden by backend preferences when tasks load)
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
	
	// Encryption setup button
	if (encryptionSetupBtn) {
		encryptionSetupBtn.addEventListener('click', async () => {
			if (window.encryptionSetupWizard) {
				await window.encryptionSetupWizard.triggerSetup();
			} else {
				showToast({ message: 'Encryption setup not available', type: 'error' });
			}
		});
	}
	
	// Initialize theme selector state
	loadThemePreferences();
	
	// Modified for Usage Stats Modal
	const usageStatsBtn = document.getElementById('btn-usage-stats');
	if (usageStatsBtn) {
		usageStatsBtn.addEventListener('click', openUsageStatsModal);
	}
	
	// Accent Color Customization - wrap in try/catch to prevent blocking
	try {
		initAccentColorPicker();
	} catch (error) {
		console.warn('Accent color picker initialization failed:', error);
		// Apply default accent color if initialization fails
		if (typeof applyAccentColorToUI === 'function') {
			applyAccentColorToUI('#22c55e');
		}
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
			// Reapply accent color to override theme-specific defaults
			if (typeof applyAccentColorToUI === 'function') {
				const currentAccentColor = localStorage.getItem('accent_color') || '#22c55e';
				applyAccentColorToUI(currentAccentColor);
			}
			break;
		case 'high-contrast':
			document.body.classList.add('high-contrast');
			document.getElementById('theme-high-contrast').classList.add('active');
			// Save to both localStorage (immediate) and backend (persistent)
			localStorage.setItem('light_mode', 'false');
			localStorage.setItem('high_contrast_mode', 'true');
			saveUserPreference('light_mode', false);
			saveUserPreference('high_contrast_mode', true);
			// Reapply accent color to override theme-specific defaults
			if (typeof applyAccentColorToUI === 'function') {
				const currentAccentColor = localStorage.getItem('accent_color') || '#22c55e';
				applyAccentColorToUI(currentAccentColor);
			}
			break;
		case 'dark':
		default:
			document.getElementById('theme-dark').classList.add('active');
			// Save to both localStorage (immediate) and backend (persistent)
			localStorage.setItem('light_mode', 'false');
			localStorage.setItem('high_contrast_mode', 'false');
			saveUserPreference('light_mode', false);
			saveUserPreference('high_contrast_mode', false);
			// Reapply accent color to override theme-specific defaults
			if (typeof applyAccentColorToUI === 'function') {
				const currentAccentColor = localStorage.getItem('accent_color') || '#22c55e';
				applyAccentColorToUI(currentAccentColor);
			}
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
 * Updates the date in both header and footer to the current date in "dd mmm" format.
 */
function updateFooterDate() {
	const footerDateEl = document.getElementById('footer-date');
	const headerDateEl = document.getElementById('header-date');
	
	const now = new Date();
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	
	const day = String(now.getDate()).padStart(2, '0');
	const month = months[now.getMonth()];
	const dateString = `${day} ${month}`;

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
 * Calculate the appropriate text color (black or white) based on background color luminance
 * @param {string} backgroundColor - The background color in hex format
 * @returns {string} - '#000000' for dark backgrounds, '#ffffff' for light backgrounds
 */
function calculateTextColor(backgroundColor) {
	// Remove # if present
	const hex = backgroundColor.replace('#', '');
	
	// Convert hex to RGB
	const r = parseInt(hex.substr(0, 2), 16);
	const g = parseInt(hex.substr(2, 2), 16);
	const b = parseInt(hex.substr(4, 2), 16);
	
	// Calculate relative luminance using WCAG formula
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	
	// Return black for light backgrounds, white for dark backgrounds
	return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Test function to demonstrate contrast calculation with different accent colors
 * Can be called from browser console for testing
 */
window.testToastContrast = function() {
	const testColors = ['#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#ffffff', '#000000'];
	
	console.log('Testing toast contrast calculation:');
	testColors.forEach(color => {
		const textColor = calculateTextColor(color);
		console.log(`Background: ${color} → Text: ${textColor} (luminance: ${((parseInt(color.replace('#', '').substr(0, 2), 16) * 0.299 + parseInt(color.replace('#', '').substr(2, 2), 16) * 0.587 + parseInt(color.replace('#', '').substr(4, 2), 16) * 0.114) / 255).toFixed(3)})`);
	});
	
	// Show test toasts
	testColors.forEach((color, index) => {
		setTimeout(() => {
			showToast({
				message: `Test toast with ${color} background`,
				type: 'info',
				duration: 2000
			});
		}, index * 2500);
	});
};

/**
 * Test function to verify settings button contrast
 * Can be called from browser console for testing
 */
window.testSettingsContrast = function() {
	const testColors = ['#fbbf24', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444'];
	
	console.log('Testing settings button contrast:');
	testColors.forEach((color, index) => {
		setTimeout(() => {
			console.log(`Testing accent color: ${color}`);
			applyAccentColorToUI(color);
			
			// Show which buttons should have the calculated text color
			const activeButtons = document.querySelectorAll('.theme-btn.active, .font-btn.active, .sound-btn.active');
			console.log(`Found ${activeButtons.length} active buttons that should have updated text color`);
			activeButtons.forEach((btn, i) => {
				console.log(`Button ${i + 1}: ${btn.textContent.trim()} - Text color: ${btn.style.color}`);
			});
		}, index * 2000);
	});
};

/**
 * Debug function to check accent color application in different themes
 * Can be called from browser console for testing
 */
window.debugAccentColor = function() {
	console.log('=== Accent Color Debug ===');
	
	// Check current accent color
	const currentAccent = localStorage.getItem('accent_color') || '#22c55e';
	console.log(`Current accent color: ${currentAccent}`);
	
	// Check computed styles on root
	const rootAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
	console.log(`Root --accent-color: ${rootAccent}`);
	
	// Check computed styles on body
	const bodyAccent = getComputedStyle(document.body).getPropertyValue('--accent-color');
	console.log(`Body --accent-color: ${bodyAccent}`);
	
	// Check if light mode is active
	const isLightMode = document.body.classList.contains('light-mode');
	console.log(`Light mode active: ${isLightMode}`);
	
	// Check active buttons
	const activeButtons = document.querySelectorAll('.theme-btn.active, .font-btn.active, .sound-btn.active');
	console.log(`Active buttons found: ${activeButtons.length}`);
	activeButtons.forEach((btn, i) => {
		const computedBg = getComputedStyle(btn).backgroundColor;
		const computedColor = getComputedStyle(btn).color;
		console.log(`Button ${i + 1} (${btn.textContent.trim()}): bg=${computedBg}, color=${computedColor}`);
	});
	
	// Force reapply accent color
	console.log('Reapplying accent color...');
	applyAccentColorToUI(currentAccent);
	
	console.log('=== End Debug ===');
};

/**
 * Quick test function to force accent color application
 * Can be called from browser console: window.testAccentColor('#8b5cf6')
 */
window.testAccentColor = function(color = '#8b5cf6') {
	console.log(`Testing accent color: ${color}`);
	applyAccentColorToUI(color);
	localStorage.setItem('accent_color', color);
	console.log('Accent color applied. Check the settings panel buttons.');
};

/**
 * Debug function specifically for tab button styling
 * Can be called from browser console: window.debugTabButtons()
 */
window.debugTabButtons = function() {
	console.log('=== Tab Button Debug ===');
	
	const tabButtons = document.querySelectorAll('.tab-btn');
	console.log(`Found ${tabButtons.length} tab buttons`);
	
	tabButtons.forEach((btn, i) => {
		const isActive = btn.classList.contains('active');
		const computedStyle = getComputedStyle(btn);
		console.log(`Tab ${i + 1} (${btn.textContent.trim()}):`);
		console.log(`  - Active: ${isActive}`);
		console.log(`  - Color: ${computedStyle.color}`);
		console.log(`  - Background: ${computedStyle.backgroundColor}`);
		console.log(`  - Border: ${computedStyle.border}`);
		console.log(`  - Box-shadow: ${computedStyle.boxShadow}`);
	});
	
	console.log('=== End Tab Button Debug ===');
};

/**
 * Displays a toast notification message.
 * @param {object} options - The options for the toast.
 * @param {string} options.message - The message to display.
 */
function showToast(options) {
	const { message, type = 'info', duration = 5000, action = null } = options;
	
	// Prevent empty toast messages
	const displayMessage = message && message.trim() !== '' ? message : 'An unexpected error occurred.';

	const container = document.getElementById('toast-container');
	if (!container) {
		console.error('Toast container not found!');
		return;
	}

	const toast = document.createElement('div');
	toast.className = `toast ${type}`;
	
	// Set appropriate text color based on toast type for better contrast
	if (type === 'info') {
		const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color') || '#22c55e';
		const textColor = calculateTextColor(accentColor);
		toast.style.color = textColor;
	} else if (type === 'success') {
		const successColor = getComputedStyle(document.documentElement).getPropertyValue('--toast-success-bg') || '#22c55e';
		const textColor = calculateTextColor(successColor);
		toast.style.color = textColor;
	} else if (type === 'error') {
		const errorColor = getComputedStyle(document.documentElement).getPropertyValue('--toast-error-bg') || '#ef4444';
		const textColor = calculateTextColor(errorColor);
		toast.style.color = textColor;
	}
	
	const toastContent = document.createElement('div');
	toastContent.className = 'toast-content';

	const messageEl = document.createElement('span');
	messageEl.textContent = displayMessage;
	toastContent.appendChild(messageEl);

	if (action && typeof action.callback === 'function') {
		const actionBtn = document.createElement('button');
		actionBtn.className = 'toast-action-btn';
		actionBtn.textContent = action.text || 'Action';
		// Apply the same text color for consistency
		if (toast.style.color) {
			actionBtn.style.color = toast.style.color;
		}
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
	// Apply the same text color for consistency
	if (toast.style.color) {
		closeBtn.style.color = toast.style.color;
	}
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
function showConfirm(message, options = {}) {
	const modalOverlay = document.getElementById('confirm-modal-overlay');
	const messageEl = document.getElementById('confirm-modal-message');
	const yesBtn = document.getElementById('btn-confirm-yes');
	const noBtn = document.getElementById('btn-confirm-no');

	if (!modalOverlay || !messageEl || !yesBtn || !noBtn) {
		console.error('Confirmation modal elements not found!');
		return Promise.resolve(false);
	}

	// Set message
	messageEl.textContent = message;
	
	// Update button text if provided
	if (options.confirmText) {
		yesBtn.textContent = options.confirmText;
	}
	if (options.cancelText) {
		noBtn.textContent = options.cancelText;
	}
	
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
		
		// Register confirm modal in modal stack
		registerModal('confirm-modal', handleNo);
		
		yesBtn.addEventListener('click', handleYes, { once: true });
		noBtn.addEventListener('click', handleNo, { once: true });

		function cleanup() {
			modalOverlay.classList.add('hidden');
			unregisterModal('confirm-modal');
			yesBtn.removeEventListener('click', handleYes);
			noBtn.removeEventListener('click', handleNo);
			
			// Reset button text to defaults
			yesBtn.textContent = 'Yes';
			noBtn.textContent = 'No';
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

// ==========================================================================
// --- ACCENT COLOR CUSTOMIZATION ---
// ==========================================================================

/**
 * Default preset colors that work well across all themes
 */
const ACCENT_PRESETS = {
	green: '#22c55e',
	blue: '#3b82f6',
	purple: '#8b5cf6',
	amber: '#f59e0b'
};

const DEFAULT_ACCENT = '#22c55e';

let currentAccentColor = DEFAULT_ACCENT;
let tempAccentColor = DEFAULT_ACCENT;

/**
 * Initializes the accent color picker modal and its controls
 */
function initAccentColorPicker() {
	const accentBtn = document.getElementById('btn-accent-color');
	const modal = document.getElementById('accent-color-modal');
	const closeBtn = document.getElementById('btn-close-accent-modal');
	const applyBtn = document.getElementById('btn-apply-accent');
	const resetBtn = document.getElementById('btn-reset-accent');
	const customPicker = document.getElementById('custom-accent-picker');
	const presetBtns = document.querySelectorAll('.preset-color-btn');
	const preview = document.querySelector('.accent-color-preview');
	
	if (!accentBtn || !modal) {
		console.warn('Accent color picker elements not found');
		return;
	}
	
	// Load saved accent color asynchronously - don't await to avoid blocking initialization
	loadAccentColorPreference().catch(err => {
		console.warn('Error loading accent color, using default:', err);
		applyAccentColorToUI(DEFAULT_ACCENT);
	});
	
	// Open modal
	accentBtn.addEventListener('click', () => {
		tempAccentColor = currentAccentColor;
		updateAccentPreview(tempAccentColor);
		updatePresetSelection(tempAccentColor);
		customPicker.value = tempAccentColor;
		modal.classList.remove('hidden');
	});
	
	// Close modal
	const closeModal = () => {
		modal.classList.add('hidden');
		// Restore current color if not applied
		applyAccentColorToUI(currentAccentColor);
	};
	
	closeBtn?.addEventListener('click', closeModal);
	modal.addEventListener('click', (e) => {
		if (e.target === modal) closeModal();
	});
	
	// Preset color selection
	presetBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			const color = btn.dataset.color;
			tempAccentColor = color;
			customPicker.value = color;
			updateAccentPreview(color);
			updatePresetSelection(color);
			applyAccentColorToUI(color);
		});
	});
	
	// Custom color picker
	customPicker?.addEventListener('input', (e) => {
		tempAccentColor = e.target.value;
		updateAccentPreview(tempAccentColor);
		updatePresetSelection(tempAccentColor);
		applyAccentColorToUI(tempAccentColor);
	});
	
	// Apply button
	applyBtn?.addEventListener('click', async () => {
		currentAccentColor = tempAccentColor;
		applyAccentColorToUI(currentAccentColor);
		await saveAccentColorPreference(currentAccentColor);
		modal.classList.add('hidden');
		showToast({ message: 'Accent color applied successfully', type: 'success' });
	});
	
	// Reset button
	resetBtn?.addEventListener('click', async () => {
		tempAccentColor = DEFAULT_ACCENT;
		currentAccentColor = DEFAULT_ACCENT;
		customPicker.value = DEFAULT_ACCENT;
		updateAccentPreview(DEFAULT_ACCENT);
		updatePresetSelection(DEFAULT_ACCENT);
		applyAccentColorToUI(DEFAULT_ACCENT);
		// Save the reset immediately
		await saveAccentColorPreference(DEFAULT_ACCENT);
		showToast({ message: 'Accent color reset to default', type: 'success' });
	});
}

/**
 * Updates the preview elements with the selected color
 */
function updateAccentPreview(color) {
	const previewBtn = document.querySelector('.preview-btn');
	const previewIcon = document.querySelector('.preview-icon');
	const settingsPreview = document.querySelector('.accent-color-preview');
	
	if (previewBtn) {
		previewBtn.style.background = color;
	}
	if (previewIcon) {
		previewIcon.style.color = color;
	}
	if (settingsPreview) {
		settingsPreview.style.backgroundColor = color;
	}
}

/**
 * Updates the selected state of preset buttons
 */
function updatePresetSelection(color) {
	const presetBtns = document.querySelectorAll('.preset-color-btn');
	presetBtns.forEach(btn => {
		if (btn.dataset.color === color) {
			btn.classList.add('selected');
		} else {
			btn.classList.remove('selected');
		}
	});
}

/**
 * Applies the accent color to the UI by updating CSS custom properties
 */
function applyAccentColorToUI(color) {
	// Set the primary accent color with !important to override theme-specific values
	document.documentElement.style.setProperty('--accent-color', color, 'important');
	document.documentElement.style.setProperty('--accent-color-secondary', adjustBrightness(color, -10), 'important');
	
	// Generate variations for gradients and hover states
	const { lighter, darker } = generateColorVariations(color);
	document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${color}, ${darker})`, 'important');
	document.documentElement.style.setProperty('--accent-gradient-light', `linear-gradient(135deg, ${lighter}, ${color})`, 'important');
	document.documentElement.style.setProperty('--accent-gradient-hover', `linear-gradient(135deg, ${darker}, ${adjustBrightness(darker, -15)})`, 'important');
	
	// Also apply to body.light-mode to override theme-specific CSS
	document.body.style.setProperty('--accent-color', color, 'important');
	document.body.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${color}, ${darker})`, 'important');
	document.body.style.setProperty('--accent-gradient-light', `linear-gradient(135deg, ${lighter}, ${color})`, 'important');
	document.body.style.setProperty('--accent-gradient-hover', `linear-gradient(135deg, ${darker}, ${adjustBrightness(darker, -15)})`, 'important');
	
	// Update button backgrounds and other accent-dependent styles
	document.documentElement.style.setProperty('--btn-hover-bg', `${color}1a`, 'important'); // 10% opacity
	document.documentElement.style.setProperty('--btn-success-bg', color, 'important');
	document.documentElement.style.setProperty('--btn-success-hover-bg', darker, 'important');
	document.documentElement.style.setProperty('--toast-success-bg', color, 'important');
	
	// Also apply to body for light mode override
	document.body.style.setProperty('--btn-hover-bg', `${color}1a`, 'important');
	document.body.style.setProperty('--btn-success-bg', color, 'important');
	document.body.style.setProperty('--btn-success-hover-bg', darker, 'important');
	document.body.style.setProperty('--toast-success-bg', color, 'important');
	
	// Update settings preview
	const settingsPreview = document.querySelector('.accent-color-preview');
	if (settingsPreview) {
		settingsPreview.style.backgroundColor = color;
	}
	
	// Calculate and apply appropriate text color for settings buttons
	const textColor = calculateTextColor(color);
	document.documentElement.style.setProperty('--accent-text-color', textColor, 'important');
	
	// Update all active settings buttons with the calculated text color
	updateSettingsButtonTextColors(textColor);
}

/**
 * Updates all active settings buttons with the calculated text color
 */
function updateSettingsButtonTextColors(textColor) {
	// Update theme buttons
	const themeButtons = document.querySelectorAll('.theme-btn.active');
	themeButtons.forEach(btn => {
		btn.style.color = textColor;
	});
	
	// Update font size buttons
	const fontButtons = document.querySelectorAll('.font-btn.active');
	fontButtons.forEach(btn => {
		btn.style.color = textColor;
	});
	
	// Update sound buttons (also covers date toggle and mission focus buttons)
	const soundButtons = document.querySelectorAll('.sound-btn.active');
	soundButtons.forEach(btn => {
		btn.style.color = textColor;
	});
	
	// Update tab buttons (view tabs)
	const activeTabButtons = document.querySelectorAll('.tab-btn.active');
	activeTabButtons.forEach(btn => {
		btn.style.color = textColor;
	});
	
	// Inactive tab buttons use CSS text-secondary for proper contrast
}

/**
 * Generates lighter and darker variations of a color
 */
function generateColorVariations(hex) {
	const lighter = adjustBrightness(hex, 20);
	const darker = adjustBrightness(hex, -15);
	return { lighter, darker };
}

/**
 * Adjusts the brightness of a hex color
 */
function adjustBrightness(hex, percent) {
	// Remove # if present
	hex = hex.replace('#', '');
	
	// Convert to RGB
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);
	
	// Adjust brightness
	r = Math.max(0, Math.min(255, r + (r * percent / 100)));
	g = Math.max(0, Math.min(255, g + (g * percent / 100)));
	b = Math.max(0, Math.min(255, b + (b * percent / 100)));
	
	// Convert back to hex
	const rr = Math.round(r).toString(16).padStart(2, '0');
	const gg = Math.round(g).toString(16).padStart(2, '0');
	const bb = Math.round(b).toString(16).padStart(2, '0');
	
	return `#${rr}${gg}${bb}`;
}

/**
 * Loads accent color preference from backend
 */
async function loadAccentColorPreference() {
	try {
		// First apply localStorage for immediate display (if available)
		const localColor = localStorage.getItem('accent_color');
		if (localColor) {
			currentAccentColor = localColor;
			applyAccentColorToUI(localColor);
		}
		
		// Then fetch from backend to sync with database
		const response = await window.apiFetch({
			module: 'users',
			action: 'getUserPreferences'
		});
		
		if (response?.status === 'success' && response.data?.accent_color) {
			// Backend has a saved color - use it and sync localStorage
			const savedColor = response.data.accent_color;
			if (savedColor !== localColor) {
				// Backend color differs from localStorage - update both
				currentAccentColor = savedColor;
				applyAccentColorToUI(savedColor);
				localStorage.setItem('accent_color', savedColor);
			}
		} else if (!localColor) {
			// No backend color and no localStorage - use default
			currentAccentColor = DEFAULT_ACCENT;
			applyAccentColorToUI(DEFAULT_ACCENT);
			localStorage.setItem('accent_color', DEFAULT_ACCENT);
		}
	} catch (error) {
		console.warn('Could not load accent color preference, using default:', error);
		// Fall back to default - don't let this break the app
		const localColor = localStorage.getItem('accent_color');
		if (!localColor) {
			currentAccentColor = DEFAULT_ACCENT;
			applyAccentColorToUI(DEFAULT_ACCENT);
		}
	}
}

/**
 * Saves accent color preference to backend
 */
async function saveAccentColorPreference(color) {
	try {
		// Save to localStorage immediately
		localStorage.setItem('accent_color', color);
		
		// Save to backend using existing saveUserPreference function
		await saveUserPreference('accent_color', color);
	} catch (error) {
		console.error('Failed to save accent color preference:', error);
		showToast({ message: 'Failed to save accent color', type: 'error' });
	}
}

// Make modal management functions globally available
window.registerModal = registerModal;
window.unregisterModal = unregisterModal;
window.showConfirm = showConfirm;