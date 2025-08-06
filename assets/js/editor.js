/**
 * MyDayHub v4.0.0
 * /assets/js/editor.js
 *
 * This module controls the state and behavior of the Unified Note Editor.
 * It is designed to be a self-contained component that can be called
 * from any other part of the application (e.g., tasks.js, journal.js).
 */

const UnifiedEditor = (function () {

	// --- Private state and DOM element references ---
	let state = {
		isOpen: false,
		isMaximized: false,
		currentDataType: null, // e.g., 'task' or 'journal'
		currentData: null
	};

	// Cache all relevant DOM elements for performance
	const elements = {
		overlay: document.getElementById('unified-editor-overlay'),
		container: document.getElementById('unified-editor-container'),
		title: document.getElementById('editor-title'),
		textarea: document.getElementById('editor-textarea'),
		closeBtn: document.getElementById('editor-btn-close'),
		maximizeBtn: document.getElementById('editor-btn-maximize'),
		restoreBtn: document.getElementById('editor-btn-restore'),
		ribbonTabs: document.querySelectorAll('.ribbon-tab'),
		ribbonPanels: document.querySelectorAll('.ribbon-panel')
	};

	/**
	 * Toggles the editor between its default and maximized states.
	 */
	function toggleMaximize() {
		state.isMaximized = !state.isMaximized;
		elements.container.classList.toggle('is-maximized', state.isMaximized);
		elements.container.classList.toggle('is-default', !state.isMaximized);

		// Toggle visibility of maximize/restore buttons
		elements.maximizeBtn.style.display = state.isMaximized ? 'none' : 'block';
		elements.restoreBtn.style.display = state.isMaximized ? 'block' : 'none';
	}

	/**
	 * Handles clicks on the ribbon tabs to switch panels.
	 * @param {Event} e The click event.
	 */
	function switchTab(e) {
		const targetPanelId = e.target.dataset.panel;

		// Deactivate all tabs and panels
		elements.ribbonTabs.forEach(tab => tab.classList.remove('active'));
		elements.ribbonPanels.forEach(panel => panel.classList.remove('active'));

		// Activate the clicked tab
		e.target.classList.add('active');

		// Activate the corresponding panel
		const targetPanel = document.getElementById(`editor-panel-${targetPanelId}`);
		if (targetPanel) {
			targetPanel.classList.add('active');
		}
	}

	/**
	 * Opens the editor with the specified data.
	 * @param {object} options - The data to load into the editor.
	 * @param {string} options.type - The type of data ('task', 'journal', etc.).
	 * @param {object} options.data - The actual data object.
	 */
	function open(options = {}) {
		state.currentDataType = options.type || 'note';
		state.currentData = options.data || {};

		console.log(`Opening editor for ${state.currentDataType}:`, state.currentData);

		// --- Populate Editor Fields (Example) ---
		// We will make this more robust later.
		elements.title.textContent = state.currentData.title || 'Edit Note';
		elements.textarea.value = state.currentData.notes || '';

		// Set the initial size and show the editor
		elements.container.classList.add('is-default');
		elements.overlay.style.display = 'flex';
		elements.textarea.focus();
		state.isOpen = true;
	}

	/**
	 * Closes the editor.
	 */
	function close() {
		// Reset sizing classes
		elements.container.classList.remove('is-default', 'is-maximized');
		elements.overlay.style.display = 'none';
		state.isOpen = false;

		// Reset data
		state.currentDataType = null;
		state.currentData = null;
	}

	/**
	 * Sets up all the event listeners for the editor.
	 */
	function init() {
		if (!elements.overlay) {
			console.error("Unified Editor HTML not found. Aborting initialization.");
			return;
		}

		// --- Bind Event Listeners ---
		elements.closeBtn.addEventListener('click', close);
		elements.maximizeBtn.addEventListener('click', toggleMaximize);
		elements.restoreBtn.addEventListener('click', toggleMaximize);

		elements.ribbonTabs.forEach(tab => {
			tab.addEventListener('click', switchTab);
		});

		console.log("Unified Editor initialized.");
	}

	// --- Public API ---
	// Expose only the methods that need to be public.
	return {
		init: init,
		open: open
	};

})();