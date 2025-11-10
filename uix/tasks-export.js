/**
 * Tasks Export/Import UI Logic
 * Handles export and import functionality for tasks
 */

let tasksImportData = null;

/**
 * Initialize tasks export/import functionality
 */
function initTasksExportImport() {
	// Export button
	const btnExportTasks = document.getElementById('btn-export-tasks');
	if (btnExportTasks) {
		btnExportTasks.addEventListener('click', handleExportTasks);
	}
	
	// Export result buttons
	setupTasksExportButtons();
	
	// Import modal
	setupTasksImportModal();
}

/**
 * Handle export tasks button click
 */
async function handleExportTasks() {
	const includeCompleted = document.getElementById('export-tasks-include-completed')?.checked ?? true;
	
	try {
		const response = await apiFetch({
			module: 'tasks',
			action: 'exportTasks',
			data: {
				include_completed: includeCompleted
			}
		});
		
		if (response.success && response.data) {
			const jsonText = JSON.stringify(response.data, null, 2);
			showTasksExportResult(jsonText);
		} else {
			showToast({ message: response.error || 'Failed to export tasks', type: 'error' });
		}
	} catch (error) {
		console.error('Error exporting tasks:', error);
		showToast({ message: 'Error exporting tasks', type: 'error' });
	}
}

/**
 * Setup tasks export buttons
 */
function setupTasksExportButtons() {
	const btnCopy = document.getElementById('btn-copy-tasks-export');
	const btnDownload = document.getElementById('btn-download-tasks-export');
	
	if (btnCopy) {
		btnCopy.addEventListener('click', () => {
			const textarea = document.getElementById('tasks-export-json');
			if (textarea) {
				textarea.select();
				document.execCommand('copy');
				showToast({ message: 'Copied to clipboard', type: 'success' });
			}
		});
	}
	
	if (btnDownload) {
		btnDownload.addEventListener('click', () => {
			const textarea = document.getElementById('tasks-export-json');
			if (textarea && textarea.value) {
				const blob = new Blob([textarea.value], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `mdhub-tasks-${new Date().toISOString().split('T')[0]}.json`;
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
 * Show tasks export result in unified modal
 */
function showTasksExportResult(jsonText) {
	const resultDiv = document.getElementById('tasks-export-result');
	const textarea = document.getElementById('tasks-export-json');
	
	if (!resultDiv || !textarea) return;
	
	textarea.value = jsonText;
	resultDiv.classList.remove('hidden');
	
	// Scroll to result
	resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Setup tasks import modal
 */
function setupTasksImportModal() {
	const btnPreview = document.getElementById('btn-tasks-import-preview');
	const btnExecute = document.getElementById('btn-tasks-import-execute');
	const fileInput = document.getElementById('tasks-json-file-input');
	const pasteInput = document.getElementById('tasks-json-paste-input');
	const fileTab = document.querySelector('#import-export-tasks-panel .import-method-tab[data-method="file"]');
	const pasteTab = document.querySelector('#import-export-tasks-panel .import-method-tab[data-method="paste"]');

	// Method tabs
	if (fileTab && pasteTab) {
		fileTab.addEventListener('click', () => switchTasksImportMethod('file'));
		pasteTab.addEventListener('click', () => switchTasksImportMethod('paste'));
	}
	
	// File input
	if (fileInput) {
		fileInput.addEventListener('change', (e) => {
			const file = e.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					pasteInput.value = event.target.result;
					validateTasksImportData(event.target.result);
				};
				reader.readAsText(file);
			}
		});
	}
	
	// Paste input
	if (pasteInput) {
		pasteInput.addEventListener('input', () => {
			validateTasksImportData(pasteInput.value);
		});
	}
	
	// Preview button
	if (btnPreview) {
		btnPreview.addEventListener('click', () => {
			const jsonText = pasteInput?.value || '';
			previewTasksImport(jsonText);
		});
	}
	
	// Execute button
	if (btnExecute) {
		btnExecute.addEventListener('click', () => {
			if (tasksImportData) {
				executeTasksImport(tasksImportData);
			}
		});
	}
}

/**
 * Switch between file upload and paste methods
 */
function switchTasksImportMethod(method) {
	const fileSection = document.getElementById('tasks-import-file-section');
	const pasteSection = document.getElementById('tasks-import-paste-section');
	const fileTab = document.querySelector('#import-export-tasks-panel .import-method-tab[data-method="file"]');
	const pasteTab = document.querySelector('#import-export-tasks-panel .import-method-tab[data-method="paste"]');
	
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
 * Validate tasks import data
 */
function validateTasksImportData(jsonText) {
	const btnPreview = document.getElementById('btn-tasks-import-preview');
	const btnExecute = document.getElementById('btn-tasks-import-execute');
	
	if (!jsonText.trim()) {
		if (btnPreview) btnPreview.disabled = true;
		if (btnExecute) btnExecute.disabled = true;
		tasksImportData = null;
		return;
	}
	
	try {
		const data = JSON.parse(jsonText);
		if (Array.isArray(data)) {
			if (btnPreview) btnPreview.disabled = false;
			if (btnExecute) btnExecute.disabled = false;
			tasksImportData = data;
		} else {
			throw new Error('Data must be an array');
		}
	} catch (error) {
		if (btnPreview) btnPreview.disabled = true;
		if (btnExecute) btnExecute.disabled = true;
		tasksImportData = null;
	}
}

/**
 * Preview tasks import
 */
function previewTasksImport(jsonText) {
	const preview = document.getElementById('tasks-import-preview');
	const previewText = document.getElementById('tasks-import-preview-text');
	
	if (!preview || !previewText) return;
	
	try {
		const data = JSON.parse(jsonText);
		if (Array.isArray(data)) {
			previewText.textContent = `Ready to import ${data.length} task(s)`;
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
 * Execute tasks import
 */
async function executeTasksImport(tasks) {
	const btnExecute = document.getElementById('btn-tasks-import-execute');
	if (btnExecute) btnExecute.disabled = true;
	
	try {
		const response = await apiFetch({
			module: 'tasks',
			action: 'importTasks',
			data: {
				tasks: tasks
			}
		});
		
		const isSuccess = response && (response.success === true || response.status === 'success');
		
		if (isSuccess) {
			const data = response.data || response;
			const imported = data.imported_count || 0;
			const total = data.total_count || 0;
			const errors = data.errors || [];
			
			let message = `Successfully imported ${imported} of ${total} task(s)`;
			if (errors.length > 0) {
				message += `. ${errors.length} error(s) occurred.`;
			}
			
			showToast({ message, type: 'success' });
			
			// Close modal and reload tasks
			const overlay = document.getElementById('import-export-modal-overlay');
			if (overlay) {
				overlay.classList.add('hidden');
				window.unregisterModal('import-export-modal');
			}
			if (typeof resetImportExportModal === 'function') {
				resetImportExportModal();
			}
			resetTasksImportForm();
			
			// Reload tasks view if it exists
			if (typeof reloadTasksView === 'function') {
				reloadTasksView();
			} else if (typeof initTasksView === 'function') {
				initTasksView();
			}
		} else {
			const errorMessage = response?.error || response?.message || 'Failed to import tasks';
			showToast({ message: errorMessage, type: 'error' });
			if (btnExecute) btnExecute.disabled = false;
		}
	} catch (error) {
		console.error('Error importing tasks:', error);
		showToast({ message: 'Error importing tasks', type: 'error' });
		if (btnExecute) btnExecute.disabled = false;
	}
}

/**
 * Open tasks import modal (now handled by unified modal)
 */
function openTasksImportModal() {
	if (typeof openImportExportModal === 'function') {
		openImportExportModal('tasks');
	}
	resetTasksImportForm();
}

/**
 * Reset tasks import form
 */
function resetTasksImportForm() {
	const fileInput = document.getElementById('tasks-json-file-input');
	const pasteInput = document.getElementById('tasks-json-paste-input');
	const preview = document.getElementById('tasks-import-preview');
	const btnPreview = document.getElementById('btn-tasks-import-preview');
	const btnExecute = document.getElementById('btn-tasks-import-execute');
	
	if (fileInput) fileInput.value = '';
	if (pasteInput) pasteInput.value = '';
	if (preview) preview.classList.add('hidden');
	if (btnPreview) btnPreview.disabled = true;
	if (btnExecute) btnExecute.disabled = true;
	
	tasksImportData = null;
	switchTasksImportMethod('file');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initTasksExportImport);
} else {
	initTasksExportImport();
}

