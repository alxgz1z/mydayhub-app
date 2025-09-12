# MYDAYHUB

**Version:** Beta 6.7.0 
**Audience:** Internal Development & Project Management  

---

## WHY ARE WE DOING THIS

* To collaborate effectively with a small team and promote productivity on activities that matter.  
* To experiment with AI code assistance and agents, putting myself in the shoes of my team.  
* To channel my creativity and passion for development.  

---

## Table of Contents

**1 Vision & Scope**  
* Application Scope  
* Application Description  
* Core Philosophy  
* General Requirements  
* User Stories & Use Cases  

**2 Functional Specification**  
* Tasks View  
* Journal View (Future)  
* Outlines View (Future)  
* Events View (Agenda Planner) (Future)  
* Unified Note Editor  
* Settings Slider & Calendar Overlays  

**3 Technical Specification**  
* Technical Architecture
* API Gateway and Contracts
* Frontend Architecture
* Zero-Knowledge Architecture & Recovery Systems
* Password Reset & Security Model
* Development Debugging Infrastructure
* Environment Setup & Workflow

**4 Appendices**  
* Glossary  
* Wireframe Mockups  
* Application Icons  
* Environments  
* File Locations  
* Status Legends  
* Versioning and Workflow  
* Debug and Testing Patterns  

---
## 1. IMPLEMENTATION TRACKING
**Legends**
* **[RDY]** Feature complete, matches spec intent
* **[WIP]** Under construction, present but evolving
* **[FIX]** Implemented, needs refactoring/bug fixes
* **[FUT]** Scheduled for future milestone
* **[CNS]** Under consideration, not yet scheduled

### API IMPLEMENTATION TRACKING
  [RDY] register (in auth.php)
  [RDY] login (in auth.php)
  [RDY] getAll (in tasks.php)
  [RDY] createColumn (in tasks.php)
  [RDY] createTask (in tasks.php)
  [RDY] toggleComplete (in tasks.php)
  [RDY] reorderTasks (in tasks.php)
  [RDY] toggleClassification (in tasks.php)
  [RDY] renameColumn (in tasks.php)
  [RDY] deleteColumn (in tasks.php)
  [RDY] reorderColumns (in tasks.php)
  [RDY] deleteTask (in tasks.php)
  [RDY] renameTaskTitle (in tasks.php)
  [RDY] duplicateTask (in tasks.php)
  [RDY] saveTaskDetails (in tasks.php)
  [RDY] saveUserPreference (in users.php)
  [RDY] getAttachments (in tasks.php)
  [RDY] uploadAttachment (in tasks.php)
  [RDY] deleteAttachment (in tasks.php)
  [RDY] togglePrivacy (in tasks.php)
  [RDY] restoreItem (in tasks.php)	  
  [RDY] moveTask
  [FIX] requestPasswordReset (in auth.php)
  [WIP] performPasswordReset (in auth.php)
  [RDY] changePassword (in users.php)
  [FUT] shareTask / revokeShare
  
  *Note: `deleteTask` and `deleteColumn` actions now perform a soft delete by setting a `deleted_at` timestamp. The `restoreItem` action reverts this.*
		  
### UI Implementation tracking
  [RDY] User Registration page
  [RDY] User Login page
  [RDY] Responsive board layout (desktop/mobile)
  [RDY] Board rendering from getAll API
  [RDY] Create Column (inline form)
  [RDY] Rename Column (double-click)
  [RDY] Delete Column (hover button with confirmation)
  [RDY] Reorder Columns (hover buttons)
  [RDY] Create Task (footer input)
  [RDY] Rename Task Title (double-click)
  [RDY] Toggle Task Completion (checkbox)
  [RDY] Task Drag-and-Drop (within and between columns)
  [WIP] Task Classification (clicking status band)
  [RDY] Enforced Task Sorting by classification
  [RDY] Task Actions Menu (⋮ button)
  [RDY] Delete Task (from actions menu with confirmation)
  [RDY] Custom modals/toasts to replace native alerts
  [RDY] Due Date picker (custom modal)
  [RDY] Task Attachments UI (drop zone, gallery)
  [RDY] Bottom toolbar with filters
  [RDY] Privacy toggles
  [RDY] Mobile 'Move Mode' for tasks
  [RDY] Task Notes integration (Unified Editor)
  [WIP] Settings slider panel
  [RDY] Change Password modal
  [WIP] Forgot Password page & flow
  [FUT] Sharing UI


### Priority Roadmap (Beta 6.6+)
  
  1. Debug/Observability Hardening — TOP
	 * Ensure all API handlers funnel responses through `send_debug_response()`
	   when `DEVMODE=true`, and that `/debug.log` is writable and populated.
	 * Client logs: standardize toast + console structures; correlate client
	   errors with server `debug[]` payloads.
  
  2. Touch Moves: Mobile Move Mode 2.0 + Touch DnD
	 * Restore/upgrade Move Mode with clear CANCEL affordances and in-column
	   reordering targets; long-press/handle for touch DnD.
  
  3. Zero-Knowledge Baseline (encryption boundary only)
	 * Consolidate crypto to `/uix/crypto.js`; prepare per-item DEKs and
	   wrapping model; defer key-sharing.
  
  4. Recovery (Security-Questions) for ZK Password Reset
	 * Add Recovery Key → Recovery Envelope flow before fully enabling ZK reset.
  
  5. Sharing (foundation)
	 * UI + API stubs (shareTask / revokeShare) without E2E key exchange yet.
  
  6. Offline MVP (defer)
	 * Service Worker app-shell, IndexedDB mirror, write queue (LWW).
  
  7. Accessibility Polish
	 * Colorblind/high-contrast tuning; ARIA announcements for Move Mode.

---

## 2. VISION & SCOPE

### APPLICATION SCOPE
From Beta 5 onward, the application scope is strictly focused on perfecting the **Tasks View**. All development, UI, and architecture improvements support this “tasks-first” approach. Other views (Journal, Outlines, Events) remain deferred, except for maintenance work required for future integration.  

### APPLICATION DESCRIPTION
**MyDayHub** is a next-generation productivity hub, built for focus, simplicity, and absolute privacy. We start with task management and plan to integrate Journal, Outlines, and Events later. The UI combines dark backgrounds, accent gradients, translucent overlays, and rounded cards. Typography is clean and scalable. Status bands and quick-action icons are always visible, supporting classification, privacy, attachments, and sharing.  

All content is encrypted end-to-end with zero-knowledge encryption. Plaintext is never stored or transmitted.  

* **Tasks:** Kanban board for flexible task tracking.  
* **Journal (Future):** Daily notes and reflections.  
* **Outlines (Future):** Hierarchical trees for structuring ideas.  
* **Events (Future):** Agenda planning with segments.  

### CORE PHILOSOPHY
* **Absolute Privacy:** True zero-knowledge encryption with per-item DEKs, encrypted by a Master Key derived on device via Argon2id from passphrase + salt. Master Key never leaves device.  
* **Fluid Experience:** Inline editing, drag-and-drop, single-page interactions.  
* **Modern & Minimalist:** Simplicity, clarity, comfortable dark theme (light optional).  
* **Work Anywhere:** Full offline support with sync resolution.  
* **Signal over Noise:** Classification ensures attention on mission-critical tasks.  
* **Accessibility:** WCAG color contrast, ARIA labels, keyboard navigation, font scaling, high-contrast mode.  

### GENERAL REQUIREMENTS
* **Aesthetics:** Rounded corners, sans-serif fonts, shadows, translucency, accent color highlights.  
* **Layout:** Responsive, touch-friendly, mobile-first.  
* **Privacy Switch:** Every item (column, task, entry, event, tree, branch, node) can be marked private.  
* **Sessions:** Multi-user sessions with last-writer control and ownership checks.  
* **Optimistic UI:** Animations with rollback if errors occur.  
* **Quotas:** Tiered storage/sharing limits, upgrade prompts.  
* **Telemetry:** CRUD, navigation, and sharing analytics.  
* **Import/Export:** JSON for migration and backup.  
* **Notifications:** Alerts for reminders, quota nearing, conflicts.  
* **Debugging:** DEVMODE=true logs to `debug.log`; curl/API tests; offline simulations.  

### USER STORIES

#### Privacy & Security
* As a user, I want all of my content to be encrypted end-to-end so that no one else can read it.
* As a user, I want to toggle privacy on any item so I can control who sees what.
* As a user, I want to securely share items with other users, granting them view or edit access.
#### Collaboration & Awareness
* As a user, I want to notify others when I change a shared item, so they stay up to date.
* As a user, I want to receive a notification when someone else modifies an item I shared with them.
#### Productivity & Workflow
* As a user, I want to drag and drop to manage my tasks (and later entries, nodes, and segments) for quick organization.
* As a user, I want to classify tasks as Signal, Support, Noise, or Completed to stay focused on what matters.
* As a user, I want to attach and manage images within tasks to keep related information in one place.
* As a user, I want to email tasks directly into the app so I can capture work quickly.
#### Mobility & Responsiveness
* As a user, I want the app to work seamlessly on both desktop and mobile layouts.
* As a user, I want to use the app effectively on my phone while on the go.
#### Reliability & Offline
* As a user, I want to edit offline and have changes auto-sync when I reconnect.
#### Notifications & Limits
* As a user, I want clear notifications for reminders, conflicts, and system alerts.
* As a user, I want to be warned when I’m nearing my storage limit so I can manage my files.
* As a user, I want to be prompted before my oldest attachments are deleted, so I can choose what to remove.

---

## 3. FUNCTIONAL SPECIFICATION

### TASKS VIEW
Kanban layout with horizontal scroll on desktop, vertical stack on mobile. Optimistic updates with rollback on error.  

#### Columns
* **Header:** Title (inline edit), live task count, actions (delete/move), privacy switch.  
* **Body:** Displays task cards or placeholder text if empty.  
* **Footer:** Quick-add input field; supports “Move here.”  

#### Task Cards
* **Display:** Title (inline edit), drag-and-drop, metadata footer (notes, due date).  
* **Delegation & Sharing:** Distinct styling + share icon.  
* **Status Bands:** Status Bands: Signal (green), Support (blue), Backlog (orange), Completed (gray).  
* **Privacy & Attachments:** Icons always visible.  
* **UX:**  
  * Desktop: click-to-edit and mouse drag-and-drop.  
  * Mobile/Tablet: two complementary options:  
	1. **Touch DnD:** Long-press (~350ms) or drag-handle (≡) to lift a task; supports cross-column moves and same-column reordering.  
	2. **Move Mode 2.0:** Actions → Move puts the task in wiggle state, shows a banner “Move [Task] • Cancel,” and activates footers (“Move here”) plus inter-card drop-zones for precise placement.  

* **Abort Move Mode:** User can cancel by tapping the Cancel banner button, tapping backdrop, pressing Esc (if keyboard present), or device Back button. All abort paths restore normal state without changes.  

* **Accessibility:** Move Mode announces entry via `aria-live` and traps focus to Cancel. Drop-zones and banner controls meet 44–48px touch target guidelines.

#### Touch Drag-and-Drop (Mobile/Tablet)
* **Start gesture:** Long-press (~350 ms) on the card **handle (≡)** to lift.
* **During drag:** Card shows elevated shadow; columns auto-scroll when
  near edges; valid targets highlight.
* **Behavior:** Same-column reordering and cross-column moves are allowed.

#### Move Mode 2.0 (Mobile-first, precise placement)
* **Enter:** Actions menu → **Move**. The task enters a subtle **wiggle** state
  and a top banner appears: “Move ‘Title’ • Cancel”.
* **Destinations:** 
  * Column footers switch from “+ New Task” to **“Move here”**.
  * **In-column drop-zones** appear **between cards** and at top/bottom
	(↑ Move above • Move below ↓) to support fine reordering without drag.
* **Exit / Abort:** Tap **Cancel** in the banner, tap the backdrop, press **Esc**
  (if keyboard present), or use the device **Back** button. Any of these restore
  normal state with no changes.
* **A11y:** `aria-live="polite"` on entry: “Move mode on. Choose a destination or
  Cancel.” Focus starts on the Cancel button in the banner.

#### Attachments
* **Methods:** File picker, drag-drop, paste.  
* **Formats:** JPEG, PNG, GIF, WebP. Max 5MB/file.  
* **Quota:** Example 50MB per user.  
* **Policy:**  
  * If quota exceeded, system prompts with **Manage Attachments** modal.  
  * Default suggestion: delete oldest files.  
  * Modal shows full list (name, date, size).  
  * User may delete other files to free space before proceeding.  

#### Sorting & Persistence
* Group order: Signal > Support > Noise > Completed.  
* Manual drag/drop allowed within groups.  
* Sorting enforced on status change.  
* Persisted instantly.

Users can change classification either by **clicking the status band** on the
card or via **Actions → Cycle Classification**; the enforced order remains
Signal > Support > Noise > Completed.

#### Actions Menu
* Notes  
* Due Date  
* Duplicate  
* Delete (with Undo)
* Move ← opens Move Mode 2.0 (wiggle + banner + drop-zones)
* Share
* Toggle Private
* Cycle Classification  ← alternate to clicking the status band

The 'Delete' action for both tasks and columns now triggers a non-blocking toast notification with a temporary 'Undo' option, allowing for immediate action reversal. This replaces the previous blocking confirmation modal.


---

### JOURNAL VIEW (Future)
Chronological daily layout with 1-day, 3-day (default), or 5-day modes. Weekends styled differently.  

* **Header:** Date label, nav buttons.  
* **Footer:** Quick-add entry.  
* **Cards:** Title, notes editor, drag/drop to new date.  
* **Indicators:** Notes icon, privacy pattern, decorative bar.  
* **Menu:** Notes, privacy toggle, duplicate, delete, move, share.  
* **Animations:** Hover lift, smooth scrolling.  
* **Future Integration:** Journal entries may link to Outlines.  

---

### OUTLINES VIEW (Future)
Hierarchical tree of nodes for structured ideas.  

* **Structure:** Expand/collapse branches, infinite nesting.  
* **Node Display:** Title, child count, privacy indicator.  
* **Actions:** Add child, promote/demote, fold/unfold, privacy toggle, duplicate, delete, **Link (stub)**.  
* **Drag/Drop:** Nodes and branches repositionable.  
* **Future Integration:** Planned linking to Tasks and Journal entries.  

---

### EVENTS VIEW (Future)
Planner for multi-day events.  

* **Setup:** Event = Title + Start/End date. Placeholder lists for participants, assets, and locations (concept-only).  
* **Layout:** Horizontally scrollable columns; vertical timeline.  
* **Segments:** Title, time/duration, no overlap. Supports leads, presenters, attendees, location, assets.  
* **Actions:** Notes, linked tasks, privacy, share, duplicate, delete.  
* **UI/UX:** Drag/drop rescheduling, hover lift, resize by dragging edge.  

---
### UNIFIED NOTE EDITOR
Universal modal for tasks, entries, segments, nodes.  

* **Plain Text + Markdown**, with preview toggle.  
* **Autosave** on pause and on close.  
* **Header:** Context title, export/print/save.  
* **Toolbar:** Tabs (Format, Find & Replace, Add Task, Search).  
* **Text Area:** Scrollable, with line numbers.  
* **Status Bar:** Word/char/line counters + last saved timestamp.  
* **Tools:** Case conversion, formatting, font resize, calculator.  
* **Search:** Cross-note search opens results list, enabling seamless switching.

---

### SETTINGS SLIDER & CALENDAR OVERLAYS
**Settings Slider**
**Settings Slider**
* Slider accessible from title bar.
* **Display Mode:** Light Mode toggle.
* **High-Contrast/Colorblind Mode:** increases separation for icons, status
  bands, and accents. **Mutually exclusive with Light Mode.**
* Change Password (opens modal).
* (Planned) Automatic Logout.
* (Planned) Import/Export, Help.

**Calendar Overlays (App-Wide Feature):**  
* User defines overlays by entering **labels tied to specific calendar dates**.
* Types: Fiscal, Holidays, Birthdays, Custom.  
* Privacy: public or private overlays as indicated by the user, other users can opt-in to public calendars.  
* **Display:** Badges shown in bottom toolbar next to today’s date. Multiple badges shown if overlapping.  
* **Manager Modal:** CRUD for overlays, with import/export.  
* Applies across all views.  

---

## 4. TECHNICAL SPECIFICATION

### Technical Architecture
LAMP stack (PHP 8.2, MySQL, Apache). SPA frontend (JS/CSS).  

### API Gateway & Contracts
/api/api.php as gateway; validates CSRF, content type, session. Dispatches to handlers.  

### Frontend Architecture
/uix holds SPA modules. crypto.js = encryption boundary.  

### Security Model & Privacy
* CSRF protection.  
* Ownership checks enforced server-side.  
* Multi-user sessions with renewal + token.  
* Per-item privacy flags.  

#### Zero-Knowledge Architecture & Recovery Systems
* Core Encryption Model
	* Encryption Boundary: All cryptographic operations handled by /uix/crypto.js module
	* Per-Item Encryption: Each item (task, column, entry) encrypted with unique Data Encryption Key (DEK)
	* Master Key: User-specific key derived on-device using Argon2id from passphrase + salt
	* Key Wrapping: DEKs encrypted with user's Master Key before storage
	* Server Blindness: Server never sees plaintext data or Master Key

* Security Questions Recovery System
  * Purpose: Enables password reset without data loss in zero-knowledge system
  * Implementation:
	* User creates 3-5 custom security questions during initial setup
	* Question answers hash to derive a Recovery Key using PBKDF2
	* Recovery Key encrypts a copy of the Master Key (Recovery Envelope)
	* Server stores: question text (plaintext), answer hashes (irreversible), encrypted Recovery Envelope
  * Recovery Process:
	* User provides correct answers to security questions
	* Client derives Recovery Key from answers
	* Recovery Key decrypts Master Key copy
	* New password generates new Master Key
	* All user data re-encrypted with new Master Key
  * Security Trade-offs:
	* Reduces security compared to pure zero-knowledge (recovery answers could be compromised)
	* Provides reasonable balance between security and usability
	* Users who lose both password AND security answers permanently lose data (by design)

#### Zero-Knowledge Enablement Phases
	1. **Baseline ZK (no sharing):** Consolidate all crypto into `/uix/crypto.js`.
	   Use per-item DEKs wrapped by a Master Key (derived via Argon2id). Server
	   stores only ciphertext and wrapped DEKs.
	2. **Recovery Ready:** Require users to set security questions, derive a
	   Recovery Key (PBKDF2), and store a **Recovery Envelope** (Master Key copy
	   encrypted by Recovery Key) before enabling ZK password resets.
	3. **Sharing Foundation:** Introduce UI and API stubs to designate shared tasks,
	   leaving key exchange/E2E sharing for a later milestone.
	4. **E2E Sharing:** Implement asymmetric wrapping of DEKs to recipients’
	   public keys; sender does not lose local ZK guarantees.
	
	**Blocking dependency:** E2E sharing is blocked until **(1) Baseline ZK** and
	**(2) Recovery Ready** are complete.

#### Crypto Module Architecture

/uix/crypto.js Structure:
├── Key Derivation (password + salt → Master Key)
├── DEK Management (generate, wrap, unwrap DEKs)
├── Symmetric Operations (encrypt/decrypt user data)
└── Recovery System (questions → Recovery Key → Master Key)

### Password Reset & Security Model
Standard Password Reset (Pre-Zero-Knowledge)
* Current Implementation: Traditional email-based reset with secure tokens
* Token Security: SHA-256 hashed tokens, 1-hour expiration, single-use
* Email Delivery: PHPMailer with SMTP, styled HTML templates
* Database: Dedicated password_resets table with cleanup policies

#### Zero-Knowledge Password Reset (Future Implementation)
* Fundamental Challenge: Password resets incompatible with zero-knowledge unless recovery mechanism exists
* User Warning: Clear notification that password reset without recovery questions = permanent data loss
* Migration Strategy:
  * Phase 1: Implement security questions for new users
  * Phase 2: Prompt existing users to set up recovery questions
  * Phase 3: Enforce recovery questions for all users before enabling zero-knowledge mode
* Recovery Flow:
  * User requests reset → receives email with reset link
  * Reset page requires answering security questions + new password
  * Client derives Recovery Key, decrypts Master Key copy, re-encrypts all data with new Master Key

#### Security Considerations
* Threat Model: Protects against server compromise, but recovery questions reduce overall security
* User Education: Clear documentation about security trade-offs and importance of strong, memorable answers
* Attack Vectors: Social engineering of security questions, but better than alternative of total data loss


### Development Debugging Infrastructure
Server-Side Debugging
* Debug Message Collection: Global $__DEBUG_MESSAGES__ array in /incs/config.php
* Function: log_debug_message($message) appends timestamped entries
* Integration: All API responses include debug array when DEVMODE=true
* File Logging: Fallback to /debug.log for persistent logging

#### Client-Side Debug Display
* Browser Console Integration: JavaScript automatically extracts and displays server debug messages
* Format: Clearly marked debug sections with consistent formatting
* Raw Response Logging: Temporary capability to log full server responses for JSON parsing issues
* Error Correlation: Links client-side errors with server-side debug traces

#### Debug Response Helper

~~~
php
function send_debug_response(array $data, int $http_code = 200): void {
	global $__DEBUG_MESSAGES__;
	if (DEVMODE && !empty($__DEBUG_MESSAGES__)) {
		$data['debug'] = $__DEBUG_MESSAGES__;
	}
	http_response_code($http_code);
	header('Content-Type: application/json');
	echo json_encode($data);
	exit();
}
~~~

#### PHPMailer Debug Handling
* Issue: SMTP debug output corrupts JSON responses in development mode
* Solution: $mail->SMTPDebug = 0 always, regardless of DEVMODE
* Alternative: Server debug messages provide email sending visibility without response corruption

#### Hardening Checklist (must-pass before new features ship)
* All mutating API routes call `send_debug_response()`; no raw `echo/json_encode`
  on error paths.
* `/debug.log` exists, is writable by the web user, and receives timestamps.
* Client extracts `debug[]` from responses when `DEVMODE=true` and logs to
  console under a consistent namespace.
* SMTP debug is **always off** (`$mail->SMTPDebug = 0`); rely on server logs.
* UI uses toasts (non-blocking) for errors; confirmations use custom modal,
  never native `alert/confirm`.
* Guard repeated actions with an **isActionRunning** debounce flag to prevent
  double-fires in modals/menus.

### Offline Support
* Service Worker caches app shell.  
* IndexedDB mirrors lists.  
* Write queue flushes on reconnect.  
* Conflict resolution: last-write-wins, UI prompt for conflicts.  
* Stale-while-revalidate strategy.  
* **Future:** Background sync + retry policy layered onto Service Worker queue.  

### Environment Setup & Workflow
* Production: mydayhub.com (Beta 3).  
* Development: localhost (Beta 5 and on).  
* Online Test: breaveasy.com (Beta 5 and on).  
* Isolated DBs/files.  
* Composer add-on: SMTP runtime.  
* Debugging: DEVMODE logs.  
* Test accounts: alfa, delta, omega.

### Database Schema
* users: user_id, username, email, password_hash, preferences (JSON), created_at, storage_used_bytes
* columns: column_id, user_id, column_name, position, is_private, created_at, updated_at
* tasks: task_id, user_id, column_id, encrypted_data, position, classification, is_private, delegated_to, created_at, updated_at
* task_attachments: attachment_id, task_id, user_id. filename_on_server, original_filename, filesize_bytes, mime_type, created_at
* password_resets: id, user_id, token_hash, expires_at, created_at

---

## 5. APPENDICES

### Glossary
* Task card = task
* Journal entry card = entry
* Event plan = event
* Event plan segment = segment
* Outlines tree = tree
* Tree branch = branch
* Branch node = node
* Signal task = directly advances the mission
* Support task = indirectly enables Signal
* Backlog task = does not require immediate attention; candidate for deferral to a later time.
* Completed task = finished item, archived at bottom
* Master Key = user-specific encryption key derived on-device, never transmitted
* DEK = Data Encryption Key, unique per item, wrapped with Master Key
* Recovery Envelope = Master Key copy encrypted with Recovery Key
* Recovery Key = key derived from security question answers
* hostinger hosted environment = web-env
* local hosted environment = loc-env
* Drag-and-Drop = DnD
* Toast Notification = Toast
* Modal Window = Modal
* Move Mode = mobile-friendly relocation workflow with banner, wiggle state, and drop-zones.
* Drag Handle = the ≡ grip area on each task card to initiate touch DnD.

---

### Wireframe Mockups

#### TASKS VIEW
┌───────────────────────────────────────────────────────────────────────────┐
│[≡] ☕️ MyDayHub [Tasks] [Journal] [Outlines] [Events]      [+ New Column]  │
└───────────────────────────────────────────────────────────────────────────┘
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ Column A ⓹ … > │ │ < Column B ⓶ … > │ │ < Column C ⓺ … │
│─────────────────│ │──────────────────│ │─────────────────│
│□ Monday         │ │□ Blue            │ │□ Black          │
│□ Tuesday        │ │□ White           │ │□ Red            │
│□ Wednesday      │ │                  │ │□ Wash car       │
│□ Friday         │ │                  │ │□ Mow lawn       │
│☑ Thursday       │ │                  │ │□ Water plant    │
│                 │ │                  │ │□ Garbage out    │
│─────────────────│ │──────────────────│ │─────────────────│
│ + New Task      │ │ + New Task       │ │ + New Task      │
└─────────────────┘ └──────────────────┘ └─────────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│ 19.Aug.25, Tuesday                [FILTERS]                        [alfa] │
└───────────────────────────────────────────────────────────────────────────┘


* In every task card representation, show a colored status band at the left for classification.
* Add a clear visual switch for per-card and per-column privacy.
* Status cycling and privacy actions are always reachable via quick controls.


#### JOURNAL VIEW (Future)
┌───────────────────────────────────────────────────────────────────────────┐
│[≡] ☕️ MyDayHub [Tasks] [Journal] [Outlines] [Events]                      │
└───────────────────────────────────────────────────────────────────────────┘
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ 18.Aug.25, Mon      … │ │ 19.Aug.25, Tue      … │ │ 20.Aug.25, Wed      … │
│───────────────────────│ │───────────────────────│ │───────────────────────│
│  Meeting notes        │ │ VISUAL LANGUAGE NOTE  │ │  Progress summary     │
│  Project kickoff      │ │ Milestone feedback    │ │                       │
│  Daily reflection     │ │                       │ │                       │
│                       │ │                       │ │                       │
│───────────────────────│ │───────────────────────│ │───────────────────────│
│ + New Entry           │ │ + New Entry           │ │ + New Entry           │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│ 19.Aug.25, Tuesday  [<<][<] [>][>>] View [1][3][5] Days [Wrap-up]   (alfa)│
└───────────────────────────────────────────────────────────────────────────┘

#### OUTLINES VIEW (Future)
┌───────────────────────────────────────────────────────────────────────────┐
│[≡] ☕️ MyDayHub [Tasks] [Journal] [Outlines] [Events]      [+ New Outline] │
└───────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Project Outline           … │  │ Node editor                 │
│─────────────────────────────│  │─────────────────────────────│
│ ▸ Main Goal                 │  │                             │
│    ├─ Research phase        │  │                             │
│    │   └─ Gather articles   │  │                             │
│    ├─ Development           │  │                             │
│    │   ├─ Design UI         │  │                             │
│    │   └─ Implement backend │  │                             │
│    └─ Testing               │  │                             │
│        ├─ Unit tests        │  │                             │
│        └─ QA review         │  │                             │
│            ├─ Preview       │  │                             │
│            └─ Final report  │  │                             │         
│                             │  │                             │
│─────────────────────────────│  │                             │
│ + Add Child Under Selected  │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│ 19.Aug.25, Tuesday       [Promote] [Demote] [Fold] [Unfold]        (alfa) │
└───────────────────────────────────────────────────────────────────────────┘

#### EVENTS VIEW (Future)
┌───────────────────────────────────────────────────────────────────────────┐
│[≡] ☕️ MyDayHub [Tasks] [Journal] [Outlines] [Events]       [+ New Event]  │
└───────────────────────────────────────────────────────────────────────────┘
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ AUG.21 Thur         … │ │ AUG.22 Fri          … │ │ AUG.23 Sat          … │
│───────────────────────│ │───────────────────────│ │───────────────────────│
│ 08:00 Breakfast       │ │ 08:00 Workshop        │ │ 08:00 Team breakfast  │
│ 09:00 Kickoff Meeting │ │ 09:00 Presentations   │ │ 09:00 Check-out       │
│ 10:30 Session A       │ │ 11:00 Networking      │ │                       │
│ 12:00 Lunch Break     │ │                       │ │                       │
│───────────────────────│ │───────────────────────│ │───────────────────────│
│ + Add Segment         │ │ + Add Segment         │ │ + Add Segment         │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│ 19.Aug.25, Tuesday       Filters: [Rooms] [Assets] [People]         (alfa)│
└───────────────────────────────────────────────────────────────────────────┘

#### NOTES EDITOR VIEW (MAXIMIZED)
┌───────────────────────────────────────────────────────────────────────────┐
│ Editing a task's note                                            [▫] [×]  │
└───────────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│ [Format] [Find & Replace] [Search] [Add Task]                           … │
│ [AA] [Aa] [aa] [[]] 🔢  [A-] [A+]                                         │
│───────────────────────────────────────────────────────────────────────────│
│ 1│                                                                        │
│ 2│  LOREM IPSUM DOLOR                                                     │
│ 4│                                                                        │
│ 5│  Lorem ipsum dolor sit amet, consectetur adipiscing eli Etiam facilisis│
│ 6│  velit eget risus facilisis, et dictum dolor sodales. Pellentesque     │
│ 7│  dictum leo...                                                         │
│ 8│                                                                        │
│ 9│  PORTTITOR VENENATIS                                                   │
│10│                                                                        │
│11│  Suspendisse justo ipsum, imperdiet ac acmsan vel, feugiat vitae purus.│
│12│  Suspendisse dapibus ante ac eros bindum, vel laoreet massa cursus...  │
│  │                                                                        │
│  │                                                                        │
└───────────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│ Words: 231  Chars: 1664  Lines: 12                      Last saved: Never │
└───────────────────────────────────────────────────────────────────────────┘

#### NOTES EDITOR VIEW (REDUCED, OVERLAY)
┌─────────────────────────────────────────────┐
│ Editing a task's note                [□][×] │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ [Format] [Find & Replace]                 … │
│ [AA] [Aa] [aa] [U] [|] [🔢] [A-] [A+]       │
│─────────────────────────────────────────────│
│                                             │
│ LOREM IPSUM DOLOR                           │
│ ───────────────                             │
│ Lorem ipsum dolor sit amet, consectetur     │
│                                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ W: 231  Ch: 1664  L: 12   Last saved: Never │
└─────────────────────────────────────────────┘


---

### Application Icons
Consistent SVGs for contextual menu, status, etc.  

---

### Environments
* **Production:** mydayhub.com (Beta 3)  
* **Development:** localhost (Beta 5 and on)  
* **Online Test:** breaveasy.com (Beta 5 and on)  
* All environments use isolated DBs and files.  

---

### File Locations
* site root 	index.php, .env, .gitignore, debug.log, .htaccess, composer.*
* \api\			api.php, auth.php, tasks.php, users.php
* \uix\			app.js, auth.js, editor.js, tasks.js, style.css, editor.css, tasks.css, attachments.css, settings.css, login.css
* \media\		sounds, images, icons and all other app ui files, no subdirectories except \media.
* \media\imgs\	images attached to tacks are stored here (with file name coded for each user), no subdirectories.
* \incs\		config.php, db.php, mailer.php
* incs\meta		markdown documents describing the app.
* \login\		login.php, register.php, logout.php, forgot-password.php, reset-password.php

---

### Versioning
* GitHub with atomic commits (≤120 words), scope/files explicit.
* Source files tagged.

---

### Debug & Testing Patterns
#### Development Mode Debugging
* DEVMODE=true Logging: Comprehensive debug message collection and browser display
* Server-to-Client Pipeline: Debug messages automatically included in API responses
* Browser Console Integration: JavaScript extracts and displays server debug traces
* Response Debugging: Temporary capability to log raw server responses for JSON parsing issues
* PHPMailer Handling: SMTP debug output disabled to prevent JSON corruption

#### API Testing
* CURL Commands: Direct API endpoint testing with proper CSRF tokens
* Authentication Testing: Registration, login, password reset flows
* CRUD Operations: All task and column operations with ownership verification
* File Upload Testing: Attachment handling, quota enforcement, MIME validation

#### UI Testing Patterns
* Drag & Drop: Cross-column moves, within-column reordering, mobile Move Mode
* Classification: Status band interactions, sorting enforcement, popover functionality
* Privacy Toggles: Item-level privacy, filter visibility, sharing restrictions
* Quota Management: Storage limits, pruning policies, user notifications
* Offline Simulation: Network drop scenarios, write queue behavior, sync resolution

#### Encryption Testing (Future)
* Crypto Module Boundaries: Ensure no plaintext leaks, proper key derivation
* Recovery System: Security question setup, Master Key recovery, data re-encryption
* Zero-Knowledge Verification: Server blindness testing, client-side encryption validation

#### Security Testing
* CSRF Protection: Token validation on all mutations
* Session Management: Authentication enforcement, ownership checks
* Input Validation: SQL injection prevention, XSS protection, file upload security
* Password Reset: Token security, expiration handling, single-use enforcement

#### Regression Testing
* After New Features: Confirm prior workflows remain intact
* Cross-Browser: Desktop Chrome/Firefox/Safari, Mobile Chrome/Safari
* Responsive Design: Mobile layout, touch interactions, keyboard navigation
* Performance: API response times, UI animation smoothness, large dataset handling

---

### Touch Interaction Rules
* **Scrolling vs dragging:** Cards scroll the page by default; dragging
  requires touching the **handle** (≡) or entering **Move Mode**.
* **Long-press delay:** ~350 ms before lift; provide subtle haptic cue where
  available.
* **Target sizes:** Drop-zones are ≥44 px high; banner buttons are ≥48 px.
* **Abort affordances:** Cancel button, backdrop tap, Esc key (if present),
  and device Back button must all exit Move Mode without side effects.

***************
**END OF SPEC**
***************
