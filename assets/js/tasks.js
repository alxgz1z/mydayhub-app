/**
 * MyDayHub 4.5.0 Beta - Tasks View Module
 */

// Module-level state variables
let taskToMoveId = null;
let dragFromColumnId = null;

// Modified for double_tap_support
let __lastTapTime = 0;
let __lastTapTarget = null;

// --- Small helpers for API calls ---
const getCsrfToken = () =>
  (document.querySelector('meta[name="csrf"]')?.content || '');

const apiPost = (payload) => {
  return fetch('/api/api.php', {
	method: 'POST',
	headers: {
	  'Content-Type': 'application/json',
	  'X-CSRF-Token': getCsrfToken()
	},
	body: JSON.stringify(payload)
  });
};

/**
 * =========================================================================
 * API & DATA HANDLING FUNCTIONS
 * =========================================================================
 */
async function fetchAndRenderBoard() {
  try {
	const response = await apiPost({ module: 'tasks', action: 'getAll' });
	if (!response.ok) throw new Error(`API status ${response.status}`);
	const result = await response.json();
	if (result.status === 'success') {
	  renderBoard(result.data);
	} else {
	  throw new Error(result.message || 'Failed to fetch board.');
	}
  } catch (error) {
	console.error('Error fetching board data:', error);
	const wrap = document.getElementById('task-columns-wrapper');
	if (wrap) {
	  wrap.innerHTML = `<p class="error-message">Could not load board. Please try again later.</p>`;
	}
  }
}

/**
 * Renders the entire board from API data.
 * @param {Array} boardData
 */
function renderBoard(boardData) {
  const wrap = document.getElementById('task-columns-wrapper');
  if (!wrap) return;
  wrap.innerHTML = '';

  (boardData || []).forEach(columnData => {
	addColumnToBoard(columnData.column_name, columnData.column_id);
	const columnEl = wrap.lastElementChild;
	if (!columnEl) return;

	const body = columnEl.querySelector('.card-body');
	if (body && columnData.tasks) {
	  columnData.tasks.forEach(taskData => {
		const html = createTaskCard(taskData);
		body.insertAdjacentHTML('beforeend', html);
	  });
	  // ensure initial sort after rendering tasks
	  sortTasksInColumn(body);
	}
	updateColumnTaskCount(columnEl);
  });
}

/**
 * =========================================================================
 * CORE TASK VIEW FUNCTIONS
 * =========================================================================
 */
const addColumnToBoard = (title, columnId) => {
  const wrap = document.getElementById('task-columns-wrapper');
  if (!wrap) return;
  const html = `
	<div class="task-column" id="column-${columnId}">
	  <div class="card-header">
		<span class="column-title">${title}</span>
		<span class="task-count">0</span>
		<div class="column-controls">
		  <button class="btn-icon btn-column-actions" title="Column Actions">&#8230;</button>
		</div>
	  </div>
	  <div class="card-body"></div>
	  <div class="card-footer">
		<button class="btn-add-task">+ New Task</button>
	  </div>
	</div>
  `;
  wrap.insertAdjacentHTML('beforeend', html);
};

const createTaskCard = (task) => {
  const taskId = `task-${task.task_id}`;
  const title = task.data?.title || 'Untitled Task';
  const statusClass =
	task.status === 'priority' ? 'high-priority' :
	task.status === 'completed' ? 'completed' : '';

  return `
	<div class="task-card ${statusClass}" id="${taskId}" draggable="true" data-notes="" data-due-date="">
	  <div class="task-status-band"></div>
	  <div class="task-card-main-content">
		<div class="task-card-content">
		  <input type="checkbox" class="task-complete-checkbox" title="Mark as complete" ${task.status === 'completed' ? 'checked' : ''}>
		  <span class="task-title">${title}</span>
		  <button class="btn-task-actions" title="Task Actions">&#8230;</button>
		</div>
		<div class="task-meta-indicators"></div>
	  </div>
	</div>
  `;
};

// --- counts ---
const updateColumnTaskCount = (columnEl) => {
  if (!columnEl) return;
  const countEl = columnEl.querySelector('.task-count');
  const bodyEl  = columnEl.querySelector('.card-body');
  if (!countEl || !bodyEl) return;
  countEl.textContent = bodyEl.querySelectorAll('.task-card').length;
};

const updateAllColumnCounts = () => {
  document.querySelectorAll('.task-column').forEach(updateColumnTaskCount);
};

// --- sorting ---
const sortTasksInColumn = (body) => {
  if (!body) return;
  const tasks = Array.from(body.querySelectorAll('.task-card'));
  tasks.sort((a, b) => {
	const aCompleted = a.classList.contains('completed');
	const bCompleted = b.classList.contains('completed');
	const aPriority = a.classList.contains('high-priority');
	const bPriority = b.classList.contains('high-priority');
	if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
	if (aPriority !== bPriority) return aPriority ? -1 : 1;
	return 0;
  }).forEach(t => body.appendChild(t));
};

// Modified for persist_in_column_reorder
const initDragAndDrop = () => {
  const board = document.getElementById('task-board-container');
  if (!board) return;

  // Track where the drag started so we know if it’s a cross-column move
  board.addEventListener('dragstart', (e) => {
	closeAllQuickActionsMenus();
	closeAllColumnActionMenus();
	const card = e.target.closest('.task-card');
	if (card) {
	  card.classList.add('dragging');
	  const fromColumn = card.closest('.task-column');
	  dragFromColumnId = fromColumn ? parseInt(fromColumn.id.replace('column-',''), 10) : null;
	}
  });

  board.addEventListener('dragend', async (e) => {
	const card = e.target.closest('.task-card');
	if (!card) return;
	card.classList.remove('dragging');

	const destBody   = card.closest('.card-body');
	if (!destBody) return;
	const destColumn = destBody.closest('.task-column');
	const destColumnId = destColumn ? parseInt(destColumn.id.replace('column-',''), 10) : null;

	// Local UI feedback first
	sortTasksInColumn(destBody);
	updateColumnTaskCount(destColumn);

	try {
	  if (dragFromColumnId && destColumnId && dragFromColumnId !== destColumnId) {
		// Cross-column move: persist append at destination (existing behavior)
		const taskId = parseInt(card.id.replace('task-',''), 10);
		const res = await apiPost({
		  module: 'tasks',
		  action: 'moveTask',
		  data: { task_id: taskId, to_column_id: destColumnId }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') {
		  throw new Error(json.message || `HTTP ${res.status}`);
		}
		// Update source column count too
		const fromColumnEl = document.getElementById(`column-${dragFromColumnId}`);
		if (fromColumnEl) updateColumnTaskCount(fromColumnEl);
	  } else if (dragFromColumnId && destColumnId && dragFromColumnId === destColumnId) {
		// Same-column reorder: gather ordered task IDs and persist
		const orderedIds = Array.from(destBody.querySelectorAll('.task-card'))
		  .map(el => parseInt(el.id.replace('task-',''), 10))
		  .filter(Number.isFinite);

		const res = await apiPost({
		  module: 'tasks',
		  action: 'reorderColumn',
		  data: { column_id: destColumnId, ordered: orderedIds }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') {
		  throw new Error(json.message || `HTTP ${res.status}`);
		}
	  }
	} catch (err) {
	  console.error('DnD persist failed:', err);
	  alert('Could not save the new order. Reloading the board.');
	  fetchAndRenderBoard();
	}

	// Reset tracker for next drag
	dragFromColumnId = null;
  });

  board.addEventListener('dragover', (e) => {
	const dropZone = e.target.closest('.card-body');
	if (dropZone) {
	  e.preventDefault();
	  const dragging = document.querySelector('.dragging');
	  if (!dragging) return;
	  const after = getDragAfterElement(dropZone, e.clientY);
	  if (after == null) dropZone.appendChild(dragging);
	  else dropZone.insertBefore(dragging, after);
	}
  });
};



const getDragAfterElement = (container, y) => {
  const others = [...container.querySelectorAll('.task-card:not(.dragging)')];
  return others.reduce((closest, child) => {
	const box = child.getBoundingClientRect();
	const offset = y - box.top - box.height / 2;
	if (offset < 0 && offset > closest.offset) {
	  return { offset, element: child };
	} else {
	  return closest;
	}
  }, { offset: Number.NEGATIVE_INFINITY }).element;
};

// --- Quick actions / menus ---
const closeAllQuickActionsMenus = () => {
  document.querySelectorAll('.quick-actions-menu').forEach(m => m.remove());
};

const showQuickActionsMenu = (buttonEl) => {
  closeAllQuickActionsMenus();
  const card = buttonEl.closest('.task-card');
  if (!card) return;
  const menu = document.createElement('div');
  menu.className = 'quick-actions-menu';
  menu.dataset.taskId = card.id;
  menu.innerHTML = `
	<button class="quick-action-btn" data-action="toggle-high-priority" title="Change Priority"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5a9.5 9.5 0 1 0 6.72 2.78"/><path d="M12 8v4l2 1"/><path d="M15.5 2.5V6h-3.5"/></svg></button>
	<button class="quick-action-btn" data-action="edit-task" title="Edit Note and Due Date"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
	<button class="quick-action-btn" data-action="start-move" title="Move"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m0 14-4-4m4 4 4-4M5 12h14M5 12l4-4M5 12l4 4"/></svg></button>
	<button class="quick-action-btn" data-action="share-task" title="Share"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98m0-9.98-6.83 3.98"/></svg></button>
	<button class="quick-action-btn" data-action="make-private" title="Mark as Private"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></button>
	<button class="quick-action-btn" data-action="duplicate-task" title="Duplicate"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
	<button class="quick-action-btn" data-action="delete-task" title="Delete"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
  `;
  document.body.appendChild(menu);
  const r = buttonEl.getBoundingClientRect();
  menu.style.top = `${window.scrollY + r.bottom + 5}px`;
  menu.style.left = `${window.scrollX + r.right - menu.offsetWidth}px`;
  setTimeout(() => menu.classList.add('visible'), 10);
};

const closeAllColumnActionMenus = () => {
  document.querySelectorAll('.column-actions-menu').forEach(m => m.remove());
};

const toggleColumnActionsMenu = (buttonEl) => {
  const controls = buttonEl.parentElement;
  const existing = controls.querySelector('.column-actions-menu');
  closeAllColumnActionMenus();
  if (existing) return;
  const menu = document.createElement('div');
  menu.className = 'column-actions-menu';
  menu.innerHTML = `<ul><li><button class="btn-delete-column">Delete Column</button></li></ul>`;
  controls.appendChild(menu);
};

const showAddTaskForm = (footer) => {
  const original = footer.innerHTML;

  footer.innerHTML =
	`<form class="add-task-form">
	   <input type="text"
			  class="form-control"
			  placeholder="Enter task title..."
			  maxlength="200"
			  autofocus
			  required>
	 </form>`;

  const form  = footer.querySelector('.add-task-form');
  const input = form.querySelector('input');

  // --- Make restoration safe to call multiple times ---
  let restored = false;
  const restoreOnce = () => {
	if (restored) return;
	restored = true;
	try {
	  footer.innerHTML = original;
	} catch (e) {
	  // If footer got detached or replaced, just swallow.
	  console.warn('Footer restore skipped:', e);
	}
  };

  // On blur, restore once (e.g., clicking elsewhere)
  const onBlur = () => restoreOnce();
  input.addEventListener('blur', onBlur);

  form.addEventListener('submit', async (e) => {
	e.preventDefault();

	// Prevent the blur handler from racing against submit
	input.removeEventListener('blur', onBlur);

	const title = input.value.trim();
	if (!title) { restoreOnce(); return; }

	const column   = footer.closest('.task-column');
	const colId    = parseInt((column?.id || '').replace('column-', ''), 10);
	const body     = column?.querySelector('.card-body');

	try {
	  const res  = await apiPost({
		module: 'tasks',
		action: 'createTask',
		data: { column_id: colId, title }
	  });
	  const json = await res.json();
	  if (!res.ok || json.status !== 'success') {
		throw new Error(json.message || `HTTP ${res.status}`);
	  }

	  if (body) {
		body.insertAdjacentHTML('beforeend', createTaskCard(json.data));
		sortTasksInColumn(body);
	  }
	  if (column) updateColumnTaskCount(column);
	} catch (err) {
	  console.error('createTask failed:', err);
	  alert('Could not create the task. Please try again.');
	} finally {
	  restoreOnce();
	}
  });
};

/**
 * =========================================================================
 * MOVE MODE (persist on "Move here")
 * =========================================================================
 */
// Modified for move_mode_hardening
 const enterMoveMode = (taskCardEl) => {
   if (!taskCardEl) return;
   taskToMoveId = taskCardEl.id;
 
   document.body.classList.add('move-mode-active');
   taskCardEl.classList.add('is-moving');
   closeAllQuickActionsMenus();
 
   document.querySelectorAll('.task-column').forEach((column) => {
	 const footer = column.querySelector('.card-footer');
	 if (!footer) return; // Be null-safe
 
	 // Remember original footer markup once
	 if (!footer.dataset.originalHtml) {
	   footer.dataset.originalHtml = footer.innerHTML;
	 }
 
	 // Show context actions
	 if (column.contains(taskCardEl)) {
	   footer.innerHTML = `<button class="btn-cancel-move-inline">Cancel Move</button>`;
	 } else {
	   footer.innerHTML = `<button class="btn-move-task-here">Move here</button>`;
	 }
   });
 };


const exitMoveMode = () => {
  const movingTask = document.querySelector('.task-card.is-moving');
  if (movingTask) movingTask.classList.remove('is-moving');
  document.body.classList.remove('move-mode-active');
  document.querySelectorAll('.task-column .card-footer').forEach(footer => {
	if (footer.dataset.originalHtml) {
	  footer.innerHTML = footer.dataset.originalHtml;
	  delete footer.dataset.originalHtml;
	}
  });
  taskToMoveId = null;
};

/**
 * =========================================================================
 * INITIALIZATION
 * =========================================================================
 */
const initTasksView = () => {
  const board = document.getElementById('task-board-container');
  if (!board) return;

  fetchAndRenderBoard();
  initDragAndDrop();

  document.addEventListener('click', async (event) => {
	const target = event.target;

	if (!document.body.classList.contains('move-mode-active')) {
	  if (!target.closest('.column-controls, .quick-actions-menu, .btn-task-actions')) {
		closeAllColumnActionMenus();
		closeAllQuickActionsMenus();
	  }
	}

	const quickActionEdit = target.closest('[data-action="edit-task"]');
	const quickActionDuplicate = target.closest('[data-action="duplicate-task"]');
	const quickActionPriority = target.closest('[data-action="toggle-high-priority"]');
	const quickActionMove = target.closest('[data-action="start-move"]');
	const quickActionDelete = target.closest('[data-action="delete-task"]');

	if (target.matches('.btn-task-actions')) {
	  showQuickActionsMenu(target);

	} else if (quickActionEdit) {
	  const menu = quickActionEdit.closest('.quick-actions-menu');
	  const taskCard = document.getElementById(menu.dataset.taskId);
	  if (taskCard) {
		const taskData = {
		  id: taskCard.id,
		  title: taskCard.querySelector('.task-title').textContent,
		  notes: taskCard.dataset.notes || '',
		  dueDate: taskCard.dataset.dueDate || ''
		};
		UnifiedEditor.open({ type: 'task', data: taskData });
	  }
	  closeAllQuickActionsMenus();

	} else if (quickActionDuplicate) {
	  // PERSISTED DUPLICATE
	  const menu = quickActionDuplicate.closest('.quick-actions-menu');
	  const originalCard = document.getElementById(menu.dataset.taskId);
	  if (originalCard) {
		const taskId = parseInt(originalCard.id.replace('task-',''), 10);
		const column = originalCard.closest('.task-column');
		const body   = column?.querySelector('.card-body');

		try {
		  const res = await apiPost({
			module: 'tasks',
			action: 'duplicateTask',
			data: { task_id: taskId }
		  });
		  const json = await res.json();
		  if (!res.ok || json.status !== 'success') {
			throw new Error(json.message || `HTTP ${res.status}`);
		  }
		  // Insert the real, persisted copy (API returns full task object)
		  originalCard.insertAdjacentHTML('afterend', createTaskCard(json.data));
		  if (body) sortTasksInColumn(body);
		  if (column) updateColumnTaskCount(column);
		} catch (err) {
		  console.error('duplicateTask failed:', err);
		  alert('Could not duplicate the task. Please try again.');
		}
	  }
	  closeAllQuickActionsMenus();

	// Modified for togglePriority_persistence (task_id normalization)
	} else if (quickActionPriority) {
	  const menu     = quickActionPriority.closest('.quick-actions-menu');
	  const cardId   = menu?.dataset?.taskId || ''; // may be "task-123" or "123"
	  const numericIdMatch = String(cardId).match(/\d+/);
	  const taskId   = numericIdMatch ? Number(numericIdMatch[0]) : NaN;
	
	  const taskCard = document.getElementById(cardId);
	  if (!taskCard || Number.isNaN(taskId)) {
		console.error('togglePriority: cannot resolve task_id from', { cardId });
		alert('Could not identify task. Please refresh and try again.');
		closeAllQuickActionsMenus();
		return;
	  }
	
	  // Guard: backend ignores priority changes when task is completed.
	  if (taskCard.classList.contains('completed')) {
		alert('Completed tasks cannot be prioritized.');
		closeAllQuickActionsMenus();
		return;
	  }
	
	  const body       = taskCard.closest('.card-body');
	  const wasHigh    = taskCard.classList.contains('high-priority');
	  const nextIsHigh = !wasHigh;
	
	  // Optimistic UI
	  taskCard.classList.toggle('high-priority', nextIsHigh);
	  sortTasksInColumn(body);
	  updateColumnTaskCount(body.closest('.task-column'));
	
	  try {
		// Helpful log in dev
		console.debug('togglePriority → POST', { task_id: taskId, priority: nextIsHigh });
	
		const res  = await apiPost({
		  module: 'tasks',
		  action: 'togglePriority',
		  data: {
			task_id: taskId,           // NOTE: always numeric
			priority: nextIsHigh       // boolean
		  }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') {
		  throw new Error(json.message || `HTTP ${res.status}`);
		}
		// Success: keep optimistic state.
	  } catch (err) {
		// Rollback on error
		taskCard.classList.toggle('high-priority', wasHigh);
		sortTasksInColumn(body);
		updateColumnTaskCount(body.closest('.task-column'));
		console.error('togglePriority failed:', err);
		alert('Could not update priority. Please try again.');
	  } finally {
		closeAllQuickActionsMenus();
	  }

	} else if (target.matches('.btn-move-task-here')) {
	  if (taskToMoveId) {
		const taskToMove = document.getElementById(taskToMoveId);
		const destinationColumn = target.closest('.task-column');
		const sourceColumnBody = taskToMove.closest('.card-body');
		if (taskToMove && destinationColumn) {
		  const destinationBody = destinationColumn.querySelector('.card-body');
		  destinationBody.appendChild(taskToMove);
		  sortTasksInColumn(destinationBody);
		  updateColumnTaskCount(destinationColumn);
		  updateColumnTaskCount(sourceColumnBody.closest('.task-column'));

		  // Persist the move
		  const movedId = parseInt(taskToMoveId.replace('task-',''),10);
		  const destId = parseInt(destinationColumn.id.replace('column-',''),10);
		  try {
			const res = await apiPost({
			  module: 'tasks',
			  action: 'moveTask',
			  data: { task_id: movedId, to_column_id: destId }
			});
			const json = await res.json();
			if (!res.ok || json.status !== 'success') {
			  throw new Error(json.message || `HTTP ${res.status}`);
			}
		  } catch (err) {
			console.error('moveTask failed:', err);
			alert('Could not save the move. Reloading the board.');
			fetchAndRenderBoard();
		  }
		}
		exitMoveMode();
	  }
	
	// Modified for move_mode_hardening
	} else if (quickActionMove) {
	  // End any previous move context first
	  exitMoveMode();
	
	  // Resolve the task card robustly
	  const menu = quickActionMove.closest('.quick-actions-menu');
	  const fromButtonCard = quickActionMove.closest('.task-card');
	  const cardIdRaw =
		(menu && menu.dataset && menu.dataset.taskId) ||
		(fromButtonCard && fromButtonCard.id) ||
		'';
	
	  const idMatch = String(cardIdRaw).match(/\d+/);
	  const numId = idMatch ? Number(idMatch[0]) : NaN;
	
	  // Try both "task-<id>" and "<id>" as DOM ids
	  const taskCard =
		document.getElementById(cardIdRaw) ||
		document.getElementById(`task-${numId}`);
	
	  if (!taskCard || Number.isNaN(numId)) {
		console.error('start-move: could not resolve task card/id', { cardIdRaw });
		alert('Could not identify the task to move. Please refresh and try again.');
		closeAllQuickActionsMenus();
		return;
	  }
	
	  // Enter move mode and reveal footers with Move/Cancel controls
	  enterMoveMode(taskCard);
	
	  // Close the floating menu so the footer buttons are easy to see/click
	  closeAllQuickActionsMenus();

	
	} else if (target.matches('.btn-cancel-move-inline')) {
	  exitMoveMode();

	} else if (target.matches('.btn-add-task')) {
	  showAddTaskForm(target.parentElement);
	
	// Modified for createColumn_persistence
	} else if (target.matches('#btn-add-new-column')) {
	  // Ask for the column name (minimal UI for now; can swap to modal later)
	  const name = (prompt('Name your new column:') || '').trim();
	  if (!name) {
		// No-op if user cancelled or blank name
		closeAllColumnActionMenus();
		closeAllQuickActionsMenus();
		return;
	  }
	
	  try {
		const res = await apiPost({
		  module: 'tasks',
		  action: 'createColumn',
		  data: { column_name: name }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') {
		  throw new Error(json.message || `HTTP ${res.status}`);
		}
	
		// Render the persisted column returned by the server
		addColumnToBoard(json.data.column_name, json.data.column_id);
	
		// Optional nicety: scroll last column into view
		const wrap = document.getElementById('task-columns-wrapper');
		if (wrap && wrap.lastElementChild) {
		  wrap.lastElementChild.scrollIntoView({ behavior: 'smooth', inline: 'end' });
		}
	  } catch (err) {
		console.error('createColumn failed:', err);
		alert('Could not create the column. Please try again.');
	  } finally {
		closeAllColumnActionMenus();
		closeAllQuickActionsMenus();
	  }
	} else if (target.matches('.btn-column-actions')) {
	  toggleColumnActionsMenu(target);

	// ===== Persisted delete column =====
	} else if (target.matches('.btn-delete-column')) {
	  const column = target.closest('.task-column');
	  closeAllColumnActionMenus();
	  if (column) {
		const confirmed = await showConfirmationModal({
		  title: 'Delete Column',
		  message: 'Delete this column and all its tasks? This cannot be undone.',
		  confirmText: 'Delete'
		});
		if (!confirmed) return;

		const columnId = parseInt(column.id.replace('column-',''), 10);
		try {
		  const res = await apiPost({
			module: 'tasks',
			action: 'deleteColumn',
			data: { column_id: columnId }
		  });
		  const json = await res.json();
		  if (!res.ok || json.status !== 'success') {
			throw new Error(json.message || `HTTP ${res.status}`);
		  }
		  column.remove();
		} catch (err) {
		  console.error('deleteColumn failed:', err);
		  alert('Could not delete the column. Please try again.');
		}
	  }
	}
  });

  // Modified for inline_rename_columns
  // Double-click to inline-edit a column title; Enter/blur commits; Esc cancels.
  // Modified for inline_rename_columns_guard
  document.addEventListener('dblclick', (e) => {
	if (document.body.classList.contains('move-mode-active')) return;
  
	const titleEl = e.target.closest('.column-title');
	if (!titleEl) return;
  
	const columnEl = titleEl.closest('.task-column');
	if (!columnEl) return;
  
	const columnId = parseInt(String(columnEl.id).replace('column-',''), 10);
	if (!Number.isFinite(columnId)) return;
  
	const original = (titleEl.textContent || '').trim();
  
	const input = document.createElement('input');
	input.type = 'text';
	input.className = 'inline-title-input';
	input.value = original;
	input.setAttribute('maxlength', '120');
	input.style.width = Math.max(120, titleEl.clientWidth) + 'px';
  
	titleEl.replaceWith(input);
	input.focus();
	input.select();
  
	let finalized = false; // guard against double commit (Enter + blur)
  
	const restoreSpan = (text) => {
	  const span = document.createElement('span');
	  span.className = 'column-title';
	  span.textContent = text;
	  if (input.isConnected) input.replaceWith(span);
	  else {
		const existing = columnEl.querySelector('.column-title');
		if (existing) existing.textContent = text;
	  }
	};
  
	const commit = async () => {
	  if (finalized) return;
	  finalized = true;
	  input.removeEventListener('blur', commit);
	  const name = (input.value || '').trim();
  
	  if (!name || name === original) {
		restoreSpan(original);
		return;
	  }
  
	  // Optimistic UI
	  restoreSpan(name);
  
	  try {
		const res = await apiPost({
		  module: 'tasks',
		  action: 'renameColumn',
		  data: { column_id: columnId, column_name: name }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') throw new Error(json.message || `HTTP ${res.status}`);
  
		const span = columnEl.querySelector('.column-title');
		if (span) span.textContent = json.data?.column_name ?? name;
	  } catch (err) {
		console.error('renameColumn failed:', err);
		alert('Could not rename the column. Restoring previous title.');
		const span = columnEl.querySelector('.column-title');
		if (span) span.textContent = original;
	  }
	};
  
	const cancel = () => {
	  if (finalized) return;
	  finalized = true;
	  input.removeEventListener('blur', commit);
	  restoreSpan(original);
	};
  
	input.addEventListener('keydown', (ev) => {
	  if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
	  else if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
	});
	input.addEventListener('blur', commit, { once: true });
  });


  // Modified for inline_rename_tasks
  // Double-click to inline-edit a task title; Enter/blur commits; Esc cancels.
  // Modified for inline_rename_tasks_guard
  document.addEventListener('dblclick', (e) => {
	if (document.body.classList.contains('move-mode-active')) return;
  
	const span = e.target.closest('.task-title');
	if (!span) return;
  
	const card = span.closest('.task-card');
	if (!card) return;
  
	const idMatch = String(card.id).match(/\d+/);
	const taskId  = idMatch ? Number(idMatch[0]) : NaN;
	if (!Number.isFinite(taskId)) return;
  
	const original = (span.textContent || '').trim();
  
	const input = document.createElement('input');
	input.type = 'text';
	input.className = 'inline-title-input';
	input.value = original;
	input.setAttribute('maxlength', '200');
	input.style.width = Math.max(140, span.clientWidth) + 'px';
  
	span.replaceWith(input);
	input.focus();
	input.select();
  
	let finalized = false; // prevents Enter+blur double-run
  
	const restoreSpan = (text) => {
	  const s = document.createElement('span');
	  s.className = 'task-title';
	  s.textContent = text;
	  if (input.isConnected) input.replaceWith(s);
	  else {
		const existing = card.querySelector('.task-title');
		if (existing) existing.textContent = text;
	  }
	};
  
	const commit = async () => {
	  if (finalized) return;
	  finalized = true;
	  input.removeEventListener('blur', commit);
	  const name = (input.value || '').trim();
  
	  if (!name || name === original) {
		restoreSpan(original);
		return;
	  }
  
	  // Optimistic
	  restoreSpan(name);
  
	  try {
		const res = await apiPost({
		  module: 'tasks',
		  action: 'renameTaskTitle',
		  data: { task_id: taskId, title: name }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') throw new Error(json.message || `HTTP ${res.status}`);
  
		const s = card.querySelector('.task-title');
		if (s) s.textContent = json.data?.data?.title ?? name;
	  } catch (err) {
		console.error('renameTaskTitle failed:', err);
		alert('Could not rename the task. Restoring previous title.');
		const s = card.querySelector('.task-title');
		if (s) s.textContent = original;
	  }
	};
  
	const cancel = () => {
	  if (finalized) return;
	  finalized = true;
	  input.removeEventListener('blur', commit);
	  restoreSpan(original);
	};
  
	input.addEventListener('keydown', (ev) => {
	  if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
	  else if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
	});
	input.addEventListener('blur', commit, { once: true });
  });


  // Modified for double_tap_support
  // Mobile: treat a fast second tap on a title as a double-click.
  document.addEventListener('touchend', (e) => {
	const el = e.target.closest('.column-title, .task-title');
	if (!el) return;

	const now = Date.now();
	if (__lastTapTarget === el && (now - __lastTapTime) < 300) {
	  e.preventDefault();
	  // Fire a synthetic dblclick so the above handlers run.
	  el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	  __lastTapTime = 0;
	  __lastTapTarget = null;
	} else {
	  __lastTapTime = now;
	  __lastTapTarget = el;
	}
  }, { passive: true });

  // Modified for toggleComplete_persistence
  // Delegated handler for completion checkbox changes
  document.addEventListener('change', async (e) => {
	const el = e.target;
	// Try common selectors for the completion checkbox:
	//  - .task-complete-checkbox   (recommended class)
	//  - input[type="checkbox"][data-complete]
	// If your markup differs, this still works because we fall back to finding
	// the nearest task card and its id.
	const isCompletionToggle =
	  el.matches('.task-complete-checkbox') ||
	  el.matches('input[type="checkbox"][data-complete]');
  
	if (!isCompletionToggle) return;
  
	// Resolve the task card and numeric id (handles "task-123" and "123")
	const taskCard = el.closest('.task-card') || el.closest('[id^="task-"]') || el.closest('[id]');
	const cardId   = taskCard ? taskCard.id : '';
	const idMatch  = String(cardId).match(/\d+/);
	const taskId   = idMatch ? Number(idMatch[0]) : NaN;
  
	if (!taskCard || Number.isNaN(taskId)) {
	  console.error('toggleComplete: cannot resolve task_id from', { cardId });
	  alert('Could not identify task. Please refresh and try again.');
	  return;
	}
  
	// Desired state from the checkbox
	const nextCompleted = !!el.checked;
  
	// Optimistic UI: toggle class and reflow
	const body    = taskCard.closest('.card-body');
	const wasDone = taskCard.classList.contains('completed');
	taskCard.classList.toggle('completed', nextCompleted);
	if (body) {
	  sortTasksInColumn(body);
	  const col = body.closest('.task-column');
	  if (col) updateColumnTaskCount(col);
	}
  
	try {
	  console.debug('toggleComplete → POST', { task_id: taskId, completed: nextCompleted });
	  const res  = await apiPost({
		module: 'tasks',
		action: 'toggleComplete',
		data: {
		  task_id: taskId,          // numeric
		  completed: nextCompleted  // boolean
		}
	  });
	  const json = await res.json();
	  if (!res.ok || json.status !== 'success') {
		throw new Error(json.message || `HTTP ${res.status}`);
	  }
	  // Success: keep optimistic state (no-op).
	} catch (err) {
	  // Rollback UI if server rejected
	  console.error('toggleComplete failed:', err);
	  taskCard.classList.toggle('completed', wasDone);
	  if (body) {
		sortTasksInColumn(body);
		const col = body.closest('.task-column');
		if (col) updateColumnTaskCount(col);
	  }
	  // Rollback checkbox state to match UI
	  el.checked = wasDone;
	  alert('Could not update completion. Please try again.');
	}
  });
};
// end of /assets/js/tasks.js v4.5.0
