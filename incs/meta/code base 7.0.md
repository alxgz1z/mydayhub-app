<?php
/**
 * code for index.php 
 *
 * MyDayHub - Main Application Shell
 *
 * This page is the main entry point for authenticated users.
 * It establishes the session and redirects to login if the user is not authenticated.
 *
 * @version 6.6.1
 * @author Alex & Gemini
 */ 

require_once __DIR__ . '/incs/config.php';

if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

if (!isset($_SESSION['user_id'])) {
	header('Location: ' . APP_URL . '/login/login.php');
	exit();
}

$username = $_SESSION['username'] ?? 'User';

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
	<title>MyDayHub</title>
	<link rel="icon" type="image/svg+xml" href="media/logo.svg">
	<link rel="stylesheet" href="uix/style.css">
	<link rel="stylesheet" href="uix/tasks.css">
	<link rel="stylesheet" href="uix/editor.css">
	<link rel="stylesheet" href="uix/attachments.css">
	<link rel="stylesheet" href="uix/settings.css">
	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.1/math.min.js"></script>
</head>
<body>

	<div id="main-app-container">

		<header id="app-header">
			<div class="header-left">
				<button id="btn-settings-toggle" class="btn-icon" title="Settings">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				</button>
				<h1 id="app-title">MyDayHub</h1>
				<img src="media/logo.svg" alt="MyDayHub Logo" id="header-logo">
			</div>
			<div class="header-right">
				<div id="add-column-container">
					<button id="btn-add-column" class="btn-header">+ New Column</button>
				</div>
			</div>
		</header>

		<main id="main-content">
			<div id="task-board-container">
				<p>Loading Task Board...</p>
			</div>
			<div class="mobile-bottom-spacer"></div>
		</main>

		<footer id="app-footer" class="<?php if (defined('DEVMODE') && DEVMODE) { echo 'dev-mode'; } ?>">
			<div class="footer-left">
				<span>[<?php echo htmlspecialchars($username); ?>]</span>
				<span id="footer-date"></span>
			</div>
			<div class="footer-center">
				<button id="btn-filters" class="btn-footer-icon" title="Show Filters">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M22 3H2l8 9.46V19l4 2v-8.46L22 3z"></path>
					</svg>
					</button>
				</div>
			<div class="footer-right">
				<span><?php echo APP_VER; ?></span>
				<a href="login/logout.php">Logout</a>
			</div>
		</footer>

	</div>

	<div id="settings-panel-overlay" class="hidden">
		<div id="settings-panel">
			<div class="settings-panel-header">
				<h2>Settings</h2>
				<button id="btn-settings-close" class="btn-icon">&times;</button>
			</div>
			<div class="settings-panel-body">
				<div class="setting-item">
					<span class="setting-label">Light Mode</span>
					<div class="setting-control">
						<label class="switch">
							<input type="checkbox" id="toggle-light-mode">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="setting-item">
					<span class="setting-label">High-Contrast Mode</span>
					<div class="setting-control">
						<label class="switch">
							<input type="checkbox" id="toggle-high-contrast">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="setting-item">
					<span class="setting-label">Change Password</span>
					<div class="setting-control">
						<button id="btn-change-password" class="btn">Change</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<div id="toast-container"></div>

	<div id="confirm-modal-overlay" class="hidden">
		<div id="confirm-modal">
			<p id="confirm-modal-message">Are you sure?</p>
			<div id="confirm-modal-buttons">
				<button id="btn-confirm-no" class="btn">Cancel</button>
				<button id="btn-confirm-yes" class="btn btn-danger">Confirm</button>
			</div>
		</div>
	</div>

	<div id="unified-editor-overlay" class="hidden">
		<div id="unified-editor-container">
			<div class="editor-header">
				<h3 id="editor-title">Edit Note</h3>
				<div class="editor-controls">
					<button id="btn-editor-save-close" class="btn-icon" title="Save & Close">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path><polyline points="8 14 11 17 16 12"></polyline></svg>
					</button>
					<button id="editor-btn-maximize" class="btn-icon" title="Maximize">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(45 12 12)"><polyline points="6 15 12 21 18 15"></polyline><polyline points="18 9 12 3 6 9"></polyline></g></svg>
					</button>
					<button id="editor-btn-restore" class="btn-icon" title="Restore" style="display: none;">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(45 12 12)"><polyline points="15 6 21 12 15 18"></polyline><polyline points="9 18 3 12 9 6"></polyline></g></svg>
					</button>
					<button id="editor-btn-close" class="btn-icon" title="Close">&times;</button>
				</div>
			</div>

			<div id="editor-ribbon">
				<nav id="editor-ribbon-tabs">
					<button class="ribbon-tab active" data-panel="format">Format</button>
					<button class="ribbon-tab" data-panel="find-replace">Find & Replace</button>
				</nav>
				<div id="editor-ribbon-panels">
					<div class="ribbon-panel active" id="editor-panel-format">
						<div class="ribbon-button-group">
								<button class="btn-icon" title="Uppercase" data-action="case" data-casetype="upper">AA</button>
								<button class="btn-icon" title="Title Case" data-action="case" data-casetype="title">Aa</button>
								<button class="btn-icon" title="lowercase" data-action="case" data-casetype="lower">aa</button>
								<button class="btn-icon" title="Underline Selection" data-action="underline"><u>U</u></button>
								<button class="btn-icon" title="Frame Selection" data-action="frame">[]</button>
								<button class="btn-icon" title="Calculate Selection" data-action="calculate">🔢</button>
								<button class="btn-icon" title="Decrease Font Size" data-action="font-size" data-change="-1">A-</button>
								<button class="btn-icon" title="Increase Font Size" data-action="font-size" data-change="1">A+</button>
								<button class="btn-icon btn-text-danger" title="Clear Note" data-action="clear-note">[clear note]</button>
								</div>
					</div>
					<div class="ribbon-panel" id="editor-panel-find-replace"></div>
				</div>
			</div>

			<div class="editor-body">
				<textarea id="editor-textarea" placeholder="Start writing..."></textarea>
			</div>

			<div class="editor-footer" id="editor-status-bar">
				<div id="editor-doc-stats">
					<span>Words: 0</span>
					<span>Chars: 0</span>
				</div>
				<div id="editor-save-status">Last saved: Never</div>
			</div>
		</div>
	</div>

	<div id="date-modal-overlay" class="hidden">
		<div id="date-modal-container">
			<h4>Set Due Date</h4>
			<div id="date-modal-content">
				<input type="date" id="date-modal-input">
			</div>
			<div id="date-modal-buttons">
				<button id="btn-date-remove" class="btn btn-danger">Remove Due Date</button>
				<div class="button-group-right">
					<button id="btn-date-cancel" class="btn">Cancel</button>
					<button id="btn-date-save" class="btn btn-primary">Save</button>
				</div>
			</div>
		</div>
	</div>
	
	<div id="password-modal-overlay" class="hidden">
		<div id="password-modal-container">
			<h4>Change Password</h4>
			<form id="change-password-form">
				<input type="text" name="username" value="<?php echo htmlspecialchars($username); ?>" autocomplete="username" style="display: none;">
				<div class="form-group">
					<label for="current_password">Current Password</label>
					<input type="password" id="current_password" required autocomplete="current-password">
				</div>
				<div class="form-group">
					<label for="new_password">New Password</label>
					<input type="password" id="new_password" required autocomplete="new-password">
				</div>
				<div class="form-group">
					<label for="confirm_password">Confirm New Password</label>
					<input type="password" id="confirm_password" required autocomplete="new-password">
				</div>
				<div id="password-modal-buttons">
					<button type="button" id="btn-password-cancel" class="btn">Cancel</button>
					<button type="submit" class="btn btn-primary">Update Password</button>
				</div>
			</form>
		</div>
	</div>

	<div id="attachments-modal-overlay" class="hidden">
		<div id="attachments-modal-container">
			<div class="attachments-modal-header">
				<h4 id="attachments-modal-title">Attachments</h4>
				<button id="attachments-modal-close-btn" class="btn-icon">&times;</button>
			</div>
			<div id="attachments-modal-body">
				<div id="attachment-drop-zone">
					<p>Drop files here to upload</p>
					<p class="drop-zone-note">Allowed: JPG, PNG, GIF, WebP, PDF (Max 5MB)</p>
				</div>
				<div id="attachment-list">
					<p class="no-attachments-message">No attachments yet.</p>
				</div>
			</div>
			<div class="attachments-modal-footer">
				<div class="attachment-quota-info">
					<span>Storage: </span>
					<progress id="attachment-quota-bar" value="0" max="100"></progress>
					<span id="attachment-quota-text">0 / 50 MB</span>
				</div>
				<div class="footer-button-group">
					<button id="btn-browse-files" class="btn">Browse Files...</button>
					<button id="btn-upload-staged" class="btn btn-success" style="display: none;">Upload</button>
				</div>
				<input type="file" id="attachment-file-input" multiple hidden>
			</div>
		</div>
	</div>

	<div id="attachment-viewer-modal-overlay" class="hidden">
		<button id="attachment-viewer-close-btn" class="btn-icon">&times;</button>
		<div id="attachment-viewer-content"></div>
	</div>

	<script src="uix/app.js" defer></script>
	<script src="uix/editor.js" defer></script>
	<script src="uix/tasks.js" defer></script>

</body>
</html>

/**
 * code for /uix/tasks.js
 *
 * MyDayHub - Tasks View Module
 *
 * Handles fetching and rendering the task board, and all interactions
 * within the Tasks view.
 *
 * @version 6.7.1
 * @author Alex & Gemini
 */

let dragSourceColumn = null;

let filterState = {
	showCompleted: false,
	showPrivate: false,
	showSnoozed: false
};

let userStorage = { used: 0, quota: 50 * 1024 * 1024 }; 

let isImageViewerOpen = false;

let isModalOpening = false; 

let isActionRunning = false;

// Modified for Mobile Move Mode
let isMoveModeActive = false;
let taskToMoveId = null;


/**
 * Helper to format YYY-MM-DD to MM/DD.
 */
function formatDueDate(dateString) {
	if (!dateString || typeof dateString !== 'string') return '';
	const parts = dateString.split('-');
	if (parts.length !== 3) return '';
	return `${parts[1]}/${parts[2]}`;
}


/**
 * Initializes the Tasks view by fetching and rendering the board.
 */
function initTasksView() {
	fetchAndRenderBoard();
	initEventListeners();
}

/**
 * Helper function to reconstruct a task data object from a DOM element.
 */
function getTaskDataFromElement(taskCardEl) {
	return {
		task_id: taskCardEl.dataset.taskId,
		encrypted_data: JSON.stringify({
			title: decodeURIComponent(taskCardEl.dataset.title),
			notes: decodeURIComponent(taskCardEl.dataset.notes)
		}),
		classification: taskCardEl.dataset.classification,
		is_private: taskCardEl.dataset.isPrivate === 'true',
		due_date: taskCardEl.dataset.dueDate || null,
		has_notes: taskCardEl.dataset.hasNotes === 'true',
		attachments_count: parseInt(taskCardEl.dataset.attachmentsCount || '0', 10),
		updated_at: taskCardEl.dataset.updatedAt,
		snoozed_until: taskCardEl.dataset.snoozedUntil || null,
		snoozed_at: taskCardEl.dataset.snoozedAt || null,
		is_snoozed: taskCardEl.dataset.isSnoozed === 'true'
	};
}

/**
 * Re-renders a single task card in place. Preserves scroll position.
 */
function rerenderTaskCard(taskCard) {
	if (!taskCard) return;

	const columnBody = taskCard.closest('.column-body');
	const oldScroll = { top: columnBody ? columnBody.scrollTop : 0, left: document.documentElement.scrollLeft };

	const taskData = getTaskDataFromElement(taskCard);
	if (!taskData) return;

	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = createTaskCard(taskData);
	const newCardEl = tempDiv.firstElementChild;

	taskCard.replaceWith(newCardEl);
	
	if (columnBody) {
		columnBody.scrollTop = oldScroll.top;
	}
	document.documentElement.scrollLeft = oldScroll.left;
}

/**
 * Handles the custom event dispatched from the editor when a note is saved.
 */
function handleNoteSaved(e) {
	const { taskId, hasNotes } = e.detail;
	const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
	if (taskCard) {
		taskCard.dataset.hasNotes = hasNotes;
		rerenderTaskCard(taskCard);
	}
}

/**
 * Opens the Unified Editor for a given task card.
 */
function openNotesEditorForTask(taskCard) {
	if (window.UnifiedEditor && typeof window.UnifiedEditor.open === 'function') {
		const taskId = taskCard.dataset.taskId;
		const notes = decodeURIComponent(taskCard.dataset.notes || '');
		const title = decodeURIComponent(taskCard.dataset.title || 'Edit Note');
		const updatedAt = taskCard.dataset.updatedAt;

		const boardContainer = document.getElementById('task-board-container');
		const savedFontSize = boardContainer.dataset.editorFontSize || 16;

		UnifiedEditor.open({
			id: taskId,
			kind: 'task',
			title: `Note: ${title}`,
			content: notes,
			updatedAt: updatedAt,
			fontSize: parseInt(savedFontSize, 10)
		});
	} else {
		showToast({ message: 'Editor component is not available.', type: 'error' });
	}
}

/**
 * Opens the Due Date modal for a given task card and handles the result.
 */
async function openDueDateModalForTask(taskCard) {
	if (isModalOpening) return;
	isModalOpening = true;

	try {
		const taskId = taskCard.dataset.taskId;
		const currentDate = taskCard.dataset.dueDate;
		const newDate = await showDueDateModal(currentDate);

		if (newDate !== null && newDate !== currentDate) {
			const success = await saveTaskDueDate(taskId, newDate);
			if (success) {
				taskCard.dataset.dueDate = newDate;
				rerenderTaskCard(taskCard);
			}
		}
	} finally {
		isModalOpening = false;
	}
}

/**
 * Sends a request to restore a soft-deleted item.
 */
async function restoreItem(type, id) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'restoreItem',
			type: type,
			id: id
		});

		if (result.status === 'success') {
			if (type === 'task') {
				const restoredTask = result.data;
				const columnEl = document.querySelector(`.task-column[data-column-id="${restoredTask.column_id}"]`);
				if (columnEl) {
					const hiddenCard = document.querySelector(`.task-card[data-task-id="${id}"][style*="display: none"]`);
					if (hiddenCard) {
						hiddenCard.style.display = 'flex';
					} else {
						const taskCardHTML = createTaskCard(restoredTask);
						const columnBody = columnEl.querySelector('.column-body');
						columnBody.insertAdjacentHTML('beforeend', taskCardHTML);
					}
					const columnBody = columnEl.querySelector('.column-body');
					sortTasksInColumn(columnBody);
					updateColumnTaskCount(columnEl);
				}
			} else if (type === 'column') {
				const restoredColumn = result.data;
				const hiddenColumn = document.querySelector(`.task-column[data-column-id="${id}"][style*="display: none"]`);
				if (hiddenColumn) {
					hiddenColumn.style.display = 'flex';
				} else {
					const boardContainer = document.getElementById('task-board-container');
					const columnEl = createColumnElement(restoredColumn);
					boardContainer.appendChild(columnEl);
				}
				updateMoveButtonVisibility();
			}
			showToast({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} restored.`, type: 'success' });
		} else {
			throw new Error(result.message);
		}
	} catch (error) {
		showToast({ message: `Error restoring item: ${error.message}`, type: 'error' });
		console.error('Restore item error:', error);
		fetchAndRenderBoard();
	}
}

/**
 * Sets up the main event listeners for the tasks view.
 */
function initEventListeners() {
	document.addEventListener('click', (e) => { // Modified for Mobile Move Mode
		if (isMoveModeActive && !e.target.closest('.task-actions-menu') && !e.target.closest('.btn-move-here')) {
			const taskCard = document.querySelector(`.task-card[data-task-id="${taskToMoveId}"]`);
			if (taskCard && !taskCard.contains(e.target)) {
				exitMoveMode();
				return;
			}
		}
		if (e.target.closest('#classification-popover') === null && e.target.closest('.task-status-band') === null) {
			closeClassificationPopover();
		}
		if (e.target.closest('.task-actions-menu') === null && e.target.closest('.btn-task-actions') === null) {
			closeAllTaskActionMenus();
		}
		if (e.target.closest('#filter-menu') === null && e.target.closest('#btn-filters') === null) {
			closeFilterMenu();
		}
		if (e.target && e.target.id === 'btn-add-column') {
			showAddColumnForm();
		}
	});

	document.addEventListener('noteSaved', handleNoteSaved);

	const btnFilters = document.getElementById('btn-filters');
	if (btnFilters) {
		btnFilters.addEventListener('click', showFilterMenu);
	}

	const boardContainer = document.getElementById('task-board-container');
	if (boardContainer) {
		boardContainer.addEventListener('keypress', async (e) => {
			if (e.key === 'Enter' && e.target.matches('.new-task-input')) {
				e.preventDefault();
				if (isActionRunning) return;
				isActionRunning = true;
				try {
					const input = e.target;
					const taskTitle = input.value.trim();
					const columnEl = input.closest('.task-column');
					const columnId = columnEl.dataset.columnId;
	
					if (taskTitle && columnId) {
						await createNewTask(columnId, taskTitle, columnEl);
						input.value = '';
					}
				} finally {
					isActionRunning = false;
				}
			}
		});

		boardContainer.addEventListener('change', async (e) => {
			if (e.target.matches('.task-checkbox')) {
				// Prevent double firing
				if (e.target.dataset.processing) return;
				e.target.dataset.processing = 'true';
				
				const checkbox = e.target;
				const taskCard = checkbox.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
		
				if (taskId) {
					await toggleTaskComplete(taskId, checkbox.checked);
				}
				
				// Remove processing flag
				setTimeout(() => delete e.target.dataset.processing, 100);
			}
		});

		boardContainer.addEventListener('click', async (e) => {
			const shortcut = e.target.closest('.indicator-shortcut');
			if (shortcut) {
				const taskCard = shortcut.closest('.task-card');
				const action = shortcut.dataset.action;
				if (action === 'open-notes') {
					openNotesEditorForTask(taskCard);
				} else if (action === 'open-due-date') {
					await openDueDateModalForTask(taskCard);
				} else if (action === 'open-attachments') {
					const taskId = taskCard.dataset.taskId;
					const taskTitle = decodeURIComponent(taskCard.dataset.title);
					await openAttachmentsModal(taskId, taskTitle);
				} else if (action === 'edit-snooze') {
					await openSnoozeModalForTask(taskCard);
				}
				return;
			}
			
			if (e.target.matches('.task-status-band')) {
				const taskCard = e.target.closest('.task-card');
				showClassificationPopover(taskCard);
				return;
			}
			
			const privacyBtn = e.target.closest('.btn-toggle-column-privacy');
			if (privacyBtn) {
				if (isActionRunning) return;
				isActionRunning = true;
				try {
					const columnEl = privacyBtn.closest('.task-column');
					const columnId = columnEl.dataset.columnId;
					if (columnId) {
						await togglePrivacy('column', columnId);
					}
				} finally {
					isActionRunning = false;
				}
				return;
			}

			const deleteBtn = e.target.closest('.btn-delete-column');
			if (deleteBtn) {
				if (isActionRunning) return;
				isActionRunning = true;
				try {
					const columnEl = deleteBtn.closest('.task-column');
					const columnId = columnEl.dataset.columnId;
			
					const success = await deleteColumn(columnId);
					if (success) {
						columnEl.style.display = 'none';
						updateMoveButtonVisibility();
			
						const removalTimeout = setTimeout(() => {
							columnEl.remove();
							updateMoveButtonVisibility();
						}, 7000);
			
						showToast({
							message: 'Column deleted.',
							type: 'success',
							duration: 7000,
							action: {
								text: 'Undo',
								callback: () => {
									clearTimeout(removalTimeout);
									restoreItem('column', columnId);
								}
							}
						});
					} else {
						showToast({ message: 'Error: Could not delete the column.', type: 'error' });
					}
				} finally {
					isActionRunning = false;
				}
				return;
			}
			
			const moveBtn = e.target.closest('.btn-move-column');
			if (moveBtn) {
				const direction = moveBtn.dataset.direction;
				const columnEl = moveBtn.closest('.task-column');
				const container = columnEl.parentElement;

				if (direction === 'left') {
					const prevEl = columnEl.previousElementSibling;
					if (prevEl) {
						container.insertBefore(columnEl, prevEl);
					}
				} else if (direction === 'right') {
					const nextEl = columnEl.nextElementSibling;
					if (nextEl) {
						container.insertBefore(nextEl, columnEl);
					}
				}

				updateMoveButtonVisibility();

				const orderedColumnIds = Array.from(container.children).map(col => col.dataset.columnId);
				const success = await reorderColumns(orderedColumnIds);
				if (!success) {
					showToast({ message: 'Error: Could not save new column order.', type: 'error' });
					fetchAndRenderBoard();
				}
				return;
			}
			
			const actionsBtn = e.target.closest('.btn-task-actions');
			if (actionsBtn) {
				showTaskActionsMenu(actionsBtn);
				return;
			}

			// Modified for Mobile Move Mode
			if (e.target.matches('.btn-move-here')) {
				if (isActionRunning || !isMoveModeActive) return;
				isActionRunning = true;
				try {
					const columnEl = e.target.closest('.task-column');
					const toColumnId = columnEl.dataset.columnId;
					await moveTask(taskToMoveId, toColumnId);
				} finally {
					exitMoveMode();
					isActionRunning = false;
				}
				return;
			}
		});
		
		document.body.addEventListener('click', async (e) => {
			const actionButton = e.target.closest('.task-action-btn');
			if (!actionButton || isActionRunning) return;

			isActionRunning = true;
			try {
				e.stopPropagation();
		
				const menu = actionButton.closest('.task-actions-menu');
				if (!menu) return;

				const taskId = menu.dataset.taskId;
				const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
				const columnEl = taskCard.closest('.task-column');
				const action = actionButton.dataset.action;
		
				closeAllTaskActionMenus();
		
				if (action === 'edit-notes') {
					openNotesEditorForTask(taskCard);
				} else if (action === 'set-due-date') {
					await openDueDateModalForTask(taskCard);
				} else if (action === 'toggle-privacy') {
					if (taskId) {
						await togglePrivacy('task', taskId);
					}
				} else if (action === 'move-task') {
					if (taskCard) { // Modified for Mobile Move Mode Bug Fix
						enterMoveMode(taskCard); // Modified for Mobile Move Mode Bug Fix
					}
				} else if (action === 'attachments') {
					const taskTitle = decodeURIComponent(taskCard.dataset.title);
					await openAttachmentsModal(taskId, taskTitle);
				} else if (action === 'delete') {
					const success = await deleteTask(taskId);
					if (success) {
						taskCard.style.display = 'none';
						updateColumnTaskCount(columnEl);

						const removalTimeout = setTimeout(() => {
							taskCard.remove();
						}, 7000);

						showToast({
							message: 'Task deleted.',
							type: 'success',
							duration: 7000,
							action: {
								text: 'Undo',
								callback: () => {
									clearTimeout(removalTimeout);
									restoreItem('task', taskId);
								}
							}
						});
					} else {
						showToast({ message: 'Error: Could not delete task.', type: 'error' });
					}
				} else if (action === 'duplicate') {
					if (taskId) {
						const newTaskData = await duplicateTask(taskId);
						if (newTaskData) {
							const columnBody = columnEl.querySelector('.column-body');
							const newTaskCardHTML = createTaskCard(newTaskData);
							columnBody.insertAdjacentHTML('beforeend', newTaskCardHTML);
							updateColumnTaskCount(columnEl);
							sortTasksInColumn(columnBody);
							showToast({ message: 'Task duplicated successfully.', type: 'success' });
						} else {
							showToast({ message: 'Error: Could not duplicate the task.', type: 'error' });
						}
					}
				} else if (action === 'unsnooze') {
					await unsnoozeTask(taskCard.dataset.taskId, taskCard);
					
				} else if (action === 'snooze') {
					await openSnoozeModalForTask(taskCard);
				}
			} finally {
				isActionRunning = false;
			}
		});

		boardContainer.addEventListener('dblclick', (e) => {
			if (e.target.matches('.column-title')) {
				const titleEl = e.target;
				const columnEl = titleEl.closest('.task-column');
				const columnId = columnEl.dataset.columnId;
				const originalTitle = titleEl.textContent;

				const input = document.createElement('input');
				input.type = 'text';
				input.value = originalTitle;
				input.className = 'inline-edit-input';

				titleEl.replaceWith(input);
				input.focus();
				input.select();

				let finalized = false;

				const commitChange = async () => {
					if (finalized) return;
					finalized = true;
					
					const newTitle = input.value.trim();

					if (newTitle === '' || newTitle === originalTitle) {
						input.replaceWith(titleEl);
						return;
					}

					titleEl.textContent = newTitle;
					input.replaceWith(titleEl);

					const success = await renameColumn(columnId, newTitle);

					if (success) {
						showToast({ message: 'Column renamed.', type: 'success' });
					} else {
						titleEl.textContent = originalTitle;
						showToast({ message: 'Error: Could not rename column.', type: 'error' });
					}
				};

				input.addEventListener('blur', commitChange);
				input.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						commitChange();
					} else if (e.key === 'Escape') {
						finalized = true;
						input.replaceWith(titleEl);
					}
				});
			} 
			else if (e.target.matches('.task-title')) {
				const titleEl = e.target;
				const taskCard = titleEl.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
				const originalTitle = titleEl.textContent;

				const input = document.createElement('input');
				input.type = 'text';
				input.value = originalTitle;
				input.className = 'inline-edit-input';

				titleEl.replaceWith(input);
				input.focus();
				input.select();

				let finalized = false;

				const commitChange = async () => {
					if (finalized) return;
					finalized = true;
					
					const newTitle = input.value.trim();

					if (newTitle === '' || newTitle === originalTitle) {
						input.replaceWith(titleEl);
						return;
					}

					titleEl.textContent = newTitle;
					input.replaceWith(titleEl);

					const success = await renameTaskTitle(taskId, newTitle);

					if (success) {
						showToast({ message: 'Task renamed.', type: 'success' });
					} else {
						titleEl.textContent = originalTitle;
						showToast({ message: 'Error: Could not rename task.', type: 'error' });
					}
				};

				input.addEventListener('blur', commitChange);
				input.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						commitChange();
					} else if (e.key === 'Escape') {
						finalized = true;
						input.replaceWith(titleEl);
					}
				});
			}
		});

		// Modified for Column Drag & Drop - Task drag handlers
		boardContainer.addEventListener('dragstart', (e) => {
			const taskCard = e.target.closest('.task-card');
			if (taskCard) {
				taskCard.classList.add('dragging');
				dragSourceColumn = taskCard.closest('.task-column');
				return;
			}

			// Modified for Column Drag & Drop - Column drag handlers
			const columnHeader = e.target.closest('.column-header');
			if (columnHeader && e.target.matches('.column-title')) {
				const columnEl = columnHeader.closest('.task-column');
				columnEl.classList.add('dragging-column');
				e.dataTransfer.effectAllowed = 'move';
			}
		});

		// Modified for Column Drag & Drop - Enhanced dragend handler
		boardContainer.addEventListener('dragend', async (e) => {
			if (e.target.matches('.task-card')) {
				e.target.classList.remove('dragging');
				const destinationColumn = e.target.closest('.task-column');

				if (destinationColumn) {
					sortTasksInColumn(destinationColumn.querySelector('.column-body'));

					const columnId = destinationColumn.dataset.columnId;
					const tasks = Array.from(destinationColumn.querySelectorAll('.task-card'));
					const taskIds = tasks.map(card => card.dataset.taskId);
					
					const success = await reorderTasks(columnId, taskIds);
					
					if (success) {
						updateColumnTaskCount(destinationColumn);
						if (dragSourceColumn && dragSourceColumn !== destinationColumn) {
							updateColumnTaskCount(dragSourceColumn);
						}
					} else {
						fetchAndRenderBoard();
					}
				}
				dragSourceColumn = null;
			}
			// Modified for Column Drag & Drop - Column dragend handler
			else if (e.target.matches('.column-title')) {
				const columnEl = e.target.closest('.task-column');
				columnEl.classList.remove('dragging-column');
				
				// Save the new column order
				const container = columnEl.parentElement;
				const orderedColumnIds = Array.from(container.children).map(col => col.dataset.columnId);
				const success = await reorderColumns(orderedColumnIds);
				if (!success) {
					showToast({ message: 'Error: Could not save new column order.', type: 'error' });
					fetchAndRenderBoard();
				} else {
					updateMoveButtonVisibility();
				}
			}
		});

		// Modified for Column Drag & Drop - Enhanced dragover handler
		boardContainer.addEventListener('dragover', (e) => {
			const columnBody = e.target.closest('.column-body');
			if (columnBody) {
				e.preventDefault();
				const draggingCard = document.querySelector('.dragging');
				if (!draggingCard) return;
				const afterElement = getDragAfterElement(columnBody, e.clientY);
				if (afterElement == null) {
					columnBody.appendChild(draggingCard);
				} else {
					columnBody.insertBefore(draggingCard, afterElement);
				}
				return;
			}

			// Modified for Column Drag & Drop - Column dragover handler
			const columnEl = e.target.closest('.task-column');
			if (columnEl && !e.target.closest('.column-body')) {
				e.preventDefault();
				const draggingColumn = document.querySelector('.dragging-column');
				if (draggingColumn && draggingColumn !== columnEl) {
					const container = columnEl.parentElement;
					const afterElement = getColumnAfterElement(container, e.clientX);
					if (afterElement == null) {
						container.appendChild(draggingColumn);
					} else {
						container.insertBefore(draggingColumn, afterElement);
					}
					updateMoveButtonVisibility();
				}
			}
		});
	}
}


/**
 * Closes the filter menu if it's open.
 */
function closeFilterMenu() {
	const menu = document.getElementById('filter-menu');
	if (menu) {
		menu.remove();
	}
}

/**
 * Saves a filter preference to the backend.
 */
async function saveFilterPreference(key, value) {
	try {
		await window.apiFetch({
			module: 'users',
			action: 'saveUserPreference',
			key: key,
			value: value
		});
	} catch (error) {
		console.error('Error saving filter preference:', error);
	}
}

/**
 * Creates and displays the filter menu.
 */
function showFilterMenu() {
	closeFilterMenu(); 
	const btnFilters = document.getElementById('btn-filters');
	if (!btnFilters) return;

	const menu = document.createElement('div');
	menu.id = 'filter-menu';
	
	const showCompletedChecked = filterState.showCompleted ? 'checked' : '';
	const showPrivateChecked = filterState.showPrivate ? 'checked' : '';
	const showSnoozedChecked = filterState.showSnoozed ? 'checked' : '';

	menu.innerHTML = `
	<div class="filter-item">
		<span class="filter-label">Show Completed Tasks</span>
		<label class="switch">
			<input type="checkbox" data-filter="showCompleted" ${showCompletedChecked}>
			<span class="slider round"></span>
		</label>
	</div>
	<div class="filter-item">
		<span class="filter-label">Show Private Items</span>
		<label class="switch">
			<input type="checkbox" data-filter="showPrivate" ${showPrivateChecked}>
			<span class="slider round"></span>
		</label>
	</div>
	<div class="filter-item">
		<span class="filter-label">Show Snoozed Tasks</span>
		<label class="switch">
			<input type="checkbox" data-filter="showSnoozed" ${showSnoozedChecked}>
			<span class="slider round"></span>
		</label>
	</div>
	`;

	document.body.appendChild(menu);

	const btnRect = btnFilters.getBoundingClientRect();
	menu.style.bottom = `${window.innerHeight - btnRect.top + 10}px`;
	menu.style.left = `${btnRect.left + (btnRect.width / 2) - (menu.offsetWidth / 2)}px`;

	setTimeout(() => menu.classList.add('visible'), 10);

	menu.addEventListener('change', (e) => {
		if (e.target.matches('input[type="checkbox"]')) {
			const filter = e.target.dataset.filter;
			const value = e.target.checked;
			filterState[filter] = value;
			applyAllFilters();
			
			const keyMap = {
				showCompleted: 'filter_show_completed',
				showPrivate: 'filter_show_private',
				showSnoozed: 'filter_show_snoozed'
			};
			saveFilterPreference(keyMap[filter], value);
		}
	});
}

/**
 * Applies all active filters to the task cards on the board.
 */
function applyAllFilters() {
	const allItems = document.querySelectorAll('.task-card, .task-column');

	allItems.forEach(item => {
		const isCompleted = item.classList.contains('completed');
		const isPrivate = item.classList.contains('private');
		const isSnoozed = item.classList.contains('snoozed');
		
		let shouldBeVisible = true;

		if (isCompleted && !filterState.showCompleted) {
			shouldBeVisible = false;
		}
		if (isPrivate && !filterState.showPrivate) {
			shouldBeVisible = false;
		}
		if (isSnoozed && !filterState.showSnoozed) {
			shouldBeVisible = false;
		}
		
		item.style.display = shouldBeVisible ? 'flex' : 'none';
	});

	const allColumns = document.querySelectorAll('.task-column');
	allColumns.forEach(column => {
		updateColumnTaskCount(column);
	});
}


/**
 * Saves the due date via API.
 */
async function saveTaskDueDate(taskId, newDate) {
	try {
		await window.apiFetch({
			module: 'tasks',
			action: 'saveTaskDetails',
			task_id: taskId,
			dueDate: newDate
		});
		showToast({ message: 'Due date updated.', type: 'success' });
		return true;
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Save due date error:', error);
		return false;
	}
}

/**
 * Gets the element to drop a dragged element after.
 */
function getDragAfterElement(container, y) {
	const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

	return draggableElements.reduce((closest, child) => {
		const box = child.getBoundingClientRect();
		const offset = y - box.top - box.height / 2;
		if (offset < 0 && offset > closest.offset) {
			return { offset: offset, element: child };
		} else {
			return closest;
		}
	}, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Modified for Column Drag & Drop - Gets the column element to drop a dragged column after.
 */
function getColumnAfterElement(container, x) {
	const draggableColumns = [...container.querySelectorAll('.task-column:not(.dragging-column)')];

	return draggableColumns.reduce((closest, child) => {
		const box = child.getBoundingClientRect();
		const offset = x - box.left - box.width / 2;
		if (offset < 0 && offset > closest.offset) {
			return { offset: offset, element: child };
		} else {
			return closest;
		}
	}, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Gets the numerical rank of a task card based on its classification.
 */
const getTaskRank = (taskEl) => {
	const classification = taskEl.dataset.classification;
	if (classification === 'completed') return 3;
	if (classification === 'signal') return 0;
	if (classification === 'support') return 1;
	if (classification === 'backlog') return 2;
	return 1; // Default to 'support' rank
};

/**
 * Sorts the tasks within a column's body based on their classification rank.
 */
function sortTasksInColumn(columnBodyEl) {
	if (!columnBodyEl) return;
	const tasks = Array.from(columnBodyEl.querySelectorAll('.task-card'));
	
	tasks.sort((a, b) => {
		const rankA = getTaskRank(a);
		const rankB = getTaskRank(b);
		return rankA - rankB;
	}).forEach(task => columnBodyEl.appendChild(task));
}


/**
 * Closes any open task action menus.
 */
function closeAllTaskActionMenus() {
	document.querySelectorAll('.task-actions-menu').forEach(menu => menu.remove());
}

/**
 * Creates and displays the task actions menu.
 */
function showTaskActionsMenu(buttonEl) {
	closeAllTaskActionMenus(); 
	const taskCard = buttonEl.closest('.task-card');
	if (!taskCard) {
		return;
	}

	const menu = document.createElement('div');
	menu.className = 'task-actions-menu';
	menu.dataset.taskId = taskCard.dataset.taskId;

	const isPrivate = taskCard.dataset.isPrivate === 'true';
	const isSnoozed = taskCard.dataset.isSnoozed === 'true';
	const privacyText = isPrivate ? 'Make Public' : 'Make Private';
	const privacyIcon = isPrivate
		? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
		: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

	menu.innerHTML = `
		<button class="task-action-btn" data-action="edit-notes">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
			<span>Edit Notes</span>
		</button>
		<button class="task-action-btn" data-action="set-due-date">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
				<line x1="16" y1="2" x2="16" y2="6"></line>
				<line x1="8" y1="2" x2="8" y2="6"></line>
				<line x1="3" y1="10" x2="21" y2="10"></line>
			</svg>
			<span>Set Due Date</span>
		</button>
		<button class="task-action-btn" data-action="toggle-privacy">
			${privacyIcon}
			<span>${privacyText}</span>
		</button>
		<button class="task-action-btn" data-action="move-task">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 6 21 12 15 18"></polyline><polyline points="9 18 3 12 9 6"></polyline>
			</svg>
			<span>Move Task</span>
		</button>
		<button class="task-action-btn" data-action="attachments">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
			<span>Attachments</span>
		</button>
		<button class="task-action-btn" data-action="duplicate">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
				<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
			</svg>
			<span>Duplicate Task</span>
		</button>
		
		<button class="task-action-btn" data-action="${isSnoozed ? 'unsnooze' : 'snooze'}">
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			${isSnoozed ? '<path d="M6 2l3 3.5L12 2l3 3.5L18 2"/><path d="M6 16.5l3-3.5 3 3.5 3-3.5 3 3.5"/><polyline points="6 12 12 6 18 12"/>' : '<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M5 3L3 5"></path><path d="M19 3l2 2"></path>'}
			</svg>
				<span>${isSnoozed ? 'Remove Snooze' : 'Snooze Task'}</span>
			</button>
		<button class="task-action-btn" data-action="delete">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
				<line x1="10" y1="11" x2="10" y2="17"/>
				<line x1="14" y1="11" x2="14" y2="17"/>
			</svg>
			<span>Delete Task</span>
		</button>
	`;

	document.body.appendChild(menu);

	const btnRect = buttonEl.getBoundingClientRect();
	menu.style.top = `${window.scrollY + btnRect.bottom + 5}px`;
	menu.style.left = `${window.scrollX + btnRect.right - menu.offsetWidth}px`;

	setTimeout(() => menu.classList.add('visible'), 10);
}


/**
 * Updates the visual task count in a column's header.
 */
function updateColumnTaskCount(columnEl) {
	if (!columnEl) return;
	const countSpan = columnEl.querySelector('.task-count');
	const taskCount = columnEl.querySelectorAll('.task-card:not([style*="display: none"])').length;
	if (countSpan) {
		countSpan.textContent = taskCount;
	}
}


/**
 * Hides/shows move buttons based on column position (first/last).
 */
function updateMoveButtonVisibility() {
	const columns = document.querySelectorAll('.task-column:not([style*="display: none"])');
	columns.forEach((col, index) => {
		const btnLeft = col.querySelector('.btn-move-column[data-direction="left"]');
		const btnRight = col.querySelector('.btn-move-column[data-direction="right"]');
		if (btnLeft) {
			btnLeft.style.visibility = (index === 0) ? 'hidden' : 'visible';
		}
		if (btnRight) {
			btnRight.style.visibility = (index === columns.length - 1) ? 'hidden' : 'visible';
		}
	});
}

/**
 * Sends a request to duplicate a task.
 */
async function duplicateTask(taskId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'duplicateTask',
			task_id: taskId
		});
		if (result.status === 'success') {
			return result.data;
		}
		return null;
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Duplicate task error:', error);
		return null;
	}
}


/**
 * Sends a request to delete a task.
 */
async function deleteTask(taskId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'deleteTask',
			task_id: taskId
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Delete task error:', error);
		return false;
	}
}

/**
 * Sends a request to save the new order of all columns.
 */
async function reorderColumns(orderedColumnIds) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'reorderColumns',
			column_ids: orderedColumnIds
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Reorder columns error:', error);
		return false;
	}
}

/**
 * Sends a request to delete a column.
 */
async function deleteColumn(columnId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'deleteColumn',
			column_id: columnId
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Delete column error:', error);
		return false;
	}
}

/**
 * Sends a request to rename a column.
 */
async function renameColumn(columnId, newName) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'renameColumn',
			column_id: columnId,
			new_name: newName
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Rename column error:', error);
		return false;
	}
}

/**
 * Sends a request to rename a task's title.
 */
async function renameTaskTitle(taskId, newTitle) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'renameTaskTitle',
			task_id: taskId,
			new_title: newTitle
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Rename task title error:', error);
		return false;
	}
}

/**
 * Sends a request to move a task to a different column.
 */
async function moveTask(taskId, toColumnId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'moveTask',
			task_id: taskId,
			to_column_id: toColumnId
		});
		if (result.status === 'success') {
			showToast({ message: 'Task moved.', type: 'success' });
			fetchAndRenderBoard(); // Refresh the board to show the change
			return true;
		}
		return false;
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		return false;
	}
}


/**
 * Sends the new order of tasks to the API.
 */
async function reorderTasks(columnId, tasks) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'reorderTasks',
			column_id: columnId,
			tasks: tasks
		});
		if (result.status !== 'success') {
			showToast({ message: `Error: ${result.message}`, type: 'error' });
			return false;
		}
		return true;
	} catch (error) {
		showToast({ message: 'A network error occurred. Please try again.', type: 'error' });
		console.error('Reorder tasks error:', error);
		return false;
	}
}

/**
 * Toggles the privacy status of a task or column.
 */
async function togglePrivacy(type, id) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'togglePrivacy',
			type: type,
			id: id
		});
		if (result.status === 'success') {
			const { is_private } = result.data;
			const selector = type === 'task' ? `.task-card[data-task-id="${id}"]` : `.task-column[data-column-id="${id}"]`;
			const element = document.querySelector(selector);
			
			if (element) {
				element.classList.toggle('private', is_private);
				element.dataset.isPrivate = is_private;

				const privacyBtnText = is_private ? 'Make Public' : 'Make Private';
				showToast({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} set to ${is_private ? 'private' : 'public'}.`, type: 'success' });

				if (type === 'column') {
					const btn = element.querySelector('.btn-toggle-column-privacy');
					if (btn) btn.title = privacyBtnText;
				}
				
				applyAllFilters();
			}
		} else {
			throw new Error(result.message || `Failed to toggle privacy for ${type}.`);
		}
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Toggle privacy error:', error);
	}
}


/**
 * Toggles a task's completion status.
 */
// Modified for Bug Fix - Completion persistence and animation
async function toggleTaskComplete(taskId, isComplete) {
	const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'toggleComplete',
			task_id: taskId
		});

		if (result.status === 'success') {
			// Update the task data first
			taskCard.classList.toggle('completed', isComplete);
			taskCard.dataset.classification = result.data.new_classification;

			taskCard.classList.remove('classification-signal', 'classification-support', 'classification-backlog');
			if (!isComplete) {
				taskCard.classList.add(`classification-${result.data.new_classification}`);
			}
			
			// Re-render the card to update its content
			rerenderTaskCard(taskCard);
			
			// Apply the animation to the new card
			if (isComplete) {
				const updatedCard = document.querySelector(`[data-task-id="${taskId}"]`);
				updatedCard.classList.add('is-completing');
				setTimeout(() => {
					updatedCard.classList.remove('is-completing');
					// IMPORTANT: Apply filters AFTER animation completes
					applyAllFilters();
				}, 1500);
			} else {
				// If unchecking, apply filters immediately
				applyAllFilters();
			}
			
			sortTasksInColumn(taskCard.closest('.column-body'));
		} else {
			throw new Error(result.message);
		}
	} catch (error) {
		showToast({ message: `Error: ${error.message}`, type: 'error' });
		const checkbox = taskCard.querySelector('.task-checkbox');
		if (checkbox) checkbox.checked = !isComplete;
		console.error('Toggle complete error:', error);
	}
}

/**
 * Sets a task's classification by calling the API and updating the UI.
 * @param {string} taskId - The ID of the task to update.
 * @param {string} newClassification - The new classification ('signal', 'support', 'backlog').
 */
async function setTaskClassification(taskId, newClassification) {
	const taskCardEl = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'toggleClassification',
			task_id: taskId,
			classification: newClassification
		});

		if (result.status === 'success') {
			const returnedClassification = result.data.new_classification;
			taskCardEl.dataset.classification = returnedClassification;
			taskCardEl.classList.remove('classification-signal', 'classification-support', 'classification-backlog', 'classification-noise');
			taskCardEl.classList.add(`classification-${returnedClassification}`);
			sortTasksInColumn(taskCardEl.closest('.column-body'));
		} else {
			showToast({ message: `Error: ${result.message}`, type: 'error' });
		}
	} catch (error) {
		showToast({ message: `A network error occurred: ${error.message}`, type: 'error' });
		console.error('Set classification error:', error);
	}
}

/**
 * Closes the classification popover if it exists.
 */
function closeClassificationPopover() {
	const popover = document.getElementById('classification-popover');
	if (popover) {
		popover.remove();
	}
}

/**
 * Shows a popover menu to change a task's classification.
 * @param {HTMLElement} taskCard - The task card element that was clicked.
 */
function showClassificationPopover(taskCard) {
	closeClassificationPopover();

	const taskId = taskCard.dataset.taskId;
	if (!taskId || taskCard.classList.contains('completed')) {
		return;
	}

	const popover = document.createElement('div');
	popover.id = 'classification-popover';
	popover.innerHTML = `
		<button class="classification-option" data-value="signal">
			<span class="swatch classification-signal"></span> Signal
		</button>
		<button class="classification-option" data-value="support">
			<span class="swatch classification-support"></span> Support
		</button>
		<button class="classification-option" data-value="backlog">
			<span class="swatch classification-backlog"></span> Backlog
		</button>
	`;

	document.body.appendChild(popover);

	const band = taskCard.querySelector('.task-status-band');
	const rect = band.getBoundingClientRect();
	popover.style.top = `${window.scrollY + rect.top}px`;
	popover.style.left = `${window.scrollX + rect.right + 5}px`;

	popover.addEventListener('click', (e) => {
		const button = e.target.closest('.classification-option');
		if (button) {
			const newClassification = button.dataset.value;
			setTaskClassification(taskId, newClassification);
			closeClassificationPopover();
		}
	});
}


/**
 * Displays an input form to add a new column in place of the button.
 */
function showAddColumnForm() {
	const container = document.getElementById('add-column-container');
	if (!container || container.querySelector('#form-add-column')) {
		return;
	}
	const originalButton = container.innerHTML;

	container.innerHTML = `
		<form id="form-add-column">
			<input type="text" id="input-new-column-name" placeholder="Column Name..." required autofocus />
		</form>
	`;

	const form = document.getElementById('form-add-column');
	const input = document.getElementById('input-new-column-name');

	const revertToButton = () => {
		if (container.contains(form)) {
			 container.innerHTML = originalButton;
		}
	};
	
	input.addEventListener('blur', revertToButton);

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		input.removeEventListener('blur', revertToButton);
		const columnName = input.value.trim();
		if (columnName) {
			try {
				const result = await window.apiFetch({
					module: 'tasks',
					action: 'createColumn',
					column_name: columnName
				});

				if (result.status === 'success') {
					const boardContainer = document.getElementById('task-board-container');
					
					const placeholder = boardContainer.querySelector('p');
					if (placeholder && placeholder.textContent.startsWith('No columns found')) {
						placeholder.remove();
					}

					const newColumnEl = createColumnElement(result.data);
					boardContainer.appendChild(newColumnEl);
					updateMoveButtonVisibility(); 
					showToast({ message: 'Column created.', type: 'success' });
				} else {
					showToast({ message: `Error: ${result.message}`, type: 'error' });
				}
			} catch (error) {
				showToast({ message: `A network error occurred: ${error.message}`, type: 'error' });
				console.error('Create column error:', error);
			}
		}
		container.innerHTML = originalButton;
	});
}

/**
 * Sends a new task to the API and renders the response.
 */
async function createNewTask(columnId, taskTitle, columnEl) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'createTask',
			column_id: columnId,
			task_title: taskTitle
		});

		if (result.status === 'success') {
			const columnBody = columnEl.querySelector('.column-body');
			const placeholder = columnBody.querySelector('.no-tasks-message');
			if (placeholder) {
				placeholder.remove();
			}
			const newTaskCardHTML = createTaskCard(result.data);
			columnBody.insertAdjacentHTML('beforeend', newTaskCardHTML);
			sortTasksInColumn(columnBody);
			updateColumnTaskCount(columnEl);
			showToast({ message: 'Task created.', type: 'success' });
		} else {
			showToast({ message: `Error: ${result.message}`, type: 'error' });
		}
	} catch (error) {
		showToast({ message: `A network error occurred: ${error.message}`, type: 'error' });
		console.error('Create task error:', error);
	}
}


// Modified for High Contrast Mode
/**
 * Fetches the complete board data from the API and initiates rendering.
 */
async function fetchAndRenderBoard() {
	const container = document.getElementById('task-board-container');
	if (!container) {
		console.error('Task board container not found!');
		return;
	}

	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const apiURL = `${appURL}/api/api.php?module=tasks&action=getAll`;

		const response = await fetch(apiURL);

		if (!response.ok) {
			if (response.status === 401) {
				window.location.href = `${appURL}/login/login.php`;
				return;
			}
			throw new Error(`API responded with status: ${response.status}`);
		}

		const result = await response.json();

		if (result.status === 'success') {
			const boardData = result.data.board;
			const userPrefs = result.data.user_prefs;
			
			if (result.data.user_storage) {
				userStorage = result.data.user_storage;
			}

			// Apply user preferences on load
			if (userPrefs) {
				if (userPrefs.editor_font_size) {
					container.dataset.editorFontSize = userPrefs.editor_font_size;
				}
				if (typeof userPrefs.filter_show_completed !== 'undefined') {
					filterState.showCompleted = userPrefs.filter_show_completed;
				}
				if (typeof userPrefs.filter_show_private !== 'undefined') {
					filterState.showPrivate = userPrefs.filter_show_private;
				}
				if (typeof userPrefs.filter_show_snoozed !== 'undefined') {
					filterState.showSnoozed = userPrefs.filter_show_snoozed;
				}
				// Handle theme preferences
				const highContrastToggle = document.getElementById('toggle-high-contrast');
				const lightModeToggle = document.getElementById('toggle-light-mode');

				if (userPrefs.high_contrast_mode) {
					document.body.classList.add('high-contrast');
					if (highContrastToggle) highContrastToggle.checked = true;
				} else if (userPrefs.light_mode) {
					document.body.classList.add('light-mode');
					if (lightModeToggle) lightModeToggle.checked = true;
				}
			}

			renderBoard(boardData);
		} else {
			throw new Error(result.message || 'Failed to fetch board data.');
		}

	} catch (error) {
		console.error('Error fetching board data:', error);
		container.innerHTML = `<p style="color: #d94f46;">Could not load board. ${error.message}</p>`;
	}
}

/**
 * Renders the entire board from the data provided by the API.
 */
function renderBoard(boardData) {
	const container = document.getElementById('task-board-container');
	container.innerHTML = ''; 

	if (boardData.length === 0) {
		const placeholder = document.createElement('p');
		placeholder.textContent = 'No columns found. Create your first column to get started!';
		container.appendChild(placeholder);
		return;
	}

	boardData.forEach(columnData => {
		const columnEl = createColumnElement(columnData);
		container.appendChild(columnEl);
		const columnBody = columnEl.querySelector('.column-body');
		sortTasksInColumn(columnBody);
	});

	updateMoveButtonVisibility();
	applyAllFilters();
}

/**
 * Creates the HTML element for a single column and its tasks.
 */
function createColumnElement(columnData) {
	const columnEl = document.createElement('div');
	const isPrivate = columnData.is_private;
	columnEl.className = `task-column ${isPrivate ? 'private' : ''}`;
	columnEl.dataset.columnId = columnData.column_id;
	columnEl.dataset.isPrivate = isPrivate;

	let tasksHTML = '';
	if (columnData.tasks && columnData.tasks.length > 0) {
		tasksHTML = columnData.tasks.map(taskData => createTaskCard(taskData)).join('');
	} else {
		tasksHTML = '<p class="no-tasks-message">No tasks in this column.</p>';
	}
	
	const privacyBtnTitle = isPrivate ? 'Make Public' : 'Make Private';
	const privacyIcon = isPrivate 
		? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
		: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

	columnEl.innerHTML = `
		<div class="column-header">
			<div class="column-header-controls">
				<button class="btn-move-column" data-direction="left" title="Move Left">&lt;</button>
				<button class="btn-toggle-column-privacy" title="${privacyBtnTitle}">${privacyIcon}</button>
				<button class="btn-delete-column" title="Delete Column">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
						<line x1="10" y1="11" x2="10" y2="17"/>
						<line x1="14" y1="11" x2="14" y2="17"/>
					</svg>
				</button>
				<button class="btn-move-column" data-direction="right" title="Move Right">&gt;</button>
			</div>
			<h2 class="column-title" draggable="true">${columnData.column_name}</h2>
			<span class="task-count">${columnData.tasks ? columnData.tasks.length : 0}</span>
		</div>
		<div class="column-body">
			${tasksHTML}
		</div>
		<div class="column-footer">
			<input type="text" class="new-task-input" placeholder="+ New Task" />
		</div>
	`;
	return columnEl;
}

/**
 * Creates the HTML string for a single task card.
 */
function createTaskCard(taskData) {
	let taskTitle = 'Encrypted Task';
	let taskNotes = '';
	try {
		const data = JSON.parse(taskData.encrypted_data);
		taskTitle = data.title;
		taskNotes = data.notes || '';
	} catch (e) {
		console.error("Could not parse task data:", taskData.encrypted_data);
	}

	const isCompleted = taskData.classification === 'completed';
	const isPrivate = taskData.is_private;
	const isSnoozed = taskData.is_snoozed || taskData.snoozed_until;
	let classificationClass = '';
	if (!isCompleted) {
		const classification = taskData.classification === 'noise' ? 'backlog' : taskData.classification;
		classificationClass = `classification-${classification}`;
	}
	
	let footerHTML = '';
	const hasSnoozeIndicator = taskData.is_snoozed || taskData.snoozed_until;
	const hasIndicators = taskData.has_notes || taskData.due_date || (taskData.attachments_count && taskData.attachments_count > 0) || hasSnoozeIndicator;
	
	if (hasIndicators) {
		let notesIndicator = '';
		if (taskData.has_notes) {
			notesIndicator = `
				<span class="task-indicator indicator-shortcut" data-action="open-notes" title="This task has notes">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
				</span>
			`;
		}

		let dueDateIndicator = '';
		if (taskData.due_date) {
			let isOverdue = false;
			if (!isCompleted) {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const dueDate = new Date(taskData.due_date + 'T00:00:00');
				if (dueDate < today) {
					isOverdue = true;
				}
			}
			dueDateIndicator = `
				<span class="task-indicator indicator-shortcut ${isOverdue ? 'overdue' : ''}" data-action="open-due-date" title="Due: ${taskData.due_date}">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
					<span class="due-date-text">${formatDueDate(taskData.due_date)}</span>
				</span>
			`;
		}
		
		let snoozeIndicator = '';
		if (taskData.snoozed_until && !isCompleted) {
			// Modified for Snooze Feature - Fixed date parsing for UTC timestamps
			const wakeDate = new Date(taskData.snoozed_until);
			const wakeDateFormatted = wakeDate.toLocaleDateString('en-US', { 
				month: 'short', 
				day: 'numeric',
				timeZone: 'UTC' 
			});
			snoozeIndicator = `
			<span class="task-indicator indicator-shortcut snooze-indicator" data-action="edit-snooze" title="Click to edit snooze date">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="13" r="8"></circle>
						<path d="M12 9v4l2 2"></path>
						<path d="M5 3L3 5"></path>
						<path d="M19 3l2 2"></path>
					</svg>
					<span class="snooze-date-text">${wakeDateFormatted}</span>
				</span>
			`;
		}
		
		
		let attachmentsIndicator = '';
		if (taskData.attachments_count && taskData.attachments_count > 0) {
			attachmentsIndicator = `
				<span class="task-indicator indicator-shortcut" data-action="open-attachments" title="${taskData.attachments_count} attachment(s)">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
					<span class="attachment-count">${taskData.attachments_count}</span>
				</span>
			`;
		}

		footerHTML = `
			<div class="task-card-footer">
				${attachmentsIndicator}
				${snoozeIndicator}
				${notesIndicator}
				${dueDateIndicator}
			</div>
		`;
	}

	return `
	<div 
		class="task-card ${isCompleted ? 'completed' : ''} ${classificationClass} ${isPrivate ? 'private' : ''} ${isSnoozed ? 'snoozed' : ''}"
			data-task-id="${taskData.task_id}" 
			data-title="${encodeURIComponent(taskTitle)}"
			data-notes="${encodeURIComponent(taskNotes)}"
			data-classification="${taskData.classification}"
			data-is-private="${isPrivate}"
			data-has-notes="${taskData.has_notes}"
			data-updated-at="${taskData.updated_at || ''}"
			data-due-date="${taskData.due_date || ''}"
			data-attachments-count="${taskData.attachments_count || 0}"
			data-snoozed-until="${taskData.snoozed_until || ''}"
			data-snoozed-at="${taskData.snoozed_at || ''}"
			data-is-snoozed="${taskData.is_snoozed || false}"
			draggable="true">
			<div class="task-card-main">
				<div class="task-status-band"></div>
				<input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
				<span class="task-title">${taskTitle}</span>
				<button class="btn-task-actions" title="Task Actions">&vellip;</button>
			</div>
			${footerHTML}
		</div>
	`;
}

// --- Attachment Functions ---

/**
 * Deletes a single attachment by its ID.
 */
async function deleteAttachment(attachmentId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'deleteAttachment',
			attachment_id: attachmentId
		});

		if (result.status === 'success') {
			showToast({ message: 'Attachment deleted.', type: 'success' });
			const response = await fetch(`${window.MyDayHub_Config.appURL}/api/api.php?module=tasks&action=getAll`);
			const boardResult = await response.json();
			if (boardResult.status === 'success' && boardResult.data.user_storage) {
				userStorage = boardResult.data.user_storage;
			}
			return true;
		} else {
			throw new Error(result.message || 'Failed to delete attachment.');
		}
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Delete attachment error:', error);
		return null;
	}
}


/**
 * Fetches the list of attachments for a given task from the API.
 */
async function getAttachments(taskId) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php?module=tasks&action=getAttachments&task_id=${taskId}`);
		const result = await response.json();
		if (result.status === 'success') {
			return result.data;
		}
		throw new Error(result.message || 'Failed to fetch attachments.');
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Get attachments error:', error);
		return null;
	}
}

/**
 * Uploads a single file attachment for a task.
 */
async function uploadAttachment(taskId, file) {
	const formData = new FormData();
	formData.append('module', 'tasks');
	formData.append('action', 'uploadAttachment');
	formData.append('task_id', taskId);
	formData.append('attachment', file);

	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: {
				'X-CSRF-TOKEN': csrfToken 
			},
			body: formData
		});
		const result = await response.json();
		
		if (result.status === 'success') {
			return result.data;
		} else {
			showToast({ message: `Upload failed for ${file.name}: ${result.message}`, type: 'error' });
			return null;
		}
	} catch (error) {
		showToast({ message: `A network error occurred uploading ${file.name}.`, type: 'error' });
		console.error('Upload attachment error:', error);
		return null;
	}
}

/**
 * Updates the attachment count on the main task card after an upload/delete.
 */
function updateTaskCardAttachmentCount(taskId, newCount) {
	const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
	if (taskCard) {
		taskCard.dataset.attachmentsCount = newCount;
		rerenderTaskCard(taskCard);
	}
}

/**
 * Updates the UI for the storage quota bar and text.
 */
function updateStorageBar(usedBytes, quotaBytes) {
	if (usedBytes === null || typeof usedBytes === 'undefined' || !isFinite(usedBytes)) {
		usedBytes = 0;
	}

	const progressBar = document.getElementById('attachment-quota-bar');
	const quotaText = document.getElementById('attachment-quota-text');
	if (!progressBar || !quotaText) return;

	const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
	const quotaMB = (quotaBytes / 1024 / 1024).toFixed(1);

	progressBar.max = quotaBytes;
	progressBar.value = usedBytes;
	quotaText.textContent = `${usedMB} / ${quotaMB} MB`;
}


/**
 * Opens the attachments modal and populates it with data for a given task.
 */
async function openAttachmentsModal(taskId, taskTitle) {
	if (isModalOpening) return;
	isModalOpening = true;

	try {
		const modalOverlay = document.getElementById('attachments-modal-overlay');
		const modalTitle = document.getElementById('attachments-modal-title');
		const listContainer = document.getElementById('attachment-list');
		const dropZone = document.getElementById('attachment-drop-zone');
		const btnBrowse = document.getElementById('btn-browse-files');
		const fileInput = document.getElementById('attachment-file-input');
		const btnUploadStaged = document.getElementById('btn-upload-staged');
		
		if (!modalOverlay || !btnBrowse || !btnUploadStaged) {
			console.error('Attachments modal components are missing!');
			return;
		}

		let stagedListContainer = document.getElementById('staged-attachment-list');
		if (!stagedListContainer) {
			stagedListContainer = document.createElement('div');
			stagedListContainer.id = 'staged-attachment-list';
			dropZone.insertAdjacentElement('afterend', stagedListContainer);
		}
		
		let stagedFiles = [];
		
		modalOverlay.dataset.currentTaskId = taskId;
		modalTitle.textContent = `Attachments for: ${taskTitle}`;
		listContainer.innerHTML = '<p>Loading...</p>';
		updateStorageBar(userStorage.used, userStorage.quota);
		modalOverlay.classList.remove('hidden');

		const refreshAttachmentList = async () => {
			const attachments = await getAttachments(taskId);
			if (attachments) {
				renderAttachmentList(attachments, listContainer);
				updateTaskCardAttachmentCount(taskId, attachments.length);
			} else {
				listContainer.innerHTML = '<p class="no-attachments-message">Could not load attachments.</p>';
			}
		};
		
		await refreshAttachmentList();
		
		const closeButton = document.getElementById('attachments-modal-close-btn');

		const renderStagedFiles = () => {
			stagedListContainer.innerHTML = '';
			if (stagedFiles.length > 0) {
				const fileCount = stagedFiles.length;
				btnUploadStaged.textContent = `Upload ${fileCount} File${fileCount > 1 ? 's' : ''}`;
				stagedFiles.forEach((file, index) => {
					const fileSizeKB = (file.size / 1024).toFixed(1);
					const itemEl = document.createElement('div');
					itemEl.className = 'staged-attachment-item';
					itemEl.innerHTML = `
						<span class="filename">${file.name}</span>
						<span class="filesize">${fileSizeKB} KB</span>
						<button class="btn-remove-staged" data-index="${index}" title="Remove">&times;</button>
					`;
					stagedListContainer.appendChild(itemEl);
				});
				btnUploadStaged.style.display = 'inline-block';
			} else {
				btnUploadStaged.style.display = 'none';
			}
		};
		
		stagedListContainer.addEventListener('click', (e) => {
			if (e.target.matches('.btn-remove-staged')) {
				const indexToRemove = parseInt(e.target.dataset.index, 10);
				stagedFiles.splice(indexToRemove, 1);
				renderStagedFiles();
			}
		});

		const handleFiles = (files) => {
			stagedFiles.push(...Array.from(files));
			renderStagedFiles();
		};

		const handleUploadStaged = async () => {
			if (stagedFiles.length === 0) return;

			btnUploadStaged.disabled = true;
			btnUploadStaged.textContent = 'Uploading...';

			for (const file of stagedFiles) {
				const result = await uploadAttachment(taskId, file);
				if (result) {
					userStorage.used = result.user_storage_used;
					updateStorageBar(userStorage.used, userStorage.quota);
				}
			}

			stagedFiles = [];
			renderStagedFiles();
			await refreshAttachmentList();

			btnUploadStaged.disabled = false;
			showToast({ message: 'Uploads complete.', type: 'success' });
		};

		const handleDeleteAttachmentClick = async (e) => {
			const deleteBtn = e.target.closest('.btn-delete-attachment');
			if (deleteBtn) {
				e.preventDefault();
				e.stopPropagation();
				const attachmentId = deleteBtn.dataset.attachmentId;
				const confirmed = await showConfirm('Are you sure you want to permanently delete this attachment?');
				if (confirmed) {
					const success = await deleteAttachment(attachmentId);
					if (success) {
						await refreshAttachmentList();
					}
				}
			}
		};

		const handleBrowseClick = () => fileInput.click();
		const handleFileChange = (e) => handleFiles(e.target.files);
		const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
		const handleDragEnter = () => dropZone.classList.add('drag-over');
		const handleDragLeave = () => dropZone.classList.remove('drag-over');
		const handleDrop = (e) => {
			dropZone.classList.remove('drag-over');
			handleFiles(e.dataTransfer.files);
		};

		const handlePaste = (e) => {
			const filesToUpload = Array.from(e.clipboardData.items)
				.filter(item => item.type.startsWith('image/'))
				.map(item => item.getAsFile());

			if (filesToUpload.length > 0) {
				e.preventDefault();
				handleFiles(filesToUpload);
			}
		};

		const closeModalHandler = () => {
			btnBrowse.removeEventListener('click', handleBrowseClick);
			fileInput.removeEventListener('change', handleFileChange);
			btnUploadStaged.removeEventListener('click', handleUploadStaged);
			listContainer.removeEventListener('click', handleDeleteAttachmentClick);
			['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
				dropZone.removeEventListener(eventName, preventDefaults);
				document.body.removeEventListener(eventName, preventDefaults);
			});
			dropZone.removeEventListener('dragenter', handleDragEnter);
			dropZone.removeEventListener('dragleave', handleDragLeave);
			dropZone.removeEventListener('drop', handleDrop);
			document.removeEventListener('paste', handlePaste);
			document.removeEventListener('keydown', handleEscKey);
			modalOverlay.removeEventListener('click', clickOutsideHandler);
			closeButton.removeEventListener('click', closeModalHandler);
			closeAttachmentsModal();
		};

		const handleEscKey = (e) => {
			if (e.key === 'Escape' && !isImageViewerOpen) closeModalHandler();
		};
		
		const clickOutsideHandler = (e) => {
			if (e.target === modalOverlay) closeModalHandler();
		};
		
		btnBrowse.addEventListener('click', handleBrowseClick);
		fileInput.addEventListener('change', handleFileChange);
		btnUploadStaged.addEventListener('click', handleUploadStaged);
		listContainer.addEventListener('click', handleDeleteAttachmentClick);
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
			dropZone.addEventListener(eventName, preventDefaults, false);
			document.body.addEventListener(eventName, preventDefaults, false);
		});
		dropZone.addEventListener('dragenter', handleDragEnter, false);
		dropZone.removeEventListener('dragleave', handleDragLeave, false);
		dropZone.addEventListener('drop', handleDrop, false);
		document.addEventListener('paste', handlePaste, false);
		document.addEventListener('keydown', handleEscKey, false);
		modalOverlay.addEventListener('click', clickOutsideHandler);
		closeButton.addEventListener('click', closeModalHandler);
	} finally {
		isModalOpening = false;
	}
}


/**
 * Closes the attachments modal and cleans up.
 */
function closeAttachmentsModal() {
	const modalOverlay = document.getElementById('attachments-modal-overlay');
	if (modalOverlay) {
		modalOverlay.classList.add('hidden');
		modalOverlay.removeAttribute('data-current-task-id');
		
		const stagedList = document.getElementById('staged-attachment-list');
		if (stagedList) stagedList.innerHTML = '';

		const btnUpload = document.getElementById('btn-upload-staged');
		if (btnUpload) btnUpload.style.display = 'none';
	}
}

/**
 * Renders the list of attachments inside the modal.
 */
function renderAttachmentList(attachments, container) {
	container.innerHTML = '';
	if (attachments.length === 0) {
		container.innerHTML = '<p class="no-attachments-message">No attachments yet.</p>';
		return;
	}

	const appURL = window.MyDayHub_Config?.appURL || '';

	attachments.forEach(att => {
		const isPdf = att.original_filename.toLowerCase().endsWith('.pdf');
		const fileUrl = `${appURL}/media/imgs/${att.filename_on_server}`;
		
		const itemEl = document.createElement(isPdf ? 'a' : 'div');
		itemEl.className = 'attachment-item';
		
		if (isPdf) {
			itemEl.href = fileUrl;
			itemEl.target = '_blank';
		}

		const fileSizeKB = (att.filesize_bytes / 1024).toFixed(1);
		
		let thumbnailHTML = '';
		if (isPdf) {
			thumbnailHTML = `
				<div class="attachment-thumbnail-icon">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
					</svg>
				</div>
			`;
		} else {
			thumbnailHTML = `<img src="${fileUrl}" class="thumbnail" alt="${att.original_filename}" />`;
		}

		itemEl.innerHTML = `
			${thumbnailHTML}
			<div class="attachment-file-info">
				<span class="filename">${att.original_filename}</span>
				<span class="filesize">${fileSizeKB} KB</span>
			</div>
			<button class="btn-delete-attachment" title="Delete Attachment" data-attachment-id="${att.attachment_id}">&times;</button>
		`;

		if (!isPdf) {
			itemEl.addEventListener('click', (e) => {
				if (e.target.closest('.btn-delete-attachment')) {
					return;
				}
				openAttachmentViewer(fileUrl, att.original_filename);
			});
		}
		
		container.appendChild(itemEl);
	});
}


/**
 * Opens the full-screen attachment viewer modal with the specified content.
 */
function openAttachmentViewer(fileUrl, filename) {
	isImageViewerOpen = true; 
	const viewerOverlay = document.getElementById('attachment-viewer-modal-overlay');
	const contentContainer = document.getElementById('attachment-viewer-content');
	const viewerCloseBtn = document.getElementById('attachment-viewer-close-btn');

	if (!viewerOverlay || !contentContainer || !viewerCloseBtn) {
		console.error('Attachment viewer elements not found.');
		isImageViewerOpen = false; 
		return;
	}

	contentContainer.innerHTML = '';

	const img = document.createElement('img');
	img.src = fileUrl;
	img.alt = filename;
	contentContainer.appendChild(img);

	viewerOverlay.classList.remove('hidden');
	
	const handleEscKey = (e) => {
		if (e.key === 'Escape') {
			closeAttachmentViewer();
		}
	};

	const closeHandler = (e) => {
		if (e.target === viewerOverlay || e.target === viewerCloseBtn) {
			closeAttachmentViewer();
		}
	};
	
	viewerOverlay.addEventListener('click', closeHandler, { once: true });
	viewerCloseBtn.addEventListener('click', closeHandler, { once: true });
	document.addEventListener('keydown', handleEscKey, { once: true });
}

/**
 * Closes the attachment viewer modal.
 */
function closeAttachmentViewer() {
	const viewerOverlay = document.getElementById('attachment-viewer-modal-overlay');
	if (viewerOverlay) {
		viewerOverlay.classList.add('hidden');
		const contentContainer = document.getElementById('attachment-viewer-content');
		if (contentContainer) {
			contentContainer.innerHTML = '';
		}
	}
	isImageViewerOpen = false;
}

// --- Mobile Move Mode Functions ---

/**
 * Enters a UI state that allows for moving a task via tapping.
 * @param {HTMLElement} taskCard - The task card element to be moved.
 */
function enterMoveMode(taskCard) {
	if (isMoveModeActive) {
		exitMoveMode(); // Exit any previous move mode first
	}

	isMoveModeActive = true;
	taskToMoveId = taskCard.dataset.taskId;

	taskCard.classList.add('is-moving');

	const sourceColumnId = taskCard.closest('.task-column').dataset.columnId;

	document.querySelectorAll('.task-column').forEach(column => {
		const footer = column.querySelector('.column-footer');
		if (column.dataset.columnId === sourceColumnId) {
			footer.innerHTML = `<button class="btn btn-danger btn-cancel-move">Cancel Move</button>`;
			footer.querySelector('.btn-cancel-move').addEventListener('click', exitMoveMode, { once: true });
		} else {
			footer.innerHTML = `<button class="btn btn-success btn-move-here">Move Here</button>`;
		}
	});
}

/**
 * Exits the "Move Mode" UI state and restores the original column footers.
 */
function exitMoveMode() {
	if (!isMoveModeActive) return;

	const movingCard = document.querySelector(`.task-card[data-task-id="${taskToMoveId}"]`);
	if (movingCard) {
		movingCard.classList.remove('is-moving');
	}

	document.querySelectorAll('.column-footer').forEach(footer => {
		footer.innerHTML = `<input type="text" class="new-task-input" placeholder="+ New Task" />`;
	});

	isMoveModeActive = false;
	taskToMoveId = null;
}

/**
 * Opens the snooze modal for a given task card and handles the result.
 */
// Modified for Snooze Feature - Fixed modal workflow
 async function openSnoozeModalForTask(taskCard) {
	 if (isModalOpening) return;
	 isModalOpening = true;
 
	 try {
		const taskId = taskCard.dataset.taskId;
		const currentSnoozeDate = taskCard.dataset.snoozedUntil || null;
		const snoozeSelection = await showSnoozeModal(currentSnoozeDate);
 
		 if (snoozeSelection !== null) {
			 const result = await snoozeTask(taskId, snoozeSelection);
			 if (result) {
				 // Task card is already updated in snoozeTask function
				 const columnBody = taskCard.closest('.column-body');
				 sortTasksInColumn(columnBody);
				 showToast({ message: 'Task snoozed successfully.', type: 'success' });
			 }
		 }
	 } finally {
		 isModalOpening = false;
	 }
 }

/**
 * Sends a request to snooze a task until a specified date.
 */
// Modified for Snooze Feature - Fixed data synchronization
 async function snoozeTask(taskId, snoozeDate) {
	 try {
		 const result = await window.apiFetch({
			 module: 'tasks',
			 action: 'snoozeTask',
			 task_id: taskId,
			 duration_type: snoozeDate.startsWith('custom:') ? 'custom' : snoozeDate,
			 custom_date: snoozeDate.startsWith('custom:') ? snoozeDate.substring(7) : null
		 });
		 if (result.status === 'success') {
			 // Update task card datasets with backend response
			 const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
			 if (taskCard) {
				 taskCard.dataset.snoozedUntil = result.data.snoozed_until;
				 taskCard.dataset.classification = result.data.classification;
				 taskCard.dataset.isSnoozed = 'true';
				 
				 // Re-render the card to update visual state
				 rerenderTaskCard(taskCard);
			 }
			 return result.data;
		 } else {
			 showToast({ message: `Error: ${result.message}`, type: 'error' });
			 return false;
		 }
	 } catch (error) {
		 showToast({ message: error.message, type: 'error' });
		 console.error('Snooze task error:', error);
		 return false;
	 }
 }

/**
  * Shows a modal for selecting snooze duration and returns the selected date.
  * @param {string|null} currentSnoozeDate - Current snooze date if editing existing snooze
  * @returns {Promise<string|null>} ISO date string or null if cancelled
  */
 async function showSnoozeModal(currentSnoozeDate = null) {
	return new Promise((resolve) => {
	const modal = document.createElement('div');
	modal.className = 'modal-overlay snooze-modal-overlay';
		modal.innerHTML = `
			<div class="modal-content snooze-modal">
				<div class="modal-header">
					<h3>Snooze Task</h3>
					<button class="modal-close-btn" type="button">&times;</button>
				</div>
				<div class="modal-body">
				${currentSnoozeDate ? `<p><strong>Currently snoozed until:</strong> ${new Date(currentSnoozeDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</p><hr style="margin: 1rem 0; border-color: var(--border-color);">` : ''}
				<p>Select when this task should wake up:</p>
				<div class="snooze-options">
						<button class="snooze-preset-btn" data-duration="week">1 Week</button>
						<button class="snooze-preset-btn" data-duration="month">1 Month</button>
						<button class="snooze-preset-btn" data-duration="quarter">1 Quarter</button>
						<button class="snooze-custom-btn">Custom Date...</button>
					</div>
					<div class="custom-date-section" style="display: none;">
						<label for="snooze-custom-date">Wake Date:</label>
						<input type="date" id="snooze-custom-date" />
						<button class="btn-confirm-custom">Confirm</button>
					</div>
				</div>
			</div>
		`;

		document.body.appendChild(modal);
		setTimeout(() => modal.classList.add('visible'), 10);

		const closeModal = (result) => {
			modal.remove();
			resolve(result);
		};

		// Calculate preset dates
		const calculateSnoozeDate = (duration) => {
		const date = new Date();
		date.setHours(9, 0, 0, 0); // 9 AM wake time per spec
		
		switch (duration) {
			case 'week':
				date.setDate(date.getDate() + 7);
				return '1week';
			case 'month':
				date.setMonth(date.getMonth() + 1);
				return '1month';
			case 'quarter':
				// Fixed: Add 3 months properly handling year boundaries
				const currentMonth = date.getMonth();
				const newMonth = (currentMonth + 3) % 12;
				const yearIncrement = Math.floor((currentMonth + 3) / 12);
				date.setFullYear(date.getFullYear() + yearIncrement);
				date.setMonth(newMonth);
				return '1quarter';
			default:
				return duration;
			}
		};

		modal.addEventListener('click', (e) => {
			if (e.target === modal || e.target.matches('.modal-close-btn')) {
				closeModal(null);
			} else if (e.target.matches('.snooze-preset-btn')) {
				const duration = e.target.dataset.duration;
				const durationMap = { 'week': '1week', 'month': '1month', 'quarter': '1quarter' };
				closeModal(durationMap[duration]);
			} else if (e.target.matches('.snooze-custom-btn')) {
				const customSection = modal.querySelector('.custom-date-section');
				const dateInput = modal.querySelector('#snooze-custom-date');
				customSection.style.display = 'block';
				dateInput.focus();
			} else if (e.target.matches('.btn-confirm-custom')) {
				const dateInput = modal.querySelector('#snooze-custom-date');
				const selectedDate = dateInput.value;
				if (selectedDate) {
					closeModal(`custom:${selectedDate}`);
				}
			}
		});

		// ESC key handler
		const handleEsc = (e) => {
			if (e.key === 'Escape') {
				document.removeEventListener('keydown', handleEsc);
				closeModal(null);
			}
		};
		document.addEventListener('keydown', handleEsc);
	});
}

/**
 * Sends a request to unsnooze (wake up) a snoozed task.
 */
// Modified for Snooze Feature - Fixed data synchronization
 async function unsnoozeTask(taskId, taskCard) {
	 try {
		 const result = await window.apiFetch({
			 module: 'tasks',
			 action: 'unsnoozeTask',
			 task_id: taskId
		 });
		 if (result.status === 'success') {
			 // Clear snooze data from task card datasets
			 taskCard.dataset.snoozedUntil = '';
			 taskCard.dataset.snoozedAt = '';
			 taskCard.dataset.isSnoozed = 'false';
			 taskCard.classList.remove('snoozed');
			 
			 // Re-render the card to update visual state and menu
			 rerenderTaskCard(taskCard);
			 sortTasksInColumn(taskCard.closest('.column-body'));
			 
			 showToast({ message: 'Task unsnoozed successfully.', type: 'success' });
			 return true;
		 } else {
			 showToast({ message: `Error: ${result.message}`, type: 'error' });
			 return false;
		 }
	 } catch (error) {
		 showToast({ message: error.message, type: 'error' });
		 console.error('Unsnooze task error:', error);
		 return false;
	 }
 }

// Initial load
document.addEventListener('DOMContentLoaded', initTasksView);

/* Code for /uix/tasks.css */

/* MyDayHub - Tasks View Specific Styles */

/* ==========================================================================
   1. TASK BOARD LAYOUT
   ========================================================================== */

#task-board-container {
	display: flex;
	gap: 1rem;
	align-items: flex-start; /* Align columns to the top */
	overflow-x: auto; /* Allow horizontal scrolling */
	height: 100%;
}

/* ==========================================================================
   2. COLUMN STYLES
   ========================================================================== */

.task-column {
	background-color: var(--toolbar-bg);
	border: 1px solid var(--border-color);
	border-radius: 8px;
	width: 320px;
	flex-shrink: 0; /* Prevent columns from shrinking */
	display: flex;
	flex-direction: column;
	max-height: 100%;
	position: relative; 
	overflow: hidden;   
}

/* Modified for Column Drag & Drop - Visual feedback for dragging columns */
.task-column.dragging-column {
	border: 2px solid var(--accent-color);
	box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
	transform: rotate(1deg);
	opacity: 0.9;
	z-index: 1000;
}

.task-column.dragging-column .column-title {
	color: var(--accent-color);
	font-weight: 600;
}

.column-header {
	display: flex;
	align-items: center;
	padding: 0.75rem 1rem;
	border-bottom: 1px solid var(--border-color);
	gap: 0.75rem; /* Add gap for spacing between elements */
}

/* Modified for Column Drag & Drop - Indicate draggable columns */
.column-title {
	font-size: 1.1rem;
	font-weight: 500;
	margin: 0;
	flex-grow: 1; /* Allows title to push count to the right */
	cursor: grab; /* Indicate draggable */
	transition: color 0.2s ease-in-out;
}

.column-title:active {
	cursor: grabbing;
}

.column-title:hover {
	color: var(--accent-color);
}

.column-header-controls {
	display: flex;
	align-items: center;
	gap: 4px;
	opacity: 0; /* Hidden by default */
	pointer-events: none;
	transition: opacity 0.2s ease-in-out;
}

.column-header:hover .column-header-controls {
	opacity: 1;
	pointer-events: auto;
}

.btn-move-column {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	font-weight: bold;
	font-size: 1.2rem;
	padding: 0 4px;
	line-height: 1;
	transition: color 0.2s ease-in-out;
}

.btn-move-column:hover {
	color: var(--accent-color);
}

.btn-delete-column,
.btn-toggle-column-privacy { 
	background: transparent;
	border: none;
	padding: 2px;
	cursor: pointer;
	line-height: 0;
}

.btn-delete-column svg,
.btn-toggle-column-privacy svg { 
	stroke: var(--text-secondary);
	transition: stroke 0.2s ease-in-out;
}

.btn-delete-column:hover svg {
	stroke: #e57373; /* A soft red for hover */
}

.btn-toggle-column-privacy:hover svg { 
	stroke: var(--accent-color);
}


.task-count {
	font-size: 0.9rem;
	color: var(--text-secondary);
	background-color: var(--bg-color);
	padding: 2px 8px;
	border-radius: 10px;
}

.column-body {
	padding: 0.5rem;
	overflow-y: auto;
	flex-grow: 1;
}

.column-footer {
	padding: 0.5rem;
	border-top: 1px solid var(--border-color);
}

.column-footer input {
	width: 100%;
	background-color: transparent;
	border: none;
	color: var(--text-secondary);
	padding: 0.5rem;
	border-radius: 4px;
	box-sizing: border-box;
}

.column-footer input:focus {
	outline: none;
	background-color: var(--bg-color);
}

.no-tasks-message {
	padding: 1rem;
	color: var(--text-secondary);
	font-size: 0.9rem;
}


/* ==========================================================================
   3. TASK CARD STYLES
   ========================================================================== */

/* Modified for Quick Notes Rollback */
.task-card {
	display: flex;
	flex-direction: column;
	background-color: var(--bg-color);
	border: 1px solid var(--border-color);
	padding: 0.75rem;
	border-radius: 6px;
	margin-bottom: 0.5rem;
	position: relative;
	overflow: hidden;
}

.task-card-main {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}


.task-status-band {
	width: 12px;
	height: 24px;
	background-color: var(--accent-color);
	border-radius: 4px;
	cursor: pointer;
	transition: background-color 0.2s ease-in-out, background 0.2s ease-in-out;
	flex-shrink: 0;
}

.task-checkbox {
	align-self: center;
}

.task-title {
	flex-grow: 1;
	align-self: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}


/* --- Task Card Footer & Indicators --- */

.task-card-footer {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding-top: 0.4rem;
	margin-top: 0.4rem;
	border-top: 1px solid var(--border-color-light);
	padding-left: calc(12px + 0.75rem + 13px + 0.75rem); /* band + gap + checkbox + gap */
}

.task-indicator {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.75rem;
	color: var(--text-secondary);
	font-weight: 500;
}

.indicator-shortcut {
	cursor: pointer;
	transition: color 0.2s ease-in-out;
}

.indicator-shortcut:hover {
	color: var(--text-primary);
}


.task-indicator svg {
	stroke: currentColor;
}

.task-indicator.overdue {
	color: #ff6b6b; /* A clear, but not too harsh, red */
}

.task-indicator.snooze-indicator {
	color: #c4b5fd; /* Much lighter purple for better readability */
	background-color: rgba(196, 181, 253, 0.2);
	padding: 2px 6px;
	border-radius: 4px;
	border: 1px solid rgba(139, 92, 246, 0.2);
}


.task-card.classification-signal .task-status-band {
	background-color: #28a745; /* Green */
}

.task-card.classification-support .task-status-band {
	background: repeating-linear-gradient(
		45deg,
		#007bff,
		#007bff 3px,
		rgba(0, 0, 0, 0.2) 3px,
		rgba(0, 0, 0, 0.2) 4px
	);
}

.task-card.classification-backlog .task-status-band {
	background-color: #fd7e14; /* Orange */
}

.task-card.completed {
	opacity: 0.6;
}

.task-card.completed .task-title {
	text-decoration: line-through;
	color: var(--text-secondary);
}

.task-card.completed .task-status-band {
	background-color: var(--text-secondary); /* Gray */
}

/* Snoozed task styling */
.task-card.snoozed {
	opacity: 0.65;
	filter: grayscale(0.3);
}

.task-card.snoozed .task-title {
	color: var(--text-secondary);
}

/* With enhanced visual feedback similar to column dragging: */
.task-card.dragging {
	border: 2px solid var(--accent-color);
	box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
	transform: rotate(2deg);
	opacity: 0.9;
	z-index: 1000;
	background-color: var(--toolbar-bg);
}

.task-card.dragging .task-title {
	color: var(--accent-color);
	font-weight: 600;
}

.task-card.dragging .task-status-band {
	background-color: var(--accent-color) !important;
}

/* Modified for Completion Animation */
.task-card.is-completing::before,
.task-card.is-completing::after {
	content: '';
	position: absolute;
	top: 18px; /* Align with checkbox */
	left: 45px; /* Align with checkbox */
	width: 8px;
	height: 8px;
	background: var(--accent-color);
	border-radius: 50%;
	animation: confetti-burst 0.8s ease-out forwards;
	opacity: 0;
}

.task-card.is-completing::after {
	animation-delay: 0.1s;
}

@keyframes confetti-burst {
	0% {
		opacity: 1;
		transform: scale(0.5) translate(0, 0);
	}
	100% {
		opacity: 0;
		transform: scale(1) translate(40px, -20px);
	}
}

/* ==========================================================================
   4. HEADER CONTROLS
   ========================================================================== */

#form-add-column {
	display: inline-block;
}

#input-new-column-name {
	padding: 0.5rem 1rem;
	border: 1px solid var(--accent-color);
	background-color: var(--bg-color);
	color: var(--text-primary);
	border-radius: 6px;
	font-size: 1rem;
}

#input-new-column-name:focus {
	outline: none;
}

.btn-header {
	background: none;
	border: 1px solid transparent;
	color: var(--text-secondary);
	padding: 0.5rem 1rem;
	font-size: 1rem;
	cursor: pointer;
	border-radius: 6px;
}

.btn-header:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}


/* ==========================================================================
   5. RESPONSIVE & MOBILE STYLES
   ========================================================================== */

@media (max-width: 768px) {
	#task-board-container {
		flex-direction: column;
		overflow-x: hidden;
		gap: 1.5rem;
	}

	.task-column {
		width: 100%;
	}
}

/* ==========================================================================
   6. TASK ACTIONS MENU
   ========================================================================== */

.btn-task-actions {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	font-size: 1.2rem;
	line-height: 1;
	align-self: center;
	transition: background-color 0.2s ease-out, color 0.2s ease-out;
}

.btn-task-actions:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}

.task-actions-menu {
	position: absolute;
	background-color: var(--column-bg);
	border: 1px solid var(--card-border);
	border-radius: 6px;
	box-shadow: 0 5px 15px rgba(0,0,0,0.3);
	z-index: 100;
	padding: 5px;
	min-width: 160px;
	opacity: 0;
	transform: scale(0.95) translateY(-5px);
	transition: transform 0.1s ease-out, opacity 0.1s ease-out;
	transform-origin: top right;
}

.task-actions-menu.visible {
	opacity: 1;
	transform: scale(1) translateY(0);
}

.task-action-btn {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	background: none;
	border: none;
	color: var(--text-primary);
	text-align: left;
	padding: 8px 12px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.95rem;
}

.task-action-btn:hover {
	background-color: var(--accent-color);
	color: white;
}

/* ==========================================================================
   7. PRIVACY STYLES
   ========================================================================== */

.task-column.private::after,
.task-card.private::after {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-image: repeating-linear-gradient(
		135deg,
		rgba(255, 255, 255, 0.12),
		rgba(255, 255, 255, 0.12) 1px,
		transparent 1px,
		transparent 10px
	);
	pointer-events: none;
	z-index: 1;
	border-radius: inherit;
}

.task-column.private,
.task-card.private {
	opacity: 0.8;
}

.task-card-main,
.task-card-footer,
.column-header,
.column-body,
.column-footer {
	z-index: 2;
	position: relative;
}

/* ==========================================================================
   8. CLASSIFICATION POPOVER
   ========================================================================== */

#classification-popover {
	position: absolute;
	z-index: 1000; /* High z-index to appear above other content */
	background-color: var(--toolbar-bg);
	border: 1px solid var(--border-color);
	border-radius: 6px;
	padding: 4px;
	display: flex;
	gap: 4px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(5px);
}

.classification-option {
	background: none;
	border: 1px solid var(--border-color);
	color: var(--text-secondary);
	padding: 6px 10px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.9rem;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: background-color 0.2s ease-out, color 0.2s ease-out;
}

.classification-option:hover {
	background-color: var(--accent-color);
	color: white;
	 border-color: var(--accent-color);
}

.classification-option .swatch {
	display: inline-block;
	width: 12px;
	height: 12px;
	border-radius: 3px;
	flex-shrink: 0;
}

.classification-option .swatch.classification-signal {
	background-color: #28a745;
}
.classification-option .swatch.classification-support {
	background: repeating-linear-gradient(
		45deg,
		#007bff,
		#007bff 2px,
		rgba(0, 0, 0, 0.2) 2px,
		rgba(0, 0, 0, 0.2) 3px
	);
}
.classification-option .swatch.classification-backlog {
	background-color: #fd7e14;
}

/* ==========================================================================
   9. MOBILE MOVE MODE
   ========================================================================== */

.task-card.is-moving {
	outline: 2px solid var(--accent-color);
	box-shadow: 0 0 15px var(--accent-color);
	animation: tremor 0.3s infinite;
}

.column-footer .btn-move-here,
.column-footer .btn-cancel-move {
	width: 100%;
	padding: 0.75rem;
	font-size: 1rem;
	font-weight: 500;
}

/* Tremor animation for the selected card */
@keyframes tremor {
  0% { transform: rotate(0.5deg); }
  25% { transform: rotate(0deg); }
  50% { transform: rotate(-0.5deg); }
  75% { transform: rotate(0deg); }
  100% { transform: rotate(0.5deg); }
}

/* ==========================================================================
   10. Enhanced Task Completion Celebration Animation
   ========================================================================== */

.task-card.is-completing {
	position: relative;
	overflow: visible; /* Allow effects to extend beyond card bounds */
	z-index: 10; /* Bring to front during animation */
}

/* Main celebration effect - scaling pulse with glow */
.task-card.is-completing::before {
	content: '';
	position: absolute;
	top: -10px;
	left: -10px;
	right: -10px;
	bottom: -10px;
	background: linear-gradient(45deg, 
		rgba(34, 197, 94, 0.4), 
		rgba(59, 130, 246, 0.4), 
		rgba(168, 85, 247, 0.4), 
		rgba(249, 115, 22, 0.4)
	);
	border-radius: 12px;
	animation: celebrationGlow 1.2s ease-out forwards;
	z-index: -1;
}

/* Confetti particles */
.task-card.is-completing::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 6px;
	height: 6px;
	background: var(--accent-color);
	border-radius: 50%;
	animation: confettiBurst 1s ease-out forwards;
	box-shadow: 
		/* Multiple confetti particles with different colors and positions */
		15px -20px 0 2px #22c55e,
		-15px -25px 0 1px #3b82f6,
		25px -15px 0 3px #a855f7,
		-25px -10px 0 1px #f97316,
		35px -30px 0 2px #ef4444,
		-35px -35px 0 1px #eab308,
		45px -20px 0 2px #06b6d4,
		-45px -15px 0 3px #ec4899,
		20px -40px 0 1px #84cc16,
		-20px -45px 0 2px #f59e0b,
		30px -50px 0 1px #8b5cf6,
		-30px -25px 0 2px #10b981;
}

/* Pulsing glow effect */
@keyframes celebrationGlow {
	0% {
		opacity: 0;
		transform: scale(1);
		filter: blur(0px);
	}
	25% {
		opacity: 1;
		transform: scale(1.05);
		filter: blur(1px);
	}
	50% {
		opacity: 0.8;
		transform: scale(1.1);
		filter: blur(2px);
	}
	100% {
		opacity: 0;
		transform: scale(1.3);
		filter: blur(4px);
	}
}

/* Confetti burst animation */
@keyframes confettiBurst {
	0% {
		opacity: 1;
		transform: translate(-50%, -50%) scale(0) rotate(0deg);
	}
	15% {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1.2) rotate(45deg);
	}
	100% {
		opacity: 0;
		transform: translate(-50%, -50%) scale(0.5) rotate(180deg);
	}
}

/* Additional card shake effect for extra satisfaction */
.task-card.is-completing .task-card-main {
	animation: celebrationShake 0.6s ease-in-out;
}

@keyframes celebrationShake {
	0%, 100% { transform: translateX(0) rotate(0deg); }
	10% { transform: translateX(-2px) rotate(-0.5deg); }
	20% { transform: translateX(2px) rotate(0.5deg); }
	30% { transform: translateX(-2px) rotate(-0.5deg); }
	40% { transform: translateX(2px) rotate(0.5deg); }
	50% { transform: translateX(-1px) rotate(-0.2deg); }
	60% { transform: translateX(1px) rotate(0.2deg); }
	70% { transform: translateX(-1px) rotate(-0.2deg); }
	80% { transform: translateX(1px) rotate(0.2deg); }
	90% { transform: translateX(0) rotate(0deg); }
}

/* Success checkmark that appears temporarily */
.task-card.is-completing .task-checkbox {
	position: relative;
}

.task-card.is-completing .task-checkbox::after {
	content: '✓';
	position: absolute;
	top: -8px;
	left: -8px;
	width: 30px;
	height: 30px;
	background: linear-gradient(135deg, #22c55e, #16a34a);
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	font-weight: bold;
	animation: checkmarkPop 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

@keyframes checkmarkPop {
	0% {
		opacity: 0;
		transform: scale(0) rotate(-180deg);
	}
	50% {
		opacity: 1;
		transform: scale(1.3) rotate(0deg);
	}
	100% {
		opacity: 0;
		transform: scale(1) rotate(0deg);
	}
}

/* Subtle sparkle effect around the card */
.task-card.is-completing {
	animation: cardSparkle 1.2s ease-out;
}

@keyframes cardSparkle {
	0%, 100% {
		filter: brightness(1) saturate(1);
	}
	25% {
		filter: brightness(1.2) saturate(1.3);
	}
	50% {
		filter: brightness(1.4) saturate(1.5);
	}
	75% {
		filter: brightness(1.2) saturate(1.3);
	}
}

/* Ensure the animation works on mobile */
@media (max-width: 768px) {
	.task-card.is-completing::before {
		top: -5px;
		left: -5px;
		right: -5px;
		bottom: -5px;
	}
	
	.task-card.is-completing .task-checkbox::after {
		width: 24px;
		height: 24px;
		font-size: 14px;
		top: -6px;
		left: -6px;
	}
}

left: -6px;
	}
}

/* ==========================================================================
   11. SNOOZE MODAL
   ========================================================================== */

.snooze-modal {
	width: 400px;
	max-width: 90vw;
}

.snooze-options {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin: 1rem 0;
}

.snooze-preset-btn,
.snooze-custom-btn {
	background-color: var(--bg-color);
	border: 2px solid var(--border-color);
	color: var(--text-primary);
	padding: 0.75rem 1rem;
	border-radius: 6px;
	cursor: pointer;
	font-size: 1rem;
	transition: all 0.2s ease-in-out;
	text-align: left;
}

.snooze-preset-btn:hover,
.snooze-custom-btn:hover {
	border-color: var(--accent-color);
	background-color: rgba(59, 130, 246, 0.1);
}

.custom-date-section {
	margin-top: 1rem;
	padding: 1rem;
	background-color: var(--toolbar-bg);
	border-radius: 6px;
	border: 1px solid var(--border-color);
}

.custom-date-section label {
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: var(--text-primary);
}

#snooze-custom-date {
	width: 100%;
	padding: 0.5rem;
	border: 1px solid var(--border-color);
	border-radius: 4px;
	background-color: var(--bg-color);
	color: var(--text-primary);
	margin-bottom: 0.75rem;
}

#snooze-custom-date:focus {
	outline: none;
	border-color: var(--accent-color);
}

.btn-confirm-custom {
	background-color: var(--accent-color);
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.9rem;
	transition: background-color 0.2s ease-in-out;
}

.btn-confirm-custom:hover {
	background-color: rgba(59, 130, 246, 0.8);
}

/* ==========================================================================
   12. SNOOZE MODAL OVERLAY
   ========================================================================== */

.snooze-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	opacity: 0;
	transition: opacity 0.2s ease-in-out;
}

.snooze-modal-overlay.visible {
	opacity: 1;
}

/* Code for /uix/style.css */

/* MyDayHub - Main Application Styles */

/* ==========================================================================
   1. THEME VARIABLES & GLOBAL STYLES
   ========================================================================== */
:root {
	--bg-color: #202124;
	--app-header-bg: rgba(32, 33, 36, 0.85);
	--toolbar-bg: #282a2d;
	--text-primary: #e8eaed;
	--text-secondary: #9aa0a6;
	--accent-color: #8ab4f8;
	--border-color: #3c4043;
	--btn-hover-bg: rgba(255, 255, 255, 0.1);
	--column-bg: var(--toolbar-bg);
	--card-bg: var(--bg-color);
	--card-border: var(--border-color);
	--toast-success-bg: #4CAF50;
	--toast-error-bg: #d94f46; 
	--btn-danger-bg: #d94f46;
	--btn-danger-hover-bg: #c53b32;
	--btn-success-bg: #34a853;
	--btn-success-hover-bg: #2c9f47;
	--border-color-light: #4a4d50;
}

body.high-contrast {
	--bg-color: #000000;
	--app-header-bg: #111111;
	--toolbar-bg: #1a1a1a;
	--text-primary: #ffffff;
	--text-secondary: #cccccc;
	--accent-color: #ffcc00; /* High-viz yellow */
	--border-color: #666666;
	--btn-hover-bg: #444444;
	--card-bg: #111111;
	--card-border: #888888;
	--toast-success-bg: #00e676;
	--toast-error-bg: #ff5252;
	--btn-danger-bg: #ff5252;
	--btn-danger-hover-bg: #ff1744;
	--btn-success-bg: #00e676;
	--btn-success-hover-bg: #00c853;
	--border-color-light: #555555;
}

body.light-mode {
	--bg-color: #f0f2f5; /* Softer grey background */
	--app-header-bg: rgba(255, 255, 255, 0.85);
	--toolbar-bg: #ffffff; /* White columns and toolbars */
	--text-primary: #202124;
	--text-secondary: #5f6368;
	--accent-color: #1a73e8; /* Google Blue */
	--border-color: #dee2e6; /* Softer borders */
	--btn-hover-bg: rgba(0, 0, 0, 0.05);
	--card-bg: #ffffff; /* White cards to match columns */
	--card-border: #e0e0e0;
	--toast-success-bg: #34a853;
	--toast-error-bg: #ea4335;
	--btn-danger-bg: #ea4335;
	--btn-danger-hover-bg: #d93025;
	--btn-success-bg: #34a853;
	--btn-success-hover-bg: #2c9f47;
	--border-color-light: #f1f3f5;
}

/* Additional overrides for light mode for better visibility */
body.light-mode #date-modal-input::-webkit-calendar-picker-indicator {
	filter: none;
}


body {
	background-color: var(--bg-color);
	color: var(--text-primary);
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	margin: 0;
	height: 100vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* ==========================================================================
   2. MAIN APP LAYOUT
   ========================================================================== */
#main-app-container {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	min-height: 0;
}

#app-header {
	flex-shrink: 0;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem 1.5rem;
	background-color: var(--app-header-bg);
	border-bottom: 1px solid var(--border-color);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
}

#main-content {
	flex-grow: 1;
	overflow-y: auto;
	padding: 1rem 1.5rem;
}

#app-footer {
	flex-shrink: 0;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 1.5rem;
	background-color: var(--toolbar-bg);
	border-top: 1px solid var(--border-color);
	transition: background-color 0.3s, border-top-color 0.3s;
}

/* ==========================================================================
   3. HEADER & FOOTER COMPONENTS
   ========================================================================== */
.header-left {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.header-right, .footer-left, .footer-center, .footer-right {
	display: flex;
	align-items: center;
	gap: 1rem;
}

#app-title {
	font-size: 1.5rem;
	font-weight: 500;
	margin: 0;
	order: 2;
}

#header-logo {
	height: 28px;
	width: auto;
	vertical-align: middle;
	order: 1;
	color: var(--accent-color);
}


.view-tabs {
	display: flex;
	gap: 0.5rem;
	margin-left: 1rem;
}

.view-tab {
	background: none;
	border: none;
	color: var(--text-secondary);
	padding: 0.5rem 1rem;
	font-size: 1rem;
	cursor: pointer;
	border-radius: 6px;
}

.view-tab.active, .view-tab:hover {
	background-color: var(--btn-hover-bg);
	color: var(--accent-color);
}

.footer-center {
	justify-content: center;
	flex-grow: 1;
}

.footer-right a {
	color: var(--toast-error-bg);
	text-decoration: none;
}

#app-footer.dev-mode {
	background-color: #442c2e;
	border-top-color: var(--toast-error-bg);
}

.footer-left span + span::before,
.footer-right span + a::before {
	content: '|';
	margin: 0 0.25rem 0 -0.25rem;
	color: var(--border-color);
}

.btn-footer-icon {
	background: none;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 5px;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s, color 0.2s;
}

.btn-footer-icon:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}

#btn-settings-toggle {
	cursor: pointer;
}


/* ==========================================================================
   4. TOAST NOTIFICATIONS
   ========================================================================== */
#toast-container {
	position: fixed;
	bottom: 20px;
	right: 20px;
	z-index: 1500;
	display: flex;
	flex-direction: column-reverse;
	gap: 10px;
	align-items: flex-end;
}

.toast {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	min-width: 250px;
	max-width: 400px;
	padding: 12px 15px 12px 20px;
	border-radius: 8px;
	color: #ffffff;
	font-size: 0.9rem;
	font-weight: 500;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	opacity: 0;
	transform: translateX(100%);
	transition: all 0.4s cubic-bezier(0.215, 0.610, 0.355, 1);
}

.toast-content {
	display: flex;
	align-items: center;
	gap: 15px;
	flex-grow: 1;
}

.toast-action-btn {
	background-color: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: #fff;
	padding: 5px 10px;
	border-radius: 5px;
	cursor: pointer;
	font-weight: bold;
	white-space: nowrap;
	transition: background-color 0.2s;
}

.toast-action-btn:hover {
	background-color: rgba(0, 0, 0, 0.4);
}

.toast-close-btn {
	background: none;
	border: none;
	color: #fff;
	font-size: 1.5rem;
	font-weight: 300;
	line-height: 1;
	cursor: pointer;
	padding: 0 0 0 10px;
	opacity: 0.7;
	transition: opacity 0.2s;
}

.toast-close-btn:hover {
	opacity: 1;
}

.toast.visible {
	opacity: 1;
	transform: translateX(0);
}

.toast.success {
	background-color: var(--toast-success-bg);
}

.toast.error {
	background-color: var(--toast-error-bg);
}

.toast.info {
	background-color: var(--accent-color);
}

/* ==========================================================================
   5. CONFIRMATION MODAL
   ========================================================================== */
#confirm-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.7);
	z-index: 1300; 
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 1;
	transition: opacity 0.2s ease-in-out;
}

#confirm-modal {
	background-color: var(--toolbar-bg);
	padding: 1.5rem 2rem;
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	border: 1px solid var(--border-color);
	width: 100%;
	max-width: 400px;
	transform: scale(1);
	transition: transform 0.2s ease-in-out;
}

#confirm-modal-overlay.hidden #confirm-modal {
	transform: scale(0.95);
}

#confirm-modal-message {
	margin: 0 0 1.5rem 0;
	font-size: 1.1rem;
	line-height: 1.5;
	text-align: center;
}

#confirm-modal-buttons {
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
}

.btn {
	background-color: var(--border-color);
	color: var(--text-primary);
	border: none;
	padding: 0.6rem 1.2rem;
	border-radius: 6px;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;
}

.btn:hover {
	background-color: var(--btn-hover-bg);
}

.btn.btn-danger {
	background-color: var(--btn-danger-bg);
}

.btn.btn-danger:hover {
	background-color: var(--btn-danger-hover-bg);
}

.btn.btn-success {
	background-color: var(--btn-success-bg);
	color: #fff;
}
.btn.btn-success:hover {
	background-color: var(--btn-success-hover-bg);
}


/* ==========================================================================
   6. DATE PICKER MODAL
   ========================================================================== */
#date-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.7);
	z-index: 1100;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 1;
	transition: opacity 0.2s ease-in-out;
}

#date-modal-container {
	background-color: var(--toolbar-bg);
	padding: 1.5rem 2rem;
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	border: 1px solid var(--border-color);
	width: 100%;
	max-width: 380px;
	transform: scale(1);
	transition: transform 0.2s ease-in-out;
}

#date-modal-overlay.hidden #date-modal-container {
	transform: scale(0.95);
}

#date-modal-container h4 {
	margin: 0 0 1.5rem 0;
	font-size: 1.2rem;
	font-weight: 500;
	text-align: center;
}

#date-modal-input {
	width: 100%;
	padding: 0.75rem;
	background-color: var(--bg-color);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 6px;
	font-size: 1rem;
	box-sizing: border-box;
}

#date-modal-input::-webkit-calendar-picker-indicator {
	filter: invert(0.8);
	cursor: pointer;
}

#date-modal-buttons {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 1.5rem;
}

.button-group-right {
	display: flex;
	gap: 0.75rem;
}

.btn.btn-primary {
	background-color: var(--accent-color);
	color: var(--bg-color);
}

/* ==========================================================================
   7. FILTER MENU
   ========================================================================== */

#filter-menu {
	position: absolute;
	background-color: var(--column-bg);
	border: 1px solid var(--card-border);
	border-radius: 8px;
	box-shadow: 0 5px 15px rgba(0,0,0,0.3);
	z-index: 1000;
	padding: 0.75rem;
	min-width: 250px;
	opacity: 0;
	transform: scale(0.95) translateY(10px);
	transition: transform 0.1s ease-out, opacity 0.1s ease-out;
	transform-origin: bottom center;
}

#filter-menu.visible {
	opacity: 1;
	transform: scale(1) translateY(0);
}

.filter-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;
}

.filter-label {
	font-size: 0.95rem;
	color: var(--text-primary);
}

.switch {
	position: relative;
	display: inline-block;
	width: 44px;
	height: 24px;
}

.switch input {
	opacity: 0;
	width: 0;
	height: 0;
}

.slider {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: var(--border-color);
	transition: .4s;
}

.slider:before {
	position: absolute;
	content: "";
	height: 18px;
	width: 18px;
	left: 3px;
	bottom: 3px;
	background-color: white;
	transition: .4s;
}

input:checked + .slider {
	background-color: var(--accent-color);
}

input:focus + .slider {
	box-shadow: 0 0 1px var(--accent-color);
}

input:checked + .slider:before {
	transform: translateX(20px);
}

.slider.round {
	border-radius: 24px;
}

.slider.round:before {
	border-radius: 50%;
}

/* ==========================================================================
   8. UTILITY & GENERIC MODAL STYLES
   ========================================================================== */

.hidden {
	display: none !important;
}

#confirm-modal-overlay.hidden,
#date-modal-overlay.hidden,
#password-modal-overlay.hidden { /* Modified for Change Password */
	opacity: 0;
	pointer-events: none;
}

/* Modified for Change Password */
#password-modal-overlay {
	/* Re-uses confirm-modal-overlay styles */
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.7);
	z-index: 1300; 
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 1;
	transition: opacity 0.2s ease-in-out;
}

#password-modal-container {
	/* Re-uses date-modal-container styles */
	background-color: var(--toolbar-bg);
	padding: 1.5rem 2rem;
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	border: 1px solid var(--border-color);
	width: 100%;
	max-width: 420px;
	transform: scale(1);
	transition: transform 0.2s ease-in-out;
}

#password-modal-overlay.hidden #password-modal-container {
	transform: scale(0.95);
}

#password-modal-container h4 {
	margin: 0 0 1.5rem 0;
	font-size: 1.2rem;
	font-weight: 500;
	text-align: center;
}

#password-modal-container .form-group {
	margin-bottom: 1rem;
}
#password-modal-container .form-group label {
	display: block;
	margin-bottom: 0.5rem;
	font-size: 0.9rem;
	color: var(--text-secondary);
}
#password-modal-container .form-group input {
	width: 100%;
	padding: 0.75rem;
	background-color: var(--bg-color);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 6px;
	font-size: 1rem;
	box-sizing: border-box;
}

#password-modal-buttons {
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
	margin-top: 1.5rem;
}

/* Code for /uix/settings.css */

/* MyDayHub - Settings Panel Styles */

/* ==========================================================================
   1. SETTINGS PANEL OVERLAY
   ========================================================================== */

#settings-panel-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(5px);
	z-index: 999;
	opacity: 1; 
	pointer-events: auto;
	transition: opacity 0.3s ease-in-out;
}

#settings-panel-overlay.hidden {
	opacity: 0;
	pointer-events: none;
}

/* ==========================================================================
   2. SETTINGS PANEL CONTAINER 
   ========================================================================== */

#settings-panel {
	position: fixed;
	top: 0;
	left: 0;
	width: 320px;
	max-width: 90%;
	height: 100%;
	background-color: var(--toolbar-bg);
	border-right: 1px solid var(--border-color);
	box-shadow: 5px 0 25px rgba(0,0,0,0.3);
	z-index: 1000;
	display: flex;
	flex-direction: column;
	transform: translateX(0); 
	transition: transform 0.3s ease-in-out;
}

#settings-panel-overlay.hidden #settings-panel {
	transform: translateX(-100%); 
}


/* ==========================================================================
   3. PANEL HEADER & BODY
   ========================================================================== */

.settings-panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem 1.25rem;
	border-bottom: 1px solid var(--border-color);
	flex-shrink: 0;
}

.settings-panel-header h2 {
	margin: 0;
	font-size: 1.2rem;
	font-weight: 500;
}

#btn-settings-close {
	font-size: 1.8rem;
}

.settings-panel-body {
	padding: 1.25rem;
	overflow-y: auto;
	flex-grow: 1;
}

/* Modified for High Contrast Mode */
.setting-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem 0;
	border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
	border-bottom: none;
}

.setting-label {
	font-size: 1rem;
	color: var(--text-primary);
}

.setting-control .switch {
	position: relative;
	display: inline-block;
	width: 44px;
	height: 24px;
}

.setting-control .switch input {
	opacity: 0;
	width: 0;
	height: 0;
}

.setting-control .slider {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: var(--border-color);
	transition: .4s;
}

.setting-control .slider:before {
	position: absolute;
	content: "";
	height: 18px;
	width: 18px;
	left: 3px;
	bottom: 3px;
	background-color: white;
	transition: .4s;
}

.setting-control input:checked + .slider {
	background-color: var(--accent-color);
}

.setting-control input:focus + .slider {
	box-shadow: 0 0 1px var(--accent-color);
}

.setting-control input:checked + .slider:before {
	transform: translateX(20px);
}

.setting-control .slider.round {
	border-radius: 24px;
}

.setting-control .slider.round:before {
	border-radius: 50%;
}

/* Code for /uix/login.css */

/* MyDayHub - Login/Auth Page Styles */

/* Basic styles for a clean, centered layout */
body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	background-color: #202124;
	color: #e8eaed;
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100vh;
	margin: 0;
}

.auth-container {
	background-color: #282a2d;
	padding: 2rem 3rem;
	border-radius: 12px;
	border: 1px solid #3c4043;
	width: 100%;
	max-width: 400px;
	box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

h1 {
	text-align: center;
	font-weight: 500;
	margin-bottom: 1.5rem;
}

/* Modified for Forgot Password */
.form-instructions {
	font-size: 0.9rem;
	color: var(--text-secondary);
	text-align: center;
	margin-top: -1rem;
	margin-bottom: 1.5rem;
	line-height: 1.5;
}

.form-group {
	margin-bottom: 1rem;
}

label {
	display: block;
	margin-bottom: 0.5rem;
	color: #bdc1c6;
}

input[type="text"],
input[type="email"],
input[type="password"] {
	width: 100%;
	padding: 0.75rem;
	background-color: #3c4043;
	border: 1px solid #5f6368;
	border-radius: 6px;
	color: #e8eaed;
	font-size: 1rem;
	box-sizing: border-box;
}

input:focus {
	outline: none;
	border-color: #8ab4f8;
}

.btn {
	width: 100%;
	padding: 0.75rem;
	background-color: #8ab4f8;
	border: none;
	border-radius: 6px;
	color: #202124;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	margin-top: 1rem;
}

.auth-link {
	text-align: center;
	margin-top: 1.5rem;
}

.auth-link a {
	color: #8ab4f8;
	text-decoration: none;
}

/* Modified for Forgot Password */
.auth-sub-link {
	text-align: center;
	margin-top: 0.75rem;
}
.auth-sub-link a {
	color: #9aa0a6;
	font-size: 0.9rem;
	text-decoration: none;
}
.auth-sub-link a:hover {
	text-decoration: underline;
}


/* Style for messages we will add later with JS */
#message-container {
	margin-bottom: 1rem;
	padding: 1rem;
	border-radius: 6px;
	text-align: center;
	display: none; /* Hidden by default */
}

#message-container.success {
	background-color: rgba(60, 140, 90, 0.3);
	border: 1px solid #3c8c5a;
}

#message-container.error {
	background-color: rgba(217, 79, 70, 0.3);
	border: 1px solid #d94f46;
}

/**
 * Code for /uix/editor.js
 *
 * MyDayHub - Unified Note Editor
 * File: /uix/editor.js
 * Adapted from the robust Beta 4 implementation.
 *
 * @version 6.1.1
 * @author Alex & Gemini
 *
 * Public API:
 * window.UnifiedEditor.open({ id, kind, title, content, updatedAt, fontSize })
 * window.UnifiedEditor.close()
 *
 * This module is self-contained and handles its own visibility.
 */

(function() {
	"use strict";

	let autosaveTimer = null;
	const AUTOSAVE_DELAY = 2000;
	
	let fontSizeSaveTimer = null;
	const FONT_SAVE_DELAY = 1500;

	let elements = {};
	const state = {
		isOpen: false,
		isMaximized: false,
		isDirty: false,
		currentTaskId: null,
		fontSize: 16,
		minFontSize: 10,
		maxFontSize: 32
	};

	function bindElements() {
		elements.overlay = document.getElementById('unified-editor-overlay');
		elements.container = document.getElementById('unified-editor-container');
		elements.title = document.getElementById('editor-title');
		elements.textarea = document.getElementById('editor-textarea');
		elements.btnClose = document.getElementById('editor-btn-close');
		elements.btnSaveClose = document.getElementById('btn-editor-save-close');
		elements.btnMaximize = document.getElementById('editor-btn-maximize');
		elements.btnRestore = document.getElementById('editor-btn-restore');
		elements.tabs = document.querySelectorAll('#editor-ribbon-tabs .ribbon-tab');
		elements.panels = document.querySelectorAll('#editor-ribbon-panels .ribbon-panel');
		elements.formatActions = document.querySelectorAll('#editor-panel-format [data-action]');
		elements.wordCount = document.querySelector('#editor-doc-stats span:first-child');
		elements.charCount = document.querySelector('#editor-doc-stats span:last-child');
		elements.saveStatus = document.getElementById('editor-save-status');
	}

	function updateStats() {
		if (!elements.textarea || !elements.wordCount || !elements.charCount) return;
		const text = elements.textarea.value;
		const chars = text.length;
		const words = text.trim().split(/\s+/).filter(Boolean).length;
		elements.wordCount.textContent = `Words: ${words}`;
		elements.charCount.textContent = `Chars: ${chars}`;
	}

	function markAsDirtyAndQueueSave() {
		state.isDirty = true;
		updateStats();
		elements.saveStatus.textContent = 'Unsaved changes...';
		clearTimeout(autosaveTimer);
		autosaveTimer = setTimeout(save, AUTOSAVE_DELAY);
	}

	function attachEventListeners() {
		elements.btnClose.addEventListener('click', close);
		elements.btnSaveClose.addEventListener('click', close);
		elements.btnMaximize.addEventListener('click', maximize);
		elements.btnRestore.addEventListener('click', restore);

		elements.tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				const panelId = tab.dataset.panel;
				elements.tabs.forEach(t => t.classList.remove('active'));
				elements.panels.forEach(p => p.classList.remove('active'));
				tab.classList.add('active');
				document.getElementById(`editor-panel-${panelId}`).classList.add('active');
			});
		});

		elements.formatActions.forEach(button => {
			button.addEventListener('click', handleFormatAction);
		});

		elements.textarea.addEventListener('input', markAsDirtyAndQueueSave);
		elements.textarea.addEventListener('keydown', handleTabKey);
	}

	// Modified for global apiFetch
	async function saveFontSizePreference(size) {
		try {
			// Now using the global, secure apiFetch function from app.js
			const result = await apiFetch({
				module: 'users',
				action: 'saveUserPreference',
				key: 'editor_font_size',
				value: size
			});

			if (result.status !== 'success') {
				throw new Error(result.message || 'Failed to save font size.');
			}
			const boardContainer = document.getElementById('task-board-container');
			if(boardContainer) {
				boardContainer.dataset.editorFontSize = size;
			}
		} catch (error) {
			console.error('Save font size error:', error);
			showToast({ message: 'Could not save font size preference.', type: 'error' });
		}
	}

	function changeFontSize(amount) {
		const newSize = state.fontSize + amount;
		if (newSize >= state.minFontSize && newSize <= state.maxFontSize) {
			state.fontSize = newSize;
			elements.textarea.style.fontSize = `${state.fontSize}px`;
			clearTimeout(fontSizeSaveTimer);
			fontSizeSaveTimer = setTimeout(() => {
				saveFontSizePreference(state.fontSize);
			}, FONT_SAVE_DELAY);
		}
	}
	
	async function handleFormatAction(e) {
		const button = e.currentTarget;
		const action = button.dataset.action;
		
		if (action === 'clear-note') {
			const confirmed = await showConfirm('Are you sure you want to clear the entire note? This cannot be undone.');
			if (confirmed) {
				elements.textarea.value = '';
				elements.textarea.focus();
				markAsDirtyAndQueueSave();
			}
			return;
		}

		if (action === 'font-size') {
			const change = parseInt(button.dataset.change, 10);
			changeFontSize(change);
			return;
		}

		const { selectionStart: start, selectionEnd: end, value } = elements.textarea;
		const selectedText = value.substring(start, end);

		if (!selectedText && action !== 'frame' && action !== 'underline') return;

		let newText = selectedText;

		switch (action) {
			case 'case':
				const caseType = button.dataset.casetype;
				if (caseType === 'upper') newText = selectedText.toUpperCase();
				if (caseType === 'lower') newText = selectedText.toLowerCase();
				if (caseType === 'title') {
					newText = selectedText.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
				}
				break;
			case 'underline':
				newText = selectedText + '\n' + '—'.repeat(selectedText.length || 10);
				break;
			case 'frame':
				const lines = selectedText.split('\n');
				const maxLength = Math.max(...lines.map(line => line.length));
				const framedLines = lines.map(line => `| ${line.padEnd(maxLength)} |`);
				const border = `+${'—'.repeat(maxLength + 2)}+`;
				newText = `${border}\n${framedLines.join('\n')}\n${border}`;
				break;
			case 'calculate':
				if (!selectedText) return;
				try {
					// Use math.js for safer evaluation
					newText = `${selectedText} = ${math.evaluate(selectedText)}`;
				} catch (err) {
					newText = selectedText;
				}
				break;
		}

		elements.textarea.setRangeText(newText, start, end, 'select');
		elements.textarea.focus();
		markAsDirtyAndQueueSave();
	}

	function handleTabKey(e) {
		if (e.key !== 'Tab') return;
		e.preventDefault();

		const textarea = elements.textarea;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		
		if (e.shiftKey) {
			const value = textarea.value;
			const lineStart = value.lastIndexOf('\n', start - 1) + 1;
			if (value.substring(lineStart, lineStart + 1) === '\t') {
				textarea.setRangeText('', lineStart, lineStart + 1, 'end');
			}
		} else {
			textarea.setRangeText('\t', start, end, 'end');
		}
		markAsDirtyAndQueueSave();
	}

	// Modified for global apiFetch and success toast
	async function save() {
		clearTimeout(autosaveTimer);

		if (!state.isDirty || !state.currentTaskId) {
			return true;
		}

		elements.saveStatus.textContent = 'Saving...';
		
		try {
			// Use the new global, secure apiFetch function.
			const result = await apiFetch({
				module: 'tasks',
				action: 'saveTaskDetails',
				task_id: state.currentTaskId,
				notes: elements.textarea.value
			});
			
			// apiFetch handles non-OK responses, so we only need to check the logical status
			if (result.status !== 'success') {
				throw new Error(result.message || 'Failed to save notes.');
			}
			
			const taskCard = document.querySelector(`.task-card[data-task-id="${state.currentTaskId}"]`);
			if (taskCard) {
				taskCard.dataset.notes = encodeURIComponent(elements.textarea.value);
				taskCard.dataset.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
			}

			state.isDirty = false;
			elements.saveStatus.textContent = `Saved at ${new Date().toLocaleString()}`;
			
			// Show a success toast notification to the user.
			showToast({ message: 'Note saved successfully.', type: 'success' });

			const hasNotes = elements.textarea.value.trim() !== '';
			const event = new CustomEvent('noteSaved', {
				detail: {
					taskId: state.currentTaskId,
					hasNotes: hasNotes
				}
			});
			document.dispatchEvent(event);

			return true;

		} catch (error) {
			console.error('Save error:', error);
			elements.saveStatus.textContent = 'Save failed!';
			showToast({ message: error.message, type: 'error' });
			return false;
		}
	}

	function open(options = {}) {
		const { id, kind = 'task', title = 'Edit Note', content = '', updatedAt, fontSize } = options;
		
		state.currentTaskId = id;
		state.fontSize = fontSize || 16;

		elements.title.textContent = title;
		elements.textarea.value = content;
		elements.textarea.style.fontSize = `${state.fontSize}px`;

		elements.overlay.classList.remove('hidden');

		elements.textarea.focus();
		updateStats();
		state.isOpen = true;
		state.isDirty = false;
		
		if (updatedAt) {
			const savedDate = new Date(updatedAt.replace(' ', 'T') + 'Z'); 
			elements.saveStatus.textContent = `Last saved: ${savedDate.toLocaleString()}`;
		} else {
			elements.saveStatus.textContent = 'Ready';
		}
	}

	async function close() {
		clearTimeout(autosaveTimer);

		const success = await save();
		if (!success) {
			const confirmed = await showConfirm("Could not save changes. Close anyway?");
			if (!confirmed) return;
		}
		
		elements.overlay.classList.add('hidden');
		state.isOpen = false;
		state.currentTaskId = null;
		elements.textarea.value = '';
	}

	function maximize() {
		if (state.isMaximized) return;
		elements.container.classList.add('is-maximized');
		elements.btnMaximize.style.display = 'none';
		elements.btnRestore.style.display = 'flex';
		state.isMaximized = true;
	}

	function restore() {
		if (!state.isMaximized) return;
		elements.container.classList.remove('is-maximized');
		elements.btnMaximize.style.display = 'flex';
		elements.btnRestore.style.display = 'none';
		state.isMaximized = false;
	}

	function init() {
		bindElements();
		attachEventListeners();
	}

	document.addEventListener('DOMContentLoaded', init);

	window.UnifiedEditor = {
		open,
		close
	};

})();

/* Code for /uix/editor.css */

/* MyDayHub - Unified Editor Specific Styles */

/* ==========================================================================
   1. EDITOR OVERLAY & CONTAINER
   ========================================================================== */

#unified-editor-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.7);
	z-index: 1200; /* Higher than other modals */
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 1;
	transition: opacity 0.2s ease-in-out;
}

#unified-editor-overlay.hidden {
	opacity: 0;
	pointer-events: none;
}

#unified-editor-container {
	background-color: var(--toolbar-bg);
	border: 1px solid var(--border-color);
	border-radius: 12px;
	box-shadow: 0 10px 30px rgba(0,0,0,0.5);
	width: 80vw;
	height: 80vh;
	max-width: 900px;
	display: flex;
	flex-direction: column;
	transform: scale(1);
	transition: transform 0.2s ease-in-out;
}

#unified-editor-overlay.hidden #unified-editor-container {
	transform: scale(0.95);
}

/* Maximized State */
#unified-editor-container.is-maximized {
	width: 100%;
	height: 100%;
	max-width: none;
	border-radius: 0;
}

/* ==========================================================================
   2. EDITOR HEADER & CONTROLS
   ========================================================================== */

.editor-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem 1.5rem;
	border-bottom: 1px solid var(--border-color);
	flex-shrink: 0;
}

#editor-title {
	font-size: 1.1rem;
	font-weight: 500;
	margin: 0;
	flex-grow: 1;
}

.editor-controls {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.btn-icon {
	background: none;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 5px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.2s, color 0.2s;
}

.btn-icon:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}

/* Modified for "Clear Note" feature styling */
.btn-text-danger {
	color: #ff6b6b; /* A clear, but not too harsh, red */
	font-weight: 500;
	font-size: 0.9rem;
	border-radius: 4px; /* Override 50% for text buttons */
	padding: 5px 8px;
}

.btn-text-danger:hover {
	color: #ff4d4d; /* Brighter red on hover */
	background-color: var(--btn-hover-bg);
}
/* End of modification */

#editor-btn-close {
	font-size: 1.5rem;
	font-weight: 300;
}


/* ==========================================================================
   3. EDITOR RIBBON (TOOLBAR)
   ========================================================================== */

#editor-ribbon {
	flex-shrink: 0;
	border-bottom: 1px solid var(--border-color);
	background-color: var(--bg-color);
}

#editor-ribbon-tabs {
	display: flex;
	padding: 0 1rem;
}

.ribbon-tab {
	background: none;
	border: none;
	color: var(--text-secondary);
	padding: 0.75rem 1rem;
	cursor: pointer;
	border-bottom: 2px solid transparent;
	font-size: 0.9rem;
}

.ribbon-tab.active {
	color: var(--accent-color);
	border-bottom-color: var(--accent-color);
}

#editor-ribbon-panels {
	padding: 0.5rem 1.5rem;
}

.ribbon-panel {
	display: none;
}

.ribbon-panel.active {
	display: block;
}

.ribbon-button-group {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}


/* ==========================================================================
   4. EDITOR BODY & FOOTER
   ========================================================================== */
.editor-body {
	flex-grow: 1;
	padding: 0.5rem;
	display: flex;
	min-height: 0;
}

#editor-textarea {
	width: 100%;
	height: 100%;
	background-color: transparent;
	border: none;
	color: var(--text-primary);
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
	font-size: 16px; /* Default font size, controlled by JS */
	resize: none;
	padding: 1rem;
	line-height: 1.6;
}

#editor-textarea:focus {
	outline: none;
}

.editor-footer {
	flex-shrink: 0;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 1.5rem;
	border-top: 1px solid var(--border-color);
	font-size: 0.8rem;
	color: var(--text-secondary);
	background-color: var(--bg-color);
}

#editor-doc-stats {
	display: flex;
	gap: 1rem;
}

/* ==========================================================================
   5. RESPONSIVE STYLES
   ========================================================================== */

/* Modified for Mobile Clear Button */
@media (max-width: 768px) {
	.btn-text-danger {
		font-size: 0.8rem;
		padding: 4px 6px;
		white-space: nowrap; /* Prevents the text from wrapping */
	}

	.ribbon-button-group {
		flex-wrap: wrap; /* Allow buttons to wrap if necessary */
	}

	#editor-ribbon-panels {
		padding: 0.5rem;
	}

	.editor-header {
		padding: 0.5rem 1rem;
	}
}
/* End of modification */

/**
 * Code for /uix/auth.js
 *
 * MyDayHub - Authentication Handler (Client-Side)
 *
 * Handles form submissions for registration, login, and password reset pages.
 *
 * @version 6.5.2-debug-response
 * @author Alex & Gemini
 */
document.addEventListener('DOMContentLoaded', () => {
	// Shared elements for all forms
	const messageContainer = document.getElementById('message-container');

	// Modified for In-Browser Debugging: New helper to log debug info from the server.
	function logServerDebug(result) {
		if (result && result.debug && Array.isArray(result.debug)) {
			console.warn('--- MyDayHub Server Debug ---');
			result.debug.forEach(msg => console.log(msg));
			console.warn('-----------------------------');
		}
	}

	// --- Registration Form Logic ---
	const registerForm = document.getElementById('register-form');
	if (registerForm) {
		registerForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = registerForm.querySelector('button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Registering...';

			messageContainer.style.display = 'none';
			messageContainer.textContent = '';
			messageContainer.className = '';

			const formData = new FormData(registerForm);
			const data = { action: 'register', ...Object.fromEntries(formData.entries()) };

			if (!data.username || !data.email || !data.password) {
				displayMessage('All fields are required.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Register';
				return;
			}

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				const result = await response.json();
				logServerDebug(result); // Log debug info
				if (response.ok) {
					displayMessage(result.message, 'success');
					registerForm.reset();
				} else {
					displayMessage(result.message || 'An unknown error occurred.', 'error');
				}
			} catch (error) {
				console.error('Registration fetch error:', error);
				displayMessage('Could not connect to the server. Please try again later.', 'error');
			} finally {
				submitButton.disabled = false;
				submitButton.textContent = 'Register';
			}
		});
	}

	// --- Login Form Logic ---
	const loginForm = document.getElementById('login-form');
	if (loginForm) {
		loginForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = loginForm.querySelector('button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Logging In...';
			
			messageContainer.style.display = 'none';
			messageContainer.textContent = '';
			messageContainer.className = '';

			const formData = new FormData(loginForm);
			const data = { action: 'login', ...Object.fromEntries(formData.entries()) };

			if (!data.username || !data.password) {
				displayMessage('Please enter both username and password.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Log In';
				return;
			}

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				const result = await response.json();
				logServerDebug(result); // Log debug info
				if (response.ok) {
					window.location.href = `${appURL}/index.php`;
				} else {
					displayMessage(result.message || 'An unknown error occurred.', 'error');
					submitButton.disabled = false;
					submitButton.textContent = 'Log In';
				}
			} catch (error) {
				console.error('Login fetch error:', error);
				displayMessage('Could not connect to the server. Please try again later.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Log In';
			}
		});
	}

	// --- Forgot Password Form Logic ---
	const forgotForm = document.getElementById('forgot-form');
	if (forgotForm) {
		forgotForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = forgotForm.querySelector('button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Sending...';
			messageContainer.style.display = 'none';

			const formData = new FormData(forgotForm);
			const data = { action: 'requestPasswordReset', ...Object.fromEntries(formData.entries()) };

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});
				
				// Modified for Raw Response Debugging
				const responseText = await response.text();
				console.log('Raw server response:', responseText);
				console.log('Response status:', response.status);
				
				let result;
				try {
					result = JSON.parse(responseText);
				} catch (parseError) {
					console.error('JSON parse failed:', parseError);
					console.error('Response text:', responseText);
					displayMessage('Server returned invalid response. Check console for details.', 'error');
					return;
				}

				logServerDebug(result); // Log debug info

				if (response.ok) {
					displayMessage(result.message, 'success');
					forgotForm.reset();
				} else {
					// In DEVMODE, the server might send a real error. Show it.
					displayMessage(result.message, 'error');
				}

			} catch (error) {
				console.error('Forgot password fetch error:', error);
				displayMessage('A network error occurred. Please try again.', 'error');
			} finally {
				// Keep the button disabled on success to prevent spamming
				if(messageContainer.classList.contains('error')) {
					submitButton.disabled = false;
					submitButton.textContent = 'Send Reset Link';
				}
			}
		});
	}
	
	// --- Reset Password Form Logic ---
	const resetPasswordForm = document.getElementById('reset-password-form');
	if (resetPasswordForm) {
		resetPasswordForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Resetting...';
			messageContainer.style.display = 'none';

			const formData = new FormData(resetPasswordForm);
			const data = { action: 'performPasswordReset', ...Object.fromEntries(formData.entries()) };

			// Client-side validation
			if (data.new_password !== data.confirm_password) {
				displayMessage('Passwords do not match.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Reset Password';
				return;
			}
			if (data.new_password.length < 8) {
				displayMessage('Password must be at least 8 characters long.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Reset Password';
				return;
			}

			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/auth.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				});

				const result = await response.json();
				logServerDebug(result); // Log debug info

				if (response.ok) {
					displayMessage(result.message, 'success');
					resetPasswordForm.reset();
					// Redirect to login page after a short delay
					setTimeout(() => {
						window.location.href = `${appURL}/login/login.php`;
					}, 3000);
				} else {
					displayMessage(result.message || 'An unknown error occurred.', 'error');
					submitButton.disabled = false;
					submitButton.textContent = 'Reset Password';
				}

			} catch (error) {
				console.error('Reset password fetch error:', error);
				displayMessage('A network error occurred. Please try again.', 'error');
				submitButton.disabled = false;
				submitButton.textContent = 'Reset Password';
			}
		});
	}


	/**
	 * A helper function to display messages in the designated container.
	 */
	function displayMessage(message, type) {
		if (messageContainer) {
			messageContainer.textContent = message;
			messageContainer.className = type;
			messageContainer.style.display = 'block';
		}
	}
});

/**
 * Code for /uix/attachments.css
 *
 * MyDayHub - Attachments Modal Styles
 *
 * Styles for the task attachments gallery modal and its components.
 *
 * @version 5.4.1
 * @author Alex & Gemini
 */

/* --- Modal Overlay and Container --- */

#attachments-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
	opacity: 0;
	transition: opacity 0.2s ease-in-out;
	/* Prevent interaction while hidden */
	pointer-events: none; 
}

#attachments-modal-overlay:not(.hidden) {
	opacity: 1;
	pointer-events: auto;
}

#attachments-modal-container {
	background-color: #2c2c2e; /* Dark theme background */
	color: #f2f2f7;
	border-radius: 12px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
	width: 90%;
	max-width: 600px;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	border: 1px solid rgba(255, 255, 255, 0.1);
}

/* --- Modal Header, Body, Footer --- */

.attachments-modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.attachments-modal-header h4 {
	margin: 0;
	font-size: 1.2rem;
	font-weight: 600;
}

.attachments-modal-header .btn-icon {
	background: none;
	border: none;
	color: var(--text-secondary);
	font-size: 1.75rem;
	line-height: 1;
	padding: 0 .5rem;
	cursor: pointer;
}

#attachments-modal-body {
	padding: 1.5rem;
	overflow-y: auto;
	flex-grow: 1; /* Allows the body to take up available space */
}

/* --- Drop Zone & Staging Area --- */
#attachment-drop-zone {
	border: 2px dashed #555;
	border-radius: 8px;
	padding: 2rem;
	text-align: center;
	color: #888;
	margin-bottom: 1.5rem;
	transition: background-color 0.2s, border-color 0.2s;
}

#attachment-drop-zone.drag-over {
	background-color: rgba(0, 122, 255, 0.1);
	border-color: #007aff;
}

.drop-zone-note {
	font-size: 0.8rem;
	color: #6c6c72;
	margin-top: 0.5rem;
	margin-bottom: 0;
}

#staged-attachment-list {
	margin-bottom: 1rem;
}

.staged-attachment-item {
	display: flex;
	align-items: center;
	padding: 0.5rem;
	background-color: rgba(0, 122, 255, 0.1);
	border: 1px solid rgba(0, 122, 255, 0.3);
	border-radius: 6px;
	margin-bottom: 0.5rem;
}
.staged-attachment-item .filename {
	flex-grow: 1;
	font-size: 0.9rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin-right: 1rem;
}
.staged-attachment-item .filesize {
	font-size: 0.8rem;
	color: #8e8e93;
}
.btn-remove-staged {
	background: none;
	border: none;
	color: #8e8e93;
	font-size: 1.5rem;
	cursor: pointer;
	padding: 0 0.5rem;
	margin-left: 0.5rem;
	transition: color 0.2s;
}
.btn-remove-staged:hover {
	color: #ff453a;
}


/* --- Attachment List --- */
.attachment-item {
	display: flex;
	align-items: center;
	padding: 0.75rem;
	background-color: rgba(255, 255, 255, 0.05);
	border-radius: 6px;
	margin-bottom: 0.5rem;
	cursor: pointer;
	transition: background-color 0.2s;
}
.attachment-item:hover {
	background-color: rgba(255, 255, 255, 0.1);
}

.attachment-item img.thumbnail {
	width: 40px;
	height: 40px;
	border-radius: 4px;
	object-fit: cover;
	margin-right: 1rem;
}

.attachment-thumbnail-icon {
	width: 40px;
	height: 40px;
	border-radius: 4px;
	margin-right: 1rem;
	background-color: #48484a;
	display: flex;
	justify-content: center;
	align-items: center;
	color: #d1d1d6;
}

.attachment-thumbnail-icon svg {
	width: 24px;
	height: 24px;
}


.attachment-file-info {
	flex-grow: 1;
	min-width: 0; /* Modified for filename overflow - Prevents flex item from overflowing */
}

.attachment-file-info .filename {
	display: block;
	font-weight: 500;
	color: #f2f2f7;
	/* Modified for filename overflow - Truncates long text with an ellipsis */
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.attachment-file-info .filesize {
	display: block;
	font-size: 0.8rem;
	color: #8e8e93;
}

.btn-delete-attachment {
	background: none;
	border: none;
	color: #8e8e93;
	font-size: 1.5rem;
	cursor: pointer;
	padding: 0 0.5rem;
	transition: color 0.2s;
	z-index: 5; /* Ensure it's clickable over the parent item */
	position: relative;
}

.btn-delete-attachment:hover {
	color: #ff453a; /* Danger color */
}

.no-attachments-message {
	text-align: center;
	color: #888;
	padding: 1rem 0;
}


/* --- Footer Quota Bar & Buttons --- */
.attachments-modal-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
	background-color: rgba(0, 0, 0, 0.2);
	border-bottom-left-radius: 12px;
	border-bottom-right-radius: 12px;
}

.attachment-quota-info {
	display: flex;
	align-items: center;
	font-size: 0.8rem;
	color: #8e8e93;
	flex-shrink: 0;
	margin-right: 1rem; /* Added margin for spacing */
}

/* Modified for Button UI Overhaul */
.footer-button-group {
	margin-left: auto; /* Pushes the button group to the right */
	display: flex;
	gap: 0.75rem;
}

#attachment-quota-bar {
	width: 100px;
	height: 8px;
	margin: 0 0.5rem;
	-webkit-appearance: none;
	appearance: none;
}

#attachment-quota-bar::-webkit-progress-bar {
	background-color: #444;
	border-radius: 4px;
}

#attachment-quota-bar::-webkit-progress-value {
	background-color: #007aff;
	border-radius: 4px;
	transition: width 0.3s ease;
}

/* --- Attachment Viewer Modal --- */
#attachment-viewer-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.85);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1050; /* Higher than the list modal */
	opacity: 0;
	transition: opacity 0.2s ease-in-out;
	pointer-events: none;
}

#attachment-viewer-modal-overlay:not(.hidden) {
	opacity: 1;
	pointer-events: auto;
}

#attachment-viewer-content {
	max-width: 90vw;
	max-height: 90vh;
	display: flex;
	justify-content: center;
	align-items: center;
}

/* Modified for Image Sizing */
#attachment-viewer-content img {
	max-width: 100%;
	max-height: 100%;
	width: auto;
	height: auto;
	border-radius: 8px;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
	object-fit: contain;
	border: none;
}

/* Rule for PDFs to ensure they fill the space */
#attachment-viewer-content embed,
#attachment-viewer-content iframe {
	width: 90vw;
	height: 90vh;
	border-radius: 8px;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
	border: none;
}


#attachment-viewer-close-btn {
	position: absolute;
	top: 20px;
	right: 20px;
	font-size: 2.5rem;
	color: white;
	background: transparent;
	border: none;
	cursor: pointer;
	text-shadow: 0 0 10px black;
	padding: 0 1rem;
	line-height: 1;
}

/**
 * Code for /uix/app.js
 *
 *  MyDayHub - Main Application Logic
 *
 * This script initializes the application, handles view switching,
 * and contains global UI functions like toasts and modals.
 *
 * @version 6.4.0
 * @author Alex & Gemini
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

	if (!response.ok) {
		let errorData;
		try {
			errorData = await response.json();
		} catch (e) {
			throw new Error(response.statusText || `HTTP error! Status: ${response.status}`);
		}
		throw new Error(errorData.message || 'An unknown API error occurred.');
	}

	return response.json();
}

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

<?php
/**
 * Code for /login/forgot-password.php
 *
 * MyDayHub - Forgot Password Script
 *
 * @version 6.3.1
 * @author Alex & Gemini
 */

require_once __DIR__ . '/../incs/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reset Password - MyDayHub</title>
	<link rel="stylesheet" href="../uix/login.css">

	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
</head>
<body>

	<div class="auth-container">
		<h1>Reset Password</h1>

		<div id="message-container"></div>

		<form id="forgot-form">
			<p class="form-instructions">Enter the email address associated with your account, and we'll send you a link to reset your password.</p>
			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" name="email" required>
			</div>
			<button type="submit" class="btn">Send Reset Link</button>
		</form>
		<div class="auth-link">
			<p>Remembered your password? <a href="login.php">Log In</a></p>
		</div>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>

<?php
/**
 * Code for /login/login.php
 *
 * MyDayHub - Login Script
 *
 * @version 6.3.1
 * @author Alex & Gemini
 */

require_once __DIR__ . '/../incs/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Log In - MyDayHub</title>
	<link rel="stylesheet" href="../uix/login.css">

	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
</head>
<body>

	<div class="auth-container">
		<h1>Log In</h1>

		<div id="message-container"></div>

		<form id="login-form">
			<div class="form-group">
				<label for="username">Username</label>
				<input type="text" id="username" name="username" required>
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input type="password" id="password" name="password" required>
			</div>
			<button type="submit" class="btn">Log In</button>
		</form>
		<div class="auth-link">
			<p>Don't have an account? <a href="register.php">Register</a></p>
		</div>
		<div class="auth-sub-link">
			<a href="forgot-password.php">Forgot Password?</a>
		</div>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>

<?php
/**
 * Code for /login/logout.php
 *
 * MyDayHub - Logout Script
 *
 * This script handles the user logout process by destroying the
 * current session and redirecting to the login page.
 *
 * @version 6.3.1
 * @author Alex & Gemini
 */

// We need the config file to get the APP_URL for a reliable redirect.
require_once __DIR__ . '/../incs/config.php';

// Start the session so we can access its data.
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

// 1. Unset all of the session variables.
$_SESSION = [];

// 2. If it's desired to kill the session, also delete the session cookie.
// Note: This will destroy the session, and not just the session data!
if (ini_get("session.use_cookies")) {
	$params = session_get_cookie_params();
	setcookie(session_name(), '', time() - 42000,
		$params["path"], $params["domain"],
		$params["secure"], $params["httponly"]
	);
}

// 3. Finally, destroy the session.
session_destroy();

// 4. Redirect to the login page.
header('Location: ' . APP_URL . '/login/login.php');
exit(); // Important to prevent further script execution.

<?php
/**
 * Code for /login/register.php
 *
 * MyDayHub - Register Script
 *
 * @version 6.3.1
 * @author Alex & Gemini
 */


// Modified for robust API pathing
require_once __DIR__ . '/../incs/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Register - MyDayHub</title>
	<link rel="stylesheet" href="../uix/login.css">

	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
</head>
<body>

	<div class="auth-container">
		<h1>Create Account</h1>

		<div id="message-container"></div>

		<form id="register-form">
			<div class="form-group">
				<label for="username">Username</label>
				<input type="text" id="username" name="username" required>
			</div>
			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" name="email" required>
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input type="password" id="password" name="password" required>
			</div>
			<button type="submit" class="btn">Register</button>
		</form>
		<div class="auth-link">
			<p>Already have an account? <a href="login.php">Log In</a></p>
		</div>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>

<?php
// Code for /login/reset-password.php

// MyDayHub - Password Reset Page

require_once __DIR__ . '/../incs/config.php';

// Get the token from the URL. We will pass this to the JavaScript.
$token = $_GET['token'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reset Password - MyDayHub</title>
	<link rel="stylesheet" href="../uix/login.css">
	<script>
		// Expose the app URL to our JavaScript file.
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
</head>
<body>

	<div class="auth-container">
		<h1>Set New Password</h1>

		<div id="message-container"></div>

		<form id="reset-password-form">
			<input type="hidden" id="token" name="token" value="<?php echo htmlspecialchars($token); ?>">

			<div class="form-group">
				<label for="new_password">New Password</label>
				<input type="password" id="new_password" name="new_password" required minlength="8">
			</div>
			<div class="form-group">
				<label for="confirm_password">Confirm New Password</label>
				<input type="password" id="confirm_password" name="confirm_password" required>
			</div>
			<button type="submit" class="btn">Reset Password</button>
		</form>
	</div>

	<script src="../uix/auth.js" defer></script>
</body>
</html>

<?php
/**
 * Code for /incs/mailer.php
 *
 * MyDayHub - Mailer Utility
 *
 * This file provides a centralized function for sending emails using PHPMailer,
 * configured with credentials from the .env file.
 *
 * @version 6.5.0-debug-fixed
 * @author Alex & Gemini
 */

declare(strict_types=1);

// --- PHPMailer ---
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once ROOT_PATH . '/vendor/autoload.php';

/**
 * Sends an email using the application's configured SMTP settings.
 *
 * @param string $toEmail The recipient's email address.
 * @param string $toName The recipient's name.
 * @param string $subject The subject of the email.
 * @param string $htmlBody The HTML content of the email.
 * @param string $altBody An optional plain-text alternative body.
 * @return bool True on success, false on failure.
 * @throws Exception For detailed PHPMailer errors if DEVMODE is on.
 */
function send_email(string $toEmail, string $toName, string $subject, string $htmlBody, string $altBody = ''): bool {
	$mail = new PHPMailer(true); 

	try {
		// --- Server Settings ---
		// Modified for Clean JSON Response: Always disable SMTP debug output
		$mail->SMTPDebug = 0; // Disabled to prevent corrupting JSON responses
		$mail->isSMTP();
		$mail->Host       = SMTP_HOST;
		$mail->SMTPAuth   = true;
		$mail->Username   = SMTP_USER;
		$mail->Password   = SMTP_PASS;
		$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
		$mail->Port       = SMTP_PORT;

		// --- Recipients ---
		// Modified for Deliverability Test: Temporarily using the SMTP username as the "From" address.
		// The SMTP_USER is an email address that Hostinger's mail server is inherently authorized to send from.
		// This helps bypass potential SPF/DKIM domain validation issues for debugging.
		$mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
		$mail->addAddress($toEmail, $toName);

		// --- Content ---
		$mail->isHTML(true);
		$mail->Subject = $subject;
		$mail->Body    = $htmlBody;
		$mail->AltBody = ($altBody === '') ? strip_tags($htmlBody) : $altBody;

		$mail->send();
		return true;

	} catch (Exception $e) {
		if (DEVMODE) {
			error_log("Mailer Error: {$mail->ErrorInfo}");
		}
		throw $e;
	}
}

<?php
/**
 * Code for /incs/helpers.php
 *
 * MyDayHub - Global Helper Functions
 *
 * This file contains utility functions that are used across multiple
 * parts of the backend application.
 *
 * @version 6.6.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

if (!function_exists('send_json_response')) {
	/**
	 * Encodes and sends a JSON response, appending debug messages if in DEVMODE.
	 * This function also terminates script execution.
	 *
	 * @param array $data The payload to send.
	 * @param int $http_code The HTTP status code to set.
	 */
	function send_json_response(array $data, int $http_code = 200): void {
		global $__DEBUG_MESSAGES__;
		if (defined('DEVMODE') && DEVMODE && !empty($__DEBUG_MESSAGES__)) {
			$data['debug'] = $__DEBUG_MESSAGES__;
		}
		http_response_code($http_code);
		header('Content-Type: application/json');
		echo json_encode($data);
		exit();
	}
}

<?php
/**
 * Code for /incs/db.php
 *
 * MyDayHub - Database Connection
 *
 * This file provides a function to establish a secure and configured
 * PDO database connection using the credentials from /incs/config.php.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */

// Enable strict typing for function arguments and return values.
declare(strict_types=1);

// Require the configuration file once. This will halt execution if it's missing.
// __DIR__ ensures the path is always relative to the current file's directory.
require_once __DIR__ . '/config.php';

/**
 * Returns a configured PDO instance for database interaction.
 *
 * This function encapsulates the database connection logic, ensuring
 * consistent settings across the application.
 *
 * @return PDO The configured PDO connection object.
 * @throws PDOException on connection failure.
 */
function get_pdo(): PDO {
	// Data Source Name (DSN) for the connection.
	// Specifies the driver, host, database name, and character set.
	$dsn = sprintf(
		'mysql:host=%s;dbname=%s;charset=utf8mb4',
		DB_HOST,
		DB_NAME
	);

	// PDO connection options for security and error handling.
	$options = [
		// Throw exceptions on SQL errors instead of warnings.
		PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
		// Fetch results as associative arrays (e.g., $row['column_name']).
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		// Use the database's native prepared statements for better security.
		PDO::ATTR_EMULATE_PREPARES   => false,
	];

	// Create and return the new PDO object.
	return new PDO($dsn, DB_USER, DB_PASS, $options);
}

<?php
/**
 * Code for /incs/config.php
 *
 * MyDayHub - Core Configuration
 *
 * Reads credentials from a .env file for security and portability.
 * Manages session start and CSRF token generation.
 *
 * @version 6.7.0
 * @author Alex & Gemini
 */

// --- FILE PATHS ---
define('INCS_PATH', __DIR__);
define('ROOT_PATH', dirname(INCS_PATH));

// --- LOAD ENVIRONMENT VARIABLES FROM .env FILE ---
$envPath = ROOT_PATH . '/.env';
if (file_exists($envPath)) {
	$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
	foreach ($lines as $line) {
		if (strpos(trim($line), '#') === 0) continue;
		if (strpos($line, '=') !== false) {
			list($name, $value) = explode('=', $line, 2);
			$name = trim($name);
			$value = trim($value, " \t\n\r\0\x0B\"");
			putenv("$name=$value");
		}
	}
}

// --- CORE CONSTANTS & ERROR REPORTING ---
define('DEVMODE', getenv('DEV_MODE') === 'true');

if (DEVMODE) {
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);
} else {
	ini_set('display_errors', 0);
	ini_set('display_startup_errors', 0);
	error_reporting(E_ALL);
}

// Modified for In-Browser Debugging
// --- CUSTOM ERROR & DEBUG HANDLER (FOR DEVMODE) ---
global $__DEBUG_MESSAGES__;
$__DEBUG_MESSAGES__ = [];

/**
 * Adds a message to the global debug array if DEVMODE is active.
 * @param string $message The debug message to log.
 */
function log_debug_message(string $message): void {
	if (DEVMODE) {
		global $__DEBUG_MESSAGES__;
		$timestamp = date('H:i:s');
		$__DEBUG_MESSAGES__[] = "[$timestamp] " . $message;
	}
}

if (DEVMODE) {
	function mydayhub_error_handler($errno, $errstr, $errfile, $errline) {
		if (!(error_reporting() & $errno)) {
			return false;
		}
		$logMessage = "Error [$errno]: $errstr in $errfile on line $errline";
		log_debug_message($logMessage);
		return true; // Prevent default PHP error handler
	}
	set_error_handler('mydayhub_error_handler');
}


// --- APPLICATION URL & VERSION ---
define('APP_VER', 'Beta 6.7.0');
define('APP_URL', getenv('APP_URL') ?: 'http://localhost');

// --- DATABASE CREDENTIALS (from Environment Variables) ---
define('DB_HOST', getenv('DB_HOST'));
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));

// --- SESSION & SECURITY --- //
define('SESSION_TIMEOUT_SECONDS', 28800);

if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

if (empty($_SESSION['csrf_token'])) {
	$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}


// --- SMTP (MAIL) SERVICE (from Environment Variables) --- //
define('SMTP_HOST', getenv('SMTP_HOST'));
define('SMTP_USER', getenv('SMTP_USER'));
define('SMTP_PASS', getenv('SMTP_PASS'));
define('SMTP_PORT', getenv('SMTP_PORT'));
define('SMTP_FROM_EMAIL', getenv('SMTP_FROM_EMAIL'));
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME'));

<?php
/**
 * Code for /api/users.php
 *
 * MyDayHub - Users Module Handler
 *
 * Contains all business logic for user-related API actions,
 * such as managing preferences.
 *
 * @version 6.4.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

/**
 * Main router for all actions within the 'users' module.
 */
function handle_users_action(string $action, string $method, PDO $pdo, int $userId, array $data): void {
	switch ($action) {
		case 'saveUserPreference':
			if ($method === 'POST') {
				handle_save_user_preference($pdo, $userId, $data);
			}
			break;
		
		// Modified for Change Password
		case 'changePassword':
			if ($method === 'POST') {
				handle_change_password($pdo, $userId, $data);
			}
			break;

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in users module."]);
			break;
	}
}

// Modified for Change Password
/**
 * Handles a password change request for the currently authenticated user.
 */
function handle_change_password(PDO $pdo, int $userId, ?array $data): void {
	$currentPassword = $data['current_password'] ?? '';
	$newPassword = $data['new_password'] ?? '';

	if (empty($currentPassword) || empty($newPassword)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'All password fields are required.']);
		return;
	}

	if (strlen($newPassword) < 8) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'New password must be at least 8 characters long.']);
		return;
	}

	try {
		// 1. Fetch the current user's hashed password
		$stmt = $pdo->prepare("SELECT password_hash FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $userId]);
		$user = $stmt->fetch(PDO::FETCH_ASSOC);

		if (!$user) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'User not found.']);
			return;
		}

		// 2. Verify the provided current password against the stored hash
		if (!password_verify($currentPassword, $user['password_hash'])) {
			http_response_code(401); // Unauthorized
			echo json_encode(['status' => 'error', 'message' => 'Incorrect current password.']);
			return;
		}
		
		// 3. Hash the new password
		$newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);

		// 4. Update the user's record with the new hash
		$stmt = $pdo->prepare("UPDATE users SET password_hash = :newHash WHERE user_id = :userId");
		$stmt->execute([
			':newHash' => $newPasswordHash,
			':userId' => $userId
		]);

		http_response_code(200);
		echo json_encode(['status' => 'success', 'message' => 'Password changed successfully.']);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in users.php handle_change_password(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while changing the password.']);
	}
}


/**
 * Saves a single key-value pair to the user's preferences JSON blob.
 */
function handle_save_user_preference(PDO $pdo, int $userId, ?array $data): void {
	$key = isset($data['key']) ? (string)$data['key'] : '';
	if ($key === '' || !isset($data['value'])) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'A preference key and value are required.']);
		return;
	}
	$value = $data['value'];

	try {
		$pdo->beginTransaction();

		$stmt_find = $pdo->prepare("SELECT preferences FROM users WHERE user_id = :userId FOR UPDATE");
		$stmt_find->execute([':userId' => $userId]);
		$result = $stmt_find->fetch(PDO::FETCH_ASSOC);

		if ($result === false) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'User not found.']);
			return;
		}

		$currentPrefsJson = $result['preferences'];
		$prefs = json_decode($currentPrefsJson, true);

		if (json_last_error() !== JSON_ERROR_NONE) {
			$prefs = [];
		}

		$prefs[$key] = $value;
		$newPrefsJson = json_encode($prefs);

		$stmt_update = $pdo->prepare("UPDATE users SET preferences = :preferences WHERE user_id = :userId");
		$stmt_update->execute([
			':preferences' => $newPrefsJson,
			':userId'      => $userId
		]);

		$pdo->commit();

		http_response_code(200);
		echo json_encode(['status' => 'success', 'message' => "Preference '{$key}' saved."]);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in users.php handle_save_user_preference(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while saving the preference.']);
	}
}

<?php
/**
 * Code for /api/tasks.php
 *
 * MyDayHub - Tasks Module Handler
 *
 * Contains all business logic for task-related API actions.
 * This file is included and called by the main API gateway.
 *
 * @version 6.6.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

// Modified for Debugging Hardening: Include the global helpers file.
// Note: While the gateway includes this, including it here makes the module self-contained and runnable in isolation for testing.
require_once __DIR__ . '/../incs/helpers.php';


// Define constants for the attachment feature
define('ATTACHMENT_UPLOAD_DIR', __DIR__ . '/../media/imgs/');
define('MAX_FILE_SIZE_BYTES', 5 * 1024 * 1024); // 5 MB
define('USER_STORAGE_QUOTA_BYTES', 50 * 1024 * 1024); // 50 MB
// Modified for PDF Support
define('ALLOWED_MIME_TYPES', [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'application/pdf'
]);

/**
 * Main router for all actions within the 'tasks' module.
 */
function handle_tasks_action(string $action, string $method, PDO $pdo, int $userId, array $data): void {
	switch ($action) {
		case 'getAll':
			if ($method === 'GET') {
				handle_get_all_board_data($pdo, $userId);
			}
			break;

		case 'getAttachments':
			if ($method === 'GET') {
				handle_get_attachments($pdo, $userId);
			}
			break;
		
		case 'createColumn':
			if ($method === 'POST') {
				handle_create_column($pdo, $userId, $data);
			}
			break;
		
		case 'renameColumn':
			if ($method === 'POST') {
				handle_rename_column($pdo, $userId, $data);
			}
			break;
		
		case 'deleteColumn':
			if ($method === 'POST') {
				handle_delete_column($pdo, $userId, $data);
			}
			break;
		
		// Modified for Soft Deletes
		case 'restoreItem':
			if ($method === 'POST') {
				handle_restore_item($pdo, $userId, $data);
			}
			break;

		case 'reorderColumns':
			if ($method === 'POST') {
				handle_reorder_columns($pdo, $userId, $data);
			}
			break;

		case 'createTask':
			if ($method === 'POST') {
				handle_create_task($pdo, $userId, $data);
			}
			break;
		
		case 'deleteTask':
			if ($method === 'POST') {
				handle_delete_task($pdo, $userId, $data);
			}
			break;

		case 'renameTaskTitle':
			if ($method === 'POST') {
				handle_rename_task_title($pdo, $userId, $data);
			}
			break;
		
		case 'saveTaskDetails':
			if ($method === 'POST') {
				handle_save_task_details($pdo, $userId, $data);
			}
			break;

		case 'duplicateTask':
			if ($method === 'POST') {
				handle_duplicate_task($pdo, $userId, $data);
			}
			break;

		case 'toggleComplete':
			if ($method === 'POST') {
				handle_toggle_complete($pdo, $userId, $data);
			}
			break;

		case 'reorderTasks':
			if ($method === 'POST') {
				handle_reorder_tasks($pdo, $userId, $data);
			}
			break;
		
		// Modified for Mobile Move Mode
		case 'moveTask':
			if ($method === 'POST') {
				handle_move_task($pdo, $userId, $data);
			}
			break;

		// Modified for Classification Popover
		case 'toggleClassification':
			if ($method === 'POST') {
				handle_toggle_classification($pdo, $userId, $data);
			}
			break;

		// Modified for Privacy Feature
		case 'togglePrivacy':
			if ($method === 'POST') {
				handle_toggle_privacy($pdo, $userId, $data);
			}
			break;

		case 'uploadAttachment':
			if ($method === 'POST') {
				handle_upload_attachment($pdo, $userId, $data);
			}
			break;
		case 'deleteAttachment':
			if ($method === 'POST') {
				handle_delete_attachment($pdo, $userId, $data);
			}
			break;
		// Modified for Snooze Feature
		case 'snoozeTask':
			if ($method === 'POST') {
				handle_snooze_task($pdo, $userId, $data);
			}
			break;
		
		case 'unsnoozeTask':
			if ($method === 'POST') {
				handle_unsnooze_task($pdo, $userId, $data);
			}
			break;
		default:
			send_json_response(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."], 404);
			break;
	}
}

// Modified for Snooze Feature
/**
 * Snoozes a task with specified duration or custom date, auto-classifies to backlog.
 */
function handle_snooze_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$durationType = $data['duration_type'] ?? null;
	$customDate = $data['custom_date'] ?? null;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid task_id is required.'], 400);
		return;
	}

	if (empty($durationType) || !in_array($durationType, ['1week', '1month', '1quarter', 'custom'])) {
		send_json_response(['status' => 'error', 'message' => 'Valid duration_type is required (1week, 1month, 1quarter, custom).'], 400);
		return;
	}

	if ($durationType === 'custom' && empty($customDate)) {
		send_json_response(['status' => 'error', 'message' => 'custom_date is required when duration_type is custom.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Verify task ownership
		$stmt = $pdo->prepare("SELECT classification FROM tasks WHERE task_id = :taskId AND user_id = :userId AND deleted_at IS NULL");
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt->fetch();

		if ($task === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		// Calculate wake time (9 AM user local time, stored as UTC)
		$wakeTimeUtc = null;
		if ($durationType === 'custom') {
			// For custom date, validate format and set to 9 AM UTC on that date
			if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $customDate)) {
				$pdo->rollBack();
				send_json_response(['status' => 'error', 'message' => 'Invalid custom_date format. Use YYYY-MM-DD.'], 400);
				return;
			}
			// Set wake time to 9 AM UTC on the specified date
			$wakeTimeUtc = $customDate . ' 09:00:00';
		} else {
			// Calculate preset durations from current UTC time
			$now = new DateTime('now', new DateTimeZone('UTC'));
			
			switch ($durationType) {
				case '1week':
					$now->add(new DateInterval('P7D'));
					break;
				case '1month':
					$now->add(new DateInterval('P1M'));
					break;
				case '1quarter':
					$now->add(new DateInterval('P3M'));
					break;
			}
			
			// Set to 9 AM on the calculated day
			$now->setTime(9, 0, 0);
			$wakeTimeUtc = $now->format('Y-m-d H:i:s');
		}

		// Update task: snooze it and set classification to backlog
		$stmt = $pdo->prepare(
			"UPDATE tasks 
			 SET snoozed_until = :wakeTime, snoozed_at = UTC_TIMESTAMP(), 
				 classification = 'backlog', updated_at = UTC_TIMESTAMP()
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt->execute([
			':wakeTime' => $wakeTimeUtc,
			':taskId' => $taskId,
			':userId' => $userId
		]);

		$pdo->commit();

		send_json_response([
			'status' => 'success',
			'data' => [
				'task_id' => $taskId,
				'snoozed_until' => $wakeTimeUtc,
				'classification' => 'backlog'
			]
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_snooze_task: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while snoozing the task.'], 500);
	}
}


// Modified for Snooze Feature
/**
 * Manually unsnoozes a task (wakes it up early).
 */
function handle_unsnooze_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid task_id is required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Verify task ownership and that it's currently snoozed
		$stmt = $pdo->prepare(
			"SELECT snoozed_until FROM tasks 
			 WHERE task_id = :taskId AND user_id = :userId AND deleted_at IS NULL 
			 AND snoozed_until IS NOT NULL"
		);
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt->fetch();

		if ($task === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found, permission denied, or task is not snoozed.'], 404);
			return;
		}

		// Clear snooze fields
		$stmt = $pdo->prepare(
			"UPDATE tasks 
			 SET snoozed_until = NULL, snoozed_at = NULL, updated_at = UTC_TIMESTAMP()
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);

		$pdo->commit();

		send_json_response([
			'status' => 'success',
			'data' => ['task_id' => $taskId]
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_unsnooze_task: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while unsnoozing the task.'], 500);
	}
}

// Modified for Mobile Move Mode
/**
 * Moves a task to a new column and updates task positions in both columns.
 */
function handle_move_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$toColumnId = isset($data['to_column_id']) ? (int)$data['to_column_id'] : 0;

	if ($taskId <= 0 || $toColumnId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Valid task_id and to_column_id are required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		// 1. Get the task's current column_id
		$stmt_find = $pdo->prepare("SELECT column_id FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			throw new Exception('Task not found or permission denied.');
		}
		$fromColumnId = $task['column_id'];

		// If moving to the same column, do nothing.
		if ($fromColumnId == $toColumnId) {
			$pdo->commit();
			send_json_response(['status' => 'success', 'message' => 'Task already in the destination column.'], 200);
			return;
		}

		// 2. Determine the new position for the task (at the end of the destination column)
		$stmt_pos = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE column_id = :toColumnId AND user_id = :userId AND deleted_at IS NULL");
		$stmt_pos->execute([':toColumnId' => $toColumnId, ':userId' => $userId]);
		$newPosition = (int)$stmt_pos->fetchColumn();

		// 3. Update the task to move it
		$stmt_move = $pdo->prepare(
			"UPDATE tasks SET column_id = :toColumnId, position = :newPosition, updated_at = UTC_TIMESTAMP() 
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_move->execute([
			':toColumnId' => $toColumnId,
			':newPosition' => $newPosition,
			':taskId' => $taskId,
			':userId' => $userId
		]);

		// 4. Re-compact the positions in the source column
		$stmt_get_source_tasks = $pdo->prepare(
			"SELECT task_id FROM tasks WHERE column_id = :fromColumnId AND user_id = :userId AND deleted_at IS NULL ORDER BY position ASC"
		);
		$stmt_get_source_tasks->execute([':fromColumnId' => $fromColumnId, ':userId' => $userId]);
		$source_tasks = $stmt_get_source_tasks->fetchAll(PDO::FETCH_COLUMN);
		
		$stmt_update_source_pos = $pdo->prepare("UPDATE tasks SET position = :position, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId");
		foreach ($source_tasks as $index => $id) {
			$stmt_update_source_pos->execute([':position' => $index, ':taskId' => $id, ':userId' => $userId]);
		}
		
		$pdo->commit();

		send_json_response(['status' => 'success'], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_move_task: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => $e->getMessage() ?: 'A server error occurred while moving the task.'], 500);
	}
}


// Modified for Soft Deletes
/**
 * Restores a soft-deleted item (task or column) by setting its deleted_at to NULL.
 */
function handle_restore_item(PDO $pdo, int $userId, ?array $data): void {
	$type = $data['type'] ?? null;
	$id = isset($data['id']) ? (int)$data['id'] : 0;

	if (empty($type) || !in_array($type, ['task', 'column']) || $id <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid type (task/column) and ID are required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();

		if ($type === 'task') {
			$stmtFind = $pdo->prepare("SELECT column_id FROM tasks WHERE task_id = :id AND user_id = :userId");
			$stmtFind->execute([':id' => $id, ':userId' => $userId]);
			$task = $stmtFind->fetch();
			if (!$task) { throw new Exception(ucfirst($type) . ' not found or permission denied.'); }
			$columnId = $task['column_id'];

			$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL");
			$stmtPos->execute([':columnId' => $columnId, ':userId' => $userId]);
			$newPosition = (int)$stmtPos->fetchColumn();
			
			$stmtRestore = $pdo->prepare(
				"UPDATE tasks SET deleted_at = NULL, position = :pos, updated_at = UTC_TIMESTAMP() WHERE task_id = :id AND user_id = :userId"
			);
			$stmtRestore->execute([':pos' => $newPosition, ':id' => $id, ':userId' => $userId]);
			
		} else { // type is 'column'
			$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL");
			$stmtPos->execute([':userId' => $userId]);
			$newPosition = (int)$stmtPos->fetchColumn();

			$stmtRestore = $pdo->prepare(
				"UPDATE `columns` SET deleted_at = NULL, position = :pos, updated_at = UTC_TIMESTAMP() WHERE column_id = :id AND user_id = :userId"
			);
			$stmtRestore->execute([':pos' => $newPosition, ':id' => $id, ':userId' => $userId]);

			$stmtRestoreTasks = $pdo->prepare(
				"UPDATE tasks SET deleted_at = NULL, updated_at = UTC_TIMESTAMP() WHERE column_id = :id AND user_id = :userId"
			);
			$stmtRestoreTasks->execute([':id' => $id, ':userId' => $userId]);
		}
		
		if ($stmtRestore->rowCount() === 0) {
			throw new Exception(ucfirst($type) . ' not found or permission denied.');
		}

		if ($type === 'task') {
			$stmtSelect = $pdo->prepare("SELECT * FROM tasks WHERE task_id = :id");
			$stmtSelect->execute([':id' => $id]);
			$restoredItem = $stmtSelect->fetch(PDO::FETCH_ASSOC);
		} else { // 'column'
			$stmtSelectCol = $pdo->prepare("SELECT * FROM `columns` WHERE column_id = :id");
			$stmtSelectCol->execute([':id' => $id]);
			$restoredItem = $stmtSelectCol->fetch(PDO::FETCH_ASSOC);
			
			$stmtSelectTasks = $pdo->prepare("SELECT * FROM tasks WHERE column_id = :id AND deleted_at IS NULL ORDER BY position ASC");
			$stmtSelectTasks->execute([':id' => $id]);
			$restoredItem['tasks'] = $stmtSelectTasks->fetchAll(PDO::FETCH_ASSOC);
		}

		$pdo->commit();

		send_json_response([
			'status' => 'success',
			'message' => ucfirst($type) . ' restored successfully.',
			'data' => $restoredItem
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_restore_item: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => $e->getMessage() ?: 'A server error occurred while restoring the item.'], 500);
	}
}

// Modified for Privacy Feature
/**
 * Toggles the 'is_private' flag for a given task or column.
 */
function handle_toggle_privacy(PDO $pdo, int $userId, ?array $data): void {
	$type = $data['type'] ?? null;
	$id = isset($data['id']) ? (int)$data['id'] : 0;

	if (empty($type) || !in_array($type, ['task', 'column']) || $id <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid type (task/column) and ID are required.'], 400);
		return;
	}

	$table = ($type === 'task') ? 'tasks' : 'columns';
	$idColumn = ($type === 'task') ? 'task_id' : 'column_id';

	try {
		$pdo->beginTransaction();

		$updateSql = "UPDATE `{$table}` SET is_private = NOT is_private, updated_at = UTC_TIMESTAMP() WHERE {$idColumn} = :id AND user_id = :userId";
		$stmtUpdate = $pdo->prepare($updateSql);
		$stmtUpdate->execute([':id' => $id, ':userId' => $userId]);

		if ($stmtUpdate->rowCount() === 0) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => ucfirst($type) . ' not found or permission denied.'], 404);
			return;
		}

		$selectSql = "SELECT is_private FROM `{$table}` WHERE {$idColumn} = :id";
		$stmtSelect = $pdo->prepare($selectSql);
		$stmtSelect->execute([':id' => $id]);
		$newPrivateState = (bool)$stmtSelect->fetchColumn();

		$pdo->commit();

		send_json_response([
			'status' => 'success',
			'data' => [
				'type' => $type,
				'id' => $id,
				'is_private' => $newPrivateState
			]
		], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message("Error in handle_toggle_privacy: " . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while updating privacy status.'], 500);
	}
}


/**
 * Saves details (notes and/or due date) to a task.
 */
function handle_save_task_details(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$notes = $data['notes'] ?? null;

	if ($taskId <= 0 || ($notes === null && !array_key_exists('dueDate', $data))) {
		send_json_response(['status' => 'error', 'message' => 'Task ID and at least one field to update (notes or dueDate) are required.'], 400);
		return;
	}

	$dueDateForDb = null;
	if (array_key_exists('dueDate', $data)) {
		if (empty($data['dueDate'])) {
			$dueDateForDb = null;
		} elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['dueDate'])) {
			$dueDateForDb = $data['dueDate'];
		} else {
			send_json_response(['status' => 'error', 'message' => 'Invalid dueDate format. Please use YYYY-MM-DD.'], 400);
			return;
		}
	}

	try {
		$pdo->beginTransaction();

		$stmt_find = $pdo->prepare("SELECT encrypted_data FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or you do not have permission to edit it.'], 404);
			return;
		}

		$currentData = json_decode($task['encrypted_data'], true) ?: [];


		if ($notes !== null) {
			$currentData['notes'] = $notes;
		}
		$newDataJson = json_encode($currentData);

		$sql_parts = [];
		$params = [':taskId' => $taskId, ':userId' => $userId];

		if ($notes !== null) {
			$sql_parts[] = "encrypted_data = :newDataJson";
			$params[':newDataJson'] = $newDataJson;
		}

		if (array_key_exists('dueDate', $data)) {
			$sql_parts[] = "due_date = :dueDate";
			$params[':dueDate'] = $dueDateForDb;
		}
		
		if (!empty($sql_parts)) {
			$sql = "UPDATE tasks SET " . implode(', ', $sql_parts) . ", updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId";
			$stmt_update = $pdo->prepare($sql);
			$stmt_update->execute($params);
		}

		$pdo->commit();

		send_json_response(['status' => 'success'], 200);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) {
			$pdo->rollBack();
		}
		log_debug_message('Error in tasks.php handle_save_task_details(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while saving the task details.'], 500);
	}
}


/**
 * Reorders tasks within a column and handles moving tasks between columns.
 */
function handle_reorder_tasks(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_id']) || !isset($data['tasks'])) {
		send_json_response(['status' => 'error', 'message' => 'Column ID and tasks array are required.'], 400);
		return;
	}

	$columnId = (int)$data['column_id'];
	$taskIds = $data['tasks'];

	if (!is_array($taskIds)) {
		send_json_response(['status' => 'error', 'message' => 'Tasks must be an array.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt = $pdo->prepare(
			"UPDATE tasks 
			 SET position = :position, column_id = :columnId, updated_at = UTC_TIMESTAMP()
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		foreach ($taskIds as $position => $taskId) {
			$stmt->execute([
				':position'  => $position,
				':columnId'  => $columnId,
				':taskId'    => (int)$taskId,
				':userId'    => $userId
			]);
		}
		$pdo->commit();
		send_json_response(['status' => 'success'], 200);
	} catch (Exception $e) {
		$pdo->rollBack();
		log_debug_message('Error in tasks.php handle_reorder_tasks(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while reordering tasks.'], 500);
	}
}


/**
 * Fetches all columns, tasks, and user preferences.
 */
function handle_get_all_board_data(PDO $pdo, int $userId): void {
	try {
		$stmtUser = $pdo->prepare("SELECT preferences, storage_used_bytes FROM users WHERE user_id = :userId");
		$stmtUser->execute([':userId' => $userId]);
		$userData = $stmtUser->fetch(PDO::FETCH_ASSOC);
		$userPrefs = json_decode($userData['preferences'] ?? '{}', true);
		$storageUsed = (int)($userData['storage_used_bytes'] ?? 0);

		// Modified for Snooze Feature: Check for awakened tasks
		$stmtAwakened = $pdo->prepare(
			"SELECT COUNT(*) FROM tasks 
			 WHERE user_id = :userId AND deleted_at IS NULL 
			 AND snoozed_until IS NOT NULL AND snoozed_until <= UTC_TIMESTAMP()"
		);
		$stmtAwakened->execute([':userId' => $userId]);
		$awakenedCount = (int)$stmtAwakened->fetchColumn();
		$hasAwakenedTasks = $awakenedCount > 0;
		
		// If there are awakened tasks, clear their snooze status automatically
		if ($hasAwakenedTasks) {
			$stmtClearAwakened = $pdo->prepare(
				"UPDATE tasks 
				 SET snoozed_until = NULL, snoozed_at = NULL, updated_at = UTC_TIMESTAMP()
				 WHERE user_id = :userId AND deleted_at IS NULL 
				 AND snoozed_until IS NOT NULL AND snoozed_until <= UTC_TIMESTAMP()"
			);
			$stmtClearAwakened->execute([':userId' => $userId]);
		}

		$stmtColumns = $pdo->prepare(
			"SELECT column_id, column_name, position, is_private 
			 FROM `columns` 
			 WHERE user_id = :userId AND deleted_at IS NULL 
			 ORDER BY position ASC"
		);
		$stmtColumns->execute([':userId' => $userId]);
		$columns = $stmtColumns->fetchAll();
		$boardData = [];
		$columnMap = [];
		foreach ($columns as $column) {
			$column['tasks'] = [];
			$boardData[] = $column;
			$columnMap[$column['column_id']] = &$boardData[count($boardData) - 1];
		}

		$stmtTasks = $pdo->prepare(
			"SELECT 
				t.task_id, t.column_id, t.encrypted_data, t.position, t.classification, t.is_private,
				t.updated_at, t.due_date, t.snoozed_until, t.snoozed_at, 
				COUNT(ta.attachment_id) as attachments_count
			 FROM tasks t
			 LEFT JOIN task_attachments ta ON t.task_id = ta.task_id
			 WHERE t.user_id = :userId AND t.deleted_at IS NULL
			 GROUP BY t.task_id
			 ORDER BY t.position ASC"
		);
		$stmtTasks->execute([':userId' => $userId]);

		while ($task = $stmtTasks->fetch()) {
			if (isset($columnMap[$task['column_id']])) {
				$encryptedData = json_decode($task['encrypted_data'], true);
				$task['has_notes'] = !empty($encryptedData['notes']);
				// Modified for Snooze Feature: Add snooze status indicator
				$task['is_snoozed'] = !empty($task['snoozed_until']);
				$columnMap[$task['column_id']]['tasks'][] = $task;
			}
		}

		send_json_response([
			'status' => 'success', 
			'data' => [
				'board' => $boardData,
				'user_prefs' => $userPrefs,
				'user_storage' => ['used' => $storageUsed, 'quota' => USER_STORAGE_QUOTA_BYTES],
				// Modified for Snooze Feature: Include wake notification flag
				'wake_notification' => $hasAwakenedTasks
			]
		], 200);

	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_get_all_board_data(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while fetching board data.'], 500);
	}
}

/**
 * Creates a new column for the authenticated user.
 */
function handle_create_column(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_name'])) {
		send_json_response(['status' => 'error', 'message' => 'Column name is required.'], 400);
		return;
	}
	$columnName = trim($data['column_name']);

	try {
		$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL");
		$stmtPos->execute([':userId' => $userId]);
		$position = (int)$stmtPos->fetchColumn();

		$stmt = $pdo->prepare(
			"INSERT INTO `columns` (user_id, column_name, position, created_at, updated_at) VALUES (:userId, :columnName, :position, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt->execute([':userId' => $userId, ':columnName' => $columnName, ':position' => $position]);
		$newColumnId = (int)$pdo->lastInsertId();

		send_json_response([
			'status' => 'success',
			'data' => [
				'column_id' => $newColumnId,
				'column_name' => $columnName,
				'position' => $position,
				'is_private' => false,
				'tasks' => []
			]
		], 201);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_create_column(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while creating the column.'], 500);
	}
}

/**
 * Creates a new task in a specified column for the authenticated user.
 */
function handle_create_task(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_id']) || empty($data['task_title'])) {
		send_json_response(['status' => 'error', 'message' => 'Column ID and task title are required.'], 400);
		return;
	}
	$columnId = (int)$data['column_id'];
	$taskTitle = trim($data['task_title']);

	try {
		$stmtPos = $pdo->prepare("SELECT COUNT(*) FROM `tasks` WHERE user_id = :userId AND column_id = :columnId AND deleted_at IS NULL");
		$stmtPos->execute([':userId' => $userId, ':columnId' => $columnId]);
		$position = (int)$stmtPos->fetchColumn();
		$encryptedData = json_encode(['title' => $taskTitle, 'notes' => '']);
		$stmt = $pdo->prepare(
			"INSERT INTO `tasks` (user_id, column_id, encrypted_data, position, created_at, updated_at) VALUES (:userId, :columnId, :encryptedData, :position, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt->execute([':userId' => $userId, ':columnId' => $columnId, ':encryptedData' => $encryptedData, ':position' => $position]);
		$newTaskId = (int)$pdo->lastInsertId();

		send_json_response([
			'status' => 'success',
			'data' => [
				'task_id' => $newTaskId, 'column_id' => $columnId, 'encrypted_data' => $encryptedData,
				'position' => $position, 'classification' => 'support', 'is_private' => false,
				'due_date' => null, 'has_notes' => false, 'attachments_count' => 0,
				// Modified for Snooze Feature: Add snooze fields
				'snoozed_until' => null, 'snoozed_at' => null, 'is_snoozed' => false
			]
		], 201);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_create_task(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while creating the task.'], 500);
	}
}

/**
 * Toggles a task's classification between its current state and 'completed'.
 */
function handle_toggle_complete(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['task_id'])) {
		send_json_response(['status' => 'error', 'message' => 'Task ID is required.'], 400);
		return;
	}
	$taskId = (int)$data['task_id'];

	try {
		$stmtGet = $pdo->prepare("SELECT classification FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmtGet->execute([':taskId' => $taskId, ':userId' => $userId]);
		$currentClassification = $stmtGet->fetchColumn();

		if ($currentClassification === false) {
			send_json_response(['status' => 'error', 'message' => 'Task not found.'], 404);
			return;
		}

		$newClassification = ($currentClassification === 'completed') ? 'support' : 'completed';
		$stmtUpdate = $pdo->prepare(
			"UPDATE tasks SET classification = :newClassification, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmtUpdate->execute([':newClassification' => $newClassification, ':taskId' => $taskId, ':userId' => $userId]);
		send_json_response(['status' => 'success', 'data' => ['new_classification' => $newClassification]], 200);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_toggle_complete(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred while updating the task.'], 500);
	}
}

/**
 * Sets a task's classification to a specific value (Signal, Support, or Backlog).
 */
function handle_toggle_classification(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$newClassification = $data['classification'] ?? null;

	if ($taskId <= 0 || empty($newClassification) || !in_array($newClassification, ['signal', 'support', 'backlog'])) {
		send_json_response(['status' => 'error', 'message' => 'Task ID and a valid classification are required.'], 400);
		return;
	}

	try {
		$stmtUpdate = $pdo->prepare(
			"UPDATE tasks 
			 SET classification = :newClassification, updated_at = UTC_TIMESTAMP() 
			 WHERE task_id = :taskId AND user_id = :userId AND classification != 'completed'"
		);
		$stmtUpdate->execute([':newClassification' => $newClassification, ':taskId' => $taskId, ':userId' => $userId]);

		if ($stmtUpdate->rowCount() === 0) {
			send_json_response(['status' => 'error', 'message' => 'Task not found, permission denied, or task is already completed.'], 404);
			return;
		}
		send_json_response(['status' => 'success', 'data' => ['new_classification' => $newClassification]], 200);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_toggle_classification(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Renames a column for the authenticated user.
 */
function handle_rename_column(PDO $pdo, int $userId, ?array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
	$newName = isset($data['new_name']) ? trim($data['new_name']) : '';

	if ($columnId <= 0 || $newName === '') {
		send_json_response(['status' => 'error', 'message' => 'Column ID and a non-empty new name are required.'], 400);
		return;
	}

	try {
		$stmt = $pdo->prepare(
			"UPDATE `columns` SET column_name = :newName, updated_at = UTC_TIMESTAMP() WHERE column_id = :columnId AND user_id = :userId"
		);
		$stmt->execute([':newName' => $newName, ':columnId' => $columnId, ':userId' => $userId]);

		if ($stmt->rowCount() === 0) {
			send_json_response(['status' => 'error', 'message' => 'Column not found or permission denied.'], 404);
			return;
		}
		send_json_response(['status' => 'success', 'data' => ['column_id' => $columnId, 'new_name' => $newName]], 200);
	} catch (Exception $e) {
		log_debug_message('Error in tasks.php handle_rename_column(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Soft-deletes a column and all its tasks for the authenticated user.
 */
function handle_delete_column(PDO $pdo, int $userId, ?array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;

	if ($columnId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Invalid Column ID.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt_delete_tasks = $pdo->prepare(
			"UPDATE tasks SET deleted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() 
			 WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL"
		);
		$stmt_delete_tasks->execute([':columnId' => $columnId, ':userId' => $userId]);
		$stmt_delete_column = $pdo->prepare(
			"UPDATE `columns` SET deleted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
			 WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL"
		);
		$stmt_delete_column->execute([':columnId' => $columnId, ':userId' => $userId]);

		if ($stmt_delete_column->rowCount() === 0) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Column not found or permission denied.'], 404);
			return;
		}

		$stmt_get_columns = $pdo->prepare(
			"SELECT column_id FROM `columns` WHERE user_id = :userId AND deleted_at IS NULL ORDER BY position ASC"
		);
		$stmt_get_columns->execute([':userId' => $userId]);
		$remaining_columns = $stmt_get_columns->fetchAll(PDO::FETCH_COLUMN);
		
		$stmt_update_pos = $pdo->prepare("UPDATE `columns` SET position = :position, updated_at = UTC_TIMESTAMP() WHERE column_id = :columnId AND user_id = :userId");
		foreach ($remaining_columns as $index => $id) {
			$stmt_update_pos->execute([':position' => $index, ':columnId' => $id, ':userId' => $userId]);
		}

		$pdo->commit();
		send_json_response(['status' => 'success', 'data' => ['deleted_column_id' => $columnId]], 200);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		log_debug_message('Error in tasks.php handle_delete_column(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}


/**
 * Updates the positions of all columns based on a provided order.
 */
function handle_reorder_columns(PDO $pdo, int $userId, ?array $data): void {
	if (empty($data['column_ids']) || !is_array($data['column_ids'])) {
		send_json_response(['status' => 'error', 'message' => 'An ordered array of column_ids is required.'], 400);
		return;
	}
	$columnIds = $data['column_ids'];

	try {
		$pdo->beginTransaction();
		$stmt = $pdo->prepare(
			"UPDATE `columns` SET position = :position, updated_at = UTC_TIMESTAMP() WHERE column_id = :columnId AND user_id = :userId"
		);
		foreach ($columnIds as $position => $columnId) {
			$stmt->execute([':position' => $position, ':columnId' => (int)$columnId, ':userId' => $userId]);
		}
		$pdo->commit();
		send_json_response(['status' => 'success'], 200);
	} catch (Exception $e) {
		$pdo->rollBack();
		log_debug_message('Error in tasks.php handle_reorder_columns(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Soft-deletes a task and re-compacts the positions of remaining tasks in its column.
 */
function handle_delete_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Invalid Task ID.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt_find = $pdo->prepare("SELECT column_id FROM tasks WHERE task_id = :taskId AND user_id = :userId AND deleted_at IS NULL");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}
		$columnId = $task['column_id'];

		$stmt_delete = $pdo->prepare(
			"UPDATE tasks SET deleted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() 
			 WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_delete->execute([':taskId' => $taskId, ':userId' => $userId]);

		$stmt_get_tasks = $pdo->prepare(
			"SELECT task_id FROM tasks WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL ORDER BY position ASC"
		);
		$stmt_get_tasks->execute([':columnId' => $columnId, ':userId' => $userId]);
		$remaining_tasks = $stmt_get_tasks->fetchAll(PDO::FETCH_COLUMN);

		$stmt_update_pos = $pdo->prepare("UPDATE tasks SET position = :position, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId");
		foreach ($remaining_tasks as $index => $id) {
			$stmt_update_pos->execute([':position' => $index, ':taskId' => $id, ':userId' => $userId]);
		}

		$pdo->commit();
		send_json_response(['status' => 'success', 'data' => ['deleted_task_id' => $taskId]], 200);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		log_debug_message('Error in tasks.php handle_delete_task(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}


/**
 * Renames a task's title by updating its encrypted_data JSON blob.
 */
function handle_rename_task_title(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$newTitle = isset($data['new_title']) ? trim($data['new_title']) : '';

	if ($taskId <= 0 || $newTitle === '') {
		send_json_response(['status' => 'error', 'message' => 'Task ID and a non-empty new title are required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt_find = $pdo->prepare("SELECT encrypted_data FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$task = $stmt_find->fetch();

		if ($task === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		$currentData = json_decode($task['encrypted_data'], true) ?: [];
		$currentData['title'] = $newTitle;
		$newDataJson = json_encode($currentData);
		$stmt_update = $pdo->prepare(
			"UPDATE tasks SET encrypted_data = :newDataJson, updated_at = UTC_TIMESTAMP() WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_update->execute([':newDataJson' => $newDataJson, ':taskId' => $taskId, ':userId' => $userId]);
		$pdo->commit();
		send_json_response(['status' => 'success'], 200);
	} catch (Exception $e) {
		$pdo->rollBack();
		log_debug_message('Error in tasks.php handle_rename_task_title(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Duplicates a task, placing the copy at the bottom of the same column.
 */
function handle_duplicate_task(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'Invalid Task ID.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt_find = $pdo->prepare(
			"SELECT column_id, encrypted_data, classification, due_date FROM tasks WHERE task_id = :taskId AND user_id = :userId"
		);
		$stmt_find->execute([':taskId' => $taskId, ':userId' => $userId]);
		$originalTask = $stmt_find->fetch(PDO::FETCH_ASSOC);

		if ($originalTask === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task to duplicate not found or permission denied.'], 404);
			return;
		}
		
		$columnId = $originalTask['column_id'];
		$stmt_pos = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE column_id = :columnId AND user_id = :userId AND deleted_at IS NULL");
		$stmt_pos->execute([':columnId' => $columnId, ':userId' => $userId]);
		$newPosition = (int)$stmt_pos->fetchColumn();

		$stmt_insert = $pdo->prepare(
			"INSERT INTO tasks (user_id, column_id, encrypted_data, position, classification, due_date, created_at, updated_at) 
			 VALUES (:userId, :columnId, :encryptedData, :position, :classification, :dueDate, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt_insert->execute([
			':userId' => $userId, ':columnId' => $columnId, ':encryptedData' => $originalTask['encrypted_data'],
			':position' => $newPosition, ':classification' => $originalTask['classification'], ':dueDate' => $originalTask['due_date']
		]);
		$newTaskId = (int)$pdo->lastInsertId();
		$pdo->commit();
		
		$encryptedDataDecoded = json_decode($originalTask['encrypted_data'], true);
		
		send_json_response([
			'status' => 'success',
			'data' => [
				'task_id' => $newTaskId, 'column_id' => $columnId, 'encrypted_data' => $originalTask['encrypted_data'],
				'position' => $newPosition, 'classification' => $originalTask['classification'], 'due_date' => $originalTask['due_date'],
				'has_notes' => !empty($encryptedDataDecoded['notes']), 'attachments_count' => 0, 'is_private' => false,
				// Modified for Snooze Feature: Duplicated tasks are not snoozed
				'snoozed_until' => null, 'snoozed_at' => null, 'is_snoozed' => false
			]
		], 201);
	} catch (Exception $e) {
		$pdo->rollBack();
		log_debug_message('Error in tasks.php handle_duplicate_task(): ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'A server error occurred.'], 500);
	}
}

/**
 * Handles the upload of a file attachment for a specific task.
 */
function handle_upload_attachment(PDO $pdo, int $userId, ?array $data): void {
	$taskId = isset($_POST['task_id']) ? (int)$_POST['task_id'] : 0;
	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid Task ID is required.'], 400);
		return;
	}
	if (empty($_FILES['attachment']) || $_FILES['attachment']['error'] !== UPLOAD_ERR_OK) {
		send_json_response(['status' => 'error', 'message' => 'File upload error or no file provided.'], 400);
		return;
	}
	$file = $_FILES['attachment'];
	if ($file['size'] > MAX_FILE_SIZE_BYTES) {
		send_json_response(['status' => 'error', 'message' => 'File is too large.'], 413);
		return;
	}
	$fileMimeType = mime_content_type($file['tmp_name']);
	if (!in_array($fileMimeType, ALLOWED_MIME_TYPES)) {
		send_json_response(['status' => 'error', 'message' => 'Invalid file type.'], 415);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt = $pdo->prepare("SELECT user_id FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		if ($stmt->fetch() === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		$stmt = $pdo->prepare("SELECT storage_used_bytes FROM users WHERE user_id = :userId");
		$stmt->execute([':userId' => $userId]);
		$storageUsed = (int)$stmt->fetchColumn();

		if (($storageUsed + $file['size']) > USER_STORAGE_QUOTA_BYTES) {
			$stmt = $pdo->prepare("SELECT attachment_id, filename_on_server, filesize_bytes FROM task_attachments WHERE user_id = :userId ORDER BY created_at ASC LIMIT 1");
			$stmt->execute([':userId' => $userId]);
			$oldest = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($oldest) {
				if (file_exists(ATTACHMENT_UPLOAD_DIR . $oldest['filename_on_server'])) {
					unlink(ATTACHMENT_UPLOAD_DIR . $oldest['filename_on_server']);
				}
				$stmtDel = $pdo->prepare("DELETE FROM task_attachments WHERE attachment_id = :id");
				$stmtDel->execute([':id' => $oldest['attachment_id']]);
				$storageUsed -= (int)$oldest['filesize_bytes'];
			}
		}

		$originalFilename = basename($file['name']);
		$fileExtension = pathinfo($originalFilename, PATHINFO_EXTENSION);
		$newFilename = "user{$userId}_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $fileExtension;
		if (!move_uploaded_file($file['tmp_name'], ATTACHMENT_UPLOAD_DIR . $newFilename)) {
			throw new Exception("Failed to move uploaded file.");
		}

		$stmt = $pdo->prepare(
			"INSERT INTO task_attachments (task_id, user_id, filename_on_server, original_filename, filesize_bytes, mime_type, created_at)
			 VALUES (:taskId, :userId, :newFilename, :originalFilename, :filesize, :mimeType, UTC_TIMESTAMP())"
		);
		$stmt->execute([
			':taskId' => $taskId, ':userId' => $userId, ':newFilename' => $newFilename,
			':originalFilename' => $originalFilename, ':filesize' => $file['size'], ':mimeType' => $fileMimeType
		]);
		$newAttachmentId = (int)$pdo->lastInsertId();

		$newStorageUsed = $storageUsed + $file['size'];
		$stmt = $pdo->prepare("UPDATE users SET storage_used_bytes = :storage WHERE user_id = :userId");
		$stmt->execute([':storage' => $newStorageUsed, ':userId' => $userId]);

		$pdo->commit();
		send_json_response([
			'status' => 'success',
			'data' => [
				'attachment_id' => $newAttachmentId, 'task_id' => $taskId, 'filename_on_server' => $newFilename,
				'original_filename' => $originalFilename, 'filesize_bytes' => $file['size'],
				'user_storage_used' => $newStorageUsed, 'user_storage_quota' => USER_STORAGE_QUOTA_BYTES
			]
		], 201);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		log_debug_message('Error in handle_upload_attachment: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
	}
}

/**
 * Deletes an attachment, removes the file, and updates user storage quota.
 */
function handle_delete_attachment(PDO $pdo, int $userId, ?array $data): void {
	$attachmentId = isset($data['attachment_id']) ? (int)$data['attachment_id'] : 0;
	if ($attachmentId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid Attachment ID is required.'], 400);
		return;
	}

	try {
		$pdo->beginTransaction();
		$stmt = $pdo->prepare("SELECT filename_on_server, filesize_bytes FROM task_attachments WHERE attachment_id = :attachmentId AND user_id = :userId");
		$stmt->execute([':attachmentId' => $attachmentId, ':userId' => $userId]);
		$attachment = $stmt->fetch(PDO::FETCH_ASSOC);

		if ($attachment === false) {
			$pdo->rollBack();
			send_json_response(['status' => 'error', 'message' => 'Attachment not found or permission denied.'], 404);
			return;
		}

		if (file_exists(ATTACHMENT_UPLOAD_DIR . $attachment['filename_on_server'])) {
			unlink(ATTACHMENT_UPLOAD_DIR . $attachment['filename_on_server']);
		}
		$stmt = $pdo->prepare("DELETE FROM task_attachments WHERE attachment_id = :attachmentId");
		$stmt->execute([':attachmentId' => $attachmentId]);
		$stmt = $pdo->prepare("UPDATE users SET storage_used_bytes = GREATEST(0, storage_used_bytes - :filesize) WHERE user_id = :userId");
		$stmt->execute([':filesize' => (int)$attachment['filesize_bytes'], ':userId' => $userId]);
		$pdo->commit();
		send_json_response(['status' => 'success', 'data' => ['deleted_attachment_id' => $attachmentId]], 200);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		log_debug_message('Error in handle_delete_attachment: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
	}
}


/**
 * Fetches all attachments for a specific task.
 */
function handle_get_attachments(PDO $pdo, int $userId): void {
	$taskId = isset($_GET['task_id']) ? (int)$_GET['task_id'] : 0;

	if ($taskId <= 0) {
		send_json_response(['status' => 'error', 'message' => 'A valid Task ID is required.'], 400);
		return;
	}

	try {
		$stmt = $pdo->prepare("SELECT user_id FROM tasks WHERE task_id = :taskId AND user_id = :userId");
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		if ($stmt->fetch() === false) {
			send_json_response(['status' => 'error', 'message' => 'Task not found or permission denied.'], 404);
			return;
		}

		$stmt = $pdo->prepare(
			"SELECT attachment_id, task_id, filename_on_server, original_filename, filesize_bytes, created_at 
			 FROM task_attachments 
			 WHERE task_id = :taskId AND user_id = :userId 
			 ORDER BY created_at DESC"
		);
		$stmt->execute([':taskId' => $taskId, ':userId' => $userId]);
		$attachments = $stmt->fetchAll(PDO::FETCH_ASSOC);

		send_json_response(['status' => 'success', 'data' => $attachments], 200);

	} catch (Exception $e) {
		log_debug_message('Error in handle_get_attachments: ' . $e->getMessage());
		send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
	}
}



<?php
/**
 * Code for /api/auth.php
 *
 * MyDayHub - Authentication API
 *
 * Handles user registration, login, and other authentication actions.
 *
 * @version 6.5.2-debug-complete
 * @author Alex & Gemini
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';
require_once __DIR__ . '/../incs/mailer.php';

if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

/**
 * Helper function to send JSON responses with debug info when in DEVMODE
 */
function send_debug_response(array $data, int $http_code = 200): void {
	global $__DEBUG_MESSAGES__;
	if (DEVMODE && !empty($__DEBUG_MESSAGES__)) {
		$data['debug'] = $__DEBUG_MESSAGES__;
	}
	http_response_code($http_code);
	header('Content-Type: application/json');
	echo json_encode($data);
	exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = null;
$input = [];

if ($method === 'POST') {
	$input = json_decode(file_get_contents('php://input'), true) ?? [];
	$action = $input['action'] ?? null;
} else {
	$action = $_GET['action'] ?? null;
}


switch ($action) {
	case 'register':
		handle_register($input);
		break;
	case 'login':
		handle_login($input);
		break;
	case 'requestPasswordReset':
		handle_request_password_reset($input);
		break;
	case 'performPasswordReset':
		handle_perform_password_reset($input);
		break;
	default:
		http_response_code(404);
		echo json_encode(['status' => 'error', 'message' => 'Unknown API action.']);
		break;
}


/**
 * Handles the final step of the password reset process.
 */
function handle_perform_password_reset(?array $data): void {
	$token = $data['token'] ?? '';
	$newPassword = $data['new_password'] ?? '';
	$confirmPassword = $data['confirm_password'] ?? '';

	if (empty($token) || empty($newPassword) || empty($confirmPassword)) {
		send_debug_response(['status' => 'error', 'message' => 'All fields are required.'], 400);
		return;
	}
	if ($newPassword !== $confirmPassword) {
		send_debug_response(['status' => 'error', 'message' => 'Passwords do not match.'], 400);
		return;
	}
	if (strlen($newPassword) < 8) {
		send_debug_response(['status' => 'error', 'message' => 'Password must be at least 8 characters long.'], 400);
		return;
	}

	try {
		$pdo = get_pdo();
		$pdo->beginTransaction();

		$tokenHash = hash('sha256', $token);
		
		$stmt = $pdo->prepare(
			"SELECT user_id, expires_at FROM password_resets WHERE token_hash = :tokenHash"
		);
		$stmt->execute([':tokenHash' => $tokenHash]);
		$resetRequest = $stmt->fetch();

		if (!$resetRequest || strtotime($resetRequest['expires_at']) < time()) {
			if ($resetRequest) {
				$stmt_delete = $pdo->prepare("DELETE FROM password_resets WHERE token_hash = :tokenHash");
				$stmt_delete->execute([':tokenHash' => $tokenHash]);
			}
			$pdo->commit();
			send_debug_response(['status' => 'error', 'message' => 'This reset link is invalid or has expired. Please request a new one.'], 400);
			return;
		}

		$userId = (int)$resetRequest['user_id'];
		
		$newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
		
		$stmt_update = $pdo->prepare("UPDATE users SET password_hash = :passwordHash WHERE user_id = :userId");
		$stmt_update->execute([
			':passwordHash' => $newPasswordHash,
			':userId' => $userId
		]);

		$stmt_delete = $pdo->prepare("DELETE FROM password_resets WHERE user_id = :userId");
		$stmt_delete->execute([':userId' => $userId]);

		$pdo->commit();

		send_debug_response(['status' => 'success', 'message' => 'Your password has been reset successfully. You can now log in.'], 200);

	} catch (Exception $e) {
		if (isset($pdo) && $pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in handle_perform_password_reset: ' . $e->getMessage());
		}
		send_debug_response(['status' => 'error', 'message' => 'A server error occurred. Please try again.'], 500);
	}
}


/**
 * Handles a request to initiate a password reset.
 */
// Modified for Complete Debug System Integration
function handle_request_password_reset(?array $data): void {
	error_log('DIRECT ERROR LOG: Password reset function called');
	log_debug_message('--- DEBUG: handle_request_password_reset CALLED ---');

	if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
		log_debug_message('DEBUG: Invalid or empty email provided. Exiting.');
		send_debug_response(['status' => 'error', 'message' => 'A valid email address is required.'], 400);
		return;
	}
	
	log_debug_message("DEBUG: Email validated: {$data['email']}");
	$genericSuccessResponse = ['status' => 'success', 'message' => 'If an account with that email exists, a password reset link has been sent.'];

	try {
		log_debug_message('DEBUG: Inside try block. Getting PDO connection.');
		$pdo = get_pdo();
		log_debug_message('DEBUG: PDO connection successful.');
		
		$stmt = $pdo->prepare("SELECT user_id, username FROM users WHERE email = :email");
		log_debug_message('DEBUG: Prepared statement to find user by email.');
		$stmt->execute([':email' => $data['email']]);
		log_debug_message('DEBUG: Executed statement to find user.');
		$user = $stmt->fetch();

		if ($user) {
			log_debug_message("DEBUG: User found with ID: {$user['user_id']}");
			$userId = (int)$user['user_id'];
			$username = $user['username'];
			
			$token = bin2hex(random_bytes(32));
			$tokenHash = hash('sha256', $token);
			$expiresAt = date('Y-m-d H:i:s', time() + 3600);
			log_debug_message('DEBUG: Token generated and hashed.');

			$pdo->beginTransaction();
			log_debug_message('DEBUG: Began database transaction.');
			
			$stmt_invalidate = $pdo->prepare("DELETE FROM password_resets WHERE user_id = :userId");
			$stmt_invalidate->execute([':userId' => $userId]);
			log_debug_message('DEBUG: Invalidated old tokens.');

			$stmt = $pdo->prepare(
				"INSERT INTO password_resets (user_id, token_hash, expires_at, created_at) VALUES (:userId, :tokenHash, :expiresAt, UTC_TIMESTAMP())"
			);
			$stmt->execute([
				':userId' => $userId,
				':tokenHash' => $tokenHash,
				':expiresAt' => $expiresAt
			]);
			log_debug_message('DEBUG: Inserted new token into password_resets table.');

			send_password_reset_email($data['email'], $username, $token);
			log_debug_message('DEBUG: Called send_password_reset_email function.');

			$pdo->commit();
			log_debug_message('DEBUG: Committed transaction.');
		} else {
			log_debug_message("DEBUG: No user found for email {$data['email']}. Proceeding without error.");
		}
		
		log_debug_message('DEBUG: About to send generic success response.');
		send_debug_response($genericSuccessResponse, 200);

	} catch (Exception $e) {
		log_debug_message('--- CATCH BLOCK EXCEPTION --- : ' . $e->getMessage());
		if (isset($pdo) && $pdo->inTransaction()) {
			$pdo->rollBack();
		}
		if (defined('DEVMODE') && DEVMODE) {
			send_debug_response(['status' => 'error', 'message' => 'Failed to process reset request: ' . $e->getMessage()], 500);
			return;
		}
		send_debug_response($genericSuccessResponse, 200);
	}
}


/**
 * Constructs and sends the password reset email.
 */
function send_password_reset_email(string $email, string $username, string $token): void {
	$resetLink = APP_URL . '/login/reset-password.php?token=' . urlencode($token);
	$subject = 'Your MyDayHub Password Reset Request';
	$htmlBody = "
		<div style='font-family: sans-serif; line-height: 1.6;'>
			<h2>Password Reset for MyDayHub</h2>
			<p>Hello {$username},</p>
			<p>We received a request to reset your password. If you did not make this request, you can safely ignore this email.</p>
			<p>To reset your password, please click the link below:</p>
			<p style='margin: 20px 0;'>
				<a href='{$resetLink}' style='background-color: #8ab4f8; color: #202124; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>
					Reset Your Password
				</a>
			</p>
			<p>This link is valid for one hour.</p>
			<p>Thanks,<br>The MyDayHub Team</p>
		</div>
	";
	send_email($email, $username, $subject, $htmlBody);
}


/**
 * Handles the user registration process.
 */
function handle_register(?array $data): void {
	if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
		send_debug_response(['status' => 'error', 'message' => 'All fields are required.'], 400);
		return;
	}
	if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
		send_debug_response(['status' => 'error', 'message' => 'Please provide a valid email address.'], 400);
		return;
	}
	if (strlen($data['password']) < 8) {
		send_debug_response(['status' => 'error', 'message' => 'Password must be at least 8 characters long.'], 400);
		return;
	}
	try {
		$pdo = get_pdo();
		$stmt = $pdo->prepare("SELECT user_id FROM users WHERE username = :username OR email = :email");
		$stmt->execute([':username' => $data['username'], ':email' => $data['email']]);
		if ($stmt->fetch()) {
			send_debug_response(['status' => 'error', 'message' => 'Username or email is already taken.'], 409);
			return;
		}
		$password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
		if ($password_hash === false) {
			 throw new Exception('Password hashing failed.');
		}
		$stmt = $pdo->prepare(
			"INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)"
		);
		$stmt->execute([':username' => $data['username'], ':email' => $data['email'], ':password_hash' => $password_hash]);
		send_debug_response(['status' => 'success', 'message' => 'Registration successful! You can now log in.'], 201);
	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in auth.php handle_register(): ' . $e->getMessage());
		}
		send_debug_response(['status' => 'error', 'message' => 'A server error occurred. Please try again later.'], 500);
	}
}


/**
 * Handles the user login process. 
 */
function handle_login(?array $data): void {
	if (empty($data['username']) || empty($data['password'])) {
		send_debug_response(['status' => 'error', 'message' => 'Username and password are required.'], 400);
		return;
	}
	try {
		$pdo = get_pdo();
		$stmt = $pdo->prepare("SELECT user_id, username, password_hash FROM users WHERE username = :username");
		$stmt->execute([':username' => $data['username']]);
		$user = $stmt->fetch();
		if (!$user || !password_verify($data['password'], $user['password_hash'])) {
			send_debug_response(['status' => 'error', 'message' => 'Invalid credentials.'], 401);
			return;
		}
		session_regenerate_id(true);
		$_SESSION['user_id'] = $user['user_id'];
		$_SESSION['username'] = $user['username'];
		send_debug_response(['status' => 'success', 'message' => 'Login successful!'], 200);
	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in auth.php handle_login(): ' . $e->getMessage());
		}
		send_debug_response(['status' => 'error', 'message' => 'A server error occurred. Please try again later.'], 500);
	}
}


<?php
/**
 * Code for /api/api.php 
 *
 * MyDayHub - Main API Gateway
 *
 * This file is the single entry point for all data-related API calls.
 * It handles session security, request routing, and dispatches to module handlers.
 *
 * @version 6.6.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

// --- BOOTSTRAP ---
// config.php sets up error handling and the debug message collector.
require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';
// Modified for Debugging Hardening: Include the global helpers file.
require_once __DIR__ . '/../incs/helpers.php';


// --- SESSION SECURITY ---
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

if (!isset($_SESSION['user_id'])) {
	send_json_response(['status' => 'error', 'message' => 'Authentication required.'], 401);
}

// --- ROUTING ---
$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$data = [];

if ($method === 'GET') {
	$module = $_GET['module'] ?? null;
	$action = $_GET['action'] ?? null;
} elseif ($method === 'POST') {
	$csrf_token_header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
	if (!isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrf_token_header)) {
		send_json_response(['status' => 'error', 'message' => 'Invalid or missing CSRF token.'], 403);
	}

	$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

	if (stripos($contentType, 'application/json') !== false) {
		$json_data = file_get_contents('php://input');
		$input = json_decode($json_data, true) ?: [];
		$module = $input['module'] ?? null;
		$action = $input['action'] ?? null;
		$data = $input['data'] ?? $input;

	} elseif (stripos($contentType, 'multipart/form-data') !== false) {
		$module = $_POST['module'] ?? null;
		$action = $_POST['action'] ?? null;
		$data = $_POST['data'] ?? [];
		if (is_string($data)) {
			$decodedData = json_decode($data, true);
			if (json_last_error() === JSON_ERROR_NONE) {
				$data = $decodedData;
			}
		}
	} else {
		send_json_response(['status' => 'error', 'message' => 'Unsupported content type.'], 415);
	}
} else {
	send_json_response(['status' => 'error', 'message' => 'Method not allowed.'], 405);
}


if (!$module || !$action) {
	send_json_response(['status' => 'error', 'message' => 'Module and action are required.'], 400);
}

try {
	$pdo = get_pdo();

	switch ($module) {
		case 'tasks':
			require_once __DIR__ . '/tasks.php';
			handle_tasks_action($action, $method, $pdo, $userId, $data);
			break;

		case 'users':
			require_once __DIR__ . '/users.php';
			handle_users_action($action, $method, $pdo, $userId, $data);
			break;

		default:
			send_json_response(['status' => 'error', 'message' => "Module '{$module}' not found."], 404);
			break;
	}
} catch (Exception $e) {
	// Modified for In-Browser Debugging: Log the exception before sending the response.
	log_debug_message("API Gateway Exception: " . $e->getMessage());
	send_json_response(['status' => 'error', 'message' => 'An internal server error occurred.'], 500);
}