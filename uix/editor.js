/**
 * Code for /uix/editor.js
 *
 * MyDayHub - Unified Note Editor
 * File: /uix/editor.js
 * Adapted from the robust Beta 4 implementation.
 *
 * @version 8.4 Tamarindo
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
		currentTaskId: null, // Legacy name, but holds either task or journal entry ID
		currentKind: 'task', // 'task' or 'journal'
		fontSize: 16,
		minFontSize: 10,
		maxFontSize: 32,
		isRecording: false,
		recognition: null
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
			elements.saveStatus.textContent = `Saved at ${new Date().toLocaleString()}`;
			
			// Show a success toast notification to the user.
			const itemType = state.currentKind === 'journal' ? 'Journal entry' : 'Note';
			showToast({ message: `${itemType} saved successfully.`, type: 'success' });

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
		
		if (updatedAt) {
			const savedDate = new Date(updatedAt.replace(' ', 'T') + 'Z'); 
			elements.saveStatus.textContent = `Last saved: ${savedDate.toLocaleString()}`;
		} else {
			elements.saveStatus.textContent = 'Ready';
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
	}

	document.addEventListener('DOMContentLoaded', init);

	window.UnifiedEditor = {
		open,
		close
	};

})();