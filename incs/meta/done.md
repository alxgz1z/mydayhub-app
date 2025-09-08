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

---
## 2025-09-01 22:27 — Major Feature: Unified Editor & UI Polish

**Focus**
To complete the UI feedback loop by replacing native pop-ups, and to integrate the full-featured Unified Note Editor with backend persistence for task notes.

**Key work**
* **Custom Confirmation Modal:** Replaced all native `confirm()` dialogs with a custom, non-blocking modal in `app.js`. The new `showConfirm()` function returns a Promise, allowing for a clean `async/await` implementation in `tasks.js`.
* **Success Toast Notifications:** Added `showToast(..., 'success')` calls to all create, rename, and delete actions for tasks and columns, providing consistent and positive user feedback.
* **Unified Note Editor (Full Stack):**
	* Successfully ported the HTML, CSS, and JS for the editor from the Beta 4 codebase into the Beta 5 structure (`index.php`, `uix/editor.css`, `uix/editor.js`).
	* **Backend:** Created the `saveTaskDetails` API action in `/api/tasks.php` to securely receive and persist notes content in the `encrypted_data` field.
	* **Frontend:** The editor's "Save & Close" and "X" buttons now trigger an API call to save any changes. On success, the task card's `data-notes` attribute is updated to keep the UI in sync.
* **Editor Enhancements:**
	* Implemented client-side logic for the **Font Size (A-/A+)** buttons.
	* Implemented **Tab and Shift+Tab** key handling for indentation and outdentation.
* **Bug Fixes & Versioning:**
	* Resolved a critical bug where `editor.js` was not being loaded in `index.php`.
	* Corrected syntax errors in the `tasks.php` handler.
	* Began updating file headers to application version **5.1.0**.

**Status**
The application is now at version 5.1.0. The user experience is significantly improved with non-blocking modals and toasts. The Unified Note Editor is fully integrated and can successfully persist notes for tasks, marking a major feature milestone.

**Recommended next steps (priority order)**
1.  **Implement Editor Autosave:** The spec calls for notes to be auto-saved. We should implement a timer-based or on-idle save mechanism in `editor.js` that calls the `save()` function automatically.
2.  **Implement Task Due Dates:** This is the second half of the "Task Details" feature. It will involve adding a "Due Date" button to the task actions menu, integrating a simple date picker, and extending the `saveTaskDetails` API to handle the `dueDate` field.
3.  **Persist Editor Font Size:** Implement the backend functionality to save the user's preferred editor font size as a user preference, as we discussed.

---
## 2025-09-02 22:29 — Editor Enhancements, Due Dates & Major Bug Fixes

**Focus**
To enhance the Unified Note Editor with autosave and preference persistence, to implement the full-stack "Due Date" feature, and to resolve several critical bugs related to timezones and UI rendering.

**Key work**
* **Editor Autosave:** Implemented a debounced autosave feature in `editor.js` to automatically persist note changes after a user stops typing.
* **Font Size Persistence (Full Stack):**
  * **Architecture:** Implemented a scalable `preferences` JSON column in the `users` table and created a new, dedicated `/api/users.php` handler for user-specific settings.
  * **Functionality:** The user's preferred editor font size is now loaded with the board and saved automatically when changed.
* **Task Due Dates (Full Stack):**
  * Added `due_date` column to the `tasks` table.
  * Updated the backend to save and retrieve due dates.
  * Replaced the simple pop-up with a polished, reusable **modal window** for setting or clearing dates, improving the UX significantly.
* **Critical Bug Fixes:**
  * **Timezone:** Standardized all database timestamps to **UTC** by replacing `NOW()` with `UTC_TIMESTAMP()` throughout the backend, fixing a 3-hour discrepancy bug.
  * **UI Rendering:** Diagnosed and fixed multiple critical UI bugs, including a corrupted `editor.css` file, a missing `</div>` in `index.php`, and missing CSS variables that caused transparency issues with the actions menu.

**Status**
The editor is now significantly more robust with autosave and preference persistence. The application's data integrity is improved with standardized UTC timestamps. The **due date feature is fully implemented** and functional. All known UI rendering bugs have been resolved, and the application is stable.

**Recommended next steps (priority order)**
1. **Implement Task Priority:** The actions menu has several items pending. The next logical one is to wire up the "Priority" toggle, which will involve a new API action and UI updates.
2. **Build Bottom Toolbar & Filters:** Implement the bottom toolbar specified in the spec, including the initial filters for showing/hiding shared or completed tasks.
3. **Implement Task Attachments:** Begin the next major feature: allowing users to attach images to tasks, including the UI for a drop zone, the gallery modal, and the backend logic for file uploads and storage quotas.

---
## 2025-09-03 08:30 — App Version & Dev Mode Indicator

**Focus**
Enhance application awareness and safety by adding a version display and a visual indicator for the development environment.

**Key work**
* **Configuration:** Defined a new `APP_VER` constant in `config.php` to track the application version.
* **Security Hardening:** Removed hardcoded fallback credentials from `config.php` to make the `.env` file the single source of truth for all environments.
* **UI Implementation:**
	* Updated the footer in `index.php` to display the version number and to conditionally add a `.dev-mode` class if `DEV_MODE` is true.
	* Rearranged footer items for better logical grouping (User/Date on left, Version/Logout on right).
	* Added CSS in `style.css` to give the `.dev-mode` footer a distinct dark red background, providing an unmistakable visual cue when not in production.
	* Implemented a function in `app.js` to make the footer date dynamic and format it to `dd mmm yy`.

**Status**
The feature is complete and functional. The application now clearly displays its version and provides a visual warning when running in development mode. The footer layout and date format now match the new requirements.

**Recommended next steps (priority order)**
1.  **Implement Task Priority:** Begin the next feature from the spec. This will involve adding a `priority` field or modifying the `classification` enum in the `tasks` table, creating a `togglePriority` API action, and wiring it up to the task actions menu.

---
## 2025-09-03 23:14 — Bottom Toolbar & Persistent Filters

**Focus**

Implement the bottom toolbar and the 'Show/Hide Completed' filter with persistence, based on a mobile-first contextual menu approach.

**Key work**

* HTML (index.php): Added the new filter button with a custom SVG icon to the footer's center.
* CSS (style.css): Created styles for the new filter menu and a custom on/off slider toggle for filter options.
* JS (tasks.js):
	* Implemented logic to show/hide the filter menu when the footer icon is clicked.
	* Added filterState management to track the "Show Completed" status.
	* The applyAllFilters function now correctly toggles the visibility of completed tasks and triggers an update of the column task counts.
* Persistence: The filter's state is now loaded from user preferences on startup and saved to the database automatically on change, ensuring the setting is remembered across sessions.

**Status**
The filter feature is complete and functional. The 'Show Completed' setting is now persistent across sessions.

**Recommended next steps (priority order)**

1. Implement Task Attachments: Begin the next major feature from the spec. This will involve:
	* Updating the database schema with a task_attachments table.
	* Creating a new backend API action to handle file uploads, quota checks, and pruning.
	*Building the frontend UI, including a drop zone on task cards and a gallery modal to view attachments.
2. Refine UI Feedback with "Undo": Replace the permanent delete actions for tasks and columns with a temporary "Undo" option (via a toast notification), which requires a soft-delete implementation on the backend.
3. Expand Filters: Add the next filters from the spec (e.g., "Show/Hide Shared") to the new filter menu, pending implementation of the sharing feature.

---
## Timestamp: 2025-09-04 22:28 - File attachments to tasks
Version: Beta 5.2.0 (feature start)

**Focus**

Begin the implementation of the Task Attachments feature by building its complete foundation, from the database to a visible, interactive frontend modal.

**Key work**

* Database: Created the task_attachments table with all necessary fields to store file metadata and link to users and tasks.
* Backend API (api.php, tasks.php):
	* The main API gateway (api.php) was updated to handle multipart/form-data requests, a requirement for file uploads.
	* The tasks.php handler was significantly updated with new actions:
		* uploadAttachment: A robust endpoint to handle file validation, storage quota checks, our "pruning" policy (deleting the oldest file to make space), secure file saving, and database record creation.
		* getAttachments: An endpoint to securely retrieve a list of attachments for a specific task.
	* The getAll action was updated to include an attachments_count for each task, allowing the UI to display indicators efficiently.
* Frontend UI (index.php, attachments.css, tasks.js):
	* Added the HTML shell for the attachments gallery modal to index.php.
	* Created a dedicated stylesheet, /uix/attachments.css, for all modal-related styling.
	* Updated tasks.js to allow the modal to be opened from the task actions menu ("...").
	* The JavaScript now successfully calls the getAttachments API and renders the list of attachments (or an empty state message) inside the modal.

**Status**
The foundation for Task Attachments is complete. The database is ready, the backend API endpoints are built and tested, and the frontend modal is fully styled and functional for viewing attachments. We successfully debugged and resolved several critical UI bugs related to CSS and JavaScript loading that were preventing interactivity. The application is now stable and ready for the final implementation phase of this feature.

**Recommended next steps (priority order)** 
* Wire Up Upload Logic: The modal is visible but the upload buttons are not yet active. The immediate next step is to update /uix/tasks.js to:
	* Make the "Add Attachment" button trigger the file input.
	* Implement the drag-and-drop event listeners (dragover, drop) for the drop zone to prevent the default browser action and handle the dropped files.
	* Create the client-side uploadAttachment function that uses FormData to post the file to the backend.
	* Ensure the modal and task card UI refresh automatically after a successful upload.
* Implement Delete Functionality: Add a deleteAttachment action to the backend API and wire it to the delete button (✕) on each item in the modal's attachment list.
* Implement Paste-to-Upload: As a final enhancement, add a paste event listener to the modal to handle uploading images directly from the clipboard.

---
## Timestamp: 2025-09-05 00:38 - Major Feature: Task Attachments Stabilized
Version: Beta 5.2.0

**Focus**
Resolve a critical 500 Internal Server Error on file uploads and stabilize the Task Attachments feature.

**Key work**
* Conducted an extensive, multi-step debugging process to diagnose a silent 500 error.
* Systematically ruled out environmental issues by creating standalone test scripts (`test_upload.php`, `test_validation.php`, `test_mime_type.php`).
* These tests proved the server environment (permissions, ownership, PHP extensions) was fully functional.
* The investigation successfully isolated the root cause to a bug in the application code.
* Identified and fixed a fatal database error in `/api/tasks.php` where the `INSERT` statement for a new attachment was missing the required `created_at` value.

**Status**
The file upload functionality is not completed. After a thorough debugging process, the server environment has been validated, but the application code has to be reviewed for a persistent 500 error despite having tested uploads in self-contained test files.

**Recommended next steps (priority order)**
1. **Finish file upload feature** that's still not woring.
2.  **Implement Delete Functionality:** Now that uploads are working, the next logical step is to allow users to delete attachments. This requires:
	* A `deleteAttachment` action in `/api/tasks.php`.
	* Wiring up the delete button (`✕`) in the attachments modal in `/uix/tasks.js`.
3.  **Implement Paste-to-Upload:** As a final enhancement from the spec, add a paste event listener to the modal to handle uploading images directly from the clipboard.
4.  **Refine Pruning Policy UX:** The current backend automatically deletes the oldest file when the quota is exceeded. The spec requires a confirmation modal to be shown to the user first. This should be implemented for a better user experience.

---
## # Timestamp: 2025-09-05 23:25 - Major Feature: Task Attachments Viewer & PDF Support

Version: Beta 5.2.5
**Focus** Finalize the user experience for viewing task attachments, resolve critical bugs, and add support for PDF files.
**Key work**
* **Viewer UX Pivot:** Based on reliability issues with embedding, the viewing logic was changed.
  * **Images:** Now open in a polished, in-app modal viewer.
  * **PDFs:** Now open directly in a new browser tab, ensuring robust functionality.
* **Full-Stack PDF Support:**
  * **Backend (**api/tasks.php**):** The list of allowed MIME types was updated to include application/pdf, enabling PDF uploads.
  * **Frontend (**uix/tasks.js **&** uix/attachments.css**):** The UI now intelligently distinguishes between file types, showing image thumbnails for images and a generic file icon for PDFs.
* **UX Enhancement:** Added a "close on Escape key" feature to both the attachments list and the image viewer modals for improved keyboard accessibility.
* **Critical Bug Fixes:**
  * Resolved a bug that caused files to upload twice on drag-and-drop by ensuring all event listeners are properly removed when the modal closes.
  * Fixed a JavaScript error that prevented the viewer modal from opening due to an ID mismatch between the HTML and the script.

⠀**Status** The Task Attachments feature is now functionally complete for adding and viewing images and PDFs. All related bugs identified during this session have been resolved. The user experience is stable and aligns with our revised plan. The "delete attachment" functionality remains as the final pending piece of this feature set.
**Recommended next steps (priority order)**
**1** **Implement Delete Functionality:** This is the final core component of the attachments feature. It requires:
	* A deleteAttachment action in /api/tasks.php that securely deletes the file and database record while updating the user's storage quota.
	* Wiring up the delete button (✕) in the attachments modal in /uix/tasks.js to call the new API after a confirmation prompt.
**2** **Refine Pruning Policy UX:** The current backend automatically deletes the oldest file when the storage quota is exceeded. The spec requires a confirmation modal to be shown to the user first. This should be implemented for a better user experience.
**3** **Implement Task Priority:** With attachments stable, we can move to the next task-level feature from the spec.

---
## Timestamp: 2025-09-06 01:28 - Feature Polish: Attachments & Classification UX

Version: Beta 5.4.0

**Focus**
Finalize the Task Attachments feature with major UI/UX improvements and stability fixes, and replace the legacy 'Priority' concept with a more accessible 'Cycle Classification' control in the task actions menu.

**Key work**
* **Attachments UI Overhaul:**
	* Clarified button labels in the modal to "Browse Files..." and a dynamic "Upload X Files" for better user guidance.
	* Implemented a fully functional, real-time storage quota bar that accurately reflects usage after uploads and deletions.
	* Fixed the Escape key behavior to ensure it only closes the top-most modal (image viewer) instead of all open modals.
	* Corrected image sizing in the viewer to display images at their natural size unless they exceed the viewport, in which case they scale down while maintaining aspect ratio.
* **Cycle Classification Feature:**
	* Removed the redundant "Priority" feature from the development plan.
	* Added a "Cycle Classification" button with a clear icon to the task actions menu, providing a second, accessible way to change a task's status.
* **Critical Bug Fix:**
	* Resolved a persistent bug that caused modals to open and actions to fire twice for a single click (e.g., the "double toast" issue) by implementing a debounce guard on modal-opening functions.

**Status**
The Task Attachments feature is now feature-complete, polished, and stable for the local development environment. The task classification workflow is enhanced, and a critical stability issue has been resolved. The Tasks View is robust and meets all initial design goals.

**Recommended next steps (priority order)**
1.  **Troubleshoot Production Environment:** Investigate and resolve the issues preventing the attachments feature from working on the Hostinger test environment (likely related to server configuration or file permissions).
2.  **Implement "Undo" for Deletes:** Enhance the user experience by replacing the permanent delete actions for tasks and columns with a temporary "Undo" option, which will require implementing a soft-delete pattern on the backend.
3.  **Begin Privacy Foundation:** Add the `is_private` flag to tasks and columns and implement the `togglePrivacy` API action. This will serve as the foundation for the larger sharing feature set.
4.  **Implement Settings Slider Panel:** Build the UI shell for the global settings panel, accessible from the main header, to house future application-wide preferences.


---
## Timestamp: 2025-09-06 22:03 - Stability Fixes: Attachments & UI Integrity

Version: Beta 5.5.0

**Focus**
Resolve a critical bug preventing the UI from updating after an attachment was deleted, and to harden the frontend against unexpected API responses.

**Key work**
* **Bug Diagnosis:** Traced a UI freeze and console error to a JavaScript crash. The error occurred when deleting an attachment, as the backend would sometimes return a non-numeric value for the user's remaining storage, causing the `updateStorageBar` function to fail.
* **Resiliency Fix:** Implemented a defensive guard in the `updateStorageBar` function in `/uix/tasks.js`. This check ensures the function can handle `null` or `undefined` values from the API without crashing, which in turn allows the subsequent UI refresh logic to execute correctly.
* **UI Integrity Restored:** With the crash prevented, deleting the final attachment on a task now correctly and immediately removes the attachment indicator from the task card footer, ensuring the UI stays in sync with the application's state.

**Status**
The Task Attachments feature is now fully stable and robust across all core actions (upload, view, and delete). A critical data-handling bug has been resolved, improving overall application stability. The Tasks View is feature-complete and polished.

**Recommended next steps (priority order)**
1.  **Implement "Undo" for Deletes:** Now that the core task functionality is stable, enhance the user experience by replacing permanent delete actions for tasks and columns with a temporary "Undo" option. This will require implementing a soft-delete pattern on the backend.
2.  **Begin Privacy Foundation:** Add the `is_private` flag to tasks and columns and implement the `togglePrivacy` API action. This will serve as the foundation for the larger sharing and privacy features.
3.  **Implement Settings Slider Panel:** Build the UI shell for the global settings panel, accessible from the main header, to house future application-wide preferences.

---
# Timestamp: 2025-09-07 01:03 - Major Feature: Privacy & Filtering System
Version: Beta 5.5.2

**Focus** To implement a full-stack privacy system allowing users to mark tasks and columns as private, and to build a persistent frontend filter to control their visibility.
**Key work**
* **Database:** Added an is_private boolean column to the columns table to support column-level privacy.
* **Backend API (**/api/tasks.php**):**
  * Created a new togglePrivacy action that securely handles state changes for both tasks and columns, including ownership checks.
  * Updated the getAll action to return the is_private status for all tasks and columns.
* **Frontend UI (**/uix/tasks.js**,** /uix/tasks.css**):**
  * Added privacy toggle controls with icons to the column headers and task action menus.
  * Implemented a prominent diagonal-line pattern via CSS to visually distinguish private items.
* **Filtering System (**/uix/tasks.js**):**
  * Added a "Show Private Items" toggle to the footer filter menu.
  * The filter's on/off state is now saved to and loaded from user preferences, making the choice persistent across sessions.
  * The applyAllFilters() logic was expanded to hide/show private items based on the filter's state.
* **Critical Bug Fixes:**
  * Diagnosed and fixed a recurring "double-fire" event bug on both the task actions menu and column header controls by implementing a robust isActionRunning debounce guard.
  * Resolved a CSS specificity conflict that initially prevented the new Settings Panel from appearing.

⠀**Status** The privacy and filtering systems are feature-complete, stable, and persistent. Users can now control the privacy of individual items and filter them from view. The application is significantly more robust after resolving several elusive UI bugs. The basic shell for the Settings Panel is also in place, though a mobile Safari bug has been noted for future investigation.
**Recommended next steps (priority order)**
**1** **Troubleshoot Mobile Safari:** Investigate and resolve the bug preventing the Settings Panel from opening on mobile Safari.
**2** **Implement "Undo" for Deletes:** Revisit this high-priority UX improvement. Replace permanent deletes with a temporary "Undo" option via a toast notification, which requires implementing a soft-delete pattern on the backend.
**3** **Build Out Settings Panel:** Add the first functional setting to the new panel, such as the "High-Contrast Mode" toggle specified in the spec.

---
## Timestamp: 2025-09-07 15:50 - Major Feature: Undo for Deletes & Bug Fixes

Version: Beta 5.7.2

**Focus**
Implement a full-stack soft-delete and "Undo" system for tasks and columns to improve user experience and prevent accidental data loss. This session also focused on resolving several critical UI bugs.

**Key work**
* **Undo Feature (Full Stack):**
	* **Database:** Added a `deleted_at` nullable timestamp column to both the `tasks` and `columns` tables to enable soft deletes.
	* **Backend API (`/api/tasks.php`):** Replaced permanent `DELETE` statements with `UPDATE` statements to set the `deleted_at` timestamp. A new `restoreItem` action was created to undo the deletion. The `getAll` action was updated to exclude soft-deleted items from being sent to the client.
	* **Frontend UI (`/uix/tasks.js`):** Replaced all blocking `confirm()` modals for deletions with a non-blocking `showToast` notification that includes an "Undo" button and a 7-second timeout for permanent DOM removal.
* **Enhanced Toast System:**
	* Overhauled the global `showToast()` function in `/uix/app.js`. It now accepts a flexible `options` object, features a longer default duration (5s), includes a close button on all toasts, and supports a custom action button with a callback.
	* Added corresponding styles in `/uix/style.css` for the new toast components.
* **Critical Bug Fixes:**
	* Resolved a bug preventing the Settings Panel from opening on mobile Safari by adding `cursor: pointer` in `style.css`.
	* Fixed a regression bug that caused new tasks to be created twice by applying the `isActionRunning` debounce guard to the `keypress` event listener.
	* Corrected a `ReferenceError` that prevented the Undo action from working by reordering the `restoreItem` function definition in `tasks.js` to resolve a scope issue.

**Status**
The Undo feature is now feature-complete, stable, and fully tested. Two long-standing bugs and one new regression have been resolved. The application is in a robust and polished state.

**Recommended next steps (priority order)**
1.  **Build Out Settings Panel:** Add the first functional setting, "High-Contrast Mode," as specified in the spec. This will involve updating the UI based on a persistent user preference.
2.  **Column Reordering (Drag & Drop):** Implement drag-and-drop for reordering entire columns, which is a key missing piece of board management.

---

# Timestamp: 2025-09-07 20:05 - UX Overhaul: Classification Popover & CSRF Foundation

Version: Beta 5.9.0
**Focus** To completely overhaul the task classification user experience, replacing the inefficient click-to-cycle method with an intuitive popover. A second major goal was to implement a full-stack CSRF protection mechanism to secure all mutating API endpoints.
**Key work**
* **Terminology & Database:** Replaced the term 'Noise' with 'Backlog' throughout the application. The tasks table schema was altered, and a data migration script was run to update existing records.
* **UX/UI Overhaul:**
  * Implemented a contextual popover menu that appears when a task's status band is clicked, allowing for direct selection of 'Signal', 'Support', or 'Backlog'.
  * The redundant "Cycle Classification" button was removed from the task actions menu, simplifying the UI.
  * Added CSS to /uix/tasks.css to style the new popover for a polished, professional appearance.
* **Security Hardening (CSRF):**
  * **Token Generation:** /incs/config.php now generates a secure, unique CSRF token for each user session.
  * **Token Embedding:** /index.php embeds this token in a <meta name="csrf-token"> tag in the page head.
* **Major Code Refactor:**
  * A new, global apiFetch() helper was created in /uix/tasks.js. This function now handles all mutating API calls, automatically reading the CSRF token and adding it to the request headers.
  * All existing fetch() calls for POST requests in tasks.js were refactored to use this new, more secure helper.
  * The API gateway (/api/api.php) was made more robust to handle different JSON payload structures.

⠀**Status** The classification feature is now feature-complete, stable, and provides a significantly improved user experience. The foundation for CSRF protection is fully implemented on the frontend. The next critical step is to enforce token validation on the backend.
**Recommended next steps (priority order)**
**1** **CRITICAL - Enable CSRF Validation:** Update /api/api.php to validate the X-CSRF-TOKEN header against the session token for all mutating requests. This is a critical security step that is not yet active.
**2** **Implement Mobile "Move Mode":** Begin the implementation of the button-based "Move Mode" for mobile users by creating the moveTask API action in /api/tasks.php, adapting the logic from the Beta 4 codebase.
**3** **Build Out Settings Panel:** Add the first functional setting, "High-Contrast Mode," as specified in the spec. This will involve updating the UI based on a persistent user preference.

---
## Timestamp: 2025-09-07 21:38 - Security Hardening & Major UI Polish

Version: Beta 5.9.8

**Focus**
To complete the CSRF security implementation by enabling server-side validation, to deliver the mobile-friendly "Move Mode" feature, and to apply a significant round of UI polish based on Beta 3 aesthetics.

**Key work**
* **Security Hardening:** Activated server-side CSRF token validation in `/api/api.php`. All `POST` requests now require a valid token, protecting against CSRF attacks.
* **Mobile "Move Mode" (Full Stack):** Implemented the button-based system for moving tasks between columns on touch devices. This included adding the `moveTask` action to the backend and all necessary state management, UI transformations, and event handling to `tasks.js`.
* **UI & Animation Overhaul:**
	* Updated the global accent color to a more vibrant blue (`#3B82F6`) in `style.css`.
	* Added a "raise" animation and shadow on task card hover in `tasks.css`.
	* Implemented a blue focus ring for all input fields, including inline renaming, for better accessibility and visual feedback.
	* Added a "tremor" animation to task cards when they are selected in Move Mode.
	* Restyled the main header with the new accent color for a more prominent look.

**Status**
The application is now functionally complete regarding core task management for a single user on both desktop and mobile. All major UI polish tasks from this session are complete, and the API is significantly more secure.

**Recommended next steps (priority order)**
1.  **Build Out Settings Panel:** This is the next major feature from the spec. Begin by implementing the UI shell and the first option: the "High-Contrast Mode" toggle.
2.  **Column Reordering (Drag & Drop):** The current button-based reordering works but is not ideal for desktop. Implement drag-and-drop for the column headers themselves.
3.  **Begin Sharing Foundation:** Start the groundwork for task/column sharing. This would involve adding the UI controls (e.g., a "Share" button in menus) and creating the initial placeholder API actions.
