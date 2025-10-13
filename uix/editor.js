/**
 * Code for /uix/editor.js
 *
 * MyDayHub - Unified Note Editor
 * File: /uix/editor.js
 * Adapted from the robust Beta 4 implementation.
 *
 * @version 8.1 Tamarindo
 * @author Alex & Gemini & Claude & Cursor
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
	
	let fontSizeSaveTimer = null;
	const FONT_SAVE_DELAY = 1500;

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

	function markAsDirtyAndQueueSave() {
		state.isDirty = true;
		updateStats();
		elements.saveStatus.textContent = 'Unsaved changes...';
		clearTimeout(autosaveTimer);
		autosaveTimer = setTimeout(save, AUTOSAVE_DELAY);
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

		elements.textarea.addEventListener('input', markAsDirtyAndQueueSave);
		elements.textarea.addEventListener('keydown', handleTabKey);
	}

	// Modified for global apiFetch
	async function saveFontSizePreference(size) {
		try {
			// Now using the global, secure apiFetch function from app.js
			const result = await apiFetch({
				module: 'users',
				action: 'saveUserPreference',
				key: 'editor_font_size',
				value: size
			});

			if (result.status !== 'success') {
				throw new Error(result.message || 'Failed to save font size.');
			}
			const boardContainer = document.getElementById('task-board-container');
			if(boardContainer) {
				boardContainer.dataset.editorFontSize = size;
			}
		} catch (error) {
			console.error('Save font size error:', error);
			showToast({ message: 'Could not save font size preference.', type: 'error' });
		}
	}

	function changeFontSize(amount) {
		const newSize = state.fontSize + amount;
		if (newSize >= state.minFontSize && newSize <= state.maxFontSize) {
			state.fontSize = newSize;
			elements.textarea.style.fontSize = `${state.fontSize}px`;
			clearTimeout(fontSizeSaveTimer);
			fontSizeSaveTimer = setTimeout(() => {
				saveFontSizePreference(state.fontSize);
			}, FONT_SAVE_DELAY);
		}
	}
	
	async function handleFormatAction(e) {
		const button = e.currentTarget;
		const action = button.dataset.action;
		
		if (action === 'clear-note') {
			const confirmed = await showConfirm('Are you sure you want to clear the entire note? This cannot be undone.');
			if (confirmed) {
				elements.textarea.value = '';
				elements.textarea.focus();
				markAsDirtyAndQueueSave();
			}
			return;
		}

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
					// Use math.js for safer evaluation
					newText = `${selectedText} = ${math.evaluate(selectedText)}`;
				} catch (err) {
					newText = selectedText;
				}
				break;
		}

		elements.textarea.setRangeText(newText, start, end, 'select');
		elements.textarea.focus();
		markAsDirtyAndQueueSave();
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
		markAsDirtyAndQueueSave();
	}

	// Modified for global apiFetch and success toast
	async function save() {
		clearTimeout(autosaveTimer);

		if (!state.isDirty || !state.currentTaskId) {
			return true;
		}

		elements.saveStatus.textContent = 'Saving...';
		
		try {
			// Use the new global, secure apiFetch function.
			const result = await apiFetch({
				module: 'tasks',
				action: 'saveTaskDetails',
				task_id: state.currentTaskId,
				notes: elements.textarea.value
			});
			
			// apiFetch handles non-OK responses, so we only need to check the logical status
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
			
			// Show a success toast notification to the user.
			showToast({ message: 'Note saved successfully.', type: 'success' });

			const hasNotes = elements.textarea.value.trim() !== '';
			const event = new CustomEvent('noteSaved', {
				detail: {
					taskId: state.currentTaskId,
					hasNotes: hasNotes
				}
			});
			document.dispatchEvent(event);

			return true;

		} catch (error) {
			console.error('Save error:', error);
			elements.saveStatus.textContent = 'Save failed!';
			showToast({ message: error.message, type: 'error' });
			return false;
		}
	}

	function open(options = {}) {
		const { id, kind = 'task', title = 'Edit Note', content = '', updatedAt, fontSize } = options;
		
		state.currentTaskId = id;
		state.fontSize = fontSize || 16;

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
	}

	document.addEventListener('DOMContentLoaded', init);

	window.UnifiedEditor = {
		open,
		close
	};

})();