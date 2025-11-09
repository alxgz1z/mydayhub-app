/**
 * Unified Import/Export Modal Handler
 * Manages the consolidated Import/Export modal with tabs for Tasks and Journal
 */

/**
 * Initialize import/export functionality
 */
function initImportExport() {
	// Setup modal first
	setupImportExportModal();
	
	// Main button to open modal
	const btnImportExport = document.getElementById('btn-import-export');
	if (btnImportExport) {
		btnImportExport.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			openImportExportModal('tasks');
		});
	} else {
		// If button not found, try again after a short delay (in case settings panel loads dynamically)
		setTimeout(() => {
			const btn = document.getElementById('btn-import-export');
			if (btn) {
				btn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					openImportExportModal('tasks');
				});
			} else {
				console.warn('Import/Export button not found');
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
	const overlay = document.getElementById('import-export-modal-overlay');
	if (!overlay) return;
	
	overlay.classList.remove('hidden');
	window.registerModal('import-export-modal', () => {
		overlay.classList.add('hidden');
		window.unregisterModal('import-export-modal');
		resetImportExportModal();
	});
	
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

// Initialize on DOM ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initImportExport);
} else {
	initImportExport();
}

