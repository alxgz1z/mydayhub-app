/**
 * MyDayHub 4.0.0 Beta - Main Application Logic
 *
 * This file contains the primary client-side logic, including event listeners,
 * state management, and view routing for the Single Page App (SPA).
 *
 * @version 4.0.0
 * @author Alex & Gemini
 */

// Wait until the entire HTML document is loaded and parsed before running any scripts.
document.addEventListener('DOMContentLoaded', () => {

	console.log("MyDayHub App Initialized");

	// --- Add New Column Form Handler --- //

	// Get the form and input elements from the DOM.
	const addColumnForm = document.getElementById('add-column-form');
	const newColumnTitleInput = document.getElementById('new-column-title');

	// Check if the form exists on the page to avoid errors.
	if (addColumnForm) {
		// Add a 'submit' event listener to the form.
		addColumnForm.addEventListener('submit', (event) => {
			// Prevent the default browser behavior of reloading the page on form submission.
			event.preventDefault();

			// Get the trimmed value from the input field.
			const newTitle = newColumnTitleInput.value.trim();

			// Check if the title is not empty.
			if (newTitle) {
				// For now, we will just log the new title to the browser console for testing.
				console.log(`New column to be added: "${newTitle}"`);

				// TODO: In a future step, we will send this to the backend API.

				// Clear the input field for the next entry.
				newColumnTitleInput.value = '';
			}
		});
	}

	// Other initializations and event listeners will go here in the future.

});