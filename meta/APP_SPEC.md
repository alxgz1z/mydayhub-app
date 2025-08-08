					============================
					MYDAYHUB APP SPEC 4.0.0 Beta
					(Internal – Dev/PM Use Only)
					============================

All features, logic, UI, and modules in this spec are to be developed from scratch
for 4.0.0 Beta. No legacy code will be reused.

---
### Visual Status Icons

🚧 In Progress / Not Developed Yet
✅ Complete
⚠️ Not Working as Specified
📅 Planned for Future Release

---
### ❗️ IMPORTANT:

We operate in two environments.
- The production app runs in mydayhub.com.
- The development app runs in localhost:8888.
These environments are isolated.

---
### 1. Executive Summary

MyDayHub 4.0.0 Beta is a secure, zero-knowledge productivity hub, rebuilt with
full modularity, privacy, and cross-device usability as its core tenets. This
release is shaped by hard-earned lessons from previous versions—including privacy
at every level, strict session and quota controls, explicit handling of
encryption and sharing, and a relentless focus on elegant, app-like simplicity.

Every function, screen, and component is to be coded anew. All implementation,
UX, and operational patterns are designed for maintainability and extensibility.

---
### 2. App Description & Philosophy

#### Simplicity
* UI is intentionally minimal: rounded corners, clean sans-serif typography, soft
	shadows, and backdrop-filter effects for depth.
* No modal overload or overwhelming toolbars; progressive disclosure only.
* Consistent visual spacing, card elevation, and hover feedback for all
	interactive elements.

#### Privacy by Design
* 🚧 Zero-knowledge encryption: All user data—including tasks, journal entries,
	outlines, meeting notes—is encrypted and decrypted in the browser. The server
	never has access to plaintext content.
* 🚧 Every item (task, column, entry, outline, meeting segment) supports a "Mark
	as Private" switch, present at both the data model and UI levels.
* All sharing leverages public/private key cryptography. Password changes and
	sharing flows are designed to avoid historical flaws and data loss.

#### Fluidity & Mobile-First
* 🚧 SPA (Single Page App) with no reloads: All content updates, drag-drop, view
	changes, and modals are animated and instant.
* 🚧 App is built mobile-first: On mobile, controls are touch-optimized,
	toolbars collapse to sticky menus or bottom bars, and columns/cards respond
	to swipe and tap.
* On desktop, the layout is expansive and multi-column with subtle, elegant
	color contrasts (dark mode default, light mode optional and user-persistent).

---
### 3. General Requirements & Feature Matrix

| Requirement                 | Status | Notes                                           |
| --------------------------- | :----: | ----------------------------------------------- |
| Multi-user auth/session mgmt| 🚧     | Hybrid session: last login has write ctrl       |
| Client-side encryption      | 🚧     | All user content, incl. sharing                 |
| Per-item privacy switch     | 🚧     | All tasks, columns, journal, outlines           |
| Fluid, reload-free UI       | 🚧     | Optimistic, animated, no reloads                |
| Responsive mobile design    | 🚧     | Works on all device widths                      |
| Quotas/usage plans          | 🚧     | Tiered item/share limits, enforced server-side  |
| Telemetry & analytics       | 🚧     | CRUD, sharing, navigation, log events           |
| DEVMODE                     | 🚧     | Visual markers, logs, extra debug info          |
| Mail-to-task/journal        | ✅     | Unique token per user, IMAP/Sender              |
| OS notifications            | 🚧     | Push/alerts via Service Worker                  |
| Offline support             | 📅     | Phased PWA Strategy (see below)                 |
| Meeting agenda view         | 🚧     | Multi-segment, drag/drop, notes                 |
| Modular codebase            | 🚧     | Each major view and logic separated             |
| Import/export (JSON)        | 🚧     | For migration and backup                        |
| Calendar overlays           | 🚧     | CRUD for overlays, per-user selection           |

**Phased PWA Strategy for Offline Support:**
The app will be evolved into a Progressive Web App (PWA) in distinct phases.
* **Phase 1 (Core Online App):** Complete all primary features assuming a
	persistent internet connection. This is the current focus.
* **Phase 2 (App Shell Caching):** Implement a Service Worker to cache the app's
	shell (CSS, JS, images) for instant loading and basic offline UI access.
* **Phase 3 (Data Synchronization):** Implement offline data handling using
	IndexedDB, creating a local data mirror and syncing changes on reconnection.

---
### 4. User Stories & Use Cases

* 🚧 Mark any item as private and filter/hide accordingly.
* 🚧 Drag and drop items with smooth, animated feedback.
* 🚧 See usage stats and plan limits; receive UI warnings when close to quota.
* ✅ Email a task or note into the board/journal using a unique secret token.
* ✅ Share tasks or journal entries one-to-one with revocable, encrypted access.
* ✅ Use the app seamlessly on both desktop (multi-column) and mobile.
* 🚧 Work offline with automatic sync and resolution when reconnecting.
* 🚧 Avoid conflicts: Only the most recent session has write rights, with a
	"reclaim control" option.
* 🚧 Access help and onboarding, with clear feedback via toasts and OS notifications.
* 🚧 Keep user preferences always persisted in the backend instantly.

---
### 5. App Views & Detailed UX Requirements

#### 🚧 Aesthetic Foundations
* **Minimalist & Modern:** Rounded corners, clean sans-serif font, soft shadows,
	backdrop-filter blur on overlays. Default to dark mode with a user toggle.
* **Responsive:**
	* **Mobile:** Single column view, Floating Action Button (FAB) for new items,
	  sticky bottom bar for filters.
	* **Desktop:** Side-by-side columns, docked toolbars, clear drag-drop zones.

#### A. Tasks Board (Kanban)

* 🚧 **Horizontal Column Layout:**
	* 🚧 Columns are user-defined, reorderable via drag-drop, with persisted order.
	* 🚧 Header: Editable title, task count, and an ellipsis (...) menu for all
		column actions (delete, move, toggle privacy).
	* ⚠️ "Add Column" Control: A `+ New Column` button in the header transforms into
		a focused text input for rapid column creation.
	* ✅ **Mobile-Friendly "Move Mode" (↔️):** An action in the context menu
		highlights a card and adds a "Move here" button to other columns for
		easy, tap-based moving.
	* 🚧 **Column Footer & Adding Tasks:** A `+ New Task` text control in each
		column footer transforms into a focused input for rapid task entry.

* ✅ **Task Cards:**
	* **Interaction Model:**
		* **Status Band:** A visual-only colored band on the left indicates status
		  (Normal, Priority, Completed).
		* **Completion:** A dedicated checkbox marks a task as complete.
		* **Priority:** Toggled via a refresh icon (🔄) in the contextual menu.
	* ✅ **Elements:** Completion checkbox, editable title, optional due date,
		privacy lock, and a share icon.
	* ✅ **Contextual Menu (…):** A horizontal bar of icon-only buttons appears.
		* 🔄 Change Priority
		* 📝 Edit Note and Due Date
		* ↔️ Move (Mobile-friendly mode)
		* 👥 Share
		* ⛔ Mark as Private
		* 👯 Duplicate
		* 🗑️ Delete (with confirmation)
	* **Notes:** Plain text, auto-saved, max 1024 chars. A notes icon appears if
		notes exist.
	* **Visuals:** Priority tasks float to the top, completed tasks sink to the
		bottom (grayed out, strikethrough). Shared tasks have distinct styling.
		Optional "whoosh" sound and gold flash on completion.

* ✅ **Sorting & Persistence:**
	* Sorting is per-column, applied instantly. Logic is in a dedicated utility.
	* All updates (status, order, etc.) are persisted to the database.

* ✅ **Task Import/Export:**
	* Import accepts JSON. Prompts user to map or auto-create unknown columns.
	* Export allows selecting all, active, or completed tasks to a JSON file.

* ✅ **Sharing:**
	* Share via modal, entering a user's `@alias`.
	* Shared tasks appear in a "Shared with Me" column (read-only except for
		notes, priority, due date).
	* Sharing is encrypted with the recipient's public key.

#### B. Journal View

* 🚧 **Date-based columns:**
	* Each column is a date (user-preferred format). Scrollable H/V.
	* 1, 3, or 5-day view (user-persistent). Weekends can be styled or hidden.
	* Header: Navigation arrows, calendar overlay badges, current date highlighted.
* 🚧 **Journal Entries:**
	* Card with an editable title. Clicking opens the **Unified Note Editor**.
	* Drag/drop between columns. Ellipsis menu for actions.
	* A notes icon (📝) appears next to the title if notes exist.
* 🚧 **Journal Import/Export:**
	* Import/Export via JSON, with filters for date ranges.
* 🚧 **Search:**
	* Search by keyword or date range with an instant result overlay.
* 🚧 **Wrap-up:**
	* A button to auto-create a summary note for the day, aggregating entries.

#### C. Outlines View (Hierarchical Notes)

* 🚧 **Tree structure:**
	* Nodes can be added at any level with inline title editing.
	* Drag/drop to re-parent or re-order. Delete nodes or entire branches.
* 🚧 **Styling:**
	* Tree lines, node icons, minimal indentation. Private nodes have an overlay.
* 🚧 **Export/Import:**
	* Supports JSON format for backup and migration.

#### D. Meeting Agendas / Planner View

* 🚧 **Agendas as first-class objects:**
	* Create agendas with a title, date(s), and multiple segments.
	* Each segment can contain notes and tasks, supporting all standard card
		features (privacy, sharing, etc.). Drag/drop to reorder.

#### E. 🚧 Unified Note Editor

A single, reusable, self-contained component for all rich text editing.
* **Architecture:** Decoupled module (`/assets/js/editor.js`) with a simple API.
* **UI Model:** Opens in a non-fullscreen modal by default. On mobile, it expands
	to fill the screen. Desktop users have controls to maximize.
* **Features (via Tabbed "Ribbon"):**
	* **Core (Must-Haves):**
		* Format Panel: Insert symbols (☆, 🔥, !), change case, insert timestamp/rule.
		* Find & Replace Panel.
		* Info/Status Bar: Word/char/line counts, auto-save status.
	* **High-Value Optional:**
		* "Add Task" Panel: Create a new task in any column from within the editor.
		* "Search" Panel: Search across all other journal entries.

#### F. 🚧 Settings & Preferences Panel

Accessed via a menu or settings icon.
* **Controls:** Theme toggle (Dark/Light), sound effects toggle, private view
	switch, session timeout, font size, manage calendar overlays, manage contact
	aliases, import/export, help, logout.
* All preferences are persisted per user.

#### G. Toolbar, Calendar Overlays, and Notifications

* **Toolbar:** Varies per section. Always shows the current date and toggles for
	filtering completed/priority/private items.
* 🚧 **Calendar Overlays:**
	* Users can perform CRUD operations on overlays (e.g., fiscal weeks).
	* Labels appear as colored badges in Journal headers. Import/Export via JSON.
* 🚧 **Notifications:**
	* In-app toasts for all actions (success/error).
	* Optional OS-level browser notifications for reminders, shares, etc.

---
### 6. Security, Privacy & Zero-Knowledge Architecture

* ✅ All crypto logic is centralized in a dedicated module. No backend encryption.
* ✅ Password changes force re-encryption and require the old password.
* 🚧 **Session management:**
	* The latest session has write rights; others become read-only with a "reclaim
	  control" option. Uses Server-Sent Events (SSE) for live updates.
* 🚧 **Plan/quota enforcement:**
	* Free and paid tiers. Limits are enforced server-side.
* 🚧 **Telemetry:**
	* All key actions are logged (anonymized) for admin analytics. No external
		trackers.
* **Development-Friendly Encryption Architecture:**
	* A "pass-through" mode controlled by a `DEVMODE` constant allows testing the
		full app with readable plaintext data, separating app logic bugs from
		crypto bugs.

---
### 7. 🚧 User Preference Management

All settings are managed via a centralized architecture. A single JavaScript object,
`userPreferences`, is the client-side source of truth, mirrored in a single
JSON field in the database per user. This ensures data consistency.

---
### 8. 🚧 Import/Export, Data Migration & Backup

All key data types are importable/exportable in a clear JSON format. The import
process can create missing items (columns, dates) or prompt the user to map them.
A backup flow allows for a full copy-paste of all user data.

---
### 9. 🚧 File Structure & Module Responsibilities

/index.php: Main app shell
/login.php, /register.php, etc.: Auth pages
/assets/
  /js/app.js: SPA glue, state, router
  /js/tasks.js, /js/journal.js, etc.: View-specific modules
  /js/crypto.js: All encryption, decryption, sharing logic
  /js/session.js, /js/telemetry.js: Support modules
  /css/style.css: Main stylesheet
  /css/views/*.css: View-specific styles
/api/: REST endpoints for all modules
/includes/: PHP config, DB, session, SMTP
/migrations/: SQL scripts for DB migrations
/debug.log: Backend error log (conditional on DEVMODE)

---
### 10. Lessons Learned & How They Inform v4

* All encryption logic **must** be centralized.
* Updates should be full-file, drop-in replacements, not fragments.
* Boolean data types must be handled consistently between JS (true/false) and the
	database (1/0).
* Naming conventions (snake_case in PHP/DB, camelCase in JS) must be explicit.
* `DEV_MODE` must be a visible flag that controls all logging.
* Mobile responsiveness must be validated continuously, not patched later.
* Session management is critical to prevent data conflicts.
* User preferences are not optional; every setting must be saved.
* Import/export must handle incomplete data gracefully.
* All features require unit and integration testing.

---
### 11. Summary Table: What Must Be Developed

| Module / Feature                        | Status |
| --------------------------------------- | :----: |
| All authentication flows                | 🚧     |
| Full zero-knowledge encryption          | 🚧     |
| Modular SPA & all views                 | 🚧     |
| Tasks board (all behaviors/UI)          | 🚧     |
| Journal (all columns/cards/search)      | 🚧     |
| Outlines (hierarchical/tree notes)      | 🚧     |
| Agendas/Meetings planner                | 🚧     |
| Unified Note Editor                     | 🚧     |
| Import/export, backup, restore          | 🚧     |
| Calendar overlays & management          | 🚧     |
| Sharing (tasks, entries)                | 🚧     |
| Session management, hybrid control      | 🚧     |
| Plan/quota logic, usage bars            | 🚧     |
| Telemetry, admin analytics              | 🚧     |
| Offline support (service worker)        | 🚧     |
| Mail to task/journal                    | 🚧     |
| All file structure/modules (see above)  | 🚧     |
| Settings slides, accordions and modals  | 🚧     |
| Help page with accordions               | 🚧     |

