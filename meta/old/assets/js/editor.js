/**
 * MyDayHub v4 — Unified Note Editor
 * File: /assets/js/editor.js
 *
 * Modified for notes_save_close:
 * - Save & Close button lives in the header controls next to window controls.
 * - IDs used (must exist in index.php):
 *     #btn-editor-save-close, #editor-btn-maximize,
 *     #editor-btn-restore, #editor-btn-close
 *
 * Public API:
 *   window.Editor.open({ id, kind, title, content })
 *   window.Editor.close()
 *   window.Editor.save(reason?)
 *   window.Editor.getContent() / .setContent(text)
 *   window.Editor.maximize() / .restore()
 *   window.Editor.isOpen() / .isDirty() / .getMeta()
 *
 * Integration:
 *   - Optional delegate: window.EditorSaveDelegate(id, kind, content, {reason})
 *   - Event: document listens to 'editor:save' (detail: {id,kind,content,reason})
 */

(function () {
  "use strict";

  // ----------------------------
  // Element handles (late bound)
  // ----------------------------
  let $root;             // #unified-editor-container
  let $title;            // #editor-title
  let $controls;         // .editor-controls
  let $tabs;             // #editor-ribbon-tabs
  let $panels;           // #editor-ribbon-panels
  let $textarea;         // #editor-textarea
  let $status;           // #editor-status-bar

  // Header buttons (provided in index.php)
  let $btnSaveClose;     // #btn-editor-save-close
  let $btnMax;           // #editor-btn-maximize
  let $btnRestore;       // #editor-btn-restore
  let $btnClose;         // #editor-btn-close

  // ----------------------------
  // Session state
  // ----------------------------
  const STATE = {
	open: false,
	id: null,            // note/task id
	kind: "note",        // "note" | "task"
	title: "",
	isMaximized: false,
	lastSavedAt: null,
	autosaveMs: 15000,   // 15s
	idleSaveMs: 1200,    // debounced save after typing stops
	autosaveTimer: null,
	idleTimer: null,
	dirty: false
  };

  // ----------------------------
  // Utilities
  // ----------------------------
  const debounce = (fn, ms) => {
	let t = null;
	return (...args) => { if (t) clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  const dispatch = (name, detail) => {
	document.dispatchEvent(new CustomEvent(name, { detail }));
  };

  const safe = (n) => (n == null ? "" : String(n));

  const devlog = (...args) => {
	if (window && window.DEVMODE) console.debug("[Editor]", ...args);
  };

  // ----------------------------
  // Core behaviors
  // ----------------------------
  function ensureElements() {
	$root     = document.getElementById("unified-editor-container");
	$title    = document.getElementById("editor-title");
	$controls = document.querySelector(".editor-controls");
	$tabs     = document.getElementById("editor-ribbon-tabs");
	$panels   = document.getElementById("editor-ribbon-panels");
	$textarea = document.getElementById("editor-textarea");
	$status   = document.getElementById("editor-status-bar");

	$btnSaveClose = document.getElementById("btn-editor-save-close");
	$btnMax       = document.getElementById("editor-btn-maximize");
	$btnRestore   = document.getElementById("editor-btn-restore");
	$btnClose     = document.getElementById("editor-btn-close");

	if (!$root || !$textarea) throw new Error("Unified Editor: missing required DOM");
  }

  function setStatus(text) {
	if ($status) $status.textContent = text;
  }

  function markSaved() {
	STATE.lastSavedAt = new Date();
	STATE.dirty = false;
	setStatus("Saved " + STATE.lastSavedAt.toLocaleTimeString());
  }

  function markDirty() {
	STATE.dirty = true;
	setStatus("Unsaved changes …");
  }

  function getContent() { return $textarea ? $textarea.value : ""; }

  function setContent(text) {
	if ($textarea) $textarea.value = safe(text);
	markDirty(); // content considered pending until saved
  }

  function setHeaderTitle(text) { if ($title) $title.textContent = safe(text); }

  // ----------------------------
  // Saving flows
  // ----------------------------
  async function performSave(reason = "manual") {
	if (!STATE.open || !$textarea) return { ok: true, skipped: true };
	const id = STATE.id;
	const kind = STATE.kind;
	const content = getContent();

	// Optional host delegate
	let delegateOk = true;
	if (typeof window.EditorSaveDelegate === "function") {
	  try {
		const res = await Promise.resolve(
		  window.EditorSaveDelegate(id, kind, content, { reason })
		);
		delegateOk = res !== false;
	  } catch (e) {
		delegateOk = false;
		devlog("Delegate save failed:", e);
	  }
	}

	// Broadcast
	dispatch("editor:save", { id, kind, content, reason });

	if (delegateOk) { markSaved(); return { ok: true }; }
	setStatus("Save failed");
	return { ok: false };
  }

  const debouncedIdleSave = debounce(() => {
	if (STATE.dirty) performSave("idle");
  }, STATE.idleSaveMs);

  function startAutosave() {
	stopAutosave();
	STATE.autosaveTimer = setInterval(() => {
	  if (STATE.dirty) performSave("autosave");
	}, STATE.autosaveMs);
  }

  function stopAutosave() {
	if (STATE.autosaveTimer) {
	  clearInterval(STATE.autosaveTimer);
	  STATE.autosaveTimer = null;
	}
  }

  // ----------------------------
  // Open / Close / Max / Restore
  // ----------------------------
  function openEditor(opts) {
	ensureElements();

	const { id, kind = "note", title = "Editor", content = "" } = opts || {};
	STATE.id = id != null ? id : null;
	STATE.kind = kind;
	STATE.title = title;

	setHeaderTitle(title);
	setContent(content);

	$root.classList.add("open");
	$root.classList.remove("is-maximized");
	STATE.isMaximized = false;

	STATE.open = true;
	markDirty();
	setStatus("Editing…");

	startAutosave();
	bindKeyHandlers();
	wireHeaderButtons(); // ensure listeners bound to your header IDs
  }

  async function closeEditor() {
	ensureElements();
	if (STATE.dirty) await performSave("close-soft");
	stopAutosave();
	unbindKeyHandlers();
	$root.classList.remove("open");
	STATE.open = false;
	STATE.id = null;
	STATE.title = "";
	setStatus("");
  }

  function maximize() {
	ensureElements();
	$root.classList.add("is-maximized");
	STATE.isMaximized = true;
	// Toggle header buttons visual state if needed
	if ($btnMax) $btnMax.style.display = "none";
	if ($btnRestore) $btnRestore.style.display = "";
  }

  function restore() {
	ensureElements();
	$root.classList.remove("is-maximized");
	STATE.isMaximized = false;
	if ($btnMax) $btnMax.style.display = "";
	if ($btnRestore) $btnRestore.style.display = "none";
  }

  // ----------------------------
  // Header controls wiring
  // ----------------------------
  function wireHeaderButtons() {
	// Save & Close
	if ($btnSaveClose && !$btnSaveClose.__wired) {
	  $btnSaveClose.addEventListener("click", async () => {
		const res = await performSave("save-close"); // Modified for notes_save_close
		if (res && res.ok) closeEditor();
	  });
	  $btnSaveClose.__wired = true;
	}

	// Maximize
	if ($btnMax && !$btnMax.__wired) {
	  $btnMax.addEventListener("click", () => maximize());
	  $btnMax.__wired = true;
	}

	// Restore
	if ($btnRestore && !$btnRestore.__wired) {
	  $btnRestore.addEventListener("click", () => restore());
	  $btnRestore.__wired = true;
	  // honor initial style from HTML (hidden by default)
	}

	// Close (soft save)
	if ($btnClose && !$btnClose.__wired) {
	  $btnClose.addEventListener("click", () => closeEditor());
	  $btnClose.__wired = true;
	}
  }

  // ----------------------------
  // Ribbon: tabs & simple tools (optional)
  // ----------------------------
  function selectRibbonTab(tabId) {
	if (!$tabs || !$panels) return;
	const allTabs = $tabs.querySelectorAll(".ribbon-tab");
	const panels  = $panels.querySelectorAll(".ribbon-panel");
	allTabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabId));
	panels.forEach(p => p.classList.toggle("active", p.dataset.tab === tabId));
  }

  function initRibbon() {
	if ($tabs) {
	  $tabs.addEventListener("click", (e) => {
		const btn = e.target.closest(".ribbon-tab");
		if (!btn) return;
		const tab = btn.dataset.tab;
		if (tab) selectRibbonTab(tab);
	  });
	}
  }

  // ----------------------------
  // Text helpers
  // ----------------------------
  function getSelectionRange() {
	if (!$textarea) return { start: 0, end: 0 };
	return { start: $textarea.selectionStart, end: $textarea.selectionEnd };
  }

  function setSelectionRange(start, end) {
	if (!$textarea) return;
	$textarea.focus();
	$textarea.setSelectionRange(start, end);
  }

  function applyTransform(fn) {
	if (!$textarea) return;
	const { start, end } = getSelectionRange();
	const v = $textarea.value;
	const before = v.slice(0, start);
	const sel    = v.slice(start, end);
	const after  = v.slice(end);
	const nextSel = fn(sel);
	$textarea.value = before + nextSel + after;
	setSelectionRange(start, start + nextSel.length);
	markDirty();
	debouncedIdleSave();
  }

  function wrapSelection(prefix, suffix) {
	if (!$textarea) return;
	const { start, end } = getSelectionRange();
	const v = $textarea.value;
	const before = v.slice(0, start);
	const sel    = v.slice(start, end);
	const after  = v.slice(end);
	const nextSel = prefix + sel + suffix;
	$textarea.value = before + nextSel + after;
	setSelectionRange(start + prefix.length, start + prefix.length + sel.length);
	markDirty();
	debouncedIdleSave();
  }

  // ----------------------------
  // Keyboard handling
  // ----------------------------
  function bindKeyHandlers() {
	if (!$textarea) return;
	$textarea.addEventListener("input", onInput);
	$textarea.addEventListener("keydown", onKeydown);
	document.addEventListener("keydown", onGlobalKeydown, true);
  }

  function unbindKeyHandlers() {
	if (!$textarea) return;
	$textarea.removeEventListener("input", onInput);
	$textarea.removeEventListener("keydown", onKeydown);
	document.removeEventListener("keydown", onGlobalKeydown, true);
  }

  function onInput() {
	markDirty();
	debouncedIdleSave();
  }

  function onKeydown(e) {
	// Cmd/Ctrl+S => Save
	if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
	  e.preventDefault();
	  performSave("hotkey");
	}
  }

  function onGlobalKeydown(e) {
	if (!STATE.open) return;

	// Esc => Close (soft save)
	if (e.key === "Escape") {
	  e.preventDefault();
	  closeEditor();
	  return;
	}

	// Cmd/Ctrl+Enter => Save & Close
	if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
	  e.preventDefault();
	  performSave("save-close").then((r) => r && r.ok && closeEditor());
	}

	// F11 => toggle maximize
	if (e.key === "F11") {
	  e.preventDefault();
	  STATE.isMaximized ? restore() : maximize();
	}
  }

  // ----------------------------
  // Public API
  // ----------------------------
  const Editor = {
	open(opts) { openEditor(opts || {}); },
	close() { return closeEditor(); },
	save(reason = "manual") { return performSave(reason); },
	getContent() { return getContent(); },
	setContent(text) { setContent(text); },
	maximize() { maximize(); },
	restore() { restore(); },
	isOpen() { return !!STATE.open; },
	isDirty() { return !!STATE.dirty; },
	getMeta() {
	  return {
		id: STATE.id,
		kind: STATE.kind,
		title: STATE.title,
		isMaximized: STATE.isMaximized,
		lastSavedAt: STATE.lastSavedAt ? STATE.lastSavedAt.toISOString() : null
	  };
	}
  };

  // ----------------------------
  // Boot
  // ----------------------------
  function boot() {
	try {
	  ensureElements();
	  initRibbon();
	  // Honor initial restore button visibility defined in HTML
	  if ($btnRestore && !$root.classList.contains("is-maximized")) {
		$btnRestore.style.display = "none";
	  }
	  devlog("Unified Editor ready");
	} catch (e) {
	  console.error("Unified Editor failed to initialize:", e);
	}
  }

  if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot);
  } else {
	boot();
  }

  // Expose
  window.Editor = Editor;

})();
