/**
 * MyDayHub v4.0.0
 * /assets/js/editor.js
 *
 * This module controls the state and behavior of the Unified Note Editor.
 */

// NOTE: The calculator function requires the math.js library.
// <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.js"></script>

const UnifiedEditor = (function() {

	// --- Private state and DOM element references ---
	let state = {
		isOpen: false,
		isMaximized: false,
		editorFontSize: 16,
		currentDataType: null,
		currentData: null
	};

	const elements = {
		overlay: document.getElementById('unified-editor-overlay'),
		container: document.getElementById('unified-editor-container'),
		title: document.getElementById('editor-title'),
		textarea: document.getElementById('editor-textarea'),
		closeBtn: document.getElementById('editor-btn-close'),
		maximizeBtn: document.getElementById('editor-btn-maximize'),
		restoreBtn: document.getElementById('editor-btn-restore'),
		ribbonTabs: document.querySelectorAll('.ribbon-tab'),
		docStats: document.getElementById('editor-doc-stats'),
		formatToolbar: document.querySelector('#editor-panel-format .visible-buttons')
	};

	function updateDocStats() {
		if (!elements.textarea) return;
		const text = elements.textarea.value;
		const charCount = text.length;
		const wordCount = (text.match(/\b\S+\b/g) || []).length;
		const lineCount = text.split('\n').length;
		if (elements.docStats) {
			elements.docStats.innerHTML = `<span>Words: ${wordCount}</span> <span>Chars: ${charCount}</span> <span>Lines: ${lineCount}</span>`;
		}
	}
	
	function modifySelectedText(transformFunction) {
		if (!elements.textarea) return;
		const textarea = elements.textarea;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		if (start === end) return;

		const selectedText = textarea.value.substring(start, end);
		const transformedText = transformFunction(selectedText);

		textarea.value = textarea.value.substring(0, start) + transformedText + textarea.value.substring(end);
		
		textarea.focus();
		textarea.selectionStart = start;
		textarea.selectionEnd = start + transformedText.length;
		
		updateDocStats();
	}

	function applyEditorFontSize() {
		if (elements.textarea) {
			elements.textarea.style.fontSize = `${state.editorFontSize}px`;
		}
	}

	function toggleMaximize() {
		state.isMaximized = !state.isMaximized;
		elements.container.classList.toggle('is-maximized', state.isMaximized);
		
		elements.restoreBtn.style.display = state.isMaximized ? 'block' : 'none';
		elements.maximizeBtn.style.display = state.isMaximized ? 'none' : 'block';
	}

	function switchTab(e) {
		const targetPanelId = e.target.dataset.panel;
		elements.ribbonTabs.forEach(tab => tab.classList.remove('active'));
		document.querySelectorAll('.ribbon-panel').forEach(panel => panel.classList.remove('active'));
		e.target.classList.add('active');
		const targetPanel = document.getElementById(`editor-panel-${targetPanelId}`);
		if (targetPanel) {
			targetPanel.classList.add('active');
		}
	}

	function open(options = {}) {
		state.currentDataType = options.type || 'note';
		state.currentData = options.data || {};

		elements.title.textContent = state.currentData.title || 'Edit Note';
		elements.textarea.value = state.currentData.notes || '';
		
		elements.overlay.style.display = 'flex';
		elements.textarea.focus();
		state.isOpen = true;

		updateDocStats();
		applyEditorFontSize();
	}

	function close() {
		elements.overlay.style.display = 'none';
		state.isOpen = false;
		state.currentDataType = null;
		state.currentData = null;
	}

	function init() {
		if (!elements.overlay) return;

		elements.closeBtn.addEventListener('click', close);
		elements.maximizeBtn.addEventListener('click', toggleMaximize);
		elements.restoreBtn.addEventListener('click', toggleMaximize);
		elements.textarea.addEventListener('input', updateDocStats);
		elements.ribbonTabs.forEach(tab => tab.addEventListener('click', switchTab));

		if (elements.formatToolbar) {
			elements.formatToolbar.addEventListener('click', (e) => {
				const button = e.target.closest('.btn-icon');
				if (!button) return;

				const { action, casetype, change } = button.dataset;
				const textarea = elements.textarea;
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;

				// Use a switch for clarity, with special cases for complex actions
				switch (action) {
					case 'case':
						modifySelectedText(text => {
							if (casetype === 'upper') return text.toUpperCase();
							if (casetype === 'lower') return text.toLowerCase();
							if (casetype === 'title') return text.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
							return text;
						});
						break;
					
					case 'underline': { // Use block scope for variables
						if (start === end || textarea.value.substring(start, end).includes('\n')) return;
						let lineEndIndex = end;
						while (lineEndIndex < textarea.value.length && textarea.value[lineEndIndex] !== '\n') lineEndIndex++;
						const textToInsert = '\n' + '─'.repeat(end - start);
						textarea.value = textarea.value.substring(0, lineEndIndex) + textToInsert + textarea.value.substring(lineEndIndex);
						textarea.focus();
						textarea.selectionStart = textarea.selectionEnd = end;
						break;
					}

					case 'frame': { // Use block scope for variables
						if (start === end || textarea.value.substring(start, end).includes('\n')) return;
						const selection = textarea.value.substring(start, end);
						const framedText = `╔═${'═'.repeat(selection.length)}═╗\n║ ${selection} ║\n╚═${'═'.repeat(selection.length)}═╝`;
						const before = textarea.value.substring(0, start);
						const after = textarea.value.substring(end);
						const prefix = (before.endsWith('\n') || before === '') ? '' : '\n';
						const suffix = (after.startsWith('\n') || after === '') ? '' : '\n';
						const finalBlock = `${prefix}${framedText}${suffix}`;
						textarea.value = before + finalBlock + after;
						textarea.focus();
						textarea.selectionStart = textarea.selectionEnd = start + finalBlock.length - suffix.length;
						break;
					}

					case 'calculate':
						modifySelectedText(text => {
							try {
								const result = math.evaluate(text.trim());
								return `${text} = ${result}`;
							} catch (err) {
								return `${text} = ?`;
							}
						});
						break;
					
					case 'font-size':
						const sizeChange = parseInt(change, 10);
						const newSize = state.editorFontSize + sizeChange;
						if (newSize >= 10 && newSize <= 32) {
							state.editorFontSize = newSize;
							applyEditorFontSize();
						}
						break;
				}
				updateDocStats();
			});
		}

		console.log("Unified Editor initialized with advanced tools.");
	}

	return {
		init: init,
		open: open
	};
})();