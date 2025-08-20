# MYDAYHUB

## APPLICATION SPECIFICATION (V4.7.0)
* Audience: Internal Development & PM Use Only
* This spec is a resource for contributors, testers, and future "Alex”

## ENVIRONMENTS
* Prod (v3): Isolated; no shared users/DB/files
* Dev (v4): Localhost, Apache+PHP 8, mariaDB, XAMPP

## STATUS LEGENDS
**Important**
* status updates are tracked for high level functions
* application progress log details low level status
**Legends**
* **[RDY]** Feature complete, matches spec intent
* **[WIP]** Under construction, present but evolving
* **[FIX]** Implemented, needs refactoring/bug fixes
* **[FUT]** Scheduled for future milestone
* **[CNS]** Under consideration, not yet scheduled

## APP DESCRIPTION
**MyDayHub** is your next-generation productivity hub, built from the ground up for focus, simplicity, and absolute privacy. We integrate four powerful tools into one seamless, app-like experience. Inspired by Apple's clean and modern web aesthetic, the interface defaults to a comfortable dark mode that’s easy on the eyes, with a crisp light mode just a click away.

* **Tasks:** Kanban inspired tasks board for flexible task tracking. Create custom columns, prioritize with a click, and manage your entire workflow with simple drag-and-drop.
* **Journal:** Capture your daily thoughts, notes, and ideas in a chronological log. Your entire history is archived and instantly searchable.
* **Outlines:** Structure complex ideas and connect your thoughts by creating hierarchical, tree-like notes.
* **Events:** Effortlessly plan complex, multi-day events. Build a clear agenda by arranging activity blocks for multiple teams or participants, keeping everyone perfectly in sync.

## GENERAL PHILOSOPHY
Our development is guided by a few core principles to ensure the best possible experience.
* **Absolute Privacy:** Your data is yours alone. We use **zero-knowledge encryption**, meaning all your content is encrypted and decrypted directly on your device. We can never see your data, and neither can anyone else.
* **Fluid Experience:** MyDayHub feels like a native app. Edit text inline, drag and drop items, and switch between tools instantly without ever waiting for a page to reload. The interface is fully responsive, working beautifully on any screen from your phone to your desktop.
* **Modern & Minimalist Design:** We believe in simplicity. The interface is clean, direct, and never overwhelming, allowing you to focus on what matters most. Our design defaults to a comfortable dark theme to reduce eye strain, but you always have the choice to switch to a bright light theme.
* **Work Anywhere:** Full **offline support** allows you to keep working without an internet connection. Your data will sync automatically the next time you connect. Smart session handling also prevents data conflicts if you're logged in on multiple devices.

## GENERAL REQUIREMENTS

* **Aesthetics**
  * UI is intentionally minimal: rounded corners, clean sans-serif typography, soft shadows, and backdrop-filter effects for depth.
  * Rounded corners on all cards, modals, and toolbars
  * Clean, legible sans-serif font
  * Soft shadows beneath cards/columns (subtle for accessibility)
  * Backdrop-filter blur or translucency on overlays/side panels
  * Default to dark mode with user-toggle and persistent preference
  * Use accent color for highlights, active tab, and focus states
  * Consistent visual spacing, card elevation, and hover feedback for all interactive elements.
  * No modal overload or overwhelming toolbars; progressive disclosure only.

* **Modular visibility and dynamic UI**
  * Fast toggling of task board, journal, outlines, meeting, preserving context.
  * Column drag/drop supports intuitive workflow management.

* **Privacy switch on every item**
  * Each task, journal, outline, or meeting has per-item privacy toggle.

* **Multi-user authentication/session management**
  * Hybrid session: last login has write control. Change notifications.
  * Sessions are isolated—no overwrite by concurrent writers.

* **Fluidity & Mobile-First**
  * Optimistic UI: all actions animate visibly and rollback if errors.
  * Hover, drag, and completion animations (“gold flare” for check-off), live counts.
  * SPA (Single Page App) with no reloads: All content updates, drag-drop, view changes, and modals are animated and instant.
  * App is built mobile-first: On mobile, controls are touch-optimized, toolbars collapse to sticky menus or bottom bars, and columns/cards respond to swipe and tap.
  * On desktop, the layout is expansive and multi-column with subtle, elegant color contrasts (dark mode default, light mode optional and user-persistent).

* **Responsive, mobile-first design**
  * Touch gestures and pull-to-create actions.

* **Quotas and usage plans**
  * tiered item/sharing limits and upgrade prompts

* **Telemetry and analytics**
  * track CRUD, navigation, sharing for future improvements

* **Import/export (JSON) for migration, backup, test**

* **Notification support**
  * desktop/mobile alerts, event segment reminders, mail-to-task/journal entry via unique user tokens
  
* **Security Model And Privacy**
  CSRF protection: session/meta injection; rejects unsafe requests.
  Ownership checks; all mutations filtered at server per user.
  Real multi-user sessions, renewal, token-based.
  Per-item privacy flag, zero-knowledge encryption parity.
  * Rationale: Data security and privacy toggles built to prevent cross-user leaks.
  * Universally necessary for individual/team productivity.

* **Frontend Encryption**
  * Crypto module boundary:  “All crypto lives in assets/js/crypto.js; app code never encrypts/decrypts directly.”
  * Switch: ENCRYPTION_ENABLED (dev passthrough = plaintext). (Matches your “proxy layer” goal.)
  * Key strategy
	* Symmetric: per-item Data Encryption Key (DEK); DEK encrypted by a per-user Master Key.
	* Master Key derivation: Argon2id(PBKDF) from user passphrase + salt; never sent to server.
	* Asymmetric (sharing): X25519 (ECDH) for key wrapping; Ed25519 for signatures.
	* Sharing envelope: For each recipient, store {recipient_user_id, wrapped_DEK, sender_sig}.
  * Minimal new fields
	* users.key_salt VARBINARY(32) (server-stored salt).
	* task_shares(wrapped_dek VARBINARY, sender_sig VARBINARY).
	* Keep ciphertext in tasks.encrypted_data (already present). 
	* API contracts (new)
	* crypto/getPublicKey, crypto/setPublicKey.
	* share/create, share/revoke, share/list.
	* Error map for: “missing public key”, “stale share”, “signature failed”.
  * Threat model note
	* “DB, backups, and app server are untrusted for content. Only metadata is readable.”
	* “Rotation: per-user master-key rewrap; per-item DEK optional rotate.”
  * Acceptance tests
	* “Flip plaintext mode ON → all CRUD passes; flip back → same actions pass with ciphertext stored.”
	* “Share to user B; revoke; verify B cannot decrypt.”
	* Offline/PWA — spec gaps to close
  
* **Offline support**
  * Service Worker queue, auto-sync
  * Phased rollout
	* P1 App-shell cache only (static assets).
	* P2 Read-through IndexedDB mirror for lists.
	* P3 Write queue + background sync + conflict policy.
  * Service Worker
	* File: /service-worker.js, scope /.
	* Caches: app-shell-v1, api-fallback.
  * Network strategy: stale-while-revalidate for shell; network-first for authenticated API where online; fallback to IndexedDB.
  * Sync engine
	* Online check: navigator.onLine + heartbeat endpoint.
	* Queue writes offline to outbox; flush on reconnect or periodicSync.
	* Backoff: 1s→2→4→… max 60s per item; cap retries; quarantine poison items.
  * Conflict policy
	* Default: Last-Write-Wins using (updated_at, version, device_id).
	* Surface conflicts in UI (badge on card); simple “keep mine / take remote” chooser.
	* Server validates version; returns 409 with server copy for client merge.
  * API headers
	* Send X-Client-Id, X-Client-Version, If-Match: <version>; server returns new ETag.
  * Acceptance tests
	* Create/edit offline; kill app; reopen; ensure local load from IndexedDB.
	* Reconnect; verify queued ops drain; spot-check server rows.
	* Forced conflict scenario returns 409 and renders chooser.
  
## USER STORIES AND USE CASES

### USER STORIES
* _As a user, I want the confidence that all my content is securely encrypted._
* _As a user, I want to mark any item as "private" to instantly hide it from view._
* _As a user, I want to prevent concurrent sessions from accidentally overwriting each other's changes._
* _As a user, I want offline support to add and edit items, with changes syncing automatically when I reconnect._
* _As a user, I want to fluidly drag and drop tasks, journal entries, and meeting segments._
* _As a user, I want to email a task or note directly into my board or journal._
* _As a mobile user, I want the app to have a responsive layout so I can work effectively one-handed on my phone._
* _As a power user, I want to see my usage statistics and quotas so I can manage or upgrade my plan._
* _As a team lead, I want to organize meetings, delegate tasks, and outline next steps._
* _As a team lead, I want to securely share items with my team and be able to revoke access at any time._
* _As a team member, I want to update notes and change the status of shared items to collaborate effectively with my team._

### USE CASES
* Mark any task, journal entry, outline node, or event segment as private and filter/hide accordingly.
* Drag and drop tasks, journal entries, outline nodes, and event segments with smooth, animated feedback.
* See usage stats and plan limits; receive UI warnings when close to quota.
* Email a task or note into the board/journal using a unique secret token.
* Share tasks or journal entries one-to-one using @alias or modal UI, with revocable, encrypted access.
* Use the app seamlessly on both desktop (multi-column) and mobile (single-column/fab/menus).
* Work offline with automatic sync and resolution when reconnecting.
* Avoid conflicts: When multiple sessions are open, only the most recent has write rights, with “reclaim control” as needed.
* Access help and onboarding, with clear feedback for every action via toasts and OS-level notifications.
* Keep user preferences always persisted in the backend instantly and adhering to active session supersedes others.

## FEATURE DEEP DIVES AND UX COMMENTARY

### TITLE BAR

  Visible on all views. Context sensitive. Background is subtle; bottom has a thin border.
  Includes:
	* Hamburger button to open Settings slider
	* App title on left (default: “MyDayHub”)
	* Section tabs ("Tasks", "Journal", "Outlines", "Events")
	* Context-sensitive controls (visible based on view selected):
	  * Journal: "Today" button and calendar date picker to make the desired date the central column in the view.
	  * Tasks: Add Column form.
	  * Journal: "Search" (keyword, etc.) to lookup Entries from the user Journal.
	* Responsive Header: "more options" dropdown menu (⋮) appears on narrow screens to house controls like "Search," "Today," etc., preventing UI overflow.
  
### BOTTOM TOOLBAR
Full-width, one-row control bar
Contents vary depending on active section (Tasks, Journal, Outlines, Events)
  **Toolbar Controls**
	* **Left:** Current date
	* **Center:** Context aware buttons
		* **Tasks View:** Show/Hide Shared, Show/Hide Mine, Show/Hide Completed (default hide), Show/Hide High Priority
		* ** Journal View:** Buttons with "1","3" and "5" to determine how many columns are displayed. Button "Wrap-Up" to create a new Entry that aggregates all the entries in the focus date.  This new Entry is added on top.
	* **Right:** Current Username within square parethensis (example: "[alfa]")
 
### SETTINGS
  Slider accessible from title bar
* Theme switch (dark/light)
* Show/Hide private items switch
* Skip weekends in journal swtich
* Global App Font Size (A-/A+ buttons)
* Calendar Overlays (button opens modal)
* Automatic Logout (dropdown select 5 mins, 30 min, 3 hours, never)
* Change Password (button opens modal)
* Import/Export (button opens modal)
* Help (button opens User Manual)
* Logout ("⏻ Logout" in red)

### TASKS VIEW

This Kanban-style layout view is a horizontally scrollable on wide screens and vertically stacked on narrow screens. 
The UI should feel fluid, with optimistic updates for actions like moving or editing, and clear error rollback on failure.

#### COLUMNS
Columns are user-created, re-orderable via header controls, and their positions are persisted.
* **Header:**
  * **Title:** Editable via double-click or an inline rename action.
  * **Task Count:** A live counter displaying the number of tasks in the column.
  * **Actions:** Includes quick action buttons to delete the column (x) and shift it left/right (<, >), with < omitted in the leftmost column and > omitted in the rightmost.
  * **Privacy:** A switch allows the user to mark the entire column as private. Private columns are visually distinguished by a subtle diagonal line pattern.
* **Body:**
  * Displays all associated task cards.
  * When empty, a placeholder subdued message like "No tasks to show" is displayed.
* **Footer:**
  * Contains an input field for quickly adding new tasks. Pressing Enter creates the task, clears the input, and re-focuses the field for rapid entry.
  * Supports a "Move here" action for tasks being dragged from other columns.
⠀
#### TASK CARDS
* **Display & Interaction:**
  * **Title:** The primary text of the task, editable via double-click.
  * **Drag & Drop:** Tasks can be fluidly dragged within their current column or dropped into a different column.
  * **Due Date:** An optional due date badge is displayed as a suffix (e.g., !08/18).
  * **Delegation & Sharing:** Shared tasks have distinct styling. A share icon (@user) appears, showing recipients on hover.

* **Status Indicators:**
  * **Status Band:** A color band on the left of the card thst indicates task status.
	* High Priority: Orange
	* Normal: Blue
	* Completed: Gray
  * **Completion:** A checkbox marks the task as complete. Completed tasks are styled in light gray.

* **Actions Menu** (Ellipsis ... on hover)
  * **Priority:** Flips priority normal -> high -> normal 
  * **Notes:** Opens notes editor, which are auto-saved.
  * **Due Date:** Opens a calendar picker to set or clear the due date.
  * **Duplicate:** Creates an identical copy of the task card in the same column.
  * **Delete:** Removes the task card.
  * **Move:** Allows to move the task to another column.
  * **Share:** Allows to share the task to another user(s).
⠀
* **Sorting and Persistence**
  * The vertical order of tasks within a column is automatic and enforces sorting rules
  * Manual adjustments are permitted for tasks within their category group, sorting rules are enforced.
  * All reordering actions are persisted instantly.
  * **Automatic Sorting Rules:**
	**1** **Priority** tasks are always sorted to the top of the column.
	**2** **Normal** tasks appear below priority tasks.
	**3** **Completed** tasks are always moved to the bottom of the column.
  * **Manual Sorting:** Within each status group (Priority, Normal, Completed), the user's manual drag-and-drop order is maintained.
  * **Triggers:** Sorting logic is applied instantly whenever a task is created, moved, dropped, duplicated, or its status changes.

* **UI/UX Feedback & Animations**
  * **Hover Effect:** A soft "lift" shadow appears when hovering over a task card.
  * **Completion Effect:** Checking off a task triggers a gold flash animation, and updates all relevant task counts.
  * **Compaction:** Deleting or completing a task instantly compacts the list, removing empty space.


### JOURNAL VIEW
  
This view provides a chronological, date-based layout for journal entries, organized into horizontally scrollable daily columns. The interface is designed for fluid navigation through time and rapid logging of notes and ideas.
  
  
#### COLUMNS & NAVIGATION
  
The core of the view is a set of columns, each representing a single day.
* **Layout & Display:**
  * **View Modes:** Users can select between **1-day**, **3-day (default)**, and **5-day** layouts.
  * **Visual Cues:** In 3-day and 5-day views, the center column (representing the focal date) is visually distinct. Weekend dates are also styled with an alternate background color for easy identification.
  * **Hide Weekends** User has te option to view weekdays (Mon-Fri) only and scroll skipping over weekends.

* **Header:**
  * **Date Label:** Each column is clearly labeled with the date and day of the week (e.g., 2025.AUG.18, Monday), with a user preference setting for the format planned.
  * **Navigation:**
	* < and > buttons allow for single-day scroll navigation.
	* << and >> buttons enable multi-day jumps, shifting the view by 3 or 5 days corresponding to the current layout.
	* << and >> buttons only visible on edge columns in 3 and 4 days view.

* **Footer:**
  * An input field is present at the bottom of each column for adding new entries.
  * Pressing Enter creates the entry, clears the input, and immediately re-focuses the field, allowing for rapid, sequential logging.
  
  ⠀
#### JOURNAL ENTRY CARDS
  
Each card represents a single journal entry for a given day.
* **Display & Interaction:**
  * **Title:** The entry's title is editable via double-click.
  * **Note Editor:** Clicking anywhere on the card opens a full editor for detailed notes.
  * **Drag & Drop:** Entries can be fluidly dragged and dropped inside same column and between different day columns to change their date.
  * **Notes Indicator:** A notes icon (📝) appears next to the title only when the entry contains body text.
  * **Privacy Indicator:** Private entries are marked with a subtle diagonal line pattern to make their status clear.
  * **Aesthetics:** A thin, decorative teal-colored bar is displayed at the bottom of each card for a consistent and polished look.

* **Actions Menu** (Ellipsis ... on hover)
  * **Notes** Opens the note editor.
  * **Make Private / Make Public** Toggles the entry's privacy status.
  * **Duplicate** Creates a copy of the entry in the same column.
  * **Delete** Permanently removes the entry.
  * **Move:** Allows to move the journal entry to another date.
  * **Share:** Allows to share the journal entry to another user(s).
  
* **UI/UX Feedback & Animations**
  * **Hover Effect:** A soft "lift" shadow appears when hovering over an entry card, indicating it's interactive.
  * **Fluid Navigation:** The view should smoothly animate when scrolling or navigating between dates, providing a seamless experience.
  
* **Interconnectivity (Future Phase)** 
  * **Outline Integration:** There is a planned feature to link a journal entry to a specific topic in the **Outlines View**, allowing it to function as a node within a hierarchical structure.
  * **Data Integrity:** If a linked entry is removed from an outline, the original journal entry will remain untouched in the Journal View, ensuring no data is accidentally lost.
  
#### Custom Calendar Overlays
	* Display Labels: The app can display custom labels (e.g., fiscal weeks) as badges in the Journal view column headers.
	* Users can see the name of the calendars they created, or enter the name of a calendar created by someone else who decided to let others use it.
	* Users can opt-in/out of their own calendar as well as those that other users gave them the names for.
	* Calendar Manager:  CRUD modal for creating, editing, and deleting custom calendar events. Users can only delete their own calendars.
	* Support for multiple calendar types (e.g., "fiscal", "holidays", "birthdays").
	* Ability to import/export calendar data.
	  
 ### OUTLINES VIEW
   
 This mind-map inspired view provides a flexible, hierarchical note-taking system for structuring complex ideas, planning projects, researching, or breaking down large topics into manageable parts. The interface is designed as a collapsible tree, allowing users to focus on details or view the big picture.
   
 
 #### HIERARCHY & NODE MANAGEMENT
   
 The entire outline is a collection of nodes (items) that can be nested to create parent-child relationships. The core functionality revolves around managing these nodes.
* **Structure:** Nodes can be infinitely nested. A subtle indicator (e.g., a chevron icon) on parent nodes allows users to expand or collapse its entire branch, hiding or revealing its children.
* **Adding Nodes:** Users can add new nodes at the root level (top level) or as a child of any existing node via a context menu or dedicated buttons.
* **Editing Nodes:** Node titles can be edited inline via a double-click.
* **Drag & Drop:** Nodes and their entire branches can be intuitively dragged and dropped to change their position or nesting level (re-parenting).
* **Deleting Nodes:** Users can delete a single node. If a parent node is deleted, its entire branch of descendant nodes will also be deleted.
   
   ⠀
 #### NODE ACTIONS & DISPLAY
   
 Each node is an interactive element with its own set of properties and actions.
 **Display & Interaction:**
* **Title:** The primary text of the node.
* **Child Count:** A subtle badge on parent nodes may indicate the number of direct children.
* **Privacy Indicator:** Private nodes (and by extension, their entire branches) are marked with a subtle diagonal line pattern to make their status clear.
   
 **Actions Menu** (Ellipsis ... on hover or right-click)
  * **Add Child Node:** Creates a new, indented node directly below the current one.
  * **Promote:** Moves node and anything hanging from it to the same level it's parent note resides in.
* **Demote:** Moves note to hand from another same level node in the tree.
* **Fold:** Hides all nodes hanging from the node where the fold function was invoked.
* **Unfold:** Shows all nodes hanging from the node where the unfold function was invoked, unless other folds were enacted in a descendant.
* **Make Private / Make Public:** Toggles the node's privacy status.
  * **Duplicate*** Creates a copy of the node and its entire branch of children.
  * **Delete:** Permanently removes the node and its descendants.
  * **Link to...:** (Future Phase) Initiates the process to connect the node to a Task column or Journal entry.
   
**UI/UX Feedback & Animations**
  * **Hover Effect:** A soft background highlight appears when hovering over a node.
* **Drag Feedback:** When dragging, a "ghost" image of the node/branch follows the cursor. A clear visual line or highlight indicates the valid drop location within the hierarchy.
  * **Collapse/Expand Animation:** Branches open and close with a smooth, subtle animation to prevent jarring layout shifts.
   
**Interconnectivity (Future Phase)**
* **Tasks Integration:** An entire Outline or a specific branch can be linked to a dedicated Task column. This creates a powerful project view where the outline is the plan and the tasks are the actionable steps.
* **Journal Integration:** A single Journal entry can be linked to an Outline node, allowing diary-style entries to be embedded as contextual notes within a larger structure.
* **Data Integrity:** The connections are non-destructive. Deleting a linked Task column or a linked Journal entry from the outline will not delete the original item in its native view, ensuring no accidental data loss. Similarly, deleting the outline will not delete the linked Task column. 

### EVENTS VIEW (AGENDA PLANNER)

  This view provides a specialized tool for planning and organizing complex, multi-day events. It functions like a calendar, allowing users to create detailed agendas by arranging event segments (cards) chronologically across daily columns. The goal is to enable holistic preparation and streamlined execution for any scheduled event.
    
#### SETUP
    
  Before building an agenda, the user first defines the event's high-level container, referred to as a Event.
* **Event Creation:** An Event is a first-class object with a Title, a Start Date, and an End Date. These parameters define the scope and duration of the event being planned.
* **Assets:** Within as Event's setup screen, users can define a master list of all available assets for the event. This pre-populates the options available for each Event segment.  Assets include physical materials (e.g., notebooks, whiteboards) and Technical Devices (e.g., projectors, video conferencing units).
* **Participants:** A list of all potential Participants.
* **Locations:** A list of available Premises and specific Rooms.

    
    ⠀
#### MEETING LAYOUT & NAVIGATION
    
  The main interface is designed for a clear, chronological overview of the Event schedule.
* **Columnar Layout:** The view is a horizontally scrollable layout where each column represents a single day within the Event's defined date range.
* **Timeline:** Each daily column is rendered as a vertical timeline, segmented by hours (e.g., 8:00 AM, 9:00 AM, minimal time block configurable), visually mirroring a standard calendar application like Microsoft Outlook.
* **Navigation:** Standard < and > buttons allow for quick navigation between the days of the event.
* **Adding Segments:** Users can create a new Event segment by clicking directly on an empty time slot within a day's column.
    
#### EVENT SEGMENTS (CARDS)
    
  Each card on the timeline represents a single, distinct Event segment or topic.
  **Core Properties:**
    * **Title:** The primary topic or name of the segment.
    * **Start Time & Duration**: These properties determine the segment's vertical position and height on the daily timeline.
	* **No-Overlap Rule:** The interface will strictly enforce a no-overlap rule, preventing users from creating or moving a segment into a time slot that is already occupied.
  **Resource Assignment:**
    * **Lead:** Fields to assign segment lead from the Event's master list.
	  * **Presenter:** Fields to assign segment presenters from the Event's master list.
	* **Attendees:** Fields to assign attendees from the Event's master list.
    * **Location:** A dropdown to select the Premise/Room for the segment.
    * **Assets:** Checkboxes to select the required Materials and Technical Devices for the segment.
  **Content & Actions:**
    * **Notes:** Each segment contains a rich text area for detailed descriptions, which opens the Unified Note Editor.
    * **Linked Tasks:** An area to link or create actionable items related to the agenda segment, integrating directly with the Tasks View.
    * **Standard Card Features:** Like all other cards in the app, segments support a Privacy Toggle, Sharing, Duplication, and Deletion.
      ⠀
#### UI/UX FEEDBACK & INTERACTION
	* **Drag & Drop:** Segments can be fluidly dragged and dropped to different time slots or across different daily columns to reschedule. The UI will provide clear visual feedback and prevent drops that would cause a time conflict. Contextual menu allows to move by tapping or clicking.
	* **Dynamic Resizing:** Users can drag the bottom edge of a segment card to intuitively adjust its duration in increments based on the minimum timeblock configured for the master plan.
	* **Hover Effect:** A soft "lift" shadow or highlight appears when hovering over a segment, indicating it is interactive.
  
### NOTE EDITOR (UNIFIED MODAL)
   
This component is a universal, dual size (small-factor and full-screen modal) editor that provides a focused, distraction-free writing environment. It serves as the single, consistent interface for creating and editing detailed notes for Tasks, Journal entries, Planning segments and Outline nodes. The core philosophy is to maintain a simple, fast, plain-text editing experience while empowering it with modern tools for text transformation, lightweight formatting, and seamless integration with other app modules.

#### CORE PHILOSOPHY & BEHAVIOR
* **Plain Text Core with Markdown:** The editor's foundation is a simple text area with a monospaced font for clarity and portability. It natively supports Markdown syntax (e.g., # for headings, * for lists) for lightweight formatting. A toggle will allow users to switch between the raw text view and a rendered Preview Mode.  The preview matches what the editor would build for the print function.
* **Modal & Universal:** The editor always opens as a modal window, ensuring the user can focus on the note. It is accessible from any item in the app that supports long-form text.
* **Autosave & Reliability:** All changes are auto-saved locally every few seconds to prevent data loss. A simple version history will be accessible to restore previous states of the note.
* **Keyboard Navigation:** The ESC key serves as a universal shortcut to close the editor and return to the previous view.
⠀
#### EDITOR LAYOUT
   
 The editor is organized into four primary sections: a header for context, a tabbed toolbar for actions, the main text area, and a status bar for metadata.
 Header:
* **Contextual Title:** Displays the title of the parent item (e.g., "Task Note: Design the new logo"). The title is editable on double-click or double-tab directly from the header.
* **Window Controls:** Standard buttons for Print, Export, and Save & Close, Close (x).
* Toolbar (Tabbed Ribbon):
    * A tabbed interface organizes all tools. On narrow screens, less-used tools will responsively collapse into an ellipsis (...) menu.
    * Tabs Include: Format, Find & Replace (within the note), Search Notes, and Add Task.
* **Text Area:**
    * The main vertically scrollable writing space.
    * It features line numbers displayed in a left-hand gutter for easy reference, especially when working with structured text or code snippets.
* **Status Bar (Footer):**
    * A persistent footer provides real-time metadata at a glance.
    * Left Side: Live counters for Words, Characters, and Lines.
    * Right Side: A "Last Saved" timestamp that updates automatically.
   
#### TOOLBAR FUNCTIONALITY
* **Format Tab:**
  * **Text Transformations:** Tools for case conversion (UPPER, Title, lower), trimming whitespace and removing duplicate or empty lines.
  * **Formatting & Symbols:** One-click actions for applying/removing list formatting (bulleted, numbered), inserting a text border and underline.
    * **View Options:** Controls to increase (A+) or decrease (A-) the font size within the editor.
	 * **Calculator:** Tries to perform math calculation on selected text and add = and the result after selection.
* **Find & Replace Tab:**
    * Provides a standard search interface to find and replace text within the current note.
    * Includes options for case sensitivity and whole-word matching.
* **Add Task Tab:**
    * A dedicated form to create a new task directly from the note's content.
    * Form Fields: A text input for the task title, a checkbox to mark it as a priority, and a dropdown to select the destination Task Column.
    * Action: A + button creates the task in the selected column and provides a brief confirmation banner (e.g., "Task Created").
* **Search Tab:**
  * Searches across all notes created by the current user and shows the list below the editor.
  * User can click on any of the notes in the list, the note opens, and the user can edit the note, go back to the note from which the search was launched.  This allows for a use case in which the user can trace back multiple instances of a topic to get in context quick.  
   ⠀
#### IMPORT & EXPORT
	* Export Options: Notes can be exported in multiple formats, including Plain Text (.txt), Markdown (.md), and PDF. The PDF export will use the rendered Markdown view.
	* Print: A print-friendly view renders the note's Markdown for clean, readable hard copies. 
  
## TECHNICAL ARCHITECTURE

**Database Schema V4 Core**

* users
  user_id INT PK (future fields for auth/plans)

* columns
  column_id INT PK
  user_id INT NOT NULL
  column_name VARCHAR(64) NOT NULL
  position INT NOT NULL
  created_at, updated_at DATETIME NULL

* tasks
  task_id INT PK
  user_id, column_id INT NOT NULL
  encrypted_data TEXT NOT NULL
  position INT NOT NULL
  status ENUM('normal','priority','completed') NOT NULL
  created_at, updated_at DATETIME NULL

**Future Schema Extensions**

* tasks.encrypted_data: "notes", "dueDate"
* tasks.delegated_to: INT FK
* tasks.is_private: BOOL privacy switch
* task_shares: (task_id, owner_id, shared_with_user_id, permissions, shared_at)
* column_shares: (column_id, owner_id, shared_with_user_id, permissions, shared_at)
* Usage logs, plan tiers, analytics tables 
* Compaction: Position indices recompact on any task/column change, for fast UI/DB.

## API GATEWAY AND CONTRACTS

* Endpoint: /api/api.php
* Requests: POST JSON {module, action, data}
* Response: {"status": "...", "data": ...} or {"status": "error", "message": ...}
* All mutations require CSRF token.
* Current Endpoints:
  * getAll 
  * createTask 
  * moveTask 
  * reorderColumn 
  * toggleComplete 
  * togglePriority 
  * deleteTask 
  * duplicateTask 
  * renameTaskTitle 
  * createColumn 
  * deleteColumn 
  * renameColumn 
  * reorderColumns 
  * HTTP codes: 200, 201, 400, 403, 404, etc.

## FRONT END ARCHITECTURE

* assets/js/app.js: bootstrap, tab/view switch, modal helpers, DEVMODE banner.
* assets/js/tasks.js: board render, column/task creation, drag/drop, sort, editors, rollback.
* assets/css/style.css: global responsive layout.
* assets/css/views/tasks.css, /editor.css: feature-specific styling.

## MOBILE UX

 Columns stack vertically at ≤768px width; mobile supports all features.
 Footer spacers for iOS Safari overlays.
[FIX] Optimize scroll, button hits [pending QA].
 Pull-to-create for mobile.

## VERSIONING AND WORKFLOW

* Spec version: v4.7.0 (merged).
* Minor: new features.
* Patch: docs or refactors.
* Source files tagged.
* Git: commits ≤100 words, scope/files explicit.
* Tags: v4.7.x-dev for merged feature sets.

## DEBUG AND TESTING PATTERNS

* Set /includes/config.php DEVMODE=true for debug.log.
* Test API via curl/REST with CSRF.
* Dev test accounts: alfa, delta, omega.

## GLOSSARY

* Task card = task
* Journal entry card = entry
* Event plan = event
* Event plan segment = segment
* Outlines tree = tree
* Tree branch = branch
* Branch node = node

## WIREFRAME MOCKUPS

### TASKS VIEW
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
│ 19.Aug.25, Tuesday             [F1] [F2] [F3] [F4]                 [alfa] │
└───────────────────────────────────────────────────────────────────────────┘

### JOURNAL VIEW
┌───────────────────────────────────────────────────────────────────────────┐
│[≡] ☕️ MyDayHub [Tasks] [Journal] [Outlines] [Events]                      │
└───────────────────────────────────────────────────────────────────────────┘
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ 18.Aug.25, Mon      … │ │ 19.Aug.25, Tue      … │ │ 20.Aug.25, Wed      … │
│───────────────────────│ │───────────────────────│ │───────────────────────│
│  Meeting notes        │ │ Design ideas          │ │  Progress summary     │
│  Project kickoff      │ │ Milestone feedback    │ │                       │
│  Daily reflection     │ │                       │ │                       │
│                       │ │                       │ │                       │
│───────────────────────│ │───────────────────────│ │───────────────────────│
│ + New Entry           │ │ + New Entry           │ │ + New Entry           │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│ 19.Aug.25, Tuesday  [<<][<] [>][>>] View [1][3][5] Days [Wrap-up]   (alfa)│
└───────────────────────────────────────────────────────────────────────────┘

### OUTLINES VIEW
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

### EVENTS VIEW

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

### NOTES EDITOR VIEW (MAXIMIZED)
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

### NOTES EDITOR VIEW (REDUCED, OVERLAY)
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

// End of APP_SPEC v4.7.0 //