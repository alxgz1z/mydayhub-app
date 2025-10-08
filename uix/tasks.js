/**
 * code for /uix/tasks.js
 *
 * MyDayHub - Tasks View Module
 *
 * Handles fetching and rendering the task board, and all interactions
 * within the Tasks view.
 *
 * @version 7.4 Jaco
 * @author Alex & Gemini & Claude & Cursor
 */

// ==========================================================================
// FRONTEND ENCRYPTION/DECRYPTION
// ==========================================================================

/**
 * Decrypt task data using frontend approach
 * For now, we'll use server-side decryption until proper zero-knowledge is implemented
 */
async function decryptTaskDataFrontend(encryptedEnvelope) {
    try {
        // Get the item ID from the encrypted envelope
        const itemId = encryptedEnvelope.item_id;
        
        // For now, use server-side decryption since it works
        // TODO: Implement proper zero-knowledge frontend decryption
        const decryptedData = await getItemEncryptionKey(itemId, 'task');
        
        if (decryptedData) {
            return decryptedData;
        }

        return null;
    } catch (error) {
        console.error('Frontend decryption error:', error);
        return null;
    }
}

/**
 * Get item encryption key for decryption
 * For now, we'll use a simplified approach that works with the current system
 */
async function getItemEncryptionKey(itemId, itemType) {
    try {
        // For the current implementation, we'll use the existing server-side decryption
        // This is a temporary solution until we implement proper zero-knowledge key management
        const response = await fetch(`/api/api.php?module=tasks&action=decryptTaskData&task_id=${itemId}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            // Return the decrypted data directly since server-side decryption works
            return result.data;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching decrypted data:', error);
        return null;
    }
}

let dragSourceColumn = null;

let filterState = {
	showCompleted: false,
	showPrivate: false,
	showSnoozed: false
};

let userStorage = { used: 0, quota: 50 * 1024 * 1024 }; 

let isImageViewerOpen = false;

let isModalOpening = false; 

let isActionRunning = false;

// Modified for Mobile Move Mode
let isMoveModeActive = false;
let taskToMoveId = null;


/**
 * Helper to format YYY-MM-DD to MM/DD.
 */
function formatDueDate(dateString) {
	if (!dateString || typeof dateString !== 'string') return '';
	const parts = dateString.split('-');
	if (parts.length !== 3) return '';
	return `${parts[1]}/${parts[2]}`;
}


/**
 * Initializes the Tasks view by fetching and rendering the board.
 */
function initTasksView() {
	fetchAndRenderBoard();
	initEventListeners();
}

/**
 * Helper function to reconstruct a task data object from a DOM element.
 */
function getTaskDataFromElement(taskCardEl) {
	 return {
		 task_id: taskCardEl.dataset.taskId,
		 encrypted_data: JSON.stringify({
			 title: decodeURIComponent(taskCardEl.dataset.title),
			 notes: decodeURIComponent(taskCardEl.dataset.notes)
		 }),
		 classification: taskCardEl.dataset.classification,
		 is_private: taskCardEl.dataset.isPrivate === 'true',
		 due_date: taskCardEl.dataset.dueDate || null,
		 has_notes: taskCardEl.dataset.hasNotes === 'true',
		 attachments_count: parseInt(taskCardEl.dataset.attachmentsCount || '0', 10),
		 updated_at: taskCardEl.dataset.updatedAt,
		 snoozed_until: taskCardEl.dataset.snoozedUntil || null,
		 snoozed_at: taskCardEl.dataset.snoozedAt || null,
		 is_snoozed: taskCardEl.dataset.isSnoozed === 'true',
		 access_type: taskCardEl.dataset.accessType || 'owner',
		 ready_for_review: taskCardEl.dataset.readyForReview === 'true',
		 shared_by: taskCardEl.dataset.sharedBy || null
	 };
 }

/**
 * Re-renders a single task card in place. Preserves scroll position.
 */
function rerenderTaskCard(taskCard) {
	if (!taskCard) return;

	const columnBody = taskCard.closest('.column-body');
	const oldScroll = { top: columnBody ? columnBody.scrollTop : 0, left: document.documentElement.scrollLeft };

	const taskData = getTaskDataFromElement(taskCard);
	if (!taskData) return;

	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = createTaskCard(taskData);
	const newCardEl = tempDiv.firstElementChild;

	taskCard.replaceWith(newCardEl);
	
	if (columnBody) {
		columnBody.scrollTop = oldScroll.top;
	}
	document.documentElement.scrollLeft = oldScroll.left;
}

/**
 * Handles the custom event dispatched from the editor when a note is saved.
 */
function handleNoteSaved(e) {
	const { taskId, hasNotes } = e.detail;
	const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
	if (taskCard) {
		taskCard.dataset.hasNotes = hasNotes;
		rerenderTaskCard(taskCard);
	}
}

/**
 * Opens the Unified Editor for a given task card.
 */
function openNotesEditorForTask(taskCard) {
	if (window.UnifiedEditor && typeof window.UnifiedEditor.open === 'function') {
		const taskId = taskCard.dataset.taskId;
		const notes = decodeURIComponent(taskCard.dataset.notes || '');
		const title = decodeURIComponent(taskCard.dataset.title || 'Edit Note');
		const updatedAt = taskCard.dataset.updatedAt;

		const boardContainer = document.getElementById('task-board-container');
		const savedFontSize = boardContainer.dataset.editorFontSize || 16;

		UnifiedEditor.open({
			id: taskId,
			kind: 'task',
			title: `Note: ${title}`,
			content: notes,
			updatedAt: updatedAt,
			fontSize: parseInt(savedFontSize, 10)
		});
	} else {
		showToast({ message: 'Editor component is not available.', type: 'error' });
	}
}

/**
 * Opens the Due Date modal for a given task card and handles the result.
 */
async function openDueDateModalForTask(taskCard) {
	if (isModalOpening) return;
	isModalOpening = true;

	try {
		const taskId = taskCard.dataset.taskId;
		const currentDate = taskCard.dataset.dueDate;
		const newDate = await showDueDateModal(currentDate);

		if (newDate !== null && newDate !== currentDate) {
			const success = await saveTaskDueDate(taskId, newDate);
			if (success) {
				taskCard.dataset.dueDate = newDate;
				rerenderTaskCard(taskCard);
			}
		}
	} finally {
		isModalOpening = false;
	}
}

/**
 * Sends a request to restore a soft-deleted item.
 */
async function restoreItem(type, id) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'restoreItem',
			type: type,
			id: id
		});

		if (result.status === 'success') {
			if (type === 'task') {
				const restoredTask = result.data;
				const columnEl = document.querySelector(`.task-column[data-column-id="${restoredTask.column_id}"]`);
				if (columnEl) {
					const hiddenCard = document.querySelector(`.task-card[data-task-id="${id}"][style*="display: none"]`);
					if (hiddenCard) {
						hiddenCard.style.display = 'flex';
					} else {
						const taskCardHTML = createTaskCard(restoredTask);
						const columnBody = columnEl.querySelector('.column-body');
						columnBody.insertAdjacentHTML('beforeend', taskCardHTML);
					}
					const columnBody = columnEl.querySelector('.column-body');
					sortTasksInColumn(columnBody);
					updateColumnTaskCount(columnEl);
				}
			} else if (type === 'column') {
				const restoredColumn = result.data;
				const hiddenColumn = document.querySelector(`.task-column[data-column-id="${id}"][style*="display: none"]`);
				if (hiddenColumn) {
					hiddenColumn.style.display = 'flex';
				} else {
					const boardContainer = document.getElementById('task-board-container');
					const columnEl = createColumnElement(restoredColumn);
					boardContainer.appendChild(columnEl);
				}
				updateMoveButtonVisibility();
			}
			showToast({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} restored.`, type: 'success' });
		} else {
			throw new Error(result.message);
		}
	} catch (error) {
		showToast({ message: `Error restoring item: ${error.message}`, type: 'error' });
		console.error('Restore item error:', error);
		fetchAndRenderBoard();
	}
}

/**
 * Sets up the main event listeners for the tasks view.
 */
function initEventListeners() {
	document.addEventListener('click', (e) => { // Modified for Mobile Move Mode
		if (isMoveModeActive && !e.target.closest('.task-actions-menu') && !e.target.closest('.btn-move-here')) {
			const taskCard = document.querySelector(`.task-card[data-task-id="${taskToMoveId}"]`);
			if (taskCard && !taskCard.contains(e.target)) {
				exitMoveMode();
				return;
			}
		}
		if (e.target.closest('#classification-popover') === null && e.target.closest('.task-status-band') === null) {
			closeClassificationPopover();
		}
		if (e.target.closest('.task-actions-menu') === null && e.target.closest('.btn-task-actions') === null) {
			closeAllTaskActionMenus();
		}
		if (e.target.closest('#filter-menu') === null && e.target.closest('#btn-filters') === null) {
			closeFilterMenu();
		}
		if (e.target && e.target.id === 'btn-add-column') {
			showAddColumnForm();
		}
	});

	document.addEventListener('noteSaved', handleNoteSaved);

	const btnFilters = document.getElementById('btn-filters');
	if (btnFilters) {
		btnFilters.addEventListener('click', showFilterMenu);
	}

	const boardContainer = document.getElementById('task-board-container');
	if (boardContainer) {
		// Add expandable footer functionality
		boardContainer.addEventListener('click', (e) => {
			const footer = e.target.closest('.column-footer');
			if (footer && !footer.classList.contains('expanded') && !isMoveModeActive) {
				// Check if footer has move buttons (move task mode)
				if (footer.querySelector('.btn-move-here') || footer.querySelector('.btn-cancel-move')) {
					return; // Don't expand during move mode
				}
				
				// Collapse any other expanded footers
				document.querySelectorAll('.column-footer.expanded').forEach(expandedFooter => {
					expandedFooter.classList.remove('expanded');
				});
				
				// Expand clicked footer
				footer.classList.add('expanded');
				const input = footer.querySelector('.new-task-input');
				if (input) {
					setTimeout(() => input.focus(), 100); // Small delay for animation
				}
			}
		});
		
		// Handle ESC key to collapse expanded footer
		boardContainer.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				document.querySelectorAll('.column-footer.expanded').forEach(footer => {
					footer.classList.remove('expanded');
				});
			}
		});
		
		// Handle clicks outside expanded footer to collapse it
		boardContainer.addEventListener('click', (e) => {
			if (!e.target.closest('.column-footer')) {
				document.querySelectorAll('.column-footer.expanded').forEach(footer => {
					footer.classList.remove('expanded');
				});
			}
		});
		
		boardContainer.addEventListener('keypress', async (e) => {
			if (e.key === 'Enter' && e.target.matches('.new-task-input')) {
				e.preventDefault();
				if (isActionRunning) return;
				isActionRunning = true;
				try {
					const input = e.target;
					const taskTitle = input.value.trim();
					const columnEl = input.closest('.task-column');
					const columnId = columnEl.dataset.columnId;
	
					if (taskTitle && columnId) {
						await createNewTask(columnId, taskTitle, columnEl);
						input.value = '';
						// Collapse the footer after creating task
						const footer = input.closest('.column-footer');
						if (footer) {
							footer.classList.remove('expanded');
						}
					}
				} finally {
					isActionRunning = false;
				}
			}
		});

		boardContainer.addEventListener('change', async (e) => {
			if (e.target.matches('.task-checkbox')) {
				// Prevent double firing
				if (e.target.dataset.processing) return;
				
				const checkbox = e.target;
				const taskCard = checkbox.closest('.task-card');
				
				// Modified for Sharing Foundation - Prevent recipients from changing completion status
				const accessType = taskCard.dataset.accessType || 'owner';
				if (accessType !== 'owner') {
					// Revert checkbox state and show message
					checkbox.checked = !checkbox.checked;
					showToast({ message: 'Only task owners can mark tasks as complete.', type: 'error' });
					return;
				}
				
				e.target.dataset.processing = 'true';
				const taskId = taskCard.dataset.taskId;
		
				if (taskId) {
					await toggleTaskComplete(taskId, checkbox.checked);
				}
				
				// Remove processing flag
				setTimeout(() => delete e.target.dataset.processing, 100);
			}
		});

		boardContainer.addEventListener('click', async (e) => {
		const shortcut = e.target.closest('.indicator-shortcut');
		if (shortcut) {
			const taskCard = shortcut.closest('.task-card');
			const action = shortcut.dataset.action;
			if (action === 'open-notes') {
				openNotesEditorForTask(taskCard);
			} else if (action === 'open-due-date') {
				await openDueDateModalForTask(taskCard);
			} else if (action === 'open-attachments') {
				const taskId = taskCard.dataset.taskId;
				const taskTitle = decodeURIComponent(taskCard.dataset.title);
				await openAttachmentsModal(taskId, taskTitle);
			} else if (action === 'edit-snooze') {
				await openSnoozeModalForTask(taskCard);
			}
			return;
		}
		
			// Modified for Ready for Review - Add handler for status indicator
			const statusIndicator = e.target.closest('.task-status-indicator[data-action="toggle-ready"]');
			if (statusIndicator) {
				const taskCard = statusIndicator.closest('.task-card');
				const taskId = taskCard?.dataset.taskId;
				
				
				if (taskId && taskCard) {
					await toggleReadyForReview(taskId, taskCard);
				}
				return;
		}
			
			if (e.target.matches('.task-status-band')) {
				const taskCard = e.target.closest('.task-card');
				showClassificationPopover(taskCard);
				return;
			}
			
			// Handle share badge specifically (for the task-share-badge class)
			const shareBadge = e.target.closest('.task-share-badge');
			if (shareBadge) {
				const taskCard = shareBadge.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
				if (taskId) {
					await openShareModal(parseInt(taskId, 10));
				}
				return;
			}
			
			const privacyBtn = e.target.closest('.btn-toggle-column-privacy');
			if (privacyBtn) {
				if (isActionRunning) return;
				isActionRunning = true;
				try {
					const columnEl = privacyBtn.closest('.task-column');
					const columnId = columnEl.dataset.columnId;
					if (columnId) {
						// Check if column is being made private and has shared tasks
						const isCurrentlyPrivate = columnEl.dataset.isPrivate === 'true';
						console.log('Column privacy toggle:', { columnId, isCurrentlyPrivate, action: isCurrentlyPrivate ? 'make public' : 'make private' });
						
						if (!isCurrentlyPrivate) {
							// Check for shared tasks before making private
							console.log('Checking for shared tasks before making private...');
							try {
								// Add timeout to prevent hanging
								const timeoutPromise = new Promise((_, reject) => 
									setTimeout(() => reject(new Error('Timeout checking shared tasks')), 5000)
								);
								
								const hasSharedTasks = await Promise.race([
									checkColumnForSharedTasks(parseInt(columnId, 10)),
									timeoutPromise
								]);
								
								console.log('Shared tasks check completed:', hasSharedTasks);
								if (hasSharedTasks && hasSharedTasks.hasShared) {
									const proceed = await showSharedTaskConfirmation(hasSharedTasks);
									if (!proceed) {
										isActionRunning = false;
										return;
									}
								}
							} catch (error) {
								console.error('Error in shared tasks check:', error);
								// Continue with privacy toggle even if shared task check fails
							}
						}
						
						await togglePrivacy('column', columnId);
					}
				} catch (error) {
					console.error('Column privacy toggle error:', error);
					const errorMessage = error.message || 'An unexpected error occurred while updating column privacy.';
					showToast({ message: errorMessage, type: 'error' });
				} finally {
					isActionRunning = false;
				}
				return;
			}

			const deleteBtn = e.target.closest('.btn-delete-column');
			if (deleteBtn) {
				if (isActionRunning) return;
				isActionRunning = true;
				try {
					const columnEl = deleteBtn.closest('.task-column');
					const columnId = columnEl.dataset.columnId;
			
					const success = await deleteColumn(columnId);
					if (success) {
						columnEl.style.display = 'none';
						updateMoveButtonVisibility();
						
						// Modified for Subscription Quota Enforcement - Update quota tracking after delete
						updateQuotaStatusAfterOperation('column', false);
					
						const removalTimeout = setTimeout(() => {
							columnEl.remove();
							updateMoveButtonVisibility();
						}, 7000);
					
						showToast({
							message: 'Column deleted.',
							type: 'success',
							duration: 7000,
							action: {
								text: 'Undo',
								callback: () => {
									clearTimeout(removalTimeout);
									restoreItem('column', columnId);
									// Restore quota count on undo
									updateQuotaStatusAfterOperation('column', true);
								}
							}
						});
					} else {
						showToast({ message: 'Error: Could not delete the column.', type: 'error' });
					}
				} finally {
					isActionRunning = false;
				}
				return;
			}
			
			const moveBtn = e.target.closest('.btn-move-column');
			if (moveBtn) {
				const direction = moveBtn.dataset.direction;
				const columnEl = moveBtn.closest('.task-column');
				const container = columnEl.parentElement;

				if (direction === 'left') {
					const prevEl = columnEl.previousElementSibling;
					if (prevEl) {
						container.insertBefore(columnEl, prevEl);
					}
				} else if (direction === 'right') {
					const nextEl = columnEl.nextElementSibling;
					if (nextEl) {
						container.insertBefore(nextEl, columnEl);
					}
				}

				updateMoveButtonVisibility();

				const orderedColumnIds = Array.from(container.children).map(col => col.dataset.columnId);
				const success = await reorderColumns(orderedColumnIds);
				if (!success) {
					showToast({ message: 'Error: Could not save new column order.', type: 'error' });
					fetchAndRenderBoard();
				}
				return;
			}
			
			const actionsBtn = e.target.closest('.btn-task-actions');
			if (actionsBtn) {
				showTaskActionsMenu(actionsBtn);
				return;
			}

			// Modified for Mobile Move Mode
			if (e.target.matches('.btn-move-here')) {
				if (isActionRunning || !isMoveModeActive) return;
				isActionRunning = true;
				try {
					const columnEl = e.target.closest('.task-column');
					const toColumnId = columnEl.dataset.columnId;
					await moveTask(taskToMoveId, toColumnId);
				} finally {
					exitMoveMode();
					isActionRunning = false;
				}
				return;
			}
		});
		
		document.body.addEventListener('click', async (e) => {
			// Guard: if click happens inside Share modal, ignore (prevents dataset null crash)
			if (e.target.closest('#share-modal-overlay')) return;
			const actionButton = e.target.closest('.task-action-btn');
			if (!actionButton || isActionRunning) return;

			isActionRunning = true;
			try {
				e.stopPropagation();
		
				const menu = actionButton.closest('.task-actions-menu');
				if (!menu) return;

				const taskId = menu.dataset.taskId;
				const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
				const columnEl = taskCard.closest('.task-column');
				const action = actionButton.dataset.action;
		
				closeAllTaskActionMenus();
		
				if (action === 'edit-notes') {
					openNotesEditorForTask(taskCard);
				} else if (action === 'set-due-date') {
					await openDueDateModalForTask(taskCard);
				} else if (action === 'toggle-privacy') {
					if (taskId) {
						await togglePrivacy('task', taskId);
					}
				} else if (action === 'move-task') {
					if (taskCard) { // Modified for Mobile Move Mode Bug Fix
						enterMoveMode(taskCard); // Modified for Mobile Move Mode Bug Fix
					}
				} else if (action === 'attachments') {
					const taskTitle = decodeURIComponent(taskCard.dataset.title);
					await openAttachmentsModal(taskId, taskTitle);
				} else if (action === 'share') {
					if (taskId) {
						// close the menu to avoid stray clicks under the modal
						closeAllTaskActionMenus && closeAllTaskActionMenus();
						await openShareModal(parseInt(taskId, 10));
					}
				} else if (action === 'show-share-upgrade') {
					showToast({
						message: `Sharing is not available with your ${window.quotaStatus?.subscription_level || 'FREE'} subscription. Upgrade to BASE or higher to share tasks.`,
						type: 'info',
						duration: 4000
					});
				} else if (action === 'delete') {
					const success = await deleteTask(taskId);
					if (success) {
						taskCard.style.display = 'none';
						updateColumnTaskCount(columnEl);
						
						// Modified for Subscription Quota Enforcement - Update quota tracking after delete
						updateQuotaStatusAfterOperation('task', false);
						
						// Update mission focus chart if visible
						if (typeof window.updateMissionFocusChart === 'function') {
							window.updateMissionFocusChart();
						}
					
						const removalTimeout = setTimeout(() => {
							taskCard.remove();
						}, 7000);
					
						showToast({
							message: 'Task deleted.',
							type: 'success',
							duration: 7000,
							action: {
								text: 'Undo',
								callback: () => {
									clearTimeout(removalTimeout);
									restoreItem('task', taskId);
									// Restore quota count on undo
									updateQuotaStatusAfterOperation('task', true);
								}
							}
						});
					} else {
						showToast({ message: 'Error: Could not delete task.', type: 'error' });
					}
				} else if (action === 'duplicate') {
					if (taskId) {
						const newTaskData = await duplicateTask(taskId);
						if (newTaskData) {
							const columnBody = columnEl.querySelector('.column-body');
							const newTaskCardHTML = createTaskCard(newTaskData);
							columnBody.insertAdjacentHTML('beforeend', newTaskCardHTML);
							updateColumnTaskCount(columnEl);
							sortTasksInColumn(columnBody);
							showToast({ message: 'Task duplicated successfully.', type: 'success' });
						} else {
							showToast({ message: 'Error: Could not duplicate the task.', type: 'error' });
						}
					}
				} else if (action === 'unsnooze') {
					await unsnoozeTask(taskCard.dataset.taskId, taskCard);
					
				} else if (action === 'snooze') {
					await openSnoozeModalForTask(taskCard);
				}
			} finally {
				isActionRunning = false;
			}
		});

		boardContainer.addEventListener('dblclick', (e) => {
		if (e.target.matches('.column-title')) {
			const titleEl = e.target;
			const columnEl = titleEl.closest('.task-column');
			const columnId = columnEl.dataset.columnId;
			
			// Modified for Sharing Foundation - Prevent editing virtual "Shared with Me" column
			if (columnId === 'shared-with-me') {
				return;
			}
			
			const originalTitle = titleEl.textContent;
			const input = document.createElement('input');
			input.type = 'text';
			input.value = originalTitle;
			input.className = 'inline-edit-input';
			titleEl.replaceWith(input);
			input.focus();
			input.select();
			let finalized = false;
			const commitChange = async () => {
				if (finalized) return;
				finalized = true;
				
				const newTitle = input.value.trim();
				if (newTitle === '' || newTitle === originalTitle) {
					input.replaceWith(titleEl);
					return;
				}
				titleEl.textContent = newTitle;
				input.replaceWith(titleEl);
				const success = await renameColumn(columnId, newTitle);
				if (success) {
					showToast({ message: 'Column renamed.', type: 'success' });
				} else {
					titleEl.textContent = originalTitle;
					showToast({ message: 'Error: Could not rename column.', type: 'error' });
				}
			};
			input.addEventListener('blur', commitChange);
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					commitChange();
				} else if (e.key === 'Escape') {
					finalized = true;
					input.replaceWith(titleEl);
				}
			});
		}
		else if (e.target.matches('.task-title.editable')) {
			const titleEl = e.target;
			const taskCard = titleEl.closest('.task-card');
			
			// Modified for Sharing Foundation - Prevent recipients from renaming tasks
			const accessType = taskCard.dataset.accessType || 'owner';
			if (accessType !== 'owner') {
				showToast({ message: 'Only task owners can rename tasks.', type: 'error' });
				return;
			}
			
			const taskId = taskCard.dataset.taskId;
			const originalTitle = titleEl.textContent;
		
			const input = document.createElement('input');
			input.type = 'text';
			input.value = originalTitle;
			input.className = 'inline-edit-input';
		
			titleEl.replaceWith(input);
			input.focus();
			input.select();
		
			let finalized = false;
		
			const commitChange = async () => {
				if (finalized) return;
				finalized = true;
				
				const newTitle = input.value.trim();
		
				if (newTitle === '' || newTitle === originalTitle) {
					input.replaceWith(titleEl);
					return;
				}
		
				titleEl.textContent = newTitle;
				input.replaceWith(titleEl);
		
				const success = await renameTaskTitle(taskId, newTitle);
		
				if (success) {
					showToast({ message: 'Task renamed.', type: 'success' });
				} else {
					titleEl.textContent = originalTitle;
					showToast({ message: 'Error: Could not rename task.', type: 'error' });
				}
			};
		
			input.addEventListener('blur', commitChange);
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					commitChange();
				} else if (e.key === 'Escape') {
					finalized = true;
					input.replaceWith(titleEl);
				}
			});
		}
		});

		// Modified for Column Drag & Drop - Task drag handlers
		boardContainer.addEventListener('dragstart', (e) => {
			const taskCard = e.target.closest('.task-card');
			if (taskCard) {
				// Modified for Sharing Foundation - Prevent recipients from dragging tasks
				const accessType = taskCard.dataset.accessType || 'owner';
				if (accessType !== 'owner') {
					e.preventDefault();
					return;
				}
				
				taskCard.classList.add('dragging');
				dragSourceColumn = taskCard.closest('.task-column');
				return;
			}
		
			// Modified for Column Drag & Drop - Column drag handlers
			const columnHeader = e.target.closest('.column-header');
			if (columnHeader && e.target.matches('.column-title')) {
				const columnEl = columnHeader.closest('.task-column');
				columnEl.classList.add('dragging-column');
				e.dataTransfer.effectAllowed = 'move';
			}
		});

		// Modified for Column Drag & Drop - Enhanced dragend handler
		boardContainer.addEventListener('dragend', async (e) => {
			if (e.target.matches('.task-card')) {
				e.target.classList.remove('dragging');
				const destinationColumn = e.target.closest('.task-column');

				if (destinationColumn) {
					sortTasksInColumn(destinationColumn.querySelector('.column-body'));

					const columnId = destinationColumn.dataset.columnId;
					const tasks = Array.from(destinationColumn.querySelectorAll('.task-card'));
					const taskIds = tasks.map(card => card.dataset.taskId);
					
					const success = await reorderTasks(columnId, taskIds);
					
					if (success) {
						updateColumnTaskCount(destinationColumn);
						if (dragSourceColumn && dragSourceColumn !== destinationColumn) {
							updateColumnTaskCount(dragSourceColumn);
						}
					} else {
						fetchAndRenderBoard();
					}
				}
				dragSourceColumn = null;
			}
			// Modified for Column Drag & Drop - Column dragend handler
			else if (e.target.matches('.column-title')) {
				const columnEl = e.target.closest('.task-column');
				columnEl.classList.remove('dragging-column');
				
				// Save the new column order
				const container = columnEl.parentElement;
				const orderedColumnIds = Array.from(container.children).map(col => col.dataset.columnId);
				const success = await reorderColumns(orderedColumnIds);
				if (!success) {
					showToast({ message: 'Error: Could not save new column order.', type: 'error' });
					fetchAndRenderBoard();
				} else {
					updateMoveButtonVisibility();
				}
			}
		});

		// Modified for Column Drag & Drop - Enhanced dragover handler
		boardContainer.addEventListener('dragover', (e) => {
			const columnBody = e.target.closest('.column-body');
			if (columnBody) {
				e.preventDefault();
				const draggingCard = document.querySelector('.dragging');
				if (!draggingCard) return;
				const afterElement = getDragAfterElement(columnBody, e.clientY);
				if (afterElement == null) {
					columnBody.appendChild(draggingCard);
				} else {
					columnBody.insertBefore(draggingCard, afterElement);
				}
				return;
			}

			// Modified for Column Drag & Drop - Column dragover handler
			const columnEl = e.target.closest('.task-column');
			if (columnEl && !e.target.closest('.column-body')) {
				e.preventDefault();
				const draggingColumn = document.querySelector('.dragging-column');
				if (draggingColumn && draggingColumn !== columnEl) {
					const container = columnEl.parentElement;
					const afterElement = getColumnAfterElement(container, e.clientX);
					if (afterElement == null) {
						container.appendChild(draggingColumn);
					} else {
						container.insertBefore(draggingColumn, afterElement);
					}
					updateMoveButtonVisibility();
				}
			}
		});
	}
}



/**
 * Toggles the ready-for-review status for a shared task recipient.
 * Modified for Ready for Review - Fixed UI state update after toggle
 */
async function toggleReadyForReview(taskId, taskCard) {
	 if (window.MyDayHub_Config?.DEV_MODE) {
		 console.log('=== toggleReadyForReview called ===');
		 console.log('Function params - taskId:', taskId, 'taskCard:', !!taskCard);
		 console.log('isActionRunning check:', isActionRunning);
	 }
	 
	 if (isActionRunning) {
		 if (window.MyDayHub_Config?.DEV_MODE) {
			 console.log('Action blocked - isActionRunning is true');
		 }
		 return;
	 }
	 isActionRunning = true;
 
	 try {
		 const currentReady = taskCard.dataset.readyForReview === 'true';
		 const newReady = !currentReady;
		 
		 if (window.MyDayHub_Config?.DEV_MODE) {
			 console.log('Current ready state:', currentReady);
			 console.log('New ready state will be:', newReady);
			 console.log('About to call API...');
		 }
 
		 const result = await window.apiFetch({
			 module: 'tasks',
			 action: 'toggleReadyForReview',
			 task_id: taskId,
			 ready_for_review: newReady
		 });
 
		 if (window.MyDayHub_Config?.DEV_MODE) {
			 console.log('API result:', result);
		 }
 
		 if (result.status === 'success') {
			 // Update task card dataset with new ready status
			 taskCard.dataset.readyForReview = newReady;
			 
			 // Update the task data object used by getTaskDataFromElement
			 const taskData = getTaskDataFromElement(taskCard);
			 taskData.ready_for_review = newReady;
			 
			 // Create new task card HTML with updated data
			 const tempDiv = document.createElement('div');
			 tempDiv.innerHTML = createTaskCard(taskData);
			 const newCardEl = tempDiv.firstElementChild;
			 
			 // Replace the old card with the new one
			 taskCard.replaceWith(newCardEl);
			 
			 const message = newReady ? 'Marked as ready for review' : 'Unmarked as ready for review';
			 showToast({ message: message, type: 'success' });
		 } else {
			 showToast({ message: result.message || 'Failed to update status', type: 'error' });
		 }
	 } catch (error) {
		 showToast({ message: error.message, type: 'error' });
		 console.error('Toggle ready for review error:', error);
	 } finally {
		 isActionRunning = false;
	 }
 }



/**
 * Closes the filter menu if it's open.
 */
function closeFilterMenu() {
	const menu = document.getElementById('filter-menu');
	if (menu) {
		menu.remove();
	}
}

/**
 * Saves a filter preference to the backend.
 */
async function saveFilterPreference(key, value) {
	try {
		await window.apiFetch({
			module: 'users',
			action: 'saveUserPreference',
			key: key,
			value: value
		});
	} catch (error) {
		console.error('Error saving filter preference:', error);
	}
}

/**
 * Updates the filter menu UI to reflect the current filter state.
 */
function updateFilterMenuUI() {
	const filterMenu = document.querySelector('.filter-menu');
	if (!filterMenu) return;
	
	// Update the checkboxes to reflect the current filter state
	const showCompletedToggle = filterMenu.querySelector('input[data-filter="showCompleted"]');
	const showPrivateToggle = filterMenu.querySelector('input[data-filter="showPrivate"]');
	const showSnoozedToggle = filterMenu.querySelector('input[data-filter="showSnoozed"]');
	
	if (showCompletedToggle) {
		showCompletedToggle.checked = filterState.showCompleted;
	}
	if (showPrivateToggle) {
		showPrivateToggle.checked = filterState.showPrivate;
	}
	if (showSnoozedToggle) {
		showSnoozedToggle.checked = filterState.showSnoozed;
	}
}

/**
 * Creates and displays the filter menu.
 */
function showFilterMenu() {
	closeFilterMenu(); 
	const btnFilters = document.getElementById('btn-filters');
	if (!btnFilters) return;

	const menu = document.createElement('div');
	menu.id = 'filter-menu';
	
	const showCompletedChecked = filterState.showCompleted ? 'checked' : '';
	const showPrivateChecked = filterState.showPrivate ? 'checked' : '';
	const showSnoozedChecked = filterState.showSnoozed ? 'checked' : '';

	menu.innerHTML = `
	<div class="filter-item">
		<span class="filter-label">Show Completed Tasks</span>
		<label class="switch">
			<input type="checkbox" data-filter="showCompleted" ${showCompletedChecked}>
			<span class="slider round"></span>
		</label>
	</div>
	<div class="filter-item">
		<span class="filter-label">Show Private Items</span>
		<label class="switch">
			<input type="checkbox" data-filter="showPrivate" ${showPrivateChecked}>
			<span class="slider round"></span>
		</label>
	</div>
	<div class="filter-item">
		<span class="filter-label">Show Snoozed Tasks</span>
		<label class="switch">
			<input type="checkbox" data-filter="showSnoozed" ${showSnoozedChecked}>
			<span class="slider round"></span>
		</label>
	</div>
	`;

	document.body.appendChild(menu);

	const btnRect = btnFilters.getBoundingClientRect();
	menu.style.bottom = `${window.innerHeight - btnRect.top + 10}px`;
	menu.style.left = `${btnRect.left + (btnRect.width / 2) - (menu.offsetWidth / 2)}px`;

	setTimeout(() => menu.classList.add('visible'), 10);

	menu.addEventListener('change', (e) => {
		if (e.target.matches('input[type="checkbox"]')) {
			const filter = e.target.dataset.filter;
			const value = e.target.checked;
			filterState[filter] = value;
			applyAllFilters();
			
			const keyMap = {
				showCompleted: 'filter_show_completed',
				showPrivate: 'filter_show_private',
				showSnoozed: 'filter_show_snoozed'
			};
			saveFilterPreference(keyMap[filter], value);
		}
	});
}

/**
 * Applies all active filters to the task cards on the board.
 */
function applyAllFilters() {
	const allItems = document.querySelectorAll('.task-card, .task-column');

	allItems.forEach(item => {
		const isCompleted = item.classList.contains('completed');
		const isPrivate = item.classList.contains('private');
		const isSnoozed = item.classList.contains('snoozed');
		
		let shouldBeVisible = true;

		if (isCompleted && !filterState.showCompleted) {
			shouldBeVisible = false;
		}
		if (isPrivate && !filterState.showPrivate) {
			shouldBeVisible = false;
		}
		if (isSnoozed && !filterState.showSnoozed) {
			shouldBeVisible = false;
		}
		
		item.style.display = shouldBeVisible ? 'flex' : 'none';
	});

	const allColumns = document.querySelectorAll('.task-column');
	allColumns.forEach(column => {
		updateColumnTaskCount(column);
	});
}


/**
 * Saves the due date via API.
 */
async function saveTaskDueDate(taskId, newDate) {
	try {
		await window.apiFetch({
			module: 'tasks',
			action: 'saveTaskDetails',
			task_id: taskId,
			dueDate: newDate
		});
		showToast({ message: 'Due date updated.', type: 'success' });
		return true;
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Save due date error:', error);
		return false;
	}
}

/**
 * Gets the element to drop a dragged element after.
 */
function getDragAfterElement(container, y) {
	const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

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
 * Modified for Column Drag & Drop - Gets the column element to drop a dragged column after.
 */
function getColumnAfterElement(container, x) {
	const draggableColumns = [...container.querySelectorAll('.task-column:not(.dragging-column)')];

	return draggableColumns.reduce((closest, child) => {
		const box = child.getBoundingClientRect();
		const offset = x - box.left - box.width / 2;
		if (offset < 0 && offset > closest.offset) {
			return { offset: offset, element: child };
		} else {
			return closest;
		}
	}, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Gets the numerical rank of a task card based on its classification.
 */
const getTaskRank = (taskEl) => {
	const classification = taskEl.dataset.classification;
	if (classification === 'completed') return 3;
	if (classification === 'signal') return 0;
	if (classification === 'support') return 1;
	if (classification === 'backlog') return 2;
	return 1; // Default to 'support' rank
};

/**
 * Sorts the tasks within a column's body based on their classification rank.
 */
function sortTasksInColumn(columnBodyEl) {
	if (!columnBodyEl) return;
	const tasks = Array.from(columnBodyEl.querySelectorAll('.task-card'));
	
	tasks.sort((a, b) => {
		const rankA = getTaskRank(a);
		const rankB = getTaskRank(b);
		return rankA - rankB;
	}).forEach(task => columnBodyEl.appendChild(task));
}


/**
 * Closes any open task action menus.
 */
function closeAllTaskActionMenus() {
	document.querySelectorAll('.task-actions-menu').forEach(menu => menu.remove());
}

/**
 * Creates and displays the task actions menu.
 */
/**
  * Creates and displays the task actions menu.
  * Modified for Sharing Foundation - Permission-based action restrictions
  */
 function showTaskActionsMenu(buttonEl) {
	 closeAllTaskActionMenus(); 
	 const taskCard = buttonEl.closest('.task-card');
	 if (!taskCard) {
		 return;
	 }
 
	 const menu = document.createElement('div');
	 menu.className = 'task-actions-menu';
	 menu.dataset.taskId = taskCard.dataset.taskId;
 
	 // Modified for Sharing Foundation - Permission-based action restrictions
	 const accessType = taskCard.dataset.accessType || 'owner';
	 const isRecipient = accessType === 'view' || accessType === 'edit';
	 const isViewOnly = accessType === 'view';
	 const isOwner = accessType === 'owner';
 
	const isPrivate = taskCard.dataset.isPrivate === 'true';
	const isSnoozed = taskCard.dataset.isSnoozed === 'true';
	
	// Debug: Log the privacy state for context menu
	if (window.MyDayHub_Config?.DEV_MODE) {
		console.log('Context menu privacy debug:', {
			taskId: taskCard.dataset.taskId,
			datasetIsPrivate: taskCard.dataset.isPrivate,
			isPrivate: isPrivate,
			privacyText: isPrivate ? 'Make Public' : 'Make Private'
		});
	}
	
	const privacyText = isPrivate ? 'Make Public' : 'Make Private';
	 const privacyIcon = isPrivate
		 ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
		 : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
 
	 // Build menu buttons based on permissions
	 let menuHTML = '';
 
	 // Edit Notes - Available to all users (view and edit recipients can add notes)
	 menuHTML += `
		 <button class="task-action-btn" data-action="edit-notes">
			 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
			 <span>${isViewOnly ? 'View Notes' : 'Edit Notes'}</span>
		 </button>
	 `;
 
	 // Set Due Date - Only for edit permission and owners
	 if (!isViewOnly) {
		 menuHTML += `
			 <button class="task-action-btn" data-action="set-due-date">
				 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					 <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
					 <line x1="16" y1="2" x2="16" y2="6"></line>
					 <line x1="8" y1="2" x2="8" y2="6"></line>
					 <line x1="3" y1="10" x2="21" y2="10"></line>
				 </svg>
				 <span>Set Due Date</span>
			 </button>
		 `;
	 }
 
	 // Privacy Toggle - Owner only (shared tasks cannot be made private)
	 if (isOwner) {
		 menuHTML += `
			 <button class="task-action-btn" data-action="toggle-privacy">
				 ${privacyIcon}
				 <span>${privacyText}</span>
			 </button>
		 `;
	 }
 
	 // Move Task - Owner only (recipients cannot move tasks between columns)
	 if (isOwner) {
		 menuHTML += `
			 <button class="task-action-btn" data-action="move-task">
				 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					 <polyline points="15 6 21 12 15 18"></polyline><polyline points="9 18 3 12 9 6"></polyline>
				 </svg>
				 <span>Move Task</span>
			 </button>
		 `;
	 }
 
	 // Attachments - Available to all users
	 menuHTML += `
		 <button class="task-action-btn" data-action="attachments">
			 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
			 <span>Attachments</span>
		 </button>
	 `;
 
	 // Duplicate - Owner only
	 if (isOwner) {
		 menuHTML += `
			 <button class="task-action-btn" data-action="duplicate">
				 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					 <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
					 <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
				 </svg>
				 <span>Duplicate Task</span>
			 </button>
		 `;
	 }
 
	// Share - Owner only and subscription allows sharing
	 if (isOwner && window.quotaStatus && window.quotaStatus.sharing_enabled) {
		 menuHTML += `
			 <button class="task-action-btn" data-action="share">
				 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
					  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					 <circle cx="18" cy="5" r="3"></circle>
					 <circle cx="6" cy="12" r="3"></circle>
					 <circle cx="18" cy="19" r="3"></circle>
					 <path d="M8.8 10.9l6.4-3.8M8.8 13.1l6.4 3.8"></path>
				 </svg>
				 <span>Share</span>
			 </button>
		 `;
	 } else if (isOwner && window.quotaStatus && !window.quotaStatus.sharing_enabled) {
		 // Show upgrade message instead of share button for FREE users
		 menuHTML += `
			 <button class="task-action-btn quota-restricted" data-action="show-share-upgrade" disabled>
				 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
					  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					 <circle cx="18" cy="5" r="3"></circle>
					 <circle cx="6" cy="12" r="3"></circle>
					 <circle cx="18" cy="19" r="3"></circle>
					 <path d="M8.8 10.9l6.4-3.8M8.8 13.1l6.4 3.8"></path>
				 </svg>
				 <span>Share (Upgrade Required)</span>
			 </button>
		 `;
	 }
 
	 // Snooze - Owner only
	 if (isOwner) {
		 menuHTML += `
			 <button class="task-action-btn" data-action="${isSnoozed ? 'unsnooze' : 'snooze'}">
			 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				 ${isSnoozed ? '<path d="M6 2l3 3.5L12 2l3 3.5L18 2"/><path d="M6 16.5l3-3.5 3 3.5 3-3.5 3 3.5"/><polyline points="6 12 12 6 18 12"/>' : '<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M5 3L3 5"></path><path d="M19 3l2 2"></path>'}
				 </svg>
					 <span>${isSnoozed ? 'Remove Snooze' : 'Snooze Task'}</span>
				 </button>
		 `;
	 }
 
	 // Delete - Owner only
	 if (isOwner) {
		 menuHTML += `
			 <button class="task-action-btn" data-action="delete">
				 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					 <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
					 <line x1="10" y1="11" x2="10" y2="17"/>
					 <line x1="14" y1="11" x2="14" y2="17"/>
				 </svg>
				 <span>Delete Task</span>
			 </button>
		 `;
	 }
 
	 menu.innerHTML = menuHTML;
 
	 document.body.appendChild(menu);
 
	 const btnRect = buttonEl.getBoundingClientRect();
	 menu.style.top = `${window.scrollY + btnRect.bottom + 5}px`;
	 menu.style.left = `${window.scrollX + btnRect.right - menu.offsetWidth}px`;
 
	 setTimeout(() => menu.classList.add('visible'), 10);
 }


/**
 * Updates the visual task count in a column's header.
 */
function updateColumnTaskCount(columnEl) {
	if (!columnEl) return;
	const countSpan = columnEl.querySelector('.task-count');
	// Count all tasks except completed ones, regardless of filter visibility
	const taskCount = columnEl.querySelectorAll('.task-card:not(.completed)').length;
	if (countSpan) {
		countSpan.textContent = taskCount;
	}
}


/**
 * Hides/shows move buttons based on column position (first/last).
 */
function updateMoveButtonVisibility() {
	const columns = document.querySelectorAll('.task-column:not([style*="display: none"])');
	columns.forEach((col, index) => {
		const btnLeft = col.querySelector('.btn-move-column[data-direction="left"]');
		const btnRight = col.querySelector('.btn-move-column[data-direction="right"]');
		if (btnLeft) {
			btnLeft.style.visibility = (index === 0) ? 'hidden' : 'visible';
		}
		if (btnRight) {
			btnRight.style.visibility = (index === columns.length - 1) ? 'hidden' : 'visible';
		}
	});
}

/**
 * Sends a request to duplicate a task.
 */
async function duplicateTask(taskId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'duplicateTask',
			task_id: taskId
		});
		if (result.status === 'success') {
			return result.data;
		}
		return null;
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Duplicate task error:', error);
		return null;
	}
}


/**
 * Sends a request to delete a task.
 */
async function deleteTask(taskId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'deleteTask',
			task_id: taskId
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Delete task error:', error);
		return false;
	}
}

/**
 * Sends a request to save the new order of all columns.
 */
async function reorderColumns(orderedColumnIds) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'reorderColumns',
			column_ids: orderedColumnIds
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Reorder columns error:', error);
		return false;
	}
}

/**
 * Sends a request to delete a column.
 */
async function deleteColumn(columnId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'deleteColumn',
			column_id: columnId
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Delete column error:', error);
		return false;
	}
}

/**
 * Sends a request to rename a column.
 */
async function renameColumn(columnId, newName) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'renameColumn',
			column_id: columnId,
			new_name: newName
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Rename column error:', error);
		return false;
	}
}

/**
 * Sends a request to rename a task's title.
 */
async function renameTaskTitle(taskId, newTitle) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'renameTaskTitle',
			task_id: taskId,
			new_title: newTitle
		});
		return result.status === 'success';
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Rename task title error:', error);
		return false;
	}
}

/**
 * Sends a request to move a task to a different column.
 */
async function moveTask(taskId, toColumnId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'moveTask',
			task_id: taskId,
			to_column_id: toColumnId
		});
		if (result.status === 'success') {
			showToast({ message: 'Task moved.', type: 'success' });
			fetchAndRenderBoard(); // Refresh the board to show the change
			return true;
		}
		return false;
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		return false;
	}
}


/**
 * Sends the new order of tasks to the API.
 */
async function reorderTasks(columnId, tasks) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'reorderTasks',
			column_id: columnId,
			tasks: tasks
		});
		if (result.status !== 'success') {
			showToast({ message: `Error: ${result.message}`, type: 'error' });
			return false;
		}
		return true;
	} catch (error) {
		showToast({ message: 'A network error occurred. Please try again.', type: 'error' });
		console.error('Reorder tasks error:', error);
		return false;
	}
}

/**
 * Check if we're making an item private (vs making it public)
 */
async function checkIfMakingPrivate(type, id) {
	const selector = type === 'task' ? `.task-card[data-task-id="${id}"]` : `.task-column[data-column-id="${id}"]`;
	const element = document.querySelector(selector);
	if (!element) return false;
	
	const isCurrentlyPrivate = element.dataset.isPrivate === 'true';
	return !isCurrentlyPrivate; // Making private if currently public
}

/**
 * Check if encryption setup is needed
 */
async function checkEncryptionSetupNeeded() {
	try {
		const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
		const appURL = window.MyDayHub_Config?.appURL || '';
		
		const response = await fetch(`${appURL}/api/api.php?module=encryption&action=getEncryptionStatus`, {
			method: 'GET',
			headers: {
				'X-CSRF-TOKEN': csrfToken,
			}
		});
		
		const responseData = await response.json();
		return !responseData.data?.encryption_enabled;
	} catch (error) {
		console.error('Failed to check encryption status:', error);
		return false; // Don't block if we can't check
	}
}

/**
 * Show encryption setup prompt to user
 */
async function showEncryptionSetupPrompt(type) {
	const message = `To make ${type}s private, you'll need to set up encryption first. This ensures your private data is secure with zero-knowledge encryption.

Would you like to set up encryption now?`;
	
	const confirmed = await window.showConfirm(message, {
		title: 'Encryption Setup Required',
		confirmText: 'Set Up Encryption',
		cancelText: 'Not Now'
	});
	
	return confirmed;
}

/**
 * Toggles the privacy status of a task or column.
 */
async function togglePrivacy(type, id) {
	try {
		// Check if encryption setup is needed when making something private
		const isMakingPrivate = await checkIfMakingPrivate(type, id);
		if (isMakingPrivate) {
			const needsEncryption = await checkEncryptionSetupNeeded();
			if (needsEncryption) {
				const shouldSetup = await showEncryptionSetupPrompt(type);
				if (!shouldSetup) {
					return; // User chose not to set up encryption
				}
				// Trigger encryption setup
				if (window.encryptionSetupWizard) {
					await window.encryptionSetupWizard.triggerSetup();
					// After setup, continue with the privacy toggle
				}
			}
		}

		const result = await window.apiFetch({
			module: 'tasks',
			action: 'togglePrivacy',
			type: type,
			id: id
		});
		if (result.status === 'success') {
			const { is_private } = result.data;
			const selector = type === 'task' ? `.task-card[data-task-id="${id}"]` : `.task-column[data-column-id="${id}"]`;
			const element = document.querySelector(selector);
			
			if (element) {
				element.classList.toggle('private', is_private);
				element.dataset.isPrivate = is_private;

				const privacyBtnText = is_private ? 'Make Public' : 'Make Private';
				showToast({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} set to ${is_private ? 'private' : 'public'}.`, type: 'success' });

				if (type === 'column') {
					const btn = element.querySelector('.btn-toggle-column-privacy');
					if (btn) {
						btn.title = privacyBtnText;
						
						// Update the icon based on new privacy state
						const newIcon = is_private
							? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
							: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
						
						btn.innerHTML = newIcon;
					}
					
					// Reload entire board to get updated task privacy states
					setTimeout(() => {
						fetchAndRenderBoard();
					}, 100);
				}
				
				applyAllFilters();
			}
		} else {
			throw new Error(result.message || `Failed to toggle privacy for ${type}.`);
		}
	} catch (error) {
		console.error('Toggle privacy error:', error);
		const errorMessage = error.message || 'An unexpected error occurred while updating privacy status.';
		showToast({ message: errorMessage, type: 'error' });
	}
}


/**
 * Toggles a task's completion status.
 */
// Modified for Bug Fix - Completion persistence and animation
async function toggleTaskComplete(taskId, isComplete) {
	const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'toggleComplete',
			task_id: taskId
		});

		if (result.status === 'success') {
			// Update the task data first
			taskCard.classList.toggle('completed', isComplete);
			taskCard.dataset.classification = result.data.new_classification;

			taskCard.classList.remove('classification-signal', 'classification-support', 'classification-backlog');
			if (!isComplete) {
				taskCard.classList.add(`classification-${result.data.new_classification}`);
			}
			
			// Re-render the card to update its content
			rerenderTaskCard(taskCard);
			
			// Update column task count
			const columnEl = taskCard.closest('.task-column');
			if (columnEl) {
				updateColumnTaskCount(columnEl);
			}
			
			// Update mission focus chart if visible
			if (typeof window.updateMissionFocusChart === 'function') {
				window.updateMissionFocusChart();
			}
			
			// Apply the flash animation to the new card
			if (isComplete) {
				const updatedCard = document.querySelector(`[data-task-id="${taskId}"]`);
				updatedCard.classList.add('flash-animation');
				
				// Play subtle completion sound (if enabled)
				if (typeof window.playCompletionSound === 'function' && 
					typeof window.isCompletionSoundEnabled === 'function' && 
					window.isCompletionSoundEnabled()) {
					window.playCompletionSound();
				}
				
				// Sort immediately for completion (after DOM updates)
				setTimeout(() => {
					// Try to find the column body - the taskCard might have been re-rendered
					let columnBody = taskCard.closest('.column-body');
					if (!columnBody) {
						// If not found, try to find it by task ID in case the card was re-rendered
						const updatedTaskCard = document.querySelector(`[data-task-id="${taskId}"]`);
						if (updatedTaskCard) {
							columnBody = updatedTaskCard.closest('.column-body');
						}
					}
					if (columnBody) {
						sortTasksInColumn(columnBody);
					}
				}, 10);
				
				setTimeout(() => {
					updatedCard.classList.remove('flash-animation');
					// IMPORTANT: Apply filters AFTER animation completes
					applyAllFilters();
				}, 500);
			} else {
				// If unchecking, apply filters immediately and reorder
				applyAllFilters();
				// Small delay to ensure DOM is updated before sorting
				setTimeout(() => {
					// Try to find the column body - the taskCard might have been re-rendered
					let columnBody = taskCard.closest('.column-body');
					if (!columnBody) {
						// If not found, try to find it by task ID in case the card was re-rendered
						const updatedTaskCard = document.querySelector(`[data-task-id="${taskId}"]`);
						if (updatedTaskCard) {
							columnBody = updatedTaskCard.closest('.column-body');
						}
					}
					if (columnBody) {
						sortTasksInColumn(columnBody);
					}
				}, 10);
			}
		} else {
			throw new Error(result.message);
		}
	} catch (error) {
		showToast({ message: `Error: ${error.message}`, type: 'error' });
		const checkbox = taskCard.querySelector('.task-checkbox');
		if (checkbox) checkbox.checked = !isComplete;
		console.error('Toggle complete error:', error);
	}
}

/**
 * Sets a task's classification by calling the API and updating the UI.
 * @param {string} taskId - The ID of the task to update.
 * @param {string} newClassification - The new classification ('signal', 'support', 'backlog').
 */
async function setTaskClassification(taskId, newClassification) {
	const taskCardEl = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'toggleClassification',
			task_id: taskId,
			classification: newClassification
		});

		if (result.status === 'success') {
			const returnedClassification = result.data.new_classification;
			taskCardEl.dataset.classification = returnedClassification;
			taskCardEl.classList.remove('classification-signal', 'classification-support', 'classification-backlog', 'classification-noise');
			taskCardEl.classList.add(`classification-${returnedClassification}`);
			sortTasksInColumn(taskCardEl.closest('.column-body'));
			
			// Update mission focus chart if visible
			if (typeof window.updateMissionFocusChart === 'function') {
				window.updateMissionFocusChart();
			}
		} else {
			showToast({ message: `Error: ${result.message}`, type: 'error' });
		}
	} catch (error) {
		showToast({ message: `A network error occurred: ${error.message}`, type: 'error' });
		console.error('Set classification error:', error);
	}
}

/**
 * Closes the classification popover if it exists.
 */
function closeClassificationPopover() {
	const popover = document.getElementById('classification-popover');
	if (popover) {
		popover.remove();
	}
}

/**
 * Shows a popover menu to change a task's classification.
 * Modified for Sharing Foundation - Prevent recipients from changing classification
 * @param {HTMLElement} taskCard - The task card element that was clicked.
 */
function showClassificationPopover(taskCard) {
	closeClassificationPopover();

	const taskId = taskCard.dataset.taskId;
	if (!taskId || taskCard.classList.contains('completed')) {
		return;
	}

	// Modified for Sharing Foundation - Only owners can change classification
	const accessType = taskCard.dataset.accessType || 'owner';
	if (accessType !== 'owner') {
		return;
	}

	const popover = document.createElement('div');
	popover.id = 'classification-popover';
	// Modified for Classification Regression Fix - Added missing Signal and Support options
	popover.innerHTML = `
		<button class="classification-option" data-value="signal">
			<span class="swatch classification-signal"></span> Signal
		</button>
		<button class="classification-option" data-value="support">
			<span class="swatch classification-support"></span> Support
		</button>
		<button class="classification-option" data-value="backlog">
			<span class="swatch classification-backlog"></span> Backlog
		</button>
	`;

	document.body.appendChild(popover);

	const band = taskCard.querySelector('.task-status-band');
	const rect = band.getBoundingClientRect();
	popover.style.top = `${window.scrollY + rect.top}px`;
	popover.style.left = `${window.scrollX + rect.right + 5}px`;

	popover.addEventListener('click', (e) => {
		const button = e.target.closest('.classification-option');
		if (button) {
			const newClassification = button.dataset.value;
			setTaskClassification(taskId, newClassification);
			closeClassificationPopover();
		}
	});
}


/**
 * Displays an input form to add a new column in place of the button.
 * Modified for Column Duplication Fix - Simplified column insertion and refresh logic
 */
function showAddColumnForm() {
	 const container = document.getElementById('add-column-container');
	 if (!container || container.querySelector('#form-add-column')) {
		 return;
	 }
	 const originalButton = container.innerHTML;
	 container.innerHTML = `
		 <form id="form-add-column">
			 <input type="text" id="input-new-column-name" placeholder="Column Name..." required autofocus />
		 </form>
	 `;
	 const form = document.getElementById('form-add-column');
	 const input = document.getElementById('input-new-column-name');
	 const revertToButton = () => {
		 if (container.contains(form)) {
			  container.innerHTML = originalButton;
		 }
	 };
	 
	 input.addEventListener('blur', revertToButton);
	 form.addEventListener('submit', async (e) => {
		 e.preventDefault();
		 input.removeEventListener('blur', revertToButton);
		 const columnName = input.value.trim();
		 if (columnName) {
			 try {
				 const result = await window.apiFetch({
					 module: 'tasks',
					 action: 'createColumn',
					 column_name: columnName
				 });
				 if (result.status === 'success') {
					 // Modified for Column Duplication Fix - Remove manual DOM insertion
					 // and let fetchAndRenderBoard handle proper positioning
					 
					 // Update quota before refresh
					 updateQuotaStatusAfterOperation('column', true);
					 
					 showToast({ message: 'Column created.', type: 'success' });
					 
					 // Refresh the entire board to ensure proper column ordering
					 // and prevent duplication issues with virtual column positioning
					 fetchAndRenderBoard();
				 } else {
					 showToast({ message: `Error: ${result.message}`, type: 'error' });
				 }
			 } catch (error) {
				 showToast({ message: `A network error occurred: ${error.message}`, type: 'error' });
				 console.error('Create column error:', error);
			 }
		 }
		 container.innerHTML = originalButton;
		 // Modified for Column Quota Auto-Update Fix - Call updateQuotaAwareUI after button restoration
		 updateQuotaAwareUI();
	 });
 }

/**
 * Sends a new task to the API and renders the response.
 */
async function createNewTask(columnId, taskTitle, columnEl) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'createTask',
			column_id: columnId,
			task_title: taskTitle
		});

		if (result.status === 'success') {
			const columnBody = columnEl.querySelector('.column-body');
			const placeholder = columnBody.querySelector('.no-tasks-message');
			if (placeholder) {
				placeholder.remove();
			}
			const newTaskCardHTML = createTaskCard(result.data);
			columnBody.insertAdjacentHTML('beforeend', newTaskCardHTML);
			sortTasksInColumn(columnBody);
			updateColumnTaskCount(columnEl);
			
			// Modified for Subscription Quota Enforcement - Update quota tracking
			updateQuotaStatusAfterOperation('task', true);
			
			// Update mission focus chart if visible
			if (typeof window.updateMissionFocusChart === 'function') {
				window.updateMissionFocusChart();
			}
			
			showToast({ message: 'Task created.', type: 'success' });
		} else {
			showToast({ message: `Error: ${result.message}`, type: 'error' });
		}
	} catch (error) {
		showToast({ message: `A network error occurred: ${error.message}`, type: 'error' });
		console.error('Create task error:', error);
	}
}


// Modified for High Contrast Mode
/**
 * Fetches the complete board data from the API and initiates rendering.
 */
async function fetchAndRenderBoard() {
	const container = document.getElementById('task-board-container');
	if (!container) {
		console.error('Task board container not found!');
		return;
	}

	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const apiURL = `${appURL}/api/api.php?module=tasks&action=getAll`;

		const response = await fetch(apiURL);

		if (!response.ok) {
			if (response.status === 401) {
				window.location.href = `${appURL}/login/login.php`;
				return;
			}
			throw new Error(`API responded with status: ${response.status}`);
		}

		const result = await response.json();

		if (result.status === 'success') {
			const boardData = result.data.board;
			const userPrefs = result.data.user_prefs;
			
			if (result.data.user_storage) {
				userStorage = result.data.user_storage;
			}
			
			// Modified for Subscription Quota Enforcement - Store quota status for proactive UI
			if (result.data.quota_status) {
				window.quotaStatus = result.data.quota_status;
				updateQuotaAwareUI();
			}

			// Apply user preferences on load
			if (userPrefs) {
			if (userPrefs.editor_font_size) {
				container.dataset.editorFontSize = userPrefs.editor_font_size;
			}
			if (typeof userPrefs.filter_show_completed !== 'undefined') {
				filterState.showCompleted = userPrefs.filter_show_completed;
			}
			if (typeof userPrefs.filter_show_private !== 'undefined') {
				filterState.showPrivate = userPrefs.filter_show_private;
			}
			if (typeof userPrefs.filter_show_snoozed !== 'undefined') {
				filterState.showSnoozed = userPrefs.filter_show_snoozed;
			}
			
			// Load completion sound preference
			if (typeof userPrefs.completion_sound_enabled !== 'undefined') {
				localStorage.setItem('completion_sound_enabled', userPrefs.completion_sound_enabled.toString());
				// Update the sound selector in settings panel
				if (typeof window.updateSoundSelectorUI === 'function') {
					window.updateSoundSelectorUI(userPrefs.completion_sound_enabled);
				}
			}
			
			// Load font size preference
			if (typeof userPrefs.global_font_size !== 'undefined') {
				localStorage.setItem('global_font_size', userPrefs.global_font_size.toString());
				// Apply font size immediately
				if (typeof window.applyFontSize === 'function') {
					window.applyFontSize(userPrefs.global_font_size);
				}
				// Update the font size selector in settings panel
				if (typeof window.updateFontSizeUI === 'function') {
					window.updateFontSizeUI(userPrefs.global_font_size);
				}
			}
			
			// Update filter menu to reflect loaded preferences
			updateFilterMenuUI();
			
			// Modified for Session Timeout - Load user's timeout preference
			if (userPrefs.session_timeout) {
				// Update session timeout setting and button text
				updateSessionTimeoutSetting(userPrefs.session_timeout);
			}
				// Handle theme preferences - sync with backend data
				if (typeof window.syncThemeWithBackend === 'function') {
					window.syncThemeWithBackend(userPrefs.light_mode, userPrefs.high_contrast_mode);
				}
				
				// Handle header date visibility preference
				if (typeof window.loadHeaderDatePreference === 'function') {
					window.loadHeaderDatePreference(userPrefs);
				}
			}

			renderBoard(boardData);
		} else {
			throw new Error(result.message || 'Failed to fetch board data.');
		}

	} catch (error) {
		console.error('Error fetching board data:', error);
		container.innerHTML = `<p style="color: #d94f46;">Could not load board. ${error.message}</p>`;
	}
}

/**
 * Renders the entire board from the data provided by the API.
 */
function renderBoard(boardData) {
	const container = document.getElementById('task-board-container');
	container.innerHTML = ''; 

	if (boardData.length === 0) {
		const placeholder = document.createElement('p');
		placeholder.textContent = 'No columns found. Create your first column to get started!';
		container.appendChild(placeholder);
		return;
	}

	boardData.forEach(columnData => {
		const columnEl = createColumnElement(columnData);
		container.appendChild(columnEl);
		const columnBody = columnEl.querySelector('.column-body');
		sortTasksInColumn(columnBody);
	});

	updateMoveButtonVisibility();
	applyAllFilters();
}


/**
 * Checks if a column has shared tasks and returns details about them.
 */
async function checkColumnForSharedTasks(columnId) {
	try {
		const result = await apiFetch({
			module: 'tasks',
			action: 'getSharedTasksInColumn',
			column_id: columnId
		});
		console.log('API response received:', result);
		
		if (result.status === 'success' && result.data) {
			const sharedTasks = result.data;
			const result_data = {
				hasShared: sharedTasks.length > 0,
				tasks: sharedTasks,
				completedCount: sharedTasks.filter(t => t.classification === 'completed').length,
				activeCount: sharedTasks.filter(t => t.classification !== 'completed').length
			};
			return result_data;
		}
		return { hasShared: false, tasks: [], completedCount: 0, activeCount: 0 };
	} catch (error) {
		console.error('Error checking shared tasks:', error);
		return { hasShared: false, tasks: [], completedCount: 0, activeCount: 0 };
	}
}

/**
 * Shows a confirmation dialog for handling shared tasks when making column private.
 */
async function showSharedTaskConfirmation(sharedTaskInfo) {
	const { completedCount, activeCount } = sharedTaskInfo;
	
	let message = '';
	let canProceed = false;
	
	if (activeCount > 0 && completedCount > 0) {
		// Has both active and completed shared tasks
		message = `This column contains ${activeCount} active shared task${activeCount > 1 ? 's' : ''} and ${completedCount} completed shared task${completedCount > 1 ? 's' : ''}. Making the column private will automatically unshare all shared tasks in this column. Do you want to proceed?`;
		canProceed = true;
	} else if (activeCount > 0) {
		// Has only active shared tasks - can auto-unshare
		message = `This column contains ${activeCount} active shared task${activeCount > 1 ? 's' : ''}. Making the column private will automatically unshare these tasks. Do you want to proceed?`;
		canProceed = true;
	} else if (completedCount > 0) {
		// Only completed shared tasks - can auto-unshare
		message = `This column contains ${completedCount} completed shared task${completedCount > 1 ? 's' : ''}. Making the column private will automatically unshare these completed tasks. Do you want to proceed?`;
		canProceed = true;
	}
	
	if (!canProceed) {
		// Show error message
		showToast({ message, type: 'error' });
		return false;
	}
	
	// Show custom confirmation dialog
	const confirmed = await showConfirm(message);
	return confirmed;
}

/**
 * Creates the HTML element for a single column and its tasks.
 * Modified for Sharing Foundation - Hide task input for virtual "Shared with Me" column
 */
function createColumnElement(columnData) {
	const columnEl = document.createElement('div');
	const isPrivate = columnData.is_private;
	const isVirtualColumn = columnData.column_id === 'shared-with-me';
	
	columnEl.className = `task-column ${isPrivate ? 'private' : ''} ${isVirtualColumn ? 'virtual-column' : ''}`;
	columnEl.dataset.columnId = columnData.column_id;
	columnEl.dataset.isPrivate = isPrivate;

	let tasksHTML = '';
	if (columnData.tasks && columnData.tasks.length > 0) {
		tasksHTML = columnData.tasks.map(taskData => createTaskCard(taskData)).join('');
	} else {
		tasksHTML = isVirtualColumn 
			? '<p class="no-tasks-message">No shared tasks yet.</p>'
			: '<p class="no-tasks-message">No tasks in this column.</p>';
	}
	
	const privacyBtnTitle = isPrivate ? 'Make Public' : 'Make Private';
	const privacyIcon = isPrivate 
		? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
		: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

	// Modified for Sharing Foundation - Hide header controls for virtual column
	const headerControlsHTML = isVirtualColumn ? '' : `
		<div class="column-header-controls">
			<button class="btn-move-column" data-direction="left" title="Move Left">&lt;</button>
			<button class="btn-toggle-column-privacy" title="${privacyBtnTitle}">${privacyIcon}</button>
			<button class="btn-delete-column" title="Delete Column">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
					<line x1="10" y1="11" x2="10" y2="17"/>
					<line x1="14" y1="11" x2="14" y2="17"/>
				</svg>
			</button>
			<button class="btn-move-column" data-direction="right" title="Move Right">&gt;</button>
		</div>
	`;

	// Modified for Sharing Foundation - Hide task input for virtual column
	const footerHTML = isVirtualColumn ? '' : `
		<div class="column-footer" data-column-id="${columnData.column_id}">
			<input type="text" class="new-task-input" placeholder="+ New Task" />
		</div>
	`;

	columnEl.innerHTML = `
		<div class="column-header">
			${headerControlsHTML}
			<h2 class="column-title ${isVirtualColumn ? 'readonly' : ''}" ${isVirtualColumn ? '' : 'draggable="true"'}>${columnData.column_name}${window.MyDayHub_Config?.DEV_MODE ? ` [${columnData.column_id}]` : ''}</h2>
			<span class="task-count">${columnData.tasks ? columnData.tasks.filter(task => task.classification !== 'completed').length : 0}</span>
		</div>
		<div class="column-body">
			${tasksHTML}
		</div>
		${footerHTML}
	`;
	return columnEl;
}

/**
 * Creates the HTML string for a single task card.
 * Modified for Sharing Foundation - Added access_type data attribute and conditional UI elements
 */
function createTaskCard(taskData) {

	let taskTitle = 'Encrypted Task';
	let taskNotes = '';
	
	try {
		const data = JSON.parse(taskData.encrypted_data);
		
		// Check if this is encrypted data (has encrypted envelope structure)
		if (data.encrypted && data.item_type === 'task') {
			// This is encrypted data - show placeholder until decrypted
			taskTitle = 'Encrypted Task';
			taskNotes = '';
			
			// Schedule async decryption and re-render
			setTimeout(async () => {
				try {
					const decryptedData = await decryptTaskDataFrontend(data);
					if (decryptedData) {
						const taskCard = document.querySelector(`[data-task-id="${taskData.task_id}"]`);
						if (taskCard) {
							const titleElement = taskCard.querySelector('.task-title');
							if (titleElement) {
								titleElement.textContent = decryptedData.title || 'Untitled Task';
								if (window.MyDayHub_Config?.DEV_MODE) {
									titleElement.textContent += ` (${taskData.task_id})`;
								}
							}
						}
					}
				} catch (decryptError) {
					console.error('Frontend decryption failed for task', taskData.task_id, ':', decryptError);
				}
			}, 0);
		} else if (data.title !== undefined) {
			// This is plain JSON data
			taskTitle = data.title;
			taskNotes = data.notes || '';
		} else {
			// Fallback for unexpected data structure
			taskTitle = 'Invalid Task Data';
			taskNotes = '';
		}
	} catch (e) {
		console.error("Could not parse task data for task", taskData.task_id, ":", taskData.encrypted_data);
		taskTitle = 'Parse Error';
		taskNotes = '';
	}

	// Add task_id in parentheses when DEV_MODE is enabled
	if (window.MyDayHub_Config?.DEV_MODE) {
		taskTitle = `${taskTitle} (${taskData.task_id})`;
	}

	const isCompleted = taskData.classification === 'completed';
	const isPrivate = taskData.is_private;
	const isSnoozed = taskData.is_snoozed || taskData.snoozed_until;
	const accessType = taskData.access_type || 'owner';
	const isOwner = accessType === 'owner';
	const isReadyForReview = taskData.ready_for_review || false;
	
	let classificationClass = '';
	if (!isCompleted) {
		const classification = taskData.classification === 'noise' ? 'backlog' : taskData.classification;
		classificationClass = `classification-${classification}`;
		
	}
	
	let footerHTML = '';
	const hasSnoozeIndicator = taskData.is_snoozed || taskData.snoozed_until;
	const hasSharedIndicator = (taskData.shares && taskData.shares.length > 0) || (!isOwner && taskData.shared_by);
	const hasReadyIndicator = isOwner && taskData.shares && 
		taskData.shares.some(share => share.ready_for_review);
	const hasIndicators = taskData.has_notes || taskData.due_date || (taskData.attachments_count && taskData.attachments_count > 0) || hasSnoozeIndicator || hasSharedIndicator || hasReadyIndicator;
	
	if (hasIndicators) {
		let notesIndicator = '';
		if (taskData.has_notes) {
			notesIndicator = `
				<span class="task-indicator indicator-shortcut" data-action="open-notes" title="This task has notes">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
				</span>
			`;
		}

		let dueDateIndicator = '';
		if (taskData.due_date) {
			let isOverdue = false;
			if (!isCompleted) {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const dueDate = new Date(taskData.due_date + 'T00:00:00');
				if (dueDate < today) {
					isOverdue = true;
				}
			}
			dueDateIndicator = `
				<span class="task-indicator indicator-shortcut ${isOverdue ? 'overdue' : ''}" data-action="open-due-date" title="Due: ${taskData.due_date}">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
					<span class="due-date-text">${formatDueDate(taskData.due_date)}</span>
				</span>
			`;
		}
		
		let snoozeIndicator = '';
		if (taskData.snoozed_until && !isCompleted) {
			// Modified for Snooze Feature - Fixed date parsing for UTC timestamps
			const wakeDate = new Date(taskData.snoozed_until);
			const wakeDateFormatted = wakeDate.toLocaleDateString('en-US', { 
				month: 'short', 
				day: 'numeric',
				timeZone: 'UTC' 
			});
			snoozeIndicator = `
			<span class="task-indicator indicator-shortcut snooze-indicator" data-action="edit-snooze" title="Click to edit snooze date">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="13" r="8"></circle>
						<path d="M12 9v4l2 2"></path>
						<path d="M5 3L3 5"></path>
						<path d="M19 3l2 2"></path>
					</svg>
					<span class="snooze-date-text">${wakeDateFormatted}</span>
				</span>
			`;
		}
		
		let attachmentsIndicator = '';
		if (taskData.attachments_count && taskData.attachments_count > 0) {
			attachmentsIndicator = `
				<span class="task-indicator indicator-shortcut" data-action="open-attachments" title="${taskData.attachments_count} attachment(s)">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
					<span class="attachment-count">${taskData.attachments_count}</span>
				</span>
			`;
		}

		let shareIndicator = '';
		if (taskData.shares && taskData.shares.length > 0) {
			// Owner view - show recipients
			const firstShare = taskData.shares[0];
			const recipientDisplay = (firstShare.username || firstShare.email || 'user').substring(0, 6);
			const shareCount = taskData.shares.length;
			const shareTitle = shareCount === 1 
				? `Shared with ${firstShare.username || firstShare.email}`
				: `Shared with ${shareCount} users`;
			
			shareIndicator = `
				<span class="task-indicator task-share-badge" data-action="open-share-modal" title="${shareTitle}">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="18" cy="5" r="3"></circle>
						<circle cx="6" cy="12" r="3"></circle>
						<circle cx="18" cy="19" r="3"></circle>
						<path d="M8.8 10.9l6.4-3.8M8.8 13.1l6.4 3.8"></path>
					</svg>
					<span class="share-recipient-text">${recipientDisplay}</span>
				</span>
			`;
		} else if (!isOwner && taskData.shared_by) {
			// Modified for Owner Badge - Recipient view shows owner identification
			const ownerDisplay = taskData.shared_by.substring(0, 6);
			shareIndicator = `
				<span class="task-indicator task-owner-badge" title="Shared by ${taskData.shared_by}">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
					<span class="share-owner-text">${ownerDisplay}</span>
				</span>
			`;
		}

		// Modified for Ready for Review - Owner notification badge
		let readyIndicator = '';
		if (hasReadyIndicator) {
			readyIndicator = `
				<span class="task-indicator ready-for-review-badge" title="Ready for review">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 11l3 3L22 4"></path>
						<path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
					</svg>
					<span class="ready-text">Review</span>
				</span>
			`;
		}

		footerHTML = `
			<div class="task-card-footer">
				${attachmentsIndicator}
				${snoozeIndicator}
				${notesIndicator}
				${dueDateIndicator}
				${shareIndicator}
				${readyIndicator}
			</div>
		`;
	}

	const isShared = taskData.shares && taskData.shares.length > 0;
	
	// Modified for Sharing Foundation - Conditional draggable attribute
	const draggableAttr = isOwner ? 'draggable="true"' : '';
	
	// Modified for Ready for Review - Status indicator logic
	let statusElement = '';
	if (isOwner) {
		statusElement = `<input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>`;
	} else {
		// Recipients get interactive status indicator
		const statusTitle = isCompleted 
			? 'Completed' 
			: isReadyForReview 
				? 'Click to unmark as ready' 
				: 'Click to mark ready for review';
		
		const statusIcon = isCompleted 
			? '<polyline points="20 6 9 17 4 12"></polyline>' 
			: isReadyForReview
				? '<circle cx="12" cy="12" r="10" fill="currentColor"></circle><circle cx="12" cy="12" r="3" fill="white"></circle>'
				: '<circle cx="12" cy="12" r="10"></circle>';

		statusElement = `<span class="task-status-indicator ${isCompleted ? 'completed' : ''} ${isReadyForReview ? 'ready' : ''}" 
			data-action="toggle-ready" title="${statusTitle}">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				${statusIcon}
			</svg>
		</span>`;
	}
	
	return `
	<div 
		class="task-card ${isCompleted ? 'completed' : ''} ${classificationClass} ${isPrivate ? 'private' : ''} ${isSnoozed ? 'snoozed' : ''} ${isShared ? 'shared' : ''} ${!isOwner ? 'recipient' : ''} ${isReadyForReview ? 'ready-for-review' : ''}"
		data-task-id="${taskData.task_id}" 
			data-title="${encodeURIComponent(taskTitle)}"
			data-notes="${encodeURIComponent(taskNotes)}"
			data-classification="${taskData.classification}"
			data-is-private="${isPrivate ? 'true' : 'false'}"
			data-has-notes="${taskData.has_notes}"
			data-updated-at="${taskData.updated_at || ''}"
			data-due-date="${taskData.due_date || ''}"
			data-attachments-count="${taskData.attachments_count || 0}"
			data-snoozed-until="${taskData.snoozed_until || ''}"
			data-snoozed-at="${taskData.snoozed_at || ''}"
			data-is-snoozed="${taskData.is_snoozed ? 'true' : 'false'}"
			data-shares='${JSON.stringify(taskData.shares || [])}'
			data-access-type="${accessType}"
			data-ready-for-review="${!!(taskData.ready_for_review)}"
			data-shared-by="${taskData.shared_by || ''}"
			${draggableAttr}>
			<div class="task-card-main">
				<div class="task-status-band ${!isOwner ? 'readonly' : ''}"></div>
				${statusElement}
				<span class="task-title ${isOwner ? 'editable' : 'readonly'}">${taskTitle}</span>
				<button class="btn-task-actions" title="Task Actions">&vellip;</button>
			</div>
			${footerHTML}
		</div>
	`;
}

// --- Attachment Functions ---

/**
 * Deletes a single attachment by its ID.
 */
async function deleteAttachment(attachmentId) {
	try {
		const result = await window.apiFetch({
			module: 'tasks',
			action: 'deleteAttachment',
			attachment_id: attachmentId
		});

		if (result.status === 'success') {
			showToast({ message: 'Attachment deleted.', type: 'success' });
			const response = await fetch(`${window.MyDayHub_Config.appURL}/api/api.php?module=tasks&action=getAll`);
			const boardResult = await response.json();
			if (boardResult.status === 'success' && boardResult.data.user_storage) {
				userStorage = boardResult.data.user_storage;
			}
			return true;
		} else {
			throw new Error(result.message || 'Failed to delete attachment.');
		}
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Delete attachment error:', error);
		return null;
	}
}


/**
 * Fetches the list of attachments for a given task from the API.
 */
async function getAttachments(taskId) {
	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const response = await fetch(`${appURL}/api/api.php?module=tasks&action=getAttachments&task_id=${taskId}`);
		const result = await response.json();
		if (result.status === 'success') {
			return result.data;
		}
		throw new Error(result.message || 'Failed to fetch attachments.');
	} catch (error) {
		showToast({ message: error.message, type: 'error' });
		console.error('Get attachments error:', error);
		return null;
	}
}

/**
 * Uploads a single file attachment for a task.
 */
async function uploadAttachment(taskId, file) {
	const formData = new FormData();
	formData.append('module', 'tasks');
	formData.append('action', 'uploadAttachment');
	formData.append('task_id', taskId);
	formData.append('attachment', file);

	try {
		const appURL = window.MyDayHub_Config?.appURL || '';
		const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
		const response = await fetch(`${appURL}/api/api.php`, {
			method: 'POST',
			headers: {
				'X-CSRF-TOKEN': csrfToken 
			},
			body: formData
		});
		const result = await response.json();
		
		if (result.status === 'success') {
			return result.data;
		} else {
			showToast({ message: `Upload failed for ${file.name}: ${result.message}`, type: 'error' });
			return null;
		}
	} catch (error) {
		showToast({ message: `A network error occurred uploading ${file.name}.`, type: 'error' });
		console.error('Upload attachment error:', error);
		return null;
	}
}

/**
 * Updates the attachment count on the main task card after an upload/delete.
 */
function updateTaskCardAttachmentCount(taskId, newCount) {
	const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
	if (taskCard) {
		taskCard.dataset.attachmentsCount = newCount;
		rerenderTaskCard(taskCard);
	}
}

/**
 * Updates the UI for the storage quota bar and text.
 */
function updateStorageBar(usedBytes, quotaBytes) {
	if (usedBytes === null || typeof usedBytes === 'undefined' || !isFinite(usedBytes)) {
		usedBytes = 0;
	}

	const progressBar = document.getElementById('attachment-quota-bar');
	const quotaText = document.getElementById('attachment-quota-text');
	if (!progressBar || !quotaText) return;

	const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
	const quotaMB = (quotaBytes / 1024 / 1024).toFixed(1);

	progressBar.max = quotaBytes;
	progressBar.value = usedBytes;
	quotaText.textContent = `${usedMB} / ${quotaMB} MB`;
}


/**
 * Opens the attachments modal and populates it with data for a given task.
 */
async function openAttachmentsModal(taskId, taskTitle) {
	if (isModalOpening) return;
	isModalOpening = true;

	try {
		const modalOverlay = document.getElementById('attachments-modal-overlay');
		const modalTitle = document.getElementById('attachments-modal-title');
		const listContainer = document.getElementById('attachment-list');
		const dropZone = document.getElementById('attachment-drop-zone');
		const btnBrowse = document.getElementById('btn-browse-files');
		const fileInput = document.getElementById('attachment-file-input');
		const btnUploadStaged = document.getElementById('btn-upload-staged');
		
		if (!modalOverlay || !btnBrowse || !btnUploadStaged) {
			console.error('Attachments modal components are missing!');
			return;
		}

		let stagedListContainer = document.getElementById('staged-attachment-list');
		if (!stagedListContainer) {
			stagedListContainer = document.createElement('div');
			stagedListContainer.id = 'staged-attachment-list';
			dropZone.insertAdjacentElement('afterend', stagedListContainer);
		}
		
		let stagedFiles = [];
		
		modalOverlay.dataset.currentTaskId = taskId;
		modalTitle.textContent = `Attachments for: ${taskTitle}`;
		listContainer.innerHTML = '<p>Loading...</p>';
		updateStorageBar(userStorage.used, userStorage.quota);
		modalOverlay.classList.remove('hidden');

		const refreshAttachmentList = async () => {
			const attachments = await getAttachments(taskId);
			if (attachments) {
				renderAttachmentList(attachments, listContainer);
				updateTaskCardAttachmentCount(taskId, attachments.length);
			} else {
				listContainer.innerHTML = '<p class="no-attachments-message">Could not load attachments.</p>';
			}
		};
		
		await refreshAttachmentList();
		
		const closeButton = document.getElementById('attachments-modal-close-btn');

		const renderStagedFiles = () => {
			stagedListContainer.innerHTML = '';
			if (stagedFiles.length > 0) {
				const fileCount = stagedFiles.length;
				btnUploadStaged.textContent = `Upload ${fileCount} File${fileCount > 1 ? 's' : ''}`;
				stagedFiles.forEach((file, index) => {
					const fileSizeKB = (file.size / 1024).toFixed(1);
					const itemEl = document.createElement('div');
					itemEl.className = 'staged-attachment-item';
					itemEl.innerHTML = `
						<span class="filename">${file.name}</span>
						<span class="filesize">${fileSizeKB} KB</span>
						<button class="btn-remove-staged" data-index="${index}" title="Remove">&times;</button>
					`;
					stagedListContainer.appendChild(itemEl);
				});
				btnUploadStaged.style.display = 'inline-block';
			} else {
				btnUploadStaged.style.display = 'none';
			}
		};
		
		stagedListContainer.addEventListener('click', (e) => {
			if (e.target.matches('.btn-remove-staged')) {
				const indexToRemove = parseInt(e.target.dataset.index, 10);
				stagedFiles.splice(indexToRemove, 1);
				renderStagedFiles();
			}
		});

		const handleFiles = (files) => {
			stagedFiles.push(...Array.from(files));
			renderStagedFiles();
		};

		const handleUploadStaged = async () => {
			if (stagedFiles.length === 0) return;

			btnUploadStaged.disabled = true;
			btnUploadStaged.textContent = 'Uploading...';

			for (const file of stagedFiles) {
				const result = await uploadAttachment(taskId, file);
				if (result) {
					userStorage.used = result.user_storage_used;
					updateStorageBar(userStorage.used, userStorage.quota);
				}
			}

			stagedFiles = [];
			renderStagedFiles();
			await refreshAttachmentList();

			btnUploadStaged.disabled = false;
			showToast({ message: 'Uploads complete.', type: 'success' });
		};

		const handleDeleteAttachmentClick = async (e) => {
			const deleteBtn = e.target.closest('.btn-delete-attachment');
			if (deleteBtn) {
				e.preventDefault();
				e.stopPropagation();
				const attachmentId = deleteBtn.dataset.attachmentId;
				const confirmed = await showConfirm('Are you sure you want to permanently delete this attachment?');
				if (confirmed) {
					const success = await deleteAttachment(attachmentId);
					if (success) {
						await refreshAttachmentList();
					}
				}
			}
		};

		const handleBrowseClick = () => fileInput.click();
		const handleFileChange = (e) => handleFiles(e.target.files);
		const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
		const handleDragEnter = () => dropZone.classList.add('drag-over');
		const handleDragLeave = () => dropZone.classList.remove('drag-over');
		const handleDrop = (e) => {
			dropZone.classList.remove('drag-over');
			handleFiles(e.dataTransfer.files);
		};

		const handlePaste = (e) => {
			const filesToUpload = Array.from(e.clipboardData.items)
				.filter(item => item.type.startsWith('image/'))
				.map(item => item.getAsFile());

			if (filesToUpload.length > 0) {
				e.preventDefault();
				handleFiles(filesToUpload);
			}
		};

		const closeModalHandler = () => {
			btnBrowse.removeEventListener('click', handleBrowseClick);
			fileInput.removeEventListener('change', handleFileChange);
			btnUploadStaged.removeEventListener('click', handleUploadStaged);
			listContainer.removeEventListener('click', handleDeleteAttachmentClick);
			['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
				dropZone.removeEventListener(eventName, preventDefaults);
				document.body.removeEventListener(eventName, preventDefaults);
			});
			dropZone.removeEventListener('dragenter', handleDragEnter);
			dropZone.removeEventListener('dragleave', handleDragLeave);
			dropZone.removeEventListener('drop', handleDrop);
			document.removeEventListener('paste', handlePaste);
			modalOverlay.removeEventListener('click', clickOutsideHandler);
			closeButton.removeEventListener('click', closeModalHandler);
			// Unregister from modal stack
			window.unregisterModal('attachments-modal');
			closeAttachmentsModal();
		};

		// Register attachments modal in modal stack
		window.registerModal('attachments-modal', closeModalHandler);
		
		const clickOutsideHandler = (e) => {
			if (e.target === modalOverlay) closeModalHandler();
		};
		
		btnBrowse.addEventListener('click', handleBrowseClick);
		fileInput.addEventListener('change', handleFileChange);
		btnUploadStaged.addEventListener('click', handleUploadStaged);
		listContainer.addEventListener('click', handleDeleteAttachmentClick);
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
			dropZone.addEventListener(eventName, preventDefaults, false);
			document.body.addEventListener(eventName, preventDefaults, false);
		});
		dropZone.addEventListener('dragenter', handleDragEnter, false);
		dropZone.addEventListener('dragleave', handleDragLeave, false);
		dropZone.addEventListener('drop', handleDrop, false);
		document.addEventListener('paste', handlePaste, false);
		modalOverlay.addEventListener('click', clickOutsideHandler);
		closeButton.addEventListener('click', closeModalHandler);
	} finally {
		isModalOpening = false;
	}
}


/**
 * Closes the attachments modal and cleans up.
 */
function closeAttachmentsModal() {
	const modalOverlay = document.getElementById('attachments-modal-overlay');
	if (modalOverlay) {
		modalOverlay.classList.add('hidden');
		modalOverlay.removeAttribute('data-current-task-id');
		
		const stagedList = document.getElementById('staged-attachment-list');
		if (stagedList) stagedList.innerHTML = '';

		const btnUpload = document.getElementById('btn-upload-staged');
		if (btnUpload) btnUpload.style.display = 'none';
	}
}

/**
 * Renders the list of attachments inside the modal.
 */
function renderAttachmentList(attachments, container) {
	container.innerHTML = '';
	if (attachments.length === 0) {
		container.innerHTML = '<p class="no-attachments-message">No attachments yet.</p>';
		return;
	}

	const appURL = window.MyDayHub_Config?.appURL || '';

	attachments.forEach(att => {
		const isPdf = att.original_filename.toLowerCase().endsWith('.pdf');
		const fileUrl = `${appURL}/media/imgs/${att.filename_on_server}`;
		
		const itemEl = document.createElement(isPdf ? 'a' : 'div');
		itemEl.className = 'attachment-item';
		
		if (isPdf) {
			itemEl.href = fileUrl;
			itemEl.target = '_blank';
		}

		const fileSizeKB = (att.filesize_bytes / 1024).toFixed(1);
		
		let thumbnailHTML = '';
		if (isPdf) {
			thumbnailHTML = `
				<div class="attachment-thumbnail-icon">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
					</svg>
				</div>
			`;
		} else {
			thumbnailHTML = `<img src="${fileUrl}" class="thumbnail" alt="${att.original_filename}" />`;
		}

		itemEl.innerHTML = `
			${thumbnailHTML}
			<div class="attachment-file-info">
				<span class="filename">${att.original_filename}</span>
				<span class="filesize">${fileSizeKB} KB</span>
			</div>
			<button class="btn-delete-attachment" title="Delete Attachment" data-attachment-id="${att.attachment_id}">&times;</button>
		`;

		if (!isPdf) {
			itemEl.addEventListener('click', (e) => {
				if (e.target.closest('.btn-delete-attachment')) {
					return;
				}
				openAttachmentViewer(fileUrl, att.original_filename);
			});
		}
		
		container.appendChild(itemEl);
	});
}


/**
 * Opens the full-screen attachment viewer modal with the specified content.
 */
function openAttachmentViewer(fileUrl, filename) {
	isImageViewerOpen = true; 
	const viewerOverlay = document.getElementById('attachment-viewer-modal-overlay');
	const contentContainer = document.getElementById('attachment-viewer-content');
	const viewerCloseBtn = document.getElementById('attachment-viewer-close-btn');

	if (!viewerOverlay || !contentContainer || !viewerCloseBtn) {
		console.error('Attachment viewer elements not found.');
		isImageViewerOpen = false; 
		return;
	}

	contentContainer.innerHTML = '';

	const img = document.createElement('img');
	img.src = fileUrl;
	img.alt = filename;
	contentContainer.appendChild(img);

	viewerOverlay.classList.remove('hidden');
	
	const handleEscKey = (e) => {
		if (e.key === 'Escape') {
			closeAttachmentViewer();
		}
	};

	const closeHandler = (e) => {
		if (e.target === viewerOverlay || e.target === viewerCloseBtn) {
			closeAttachmentViewer();
		}
	};
	
	viewerOverlay.addEventListener('click', closeHandler, { once: true });
	viewerCloseBtn.addEventListener('click', closeHandler, { once: true });
	document.addEventListener('keydown', handleEscKey, { once: true });
}

/**
 * Closes the attachment viewer modal.
 */
function closeAttachmentViewer() {
	const viewerOverlay = document.getElementById('attachment-viewer-modal-overlay');
	if (viewerOverlay) {
		viewerOverlay.classList.add('hidden');
		const contentContainer = document.getElementById('attachment-viewer-content');
		if (contentContainer) {
			contentContainer.innerHTML = '';
		}
	}
	isImageViewerOpen = false;
}

/**
 * Opens the file management modal showing all user attachments.
 * Modified for File Management Feature - New global attachment management interface
 */
async function openFileManagementModal() {
	if (isModalOpening) return;
	isModalOpening = true;

	try {
		const modalOverlay = document.getElementById('file-management-modal-overlay');
		const listContainer = document.getElementById('file-management-list');
		const sortSelect = document.getElementById('file-management-sort');
		const quotaBar = document.getElementById('file-management-quota-bar');
		const quotaText = document.getElementById('file-management-quota-text');
		
		if (!modalOverlay || !listContainer) {
			console.error('File management modal components are missing!');
			return;
		}

		listContainer.innerHTML = '<p>Loading...</p>';
		modalOverlay.classList.remove('hidden');
		
		// Register file management modal in modal stack
		window.registerModal('file-management-modal', () => {
			window.unregisterModal('file-management-modal');
			closeFileManagementModal();
		});

		const refreshFileList = async (sortBy = 'date', sortOrder = 'desc') => {
			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/api.php?module=tasks&action=getAllUserAttachments&sort_by=${sortBy}&sort_order=${sortOrder}`);
				const result = await response.json();
				
				if (result.status === 'success') {
					renderFileManagementList(result.data.attachments, listContainer);
					updateFileManagementQuota(result.data.storage_used, result.data.storage_quota, quotaBar, quotaText);
					
					// Update total count display
					const countDisplay = document.getElementById('file-management-count');
					if (countDisplay) {
						countDisplay.textContent = `${result.data.total_count} files`;
					}
				} else {
					throw new Error(result.message || 'Failed to load files.');
				}
			} catch (error) {
				listContainer.innerHTML = `<p class="error-message">Could not load files: ${error.message}</p>`;
			}
		};

		await refreshFileList();

		// Set up sort handler
		if (sortSelect) {
			sortSelect.addEventListener('change', async (e) => {
				const [sortBy, sortOrder] = e.target.value.split('_');
				await refreshFileList(sortBy, sortOrder);
			});
		}

		// Set up close handlers
		const closeButton = document.getElementById('file-management-close-btn');
		const closeModalHandler = () => {
			closeFileManagementModal();
		};

		const handleEscKey = (e) => {
			if (e.key === 'Escape' && !isImageViewerOpen) closeModalHandler();
		};
		
		const clickOutsideHandler = (e) => {
			if (e.target === modalOverlay) closeModalHandler();
		};

		// Set up delete handler
		const handleDeleteClick = async (e) => {
			const deleteBtn = e.target.closest('.btn-delete-file-management');
			if (deleteBtn) {
				e.preventDefault();
				e.stopPropagation();
				const attachmentId = deleteBtn.dataset.attachmentId;
				const filename = deleteBtn.dataset.filename;
				const confirmed = await showConfirm(`Are you sure you want to permanently delete "${filename}"?`);
				if (confirmed) {
					const success = await deleteAttachment(attachmentId);
					if (success) {
						// Refresh the list after deletion
						const sortValue = sortSelect ? sortSelect.value : 'date_desc';
						const [sortBy, sortOrder] = sortValue.split('_');
						await refreshFileList(sortBy, sortOrder);
						showToast({ message: 'File deleted successfully.', type: 'success' });
					}
				}
			}
		};
		
		closeButton?.addEventListener('click', closeModalHandler);
		listContainer.addEventListener('click', handleDeleteClick);
		document.addEventListener('keydown', handleEscKey);
		modalOverlay.addEventListener('click', clickOutsideHandler);

		// Cleanup function
		const cleanup = () => {
			closeButton?.removeEventListener('click', closeModalHandler);
			listContainer.removeEventListener('click', handleDeleteClick);
			document.removeEventListener('keydown', handleEscKey);
			modalOverlay.removeEventListener('click', clickOutsideHandler);
		};

		// Store cleanup function for later use
		modalOverlay._cleanup = cleanup;

	} finally {
		isModalOpening = false;
	}
}

/**
 * Closes the file management modal and cleans up event listeners.
 * Modified for File Management Feature - Cleanup function for modal
 */
function closeFileManagementModal() {
	const modalOverlay = document.getElementById('file-management-modal-overlay');
	if (modalOverlay) {
		// Run cleanup if it exists
		if (modalOverlay._cleanup) {
			modalOverlay._cleanup();
			delete modalOverlay._cleanup;
		}
		modalOverlay.classList.add('hidden');
		// Unregister from modal stack
		window.unregisterModal('file-management-modal');
	}
}

/**
 * Renders the list of all user attachments in the file management modal.
 * Modified for File Management Feature - Render function for global file list
 */
function renderFileManagementList(attachments, container) {
	container.innerHTML = '';
	
	if (attachments.length === 0) {
		container.innerHTML = '<p class="no-files-message">No files uploaded yet.</p>';
		return;
	}

	const appURL = window.MyDayHub_Config?.appURL || '';

	attachments.forEach(att => {
		const isPdf = att.original_filename.toLowerCase().endsWith('.pdf');
		const fileUrl = `${appURL}/media/imgs/${att.filename_on_server}`;
		
		const itemEl = document.createElement('div');
		itemEl.className = 'file-management-item';

		const fileSizeKB = (att.filesize_bytes / 1024).toFixed(1);
		const uploadDate = new Date(att.created_at).toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric',
			year: 'numeric'
		});
		
		let thumbnailHTML = '';
		if (isPdf) {
			thumbnailHTML = `
				<div class="file-management-thumbnail-icon">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
					</svg>
				</div>
			`;
		} else {
			thumbnailHTML = `<img src="${fileUrl}" class="file-management-thumbnail" alt="${att.original_filename}" />`;
		}

		itemEl.innerHTML = `
			${thumbnailHTML}
			<div class="file-management-info">
				<div class="file-management-filename">${att.original_filename}</div>
				<div class="file-management-details">
					<span class="file-size">${fileSizeKB} KB</span>
					<span class="upload-date">${uploadDate}</span>
				</div>
				<div class="file-management-task-info">
					<span class="task-name">Task: ${att.task_title}</span>
					<span class="column-name">Column: ${att.column_name || 'Unknown'}</span>
				</div>
			</div>
			<button class="btn-delete-file-management" title="Delete File" 
					data-attachment-id="${att.attachment_id}" 
					data-filename="${att.original_filename}">&times;</button>
		`;

		// Add click handler for viewing (only for images)
		if (!isPdf) {
			itemEl.addEventListener('click', (e) => {
				if (e.target.closest('.btn-delete-file-management')) {
					return; // Don't open viewer if delete button clicked
				}
				openAttachmentViewer(fileUrl, att.original_filename);
			});
			itemEl.style.cursor = 'pointer';
		} else {
			// For PDFs, make the whole item clickable to open in new tab
			itemEl.addEventListener('click', (e) => {
				if (e.target.closest('.btn-delete-file-management')) {
					return;
				}
				window.open(fileUrl, '_blank');
			});
			itemEl.style.cursor = 'pointer';
		}
		
		container.appendChild(itemEl);
	});
}

/**
 * Updates the storage quota display in the file management modal.
 * Modified for File Management Feature - Quota display for global view
 */
function updateFileManagementQuota(usedBytes, quotaBytes, progressBar, quotaText) {
	if (!progressBar || !quotaText) return;
	
	if (usedBytes === null || typeof usedBytes === 'undefined' || !isFinite(usedBytes)) {
		usedBytes = 0;
	}

	const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
	const quotaMB = (quotaBytes / 1024 / 1024).toFixed(1);
	const usedPercent = quotaBytes > 0 ? ((usedBytes / quotaBytes) * 100).toFixed(1) : 0;

	progressBar.max = quotaBytes;
	progressBar.value = usedBytes;
	quotaText.textContent = `${usedMB} / ${quotaMB} MB (${usedPercent}%)`;
}



/**
 * Opens the file management modal showing all user attachments.
 * Modified for File Management Feature - New global attachment management interface
 */
async function openFileManagementModal() {
	if (isModalOpening) return;
	isModalOpening = true;

	try {
		const modalOverlay = document.getElementById('file-management-modal-overlay');
		const listContainer = document.getElementById('file-management-list');
		const sortSelect = document.getElementById('file-management-sort');
		const quotaBar = document.getElementById('file-management-quota-bar');
		const quotaText = document.getElementById('file-management-quota-text');
		
		if (!modalOverlay || !listContainer) {
			console.error('File management modal components are missing!');
			return;
		}

		listContainer.innerHTML = '<p>Loading...</p>';
		modalOverlay.classList.remove('hidden');
		
		// Register file management modal in modal stack
		window.registerModal('file-management-modal', () => {
			window.unregisterModal('file-management-modal');
			closeFileManagementModal();
		});

		const refreshFileList = async (sortBy = 'date', sortOrder = 'desc') => {
			try {
				const appURL = window.MyDayHub_Config?.appURL || '';
				const response = await fetch(`${appURL}/api/api.php?module=tasks&action=getAllUserAttachments&sort_by=${sortBy}&sort_order=${sortOrder}`);
				const result = await response.json();
				
				if (result.status === 'success') {
					renderFileManagementList(result.data.attachments, listContainer);
					updateFileManagementQuota(result.data.storage_used, result.data.storage_quota, quotaBar, quotaText);
					
					// Update total count display
					const countDisplay = document.getElementById('file-management-count');
					if (countDisplay) {
						countDisplay.textContent = `${result.data.total_count} files`;
					}
				} else {
					throw new Error(result.message || 'Failed to load files.');
				}
			} catch (error) {
				listContainer.innerHTML = `<p class="error-message">Could not load files: ${error.message}</p>`;
			}
		};

		await refreshFileList();

		// Set up sort handler
		if (sortSelect) {
			sortSelect.addEventListener('change', async (e) => {
				const [sortBy, sortOrder] = e.target.value.split('_');
				await refreshFileList(sortBy, sortOrder);
			});
		}

		// Set up close handlers
		const closeButton = document.getElementById('file-management-close-btn');
		const closeModalHandler = () => {
			closeFileManagementModal();
		};

		const handleEscKey = (e) => {
			if (e.key === 'Escape' && !isImageViewerOpen) closeModalHandler();
		};
		
		const clickOutsideHandler = (e) => {
			if (e.target === modalOverlay) closeModalHandler();
		};

		// Set up delete handler
		const handleDeleteClick = async (e) => {
			const deleteBtn = e.target.closest('.btn-delete-file-management');
			if (deleteBtn) {
				e.preventDefault();
				e.stopPropagation();
				const attachmentId = deleteBtn.dataset.attachmentId;
				const filename = deleteBtn.dataset.filename;
				const confirmed = await showConfirm(`Are you sure you want to permanently delete "${filename}"?`);
				if (confirmed) {
					const success = await deleteAttachment(attachmentId);
					if (success) {
						// Refresh the list after deletion
						const sortValue = sortSelect ? sortSelect.value : 'date_desc';
						const [sortBy, sortOrder] = sortValue.split('_');
						await refreshFileList(sortBy, sortOrder);
						showToast({ message: 'File deleted successfully.', type: 'success' });
					}
				}
			}
		};
		
		closeButton?.addEventListener('click', closeModalHandler);
		listContainer.addEventListener('click', handleDeleteClick);
		document.addEventListener('keydown', handleEscKey);
		modalOverlay.addEventListener('click', clickOutsideHandler);

		// Cleanup function
		const cleanup = () => {
			closeButton?.removeEventListener('click', closeModalHandler);
			listContainer.removeEventListener('click', handleDeleteClick);
			document.removeEventListener('keydown', handleEscKey);
			modalOverlay.removeEventListener('click', clickOutsideHandler);
		};

		// Store cleanup function for later use
		modalOverlay._cleanup = cleanup;

	} finally {
		isModalOpening = false;
	}
}

/**
 * Closes the file management modal and cleans up event listeners.
 * Modified for File Management Feature - Cleanup function for modal
 */
function closeFileManagementModal() {
	const modalOverlay = document.getElementById('file-management-modal-overlay');
	if (modalOverlay) {
		// Run cleanup if it exists
		if (modalOverlay._cleanup) {
			modalOverlay._cleanup();
			delete modalOverlay._cleanup;
		}
		modalOverlay.classList.add('hidden');
		// Unregister from modal stack
		window.unregisterModal('file-management-modal');
	}
}

/**
 * Renders the list of all user attachments in the file management modal.
 * Modified for File Management Feature - Render function for global file list
 */
function renderFileManagementList(attachments, container) {
	container.innerHTML = '';
	
	if (attachments.length === 0) {
		container.innerHTML = '<p class="no-files-message">No files uploaded yet.</p>';
		return;
	}

	const appURL = window.MyDayHub_Config?.appURL || '';

	attachments.forEach(att => {
		const isPdf = att.original_filename.toLowerCase().endsWith('.pdf');
		const fileUrl = `${appURL}/media/imgs/${att.filename_on_server}`;
		
		const itemEl = document.createElement('div');
		itemEl.className = 'file-management-item';

		const fileSizeKB = (att.filesize_bytes / 1024).toFixed(1);
		const uploadDate = new Date(att.created_at).toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric',
			year: 'numeric'
		});
		
		let thumbnailHTML = '';
		if (isPdf) {
			thumbnailHTML = `
				<div class="file-management-thumbnail-icon">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
					</svg>
				</div>
			`;
		} else {
			thumbnailHTML = `<img src="${fileUrl}" class="file-management-thumbnail" alt="${att.original_filename}" />`;
		}

		itemEl.innerHTML = `
			${thumbnailHTML}
			<div class="file-management-info">
				<div class="file-management-filename">${att.original_filename}</div>
				<div class="file-management-details">
					<span class="file-size">${fileSizeKB} KB</span>
					<span class="upload-date">${uploadDate}</span>
				</div>
				<div class="file-management-task-info">
					<span class="task-name">Task: ${att.task_title}</span>
					<span class="column-name">Column: ${att.column_name || 'Unknown'}</span>
				</div>
			</div>
			<button class="btn-delete-file-management" title="Delete File" 
					data-attachment-id="${att.attachment_id}" 
					data-filename="${att.original_filename}">&times;</button>
		`;

		// Add click handler for viewing (only for images)
		if (!isPdf) {
			itemEl.addEventListener('click', (e) => {
				if (e.target.closest('.btn-delete-file-management')) {
					return; // Don't open viewer if delete button clicked
				}
				openAttachmentViewer(fileUrl, att.original_filename);
			});
			itemEl.style.cursor = 'pointer';
		} else {
			// For PDFs, make the whole item clickable to open in new tab
			itemEl.addEventListener('click', (e) => {
				if (e.target.closest('.btn-delete-file-management')) {
					return;
				}
				window.open(fileUrl, '_blank');
			});
			itemEl.style.cursor = 'pointer';
		}
		
		container.appendChild(itemEl);
	});
}

/**
 * Updates the storage quota display in the file management modal.
 * Modified for File Management Feature - Quota display for global view
 */
function updateFileManagementQuota(usedBytes, quotaBytes, progressBar, quotaText) {
	if (!progressBar || !quotaText) return;
	
	if (usedBytes === null || typeof usedBytes === 'undefined' || !isFinite(usedBytes)) {
		usedBytes = 0;
	}

	const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
	const quotaMB = (quotaBytes / 1024 / 1024).toFixed(1);
	const usedPercent = quotaBytes > 0 ? ((usedBytes / quotaBytes) * 100).toFixed(1) : 0;

	progressBar.max = quotaBytes;
	progressBar.value = usedBytes;
	quotaText.textContent = `${usedMB} / ${quotaMB} MB (${usedPercent}%)`;
}


// --- Mobile Move Mode Functions ---

/**
 * Enters a UI state that allows for moving a task via tapping.
 * @param {HTMLElement} taskCard - The task card element to be moved.
 */
function enterMoveMode(taskCard) {
	if (isMoveModeActive) {
		exitMoveMode(); // Exit any previous move mode first
	}

	isMoveModeActive = true;
	taskToMoveId = taskCard.dataset.taskId;

	taskCard.classList.add('is-moving');

	const sourceColumnId = taskCard.closest('.task-column').dataset.columnId;

	document.querySelectorAll('.task-column').forEach(column => {
		const footer = column.querySelector('.column-footer');
		if (column.dataset.columnId === sourceColumnId) {
			footer.innerHTML = `<button class="btn btn-danger btn-cancel-move">Cancel Move</button>`;
			footer.querySelector('.btn-cancel-move').addEventListener('click', exitMoveMode, { once: true });
		} else {
			footer.innerHTML = `<button class="btn btn-success btn-move-here">Move Here</button>`;
		}
	});
}

/**
 * Exits the "Move Mode" UI state and restores the original column footers.
 */
function exitMoveMode() {
	if (!isMoveModeActive) return;

	const movingCard = document.querySelector(`.task-card[data-task-id="${taskToMoveId}"]`);
	if (movingCard) {
		movingCard.classList.remove('is-moving');
	}

	document.querySelectorAll('.column-footer').forEach(footer => {
		const columnId = footer.dataset.columnId;
		footer.innerHTML = `<input type="text" class="new-task-input" placeholder="+ New Task" />`;
		footer.classList.remove('expanded'); // Ensure footer is collapsed after move mode
	});

	isMoveModeActive = false;
	taskToMoveId = null;
}

/**
 * Opens the snooze modal for a given task card and handles the result.
 */
// Modified for Snooze Feature - Fixed modal workflow
 async function openSnoozeModalForTask(taskCard) {
	 if (isModalOpening) return;
	 isModalOpening = true;
 
	 try {
		const taskId = taskCard.dataset.taskId;
		const currentSnoozeDate = taskCard.dataset.snoozedUntil || null;
		const snoozeSelection = await showSnoozeModal(currentSnoozeDate);
 
		 if (snoozeSelection !== null) {
			 const result = await snoozeTask(taskId, snoozeSelection);
			 if (result) {
				 // Task card is already updated in snoozeTask function
				 const columnBody = taskCard.closest('.column-body');
				 sortTasksInColumn(columnBody);
				 showToast({ message: 'Task snoozed successfully.', type: 'success' });
			 }
		 }
	 } finally {
		 isModalOpening = false;
	 }
 }

/**
 * Sends a request to snooze a task until a specified date.
 */
// Modified for Snooze Feature - Fixed data synchronization
 async function snoozeTask(taskId, snoozeDate) {
	 try {
		 const result = await window.apiFetch({
			 module: 'tasks',
			 action: 'snoozeTask',
			 task_id: taskId,
			 duration_type: snoozeDate.startsWith('custom:') ? 'custom' : snoozeDate,
			 custom_date: snoozeDate.startsWith('custom:') ? snoozeDate.substring(7) : null
		 });
		 if (result.status === 'success') {
			 // Update task card datasets with backend response
			 const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
			 if (taskCard) {
				 taskCard.dataset.snoozedUntil = result.data.snoozed_until;
				 taskCard.dataset.classification = result.data.classification;
				 taskCard.dataset.isSnoozed = 'true';
				 
				 // Re-render the card to update visual state
				 rerenderTaskCard(taskCard);
			 }
			 return result.data;
		 } else {
			 showToast({ message: `Error: ${result.message}`, type: 'error' });
			 return false;
		 }
	 } catch (error) {
		 showToast({ message: error.message, type: 'error' });
		 console.error('Snooze task error:', error);
		 return false;
	 }
 }

/**
  * Shows a modal for selecting snooze duration and returns the selected date.
  * @param {string|null} currentSnoozeDate - Current snooze date if editing existing snooze
  * @returns {Promise<string|null>} ISO date string or null if cancelled
  */
 async function showSnoozeModal(currentSnoozeDate = null) {
	return new Promise((resolve) => {
	const modal = document.createElement('div');
	modal.className = 'modal-overlay snooze-modal-overlay';
		modal.innerHTML = `
			<div class="modal-content snooze-modal">
				<div class="modal-header">
					<h3>Snooze Task</h3>
					<button class="modal-close-btn btn-icon btn-close" type="button">&times;</button>
				</div>
				<div class="modal-body">
				${currentSnoozeDate ? `<p><strong>Currently snoozed until:</strong> ${new Date(currentSnoozeDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</p><hr style="margin: 1rem 0; border-color: var(--border-color);">` : ''}
				<p>Select when this task should wake up:</p>
				<div class="snooze-options">
						<button class="snooze-preset-btn" data-duration="week">1 Week</button>
						<button class="snooze-preset-btn" data-duration="month">1 Month</button>
						<button class="snooze-preset-btn" data-duration="quarter">1 Quarter</button>
						<button class="snooze-custom-btn">Custom Date...</button>
					</div>
					<div class="custom-date-section" style="display: none;">
						<label for="snooze-custom-date">Wake Date:</label>
						<input type="date" id="snooze-custom-date" />
						<button class="btn-confirm-custom">Confirm</button>
					</div>
				</div>
			</div>
		`;

		document.body.appendChild(modal);
		setTimeout(() => modal.classList.add('visible'), 10);

		const closeModal = (result) => {
			modal.remove();
			resolve(result);
		};

		// Calculate preset dates
		const calculateSnoozeDate = (duration) => {
		const date = new Date();
		date.setHours(9, 0, 0, 0); // 9 AM wake time per spec
		
		switch (duration) {
			case 'week':
				date.setDate(date.getDate() + 7);
				return '1week';
			case 'month':
				date.setMonth(date.getMonth() + 1);
				return '1month';
			case 'quarter':
				// Fixed: Add 3 months properly handling year boundaries
				const currentMonth = date.getMonth();
				const newMonth = (currentMonth + 3) % 12;
				const yearIncrement = Math.floor((currentMonth + 3) / 12);
				date.setFullYear(date.getFullYear() + yearIncrement);
				date.setMonth(newMonth);
				return '1quarter';
			default:
				return duration;
			}
		};

		modal.addEventListener('click', (e) => {
			if (e.target === modal || e.target.matches('.modal-close-btn')) {
				closeModal(null);
			} else if (e.target.matches('.snooze-preset-btn')) {
				const duration = e.target.dataset.duration;
				const durationMap = { 'week': '1week', 'month': '1month', 'quarter': '1quarter' };
				closeModal(durationMap[duration]);
			} else if (e.target.matches('.snooze-custom-btn')) {
				const customSection = modal.querySelector('.custom-date-section');
				const dateInput = modal.querySelector('#snooze-custom-date');
				customSection.style.display = 'block';
				dateInput.focus();
			} else if (e.target.matches('.btn-confirm-custom')) {
				const dateInput = modal.querySelector('#snooze-custom-date');
				const selectedDate = dateInput.value;
				if (selectedDate) {
					closeModal(`custom:${selectedDate}`);
				}
			}
		});

		// ESC key handler
		const handleEsc = (e) => {
			if (e.key === 'Escape') {
				document.removeEventListener('keydown', handleEsc);
				closeModal(null);
			}
		};
		document.addEventListener('keydown', handleEsc);
	});
}

/**
 * Sends a request to unsnooze (wake up) a snoozed task.
 */
// Modified for Snooze Feature - Fixed data synchronization
 async function unsnoozeTask(taskId, taskCard) {
	 try {
		 const result = await window.apiFetch({
			 module: 'tasks',
			 action: 'unsnoozeTask',
			 task_id: taskId
		 });
		 if (result.status === 'success') {
			 // Clear snooze data from task card datasets
			 taskCard.dataset.snoozedUntil = '';
			 taskCard.dataset.snoozedAt = '';
			 taskCard.dataset.isSnoozed = 'false';
			 taskCard.classList.remove('snoozed');
			 
			 // Re-render the card to update visual state and menu
			 rerenderTaskCard(taskCard);
			 sortTasksInColumn(taskCard.closest('.column-body'));
			 
			 showToast({ message: 'Task unsnoozed successfully.', type: 'success' });
			 return true;
		 } else {
			 showToast({ message: `Error: ${result.message}`, type: 'error' });
			 return false;
		 }
	 } catch (error) {
		 showToast({ message: error.message, type: 'error' });
		 console.error('Unsnooze task error:', error);
		 return false;
	 }
 }

// Modified for Sharing Foundation - Lightweight task card updates without full board reload
 async function openShareModal(taskId) {
	 // Single-instance guard - Enhanced to prevent duplication
	 const existing = document.getElementById('share-modal-overlay');
	 if (existing) {
		 existing.remove();
		 // Small delay to ensure cleanup completes
		 await new Promise(resolve => setTimeout(resolve, 50));
	 }
 
	 // 1) Load existing shares via the app's API wrapper (injects CSRF per spec)
	 let shares = [];
	 try {
		 const res = await window.apiFetch({
			 module: 'tasks',
			 action: 'listTaskShares',
			 data: { task_id: taskId }
		 });
		 const json = (res && typeof res.json === 'function') ? await res.json() : res;
		 if (json?.status === 'success') shares = json.data?.shares || [];
	 } catch (err) {
		 console.warn('listTaskShares error', err);
	 }
 
	 // 2) Build overlay (styled by style.css / tasks.css)
	 const overlay = document.createElement('div');
	 overlay.id = 'share-modal-overlay';
	 overlay.classList.add('hidden');
 
	 const rowsHtml = shares.map(s => `
		 <tr data-user-id="${s.user_id}">
			 <td>${s.username || ''}</td>
			 <td>${s.email || ''}</td>
			 <td>
				 <select class="perm-select">
					 <option value="view"${s.permission === 'view' ? ' selected' : ''}>View</option>
					 <option value="edit"${s.permission === 'edit' ? ' selected' : ''}>Edit</option>
				 </select>
			 </td>
			 <td><button class="btn-unshare" type="button" data-user-id="${s.user_id}">Unshare</button></td>
		 </tr>
	 `).join('');
 
	 overlay.innerHTML = `
		 <div id="share-modal-container" role="dialog" aria-modal="true" aria-label="Share Task">
			 <button class="modal-close-btn btn-icon btn-close" type="button" aria-label="Close">×</button>
			 <h3>Share Task</h3>
 
			 <div class="share-add">
				 <label>Recipient (email or username)</label>
				 <input type="text" id="share-ident" placeholder="user@example.com or username" />
				 <label>Permission</label>
				 <select id="share-perm">
					 <option value="edit">Edit</option>
					 <option value="view">View</option>
				 </select>
				 <button id="btn-share-add" type="button">Add</button>
			 </div>
 
			 <div class="share-list">
				 <h4>Current Access</h4>
				 <table class="table-shares">
					 <thead><tr><th>User</th><th>Email</th><th>Permission</th><th></th></tr></thead>
					 <tbody>${rowsHtml || '<tr><td colspan="4">No one else has access.</td></tr>'}</tbody>
				 </table>
			 </div>
		 </div>
	 `;
 
	 document.body.appendChild(overlay);
	 requestAnimationFrame(() => overlay.classList.remove('hidden'));
 
	 // Helper function to update only the specific task card's share data
	 const updateTaskCardShares = async () => {
		 try {
			 // Fetch fresh share data for just this task
			 const res = await window.apiFetch({
				 module: 'tasks',
				 action: 'listTaskShares', 
				 data: { task_id: taskId }
			 });
			 const json = (res && typeof res.json === 'function') ? await res.json() : res;
			 const freshShares = json?.status === 'success' ? (json.data?.shares || []) : [];
			 
			 // Update the task card's dataset and re-render just that card
			 const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
			 if (taskCard) {
				 // Modified for Share Badge Fix - Ensure shares data is properly updated
				 taskCard.dataset.shares = JSON.stringify(freshShares);
				 
				 // Force re-render by updating the task data object used by getTaskDataFromElement
				 const currentTaskData = getTaskDataFromElement(taskCard);
				 currentTaskData.shares = freshShares; // Add the fresh shares data
				 
				 // Create new task card HTML with updated data
				 const tempDiv = document.createElement('div');
				 tempDiv.innerHTML = createTaskCard(currentTaskData);
				 const newCardEl = tempDiv.firstElementChild;
				 
				 // Replace the old card with the new one
				 taskCard.replaceWith(newCardEl);
			 }
		 } catch (err) {
			 console.error('Failed to update task card shares:', err);
		 }
	 };
 
	 // Close + bubble control
	 const close = () => overlay.remove();
	 overlay.addEventListener('click', close);
	 const panel = overlay.querySelector('#share-modal-container');
	 panel?.addEventListener('click', (ev) => ev.stopPropagation());
	 overlay.querySelector('.modal-close-btn')?.addEventListener('click', close);
 
	 // Modified for Lightweight Updates - Share handler without full reload
	 overlay.querySelector('#btn-share-add')?.addEventListener('click', async () => {
		 const recipient_identifier = overlay.querySelector('#share-ident')?.value.trim();
		 const permission = overlay.querySelector('#share-perm')?.value === 'view' ? 'view' : 'edit';
		 if (!recipient_identifier) return;
 
		 try {
			 const res = await window.apiFetch({
				 module: 'tasks',
				 action: 'shareTask',
				 data: { task_id: taskId, recipient_identifier, permission }
			 });
			 
			 let json;
			 if (res && typeof res.json === 'function') {
				 const responseText = await res.text();
				 try {
					 json = JSON.parse(responseText);
				 } catch (parseError) {
					 console.error('JSON Parse Error:', parseError);
					 showToast({ message: 'Server returned invalid response.', type: 'error' });
					 return;
				 }
			 } else {
				 json = res;
			 }
			 
			 if (json?.status === 'success') {
				 // Update task card without full reload
				 await updateTaskCardShares();
				 
				 // Clear the input and refresh the modal list
				 overlay.querySelector('#share-ident').value = '';
				 
				 // Refresh just the modal's share list
				 const freshRes = await window.apiFetch({
					 module: 'tasks',
					 action: 'listTaskShares',
					 data: { task_id: taskId }
				 });
				 const freshJson = (freshRes && typeof freshRes.json === 'function') ? await freshRes.json() : freshRes;
				 const freshShares = freshJson?.status === 'success' ? (freshJson.data?.shares || []) : [];
				 
				 // Update the table body
				 const tbody = overlay.querySelector('.table-shares tbody');
				 if (tbody) {
					 const newRowsHtml = freshShares.map(s => `
						 <tr data-user-id="${s.user_id}">
							 <td>${s.username || ''}</td>
							 <td>${s.email || ''}</td>
							 <td>
								 <select class="perm-select">
									 <option value="view"${s.permission === 'view' ? ' selected' : ''}>View</option>
									 <option value="edit"${s.permission === 'edit' ? ' selected' : ''}>Edit</option>
								 </select>
							 </td>
							 <td><button class="btn-unshare" type="button" data-user-id="${s.user_id}">Unshare</button></td>
						 </tr>
					 `).join('');
					 tbody.innerHTML = newRowsHtml || '<tr><td colspan="4">No one else has access.</td></tr>';
				 }
				 
				 showToast({ message: 'Task shared successfully.', type: 'success' });
			 } else {
				 showToast({ message: json?.message || 'Failed to share task.', type: 'error' });
			 }
		 } catch (err) {
			 showToast({ message: 'Server error while sharing task.', type: 'error' });
			 console.error('Share task error:', err);
		 }
	 });
 
	 // Modified for Lightweight Updates - Unshare handler without modal duplication
	 overlay.querySelector('.table-shares')?.addEventListener('click', async (e) => {
		 const btn = e.target.closest('.btn-unshare');
		 if (!btn) return;
		 const recipient_user_id = parseInt(btn.dataset.userId, 10);
		 if (!recipient_user_id) return;
 
		 try {
			 const res = await window.apiFetch({
				 module: 'tasks',
				 action: 'unshareTask',
				 data: { task_id: taskId, recipient_user_id }
			 });
			 const json = (res && typeof res.json === 'function') ? await res.json() : res;
			 
			 if (json?.status === 'success') {
				 // Remove the row from the current modal immediately
				 btn.closest('tr')?.remove();
				 
				 // Update the task card without closing the modal
				 await updateTaskCardShares();
				 
				 // Check if table is now empty and update accordingly
				 const remainingRows = overlay.querySelectorAll('.btn-unshare').length;
				 if (remainingRows === 0) {
					 const tbody = overlay.querySelector('.table-shares tbody');
					 if (tbody) {
						 tbody.innerHTML = '<tr><td colspan="4">No one else has access.</td></tr>';
					 }
				 }
				 
				 showToast({ message: 'Access removed successfully.', type: 'success' });
			 } else {
				 showToast({ message: json?.message || 'Failed to remove access.', type: 'error' });
			 }
		 } catch (err) {
			 showToast({ message: 'Server error while removing access.', type: 'error' });
			 console.error('Unshare task error:', err);
		 }
	 });
 }

// ==========================================================================
 // --- SESSION TIMEOUT MANAGEMENT ---
 // ==========================================================================
 
 /**
  * Updates the session timeout setting and UI elements.
  */
 function updateSessionTimeoutSetting(timeoutSeconds) {
	 const button = document.getElementById('btn-session-timeout');
	 if (button) {
		 const timeoutText = formatTimeoutDuration(timeoutSeconds);
		 button.innerHTML = `
			 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
				 <circle cx="12" cy="12" r="10"></circle>
				 <polyline points="12,6 12,12 16,14"></polyline>
			 </svg>
			 <span class="setting-label">Timeout: ${timeoutText}</span>
		 `;
	 }
	 
	 // Update modal selection when it opens
	 const modal = document.getElementById('session-timeout-modal-overlay');
	 if (modal) {
		 const radioButton = modal.querySelector(`input[value="${timeoutSeconds}"]`);
		 if (radioButton) {
			 radioButton.checked = true;
		 }
	 }
	 
	 // Initialize session timeout system
	 if (typeof initSessionTimeout === 'function') {
		 initSessionTimeout(timeoutSeconds);
	 }
 }
 
 /**
  * Formats timeout duration in seconds to human-readable text.
  */
 function formatTimeoutDuration(seconds) {
	 switch (parseInt(seconds)) {
		 case 300: return '5 minutes';
		 case 1800: return '30 minutes';
		 case 7200: return '2 hours';
		 case 28800: return '8 hours';
		 default: return '30 minutes';
	 }
 }
 
 /**
  * Saves session timeout preference to database and updates session.
  */
 async function saveSessionTimeout(timeoutSeconds) {
	 try {
		 await window.apiFetch({
			 module: 'users',
			 action: 'saveUserPreference',
			 key: 'session_timeout',
			 value: parseInt(timeoutSeconds)
		 });
		 
		 // Update UI and reinitialize timeout system
		 updateSessionTimeoutSetting(timeoutSeconds);
		 
		 showToast('Session timeout updated successfully', 'success');
	 } catch (error) {
		 console.error('Error saving session timeout:', error);
		 showToast('Failed to save session timeout', 'error');
	 }
 }
 
 // Initialize session timeout modal when DOM loads
 document.addEventListener('DOMContentLoaded', () => {
	 const timeoutButton = document.getElementById('btn-session-timeout');
	 const timeoutModal = document.getElementById('session-timeout-modal-overlay');
	 const saveButton = document.getElementById('btn-timeout-save');
	 const cancelButton = document.getElementById('btn-timeout-cancel');
	 
	 if (timeoutButton && timeoutModal) {
		 timeoutButton.addEventListener('click', () => {
			 timeoutModal.classList.remove('hidden');
			 // Register session timeout modal in modal stack
			 window.registerModal('session-timeout-modal', () => {
				 window.unregisterModal('session-timeout-modal');
				 timeoutModal.classList.add('hidden');
			 });
		 });
		 
		 cancelButton?.addEventListener('click', () => {
			 window.unregisterModal('session-timeout-modal');
			 timeoutModal.classList.add('hidden');
		 });
		 
		 saveButton?.addEventListener('click', () => {
			 const selectedValue = timeoutModal.querySelector('input[name="timeout"]:checked')?.value;
			 if (selectedValue) {
				 saveSessionTimeout(selectedValue);
				 window.unregisterModal('session-timeout-modal');
				 timeoutModal.classList.add('hidden');
			 }
		 });
		 
		 // Close modal on overlay click
		 timeoutModal.addEventListener('click', (e) => {
			 if (e.target === timeoutModal) {
				 window.unregisterModal('session-timeout-modal');
				 timeoutModal.classList.add('hidden');
			 }
		 });
	 }
 });
 
// ==========================================================================
 // --- QUOTA-AWARE UI MANAGEMENT ---
 // ==========================================================================
 
 /**
  * Updates UI elements based on current quota status to prevent failed actions
  * Modified for Subscription Quota Enforcement - Proactive quota-aware interface
  */
 function updateQuotaAwareUI() {
	 if (!window.quotaStatus) return;
	 
	 updateColumnCreationUI();
	 updateTaskCreationUI();
 }
 
/**
  * Updates the "New Column" button based on column quota status
  */
 function updateColumnCreationUI() {
	 const addColumnBtn = document.getElementById('btn-add-column');
	 if (!addColumnBtn || !window.quotaStatus) return;
	 
	 if (window.quotaStatus.columns.at_limit) {
		 // Replace button with upgrade message
		 addColumnBtn.textContent = `Upgrade (${window.quotaStatus.columns.used}/${window.quotaStatus.columns.limit} columns used)`;
		 addColumnBtn.disabled = true;
		 addColumnBtn.classList.add('quota-limited');
		 addColumnBtn.title = `You've reached your column limit. Upgrade your ${window.quotaStatus.subscription_level} plan to create more columns.`;
		 
		 // Remove the existing click event listeners and replace with upgrade message handler
		 const newBtn = addColumnBtn.cloneNode(true);
		 addColumnBtn.parentNode.replaceChild(newBtn, addColumnBtn);
		 newBtn.addEventListener('click', showColumnUpgradeMessage);
	 } else {
		 // Ensure normal functionality is restored
		 addColumnBtn.textContent = '+ New Column';
		 addColumnBtn.disabled = false;
		 addColumnBtn.classList.remove('quota-limited');
		 addColumnBtn.title = 'Add a new column';
		 
		 // Restore normal functionality by cloning button to remove all event listeners
		 const newBtn = addColumnBtn.cloneNode(true);
		 addColumnBtn.parentNode.replaceChild(newBtn, addColumnBtn);
		 // The normal click handler will be re-added by the main event listener in initEventListeners()
	 }
 }
 
 /**
  * Updates task input fields based on task quota status
  */
 function updateTaskCreationUI() {
	 const taskInputs = document.querySelectorAll('.new-task-input');
	 if (!window.quotaStatus) return;
	 
	 taskInputs.forEach(input => {
		 // Only check task limits - users can still add tasks to existing columns
		 if (window.quotaStatus.tasks.at_limit) {
			 input.placeholder = `Upgrade (${window.quotaStatus.tasks.used}/${window.quotaStatus.tasks.limit} tasks used)`;
			 input.disabled = true;
			 input.classList.add('quota-limited');
			 input.title = `You've reached your task limit. Upgrade your ${window.quotaStatus.subscription_level} plan to create more tasks.`;
			 
			 // Add click handler to show upgrade message
			 input.addEventListener('click', showTaskUpgradeMessage);
		 } else {
			 input.placeholder = '+ New Task';
			 input.disabled = false;
			 input.classList.remove('quota-limited');
			 input.title = 'Add a new task';
			 
			 // Remove upgrade click handler
			 input.removeEventListener('click', showTaskUpgradeMessage);
		 }
	 });
 }
 
 /**
  * Shows upgrade message for column limits
  */
 function showColumnUpgradeMessage() {
	 showToast({
		 message: `You've reached your column limit (${window.quotaStatus.columns.limit}). Upgrade your ${window.quotaStatus.subscription_level} subscription to create more columns.`,
		 type: 'info',
		 duration: 4000
	 });
 }
 
 /**
  * Shows upgrade message for task limits  
  */
 function showTaskUpgradeMessage() {
	 showToast({
		 message: `You've reached your task limit (${window.quotaStatus.tasks.limit}). Upgrade your ${window.quotaStatus.subscription_level} subscription to create more tasks.`,
		 type: 'info', 
		 duration: 4000
	 });
 }
 
 /**
  * Updates quota status after successful operations and refreshes UI
  */
 function updateQuotaStatusAfterOperation(operation, increment = true) {
	 if (!window.quotaStatus) return;
	 
	 if (operation === 'column') {
		 window.quotaStatus.columns.used += increment ? 1 : -1;
		 window.quotaStatus.columns.at_limit = window.quotaStatus.columns.used >= window.quotaStatus.columns.limit;
	 } else if (operation === 'task') {
		 window.quotaStatus.tasks.used += increment ? 1 : -1;
		 window.quotaStatus.tasks.at_limit = window.quotaStatus.tasks.used >= window.quotaStatus.tasks.limit;
	 }
	 
	 updateQuotaAwareUI();
 }