/**
 * Code for /uix/storyboards.js
 *
 * Signal - Storyboards View
 *
 * A collaborative drafting tool for narrative structure: lay an argument out
 * scene by scene, review it as a team, and export a markdown build brief an
 * agent can turn into a deck or a document.
 *
 * Three screens — dashboard, scene index, scene workspace — and one canvas
 * renderer used at two sizes. The index tiles are the same markup and the same
 * stylesheet as the full canvas at a smaller width, which is what makes them
 * scale models rather than crops.
 *
 * Runs in two shells: the Signal app's Storyboards tab, and the guest shell at
 * /sb/ that a codeword opens. The only difference between them is the endpoint
 * and CSRF token in window.SB_Config, so everything below is shared.
 *
 * @version 8.8 Samara
 * @author Alex & Claude
 */

(function () {
	'use strict';

	/* ======================================================================
	   Configuration and API
	   ====================================================================== */

	function config() {
		return window.SB_Config || {};
	}

	function endpoint() {
		const appURL = window.Signal_Config?.appURL || '';
		return config().endpoint || `${appURL}/api/api.php`;
	}

	function csrfToken() {
		return config().csrfToken
			|| document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
			|| '';
	}

	/**
	 * One call to the storyboards module.
	 *
	 * Deliberately not window.apiFetch: that posts to Signal's own gateway, and a
	 * guest has no session there. Everything else about the shape is the same.
	 */
	async function api(action, data = {}, options = {}) {
		const body = options.formData || JSON.stringify({ module: 'storyboards', action, data });
		const headers = { 'X-CSRF-TOKEN': csrfToken() };
		if (!options.formData) headers['Content-Type'] = 'application/json';

		const response = await fetch(endpoint(), { method: 'POST', headers, body });
		const text = await response.text();

		let payload;
		try {
			payload = JSON.parse(text);
		} catch (e) {
			console.error('Storyboards: non-JSON response', text);
			throw new Error('The server returned an unexpected response.');
		}

		if (!response.ok || payload.status === 'error') {
			const error = new Error(payload.message || `Request failed (${response.status}).`);
			error.status = response.status;
			error.data = payload.data;
			throw error;
		}

		return payload.data || {};
	}

	function toast(message, type = 'info') {
		if (typeof showToast === 'function') {
			showToast({ message, type });
		} else {
			console.log(`[storyboards] ${message}`);
		}
	}

	async function confirmAction(message) {
		if (typeof window.showConfirm === 'function') {
			return await window.showConfirm(message);
		}
		return window.confirm(message);
	}

	/* ======================================================================
	   State
	   ====================================================================== */

	const state = {
		screen: 'dashboard',      // dashboard | index | scene
		storyboards: [],
		storyboard: null,
		scenes: [],
		scene: null,
		comments: [],
		showClosedNotes: false,
		fullWidth: false,
		positionToId: {},
		briefFields: null,
		frameworks: null,
		loading: false,
	};

	let host = null;
	let initialized = false;

	/** Touch reordering is an explicit mode; pointer reordering is a drag. */
	function isCoarsePointer() {
		return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
	}

	/* ======================================================================
	   Small helpers
	   ====================================================================== */

	function esc(value) {
		return String(value ?? '').replace(/[&<>"']/g, (c) => ({
			'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
		}[c]));
	}

	function el(tag, className, html) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (html != null) node.innerHTML = html;
		return node;
	}

	/** A scene's hue comes from its position, and cycles past six. */
	function arcHue(position) {
		return `var(--sb-arc-${((position - 1) % 6) + 1})`;
	}

	/**
	 * Render a body's `<<3>>` cross-references as clickable links to the scene
	 * that currently sits at that position.
	 *
	 * The reference is stored against a stable scene id and arrives already
	 * resolved to a position, so a reordered storyboard never leaves a link
	 * pointing at the wrong scene.
	 */
	function withRefs(body) {
		return esc(body).replace(/&lt;&lt;\s*([\d,\s]+?)\s*&gt;&gt;/g, (full, inner) => {
			const positions = inner.split(',').map((p) => p.trim()).filter(Boolean);
			if (!positions.length) return full;

			return positions.map((position) => {
				const sceneId = state.positionToId[position];
				return sceneId
					? `<span class="sb-ref" data-scene="${sceneId}">scene ${esc(position)}</span>`
					: `&lt;&lt;${esc(position)}&gt;&gt;`;
			}).join(', ');
		});
	}

	function relativeTime(value) {
		if (!value) return '';
		const then = new Date(value.replace(' ', 'T') + (value.includes('Z') ? '' : 'Z'));
		const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
		if (Number.isNaN(seconds)) return '';
		if (seconds < 90) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		return then.toLocaleDateString();
	}

	function canWrite() {
		return state.storyboard?.access === 'write';
	}

	/* ======================================================================
	   Modals
	   ====================================================================== */

	/**
	 * A modal in Signal's language, with its action row pinned to the bottom of
	 * the scroll box rather than sitting at the end of the content — nine
	 * full-width fields once put Save far below the fold, which read as the
	 * optional questions blocking the save.
	 */
	function openModal({ title, body, actions = [], width = '34rem', onClose }) {
		const overlay = el('div', 'modal sb-modal');
		const content = el('div', 'modal-content');
		content.style.width = width;
		content.style.maxWidth = '95vw';
		content.style.display = 'flex';
		content.style.flexDirection = 'column';

		const head = el('div', 'sb-modal-head', `<h2>${esc(title)}</h2>`);
		const closeBtn = el('button', 'sb-btn icon-only', '&times;');
		closeBtn.setAttribute('aria-label', 'Close');
		head.appendChild(closeBtn);

		const bodyWrap = el('div', 'sb-modal-body');
		if (typeof body === 'string') bodyWrap.innerHTML = body;
		else if (body) bodyWrap.appendChild(body);

		const foot = el('div', 'sb-modal-foot');
		content.append(head, bodyWrap, foot);
		overlay.appendChild(content);
		document.body.appendChild(overlay);

		const close = () => {
			overlay.remove();
			document.removeEventListener('keydown', onKey);
			if (onClose) onClose();
		};
		const onKey = (event) => {
			if (event.key === 'Escape') close();
		};

		closeBtn.addEventListener('click', close);
		overlay.addEventListener('click', (event) => {
			if (event.target === overlay) close();
		});
		document.addEventListener('keydown', onKey);

		const handle = { overlay, body: bodyWrap, foot, close };

		actions.forEach((action) => {
			if (action.spacer) {
				foot.appendChild(el('div', 'sb-spacer'));
				return;
			}
			const button = el('button', `sb-btn ${action.variant || ''}`, esc(action.label));
			button.addEventListener('click', () => action.onClick(handle, button));
			foot.appendChild(button);
			if (action.ref) handle[action.ref] = button;
		});

		const firstField = bodyWrap.querySelector('input, textarea');
		if (firstField) firstField.focus();

		return handle;
	}

	/* ======================================================================
	   Screen: dashboard
	   ====================================================================== */

	async function loadDashboard() {
		const data = await api('listStoryboards');
		state.storyboards = data.storyboards || [];
		state.screen = 'dashboard';
		state.storyboard = null;
		render();
	}

	function renderDashboard() {
		host.innerHTML = '';

		const bar = el('div', 'sb-topbar');
		bar.appendChild(el('div', 'sb-topbar-title', 'Storyboards'));

		const actions = el('div', 'sb-topbar-actions');
		const joinBtn = el('button', 'sb-btn', 'Join by code');
		joinBtn.addEventListener('click', openJoinModal);
		const newBtn = el('button', 'sb-btn primary', '+ New Storyboard');
		newBtn.addEventListener('click', openNewStoryboardModal);
		actions.append(joinBtn, newBtn);
		bar.appendChild(actions);
		host.appendChild(bar);

		const scroll = el('div', 'sb-scroll');

		if (!state.storyboards.length) {
			scroll.appendChild(el('div', 'sb-empty', `
				<h2>No storyboards yet</h2>
				<p>A storyboard is one argument, laid out scene by scene — a briefing,
				a recommendation, a deck you have not built yet.</p>
			`));
			const start = el('button', 'sb-btn primary', 'Create your first storyboard');
			start.addEventListener('click', openNewStoryboardModal);
			scroll.querySelector('.sb-empty').appendChild(start);
			host.appendChild(scroll);
			return;
		}

		const grid = el('div', 'sb-dash-grid');
		state.storyboards.forEach((storyboard) => grid.appendChild(buildStoryboardCard(storyboard)));
		scroll.appendChild(grid);
		host.appendChild(scroll);
	}

	function buildStoryboardCard(storyboard) {
		const card = el('div', 'sb-card');

		// One segment per scene, in the scene index's own ramp: the storyboard's
		// shape, readable before any text is parsed.
		const strip = el('div', `sb-arc-strip${storyboard.scene_count ? '' : ' empty'}`);
		const segments = Math.min(storyboard.scene_count || 0, 24) || 1;
		for (let i = 0; i < segments; i++) {
			const segment = el('span');
			if (storyboard.scene_count) segment.style.background = arcHue(i + 1);
			strip.appendChild(segment);
		}
		card.appendChild(strip);

		card.appendChild(el('div', 'sb-card-title', esc(storyboard.title)));
		if (storyboard.description) {
			card.appendChild(el('div', 'sb-card-desc', esc(storyboard.description)));
		}

		const foot = el('div', 'sb-card-foot');
		foot.appendChild(el('span', null, `${storyboard.scene_count || 0} scene${storyboard.scene_count === 1 ? '' : 's'}`));

		if (storyboard.open_comments) {
			foot.appendChild(el('span', 'sb-pill notes', `${storyboard.open_comments} open`));
		}
		// Says which storyboards cannot be exported yet without opening each one.
		if (storyboard.brief_missing?.length) {
			foot.appendChild(el('span', 'sb-pill warn', 'Brief incomplete'));
		}
		if (storyboard.access === 'stale') {
			foot.appendChild(el('span', 'sb-pill warn', 'Code changed'));
		}
		if (storyboard.status === 'archived') {
			foot.appendChild(el('span', 'sb-pill quiet', 'Archived'));
		}
		foot.appendChild(el('span', 'sb-card-role', esc(storyboard.role)));
		card.appendChild(foot);

		card.addEventListener('click', () => openStoryboard(storyboard.storyboard_id));
		return card;
	}

	/* ======================================================================
	   Screen: scene index
	   ====================================================================== */

	async function openStoryboard(storyboardId) {
		try {
			const data = await api('listScenes', { storyboard_id: storyboardId });
			state.storyboard = data.storyboard;
			state.scenes = data.scenes || [];
			state.positionToId = {};
			state.scenes.forEach((scene) => { state.positionToId[scene.position] = scene.scene_id; });
			state.screen = 'index';
			state.scene = null;
			render();
		} catch (error) {
			// A rotated code is not a failure to report and forget: it has a way
			// out, and the way out is entering the new code.
			if (error.status === 409) {
				toast(error.message, 'warning');
				openJoinModal();
			} else {
				toast(error.message, 'error');
			}
		}
	}

	function renderIndex() {
		host.innerHTML = '';
		const storyboard = state.storyboard;

		const bar = el('div', 'sb-topbar');
		const back = el('button', 'sb-btn icon-only', '←');
		back.title = 'All storyboards';
		back.addEventListener('click', () => loadDashboard().catch((e) => toast(e.message, 'error')));
		bar.appendChild(back);

		const title = el('div', `sb-topbar-title${storyboard.role === 'owner' ? ' editable' : ''}`, esc(storyboard.title));
		if (storyboard.role === 'owner') {
			title.title = 'Double-click to rename';
			title.addEventListener('dblclick', () => editStoryboardTitle(title));
		}
		bar.appendChild(title);

		const actions = el('div', 'sb-topbar-actions');

		const briefBtn = el('button', 'sb-btn', 'Brief');
		if (storyboard.brief_missing?.length) {
			briefBtn.appendChild(el('span', 'sb-pill warn', String(storyboard.brief_missing.length)));
		}
		briefBtn.addEventListener('click', () => openBriefModal());
		actions.appendChild(briefBtn);

		const exportBtn = el('button', 'sb-btn', 'Export');
		exportBtn.addEventListener('click', openExportModal);
		actions.appendChild(exportBtn);

		if (storyboard.role === 'owner') {
			const shareBtn = el('button', 'sb-btn', 'Share');
			shareBtn.addEventListener('click', openCodewordModal);
			actions.appendChild(shareBtn);
		}

		if (canWrite()) {
			const addBtn = el('button', 'sb-btn primary', '+ New Scene');
			addBtn.addEventListener('click', addScene);
			actions.appendChild(addBtn);
		}

		bar.appendChild(actions);
		host.appendChild(bar);

		const scroll = el('div', 'sb-scroll');

		if (!state.scenes.length) {
			scroll.appendChild(el('div', 'sb-empty', `
				<h2>No scenes yet</h2>
				<p>A scene is one step of the argument — a single point the audience
				should take away. Add the first one and start writing.</p>
			`));
			host.appendChild(scroll);
			return;
		}

		const grid = el('div', 'sb-scene-index');
		state.scenes.forEach((scene) => grid.appendChild(buildSceneTile(scene)));
		scroll.appendChild(grid);
		host.appendChild(scroll);

		// The miniatures have to be in the document before the fit pass can
		// measure them.
		scheduleFit(grid);
	}

	function buildSceneTile(scene) {
		const tile = el('div', 'sb-tile');
		tile.dataset.sceneId = scene.scene_id;
		tile.style.setProperty('--sb-arc', arcHue(scene.position));

		const body = el('div', 'sb-tile-body');
		body.appendChild(buildCanvas(scene, { mini: true }));
		tile.appendChild(body);

		const meta = el('div', 'sb-tile-meta');
		const num = el('span', 'sb-tile-num', String(scene.position));
		if (canWrite()) {
			num.title = isCoarsePointer() ? 'Tap to move this scene' : 'Drag to reorder';
			num.style.cursor = isCoarsePointer() ? 'pointer' : 'grab';
			num.style.touchAction = 'none';
			attachSceneReorder(num, tile, scene);
		}
		meta.appendChild(num);
		// The caption strip owns the scene's name; the miniature above does not
		// repeat it. Printing it twice was the loudest redundancy in the grid.
		meta.appendChild(el('span', 'sb-tile-title', esc(scene.title)));

		const status = el('span', 'sb-tile-status');
		if (scene.open_comments) {
			status.appendChild(el('span', 'sb-pill notes', String(scene.open_comments)));
		}
		if (scene.is_backup) {
			status.appendChild(el('span', 'sb-pill warn', 'Backup'));
		}
		meta.appendChild(status);
		tile.appendChild(meta);

		tile.addEventListener('click', (event) => {
			if (event.target.closest('.sb-tile-num')) return;
			openScene(scene.scene_id);
		});

		return tile;
	}

	async function addScene() {
		try {
			await api('createScene', { storyboard_id: state.storyboard.storyboard_id });
			await openStoryboard(state.storyboard.storyboard_id);
		} catch (error) {
			toast(error.message, 'error');
		}
	}

	/* ======================================================================
	   Screen: scene workspace
	   ====================================================================== */

	async function openScene(sceneId) {
		try {
			const [sceneData, commentData] = await Promise.all([
				api('getScene', { scene_id: sceneId }),
				api('listComments', { scene_id: sceneId, include_closed: state.showClosedNotes }),
			]);
			state.scene = sceneData.scene;
			state.positionToId = sceneData.position_to_id || state.positionToId;
			state.comments = commentData.comments || [];
			state.screen = 'scene';
			render();
		} catch (error) {
			toast(error.message, 'error');
		}
	}

	function renderScene() {
		host.innerHTML = '';
		const scene = state.scene;

		const bar = el('div', 'sb-topbar');
		const back = el('button', 'sb-btn icon-only', '←');
		back.title = 'All scenes';
		back.addEventListener('click', () => openStoryboard(state.storyboard.storyboard_id));
		bar.appendChild(back);

		bar.appendChild(el('div', 'sb-topbar-title',
			`${esc(state.storyboard.title)} <span style="color:var(--text-secondary);font-weight:400">· Scene ${scene.position}</span>`));

		const actions = el('div', 'sb-topbar-actions');

		if (canWrite()) {
			const backupBtn = el('button', `sb-btn${scene.is_backup ? ' primary' : ''}`, 'Backup');
			backupBtn.title = 'Reserve/appendix — built only if asked';
			backupBtn.addEventListener('click', async () => {
				try {
					const data = await api('updateScene', { scene_id: scene.scene_id, is_backup: !scene.is_backup });
					state.scene = data.scene;
					render();
				} catch (error) {
					toast(error.message, 'error');
				}
			});
			actions.appendChild(backupBtn);

			const deleteBtn = el('button', 'sb-btn danger', 'Delete');
			deleteBtn.addEventListener('click', deleteScene);
			actions.appendChild(deleteBtn);
		}

		const widthBtn = el('button', 'sb-btn', state.fullWidth ? 'Show notes' : 'Full width');
		widthBtn.addEventListener('click', () => {
			state.fullWidth = !state.fullWidth;
			render();
		});
		actions.appendChild(widthBtn);

		bar.appendChild(actions);
		host.appendChild(bar);

		const scroll = el('div', 'sb-scroll fixed');

		const workspace = el('div', `sb-workspace${state.fullWidth ? ' fullwidth' : ''}`);

		const stage = el('div', 'sb-canvas-stage');
		const frame = buildCanvas(scene, { mini: false });
		stage.appendChild(frame);

		// Prev/next, matching the arrows straddling the canvas edge.
		const index = state.scenes.findIndex((s) => s.scene_id === scene.scene_id);
		if (index > 0) {
			stage.appendChild(navArrow('prev', state.scenes[index - 1].scene_id));
		}
		if (index >= 0 && index < state.scenes.length - 1) {
			stage.appendChild(navArrow('next', state.scenes[index + 1].scene_id));
		}
		workspace.appendChild(stage);

		if (!state.fullWidth) {
			workspace.appendChild(buildNotesPanel());
		}

		scroll.appendChild(workspace);
		host.appendChild(scroll);

		scheduleFit(stage);
	}

	function navArrow(direction, targetSceneId) {
		const arrow = el('button', `sb-canvas-arrow ${direction}`, direction === 'prev'
			? '<svg width="26" height="42" viewBox="0 0 26 42" fill="currentColor"><path d="M22 2 4 21l18 19z"/></svg>'
			: '<svg width="26" height="42" viewBox="0 0 26 42" fill="currentColor"><path d="M4 2l18 19L4 40z"/></svg>');
		arrow.title = direction === 'prev' ? 'Previous scene' : 'Next scene';
		arrow.addEventListener('click', () => openScene(targetSceneId));
		return arrow;
	}

	async function deleteScene() {
		if (!await confirmAction('Delete this scene and everything on it?')) return;
		try {
			await api('deleteScene', { scene_id: state.scene.scene_id });
			await openStoryboard(state.storyboard.storyboard_id);
		} catch (error) {
			toast(error.message, 'error');
		}
	}

	/* ======================================================================
	   The canvas
	   ====================================================================== */

	/**
	 * Build a scene's canvas.
	 *
	 * The same function draws the workspace stage and the index miniature: one
	 * markup, one stylesheet, everything sized in cqw against the frame. That is
	 * what makes a tile a scale model of the scene rather than a crop of it.
	 */
	function buildCanvas(scene, { mini }) {
		const frame = el('div', `sb-canvas-frame${mini ? ' mini' : ''}`);
		if (mini) frame.style.setProperty('--sb-arc', arcHue(scene.position));

		const inner = el('div', 'sb-canvas-inner');

		// One deliberate departure at index size: no title. The caption strip
		// under the tile already names the scene, and drawing it twice was the
		// loudest redundant element in the grid.
		if (!mini) {
			const title = el('div', `sb-canvas-title${canWrite() ? ' editable' : ''}`, esc(scene.title));
			if (canWrite()) {
				title.title = 'Double-click to rename';
				title.addEventListener('dblclick', () => editSceneTitle(title, scene));
			}
			inner.appendChild(title);
		}

		const flow = el('div', 'sb-canvas-flow');
		const elements = scene.elements || [];

		if (!elements.length) {
			inner.appendChild(el('div', 'sb-canvas-empty', mini ? 'placeholder' : 'No content yet — placeholder scene'));
		} else {
			elements.forEach((element, index) => {
				flow.appendChild(element.type === 'text'
					? buildTextBox(element, index + 1, scene, mini)
					: buildImage(element, index + 1, scene, mini));
			});
			inner.appendChild(flow);
		}

		if (!mini && canWrite()) {
			const add = el('div', 'sb-canvas-add');

			const addText = el('button', 'sb-btn', '+ Text box');
			addText.addEventListener('click', () => addTextBox(scene));
			add.appendChild(addText);

			const addImage = el('button', 'sb-btn', '+ Image');
			addImage.addEventListener('click', () => openImageUploadModal(scene));
			// Four is the cap: past that the canvas cannot show them at a size
			// worth looking at.
			if (elements.filter((e) => e.type === 'image').length >= 4) {
				addImage.disabled = true;
				addImage.title = 'A scene holds at most four reference images';
			}
			add.appendChild(addImage);

			inner.appendChild(add);
		}

		frame.appendChild(inner);
		return frame;
	}

	function buildTextBox(element, sequence, scene, mini) {
		const box = el('div', 'sb-textbox');
		box.dataset.elementId = element.id;
		box.dataset.elementType = 'text';

		if (!mini) {
			const badge = el('span', 'sb-seq', String(sequence));
			badge.style.background = arcHue(scene.position);
			if (canWrite()) attachElementReorder(badge, box, scene);
			box.appendChild(badge);
		}

		if (element.author_name && !mini) {
			box.appendChild(el('div', 'sb-who', esc(element.author_name)));
		}

		const body = el('div', 'sb-textbox-body', withRefs(element.body || ''));
		box.appendChild(body);

		if (!mini && canWrite()) {
			const move = el('button', 'sb-el-btn move', '⇄');
			move.title = 'Move to another scene';
			move.addEventListener('click', (event) => {
				event.stopPropagation();
				openMoveElementModal(element, 'text', scene);
			});
			box.appendChild(move);

			const remove = el('button', 'sb-el-btn del', '×');
			remove.title = 'Delete this text box';
			remove.addEventListener('click', async (event) => {
				event.stopPropagation();
				if (!await confirmAction('Delete this text box?')) return;
				try {
					const data = await api('deleteText', { text_id: element.id });
					state.scene = data.scene;
					render();
				} catch (error) {
					toast(error.message, 'error');
				}
			});
			box.appendChild(remove);

			box.addEventListener('dblclick', (event) => {
				if (event.target.closest('.sb-ref')) return;
				editTextBox(box, element, scene);
			});
			box.title = 'Double-click to edit';
		}

		return box;
	}

	function buildImage(element, sequence, scene, mini) {
		const wrap = el('div', 'sb-image');
		wrap.dataset.elementId = element.id;
		wrap.dataset.elementType = 'image';

		if (!mini) {
			const badge = el('span', 'sb-seq', String(sequence));
			badge.style.background = arcHue(scene.position);
			if (canWrite()) attachElementReorder(badge, wrap, scene);
			wrap.appendChild(badge);
		}

		const body = el('div', 'sb-image-body');
		const img = el('img');
		img.src = (config().assetBase || '') + element.url;
		// The description is the alt text everywhere the image renders.
		img.alt = element.description || '';
		// A full index would otherwise pull every scene's images at once, and
		// these are the originals — nothing downscales them server-side. And an
		// <img> is natively draggable, which would hijack a tile's reorder drag.
		img.loading = 'lazy';
		img.decoding = 'async';
		img.draggable = false;
		body.appendChild(img);
		body.appendChild(el('span', 'sb-ref-tag', 'Reference only'));
		body.title = element.description || '';
		wrap.appendChild(body);

		if (!mini) {
			body.addEventListener('click', () => openImageDescriptionModal(element, scene));

			if (canWrite()) {
				const move = el('button', 'sb-el-btn move', '⇄');
				move.title = 'Move to another scene';
				move.addEventListener('click', (event) => {
					event.stopPropagation();
					openMoveElementModal(element, 'image', scene);
				});
				wrap.appendChild(move);
			}
		}

		return wrap;
	}

	async function addTextBox(scene) {
		try {
			const data = await api('createText', { scene_id: scene.scene_id, body: '' });
			state.scene = data.scene;
			render();
			// Straight into editing: an empty box is not the thing anybody wanted,
			// it is a step on the way to typing in it.
			const boxes = host.querySelectorAll('.sb-canvas-stage .sb-textbox');
			const last = boxes[boxes.length - 1];
			if (last) {
				const element = state.scene.elements.filter((e) => e.type === 'text').slice(-1)[0];
				if (element) editTextBox(last, element, state.scene);
			}
		} catch (error) {
			toast(error.message, 'error');
		}
	}

	/** Edit in place, at the canvas type size, so the box stays WYSIWYG. */
	function editTextBox(box, element, scene) {
		if (box.classList.contains('editing')) return;
		box.classList.add('editing');

		const original = box.innerHTML;
		box.innerHTML = '';

		const textarea = el('textarea');
		textarea.value = element.body || '';
		textarea.placeholder = 'Type the point this scene makes. <<3>> links to scene 3.';
		box.appendChild(textarea);
		textarea.focus();
		textarea.setSelectionRange(textarea.value.length, textarea.value.length);

		let finished = false;
		const finish = async (save) => {
			if (finished) return;
			finished = true;

			if (!save) {
				box.classList.remove('editing');
				box.innerHTML = original;
				return;
			}
			try {
				const data = await api('updateText', { text_id: element.id, body: textarea.value });
				state.scene = data.scene;
				render();
			} catch (error) {
				toast(error.message, 'error');
				box.classList.remove('editing');
				box.innerHTML = original;
			}
		};

		textarea.addEventListener('blur', () => finish(true));
		textarea.addEventListener('keydown', (event) => {
			// Enter commits; Shift+Enter is a new line, because a text box holds
			// prose and paragraph breaks are part of it.
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				finish(true);
			} else if (event.key === 'Escape') {
				event.preventDefault();
				finish(false);
			}
		});
	}

	function editSceneTitle(titleEl, scene) {
		const input = el('input', 'sb-title-input');
		input.value = scene.title;
		titleEl.replaceWith(input);
		input.focus();
		input.select();

		let finished = false;
		const finish = async (save) => {
			if (finished) return;
			finished = true;
			if (!save || !input.value.trim()) {
				render();
				return;
			}
			try {
				const data = await api('updateScene', { scene_id: scene.scene_id, title: input.value.trim() });
				state.scene = data.scene;
				const listed = state.scenes.find((s) => s.scene_id === scene.scene_id);
				if (listed) listed.title = data.scene.title;
				render();
			} catch (error) {
				toast(error.message, 'error');
				render();
			}
		};

		input.addEventListener('blur', () => finish(true));
		input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') finish(true);
			if (event.key === 'Escape') finish(false);
		});
	}

	function editStoryboardTitle(titleEl) {
		const input = el('input');
		input.className = 'sb-title-input';
		input.style.fontSize = '1rem';
		input.value = state.storyboard.title;
		titleEl.replaceWith(input);
		input.focus();
		input.select();

		let finished = false;
		const finish = async (save) => {
			if (finished) return;
			finished = true;
			if (!save || !input.value.trim()) {
				render();
				return;
			}
			try {
				const data = await api('updateStoryboard', {
					storyboard_id: state.storyboard.storyboard_id,
					title: input.value.trim(),
				});
				state.storyboard = data.storyboard;
				render();
			} catch (error) {
				toast(error.message, 'error');
				render();
			}
		};

		input.addEventListener('blur', () => finish(true));
		input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') finish(true);
			if (event.key === 'Escape') finish(false);
		});
	}

	/* ======================================================================
	   The fit pass
	   ====================================================================== */

	const MIN_SCALE = 0.3;
	const SCALE_STEP = 0.05;

	/**
	 * Shrink canvas text only as far as it takes for the whole stack — title,
	 * elements, add row — to clear the stage at whatever height the viewport
	 * currently gives it.
	 *
	 * Shared by the workspace canvas and the index miniatures, which is what
	 * makes the minis honest: same markup, same CSS, same shrink point, at a
	 * smaller container width.
	 */
	function fitCanvasText(inner, frame) {
		if (!inner || !frame) return;
		const last = inner.lastElementChild;
		const first = inner.firstElementChild;
		if (!last || !first) return;

		inner.classList.remove('overflowing');

		const style = getComputedStyle(inner);
		const padTop = parseFloat(style.paddingTop) || 0;
		const padBottom = parseFloat(style.paddingBottom) || 0;

		const apply = (scale) => inner.style.setProperty('--sb-text-scale', String(scale));
		// Measure the whole stack, not one region: every part competes for the
		// same height budget, and only the last child's foot says whether the
		// stack as a whole cleared it.
		const foot = () => last.getBoundingClientRect().bottom;
		const floor = () => inner.getBoundingClientRect().bottom - padBottom;

		apply(1);
		if (foot() <= floor() + 1) return;

		/*
		 * Jump to a close-enough scale rather than stepping down from 1.
		 *
		 * budget / needed treats the whole stack as proportional to the text
		 * scale. It is not — padding, borders, gaps and the add row are fixed —
		 * so the ratio under-shoots, which is why both loops below exist. It is a
		 * starting point, not an answer.
		 */
		const budget = inner.getBoundingClientRect().height - padTop - padBottom;
		const needed = foot() - (inner.getBoundingClientRect().top + padTop);
		const guess = needed > 0 ? budget / needed : 1;
		// Snap to the step grid so every result is one the plain loop could reach.
		const steps = Math.floor(guess / SCALE_STEP + 1e-6);
		let scale = Math.min(1, Math.max(MIN_SCALE, steps * SCALE_STEP));
		apply(scale);

		// Too big: come down until it fits.
		while (scale > MIN_SCALE && foot() > floor() + 1) {
			scale = Math.max(MIN_SCALE, scale - SCALE_STEP);
			apply(scale);
		}

		// A wall of text that will not fit even at the floor scrolls rather than
		// being clipped away by the frame — losing content is the worse failure.
		if (foot() > floor() + 1) {
			inner.classList.add('overflowing');
			return;
		}

		// Too small: climb back while the next step still fits. Without this the
		// canvas is fluid but the type never claims the room it was given.
		while (scale < 1) {
			const next = Math.min(1, scale + SCALE_STEP);
			apply(next);
			if (foot() > floor() + 1) {
				apply(scale);
				return;
			}
			scale = next;
		}
	}

	/**
	 * Fit every canvas under a root, once now and once after the webfont lands.
	 *
	 * The first pass measures with fallback metrics — Inter is still loading on a
	 * cold visit — and Inter is wider, so the stack grows after the answer was
	 * already chosen and the add row ends up half under the frame's bottom edge.
	 */
	function scheduleFit(root) {
		const fitAll = () => {
			root.querySelectorAll('.sb-canvas-frame').forEach((frame) => {
				fitCanvasText(frame.querySelector('.sb-canvas-inner'), frame);
			});
		};
		requestAnimationFrame(fitAll);
		if (document.fonts?.ready) document.fonts.ready.then(fitAll);
	}

	// Re-fit every canvas when the window changes shape. Observing the frames
	// themselves would feed back into the scaling this does to their contents.
	let resizeTimer = 0;
	window.addEventListener('resize', () => {
		if (!host || state.screen === 'dashboard') return;
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			host.querySelectorAll('.sb-canvas-frame').forEach((frame) => {
				fitCanvasText(frame.querySelector('.sb-canvas-inner'), frame);
			});
		}, 120);
	});

	/* ======================================================================
	   Reordering — drag on a pointer, move mode on touch
	   ====================================================================== */

	let moveMode = null;

	/**
	 * Reorder scenes.
	 *
	 * On a pointer this is a drag: the carried tile's own slot empties and
	 * travels with it, so the arrangement on screen is exactly what dropping
	 * commits. On touch it is an explicit mode instead — dragging inside a
	 * scrolling grid with a finger fights the scroll, and Signal's tasks board
	 * already answers this with a mode rather than a drag.
	 */
	function attachSceneReorder(handle, tile, scene) {
		if (isCoarsePointer()) {
			handle.addEventListener('click', (event) => {
				event.stopPropagation();
				startSceneMoveMode(scene);
			});
			return;
		}

		handle.addEventListener('pointerdown', (event) => {
			if (event.button !== 0) return;
			event.preventDefault();
			event.stopPropagation();
			startTileDrag(event, tile, scene);
		});
	}

	function startTileDrag(event, tile, scene) {
		const grid = tile.parentElement;
		const rect = tile.getBoundingClientRect();

		const carried = tile.cloneNode(true);
		carried.classList.add('carried');
		carried.style.width = `${rect.width}px`;
		carried.style.left = `${rect.left}px`;
		carried.style.top = `${rect.top}px`;
		document.body.appendChild(carried);

		const offsetX = event.clientX - rect.left;
		const offsetY = event.clientY - rect.top;
		tile.classList.add('slot');

		const onMove = (moveEvent) => {
			carried.style.left = `${moveEvent.clientX - offsetX}px`;
			carried.style.top = `${moveEvent.clientY - offsetY}px`;

			const under = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
			const overTile = under?.closest('.sb-tile');
			if (!overTile || overTile === tile || overTile.parentElement !== grid) return;

			const overRect = overTile.getBoundingClientRect();
			const after = moveEvent.clientX > overRect.left + overRect.width / 2;
			grid.insertBefore(tile, after ? overTile.nextSibling : overTile);
		};

		const onUp = async () => {
			document.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerup', onUp);
			carried.remove();
			tile.classList.remove('slot');

			const order = Array.from(grid.querySelectorAll('.sb-tile')).map((t) => Number(t.dataset.sceneId));
			await commitSceneOrder(order);
		};

		document.addEventListener('pointermove', onMove);
		document.addEventListener('pointerup', onUp);
	}

	async function commitSceneOrder(order) {
		const current = state.scenes.map((s) => s.scene_id);
		if (order.length === current.length && order.every((id, i) => id === current[i])) return;

		try {
			const data = await api('reorderScenes', { storyboard_id: state.storyboard.storyboard_id, order });
			state.scenes = data.scenes || [];
			state.positionToId = {};
			state.scenes.forEach((scene) => { state.positionToId[scene.position] = scene.scene_id; });
			render();
		} catch (error) {
			toast(error.message, 'error');
			openStoryboard(state.storyboard.storyboard_id);
		}
	}

	/**
	 * Touch move mode: say what is moving, show where it can land, and make
	 * every exit obvious — the banner cancels, so does Escape, so does tapping
	 * the moving scene again.
	 */
	function startSceneMoveMode(scene) {
		endMoveMode();

		const banner = el('div', 'sb-move-banner', `Moving “${esc(scene.title)}” — choose a new place`);
		const cancel = el('button', null, 'Cancel');
		cancel.addEventListener('click', endMoveMode);
		banner.appendChild(cancel);
		document.body.appendChild(banner);

		const grid = host.querySelector('.sb-scene-index');
		const tiles = Array.from(grid.querySelectorAll('.sb-tile'));
		const movingTile = tiles.find((t) => Number(t.dataset.sceneId) === scene.scene_id);
		movingTile?.classList.add('sb-moving');

		const targets = [];
		const addTarget = (beforeNode, position) => {
			const target = el('div', 'sb-drop-here', position === 0 ? 'Move to the front' : `Move here`);
			target.addEventListener('click', async () => {
				const order = state.scenes
					.map((s) => s.scene_id)
					.filter((id) => id !== scene.scene_id);
				order.splice(position, 0, scene.scene_id);
				endMoveMode();
				await commitSceneOrder(order);
			});
			grid.insertBefore(target, beforeNode);
			targets.push(target);
		};

		let position = 0;
		tiles.forEach((tile) => {
			const tileSceneId = Number(tile.dataset.sceneId);
			if (tileSceneId === scene.scene_id) return;
			// Position 0 goes before whatever is physically first, which may be
			// the tile being moved — otherwise "Move to the front" renders after
			// the very scene it would move in front of.
			addTarget(position === 0 ? grid.firstElementChild : tile, position);
			position += 1;
		});
		addTarget(null, position);

		const onKey = (event) => {
			if (event.key === 'Escape') endMoveMode();
		};
		document.addEventListener('keydown', onKey);

		moveMode = {
			cleanup() {
				banner.remove();
				movingTile?.classList.remove('sb-moving');
				targets.forEach((t) => t.remove());
				document.removeEventListener('keydown', onKey);
			},
		};
	}

	function endMoveMode() {
		if (moveMode) {
			moveMode.cleanup();
			moveMode = null;
		}
	}

	/**
	 * Reorder a scene's elements. Text boxes and images share one sequence, so
	 * the whole list is sent every time — a partial order would leave holes
	 * across the two tables.
	 */
	function attachElementReorder(handle, box, scene) {
		if (isCoarsePointer()) {
			handle.addEventListener('click', (event) => {
				event.stopPropagation();
				startElementMoveMode(box, scene);
			});
			return;
		}

		handle.addEventListener('pointerdown', (event) => {
			if (event.button !== 0) return;
			event.preventDefault();
			event.stopPropagation();
			startElementDrag(event, box, scene);
		});
	}

	function startElementDrag(event, box, scene) {
		const flow = box.parentElement;
		box.classList.add('slot');

		const onMove = (moveEvent) => {
			const under = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
			const over = under?.closest('.sb-textbox, .sb-image');
			if (!over || over === box || over.parentElement !== flow) return;

			const overRect = over.getBoundingClientRect();
			const after = moveEvent.clientY > overRect.top + overRect.height / 2
				|| moveEvent.clientX > overRect.left + overRect.width / 2;
			flow.insertBefore(box, after ? over.nextSibling : over);
		};

		const onUp = async () => {
			document.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerup', onUp);
			box.classList.remove('slot');
			await commitElementOrder(flow, scene);
		};

		document.addEventListener('pointermove', onMove);
		document.addEventListener('pointerup', onUp);
	}

	async function commitElementOrder(flow, scene) {
		const order = Array.from(flow.querySelectorAll('.sb-textbox, .sb-image')).map((node) => ({
			type: node.dataset.elementType,
			id: Number(node.dataset.elementId),
		}));

		const current = (scene.elements || []).map((e) => `${e.type}:${e.id}`).join(',');
		if (order.map((e) => `${e.type}:${e.id}`).join(',') === current) return;

		try {
			const data = await api('reorderElements', { scene_id: scene.scene_id, order });
			state.scene = data.scene;
			render();
		} catch (error) {
			toast(error.message, 'error');
			openScene(scene.scene_id);
		}
	}

	function startElementMoveMode(box, scene) {
		endMoveMode();

		const banner = el('div', 'sb-move-banner', 'Moving this element — choose a new place');
		const cancel = el('button', null, 'Cancel');
		cancel.addEventListener('click', endMoveMode);
		banner.appendChild(cancel);
		document.body.appendChild(banner);

		box.classList.add('sb-moving');
		const flow = box.parentElement;
		const boxes = Array.from(flow.querySelectorAll('.sb-textbox, .sb-image'));

		const targets = [];
		const addTarget = (beforeNode) => {
			const target = el('div', 'sb-drop-here', 'Move here');
			target.style.flex = '1 1 100%';
			target.addEventListener('click', async () => {
				flow.insertBefore(box, beforeNode);
				endMoveMode();
				await commitElementOrder(flow, scene);
			});
			flow.insertBefore(target, beforeNode);
			targets.push(target);
		};

		boxes.forEach((node) => {
			if (node !== box) addTarget(node);
		});
		addTarget(null);

		const onKey = (event) => {
			if (event.key === 'Escape') endMoveMode();
		};
		document.addEventListener('keydown', onKey);

		moveMode = {
			cleanup() {
				banner.remove();
				box.classList.remove('sb-moving');
				targets.forEach((t) => t.remove());
				document.removeEventListener('keydown', onKey);
			},
		};
	}

	/* ======================================================================
	   Team Notes
	   ====================================================================== */

	function buildNotesPanel() {
		const panel = el('div', 'sb-notes');

		const head = el('div', 'sb-notes-head', '<h3>Team Notes</h3>');
		const toggle = el('button', 'sb-btn icon-only', state.showClosedNotes ? 'Hide closed' : 'Show closed');
		toggle.style.fontSize = '0.72rem';
		toggle.addEventListener('click', async () => {
			state.showClosedNotes = !state.showClosedNotes;
			await reloadComments();
		});
		head.appendChild(toggle);
		panel.appendChild(head);

		const list = el('div', 'sb-notes-list');
		if (!state.comments.length) {
			list.appendChild(el('div', 'sb-hint', 'No notes on this scene yet.'));
		} else {
			state.comments.forEach((comment) => list.appendChild(buildNote(comment)));
		}
		panel.appendChild(list);

		const compose = el('div', 'sb-note-compose');
		const textarea = el('textarea');
		textarea.placeholder = 'Add a note. <<3>> links to scene 3.';
		compose.appendChild(textarea);

		const post = el('button', 'sb-btn primary', 'Add note');
		post.style.marginTop = '0.4rem';
		post.addEventListener('click', async () => {
			const body = textarea.value.trim();
			if (!body) return;
			try {
				const data = await api('createComment', {
					scene_id: state.scene.scene_id,
					body,
					include_closed: state.showClosedNotes,
				});
				state.comments = data.comments || [];
				render();
			} catch (error) {
				toast(error.message, 'error');
			}
		});
		compose.appendChild(post);
		panel.appendChild(compose);

		return panel;
	}

	function buildNote(comment) {
		const note = el('div', `sb-note${comment.status === 'closed' ? ' closed' : ''}${comment.is_action_item ? ' action' : ''}`);

		const head = el('div', 'sb-note-head');
		head.appendChild(el('span', 'sb-note-author', esc(comment.author_name)));
		head.appendChild(el('span', null, relativeTime(comment.created_at)));
		if (comment.is_action_item) {
			head.appendChild(el('span', 'sb-pill warn', comment.action_owner ? esc(comment.action_owner) : 'Action'));
		}
		note.appendChild(head);

		note.appendChild(el('div', 'sb-note-body', withRefs(comment.body)));

		const actions = el('div', 'sb-note-actions');

		// Closing is a review action the whole team takes, not the author's
		// alone: a note is resolved by whoever resolved it.
		const closeBtn = el('button', null, comment.status === 'closed' ? 'Reopen' : 'Close');
		closeBtn.addEventListener('click', () => patchComment(comment.comment_id, {
			status: comment.status === 'closed' ? 'open' : 'closed',
		}));
		actions.appendChild(closeBtn);

		const actionBtn = el('button', null, comment.is_action_item ? 'Not an action' : 'Action item');
		actionBtn.addEventListener('click', async () => {
			if (comment.is_action_item) {
				await patchComment(comment.comment_id, { is_action_item: false, action_owner: '' });
				return;
			}
			// Flagging an action item reveals the one thing that makes it useful:
			// who owns it.
			const owner = window.prompt('Who owns this action? (optional)') || '';
			await patchComment(comment.comment_id, { is_action_item: true, action_owner: owner });
		});
		actions.appendChild(actionBtn);

		if (comment.is_mine) {
			const editBtn = el('button', null, 'Edit');
			editBtn.addEventListener('click', () => editNote(note, comment));
			actions.appendChild(editBtn);

			const deleteBtn = el('button', null, 'Delete');
			deleteBtn.addEventListener('click', async () => {
				if (!await confirmAction('Delete this note?')) return;
				try {
					const data = await api('deleteComment', {
						comment_id: comment.comment_id,
						include_closed: state.showClosedNotes,
					});
					state.comments = data.comments || [];
					render();
				} catch (error) {
					toast(error.message, 'error');
				}
			});
			actions.appendChild(deleteBtn);
		}

		note.appendChild(actions);
		return note;
	}

	function editNote(note, comment) {
		const original = note.innerHTML;
		note.innerHTML = '';

		const textarea = el('textarea');
		textarea.value = comment.body;
		note.appendChild(textarea);
		textarea.focus();

		const actions = el('div', 'sb-note-actions');
		const save = el('button', null, 'Save');
		save.addEventListener('click', async () => {
			await patchComment(comment.comment_id, { body: textarea.value.trim() });
		});
		const cancel = el('button', null, 'Cancel');
		cancel.addEventListener('click', () => { note.innerHTML = original; render(); });
		actions.append(save, cancel);
		note.appendChild(actions);
	}

	async function patchComment(commentId, changes) {
		try {
			const data = await api('updateComment', {
				comment_id: commentId,
				include_closed: state.showClosedNotes,
				...changes,
			});
			state.comments = data.comments || [];
			render();
		} catch (error) {
			toast(error.message, 'error');
		}
	}

	async function reloadComments() {
		try {
			const data = await api('listComments', {
				scene_id: state.scene.scene_id,
				include_closed: state.showClosedNotes,
			});
			state.comments = data.comments || [];
			render();
		} catch (error) {
			toast(error.message, 'error');
		}
	}

	/* ======================================================================
	   Modals: create, join, share
	   ====================================================================== */

	function openNewStoryboardModal() {
		const form = el('div', null, `
			<div class="sb-field">
				<label for="sb-new-title">Title</label>
				<input id="sb-new-title" type="text" maxlength="255" placeholder="Asia → Supply chain hub">
			</div>
			<div class="sb-field">
				<label for="sb-new-desc">Description</label>
				<textarea id="sb-new-desc" rows="3" placeholder="One line on what this storyboard argues."></textarea>
				<span class="sb-hint">Optional. It heads the exported brief as the storyboard overview.</span>
			</div>
		`);

		const modal = openModal({
			title: 'New Storyboard',
			body: form,
			actions: [
				{ spacer: true },
				{ label: 'Cancel', onClick: (handle) => handle.close() },
				{
					label: 'Create', variant: 'primary',
					onClick: async (handle, button) => {
						const title = form.querySelector('#sb-new-title').value.trim();
						if (!title) {
							toast('A storyboard needs a title.', 'error');
							return;
						}
						button.disabled = true;
						try {
							const data = await api('createStoryboard', {
								title,
								description: form.querySelector('#sb-new-desc').value.trim(),
							});
							handle.close();
							await openStoryboard(data.storyboard.storyboard_id);
						} catch (error) {
							button.disabled = false;
							toast(error.message, 'error');
						}
					},
				},
			],
		});

		return modal;
	}

	/**
	 * Join by code, in two steps: see what the code opens before committing.
	 *
	 * A codeword belongs to one storyboard, not to the app — this screen is what
	 * makes that visible, and what catches a mistyped or rotated code before you
	 * are standing inside someone else's work.
	 */
	function openJoinModal() {
		const form = el('div', null, `
			<div class="sb-field">
				<label for="sb-join-code">Access code</label>
				<input id="sb-join-code" type="text" autocomplete="off" placeholder="latam-amber-quartz">
				<span class="sb-hint">The code the storyboard's owner shared with you.</span>
			</div>
			<div id="sb-join-preview"></div>
		`);

		const modal = openModal({
			title: 'Join a storyboard',
			body: form,
			width: '26rem',
			actions: [
				{ spacer: true },
				{ label: 'Cancel', onClick: (handle) => handle.close() },
				{ label: 'Look up', variant: 'primary', ref: 'go', onClick: lookup },
			],
		});

		let found = null;

		async function lookup(handle, button) {
			const code = form.querySelector('#sb-join-code').value.trim();
			if (!code) return;

			if (found) {
				button.disabled = true;
				try {
					const data = await api('joinByCode', { code });
					handle.close();
					await loadDashboard();
					await openStoryboard(data.storyboard.storyboard_id);
					toast(`Joined “${data.storyboard.title}”.`, 'success');
				} catch (error) {
					button.disabled = false;
					toast(error.message, 'error');
				}
				return;
			}

			button.disabled = true;
			try {
				found = await api('lookupCode', { code });
				form.querySelector('#sb-join-preview').innerHTML = `
					<div class="sb-card" style="cursor:default">
						<div class="sb-card-title">${esc(found.title)}</div>
						<div class="sb-card-foot">
							<span>${found.scene_count} scene${found.scene_count === 1 ? '' : 's'}</span>
							<span>shared by ${esc(found.owner_name)}</span>
							<span class="sb-card-role">joins as ${esc(found.join_role)}</span>
						</div>
					</div>
					${found.already_member ? '<p class="sb-hint">You are already on this storyboard.</p>' : ''}
				`;
				button.textContent = found.already_member ? 'Open' : 'Join';
				button.disabled = false;
			} catch (error) {
				found = null;
				button.disabled = false;
				form.querySelector('#sb-join-preview').innerHTML = '';
				toast(error.message, 'error');
			}
		}

		form.querySelector('#sb-join-code').addEventListener('keydown', (event) => {
			if (event.key === 'Enter') modal.go.click();
		});
		// Retyping the code means looking it up again, not joining whatever the
		// previous lookup found.
		form.querySelector('#sb-join-code').addEventListener('input', () => {
			found = null;
			modal.go.textContent = 'Look up';
			form.querySelector('#sb-join-preview').innerHTML = '';
		});

		return modal;
	}

	/**
	 * The codeword panel.
	 *
	 * States plainly what the code is: a shared meeting-level secret, not a
	 * password. It is stored readable so the owner can share it, and it is
	 * protected by rate-limited joins, entropy, and how easy it is to rotate.
	 */
	async function openCodewordModal() {
		const body = el('div');
		body.innerHTML = '<div class="sb-hint">Loading…</div>';

		const modal = openModal({
			title: 'Share this storyboard',
			body,
			width: '30rem',
			actions: [{ spacer: true }, { label: 'Done', onClick: (handle) => handle.close() }],
		});

		/*
		 * Reads state.storyboard on every repaint rather than closing over it.
		 * Rotating replaces that object, so a captured reference would keep
		 * showing the code that was just retired — the one screen where being a
		 * repaint behind is worst, because the whole point is reading out the new
		 * code to share it.
		 */
		const paint = async () => {
			const storyboard = state.storyboard;
			const { members } = await api('listMembers', { storyboard_id: storyboard.storyboard_id });
			const inviteUrl = `${window.location.origin}/sb/?code=${encodeURIComponent(storyboard.access_code || '')}`;

			body.innerHTML = '';

			if (!storyboard.access_code) {
				body.appendChild(el('p', 'sb-hint',
					'This storyboard is closed. Nobody can join, and everyone but you is frozen out until you set a new code.'));
			} else {
				body.appendChild(el('div', 'sb-field', '<label>Access code</label>'));
				body.appendChild(el('div', 'sb-code', esc(storyboard.access_code)));

				const linkRow = el('div', 'sb-field');
				linkRow.style.marginTop = '0.6rem';
				linkRow.innerHTML = '<label>Invite link</label>';
				const link = el('div', 'sb-code', esc(inviteUrl));
				link.style.fontSize = '0.75rem';
				linkRow.appendChild(link);
				body.appendChild(linkRow);

				const copyRow = el('div', 'sb-topbar-actions');
				copyRow.style.margin = '0.5rem 0 0.9rem';
				const copyCode = el('button', 'sb-btn', 'Copy code');
				copyCode.addEventListener('click', () => copyText(storyboard.access_code, 'Code copied.'));
				const copyLink = el('button', 'sb-btn', 'Copy link');
				copyLink.addEventListener('click', () => copyText(inviteUrl, 'Invite link copied.'));
				copyRow.append(copyCode, copyLink);
				body.appendChild(copyRow);

				body.appendChild(el('p', 'sb-hint',
					'The code is a shared, meeting-level secret rather than a password — anyone who has it can join. '
					+ 'Rotate it to lock out everyone who joined under the old one, or close the storyboard to stop all access.'));
			}

			const joinRole = el('div', 'sb-field');
			joinRole.style.marginTop = '0.9rem';
			joinRole.innerHTML = `
				<label for="sb-join-role">People who use this code join as</label>
				<select id="sb-join-role">
					<option value="editor"${storyboard.join_role === 'editor' ? ' selected' : ''}>Editor — can write</option>
					<option value="viewer"${storyboard.join_role === 'viewer' ? ' selected' : ''}>Viewer — can read and comment</option>
				</select>
			`;
			joinRole.querySelector('select').addEventListener('change', async (event) => {
				try {
					const data = await api('updateStoryboard', {
						storyboard_id: storyboard.storyboard_id,
						join_role: event.target.value,
					});
					state.storyboard = data.storyboard;
					toast('New joiners will be ' + event.target.value + 's.', 'success');
				} catch (error) {
					toast(error.message, 'error');
				}
			});
			body.appendChild(joinRole);

			const controls = el('div', 'sb-topbar-actions');
			controls.style.margin = '0.6rem 0 1rem';

			const rotate = el('button', 'sb-btn', storyboard.access_code ? 'Rotate code' : 'Open with a new code');
			rotate.addEventListener('click', async () => {
				if (storyboard.access_code
					&& !await confirmAction('Rotate the code? Everyone who joined with the old one is locked out until they enter the new one.')) {
					return;
				}
				try {
					const data = await api('rotateCode', { storyboard_id: storyboard.storyboard_id });
					state.storyboard = data.storyboard;
					toast(data.locked_out
						? `New code set. ${data.locked_out} collaborator${data.locked_out === 1 ? '' : 's'} will need it.`
						: 'New code set.', 'success');
					await paint();
				} catch (error) {
					toast(error.message, 'error');
				}
			});
			controls.appendChild(rotate);

			if (storyboard.access_code) {
				const close = el('button', 'sb-btn danger', 'Close storyboard');
				close.addEventListener('click', async () => {
					if (!await confirmAction('Close this storyboard? Nobody but you will be able to open it.')) return;
					try {
						const data = await api('deactivateCode', { storyboard_id: storyboard.storyboard_id });
						state.storyboard = data.storyboard;
						toast('Storyboard closed.', 'success');
						await paint();
					} catch (error) {
						toast(error.message, 'error');
					}
				});
				controls.appendChild(close);
			}
			body.appendChild(controls);

			body.appendChild(el('div', 'sb-field', `<label>People (${members.length})</label>`));
			members.forEach((member) => body.appendChild(buildMemberRow(member, storyboard)));
		};

		try {
			await paint();
		} catch (error) {
			body.innerHTML = `<p class="sb-hint">${esc(error.message)}</p>`;
		}

		return modal;
	}

	function buildMemberRow(member, storyboard) {
		const row = el('div', 'sb-member-row');

		const name = el('span', 'sb-member-name', esc(member.display_name));
		if (member.is_guest) name.appendChild(el('span', 'sb-pill quiet', 'Guest'));
		// Says who a rotation actually affected, rather than leaving the owner to
		// guess who still needs the new code.
		if (member.stale) name.appendChild(el('span', 'sb-pill warn', 'Needs new code'));
		row.appendChild(name);

		if (member.role === 'owner') {
			row.appendChild(el('span', 'sb-pill quiet', 'Owner'));
			return row;
		}

		const select = el('select');
		select.style.fontSize = '0.78rem';
		select.innerHTML = `
			<option value="editor"${member.role === 'editor' ? ' selected' : ''}>Editor</option>
			<option value="viewer"${member.role === 'viewer' ? ' selected' : ''}>Viewer</option>
		`;
		select.addEventListener('change', async () => {
			try {
				await api('updateMember', {
					storyboard_id: storyboard.storyboard_id,
					participant_id: member.participant_id,
					role: select.value,
				});
				toast(`${member.display_name} is now a ${select.value}.`, 'success');
			} catch (error) {
				toast(error.message, 'error');
			}
		});
		row.appendChild(select);

		return row;
	}

	function copyText(text, message) {
		if (navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(text).then(() => toast(message, 'success'))
				.catch(() => toast('Could not copy — select it by hand.', 'error'));
		} else {
			toast('Copying is not available here — select it by hand.', 'warning');
		}
	}

	/* ======================================================================
	   Modals: the delivery brief
	   ====================================================================== */

	/**
	 * The brief says what situation the scenes land in.
	 *
	 * Short answers pair off two-up and the three that need room span the full
	 * width; the still-needed count sits in the pinned action row rather than at
	 * the top of the form, because progress is worth seeing while filling it in.
	 */
	async function openBriefModal(flagged = []) {
		if (!state.briefFields) {
			try {
				const data = await api('getBriefSchema');
				state.briefFields = data.fields || [];
			} catch (error) {
				toast(error.message, 'error');
				return;
			}
		}

		const storyboard = state.storyboard;
		const grid = el('div', 'sb-brief-grid');

		state.briefFields.forEach((field) => {
			const wrap = el('div', `sb-field${field.multiline ? ' wide' : ''}${flagged.includes(field.label) ? ' flagged' : ''}`);
			const id = `sb-brief-${field.key}`;
			const value = esc(storyboard[field.key] || '');

			wrap.innerHTML = `
				<label for="${id}">${esc(field.label)}${field.required ? '' : ' <span class="sb-hint">optional</span>'}</label>
				${field.multiline
					? `<textarea id="${id}" rows="2" placeholder="${esc(field.placeholder)}">${value}</textarea>`
					: `<input id="${id}" type="text" value="${value}" placeholder="${esc(field.placeholder)}">`}
				<span class="sb-hint">${esc(field.hint)}</span>
			`;
			grid.appendChild(wrap);
		});

		const modal = openModal({
			title: 'Delivery brief',
			body: grid,
			width: '38rem',
			actions: [
				{ label: '', ref: 'progress', onClick: () => {} },
				{ spacer: true },
				{ label: 'Cancel', onClick: (handle) => handle.close() },
				{
					label: 'Save', variant: 'primary',
					onClick: async (handle, button) => {
						const payload = { storyboard_id: storyboard.storyboard_id };
						state.briefFields.forEach((field) => {
							payload[field.key] = grid.querySelector(`#sb-brief-${field.key}`).value.trim();
						});
						button.disabled = true;
						try {
							const data = await api('updateBrief', payload);
							state.storyboard = data.storyboard;
							handle.close();
							render();
							toast(data.storyboard.brief_missing.length
								? `Saved. ${data.storyboard.brief_missing.length} still needed before export.`
								: 'Brief complete — this storyboard can be exported.', 'success');
						} catch (error) {
							button.disabled = false;
							toast(error.message, 'error');
						}
					},
				},
			],
		});

		// The count lives in the action row and updates as answers are typed.
		const progress = modal.progress;
		progress.style.cursor = 'default';
		progress.style.border = 'none';
		progress.style.background = 'none';
		const updateProgress = () => {
			const missing = state.briefFields.filter((field) =>
				field.required && !grid.querySelector(`#sb-brief-${field.key}`).value.trim());
			progress.textContent = missing.length
				? `${missing.length} still needed`
				: 'All required answers given';
			progress.style.color = missing.length ? 'var(--sb-warn)' : 'var(--text-secondary)';
		};
		grid.addEventListener('input', updateProgress);
		updateProgress();

		return modal;
	}

	/* ======================================================================
	   Modals: export
	   ====================================================================== */

	function openExportModal() {
		const body = el('div', null, `
			<div class="sb-field">
				<label for="sb-export-scope">Scenes to include</label>
				<select id="sb-export-scope">
					<option value="all">Every scene</option>
					<option value="exclude_backup">Skip the backup scenes</option>
				</select>
			</div>
			<div class="sb-field">
				<label><input type="checkbox" id="sb-export-notes" checked style="width:auto;margin-right:0.4rem">
				Include open review notes</label>
				<span class="sb-hint">They travel as context around each scene, clearly marked as
				discussion rather than content to render.</span>
			</div>
			<div id="sb-export-result"></div>
		`);

		const modal = openModal({
			title: 'Export build brief',
			body,
			width: '40rem',
			actions: [
				{ spacer: true },
				{ label: 'Close', onClick: (handle) => handle.close() },
				{ label: 'Generate', variant: 'primary', ref: 'go', onClick: generate },
			],
		});

		async function generate(handle, button) {
			button.disabled = true;
			try {
				const data = await api('exportStoryboard', {
					storyboard_id: state.storyboard.storyboard_id,
					scope: body.querySelector('#sb-export-scope').value,
					include_notes: body.querySelector('#sb-export-notes').checked,
				});

				const result = body.querySelector('#sb-export-result');
				result.innerHTML = '';
				const preview = el('pre', 'sb-export-preview', esc(data.content));
				result.appendChild(preview);

				const row = el('div', 'sb-topbar-actions');
				row.style.marginTop = '0.6rem';

				const download = el('button', 'sb-btn primary', 'Download .md');
				download.addEventListener('click', () => downloadText(data.filename, data.content));
				row.appendChild(download);

				const copy = el('button', 'sb-btn', 'Copy');
				copy.addEventListener('click', () => copyText(data.content, 'Brief copied.'));
				row.appendChild(copy);

				result.appendChild(row);
				button.disabled = false;
			} catch (error) {
				button.disabled = false;
				// The refusal carries the way out: hand over to the brief with the
				// missing answers flagged rather than just naming them.
				if (error.status === 409 && error.data?.missing) {
					handle.close();
					toast(error.message, 'warning');
					openBriefModal(error.data.missing);
					return;
				}
				toast(error.message, 'error');
			}
		}

		return modal;
	}

	function downloadText(filename, content) {
		const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = el('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	}

	/* ======================================================================
	   Modals: images
	   ====================================================================== */

	/**
	 * Adding a reference image asks for its description first, and will not take
	 * the image without one. The description is the alt-text, the tooltip, and
	 * the only thing the exported brief can tell an agent about what the image
	 * shows — an unlabelled screenshot is nearly useless to whoever builds from
	 * the brief.
	 */
	function openImageUploadModal(scene) {
		const body = el('div', null, `
			<div class="sb-field">
				<label for="sb-image-file">Image</label>
				<input id="sb-image-file" type="file" accept="image/png,image/jpeg,image/gif,image/webp">
				<span class="sb-hint">Up to 5 MB. Marked on the canvas as reference only, not final content.</span>
			</div>
			<div class="sb-field">
				<label for="sb-image-desc">What does it show?</label>
				<textarea id="sb-image-desc" rows="3"
					placeholder="Bookings-by-account bar chart, sorted descending, with the total called out at the right."></textarea>
				<span class="sb-hint">Required. This becomes the alt text and the image's label in the export.</span>
			</div>
		`);

		return openModal({
			title: 'Add a reference image',
			body,
			actions: [
				{ spacer: true },
				{ label: 'Cancel', onClick: (handle) => handle.close() },
				{
					label: 'Add', variant: 'primary',
					onClick: async (handle, button) => {
						const file = body.querySelector('#sb-image-file').files[0];
						const description = body.querySelector('#sb-image-desc').value.trim();

						if (!file) {
							toast('Choose an image first.', 'error');
							return;
						}
						if (!description) {
							toast('The description is required — it is what the export tells an agent.', 'error');
							return;
						}

						const formData = new FormData();
						formData.append('module', 'storyboards');
						formData.append('action', 'uploadImage');
						formData.append('data', JSON.stringify({ scene_id: scene.scene_id, description }));
						formData.append('image', file);

						button.disabled = true;
						try {
							const data = await api('uploadImage', null, { formData });
							state.scene = data.scene;
							handle.close();
							render();
						} catch (error) {
							button.disabled = false;
							toast(error.message, 'error');
						}
					},
				},
			],
		});
	}

	function openImageDescriptionModal(element, scene) {
		const body = el('div');
		const img = el('img');
		img.src = (config().assetBase || '') + element.url;
		img.alt = element.description || '';
		img.style.cssText = 'max-width:100%;max-height:14rem;display:block;margin:0 auto 0.8rem;border-radius:0.4rem';
		body.appendChild(img);

		const field = el('div', 'sb-field', `
			<label for="sb-desc-edit">What does it show?</label>
			<textarea id="sb-desc-edit" rows="3">${esc(element.description || '')}</textarea>
			<span class="sb-hint">Saving this empty is not allowed — it is the image's alt text and its label in the export.</span>
		`);
		body.appendChild(field);

		const actions = [
			{ spacer: true },
			{ label: 'Cancel', onClick: (handle) => handle.close() },
		];

		if (canWrite()) {
			actions.splice(0, 0, {
				label: 'Delete image', variant: 'danger',
				onClick: async (handle) => {
					if (!await confirmAction('Delete this reference image?')) return;
					try {
						const data = await api('deleteImage', { asset_id: element.id });
						state.scene = data.scene;
						handle.close();
						render();
					} catch (error) {
						toast(error.message, 'error');
					}
				},
			});
			actions.push({
				label: 'Save', variant: 'primary',
				onClick: async (handle, button) => {
					const description = body.querySelector('#sb-desc-edit').value.trim();
					if (!description) {
						toast('A description is required.', 'error');
						return;
					}
					button.disabled = true;
					try {
						const data = await api('updateImage', { asset_id: element.id, description });
						state.scene = data.scene;
						handle.close();
						render();
					} catch (error) {
						button.disabled = false;
						toast(error.message, 'error');
					}
				},
			});
		}

		return openModal({ title: 'Reference image', body, actions });
	}

	function openMoveElementModal(element, type, scene) {
		const others = state.scenes.filter((s) => s.scene_id !== scene.scene_id);
		if (!others.length) {
			toast('There is nowhere else to move it — this storyboard has one scene.', 'warning');
			return;
		}

		const body = el('div', null, `
			<div class="sb-field">
				<label for="sb-move-target">Move to</label>
				<select id="sb-move-target">
					${others.map((s) => `<option value="${s.scene_id}">Scene ${s.position} — ${esc(s.title)}</option>`).join('')}
				</select>
				<span class="sb-hint">It lands at the end of that scene's sequence.</span>
			</div>
		`);

		return openModal({
			title: 'Move to another scene',
			body,
			width: '26rem',
			actions: [
				{ spacer: true },
				{ label: 'Cancel', onClick: (handle) => handle.close() },
				{
					label: 'Move', variant: 'primary',
					onClick: async (handle, button) => {
						button.disabled = true;
						try {
							const data = await api('moveElement', {
								scene_id: scene.scene_id,
								target_scene_id: Number(body.querySelector('#sb-move-target').value),
								element_id: element.id,
								element_type: type,
							});
							state.scene = data.scene;
							handle.close();
							render();
						} catch (error) {
							button.disabled = false;
							toast(error.message, 'error');
						}
					},
				},
			],
		});
	}

	/* ======================================================================
	   Modals: the frameworks reference
	   ====================================================================== */

	/**
	 * Frameworks are reading material, not scaffolding: this modal seeds nothing
	 * and writes nothing. Its whole job is to refresh an author's memory
	 * mid-draft, and then get out of the way.
	 */
	async function openFrameworksModal() {
		const body = el('div', null, '<div class="sb-hint">Loading…</div>');
		const modal = openModal({ title: 'Communication frameworks', body, width: '38rem' });

		if (!state.frameworks) {
			try {
				const data = await api('getFrameworks');
				state.frameworks = data.frameworks || [];
			} catch (error) {
				body.innerHTML = `<p class="sb-hint">${esc(error.message)}</p>`;
				return modal;
			}
		}

		const showList = () => {
			body.innerHTML = '';
			modal.overlay.querySelector('.sb-modal-head h2').textContent = 'Communication frameworks';

			const list = el('div', 'sb-framework-list');
			state.frameworks.forEach((framework) => {
				const button = el('button', null, `
					<span class="sb-fw-name">${esc(framework.name)}${framework.expansion ? ` <span class="sb-hint">(${esc(framework.expansion)})</span>` : ''}</span>
					<span class="sb-fw-summary">${esc(framework.summary || framework.full_name || '')}</span>
				`);
				button.addEventListener('click', () => showDetail(framework));
				list.appendChild(button);
			});
			body.appendChild(list);
		};

		const showDetail = (framework) => {
			body.innerHTML = '';
			modal.overlay.querySelector('.sb-modal-head h2').textContent = framework.name;

			const back = el('button', 'sb-btn', '← All frameworks');
			back.style.marginBottom = '0.8rem';
			back.addEventListener('click', showList);
			body.appendChild(back);

			const detail = el('div', 'sb-fw-detail');
			// Executive summary on top: the thing an author mid-draft actually
			// came for.
			if (framework.summary) detail.appendChild(el('p', null, esc(framework.summary)));

			if (framework.components?.length) {
				detail.appendChild(el('h3', null, 'Components'));
				detail.appendChild(el('ol', null, framework.components.map((c) => `<li>${esc(c)}</li>`).join('')));
			}
			if (framework.when_to_use) {
				detail.appendChild(el('h3', null, 'When to use it'));
				detail.appendChild(el('p', null, esc(framework.when_to_use)));
			}
			if (framework.when_not_to_use) {
				detail.appendChild(el('h3', null, 'When not to'));
				detail.appendChild(el('p', null, esc(framework.when_not_to_use)));
			}
			if (framework.example) {
				detail.appendChild(el('h3', null, 'Example'));
				detail.appendChild(el('p', null, esc(framework.example)));
			}
			if (framework.sources?.length) {
				detail.appendChild(el('h3', null, 'Sources'));
				detail.appendChild(el('ul', null, framework.sources.map((s) => `<li>${esc(s)}</li>`).join('')));
			}
			body.appendChild(detail);
		};

		showList();
		return modal;
	}

	/* ======================================================================
	   Render dispatch and entry point
	   ====================================================================== */

	function render() {
		if (!host) return;
		endMoveMode();

		if (state.screen === 'dashboard') renderDashboard();
		else if (state.screen === 'index') renderIndex();
		else if (state.screen === 'scene') renderScene();

		// One listener for every cross-reference on the screen, wherever it was
		// rendered — canvas text and review notes both carry them.
		host.querySelectorAll('.sb-ref').forEach((ref) => {
			ref.addEventListener('click', (event) => {
				event.stopPropagation();
				openScene(Number(ref.dataset.scene));
			});
		});
	}

	/** Lazy entry point, called by ViewManager when the tab is opened. */
	window.initStoryboardsView = function initStoryboardsView() {
		host = document.getElementById('storyboards-view');
		if (!host) return;

		if (initialized) {
			// Coming back to the tab: refresh, because someone else may have been
			// writing while it was in the background.
			refreshCurrentScreen();
			return;
		}
		initialized = true;

		host.innerHTML = '<div class="sb-loading">Loading Storyboards…</div>';
		loadDashboard().then(() => {
			// An invite link followed by someone who is already signed in lands
			// here rather than in the guest shell, with the code in the hash: the
			// storyboard should join their own dashboard, not a throwaway guest
			// identity.
			const pending = pendingInviteCode();
			if (pending) {
				history.replaceState(null, '', window.location.pathname + window.location.search);
				const modal = openJoinModal();
				const field = modal.overlay.querySelector('#sb-join-code');
				field.value = pending;
				modal.go.click();
			}
		}).catch((error) => {
			host.innerHTML = `<div class="sb-empty"><h2>Storyboards is unavailable</h2><p>${esc(error.message)}</p></div>`;
		});

		document.getElementById('btn-sb-frameworks')?.addEventListener('click', openFrameworksModal);
		document.getElementById('btn-sb-menu')?.addEventListener('click', openStoryboardMenu);
	};

	function refreshCurrentScreen() {
		if (state.screen === 'scene' && state.scene) openScene(state.scene.scene_id);
		else if (state.screen === 'index' && state.storyboard) openStoryboard(state.storyboard.storyboard_id);
		else loadDashboard().catch((error) => toast(error.message, 'error'));
	}

	/** The footer's options menu, matching where Tasks and Journal keep theirs. */
	function openStoryboardMenu() {
		const body = el('div');

		const addRow = (label, onClick, variant) => {
			const button = el('button', `sb-btn ${variant || ''}`, esc(label));
			button.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:0.4rem';
			button.addEventListener('click', () => { modal.close(); onClick(); });
			body.appendChild(button);
		};

		const modal = openModal({ title: 'Storyboard options', body, width: '22rem' });

		addRow('Communication frameworks', openFrameworksModal);
		addRow('All storyboards', () => loadDashboard().catch((e) => toast(e.message, 'error')));

		if (state.storyboard) {
			addRow('Delivery brief', () => openBriefModal());
			addRow('Export build brief', openExportModal);

			if (state.storyboard.role === 'owner') {
				addRow('Share and access', openCodewordModal);
				addRow(state.storyboard.status === 'archived' ? 'Restore this storyboard' : 'Archive this storyboard', async () => {
					try {
						const data = await api('updateStoryboard', {
							storyboard_id: state.storyboard.storyboard_id,
							status: state.storyboard.status === 'archived' ? 'active' : 'archived',
						});
						state.storyboard = data.storyboard;
						toast(data.storyboard.status === 'archived' ? 'Storyboard archived.' : 'Storyboard restored.', 'success');
						render();
					} catch (error) {
						toast(error.message, 'error');
					}
				});
				addRow('Delete this storyboard', async () => {
					if (!await confirmAction('Delete this storyboard, its scenes and everything on them? This cannot be undone.')) return;
					try {
						await api('deleteStoryboard', { storyboard_id: state.storyboard.storyboard_id });
						toast('Storyboard deleted.', 'success');
						await loadDashboard();
					} catch (error) {
						toast(error.message, 'error');
					}
				}, 'danger');
			}
		}

		return modal;
	}

	function pendingInviteCode() {
		const match = /^#join=(.+)$/.exec(window.location.hash || '');
		return match ? decodeURIComponent(match[1]) : '';
	}

	/*
	 * An invite link opened by a signed-in user redirects to the app with the
	 * code in the hash. The tab bar restores whichever view they were last on,
	 * so switching to Storyboards has to be asked for explicitly — otherwise the
	 * invite silently does nothing behind the Tasks board.
	 */
	document.addEventListener('DOMContentLoaded', () => {
		if (!pendingInviteCode()) return;
		const switchToTab = () => {
			if (window.viewManager) window.viewManager.switchView('storyboards');
			else setTimeout(switchToTab, 100);
		};
		switchToTab();
	});
})();
