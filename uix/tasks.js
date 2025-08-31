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
		const response = await fetch('/api/api.php?module=tasks&action=getAll');

		if (!response.ok) {
			// If the user is not authenticated, the API returns a 401, which is handled here.
			if (response.status === 401) {
				// Redirect to login if the session is invalid or expired.
				window.location.href = '/login/login.php';
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
 * @param {Array} boardData - An array of column objects, each containing an array of tasks.
 */
function renderBoard(boardData) {
	const container = document.getElementById('task-board-container');
	container.innerHTML = ''; // Clear the "Loading..." message.

	if (boardData.length === 0) {
		container.innerHTML = '<p>No columns found. Create your first column to get started!</p>';
		return;
	}

	boardData.forEach(columnData => {
		const columnEl = createColumnElement(columnData);
		container.appendChild(columnEl);
	});
}

/**
 * Creates the HTML element for a single column and its tasks.
 * @param {object} columnData - The data for a single column.
 * @returns {HTMLElement} The fully constructed column element.
 */
function createColumnElement(columnData) {
	const columnEl = document.createElement('div');
	columnEl.className = 'task-column'; // We'll style this class later
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
			<input type="text" placeholder="+ New Task" />
		</div>
	`;
	return columnEl;
}

/**
 * Creates the HTML string for a single task card.
 * @param {object} taskData - The data for a single task.
 * @returns {string} The HTML string for the task card.
 */
function createTaskCard(taskData) {
	// NOTE: For now, we are not decrypting the task data.
	// We are just displaying a placeholder to prove the data pipeline works.
	const taskTitle = 'Encrypted Task';

	return `
		<div class="task-card" data-task-id="${taskData.task_id}">
			<span class="task-title">${taskTitle}</span>
		</div>
	`;
}