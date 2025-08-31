/**
 * MyDayHub Beta 5 - Main Application Logic
 *
 * This script initializes the application, handles view switching,
 * and loads the necessary modules for the active view.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */
document.addEventListener('DOMContentLoaded', () => {
	console.log("MyDayHub App Initialized");

	// For now, we only have the Tasks view.
	// We check if the function to initialize it exists before calling it.
	if (typeof initTasksView === 'function') {
		initTasksView();
	}

	// Future logic for view tabs and other global UI will go here.
});