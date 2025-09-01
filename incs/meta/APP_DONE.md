# MyDayHub — Development Progress Summary
Updated: 2025-08-10
Order: chronological (newest at the bottom)

## Snapshot (current)
- Board loads via API (`getAll`).  
- Creating a task persists via `createTask`, re-sorts column, updates counter.  
- Sorting rules: incomplete first (priority before normal); completed at bottom.  
- Counters stay in sync after add and drag-and-drop.  
- Visual-only for move/priority/complete/delete/duplicate (persistence pending).

---

## 2025-08-04 00:00 — Environment & Mobile UX
**Focus**  
Stabilize local dev and improve mobile experience.

**Key work**  
- Fixed local server and CSS issues (z-index, alignment).  
- Mobile header with hamburger menu.  
- Columns stack vertically on small screens.  
- Added Move Mode (touch), unified edit modal, quick actions, and meta icons.

**Status**  
UI flows working across desktop/mobile.

**Next steps**  
- Style meta indicators as subtle badges.  
- Add editor auto-save and "Last saved" footer.  
- Create `/api/tasks.php` PUT route for saving task details.

---

## 2025-08-04 23:00 — Unified Note Editor (foundation)
**Focus**  
Replace simple modal with a reusable editor.

**Key work**  
- New HTML in `index.php` for Unified Editor shell.  
- New stylesheet `/assets/css/views/editor.css`.  
- New module `/assets/js/editor.js` (open/close, maximize, tabs).  
- Connected task Edit to `UnifiedEditor.open()`.

**Status**  
Editor foundation complete and decoupled from tasks.js.

**Next steps**  
Make the ribbon responsive (overflow-to-menu pattern).

---

## 2025-08-08 08:00 — Task Card Icons (SVG)
**Focus**  
Replace emojis with crisp SVG icons and finalize menu.

**Key work**  
- Clean SVG set styled via `currentColor`.  
- Moved menu CSS into `/assets/css/views/tasks.css`.  
- Iterated stroke-width and symbols for clarity.

**Status**  
Final icons shipped; default color tuned for theme.

**Next steps**  
Resume editor ribbon responsiveness work.

---

## 2025-08-08 10:00 — Unified Editor Polish
**Focus**  
Stabilize and add essential tools.

**Key work**  
- Fixed header layout and status bar.  
- Maximize/restore logic and icons.  
- Monospace textarea for alignment.  
- Simplified ribbon (removed ResizeObserver overflow logic).  
- Implemented case transforms, underline, block frame, calculator, font size.  
- Live word/char/line counts.

**Status**  
Editor stable and meets current usability goals.

**Next steps**  
Move on to backend integration.

---

## 2025-08-08 16:00 — Backend Architecture (pivot)
**Focus**  
Build durable persistence and a clean API.

**Key work**  
- Designed v4 schema (users with JSON preferences, columns, tasks with ENUM
  status, dense positions).  
- Created single-pipe API gateway `/api/api.php`.  
- Added `/api/modules/` for feature handlers (e.g., tasks.handler.php).  

**Status**  
DB and gateway staged; `getAll` ready.  
Frontend still using in-browser data at this point.

**Next steps**  
Wire tasks.js to the API for live board data.

---

## 2025-08-08 22:00 — Backend Debugging & Logging
**Focus**  
Unblock API JSON failures and make errors observable.

**Key work**  
- Replaced frontend dev data with `fetch` to gateway, exposing backend errors.  
- Custom error handler in `/includes/config.php` with `DEVMODE=true` writes
  to `/debug.log`.  
- Fixed server file permissions for log creation.  
- Verified DB connectivity with a standalone test script.  

**Status**  
Env and DB confirmed; remaining fault isolated to app code paths.

**Next steps**  
Inspect/repair core gateway-handler flow; proceed to data load in UI.

---

## 2025-08-10 18:00 — Tasks: Persistence + UX Stability
**Focus**  
Persist creation; stabilize sorting, counts, and effects.

**Key work**  
- Implemented `createTask` in tasks handler; returns normalized task payload.  
- Hooked "+ New Task" footer → API; render response; re-sort; update counter.  
- Fixed add-form blur/submit race (idempotent restore).  
- Moved completion handling to `change` event so sorting always runs.  
- Counters update for both source and destination after drag-and-drop.  
- Clipped completion flare to the card (`overflow:hidden`, non-interactive
  `::after`).

**Status**  
Create + load are persisted. Sorting and counters are consistent.

**Next steps**  
1) Persist `toggleComplete` and `togglePriority`.  
2) Persist `moveTask` with position compaction.  
3) Persist `deleteTask` and `duplicateTask`.  
4) Centralize fetch/error UX and consider ETag or `updated_at`.  
5) Inline title edit, keyboard flows, and helpful empty states.

---

## Testing Notes
- Verified `getAll` via curl and in UI (Weekdays/Chores sample).  
- Confirmed `createTask` persists, sorts correctly, and updates counters.  
- Counters stay accurate after drag-and-drop and after add.  
- Completion flash stays inside the task card.

---
## 2025-08-10 22:15 — Session Summary & Next Steps
**Focus**
Consolidate progress and set the next implementation path.

**Key work**
- Stabilized end-to-end flow for load, create, and cross-column move.
- Normalized client sorting triggers (render, DnD, completion change).
- Updated spec to 4.2.0 Beta; documented CSRF protection and QA criteria.
- Confirmed curl tests for createTask, moveTask, and getAll.

**Status**
Core board interactions are persisted and reliable. Remaining mutations are
documented and scheduled.

**Next steps (priority order)**

1) Status persistence
   toggleComplete(task_id, completed) and togglePriority(task_id, on);
   update status, return normalized task, and re-sort on response.
2) In-column reordering
3) Extend moveTask with to_position or before_task_id; transactional
   updates; dense positions after write.
4) Delete and duplicate
  deleteTask (remove + compact) and duplicateTask (insert at end).
5) CSRF enablement in code
   Generate token per session; emit <meta name="csrf">; validate
   X-CSRF-Token for all writes; set cookie flags (HttpOnly,
   SameSite=Lax, Secure in prod).
6) Error UX
7) Replace alerts with a small toast; standardize error envelope and logging.


---
## 2025-08-10 22:15 — Session Summary & Next Steps

**Session scope**

Focus: make board interactions fully persistent and smooth across desktop
and mobile. We prioritized correctness (DB writes) and UX (sorting and
mobile reachability).

**What changed in this session**

Backend (PHP)
  •	Gateway (/api/api.php)
  •	Confirms JSON for POST, validates CSRF on mutations, returns JSON with
proper status codes.
  •	Tasks module (/api/modules/tasks.handler.php)
  •	Added actions: createColumn, deleteColumn, duplicateTask,
deleteTask, reorderColumn, toggleComplete, togglePriority,
moveTask, getAll.
  •	Cross-column moves now append at destination and re-compact positions
in the source column.
  •	Same-column manual order saved via reorderColumn.
  •	Defensive ownership checks on every mutating action.
  •	Dense, zero-based positions per column are maintained.
  •	Debug logging writes to debug.log when DEVMODE=true.

Frontend (JS/CSS)
  •	tasks.js v4.5
  •	Uses X-CSRF-Token header from <meta name="csrf">.
  •	Adds persisted duplicate and delete (quick actions).
  •	Fixes race in add-task footer (blur vs submit).
  •	Re-sorts after completion/priority changes; counters refresh correctly.
  •	Drag-and-drop persists cross-column moves; manual same-column order is
queued through reorderColumn.
  •	“Move here” flow persists through API and exits move mode safely.
  •	CSS
  •	Mobile bottom safe-area spacer so column footers (“+ New Task”, move
target) are reachable on iOS Safari/Chrome.
  •	Kept flare animation scoped to the task card, not the whole column.

Data model notes
  •	tasks.status is ENUM('normal','priority','completed').
  •	columns.position and tasks.position are dense per user+column.

Security
  •	Sessions issue CSRF token; gateway requires the token for all mutations.
  •	Reads can be GET or POST JSON; mutations must be POST JSON with CSRF.

Testing performed
  •	CURL/jq sanity checks for getAll, create/move, and columns.
  •	UI tests for add, delete, duplicate, move (both methods), complete, and
priority toggles.
  •	Mobile tests on iOS Chrome and Safari for footer reachability.

Known gaps / watch-list
  •	Quick actions for priority toggle are UI-only (persisting server-side is
available; we should wire it).
  •	Completed tasks currently ignore priority toggling by design; document
clearly in spec.
  •	Column reordering (drag columns left-right) not implemented yet.
  •	No soft-delete/undo for tasks or columns.
  •	No auth; userId is stubbed to 1.

**Recommended next steps (ordered)**
  1.	Wire priority persistence: call togglePriority in tasks.js and
update the UI only on success (with optimistic UI + rollback).
  2.	Persist completion from checkbox: we already sort locally; add a
call to toggleComplete so status is saved immediately.
  3.	Column management UX: add “Rename column” and persist; add
drag-to-reorder columns and a reorderColumns endpoint.
  4.	Error handling polish: unify toast/inline errors instead of alerts;
include reason strings from backend.
  5.	Auth stub to multi-user: introduce a simple login in dev or set
userId via session to test per-user isolation.
  6.	Undo affordance: brief snackbar with “Undo” for task delete and
column delete (server-side soft delete or restore).
  7.	Spec and docs: incorporate the API/CSRF updates and mobile behavior
so new contributors can ramp quickly.

## 2025-08-15 00:00 — Inline Editing + Persistence Pass
**Focus**
Bring v3’s inline rename UX to v4 and finish persistence for priority,
complete, and task ordering while hardening move mode.

**Key work**

> Column titles are inline editable (dbl-click / double-tap).
> Task titles are inline editable with optimistic UI and rollback.
> Added API actions: renameColumn, renameTaskTitle.
> Fixed priority/complete wiring (now persisted immediately).
> Same-column reordering persists via reorderColumn.
> Cross-column moves persist and compact source positions.
> Quick action “Move” restored; move-mode footers hardened.
> Guarded inline editors against Enter+blur double commits.

**Why it matters**
Editors match v3 muscle memory on desktop and mobile, reduce friction,
and keep board state consistent across refreshes and devices.

**Implementation highlights**

> JS: dblclick handlers create a scoped input, commit on Enter/blur,
cancel on Esc; single-fire guard prevents replaceWith race.
> PHP: tasks.handler.php gained renameTaskTitle() and renameColumn();
all mutating routes retain CSRF and ownership checks.
> Business rule enforced: completed tasks cannot be re-prioritized.

**Testing performed**
> Desktop: Chrome drag/drop, rename, priority, complete, duplicate,
delete, create; refresh persistence verified.

>Mobile: iOS Safari/Chrome double-tap rename, move-mode buttons within
thumb reach; counts/sorting remain correct.

**Known gaps / watch-list**
> Column left↔right drag reordering not implemented.
> No undo UI for delete operations.
> Alerts remain; move to toasts/snackbars with reasons.
> Auth is still stubbed; multi-user not yet enabled.

**Next steps (recommended)**
1. Column reorder (drag headers left↔right) + reorderColumns API.
2. Replace alerts with non-blocking toasts and add short “Undo” for
   deletes (soft-delete or restore endpoint).
3. Unify quick actions to include “Rename” as fallback when dbl-tap is
   unavailable (accessibility).
4. Add lightweight auth in dev so userId comes from session; keep
   ownership checks intact.
5. Extend encrypted task payload to include optional notes and
   dueDate; wire Unified Editor save.
   
## 2025-08-20 22:00 — Rollback & Stabilization
   **Focus**Preserve stability by reverting failed journal scaffold and confirm tasks flow integrity.
   **Key work**
   * Discarded partial journal view scaffold after repeated 500 errors.
   * Restored last stable commit; tasks board functions as expected.
   * Verified API gateway + tasks.handler.php still stable.
   * Confirmed task create, move, sort, and counter updates persist correctly.
   * Debug logging mechanism present but debug.log pending creation.
   
   ⠀**Status**Stable baseline recovered. Tasks view persists smoothly; journal view not yet started.
   
   **Recommended next steps**
   1 Create debug.log in project root with writable permissions. (verify with test.php to create it)
   2 Reintroduce journal view incrementally with isolated code to avoid regressions.
   3 Add column reordering (drag headers ↔).
   4 Replace alerts with toast/snackbar error UX.
   5 Introduce lightweight dev auth (session userId).

---
   ## 2025-08-30 23:00 — Beta 5 Foundation & Core Authentication
   
   **Focus**
   Start a complete rebuild for Beta 5, establishing a robust and secure
   foundation before implementing core features. The primary goal was to move away
   from hardcoded user stubs and build a proper, session-based authentication
   system from the ground up.
   
   **Key work**
   * Established the new, spec-aligned lowercase directory structure.
   * Created the Beta 5 database schema for `users`, `columns`, and `tasks`.
   * Built the core backend files: `/incs/config.php` and `/incs/db.php`.
   * Implemented the full user **registration flow**, including the frontend
	   page, shared CSS, and the backend API with `password_hash`.
   * Implemented the full user **login flow**, including the frontend page,
	   backend API with `password_verify` for security, and session creation.
   * Created the main application shell, `index.php`, which is now protected by a
	   session check that redirects unauthenticated users.
   * Built the backend API for fetching the task board (`/api/api.php` gateway
	   and `/api/tasks.php` handler).
   * Created initial frontend scripts (`app.js`, `tasks.js`) to call the API.
   * Identified a 404 error caused by an incorrect relative path in the
	   JavaScript `fetch` call.
   
   **Status**
   The foundational authentication system is complete and functional. Users can
   register, log in, and access a protected `index.php` page. The backend API to
   supply task board data is in place. We have just identified the final issue
   preventing the frontend from fetching this data.
   
   **Recommended next steps (priority order)**
   1.  **Fix the 404 pathing error.** Modify `index.php` to provide a base URL
	   to the JavaScript, and update `tasks.js` to use it, ensuring API calls
	   work correctly regardless of the project's subdirectory.
   2.  **Implement Client-Side Decryption.** Update `tasks.js` to handle the
	   zero-knowledge encryption specified in the spec. This involves creating a
	   crypto helper, deriving the key from the user's password on login, and
	   decrypting task data after it's fetched.
   3.  **Build "Create Column" functionality.** Add the "+ New Column" UI to
	   `index.php` and create the corresponding `createColumn` action in the
	   backend API and `tasks.js`.
   4.  **Build "Create Task" functionality.** Add the "+ New Task" UI to each
	   column and wire it up to the backend.

---
## 2025-08-31 12:00 — Tasks View: Core Interactivity & Persistence

**Focus**
Build out the core user interactions for the Tasks view, including creating columns and tasks, marking tasks as complete, and reordering tasks. The goal was to make the board feel alive and ensure all user actions are saved to the database.

**Key work**
* **Create Column:** Implemented the full frontend and backend logic. The "+ New Column" button now transforms into an inline input field, calls the API, and renders the new column without a page reload.
* **Create Task:** Implemented the full frontend and backend logic. The "+ New Task" input in each column footer is now active, creating and rendering new tasks in real-time.
* **Task Styling & Structure:** Added view-specific CSS to `/uix/tasks.css` to style the columns and task cards, including the status band and checkbox.
* **Mobile-First Layout:** Implemented responsive CSS that stacks columns vertically on narrow screens, ensuring a usable mobile experience.
* **Toggle Task Completion:** Built the full stack for this feature. Clicking the checkbox on a task card now calls the backend `toggleComplete` action, persists the new `classification` (`completed` or `support`), and updates the card's visual style.
* **Drag & Drop (DnD):** The foundation for DnD has been implemented.
   * **Frontend:** Task cards are now draggable. The JavaScript correctly handles the drag events to reorder cards visually within a column.
   * **Backend:** A `reorderTasks` API action was created to receive the new order of tasks and update their `position` in the database.

**Status**
The main tasks view is now highly interactive. Users can build out their board by creating columns and tasks. Task completion is fully functional and persisted. The visual foundation for drag and drop is in place, but we stopped just before fully connecting the frontend `dragend` event to the backend persistence logic.

**Recommended next steps (priority order)**
1.  **Fix DnD Persistence:** The final connection for drag-and-drop is not working. We need to debug the `dragend` event handler in `tasks.js` to ensure it correctly calls the `reorderTasks` API and that the column's task count is updated after the drop.
2.  **Implement Task Classification:** The spec's core "Signal/Support/Noise" feature is next. This involves:
   * Adding a UI element (e.g., clicking the status band) to cycle a task's classification.
   * Updating the backend to handle a `toggleClassification` action.
   * Adding CSS to color-code the status bands according to the spec (Green, Blue, Orange).
3.  **Build Column & Task Actions:** Implement the dropdown/context menus for columns (Rename, Delete) and tasks (Edit, Duplicate, Delete, etc.).

---
## 2025-08-31 21:00 — Environment Configuration & Stability

**Focus**
Resolve a critical 500 Internal Server Error on the remote (Hostinger) environment and implement a secure, portable method for managing credentials. The goal was to ensure the application runs consistently across both local and remote setups.

**Key work**
* **Debugging:** Diagnosed a 500 error on the remote server by creating temporary test scripts (`test_db.php`, `test_env.php`) to isolate the issue.
* **Credential Management:** Refactored the application to use a `.env` file for storing sensitive credentials (database, SMTP). This removes all passwords from the version-controlled `config.php` file.
* **Environment Portability:** Installed the `vlucas/phpdotenv` Composer package to reliably load environment variables on both local and remote servers.
* **URL Pathing:** Implemented a dynamic `APP_URL` constant and updated all frontend API calls to use it, ensuring that the application can be deployed to any domain or subdirectory without code changes.
* **File Cleanup:** Removed outdated and unnecessary rules from the `.htaccess` file.

**Status**
Both the local and remote environments are now fully functional and in sync. The application is more secure and portable, with a clear separation between code and configuration. The drag-and-drop functionality for tasks is the next feature in progress.

**Recommended next steps (priority order)**
1.  **Fix DnD Persistence:** Resume the implementation of drag-and-drop for tasks. The frontend JavaScript needs to be updated to correctly call the `reorderTasks` API, and the backend needs to be tested to ensure the new task order is persisted.
2.  **Implement Task Classification:** Begin work on the "Signal/Support/Noise" feature, which is a core part of the application's value proposition.
3.  **Build Column & Task Actions:** Implement the dropdown/context menus for columns and tasks (Rename, Delete, Duplicate, etc.).

---
## 2025-09-01 01:00 — Task & Column Management Overhaul

**Focus**
To build out the core management features for the Tasks View, making both columns and tasks fully interactive and persistent, and to complete the Task Classification system with enforced sorting.

**Key work**
* **Task Classification System:** Implemented the full stack for Signal/Support/Noise classification, including the backend API, frontend click-to-cycle logic, and CSS for color-coding. An accessibility pattern (stripes) was added to the "Support" band.
* **Enforced Sorting:** Integrated a robust sorting function into `tasks.js`. The `Signal > Support > Noise > Completed` hierarchy is now automatically enforced on page load, task creation, classification changes, and after every drag-and-drop operation.
* **Column Management:**
  * **Rename:** Column titles can now be edited in-line with a double-click.
  * **Delete:** A hover-activated delete button with a confirmation prompt is now functional. The backend safely deletes the column and its tasks within a transaction.
  * **Reorder:** Hover-activated `<` and `>` buttons allow for reordering columns, with logic to hide buttons at the edges of the board.
* **Task Management:**
  * **Actions Menu:** An always-visible "..." button now appears on each task card, which opens a contextual menu.
  * **Delete Task:** The actions menu contains a functional "Delete" button with a confirmation prompt. The backend removes the task and re-compacts the positions of remaining tasks in the column.
  * **Rename Task:** Task titles are now editable in-line with a double-click, using the same pattern as column renaming.
* **Bug Fixes:**
  * Fixed a critical bug where the task counter for the source column would not update after a cross-column drag-and-drop.
  * Corrected several CSS bugs related to the task status band's height and appearance.

**Status**
The Tasks View is now highly functional and aligns closely with the core spec. All primary column and task management actions (Create, Read, Update, Delete) are implemented and persisted. The board is stable and interactive, providing a solid foundation for the remaining task-level features.

**Recommended next steps (priority order)**
1.  **Expand Task Actions Menu:** The menu foundation is built. The next logical step is to add the "Duplicate Task" action, which was a core feature in Beta 4.
2.  **Enhance UI Feedback:** Replace the native browser `confirm()` and `alert()` pop-ups with custom, non-blocking modals and toast notifications as defined in the spec for a more polished user experience.
3.  **Implement Task Details:** Add support for task notes and due dates, which are key features listed in the spec. This would involve extending the task actions menu and potentially integrating a more advanced editor or date picker.

---
## 2025-09-01 15:52 — UI Polish, Task Duplication & Toast Notifications

**Focus**
Refine the application's core UI, expand task management capabilities with duplication, and replace jarring browser alerts with a modern toast notification system for improved user feedback.

**Key work**
* **Header & Branding:** The main header in `index.php` was updated to include the MyDayHub SVG logo and to use the same SVG as a browser favicon. The placeholder "Tasks" button was removed.
* **Task Duplication (Full Stack):** The "Duplicate Task" feature was implemented end-to-end.
	* **Backend:** A `duplicateTask` action was added to `/api/tasks.php`, which safely copies a task and places it at the end of its column.
	* **Frontend:** The task actions menu in `tasks.js` now includes a "Duplicate" button that calls the new API and renders the new task card in real-time.
* **Toast Notification System:** A global, non-blocking notification system was built to improve UI feedback.
	* An HTML container was added to `index.php`.
	* A full set of CSS styles and animations were created in `/uix/style.css`.
	* A reusable `showToast()` function was added to `/uix/app.js`.
* **UI Feedback Overhaul:** All native `alert()` calls throughout `tasks.js` were replaced with calls to the new `showToast(..., 'error')` function. A `showToast(..., 'success')` message was also added to the task duplication flow.

**Status**
The application's UI is more polished and branded. Task duplication is fully functional and tested. The new toast system provides non-blocking feedback for all errors and some success actions, significantly improving the user experience and aligning the app closer to the spec.

**Recommended next steps (priority order)**
1.  **Implement a Custom Confirmation Modal:** We've replaced `alert()`, but the app still uses native `confirm()` for deleting tasks and columns. The next step is to build a reusable, non-blocking confirmation modal. This will involve creating the HTML/CSS for the modal and writing a JavaScript function that returns a `Promise`, allowing us to use it cleanly with `async/await` (e.g., `if (await showConfirmModal(...))`).
2.  **Add Success Toasts to More Actions:** To provide consistent feedback, we should add success toasts for other key actions like creating, renaming, and deleting tasks and columns.
3.  **Implement Task Details (Notes & Due Dates):** With the core management features and UI feedback systems in place, we can now proceed with a major feature from the spec: adding support for detailed notes and due dates on tasks.