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

	const eventHandler = (event) => {
		if (event.target.id === 'btn-add-new-column') {
			event.preventDefault();
			showForm();
		}
	};

	container.addEventListener('click', eventHandler);
	container.addEventListener('touchstart', eventHandler);
};

/**
 * Shows a custom confirmation modal and returns a Promise that resolves with the user's choice.
 * @param {object} options - The options for the modal.
 * @param {string} options.title - The title of the modal.
 * @param {string} options.message - The confirmation message.
 * @param {string} [options.confirmText='OK'] - The text for the confirm button.
 * @param {string} [options.cancelText='Cancel'] - The text for the cancel button.
 * @returns {Promise<boolean>} - A promise that resolves to true if confirmed, false otherwise.
 */
const showConfirmationModal = ({ title, message, confirmText = 'OK', cancelText = 'Cancel' }) => {
	const modalOverlay = document.getElementById('confirmation-modal-overlay');
	const modalTitle = document.getElementById('modal-title');
	const modalMessage = document.getElementById('modal-message');
	const btnConfirm = document.getElementById('modal-btn-confirm');
	const btnCancel = document.getElementById('modal-btn-cancel');

	if (!modalOverlay || !modalTitle || !modalMessage || !btnConfirm || !btnCancel) {
		console.error("Modal elements not found in the DOM.");
		return Promise.resolve(false); // Fails safely
	}

	// Populate the modal with the provided text
	modalTitle.textContent = title;
	modalMessage.textContent = message;
	btnConfirm.textContent = confirmText;
	btnCancel.textContent = cancelText;

	// Show the modal by adding the .active class (CSS handles the display)
	modalOverlay.classList.add('active');

	return new Promise(resolve => {
		const close = (decision) => {
			modalOverlay.classList.remove('active');
			resolve(decision);
		};

		// Add event listeners that only fire once
		btnConfirm.addEventListener('click', () => close(true), { once: true });
		btnCancel.addEventListener('click', () => close(false), { once: true });
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