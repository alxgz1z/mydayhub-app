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
					<button class="btn-icon move-left" title="Move Left">&larr;</button>
					<button class="btn-icon move-right" title="Move Right">&rarr;</button>
					<button class="private-column-toggle" title="Mark as Private">V</button>
					<button class="delete-column-btn" title="Delete Column"></button>
				</div>
			</div>
			<div class="card-body">
				</div>
			<div class="card-footer">
				<form class="add-task-form">
					<input type="text" class="form-control" placeholder="Add new task...">
				</form>
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

	// Add event listeners to the main board container using event delegation.
	taskBoard.addEventListener('dragstart', (event) => {
		// Target only the task cards.
		if (event.target.classList.contains('task-card')) {
			// Add a 'dragging' class to the card for visual feedback.
			event.target.classList.add('dragging');
		}
	});

	taskBoard.addEventListener('dragend', (event) => {
		// Target only the task cards.
		if (event.target.classList.contains('task-card')) {
			// Clean up by removing the 'dragging' class when the drag ends.
			event.target.classList.remove('dragging');
		}
	});

	taskBoard.addEventListener('dragover', (event) => {
		// Find the drop zone (the column's body) we are dragging over.
		const dropZone = event.target.closest('.card-body');
		if (dropZone) {
			// Prevent the browser's default drag behavior to allow dropping.
			event.preventDefault();

			const draggingCard = document.querySelector('.dragging');
			if (!draggingCard) return;

			// Determine where to place the card relative to other cards.
			const afterElement = getDragAfterElement(dropZone, event.clientY);

			if (afterElement == null) {
				// If there's no element to come after, append to the end.
				dropZone.appendChild(draggingCard);
			} else {
				// Otherwise, insert it before the element it should come after.
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
	// Get all draggable cards in the container, excluding the one being dragged.
	const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

	return draggableElements.reduce((closest, child) => {
		const box = child.getBoundingClientRect();
		// Calculate the vertical distance from the mouse to the center of the card.
		const offset = y - box.top - box.height / 2;
		// If the offset is negative (we are above the center) and it's the closest one we've found so far...
		if (offset < 0 && offset > closest.offset) {
			return { offset: offset, element: child };
		} else {
			return closest;
		}
	}, { offset: Number.NEGATIVE_INFINITY }).element;
};


/**
 * Initializes all event listeners for the Tasks view.
 */
const initTasksView = () => {
	const taskBoard = document.getElementById('task-board-container');
	if (!taskBoard) return;

	// Use event delegation to handle form submissions for dynamically created columns.
	taskBoard.addEventListener('submit', (event) => {
		// Check if the submitted element is an "add-task-form".
		if (event.target.classList.contains('add-task-form')) {
			event.preventDefault();
			const form = event.target;
			const input = form.querySelector('input');
			const taskTitle = input.value.trim();

			if (taskTitle) {
				const cardBody = form.closest('.task-column').querySelector('.card-body');
				const newTaskHTML = createTaskCard(taskTitle);
				cardBody.insertAdjacentHTML('beforeend', newTaskHTML);

				// Add and then remove the animation class.
				const newCard = cardBody.lastElementChild;
				setTimeout(() => {
					newCard.classList.remove('new-card');
				}, 500); // Animation duration is 0.5s

				input.value = ''; // Clear input field
			}
		}
	});

	// Initialize the drag and drop functionality.
	initDragAndDrop();
};