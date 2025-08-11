============================
MYDAYHUB APP SPEC 4.2.0 Beta
(Internal – Dev/PM Use Only)
============================

This specification defines the functional and technical blueprint for
MyDayHub v4. It describes user flows, views, backend contracts, data
schema, security, and implementation responsibilities. It is the single
source of truth for the current milestone.

Document version: 4.2.0 Beta
Spec owners: Alex (PM/Dev), Coding Copilot (LAMP)

Changelog (since 4.1.0 Beta)
- ✅ Persisted cross-column move (moveTask) with source compaction.
- ✅ Feature matrix and API contracts updated for moveTask.
- ✨ Added CSRF protection plan and acceptance criteria.
- ✨ Normalized section order, icons, and line wrapping.

---
## Visual Status Icons

✅ Complete
🚧 In Progress / Partially Implemented
⚠️ Not Working as Specified
📅 Planned for Future Release

---
## 1. Executive Summary

MyDayHub is a focused productivity app that blends a kanban task board,
a journal, outline trees, and meeting plans into a simple, fast, and
durable tool. Version 4 targets a modern LAMP stack, strong client
ergonomics, clear APIs, and practical persistence. Privacy, predictable
performance, and clear UX are core values.

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
- PHP 8.2, Apache, MySQL (InnoDB), Vanilla JS modules, CSS (scoped per
  view).
- Single API gateway `/api/api.php` dispatches `{ module, action }` to
  handlers in `/api/modules/`.

### Frontend modules
- `/assets/js/app.js`: glue; view switching; confirmation modal; mobile
  menu.
- `/assets/js/tasks.js`: tasks board UI, sorting, counts, DnD, API calls.
- `/assets/js/editor.js`: unified editor overlay and ribbon tools.

### Backend modules
- `/api/modules/tasks.handler.php`: task actions (getAll, createTask,
  moveTask, …).

### Config & logging
- `/includes/config.php`: `DEVMODE` controls error display and logs to
  `/debug.log` in the app root (no HTML errors in JSON responses).

### Security notes (high level)
- 📅 CSRF token generation/validation (details in §7.2).
- 🚧 Enforce per-user ownership on every mutating action.

---
## 4. Feature Matrix (at a glance)

Tasks Board (Kanban)
- ✅ Load board: columns with tasks (`getAll`).
- ✅ Add task via footer field (persist via `createTask`).
- ✅ Sorting: priority first, then normal; completed at bottom.
- ✅ Column counters: update on add and drag-and-drop.
- ✅ Drag-and-drop: UI and DB persistence (append to dest; compact source).
- 🚧 Toggle complete / priority: UI complete; DB persistence pending.
- 🚧 Delete / duplicate: UI complete; DB persistence pending.
- 📅 Share / make private (policy and flows).

Journal
- 📅 Cards, notes, quick capture, search.

Outlines (Tree)
- 📅 Branch/node editing, collapse/expand, drag-and-drop tree ops.

Meetings
- 📅 Plans with segments; agenda tooling and timers.

Unified Editor
- 🚧 Modal editor with ribbon tools (case, underline, frame, calculate,
  font-size). Will become shared editing surface for notes and entries.

Settings
- 🚧 Theme, font sizes, keyboard prefs, view toggles.

Import/Export
- 📅 CSV/JSON backup and restore; migration from v3.

Security & Privacy
- ✅ DEVMODE logging; gateway path normalization; JSON-only APIs.
- 📅 CSRF protection (token + header validation), see §7.2.
- 🚧 Ownership checks enforced per action (documented; implement all).

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
- Client inserts and re-sorts column; counter refreshes. Errors show an
  alert while details log to `/debug.log` when `DEVMODE=true`.

#### Sorting (UI)  ✅
- Incomplete above completed. Within incomplete, `priority` above
  `normal`.
- Stable order for items with equal status/priority.
- Sorting re-runs on:
  - Checkbox change (complete/incomplete),
  - Priority toggle (UI),
  - Drag-and-drop end,
  - Initial render after `getAll`.

#### Drag-and-Drop  ✅
- Smooth card drag; drop within/between columns.
- After drop: sort destination, refresh counters for source and
  destination.
- Persisted via `moveTask`: update `column_id`, append at dest end, and
  compact positions in the source column.

#### Quick Actions (UI)  🚧
- Change priority, edit note/due date, move, share, privacy, duplicate,
  delete. Visual-only except where noted.

#### Completion Feedback  ✅
- Gold flare animation plays on completion and is clipped to the card
  only. `.task-card` uses `overflow: hidden`; flare `::after` is
  non-interactive.

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
- Ribbon tools: case transforms, underline line, framing block,
  calculator, font size control. Live counts of words/chars/lines.
- Opens for task note edits; becomes the shared editor across views.

### F. Settings & Preferences  🚧
- Theme, font size, shortcut toggles.
- Persist preferences in `users.preferences` JSON (schema below).

---
## 6. API Gateway & Contracts

### Request model
- All requests target `/api/api.php` and send JSON:
  `{ module: "tasks", action: "getAll" | "createTask" | "moveTask" | …,
     data?: { … } }`.
- The gateway resolves handler and invokes `handle_{module}_action`.
- Responses are JSON with `{ status: "success"|"error", data?, message? }`.

### Tasks actions (current)

#### getAll  ✅
- Returns columns and tasks for the authenticated user.
- Data shape:
  `[{ column_id, column_name, tasks: [{ task_id, column_id, position,
     status, data: { title } }] }]`.

#### createTask  ✅
- Method: POST
- Payload: `data: { column_id: int, title: string,
  status?: "normal"|"priority" }`
- Behavior: inserts at `MAX(position)+1` for the user-owned column.
- Response: `{ status: "success", data: { task_id, column_id, position,
  status, data: { title } } }`
- Ownership: verify `columns.user_id` matches current user.

#### moveTask  ✅
- Method: POST
- Payload: `data: { task_id: int, to_column_id: int }`
- Behavior: move task if owned by user. Append at end of destination
  column and compact positions of the source column to be dense
  `0..n-1`.
- Response: `{ status: "success", data: { task_id, column_id, position,
  status, data: { title } } }`
- Ownership: verify both task and destination column belong to user.

### Tasks actions (planned)  🚧
- `toggleComplete(task_id: int, completed: bool)` → update `status`.
- `togglePriority(task_id: int, on: bool)` → swap to/from `priority`.
- `deleteTask(task_id: int)` → remove and close gaps in positions.
- `duplicateTask(task_id: int)` → insert copy at `MAX(position)+1`.

### Error handling
- Non-2xx returns set appropriate `http_response_code`.
- In `DEVMODE=true`, write detailed diagnostics to `/debug.log`.

---
## 7. Security & Privacy

- Sanitize/validate all inputs; never trust client `position` without
  checks.
- No HTML error output in JSON routes; log to file instead.
- 🚧 Enforce per-user ownership on every mutating action (documented;
  implement across all actions).

### 7.1 Cookie & session flags  📅
- Session cookie must set:
  - `HttpOnly = true`,
  - `SameSite = Lax` (or `Strict` if UX allows),
  - `Secure = true` in production (HTTPS required).

### 7.2 CSRF Protection  📅

**Goal**
Prevent cross-site request forgery by requiring a session-bound secret on
every state-changing request.

**Scope**
Applies to `POST`, `PUT`, `PATCH`, and `DELETE` to `/api/api.php`. `GET`
is read-only and exempt.

**Mechanics**
- Backend generates a per-session token on session start and stores it in
  `$_SESSION['csrf']`.
- The token is rendered to the client as
  `<meta name="csrf" content="…">` (output in `index.php`).
- Frontend sends the token on each write request in header
  `X-CSRF-Token`.
- API validates the header against `$_SESSION['csrf']`. Mismatch or
  absence returns `403` with a standard JSON envelope.

**Rotation**
- Token regenerates on login, logout, and session renewal. Old tokens are
  invalid after rotation.

**Errors**
- `403` + JSON: `{ "status":"error", "message":"Invalid CSRF token." }`.

**Acceptance criteria**
- All write requests without a valid token return `403`.
- Valid requests succeed with no change to existing response shapes.
- Session cookie uses `HttpOnly`, `SameSite=Lax`, `Secure` (prod only).

---
## 8. Preferences & Settings (Data Model)  🚧

- `users.preferences` (JSON) may include:
  - `theme`, `font_size`, `keyboard`, `view_state`.
- Client reads on bootstrap; server returns defaults if unset.

---
## 9. Import/Export & Backup  📅

- CSV/JSON export of columns/tasks.
- Import with validation and dry-run preview.
- Automated backup job (daily) for paid tiers (future).

---
## 10. File Structure & Responsibilities

- `/index.php`: shell HTML, view containers, script/style includes.
  📅 Emit `<meta name="csrf" …>` once CSRF is enabled.
- `/includes/config.php`: constants, DB creds, `DEVMODE`, error handler.
  📅 Set session cookie flags (`HttpOnly`, `SameSite`, `Secure` in prod).
- `/assets/css/style.css`: base theme, shared components, view imports.
- `/assets/css/views/tasks.css`: tasks view styles (card, menus, flare).
- `/assets/css/views/editor.css`: unified editor styles.
- `/assets/js/app.js`: init, view switcher, confirmation modal, mobile
  menu.
- `/assets/js/tasks.js`: board rendering, add task, DnD, sort, counters,
  quick actions, editor integration, API calls.
- `/assets/js/editor.js`: modal editor state, ribbon actions, stats.
- `/api/api.php`: single entrypoint; JSON router to module handlers.
  📅 Validate `X-CSRF-Token` on state-changing requests before routing.
- `/api/modules/tasks.handler.php`: tasks actions: getAll, createTask,
  moveTask; next actions as listed above.

Notes
- Completion uses checkbox `change` event to ensure sort timing is
  correct.
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
- **MINOR** (4.X.0): backward-compatible features or contracts.
- **PATCH** (4.2.X): fixes, clarifications, non-breaking polish.

Current document version: **4.2.0 Beta**
- Reason: adds persisted moveTask, introduces CSRF plan, and updates
  contracts and UX notes.

GitHub usage
- Tag releases for packaged checkpoints: `v4.2.0-beta`.
- Routine commits that do not alter external behavior can omit a version
  bump; aggregate into the next patch.
- When DB schema or API contract changes, bump MINOR (or MAJOR if
  breaking) and add a migration note.

---
## 14. Testing & QA

### 14.1 API & UI sanity
- ✅ Board loads from `getAll`.
- ✅ Create task persists; appears after refresh.
- ✅ Drag move persists; appears in new column after refresh.
- 🚧 Toggle complete/priority: verify once persistence lands.

### 14.2 Security checks (CSRF)  📅
- `GET /api/api.php?action=getAll` works without token.
- `POST /api/api.php` without `X-CSRF-Token` returns `403`.
- `POST` with incorrect token returns `403`.
- `POST` with correct token succeeds.
- Session cookie shows `HttpOnly` and `SameSite=Lax` (and `Secure` in
  prod).
- Token rotates on login/logout; old token is rejected.

---
## 15. Roadmap (near-term)

1) Persist task updates:
   - `toggleComplete`, `togglePriority` → update `status`, return task.
2) Persist delete/duplicate:
   - `deleteTask`, `duplicateTask` with consistent compaction/insert rules.
3) CSRF enablement:
   - Generate token in PHP; emit meta; validate in gateway; set cookie
     flags.
4) Error UX:
   - Standard toast/inline error component and retry guidance.
5) Editor expansion:
   - Use unified editor for journal/outline notes; add link/monospace
     tools.

---
## 16. Glossary

Task card (task)
Journal entry card (entry)
Journal entry note (note)
Meeting plan (plan)
Meeting plan segment (segment)
Outlines tree (tree)
Tree branch (branch)
Branch node (node)
