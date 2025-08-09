/**
 * MyDayHub 4.0.0 Beta - Tasks View Module
 *
 * Contains all logic specific to the Tasks Board view, including
 * creating columns, adding tasks, drag-and-drop, etc.
 */

// Module-level state variables
let taskToMoveId = null;

/**
 * =========================================================================
 * API & DATA HANDLING FUNCTIONS
 * =========================================================================
 */

/**
 * Fetches the entire board structure (columns and tasks) from the API.
 */
async function fetchAndRenderBoard() {
	try {
		const response = await fetch('/api/api.php', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				module: 'tasks',
				action: 'getAll'
			})
		});

		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}

		const result = await response.json();

		if (result.status === 'success') {
			renderBoard(result.data);
		} else {
			throw new Error(result.message || 'Failed to fetch board data.');
		}

	} catch (error) {
		console.error('Error fetching board data:', error);
		// You could show an error message to the user here
		const taskColumnsWrapper = document.getElementById('task-columns-wrapper');
		if (taskColumnsWrapper) {
			taskColumnsWrapper.innerHTML = `<p class="error-message">Could not load board. Please try again later.</p>`;
		}
	}
}

/**
 * Renders the entire board from the data provided by the API.
 * @param {Array} boardData - An array of column objects, each with a nested array of task objects.
 */
function renderBoard(boardData) {
	const taskColumnsWrapper = document.getElementById('task-columns-wrapper');
	if (!taskColumnsWrapper) return;

	taskColumnsWrapper.innerHTML = ''; // Clear any existing content

	boardData.forEach(columnData => {
		// Add the column to the board
		addColumnToBoard(columnData.column_name, columnData.column_id);
		const newColumnEl = taskColumnsWrapper.lastElementChild;
		if (newColumnEl) {
			const cardBody = newColumnEl.querySelector('.card-body');
			if (cardBody && columnData.tasks) {
				// Add all tasks to the column
				columnData.tasks.forEach(taskData => {
					const taskCardHTML = createTaskCard(taskData);
					cardBody.insertAdjacentHTML('beforeend', taskCardHTML);
				});
			}
		}
	});
}


/**
 * =========================================================================
 * CORE TASK VIEW FUNCTIONS
 * =========================================================================
 */

/**
 * Creates the HTML for a column and adds it to the DOM.
 * @param {string} title - The title of the column.
 * @param {number} columnId - The database ID of the column.
 */
const addColumnToBoard = (title, columnId) => {
	const taskColumnsWrapper = document.getElementById('task-columns-wrapper');
	if (!taskColumnsWrapper) return;
	const newColumnHTML = `
		<div class="task-column" id="column-${columnId}">
			<div class="card-header">
				<span class="column-title">${title}</span>
				<span class="task-count">0</span>
				<div class="column-controls">
					<button class="btn-icon btn-column-actions" title="Column Actions">&#8230;</button>
				</div>
			</div>
			<div class="card-body"></div>
			<div class="card-footer">
				<button class="btn-add-task">+ New Task</button>
			</div>
		</div>
	`;
	taskColumnsWrapper.insertAdjacentHTML('beforeend', newColumnHTML);
};

/**
 * Creates the HTML for a single task card from a data object.
 * @param {object} task - The task data object from the API.
 * @returns {string} The HTML string for the task card.
 */
const createTaskCard = (task) => {
	const taskId = `task-${task.task_id}`;
	// Use the title from the decoded 'data' object
	const title = task.data.title || 'Untitled Task';
	const statusClass = task.status === 'priority' ? 'high-priority' : task.status === 'completed' ? 'completed' : '';

	return `
		<div class="task-card ${statusClass}" id="${taskId}" draggable="true" data-notes="" data-due-date="">
			<div class="task-status-band"></div>
			<div class="task-card-main-content">
				<div class="task-card-content">
					<input type="checkbox" class="task-complete-checkbox" title="Mark as complete" ${task.status === 'completed' ? 'checked' : ''}>
					<span class="task-title">${title}</span>
					<button class="btn-task-actions" title="Task Actions">&#8230;</button>
				</div>
				<div class="task-meta-indicators"></div>
			</div>
		</div>
	`;
};


/**
 * UPDATED: Renamed function and updated its logic to generate the new badge structure
 * that the new CSS rules target.
 * @param {HTMLElement} taskCardEl - The task card element to update.
 */
const updateTaskCardIndicators = (taskCardEl) => {
	if (!taskCardEl) return;
	const indicatorsContainer = taskCardEl.querySelector('.task-meta-indicators');
	if (!indicatorsContainer) return;

	indicatorsContainer.innerHTML = ''; // Clear existing indicators

	const notes = taskCardEl.dataset.notes;
	if (notes && notes.trim() !== '') {
		indicatorsContainer.innerHTML += `
			<span class="meta-indicator" title="This task has notes">
				<span class="icon">📝</span>
			</span>`;
	}

	const dueDate = taskCardEl.dataset.dueDate;
	if (dueDate) {
		indicatorsContainer.innerHTML += `
			<span class="meta-indicator" title="Due Date: ${dueDate}">
				<span class="icon">📅</span>
				${dueDate}
			</span>`;
	}
};

const initDragAndDrop = () => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;
	taskBoard.addEventListener('dragstart', (event) => {
		closeAllQuickActionsMenus();
		closeAllColumnActionMenus();
		if (event.target.classList.contains('task-card')) {
			event.target.classList.add('dragging');
		}
	});
	taskBoard.addEventListener('dragend', (event) => {
		if (event.target.classList.contains('task-card')) {
			event.target.classList.remove('dragging');
			const columnBody = event.target.closest('.card-body');
			sortTasksInColumn(columnBody);
		}
	});
	taskBoard.addEventListener('dragover', (event) => {
		const dropZone = event.target.closest('.card-body');
		if (dropZone) {
			event.preventDefault();
			const draggingCard = document.querySelector('.dragging');
			if (!draggingCard) return;
			const afterElement = getDragAfterElement(dropZone, event.clientY);
			if (afterElement == null) {
				dropZone.appendChild(draggingCard);
			} else {
				dropZone.insertBefore(draggingCard, afterElement);
			}
		}
	});
};

const closeAllQuickActionsMenus = () => {
	document.querySelectorAll('.quick-actions-menu').forEach(menu => menu.remove());
};

const showQuickActionsMenu = (buttonEl) => {
	closeAllQuickActionsMenus();
	const taskCard = buttonEl.closest('.task-card');
	if (!taskCard) return;
	const menu = document.createElement('div');
	menu.className = 'quick-actions-menu';
	menu.dataset.taskId = taskCard.id;

	menu.innerHTML = `
		<button class="quick-action-btn" data-action="toggle-high-priority" title="Change Priority"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5a9.5 9.5 0 1 0 6.72 2.78"/><path d="M12 8v4l2 1"/><path d="M15.5 2.5V6h-3.5"/></svg></button>
		<button class="quick-action-btn" data-action="edit-task" title="Edit Note and Due Date"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
		<button class="quick-action-btn" data-action="start-move" title="Move"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m0 14-4-4m4 4 4-4M5 12h14M5 12l4-4M5 12l4 4"/></svg></button>
		<button class="quick-action-btn" data-action="share-task" title="Share"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98m0-9.98-6.83 3.98"/></svg></button>
		<button class="quick-action-btn" data-action="make-private" title="Mark as Private"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></button>
		<button class="quick-action-btn" data-action="duplicate-task" title="Duplicate"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
		<button class="quick-action-btn" data-action="delete-task" title="Delete"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
	`;

	document.body.appendChild(menu);
	const btnRect = buttonEl.getBoundingClientRect();
	menu.style.top = `${window.scrollY + btnRect.bottom + 5}px`;
	menu.style.left = `${window.scrollX + btnRect.right - menu.offsetWidth}px`;
	setTimeout(() => menu.classList.add('visible'), 10);
};

const sortTasksInColumn = (columnBody) => {
	if (!columnBody) return;
	const tasks = Array.from(columnBody.querySelectorAll('.task-card'));
	tasks.sort((a, b) => {
		const aCompleted = a.classList.contains('completed');
		const bCompleted = b.classList.contains('completed');
		const aPriority = a.classList.contains('high-priority');
		const bPriority = b.classList.contains('high-priority');
		if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
		if (aPriority !== bPriority) return aPriority ? -1 : 1;
		return 0; // Maintain original order for same-status tasks
	}).forEach(task => columnBody.appendChild(task));
};

const getDragAfterElement = (container, y) => {
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
};

const showAddTaskForm = (footer) => {
	const originalButtonHTML = footer.innerHTML;
	footer.innerHTML = `<form class="add-task-form"><input type="text" class="form-control" placeholder="Enter task title..." autofocus></form>`;
	const form = footer.querySelector('.add-task-form');
	const input = form.querySelector('input');
	input.addEventListener('blur', () => { footer.innerHTML = originalButtonHTML; });
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const taskTitle = input.value.trim();
		if (taskTitle) {
			const cardBody = footer.closest('.task-column').querySelector('.card-body');
			// THIS WILL NEED TO BE UPDATED to call the API to create a task
			// For now, we just add it visually.
			const tempTaskData = { task_id: Date.now(), data: { title: taskTitle }, status: 'normal' };
			cardBody.insertAdjacentHTML('beforeend', createTaskCard(tempTaskData));
			sortTasksInColumn(cardBody);
			input.value = '';
		}
	});
};

const closeAllColumnActionMenus = () => {
	document.querySelectorAll('.column-actions-menu').forEach(menu => menu.remove());
};

const toggleColumnActionsMenu = (buttonEl) => {
	const controlsContainer = buttonEl.parentElement;
	const existingMenu = controlsContainer.querySelector('.column-actions-menu');
	closeAllColumnActionMenus();
	if (existingMenu) return;
	const menu = document.createElement('div');
	menu.className = 'column-actions-menu';
	menu.innerHTML = `<ul><li><button class="btn-delete-column">Delete Column</button></li></ul>`;
	controlsContainer.appendChild(menu);
};

/**
 * =========================================================================
 * MOVE MODE FUNCTIONS
 * =========================================================================
 */
const enterMoveMode = (taskCardEl) => {
	taskToMoveId = taskCardEl.id;
	document.body.classList.add('move-mode-active');
	taskCardEl.classList.add('is-moving');
	closeAllQuickActionsMenus();
	document.querySelectorAll('.task-column').forEach(column => {
		const footer = column.querySelector('.card-footer');
		if (!footer.dataset.originalHtml) {
			footer.dataset.originalHtml = footer.innerHTML;
		}
		if (column.contains(taskCardEl)) {
			footer.innerHTML = `<button class="btn-cancel-move-inline">Cancel Move</button>`;
		} else {
			footer.innerHTML = `<button class="btn-move-task-here">Move here</button>`;
		}
	});
};

const exitMoveMode = () => {
	const movingTask = document.querySelector('.task-card.is-moving');
	if (movingTask) movingTask.classList.remove('is-moving');
	document.body.classList.remove('move-mode-active');
	document.querySelectorAll('.task-column .card-footer').forEach(footer => {
		if (footer.dataset.originalHtml) {
			footer.innerHTML = footer.dataset.originalHtml;
			delete footer.dataset.originalHtml;
		}
	});
	taskToMoveId = null;
};


/**
 * =========================================================================
 * INITIALIZATION
 * =========================================================================
 */
const initTasksView = () => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;
	
	// Fetch and render the board data from the API on initialization
	fetchAndRenderBoard();
	
	document.addEventListener('click', async (event) => {
		const target = event.target;
		if (!document.body.classList.contains('move-mode-active')) {
			if (!target.closest('.column-controls, .quick-actions-menu, .btn-task-actions')) {
				closeAllColumnActionMenus();
				closeAllQuickActionsMenus();
			}
		}

		// Get references to all possible actions
		const quickActionEdit = target.closest('[data-action="edit-task"]');
		const quickActionDuplicate = target.closest('[data-action="duplicate-task"]');
		const quickActionPriority = target.closest('[data-action="toggle-high-priority"]');
		const quickActionMove = target.closest('[data-action="start-move"]');
		const quickActionDelete = target.closest('[data-action="delete-task"]');


		if (target.matches('.btn-task-actions')) {
			showQuickActionsMenu(target);
		} else if (quickActionEdit) {
			const menu = quickActionEdit.closest('.quick-actions-menu');
			const taskCard = document.getElementById(menu.dataset.taskId);
			if (taskCard) {
				const taskData = {
					id: taskCard.id,
					title: taskCard.querySelector('.task-title').textContent,
					notes: taskCard.dataset.notes || '',
					dueDate: taskCard.dataset.dueDate || ''
				};
				UnifiedEditor.open({ type: 'task', data: taskData });
			}
			closeAllQuickActionsMenus();
		} else if (quickActionDuplicate) {
			// This will need to be updated to call the API
			const menu = quickActionDuplicate.closest('.quick-actions-menu');
			const originalCard = document.getElementById(menu.dataset.taskId);
			if (originalCard) {
				const tempId = Date.now();
				const tempTaskData = { 
					task_id: tempId, 
					data: { title: originalCard.querySelector('.task-title').textContent + ' (Copy)' }, 
					status: 'normal' 
				};
				originalCard.insertAdjacentHTML('afterend', createTaskCard(tempTaskData));
			}
			closeAllQuickActionsMenus();
		} else if (quickActionDelete) {
			// This will need to be updated to call the API
			const menu = quickActionDelete.closest('.quick-actions-menu');
			const taskCard = document.getElementById(menu.dataset.taskId);
			if (taskCard) {
				const confirmed = await showConfirmationModal({
					title: 'Delete Task',
					message: 'Are you sure you want to delete this task? This cannot be undone.',
					confirmText: 'Delete'
				});
				if (confirmed) {
					taskCard.remove();
				}
			}
			closeAllQuickActionsMenus();
		} else if (quickActionPriority) {
			// This will need to be updated to call the API
			const menu = quickActionPriority.closest('.quick-actions-menu');
			const taskCard = document.getElementById(menu.dataset.taskId);
			if (taskCard) {
				taskCard.classList.toggle('high-priority');
				sortTasksInColumn(taskCard.closest('.card-body'));
			}
			closeAllQuickActionsMenus();
		} else if (quickActionMove) {
			exitMoveMode();
			const menu = quickActionMove.closest('.quick-actions-menu');
			if (menu && menu.dataset.taskId) {
				const taskCard = document.getElementById(menu.dataset.taskId);
				if (taskCard) enterMoveMode(taskCard);
			}
		} else if (target.matches('.btn-move-task-here')) {
			// This will need to be updated to call the API
			if (taskToMoveId) {
				const taskToMove = document.getElementById(taskToMoveId);
				const destinationColumn = target.closest('.task-column');
				const sourceColumnBody = taskToMove.closest('.card-body');
				if (taskToMove && destinationColumn) {
					const destinationBody = destinationColumn.querySelector('.card-body');
					destinationBody.appendChild(taskToMove);
					sortTasksInColumn(destinationBody);
					if (sourceColumnBody) sortTasksInColumn(sourceColumnBody);
				}
				exitMoveMode();
			}
		} else if (target.matches('.btn-cancel-move-inline')) {
			exitMoveMode();
		} else if (target.matches('.btn-add-task')) {
			showAddTaskForm(target.parentElement);
		} else if (target.matches('.btn-column-actions')) {
			toggleColumnActionsMenu(target);
		} else if (target.matches('.btn-delete-column')) {
			// This will need to be updated to call the API
			const column = target.closest('.task-column');
			closeAllColumnActionMenus();
			if (column) {
				const confirmed = await showConfirmationModal({
					title: 'Delete Column',
					message: 'Are you sure you want to delete this column and all its tasks? This action cannot be undone.',
					confirmText: 'Delete'
				});
				if (confirmed) column.remove();
			}
		} else if (target.matches('.task-complete-checkbox')) {
			// This will need to be updated to call the API
			const taskCard = target.closest('.task-card');
			if (taskCard) {
				const isChecked = target.checked;
				taskCard.classList.toggle('completed', isChecked);
				if (isChecked) {
					taskCard.classList.add('flash-animation');
					setTimeout(() => {
						taskCard.classList.remove('flash-animation');
					}, 400);
				}
				sortTasksInColumn(taskCard.closest('.card-body'));
			}
		}
	});
	initDragAndDrop();
};