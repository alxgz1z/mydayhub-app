============================
MYDAYHUB APP SPEC 4.1.0 Beta
(Internal – Dev/PM Use Only)
============================

This specification defines the functional and technical blueprint for
MyDayHub v4. It describes user flows, views, backend contracts, data schema,
security, and implementation responsibilities. It is the single source of
truth for the current milestone.

Document version: 4.1.0 Beta  
Spec owners: Alex (PM/Dev), Coding Copilot (LAMP)

Changelog (since 4.0.0 Beta)
- ✅ Added persisted task creation via API (createTask) with normalized return.
- ✅ Column counters refresh on add and drag-and-drop (source/destination).
- ✅ Completion flare animation confined to task card; no column bleed.
- ✅ Sorting consistently re-runs on checkbox change.
- 🚧 Clarified persistence status for move/complete/priority/delete/duplicate.
- ✨ Reorganized spec, normalized styles, added versioning guidance.

---
## Visual Status Icons

✅ Complete  
🚧 In Progress / Partially Implemented  
⚠️ Not Working as Specified  
📅 Planned for Future Release

---
## 1. Executive Summary

MyDayHub is a focused productivity app that blends a kanban task board, a
journal, outline trees, and meeting plans into a simple, fast, and durable
tool. Version 4 targets a modern LAMP stack, strong client ergonomics, clear
APIs, and practical persistence. Privacy, predictable performance, and clear
UX are core values.

---
## 2. Principles

### Simplicity
- Small, understandable features that compose well.
- Clear naming and minimal ceremony.

### Privacy by Design
- Least data collected. Per-user ownership checks at API layer.
- Future: encrypted-at-rest content for tasks/notes (scope TBD).

### Fluidity & Mobile-First
- Fast first paint, consistent 60fps interactions, keyboard affordances.
- Responsive UI; mobile header patterns; no layout thrash.

---
## 3. Architecture Overview

### Stack
- PHP 8.2, Apache, MySQL (InnoDB), Vanilla JS modules, CSS (scoped per view).
- Single API gateway `/api/api.php` dispatches `{ module, action }` to
  handlers in `/api/modules/`.

### Frontend modules
- `/assets/js/app.js`: glue; view switching; modals; mobile menu.
- `/assets/js/tasks.js`: tasks board UI, sorting, counts, DnD, API calls.
- `/assets/js/editor.js`: unified editor overlay and ribbon tools.

### Backend modules
- `/api/modules/tasks.handler.php`: task actions (getAll, createTask, …).

### Config & logging
- `/includes/config.php`: `DEVMODE` controls error display and logs to
  `/debug.log` in the app root (no HTML errors in JSON responses).

---
## 4. Feature Matrix (at a glance)

Tasks Board (Kanban)
- ✅ Load board: columns with tasks (`getAll`)
- ✅ Add task via footer field (persist via `createTask`)
- ✅ Sorting: priority first, then normal; completed at bottom
- ✅ Column counters: update on add and drag-and-drop
- 🚧 Drag-and-drop: UI complete; DB persistence pending
- 🚧 Toggle complete / priority: UI complete; DB persistence pending
- 🚧 Delete / duplicate: UI complete; DB persistence pending
- 📅 Share / make private (policy and flows)

Journal
- 📅 Cards, notes, quick capture, search

Outlines (Tree)
- 📅 Branch/node editing, collapse/expand, drag-and-drop tree ops

Meetings
- 📅 Plans with segments; agenda tooling and timers

Unified Editor
- 🚧 Modal editor with ribbon tools (case, underline, frame, calculate,
  font-size). Will become shared editing surface for notes and entries.

Settings
- 🚧 Theme, font sizes, keyboard prefs, view toggles

Import/Export
- 📅 CSV/JSON backup and restore; migration from v3

Security & Privacy
- ✅ DEVMODE logging; gateway path normalization; JSON-only APIs
- 🚧 Ownership checks on every action (documented; enforce per action)

---
## 5. App Views & UX

### A. Tasks Board (Kanban)

#### Board & Columns
- Columns render horizontally (desktop) and vertically (mobile).
- Column header shows name and a live task counter.

#### Column Footer & Adding Tasks  ✅
- A `+ New Task` control expands into an input.
- On submit, client calls `createTask`. Server returns a normalized task:
  `{ task_id, column_id, position, status, data: { title } }`.
- Client inserts and re-sorts column; counter refreshes. Errors show alert in
  UI while details log to `/debug.log` when `DEVMODE=true`.

#### Sorting (UI)  ✅
- Incomplete above completed. Within incomplete, `priority` above `normal`.
- Stable order for items with equal status/priority.
- Sorting re-runs on:
  - Checkbox change (complete/incomplete)
  - Priority toggle (UI)
  - Drag-and-drop end

#### Drag-and-Drop (UI)  🚧
- Smooth card drag; drop within/between columns.
- After drop: sort column, refresh counters for source and destination.
- Next: persist new `column_id` and positions; reconcile server order.

#### Quick Actions (UI)  🚧
- Change priority, edit note/due date, move, share, privacy, duplicate,
  delete. Currently visual-only except where noted.

#### Completion Feedback  ✅
- Gold flare animation plays on completion and is clipped to the card only.
- `overflow: hidden` on `.task-card`; flare `::after` is non-interactive.

### B. Journal View  📅
- Entry cards with title and body; quick capture; search and filters.
- Future: per-entry privacy; share links.

### C. Outlines View (Tree)  📅
- Branches and nodes; indent/outdent; collapse/expand; drag re-parent.
- Keyboard shortcuts for structure manipulation.

### D. Meeting Plans  📅
- Plans composed of segments with timings and notes.
- Simple presenter view and elapsed timers.

### E. Unified Note Editor  🚧
- Ribbon tools: case transforms, underline line, framing block, calculator,
  font size control. Live counts of words/chars/lines.
- Opens for task note edits; becomes the shared editor across views.

### F. Settings & Preferences  🚧
- Theme, font size, shortcut toggles.
- Persist preferences in `users.preferences` JSON (schema below).

---
## 6. API Gateway & Contracts

### Request model
- All requests target `/api/api.php` and send JSON:
  `{ module: "tasks", action: "getAll" | "createTask" | …, data?: { … } }`.
- The gateway resolves handler and invokes `handle_{module}_action`.
- Responses are JSON with `{ status: "success"|"error", data?, message? }`.

### Tasks actions (current)

#### getAll  ✅
- Returns columns and tasks for the authenticated user.
- Data shape:
  `[{ column_id, column_name, tasks: [{ task_id, column_id, position, status,
	 data: { title } }] }]`.

#### createTask  ✅
- Method: POST
- Payload: `data: { column_id: int, title: string, status?: "normal"|"priority" }`
- Behavior: inserts at `MAX(position)+1` for the user-owned column.
- Response: `{ status: "success", data: { task_id, column_id, position,
  status, data: { title } } }`
- Ownership: verify `columns.user_id` matches current user.

### Tasks actions (planned)  🚧
- `toggleComplete(task_id: int, completed: bool)` → update `status`.
- `togglePriority(task_id: int, on: bool)` → `status` swap with rules.
- `moveTask(task_id: int, to_column_id: int, to_position: int)` → reorder
  both source and destination positions atomically.
- `deleteTask(task_id: int)` → remove and close gaps in positions.
- `duplicateTask(task_id: int)` → insert copy at `MAX(position)+1`.

### Error handling
- Non-2xx returns set appropriate `http_response_code`.
- In `DEVMODE=true`, write detailed diagnostics to `/debug.log`.

---
## 7. Security & Privacy

- Enforce per-user ownership on every mutating action (server-side checks).
- Sanitize/validate all inputs; never trust client `position` without checks.
- No HTML error output in JSON routes; log to file instead.
- Future: encrypted fields for notes and private tasks (TBD).

---
## 8. Preferences & Settings (Data Model)  🚧

- `users.preferences` (JSON) may include:
  - `theme`, `font_size`, `keyboard`, `view_state`
- Client reads on bootstrap; server returns defaults if unset.

---
## 9. Import/Export & Backup  📅

- CSV/JSON export of columns/tasks.
- Import with validation and dry-run preview.
- Automated backup job (daily) for paid tiers (future).

---
## 10. File Structure & Responsibilities

- `/index.php`: shell HTML, view containers, script/style includes.
- `/includes/config.php`: constants, DB creds, `DEVMODE`, error handler.
- `/assets/css/style.css`: base theme, shared components, view imports.
- `/assets/css/views/tasks.css`: tasks view styles (card, menus, flare).
- `/assets/css/views/editor.css`: unified editor styles.
- `/assets/js/app.js`: init, view switcher, confirmation modal, mobile menu.
- `/assets/js/tasks.js`: board rendering, add task, DnD, sort, counters,
  quick actions, editor integration.
- `/assets/js/editor.js`: modal editor state, ribbon actions, stats.
- `/api/api.php`: single entrypoint; JSON router to module handlers.
- `/api/modules/tasks.handler.php`: tasks actions: getAll, createTask, next
  actions as listed above.

Notes
- Completion uses checkbox `change` event to ensure sort timing is correct.
- Add-task footer restores idempotently to avoid blur/submit race.

---
## 11. Lessons Learned

- Keep API surface thin and explicit; avoid leaky coupling to the UI.
- Prefer delegated event listeners for dynamic DOM (cards, menus).
- Sort rules must run after state changes (use `change`, not `click`).
- Keep visual polish scoped (flare clipped to card; z-index safe).

---
## 12. Database Schema (v4)

### users
- `user_id` PK
- `email`, `password_hash`, `created_at`
- `preferences` JSON (theme, font, keyboard, view state)
- `plan` ENUM (future tiers)

### columns
- `column_id` PK, `user_id` FK → `users.user_id` (ON DELETE CASCADE)
- `column_name`, `position`, `created_at`

### tasks
- `task_id` PK, `user_id` FK, `column_id` FK (both ON DELETE CASCADE)
- `encrypted_data` JSON (currently stores `{ "title": string }`)
- `status` ENUM('normal','priority','completed') NOT NULL DEFAULT 'normal'
- `position` INT NOT NULL
- `created_at`, `updated_at`

Integrity
- Composite indexes for (`user_id`, `column_id`, `position`).
- Positions are dense per column (compaction on delete/move).

---
## 13. Versioning & Releases

We use Semantic Versioning for the **spec** and **app**:

- **MAJOR** (X.0.0): incompatible changes (e.g., DB schema break).
- **MINOR** (4.X.0): backward-compatible features added to spec/app.
- **PATCH** (4.1.X): fixes, clarifications, or non-breaking polish.

Current document version: **4.1.0 Beta**
- Reason: adds a new persisted feature (createTask) and clarifies contracts,
  reorgs spec structure, and updates UX behavior.

GitHub usage
- Each merge to main increments the spec/app version when appropriate.
- Tag releases: `v4.1.0-beta` for packaged checkpoints.
- Routine commits that do not alter external behavior can omit a version
  bump (aggregate into the next patch).
- When DB schema or API contract changes, bump MINOR (or MAJOR if breaking)
  and add a schema migration note.

---
## 14. Roadmap (near-term)

1) Persist task updates:
   - `toggleComplete`, `togglePriority` → update `status`, return task.
2) Persist move:
   - `moveTask` → update `column_id` and dense positions atomically.
3) Persist delete/duplicate:
   - `deleteTask`, `duplicateTask` with consistent compaction/insert rules.
4) Error UX:
   - Standardized toast/inline error component and retry guidance.
5) Editor expansion:
   - Use unified editor for journal/outline notes; add link/monospace tools.

---
## 15. Glossary

Task card (task)  
Journal entry card (entry)  
Journal entry note (note)  
Meeting plan (plan)  
Meeting plan segment (segment)  
Outlines tree (tree)  
Tree branch (branch)  
Branch node (node)
