/**
 * Journal Export/Import UI Logic
 * Handles export and import functionality for journal entries
 */

let journalImportData = null;

/**
 * Initialize journal export/import functionality
 */
function initJournalExportImport() {
	// Export button
	const btnExportJournal = document.getElementById('btn-export-journal');
	if (btnExportJournal) {
		btnExportJournal.addEventListener('click', handleExportJournal);
	}
	
	// Export result buttons
	setupJournalExportButtons();
	
	// Import modal
	setupJournalImportModal();
}

/**
 * Handle export journal button click
 */
async function handleExportJournal() {
	const timeRange = document.getElementById('export-journal-time-range')?.value || 'all_time';
	
	try {
		const response = await apiFetch({
			module: 'journal',
			action: 'exportJournal',
			data: {
				time_range: timeRange
			}
		});
		
		if (response.success && response.data) {
			const jsonText = JSON.stringify(response.data, null, 2);
			showJournalExportResult(jsonText);
		} else {
			showToast({ message: response.error || 'Failed to export journal entries', type: 'error' });
		}
	} catch (error) {
		console.error('Error exporting journal:', error);
		showToast({ message: 'Error exporting journal entries', type: 'error' });
	}
}

/**
 * Setup journal export buttons
 */
function setupJournalExportButtons() {
	const btnCopy = document.getElementById('btn-copy-journal-export');
	const btnDownload = document.getElementById('btn-download-journal-export');
	
	if (btnCopy) {
		btnCopy.addEventListener('click', () => {
			const textarea = document.getElementById('journal-export-json');
			if (textarea) {
				textarea.select();
				document.execCommand('copy');
				showToast({ message: 'Copied to clipboard', type: 'success' });
			}
		});
	}
	
	if (btnDownload) {
		btnDownload.addEventListener('click', () => {
			const textarea = document.getElementById('journal-export-json');
			if (textarea && textarea.value) {
				const blob = new Blob([textarea.value], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `mdhub-journal-${new Date().toISOString().split('T')[0]}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				showToast({ message: 'Download started', type: 'success' });
			}
		});
	}
}

/**
 * Show journal export result in unified modal
 */
function showJournalExportResult(jsonText) {
	const resultDiv = document.getElementById('journal-export-result');
	const textarea = document.getElementById('journal-export-json');
	
	if (!resultDiv || !textarea) return;
	
	textarea.value = jsonText;
	resultDiv.classList.remove('hidden');
	
	// Scroll to result
	resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Setup journal import modal
 */
function setupJournalImportModal() {
	const overlay = document.getElementById('journal-import-modal-overlay');
	const closeBtn = document.getElementById('journal-import-modal-close-btn');
	const btnCancel = document.getElementById('btn-journal-import-cancel');
	const btnPreview = document.getElementById('btn-journal-import-preview');
	const btnExecute = document.getElementById('btn-journal-import-execute');
	const fileInput = document.getElementById('journal-json-file-input');
	const pasteInput = document.getElementById('journal-json-paste-input');
	const fileTab = overlay?.querySelector('.import-method-tab[data-method="file"]');
	const pasteTab = overlay?.querySelector('.import-method-tab[data-method="paste"]');
	
	if (!overlay) return;
	
	const closeModal = () => {
		overlay.classList.add('hidden');
		window.unregisterModal('journal-import-modal');
		resetJournalImportForm();
	};
	
	if (closeBtn) closeBtn.addEventListener('click', closeModal);
	if (btnCancel) btnCancel.addEventListener('click', closeModal);
	
	// Method tabs
	if (fileTab && pasteTab) {
		fileTab.addEventListener('click', () => switchJournalImportMethod('file'));
		pasteTab.addEventListener('click', () => switchJournalImportMethod('paste'));
	}
	
	// File input
	if (fileInput) {
		fileInput.addEventListener('change', (e) => {
			const file = e.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					pasteInput.value = event.target.result;
					validateJournalImportData(event.target.result);
				};
				reader.readAsText(file);
			}
		});
	}
	
	// Paste input
	if (pasteInput) {
		pasteInput.addEventListener('input', () => {
			validateJournalImportData(pasteInput.value);
		});
	}
	
	// Preview button
	if (btnPreview) {
		btnPreview.addEventListener('click', () => {
			const jsonText = pasteInput?.value || '';
			previewJournalImport(jsonText);
		});
	}
	
	// Execute button
	if (btnExecute) {
		btnExecute.addEventListener('click', () => {
			if (journalImportData) {
				executeJournalImport(journalImportData);
			}
		});
	}
}

/**
 * Switch between file upload and paste methods
 */
function switchJournalImportMethod(method) {
	const fileSection = document.getElementById('journal-import-file-section');
	const pasteSection = document.getElementById('journal-import-paste-section');
	const fileTab = document.querySelector('#journal-import-modal-overlay .import-method-tab[data-method="file"]');
	const pasteTab = document.querySelector('#journal-import-modal-overlay .import-method-tab[data-method="paste"]');
	
	if (method === 'file') {
		fileSection?.classList.add('active');
		fileSection?.classList.remove('hidden');
		pasteSection?.classList.add('hidden');
		pasteSection?.classList.remove('active');
		fileTab?.classList.add('active');
		pasteTab?.classList.remove('active');
	} else {
		pasteSection?.classList.add('active');
		pasteSection?.classList.remove('hidden');
		fileSection?.classList.add('hidden');
		fileSection?.classList.remove('active');
		pasteTab?.classList.add('active');
		fileTab?.classList.remove('active');
	}
}

/**
 * Validate journal import data
 */
function validateJournalImportData(jsonText) {
	const btnPreview = document.getElementById('btn-journal-import-preview');
	const btnExecute = document.getElementById('btn-journal-import-execute');
	
	if (!jsonText.trim()) {
		if (btnPreview) btnPreview.disabled = true;
		if (btnExecute) btnExecute.disabled = true;
		journalImportData = null;
		return;
	}
	
	try {
		const data = JSON.parse(jsonText);
		if (Array.isArray(data)) {
			if (btnPreview) btnPreview.disabled = false;
			if (btnExecute) btnExecute.disabled = false;
			journalImportData = data;
		} else {
			throw new Error('Data must be an array');
		}
	} catch (error) {
		if (btnPreview) btnPreview.disabled = true;
		if (btnExecute) btnExecute.disabled = true;
		journalImportData = null;
	}
}

/**
 * Preview journal import
 */
function previewJournalImport(jsonText) {
	const preview = document.getElementById('journal-import-preview');
	const previewText = document.getElementById('journal-import-preview-text');
	
	if (!preview || !previewText) return;
	
	try {
		const data = JSON.parse(jsonText);
		if (Array.isArray(data)) {
			previewText.textContent = `Ready to import ${data.length} journal entry/entries`;
			preview.classList.remove('hidden');
		} else {
			previewText.textContent = 'Invalid format: Data must be an array';
			preview.classList.remove('hidden');
		}
	} catch (error) {
		previewText.textContent = 'Invalid JSON: ' + error.message;
		preview.classList.remove('hidden');
	}
}

/**
 * Execute journal import
 */
async function executeJournalImport(entries) {
	const btnExecute = document.getElementById('btn-journal-import-execute');
	if (btnExecute) btnExecute.disabled = true;
	
	try {
		const response = await apiFetch({
			module: 'journal',
			action: 'importJournal',
			data: {
				entries: entries
			}
		});
		
		if (response.success) {
			const data = response.data || {};
			const imported = data.imported_count || 0;
			const total = data.total_count || 0;
			const errors = data.errors || [];
			
			let message = `Successfully imported ${imported} of ${total} journal entry/entries`;
			if (errors.length > 0) {
				message += `. ${errors.length} error(s) occurred.`;
			}
			
			showToast({ message, type: 'success' });
			
			// Close modal and reload journal
			const overlay = document.getElementById('import-export-modal-overlay');
			if (overlay) {
				overlay.classList.add('hidden');
				window.unregisterModal('import-export-modal');
			}
			if (typeof resetImportExportModal === 'function') {
				resetImportExportModal();
			}
			resetJournalImportForm();
			
			// Reload journal view if it exists
			if (typeof reloadJournalView === 'function') {
				reloadJournalView();
			} else if (typeof initJournalView === 'function') {
				initJournalView();
			}
		} else {
			showToast({ message: response.error || 'Failed to import journal entries', type: 'error' });
			if (btnExecute) btnExecute.disabled = false;
		}
	} catch (error) {
		console.error('Error importing journal:', error);
		showToast({ message: 'Error importing journal entries', type: 'error' });
		if (btnExecute) btnExecute.disabled = false;
	}
}

/**
 * Open journal import modal (now handled by unified modal)
 */
function openJournalImportModal() {
	if (typeof openImportExportModal === 'function') {
		openImportExportModal('journal');
	}
	resetJournalImportForm();
}

/**
 * Reset journal import form
 */
function resetJournalImportForm() {
	const fileInput = document.getElementById('journal-json-file-input');
	const pasteInput = document.getElementById('journal-json-paste-input');
	const preview = document.getElementById('journal-import-preview');
	const btnPreview = document.getElementById('btn-journal-import-preview');
	const btnExecute = document.getElementById('btn-journal-import-execute');
	
	if (fileInput) fileInput.value = '';
	if (pasteInput) pasteInput.value = '';
	if (preview) preview.classList.add('hidden');
	if (btnPreview) btnPreview.disabled = true;
	if (btnExecute) btnExecute.disabled = true;
	
	journalImportData = null;
	switchJournalImportMethod('file');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initJournalExportImport);
} else {
	initJournalExportImport();
}

