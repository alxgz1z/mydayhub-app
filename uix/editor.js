/**
 * MyDayHub Beta 5 - Unified Note Editor
 * File: /uix/editor.js
 * Adapted from the robust Beta 4 implementation.
 *
 * @version 5.1.0
 * @author Alex & Gemini
 *
 * Public API:
 * window.UnifiedEditor.open({ id, kind, title, content, updatedAt, fontSize })
 * window.UnifiedEditor.close()
 *
 * This module is self-contained and handles its own visibility.
 */

(function() {
	"use strict";

	let autosaveTimer = null;
	const AUTOSAVE_DELAY = 2000;
	
	// Modified for User Preferences feature: Add a timer for saving font size.
	let fontSizeSaveTimer = null;
	const FONT_SAVE_DELAY = 1500; // 1.5 seconds

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
		elements.btnSaveClose = document.getElementById('btn-editor-save-close');
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
		elements.btnSaveClose.addEventListener('click', close);
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
			clearTimeout(autosaveTimer);
			autosaveTimer = setTimeout(save, AUTOSAVE_DELAY);
		});

		elements.textarea.addEventListener('keydown', handleTabKey);
	}

	/**
	 * Modified for User Preferences feature: Saves the new font size to the backend.
	 */
	async function saveFontSizePreference(size) {
		try {
			const appURL = window.MyDayHub_Config?.appURL || '';
			const response = await fetch(`${appURL}/api/api.php`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					module: 'users',
					action: 'saveUserPreference',
					data: {
						key: 'editor_font_size',
						value: size
					}
				})
			});
			const result = await response.json();
			if (result.status !== 'success') {
				throw new Error(result.message || 'Failed to save font size.');
			}
			// Update the data attribute on the board so it's remembered if the editor is closed and reopened without a page refresh.
			const boardContainer = document.getElementById('task-board-container');
			if(boardContainer) {
				boardContainer.dataset.editorFontSize = size;
			}
		} catch (error) {
			console.error('Save font size error:', error);
			showToast('Could not save font size preference.', 'error');
		}
	}

	/**
	 * Modified for User Preferences feature: Calls the save function after a delay.
	 */
	function changeFontSize(amount) {
		const newSize = state.fontSize + amount;
		if (newSize >= state.minFontSize && newSize <= state.maxFontSize) {
			state.fontSize = newSize;
			elements.textarea.style.fontSize = `${state.fontSize}px`;

			// Debounce the save operation
			clearTimeout(fontSizeSaveTimer);
			fontSizeSaveTimer = setTimeout(() => {
				saveFontSizePreference(state.fontSize);
			}, FONT_SAVE_DELAY);
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
					newText = `${selectedText} = ${eval(selectedText)}`;
				} catch (err) {
					newText = selectedText;
				}
				break;
		}

		elements.textarea.setRangeText(newText, start, end, 'select');
		elements.textarea.focus();
		state.isDirty = true;
		clearTimeout(autosaveTimer);
		autosaveTimer = setTimeout(save, AUTOSAVE_DELAY);
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
		clearTimeout(autosaveTimer);
		autosaveTimer = setTimeout(save, AUTOSAVE_DELAY);
	}

	async function save() {
		clearTimeout(autosaveTimer);

		if (!state.isDirty || !state.currentTaskId) {
			return true;
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
			
			const taskCard = document.querySelector(`.task-card[data-task-id="${state.currentTaskId}"]`);
			if (taskCard) {
				taskCard.dataset.notes = encodeURIComponent(elements.textarea.value);
				taskCard.dataset.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
			}

			state.isDirty = false;
			elements.saveStatus.textContent = `Saved at ${new Date().toLocaleString()}`;
			return true;

		} catch (error) {
			console.error('Save error:', error);
			elements.saveStatus.textContent = 'Save failed!';
			showToast(error.message, 'error');
			return false;
		}
	}

	/**
	 * Modified for User Preferences feature: Accepts and applies the user's font size.
	 */
	function open(options = {}) {
		const { id, kind = 'task', title = 'Edit Note', content = '', updatedAt, fontSize } = options;
		
		state.currentTaskId = id;
		state.fontSize = fontSize || 16; // Use saved font size or default to 16

		elements.title.textContent = title;
		elements.textarea.value = content;
		elements.textarea.style.fontSize = `${state.fontSize}px`;

		elements.overlay.classList.remove('hidden');

		elements.textarea.focus();
		updateStats();
		state.isOpen = true;
		state.isDirty = false;
		
		if (updatedAt) {
			const savedDate = new Date(updatedAt.replace(' ', 'T') + 'Z'); 
			elements.saveStatus.textContent = `Last saved: ${savedDate.toLocaleString()}`;
		} else {
			elements.saveStatus.textContent = 'Ready';
		}
	}

	async function close() {
		clearTimeout(autosaveTimer);

		const success = await save();
		if (!success) {
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