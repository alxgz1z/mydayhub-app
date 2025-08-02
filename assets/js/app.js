/**
 * MyDayHub 4.0.0 Beta - Main Application Logic (Glue)
 *
 * This file contains the primary client-side logic that connects different
 * parts of the application, such as view switching and initializing
 * event listeners for various modules.
 *
 * @version 4.0.0
 * @author Alex & Gemini
 */

/**
 * Initializes the view switcher to handle tab-based navigation.
 * It adds click listeners to all view tabs to show/hide the correct
 * view container based on the tab's `data-view` attribute.
 */
const initViewSwitcher = () => {
	const viewTabs = document.querySelectorAll('.view-tab');
	const viewContainers = document.querySelectorAll('.view-container');

	viewTabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const targetViewId = tab.dataset.view;
			const targetView = document.getElementById(`${targetViewId}-view-container`);

			// Don't do anything if the clicked tab is already active.
			if (tab.classList.contains('active')) {
				return;
			}

			// Deactivate all other tabs and hide all other containers.
			viewTabs.forEach(t => t.classList.remove('active'));
			viewContainers.forEach(c => c.classList.remove('active'));

			// Activate the clicked tab and its corresponding container.
			tab.classList.add('active');
			if (targetView) {
				targetView.classList.add('active');
			}
		});
	});
};


document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	// Initialize the main navigation tab switcher.
	initViewSwitcher();

	// Initialize the event listeners for adding new columns.
	const addColumnForm = document.getElementById('add-column-form');
	const newColumnTitleInput = document.getElementById('new-column-title');
	if (addColumnForm) {
		addColumnForm.addEventListener('submit', (event) => {
			event.preventDefault();
			const newTitle = newColumnTitleInput.value.trim();
			if (newTitle) {
				// This function is defined in /assets/js/tasks.js
				addColumnToBoard(newTitle);
				newColumnTitleInput.value = '';
			}
		});
	}

	// Initialize the event listeners for the Tasks view (e.g., adding tasks).
	// This function is defined in /assets/js/tasks.js
	initTasksView();
});