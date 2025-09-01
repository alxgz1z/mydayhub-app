# MYDAYHUB

## WHY ARE WE DOING THIS
* Because I need to collaborate with an small team and promote productivity on activities that matter.
* Because I want to experiment with AI code assistance, agents, etc. to put myself in the shoes of my team.
* Because I'm curious and this is a way to channel my creativity and passion for development. 

## APPLICATION SPECIFICATION (Beta 5.0.0)
* Audience: Internal Development & PM Use Only
* This spec is a resource for contributors, testers, and future "Alex”

## APP SCOPE (*IMPORTANT*)
From Beta 5.0.0 on, the application scope is strictly focused on perfecting the Tasks View. All development, UI, and architecture improvements will support this “tasks-first” approach. Other views (Journal, Outlines, Events) and their code remain deferred, except for maintenance work required for future integration. This narrowly defined scope is foundational to delivering a high-quality, fluid, and privacy-focused experience.

## ENVIRONMENTS
* Prod (v3): Isolated; no shared users/DB/files
* Dev (v4): Localhost, Apache+PHP 8, mariaDB, XAMPP

## FILE LOCATIONS
* \ 			only index.php here
* \api\			all api files, no subdirectories.
* \uix\			all js and css files, no subdirectories.
* \media\		sounds, images, icons and all other app ui files, no subdirectories except \media.
* \media\imgs\	images attached to tacks are stored here (with file name coded for each user), no subdirectories.
* \incs\		any includes needed by the app, no subdirectories, except \migrations and \meta
* \login\		all login, logout, register, etc. needed for registration, authentication, password management, etc.
* \meta\		documents explaining the app scope, status, next steps, etc.

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
**MyDayHub** is a next-generation productivity hub, built from the ground up for focus, simplicity, and absolute privacy. We start with task management and in the future plan to integrate other powerful tools into one seamless, app-like experience. The interface takes inspiration from the latest productivity and fintech UI trends, integrating dark backgrounds, vivid accent gradients, and translucent overlays for overlays and modals. Rounded cards, ample white space, and legible, scalable typography reinforce clarity and intention. The color-coded status bands and quick-action icons for classification, privacy, attachments, and sharing are visible at all times—making key features discoverable while keeping the workspace visually calm and focused.   All user content is encrypted end-to-end with zero-knowledge encryption—no plaintext content is ever stored on or leaves the client device. The only content that is stored remotely is encrypted data or metadata essential for synchronization and session handling.

* **Tasks:** Kanban inspired tasks board for flexible task tracking. Create custom columns, prioritize with a click, and manage your entire workflow with simple drag-and-drop.
* **Journal:** (Future development) Capture your daily thoughts, notes, and ideas in a chronological log. Your entire history is archived and instantly searchable.
* **Outlines:** (Future development) Structure complex ideas and connect your thoughts by creating hierarchical, tree-like notes.
* **Events:** (Future development) Effortlessly plan complex, multi-day events. Build a clear agenda by arranging activity blocks for multiple teams or participants, keeping everyone perfectly in sync.

## GENERAL PHILOSOPHY
Our development is guided by a few core principles to ensure the best possible experience.
* **Absolute Privacy:** Your data is yours alone. We use **zero-knowledge encryption**, meaning all your content is encrypted and decrypted directly on your device. We can never see your data, and neither can anyone else. True Zero-Knowledge: Every item (task, note) is encrypted client-side using a per-item Data Encryption Key (DEK). Each DEK is itself encrypted with a Master Key derived on-device via Argon2id from the user’s passphrase and a user-specific salt.
* **Fluid Experience:** MyDayHub feels like a native app. Edit text inline, drag and drop items, and switch between tools instantly without ever waiting for a page to reload. The interface is fully responsive, working beautifully on any screen from your phone to your desktop.
* **Modern & Minimalist Design:** We believe in simplicity. The interface is clean, direct, and never overwhelming, allowing you to focus on what matters most. Our design defaults to a comfortable dark theme to reduce eye strain, but you always have the choice to switch to a bright light theme.
* **Work Anywhere:** Full **offline support** allows you to keep working without an internet connection. Your data will sync automatically the next time you connect. Smart session handling also prevents data conflicts if you're logged in on multiple devices.
* **Signal over Noise:** Productivity is not just finishing tasks, but finishing
the *right* tasks. We classify each item by how directly it advances the
user’s mission. This provides awareness, nudges conscious decision-making,
and prevents getting lost in busywork.
* **Accessibility & Inclusivity**
	* All screens, controls, and modals are fully navigable with both touch gestures and keyboard shortcuts; tab order and ARIA labels are implemented for screen readers.
	* Users can increase/decrease font size globally (A+/A-) and toggle high-contrast mode in settings.
	* Focus indicators, clear error feedback, and persistent status messages appear for all user-triggered actions across desktop and mobile contexts.
	* Visual hierarchy carefully guides attention, using both color and relative card elevation.

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
  * Enhanced Visual Language & Accessibility
  	* The visual design deliberately uses distinct accent colors, deep card backgrounds, and clear status bands to reinforce actionable priorities and privacy states for tasks, columns, and notes.
  	* All interactive elements utilize large, touch-friendly targets and maintain a minimum contrast ratio of 4.5:1 for both text and icons, supporting WCAG AA accessibility.
  	* Responsive layouts maintain card padding and flexible column stacking for horizontal scroll on desktop and vertical stacking on mobile, ensuring information is always accessible and readable.
  	* Every control state (hover, focus, active) exhibits smooth elevation and color changes for improved discoverability and feedback.
  	* Per-item privacy toggles and encrypted status indicators should incorporate subtle, universally recognizable iconography (e.g., locks, diagonal bands, or shading).
  	* Animations for drag-and-drop, completion, and modal transitions use a “gentle spring” pattern, reducing cognitive load and minimizing distraction.

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
  * On screens ≤768px, columns reorganize into a single vertical flow, and controls collapse into sticky bottom navigation bars.
  * All tap targets meet or exceed 48x48px, with swipe and pull-to-create gestures accessible from all major app views.
  * Floating action buttons and thumb-reachable menus are employed for rapid task creation and navigation in every mobile context.
  * Settings, notifications, and contextual menus are thumb-accessible and feature haptic feedback on supported devices.

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

* **Frontend Encryption (Zero-Knowledge Boundary)**
  * All encryption and decryption logic is encapsulated in assets/js/crypto.js.
  * Every task and note is encrypted on the client using a per-item DEK; never decrypted or re-encrypted by server-side code.
  * DEKs are encrypted with a per-user Master Key, itself derived on device via Argon2id from passphrase + salt.
  * Master Key or passphrase is never sent to the server.
  * Sharing uses X25519 (ECDH) for wrapping; Ed25519 for signatures; tasks can be shared only if recipient has registered public keys.
  * Sharing envelope for each recipient: {recipient_user_id, wrapped_DEK, sender_sig}.
  * Accepts only encrypted data at rest and in transit—plaintext storage is disabled except in development mode for local testing.
  * Acceptance: All CRUD actions must operate with encryption enabled. Tests ensure rewraps, share/revoke, and offline sync are successful and private keys remain undisclosed at all times.
  
* **Offline support**
  * Service Worker: /service-worker.js pre-caches app shell; IndexedDB mirrors all lists for instant load and offline work.
  * Write Queue: All local changes queue in IndexedDB when offline and auto-flush upon reconnect, with visual feedback (banner or icon state).
  * Conflict Handling: Last-write-wins (by updated_at, version, device_id); UI badge highlights conflicts, user chooses to “keep mine” or “take remote”.
  * Network Strategy: Stale-while-revalidate shell; network-first API for mutations, local fallback for lists.
  * Acceptance: CRUD and move actions fully tested for offline/online transitions; deliberate network drops simulated in tests.
  * Planned: Progressive roll-out for automatic background sync and intelligent retry policy.
  
## USER STORIES AND USE CASES

### USER STORIES
* _As a user, I want the confidence that all my content is securely encrypted._
* _As a user, I want to mark any item as "private" to instantly hide it from view._
* _As a user, I want to prevent concurrent sessions from accidentally overwriting each other's changes._
* _As a user, I want offline support to add and edit items, with changes syncing automatically when I reconnect._
* _As a user, I want to fluidly drag and drop tasks (future: journal entries, and meeting segments)._
* _(Future: As a user, I want to email a task or note directly into my board or journal.)_
* _As a mobile user, I want the app to have a responsive layout so I can work effectively one-handed on my phone._
* _As a power user, I want to see my usage statistics and quotas so I can manage or upgrade my plan._
* _As a team lead, I want to delegate tasks (future:, and outline next steps)._
* _As a team lead, I want to securely share items with my team and be able to revoke access at any time._
* _As a team member, I want to update notes and change the status of shared items to collaborate effectively with my team._
* _As a user, I want to classify tasks as Signal, Support, or Noise so I can
  clearly distinguish what drives my mission from what distracts me._
* _As a user, I want to see my completed tasks in context, so I can review how
  much of my effort went to Signal vs. Noise._
* _As a user, I want to cycle a task’s status among Signal, Support, Noise, and Completed with a single action and see task groupings reflect this._
* _As a user, I want all team and sharing actions to respect privacy and encryption, making sure only people I choose can read shared tasks._
* _As a user, I want to attach images to a task by dragging and dropping, pasting, or selecting a file, so I can provide visual context._
* _As a user, I want to see at a glance which tasks have attachments and how many there are._
* _As a user, I want to be notified when I'm nearing my storage limit so I can manage my files._
* _As a user, I want to be prompted before my oldest images are deleted to make space for new ones._


### USE CASES
* Mark any task (Future: journal entry, outline node, or event segment) as private and filter/hide accordingly.
* Drag and drop tasks (Future: journal entries, outline nodes, and event segments) with smooth, animated feedback.
* See usage stats and plan limits; receive UI warnings when close to quota.
* Email a task or note into the board using a unique secret token.
* Share tasks (Future: or journal entries) one-to-one using @alias or modal UI, with revocable, encrypted access.
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
	* (Future: Section tabs ("Tasks", "Journal", "Outlines", "Events"))
	* Context-sensitive controls (visible based on view selected):
	  * (Future: Journal: "Today" button and calendar date picker to make the desired date the central column in the view.)
	  * Tasks: Add Column form.
	  * (Future: Journal: "Search" (keyword, etc.) to lookup Entries from the user Journal.
	* Responsive Header: "more options" dropdown menu (⋮) appears on narrow screens to house controls like "Search," "Today," etc., preventing UI overflow.)
  
### BOTTOM TOOLBAR
Full-width, one-row control bar
(Future: Contents vary depending on active section (Tasks, Journal, Outlines, Events))
  **Toolbar Controls**
	* **Left:** Current date, Theme switch (dark/light), Show/Hide private items switch, Global App Font Size (A-/A+ buttons)
	* **Center:** Context aware buttons
		* **Tasks View Filters:** Show/Hide Shared, Show/Hide Mine, Show/Hide Completed (default hide), Show/Hide High Priority
		(Future: * ** Journal View:** Buttons with "1","3" and "5" to determine how many columns are displayed. Button "Wrap-Up" to create a new Entry that aggregates all the entries in the focus date.  This new Entry is added on top.)
	* **Right:** Current Username within square parethensis (example: "[alfa]"), Logout ("⏻ Logout" in red)
 
### SETTINGS
Slider accessible from title bar
* High-Contrast/Colorblind Mode toggle: Increases color separation for icons, status bands, and accents
* Keyboard & screen reader navigation mode: Option to enable strict tab order for all actionable controls.
* (Future: Skip weekends in journal swtich)
* (Future: Calendar Overlays (button opens modal))
* Automatic Logout (dropdown select 5 mins, 30 min, 3 hours, never)
* Change Password (button opens modal)
* Import/Export (button opens modal)
* Help (button opens User Manual)

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
  * Task card status bands are a minimum of 6px wide, running edge-to-edge vertically, and display clear, distinct colors for Signal (green), Support (blue), Noise (orange), and Completed (gray).
  * Privacy, attachment, and sharing icons are always visible on both card and column headers, featuring subtle animations (opacity and blur transitions) on hover/tap.
  * Card borders and backgrounds utilize a “soft shadow ring” and backdrop blur for depth without clutter, consistent from mobile to desktop layouts.
  * All drag-and-drop gestures trigger animated “lift” and “drop” UI cues, scalable for touch and pointer events.

* **Attachments Display:**
  * An attachment icon (e.g., 📎) with a count badge will appear on cards with attachments.
  * On hover, a tooltip will list the image filenames.
  * Clicking the icon opens a simple gallery modal displaying thumbnails of the attached images. Clicking a thumbnail shows the full-size image.
  * The entire task card will act as a drop zone, highlighted visually when a file is dragged over it.

* **Status Indicators:**
  * **Status Band:** Each task card prominently displays a colored status band on its left edge:
  * **Signal**: Green — Actions with direct mission impact
  * **Support**: Blue — Enablers and indirect progress
  * **Noise**: Orange — Activities that distract or have unclear value
  * **Completed**: Gray — finished tasks, archived at the bottom

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
  * By default, columns group tasks by classification in the order: Signal > Support > Noise > Completed. Manual drag-and-drop is possible within those groups only. Moving a card between groups cycles its classification accordingly.
  * All reordering actions are persisted instantly.
  * **Automatic Sorting Rules:**
  **1** Signal tasks are always sorted to the top of the column.
  **2** Support tasks appear below Signal.
  **3** Noise tasks appear below Support.
  **4** Completed tasks are always moved to the bottom.
  * **Manual Sorting:** Within each status group (Signal, Support, Noise, Completed), the user's manual drag-and-drop order is maintained.
  * **Triggers:** Sorting logic is applied instantly whenever a task is created, moved, dropped, duplicated, or its status changes.
  * The **classification** db field serves as the primary mechanism for sorting and visual grouping in the UI.

* **UI/UX Feedback & Animations**
  * **Hover Effect:** A soft "lift" shadow appears when hovering over a task card.
  * **Completion Effect:** Checking off a task triggers a gold flash animation, and updates all relevant task counts.
  * **Compaction:** Deleting or completing a task instantly compacts the list, removing empty space.

#### TASK ATTACHMENTS
  This feature allows users to attach images to tasks for visual reference, mockups, or context. Attachments are managed within a storage quota to control server space.

  * Upload Methods:
  	* File Picker: Clicking an "Add Attachment" button in the gallery modal opens the native file dialog.
  	* Drag and Drop: Dropping image files directly onto a task card initiates an upload for that task.
  	* Paste: Pasting image data from the clipboard (e.g., a screenshot) while a task card or its attachment gallery is in focus initiates an upload.
  
  * File Handling:
	* Supported formats: JPEG, PNG, GIF, WebP.
	* Per-file size limit: 5 MB.
	* The UI must provide feedback for upload progress (e.g., a spinning icon on the attachment badge) and show clear success or error messages.
  
  * Storage Quota:
  	* Each user has a defined storage quota (e.g., 50 MB).
  	* Before an upload, the system checks if the new file will exceed the user's quota.
  	* Pruning Policy: If the quota is exceeded, the user will be presented with a confirmation modal: "Uploading this file will exceed your storage limit. The oldest attachment, [oldest_image_filename.jpg], will be deleted to make space. Continue?".
  	* Upon confirmation, the oldest image file is deleted from the server and its database record is removed before the new file is uploaded.


### JOURNAL VIEW (Future)
   
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
	  
### OUTLINES VIEW (Future)
   
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

### EVENTS VIEW (AGENDA PLANNER) (Future)
   
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

#### TEXT EDITOR PHILOSOPHY & BEHAVIOR
* **Plain Text Core with Markdown:** The editor's foundation is a simple text area with a monospaced font for clarity and portability. It natively supports Markdown syntax (e.g., # for headings, * for lists) for lightweight formatting. A toggle will allow users to switch between the raw text view and a rendered Preview Mode.  The preview matches what the editor would build for the print function.
* **Modal & Universal:** The editor always opens as a modal window, ensuring the user can focus on the note. It is accessible from any item in the app that supports long-form text.
* **Autosave & Reliability:** All changes are auto-saved locally every few seconds to prevent data loss. A simple version history will be accessible to restore previous states of the note.
* **Keyboard Navigation:** The ESC key serves as a universal shortcut to close the editor and return to the previous view.
⠀
#### EDITOR LAYOUT
   
 The editor is organized into four primary sections: a header for context, a tabbed toolbar for actions, the main text area, and a status bar for metadata.
* **Header**
	* **Contextual Title:** Displays the title of the parent item (e.g., "Task Note: Design the new logo"). The title is editable on double-click or double-tab directly from the header.
	* **Window Controls:** Standard buttons for Print, Export, and Save & Close, Close (x).
* **Toolbar** (Tabbed Ribbon):
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
## IMPORT & EXPORT
	* Export Options: Notes can be exported in multiple formats, including Plain Text (.txt), Markdown (.md), and PDF. The PDF export will use the rendered Markdown view.
	* Print: A print-friendly view renders the note's Markdown for clean, readable hard copies. 
  
## TECHNICAL ARCHITECTURE

**Database Schema Core**

* users
  user_id INT PK
  username VARCHAR(50) NOT NULL UNIQUE
  email VARCHAR(255) NOT NULL UNIQUE
  password_hash VARCHAR(255) NOT NULL
  created_at DATETIME NOT NULL DEFAULT current_timestamp()
  storage_quota_bytes BIGINT NOT NULL DEFAULT 52428800 -- 50 MB
  storage_used_bytes BIGINT NOT NULL DEFAULT 0

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
  classification ENUM('signal','support','noise','completed') NOT NULL
  is_private BOOL NOT NULL DEFAULT 0
  delegated_to INT NULL
  created_at, updated_at DATETIME NULL
  
  (The "classification" field now serves as the primary mechanism for sorting and visual grouping in the UI.)

  
* task_attachments
  attachment_id INT PK
  task_id INT NOT NULL (FK to tasks.task_id)
  user_id INT NOT NULL (FK to users.user_id, for easy quota lookup)
  filename_on_server VARCHAR(255) NOT NULL (e.g., user1_1661899731_a4e1b.jpg)
  original_filename VARCHAR(255) NOT NULL
  filesize_bytes INT NOT NULL
  mime_type VARCHAR(50) NOT NULL
  created_at DATETIME NOT NULL

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
* New API actions for Beta 5:
  * toggleClassification: cycles a task’s classification through Signal, Support, Noise, Completed
  * togglePrivacy: sets per-task or per-column privacy
  * shareTask and revokeShare: manage encrypted sharing and access
  * Analytics endpoints: log CRUD/user navigation for quota status and feature improvement.
  * All mutations require verifiable session ownership and CSRF validation.
* File Uploads: Requests for uploadAttachment will use multipart/form-data, not application/json. The gateway must be adapted to handle this, extracting {module, action, data} from the form fields alongside the file data.
* New Endpoints:
  * getAttachments (module: tasks): Retrieves a list of attachments for a given task_id.
  * uploadAttachment (module: tasks): Handles file upload, quota check, and pruning logic. Requires task_id.
  * deleteAttachment (module: tasks): Deletes a specific attachment. Requires attachment_id. Updates user's storage_used_bytes.

### API Implementation tracking
* Implemented API Actions:
  * [RDY] register (in auth.php)
  * [RDY] login (in auth.php)
  * [RDY] getAll (in tasks.php)
  * [RDY] createColumn (in tasks.php)
  * [RDY] createTask (in tasks.php)
  * [RDY] toggleComplete (in tasks.php)
  * [RDY] reorderTasks (in tasks.php)
* Future API Actions:
  * [FUT] moveTask
  * [FUT] reorderColumn
  * [FUT] togglePriority
  * [FUT] renateTask
  * [FUT] deleteTask
  * [FUT] duplicateTask
  * [FUT] renameTaskTitle
  * [FUT] deleteColumn
  * [FUT] renameColumn

## FRONT END ARCHITECTURE

* uix/app.js: bootstrap, tab/view switch, modal helpers, DEVMODE banner.
* uix/tasks.js: board render, column/task creation, drag/drop, sort, editors, rollback.
* uix/crypto.js: Handles all encryption/decryption, key management, and crypto-related user actions.
  * SPA logic implements classification cycles, privacy toggles, offline notifications, and optimistic rollbacks.
  * IndexedDB logic ensures full CRUD parity with network, respecting sort/group/crypto constraints.
* uix/style.css: global responsive layout.
* uix/tasks.css, uix/editor.css: feature-specific styling.

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

* Set /incs/config.php DEVMODE=true for debug.log.
* Test API via curl/REST with CSRF.
* Dev test accounts: alfa, delta, omega.

## ENVIRONMENT SETUP

This application uses a `.env` file in the root directory to manage sensitive credentials and environment-specific settings. This file should **not** be committed to version control.

### Required Variables
Create a '.env' file in the project root with the following variables:

	~~~ini
	# --- General Settings ---
	DEV_MODE=true # true for local, false for production
	
	# --- Database Credentials ---
	DB_HOST="127.0.0.1"
	DB_NAME="mydayhub"
	DB_USER="root"
	DB_PASS=""
	
	# --- SMTP Credentials ---
	SMTP_HOST="smtp.hostinger.com"
	SMTP_USER="your_email@example.com"
	SMTP_PASS="your_password"
	SMTP_PORT=587
	~~~

### Installation
	This project uses Composer to manage PHP dependencies. To install the required libraries (like phpdotenv), run the following command in the project root (connect SSH):
	~~~~
	terminal> ssh u756585617@185.185.185.185 -p 65002
	ssh> cd domains/breveasy.com/public_html
	ssh> composer require vlucas/phpdotenv


## GLOSSARY

* Task card = task
* Journal entry card = entry
* Event plan = event
* Event plan segment = segment
* Outlines tree = tree
* Tree branch = branch
* Branch node = node
* Signal task = directly advances the mission
* Support task = indirectly enables Signal
* Noise task = does not advance the mission, candidate for delegation or drop
* Completed task = finished item, archived at bottom
* hostinger hosted environment = web-env
* local hosted environment = loc-env
* Drag-and-Drop = DnD
* Toast Notification = Toast
* Modal Window = Modal

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


* In every task card representation, show a colored status band at the left for classification.
* Add a clear visual switch for per-card and per-column privacy.
* Status cycling and privacy actions are always reachable via quick controls.


### JOURNAL VIEW (Future)
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

### OUTLINES VIEW (Future)
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

### EVENTS VIEW (Future)
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


### Visual Language Note
The rendered wireframes and UI samples reinforce minimalism, clarity, and actionable feedback directly inspired by leading productivity and fintech apps. Accent colors, rounded shapes, and live counters are always paired with clear status bands and fluid mobile layouts, supporting every user on any device.


## APP ICONS

### MENU BAR
* Mug
  <svg width="40" height="42" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden"><g transform="translate(-1489 -343)"><g><path d="M2093.33 371.5C2045.98 427.328 1998.63 483.155 2002.75 538.251 2006.87 593.348 2112.54 651.369 2118.03 702.078 2123.52 752.786 2079.61 797.643 2035.69 842.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-opacity="1" fill="none" fill-rule="evenodd"/><path d="M2298.11 371.5C2250.36 427.328 2202.6 483.155 2206.75 538.251 2210.91 593.348 2317.49 651.369 2323.03 702.078 2328.57 752.786 2284.27 797.643 2239.97 842.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-opacity="1" fill="none" fill-rule="evenodd"/><path d="M2502.33 371.5C2454.98 427.328 2407.63 483.155 2411.75 538.251 2415.87 593.348 2521.54 651.369 2527.03 702.078 2532.52 752.786 2488.61 797.643 2444.69 842.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-opacity="1" fill="none" fill-rule="evenodd"/><path d="M1190.39 0 95.6097 0C42.8063 0 0.000721782 42.8027 0.000721782 95.6025L0.000721782 192.904 0 192.904 0.000721782 192.909 0.000721782 198.605 0.807313 198.605 52.9553 566.952C67.5786 670.243 122.687 757.828 199.964 815.935L209.914 822.698 216.229 830.351C284.598 898.716 379.049 941 483.376 941L802.622 941C906.95 941 1001.4 898.716 1069.77 830.351L1076.08 822.701 1086.04 815.935C1163.31 757.828 1218.42 670.243 1233.04 566.953L1285.19 198.605 1286 198.605 1286 95.6025C1286 42.8027 1243.19 0 1190.39 0Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-opacity="1" fill="none" fill-rule="evenodd" transform="matrix(-1 0 0 1 2909.5 1011.5)"/><path d="M2922.18 1209.85C2950.38 1205.65 2978.58 1201.45 3006.78 1209.85 3034.98 1218.25 3068.52 1240.01 3091.38 1260.24 3114.25 1280.48 3132.54 1304.14 3143.97 1331.25 3155.41 1358.36 3160.36 1393.86 3159.98 1422.87 3159.6 1451.89 3149.69 1483.96 3141.69 1505.33 3133.68 1526.71 3131.4 1535.11 3111.96 1551.15 3092.53 1567.18 3071.57 1579.4 3025.07 1601.54 2978.58 1623.68 2866.92 1672.93 2833 1684" stroke="currentColor" stroke-width="64.1667" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-opacity="1" fill="none" fill-rule="evenodd"/><path d="M1519.5 1889.5C1603.15 1952.67 1686.8 2015.84 1753.26 2052.59 1819.72 2089.34 1831.57 2098.53 1918.27 2110.01 2004.98 2121.5 2139.24 2121.5 2273.5 2121.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="8" stroke-opacity="1" fill="none" fill-rule="evenodd"/><path d="M0 0C83.6505 63.1683 167.301 126.337 233.763 163.089 300.225 199.842 312.066 209.03 398.772 220.515 485.478 232 619.739 232 754 232" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="8" stroke-opacity="1" fill="none" fill-rule="evenodd" transform="matrix(-1 0 0 1 3010.5 1889.5)"/><rect x="2111.5" y="1363.5" width="307" height="282" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-opacity="1" fill="none"/><path d="M2220.5 1446.5 2286.53 1556.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="8" stroke-opacity="1" fill="none" fill-rule="evenodd"/><path d="M0 0 235.307 386.402" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="8" stroke-opacity="1" fill="none" fill-rule="evenodd" transform="matrix(-1 0 0 1 2521.81 1170.5)"/></g></g></svg>

### CONTEXTUAL MENU
* Change priority
  <svg xmlns="http://www.w3.org/2000/svg"
     width="24" height="24" viewBox="0 0 24 24"
     fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 15 12 21 18 15"></polyline>
    <polyline points="18 9 12 3 6 9"></polyline>
  </svg>

* Edit Note and Due Date  
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  
* Change Column
  <svg xmlns="http://www.w3.org/2000/svg"
    width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 6 21 12 15 18"></polyline>
    <polyline points="9 18 3 12 9 6"></polyline>
  </svg>

* Share
  <svg width="24" height="24" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98m0-9.98-6.83 3.98"/>
  </svg>
* Mark as Private
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a20.29 20.29 0 0 1 4.23-5.29"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.29 20.29 0 0 1-2.88 3.88"/>
    <circle cx="12" cy="12" r="3"></circle>
    <line x1="2" y1="2" x2="22" y2="22"></line>
  </svg>
  
* Duplicate Task
  <svg width="24" height="24" viewBox="0 0 24 24" 
    fill="none" 	stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
  
* Delete Task
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
  
### NOTES EDITOR

* Expand
  <svg xmlns="http://www.w3.org/2000/svg"
       width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <g transform="rotate(45 12 12)">
      <polyline points="6 15 12 21 18 15"></polyline>
      <polyline points="18 9 12 3 6 9"></polyline>
    </g>
  </svg>

* Collapse
  <svg xmlns="http://www.w3.org/2000/svg"
       width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <g transform="rotate(45 12 12)">
      <polyline points="15 6 21 12 15 18"></polyline>
      <polyline points="9 18 3 12 9 6"></polyline>
    </g>
  </svg>
  
* Save and Close
<svg xmlns="http://www.w3.org/2000/svg"
     width="24" height="24" viewBox="0 0 24 24"
     fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
  <polyline points="8 14 11 17 16 12"></polyline>
</svg>



// End of APP_SPEC Beta 5.0.0 //