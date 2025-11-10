/**
 * Unified Import/Export Modal Handler
 * Manages the consolidated Import/Export modal with tabs for Tasks and Journal
 */

// Track if already initialized to prevent duplicate listeners
let importExportInitialized = false;

/**
 * Initialize import/export functionality
 */
function initImportExport() {
	// Prevent duplicate initialization
	if (importExportInitialized) {
		return;
	}
	
	// Setup modal first
	setupImportExportModal();
	
	// Function to attach button listener
	const attachButtonListener = () => {
		const btnImportExport = document.getElementById('btn-import-export');
		if (btnImportExport && !btnImportExport.hasAttribute('data-listener-attached')) {
			btnImportExport.setAttribute('data-listener-attached', 'true');
			btnImportExport.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				console.log('Import/Export button clicked');
				openImportExportModal('tasks');
			});
			console.log('Import/Export button listener attached');
			return true;
		}
		return false;
	};
	
	// Try to attach listener immediately
	if (!attachButtonListener()) {
		// If button not found, try again after delays (in case settings panel loads dynamically)
		setTimeout(() => {
			if (!attachButtonListener()) {
				setTimeout(() => {
					if (!attachButtonListener()) {
						console.warn('Import/Export button not found after multiple attempts');
					}
				}, 500);
			}
		}, 200);
	}
	
	// Initialize tasks and journal handlers
	if (typeof initTasksExportImport === 'function') {
		initTasksExportImport();
	}
	if (typeof initJournalExportImport === 'function') {
		initJournalExportImport();
	}
	
	importExportInitialized = true;
}

/**
 * Setup import/export modal
 */
function setupImportExportModal() {
	const overlay = document.getElementById('import-export-modal-overlay');
	const closeBtn = document.getElementById('import-export-modal-close-btn');
	const btnClose = document.getElementById('btn-close-import-export');
	
	if (!overlay) return;
	
	const closeModal = () => {
		overlay.classList.add('hidden');
		window.unregisterModal('import-export-modal');
		resetImportExportModal();
	};
	
	if (closeBtn) closeBtn.addEventListener('click', closeModal);
	if (btnClose) btnClose.addEventListener('click', closeModal);
	
	// Tab switching
	const tabs = overlay.querySelectorAll('.import-export-tab');
	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const tabName = tab.getAttribute('data-tab');
			switchImportExportTab(tabName);
		});
	});
}

/**
 * Switch between Tasks and Journal tabs
 */
function switchImportExportTab(tabName) {
	const tabs = document.querySelectorAll('#import-export-modal-overlay .import-export-tab');
	const panels = document.querySelectorAll('#import-export-modal-overlay .import-export-panel');
	
	tabs.forEach(tab => {
		if (tab.getAttribute('data-tab') === tabName) {
			tab.classList.add('active');
		} else {
			tab.classList.remove('active');
		}
	});
	
	panels.forEach(panel => {
		if (panel.id === `import-export-${tabName}-panel`) {
			panel.classList.add('active');
			panel.classList.remove('hidden');
		} else {
			panel.classList.remove('active');
			panel.classList.add('hidden');
		}
	});
}

/**
 * Open import/export modal
 */
function openImportExportModal(tabName = 'tasks') {
	console.log('openImportExportModal called with tab:', tabName);
	// Close settings panel if it's open to prevent overlay conflicts
	if (typeof closeSettingsPanel === 'function') {
		try {
			closeSettingsPanel();
		} catch (error) {
			console.warn('Failed to close settings panel before opening Import/Export modal:', error);
		}
	}
	
	const overlay = document.getElementById('import-export-modal-overlay');
	if (!overlay) {
		console.error('Import/Export modal overlay not found!');
		return;
	}
	
	console.log('Opening Import/Export modal');
	// Remove hidden class first (which has display: none !important)
	overlay.classList.remove('hidden');
	// Then explicitly set display to flex to override any other rules
	overlay.style.display = 'flex';
	overlay.style.visibility = 'visible';
	overlay.style.opacity = '1';
	overlay.style.pointerEvents = 'auto';
	overlay.style.zIndex = '10000';
	
	console.log('Modal overlay classes:', overlay.className);
	console.log('Modal overlay display:', overlay.style.display);
	console.log('Modal overlay computed display:', window.getComputedStyle(overlay).display);
	
	if (window.registerModal) {
		window.registerModal('import-export-modal', () => {
			overlay.classList.add('hidden');
			overlay.style.display = 'none';
			window.unregisterModal('import-export-modal');
			resetImportExportModal();
		});
	}
	
	// Switch to specified tab
	switchImportExportTab(tabName);
}

/**
 * Reset import/export modal state
 */
function resetImportExportModal() {
	// Hide all export results
	const exportResults = document.querySelectorAll('.import-export-result');
	exportResults.forEach(result => result.classList.add('hidden'));
	
	// Reset to Tasks tab
	switchImportExportTab('tasks');
}

// Initialize on DOM ready - but app.js will also call this, so we check readyState
// This ensures it works even if app.js hasn't loaded yet
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		// Small delay to ensure settings panel is initialized
		setTimeout(initImportExport, 100);
	});
} else {
	// DOM already loaded, but wait a bit for settings panel
	setTimeout(initImportExport, 100);
}

