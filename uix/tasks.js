/**
 * MyDayHub Beta 5 - Tasks View Module
 *
 * Handles fetching and rendering the task board, and all interactions
 * within the Tasks view.
 *
 * @version 5.5.1
 * @author Alex & Gemini
 */

let dragSourceColumn = null;

let filterState = {
	showCompleted: false
};

let userStorage = { used: 0, quota: 50 * 1024 * 1024 }; 

let isImageViewerOpen = false;

let isModalOpening = false; 

// Modified for Privacy Bug Fix
let isActionRunning = false;

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
		// Modified for Privacy Feature
		is_private: taskCardEl.dataset.isPrivate === 'true',
		due_date: taskCardEl.dataset.dueDate || null,
		has_notes: taskCardEl.dataset.hasNotes === 'true',
		attachments_count: parseInt(taskCardEl.dataset.attachmentsCount || '0', 10),
		updated_at: taskCardEl.dataset.updatedAt
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
	const newCardHTML = createTaskCard(taskData);
	const newCardEl = document.createElement('div');
	newCardEl.innerHTML = newCardHTML;
	const finalCard = newCardEl.firstElementChild;
	taskCard.replaceWith(finalCard);
	
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
		showToast('Editor component is not available.', 'error');
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
 * Sets up the main event listeners for the tasks view.
 */
function initEventListeners() {
	document.addEventListener('click', (e) => {
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
				const input = e.target;
				const taskTitle = input.value.trim();
				const columnEl = input.closest('.task-column');
				const columnId = columnEl.dataset.columnId;

				if (taskTitle && columnId) {
					await createNewTask(columnId, taskTitle, columnEl);
					input.value = '';
				}
			}
		});

		boardContainer.addEventListener('change', async (e) => {
			if (e.target.matches('.task-checkbox')) {
				const checkbox = e.target;
				const taskCard = checkbox.closest('.task-card');
				const taskId = taskCard.dataset.taskId;

				if (taskId) {
					toggleTaskComplete(taskId, checkbox.checked);
				}
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
				}
				return;
			}
			
			if (e.target.matches('.task-status-band')) {
				const taskCard = e.target.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
				if (taskId) {
					toggleTaskClassification(taskId, taskCard);
				}
				return;
			}
			
			const privacyBtn = e.target.closest('.btn-toggle-column-privacy');
			if (privacyBtn) {
				const columnEl = privacyBtn.closest('.task-column');
				const columnId = columnEl.dataset.columnId;
				if (columnId) {
					await togglePrivacy('column', columnId);
				}
				return;
			}

			const deleteBtn = e.target.closest('.btn-delete-column');
			if (deleteBtn) {
				const columnEl = deleteBtn.closest('.task-column');
				const columnId = columnEl.dataset.columnId;
				
				const confirmed = await showConfirm('Are you sure you want to delete this column and all of its tasks? This cannot be undone.');

				if (confirmed && columnId) {
					const success = await deleteColumn(columnId);
					if (success) {
						columnEl.remove();
						updateMoveButtonVisibility();
						showToast('Column deleted.', 'success');
					} else {
						showToast('Error: Could not delete the column.', 'error');
					}
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
					showToast('Error: Could not save new column order.', 'error');
					fetchAndRenderBoard();
				}
				return;
			}
			
			const actionsBtn = e.target.closest('.btn-task-actions');
			if (actionsBtn) {
				showTaskActionsMenu(actionsBtn);
				return;
			}
		});
		
		// Modified for Privacy Bug Fix
		document.body.addEventListener('click', async (e) => {
			const actionButton = e.target.closest('.task-action-btn');
			if (!actionButton || isActionRunning) return;

			isActionRunning = true;
			try {
				e.stopPropagation();
		
				const menu = actionButton.closest('.task-actions-menu');
				// Add a defensive guard to prevent crash if menu disappears
				if (!menu) return;

				const taskId = menu.dataset.taskId;
				const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
				const columnEl = taskCard.closest('.task-column');
				const action = actionButton.dataset.action;
		
				closeAllTaskActionMenus();
		
				if (action === 'cycle-classification') {
					if (taskId && taskCard) {
						await toggleTaskClassification(taskId, taskCard);
					}
				} else if (action === 'edit-notes') {
					openNotesEditorForTask(taskCard);
				} else if (action === 'set-due-date') {
					await openDueDateModalForTask(taskCard);
				} else if (action === 'toggle-privacy') {
					if (taskId) {
						await togglePrivacy('task', taskId);
					}
				} else if (action === 'attachments') {
					const taskTitle = decodeURIComponent(taskCard.dataset.title);
					await openAttachmentsModal(taskId, taskTitle);
				} else if (action === 'delete') {
					const confirmed = await showConfirm('Are you sure you want to delete this task?');
					if (confirmed && taskId) {
						const success = await deleteTask(taskId);
						if (success) {
							taskCard.remove();
							updateColumnTaskCount(columnEl);
							showToast('Task deleted.', 'success');
						} else {
							showToast('Error: Could not delete task.', 'error');
						}
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
							showToast('Task duplicated successfully.', 'success');
						} else {
							showToast('Error: Could not duplicate the task.', 'error');
						}
					}
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
						showToast('Column renamed.', 'success');
					} else {
						titleEl.textContent = originalTitle;
						showToast('Error: Could not rename column.', 'error');
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
						showToast('Task renamed.', 'success');
					} else {
						titleEl.textContent = originalTitle;
						showToast('Error: Could not rename task.', 'error');
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

		boardContainer.addEventListener('dragstart', (e) => {
			if (e.target.matches('.task-card')) {
				e.target.classList.add('dragging');
				dragSourceColumn = e.target.closest('.task-column');
			}
		});

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
			}
			dragSourceColumn = null;
		});

		boardContainer.addEventListener('dragover', (e) => {
			const columnBody = e.target.closest('.column-body');
			if (columnBody) {
				e.preventDefault();
				const draggingCard = document.querySelector('.dragging');
				const afterElement = getDragAfterElement(columnBody, e.clientY);
				if (afterElement == null) {
					columnBody.appendChild(draggingCard);
				} else {
					columnBody.insertBefore(draggingCard, afterElement);
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
 * Saves a filter preference to the backend. Fire-and-forget.
 */
async function saveFilterPreference(key, value) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'users',
				action: 'saveUserPreference',
				data: { key: key, value: value }
			})
		});
		const result = await response.json();
		if (result.status !== 'success') {
			console.error('Failed to save filter preference:', result.message);
		}
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

	menu.innerHTML = `
		<div class="filter-item">
			<span class="filter-label">Show Completed Tasks</span>
			<label class="switch">
				<input type="checkbox" data-filter="showCompleted" ${showCompletedChecked}>
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
			saveFilterPreference('filter_show_completed', value);
		}
	});
}

/**
 * Applies all active filters to the task cards on the board.
 */
function applyAllFilters() {
	const taskCards = document.querySelectorAll('.task-card');
	taskCards.forEach(card => {
		const isCompleted = card.classList.contains('completed');
		
		let shouldBeVisible = true;

		if (isCompleted && !filterState.showCompleted) {
			shouldBeVisible = false;
		}

		card.style.display = shouldBeVisible ? 'flex' : 'none';
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
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'saveTaskDetails',
				data: {
					task_id: taskId,
					dueDate: newDate
				}
			})
		});
		const result = await response.json();
		if (result.status === 'success') {
			showToast('Due date updated.', 'success');
			return true;
		} else {
			throw new Error(result.message || 'Failed to update due date.');
		}
	} catch (error) {
		showToast(error.message, 'error');
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
 * Gets the numerical rank of a task card based on its classification.
 */
const getTaskRank = (taskEl) => {
	if (taskEl.classList.contains('completed')) return 3;
	if (taskEl.classList.contains('classification-signal')) return 0;
	if (taskEl.classList.contains('classification-support')) return 1;
	if (taskEl.classList.contains('classification-noise')) return 2;
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
	const privacyText = isPrivate ? 'Make Public' : 'Make Private';
	const privacyIcon = isPrivate 
		? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
		: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

	menu.innerHTML = `
		<button class="task-action-btn" data-action="cycle-classification">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="6 15 12 21 18 15"></polyline>
				<polyline points="18 9 12 3 6 9"></polyline>
			</svg>
			<span>Cycle Classification</span>
		</button>
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
	const columns = document.querySelectorAll('.task-column');
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
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'duplicateTask',
				data: { task_id: taskId }
			})
		});
		const result = await response.json();
		if (result.status === 'success') {
			return result.data;
		}
		return null;
	} catch (error) {
		console.error('Duplicate task error:', error);
		return null;
	}
}


/**
 * Sends a request to delete a task.
 */
async function deleteTask(taskId) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'deleteTask',
				data: { task_id: taskId }
			})
		});
		const result = await response.json();
		return result.status === 'success';
	} catch (error) {
		console.error('Delete task error:', error);
		return false;
	}
}

/**
 * Sends a request to save the new order of all columns.
 */
async function reorderColumns(orderedColumnIds) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'reorderColumns',
				data: { column_ids: orderedColumnIds }
			})
		});
		const result = await response.json();
		return result.status === 'success';
	} catch (error) {
		console.error('Reorder columns error:', error);
		return false;
	}
}

/**
 * Sends a request to delete a column.
 */
async function deleteColumn(columnId) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'deleteColumn',
				data: { column_id: columnId }
			})
		});
		const result = await response.json();
		return result.status === 'success';
	} catch (error) {
		console.error('Delete column error:', error);
		return false;
	}
}

/**
 * Sends a request to rename a column.
 */
async function renameColumn(columnId, newName) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'renameColumn',
				data: {
					column_id: columnId,
					new_name: newName
				}
			})
		});
		const result = await response.json();
		return result.status === 'success';
	} catch (error) {
		console.error('Rename column error:', error);
		return false;
	}
}

/**
 * Sends a request to rename a task's title.
 */
async function renameTaskTitle(taskId, newTitle) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'renameTaskTitle',
				data: {
					task_id: taskId,
					new_title: newTitle
				}
			})
		});
		const result = await response.json();
		return result.status === 'success';
	} catch (error) {
		console.error('Rename task title error:', error);
		return false;
	}
}


/**
 * Sends the new order of tasks to the API.
 */
async function reorderTasks(columnId, tasks) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'reorderTasks',
				data: {
					column_id: columnId,
					tasks: tasks
				}
			})
		});

		const result = await response.json();

		if (result.status !== 'success') {
			showToast(`Error: ${result.message}`, 'error');
			return false;
		}
		return true;
	} catch (error) {
		showToast('A network error occurred. Please try again.', 'error');
		console.error('Reorder tasks error:', error);
		return false;
	}
}

/**
 * Toggles the privacy status of a task or column.
 */
async function togglePrivacy(type, id) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'togglePrivacy',
				data: { type, id }
			})
		});
		const result = await response.json();
		if (result.status === 'success') {
			const { is_private } = result.data;
			const selector = type === 'task' ? `.task-card[data-task-id="${id}"]` : `.task-column[data-column-id="${id}"]`;
			const element = document.querySelector(selector);
			
			if (element) {
				element.classList.toggle('private', is_private);
				element.dataset.isPrivate = is_private;

				const privacyBtnText = is_private ? 'Make Public' : 'Make Private';
				showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} set to ${is_private ? 'private' : 'public'}.`, 'success');

				if (type === 'column') {
					const btn = element.querySelector('.btn-toggle-column-privacy');
					if (btn) btn.title = privacyBtnText;
				}
			}
		} else {
			throw new Error(result.message || `Failed to toggle privacy for ${type}.`);
		}
	} catch (error) {
		showToast(error.message, 'error');
		console.error('Toggle privacy error:', error);
	}
}


/**
 * Toggles a task's completion status.
 */
async function toggleTaskComplete(taskId, isComplete) {
	const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'toggleComplete',
				data: { task_id: taskId }
			})
		});

		const result = await response.json();

		if (result.status === 'success') {
			taskCard.classList.toggle('completed', isComplete);
			taskCard.dataset.classification = result.data.new_classification;
			
			if (isComplete) {
				taskCard.classList.remove('classification-signal', 'classification-support', 'classification-noise');
			} else {
				taskCard.classList.add(`classification-${result.data.new_classification}`);
			}
			sortTasksInColumn(taskCard.closest('.column-body'));
			rerenderTaskCard(taskCard);
			applyAllFilters();
		} else {
			showToast(`Error: ${result.message}`, 'error');
			taskCard.querySelector('.task-checkbox').checked = !isComplete;
		}
	} catch (error) {
		showToast('A network error occurred. Please try again.', 'error');
		taskCard.querySelector('.task-checkbox').checked = !isComplete;
		console.error('Toggle complete error:', error);
	}
}

/**
 * Cycles a task's classification by calling the API and updating the UI.
 */
async function toggleTaskClassification(taskId, taskCardEl) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'toggleClassification',
				data: { task_id: taskId }
			})
		});

		const result = await response.json();

		if (result.status === 'success') {
			const newClassification = result.data.new_classification;
			taskCardEl.dataset.classification = newClassification;
			taskCardEl.classList.remove('classification-signal', 'classification-support', 'classification-noise');
			taskCardEl.classList.add(`classification-${newClassification}`);
			sortTasksInColumn(taskCardEl.closest('.column-body'));
		} else {
			showToast(`Error: ${result.message}`, 'error');
		}
	} catch (error) {
		showToast('A network error occurred while updating classification.', 'error');
		console.error('Toggle classification error:', error);
	}
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
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/api.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						module: 'tasks',
						action: 'createColumn',
						data: { column_name: columnName }
					})
				});

				const result = await response.json();

				if (result.status === 'success') {
					const boardContainer = document.getElementById('task-board-container');
					
					const placeholder = boardContainer.querySelector('p');
					if (placeholder && placeholder.textContent.startsWith('No columns found')) {
						placeholder.remove();
					}

					const newColumnEl = createColumnElement(result.data);
					boardContainer.appendChild(newColumnEl);
					updateMoveButtonVisibility(); 
					showToast('Column created.', 'success');
				} else {
					showToast(`Error: ${result.message}`, 'error');
				}
			} catch (error) {
				showToast('A network error occurred. Please try again.', 'error');
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
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'createTask',
				data: {
					column_id: columnId,
					task_title: taskTitle
				}
			})
		});

		const result = await response.json();

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
			showToast('Task created.', 'success');
		} else {
			showToast(`Error: ${result.message}`, 'error');
		}
	} catch (error) {
		showToast('A network error occurred while creating the task.', 'error');
		console.error('Create task error:', error);
	}
}


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

			if (userPrefs && userPrefs.editor_font_size) {
				container.dataset.editorFontSize = userPrefs.editor_font_size;
			}
			
			if (userPrefs && typeof userPrefs.filter_show_completed !== 'undefined') {
				filterState.showCompleted = userPrefs.filter_show_completed;
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
			<h2 class="column-title">${columnData.column_name}</h2>
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
	let classificationClass = '';
	if (!isCompleted) {
		classificationClass = `classification-${taskData.classification}`;
	}
	
	let footerHTML = '';
	const hasIndicators = taskData.has_notes || taskData.due_date || (taskData.attachments_count && taskData.attachments_count > 0);

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
				${notesIndicator}
				${dueDateIndicator}
			</div>
		`;
	}

	return `
		<div 
			class="task-card ${isCompleted ? 'completed' : ''} ${classificationClass} ${isPrivate ? 'private' : ''}" 
			data-task-id="${taskData.task_id}" 
			data-title="${encodeURIComponent(taskTitle)}"
			data-notes="${encodeURIComponent(taskNotes)}"
			data-classification="${taskData.classification}"
			data-is-private="${isPrivate}"
			data-has-notes="${taskData.has_notes}"
			data-updated-at="${taskData.updated_at || ''}"
			data-due-date="${taskData.due_date || ''}"
			data-attachments-count="${taskData.attachments_count || 0}"
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
// Modified for Storage Bar
async function deleteAttachment(attachmentId) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				module: 'tasks',
				action: 'deleteAttachment',
				data: { attachment_id: attachmentId }
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			let errorJson;
			try {
				errorJson = JSON.parse(errorText);
			} catch (e) {
				throw new Error(`Server returned status ${response.status}`);
			}
			throw new Error(errorJson.message || `Server returned status ${response.status}`);
		}

		const result = await response.json();
		if (result.status === 'success') {
			showToast('Attachment deleted.', 'success');
			return result.data; // Return data on success
		} else {
			throw new Error(result.message || 'Failed to delete attachment.');
		}
	} catch (error) {
		showToast(error.message, 'error');
		console.error('Delete attachment error:', error);
		return null; // Return null on failure
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
		showToast(error.message, 'error');
		console.error('Get attachments error:', error);
		return null;
	}
}

/**
 * Uploads a single file attachment for a task.
 */
// Modified for Storage Bar
async function uploadAttachment(taskId, file) {
	const formData = new FormData();
	formData.append('module', 'tasks');
	formData.append('action', 'uploadAttachment');
	formData.append('task_id', taskId);
	formData.append('attachment', file);

	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			body: formData
		});
		const result = await response.json();
		
		if (result.status === 'success') {
			return result.data; // Return data on success
		} else {
			showToast(`Upload failed for ${file.name}: ${result.message}`, 'error');
			return null;
		}
	} catch (error) {
		showToast(`A network error occurred uploading ${file.name}.`, 'error');
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

// Modified for Storage Bar
/**
 * Updates the UI for the storage quota bar and text.
 * @param {number} usedBytes - The number of bytes used.
 * @param {number} quotaBytes - The total quota in bytes.
 */
function updateStorageBar(usedBytes, quotaBytes) {
	// Modified for delete attachment bug fix
	// Add a defensive check to prevent crashes if the API returns a non-numeric value.
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
// Modified for UI Polish (All 3 issues)
async function openAttachmentsModal(taskId, taskTitle) {
	if (isModalOpening) return;
	isModalOpening = true;

	try {
		const modalOverlay = document.getElementById('attachments-modal-overlay');
		const modalTitle = document.getElementById('attachments-modal-title');
		const listContainer = document.getElementById('attachment-list');
		const dropZone = document.getElementById('attachment-drop-zone');
		// Modified for listener fix: Use new button ID
		const btnBrowse = document.getElementById('btn-browse-files');
		const fileInput = document.getElementById('attachment-file-input');
		// Modified for listener fix: Get reference to the static upload button
		const btnUploadStaged = document.getElementById('btn-upload-staged');
		
		// Modified for listener fix: Check for the new button ID
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
		
		// Modified for listener fix: Remove dynamic button creation logic as it's now in index.php
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
				// Modified for listener fix: Update text content of the button
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

			const uploadPromises = stagedFiles.map(file => uploadAttachment(taskId, file));
			const results = await Promise.all(uploadPromises);
			
			const lastSuccessfulResult = results.filter(r => r !== null).pop();
			if (lastSuccessfulResult) {
				userStorage.used = lastSuccessfulResult.user_storage_used;
				updateStorageBar(userStorage.used, userStorage.quota);
			}

			stagedFiles = [];
			renderStagedFiles();
			await refreshAttachmentList();

			btnUploadStaged.disabled = false;
			showToast('Uploads complete.', 'success');
		};

		const handleDeleteAttachmentClick = async (e) => {
			const deleteBtn = e.target.closest('.btn-delete-attachment');
			if (deleteBtn) {
				e.preventDefault();
				e.stopPropagation();
				const attachmentId = deleteBtn.dataset.attachmentId;
				const confirmed = await showConfirm('Are you sure you want to permanently delete this attachment?');
				if (confirmed) {
					const result = await deleteAttachment(attachmentId);
					if (result) {
						userStorage.used = result.user_storage_used;
						updateStorageBar(userStorage.used, userStorage.quota);
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
			// Modified for listener fix: Use new button ID for removing listener
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
		
		// Modified for listener fix: Use new button ID for adding listener
		btnBrowse.addEventListener('click', handleBrowseClick);
		fileInput.addEventListener('change', handleFileChange);
		btnUploadStaged.addEventListener('click', handleUploadStaged);
		listContainer.addEventListener('click', handleDeleteAttachmentClick);
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
			dropZone.addEventListener(eventName, preventDefaults, false);
			document.body.addEventListener(eventName, preventDefaults, false);
		});
		dropZone.addEventListener('dragenter', handleDragEnter, false);
		dropZone.addEventListener('dragleave', handleDragLeave, false);
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
// Modified for Escape Key Bug
function openAttachmentViewer(fileUrl, filename) {
	isImageViewerOpen = true; // Set the flag
	const viewerOverlay = document.getElementById('attachment-viewer-modal-overlay');
	const contentContainer = document.getElementById('attachment-viewer-content');
	const viewerCloseBtn = document.getElementById('attachment-viewer-close-btn');

	if (!viewerOverlay || !contentContainer || !viewerCloseBtn) {
		console.error('Attachment viewer elements not found.');
		isImageViewerOpen = false; // Reset flag on error
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
// Modified for Escape Key Bug
function closeAttachmentViewer() {
	const viewerOverlay = document.getElementById('attachment-viewer-modal-overlay');
	if (viewerOverlay) {
		viewerOverlay.classList.add('hidden');
		const contentContainer = document.getElementById('attachment-viewer-content');
		if (contentContainer) {
			contentContainer.innerHTML = '';
		}
	}
	isImageViewerOpen = false; // Reset the flag
}


// Initial load
document.addEventListener('DOMContentLoaded', initTasksView);