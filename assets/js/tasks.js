/**
 * MyDayHub 4.0.0 Beta - Tasks View Module
 *
 * Contains all logic specific to the Tasks Board view, including
 * creating columns, adding tasks, drag-and-drop, etc.
 */

/**
  * Creates the HTML for a new column and appends it to the board.
  * @param {string} title - The title for the new column.
  */
 const addColumnToBoard = (title) => {
	 const taskColumnsWrapper = document.getElementById('task-columns-wrapper');
	 if (!taskColumnsWrapper) return;
 
	 const columnId = 'column-' + Date.now();
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
 * Creates the HTML for a new task card.
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
 * Initializes long-press functionality to toggle task priority.
 */
const initLongPressPriority = (longPressTimer, longPressTriggered) => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;

	const startPress = (event) => {
		const taskCard = event.target.closest('.task-card');
		// Only start the timer if the press is on a card and not on the checkbox itself.
		if (taskCard && !event.target.matches('.task-complete-checkbox')) {
			longPressTimer.id = setTimeout(() => {
				taskCard.classList.toggle('priority');
				longPressTriggered.value = true; // Flag that a long press occurred.

				// After changing priority, sort the column.
				const columnBody = taskCard.closest('.card-body');
				sortTasksInColumn(columnBody);
			}, 500); // 500ms for a long press
		}
	};

	const cancelPress = () => {
		clearTimeout(longPressTimer.id);
	};

	taskBoard.addEventListener('mousedown', startPress);
	taskBoard.addEventListener('touchstart', startPress);

	taskBoard.addEventListener('mouseup', cancelPress);
	taskBoard.addEventListener('mouseleave', cancelPress, true); // Use capture phase for mouseleave
	taskBoard.addEventListener('touchend', cancelPress);
};

/**
 * Sorts tasks within a column based on state: Priority > Normal > Completed.
 * This uses a stable sorting method by grouping and re-appending.
 * @param {HTMLElement} columnBody - The .card-body element of the column to sort.
 */
const sortTasksInColumn = (columnBody) => {
	if (!columnBody) return;

	// Group tasks by their status.
	const priorityTasks = [];
	const normalTasks = [];
	const completedTasks = [];

	columnBody.querySelectorAll('.task-card').forEach(task => {
		if (task.classList.contains('completed')) {
			completedTasks.push(task);
		} else if (task.classList.contains('priority')) {
			priorityTasks.push(task);
		} else {
			normalTasks.push(task);
		}
	});

	// Re-append tasks to the DOM in the correct order, which automatically moves them.
	priorityTasks.forEach(task => columnBody.appendChild(task));
	normalTasks.forEach(task => columnBody.appendChild(task));
	completedTasks.forEach(task => columnBody.appendChild(task));
};


/**
 * Helper function to determine which element the dragged card should be placed before.
 * @param {HTMLElement} container - The column body (.card-body) being dragged over.
 * @param {number} y - The vertical mouse coordinate.
 * @returns {HTMLElement|null} - The element to insert before, or null to append to the end.
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
 * Replaces the '+ New Task' button with a temporary form for adding a task.
 * @param {HTMLElement} footer - The .card-footer element containing the button.
 */
const showAddTaskForm = (footer) => {
	const originalButtonHTML = footer.innerHTML;
	
	footer.innerHTML = `
		<form class="add-task-form">
			<input type="text" class="form-control" placeholder="Enter task title..." autofocus>
		</form>
	`;

	const form = footer.querySelector('.add-task-form');
	const input = form.querySelector('input');

	const revertToButton = () => {
		footer.innerHTML = originalButtonHTML;
	};

	input.addEventListener('blur', revertToButton);

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		
		const taskTitle = input.value.trim();
		if (taskTitle) {
			const cardBody = footer.closest('.task-column').querySelector('.card-body');
			const newTaskHTML = createTaskCard(taskTitle);
			cardBody.insertAdjacentHTML('beforeend', newTaskHTML);

			// Sort the column to ensure the new "normal" task is placed correctly
			// above any completed tasks.
			sortTasksInColumn(cardBody);

			// Animate the new card after it's been sorted into place.
			const newCard = Array.from(cardBody.querySelectorAll('.new-card')).pop();
			if (newCard) {
				setTimeout(() => {
					newCard.classList.remove('new-card');
				}, 500); // Animation duration
			}
			
			input.value = '';
		}
	});
};

/**
 * Removes all open action menus from the DOM.
 */
const closeAllActionMenus = () => {
	document.querySelectorAll('.column-actions-menu').forEach(menu => menu.remove());
};

/**
 * Toggles the visibility of the actions menu for a specific column.
 * @param {HTMLElement} buttonEl - The ellipsis button that was clicked.
 */
const toggleColumnActionsMenu = (buttonEl) => {
	const controlsContainer = buttonEl.parentElement;
	const existingMenu = controlsContainer.querySelector('.column-actions-menu');

	closeAllActionMenus();

	if (existingMenu) {
		return; 
	}
	
	const menu = document.createElement('div');
	menu.className = 'column-actions-menu';
	menu.innerHTML = `
		<ul>
			<li><button class="btn-delete-column">Delete Column</button></li>
		</ul>
	`;
	controlsContainer.appendChild(menu);
};

/**
 * Initializes all event listeners for the Tasks view.
 */
const initTasksView = () => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;
	
	// Variables to manage the long-press state.
	let longPressTimer = { id: null };
	let longPressTriggered = { value: false };

	// A single, delegated listener for the entire task board.
	taskBoard.addEventListener('click', async (event) => {
		// If a long press just happened, prevent the click and reset the flag.
		if (longPressTriggered.value) {
			longPressTriggered.value = false;
			return;
		}

		const target = event.target;
		
		if (target.matches('.btn-add-task')) {
			showAddTaskForm(target.parentElement);
		}
		else if (target.matches('.btn-column-actions')) {
			toggleColumnActionsMenu(target);
		}
		else if (target.matches('.btn-delete-column')) {
			const column = target.closest('.task-column');
			closeAllActionMenus();
			if (column) {
				const confirmed = await showConfirmationModal({
					title: 'Delete Column',
					message: 'Are you sure you want to delete this column and all its tasks? This action cannot be undone.',
					confirmText: 'Delete'
				});
				if (confirmed) {
					column.remove();
				}
			}
		}
		else if (target.matches('.task-complete-checkbox')) {
			const taskCard = target.closest('.task-card');
			if (taskCard) {
				taskCard.classList.toggle('completed', target.checked);

				// After changing completion status, sort the column.
				const columnBody = taskCard.closest('.card-body');
				sortTasksInColumn(columnBody);
			}
		}
	});

	// A global listener to close the menu if the user clicks elsewhere on the page.
	document.addEventListener('click', (event) => {
		if (!event.target.closest('.column-controls')) {
			closeAllActionMenus();
		}
	});

	initDragAndDrop(longPressTimer);
	initLongPressPriority(longPressTimer, longPressTriggered);
};