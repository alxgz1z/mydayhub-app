/**
 * MyDayHub 4.0.0 Beta - Main Application Logic (Glue)
 *
 * @version 4.0.0
 * @author Alex & Gemini
 */

document.addEventListener('DOMContentLoaded', () => {

	console.log("MyDayHub App Initialized");

	const addColumnForm = document.getElementById('add-column-form');
	const newColumnTitleInput = document.getElementById('new-column-title');

	if (addColumnForm) {
		addColumnForm.addEventListener('submit', (event) => {
			event.preventDefault();
			const newTitle = newColumnTitleInput.value.trim();

			if (newTitle) {
				addColumnToBoard(newTitle);
				newColumnTitleInput.value = '';
			}
		});
	}

	// Initialize the event listeners for the Tasks view.
	initTasksView();

});