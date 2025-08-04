/**
 * MyDayHub 4.0.0 Beta - Tasks View Module
 *
 * Contains all logic specific to the Tasks Board view, including
 * creating columns, adding tasks, drag-and-drop, etc.
 */

// Module-level state variable to track the ID of the task being moved.
let taskToMoveId = null;


/**
 * =========================================================================
 * DEV MODE FUNCTIONS
 * =========================================================================
 */

/**
 * Creates the HTML for a new task card WITHOUT the animation class.
 * This is used for populating the board in DEVMODE.
 * @param {string} title - The title for the new task.
 * @returns {string} - The HTML string for the new task card.
 */
const createTaskCardDev = (title) => {
	const taskId = 'task-' + Date.now() + Math.random();
	return `
		<div class="task-card" id="${taskId}" draggable="true">
			<div class="task-status-band"></div>
			<div class="task-card-main-content">
				<div class="task-card-content">
					<input type="checkbox" class="task-complete-checkbox" title="Mark as complete">
					<span class="task-title">${title}</span>
					<button class="btn-task-actions" title="Task Actions">&#8230;</button>
				</div>
			</div>
		</div>
	`;
};

/**
 * Populates the task board with sample data for faster testing.
 */
const populateDevModeTasks = () => {
	const taskColumnsWrapper = document.getElementById('task-columns-wrapper');
	if (!taskColumnsWrapper) return;

	taskColumnsWrapper.innerHTML = ''; // Clear board for hot-reloads
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
			const tasks = devData[columnTitle];
			tasks.forEach(taskTitle => {
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

/**
 * Creates the HTML for a new column and appends it to the board.
 * @param {string} title - The title for the new column.
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

/**
 * Creates the HTML for a new task card with an animation class.
 * @param {string} title - The title for the new task.
 * @returns {string} - The HTML string for the new task card.
 */
const createTaskCard = (title) => {
	const taskId = 'task-' + Date.now();
	return `
		<div class="task-card new-card" id="${taskId}" draggable="true">
			<div class="task-status-band"></div>
			<div class="task-card-main-content">
				<div class="task-card-content">
					<input type="checkbox" class="task-complete-checkbox" title="Mark as complete">
					<span class="task-title">${title}</span>
					<button class="btn-task-actions" title="Task Actions">&#8230;</button>
				</div>
			</div>
		</div>
	`;
};

/**
 * Initializes drag-and-drop functionality for task cards.
 */
const initDragAndDrop = () => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;

	taskBoard.addEventListener('dragstart', (event) => {
		// Close any open menus when a drag operation begins.
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

/**
 * Removes all open Quick Actions menus from the DOM.
 */
const closeAllQuickActionsMenus = () => {
	document.querySelectorAll('.quick-actions-menu').forEach(menu => menu.remove());
};

/**
 * Creates and displays the quick actions menu for a given task card button.
 * @param {HTMLElement} buttonEl - The ellipsis button that was clicked.
 */
const showQuickActionsMenu = (buttonEl) => {
	closeAllQuickActionsMenus();
	const taskCard = buttonEl.closest('.task-card');
	if (!taskCard) return;

	const menu = document.createElement('div');
	menu.className = 'quick-actions-menu';
	menu.dataset.taskId = taskCard.id;
	menu.innerHTML = `
		<button class="quick-action-btn" data-action="toggle-high-priority" title="Toggle High Priority">☯️</button>
		<button class="quick-action-btn" data-action="start-move" title="Move Task">↔️</button>
	`;
	
	document.body.appendChild(menu);
	
	// Position the menu relative to the button that was clicked.
	const btnRect = buttonEl.getBoundingClientRect();
	menu.style.top = `${window.scrollY + btnRect.bottom + 5}px`;
	menu.style.left = `${window.scrollX + btnRect.right - menu.offsetWidth}px`;

	// Add class to trigger fade-in animation.
	setTimeout(() => menu.classList.add('visible'), 10);
};

/**
 * Sorts tasks within a column based on state: High Priority > Normal > Completed.
 */
const sortTasksInColumn = (columnBody) => {
	if (!columnBody) return;
	const highPriorityTasks = [], normalTasks = [], completedTasks = [];

	columnBody.querySelectorAll('.task-card').forEach(task => {
		if (task.classList.contains('completed')) {
			completedTasks.push(task);
		} else if (task.classList.contains('high-priority')) {
			highPriorityTasks.push(task);
		} else {
			normalTasks.push(task);
		}
	});

	highPriorityTasks.forEach(task => columnBody.appendChild(task));
	normalTasks.forEach(task => columnBody.appendChild(task));
	completedTasks.forEach(task => columnBody.appendChild(task));
};


/**
 * Helper function to determine drop position for drag-and-drop.
 */
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

/**
 * Replaces the '+ New Task' button with a temporary form.
 */
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

/**
 * Removes all open column action menus from the DOM.
 */
const closeAllColumnActionMenus = () => {
	document.querySelectorAll('.column-actions-menu').forEach(menu => menu.remove());
};

/**
 * Toggles the visibility of the actions menu for a specific column.
 */
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

/**
 * Puts the UI into "move mode" to allow moving a task across columns.
 * @param {HTMLElement} taskCardEl The task card element to be moved.
 */
const enterMoveMode = (taskCardEl) => {
	taskToMoveId = taskCardEl.id;
	document.body.classList.add('move-mode-active');
	taskCardEl.classList.add('is-moving');
	closeAllQuickActionsMenus();

	// Change the footers of all other columns to be move targets
	document.querySelectorAll('.task-column').forEach(column => {
		if (!column.contains(taskCardEl)) {
			const footer = column.querySelector('.card-footer');
			// Store the original content in a data attribute if it's not already stored
			if (!footer.dataset.originalHtml) {
				footer.dataset.originalHtml = footer.innerHTML;
			}
			// Add a new div with a button to act as the move target
			const moveTargetFooter = document.createElement('div');
			moveTargetFooter.className = 'move-target-footer';
			moveTargetFooter.innerHTML = `<button class="btn-move-task-here">Move here</button>`;
			footer.style.display = 'none'; // Hide original footer
			column.appendChild(moveTargetFooter);
		}
	});
};

/**
 * Exits "move mode" and restores the UI to its normal state.
 */
const exitMoveMode = () => {
	const movingTask = document.querySelector('.task-card.is-moving');
	if (movingTask) {
		movingTask.classList.remove('is-moving');
	}

	document.body.classList.remove('move-mode-active');
	
	// Remove all move target footers and restore the original footers
	document.querySelectorAll('.move-target-footer').forEach(target => target.remove());
	document.querySelectorAll('.task-column .card-footer').forEach(footer => {
		footer.style.display = 'block'; // Show original footer again
	});
	
	taskToMoveId = null;
};


/**
 * =========================================================================
 * INITIALIZATION
 * =========================================================================
 */

/**
 * Initializes all event listeners for the Tasks view.
 */
const initTasksView = () => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;

	if (document.body.classList.contains('dev-mode-active')) {
		populateDevModeTasks();
	}

	// A single event listener on the document to handle all clicks in a delegated manner.
	document.addEventListener('click', async (event) => {
		const target = event.target;

		// Do not close menus if a move is in progress
		if (!document.body.classList.contains('move-mode-active')) {
			// Close menus if the user clicks "outside" of an interactive element.
			if (!target.closest('.column-controls, .quick-actions-menu, .btn-task-actions')) {
				closeAllColumnActionMenus();
				closeAllQuickActionsMenus();
			}
		}
		
		const quickActionPriority = target.closest('[data-action="toggle-high-priority"]');
		const quickActionMove = target.closest('[data-action="start-move"]');

		// Handle clicks on specific interactive elements.
		if (target.matches('.btn-task-actions')) {
			showQuickActionsMenu(target);
		}
		else if (quickActionPriority) {
			const menu = quickActionPriority.closest('.quick-actions-menu');
			if (menu) {
				const taskId = menu.dataset.taskId;
				const taskCard = document.getElementById(taskId);
				if (taskCard) {
					taskCard.classList.toggle('high-priority');
					sortTasksInColumn(taskCard.closest('.card-body'));
				}
				closeAllQuickActionsMenus();
			}
		}
		else if (quickActionMove) {
			const menu = quickActionMove.closest('.quick-actions-menu');
			if (menu && menu.dataset.taskId) {
				const taskCard = document.getElementById(menu.dataset.taskId);
				if (taskCard) enterMoveMode(taskCard);
			}
		}
		else if (target.matches('.btn-move-task-here')) {
			if (taskToMoveId) {
				const taskToMove = document.getElementById(taskToMoveId);
				const destinationColumn = target.closest('.task-column');
				const sourceColumnBody = taskToMove.closest('.card-body');
				
				if (taskToMove && destinationColumn) {
					const destinationBody = destinationColumn.querySelector('.card-body');
					destinationBody.appendChild(taskToMove);
					sortTasksInColumn(destinationBody);
					sortTasksInColumn(sourceColumnBody); // Re-sort source column as well
				}
				exitMoveMode();
			}
		}
		else if (target.matches('#btn-cancel-move')) {
			exitMoveMode();
		}
		else if (target.matches('.btn-add-task')) {
			showAddTaskForm(target.parentElement);
		} 
		else if (target.matches('.btn-column-actions')) {
			toggleColumnActionsMenu(target);
		} 
		else if (target.matches('.btn-delete-column')) {
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
		} 
		else if (target.matches('.task-complete-checkbox')) {
			const taskCard = target.closest('.task-card');
			if (taskCard) {
				const isChecked = target.checked;
				taskCard.classList.toggle('completed', isChecked);

				// NEW: Trigger the flash animation only when the task is being marked as complete.
				if (isChecked) {
					taskCard.classList.add('flash-animation');
					// Remove the class after the animation finishes so it can be re-triggered.
					setTimeout(() => {
						taskCard.classList.remove('flash-animation');
					}, 400); // Animation duration is 0.35s, 400ms is a safe buffer.
				}
				
				sortTasksInColumn(taskCard.closest('.card-body'));
			}
		}
	});
	
	initDragAndDrop();
};