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

	const initialActiveTab = document.querySelector('.view-tab.active');
	if (initialActiveTab) {
		body.classList.add(`view-${initialActiveTab.dataset.view}-active`);
	}

	viewTabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const targetViewId = tab.dataset.view;
			const targetView = document.getElementById(`${targetViewId}-view-container`);

			if (tab.classList.contains('active')) {
				return;
			}

			viewTabs.forEach(t => t.classList.remove('active'));
			viewContainers.forEach(c => c.classList.remove('active'));

			tab.classList.add('active');
			if (targetView) {
				targetView.classList.add('active');
			}

			body.classList.remove('view-tasks-active', 'view-journal-active', 'view-outlines-active', 'view-meetings-active');
			body.classList.add(`view-${targetViewId}-active`);
		});
	});
};

/**
 * Initializes the '+ New Column' button in the header.
 * Handles showing and submitting the dynamic form.
 */
const initAddColumnButton = () => {
	const container = document.getElementById('add-column-container');
	if (!container) return;

	// This function replaces the button with the form.
	const showForm = () => {
		const originalButtonHTML = container.innerHTML;
		container.innerHTML = `
			<form id="add-column-form">
				<input type="text" id="new-column-title" class="form-control" placeholder="New Column Title..." maxlength="50" required autofocus>
			</form>
		`;

		const form = container.querySelector('#add-column-form');
		const input = container.querySelector('#new-column-title');

		// Reverts the form back to the button.
		const revertToButton = () => {
			container.innerHTML = originalButtonHTML;
		};

		// If the user clicks away from the input, revert to the button.
		input.addEventListener('blur', revertToButton);

		// Handle form submission.
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const newTitle = input.value.trim();
			if (newTitle) {
				addColumnToBoard(newTitle); // This function lives in tasks.js
				// Clear the input and re-focus to allow adding another column.
				input.value = '';
				input.focus();
			}
		});
	};

	// Listen for clicks on the container to catch the button click.
	container.addEventListener('click', (event) => {
		if (event.target.id === 'btn-add-new-column') {
			showForm();
		}
	});
};


document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	// Initialize the main navigation tab switcher and contextual body class.
	initViewSwitcher();

	// Initialize the dynamic 'Add New Column' button in the header.
	initAddColumnButton();

	// Initialize the event listeners for the Tasks view (e.g., adding tasks).
	// This function is defined in /assets/js/tasks.js
	initTasksView();
});