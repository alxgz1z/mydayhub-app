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

	const showForm = () => {
		const originalButtonHTML = container.innerHTML;
		container.innerHTML = `
			<form id="add-column-form">
				<input type="text" id="new-column-title" class="form-control" placeholder="New Column Title..." maxlength="50" required autofocus>
			</form>
		`;

		const form = container.querySelector('#add-column-form');
		const input = form.querySelector('#new-column-title');

		const revertToButton = () => {
			container.innerHTML = originalButtonHTML;
		};

		input.addEventListener('blur', revertToButton);

		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const newTitle = input.value.trim();
			if (newTitle) {
				addColumnToBoard(newTitle);
				input.value = '';
				input.focus();
			}
		});
	};

	// This handler will be used for both click and touch events.
	const eventHandler = (event) => {
		if (event.target.id === 'btn-add-new-column') {
			// Prevent the browser from firing a "ghost" click after the touch event.
			event.preventDefault();
			showForm();
		}
	};

	container.addEventListener('click', eventHandler);
	container.addEventListener('touchstart', eventHandler);
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