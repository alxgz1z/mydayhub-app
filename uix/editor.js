/**
 * MyDayHub Beta 5 - Unified Note Editor
 * File: /uix/editor.js
 * Adapted from the robust Beta 4 implementation.
 *
 * @version 5.1.0
 * @author Alex & Gemini
 *
 * Public API:
 * window.UnifiedEditor.open({ id, kind, title, content })
 * window.UnifiedEditor.close()
 *
 * This module is self-contained and handles its own visibility.
 */

(function() {
	"use strict";

	let elements = {};
	const state = {
		isOpen: false,
		isMaximized: false,
		isDirty: false,
		currentTaskId: null,
		fontSize: 16,
		minFontSize: 10,
		maxFontSize: 32
	};

	function bindElements() {
		elements.overlay = document.getElementById('unified-editor-overlay');
		elements.container = document.getElementById('unified-editor-container');
		elements.title = document.getElementById('editor-title');
		elements.textarea = document.getElementById('editor-textarea');
		elements.btnClose = document.getElementById('editor-btn-close');
		elements.btnSaveClose = document.getElementById('btn-editor-save-close'); // Added for persistence
		elements.btnMaximize = document.getElementById('editor-btn-maximize');
		elements.btnRestore = document.getElementById('editor-btn-restore');
		elements.tabs = document.querySelectorAll('#editor-ribbon-tabs .ribbon-tab');
		elements.panels = document.querySelectorAll('#editor-ribbon-panels .ribbon-panel');
		elements.formatActions = document.querySelectorAll('#editor-panel-format [data-action]');
		elements.wordCount = document.querySelector('#editor-doc-stats span:first-child');
		elements.charCount = document.querySelector('#editor-doc-stats span:last-child');
		elements.saveStatus = document.getElementById('editor-save-status');
	}

	function updateStats() {
		if (!elements.textarea || !elements.wordCount || !elements.charCount) return;
		const text = elements.textarea.value;
		const chars = text.length;
		const words = text.trim().split(/\s+/).filter(Boolean).length;
		elements.wordCount.textContent = `Words: ${words}`;
		elements.charCount.textContent = `Chars: ${chars}`;
	}

	function attachEventListeners() {
		elements.btnClose.addEventListener('click', close);
		elements.btnSaveClose.addEventListener('click', close); // Modified for persistence
		elements.btnMaximize.addEventListener('click', maximize);
		elements.btnRestore.addEventListener('click', restore);

		elements.tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				const panelId = tab.dataset.panel;
				elements.tabs.forEach(t => t.classList.remove('active'));
				elements.panels.forEach(p => p.classList.remove('active'));
				tab.classList.add('active');
				document.getElementById(`editor-panel-${panelId}`).classList.add('active');
			});
		});

		elements.formatActions.forEach(button => {
			button.addEventListener('click', handleFormatAction);
		});

		elements.textarea.addEventListener('input', () => {
			state.isDirty = true;
			updateStats();
			elements.saveStatus.textContent = 'Unsaved changes...';
		});

		elements.textarea.addEventListener('keydown', handleTabKey);
	}

	function changeFontSize(amount) {
		const newSize = state.fontSize + amount;
		if (newSize >= state.minFontSize && newSize <= state.maxFontSize) {
			state.fontSize = newSize;
			elements.textarea.style.fontSize = `${state.fontSize}px`;
		}
	}
	
	function handleFormatAction(e) {
		const button = e.currentTarget;
		const action = button.dataset.action;
		
		if (action === 'font-size') {
			const change = parseInt(button.dataset.change, 10);
			changeFontSize(change);
			return;
		}

		const { selectionStart: start, selectionEnd: end, value } = elements.textarea;
		const selectedText = value.substring(start, end);

		if (!selectedText && action !== 'frame' && action !== 'underline') return;

		let newText = selectedText;

		switch (action) {
			case 'case':
				const caseType = button.dataset.casetype;
				if (caseType === 'upper') newText = selectedText.toUpperCase();
				if (caseType === 'lower') newText = selectedText.toLowerCase();
				if (caseType === 'title') {
					newText = selectedText.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
				}
				break;
			case 'underline':
				newText = selectedText + '\n' + '—'.repeat(selectedText.length || 10);
				break;
			case 'frame':
				const lines = selectedText.split('\n');
				const maxLength = Math.max(...lines.map(line => line.length));
				const framedLines = lines.map(line => `| ${line.padEnd(maxLength)} |`);
				const border = `+${'—'.repeat(maxLength + 2)}+`;
				newText = `${border}\n${framedLines.join('\n')}\n${border}`;
				break;
			case 'calculate':
				if (!selectedText) return;
				try {
					newText = `${selectedText} = ${math.evaluate(selectedText)}`;
				} catch (err) {
					newText = selectedText;
				}
				break;
		}

		elements.textarea.setRangeText(newText, start, end, 'select');
		elements.textarea.focus();
		state.isDirty = true;
	}

	function handleTabKey(e) {
		if (e.key !== 'Tab') return;
		e.preventDefault();

		const textarea = elements.textarea;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		
		if (e.shiftKey) {
			const value = textarea.value;
			const lineStart = value.lastIndexOf('\n', start - 1) + 1;
			if (value.substring(lineStart, lineStart + 1) === '\t') {
				textarea.setRangeText('', lineStart, lineStart + 1, 'end');
			}
		} else {
			textarea.setRangeText('\t', start, end, 'end');
		}
		state.isDirty = true;
	}

	// Modified for persistence: New async save function
	/**
	 * Saves the current note content to the backend if changes have been made.
	 * @returns {Promise<boolean>} - True if save was successful or not needed, false on error.
	 */
	async function save() {
		if (!state.isDirty || !state.currentTaskId) {
			return true; // No changes to save, so it's a "success"
		}

		elements.saveStatus.textContent = 'Saving...';
		
		try {
			const appURL = window.MyDayHub_Config?.appURL || '';
			const response = await fetch(`${appURL}/api/api.php`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					module: 'tasks',
					action: 'saveTaskDetails',
					data: {
						task_id: state.currentTaskId,
						notes: elements.textarea.value
					}
				})
			});

			const result = await response.json();
			if (result.status !== 'success') {
				throw new Error(result.message || 'Failed to save notes.');
			}
			
			// Update the DOM element to keep the UI in sync
			const taskCard = document.querySelector(`.task-card[data-task-id="${state.currentTaskId}"]`);
			if (taskCard) {
				taskCard.dataset.notes = encodeURIComponent(elements.textarea.value);
			}

			state.isDirty = false;
			elements.saveStatus.textContent = `Saved at ${new Date().toLocaleTimeString()}`;
			return true;

		} catch (error) {
			console.error('Save error:', error);
			elements.saveStatus.textContent = 'Save failed!';
			showToast(error.message, 'error');
			return false;
		}
	}

	function open(options = {}) {
		const { id, kind = 'task', title = 'Edit Note', content = '' } = options;
		
		state.currentTaskId = id;
		elements.title.textContent = title;
		elements.textarea.value = content;
		elements.textarea.style.fontSize = `${state.fontSize}px`;

		elements.overlay.classList.remove('hidden');

		elements.textarea.focus();
		updateStats();
		state.isOpen = true;
		state.isDirty = false;
		elements.saveStatus.textContent = 'Last saved: Never';
	}

	// Modified for persistence: Close function is now async to await saving
	async function close() {
		const success = await save();
		if (!success) {
			// Optionally ask user if they want to close anyway
			const confirmed = await showConfirm("Could not save changes. Close anyway?");
			if (!confirmed) return;
		}
		
		elements.overlay.classList.add('hidden');
		state.isOpen = false;
		state.currentTaskId = null;
		elements.textarea.value = '';
	}

	function maximize() {
		if (state.isMaximized) return;
		elements.container.classList.add('is-maximized');
		elements.btnMaximize.style.display = 'none';
		elements.btnRestore.style.display = 'flex';
		state.isMaximized = true;
	}

	function restore() {
		if (!state.isMaximized) return;
		elements.container.classList.remove('is-maximized');
		elements.btnMaximize.style.display = 'flex';
		elements.btnRestore.style.display = 'none';
		state.isMaximized = false;
	}

	function init() {
		bindElements();
		attachEventListeners();
		console.log("Unified Editor Initialized");
	}

	document.addEventListener('DOMContentLoaded', init);

	window.UnifiedEditor = {
		open,
		close
	};

})();