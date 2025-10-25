/**
 * Code for /uix/editor.js
 *
 * MyDayHub - Unified Note Editor
 * File: /uix/editor.js
 * Adapted from the robust Beta 4 implementation.
 *
 * @version 8.5 Avellanas
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

	let lastSavedTime = null;
	let lastSavedUpdateInterval = null;

	// Undo/Redo system
	let undoStack = [];
	let redoStack = [];
	const MAX_UNDO_STATES = 50;
	let undoSaveTimer = null;
	const UNDO_SAVE_DELAY = 500; // Debounce snapshots

	let elements = {};
	const state = {
		isOpen: false,
		isMaximized: false,
		isDirty: false,
		currentTaskId: null, // Legacy name, but holds either task or journal entry ID
		currentKind: 'task', // 'task' or 'journal'
		fontSize: 16,
		minFontSize: 10,
		maxFontSize: 32,
		isRecording: false,
		recognition: null
	};

	// Find & Replace state
	const findReplaceState = {
		currentMatchIndex: -1,
		matches: [],
		caseSensitive: false,
		wholeWord: false,
		regexMode: false
	};
	
	// Detect if browser supports Web Speech API
	function supportsVoiceRecognition() {
		const ua = navigator.userAgent.toLowerCase();
		const isIOS = /iphone|ipad|ipod/.test(ua);
		const isMac = /macintosh|mac os x/.test(ua);
		const isSafari = /safari/.test(ua) && !/chrome|chromium|edg/.test(ua);
		
		// Check if Web Speech API is available
		const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
		
		// Support Web Speech API on all platforms where it's available
		// This includes Chrome, Edge, Safari on Mac/iOS, and other Chromium-based browsers
		return hasSpeechRecognition;
	}

	function bindElements() {
		elements.overlay = document.getElementById('unified-editor-overlay');
		elements.container = document.getElementById('unified-editor-container');
		elements.title = document.getElementById('editor-title');
		elements.textarea = document.getElementById('editor-textarea');
		elements.btnClose = document.getElementById('editor-btn-close');
		elements.btnMaximize = document.getElementById('editor-btn-maximize');
		elements.btnRestore = document.getElementById('editor-btn-restore');
		elements.tabs = document.querySelectorAll('#editor-ribbon-tabs .ribbon-tab');
		elements.panels = document.querySelectorAll('#editor-ribbon-panels .ribbon-panel');
		elements.formatActions = document.querySelectorAll('#editor-panel-format [data-action]');
		console.log('Format actions found:', elements.formatActions.length);
		console.log('Search button in format actions:', document.querySelector('#editor-btn-search'));
		elements.wordCount = document.querySelector('#editor-doc-stats span:first-child');
		elements.charCount = document.querySelector('#editor-doc-stats span:last-child');
		elements.saveStatus = document.getElementById('editor-save-status');
		
		// Undo/Redo buttons
		elements.undoBtn = document.getElementById('editor-btn-undo');
		elements.redoBtn = document.getElementById('editor-btn-redo');
		
		// Clear button
		elements.clearBtn = document.getElementById('editor-btn-clear');
		
		// Line numbers
		elements.lineNumbersWrapper = document.getElementById('line-numbers-wrapper');
		elements.lineNumbers = document.getElementById('line-numbers');
		elements.lineNumbersBtn = document.getElementById('editor-btn-line-numbers');
		
		// Markdown elements
		elements.markdownHelpBtn = document.getElementById('editor-markdown-help');
		elements.markdownHelpModal = document.getElementById('markdown-help-modal');
		elements.markdownHelpClose = document.getElementById('btn-close-markdown-help');
		
		// Preview elements
		elements.previewContent = document.getElementById('editor-preview-content');
		elements.refreshPreviewBtn = document.getElementById('editor-btn-refresh-preview');
		elements.exportBtn = document.getElementById('editor-btn-export');
		elements.exportMenu = document.getElementById('editor-export-menu');
		elements.exportItems = document.querySelectorAll('.dropdown-item');
		
		// Find & Replace elements
		elements.findInput = document.getElementById('editor-find-input');
		elements.replaceInput = document.getElementById('editor-replace-input');
		elements.findNextBtn = document.getElementById('editor-find-next');
		elements.findPrevBtn = document.getElementById('editor-find-prev');
		elements.replaceBtn = document.getElementById('editor-replace-btn');
		elements.replaceAllBtn = document.getElementById('editor-replace-all-btn');
		elements.caseSensitiveChk = document.getElementById('editor-case-sensitive');
		elements.wholeWordChk = document.getElementById('editor-whole-word');
		elements.regexModeChk = document.getElementById('editor-regex-mode');
		elements.regexHelpBtn = document.getElementById('editor-regex-help');
		elements.regexHelpModal = document.getElementById('regex-help-modal');
		elements.regexHelpClose = document.getElementById('btn-close-regex-help');
		elements.matchCount = document.getElementById('editor-match-count');
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
		
		// Queue undo snapshot (debounced)
		clearTimeout(undoSaveTimer);
		undoSaveTimer = setTimeout(saveUndoState, UNDO_SAVE_DELAY);
	}

	function saveUndoState() {
		if (!elements.textarea) return;
		
		undoStack.push({
			content: elements.textarea.value,
			cursorStart: elements.textarea.selectionStart,
			cursorEnd: elements.textarea.selectionEnd,
			timestamp: Date.now()
		});
		
		// Clear redo stack when new action taken
		redoStack = [];
		
		// Limit undo stack size
		if (undoStack.length > MAX_UNDO_STATES) {
			undoStack.shift();
		}
		
		updateUndoRedoButtons();
	}

	function performUndo() {
		if (undoStack.length === 0) return;
		
		// Save current state to redo stack
		redoStack.push({
			content: elements.textarea.value,
			cursorStart: elements.textarea.selectionStart,
			cursorEnd: elements.textarea.selectionEnd,
			timestamp: Date.now()
		});
		
		// Get previous state
		const state = undoStack.pop();
		elements.textarea.value = state.content;
		elements.textarea.setSelectionRange(state.cursorStart, state.cursorEnd);
		elements.textarea.focus();
		
		state.isDirty = true;
		elements.saveStatus.textContent = 'Unsaved changes...';
		updateStats();
		updateUndoRedoButtons();
		
		// Don't trigger another undo save
		clearTimeout(undoSaveTimer);
	}

	function performRedo() {
		if (redoStack.length === 0) return;
		
		// Save current state to undo stack
		undoStack.push({
			content: elements.textarea.value,
			cursorStart: elements.textarea.selectionStart,
			cursorEnd: elements.textarea.selectionEnd,
			timestamp: Date.now()
		});
		
		// Get next state
		const redoState = redoStack.pop();
		elements.textarea.value = redoState.content;
		elements.textarea.setSelectionRange(redoState.cursorStart, redoState.cursorEnd);
		elements.textarea.focus();
		
		state.isDirty = true;
		elements.saveStatus.textContent = 'Unsaved changes...';
		updateStats();
		updateUndoRedoButtons();
		
		// Don't trigger another undo save
		clearTimeout(undoSaveTimer);
	}

	function updateUndoRedoButtons() {
		if (elements.undoBtn) {
			elements.undoBtn.disabled = undoStack.length === 0;
		}
		if (elements.redoBtn) {
			elements.redoBtn.disabled = redoStack.length === 0;
		}
	}

	function clearUndoRedoStacks() {
		undoStack = [];
		redoStack = [];
		updateUndoRedoButtons();
	}

	// Line Numbers Management
	function updateLineNumbers() {
		if (!elements.lineNumbers || !elements.textarea) return;
		
		const textarea = elements.textarea;
		
		// Count visual lines by checking how many times text wraps
		// Create a clone to measure line wrapping
		const clone = textarea.cloneNode(true);
		clone.style.visibility = 'hidden';
		clone.style.position = 'absolute';
		clone.style.height = 'auto';
		clone.style.minHeight = 'auto';
		document.body.appendChild(clone);
		
		// Get the number of lines from scrollHeight
		const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
		const lines = Math.ceil(clone.scrollHeight / lineHeight);
		
		document.body.removeChild(clone);
		
		// Generate line numbers
		let numbersText = '';
		for (let i = 1; i <= lines; i++) {
			numbersText += i + '\n';
		}
		elements.lineNumbers.textContent = numbersText;
		
		// Sync the wrapper height with textarea
		elements.lineNumbersWrapper.style.minHeight = textarea.scrollHeight + 'px';
	}

	function toggleLineNumbers() {
		if (!elements.lineNumbersWrapper) {
			return;
		}
		
		elements.lineNumbersWrapper.classList.toggle('hidden');
		
		// Save preference
		const isVisible = !elements.lineNumbersWrapper.classList.contains('hidden');
		localStorage.setItem('editorLineNumbersVisible', isVisible);
	}

	function restoreLineNumbersPreference() {
		if (!elements.lineNumbersWrapper) return;
		
		const isVisible = localStorage.getItem('editorLineNumbersVisible');
		if (isVisible === 'false') {
			elements.lineNumbersWrapper.classList.add('hidden');
		}
	}

	// Markdown Functions
	function insertMarkdown(before, after = '') {
		const textarea = elements.textarea;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = textarea.value.substring(start, end);
		const beforeText = textarea.value.substring(0, start);
		const afterText = textarea.value.substring(end);
		
		textarea.value = beforeText + before + selectedText + after + afterText;
		textarea.focus();
		textarea.selectionStart = start + before.length;
		textarea.selectionEnd = start + before.length + selectedText.length;
		
		markAsDirtyAndQueueSave();
		updateStats();
	}

	function insertMarkdownBlock(linePrefix) {
		const textarea = elements.textarea;
		const start = textarea.selectionStart;
		const beforeText = textarea.value.substring(0, start);
		const afterText = textarea.value.substring(start);
		
		// Find the start of the current line
		let lineStart = beforeText.lastIndexOf('\n');
		lineStart = lineStart === -1 ? 0 : lineStart + 1;
		
		// Get everything before the line, the current line, and everything after
		const beforeLine = beforeText.substring(0, lineStart);
		const currentLine = beforeText.substring(lineStart);
		
		// Insert the prefix at the start of the line
		textarea.value = beforeLine + linePrefix + currentLine + afterText;
		textarea.focus();
		textarea.selectionStart = start + linePrefix.length;
		textarea.selectionEnd = textarea.selectionStart;
		
		markAsDirtyAndQueueSave();
		updateStats();
	}

	function renderMarkdown() {
		if (!elements.previewContent || !elements.textarea) return;
		
		try {
			const markdown = elements.textarea.value;
			const html = marked.parse(markdown, {
				breaks: true,
				gfm: true
			});
			elements.previewContent.innerHTML = html;
		} catch (error) {
			console.error('Markdown rendering error:', error);
			elements.previewContent.innerHTML = '<p style="color: #ff6b6b;">Error parsing markdown</p>';
		}
	}

	function exportContent(format) {
		const title = elements.title.textContent.replace('Edit Entry: ', '').trim();
		const content = elements.textarea.value;
		const timestamp = new Date().toLocaleString();
		
		let fileContent, fileName, mimeType;
		
		if (format === 'html') {
			const html = marked.parse(content, { breaks: true, gfm: true });
			fileContent = `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			line-height: 1.6;
			max-width: 900px;
			margin: 0 auto;
			padding: 2rem;
			background: #ffffff;
			color: #333;
		}
		h1, h2, h3, h4, h5, h6 { margin-top: 1.5rem; margin-bottom: 1rem; }
		code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
		pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
		a { color: #0066cc; text-decoration: none; }
		a:hover { text-decoration: underline; }
		blockquote { border-left: 4px solid #ddd; padding-left: 1rem; color: #666; }
		.timestamp { color: #999; font-size: 0.9em; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; }
	</style>
</head>
<body>
	<h1>${title}</h1>
	<div class="content">
		${html}
	</div>
	<div class="timestamp">
		<p>Exported: ${timestamp}</p>
	</div>
</body>
</html>`;
			fileName = `${title}.html`;
			mimeType = 'text/html';
		} else if (format === 'markdown') {
			fileContent = content;
			fileName = `${title}.md`;
			mimeType = 'text/markdown';
		} else if (format === 'plaintext') {
			// Remove markdown formatting
			fileContent = content
				.replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
				.replace(/_(.*?)_/g, '$1')        // Remove italic
				.replace(/`(.*?)`/g, '$1')        // Remove inline code
				.replace(/~~(.*?)~~/g, '$1')      // Remove strikethrough
				.replace(/^#+\s+/gm, '')          // Remove headings
				.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
				.replace(/```[\s\S]*?```/g, '');  // Remove code blocks
			fileName = `${title}.txt`;
			mimeType = 'text/plain';
		}
		
		const blob = new Blob([fileContent], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function handleTabSwitch(tab) {
		const panelId = tab.target.dataset.panel;
		elements.tabs.forEach(t => t.classList.remove('active'));
		elements.panels.forEach(p => p.classList.remove('active'));
		tab.target.classList.add('active');
		document.getElementById(`editor-panel-${panelId}`).classList.add('active');
	}

	function startEditingTitle() {
		if (!elements.title) return;
		
		const currentTitle = elements.title.textContent;
		const input = document.createElement('input');
		input.type = 'text';
		input.value = currentTitle;
		input.className = 'editor-title-input';
		input.style.cssText = `
			font-size: 1.25rem;
			font-weight: 400;
			color: #ffffff;
			background: rgba(255,255,255,0.1);
			border: 2px solid var(--accent-color, #4f46e5);
			border-radius: 8px;
			padding: 0.5rem 1rem;
			font-family: inherit;
			width: 100%;
			box-sizing: border-box;
			outline: none;
		`;
		
		elements.title.textContent = '';
		elements.title.appendChild(input);
		input.focus();
		input.select();
		
		const finishEdit = async () => {
			const newTitle = input.value.trim() || currentTitle;
			elements.title.textContent = newTitle;
			
			// Save title change if editing existing entry
			if (state.currentKind && state.currentTaskId && newTitle !== currentTitle) {
				try {
					if (state.currentKind === 'journal') {
						// Save journal entry title
						console.log('🔄 Updating journal entry title:', { entry_id: state.currentTaskId, title: newTitle });
						const response = await apiFetch({
							module: 'journal',
							action: 'updateEntry',
							entry_id: state.currentTaskId,
							title: newTitle,
							content: elements.textarea.value || ''
						}, 'POST');
						
						console.log('📝 Journal update response:', response);
						
						if (response.status !== 'success') {
							throw new Error(response.message || 'Failed to update title');
						}
						
						// Update the journal entry card in the view
						const entryCard = document.querySelector(`[data-entry-id="${state.currentTaskId}"] .journal-entry-title`);
						if (entryCard) {
							entryCard.textContent = newTitle;
						}
						
						// Show success toast
						showToast(`✅ Title updated to "${newTitle}"`);
					} else if (state.currentKind === 'task') {
						// Save task title
						console.log('🔄 Updating task title:', { task_id: state.currentTaskId, title: newTitle });
						const response = await apiFetch({
							module: 'tasks',
							action: 'renameTaskTitle',
							task_id: state.currentTaskId,
							title: newTitle
						}, 'POST');
						
						console.log('📝 Task update response:', response);
						
						if (response.status !== 'success') {
							throw new Error(response.message || 'Failed to update title');
						}
						
						// Update the task card in the view
						const taskCard = document.querySelector(`[data-task-id="${state.currentTaskId}"] .task-title`);
						if (taskCard) {
							taskCard.textContent = newTitle;
						}
						
						// Show success toast
						showToast(`✅ Title updated to "${newTitle}"`);
					}
				} catch (error) {
					console.error('❌ Error saving title:', error);
					// Revert on error
					elements.title.textContent = currentTitle;
					showToast(`❌ ${error.message || 'Failed to update title'}`);
				}
			}
		};
		
		input.addEventListener('blur', finishEdit);
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				finishEdit();
			} else if (e.key === 'Escape') {
				elements.title.textContent = currentTitle;
			}
		});
	}

	function attachEventListeners() {
		elements.btnClose.addEventListener('click', close);
		elements.btnMaximize.addEventListener('click', maximize);
		elements.btnRestore.addEventListener('click', restore);

		elements.tabs.forEach(tab => {
			tab.addEventListener('click', handleTabSwitch);
		});

		elements.formatActions.forEach(button => {
			console.log('Adding click listener to button:', button.id, 'action:', button.dataset.action);
			button.addEventListener('click', handleFormatAction);
		});

		// Double-click to edit title
		elements.title?.addEventListener('dblclick', startEditingTitle);

		// Undo/Redo button handlers
		elements.undoBtn?.addEventListener('click', performUndo);
		elements.redoBtn?.addEventListener('click', performRedo);

		elements.textarea.addEventListener('input', markAsDirtyAndQueueSave);
		elements.textarea.addEventListener('keydown', handleTabKey);
		elements.textarea.addEventListener('keydown', handleUndoRedoShortcuts);
		
		// Line numbers sync and updates
		elements.textarea.addEventListener('scroll', () => {
			if (elements.lineNumbersWrapper) {
				elements.lineNumbersWrapper.scrollTop = elements.textarea.scrollTop;
			}
		});
		elements.textarea.addEventListener('input', updateLineNumbers);
		
		// Markdown buttons
		document.querySelectorAll('[data-action^="markdown-"]').forEach(button => {
			button.addEventListener('click', (e) => {
				const action = e.target.dataset.action;
				if (action === 'markdown-bold') insertMarkdown('**', '**');
				else if (action === 'markdown-italic') insertMarkdown('_', '_');
				else if (action === 'markdown-code') insertMarkdown('`', '`');
				else if (action === 'markdown-h1') insertMarkdownBlock('# ');
				else if (action === 'markdown-h2') insertMarkdownBlock('## ');
			});
		});
		
		// More menu toggle
		const moreMenuBtn = document.getElementById('editor-btn-more-menu');
		const moreMenuDropdown = document.getElementById('editor-more-menu-dropdown');
		
		moreMenuBtn?.addEventListener('click', (e) => {
			e.stopPropagation();
			moreMenuDropdown?.classList.toggle('visible');
		});
		
		// Close more menu when a button is clicked (before handleFormatAction runs)
		moreMenuDropdown?.querySelectorAll('button').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				setTimeout(() => {
					moreMenuDropdown.classList.remove('visible');
				}, 50);
			}, true); // Use capture phase
		});
		
		// Close more menu when clicking outside
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.btn-more-menu')) {
				moreMenuDropdown?.classList.remove('visible');
			}
		});
		
		// Markdown help modal
		elements.markdownHelpBtn?.addEventListener('click', () => {
			elements.markdownHelpModal?.classList.remove('hidden');
		});
		
		elements.markdownHelpClose?.addEventListener('click', () => {
			elements.markdownHelpModal?.classList.add('hidden');
		});
		
		elements.markdownHelpModal?.addEventListener('click', (e) => {
			if (e.target === elements.markdownHelpModal) {
				elements.markdownHelpModal.classList.add('hidden');
			}
		});
		
		// Preview controls
		elements.refreshPreviewBtn?.addEventListener('click', renderMarkdown);
		
		// Export buttons - handle direct export without dropdown
		const exportButtons = document.querySelectorAll('[data-export-format]');
		exportButtons.forEach(btn => {
			btn.addEventListener('click', (e) => {
				const format = e.target.dataset.exportFormat;
				if (format) {
					exportContent(format);
				}
			});
		});
		
		// Close export menu when clicking outside
		document.addEventListener('click', () => {
			elements.exportMenu?.classList.remove('visible');
		});
		
		// Keyboard shortcut for escape to close markdown help
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				elements.markdownHelpModal?.classList.add('hidden');
			}
		});
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
			// Save to both task board and journal view containers
			const boardContainer = document.getElementById('task-board-container');
			if(boardContainer) {
				boardContainer.dataset.editorFontSize = size;
			}
			const journalContainer = document.getElementById('journal-view');
			if(journalContainer) {
				journalContainer.dataset.editorFontSize = size;
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
		console.log('handleFormatAction called with action:', action);
		
		if (action === 'undo') {
			performUndo();
			return;
		}

		if (action === 'redo') {
			performRedo();
			return;
		}
		
		if (action === 'toggle-line-numbers') {
			toggleLineNumbers();
			return;
		}
		
		if (action === 'search-notes') {
			console.log('Search notes action triggered');
			openSearchNotesModal();
			return;
		}
		
		if (action === 'clear') {
			const confirmed = await showConfirm('Clear all note contents? This will be undoable.');
			if (confirmed) {
				saveUndoState(); // Save current state before clearing
				elements.textarea.value = '';
				elements.textarea.focus();
				markAsDirtyAndQueueSave();
				updateStats();
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

	function handleUndoRedoShortcuts(e) {
		if (e.key === 'z' && (e.metaKey || e.ctrlKey)) { // Cmd+Z or Ctrl+Z
			e.preventDefault();
			if (e.shiftKey) {
				performRedo();
			} else {
				performUndo();
			}
		}
	}

	// Modified for global apiFetch and success toast
	async function save() {
		clearTimeout(autosaveTimer);

		if (!state.isDirty || !state.currentTaskId) {
			return true;
		}

		elements.saveStatus.textContent = 'Saving...';
		
		try {
			let result;
			
			if (state.currentKind === 'journal') {
				// Save journal entry content
				result = await apiFetch({
					module: 'journal',
					action: 'updateEntryContent',
					entry_id: state.currentTaskId,
					content: elements.textarea.value
				});
				
				if (result.status !== 'success') {
					throw new Error(result.message || 'Failed to save journal entry.');
				}
				
				// Update the journal entry card's data attribute
				const entryCard = document.querySelector(`.journal-entry-card[data-entry-id="${state.currentTaskId}"]`);
				if (entryCard) {
					entryCard.dataset.content = encodeURIComponent(elements.textarea.value);
					entryCard.dataset.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
				}
				
				// Dispatch event for journal view to handle re-rendering
				const hasContent = elements.textarea.value.trim() !== '';
				const event = new CustomEvent('contentSaved', {
					detail: {
						entryId: state.currentTaskId,
						hasContent: hasContent
					}
				});
				document.dispatchEvent(event);
			} else {
				// Save task notes (original behavior)
				result = await apiFetch({
					module: 'tasks',
					action: 'saveTaskDetails',
					task_id: state.currentTaskId,
					notes: elements.textarea.value
				});
				
				if (result.status !== 'success') {
					throw new Error(result.message || 'Failed to save notes.');
				}
				
				const taskCard = document.querySelector(`.task-card[data-task-id="${state.currentTaskId}"]`);
				if (taskCard) {
					taskCard.dataset.notes = encodeURIComponent(elements.textarea.value);
					taskCard.dataset.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
				}

				const hasNotes = elements.textarea.value.trim() !== '';
				const event = new CustomEvent('noteSaved', {
					detail: {
						taskId: state.currentTaskId,
						hasNotes: hasNotes
					}
				});
				document.dispatchEvent(event);
			}

			state.isDirty = false;
			elements.saveStatus.textContent = `Last saved: ${new Date().toLocaleString()}`;
			
			// Store the last saved time for periodic updates
			lastSavedTime = new Date();
			
			// Update the save status periodically to show "Last saved X seconds ago"
			if (lastSavedUpdateInterval) {
				clearInterval(lastSavedUpdateInterval);
			}
			lastSavedUpdateInterval = setInterval(updateLastSavedDisplay, 1000);

			return true;

		} catch (error) {
			console.error('Save error:', error);
			elements.saveStatus.textContent = 'Save failed!';
			showToast({ message: error.message, type: 'error' });
			return false;
		}
	}

	function updateLastSavedDisplay() {
		if (!lastSavedTime) return;
		const now = new Date();
		const diffInSeconds = Math.floor((now - lastSavedTime) / 1000);
		
		// Only show relative time if saved within the last minute
		if (diffInSeconds < 60) {
			if (diffInSeconds === 0) {
				elements.saveStatus.textContent = 'Last saved: just now';
			} else if (diffInSeconds === 1) {
				elements.saveStatus.textContent = 'Last saved: 1 second ago';
			} else {
				elements.saveStatus.textContent = `Last saved: ${diffInSeconds} seconds ago`;
			}
		} else {
			// For older saves, show full timestamp and stop updating
			elements.saveStatus.textContent = `Last saved: ${lastSavedTime.toLocaleString()}`;
			if (lastSavedUpdateInterval) {
				clearInterval(lastSavedUpdateInterval);
				lastSavedUpdateInterval = null;
			}
		}
	}

	function open(options = {}) {
		const { id, kind = 'task', title = 'Edit Note', content = '', updatedAt, fontSize } = options;
		
		state.currentTaskId = id;
		state.currentKind = kind;
		state.fontSize = fontSize || 16;

		elements.title.textContent = title;
		elements.textarea.value = content;
		elements.textarea.style.fontSize = `${state.fontSize}px`;

		elements.overlay.classList.remove('hidden');

		elements.textarea.focus();
		updateStats();
		state.isOpen = true;
		state.isDirty = false;
		
		// Initialize line numbers
		updateLineNumbers();
		restoreLineNumbersPreference();
		
		if (updatedAt) {
			const savedDate = new Date(updatedAt.replace(' ', 'T') + 'Z'); 
			elements.saveStatus.textContent = `Last saved: ${savedDate.toLocaleString()}`;
			lastSavedTime = savedDate;
			// Start the interval to show relative time
			if (lastSavedUpdateInterval) {
				clearInterval(lastSavedUpdateInterval);
			}
			lastSavedUpdateInterval = setInterval(updateLastSavedDisplay, 1000);
		} else {
			elements.saveStatus.textContent = 'Ready to edit';
			lastSavedTime = null;
		}
	}

	async function close() {
		clearTimeout(autosaveTimer);
		
		// Only stop voice recording if it was actually active
		if (state.isRecording && state.recognition) {
			console.log('Editor closing with active voice recording - using smart close');
			await stopVoiceRecognitionAndWait();
		}

		// Always save before closing (if there are changes)
		if (state.isDirty) {
			console.log('Editor closing - saving changes before close');
			const success = await save();
			if (!success) {
				const confirmed = await showConfirm("Could not save changes. Close anyway?");
				if (!confirmed) return;
			}
		}
		
		elements.overlay.classList.add('hidden');
		state.isOpen = false;
		state.currentTaskId = null;
		elements.textarea.value = '';
		// Clean up the last saved time and interval when closing
		lastSavedTime = null;
		if (lastSavedUpdateInterval) {
			clearInterval(lastSavedUpdateInterval);
			lastSavedUpdateInterval = null;
		}
		// Clear undo/redo stacks
		clearUndoRedoStacks();
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
	
	// Voice transcription functions
	function initVoiceRecognition() {
		if (!supportsVoiceRecognition()) return;
		
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) return;
		
		state.recognition = new SpeechRecognition();
		state.recognition.continuous = true; // Keep listening
		state.recognition.interimResults = true; // Show interim results
		state.recognition.lang = 'en-US'; // Default language
		
		// When recognition gets results
		state.recognition.onresult = (event) => {
			let interimTranscript = '';
			let finalTranscript = '';
			
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcript = event.results[i][0].transcript;
				if (event.results[i].isFinal) {
					finalTranscript += transcript + ' ';
				} else {
					interimTranscript += transcript;
				}
			}
			
			// Insert final transcript at cursor position
			if (finalTranscript) {
				insertTextAtCursor(finalTranscript);
				markAsDirtyAndQueueSave();
			}
		};
		
		state.recognition.onerror = (event) => {
			console.error('Speech recognition error:', event.error, event);
			stopVoiceRecognition();
			
			if (event.error === 'not-allowed' || event.error === 'permission-denied') {
				showToast({ 
					message: 'Microphone access denied. Please check browser permissions and try refreshing the page.', 
					type: 'error',
					duration: 5000
				});
			} else if (event.error === 'no-speech') {
				showToast({ 
					message: 'No speech detected. Please try again.', 
					type: 'info' 
				});
			} else if (event.error === 'network') {
				showToast({ 
					message: 'Network error. Please check your internet connection.', 
					type: 'error' 
				});
			} else if (event.error === 'aborted') {
				// Aborted errors are expected during smart close - don't show error toast
				console.log('Speech recognition aborted (expected during smart close)');
			} else {
				showToast({ 
					message: `Voice recognition error: ${event.error}. Please try again.`, 
					type: 'error',
					duration: 5000
				});
			}
		};
		
		state.recognition.onend = () => {
			if (state.isRecording && state.recognition) {
				// Only restart if we're still in recording mode and recognition object exists
				try {
					state.recognition.start();
				} catch (error) {
					console.log('Recognition restart error (expected during close):', error);
					// If restart fails, stop the recording
					stopVoiceRecognition();
				}
			} else {
				stopVoiceRecognition();
			}
		};
	}
	
	function insertTextAtCursor(text) {
		const textarea = elements.textarea;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const currentValue = textarea.value;
		
		// Insert text at cursor position
		textarea.value = currentValue.substring(0, start) + text + currentValue.substring(end);
		
		// Move cursor to end of inserted text
		const newCursorPos = start + text.length;
		textarea.setSelectionRange(newCursorPos, newCursorPos);
		textarea.focus();
	}
	
	function startVoiceRecognition() {
		// Check if we're on HTTPS or localhost (required for microphone access)
		const isSecureContext = window.isSecureContext;
		const protocol = window.location.protocol;
		
		console.log('Voice recognition debug:', {
			isSecureContext,
			protocol,
			userAgent: navigator.userAgent,
			hasRecognition: !!state.recognition
		});
		
		if (!isSecureContext && protocol === 'http:') {
			showToast({ 
				message: 'Voice recording requires HTTPS. Please use https://localhost instead.', 
				type: 'error',
				duration: 5000
			});
			return;
		}
		
		if (!state.recognition) {
			initVoiceRecognition();
		}
		
		if (!state.recognition) {
			showToast({ 
				message: 'Voice recognition is not available on this device.', 
				type: 'error' 
			});
			return;
		}
		
		// Try to get microphone permission first using getUserMedia
		console.log('Requesting microphone access...');
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			// Try with flexible constraints first
			const constraints = {
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			};
			
			navigator.mediaDevices.getUserMedia(constraints)
				.then(stream => {
					console.log('Microphone access granted via getUserMedia');
					// Stop the stream immediately - we just needed permission
					stream.getTracks().forEach(track => track.stop());
					
					// Now try to start recognition
					tryStartRecognition();
				})
				.catch(error => {
					console.error('Microphone access error:', error);
					
					if (error.name === 'OverconstrainedError') {
						// Try with minimal constraints
						console.log('Trying with minimal constraints...');
						navigator.mediaDevices.getUserMedia({ audio: {} })
							.then(stream => {
								console.log('Microphone access granted with minimal constraints');
								stream.getTracks().forEach(track => track.stop());
								tryStartRecognition();
							})
							.catch(minimalError => {
								console.error('Minimal constraints also failed:', minimalError);
								showToast({ 
									message: 'Microphone access failed. Please check your microphone settings.', 
									type: 'error',
									duration: 5000
								});
							});
					} else {
						showToast({ 
							message: 'Microphone access denied. Please enable it in your browser settings.', 
							type: 'error',
							duration: 5000
						});
					}
				});
		} else {
			// Fallback for browsers without getUserMedia
			console.log('No getUserMedia API, trying direct start...');
			tryStartRecognition();
		}
		
		function tryStartRecognition() {
			try {
				console.log('Attempting to start voice recognition...');
				state.isRecording = true;
				state.recognition.start();
				console.log('Voice recognition started successfully');
				
				// Update button visual state
				const voiceBtn = document.getElementById('editor-btn-voice');
				if (voiceBtn) {
					voiceBtn.classList.add('recording');
					voiceBtn.title = 'Stop Recording';
				}
				
				
				showToast({ 
					message: 'Listening... Speak now.', 
					type: 'success',
					duration: 2000
				});
			} catch (error) {
				console.error('Error starting voice recognition:', error);
				state.isRecording = false;
				
				// More specific error for HTTPS requirement
				if (error.message && error.message.includes('secure')) {
					showToast({ 
						message: 'Microphone requires HTTPS. Try https://localhost', 
						type: 'error',
						duration: 5000
					});
				} else {
					showToast({ 
						message: 'Failed to start voice recognition. Please try again.', 
						type: 'error' 
					});
				}
			}
		}
	}
	
	function stopVoiceRecognition() {
		if (state.recognition) {
			state.recognition.stop();
		}
		
		state.isRecording = false;
		
		// Update button visual state
		const voiceBtn = document.getElementById('editor-btn-voice');
		if (voiceBtn) {
			voiceBtn.classList.remove('recording');
			voiceBtn.title = 'Voice Recording';
		}
		
	}
	
	
	async function stopVoiceRecognitionAndWait() {
		// Show user feedback
		showToast({ 
			message: 'Stopping recording and saving transcript...', 
			type: 'info',
			duration: 5000
		});
		
		// Stop the recognition gracefully
		if (state.recognition && state.isRecording) {
			try {
				state.recognition.stop();
			} catch (error) {
				console.log('Recognition stop error (expected):', error);
			}
		}
		
		// Wait for the recognition to actually finish processing
		await waitForRecognitionToFinish();
		
		// Update state
		state.isRecording = false;
		
		// Update button visual state
		const voiceBtn = document.getElementById('editor-btn-voice');
		if (voiceBtn) {
			voiceBtn.classList.remove('recording');
			voiceBtn.title = 'Voice Recording';
		}
		
		// Show completion feedback
		showToast({ 
			message: 'Recording stopped. Transcript saved.', 
			type: 'success',
			duration: 2000
		});
	}
	
	function waitForRecognitionToFinish() {
		return new Promise((resolve) => {
			if (!state.recognition) {
				resolve();
				return;
			}
			
			console.log('Waiting for final transcript processing...');
			let lastTranscriptLength = elements.textarea.value.length;
			let lastTranscriptContent = elements.textarea.value;
			let stableCount = 0;
			const requiredStableCount = 5; // Need 5 consecutive checks with same content
			let totalChecks = 0;
			const maxChecks = 20; // Maximum 10 seconds of checking (20 * 500ms)
			
			// Check for transcript stability every 500ms
			const checkInterval = setInterval(() => {
				totalChecks++;
				const currentLength = elements.textarea.value.length;
				const currentContent = elements.textarea.value;
				
				console.log(`Check ${totalChecks}: Length ${currentLength}, Stable count: ${stableCount}`);
				
				if (currentLength === lastTranscriptLength && currentContent === lastTranscriptContent) {
					stableCount++;
					console.log(`Transcript stable for ${stableCount}/${requiredStableCount} checks`);
					
					if (stableCount >= requiredStableCount) {
						console.log('Transcript appears stable - proceeding with close');
						clearInterval(checkInterval);
						resolve();
						return;
					}
				} else {
					console.log(`Transcript updating: Length ${lastTranscriptLength} -> ${currentLength}, Content changed: ${currentContent !== lastTranscriptContent}`);
					stableCount = 0; // Reset counter
					lastTranscriptLength = currentLength;
					lastTranscriptContent = currentContent;
				}
				
				// Check if we've exceeded maximum checks
				if (totalChecks >= maxChecks) {
					console.log('Maximum checks reached - proceeding with close');
					clearInterval(checkInterval);
					resolve();
				}
			}, 500);
			
			// Fallback timeout - maximum 10 seconds wait
			setTimeout(() => {
				console.log('Maximum wait time (10s) reached - proceeding with close');
				clearInterval(checkInterval);
				resolve();
			}, 10000);
		});
	}
	
	// CRITICAL: Force stop voice recognition regardless of state
	async function forceStopVoiceRecognition() {
		console.log('Force stopping voice recognition...');
		
		// Stop recognition if it exists
		if (state.recognition) {
			try {
				state.recognition.stop();
				console.log('Recognition.stop() called');
			} catch (error) {
				console.error('Error stopping recognition:', error);
			}
		}
		
		// Reset state immediately
		state.isRecording = false;
		state.recognition = null;
		
		// Update UI immediately
		const voiceBtn = document.getElementById('editor-btn-voice');
		if (voiceBtn) {
			voiceBtn.classList.remove('recording');
			voiceBtn.title = 'Voice Recording';
		}
		
		
		console.log('Voice recognition force stopped');
	}
	
	// CRITICAL: Release microphone resources
	function releaseMicrophone() {
		console.log('Releasing microphone resources...');
		
		// Stop any active media streams
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia({ audio: true })
				.then(stream => {
					console.log('Stopping audio stream');
					stream.getTracks().forEach(track => {
						track.stop();
						console.log('Audio track stopped');
					});
				})
				.catch(error => {
					console.log('No active audio stream to stop:', error.message);
				});
		}
		
		// Clear any remaining recognition state
		state.isRecording = false;
		state.recognition = null;
		
		console.log('Microphone resources released');
	}
	
	function toggleVoiceRecognition() {
		if (state.isRecording) {
			stopVoiceRecognition();
		} else {
			startVoiceRecognition();
		}
	}

	// ============================================================================
	// FIND & REPLACE IMPLEMENTATION
	// ============================================================================

	function findMatches(searchText) {
		if (!searchText || !elements.textarea) {
			findReplaceState.matches = [];
			findReplaceState.currentMatchIndex = -1;
			updateMatchCount();
			return;
		}

		const text = elements.textarea.value;
		const flags = findReplaceState.caseSensitive ? 'g' : 'gi';
		let pattern;

		try {
			if (findReplaceState.regexMode) {
				pattern = new RegExp(searchText, flags);
			} else if (findReplaceState.wholeWord) {
				pattern = new RegExp(`\\b${searchText}\\b`, flags);
			} else {
				pattern = new RegExp(searchText, flags);
			}

			findReplaceState.matches = [];
			let match;
			while ((match = pattern.exec(text)) !== null) {
				findReplaceState.matches.push({
					start: match.index,
					end: match.index + match[0].length,
					text: match[0]
				});
			}
		} catch (e) {
			// Invalid regex pattern
			findReplaceState.matches = [];
		}

		findReplaceState.currentMatchIndex = -1; // Don't auto-select, wait for user to click Find
		updateMatchCount();
	}

	function highlightMatch(index) {
		if (index < 0 || index >= findReplaceState.matches.length) return;

		const match = findReplaceState.matches[index];
		elements.textarea.focus();
		elements.textarea.setSelectionRange(match.start, match.end);
		// Scroll into view
		const scrollPos = (match.start / elements.textarea.value.length) * elements.textarea.scrollHeight;
		elements.textarea.scrollTop = Math.max(0, scrollPos - 50);
	}

	function updateMatchCount() {
		const count = findReplaceState.matches.length;
		const current = findReplaceState.currentMatchIndex + 1;
		if (count === 0) {
			elements.matchCount.textContent = 'No matches';
			elements.matchCount.classList.remove('active');
		} else if (findReplaceState.currentMatchIndex === -1) {
			// Matches found but user hasn't clicked Find yet
			elements.matchCount.textContent = `${count} found`;
			elements.matchCount.classList.add('active');
		} else {
			elements.matchCount.textContent = `${current} of ${count}`;
			elements.matchCount.classList.add('active');
		}
	}

	function findNext() {
		if (findReplaceState.matches.length === 0) {
			// First time clicking Find - search for the term first
			findMatches(elements.findInput.value);
			if (findReplaceState.matches.length === 0) return;
			findReplaceState.currentMatchIndex = 0;
		} else {
			findReplaceState.currentMatchIndex = (findReplaceState.currentMatchIndex + 1) % findReplaceState.matches.length;
		}
		highlightMatch(findReplaceState.currentMatchIndex);
		updateMatchCount();
	}

	function findPrevious() {
		if (findReplaceState.matches.length === 0) {
			// First time clicking Find - search for the term first
			findMatches(elements.findInput.value);
			if (findReplaceState.matches.length === 0) return;
			findReplaceState.currentMatchIndex = findReplaceState.matches.length - 1;
		} else {
			findReplaceState.currentMatchIndex = (findReplaceState.currentMatchIndex - 1 + findReplaceState.matches.length) % findReplaceState.matches.length;
		}
		highlightMatch(findReplaceState.currentMatchIndex);
		updateMatchCount();
	}

	function replaceCurrent() {
		if (findReplaceState.currentMatchIndex < 0 || !elements.replaceInput) return;

		const match = findReplaceState.matches[findReplaceState.currentMatchIndex];
		const before = elements.textarea.value.substring(0, match.start);
		const after = elements.textarea.value.substring(match.end);
		elements.textarea.value = before + elements.replaceInput.value + after;

		// Adjust all match positions after this replacement
		const diff = elements.replaceInput.value.length - match.text.length;
		findReplaceState.matches = findReplaceState.matches.map((m, idx) => ({
			...m,
			start: idx > findReplaceState.currentMatchIndex ? m.start + diff : m.start,
			end: idx > findReplaceState.currentMatchIndex ? m.end + diff : m.end
		}));

		markAsDirtyAndQueueSave();
		findNext();
	}

	function replaceAll() {
		if (!elements.replaceInput) return;

		let newText = elements.textarea.value;
		const searchText = elements.findInput.value;

		if (!searchText || findReplaceState.matches.length === 0) return;

		// Save count before we modify the text
		const replacementCount = findReplaceState.matches.length;

		// Replace in reverse order to maintain positions
		for (let i = findReplaceState.matches.length - 1; i >= 0; i--) {
			const match = findReplaceState.matches[i];
			const before = newText.substring(0, match.start);
			const after = newText.substring(match.end);
			newText = before + elements.replaceInput.value + after;
		}

		elements.textarea.value = newText;
		markAsDirtyAndQueueSave();
		findMatches(searchText);
		showToast({ message: `Replaced ${replacementCount} occurrences.`, type: 'success' });
	}

	function setupFindReplaceListeners() {
		if (!elements.findInput) return;

		elements.findInput.addEventListener('input', (e) => {
			e.stopPropagation();
			// Update match count in real-time as user types, but don't auto-highlight
			findMatches(elements.findInput.value);
		});

		elements.findInput.addEventListener('keydown', (e) => {
			e.stopPropagation();
			if (e.key === 'Enter') {
				e.preventDefault();
				if (e.shiftKey) {
					findPrevious();
				} else {
					findNext();
				}
			}
		});

		elements.replaceInput.addEventListener('keydown', (e) => {
			e.stopPropagation();
			if (e.key === 'Enter') {
				e.preventDefault();
				replaceCurrent();
			}
		});

		elements.findNextBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			findNext();
		});

		elements.findPrevBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			findPrevious();
		});

		elements.replaceBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			replaceCurrent();
		});

		elements.replaceAllBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			replaceAll();
			elements.findInput.focus();
		});

		elements.caseSensitiveChk.addEventListener('change', (e) => {
			e.stopPropagation();
			findReplaceState.caseSensitive = elements.caseSensitiveChk.checked;
			findMatches(elements.findInput.value);
		});

		elements.wholeWordChk.addEventListener('change', (e) => {
			e.stopPropagation();
			findReplaceState.wholeWord = elements.wholeWordChk.checked;
			findMatches(elements.findInput.value);
		});

		elements.regexModeChk.addEventListener('change', (e) => {
			e.stopPropagation();
			findReplaceState.regexMode = elements.regexModeChk.checked;
			// When enabling regex, disable whole word since they conflict
			if (findReplaceState.regexMode) {
				findReplaceState.wholeWord = false;
				elements.wholeWordChk.checked = false;
			}
			findMatches(elements.findInput.value);
		});

		// Regex help modal handlers
		elements.regexHelpBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			elements.regexHelpModal.classList.remove('hidden');
		});

		elements.regexHelpClose.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();
			elements.regexHelpModal.classList.add('hidden');
		});

		// Close modal when clicking outside
		elements.regexHelpModal.addEventListener('click', (e) => {
			if (e.target === elements.regexHelpModal) {
				elements.regexHelpModal.classList.add('hidden');
			}
		});

		// Close modal on ESC key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && !elements.regexHelpModal.classList.contains('hidden')) {
				elements.regexHelpModal.classList.add('hidden');
			}
		});
	}

	function init() {
		bindElements();
		attachEventListeners();
		
		// Initialize voice recognition if browser supports it
		if (supportsVoiceRecognition()) {
			initVoiceRecognition();
			
			// Show voice button
			const voiceBtn = document.getElementById('editor-btn-voice');
			if (voiceBtn) {
				voiceBtn.style.display = 'flex';
				voiceBtn.addEventListener('click', toggleVoiceRecognition);
			}
		}

		// Setup Find & Replace listeners
		setupFindReplaceListeners();
		
		// Setup Search modal listeners
		setupSearchModalListeners();
	}
	
	/**
	 * Opens the search notes modal
	 */
	function openSearchNotesModal() {
		console.log('openSearchNotesModal called');
		const modal = document.getElementById('search-notes-modal');
		console.log('Search modal found:', modal);
		if (!modal) {
			console.error('Search notes modal not found');
			return;
		}
		
		console.log('Opening search modal...');
		modal.classList.remove('hidden');
		
		// Focus the search input
		const searchInput = document.getElementById('search-notes-input');
		if (searchInput) {
			searchInput.focus();
		}
		
		// Clear previous results
		const resultsContainer = document.getElementById('search-results-container');
		if (resultsContainer) {
			resultsContainer.innerHTML = `
				<div class="search-placeholder">
					<p>Enter a search term to find related notes and tasks</p>
				</div>
			`;
		}
	}
	
	/**
	 * Closes the search notes modal
	 */
	function closeSearchNotesModal() {
		const modal = document.getElementById('search-notes-modal');
		if (modal) {
			modal.classList.add('hidden');
		}
	}
	
	/**
	 * Performs search for notes and tasks
	 */
	async function performSearch() {
		const searchInput = document.getElementById('search-notes-input');
		const journalCheckbox = document.getElementById('search-journal-entries');
		const tasksCheckbox = document.getElementById('search-tasks');
		const resultsContainer = document.getElementById('search-results-container');
		
		if (!searchInput || !resultsContainer) {
			console.error('Search elements not found');
			return;
		}
		
		const searchTerm = searchInput.value.trim();
		if (!searchTerm) {
			resultsContainer.innerHTML = `
				<div class="search-placeholder">
					<p>Enter a search term to find related notes and tasks</p>
				</div>
			`;
			return;
		}
		
		// Show loading state
		resultsContainer.innerHTML = `
			<div class="search-loading">
				Searching notes and tasks...
			</div>
		`;
		
		try {
			const results = await searchNotesAndTasks(searchTerm, {
				includeJournal: journalCheckbox?.checked ?? true,
				includeTasks: tasksCheckbox?.checked ?? true
			});
			
			displaySearchResults(results, resultsContainer);
		} catch (error) {
			console.error('Search error:', error);
			resultsContainer.innerHTML = `
				<div class="search-no-results">
					<p>Error searching notes and tasks. Please try again.</p>
				</div>
			`;
		}
	}
	
	/**
	 * Searches notes and tasks via API
	 */
	async function searchNotesAndTasks(searchTerm, options = {}) {
		const { includeJournal = true, includeTasks = true } = options;
		
		const searchPromises = [];
		
		if (includeJournal) {
			searchPromises.push(
				window.apiFetch({
					module: 'journal',
					action: 'searchEntries',
					search_term: searchTerm
				})
			);
		}
		
		if (includeTasks) {
			searchPromises.push(
				window.apiFetch({
					module: 'tasks',
					action: 'searchTasks',
					search_term: searchTerm
				})
			);
		}
		
		const results = await Promise.all(searchPromises);
		
		// Combine and sort results by date (descending)
		const allResults = [];
		
		if (includeJournal && results[0]?.status === 'success') {
			results[0].data.forEach(entry => {
				allResults.push({
					...entry,
					type: 'journal',
					sortDate: new Date(entry.entry_date)
				});
			});
		}
		
		if (includeTasks && results[includeJournal ? 1 : 0]?.status === 'success') {
			const taskResults = results[includeJournal ? 1 : 0];
			taskResults.data.forEach(task => {
				allResults.push({
					...task,
					type: 'task',
					sortDate: new Date(task.created_at)
				});
			});
		}
		
		// Sort by date descending
		return allResults.sort((a, b) => b.sortDate - a.sortDate);
	}
	
	/**
	 * Displays search results in accordion format
	 */
	function displaySearchResults(results, container) {
		if (!results || results.length === 0) {
			container.innerHTML = `
				<div class="search-no-results">
					<p>No matching notes or tasks found.</p>
				</div>
			`;
			return;
		}
		
		const resultsHTML = results.map(result => {
			const date = new Date(result.sortDate);
			const formattedDate = date.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
			
			const title = result.type === 'journal' ? result.title : result.task_title;
			const content = result.type === 'journal' ? result.content : result.task_description;
			
			return `
				<div class="search-result-item" data-type="${result.type}" data-id="${result.type === 'journal' ? result.entry_id : result.task_id}">
					<div class="search-result-header">
						<div class="search-result-title">
							<span class="search-result-type ${result.type}">${result.type === 'journal' ? 'Journal' : 'Task'}</span>
							<span class="search-result-name">${title}</span>
						</div>
						<div class="search-result-meta">
							<div class="search-result-date">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
									<line x1="16" y1="2" x2="16" y2="6"/>
									<line x1="8" y1="2" x2="8" y2="6"/>
									<line x1="3" y1="10" x2="21" y2="10"/>
								</svg>
								${formattedDate}
							</div>
							<svg class="search-result-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="6 9 12 15 18 9"></polyline>
							</svg>
						</div>
					</div>
					<div class="search-result-content">
						<div class="search-result-body">
							<div class="search-result-preview">${content || 'No content available'}</div>
							<div class="search-result-actions">
								<button class="search-result-copy" onclick="copySearchResult('${result.type}', '${result.type === 'journal' ? result.entry_id : result.task_id}')">
									Copy Content
								</button>
							</div>
						</div>
					</div>
				</div>
			`;
		}).join('');
		
		container.innerHTML = resultsHTML;
		
		// Add click handlers for accordion functionality
		container.querySelectorAll('.search-result-header').forEach(header => {
			header.addEventListener('click', () => {
				const item = header.closest('.search-result-item');
				item.classList.toggle('expanded');
			});
		});
	}
	
	/**
	 * Copies search result content to clipboard
	 */
	window.copySearchResult = async function(type, id) {
		try {
			// Get the content from the search result
			const resultItem = document.querySelector(`[data-type="${type}"][data-id="${id}"]`);
			const preview = resultItem?.querySelector('.search-result-preview');
			
			if (preview) {
				await navigator.clipboard.writeText(preview.textContent);
				showToast({ message: 'Content copied to clipboard', type: 'success' });
			}
		} catch (error) {
			console.error('Copy error:', error);
			showToast({ message: 'Failed to copy content', type: 'error' });
		}
	};
	
	/**
	 * Sets up search modal event listeners
	 */
	function setupSearchModalListeners() {
		console.log('Setting up search modal listeners...');
		
		// Note: Search button is handled by handleFormatAction via data-action="search-notes"
		// No need for separate click listener
		
		// Close button
		const closeBtn = document.getElementById('btn-close-search-notes');
		if (closeBtn && !closeBtn.hasAttribute('data-listener-added')) {
			closeBtn.addEventListener('click', closeSearchNotesModal);
			closeBtn.setAttribute('data-listener-added', 'true');
		}
		
		// Search button
		const searchBtn = document.getElementById('btn-search-notes');
		if (searchBtn && !searchBtn.hasAttribute('data-listener-added')) {
			searchBtn.addEventListener('click', performSearch);
			searchBtn.setAttribute('data-listener-added', 'true');
		}
		
		// Search input enter key
		const searchInput = document.getElementById('search-notes-input');
		if (searchInput && !searchInput.hasAttribute('data-listener-added')) {
			searchInput.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					performSearch();
				}
			});
			searchInput.setAttribute('data-listener-added', 'true');
		}
		
		// Close on overlay click
		const modal = document.getElementById('search-notes-modal');
		if (modal && !modal.hasAttribute('data-listener-added')) {
			modal.addEventListener('click', (e) => {
				if (e.target === modal) {
					closeSearchNotesModal();
				}
			});
			modal.setAttribute('data-listener-added', 'true');
		}
	}

	document.addEventListener('DOMContentLoaded', init);

	window.UnifiedEditor = {
		open,
		close
	};

})();