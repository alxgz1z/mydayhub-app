// ==========================================================================
// --- DEVELOPER DEBUG SETTINGS MANAGEMENT ---
// ==========================================================================

/**
 * Debug preference keys for localStorage
 */
const DEBUG_PREFS = {
	SHOW_TASK_IDS: 'debug_show_task_ids',
	SHOW_COLUMN_IDS: 'debug_show_column_ids',
	SHOW_ENTRY_IDS: 'debug_show_entry_ids',
	SHOW_FOOTER_BADGE: 'debug_show_footer_badge',
	SHOW_CONSTRUCTION_BUTTON: 'debug_show_construction_button',
	CONSOLE_MESSAGES: 'debug_console_messages',
	CONSOLE_BUFFER: 'debug_console_buffer',
	FOOTER_DEBUG_FUNCTION: 'debug_footer_debug_function',
	LAYOUT_REPORT_HOTKEY: 'debug_layout_report_hotkey',
	MODAL_VALIDATION: 'debug_modal_validation',
	DETAILED_ERRORS: 'debug_detailed_errors'
};

/**
 * Get debug preference value (defaults to true)
 */
function getDebugPreference(key) {
	if (!window.MyDayHub_Config?.DEVMODE) {
		return false;
	}
	const value = localStorage.getItem(key);
	return value === null ? true : value === 'true';
}

/**
 * Set debug preference value
 */
function setDebugPreference(key, value) {
	if (value) {
		localStorage.setItem(key, 'true');
	} else {
		localStorage.setItem(key, 'false');
	}
}

/**
 * Check if a specific debug aid is enabled
 */
function isDebugAidEnabled(key) {
	return window.MyDayHub_Config?.DEVMODE && getDebugPreference(key);
}

/**
 * Update footer badge visibility based on preference
 */
function updateFooterBadgeVisibility() {
	const footer = document.getElementById('app-footer');
	if (!footer) return;
	
	const showBadge = typeof isDebugAidEnabled === 'function' ? isDebugAidEnabled('debug_show_footer_badge') : (window.MyDayHub_Config?.DEVMODE || false);
	
	if (showBadge && window.MyDayHub_Config?.DEVMODE) {
		footer.classList.add('dev-mode');
		footer.setAttribute('data-devmode', 'true');
	} else {
		footer.classList.remove('dev-mode');
		footer.setAttribute('data-devmode', 'false');
	}
}

/**
 * Initialize developer settings modal
 */
function initDeveloperSettings() {
	const btnDeveloperSettings = document.getElementById('btn-developer-settings');
	const modal = document.getElementById('developer-settings-modal');
	const btnClose = document.getElementById('btn-close-developer-settings');
	const btnApply = document.getElementById('btn-apply-debug-settings');
	const btnReset = document.getElementById('btn-reset-debug-settings');
	
	if (!btnDeveloperSettings || !modal) return;
	
	// Load current preferences into checkboxes
	function loadPreferences() {
		Object.entries(DEBUG_PREFS).forEach(([name, key]) => {
			const checkboxId = `debug-${key.replace('debug_', '').replace(/_/g, '-')}`;
			const checkbox = document.getElementById(checkboxId);
			if (checkbox) {
				checkbox.checked = getDebugPreference(key);
			}
		});
	}
	
	// Open modal
	btnDeveloperSettings.addEventListener('click', () => {
		loadPreferences();
		modal.classList.remove('hidden');
		if (window.registerModal) {
			window.registerModal('developer-settings-modal', closeDeveloperSettings);
		}
		if (window.ensureModalVisible) {
			window.ensureModalVisible(modal);
		} else {
			modal.style.display = 'flex';
			modal.style.zIndex = '10000';
		}
	});
	
	// Close modal
	function closeDeveloperSettings() {
		modal.classList.add('hidden');
		if (window.unregisterModal) {
			window.unregisterModal('developer-settings-modal');
		}
		if (window.resetModalStyles) {
			window.resetModalStyles(modal);
		} else {
			modal.style.display = 'none';
		}
	}
	
	if (btnClose) {
		btnClose.addEventListener('click', closeDeveloperSettings);
	}
	
	// Apply settings
	if (btnApply) {
		btnApply.addEventListener('click', () => {
			Object.entries(DEBUG_PREFS).forEach(([name, key]) => {
				const checkboxId = `debug-${key.replace('debug_', '').replace(/_/g, '-')}`;
				const checkbox = document.getElementById(checkboxId);
				if (checkbox) {
					setDebugPreference(key, checkbox.checked);
				}
			});
			
			// Update footer badge visibility immediately
			updateFooterBadgeVisibility();
			
			// Update construction button visibility
			const btnDev = document.getElementById('btn-dev-report');
			if (btnDev) {
				const showButton = typeof isDebugAidEnabled === 'function' ? isDebugAidEnabled('debug_show_construction_button') : false;
				btnDev.style.display = showButton ? 'inline-block' : 'none';
			}
			
			closeDeveloperSettings();
			if (typeof showToast === 'function') {
				showToast({ message: 'Debug settings applied. Page refresh recommended for full effect.', type: 'success' });
			}
		});
	}
	
	// Reset to defaults
	if (btnReset) {
		btnReset.addEventListener('click', () => {
			Object.values(DEBUG_PREFS).forEach(key => {
				setDebugPreference(key, true);
			});
			loadPreferences();
		});
	}
	
	// Overlay click to close
	modal.addEventListener('click', (e) => {
		if (e.target === modal) {
			closeDeveloperSettings();
		}
	});
	
	// Initialize footer badge visibility on load
	updateFooterBadgeVisibility();
}

// Make functions globally available
window.getDebugPreference = getDebugPreference;
window.setDebugPreference = setDebugPreference;
window.isDebugAidEnabled = isDebugAidEnabled;
window.DEBUG_PREFS = DEBUG_PREFS;

