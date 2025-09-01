/**
 * MyDayHub Beta 5 - Tasks View Module
 *
 * Handles fetching and rendering the task board, and all interactions
 * within the Tasks view.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */

/**
 * Initializes the Tasks view by fetching and rendering the board.
 */
function initTasksView() {
	fetchAndRenderBoard();
	initEventListeners();
}

/**
 * Sets up the main event listeners for the tasks view.
 */
function initEventListeners() {
	document.addEventListener('click', (e) => {
		if (e.target && e.target.id === 'btn-add-column') {
			showAddColumnForm();
		}
	});

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

		boardContainer.addEventListener('dragstart', (e) => {
			if (e.target.matches('.task-card')) {
				e.target.classList.add('dragging');
			}
		});

		// Modified for DnD Persistence
		boardContainer.addEventListener('dragend', async (e) => {
			if (e.target.matches('.task-card')) {
				e.target.classList.remove('dragging');
				const columnEl = e.target.closest('.task-column');
				if (columnEl) {
					const columnId = columnEl.dataset.columnId;
					const tasks = Array.from(columnEl.querySelectorAll('.task-card'));
					const taskIds = tasks.map(card => card.dataset.taskId);
					
					// Await the result of the API call
					const success = await reorderTasks(columnId, taskIds);
					
					// Update the UI only on successful persistence
					if (success) {
						const countSpan = columnEl.querySelector('.task-count');
						if (countSpan) {
							countSpan.textContent = tasks.length;
						}
					}
					// On failure, reorderTasks already shows an alert. A future improvement could be to revert the visual change.
				}
			}
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
 * Sends the new order of tasks to the API.
 * @returns {Promise<boolean>} - True if successful, false otherwise.
 */
// Modified for DnD Persistence
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
					tasks: tasks // This should be an array of task IDs
				}
			})
		});

		const result = await response.json();

		if (result.status !== 'success') {
			alert(`Error: ${result.message}`);
			return false; // Indicate failure
		}
		return true; // Indicate success
	} catch (error) {
		alert('A network error occurred. Please try again.');
		console.error('Reorder tasks error:', error);
		return false; // Indicate failure
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
		} else {
			alert(`Error: ${result.message}`);
			taskCard.querySelector('.task-checkbox').checked = !isComplete;
		}
	} catch (error) {
		alert('A network error occurred. Please try again.');
		taskCard.querySelector('.task-checkbox').checked = !isComplete;
		console.error('Toggle complete error:', error);
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
				} else {
					alert(`Error: ${result.message}`);
				}
			} catch (error) {
				alert('A network error occurred. Please try again.');
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
		} else {
			alert(`Error: ${result.message}`);
		}
	} catch (error) {
		alert('A network error occurred while creating the task.');
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
		// Modified for robust API pathing
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
			renderBoard(result.data);
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
	});
}

/**
 * Creates the HTML element for a single column and its tasks.
 */
function createColumnElement(columnData) {
	const columnEl = document.createElement('div');
	columnEl.className = 'task-column';
	columnEl.dataset.columnId = columnData.column_id;

	let tasksHTML = '';
	if (columnData.tasks && columnData.tasks.length > 0) {
		tasksHTML = columnData.tasks.map(taskData => createTaskCard(taskData)).join('');
	} else {
		tasksHTML = '<p class="no-tasks-message">No tasks in this column.</p>';
	}

	columnEl.innerHTML = `
		<div class="column-header">
			<h2 class="column-title">${columnData.column_name}</h2>
			<span class="task-count">${columnData.tasks.length}</span>
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
	try {
		const data = JSON.parse(taskData.encrypted_data);
		taskTitle = data.title;
	} catch(e) {
		console.error("Could not parse task data:", taskData.encrypted_data);
	}

	const isCompleted = taskData.classification === 'completed';

	return `
		<div class="task-card ${isCompleted ? 'completed' : ''}" data-task-id="${taskData.task_id}" draggable="true">
			<div class="task-status-band"></div>
			<input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
			<span class="task-title">${taskTitle}</span>
		</div>
	`;
}