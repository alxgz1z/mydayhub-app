/**
 * MyDayHub 4.0.0 Beta - Tasks View Module
 *
 * Contains all logic specific to the Tasks Board view, including
 * creating columns, adding tasks, drag-and-drop, etc.
 */

// Module-level state variables
let taskToMoveId = null;
let currentEditingTaskId = null;
// NEW: Timer ID for the auto-save functionality in the modal.
let autoSaveTimer = null;

/**
 * =========================================================================
 * DEV MODE FUNCTIONS
 * =========================================================================
 */
const createTaskCardDev = (title) => {
	const taskId = 'task-' + Date.now() + Math.random();
	// UPDATED: Changed class to task-meta-indicators to match new CSS.
	return `
		<div class="task-card" id="${taskId}" draggable="true" data-notes="" data-due-date="">
			<div class="task-status-band"></div>
			<div class="task-card-main-content">
				<div class="task-card-content">
					<input type="checkbox" class="task-complete-checkbox" title="Mark as complete">
					<span class="task-title">${title}</span>
					<button class="btn-task-actions" title="Task Actions">&#8230;</button>
				</div>
				<div class="task-meta-indicators"></div>
			</div>
		</div>
	`;
};

const populateDevModeTasks = () => {
	const taskColumnsWrapper = document.getElementById('task-columns-wrapper');
	if (!taskColumnsWrapper) return;
	taskColumnsWrapper.innerHTML = '';
	const devData = {
		"Weekdays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
		"Colors": ["Blue", "Red", "Green", "Black", "White"],
		"Chores": ["Wash car", "Mow lawn", "Water plant", "Garbage out"]
	};
	for (const columnTitle in devData) {
		addColumnToBoard(columnTitle);
		const newColumn = taskColumnsWrapper.lastElementChild;
		if (newColumn) {
			const cardBody = newColumn.querySelector('.card-body');
			devData[columnTitle].forEach(taskTitle => {
				cardBody.insertAdjacentHTML('beforeend', createTaskCardDev(taskTitle));
			});
		}
	}
};

/**
 * =========================================================================
 * CORE TASK VIEW FUNCTIONS
 * =========================================================================
 */
const addColumnToBoard = (title) => {
	const taskColumnsWrapper = document.getElementById('task-columns-wrapper');
	if (!taskColumnsWrapper) return;
	const columnId = 'column-' + Date.now() + Math.random();
	const newColumnHTML = `
		<div class="task-column" id="${columnId}">
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

const createTaskCard = (title) => {
	const taskId = 'task-' + Date.now();
	// UPDATED: Changed class to task-meta-indicators to match new CSS.
	return `
		<div class="task-card new-card" id="${taskId}" draggable="true" data-notes="" data-due-date="">
			<div class="task-status-band"></div>
			<div class="task-card-main-content">
				<div class="task-card-content">
					<input type="checkbox" class="task-complete-checkbox" title="Mark as complete">
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
	// UPDATED: Changed selector to match new class name in createTaskCard functions.
	const indicatorsContainer = taskCardEl.querySelector('.task-meta-indicators');
	if (!indicatorsContainer) return;

	indicatorsContainer.innerHTML = ''; // Clear existing indicators

	const notes = taskCardEl.dataset.notes;
	if (notes && notes.trim() !== '') {
		// UPDATED: This now creates a styled badge for the note icon.
		indicatorsContainer.innerHTML += `
			<span class="meta-indicator" title="This task has notes">
				<span class="icon">📝</span>
			</span>`;
	}

	const dueDate = taskCardEl.dataset.dueDate;
	if (dueDate) {
		// UPDATED: This now creates a styled badge for the due date.
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

	// UPDATED: Reordered actions and updated icons to align with the app spec.
	// Added placeholders for Share and Private features.
	// Kept "Move Task" as it's our mobile-friendly solution.
	menu.innerHTML = `
		<button class="quick-action-btn" data-action="edit-task" title="Edit Task">✏️ Edit</button>
		<button class="quick-action-btn" data-action="start-move" title="Move Task">✥ Move</button>
		<button class="quick-action-btn" data-action="toggle-high-priority" title="Toggle High Priority">⭐ Priority</button>
		<button class="quick-action-btn" data-action="duplicate-task" title="Duplicate Task">📋 Duplicate</button>
		<button class="quick-action-btn" data-action="share-task" title="Share Task (Coming Soon)">📤 Share</button>
		<button class="quick-action-btn" data-action="make-private" title="Make Private (Coming Soon)">🔒 Private</button>
		<button class="quick-action-btn" data-action="delete-task" title="Delete Task">🗑️ Delete</button>
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
			cardBody.insertAdjacentHTML('beforeend', createTaskCard(taskTitle));
			sortTasksInColumn(cardBody);
			const newCard = Array.from(cardBody.querySelectorAll('.new-card')).pop();
			if (newCard) {
				setTimeout(() => newCard.classList.remove('new-card'), 500);
			}
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
 * EDIT TASK MODAL FUNCTIONS
 * =========================================================================
 */

/**
 * NEW: Centralized function to save task data from the modal.
 * This can be called manually or by the auto-save timer.
 */
const saveTaskData = () => {
	if (!currentEditingTaskId) return;
	const taskCard = document.getElementById(currentEditingTaskId);
	const notesEl = document.getElementById('edit-task-notes');
	const dueDateEl = document.getElementById('edit-task-due-date');
	const statusEl = document.getElementById('edit-task-status');
	if (!taskCard || !notesEl || !dueDateEl || !statusEl) return;

	// Update the data attributes on the task card element
	taskCard.dataset.notes = notesEl.value;
	taskCard.dataset.dueDate = dueDateEl.value;
	
	// Refresh the meta indicators on the card itself
	updateTaskCardIndicators(taskCard);

	// Update the "Last saved" timestamp in the modal footer [cite: 33]
	const now = new Date();
	statusEl.textContent = `Last saved: ${now.toLocaleTimeString()}`;
	
	// In the future, this is where we would send the data to the server API.
	console.log(`Task ${currentEditingTaskId} saved at ${now.toLocaleTimeString()}`);
};

const openEditTaskModal = (taskCardEl) => {
	currentEditingTaskId = taskCardEl.id;
	const modalOverlay = document.getElementById('edit-task-modal-overlay');
	const titleEl = document.getElementById('edit-task-title');
	const notesEl = document.getElementById('edit-task-notes');
	const dueDateEl = document.getElementById('edit-task-due-date');
	const closeBtn = document.getElementById('edit-task-close');
	const saveBtn = document.getElementById('edit-task-save');
	const statusEl = document.getElementById('edit-task-status');
	const taskTitle = taskCardEl.querySelector('.task-title').textContent;

	titleEl.textContent = taskTitle;
	notesEl.value = taskCardEl.dataset.notes || '';
	dueDateEl.value = taskCardEl.dataset.dueDate || '';
	statusEl.textContent = 'Last saved: Never'; // Reset status text

	closeBtn.onclick = () => closeEditTaskModal();
	// UPDATED: The save button now calls our new, centralized save function before closing.
	saveBtn.onclick = () => {
		saveTaskData();
		closeEditTaskModal();
	};

	modalOverlay.classList.add('active');

	// NEW: Start the auto-save timer when the modal opens.
	// The spec requires saving every 60 seconds. 
	if (autoSaveTimer) clearInterval(autoSaveTimer); // Clear any lingering timers
	autoSaveTimer = setInterval(saveTaskData, 60000); // 60,000 ms = 60 seconds
};

const closeEditTaskModal = () => {
	const modalOverlay = document.getElementById('edit-task-modal-overlay');

	// NEW: Crucially, we must stop the auto-save timer when the modal closes.
	if (autoSaveTimer) {
		clearInterval(autoSaveTimer);
		autoSaveTimer = null;
	}

	if (modalOverlay) {
		modalOverlay.classList.remove('active');
	}
	currentEditingTaskId = null;
};


/**
 * =========================================================================
 * INITIALIZATION
 * =========================================================================
 */
const initTasksView = () => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;
	if (document.body.classList.contains('dev-mode-active')) {
		populateDevModeTasks();
		// UPDATED: Called renamed function
		document.querySelectorAll('.task-card').forEach(updateTaskCardIndicators);
	}
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
			if (taskCard) openEditTaskModal(taskCard);
			closeAllQuickActionsMenus();
		} else if (quickActionDuplicate) {
			const menu = quickActionDuplicate.closest('.quick-actions-menu');
			const originalCard = document.getElementById(menu.dataset.taskId);
			if (originalCard) {
				const title = originalCard.querySelector('.task-title').textContent;
				const newCardHTML = createTaskCard(title);
				originalCard.insertAdjacentHTML('afterend', newCardHTML);
				
				const newCard = originalCard.nextElementSibling;
				if (newCard) {
					// Copy data attributes and update meta
					newCard.dataset.notes = originalCard.dataset.notes;
					newCard.dataset.dueDate = originalCard.dataset.dueDate;
					// UPDATED: Called renamed function
					updateTaskCardIndicators(newCard);
				}
			}
			closeAllQuickActionsMenus();
		} else if (quickActionDelete) {
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