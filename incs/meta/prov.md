# # MYDAYHUB APPLICATION SPECIFICATION

**Version:** Beta 5.4.0
**Audience:** Internal Development & Project Management


### WHY ARE WE DOING THIS

* To collaborate effectively with a small team and promote productivity on activities that matter.
* To experiment with AI code assistance and agents, putting myself in the shoes of my team.
* To channel my creativity and passion for development.

⠀

## Table of Contents

**1** **The Vision & Scope**
	* Application Scope
	* Application Description
	* Core Philosophy
	* User Stories & Use Cases
**2** **The Functional Specification**
	* General UI Requirements
	* Tasks View
	* Journal View (Future)
	* Outlines View (Future)
	* Events View (Agenda Planner) (Future)
	* Unified Note Editor
**3** **The Technical Specification**
	* Technical Architecture
	* API Gateway and Contracts
	* Frontend Architecture
	* Environment Setup & Workflow
**4** **Appendices**
	* Glossary
	* Wireframe Mockups
	* Application Icons

⠀

## 1. The Vision & Scope


### APPLICATION SCOPE (IMPORTANT)

From Beta 5.0.0 on, the application scope is strictly focused on perfecting the **Tasks View**. All development, UI, and architecture improvements will support this “tasks-first” approach. Other views (Journal, Outlines, Events) and their code remain deferred, except for maintenance work required for future integration. This narrowly defined scope is foundational to delivering a high-quality, fluid, and privacy-focused experience.

### APPLICATION DESCRIPTION

**MyDayHub** is a next-generation productivity hub, built from the ground up for focus, simplicity, and absolute privacy. We start with task management and in the future plan to integrate other powerful tools into one seamless, app-like experience. The interface takes inspiration from the latest productivity and fintech UI trends, integrating dark backgrounds, vivid accent gradients, and translucent overlays for modals. Rounded cards, ample white space, and legible, scalable typography reinforce clarity and intention. The color-coded status bands and quick-action icons for classification, privacy, attachments, and sharing are visible at all times—making key features discoverable while keeping the workspace visually calm and focused. All user content is encrypted end-to-end with zero-knowledge encryption—no plaintext content is ever stored on or leaves the client device.
* **Tasks:** A Kanban-inspired board for flexible task tracking. Create custom columns, manage workflow with simple drag-and-drop, and classify tasks to focus on what truly matters.
* **Journal:** (Future) Capture your daily thoughts, notes, and ideas in a chronological log.
* **Outlines:** (Future) Structure complex ideas and connect your thoughts by creating hierarchical, tree-like notes.
* **Events:** (Future) Effortlessly plan complex, multi-day events by arranging activity blocks in a clear agenda.

⠀
### CORE PHILOSOPHY

* **Absolute Privacy:** Your data is yours alone. We use **zero-knowledge encryption**, meaning all your content is encrypted and decrypted directly on your device. We can never see your data, and neither can anyone else.
* **Fluid Experience:** MyDayHub feels like a native app. Edit text inline, drag and drop items, and switch between tools instantly without ever waiting for a page to reload. The interface is fully responsive, working beautifully on any screen.
* **Modern & Minimalist Design:** The interface is clean, direct, and never overwhelming, allowing you to focus on what matters most. Our design defaults to a comfortable dark theme to reduce eye strain.
* **Signal over Noise:** Productivity is not just finishing tasks, but finishing the *right* tasks. We classify each item by how directly it advances the user’s mission (Signal, Support, or Noise) to provide awareness and prevent getting lost in busywork.
* **Accessibility & Inclusivity:** The application is designed to be fully navigable with touch, mouse, and keyboard. We adhere to WCAG AA contrast ratios and provide options for high-contrast modes and font scaling.

⠀
### USER STORIES & USE CASES


**User Stories**

* *As a user, I want the confidence that all my content is securely encrypted.*
* *As a user, I want to classify tasks as Signal, Support, or Noise so I can clearly distinguish what drives my mission from what distracts me.*
* *As a user, I want to fluidly drag and drop tasks.*
* *As a mobile user, I want the app to have a responsive layout so I can work effectively on my phone.*
* *As a user, I want to attach images to a task by dragging and dropping, pasting, or selecting a file, so I can provide visual context.*
* *As a user, I want to see at a glance which tasks have attachments and how many there are.*
* *As a user, I want to be notified when I'm nearing my storage limit so I can manage my files.*
* *As a user, I want to be prompted before my oldest images are deleted to make space for new ones.*

⠀
**Use Cases**

* Mark any task as private and filter/hide accordingly.
* Drag and drop tasks with smooth, animated feedback.
* See usage stats and plan limits; receive UI warnings when close to quota.
* Use the app seamlessly on both desktop (multi-column) and mobile (single-column).
* Work offline with automatic sync and resolution when reconnecting.
* Avoid conflicts: When multiple sessions are open, only the most recent has write rights, with “reclaim control” as needed.
* Access help and onboarding, with clear feedback for every action via toasts.

⠀

## 2. The Functional Specification


### GENERAL UI REQUIREMENTS

* **Aesthetics:** The UI is intentionally minimal: rounded corners, clean sans-serif typography, soft shadows, and backdrop-filter effects for depth. A dark mode is the default.
* **Layout:** All interactive elements use large, touch-friendly targets. Responsive layouts ensure columns stack vertically on mobile while scrolling horizontally on desktop.
* **Feedback:** All interactive elements (hover, focus, active) exhibit smooth elevation and color changes. All actions are confirmed with non-blocking toast notifications.
* **Modals:** All modals (Confirmation, Due Date, etc.) are custom-styled, non-blocking, and close with the Escape key.

⠀
### TASKS VIEW

A Kanban-style layout that is horizontally scrollable on wide screens and vertically stacked on narrow screens.

**TITLE BAR**

* **Left:** App title ("MyDayHub") and logo.
* **Right:** A "+ New Column" button that reveals an inline input field.

⠀
**BOTTOM TOOLBAR**

* **Left:** Current Username (e.g., [alfa]), Current Date (formatted as dd mmm yy).
* **Center:** A filter icon button that opens a contextual menu for view options.
  * **Tasks View Filters:** The menu contains an on/off slider for "Show/Hide Completed" (default hide).
* **Right:** Application Version Number, Logout link.

⠀
**COLUMNS**

* **Header:** Contains an editable title (via double-click), a live task counter, and hover-activated controls for deleting or reordering the column.
* **Body:** Displays task cards. An empty state message appears if there are no tasks.
* **Footer:** An input field for quickly adding new tasks.

⠀
**TASK CARDS**

* **Display & Interaction:**
  * **Title:** Editable via double-click.
  * **Drag & Drop:** Tasks can be fluidly dragged within and between columns.
  * **Status Band:** A colored band on the left edge indicates its classification: **Signal** (green), **Support** (blue), **Noise** (orange), or **Completed** (gray). Clicking the band cycles through the classifications.
  * **Metadata Footer:** Appears if the task has notes, a due date, or attachments, with clickable icons for each.
* **Actions Menu** (Vertical ellipsis ⋮ is always visible):
  * **Cycle Classification:** Rotates the task's classification through Signal, Support, and Noise.
  * **Notes:** Opens the Unified Note Editor.
  * **Due Date:** Opens a modal to set or clear the due date.
  * **Attachments:** Opens the attachments gallery modal.
  * **Duplicate:** Creates an identical copy of the task.
  * **Delete:** Removes the task after confirmation.
* **Sorting Rules:**
  1 Tasks are automatically grouped by classification: **Signal > Support > Noise > Completed**.
  2 Within each group, the user's manual drag-and-drop order is preserved.
  3 This sorting is enforced on load, creation, and any status change.

⠀
**TASK ATTACHMENTS**

* **Upload Methods:**
  * **File Picker:** Clicking a "Browse Files..." button in the gallery modal.
  * **Drag and Drop:** Dropping files onto the gallery modal's drop zone.
  * **Paste:** Pasting image data from the clipboard.
* **File Handling:**
  * **Supported:** JPEG, PNG, GIF, WebP, PDF.
  * **Size Limit:** 5 MB per file.
* **Storage Quota:**
  * Each user has a 50 MB storage quota, displayed on a progress bar in the modal.
  * **[FIX] Pruning Policy:** The spec requires a confirmation modal before the oldest file is deleted to make space. *Currently, the backend deletes the oldest file automatically without a prompt.*
* **Viewing:**
  * Images open in a full-screen, in-app modal viewer that respects the image's aspect ratio.
  * PDFs open in a new browser tab.

⠀
### JOURNAL VIEW (Future)

A chronological, date-based layout for journal entries.

### OUTLINES VIEW (Future)

A mind-map inspired view for hierarchical note-taking.

### EVENTS VIEW (AGENDA PLANNER) (Future)

A specialized tool for planning multi-day events on a timeline.

### UNIFIED NOTE EDITOR

A universal modal editor for all long-form text content.
* **Core Behavior:** A plain-text editor with Markdown support. Notes are **auto-saved** after the user pauses typing. The **Escape** key closes the editor.
* **Layout:**
  * **Header:** Contextual title (e.g., "Note: Design the new logo") and window controls.
  * **Toolbar:** A tabbed ribbon with tools for "Format" and "Find & Replace".
  * **Text Area:** Main writing space with a monospaced font.
  * **Status Bar:** Live counters for words and characters, plus a "Last Saved" timestamp.
* **Toolbar Functionality:**
  * **Format:** Case transformations, list formatting, borders, underline, font size adjustment, and a simple calculator for selected text.

⠀

## 3. The Technical Specification


### TECHNICAL ARCHITECTURE

* **Timestamp Policy:** All timestamps (created_at, updated_at, due_date) are stored in the database in **UTC** using UTC_TIMESTAMP(). The frontend is responsible for converting to the user's local time.
* **Database Schema:**
  * users: user_id, username, email, password_hash, preferences (JSON), storage_used_bytes.
  * columns: column_id, user_id, column_name, position.
  * tasks: task_id, user_id, column_id, encrypted_data, position, is_priority (TINYINT), classification (ENUM), is_private.
  * task_attachments: attachment_id, task_id, user_id, filename_on_server, original_filename, filesize_bytes, mime_type.

⠀
### API GATEWAY AND CONTRACTS

* **Endpoint:** /api/api.php
* **Requests:** POST with a JSON body: {module, action, data}.
* **Responses:** {"status": "success", "data": ...} or {"status": "error", "message": ...}.
* **Security:** All mutating actions require a session-based CSRF token.
* **API Implementation Status:**
  * **[RDY]** register, login
  * **[RDY]** getAll, createColumn, renameColumn, deleteColumn, reorderColumns
  * **[RDY]** createTask, renameTaskTitle, deleteTask, duplicateTask
  * **[RDY]** toggleComplete, toggleClassification, reorderTasks, saveTaskDetails
  * **[RDY]** getAttachments, uploadAttachment, deleteAttachment
  * **[RDY]** saveUserPreference
  * **[FUT]** moveTask, shareTask, togglePrivacy

⠀
### FRONTEND ARCHITECTURE

* /uix/app.js: App initialization, global UI functions (toasts, modals).
* /uix/tasks.js: All logic for the Tasks View (rendering, interactivity, API calls).
* /uix/editor.js: All logic for the Unified Note Editor.
* /uix/style.css: Global styles, layout, and theme variables.
* /uix/tasks.css, /uix/editor.css, /uix/attachments.css: View-specific styles.

⠀
### ENVIRONMENT SETUP & WORKFLOW

* **Configuration:** The application uses a .env file in the root for all credentials and environment-specific settings.
* **Dependencies:** vlucas/phpdotenv is managed via Composer.
* **Prerequisites:** The fileinfo PHP extension must be enabled. The /media/imgs/ directory must be writable by the web server.
* **Debugging:** Setting DEVMODE=true in .env enables detailed error logging to /debug.log.
* **Testing:** Use test accounts alfa, delta, omega.

⠀

## 4. Appendices


### GLOSSARY

* **Task card:** A single task item.
* **Signal task:** A task that directly advances the mission.
* **Support task:** A task that indirectly enables a Signal task.
* **Noise task:** A task that does not advance the mission.
* **DnD:** Drag-and-Drop.
* **Toast:** A non-blocking notification message.

⠀
### WIREFRAME MOCKUPS


**TASKS VIEW**

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

**JOURNAL VIEW (Future)**

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

**OUTLINES VIEW (Future)**

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

**EVENTS VIEW (Future)**

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

**NOTES EDITOR VIEW (MAXIMIZED)**

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

**NOTES EDITOR VIEW (REDUCED, OVERLAY)**

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

### APPLICATION ICONS


**MENU BAR**

* Mug

⠀XML

<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>MyDayHub Logo</title>
  <desc>MyDayHub Logo</desc>
  <g stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
	<path d="M50 22 V 12" />
	<path d="M30 34 L 22 26" />
	<path d="M70 34 L 78 26" />

	<path d="M25 50 A 25 25 0 0 1 75 50" />

	<path d="M18 50 A 32 35 0 0 0 82 50" />
	<path d="M82 55 C 92 60, 92 75, 82 80" />
  </g>
</svg>

**CONTEXTUAL MENU**

* Cycle Classification XML  <svg xmlns="http://www.w3.org/2000/svg"
* width="24" height="24" viewBox="0 0 24 24"
* fill="none" stroke="currentColor"
* stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
* <polyline points="6 15 12 21 18 15"></polyline>
* <polyline points="18 9 12 3 6 9"></polyline>
* </svg>
*    
* Edit Note XML  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
*    
* Edit Due Date XML  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
* <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
* <line x1="16" y1="2" x2="16" y2="6"></line>
* <line x1="8" y1="2" x2="8" y2="6"></line>
* <line x1="3" y1="10" x2="21" y2="10"></line>
* </svg>
*    
* Change Column XML  <svg xmlns="http://www.w3.org/2000/svg"
* width="24" height="24" viewBox="0 0 24 24"
* fill="none" stroke="currentColor"
* stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
* <polyline points="15 6 21 12 15 18"></polyline>
* <polyline points="9 18 3 12 9 6"></polyline>
* </svg>
*    
* Share XML  <svg width="24" height="24" viewBox="0 0 24 24" 
* fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98m0-9.98-6.83 3.98"/>
* </svg>
*    
* Mark as Private XML  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
* viewBox="0 0 24 24" fill="none" stroke="currentColor"
* stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
*   <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a20.29 20.29 0 0 1 4.23-5.29"/>
*   <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.29 20.29 0 0 1-2.88 3.88"/>
* <circle cx="12" cy="12" r="3"></circle>
* <line x1="2" y1="2" x2="22" y2="22"></line>
* </svg>
*    
* Duplicate Task XML  <svg width="24" height="24" viewBox="0 0 24 24" 
* fill="none" 	stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
* </svg>
*    
* Delete Task XML  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
* stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
* </svg>
*    

⠀
**NOTES EDITOR**

* Expand XML  <svg xmlns="http://www.w3.org/2000/svg"
* width="24" height="24" viewBox="0 0 24 24"
* fill="none" stroke="currentColor"
* stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
*   <g transform="rotate(45 12 12)">
* <polyline points="6 15 12 21 18 15"></polyline>
* <polyline points="18 9 12 3 6 9"></polyline>
*   </g>
* </svg>
*    
* Collapse XML  <svg xmlns="http://www.w3.org/2000/svg"
* width="24" height="24" viewBox="0 0 24 24"
* fill="none" stroke="currentColor"
* stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
*   <g transform="rotate(45 12 12)">
* <polyline points="15 6 21 12 15 18"></polyline>
* <polyline points="9 18 3 12 9 6"></polyline>
*   </g>
* </svg>
*    
* Save and Close XML  <svg xmlns="http://www.w3.org/2000/svg"
* width="24" height="24" viewBox="0 0 24 24"
* fill="none" stroke="currentColor"
* stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
* <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
* <polyline points="8 14 11 17 16 12"></polyline>
* </svg>   
