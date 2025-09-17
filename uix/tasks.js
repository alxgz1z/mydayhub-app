/**
 * code for /uix/tasks.js
 *
 * MyDayHub - Tasks View Module
 *
 * Handles fetching and rendering the task board, and all interactions
 * within the Tasks view.
 *
 * @version 6.9.1
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
			
			// Handle share badge specifically (for the task-share-badge class)
			const shareBadge = e.target.closest('.task-share-badge');
			if (shareBadge) {
				const taskCard = shareBadge.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
				if (taskId) {
					await openShareModal(parseInt(taskId, 10));
				}
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
			// Guard: if click happens inside Share modal, ignore (prevents dataset null crash)
			if (e.target.closest('#share-modal-overlay')) return;
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
				} else if (action === 'share') {
					if (taskId) {
						// close the menu to avoid stray clicks under the modal
						closeAllTaskActionMenus && closeAllTaskActionMenus();
						await openShareModal(parseInt(taskId, 10));
					}
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
		<button class="task-action-btn" data-action="share">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
				 stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="18" cy="5" r="3"></circle>
				<circle cx="6" cy="12" r="3"></circle>
				<circle cx="18" cy="19" r="3"></circle>
				<path d="M8.8 10.9l6.4-3.8M8.8 13.1l6.4 3.8"></path>
			</svg>
			<span>Share</span>
		</button>
		<button class="task-action-btn" data-action="${isSnoozed ? 'unsnooze' : 'snooze'}">
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			${isSnoozed ? '<path d="M6 2l3 3.5L12 2l3 3.5L18 2"/><path d="M6 16.5l3-3.5 3 3.5 3-3.5 3 3.5"/><polyline points="6 12 12 6 18 12"/>' : '<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M5 3L3 5"></path><path d="M19 3l2 2"></path>'}
			</svg>
				<span>${isSnoozed ? 'Remove Snooze' : 'Snooze Task'}</span>
			</button>
		<!--button class="task-action-btn" data-action="share">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
				 stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="18" cy="5" r="3"></circle>
				<circle cx="6" cy="12" r="3"></circle>
				<circle cx="18" cy="19" r="3"></circle>
				<path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49"></path>
			</svg>
			<span>Share…</span>
		</button-->
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
	// Modified for Classification Regression Fix - Added missing Signal and Support options
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
	const hasSharedIndicator = taskData.shares && taskData.shares.length > 0;
	const hasIndicators = taskData.has_notes || taskData.due_date || (taskData.attachments_count && taskData.attachments_count > 0) || hasSnoozeIndicator || hasSharedIndicator;
	
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

		let shareIndicator = '';
		if (taskData.shares && taskData.shares.length > 0) {
			// Get first recipient info for badge display
			const firstShare = taskData.shares[0];
			const recipientDisplay = (firstShare.username || firstShare.email || 'user').substring(0, 6);
			const shareCount = taskData.shares.length;
			const shareTitle = shareCount === 1 
				? `Shared with ${firstShare.username || firstShare.email}`
				: `Shared with ${shareCount} users`;
			
			shareIndicator = `
				<span class="task-indicator task-share-badge" data-action="open-share-modal" title="${shareTitle}">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="18" cy="5" r="3"></circle>
						<circle cx="6" cy="12" r="3"></circle>
						<circle cx="18" cy="19" r="3"></circle>
						<path d="M8.8 10.9l6.4-3.8M8.8 13.1l6.4 3.8"></path>
					</svg>
					<span class="share-recipient-text">${recipientDisplay}</span>
				</span>
			`;
		}

		footerHTML = `
			<div class="task-card-footer">
				${attachmentsIndicator}
				${snoozeIndicator}
				${notesIndicator}
				${dueDateIndicator}
				${shareIndicator}
			</div>
		`;
	}

	const isShared = taskData.shares && taskData.shares.length > 0;
	
	return `
	<div 
		class="task-card ${isCompleted ? 'completed' : ''} ${classificationClass} ${isPrivate ? 'private' : ''} ${isSnoozed ? 'snoozed' : ''} ${isShared ? 'shared' : ''}"
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
			data-shares='${JSON.stringify(taskData.shares || [])}'
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

// Modified for Sharing Foundation - Lightweight task card updates without full board reload
 async function openShareModal(taskId) {
	 // Single-instance guard - Enhanced to prevent duplication
	 const existing = document.getElementById('share-modal-overlay');
	 if (existing) {
		 existing.remove();
		 // Small delay to ensure cleanup completes
		 await new Promise(resolve => setTimeout(resolve, 50));
	 }
 
	 // 1) Load existing shares via the app's API wrapper (injects CSRF per spec)
	 let shares = [];
	 try {
		 const res = await window.apiFetch({
			 module: 'tasks',
			 action: 'listTaskShares',
			 data: { task_id: taskId }
		 });
		 const json = (res && typeof res.json === 'function') ? await res.json() : res;
		 if (json?.status === 'success') shares = json.data?.shares || [];
	 } catch (err) {
		 console.warn('listTaskShares error', err);
	 }
 
	 // 2) Build overlay (styled by style.css / tasks.css)
	 const overlay = document.createElement('div');
	 overlay.id = 'share-modal-overlay';
	 overlay.classList.add('hidden');
 
	 const rowsHtml = shares.map(s => `
		 <tr data-user-id="${s.user_id}">
			 <td>${s.username || ''}</td>
			 <td>${s.email || ''}</td>
			 <td>
				 <select class="perm-select">
					 <option value="view"${s.permission === 'view' ? ' selected' : ''}>View</option>
					 <option value="edit"${s.permission === 'edit' ? ' selected' : ''}>Edit</option>
				 </select>
			 </td>
			 <td><button class="btn-unshare" type="button" data-user-id="${s.user_id}">Unshare</button></td>
		 </tr>
	 `).join('');
 
	 overlay.innerHTML = `
		 <div id="share-modal-container" role="dialog" aria-modal="true" aria-label="Share Task">
			 <button class="modal-close-btn" type="button" aria-label="Close">×</button>
			 <h3>Share Task</h3>
 
			 <div class="share-add">
				 <label>Recipient (email or username)</label>
				 <input type="text" id="share-ident" placeholder="user@example.com or username" />
				 <label>Permission</label>
				 <select id="share-perm">
					 <option value="edit">Edit</option>
					 <option value="view">View</option>
				 </select>
				 <button id="btn-share-add" type="button">Add</button>
			 </div>
 
			 <div class="share-list">
				 <h4>Current Access</h4>
				 <table class="table-shares">
					 <thead><tr><th>User</th><th>Email</th><th>Permission</th><th></th></tr></thead>
					 <tbody>${rowsHtml || '<tr><td colspan="4">No one else has access.</td></tr>'}</tbody>
				 </table>
			 </div>
		 </div>
	 `;
 
	 document.body.appendChild(overlay);
	 requestAnimationFrame(() => overlay.classList.remove('hidden'));
 
	 // Helper function to update only the specific task card's share data
	 const updateTaskCardShares = async () => {
		 try {
			 // Fetch fresh share data for just this task
			 const res = await window.apiFetch({
				 module: 'tasks',
				 action: 'listTaskShares', 
				 data: { task_id: taskId }
			 });
			 const json = (res && typeof res.json === 'function') ? await res.json() : res;
			 const freshShares = json?.status === 'success' ? (json.data?.shares || []) : [];
			 
			 // Update the task card's dataset and re-render just that card
			 const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
			 if (taskCard) {
				 // Modified for Share Badge Fix - Ensure shares data is properly updated
				 taskCard.dataset.shares = JSON.stringify(freshShares);
				 
				 // Force re-render by updating the task data object used by getTaskDataFromElement
				 const currentTaskData = getTaskDataFromElement(taskCard);
				 currentTaskData.shares = freshShares; // Add the fresh shares data
				 
				 // Create new task card HTML with updated data
				 const tempDiv = document.createElement('div');
				 tempDiv.innerHTML = createTaskCard(currentTaskData);
				 const newCardEl = tempDiv.firstElementChild;
				 
				 // Replace the old card with the new one
				 taskCard.replaceWith(newCardEl);
			 }
		 } catch (err) {
			 console.error('Failed to update task card shares:', err);
		 }
	 };
 
	 // Close + bubble control
	 const close = () => overlay.remove();
	 overlay.addEventListener('click', close);
	 const panel = overlay.querySelector('#share-modal-container');
	 panel?.addEventListener('click', (ev) => ev.stopPropagation());
	 overlay.querySelector('.modal-close-btn')?.addEventListener('click', close);
 
	 // Modified for Lightweight Updates - Share handler without full reload
	 overlay.querySelector('#btn-share-add')?.addEventListener('click', async () => {
		 const recipient_identifier = overlay.querySelector('#share-ident')?.value.trim();
		 const permission = overlay.querySelector('#share-perm')?.value === 'view' ? 'view' : 'edit';
		 if (!recipient_identifier) return;
 
		 try {
			 const res = await window.apiFetch({
				 module: 'tasks',
				 action: 'shareTask',
				 data: { task_id: taskId, recipient_identifier, permission }
			 });
			 
			 let json;
			 if (res && typeof res.json === 'function') {
				 const responseText = await res.text();
				 try {
					 json = JSON.parse(responseText);
				 } catch (parseError) {
					 console.error('JSON Parse Error:', parseError);
					 showToast({ message: 'Server returned invalid response.', type: 'error' });
					 return;
				 }
			 } else {
				 json = res;
			 }
			 
			 if (json?.status === 'success') {
				 // Update task card without full reload
				 await updateTaskCardShares();
				 
				 // Clear the input and refresh the modal list
				 overlay.querySelector('#share-ident').value = '';
				 
				 // Refresh just the modal's share list
				 const freshRes = await window.apiFetch({
					 module: 'tasks',
					 action: 'listTaskShares',
					 data: { task_id: taskId }
				 });
				 const freshJson = (freshRes && typeof freshRes.json === 'function') ? await freshRes.json() : freshRes;
				 const freshShares = freshJson?.status === 'success' ? (freshJson.data?.shares || []) : [];
				 
				 // Update the table body
				 const tbody = overlay.querySelector('.table-shares tbody');
				 if (tbody) {
					 const newRowsHtml = freshShares.map(s => `
						 <tr data-user-id="${s.user_id}">
							 <td>${s.username || ''}</td>
							 <td>${s.email || ''}</td>
							 <td>
								 <select class="perm-select">
									 <option value="view"${s.permission === 'view' ? ' selected' : ''}>View</option>
									 <option value="edit"${s.permission === 'edit' ? ' selected' : ''}>Edit</option>
								 </select>
							 </td>
							 <td><button class="btn-unshare" type="button" data-user-id="${s.user_id}">Unshare</button></td>
						 </tr>
					 `).join('');
					 tbody.innerHTML = newRowsHtml || '<tr><td colspan="4">No one else has access.</td></tr>';
				 }
				 
				 showToast({ message: 'Task shared successfully.', type: 'success' });
			 } else {
				 showToast({ message: json?.message || 'Failed to share task.', type: 'error' });
			 }
		 } catch (err) {
			 showToast({ message: 'Server error while sharing task.', type: 'error' });
			 console.error('Share task error:', err);
		 }
	 });
 
	 // Modified for Lightweight Updates - Unshare handler without modal duplication
	 overlay.querySelector('.table-shares')?.addEventListener('click', async (e) => {
		 const btn = e.target.closest('.btn-unshare');
		 if (!btn) return;
		 const recipient_user_id = parseInt(btn.dataset.userId, 10);
		 if (!recipient_user_id) return;
 
		 try {
			 const res = await window.apiFetch({
				 module: 'tasks',
				 action: 'unshareTask',
				 data: { task_id: taskId, recipient_user_id }
			 });
			 const json = (res && typeof res.json === 'function') ? await res.json() : res;
			 
			 if (json?.status === 'success') {
				 // Remove the row from the current modal immediately
				 btn.closest('tr')?.remove();
				 
				 // Update the task card without closing the modal
				 await updateTaskCardShares();
				 
				 // Check if table is now empty and update accordingly
				 const remainingRows = overlay.querySelectorAll('.btn-unshare').length;
				 if (remainingRows === 0) {
					 const tbody = overlay.querySelector('.table-shares tbody');
					 if (tbody) {
						 tbody.innerHTML = '<tr><td colspan="4">No one else has access.</td></tr>';
					 }
				 }
				 
				 showToast({ message: 'Access removed successfully.', type: 'success' });
			 } else {
				 showToast({ message: json?.message || 'Failed to remove access.', type: 'error' });
			 }
		 } catch (err) {
			 showToast({ message: 'Server error while removing access.', type: 'error' });
			 console.error('Unshare task error:', err);
		 }
	 });
 }

// Initial load
document.addEventListener('DOMContentLoaded', initTasksView);