/**
 * MyDayHub 4.0.0 Beta - Tasks View Module
 *
 * Contains all logic specific to the Tasks Board view, including
 * creating columns, adding tasks, drag-and-drop, etc. 
 */

/**
 * =========================================================================
 * DEV MODE FUNCTIONS
 * =========================================================================
 */

/**
 * Creates the HTML for a new task card WITHOUT the animation class.
 * This is used for populating the board in DEVMODE to prevent a flash of animations on load.
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
				</div>
			</div>
		</div>
	`;
};

/**
 * Populates the task board with sample data for faster testing.
 * This function is ONLY called when DEVMODE is active.
 */
const populateDevModeTasks = () => {
	const taskColumnsWrapper = document.getElementById('task-columns-wrapper');
	if (!taskColumnsWrapper) return;

	// Clear any existing columns to prevent duplicates on hot-reload.
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
			const tasks = devData[columnTitle];
			tasks.forEach(taskTitle => {
				const taskHTML = createTaskCardDev(taskTitle);
				cardBody.insertAdjacentHTML('beforeend', taskHTML);
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
			<div class="card-body">
				</div>
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
				</div>
			</div>
		</div>
	`;
};

/**
 * Initializes drag-and-drop functionality for task cards.
 */
const initDragAndDrop = (longPressTimer) => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;

	taskBoard.addEventListener('dragstart', (event) => {
		// When a drag starts, we must cancel any pending long-press timer.
		clearTimeout(longPressTimer.id);
		closeAllQuickActionsMenus();

		if (event.target.classList.contains('task-card')) {
			event.target.classList.add('dragging');
		}
	});

	taskBoard.addEventListener('dragend', (event) => {
		if (event.target.classList.contains('task-card')) {
			event.target.classList.remove('dragging');

			// After the drag ends, sort the column where the card was dropped.
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
 * Initializes long-press functionality to open a contextual menu for tasks.
 */
const initQuickActions = (longPressTimer, longPressTriggered) => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;

	const startPress = (event) => {
		// Close any other open menus first.
		closeAllColumnActionMenus();
		
		const taskCard = event.target.closest('.task-card');
		// Only start the timer if the press is on a card and not on the checkbox.
		if (taskCard && !event.target.matches('.task-complete-checkbox')) {
			longPressTimer.id = setTimeout(() => {
				longPressTriggered.value = true; // Flag that a long press occurred.
				closeAllQuickActionsMenus(); // Close any existing menus.

				// Create the menu element
				const menu = document.createElement('div');
				menu.className = 'quick-actions-menu';
				// Store the target task's ID on the menu itself for later reference.
				menu.dataset.taskId = taskCard.id;
				
				// Updated button with new icon and data-action
				menu.innerHTML = `
					<button class="quick-action-btn" data-action="toggle-high-priority" title="Toggle High Priority">☯️</button>
					<button class="quick-action-btn" data-action="start-move" title="Move Task">↔️</button>
				`;
				
				// Position and show the menu
				document.body.appendChild(menu);
				const clientX = event.clientX || event.touches[0].clientX;
				const clientY = event.clientY || event.touches[0].clientY;
				menu.style.top = `${clientY - 25}px`; // Center vertically on cursor
				menu.style.left = `${clientX - 45}px`; // Center horizontally on cursor

				// Add class to trigger fade-in animation
				setTimeout(() => menu.classList.add('visible'), 10);

			}, 500); // 500ms for a long press
		}
	};

	const cancelPress = () => {
		clearTimeout(longPressTimer.id);
		if (longPressTriggered.value) {
			setTimeout(() => {
				longPressTriggered.value = false;
			}, 50); 
		}
	};

	taskBoard.addEventListener('mousedown', startPress);
	taskBoard.addEventListener('touchstart', startPress);

	taskBoard.addEventListener('mouseup', cancelPress);
	taskBoard.addEventListener('mouseleave', cancelPress, true);
	taskBoard.addEventListener('touchend', cancelPress);
	// Also close on scroll, which indicates user has moved on.
	taskBoard.addEventListener('scroll', closeAllQuickActionsMenus);
};

/**
 * Sorts tasks within a column based on state: High Priority > Normal > Completed.
 */
const sortTasksInColumn = (columnBody) => {
	if (!columnBody) return;
	// Updated variable name for clarity
	const highPriorityTasks = [], normalTasks = [], completedTasks = [];

	columnBody.querySelectorAll('.task-card').forEach(task => {
		if (task.classList.contains('completed')) {
			completedTasks.push(task);
		} else if (task.classList.contains('high-priority')) { // Updated class name check
			highPriorityTasks.push(task);
		} else {
			normalTasks.push(task);
		}
	});

	// Updated array name in the final sort
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
 * Initializes all event listeners for the Tasks view.
 */
const initTasksView = () => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;

	if (document.body.classList.contains('dev-mode-active')) {
		populateDevModeTasks();
	}

	let longPressTimer = { id: null };
	let longPressTriggered = { value: false };

	taskBoard.addEventListener('click', async (event) => {
		if (longPressTriggered.value) {
			event.preventDefault();
			event.stopPropagation();
			longPressTriggered.value = false;
			return;
		}

		const target = event.target;
		const quickAction = target.closest('[data-action="toggle-high-priority"]');

		if (quickAction) {
			const menu = quickAction.closest('.quick-actions-menu');
			const taskId = menu.dataset.taskId;
			const taskCard = document.getElementById(taskId);
			
			if (taskCard) {
				taskCard.classList.toggle('high-priority');
				sortTasksInColumn(taskCard.closest('.card-body'));
			}
			closeAllQuickActionsMenus();
		}
		else if (target.matches('.btn-add-task')) {
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
				taskCard.classList.toggle('completed', target.checked);
				sortTasksInColumn(taskCard.closest('.card-body'));
			}
		}
	});

	// Global listener to close menus when clicking elsewhere.
	document.addEventListener('click', (event) => {
		// Close column menu if click is outside of its parent controls.
		if (!event.target.closest('.column-controls')) {
			closeAllColumnActionMenus();
		}
		// Close quick actions menu if click is outside of a menu or a task card.
		if (!event.target.closest('.quick-actions-menu, .task-card')) {
			closeAllQuickActionsMenus();
		}
	});

	initDragAndDrop(longPressTimer);
	initQuickActions(longPressTimer, longPressTriggered);
};