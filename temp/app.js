document.addEventListener('DOMContentLoaded', () => {
// This setTimeout ensures that the script runs after the browser has finished
// all its initial rendering tasks, fixing the timing issue.
setTimeout(() => {
	let state = {
		draggedTask: null,
		draggedJournalEntry: null,
		encryptionKey: null,
		currentView: 'tasks',
		currentJournalDate: new Date(),
		skipWeekends: false,
		activeEditor: {
			entryData: null,
			originalNoteTitle: '',
			autoSaveTimerId: null, 
			lastSavedContent: ''   
		},
		filters: {
			showAssigned: true,
			showMine: true,
			showCompleted: false,
			priorityOnly: false,
			hidePrivate: false,
			privateViewOnly: false,
			showShared: true,
			savedFilters: null
		},
		theme: 'dark',
		fontSize: 16,
		editorFontSize: 16,
		journalEntriesCache: [],
		calendarEvents: [],
		journalColumnCount: 3,
		customFillers: [],
		whooshSound: new Audio('assets/sounds/whoosh.mp3'),
		soundEffectsEnabled: true,
		sessionTimeoutMinutes: 30,
		sessionTimeoutId: null,
		activeTaskPanel: null,
		findState: {
			term: '',
			replaceTerm: '',
			matchCase: false,
			results: [], 
			currentIndex: -1
		}
	};
	
		// --- DOM SELECTORS ---
		const mainAppContainer = document.querySelector('#main-app-container');
		const taskBoardContainer = document.querySelector('#task-board-container');
		const journalBoardContainer = document.querySelector('#journal-board-container');
		const addItemForm = document.querySelector('#add-item-form');
		const newItemInput = document.querySelector('#new-item-name');
		const viewTabs = document.querySelectorAll('.view-tab');
		const appTitleEl = document.querySelector('#app-title');
		const journalNavGroup = document.querySelector('#journal-nav-group');
		const todayBtn = document.querySelector('#today-btn');
		const dateJumpInput = document.querySelector('#date-jump-input');
		const footerDateEl = document.querySelector('#footer-date');
		const taskFilters = document.querySelector('#task-filters');
		const journalFilters = document.querySelector('#journal-filters');
		const dayWrapUpBtn = document.querySelector('#day-wrap-up-btn');
		const filterAssignedBtn = document.querySelector('#filter-assigned-btn');
		const filterMineBtn = document.querySelector('#filter-mine-btn');
		const filterCompletedBtn = document.querySelector('#filter-completed-btn');
		const filterPriorityBtn = document.querySelector('#filter-priority-btn');
		const themeToggleBtn = document.querySelector('#theme-toggle-btn');
		const fontDecreaseBtn = document.querySelector('#font-decrease-btn');
		const fontIncreaseBtn = document.querySelector('#font-increase-btn');
		const rootEl = document.documentElement;
		const headerJournalSearchForm = document.querySelector('#header-journal-search-form');
		const mainSearchResultsContainer = document.querySelector('#main-search-results-container');
		const editorModeContainer = document.querySelector('#editor-mode-container');
		const editorModeDatePrefix = document.querySelector('#editor-mode-date-prefix');
		const editorModeTitleText = document.querySelector('#editor-mode-title-text');
		const editorModeCloseBtn = document.querySelector('#editor-mode-close-btn');
		const editorModePrintBtn = document.querySelector('#editor-mode-print-btn');
		const journalSearchForm = document.querySelector('#journal-search-form');
		const journalSearchResultsArea = document.querySelector('#journal-search-results-area');
		const viewCountControls = document.querySelector('.view-count-controls');
		const findReplaceForm = document.querySelector('#find-replace-form');
		const findTermInput = document.querySelector('#find-term-input');
		const findCounter = document.querySelector('#find-counter');
		const replaceTermInput = document.querySelector('#replace-term-input');
		const findMatchCaseCheck = document.querySelector('#find-match-case-check');
	
		// --- ENCRYPTION / DECRYPTION & DATE HELPERS ---
		
		
		/**
		* Handles the responsive header for mobile devices.
		*/
		const mobileHeaderToggleBtn = document.querySelector('#mobile-header-toggle-btn');
		if (mobileHeaderToggleBtn) {
			const desktopOptionsContainer = document.querySelector('#desktop-header-options');
			const mobileDropdown = document.querySelector('#mobile-header-dropdown');
		
			mobileHeaderToggleBtn.addEventListener('click', (e) => {
				e.stopPropagation(); // Prevent the document click listener from closing it immediately
		
				const isShown = mobileDropdown.classList.toggle('show');
		
				// If we are showing the dropdown, move the currently active controls into it.
				if (isShown) {
					// Find all direct children of the desktop container that are NOT hidden by 'd-none'
					const activeControls = [...desktopOptionsContainer.children].filter(child => {
						return !child.classList.contains('d-none');
					});
					// Move them into the dropdown
					activeControls.forEach(control => mobileDropdown.appendChild(control));
				}
			});
		
			// Add a listener to close the dropdown when clicking elsewhere
			document.addEventListener('click', (e) => {
				if (!mobileDropdown.classList.contains('show')) return;
		
				// If the click was inside the dropdown or on the toggle button, do nothing
				if (mobileDropdown.contains(e.target) || mobileHeaderToggleBtn.contains(e.target)) {
					return;
				}
				
				// Otherwise, hide the dropdown
				mobileDropdown.classList.remove('show');
			});
		
			// Listen for the dropdown to be hidden, and move controls back to the desktop container
			mobileDropdown.addEventListener('transitionend', () => {
				if (!mobileDropdown.classList.contains('show')) {
					const mobileControls = [...mobileDropdown.children];
					mobileControls.forEach(control => desktopOptionsContainer.appendChild(control));
				}
			});
		}
		
		
		/**
		* Handles saving the user's calendar visibility preferences.
		*/
		const saveCalendarPrefsBtn = document.querySelector('#save-calendar-prefs-btn');
		if (saveCalendarPrefsBtn) {
			saveCalendarPrefsBtn.addEventListener('click', async () => {
				const checkboxes = document.querySelectorAll('.calendar-toggle-check:checked');
				const selectedCalendars = Array.from(checkboxes).map(cb => cb.dataset.calendarType);
		
				try {
					await savePreference('visible_calendars', selectedCalendars);
					
					// Manually update the state so the UI can refresh without a page reload
					// This fetch reloads the main calendar events based on the user's new selections.
					const eventsRes = await fetch(`${window.APP_CONFIG.appUrl}/api/calendar_events.php`);
					if(eventsRes.ok) {
						state.calendarEvents = await eventsRes.json();
					}
					
					// Close the modal
					document.querySelector('#calendar-settings-modal').classList.add('hidden');
		
					// MODIFIED: Call the main updateView() function
					// This will refresh the correct board (Tasks or Journal) instead of always showing the Journal.
					updateView();
		
				} catch (error) {
					alert('Failed to save calendar preferences. Please try again.');
				}
			});
		}
		
		
		/**
		* Handles the entire import process for both Tasks and Journal.
		*/
		const importConfirmBtn = document.querySelector('#import-confirm-btn');
		if (importConfirmBtn) {
			let validatedImportData = null;
			const importModal = document.querySelector('#import-modal');
			const importMessage = document.querySelector('#import-message');
			
			// Helper function to send TASK data to the backend
			const sendTasksToBackend = async (tasks, action) => {
				importMessage.textContent = 'Encrypting & Importing...';
				importMessage.className = 'mt-3 alert alert-info';
		
				// --- MODIFIED BLOCK START ---
				// 1. Encrypt the data on the client-side first.
				const payload = tasks.map(task => {
					const dataToEncrypt = {
						task_text: task.title,
						task_notes: task.notes || ''
					};
					const encryptedData = encrypt(JSON.stringify(dataToEncrypt), state.encryptionKey);
		
					return {
						columnName: task.columnName,
						isPriority: task.isPriority || false,
						dueDate: task.dueDate || null,
						encryptedData: encryptedData // Send the encrypted blob
					};
				});
				// --- MODIFIED BLOCK END ---
		
				try {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/import.php`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						// Send the newly created payload
						body: JSON.stringify({ tasks: payload, action: action }) 
					});
					const result = await response.json();
					if (!response.ok || !result.success) throw new Error(result.details || result.message || 'An unknown server error occurred.');
					
					importMessage.textContent = 'Import successful! The board will now reload.';
					importMessage.classList.replace('alert-info', 'alert-success');
					setTimeout(() => {
						importModal.classList.add('hidden');
						renderTaskBoard(); 
					}, 2000);
		
				} catch (error) {
					importMessage.textContent = `Import failed: ${error.message}`;
					importMessage.classList.replace('alert-info', 'alert-danger');
				}
			};
		
			// Helper function to send JOURNAL data to the backend
			const sendJournalToBackend = async (entries) => {
				importMessage.textContent = 'Encrypting & Importing...';
				importMessage.className = 'mt-3 alert alert-info';
		
				// --- MODIFIED BLOCK START ---
				// 1. Encrypt the data on the client-side first.
				const payload = entries.map(entry => {
					const dataToEncrypt = {
						entry_title: entry.title,
						entry_notes: entry.notes || ''
					};
					const encryptedData = encrypt(JSON.stringify(dataToEncrypt), state.encryptionKey);
					
					return {
						date: entry.date,
						isPrivate: entry.isPrivate || false,
						encryptedData: encryptedData // Send the encrypted blob
					};
				});
				// --- MODIFIED BLOCK END ---
		
				try {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/import.php`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ journal: payload }) // Send the new payload
					});
					const result = await response.json();
					if (!response.ok || !result.success) throw new Error(result.details || result.message || 'An unknown server error occurred.');
		
					importMessage.textContent = 'Import successful! The board will now reload.';
					importMessage.classList.replace('alert-info', 'alert-success');
					setTimeout(() => {
						importModal.classList.add('hidden');
						renderJournalBoard();
					}, 2000);
		
				} catch (error) {
					importMessage.textContent = `Import failed: ${error.message}`;
					importMessage.classList.replace('alert-info', 'alert-danger');
				}
			};
		
			// Main listener for the "Import" button, no changes needed here.
			importConfirmBtn.addEventListener('click', async () => {
				const importType = importConfirmBtn.dataset.importType;
				const importTextarea = document.querySelector('#import-json-input');
				const jsonText = importTextarea.value;
				
				importMessage.textContent = '';
				importMessage.className = 'mt-3';
		
				if (!jsonText) {
					importMessage.textContent = 'Text box cannot be empty.';
					importMessage.classList.add('alert', 'alert-danger');
					return;
				}
		
				try {
					validatedImportData = JSON.parse(jsonText);
					if (!Array.isArray(validatedImportData)) throw new Error('JSON must be an array of objects.');
				} catch (error) {
					importMessage.textContent = `Invalid JSON format: ${error.message}`;
					importMessage.classList.add('alert', 'alert-danger');
					return;
				}
				
				if (importType === 'tasks') {
					try {
						importMessage.textContent = 'Validating...';
						importMessage.classList.add('alert', 'alert-info');
						const columnsRes = await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`);
						const existingColumns = await columnsRes.json();
						const existingColumnNames = new Set(existingColumns.map(c => c.column_name.toLowerCase()));
						const importedColumnNames = new Set(validatedImportData.map(task => (task.columnName || '').toLowerCase()));
						const newColumns = [...importedColumnNames].filter(name => name && !existingColumnNames.has(name));
		
						if (newColumns.length === 0) {
							sendTasksToBackend(validatedImportData, 'create');
						} else {
							importMessage.innerHTML = `
								<p><strong>Action Required:</strong> The following new columns were found:</p>
								<ul>${newColumns.map(name => `<li>${name}</li>`).join('')}</ul>
								<p>How would you like to handle these?</p>
								<div class="d-flex gap-2 mt-3">
									<button class="btn btn-primary" id="import-action-create-cols">Create New Columns & Import</button>
									<button class="btn btn-secondary" id="import-action-placeholder-col">Place in 'Imported Tasks' Column</button>
								</div>
							`;
						}
					} catch (error) {
						importMessage.textContent = `An error occurred during validation: ${error.message}`;
						importMessage.classList.add('alert', 'alert-danger');
					}
				} else if (importType === 'journal') {
					sendJournalToBackend(validatedImportData);
				}
			});
		
			// Listener for the dynamically added task confirmation buttons, no changes needed here.
			importMessage.addEventListener('click', (e) => {
				const target = e.target;
				if (target.id === 'import-action-create-cols') {
					sendTasksToBackend(validatedImportData, 'create');
				} else if (target.id === 'import-action-placeholder-col') {
					sendTasksToBackend(validatedImportData, 'placeholder');
				}
			});
		}
		
		/**
		* Calculates and updates the char, word, and line counts in the editor info bar.
		*/
		function updateEditorCounters() {
			const editorTextarea = document.querySelector('#editor-mode-editor');
			if (!editorTextarea) return;
		
			const text = editorTextarea.value;
		
			const charCount = text.length;
			const lineCount = text.split('\n').length;
			const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
		
			document.querySelector('#char-counter').textContent = charCount;
			document.querySelector('#word-counter').textContent = wordCount;
			document.querySelector('#line-counter').textContent = lineCount;
		}
		
		/**
		* Resets the session timeout timer. Clears any existing timer and
		* starts a new one based on the user's preference.
		*/
		function resetSessionTimer() {
			if (state.sessionTimeoutId) {
				clearTimeout(state.sessionTimeoutId);
			}
		
			if (state.sessionTimeoutMinutes === 0) {
				return;
			}
		
			const timeoutMilliseconds = state.sessionTimeoutMinutes * 60 * 1000;
		
			state.sessionTimeoutId = setTimeout(() => {
				window.location.href = 'logout.php';
			}, timeoutMilliseconds);
		}
		
		/**
		* Encrypts a string using the stored session encryption key.
		* @param {string} text The plain text to encrypt.
		* @param {string} key The encryption key.
		* @returns {string|null} The encrypted string or null if no key exists.
		*/
		function encrypt(text, key) {
			if (!key) return null;
			return CryptoJS.AES.encrypt(text, key).toString();
		}
	
		/**
		* Decrypts a string using the stored session encryption key.
		* @param {string} encryptedData The encrypted data string.
		* @param {string} key The encryption key.
		* @returns {string} The decrypted text or an error message string.
		*/
		function decrypt(encryptedData, key) {
			if (!key || !encryptedData) return "[decryption failed]";
			try {
				const bytes = CryptoJS.AES.decrypt(encryptedData, key);
				const originalText = bytes.toString(CryptoJS.enc.Utf8);
				return originalText || "[decryption failed]";
			} catch (e) {
				return "[decryption failed]";
			}
		}
	
		/**
		* Formats a Date object into a 'YYYY-MM-DD' string.
		* @param {Date} date The date object to format.
		* @returns {string} The formatted date string.
		*/
		function formatDate(date) {
			return date.toISOString().split('T')[0];
		}
	
		/**
		* Formats a Date object into a more readable 'YYYY.Mon.DD, DayName' string.
		* @param {Date} dateObj The date object to format.
		* @returns {string} The formatted date string.
		*/
		function formatDateWithDay(dateObj) {
			const year = dateObj.getFullYear();
			const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
			const day = String(dateObj.getDate()).padStart(2, '0');
			const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
			return `${year}.${month}.${day}, ${dayName}`;
		}
	
		/**
		* Updates the date display in the main application footer.
		*/
		function updateFooterDate() {
			if (!footerDateEl) return;
			const now = new Date();
			footerDateEl.innerHTML = formatDateWithDay(now);
		}
	
		/**
		* Calculates a new date by adding or subtracting days, optionally skipping weekends.
		* @param {Date} baseDate The starting date.
		* @param {number} direction The direction to move (-1 for previous, 1 for next).
		* @returns {Date} The new calculated Date object.
		*/
		function getOffsetDate(baseDate, direction) {
			let newDate = new Date(baseDate);
			newDate.setDate(newDate.getDate() + direction);
			if (state.skipWeekends) {
				while (newDate.getDay() === 6 || newDate.getDay() === 0) {
					newDate.setDate(newDate.getDate() + direction);
				}
			}
			return newDate;
		}
	
		// --- UI & PREFERENCE FUNCTIONS ---
		
		/**
		* Applies the font size from the state to the editor's textarea.
		*/
		function applyEditorFontSize() {
			const editor = document.querySelector('#editor-mode-editor');
			if (editor) {
				editor.style.fontSize = `${state.editorFontSize}px`;
			}
		}
		
		/**
		* Displays a short-lived notification banner at the top of the screen.
		* @param {string} message The message to display.
		* @param {number} [duration=3000] The duration in ms to show the banner.
		*/
		function showToastNotification(message, duration = 3000) {
			const toast = document.querySelector('#toast-notification');
			if (!toast) return;
		
			toast.textContent = message;
			toast.classList.add('show');
		
			setTimeout(() => {
				toast.classList.remove('show');
			}, duration);
		}
		
		/**
		* Toggles the 'light-mode' class on the HTML element based on the current theme state.
		*/
		function applyTheme() {
			rootEl.classList.toggle('light-mode', state.theme === 'light');
		}
		
		/**
		* Applies the global font size from the state to the root HTML element.
		*/
		function applyFontSize() {
			rootEl.style.fontSize = `${state.fontSize}px`;
		}
		
		/**
		* Updates the tooltips for the 5 custom filler buttons on the format bar.
		*/
		function updateFillerTooltips() {
			for (let i = 1; i <= 5; i++) {
				const button = document.querySelector(`#format-panel .format-btn[data-filler="${i}"]`);
				if (button) {
					const fillerText = state.customFillers[i - 1];
					button.title = fillerText ? fillerText : '<add custom filler text>';
				}
			}
		}
		
		/**
		* Applies the current task filters to all tasks on the board, toggling their visibility.
		*/
		function applyTaskFilters() {
			document.querySelectorAll('.task-card').forEach(task => {
				const title = task.querySelector('.task-title').textContent;
				const status = task.dataset.status;
				const isAssigned = title.startsWith('@');
				const isMine = !isAssigned;
				const isCompleted = status == 0;
				const isPriority = status == 2;
		
				let shouldBeVisible;
		
				if (state.filters.priorityOnly) {
					shouldBeVisible = isPriority;
				} else {
					const isVisibleByType = (isAssigned && state.filters.showAssigned) || (isMine && state.filters.showMine);
					const isVisibleByStatus = isCompleted ? state.filters.showCompleted : true;
					
					shouldBeVisible = isVisibleByType && isVisibleByStatus;
				}
		
				task.classList.toggle('d-none', !shouldBeVisible);
			});
			
			document.querySelectorAll('.tasks-container').forEach(container => {
				const visibleTasks = container.querySelectorAll('.task-card:not(.d-none)').length;
				let placeholder = container.querySelector('.no-tasks-placeholder');
				if (visibleTasks === 0 && !placeholder) {
					placeholder = document.createElement('p');
					placeholder.className = 'text-secondary p-2 no-tasks-placeholder';
					placeholder.textContent = 'No tasks to show';
					container.appendChild(placeholder);
				} else if (visibleTasks > 0 && placeholder) {
					placeholder.remove();
				}
			});
		}
	
		// --- RENDER FUNCTIONS ---
		
		/**
		* Creates and returns a DOM element for a single task column.
		* @param {object} column The column data object from the database.
		* @returns {HTMLElement} The generated column div element.
		*/
		function createColumnElement(column) {
			const columnEl = document.createElement('div');
			columnEl.className = 'task-column card';
			columnEl.dataset.columnId = column.column_id;
			columnEl.dataset.isPrivate = column.is_private;
		
			const isChecked = column.is_private ? 'checked' : '';
		
			columnEl.innerHTML = `
				<div class="card-header d-flex justify-content-between align-items-center">
					<div class="column-header-left d-flex align-items-center">
						<button class="btn-icon move-column-left-btn" title="Move Left">&lt;</button>
						<h5 class="column-title" contenteditable="false" title="Double-click to edit">${column.column_name}</h5>
						<span class="task-count">0</span>
					</div>
					<div class="column-header-right d-flex align-items-center">
						<div class="form-check form-switch private-column-toggle" title="Mark column as private">
							<input class="form-check-input private-column-checkbox" type="checkbox" role="switch" ${isChecked}>
						</div>
						<button class="btn-icon move-column-right-btn" title="Move Right">&gt;</button>
						<button class="delete-column-btn" title="Delete Column"></button>
					</div>
				</div>
				<div class="card-body tasks-container"></div>
				<div class="card-footer">
					<form class="add-task-form">
						<div class="input-group">
							<input type="text" class="form-control" placeholder="New Task" required>
							<button class="btn btn-outline-primary" type="submit" title="Add New Task">+</button>
						</div>
					</form>
				</div>`;
			const tasksContainer = columnEl.querySelector('.tasks-container');
			tasksContainer.addEventListener('dragover', e => {
				e.preventDefault();
				const afterElement = getDragAfterElement(tasksContainer, e.clientY);
				const dragging = document.querySelector('.dragging');
				if (dragging) {
					if (afterElement == null) {
						tasksContainer.appendChild(dragging);
					} else {
						tasksContainer.insertBefore(dragging, afterElement);
					}
				}
			});
			columnEl.addEventListener('drop', e => {
				e.preventDefault();
				handleTaskDrop(e);
			});
			return columnEl;
		}
		
		/**
		* Updates the visual task count in a column's header.
		* @param {HTMLElement} columnEl The column element to update.
		*/
		function updateTaskCount(columnEl) {
			if (!columnEl) return;
			const count = columnEl.querySelectorAll('.task-card').length;
			const countEl = columnEl.querySelector('.task-count');
			if (countEl) countEl.textContent = count;
		}
		
		/**
		* Hides the navigation buttons on the first and last columns on the task board.
		*/
		function updateColumnButtonVisibility() {
			const columns = taskBoardContainer.querySelectorAll('.task-column');
			columns.forEach((col, index) => {
				const leftBtn = col.querySelector('.move-column-left-btn');
				const rightBtn = col.querySelector('.move-column-right-btn');
				if (leftBtn) leftBtn.style.visibility = (index === 0) ? 'hidden' : 'visible';
				if (rightBtn) rightBtn.style.visibility = (index === columns.length - 1) ? 'hidden' : 'visible';
			});
		}
	
		/**
		* Determines which element a dragged item should be placed before during a drag-and-drop operation.
		* @param {HTMLElement} container The container being dragged over.
		* @param {number} y The vertical position of the cursor.
		* @returns {HTMLElement|null} The element to insert before, or null to append at the end.
		*/
		function getDragAfterElement(container, y) {
			const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging), .journal-entry-card:not(.dragging)')];
			return draggableElements.reduce((closest, child) => {
				const box = child.getBoundingClientRect();
				const offset = y - box.top - box.height / 2;
				if (offset < 0 && offset > closest.offset) {
					return { offset: offset, element: child };
				} else {
					return closest;
				}
			}, { offset: Number.NEGATIVE_INFINITY }).element;
		}
	
		/**
		* Enforces the column sorting rules (Priority > Normal > Completed)
		* while preserving the user's manual sort order within each group.
		* @param {HTMLElement} columnEl The column element to sort.
		*/
		function enforceColumnSortRules(columnEl) {
			if (!columnEl) return;
			const tasksContainer = columnEl.querySelector('.tasks-container');
			
			const priorityTasks = Array.from(tasksContainer.querySelectorAll('.task-card[data-status="2"]'));
			const normalTasks = Array.from(tasksContainer.querySelectorAll('.task-card[data-status="1"]'));
			const completedTasks = Array.from(tasksContainer.querySelectorAll('.task-card[data-status="0"]'));
		
			const sortedTasks = [...priorityTasks, ...normalTasks, ...completedTasks];
		
			sortedTasks.forEach(task => tasksContainer.appendChild(task));
		}
	
		/**
		* Creates and returns a DOM element for a single task card.
		* @param {object} task The task data object from the database.
		* @returns {HTMLElement} The generated task card div element.
		*/
		function createTaskElement(task) {
			const taskEl = document.createElement('div');
			taskEl.dataset.taskId = task.task_id;
			taskEl.dataset.status = task.status;
			taskEl.dataset.dueDate = task.due_date || '';
			taskEl.dataset.createdAt = task.created_at;
			taskEl.dataset.position = task.position;
			taskEl.dataset.encryptedData = task.encrypted_data;
			taskEl.draggable = true;
			let taskText = "[Task Failed to Load]";
			let taskNotes = "";
			const decryptedString = decrypt(task.encrypted_data, state.encryptionKey);
			if (decryptedString && decryptedString !== "[decryption failed]") {
				try {
					const taskData = JSON.parse(decryptedString);
					taskText = taskData.task_text || "Untitled Task";
					taskNotes = taskData.task_notes || "";
				} catch (e) {
					taskText = decryptedString;
				}
			}
			const isDelegated = taskText.startsWith('@');
			
			taskEl.className = `task-card ${task.status == 0 ? 'completed' : ''} ${isDelegated ? 'delegated-task' : ''}`;
			
			if (task.status == 2) taskEl.classList.add('priority');
			
			taskEl.dataset.notes = taskNotes;
			
			const isChecked = task.status == 0 ? 'checked' : '';
			
			let formattedDueDateForDisplay = 'No due date';
			let titleSuffix = '';
			
			let notesHeaderHTML = '';
			const now = new Date();
			now.setHours(0,0,0,0);
			
			const creationDate = new Date(task.created_at);
			creationDate.setHours(0,0,0,0);
			const diffTimeCreated = Math.abs(now - creationDate);
			const daysSinceCreation = Math.ceil(diffTimeCreated / (1000 * 60 * 60 * 24));
			notesHeaderHTML += `<span>Created: ${daysSinceCreation} days ago</span>`;
		
			if (task.due_date) {
				const dueDate = new Date(task.due_date + 'T12:00:00');
				if (dueDate < now) taskEl.classList.add('past-due');
				const month = String(dueDate.getMonth() + 1).padStart(2, '0');
				const day = String(dueDate.getDate()).padStart(2, '0');
				const formattedDate = `${month}/${day}`;
				titleSuffix = `&nbsp;&nbsp;<span class="due-date-indicator">${formattedDate}</span>`;
				formattedDueDateForDisplay = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'long' });
		
				const diffTimeDue = dueDate - now;
				const daysToDue = Math.ceil(diffTimeDue / (1000 * 60 * 60 * 24));
				notesHeaderHTML += ` <span class="footer-divider">|</span> <span>Due in: ${daysToDue} days</span>`;
			}
		
			taskEl.innerHTML = `
				<div class="task-status-band"></div>
				<div class="task-card-main-content">
					<div class="task-card-content">
						<input type="checkbox" class="task-complete-checkbox" title="Mark complete" ${isChecked}>
						<span class="task-title" contenteditable="false" title="Double-click to edit">${taskText}${titleSuffix}</span>
						<div class="task-menu-container">
							<button class="task-control-btn" data-action="toggle-menu" title="More options">...</button>
							<div class="task-menu" style="display: none;">
								<a href="#" class="task-menu-item" data-action="notes">Notes</a>
								<a href="#" class="task-menu-item" data-action="duedate">Due Date</a>
								<a href="#" class="task-menu-item" data-action="move">Move to...</a>
								<a href="#" class="task-menu-item" data-action="duplicate">Duplicate</a>
								<a href="#" class="task-menu-item task-menu-item-delete" data-action="delete">Delete</a>
							</div>
						</div>
					</div>
					<div class="task-notes-container" style="display: none;">
						<div class="task-notes-header">${notesHeaderHTML}</div>
						<textarea class="form-control task-notes-editor" placeholder="Add notes...">${taskNotes}</textarea>
					</div>
					<div class="task-duedate-container" style="display: none;">
						<p class="due-date-display">${formattedDueDateForDisplay}</p>
						<input type="date" class="form-control task-duedate-picker" value="${task.due_date || ''}">
						<button class="btn btn-sm btn-outline-secondary clear-due-date-btn">Clear</button>
					</div>
				</div>`;
				
			taskEl.addEventListener('dragstart', e => {
				if (document.activeElement.isContentEditable) {
					e.preventDefault();
					return;
				}
				state.draggedTask = task;
				setTimeout(() => e.target.classList.add('dragging'), 0);
			});
			taskEl.addEventListener('dragend', () => taskEl.classList.remove('dragging'));
			return taskEl;
		}
	
		/**
		* Fetches all columns and their associated tasks from the backend, then builds and renders the entire Kanban board UI.
		*/
		async function renderTaskBoard() {
			try {
				const [columnsRes, tasksRes] = await Promise.all([
					fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`),
					fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`)
				]);
				if (!columnsRes.ok || !tasksRes.ok) throw new Error('Failed to fetch board data.');
				const columns = await columnsRes.json();
				const tasks = await tasksRes.json();
				const tasksByColumn = {};
				tasks.forEach(task => {
					if (!tasksByColumn[task.column_id]) tasksByColumn[task.column_id] = [];
					tasksByColumn[task.column_id].push(task);
				});
				taskBoardContainer.innerHTML = '';
				columns.forEach(column => {
					const columnEl = createColumnElement(column);
					taskBoardContainer.appendChild(columnEl);
					const tasksContainer = columnEl.querySelector('.tasks-container');
					(tasksByColumn[column.column_id] || []).forEach(task => {
						tasksContainer.appendChild(createTaskElement(task));
					});
					
					enforceColumnSortRules(columnEl);
					
					updateTaskCount(columnEl);
				});
				updateColumnButtonVisibility();
				applyTaskFilters();
			} catch (error) {
				taskBoardContainer.innerHTML = `<p class="text-danger">Could not load board. Please try again later.</p>`;
			}
		}
		
		/**
		* Fetches all journal entries for the currently displayed date range and renders the journal board UI.
		*/
		async function renderJournalBoard() {
			journalBoardContainer.innerHTML = `<p class="text-secondary p-3">Loading journal...</p>`;
		
			const hidePrivateClass = state.filters.hidePrivate ? 'hide-private' : '';
			const privateOnlyClass = state.filters.privateViewOnly ? 'private-only-mode' : '';
			journalBoardContainer.className = `d-flex flex-nowrap overflow-auto column-count-${state.journalColumnCount} ${hidePrivateClass} ${privateOnlyClass}`;
		
			const numCols = state.journalColumnCount;
			const centerIndex = Math.floor(numCols / 2);
			let dateRange = [];
			for (let i = 0; i < numCols; i++) {
				const offset = i - centerIndex;
				let tempDate = new Date(state.currentJournalDate);
				if (offset < 0) {
					for(let j=0; j < Math.abs(offset); j++) tempDate = getOffsetDate(tempDate, -1);
				} else if (offset > 0) {
					for(let j=0; j < offset; j++) tempDate = getOffsetDate(tempDate, 1);
				}
				dateRange[i] = tempDate;
			}
			const dateStrings = dateRange.map(formatDate);
			const firstDate = dateStrings[0];
			const lastDate = dateStrings[dateStrings.length - 1];
			try {
				const res = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php?start_date=${firstDate}&end_date=${lastDate}`);
				if (!res.ok) throw new Error('Failed to fetch journal entries.');
				const entries = await res.json();
				const entriesByDate = {};
				entries.forEach(entry => {
					if (!entriesByDate[entry.entry_date]) entriesByDate[entry.entry_date] = [];
					entriesByDate[entry.entry_date].push(entry);
				});
				journalBoardContainer.innerHTML = '';
				dateRange.forEach((dateObj, index) => {
					const dateStr = formatDate(dateObj);
					const entriesForDate = entriesByDate[dateStr] || [];
					const isCenter = (index === centerIndex);
					const columnEl = createJournalColumnElement(dateObj, entriesForDate, index, numCols, isCenter);
					journalBoardContainer.appendChild(columnEl);
				});
			} catch (error) {
				journalBoardContainer.innerHTML = `<p class="text-danger">Could not load journal. ${error.message}</p>`;
			}
		}
	
		/**
		* Creates and returns a DOM element for a single journal column.
		* @param {Date} dateObj The date for this column.
		* @param {Array} entries An array of entry objects for this date.
		* @param {number} index The column's index in the display.
		* @param {number} totalCols The total number of columns being displayed.
		* @param {boolean} isCenter Whether this is the visually distinct center column.
		* @returns {HTMLElement} The generated column div element.
		*/
		function createJournalColumnElement(dateObj, entries, index, totalCols, isCenter = false) {
			const columnEl = document.createElement('div');
			const dateStr = formatDate(dateObj);
			columnEl.className = `task-column card journal-column ${isCenter ? 'is-center' : ''}`;
			columnEl.dataset.date = dateStr;
		
			let eventLabelsHTML = '';
			// MODIFIED: This filter now also checks against the user's preferences
			const matchingEvents = state.calendarEvents.filter(event => {
				const dateMatch = dateStr >= event.start_date && dateStr <= event.end_date;
				// Also check if the event's type is in the user's set of visible calendars
				const isVisible = state.visibleCalendars.has(event.event_type);
				return dateMatch && isVisible;
			});
		
			if (matchingEvents.length > 0) {
				const labels = matchingEvents.map(event => 
					`<span class="calendar-event-label" title="${event.event_type}">${event.label}</span>`
				).join('');
				eventLabelsHTML = `<div class="event-labels-container">${labels}</div>`;
			}
			
			let prevButton = '';
			let nextButton = '';
			if (totalCols === 1) {
				prevButton = `<button class="journal-nav-btn prev-btn" data-direction="prev" title="Previous Day">&lt;</button>`;
				nextButton = `<button class="journal-nav-btn next-btn" data-direction="next" title="Next Day">&gt;</button>`;
			} else {
				if (index === 0) {
					prevButton = `<button class="journal-nav-btn prev-btn" data-direction="prev" title="Previous Day">&lt;</button>`;
				}
				if (index === totalCols - 1) {
					nextButton = `<button class="journal-nav-btn next-btn" data-direction="next" title="Next Day">&gt;</button>`;
				}
			}
			const formattedHeader = formatDateWithDay(dateObj);
			const weekendClass = (dateObj.getDay() === 0 || dateObj.getDay() === 6) ? 'is-weekend' : '';
		
			columnEl.innerHTML = `
				<div class="card-header journal-column-header">
					${prevButton || '<div></div>'}
					<div class="journal-header-content">
						<h5 class="${weekendClass}">${formattedHeader}</h5>
						${eventLabelsHTML}
					</div>
					${nextButton || '<div></div>'}
				</div>
				<div class="card-body journal-entries-container">
					${entries.length === 0 ? '<p class="text-secondary p-2">No entries to show</p>' : ''}
				</div>
				<div class="card-footer">
					<form class="add-journal-entry-form" data-date="${dateStr}">
						<div class="input-group">
							<input type="text" class="form-control" placeholder="New Entry..." required>
							<button class="btn btn-outline-primary" type="submit" title="Add New Entry">+</button>
						</div>
					</form>
				</div>`;
			const entriesContainer = columnEl.querySelector('.journal-entries-container');
			entries.forEach(entry => {
				entriesContainer.appendChild(createJournalEntryElement(entry));
			});
			entriesContainer.addEventListener('dragover', e => {
				e.preventDefault();
				const placeholder = entriesContainer.querySelector('p.text-secondary');
				if (placeholder) placeholder.remove();
				const afterElement = getDragAfterElement(entriesContainer, e.clientY);
				const dragging = document.querySelector('.dragging');
				if (dragging) {
					if (afterElement == null) entriesContainer.appendChild(dragging);
					else entriesContainer.insertBefore(dragging, afterElement);
				}
			});
			entriesContainer.addEventListener('drop', e => {
				e.preventDefault();
				handleJournalDrop(e);
			});
			return columnEl;
		}
	
		/**
		* Creates and returns a DOM element for a single journal entry card.
		* @param {object} entry The journal entry data object from the database.
		* @returns {HTMLElement} The generated entry card div element.
		*/
		function createJournalEntryElement(entry) {
			const entryEl = document.createElement('div');
			entryEl.className = 'journal-entry-card';
			entryEl.dataset.entryId = entry.entry_id;
			entryEl.dataset.date = entry.entry_date;
			entryEl.dataset.encryptedData = entry.encrypted_data;
		
			entryEl.dataset.isPrivate = entry.is_private ?? 0;
		
			entryEl.draggable = true;
			let entryTitle = "New Entry",
				entryNotes = "";
			const decryptedString = decrypt(entry.encrypted_data, state.encryptionKey);
			if (decryptedString !== "[decryption failed]") {
				try {
					const entryData = JSON.parse(decryptedString);
					entryTitle = entryData.entry_title || "New Entry";
					entryNotes = entryData.entry_notes || "";
				} catch (e) {
					entryTitle = decryptedString;
				}
			}
			// This existing logic correctly adds our .has-notes class, which we'll use in the CSS
			if (typeof entryNotes === 'string' && entryNotes.trim() !== '' && entryNotes.trim() !== '<p><br></p>') {
				entryEl.classList.add('has-notes');
			}
			
			const privateToggleText = (entry.is_private == 1) ? 'Make Public' : 'Make Private';
		
			// UPDATED: The HTML structure for the card
			entryEl.innerHTML = `
				<div class="entry-header">
					<span class="entry-title" contenteditable="false" title="Double-click to edit">${entryTitle}</span>
					<span class="entry-notes-icon" title="Has Notes">📝</span>
					<div class="task-menu-container">
						<button class="task-control-btn" data-action="toggle-menu" title="More options">...</button>
						<div class="task-menu" style="display: none;">
							<a href="#" class="task-menu-item" data-action="notes">Notes</a>
							<a href="#" class="task-menu-item" data-action="toggle-private">${privateToggleText}</a>
							<a href="#" class="task-menu-item" data-action="duplicate">Duplicate</a>
							<a href="#" class="task-menu-item task-menu-item-delete" data-action="delete">Delete</a>
						</div>
					</div>
				</div>
				<div class="journal-entry-indicator-bar"></div>`;
		
			entryEl.addEventListener('dragstart', (e) => {
				if (document.activeElement.isContentEditable) {
					e.preventDefault();
					return;
				}
				state.draggedJournalEntry = entry;
				setTimeout(() => e.target.classList.add('dragging'), 0);
			});
			entryEl.addEventListener('dragend', () => entryEl.classList.remove('dragging'));
			return entryEl;
		}
	
		/**
		* Fetches a single journal entry by its ID and opens it in the editor.
		* @param {number} entryId The ID of the journal entry to open.
		*/
		async function openEditorById(entryId) {
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php?entry_id=${entryId}`);
				if (!response.ok) throw new Error('Could not fetch entry data.');
				const entryData = await response.json();
				openEditorMode(entryData);
			} catch (error) {
				alert('Failed to load the selected journal entry.');
			}
		}

        
        /**
         * Opens the full-screen editor view for a given journal entry.
         * @param {object} entryData The full data object for the journal entry.
         */
        async function openEditorMode(entryData) {
            const columnSelect = document.querySelector('#editor-task-column-select');
            columnSelect.innerHTML = ''; 
            try {
                const response = await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`);
                const columns = await response.json();
                if (columns.length === 0) {
                    columnSelect.disabled = true;
                    columnSelect.innerHTML = '<option>No columns found</option>';
                } else {
                    columnSelect.disabled = false;
                    columns.forEach(column => {
                        const option = document.createElement('option');
                        option.value = column.column_id;
                        option.textContent = column.column_name;
                        columnSelect.appendChild(option);
                    });
                }
            } catch (error) {
                console.error("Failed to fetch columns for dropdown.", error);
                columnSelect.disabled = true;
                columnSelect.innerHTML = '<option>Error loading columns</option>';
            }
            
            state.activeEditor.entryData = entryData;
            const decryptedString = decrypt(entryData.encrypted_data, state.encryptionKey);
            let entryContent = {
                entry_title: "New Note",
                entry_notes: ""
            };
            if (decryptedString && decryptedString !== "[decryption failed]") {
                try {
                    entryContent = JSON.parse(decryptedString);
                } catch (e) {
                    entryContent.entry_title = decryptedString;
                }
            }
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = entryContent.entry_notes || "";
            const plainTextNotes = tempDiv.textContent || tempDiv.innerText || "";
            const dateObj = new Date(entryData.entry_date + 'T12:00:00');
            
            // REMOVED: The following lines that format and display the date are no longer needed.
            // const formattedDate = formatDateWithDay(dateObj);
            // const weekendClass = (dateObj.getDay() === 0 || dateObj.getDay() === 6) ? 'is-weekend' : '';
            // editorModeDatePrefix.innerHTML = `<span class="${weekendClass}">[ ${formattedDate} ]</span>`;
            editorModeDatePrefix.innerHTML = ''; // Explicitly clear the date prefix
        
            editorModeTitleText.textContent = entryContent.entry_title;
            const editorTextarea = document.querySelector('#editor-mode-editor');
            editorTextarea.value = plainTextNotes;
            
            const journalSearchResultsContainer = document.querySelector('#journal-search-results-container');
            if (journalSearchResultsContainer) {
                journalSearchResultsContainer.innerHTML = '';
                journalSearchResultsContainer.classList.add('d-none');
            }
            editorTextarea.classList.remove('d-none');
            mainAppContainer.classList.add('hidden');
            editorModeContainer.classList.remove('d-none');
        
            applyEditorFontSize();
        
            editorTextarea.focus();
        
            editorTextarea.selectionStart = 0;
            editorTextarea.selectionEnd = 0;
        
            updateEditorCounters();
        
            const lastUpdatedEl = document.querySelector('#editor-last-updated');
            if (lastUpdatedEl && entryData.updated_at) {
                const lastUpdatedDate = new Date(entryData.updated_at);
                lastUpdatedEl.textContent = `Prior save: ${lastUpdatedDate.toLocaleString()}`;
            }
        
            const autoSaveStatusEl = document.querySelector('#editor-auto-save-status');
            if (autoSaveStatusEl) {
                autoSaveStatusEl.textContent = 'No changes in this session.';
            }
        
            if (state.activeEditor.autoSaveTimerId) {
                clearInterval(state.activeEditor.autoSaveTimerId);
            }
            state.activeEditor.lastSavedContent = editorTextarea.value;
            state.activeEditor.autoSaveTimerId = setInterval(autoSaveNote, 60000);
        }
	
		/**
		* Saves the current content of the editor (title and notes) to the database.
		*/
		async function saveCurrentEditorNote() {
			if (!state.activeEditor.entryData) return;
			const editorTextarea = document.querySelector('#editor-mode-editor');
			const updatedContent = {
				entry_title: editorModeTitleText.textContent,
				entry_notes: editorTextarea.value
			};
			const encryptedData = encrypt(JSON.stringify(updatedContent), state.encryptionKey);
			if (!encryptedData) return alert("Encryption failed.");
			await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					entry_id: state.activeEditor.entryData.entry_id,
					encrypted_data: encryptedData
				})
			});
		}
		
		/**
         * Checks if the note in the editor has changed and saves it. Called by a timer.
         */
        async function autoSaveNote() {
            if (!state.activeEditor.entryData) return;
        
            const editorTextarea = document.querySelector('#editor-mode-editor');
            const currentContent = editorTextarea.value;
        
            if (currentContent !== state.activeEditor.lastSavedContent) {
                if (window.APP_CONFIG && window.APP_CONFIG.debug) {
                    console.log(`Auto-saving note at ${new Date().toLocaleTimeString()}...`);
                }
        
                await saveCurrentEditorNote();
        
                state.activeEditor.lastSavedContent = currentContent;
        
                showToastNotification("Note auto-saved", 2000);
        
                const autoSaveStatusEl = document.querySelector('#editor-auto-save-status');
                if (autoSaveStatusEl) {
                    const now = new Date();
                    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    // UPDATED: Changed text to your preferred wording.
                    autoSaveStatusEl.textContent = `Current changes saved: ${timeString}`;
                }
            }
        }
	
		/**
		* Closes the full-screen editor, saving the note and returning to the previous view.
		*/
		async function closeEditorMode() {
			if (state.activeEditor.autoSaveTimerId) {
				clearInterval(state.activeEditor.autoSaveTimerId);
			}
			state.activeEditor.autoSaveTimerId = null;
			state.activeEditor.lastSavedContent = '';
		
			if (!state.activeEditor.entryData) return;
			
			await saveCurrentEditorNote();
			
			state.activeEditor.entryData = null;
			editorModeContainer.classList.add('d-none');
			mainAppContainer.classList.remove('hidden');
			
			if (state.currentView === 'journal') {
				renderJournalBoard();
			}
		}
	
		/**
		* Renders a list of search result items into a specified container.
		* @param {Array} entries The array of matching entry objects.
		* @param {HTMLElement} container The DOM element to render the results into.
		*/
		function renderSearchResults(entries, container) {
			if (!container) return;
			container.innerHTML = '';
			if (entries.length === 0) {
				container.innerHTML = '<p class="text-secondary p-3">No matching entries found.</p>';
				return;
			}
			entries.forEach(entry => {
				const resultEl = document.createElement('div');
				resultEl.className = 'search-result-item';
				resultEl.dataset.entryId = entry.entry_id;
				const title = entry.decrypted_data.entry_title || 'Untitled';
				const notes = entry.decrypted_data.entry_notes || '';
				const snippet = (notes.replace(/<[^>]+>/g, '')).substring(0, 150) + '...';
				const dateObj = new Date(entry.entry_date + 'T12:00:00');
				const formattedDate = dateObj.toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
				resultEl.innerHTML = `
					<div class="search-result-header">
						<span class="search-result-title">${title}</span>
						<span class="search-result-date">${formattedDate}</span>
					</div>
					<p class="search-result-snippet">${snippet}</p>
					<div class="search-result-full-content" style="display: none;">${notes}</div>
				`;
				container.appendChild(resultEl);
			});
		}
	
		/**
		* Performs a client-side search of journal entries.
		* @param {string} term The search keyword.
		* @param {string} range The date range ('7d', '30d', '1y', 'all').
		* @param {HTMLElement} resultsContainer The container to display results in.
		*/
		async function performJournalSearch(term, range, resultsContainer) {
			if (!term) return;
			term = term.trim().toLowerCase();
			resultsContainer.innerHTML = '<p class="text-secondary p-3">Searching...</p>';
			try {
				if (state.journalEntriesCache.length === 0) {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/search.php`);
					if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
					state.journalEntriesCache = await response.json();
				}
				let entries_in_range = state.journalEntriesCache;
				if (range !== 'all') {
					const now = new Date();
					let days_to_subtract = 0;
					if (range === '7d') days_to_subtract = 7;
					if (range === '30d') days_to_subtract = 30;
					if (range === '1y') days_to_subtract = 365;
					const cutoffDate = new Date();
					cutoffDate.setDate(now.getDate() - days_to_subtract);
					entries_in_range = state.journalEntriesCache.filter(entry => new Date(entry.entry_date) >= cutoffDate);
				}
				const matching_entries = [];
				for (const entry of entries_in_range) {
					const decryptedString = decrypt(entry.encrypted_data, state.encryptionKey);
					if (decryptedString && decryptedString !== "[decryption failed]") {
						try {
							const data = JSON.parse(decryptedString);
							const title = (data.entry_title || '').toLowerCase();
							if (title.includes(term)) {
								entry.decrypted_data = data;
								matching_entries.push(entry);
							}
						} catch (e) {
							continue;
						}
					}
				}
				renderSearchResults(matching_entries, resultsContainer);
			} catch (error) {
				console.error("Search failed:", error);
				resultsContainer.innerHTML = '<p class="text-danger p-3">Search request failed.</p>';
			}
		}
	
		// --- EVENT HANDLERS ---
		
	/**
	 * Main event listener for the editor format bar and its responsive controls.
	 */
	const formatPanel = document.querySelector('#format-panel');
	if (formatPanel) {
        // This first listener handles clicks on ANY of the format buttons (e.g., Bold, Frame, Calculate)
        formatPanel.addEventListener('click', e => {
            const button = e.target.closest('.format-btn');
            if (!button) return;
    
            const editor = document.querySelector('#editor-mode-editor');
            const {
                insert,
                filler,
                listStyle,
                action,
                case: caseType
            } = button.dataset;
    
            const insertTextAtCursor = (text) => {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + text.length;
                editor.focus();
            };
    
            const modifySelectedText = (transform) => {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                if (start === end && !['cleanup', 'calculate'].includes(action)) return;
                const textToTransform = (action === 'cleanup') ? editor.value : editor.value.substring(start, end);
                if (!textToTransform && action === 'calculate') return;
                const transformedText = transform(textToTransform);
                const before = editor.value.substring(0, start);
                const after = editor.value.substring(end);
                editor.value = before + transformedText + after;
                editor.selectionStart = start;
                editor.selectionEnd = start + transformedText.length;
                editor.focus();
            };
    
            if (insert) {
                insertTextAtCursor(insert + ' ');
            } else if (filler) {
                const fillerIndex = parseInt(filler) - 1;
                if (state.customFillers && state.customFillers[fillerIndex]) {
                    insertTextAtCursor(state.customFillers[fillerIndex]);
                }
            } else if (listStyle) {
                modifySelectedText(text => {
                    const lines = text.split('\n');
                    const cleanedLines = lines.map(line => line.replace(/^(⊙ |› |[0-9]+\. )/, ''));
                    if (listStyle === 'remove') return cleanedLines.join('\n');
                    if (listStyle === '1.') return cleanedLines.map((line, i) => `${i + 1}. ${line}`).join('\n');
                    return cleanedLines.map(line => `${listStyle} ${line}`).join('\n');
                });
            } else if (caseType) {
                modifySelectedText(text => {
                    if (caseType === 'upper') return text.toUpperCase();
                    if (caseType === 'lower') return text.toLowerCase();
                    if (caseType === 'title') return text.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    return text;
                });
            } else if (action === 'frame-single' || action === 'frame-double') {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                if (start === end || editor.value.substring(start, end).includes('\n')) return;
                const selection = editor.value.substring(start, end);
                const chars = (action === 'frame-single') 
                    ? { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' }
                    : { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' };
                const lineLength = selection.length + 2;
                const top = chars.tl + chars.h.repeat(lineLength) + chars.tr;
                const middle = chars.v + ' ' + selection + ' ' + chars.v;
                const bottom = chars.bl + chars.h.repeat(lineLength) + chars.br;
                const before = editor.value.substring(0, start);
                const after = editor.value.substring(end);
                const prefix = (before.endsWith('\n') || before === '') ? '' : '\n';
                const suffix = (after.startsWith('\n') || after === '') ? '' : '\n';
                const framedText = `${prefix}${top}\n${middle}\n${bottom}${suffix}`;
                editor.value = before + framedText + after;
                editor.focus();
                editor.selectionStart = editor.selectionEnd = start + framedText.length - suffix.length;
            } else if (action === 'calculate') {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                if (start === end) return;
                const text = editor.value.substring(start, end);
                let resultText;
                try {
                    let expression = text.trim().replace(/x/g, '*').replace(/ˆ/g, '^').replace(/√\s*([\d\.]+)/g, 'sqrt($1)');
                    const result = math.evaluate(expression);
                    const formattedResult = (Number.isInteger(result)) ? result : parseFloat(result.toFixed(4));
                    resultText = `${text} = ${formattedResult}`;
                } catch (err) {
                    resultText = `${text} = NA`;
                }
                const before = editor.value.substring(0, start);
                const after = editor.value.substring(end);
                editor.value = before + resultText + after;
                editor.selectionStart = start;
                editor.selectionEnd = start + resultText.length;
                editor.focus();
            } else if (action === 'underline') {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                if (start === end || editor.value.substring(start, end).includes('\n')) return;
                let lineStartIndex = start;
                while (lineStartIndex > 0 && editor.value[lineStartIndex - 1] !== '\n') lineStartIndex--;
                let lineEndIndex = end;
                while (lineEndIndex < editor.value.length && editor.value[lineEndIndex] !== '\n') lineEndIndex++;
                const columnStart = start - lineStartIndex;
                const selectionLength = end - start;
                const padding = ' '.repeat(columnStart);
                const underline = '-'.repeat(selectionLength);
                const textToInsert = `\n${padding}${underline}`;
                editor.value = editor.value.substring(0, lineEndIndex) + textToInsert + editor.value.substring(lineEndIndex);
                editor.focus();
                editor.selectionStart = editor.selectionEnd = end;
            // NEW: Logic for timestamp and horizontal rule buttons
            } else if (action === 'timestamp') {
                const timestamp = new Date().toLocaleString();
                insertTextAtCursor(timestamp + ' ');
            } else if (action === 'horizontal-rule') {
                insertTextAtCursor('\n\n------------------------------------\n\n');
            } else if (action === 'cleanup') {
                modifySelectedText(text => {
                    let cleanedText = text.replace(/ +/g, ' ').split('\n').map(line => line.trim()).join('\n');
                    cleanedText = cleanedText.replace(/ \./g, '.').replace(/ ,/g, ',');
                    cleanedText = cleanedText.replace(/\.(?! |$|\n)/g, '. ').replace(/,(?! |$|\n)/g, ', ');
                    cleanedText = cleanedText.replace(/^(\* |- )/gm, '⊙ ').replace(/^> ?/gm, '');
                    return cleanedText.replace(/\n{3,}/g, '\n\n');
                });
            } else if (action === 'editor-font-decrease' || action === 'editor-font-increase') {
                const change = (action === 'editor-font-decrease') ? -1 : 1;
                const newSize = state.editorFontSize + change;
                if (newSize >= 10 && newSize <= 32) {
                    state.editorFontSize = newSize;
                    applyEditorFontSize();
                    savePreference('editor_font_size_px', state.editorFontSize);
                }
            }
            
            updateEditorCounters();
        });
    
        // This second listener handles the responsive "more options" functionality
        formatPanel.addEventListener('click', (e) => {
            // Ignore clicks on actual format buttons
            if (e.target.closest('.format-btn')) return;
    
            // If the click was on the panel's background, toggle its expanded state
            formatPanel.classList.toggle('is-expanded');
        });
    }
		
		/**
		* Event listener for the Change Password form in the settings modal.
		* Handles the two-stage re-encryption process.
		*/
		const changePasswordForm = document.querySelector('#change-password-form');
		if (changePasswordForm) {
			changePasswordForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				
				const currentPassword = document.querySelector('#current-password').value;
				const newPassword = document.querySelector('#new-password').value;
				const confirmPassword = document.querySelector('#confirm-password').value;
				const messageDiv = document.querySelector('#change-password-message');
		
				messageDiv.textContent = '';
				messageDiv.className = '';
		
				if (!currentPassword || !newPassword || !confirmPassword) {
					messageDiv.textContent = 'Please fill in all fields.';
					messageDiv.className = 'alert alert-danger p-2';
					return;
				}
		
				if (newPassword !== confirmPassword) {
					messageDiv.textContent = 'New passwords do not match.';
					messageDiv.className = 'alert alert-danger p-2';
					return;
				}
				
				// STAGE 1: Verify current password and fetch all data
				try {
					messageDiv.textContent = 'Verifying password and fetching data...';
					messageDiv.className = 'alert alert-info p-2';
		
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/auth.php?action=change_password`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ currentPassword })
					});
		
					const result = await response.json();
		
					if (result.success) {
						// STAGE 2: Data fetched, now re-encrypt on the client-side.
						messageDiv.textContent = 'Password verified. Re-encrypting data, please wait...';
						
						const { tasks, journal_entries } = result.data;
						const reEncryptedTasks = [];
						const reEncryptedJournalEntries = [];
		
						// Re-encrypt all tasks
						for (const task of tasks) {
							const decrypted = decrypt(task.encrypted_data, currentPassword);
							if (decrypted === '[decryption failed]') throw new Error(`Decryption failed for task ID ${task.task_id}`);
							const reEncrypted = encrypt(decrypted, newPassword);
							reEncryptedTasks.push({ task_id: task.task_id, encrypted_data: reEncrypted });
						}
		
						// Re-encrypt all journal entries
						for (const entry of journal_entries) {
							const decrypted = decrypt(entry.encrypted_data, currentPassword);
							if (decrypted === '[decryption failed]') throw new Error(`Decryption failed for entry ID ${entry.entry_id}`);
							const reEncrypted = encrypt(decrypted, newPassword);
							reEncryptedJournalEntries.push({ entry_id: entry.entry_id, encrypted_data: reEncrypted });
						}
		
						// STAGE 3: Send all re-encrypted data back to the server to be updated
						const updateResponse = await fetch(`${window.APP_CONFIG.appUrl}/api/auth.php?action=re_encrypt_and_update`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								newPassword: newPassword,
								tasks: reEncryptedTasks,
								journal_entries: reEncryptedJournalEntries
							})
						});
		
						const updateResult = await updateResponse.json();
		
						if (updateResult.success) {
							// CRITICAL: Update the key in the current session
							state.encryptionKey = newPassword;
							sessionStorage.setItem('encryptionKey', newPassword);
							
							messageDiv.textContent = 'Password and all data updated successfully!';
							messageDiv.className = 'alert alert-success p-2';
							changePasswordForm.reset();
						} else {
							throw new Error(updateResult.message || 'Failed to save re-encrypted data.');
						}
		
					} else {
						// This handles the "Incorrect current password" error from the server
						messageDiv.textContent = result.message;
						messageDiv.className = 'alert alert-danger p-2';
					}
				} catch (error) {
					console.error('Password change process failed:', error);
					messageDiv.textContent = `A critical error occurred: ${error.message}`;
					messageDiv.className = 'alert alert-danger p-2';
				}
			});
		}
		
		
		
		
		/**
		* Event listener for the main "Hide Private" toggle in the footer.
		*/
		const togglePrivateBtn = document.querySelector('#toggle-private-columns-btn');
		if (togglePrivateBtn) {
			togglePrivateBtn.addEventListener('click', () => {
				state.filters.hidePrivate = !state.filters.hidePrivate;
				togglePrivateBtn.classList.toggle('active', state.filters.hidePrivate);
				
				taskBoardContainer.classList.toggle('hide-private', state.filters.hidePrivate);
				journalBoardContainer.classList.toggle('hide-private', state.filters.hidePrivate);
		
				savePreference('hide_private', state.filters.hidePrivate);
			});
		}
		
		/**
		* Adds event listeners to the document to reset the session inactivity timer upon user activity.
		*/
		['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
			document.addEventListener(event, resetSessionTimer);
		});
		
		/**
		* Event listener for the session timeout dropdown in the settings modal.
		*/
		const sessionTimeoutSelect = document.querySelector('#session-timeout-select');
		if (sessionTimeoutSelect) {
			sessionTimeoutSelect.addEventListener('change', (e) => {
				const newTimeout = parseInt(e.target.value, 10);
				state.sessionTimeoutMinutes = newTimeout;
				savePreference('session_timeout_minutes', newTimeout);
				resetSessionTimer();
			});
		}
		
		/**
		* Main event listener for the settings modal, handling various preference changes.
		*/
		const settingsModal = document.querySelector('#settings-modal');
		if (settingsModal) {
			settingsModal.addEventListener('click', (e) => {
				const target = e.target;
				const action = target.dataset.action;
		
				if (action === 'toggle-help') {
					const helpModal = document.querySelector('#help-modal');
					settingsModal.classList.add('hidden');
					if (helpModal) {
						helpModal.classList.remove('hidden');
					}
				}
			});
		
			settingsModal.addEventListener('change', e => {
				const target = e.target;
				
				if (target.matches('[data-filler-id]')) {
					const fillerInputs = settingsModal.querySelectorAll('[data-filler-id]');
					const fillerValues = Array.from(fillerInputs).map(input => input.value);
					
					state.customFillers = fillerValues;
					savePreference('custom_fillers', fillerValues);
		
					updateFillerTooltips();
				
				} else if (target.id === 'private-view-only-toggle') {
					const isEnabled = target.checked;
					
					state.filters.privateViewOnly = isEnabled;
					savePreference('private_view_only', isEnabled);
		
					togglePrivateBtn.disabled = isEnabled;
					
					taskBoardContainer.classList.toggle('private-only-mode', isEnabled);
					journalBoardContainer.classList.toggle('private-only-mode', isEnabled);
		
					if (isEnabled) {
						taskBoardContainer.classList.remove('hide-private');
						journalBoardContainer.classList.remove('hide-private');
					}
				}
			});
		}
		
		/**
		* Event listener for the theme toggle buttons (Dark/Light).
		*/
		const themeToggleGroup = document.querySelector('#theme-toggle-group');
		if (themeToggleGroup) {
			themeToggleGroup.addEventListener('click', (e) => {
				const target = e.target.closest('button');
				if (!target) return;
		
				const newTheme = target.dataset.theme;
				if (newTheme && newTheme !== state.theme) {
					state.theme = newTheme;
					applyTheme();
					savePreference('theme', newTheme);
					
					themeToggleGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
					target.classList.add('active');
				}
			});
		}
		
		/**
		* Event listener for the sound effects toggle in settings.
		*/
		const soundToggle = document.querySelector('#sound-toggle');
		if (soundToggle) {
			soundToggle.addEventListener('change', (e) => {
				state.soundEffectsEnabled = e.target.checked;
				savePreference('sound_effects_enabled', state.soundEffectsEnabled);
			});
		}
		
		/**
		* REVISED & CONSOLIDATED: Event listeners to control the slide-out side menu.
		*/
		const sideMenu = document.querySelector('#side-menu');
		const sideMenuToggleBtn = document.querySelector('#side-menu-toggle-btn');
		const sideMenuCloseBtn = document.querySelector('#side-menu-close-btn');
		
		if (sideMenu && sideMenuToggleBtn && sideMenuCloseBtn) {
		
			// Listener for the sandwich icon in the header to open the menu
			sideMenuToggleBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				sideMenu.classList.add('show');
			});
		
			// Listener for the 'x' button inside the menu to close it
			sideMenuCloseBtn.addEventListener('click', () => {
				sideMenu.classList.remove('show');
			});
		
			// Listener for clicks INSIDE the menu to handle specific actions
			sideMenu.addEventListener('click', async (e) => {
				// Handle Help Link
				const helpLink = e.target.closest('a[data-action="toggle-help"]');
				if (helpLink) {
					const helpModal = document.querySelector('#help-modal');
					if (helpModal) helpModal.classList.remove('hidden');
					sideMenu.classList.remove('show');
					return;
				}
		
				// Handle Export Tasks Button
				const exportTasksBtn = e.target.closest('#export-tasks-btn');
				if (exportTasksBtn) {
					// ... existing export tasks logic ...
					const includeCompleted = document.querySelector('#export-include-completed-toggle').checked;
					const exportModal = document.querySelector('#export-modal');
					const outputTextarea = document.querySelector('#export-json-output');
					if (!exportModal || !outputTextarea) return;
					document.querySelector('#export-modal-title').textContent = 'Export Tasks';
					outputTextarea.value = 'Generating export...';
					exportModal.classList.remove('hidden');
					try {
						const [tasksRes, columnsRes] = await Promise.all([
							fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php?export=true&include_completed=${includeCompleted}`),
							fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`)
						]);
						if (!tasksRes.ok || !columnsRes.ok) throw new Error('Failed to fetch data for export.');
						const tasks = await tasksRes.json();
						const columns = await columnsRes.json();
						const columnMap = new Map(columns.map(col => [col.column_id, col.column_name]));
						const exportData = tasks.map(task => {
							const decryptedString = decrypt(task.encrypted_data, state.encryptionKey);
							let taskData = { task_text: 'Decryption Failed', task_notes: '' };
							if (decryptedString !== "[decryption failed]") {
								try { taskData = JSON.parse(decryptedString); } catch (e) { taskData.task_text = decryptedString; }
							}
							return {
								title: taskData.task_text || '',
								columnName: columnMap.get(task.column_id) || 'Unknown Column',
								isPriority: task.status == 2,
								dueDate: task.due_date || '',
								notes: taskData.task_notes || ''
							};
						});
						outputTextarea.value = JSON.stringify(exportData, null, 2);
					} catch (error) {
						outputTextarea.value = `Error generating export: ${error.message}`;
					}
					return;
				}
		
				// Handle Export Journal Button
				const exportJournalBtn = e.target.closest('#export-journal-btn');
				if (exportJournalBtn) {
					// ... existing export journal logic ...
					const range = document.querySelector('#export-journal-range').value;
					const exportModal = document.querySelector('#export-modal');
					const outputTextarea = document.querySelector('#export-json-output');
					if (!exportModal || !outputTextarea) return;
					document.querySelector('#export-modal-title').textContent = 'Export Journal';
					outputTextarea.value = 'Generating export...';
					exportModal.classList.remove('hidden');
					try {
						const res = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php?export=true&range=${range}`);
						if (!res.ok) throw new Error('Failed to fetch journal data for export.');
						const entries = await res.json();
						const exportData = entries.map(entry => {
							const decryptedString = decrypt(entry.encrypted_data, state.encryptionKey);
							let entryData = { entry_title: 'Decryption Failed', entry_notes: '' };
							if (decryptedString !== "[decryption failed]") {
								try { entryData = JSON.parse(decryptedString); } catch (e) { entryData.entry_title = decryptedString; }
							}
							return {
								title: entryData.entry_title || '',
								date: entry.entry_date,
								notes: entryData.entry_notes || '',
								isPrivate: !!parseInt(entry.is_private)
							};
						});
						outputTextarea.value = JSON.stringify(exportData, null, 2);
					} catch (error) {
						outputTextarea.value = `Error generating export: ${error.message}`;
					}
					return;
				}
		
				// Handle Import Tasks Button
				const importTasksBtn = e.target.closest('#import-tasks-btn');
				if (importTasksBtn) {
					// ... existing import tasks logic ...
					const importModal = document.querySelector('#import-modal');
					const importTextarea = document.querySelector('#import-json-input');
					const importMessage = document.querySelector('#import-message');
					const confirmBtn = document.querySelector('#import-confirm-btn');
					if (!importModal || !importTextarea || !importMessage) return;
					document.querySelector('#import-modal-title').textContent = 'Import Tasks';
					importTextarea.value = '';
					importMessage.textContent = '';
					importMessage.className = 'mt-3';
					confirmBtn.dataset.importType = 'tasks';
					importModal.classList.remove('hidden');
					return;
				}
				
				// Handle Import Journal Button
				const importJournalBtn = e.target.closest('#import-journal-btn');
				if (importJournalBtn) {
					// ... existing import journal logic ...
					const importModal = document.querySelector('#import-modal');
					const importTextarea = document.querySelector('#import-json-input');
					const importMessage = document.querySelector('#import-message');
					const confirmBtn = document.querySelector('#import-confirm-btn');
					if (!importModal || !importTextarea || !importMessage) return;
					document.querySelector('#import-modal-title').textContent = 'Import Journal';
					importTextarea.value = '';
					importMessage.textContent = '';
					importMessage.className = 'mt-3';
					confirmBtn.dataset.importType = 'journal';
					importModal.classList.remove('hidden');
					return;
				}
		
				// NEW: Handle Manage Calendars button
				const openCalendarBtn = e.target.closest('#open-calendar-settings-btn');
				if (openCalendarBtn) {
					const modal = document.querySelector('#calendar-settings-modal');
					const listContainer = document.querySelector('#calendar-list-container');
					if (!modal || !listContainer) return;
		
					listContainer.innerHTML = '<p>Loading calendars...</p>';
					modal.classList.remove('hidden');
					sideMenu.classList.remove('show');
		
					try {
						// Fetch all available calendar types and the user's current preferences
						const [calendarsRes, prefsRes] = await Promise.all([
							fetch(`${window.APP_CONFIG.appUrl}/api/calendars.php`),
							fetch(`${window.APP_CONFIG.appUrl}/api/preferences.php`)
						]);
		
						if (!calendarsRes.ok || !prefsRes.ok) throw new Error('Could not load calendar data.');
		
						const allCalendars = await calendarsRes.json(); // Expects an array of strings, e.g., ["fiscal", "holidays"]
						const userPrefs = await prefsRes.json();
						// Use a Set for quick lookups
						const visibleCalendars = new Set(userPrefs.visible_calendars || []);
						
						listContainer.innerHTML = ''; // Clear loading message
		
						if (allCalendars.length === 0) {
							listContainer.innerHTML = '<p>No custom calendars found.</p>';
							return;
						}
		
						// Build the list of checkboxes
						allCalendars.forEach(calendarType => {
							const isChecked = visibleCalendars.has(calendarType);
							const itemHtml = `
								<div class="form-check form-switch">
									<input class="form-check-input calendar-toggle-check" type="checkbox" role="switch" 
										id="cal-toggle-${calendarType}" data-calendar-type="${calendarType}" ${isChecked ? 'checked' : ''}>
									<label class="form-check-label" for="cal-toggle-${calendarType}">${calendarType}</label>
								</div>
							`;
							listContainer.insertAdjacentHTML('beforeend', itemHtml);
						});
		
					} catch (error) {
						listContainer.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
					}
				}
			});
		
			// Listener for CHANGE events on inputs within the side menu
			sideMenu.addEventListener('change', e => {
				const target = e.target;
				if (target.matches('[data-filler-id]')) {
					const fillerInputs = sideMenu.querySelectorAll('[data-filler-id]');
					const fillerValues = Array.from(fillerInputs).map(input => input.value);
					state.customFillers = fillerValues;
					savePreference('custom_fillers', fillerValues);
					updateFillerTooltips();
				} else if (target.id === 'private-view-only-toggle') {
					const isEnabled = target.checked;
					const togglePrivateBtn = document.querySelector('#toggle-private-columns-btn');
					state.filters.privateViewOnly = isEnabled;
					savePreference('private_view_only', isEnabled);
					if(togglePrivateBtn) togglePrivateBtn.disabled = isEnabled;
					taskBoardContainer.classList.toggle('private-only-mode', isEnabled);
					journalBoardContainer.classList.toggle('private-only-mode', isEnabled);
					if (isEnabled) {
						taskBoardContainer.classList.remove('hide-private');
						journalBoardContainer.classList.remove('hide-private');
					}
				}
			});
		}
		
		// MOVED: This listener is now outside the IF block but checks for element existence.
		document.addEventListener('click', (e) => {
			const sideMenuEl = document.querySelector('#side-menu');
			const sideMenuToggleBtnEl = document.querySelector('#side-menu-toggle-btn');
			
			// Ensure elements exist and the menu is actually shown before proceeding
			if (!sideMenuEl || !sideMenuEl.classList.contains('show')) return;
			
			// Check if the click was on the toggle button itself (it handles its own closing)
			if (sideMenuToggleBtnEl && sideMenuToggleBtnEl.contains(e.target)) return;
			
			// Check if the click was inside the menu
			if (sideMenuEl.contains(e.target)) return;
			
			// If the click was outside, close the menu
			sideMenuEl.classList.remove('show');
		});
		
	/**
		* Generic event listener to handle accordion-style UIs in modals.
		*/
		document.addEventListener('click', e => {
			if (e.target.matches('.help-item-header')) {
				const header = e.target;
				const content = header.nextElementSibling;
				// FIXED: Look for either the old modal class or the new side-menu ID
				const parentContainer = header.closest('.modal-container, #side-menu');
		
				// If the accordion isn't in a recognized container, do nothing.
				if (!content || !parentContainer) return;
		
				const isCurrentlyOpen = content.classList.contains('show');
		
				// Close any other open accordions within the same container
				parentContainer.querySelectorAll('.help-item-content.show').forEach(openContent => {
					// Don't close the one we're about to open
					if (openContent !== content) {
						openContent.classList.remove('show');
						openContent.previousElementSibling.classList.remove('active');
					}
				});
		
				// Toggle the clicked accordion
				if (isCurrentlyOpen) {
					content.classList.remove('show');
					header.classList.remove('active');
				} else {
					content.classList.add('show');
					header.classList.add('active');
				}
			}
		});
		
		/**
		* Switches the main application view between 'Tasks' and 'Journal'.
		*/
		function updateView() {
			localStorage.setItem('currentView', state.currentView);
			mainSearchResultsContainer.classList.add('d-none');
		
			if (state.currentView === 'tasks') {
				taskBoardContainer.classList.remove('d-none');
				journalBoardContainer.classList.add('d-none');
				journalNavGroup.classList.add('d-none');
				headerJournalSearchForm.classList.add('d-none');
				taskFilters.classList.remove('d-none');
				journalFilters.classList.add('d-none');
				renderTaskBoard();
			} else { // Journal View
				taskBoardContainer.classList.add('d-none');
				journalBoardContainer.classList.remove('d-none');
				journalNavGroup.classList.remove('d-none');
				headerJournalSearchForm.classList.remove('d-none');
				headerJournalSearchForm.classList.add('d-flex');
				taskFilters.classList.add('d-none');
				journalFilters.classList.remove('d-none');
				renderJournalBoard();
			}
			
			const isTasksView = state.currentView === 'tasks';
			addItemForm.classList.toggle('d-none', !isTasksView);
			addItemForm.classList.toggle('d-flex', isTasksView);
		
			viewTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.view === state.currentView));
		}
	
		/**
		* Event listener for the main view tabs ('Tasks' and 'Journal').
		*/
		viewTabs.forEach(tab => {
			tab.addEventListener('click', (e) => {
				const newView = e.currentTarget.dataset.view;
				if (newView === state.currentView) return;
				state.currentView = newView;
				updateView();
				savePreference('current_view', newView);
			});
		});
	
		/**
		* Event listener for the 'Show Assigned' filter button.
		*/
		filterAssignedBtn.addEventListener('click', () => {
			state.filters.showAssigned = !state.filters.showAssigned;
			filterAssignedBtn.classList.toggle('active', state.filters.showAssigned);
			applyTaskFilters();
			savePreference('show_assigned', state.filters.showAssigned);
		});
		/**
		* Event listener for the 'Show Mine' filter button.
		*/
		filterMineBtn.addEventListener('click', () => {
			state.filters.showMine = !state.filters.showMine;
			filterMineBtn.classList.toggle('active', state.filters.showMine);
			applyTaskFilters();
			savePreference('show_mine', state.filters.showMine);
		});
		/**
		* Event listener for the 'Show/Hide Completed' filter button.
		*/
		filterCompletedBtn.addEventListener('click', () => {
			state.filters.showCompleted = !state.filters.showCompleted;
			filterCompletedBtn.classList.toggle('active', state.filters.showCompleted);
			applyTaskFilters();
			savePreference('hide_completed', !state.filters.showCompleted);
		});
		/**
		* Event listener for the 'Show Priority Only' filter button.
		*/
		filterPriorityBtn.addEventListener('click', () => {
			state.filters.priorityOnly = !state.filters.priorityOnly;
			filterPriorityBtn.classList.toggle('active', state.filters.priorityOnly);
			applyTaskFilters();
			savePreference('priority_only', state.filters.priorityOnly);
		});
	
		/**
		* Event listener for the global font size increase button.
		*/
		fontIncreaseBtn.addEventListener('click', () => {
			if (state.fontSize < 20) {
				state.fontSize += 1;
				applyFontSize();
				localStorage.setItem('appFontSize', state.fontSize);
			}
		});
		/**
		* Event listener for the global font size decrease button.
		*/
		fontDecreaseBtn.addEventListener('click', () => {
			if (state.fontSize > 12) {
				state.fontSize -= 1;
				applyFontSize();
				localStorage.setItem('appFontSize', state.fontSize);
			}
		});
	
		/**
		* Saves the current order of columns to the database.
		*/
		async function saveColumnOrder() {
			const orderedColumnIds = Array.from(taskBoardContainer.querySelectorAll('.task-column')).map(col => col.dataset.columnId);
			try {
				await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ordered_columns: orderedColumnIds
					})
				});
			} catch (error) {
				console.error('Failed to save column order:', error);
			}
		}
		
		/**
		* Saves the current order of tasks within a specific column to the database.
		* @param {HTMLElement} columnEl The column element whose task order needs to be saved.
		*/
		async function saveTaskOrder(columnEl) {
			const tasksContainer = columnEl.querySelector('.tasks-container');
			const orderedTaskIds = Array.from(tasksContainer.querySelectorAll('.task-card')).map(card => card.dataset.taskId);
			try {
				await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ordered_tasks: orderedTaskIds
					})
				});
			} catch (error) {
				console.error('Failed to save task order:', error);
			}
		}
			
		/**
		* Handles the drop event for a task card, updating its column and position.
		* @param {DragEvent} e The drop event object.
		*/
		async function handleTaskDrop(e) {
			const task = state.draggedTask;
			if (!task) return;
		
			const sourceColumnEl = document.querySelector(`.task-column[data-column-id="${task.column_id}"]`);
			const targetColumnEl = e.currentTarget.closest('.task-column');
			const targetColumnId = targetColumnEl.dataset.columnId;
		
			if (sourceColumnEl && targetColumnEl && sourceColumnEl !== targetColumnEl) {
				task.column_id = targetColumnId;
				await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						task_id: task.task_id,
						column_id: targetColumnId
					})
				});
			}
		
			enforceColumnSortRules(targetColumnEl);
			if (sourceColumnEl && sourceColumnEl !== targetColumnEl) {
				enforceColumnSortRules(sourceColumnEl);
			}
		
			if (sourceColumnEl) {
				updateTaskCount(sourceColumnEl);
			}
			if (targetColumnEl && sourceColumnEl !== targetColumnEl) {
				updateTaskCount(targetColumnEl);
			}
		
			await saveTaskOrder(targetColumnEl);
			if (sourceColumnEl && sourceColumnEl !== targetColumnEl) {
				await saveTaskOrder(sourceColumnEl);
			}
		
			state.draggedTask = null;
		}
		
		/**
		* Handles the drop event for a journal entry, updating its date and position.
		* @param {DragEvent} e The drop event object.
		*/
		async function handleJournalDrop(e) {
			const entry = state.draggedJournalEntry;
			if (!entry) return;
			const targetColumnBody = e.currentTarget;
			const targetColumn = targetColumnBody.closest('.task-column');
			const targetDate = targetColumn.dataset.date;
			const entryElements = targetColumn.querySelectorAll('.journal-entry-card');
			const orderedIds = Array.from(entryElements).map(el => el.dataset.entryId);
			const payload = {
				moved_entry_id: entry.entry_id,
				target_date: targetDate,
				ordered_ids_in_column: orderedIds
			};
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(payload)
				});
				if (!response.ok) throw new Error('Server responded with an error.');
				const droppedCard = journalBoardContainer.querySelector(`[data-entry-id="${entry.entry_id}"]`);
				if (droppedCard) droppedCard.dataset.date = targetDate;
				entry.entry_date = targetDate;
			} catch (error) {
				alert('Could not save new order. Reverting.');
				renderJournalBoard();
			} finally {
				state.draggedJournalEntry = null;
			}
		}
	
		/**
		* Saves a single user preference to the database.
		* @param {string} key The preference key (matches a database column name).
		* @param {*} value The value to save for the preference.
		*/
		async function savePreference(key, value) {
			try {
				await fetch(`${window.APP_CONFIG.appUrl}/api/preferences.php`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						key,
						value
					})
				});
			} catch (error) {
				console.error('Failed to save preference:', error);
			}
		}
		
		/**
	 * Global event listener to enable inline editing on double-click.
	 */
	document.body.addEventListener('dblclick', e => {
		const target = e.target;
		if (target.matches('#app-title, .view-tab, .column-title, .task-title, .entry-title, #editor-mode-title-text')) {
			
			// NEW: If the double-clicked item is a journal title, clear the single-click timer.
			if (target.matches('.entry-title')) {
				const entryCard = target.closest('.journal-entry-card');
				if (entryCard && entryCard.dataset.clickTimer) {
					clearTimeout(entryCard.dataset.clickTimer);
					entryCard.dataset.clickTimer = ''; // Clear the timer ID
				}
			}
			
			// Existing logic to make the element editable
			target.contentEditable = true;
			target.focus();
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(target);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	});
	
		/**
		* Global event listener to save changes when an inline-editable field loses focus.
		*/
		document.body.addEventListener('blur', async (e) => {
			const target = e.target;
			if (!target.isContentEditable) return;
			target.contentEditable = false;
			if (target.matches('#app-title')) savePreference('app_title', target.textContent);
			else if (target.matches('.view-tab')) savePreference(target.dataset.prefKey, target.textContent);
			else if (target.matches('.column-title')) {
				const columnId = target.closest('.task-column').dataset.columnId;
				await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						column_id: columnId,
						column_name: target.textContent
					})
				});
			} else if (target.matches('.task-title')) {
				const taskEl = target.closest('.task-card');
				const taskId = taskEl.dataset.taskId;
				const taskData = {
					task_text: target.textContent,
					task_notes: taskEl.dataset.notes || ""
				};
				const encryptedData = encrypt(JSON.stringify(taskData), state.encryptionKey);
				await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						task_id: taskId,
						encrypted_data: encryptedData
					})
				});
		
				const isNowDelegated = target.textContent.trim().startsWith('@');
				taskEl.classList.toggle('delegated-task', isNowDelegated);
				applyTaskFilters();
		
			} else if (target.matches('#editor-mode-title-text')) {
				await saveCurrentEditorNote();
				state.activeEditor.originalNoteTitle = target.textContent;
			} else if (target.matches('.entry-title')) {
				const entryCard = target.closest('.journal-entry-card');
				if (entryCard) {
					const entryId = entryCard.dataset.entryId;
					const encryptedData = entryCard.dataset.encryptedData;
					const decryptedString = decrypt(encryptedData, state.encryptionKey);
					if (decryptedString && decryptedString !== '[decryption failed]') {
						try {
							const data = JSON.parse(decryptedString);
							data.entry_title = target.textContent;
							const newEncryptedData = encrypt(JSON.stringify(data), state.encryptionKey);
							entryCard.dataset.encryptedData = newEncryptedData;
							fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
								method: 'PUT',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									entry_id: entryId,
									encrypted_data: newEncryptedData
								})
							});
						} catch (e) {
							console.error("Failed to process entry title change.", e);
						}
					}
				}
			}
		}, true);
	
		/**
		* Global keydown listener for handling 'Enter' and 'Escape' keys in specific contexts.
		*/
		document.body.addEventListener('keydown', e => {
			if (e.target.matches('.add-task-form input') && e.key === 'Enter') {
				e.preventDefault();
				e.target.closest('.add-task-form').querySelector('button[type="submit"]').click();
			} else if (e.target.matches('.add-journal-entry-form input') && e.key === 'Enter') {
				e.preventDefault();
				e.target.closest('.add-journal-entry-form').querySelector('button[type="submit"]').click();
			} else if (e.target.isContentEditable && e.key === 'Enter') {
				e.preventDefault();
				e.target.blur();
			} else if (e.key === 'Escape' && !editorModeContainer.classList.contains('d-none')) {
				e.preventDefault();
				closeEditorMode();
			}
		});
	
		/**
		* Event listener for the 'Add Column' form in the header.
		*/
		if (addItemForm) {
			addItemForm.addEventListener('submit', async e => {
				e.preventDefault();
				const itemName = newItemInput.value.trim();
				if (!itemName) return;
				if (state.currentView === 'tasks') {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							column_name: itemName
						})
					});
					if (response.ok) {
						const newColumn = await response.json();
						const columnData = {
							column_id: newColumn.column_id,
							column_name: itemName
						};
						const newColumnEl = createColumnElement(columnData);
						taskBoardContainer.appendChild(newColumnEl);
						updateColumnButtonVisibility();
						newItemInput.value = '';
					} else {
						alert('Failed to add column.');
					}
				}
			});
		}
	
		/**
		* Event listener for adding new tasks via the form in a column's footer.
		*/
		taskBoardContainer.addEventListener('submit', async e => {
			if (e.target.matches('.add-task-form')) {
				e.preventDefault();
				const form = e.target;
				const input = form.querySelector('input');
				const taskText = input.value.trim();
				const columnEl = form.closest('.task-column');
				const columnId = columnEl.dataset.columnId;
				if (!taskText) return;
				const jsonData = JSON.stringify({
					task_text: taskText,
					task_notes: ""
				});
				const encryptedData = encrypt(jsonData, state.encryptionKey);
				if (!encryptedData) return alert('Could not encrypt task.');
				try {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							column_id: columnId,
							encrypted_data: encryptedData
						})
					});
					if (response.ok) {
						const newRecord = await response.json();
						const taskObject = {
							task_id: newRecord.task_id,
							column_id: columnId,
							encrypted_data: encryptedData,
							status: 'blue',
							due_date: null
						};
						const newTaskEl = createTaskElement(taskObject);
						const tasksContainer = columnEl.querySelector('.tasks-container');
						const placeholder = tasksContainer.querySelector('.no-tasks-placeholder');
						if (placeholder) placeholder.remove();
						tasksContainer.appendChild(newTaskEl);
						updateTaskCount(columnEl);
						input.value = '';
						input.focus();
					} else {
						alert('Failed to add task.');
					}
				} catch (error) {
					alert('An error occurred while adding the task.');
				}
			}
		});
	
		/**
		* Main event delegation handler for all clicks and taps within the task board.
		*/
		const handleTaskBoardInteraction = async (e) => {
			const target = e.target;
		
			if (e.type === 'touchstart') {
				const interactiveSelectors = [
					'.task-status-band',
					'[data-action]',
					'.move-column-left-btn',
					'.move-column-right-btn',
					'.delete-column-btn'
				].join(',');
		
				if (!target.closest(interactiveSelectors)) {
					return;
				}
				e.preventDefault();
			}
		
			const taskCard = target.closest('.task-card');
		
			if (target.matches('.task-status-band')) {
				if (taskCard) {
					const taskId = taskCard.dataset.taskId;
					let currentStatus = taskCard.dataset.status;
					let newStatus;
		
					if (currentStatus == 0) return;
		
					if (currentStatus == 2) {
						newStatus = 1;
						taskCard.classList.remove('priority');
					} else {
						newStatus = 2;
						taskCard.classList.add('priority');
					}
		
					taskCard.dataset.status = newStatus;
					
					const columnEl = taskCard.closest('.task-column');
		
					enforceColumnSortRules(columnEl);
					saveTaskOrder(columnEl);
		
					await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ task_id: taskId, status: newStatus })
					});
					return;
				}
			}
		
			if (taskCard) {
				const action = target.closest('[data-action]')?.dataset.action;
				const taskId = taskCard.dataset.taskId;
		
				if (action === 'toggle-menu') {
					const menu = taskCard.querySelector('.task-menu');
					if (menu) {
						const isVisible = menu.style.display === 'block';
						document.querySelectorAll('.task-menu').forEach(m => m.style.display = 'none');
						document.querySelectorAll('.task-card.is-menu-open').forEach(c => c.classList.remove('is-menu-open'));
						if (!isVisible) {
							menu.style.display = 'block';
							taskCard.classList.add('is-menu-open');
						}
					}
				} else if (action === 'move') {
					const moveModal = document.querySelector('#move-task-modal');
					const columnList = document.querySelector('#move-task-column-list');
					const modalTitle = document.querySelector('#move-task-modal-title');
					const taskTitle = taskCard.querySelector('.task-title').textContent;
		
					moveModal.dataset.taskIdToMove = taskId;
					modalTitle.textContent = `Move "${taskTitle}"`;
					columnList.innerHTML = '';
		
					const currentColumnId = taskCard.closest('.task-column').dataset.columnId;
					const allColumns = document.querySelectorAll('#task-board-container .task-column');
		
					allColumns.forEach(col => {
						const isHidden = col.offsetParent === null;
						if (col.dataset.columnId !== currentColumnId && !isHidden) {
							const moveButton = document.createElement('button');
							moveButton.className = 'btn btn-outline-primary w-100 mb-2';
							moveButton.textContent = col.querySelector('.column-title').textContent;
							moveButton.dataset.targetColumnId = col.dataset.columnId;
							columnList.appendChild(moveButton);
						}
					});
		
					moveModal.classList.remove('hidden');
					document.querySelectorAll('.task-menu').forEach(m => m.style.display = 'none');
					document.querySelectorAll('.task-card.is-menu-open').forEach(c => c.classList.remove('is-menu-open'));
		
				} else if (action === 'notes' || action === 'duedate') {
					const panelToToggle = taskCard.querySelector(action === 'notes' ? '.task-notes-container' : '.task-duedate-container');
					const isOpening = panelToToggle.style.display === 'none';
					if (state.activeTaskPanel) state.activeTaskPanel.style.display = 'none';
					if (isOpening) {
						panelToToggle.style.display = (action === 'duedate') ? 'flex' : 'block';
						state.activeTaskPanel = panelToToggle;
					} else {
						state.activeTaskPanel = null;
					}
				} else if (action === 'delete') {
					if (confirm('Are you sure you want to delete this task?')) {
						fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php?task_id=${taskId}`, { method: 'DELETE' }).then(response => {
							if (response.ok) {
								renderTaskBoard();
							} else {
								alert('Failed to delete task.');
							}
						});
					}
				} else if (action === 'duplicate') {
					const columnId = taskCard.closest('.task-column').dataset.columnId;
					const encryptedData = taskCard.dataset.encryptedData;
					const decryptedString = decrypt(encryptedData, state.encryptionKey);
					if (decryptedString && decryptedString !== "[decryption failed]") {
						const originalData = JSON.parse(decryptedString);
						originalData.task_text = `${originalData.task_text} (Copy)`;
						const newEncryptedData = encrypt(JSON.stringify(originalData), state.encryptionKey);
						fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ column_id: columnId, encrypted_data: newEncryptedData })
						}).then(() => renderTaskBoard());
					} else {
						alert('Could not duplicate task: failed to read original data.');
					}
				}
			} else {
				const columnEl = target.closest('.task-column');
				if (columnEl) {
					if (target.matches('.move-column-left-btn')) {
						const prevSibling = columnEl.previousElementSibling;
						if (prevSibling) {
							taskBoardContainer.insertBefore(columnEl, prevSibling);
							updateColumnButtonVisibility();
							saveColumnOrder();
						}
					} else if (target.matches('.move-column-right-btn')) {
						const nextSibling = columnEl.nextElementSibling;
						if (nextSibling) {
							taskBoardContainer.insertBefore(nextSibling, columnEl);
							updateColumnButtonVisibility();
							saveColumnOrder();
						}
					} else if (target.matches('.delete-column-btn')) {
						const columnId = columnEl.dataset.columnId;
						const columnName = columnEl.querySelector('.column-title').textContent;
						if (confirm(`Are you sure you want to delete the column "${columnName}" and all its tasks? This cannot be undone.`)) {
							fetch(`${window.APP_CONFIG.appUrl}/api/columns.php?column_id=${columnId}`, { method: 'DELETE' })
								.then(response => {
									if (response.ok) {
										columnEl.remove();
										updateColumnButtonVisibility();
									} else {
										alert('Failed to delete the column.');
									}
								});
						}
					}
				}
			}
		};
		
		taskBoardContainer.addEventListener('click', handleTaskBoardInteraction);
		taskBoardContainer.addEventListener('touchstart', handleTaskBoardInteraction);
	
		/**
		* Event listener for the editor ribbon tabs, switching between format, search, etc.
		*/
		const ribbonNav = document.querySelector('#ribbon-nav');
		if (ribbonNav) {
			ribbonNav.addEventListener('click', e => {
				const targetButton = e.target.closest('.ribbon-nav-btn');
				if (!targetButton) return;
		
				e.preventDefault();
		
				const targetPanelId = targetButton.dataset.target;
				const ribbonContent = document.querySelector('#ribbon-content');
		
				if (!targetPanelId || !ribbonContent) return; 
		
				ribbonNav.querySelectorAll('.ribbon-nav-btn').forEach(btn => btn.classList.remove('active'));
				ribbonContent.querySelectorAll('.ribbon-panel').forEach(panel => panel.classList.remove('active'));
		
				targetButton.classList.add('active');
				const targetPanel = document.querySelector(`#${targetPanelId}`);
				if (targetPanel) {
					targetPanel.classList.add('active');
				}
			});
		}
	
	
		/**
		* Event listener for handling changes within the task board (checkboxes, etc.).
		*/
		taskBoardContainer.addEventListener('change', e => {
			if (e.target.matches('.task-complete-checkbox')) {
				const taskCard = e.target.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
				const isCompleted = e.target.checked;
				let newStatus;
		
				taskCard.classList.toggle('completed', isCompleted);
		
				if (isCompleted) {
					newStatus = 0;
					taskCard.classList.remove('priority');
		
					if (state.soundEffectsEnabled && state.whooshSound) {
						state.whooshSound.currentTime = 0;
						state.whooshSound.play();
					}
					taskCard.classList.add('flash-animation');
					
				} else {
					newStatus = 1;
				}
				
				taskCard.dataset.status = newStatus;
		
				const columnEl = taskCard.closest('.task-column');
				enforceColumnSortRules(columnEl);
				
				saveTaskOrder(columnEl);
		
				if (isCompleted) {
					setTimeout(() => {
						taskCard.classList.remove('flash-animation');
						applyTaskFilters();
					}, 3500);
				} else {
					applyTaskFilters();
				}
		
				fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ task_id: taskId, status: newStatus })
				});
			} else if (e.target.matches('.private-column-checkbox')) {
				const columnEl = e.target.closest('.task-column');
				const columnId = columnEl.dataset.columnId;
				const isPrivate = e.target.checked;
		
				columnEl.dataset.isPrivate = isPrivate ? 1 : 0;
		
				fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						column_id: columnId,
						is_private: isPrivate
					})
				});
			} else if (e.target.matches('.task-duedate-picker')) {
				const taskCard = e.target.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
				const newDueDate = e.target.value || null;
		
				fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ task_id: taskId, due_date: newDueDate })
				}).then(response => {
					if (!response.ok) {
						alert('Failed to update due date.');
						return;
					}
		
					const titleEl = taskCard.querySelector('.task-title');
					let indicatorEl = titleEl.querySelector('.due-date-indicator');
					if (indicatorEl) indicatorEl.remove();
		
					taskCard.dataset.dueDate = newDueDate || '';
					taskCard.classList.remove('past-due');
		
					if (newDueDate) {
						const dueDate = new Date(newDueDate + 'T12:00:00');
						const now = new Date();
						now.setHours(0, 0, 0, 0);
		
						if (dueDate < now) {
							taskCard.classList.add('past-due');
						}
						const month = String(dueDate.getMonth() + 1).padStart(2, '0');
						const day = String(dueDate.getDate()).padStart(2, '0');
						const formattedDate = `${month}/${day}`;
		
						titleEl.insertAdjacentHTML('beforeend', `&nbsp;&nbsp;<span class="due-date-indicator">${formattedDate}</span>`);
		
						taskCard.querySelector('.due-date-display').textContent = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'long' });
					} else {
						taskCard.querySelector('.due-date-display').textContent = 'No due date';
					}
				});
			}
		});
		
		
		/**
         * Handles the "more options" button on the responsive format bar.
         */
        const formatBarMoreBtn = document.querySelector('#format-bar-more-btn');
        if (formatBarMoreBtn) {
            const formatBarDropdown = document.querySelector('#format-bar-dropdown');
            const mainFormatGroups = document.querySelector('#format-panel-main-groups');
        
            formatBarMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the document click listener from closing it immediately
                
                const isShown = formatBarDropdown.classList.toggle('show');
        
                if (isShown) {
                    // Clear any previous items
                    formatBarDropdown.innerHTML = '';
                    
                    // Find all the format groups that are currently hidden
                    const hiddenGroups = mainFormatGroups.querySelectorAll('.format-group:nth-child(n+3)');
                    
                    // Clone them and add them to the dropdown
                    hiddenGroups.forEach(group => {
                        formatBarDropdown.appendChild(group.cloneNode(true));
                    });
                }
            });
        
            // Add a listener to close the dropdown when clicking anywhere else
            document.addEventListener('click', (e) => {
                if (formatBarDropdown.classList.contains('show') && !formatBarDropdown.contains(e.target)) {
                    formatBarDropdown.classList.remove('show');
                }
            });
        }
		
		
		const handleJournalBoardInteraction = async (e) => {
            const target = e.target;
        
            if (e.type === 'touchstart') {
                const interactiveSelectors = ['[data-action]', '.journal-nav-btn'].join(',');
                if (!target.closest(interactiveSelectors)) {
                    // On touch, only allow specific actions, not the whole card, to prevent accidental opening.
                    return;
                }
                e.preventDefault();
            }
        
            const entryCard = target.closest('.journal-entry-card');
        
            // This block handles clicks on the journal day navigation (< >)
            if (target.matches('.journal-nav-btn')) {
                const direction = target.dataset.direction === 'next' ? 1 : -1;
                state.currentJournalDate = getOffsetDate(state.currentJournalDate, direction);
                renderJournalBoard();
                return; // Stop further execution
            }
        
            // This block handles all clicks on or within a journal entry card
            if (entryCard) {
                // If the user is actively editing the title, do nothing to prevent re-opening the editor.
                if (target.isContentEditable) {
                    return;
                }
                
                const action = target.closest('[data-action]')?.dataset.action;
                const entryId = entryCard.dataset.entryId;
        
                if (action === 'toggle-menu') {
                    const menu = entryCard.querySelector('.task-menu');
                    if (menu) {
                        const isVisible = menu.style.display === 'block';
                        document.querySelectorAll('.task-menu').forEach(m => m.style.display = 'none');
                        document.querySelectorAll('.journal-entry-card.is-menu-open').forEach(c => c.classList.remove('is-menu-open'));
                        if (!isVisible) {
                            entryCard.classList.add('is-menu-open');
                            menu.style.display = 'block';
                            const cardRect = entryCard.getBoundingClientRect();
                            const menuHeight = menu.offsetHeight;
                            const isNearBottom = (window.innerHeight - cardRect.bottom) < (menuHeight + 10);
                            menu.classList.toggle('drop-up', isNearBottom);
                        }
                    }
                } else if (action === 'delete') {
                    if (confirm('Are you sure you want to delete this journal entry?')) {
                        fetch(`${window.APP_CONFIG.appUrl}/api/journal.php?entry_id=${entryId}`, {
                            method: 'DELETE'
                        }).then(res => {
                            if (res.ok) entryCard.remove();
                            else alert('Failed to delete entry.');
                        });
                    }
                } else if (action === 'duplicate') {
                    // ... (duplicate logic remains the same)
                } else if (action === 'toggle-private') {
                    // ... (toggle-private logic remains the same)
                } else {
                    // REVISED LOGIC:
                    // This block now handles a click on the "Notes" menu item (where action === 'notes')
                    // AND a direct click on the card body (where action is undefined).
                    // By removing the timer, the editor opens instantly and reliably.
                    openEditorById(entryId);
                }
            }
        };
		
		// NEW: Make the editor counters update live as the user types.
        const editorTextareaForCounter = document.querySelector('#editor-mode-editor');
        if (editorTextareaForCounter) {
            editorTextareaForCounter.addEventListener('input', updateEditorCounters);
        }
		
		
		
		journalBoardContainer.addEventListener('click', handleJournalBoardInteraction);
		journalBoardContainer.addEventListener('touchstart', handleJournalBoardInteraction);
	
		/**
		* Event listener for adding a new journal entry via the form in a column's footer.
		*/
		journalBoardContainer.addEventListener('submit', async e => {
			if (e.target.matches('.add-journal-entry-form')) {
				e.preventDefault();
				const form = e.target;
				const input = form.querySelector('input');
				const entryTitle = input.value.trim();
				const entryDate = form.dataset.date;
				if (!entryTitle || !entryDate) return;
				const jsonData = JSON.stringify({
					entry_title: entryTitle,
					entry_notes: ""
				});
				const encryptedData = encrypt(jsonData, state.encryptionKey);
				if (!encryptedData) return alert('Could not encrypt entry.');
				try {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							entry_date: entryDate,
							encrypted_data: encryptedData
						})
					});
					if (response.ok) {
						const newEntry = await response.json();
						const entryObjectForUI = {
							entry_id: newEntry.entry_id,
							entry_date: entryDate,
							encrypted_data: encryptedData,
						};
						const newEntryEl = createJournalEntryElement(entryObjectForUI);
						const container = form.closest('.task-column').querySelector('.journal-entries-container');
						const placeholder = container.querySelector('p.text-secondary');
						if (placeholder) placeholder.remove();
						container.appendChild(newEntryEl);
						input.value = '';
						input.focus();
					} else {
						alert('Failed to add journal entry.');
					}
				} catch (error) {
					alert('An error occurred while adding the entry.');
				}
			}
		});
	
		/**
	 * Event listener for the 'Add Task' form in the editor header.
	 */
	const editorAddTaskForm = document.querySelector('#editor-add-task-form');
	if (editorAddTaskForm) { // This 'if' check prevents the error
		editorAddTaskForm.addEventListener('submit', async (e) => {
			e.preventDefault();
		
			const titleInput = document.querySelector('#editor-new-task-title');
			const columnSelect = document.querySelector('#editor-task-column-select');
			const priorityCheck = document.querySelector('#editor-task-priority-check');
		
			const taskText = titleInput.value.trim();
			if (!taskText || columnSelect.disabled) {
				return;
			}
		
			const columnId = columnSelect.value;
			const status = priorityCheck.checked ? 2 : 1;
		
			const taskData = {
				task_text: taskText,
				task_notes: ""
			};
			const encryptedData = encrypt(JSON.stringify(taskData), state.encryptionKey);
			if (!encryptedData) return alert('Could not encrypt task.');
		
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						column_id: columnId,
						encrypted_data: encryptedData,
						status: status
					})
				});
		
				if (response.ok) {
					titleInput.value = '';
					priorityCheck.checked = false;
					showToastNotification('Task Created');
				} else {
					alert('Failed to create task.');
				}
			} catch (error) {
				alert('An error occurred while creating the task.');
			}
		});
	}
		
		/**
		* Event listener for the editor's close button.
		*/
		editorModeCloseBtn.addEventListener('click', closeEditorMode);
	
		/**
		* Event listener for the main search form in the application header.
		*/
		headerJournalSearchForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const term = e.target.querySelector('input[name="term"]').value;
			const range = e.target.querySelector('select[name="range"]').value;
			const resultsContainer = document.querySelector('#main-search-output');
			performJournalSearch(term, range, resultsContainer);
			journalBoardContainer.classList.add('d-none');
			mainSearchResultsContainer.classList.remove('d-none');
		});
	
		/**
		* Event listener for the search form within the editor's ribbon.
		*/
		journalSearchForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const term = e.target.querySelector('#journal-search-term').value;
			const range = e.target.querySelector('#journal-search-range').value;
			const resultsContainer = document.querySelector('#journal-search-results-container');
			performJournalSearch(term, range, resultsContainer);
			const editorTextarea = document.querySelector('#editor-mode-editor');
			editorTextarea.classList.add('d-none');
			const journalSearchResultsArea = document.querySelector('#journal-search-results-area');
			journalSearchResultsArea.classList.remove('d-none');
		});
	
		/**
		* Event listener for interactions within the editor container (e.g., closing search results).
		*/
		editorModeContainer.addEventListener('click', (e) => {
			if (e.target.id === 'back-to-editor-btn') {
				if (state.activeEditor.entryData) {
					openEditorMode(state.activeEditor.entryData);
				}
			}
		});
	
		/**
		* Global click listener for handling modal closing and menu pop-up dismissal.
		*/
		document.addEventListener('click', e => {
			const target = e.target;
		
			if (target.matches('.close-modal-btn')) {
				const modalId = target.dataset.targetModal;
				if (modalId) {
					const modal = document.querySelector(`#${modalId}`);
					if (modal) {
						modal.classList.add('hidden');
					}
				}
			}
		
			if (!target.closest('.task-menu-container')) {
				document.querySelectorAll('.task-menu').forEach(menu => menu.style.display = 'none');
				document.querySelectorAll('.task-card').forEach(c => c.classList.remove('is-menu-open'));
				document.querySelectorAll('.journal-entry-card').forEach(c => c.classList.remove('is-menu-open'));
			}
		
			if (state.activeTaskPanel) {
				if (!state.activeTaskPanel.closest('.task-card').contains(target)) {
					state.activeTaskPanel.style.display = 'none';
					state.activeTaskPanel = null;
				}
			}
			
			if (target.id === 'close-main-search-btn') {
				mainSearchResultsContainer.classList.add('d-none');
				journalBoardContainer.classList.remove('d-none');
				headerJournalSearchForm.querySelector('input[name="term"]').value = '';
			}
		
			const resultItem = target.closest('.search-result-item');
			if (resultItem) {
				const header = target.closest('.search-result-header');
				const snippet = target.closest('.search-result-snippet');
				if (header || snippet) {
					const fullContent = resultItem.querySelector('.search-result-full-content');
					const snippetContent = resultItem.querySelector('.search-result-snippet');
					const isNowExpanded = resultItem.classList.toggle('is-expanded');
					if (fullContent) fullContent.style.display = isNowExpanded ? 'block' : 'none';
					if (snippetContent) snippetContent.style.display = isNowExpanded ? 'none' : 'block';
				}
			}
		});
		
		/**
		* Global double-click listener for opening a search result in the editor.
		*/
		document.addEventListener('dblclick', e => {
			const resultItem = e.target.closest('.search-result-item');
			if (resultItem) {
				const entryId = resultItem.dataset.entryId;
				if (editorModeContainer.classList.contains('d-none')) {
					openEditorById(entryId);
				} else if (state.activeEditor.entryData) {
					saveCurrentEditorNote().then(() => {
						openEditorById(entryId);
					});
				} else {
					openEditorById(entryId);
				}
			}
		});
	
		/**
		* Event listener for the 'Skip Weekends' toggle in the side menu.
		*/
		const skipWeekendsToggle = document.querySelector('#skip-weekends-toggle');
		if (skipWeekendsToggle) {
			skipWeekendsToggle.addEventListener('change', (e) => {
				state.skipWeekends = e.target.checked;
				localStorage.setItem('skipWeekends', state.skipWeekends);
				
				const day = state.currentJournalDate.getDay();
				if (state.skipWeekends && (day === 6 || day === 0)) {
					todayBtn.click();
				} else {
					renderJournalBoard();
				}
			});
		}
	
		/**
		* Event listener for the journal day-count view controls (1, 3, 5 days).
		*/
		viewCountControls.addEventListener('click', e => {
			const target = e.target.closest('button');
			if (!target) return;
		
			const count = parseInt(target.dataset.count, 10);
			if (count === state.journalColumnCount) return;
		
			state.journalColumnCount = count;
			viewCountControls.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
			target.classList.add('active');
		
			savePreference('journal_column_count', count);
		
			renderJournalBoard();
		});
	
		/**
		* Event listener for the 'Today' button to jump to the current date.
		*/
		todayBtn.addEventListener('click', () => {
			const today = new Date();
			today.setHours(12, 0, 0, 0);
			state.currentJournalDate = today;
		
			if (state.skipWeekends) {
				const day = state.currentJournalDate.getDay();
				if (day === 6) { 
					state.currentJournalDate.setDate(state.currentJournalDate.getDate() + 2);
				} else if (day === 0) {
					state.currentJournalDate.setDate(state.currentJournalDate.getDate() + 1);
				}
			}
			renderJournalBoard();
		});
		
		/**
		* Event listener for the date picker input to jump to a specific date.
		*/
		dateJumpInput.addEventListener('change', e => {
			const dateValue = e.target.value;
			if (dateValue) {
				const selectedDate = new Date(dateValue + 'T12:00:00');
				if (!isNaN(selectedDate.getTime())) {
					state.currentJournalDate = selectedDate;
					renderJournalBoard();
				}
			}
		});
	
		/**
		* Event listener for the 'Wrap-up' button to create a summary note for the day.
		*/
		dayWrapUpBtn.addEventListener('click', async () => {
			const dateStr = formatDate(state.currentJournalDate);
			const columnEl = document.querySelector(`.task-column[data-date="${dateStr}"]`);
			if (!columnEl) return alert('Could not find the current day\'s column.');
			const entriesToWrap = [];
			const entryCards = columnEl.querySelectorAll('.journal-entry-card');
		
			const stripHtml = (html) => {
				const tempDiv = document.createElement("div");
				tempDiv.innerHTML = html;
				return tempDiv.textContent || tempDiv.innerText || "";
			};
		
			entryCards.forEach(card => {
				const titleEl = card.querySelector('.entry-title');
				if (titleEl) {
					if (titleEl.textContent.includes('Wrap-up')) return;
		
					const decryptedString = decrypt(card.dataset.encryptedData, state.encryptionKey);
					let notes = "";
					if (decryptedString !== "[decryption failed]") {
						try {
							notes = JSON.parse(decryptedString).entry_notes || "";
						} catch(e) { /* Fails gracefully */ }
					}
					entriesToWrap.push({
						title: titleEl.textContent,
						notes: notes
					});
				}
			});
		
			if (entriesToWrap.length === 0) return alert('No entries to wrap-up for this day.');
		
			const originalDatePart = formatDate(state.currentJournalDate).replace(/-/g, '.');
			const originalWeekday = state.currentJournalDate.toLocaleDateString('en-US', {
				weekday: 'long'
			});
			const newTitle = `[${originalDatePart} ~ ${originalWeekday}] Wrap-up`;
		
			const year = state.currentJournalDate.getFullYear();
			const month = state.currentJournalDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
			const day = String(state.currentJournalDate.getDate()).padStart(2, '0');
			const formattedDate = `DATE: ${year}.${month}.${day}`;
			const weekday = `WEEKDAY: ${state.currentJournalDate.toLocaleDateString('en-us', { weekday: 'long' }).toUpperCase()}`;
			
			const headerWidth = 58;
			const titleText = "D A Y   W R A P - U P";
			const titlePadding = ' '.repeat(Math.floor((headerWidth - titleText.length) / 2));
			const datePadding = ' '.repeat(headerWidth - formattedDate.length - weekday.length - 4);
		
			const topBorder = `╓${'─'.repeat(headerWidth)}╖`;
			const titleLine = `║${titlePadding}${titleText}${' '.repeat(headerWidth - titleText.length - titlePadding.length)}║`;
			const middleBorder = `╟${'─'.repeat(headerWidth)}╢`;
			const dateLine = `║  ${formattedDate}${datePadding}${weekday}  ║`;
			const bottomBorder = `╙${'─'.repeat(headerWidth)}╜`;
			
			let newNotes = [topBorder, titleLine, middleBorder, dateLine, bottomBorder, ''].join('\n');
		
			entriesToWrap.forEach((entry, index) => {
				const title = entry.title;
				const content = stripHtml(entry.notes);
				const topicHeader = `-ˋˏ ༻ ${title} ༺ ˎˊ-`;
				const titleUnderline = '-'.repeat(topicHeader.length);
		
				newNotes += `\n${titleUnderline}\n${topicHeader}\n${titleUnderline}\n`;
		
				if (content) {
					newNotes += `${content}\n`;
				}
				
				if (index < entriesToWrap.length - 1) {
					newNotes += "\n---\n";
				}
			});
			
			const entryData = {
				entry_title: newTitle,
				entry_notes: newNotes
			};
			const encryptedData = encrypt(JSON.stringify(entryData), state.encryptionKey);
		
			if (!encryptedData) return alert('Could not encrypt the wrap-up entry.');
		
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						entry_date: dateStr,
						encrypted_data: encryptedData,
						position: 'top'
					})
				});
		
				if (response.ok) {
					renderJournalBoard();
				} else {
					alert('Failed to save the wrap-up entry to the server.');
				}
			} catch (error) {
				alert('An error occurred while creating the wrap-up entry.');
			}
		});
		
		/**
		* Event listener for the editor's print button.
		*/
		if (editorModePrintBtn) {
			editorModePrintBtn.addEventListener('click', () => {
				const titleHTML = editorModeDatePrefix.innerHTML + ' ' + editorModeTitleText.textContent;
				const contentHTML = document.querySelector('#editor-mode-editor').value.replace(/\n/g, '<br>');
				
				const fullPrintHTML = `
					<html>
						<head>
							<title>Print - ${document.title}</title>
							<style>
								body { 
									font-family: Consolas, Monaco, 'Courier New', monospace; 
									font-size: 12pt;
									line-height: 1.5;
								}
								h1 {
									font-size: 16pt;
								}
							</style>
						</head>
						<body>
							<h1>${titleHTML}</h1>
							<div>${contentHTML}</div>
						</body>
					</html>`;
		
				const printWindow = window.open('', '_blank');
				printWindow.document.write(fullPrintHTML);
				printWindow.document.close();
				printWindow.focus();
				printWindow.print();
				printWindow.close();
			});
		}
	
		/**
		* Main logic for the Find & Replace feature in the editor.
		*/
		function updateFindState() {
			const editor = document.querySelector('#editor-mode-editor');
			const searchTerm = state.findState.term;
			const content = editor.value;
			const matchCase = state.findState.matchCase;
			
			state.findState.results = [];
			state.findState.currentIndex = -1;
		
			if (!searchTerm) {
				updateFindCounter();
				return;
			}
		
			const searchFlags = matchCase ? 'g' : 'gi';
			const safeSearchTerm = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			const regex = new RegExp(safeSearchTerm, searchFlags);
			let match;
		
			while ((match = regex.exec(content)) !== null) {
				state.findState.results.push(match.index);
			}
			updateFindCounter();
		}
		
		function updateFindCounter() {
			const total = state.findState.results.length;
			const current = state.findState.currentIndex;
			findCounter.textContent = `${total > 0 ? current + 1 : 0} / ${total}`;
			
			findTermInput.classList.toggle('is-invalid', state.findState.term && total === 0);
		}
		
		function highlightCurrentMatch() {
			const results = state.findState.results;
			const currentIndex = state.findState.currentIndex;
			if (currentIndex === -1 || results.length === 0) return;
		
			const editor = document.querySelector('#editor-mode-editor');
			const start = results[currentIndex];
			const end = start + state.findState.term.length;
		
			editor.focus();
			editor.setSelectionRange(start, end);
		
			const fullText = editor.value;
			const textBefore = fullText.substring(0, start);
			const lines = textBefore.split('\n').length;
			editor.scrollTop = (lines - 5) * 1.5 * state.editorFontSize;
		
			updateFindCounter();
		}
		
		if (findReplaceForm) {
			findReplaceForm.addEventListener('click', e => {
				const target = e.target.closest('button');
				if (!target) return;
		
				const action = target.id;
				let { currentIndex, results } = state.findState;
				const total = results.length;
				const editor = document.querySelector('#editor-mode-editor');
		
				if (action === 'find-next-btn') {
					if (total === 0) return;
					state.findState.currentIndex = (currentIndex + 1) % total;
					highlightCurrentMatch();
				} else if (action === 'find-prev-btn') {
					if (total === 0) return;
					state.findState.currentIndex = (currentIndex - 1 + total) % total;
					highlightCurrentMatch();
				} else if (action === 'replace-btn') {
					if (currentIndex === -1 || total === 0) return;
					
					const start = results[currentIndex];
					const end = start + state.findState.term.length;
					
					editor.value = editor.value.substring(0, start) + state.findState.replaceTerm + editor.value.substring(end);
					
					updateFindState();
					if (state.findState.results.length > 0) {
						state.findState.currentIndex = currentIndex < state.findState.results.length ? currentIndex : state.findState.results.length - 1;
						highlightCurrentMatch();
					}
				} else if (action === 'replace-all-btn') {
					if (total === 0) return;
					
					const searchFlags = state.findState.matchCase ? 'g' : 'gi';
					const safeSearchTerm = state.findState.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
					const regex = new RegExp(safeSearchTerm, searchFlags);
		
					editor.value = editor.value.replace(regex, state.findState.replaceTerm);
					updateFindState();
				}
			});
		
			findReplaceForm.addEventListener('input', e => {
				if (e.target.id === 'find-term-input') {
					state.findState.term = e.target.value;
					updateFindState();
				} else if (e.target.id === 'replace-term-input') {
					state.findState.replaceTerm = e.target.value;
				}
			});
		
			findReplaceForm.addEventListener('change', e => {
				if (e.target.id === 'find-match-case-check') {
					state.findState.matchCase = e.target.checked;
					updateFindState();
				}
			});
		}
	
		/**
		* Event listener for handling clicks within the 'Move Task' modal.
		*/
		const moveTaskModal = document.querySelector('#move-task-modal');
		if (moveTaskModal) {
			moveTaskModal.addEventListener('click', async (e) => {
				const target = e.target;
				if (target.matches('[data-target-column-id]')) {
					const taskId = moveTaskModal.dataset.taskIdToMove;
					const targetColumnId = target.dataset.targetColumnId;
		
					if (!taskId || !targetColumnId) return;
		
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							task_id: taskId,
							column_id: targetColumnId
						})
					});
		
					if (response.ok) {
						moveTaskModal.classList.add('hidden');
						renderTaskBoard();
					} else {
						alert('Failed to move the task. Please try again.');
					}
				}
			});
		}
	
		async function initializeApp() {
			state.encryptionKey = sessionStorage.getItem('encryptionKey');
			if (!state.encryptionKey) {
				window.location.href = 'login.php';
				return;
			}
			try {
				const prefsRes = await fetch(`${window.APP_CONFIG.appUrl}/api/preferences.php?t=` + new Date().getTime());
				const prefs = await prefsRes.json();
		
				const eventsRes = await fetch(`${window.APP_CONFIG.appUrl}/api/calendar_events.php`);
				if (eventsRes.ok) {
					state.calendarEvents = await eventsRes.json();
				}
		
				if (window.APP_CONFIG && window.APP_CONFIG.debug) {
					console.log("Preferences loaded from server:", prefs);
					console.log("Calendar Events loaded:", state.calendarEvents);
				}
		
				// --- Start: Set state and UI from DB preferences ---
				if (prefs.app_title) {
					appTitleEl.textContent = prefs.app_title;
					document.title = prefs.app_title;
				}
				if (prefs.tasks_tab_title) document.querySelector('.view-tab[data-view="tasks"]').textContent = prefs.tasks_tab_title;
				if (prefs.journal_tab_title) document.querySelector('.view-tab[data-view="journal"]').textContent = prefs.journal_tab_title;
		
				state.theme = prefs.theme || 'dark';
				applyTheme();
		
				state.editorFontSize = parseInt(prefs.editor_font_size_px ?? 16);
				state.journalColumnCount = parseInt(prefs.journal_column_count ?? 3);
		
				if (prefs.custom_fillers) {
					try {
						state.customFillers = JSON.parse(prefs.custom_fillers);
						state.customFillers.forEach((fillerText, index) => {
							const input = document.querySelector(`#filler-${index + 1}`);
							if (input) input.value = fillerText;
						});
					} catch (e) {
						console.error("Could not parse custom fillers preference.", e);
						state.customFillers = [];
					}
				}
		
				if (prefs.filters) {
					try {
						state.filters.savedFilters = JSON.parse(prefs.filters);
					} catch (e) {
						console.error("Could not parse saved filters preference.", e);
						state.filters.savedFilters = null;
					}
				}
		
				updateFillerTooltips();
		
				state.filters.showAssigned = !!parseInt(prefs.show_assigned ?? 1);
				state.filters.showMine = !!parseInt(prefs.show_mine ?? 1);
				state.filters.showCompleted = !parseInt(prefs.hide_completed ?? 1);
				state.filters.priorityOnly = !!parseInt(prefs.priority_only ?? 0);
				state.filters.hidePrivate = !!parseInt(prefs.hide_private ?? 0);
				state.filters.privateViewOnly = !!parseInt(prefs.private_view_only ?? 0);
				state.filters.showShared = !!parseInt(prefs.show_shared ?? 1);
				state.soundEffectsEnabled = !!parseInt(prefs.sound_effects_enabled ?? 1);
				state.sessionTimeoutMinutes = parseInt(prefs.session_timeout_minutes ?? 30);
				// NEW: Load the user's visible calendar preferences into state
				state.visibleCalendars = new Set(prefs.visible_calendars || []);
		
				filterAssignedBtn.classList.toggle('active', state.filters.showAssigned);
				filterMineBtn.classList.toggle('active', state.filters.showMine);
				filterCompletedBtn.classList.toggle('active', state.filters.showCompleted);
				filterPriorityBtn.classList.toggle('active', state.filters.priorityOnly);
				document.querySelector('#sound-toggle').checked = state.soundEffectsEnabled;
				document.querySelector('#session-timeout-select').value = state.sessionTimeoutMinutes;
				
				document.querySelectorAll('.view-count-controls button').forEach(btn => {
					btn.classList.toggle('active', parseInt(btn.dataset.count) === state.journalColumnCount);
				});
		
				const themeToggleGroup = document.querySelector('#theme-toggle-group');
				if (themeToggleGroup) {
					themeToggleGroup.querySelector(`[data-theme="${state.theme}"]`)?.classList.add('active');
				}
		
				togglePrivateBtn.classList.toggle('active', state.filters.hidePrivate);
				taskBoardContainer.classList.toggle('hide-private', state.filters.hidePrivate);
				journalBoardContainer.classList.toggle('hide-private', state.filters.hidePrivate);
		
				const privateViewOnlyToggle = document.querySelector('#private-view-only-toggle');
				if (privateViewOnlyToggle) {
					privateViewOnlyToggle.checked = state.filters.privateViewOnly;
				}
				if (togglePrivateBtn) togglePrivateBtn.disabled = state.filters.privateViewOnly;
				
				taskBoardContainer.classList.toggle('private-only-mode', state.filters.privateViewOnly);
				journalBoardContainer.classList.toggle('private-only-mode', state.filters.privateViewOnly);
		
			} catch (error) {
				console.error("Could not load user preferences.", error);
			}
			
			// --- Start: Set state and UI from localStorage ---
			const savedView = localStorage.getItem('currentView');
			if (savedView === 'journal') state.currentView = 'journal';
			
			const savedFontSize = localStorage.getItem('appFontSize');
			if (savedFontSize) state.fontSize = parseFloat(savedFontSize);
			applyFontSize();
		
			state.skipWeekends = localStorage.getItem('skipWeekends') === 'true';
			const skipWeekendsToggle = document.querySelector('#skip-weekends-toggle');
			if(skipWeekendsToggle) {
				skipWeekendsToggle.checked = state.skipWeekends;
			}
		
			// --- Final setup ---
			const today = new Date();
			today.setHours(12, 0, 0, 0); 
			state.currentJournalDate = today;
		
			updateFooterDate();
			setInterval(updateFooterDate, 60000);
			updateView();
		
			resetSessionTimer();
		}
	
		initializeApp();
	}, 0); // A 0ms delay is all that is needed.
	});