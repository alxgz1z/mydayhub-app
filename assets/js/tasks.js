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
					<span class="task-title">${title}</span>
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
		if (event.target.classList.contains('task-card')) {
			event.target.classList.add('dragging');
		}
	});

	taskBoard.addEventListener('dragend', (event) => {
		if (event.target.classList.contains('task-card')) {
			event.target.classList.remove('dragging');
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

			const newCard = cardBody.lastElementChild;
			setTimeout(() => {
				newCard.classList.remove('new-card');
			}, 500);
			
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

	// This ensures only one menu is ever open. We close all menus first.
	closeAllActionMenus();

	// If the menu we just closed was for the button we just clicked, then we're done.
	if (existingMenu) {
		return; 
	}
	
	// Otherwise, create and show the new menu.
	const menu = document.createElement('div');
	menu.className = 'column-actions-menu';
	menu.innerHTML = `
		<ul>
			<li><button class="btn-delete-column">Delete Column</button></li>
		</ul>
	`;
	// Add the new menu to the controls container.
	controlsContainer.appendChild(menu);
};

/**
 * Initializes all event listeners for the Tasks view.
 */
const initTasksView = () => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;

	// A single, delegated click listener for the entire task board.
	taskBoard.addEventListener('click', (event) => {
		// Handle the '+ New Task' button click.
		if (event.target.matches('.btn-add-task')) {
			showAddTaskForm(event.target.parentElement);
		}
		// Handle the '...' column actions button click.
		else if (event.target.matches('.btn-column-actions')) {
			toggleColumnActionsMenu(event.target);
		}
		// Handle the 'Delete Column' button click within an action menu.
		else if (event.target.matches('.btn-delete-column')) {
			const column = event.target.closest('.task-column');
			if (column && window.confirm('Are you sure you want to delete this column and all its tasks?')) {
				column.remove();
			}
			// Always close menus after an action.
			closeAllActionMenus();
		}
	});

	// A global listener to close the menu if the user clicks elsewhere on the page.
	document.addEventListener('click', (event) => {
		if (!event.target.closest('.column-controls')) {
			closeAllActionMenus();
		}
	});

	initDragAndDrop();
};