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

	// Create a unique ID for the new column based on the title and a timestamp.
	const columnId = 'column-' + Date.now();

	// This HTML structure is based on the spec requirements
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

	// Insert the new column HTML at the end of the wrapper.
	taskColumnsWrapper.insertAdjacentHTML('beforeend', newColumnHTML);
};