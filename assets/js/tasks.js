'use strict';
/**
 * MyDayHub 4.0.0 Beta - Tasks View Module
 * All logic specific to the Tasks Board view (columns, tasks, dnd, menus).
 * Exposes window.initTasksView() for app.js to call.
 */

// --- Module-level state ---
let taskToMoveId = null;
let dragSourceColumnEl = null; // track source for DnD counts

// ==========================================================================
// API & DATA
// ==========================================================================
async function fetchAndRenderBoard() {
	try {
		const response = await fetch('/api/api.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ module: 'tasks', action: 'getAll' })
		});
		if (!response.ok) throw new Error(`API ${response.status}`);
		const result = await response.json();
		if (result.status === 'success') {
			renderBoard(result.data);
		} else {
			throw new Error(result.message || 'Failed to fetch board data.');
		}
	} catch (err) {
		console.error('Error fetching board:', err);
		const wrap = document.getElementById('task-columns-wrapper');
		if (wrap) wrap.innerHTML = `<p class="error-message">Could not load board. Try again later.</p>`;
	}
}

function renderBoard(boardData) {
	const wrap = document.getElementById('task-columns-wrapper');
	if (!wrap) return;

	wrap.innerHTML = '';
	(boardData || []).forEach(col => {
		addColumnToBoard(col.column_name, col.column_id);
		const columnEl = wrap.lastElementChild;
		if (!columnEl) return;
		const body = columnEl.querySelector('.card-body');
		(col.tasks || []).forEach(task => {
			body.insertAdjacentHTML('beforeend', createTaskCard(task));
		});
		updateColumnTaskCount(columnEl);
	});
	updateAllColumnCounts(); // safety
}

// ==========================================================================
// CORE DOM BUILDERS
// ==========================================================================
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
	const title = (task.data && task.data.title) ? task.data.title : 'Untitled Task';
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

// Indicators (reserved for future)
const updateTaskCardIndicators = (taskCardEl) => {
	if (!taskCardEl) return;
	const box = taskCardEl.querySelector('.task-meta-indicators');
	if (!box) return;
	box.innerHTML = '';
	const notes = taskCardEl.dataset.notes;
	if (notes && notes.trim() !== '') {
		box.insertAdjacentHTML('beforeend',
			`<span class="meta-indicator" title="This task has notes"><span class="icon">📝</span></span>`);
	}
	const due = taskCardEl.dataset.dueDate;
	if (due) {
		box.insertAdjacentHTML('beforeend',
			`<span class="meta-indicator" title="Due Date: ${due}"><span class="icon">📅</span>${due}</span>`);
	}
};

// ==========================================================================
// COUNTS
// ==========================================================================
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

// ==========================================================================
// DND
// ==========================================================================
const initDragAndDrop = () => {
	const board = document.getElementById('task-board-container');
	if (!board) return;

	board.addEventListener('dragstart', (e) => {
		closeAllQuickActionsMenus();
		closeAllColumnActionMenus();
		const card = e.target;
		if (!card || !card.classList.contains('task-card')) return;
		card.classList.add('dragging');
		dragSourceColumnEl = card.closest('.task-column');
	});

	board.addEventListener('dragend', (e) => {
		const card = e.target;
		if (!card || !card.classList.contains('task-card')) return;
		card.classList.remove('dragging');

		const destBody = card.closest('.card-body');
		if (destBody) sortTasksInColumn(destBody);
		const destCol = card.closest('.task-column');

		if (destCol) updateColumnTaskCount(destCol);
		if (dragSourceColumnEl && dragSourceColumnEl !== destCol) {
			updateColumnTaskCount(dragSourceColumnEl);
		}
		dragSourceColumnEl = null;
	});

	board.addEventListener('dragover', (e) => {
		const dropZone = e.target.closest('.card-body');
		if (!dropZone) return;
		e.preventDefault();
		const draggingCard = document.querySelector('.dragging');
		if (!draggingCard) return;
		const after = getDragAfterElement(dropZone, e.clientY);
		if (after == null) dropZone.appendChild(draggingCard);
		else dropZone.insertBefore(draggingCard, after);
	});
};

const sortTasksInColumn = (columnBody) => {
	if (!columnBody) return;
	const tasks = Array.from(columnBody.querySelectorAll('.task-card'));
	tasks.sort((a, b) => {
		const aCompleted = a.classList.contains('completed');
		const bCompleted = b.classList.contains('completed');
		const aPriority = a.classList.contains('high-priority');
		const bPriority = b.classList.contains('high-priority');
		if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
		if (aPriority !== bPriority) return aPriority ? -1 : 1;
		return 0; // keep original order if same status/priority
	}).forEach(t => columnBody.appendChild(t));
};

const getDragAfterElement = (container, y) => {
	const els = [...container.querySelectorAll('.task-card:not(.dragging)')];
	return els.reduce((closest, child) => {
		const box = child.getBoundingClientRect();
		const offset = y - box.top - box.height / 2;
		if (offset < 0 && offset > closest.offset) {
			return { offset, element: child };
		}
		return closest;
	}, { offset: Number.NEGATIVE_INFINITY }).element;
};

// ==========================================================================
// Menus & helpers
// ==========================================================================
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
	menu.style.top  = `${window.scrollY + r.bottom + 5}px`;
	menu.style.left = `${window.scrollX + r.right - 180}px`;
	setTimeout(() => menu.classList.add('visible'), 10);
};

const closeAllColumnActionMenus = () => {
	document.querySelectorAll('.column-actions-menu').forEach(m => m.remove());
};

const toggleColumnActionsMenu = (buttonEl) => {
	const c = buttonEl.parentElement;
	const existing = c.querySelector('.column-actions-menu');
	closeAllColumnActionMenus();
	if (existing) return;
	const menu = document.createElement('div');
	menu.className = 'column-actions-menu';
	menu.innerHTML = `<ul><li><button class="btn-delete-column">Delete Column</button></li></ul>`;
	c.appendChild(menu);
};

// ==========================================================================
// Add Task (persisted) — blur/submit race guarded
// ==========================================================================
const showAddTaskForm = (footer) => {
	const original = footer.innerHTML;
	let restored = false;

	const restore = () => {
		if (restored) return;
		restored = true;
		if (!footer || !footer.isConnected) return;
		footer.innerHTML = original;
	};

	footer.innerHTML = `<form class="add-task-form"><input type="text" class="form-control" placeholder="Enter task title..." autofocus></form>`;
	const form  = footer.querySelector('.add-task-form');
	const input = form.querySelector('input');

	input.addEventListener('blur', restore, { once: true });

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		input.removeEventListener('blur', restore);

		const title = input.value.trim();
		if (!title) { restore(); return; }

		const columnEl = footer.closest('.task-column');
		const colIdStr = (columnEl?.id || '').replace('column-', '');
		const columnId = parseInt(colIdStr, 10);

		try {
			const resp = await fetch('/api/api.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					module: 'tasks',
					action: 'createTask',
					data: { column_id: columnId, title }
				})
			});
			const json = await resp.json();
			if (!resp.ok || json.status !== 'success') throw new Error(json.message || 'Create failed');

			const data = json.data;
			const body = columnEl.querySelector('.card-body');
			body.insertAdjacentHTML('beforeend', createTaskCard(data));
			sortTasksInColumn(body);
			updateColumnTaskCount(columnEl);
		} catch (err) {
			console.error('Create task error:', err);
			alert('Could not create task. Please try again.');
		} finally {
			restore();
		}
	});
};

// ==========================================================================
// MOVE MODE (visual only for now)
// ==========================================================================
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

// ==========================================================================
// INIT (exposed)
// ==========================================================================
function initTasksView() {
	const board = document.getElementById('task-board-container');
	if (!board) return;

	fetchAndRenderBoard();
	initDragAndDrop();

	// Handle UI clicks (menus, add, move, etc.)
	document.addEventListener('click', async (event) => {
		const target = event.target;

		// Close menus when clicking away (except in move mode)
		if (!document.body.classList.contains('move-mode-active')) {
			if (!target.closest('.column-controls, .quick-actions-menu, .btn-task-actions')) {
				closeAllColumnActionMenus();
				closeAllQuickActionsMenus();
			}
		}

		const quickActionEdit      = target.closest('[data-action="edit-task"]');
		const quickActionDuplicate = target.closest('[data-action="duplicate-task"]');
		const quickActionPriority  = target.closest('[data-action="toggle-high-priority"]');
		const quickActionMove      = target.closest('[data-action="start-move"]');
		const quickActionDelete    = target.closest('[data-action="delete-task"]');

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
			// Visual only for now
			const menu = quickActionDuplicate.closest('.quick-actions-menu');
			const originalCard = document.getElementById(menu.dataset.taskId);
			if (originalCard) {
				const tempId = Date.now();
				const tempTaskData = {
					task_id: tempId,
					data: { title: originalCard.querySelector('.task-title').textContent + ' (Copy)' },
					status: 'normal'
				};
				originalCard.insertAdjacentHTML('afterend', createTaskCard(tempTaskData));
				updateColumnTaskCount(originalCard.closest('.task-column'));
			}
			closeAllQuickActionsMenus();

		} else if (quickActionPriority) {
			// Visual only for now
			const menu = quickActionPriority.closest('.quick-actions-menu');
			const taskCard = document.getElementById(menu.dataset.taskId);
			if (taskCard) {
				taskCard.classList.toggle('high-priority');
				const body = taskCard.closest('.card-body');
				sortTasksInColumn(body);
				updateColumnTaskCount(body.closest('.task-column'));
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
			// Visual only for now
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
			// Visual only for now
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

	// NEW: handle completion using 'change' to guarantee state is updated
	document.addEventListener('change', (event) => {
		const target = event.target;
		if (!target.matches('.task-complete-checkbox')) return;

		const taskCard = target.closest('.task-card');
		if (!taskCard) return;

		const isChecked = target.checked;
		taskCard.classList.toggle('completed', isChecked);
		if (isChecked) {
			taskCard.classList.add('flash-animation');
			setTimeout(() => taskCard.classList.remove('flash-animation'), 400);
		}
		const body = taskCard.closest('.card-body');
		sortTasksInColumn(body);
		updateColumnTaskCount(body.closest('.task-column'));
	});
}

// expose for app.js
window.initTasksView = initTasksView;
