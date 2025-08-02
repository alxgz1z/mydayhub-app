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
 * view container and updates the body class for contextual styling.
 */
const initViewSwitcher = () => {
	const viewTabs = document.querySelectorAll('.view-tab');
	const viewContainers = document.querySelectorAll('.view-container');
	const body = document.body;

	// Set the initial body class based on the default active tab on page load.
	const initialActiveTab = document.querySelector('.view-tab.active');
	if (initialActiveTab) {
		body.classList.add(`view-${initialActiveTab.dataset.view}-active`);
	}

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

			// Remove all possible view-related classes from the body.
			body.classList.remove('view-tasks-active', 'view-journal-active', 'view-outlines-active', 'view-meetings-active');
			// Add the new class that corresponds to the active view.
			body.classList.add(`view-${targetViewId}-active`);
		});
	});
};


document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	// Initialize the main navigation tab switcher and contextual body class.
	initViewSwitcher();

	// This listener can remain here. It will find the form in the header
	// and attach the event listener correctly on page load.
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