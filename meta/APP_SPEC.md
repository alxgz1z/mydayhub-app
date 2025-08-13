Here’s a fuller, drop-in replacement for APP_SPEC.md, expanded with
clearer detail and consistent styling. I kept line length ≤84 chars.

⸻

MyDayHub — Application Spec (Beta 4)

Version: 4.5.2 (Dev)
Environments:
  •	Prod (v3): isolated; no shared users/DB/files
  •	Dev (v4): localhost (127.0.0.1), Apache+PHP 8, MySQL, XAMPP

Visual Status Icons:
✅ Complete | 🚧 In progress | ⚠️ Needs fix | 🗓️ Planned (future) | 🚀 Idea

⸻

0) Purpose

This document is the source of truth for how v4 works and how we intend it to
evolve. It balances product behavior (what the user sees) with technical
contracts (DB, API, security). It is written for new contributors and for
future-Alex to resume work quickly.

⸻

1) Product goals
  •	A lightweight, fast Tasks + Journal tool with minimal ceremony.
  •	Smooth, app-like interactions (no full page reloads during normal use).
  •	Opinionated defaults: dark mode, simple sorting, clear affordances.
  •	Secure by default in v4: CSRF, ownership checks, predictable APIs.
  •	A foundation that can grow into sharing, search, and journaling at pace.

⸻

2) General requirements

✅ Modern, minimalist UI: rounded corners, soft shadows, clean typography
✅ Dark theme by default; global variables enable future light theme
✅ Fully responsive: desktop → mobile; touch gestures supported where natural
✅ Heavy front-end logic; minimal server round-trips for reads
✅ Inline interactions: create/move/delete without full reloads
✅ View switcher toggles sections (Tasks, Journal placeholder, etc.)
✅ Dev banner when DEVMODE = true (visual indicator in header)
✅ Standard tooltips/titles on interactive icons and buttons
✅ CSRF protection for all mutating API requests (see §10)
✅ Ownership checks on the server for all user-owned records
🚧 Unified Editor integrations (Tasks entry point wired; Journal next)
🗓️ Multi-user auth (dev uses stub user id; see §11 roadmap)
🚀 Client-side encryption (zero-knowledge) parity with v3

⸻

3) Layout: major components

3.1 App header (always visible)
  •	App title and view tabs (Tasks, Journal placeholder)
  •	Context controls by view (see view sections)
  •	Mobile: header collapses spacing; tabs move to a mobile menu

3.2 Main content area
  •	Hosts the current view container.
  •	Takes ≥85% vertical space on desktop.
  •	Uses flex layout to allow scrollable inner panes.

3.3 Mobile menu and safe-area handling
  •	iOS Safari/Chrome can overlay toolbars; we reserve space with a bottom
spacer (.mobile-safe-spacer) so the last column’s footer remains visible.
  •	Safe-area CSS variables (env(safe-area-inset-*)) are respected.

⸻

4) Tasks view (Kanban board)

Status: Core features complete; polishing continues.

4.1 Columns

✅ Horizontally scrollable on desktop; stacked vertically on mobile
✅ User-created columns persist to DB with dense, zero-based position
✅ Delete column: cascades task delete; compacts remaining positions
⚠️ Rename column: UI+API not yet implemented
🗓️ Reorder columns by drag (left↔right) and persist

Column structure
  •	Header: editable title (🗓️), task count badge (✅), actions menu (✅)
  •	Body: scrollable list of task cards (✅)
  •	Footer: “+ New Task” quick entry (✅); “Move here” button in move mode (✅)

4.2 Tasks (cards)

✅ Create in footer input; press Enter creates, clears, and refocuses
✅ Drag & drop within a column (persist order)
✅ Drag & drop across columns (append to end; compact source column)
✅ Quick actions menu (ellipsis): Edit, Duplicate, Move, Delete, Priority
✅ Completion checkbox next to title
✅ Visual status band at left indicates state (normal/priority/completed)
🚧 Band click to toggle priority (today via menu button)
🗓️ Due date mini-suffix, delegated markers (@name) and filters

Sorting rules (client-side for UX, then persisted where applicable)
  1.	Non-completed above completed.
  2.	Among non-completed, priority above normal.
  3.	Manual order within a column is authoritative once persisted.

Persistence
  •	Create: append to end of the column.
  •	Move across columns: append to end of destination; compact source.
  •	Move within a column: persist the full ordered list (reorderColumn).
  •	Duplicate: same column end; title "(Copy)"; status resets to normal.
  •	Delete: remove then compact positions in that column.
  •	Complete / Priority: server endpoints exist; UI wiring follows.

Feedback
  •	Hover lift/shadow; completion adds a brief gold “flare” animation.
  •	Counts update live per column; errors surface as concise alerts (to be
migrated to toasts).

⸻

5) Journal view (scaffold)

Status: Planned, modeled after v3 with improvements.

🗓️ Date-based columns (YYYY.MMM.DD, Weekday), scrollable past/future
🗓️ Day navigation (prev/next), 1-day/3-day/5-day virtualized views
🗓️ Weekend color accents; center column emphasis
🗓️ Footer quick entry for new journal entry

⸻

6) Journal entry cards (future)

🗓️ Editable title; click band or card to open editor
🗓️ Lift on hover; distinct band color when entry has notes
🗓️ Drag between journal columns; share/duplicate/delete via menu

⸻

7) Unified Editor (notes)

Status: In progress. Editor framework exists; Tasks entry point opens it.

🚧 Open from “Edit” quick action (Tasks) to manage title, notes, due date
🗓️ From editor, “New Task” form to create a task into a chosen column
🗓️ Format bar with text helpers; print; search; ESC to close

⸻

8) Toolbar controls

8.1 Tasks toolbar

✅ “+ New Column” control in header (desktop)
✅ Mobile menu exposes “+ New Column”
🚧 Filters: show/hide completed; only priority; mine/delegated
🗓️ Column sharing entry point in header

8.2 Journal toolbar (future)

🗓️ Date range toggle (1/3/5 days) and weekend toggle
🗓️ Wrap-up action creates a daily summary entry

⸻

9) Help and Settings

🚧 Help: accordion topics (Tasks, Journal, Editor, Search, Toolbar, etc.)
🚧 Settings: sound toggle, theme toggle, session timeout, account actions
🗓️ Password change / recovery (with SMTP back-end)

⸻

10) Security and request model

10.1 CSRF (complete)
  •	On page render, server seeds $_SESSION['csrf_token'] and injects
<meta name="csrf" content="...">.
  •	All mutating requests must be POST application/json with header:
X-CSRF-Token: <token>.
  •	API rejects missing/invalid tokens with HTTP 403.
  •	Read action (getAll) may be GET or POST JSON without CSRF.

10.2 Ownership checks (complete)
  •	Every mutating action confirms the target row belongs to the current user.
  •	Dev uses userId = 1 stub; real auth will set this from session.

⸻

11) Database schema

users (
  user_id INT PK
  -- plus auth fields (future)
)

columns (
  column_id  INT PK,
  user_id    INT NOT NULL,        -- FK → users.user_id
  column_name VARCHAR(64) NOT NULL,
  position   INT NOT NULL,        -- dense, zero-based per user
  created_at DATETIME NULL,       -- tolerated missing
  updated_at DATETIME NULL
)

tasks (
  task_id        INT PK,
  user_id        INT NOT NULL,    -- FK → users.user_id
  column_id      INT NOT NULL,    -- FK → columns.column_id
  encrypted_data TEXT NOT NULL,   -- JSON (title, future fields)
  position       INT NOT NULL,    -- dense within its column
  status ENUM('normal','priority','completed') NOT NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL
)

Position compaction
  •	Inserts: append to MAX(position)+1.
  •	Cross-column moves: append at destination; compact source to 0..n-1.
  •	Deletes: compact in the affected column.
  •	Manual reorders: client sends full ordered id list; server rewrites 0..n-1.

⸻

12) API gateway (single pipe)

Endpoint: /api/api.php
Envelope (POST JSON):

{ "module": "tasks", "action": "<ActionName>", "data": { ... } }

Common responses:
  •	Success → {"status":"success","data":...}
  •	Error   → {"status":"error","message":"..."}

HTTP semantics:
  •	200 OK (reads/updates), 201 Created, 400 Bad Request, 403 Forbidden,
404 Not Found, 405 Wrong Method, 415 Unsupported Media Type, 500 Error.

When DEVMODE = true, exceptions are appended to debug.log with file/time.

⸻

13) Tasks module API (current surface)

All actions enforce ownership. Mutations require CSRF.

getAll (✅)
  •	Purpose: fetch all columns + tasks ordered by position.
  •	Req: GET ?module=tasks&action=getAll or POST JSON.
  •	Res: array of columns each with tasks:[...].

createTask (✅)
  •	Purpose: create a task in a column.
  •	Data: {column_id, title, status?='normal'|'priority'}
  •	Res: new task object; position = append index.

moveTask (✅)
  •	Purpose: move task to another column (append there).
  •	Data: {task_id, to_column_id}
  •	Res: updated task object.

reorderColumn (✅)
  •	Purpose: persist manual order within a column.
  •	Data: {column_id, ordered:[taskId,...]}
  •	Res: success.

toggleComplete (✅ server / 🚧 UI)
  •	Purpose: mark task completed/uncompleted.
  •	Data: {task_id, completed:boolean}
  •	Res: normalized task object.
  •	Note: client currently updates/sorts locally; wire this call next.

togglePriority (✅ server / 🚧 UI)
  •	Purpose: set priority on/off; ignored if completed.
  •	Data: {task_id, priority:boolean}
  •	Res: success.

deleteTask (✅)
  •	Purpose: delete task and compact positions in that column.
  •	Data: {task_id}
  •	Res: {task_id}.

duplicateTask (✅)
  •	Purpose: clone a task to end of same column; status becomes normal.
  •	Data: {task_id}
  •	Res: new task object with "(Copy)" suffix.

createColumn (✅)
  •	Purpose: add a new column at end for the user.
  •	Data: {column_name}
  •	Res: {column_id, column_name, position}.

deleteColumn (✅)
  •	Purpose: delete a column and its tasks; compact remaining columns.
  •	Data: {column_id}
  •	Res: {column_id}.

🗓️ renameColumn, 🗓️ reorderColumns (left↔right) to be added.

⸻

14) Front-end modules

14.1 assets/js/app.js
  •	App bootstrap; tab switching; modal helpers (confirmation dialog).
  •	Mobile menu toggle; dev-mode header indicator.

14.2 assets/js/tasks.js
  •	Render board from API; column creation and deletion.
  •	Task lifecycles: create, move (DnD and move-mode), duplicate, delete.
  •	Sorting rules and counts; mobile behaviors and safe spacer.
  •	API wrapper attaches X-CSRF-Token from <meta name="csrf">.

14.3 CSS
  •	assets/css/style.css sets theme, header, tabs, modals, responsive base.
  •	assets/css/views/tasks.css styles board, cards, quick actions, move mode.
  •	assets/css/views/editor.css holds Unified Editor visuals.

⸻

15) Mobile specifics

✅ Columns stack vertically ≤768px width.
✅ Bottom safe spacer keeps column footers accessible behind iOS toolbars.
✅ Header compacts; tabs move into a mobile dropdown.
⚠️ Fine-tune momentum scroll and hit targets for smaller displays.
🗓️ Add pull-to-create in Tasks footer for faster mobile entry.

⸻

16) Versioning and workflow
  •	Spec version: this doc → 4.5.2 (Dev).
  •	Bump minor when features land (e.g., column rename).
  •	Bump patch for docs/refactors with no user-visible change.
  •	Code headers: each file carries its own version stamp.
  •	Git: keep commits small; message ≤100 words, describe scope+files.
  •	Tags: cut v4.6.0-dev type tags when a coherent feature set lands.

⸻

17) Testing (dev helpers)

Examples (adjust ids, include CSRF header for mutations):

# Read board
curl -s 'http://localhost/api/api.php?module=tasks&action=getAll' | jq .

# Create a task
curl -s -X POST http://localhost/api/api.php \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: <token>" \
  -d '{"module":"tasks","action":"createTask","data":{"column_id":3,"title":"Wash car"}}' \
  | jq .

# Move task to another column
curl -s -X POST http://localhost/api/api.php \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: <token>" \
  -d '{"module":"tasks","action":"moveTask","data":{"task_id":42,"to_column_id":4}}' \
  | jq .

# Reorder a column
curl -s -X POST http://localhost/api/api.php \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: <token>" \
  -d '{"module":"tasks","action":"reorderColumn","data":{"column_id":3,"ordered":[7,9,6,10]}}'

Find <token> in the page source: <meta name="csrf" content="...">.

⸻

18) Roadmap (near-term)
  1.	Wire UI to call toggleComplete and togglePriority.
  2.	Column rename endpoint + inline editor in header.
  3.	Column drag ↔ reorder with reorderColumns server action.
  4.	Replace alerts with non-blocking toasts; add undo for delete.
  5.	Introduce simple auth to replace stub user id (enable multi-user tests).
  6.	Journal scaffolding: columns, entries, editor flow parity with v3.

⸻

19) Glossary
  •	Task card = task
  •	Journal entry card = entry
  •	Journal entry note = note
  •	Meeting plan = plan
  •	Meeting plan segment = segment
  •	Outlines tree = tree
  •	Tree branch = branch
  •	Branch node = node

⸻

End of APP_SPEC.md v4.5.2