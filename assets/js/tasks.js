/**
 * MyDayHub 4.3.1 Beta - Tasks View Module
 * - Persists status (complete/priority) and in-column ordering.
 * - FIX: Cross-column drag now persists final ordered positions.
 */

// Module-level state
let taskToMoveId = null;
let dragFromColumnId = null;

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
	  sortTasksInColumn(body); // initial grouped sort; ties by data-position
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

  // store server position to use as tie-breaker during sorting
  const position = Number.isFinite(task.position) ? Number(task.position) : 0;

  return `
	<div class="task-card ${statusClass}" id="${taskId}" draggable="true"
		 data-position="${position}" data-notes="" data-due-date="">
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

// counts
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

// sorting with tie-breaker on stored position
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
	// tie-breaker: numeric data-position (lower first)
	const ap = parseInt(a.dataset.position || '0', 10);
	const bp = parseInt(b.dataset.position || '0', 10);
	return ap - bp;
  }).forEach(t => body.appendChild(t));
};

// compute final column order respecting groups
const computeOrderedIdsForColumn = (columnEl) => {
  const cards = Array.from(columnEl.querySelectorAll('.task-card'));
  const completed = cards.filter(c => c.classList.contains('completed'));
  const incompletes = cards.filter(c => !c.classList.contains('completed'));
  const priority = incompletes.filter(c => c.classList.contains('high-priority'));
  const normal = incompletes.filter(c => !c.classList.contains('high-priority'));
  const orderedCards = [...priority, ...normal, ...completed];
  return orderedCards.map(c => parseInt(c.id.replace('task-',''),10));
};

const applyOrderToColumnDom = (columnEl, orderedIds) => {
  const body = columnEl.querySelector('.card-body');
  if (!body) return;
  orderedIds.forEach(id => {
	const el = body.querySelector(`#task-${id}`);
	if (el) body.appendChild(el);
  });
};

/**
 * =========================================================================
 * DnD (persist cross-column moves; persist same-column reorder)
 * =========================================================================
 */
const initDragAndDrop = () => {
  const board = document.getElementById('task-board-container');
  if (!board) return;

  board.addEventListener('dragstart', (e) => {
	closeAllQuickActionsMenus();
	closeAllColumnActionMenus();
	const card = e.target.closest('.task-card');
	if (card) {
	  card.classList.add('dragging');
	  const fromColumn = card.closest('.task-column');
	  dragFromColumnId = fromColumn ? parseInt(fromColumn.id.replace('column-',''),10) : null;
	}
  });

  board.addEventListener('dragend', async (e) => {
	const card = e.target.closest('.task-card');
	if (!card) return;
	card.classList.remove('dragging');

	const destBody = card.closest('.card-body');
	if (!destBody) return;
	const destColumn = destBody.closest('.task-column');
	const destColumnId = destColumn ? parseInt(destColumn.id.replace('column-',''),10) : null;

	if (!dragFromColumnId || !destColumnId) return;

	// Case 1: moved to a different column
	if (dragFromColumnId !== destColumnId) {
	  // Respect user's drop: compute grouped order based on DOM, then apply
	  const orderedIds = computeOrderedIdsForColumn(destColumn);
	  applyOrderToColumnDom(destColumn, orderedIds);

	  // Update counters
	  updateColumnTaskCount(destColumn);
	  const fromColumnEl = document.getElementById(`column-${dragFromColumnId}`);
	  if (fromColumnEl) updateColumnTaskCount(fromColumnEl);

	  // Persist move, then persist full ordered list for destination
	  const taskId = parseInt(card.id.replace('task-',''),10);
	  try {
		// 1) Move card's column (server will append at end temporarily)
		const resMove = await apiPost({
		  module: 'tasks',
		  action: 'moveTask',
		  data: { task_id: taskId, to_column_id: destColumnId }
		});
		const jsonMove = await resMove.json();
		if (!resMove.ok || jsonMove.status !== 'success') {
		  throw new Error(jsonMove.message || `HTTP ${resMove.status}`);
		}

		// 2) Persist the exact destination order as dropped
		const resReorder = await apiPost({
		  module: 'tasks',
		  action: 'reorderColumn',
		  data: { column_id: destColumnId, ordered: orderedIds }
		});
		const jsonReorder = await resReorder.json();
		if (!resReorder.ok || jsonReorder.status !== 'success') {
		  throw new Error(jsonReorder.message || `HTTP ${resReorder.status}`);
		}

		// 3) Update data-position locally to mirror server positions
		const body = destColumn.querySelector('.card-body');
		Array.from(body.querySelectorAll('.task-card')).forEach((c, i) => {
		  c.dataset.position = String(i);
		});
	  } catch (err) {
		console.error('moveTask/reorderColumn failed:', err);
		alert('Could not save the move. Reloading the board.');
		fetchAndRenderBoard();
	  }
	} else {
	  // Case 2: re-ordered within SAME column → compute full order and persist
	  const orderedIds = computeOrderedIdsForColumn(destColumn);
	  applyOrderToColumnDom(destColumn, orderedIds);
	  updateColumnTaskCount(destColumn);

	  try {
		const res = await apiPost({
		  module: 'tasks',
		  action: 'reorderColumn',
		  data: { column_id: destColumnId, ordered: orderedIds }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') {
		  throw new Error(json.message || `HTTP ${res.status}`);
		}
		// Update each card's data-position to match its new index
		const body = destColumn.querySelector('.card-body');
		const cards = Array.from(body.querySelectorAll('.task-card'));
		cards.forEach((c, idx) => { c.dataset.position = String(idx); });
	  } catch (err) {
		console.error('reorderColumn failed:', err);
		alert('Could not save the new order. Reloading the board.');
		fetchAndRenderBoard();
	  }
	}

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

// Quick actions / menus (unchanged UI; priority persists elsewhere)
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
	`<form class="add-task-form"><input type="text" class="form-control" placeholder="Enter task title..." maxlength="200" autofocus required></form>`;
  const form = footer.querySelector('.add-task-form');
  const input = form.querySelector('input');

  const restore = () => { footer.innerHTML = original; };
  input.addEventListener('blur', restore, { once: true });

  form.addEventListener('submit', async (e) => {
	e.preventDefault();
	const title = input.value.trim();
	if (!title) { restore(); return; }

	const column = footer.closest('.task-column');
	const colId = parseInt((column?.id || '').replace('column-', ''), 10);

	try {
	  const res = await apiPost({
		module: 'tasks',
		action: 'createTask',
		data: { column_id: colId, title }
	  });
	  const json = await res.json();
	  if (!res.ok || json.status !== 'success') throw new Error(json.message || `HTTP ${res.status}`);

	  const body = column.querySelector('.card-body');
	  body.insertAdjacentHTML('beforeend', createTaskCard(json.data));
	  sortTasksInColumn(body);
	  updateColumnTaskCount(column);
	} catch (err) {
	  console.error('createTask failed:', err);
	  alert('Could not create the task. Please try again.');
	} finally {
	  restore();
	}
  });
};

/**
 * =========================================================================
 * MOVE MODE (persist on "Move here")
 * =========================================================================
 */
const enterMoveMode = (taskCardEl) => {
  taskToMoveId = taskCardEl.id;
  document.body.classList.add('move-mode-active');
  taskCardEl.classList.add('is-moving');
  closeAllQuickActionsMenus();
  document.querySelectorAll('.task-column').forEach(column => {
	const footer = column.querySelector('.card-footer');
	if (!footer.dataset.originalHtml) {
	  footer.dataset.originalHtml = footer.innerHTML;
	}
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
	  const menu = quickActionDuplicate.closest('.quick-actions-menu');
	  const originalCard = document.getElementById(menu.dataset.taskId);
	  if (originalCard) {
		const tempId = Date.now();
		const tempTaskData = {
		  task_id: tempId,
		  position: 9999,
		  data: { title: originalCard.querySelector('.task-title').textContent + ' (Copy)' },
		  status: 'normal'
		};
		originalCard.insertAdjacentHTML('afterend', createTaskCard(tempTaskData));
		updateColumnTaskCount(originalCard.closest('.task-column'));
	  }
	  closeAllQuickActionsMenus();

	} else if (quickActionPriority) {
	  // Optimistic: toggle visual, then persist
	  const menu = quickActionPriority.closest('.quick-actions-menu');
	  const taskCard = document.getElementById(menu.dataset.taskId);
	  if (taskCard) {
		const wasPriority = taskCard.classList.contains('high-priority');
		taskCard.classList.toggle('high-priority');
		const column = taskCard.closest('.task-column');

		// Recompute DOM order by groups and apply before persisting
		const orderedIds = computeOrderedIdsForColumn(column);
		applyOrderToColumnDom(column, orderedIds);

		const taskId = parseInt(taskCard.id.replace('task-',''),10);
		try {
		  const res = await apiPost({
			module: 'tasks',
			action: 'togglePriority',
			data: { task_id: taskId, on: !wasPriority }
		  });
		  const json = await res.json();
		  if (!res.ok || json.status !== 'success') throw new Error(json.message || `HTTP ${res.status}`);

		  // After status change, persist new order for the column as well
		  await apiPost({
			module: 'tasks',
			action: 'reorderColumn',
			data: { column_id: parseInt(column.id.replace('column-',''),10), ordered: orderedIds }
		  });

		  // Update data-position locally
		  const body = column.querySelector('.card-body');
		  Array.from(body.querySelectorAll('.task-card')).forEach((c, i) => c.dataset.position = String(i));
		} catch (err) {
		  console.error('togglePriority/reorderColumn failed:', err);
		  taskCard.classList.toggle('high-priority', wasPriority);
		  alert('Could not update priority. Please try again.');
		}
	  }
	  closeAllQuickActionsMenus();

	} else if (quickActionMove) {
	  exitMoveMode();
	  const menu = quickActionMove.closest('.quick-actions-menu');
	  if (menu && menu.dataset.taskId) {
		const taskCard = document.getElementById(menu.dataset.taskId);
		if (taskCard) enterMoveMode(taskCard);
	  }

	} else if (target.matches('.btn-move-task-here')) {
	  if (taskToMoveId) {
		const taskToMove = document.getElementById(taskToMoveId);
		const destinationColumn = target.closest('.task-column');
		const sourceColumnBody = taskToMove.closest('.card-body');
		if (taskToMove && destinationColumn) {
		  const destinationBody = destinationColumn.querySelector('.card-body');
		  destinationBody.appendChild(taskToMove);

		  // Apply grouped order for destination, then persist column order
		  const orderedIds = computeOrderedIdsForColumn(destinationColumn);
		  applyOrderToColumnDom(destinationColumn, orderedIds);

		  updateColumnTaskCount(destinationColumn);
		  if (sourceColumnBody) updateColumnTaskCount(sourceColumnBody.closest('.task-column'));

		  const movedId = parseInt(taskToMoveId.replace('task-',''),10);
		  const destId = parseInt(destinationColumn.id.replace('column-',''),10);
		  try {
			// Persist the cross-column move first
			const res = await apiPost({
			  module: 'tasks',
			  action: 'moveTask',
			  data: { task_id: movedId, to_column_id: destId }
			});
			const json = await res.json();
			if (!res.ok || json.status !== 'success') throw new Error(json.message || `HTTP ${res.status}`);

			// Then persist the final order of destination column
			await apiPost({
			  module: 'tasks',
			  action: 'reorderColumn',
			  data: { column_id: destId, ordered: orderedIds }
			});

			// Update data-position locally
			const body = destinationColumn.querySelector('.card-body');
			Array.from(body.querySelectorAll('.task-card')).forEach((c, i) => c.dataset.position = String(i));
		  } catch (err) {
			console.error('moveTask/reorderColumn failed:', err);
			alert('Could not save the move. Reloading the board.');
			fetchAndRenderBoard();
		  }
		}
		exitMoveMode();
	  }

	} else if (target.matches('.btn-cancel-move-inline')) {
	  exitMoveMode();

	} else if (target.matches('.btn-add-task')) {
	  showAddTaskForm(target.parentElement);

	} else if (target.matches('.btn-column-actions')) {
	  toggleColumnActionsMenu(target);

	} else if (target.matches('.btn-delete-column')) {
	  const column = target.closest('.task-column');
	  closeAllColumnActionMenus();
	  if (column) {
		const confirmed = await showConfirmationModal({
		  title: 'Delete Column',
		  message: 'Are you sure you want to delete this column and all its tasks? This action cannot be undone.',
		  confirmText: 'Delete'
		});
		if (confirmed) column.remove();
	  }
	}
  });

  // Completion persistence with grouped re-order and column reorder persist
  document.addEventListener('change', async (event) => {
	const target = event.target;
	if (!target.matches('.task-complete-checkbox')) return;

	const card = target.closest('.task-card');
	if (!card) return;

	const wasCompleted = card.classList.contains('completed');
	const nowCompleted = target.checked;

	// Optimistic UI
	card.classList.toggle('completed', nowCompleted);
	if (nowCompleted) {
	  card.classList.add('flash-animation');
	  setTimeout(() => { card.classList.remove('flash-animation'); }, 400);
	}

	const column = card.closest('.task-column');
	// Apply grouped order first (priority, normal, completed)
	const orderedIds = computeOrderedIdsForColumn(column);
	applyOrderToColumnDom(column, orderedIds);
	updateColumnTaskCount(column);

	const taskId = parseInt(card.id.replace('task-',''),10);
	try {
	  // Persist status
	  const res = await apiPost({
		module: 'tasks',
		action: 'toggleComplete',
		data: { task_id: taskId, completed: nowCompleted }
	  });
	  const json = await res.json();
	  if (!res.ok || json.status !== 'success') throw new Error(json.message || `HTTP ${res.status}`);

	  // Persist the final column order after status change
	  await apiPost({
		module: 'tasks',
		action: 'reorderColumn',
		data: { column_id: parseInt(column.id.replace('column-',''),10), ordered: orderedIds }
	  });

	  // Update data-position locally
	  const body = column.querySelector('.card-body');
	  Array.from(body.querySelectorAll('.task-card')).forEach((c, i) => c.dataset.position = String(i));

	} catch (err) {
	  console.error('toggleComplete/reorderColumn failed:', err);
	  // rollback UI
	  card.classList.toggle('completed', wasCompleted);
	  target.checked = wasCompleted;
	  const rollbackOrder = computeOrderedIdsForColumn(column);
	  applyOrderToColumnDom(column, rollbackOrder);
	  alert('Could not update completion. Please try again.');
	}
  });
};
// end of /assets/js/tasks.js v4.3.1
