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
 * REFACTORED: Creates and displays the 'Add New Column' form in the header.
 * This is now a standalone function called by a delegated event listener.
 */
const showAddColumnForm = () => {
	const container = document.getElementById('add-column-container');
	if (!container) return;

	const originalButtonHTML = `<button id="btn-add-new-column">+ New Column</button>`;
	container.innerHTML = `
		<form id="add-column-form">
			<input type="text" id="new-column-title" class="form-control" placeholder="New Column Title..." maxlength="50" required autofocus>
		</form>
	`;

	const form = container.querySelector('#add-column-form');
	const input = form.querySelector('#new-column-title');

	const revertToButton = () => {
		// Only revert if the form is still present in the DOM.
		if (document.getElementById('add-column-form')) {
			container.innerHTML = originalButtonHTML;
		}
	};

	// When the input loses focus, revert back to the button.
	input.addEventListener('blur', revertToButton);

	// Handle form submission.
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const newTitle = input.value.trim();
		// The addColumnToBoard function is available globally from tasks.js
		if (newTitle && typeof addColumnToBoard === 'function') {
			addColumnToBoard(newTitle);
		}
		// Always revert back to the button after submission.
		revertToButton();
	});
};


/**
 * Shows a custom confirmation modal and returns a Promise that resolves with the user's choice.
 */
const showConfirmationModal = ({ title, message, confirmText = 'OK', cancelText = 'Cancel' }) => {
	const modalOverlay = document.getElementById('confirmation-modal-overlay');
	const modalTitle = document.getElementById('modal-title');
	const modalMessage = document.getElementById('modal-message');
	const btnConfirm = document.getElementById('modal-btn-confirm');
	const btnCancel = document.getElementById('modal-btn-cancel');

	if (!modalOverlay || !modalTitle || !modalMessage || !btnConfirm || !btnCancel) {
		console.error("Modal elements not found in the DOM.");
		return Promise.resolve(false);
	}

	modalTitle.textContent = title;
	modalMessage.textContent = message;
	btnConfirm.textContent = confirmText;
	btnCancel.textContent = cancelText;

	modalOverlay.classList.add('active');

	return new Promise(resolve => {
		const close = (decision) => {
			modalOverlay.classList.remove('active');
			btnConfirm.onclick = null; // Clean up listeners
			btnCancel.onclick = null;
			resolve(decision);
		};
		btnConfirm.onclick = () => close(true);
		btnCancel.onclick = () => close(false);
	});
};

/**
 * Initializes the responsive mobile header menu.
 */
const initMobileMenu = () => {
	const toggleBtn = document.getElementById('mobile-menu-toggle');
	const dropdown = document.getElementById('mobile-menu-dropdown');
	if (!toggleBtn || !dropdown) return;

	let isMenuPopulated = false;

	const populateMenu = () => {
		dropdown.innerHTML = ''; 

		const viewTabs = document.querySelectorAll('.view-tabs .view-tab');
		viewTabs.forEach(tab => {
			const clone = tab.cloneNode(true);
			clone.addEventListener('click', () => dropdown.classList.remove('show'));
			dropdown.appendChild(clone);
		});

		const addColumnBtn = document.getElementById('btn-add-new-column');
		if (addColumnBtn) {
			const clone = addColumnBtn.cloneNode(true);
			clone.addEventListener('click', () => dropdown.classList.remove('show'));
			dropdown.appendChild(clone);
		}
		isMenuPopulated = true;
	};

	toggleBtn.addEventListener('click', (event) => {
		event.stopPropagation();
		if (!isMenuPopulated) {
			populateMenu();
		}
		dropdown.classList.toggle('show');
	});

	window.addEventListener('click', (event) => {
		if (dropdown.classList.contains('show') && !toggleBtn.contains(event.target)) {
			dropdown.classList.remove('show');
		}
	});
};


document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	// Initialize the main navigation tab switcher and contextual body class.
	initViewSwitcher();

	// Initialize the mobile header menu functionality.
	initMobileMenu();

	// Initialize the event listeners for the Tasks view (e.g., adding tasks).
	initTasksView();

	// Global delegated event listener for actions like the '+ New Column' button.
	document.addEventListener('click', (event) => {
		if (event.target && event.target.id === 'btn-add-new-column') {
			event.preventDefault();
			showAddColumnForm();
		}
	});
});