/**
 * MyDayHub Beta 5 - Tasks View Module
 *
 * Handles fetching and rendering the task board, and all interactions
 * within the Tasks view.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */

// Modified for drag-and-drop counter fix
let dragSourceColumn = null;

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

		boardContainer.addEventListener('click', async (e) => {
			if (e.target.matches('.task-status-band')) {
				const taskCard = e.target.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
				if (taskId) {
					toggleTaskClassification(taskId, taskCard);
				}
				return;
			}

			const deleteBtn = e.target.closest('.btn-delete-column');
			if (deleteBtn) {
				const columnEl = deleteBtn.closest('.task-column');
				const columnId = columnEl.dataset.columnId;
				
				const confirmed = confirm('Are you sure you want to delete this column and all of its tasks? This cannot be undone.');

				if (confirmed && columnId) {
					const success = await deleteColumn(columnId);
					if (success) {
						columnEl.remove();
						updateMoveButtonVisibility();
					} else {
						alert('Error: Could not delete the column.');
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
					alert('Error: Could not save new column order.');
					fetchAndRenderBoard();
				}
				return;
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

					if (!success) {
						titleEl.textContent = originalTitle;
						alert('Error: Could not rename column.');
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

		// Modified for drag-and-drop counter fix
		boardContainer.addEventListener('dragstart', (e) => {
			if (e.target.matches('.task-card')) {
				e.target.classList.add('dragging');
				// Remember the column where the drag started
				dragSourceColumn = e.target.closest('.task-column');
			}
		});

		// Modified for drag-and-drop counter fix
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
						// Update counter for the destination column
						updateColumnTaskCount(destinationColumn);
						// If the task moved from another column, update its counter too
						if (dragSourceColumn && dragSourceColumn !== destinationColumn) {
							updateColumnTaskCount(dragSourceColumn);
						}
					} else {
						fetchAndRenderBoard();
					}
				}
			}
			// Clean up for the next drag operation
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


// --- Added for drag-and-drop counter fix ---
/**
 * Updates the visual task count in a column's header.
 * @param {HTMLElement} columnEl - The .task-column element.
 */
function updateColumnTaskCount(columnEl) {
	if (!columnEl) return;
	const countSpan = columnEl.querySelector('.task-count');
	const taskCount = columnEl.querySelectorAll('.task-card').length;
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
 * Sends a request to save the new order of all columns.
 * @returns {Promise<boolean>} - True if successful, false otherwise.
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
 * @returns {Promise<boolean>} - True if successful, false otherwise.
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
 * @returns {Promise<boolean>} - True if successful, false otherwise.
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
 * Sends the new order of tasks to the API.
 * @returns {Promise<boolean>} - True if successful, false otherwise.
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
			alert(`Error: ${result.message}`);
			return false;
		}
		return true;
	} catch (error) {
		alert('A network error occurred. Please try again.');
		console.error('Reorder tasks error:', error);
		return false;
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
			if (isComplete) {
				taskCard.classList.remove('classification-signal', 'classification-support', 'classification-noise');
			} else {
				taskCard.classList.add('classification-support');
			}
			sortTasksInColumn(taskCard.closest('.column-body'));
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
			taskCardEl.classList.remove('classification-signal', 'classification-support', 'classification-noise');
			taskCardEl.classList.add(`classification-${result.data.new_classification}`);
			sortTasksInColumn(taskCardEl.closest('.column-body'));
		} else {
			alert(`Error: ${result.message}`);
		}
	} catch (error) {
		alert('A network error occurred while updating classification.');
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
			sortTasksInColumn(columnBody);
			updateColumnTaskCount(columnEl); // Update count after adding a task
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
		const columnBody = columnEl.querySelector('.column-body');
		sortTasksInColumn(columnBody);
	});

	updateMoveButtonVisibility();
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
			<div class="column-header-controls">
				<button class="btn-move-column" data-direction="left" title="Move Left">&lt;</button>
				<button class="btn-move-column" data-direction="right" title="Move Right">&gt;</button>
				<button class="btn-delete-column" title="Delete Column">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
						<line x1="10" y1="11" x2="10" y2="17"/>
						<line x1="14" y1="11" x2="14" y2="17"/>
					</svg>
				</button>
			</div>
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
	} catch (e) {
		console.error("Could not parse task data:", taskData.encrypted_data);
	}

	const isCompleted = taskData.classification === 'completed';
	let classificationClass = '';
	if (!isCompleted) {
		classificationClass = `classification-${taskData.classification}`;
	}

	return `
		<div class="task-card ${isCompleted ? 'completed' : ''} ${classificationClass}" data-task-id="${taskData.task_id}" draggable="true">
			<div class="task-status-band"></div>
			<input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
			<span class="task-title">${taskTitle}</span>
		</div>
	`;
}