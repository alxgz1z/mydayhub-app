# MYDAYHUB APPLICATION SPECIFICATION

**Version:** Beta 6.7.0  
**Audience:** Internal Development & Project Management  
**Last Updated:** September 15, 2025

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Implementation Tracking](#2-implementation-tracking)
3. [Vision & Scope](#3-vision--scope)
4. [Functional Specification](#4-functional-specification)
5. [Technical Specification](#5-technical-specification)
6. [Appendices](#6-appendices)

---

## 1. Introduction

### 1.1 Why Are We Doing This

MyDayHub represents more than just another productivity application—it's an experiment in building a truly private, focused, and collaborative workspace for small teams. The project serves three critical purposes:

- **Collaborate effectively** with a small team and promote productivity on activities that matter
- **Experiment with AI code assistance** and agents, putting ourselves in the shoes of our team members
- **Channel creativity and passion** for development while creating something genuinely useful

The application embodies a philosophy of "signal over noise," helping users distinguish between work that advances their mission and work that merely keeps them busy. In an era where data privacy concerns are mounting and productivity tools often become productivity obstacles, MyDayHub aims to be different.

### 1.2 Project Context & Learning Goals

This project serves as a practical laboratory for exploring modern development practices, particularly AI-assisted coding workflows. By building a real-world application with genuine users, we gain authentic insights into how AI tools can accelerate development without sacrificing code quality or security.

The focus on privacy-first architecture challenges us to think beyond conventional patterns, implementing zero-knowledge encryption while maintaining the collaborative features teams need. This balance between absolute privacy and practical collaboration represents one of the most interesting technical challenges in modern web development.

---

## 2. Implementation Tracking

### 2.1 Status Legends

- **[RDY]** Feature complete, matches spec intent and is production-ready
- **[WIP]** Under construction, present but evolving with active development
- **[FIX]** Implemented but needs refactoring or bug fixes before release
- **[FUT]** Scheduled for future milestone, planned but not yet started
- **[CNS]** Under consideration, not yet scheduled or committed

### 2.2 API Implementation Tracking

The backend API follows a single-gateway pattern with modular handlers, ensuring consistent security, logging, and error handling across all endpoints.

#### Authentication & User Management
- **[RDY]** `register` (in auth.php) - Complete user registration with password hashing
- **[RDY]** `login` (in auth.php) - Session-based authentication with CSRF protection
- **[RDY]** `requestPasswordReset` (in auth.php) - Secure email-based password reset
- **[RDY]** `performPasswordReset` (in auth.php) - Token validation and password update
- **[RDY]** `changePassword` (in users.php) - Authenticated password changes

#### Core Task Management
- **[RDY]** `getAll` (in tasks.php) - Comprehensive board data with tasks, columns, and metadata
- **[RDY]** `createColumn` (in tasks.php) - New column creation with position management
- **[RDY]** `createTask` (in tasks.php) - Task creation with auto-positioning and classification
- **[RDY]** `toggleComplete` (in tasks.php) - Task completion with celebration triggers
- **[RDY]** `reorderTasks` (in tasks.php) - Drag-and-drop persistence with position compaction
- **[RDY]** `toggleClassification` (in tasks.php) - Signal/Support/Backlog status cycling
- **[RDY]** `renameColumn` (in tasks.php) - Inline column title editing
- **[RDY]** `deleteColumn` (in tasks.php) - Soft delete with undo capability
- **[RDY]** `reorderColumns` (in tasks.php) - Column positioning for drag-and-drop
- **[RDY]** `deleteTask` (in tasks.php) - Soft delete with toast-based undo
- **[RDY]** `renameTaskTitle` (in tasks.php) - Inline task title editing
- **[RDY]** `duplicateTask` (in tasks.php) - Task duplication with smart positioning
- **[RDY]** `saveTaskDetails` (in tasks.php) - Notes persistence from Unified Editor
- **[RDY]** `restoreItem` (in tasks.php) - Undo functionality for soft-deleted items
- **[RDY]** `moveTask` (in tasks.php) - Cross-column moves with Mobile Move Mode
- **[RDY]** `snoozeTask` (in tasks.php) - Preset and custom date snoozing
- **[RDY]** `unsnoozeTask` (in tasks.php) - Manual and automatic task wake-up

#### Advanced Features
- **[RDY]** `saveUserPreference` (in users.php) - Settings persistence (filters, UI state)
- **[RDY]** `getAttachments` (in tasks.php) - File listing with metadata
- **[RDY]** `uploadAttachment` (in tasks.php) - Multi-format file upload with quotas
- **[RDY]** `deleteAttachment` (in tasks.php) - File deletion with storage recalculation
- **[RDY]** `togglePrivacy` (in tasks.php) - Privacy flag management for tasks/columns

#### Collaboration (Foundation)
- **[RDY]** `shareTask` (in tasks.php) - Task sharing with permission management and recipient lookup
- **[RDY]** `unshareTask` (in tasks.php) - Hard delete share removal with immediate persistence  
- **[RDY]** `listTaskShares` (in tasks.php) - Share enumeration for modal display
- **[WIP]** Permission-based action restrictions for shared task recipients

> **Note:** `deleteTask` and `deleteColumn` actions perform soft delete by setting a `deleted_at` timestamp. The `restoreItem` action reverts this, enabling the undo functionality.

> **Architecture Note:** All API endpoints using `window.apiFetch` are properly documented and include CSRF protection, ownership validation, and debug logging when `DEVMODE=true`.

### 2.3 UI Implementation Tracking

The frontend follows a mobile-first, progressive enhancement approach with a focus on touch-friendly interactions and accessibility.

#### Foundation & Authentication
- **[RDY]** User Registration page - Clean, minimal design with validation
- **[RDY]** User Login page - Session management with "Forgot Password" flow
- **[RDY]** Responsive board layout (desktop/mobile) - Adaptive column stacking

#### Core Board Functionality
- **[RDY]** Board rendering from getAll API - Real-time data synchronization
- **[RDY]** Create Column (inline form) - Progressive disclosure pattern
- **[RDY]** Rename Column (double-click) - In-place editing with validation
- **[RDY]** Delete Column (hover button with confirmation) - Soft delete with undo
- **[RDY]** Reorder Columns (hover buttons + drag-and-drop) - Both mobile and desktop patterns
- **[RDY]** Create Task (footer input) - Context-aware task creation
- **[RDY]** Rename Task Title (double-click) - Consistent editing pattern
- **[RDY]** Toggle Task Completion (checkbox) - With celebration animation
- **[RDY]** Task Completion Celebration Animation - Multi-effect 1.5-second sequence
- **[RDY]** Task Drag-and-Drop - Within and between columns with visual feedback

#### Task Classification & Management
- **[RDY]** Task Classification (status band popover) - Signal/Support/Backlog selection
- **[RDY]** Enforced Task Sorting by classification - Automatic hierarchy maintenance
- **[RDY]** Task Actions Menu (⋮ button) - Context-sensitive action disclosure
- **[RDY]** Delete Task (from actions menu) - Non-blocking confirmation with undo
- **[RDY]** Custom modals/toasts - Unified notification system replacing native alerts
- **[RDY]** Due Date picker (custom modal) - Clean date selection interface
- **[RDY]** Task Attachments UI (drop zone, gallery) - Multi-format file support
- **[RDY]** Bottom toolbar with filters - Persistent filter state management
- **[RDY]** Privacy toggles - Item-level privacy with visual indicators
- **[RDY]** Mobile Move Mode - Button-based cross-column movement for touch

#### Collaboration UI (Foundation)
- **[RDY]** Share Modal (recipient input, permission selection, current access list)
- **[RDY]** "Shared with Me" virtual column with automatic population
- **[RDY]** Shared task visual styling (border, gradient, badges)
- **[RDY]** Lightweight share badge updates without board reload
- **[WIP]** Permission-based task action menu filtering
- **[FUT]** Mobile share workflow optimization

#### Advanced UI Features
- **[RDY]** Task Notes integration (Unified Editor) - Full-featured editing experience
- **[RDY]** Quick Notes (card flip) - 3D animation for short note editing
- **[WIP]** Settings slider panel - Global preferences with light/dark mode
- **[RDY]** Change Password modal - Secure password update workflow
- **[RDY]** Forgot Password page & flow - Email-based reset with security
- **[RDY]** Task Snooze Modal - Preset durations and custom date picker
- **[RDY]** Snooze Visual Indicators - Purple badge with wake date display
- **[RDY]** Dynamic Snooze/Unsnooze Menu State - Context-aware action menus
- **[RDY]** Snoozed Task Visual Styling - Opacity and grayscale effects
- **[RDY]** Show/Hide Snoozed Tasks Filter - Bottom toolbar toggle with persistence

#### Collaboration UI (Foundation)
- **[WIP]** Sharing UI (Share modal, Current Access list, Unshare) - Basic sharing workflow

### 2.4 Priority Roadmap (Beta 6.7+)

The roadmap prioritizes stability, core feature completion, and foundational architecture for future advanced features.

#### Immediate Priorities (Sprint 1-2)
#### Immediate Priorities (Sprint 1-2)
1. **Recipient Permission System** - Implement action menu filtering and interaction restrictions based on share permissions (`view`/`edit` vs owner rights)

2. **Sharing Workflow Polish** - Complete mobile UX testing, refine modal interactions, and add permission-based visual cues

3. **Touch Moves: Mobile Move Mode 2.0** - Restore enhanced Move Mode with shared task restrictions and clear permission indicators

4. **Zero-Knowledge Baseline** (encryption boundary only) - Consolidate crypto to `/uix/crypto.js`; prepare per-item DEKs and wrapping model; defer key-sharing until cryptographic foundation is solid.

#### Medium-term Features (Sprint 3-4)
5. **Recovery (Security-Questions) for ZK Password Reset** - Add Recovery Key → Recovery Envelope flow before fully enabling ZK reset, ensuring users don't lose data due to forgotten passwords.

6. **Sharing (foundation)** - UI + API stubs (shareTask / revokeShare) without E2E key exchange yet, providing basic collaboration without compromising the zero-knowledge architecture.

#### Long-term Features (Sprint 5+)
7. **Offline MVP** (defer) - Service Worker app-shell, IndexedDB mirror, write queue (LWW) for true offline-first experience.

8. **Accessibility Polish** - Colorblind/high-contrast tuning; ARIA announcements for Move Mode; keyboard navigation improvements.

#### Priority Roadmap Updates

Recent completions have shifted focus toward advanced user experience and collaboration:
- "Column Reordering (Drag & Drop)" completed with both button and drag interfaces
- "Debug/Observability Hardening" completed based on comprehensive backend testing results  
- "Zero-Knowledge Baseline" priority increased based on stable foundation now established

---

## 3. Vision & Scope

### 3.1 Application Scope

From Beta 5 onward, the application scope is strictly focused on perfecting the **Tasks View**. All development, UI, and architecture improvements support this "tasks-first" approach. Other views (Journal, Outlines, Events) remain deferred, except for maintenance work required for future integration.

This focused approach allows us to create an exceptionally polished task management experience rather than a mediocre multi-purpose tool. By mastering one domain completely, we establish patterns and architecture that will scale elegantly when we expand scope.

### 3.2 Application Description

**MyDayHub** is a next-generation productivity hub, built for focus, simplicity, and absolute privacy. We start with task management and plan to integrate Journal, Outlines, and Events later. The UI combines dark backgrounds, accent gradients, translucent overlays, and rounded cards. Typography is clean and scalable. Status bands and quick-action icons are always visible, supporting classification, privacy, attachments, and sharing.

All content is encrypted end-to-end with zero-knowledge encryption. Plaintext is never stored or transmitted.

#### Current Features
- **Tasks:** Kanban board for flexible task tracking with Signal/Support/Backlog classification

#### Future Features  
- **Journal (Future):** Daily notes and reflections with timeline navigation
- **Outlines (Future):** Hierarchical trees for structuring ideas and projects
- **Events (Future):** Agenda planning with segments for meeting management

### 3.3 Core Philosophy

The application is built on six foundational principles that guide every design and technical decision:

#### Absolute Privacy
True zero-knowledge encryption with per-item DEKs, encrypted by a Master Key derived on device via Argon2id from passphrase + salt. Master Key never leaves device. This ensures that even if our servers are compromised, user data remains completely private.

#### Fluid Experience  
Inline editing, drag-and-drop, single-page interactions with optimistic UI updates. Every action should feel immediate and responsive, with animations providing feedback and rollback capabilities for error handling.

#### Modern & Minimalist
Simplicity, clarity, comfortable dark theme (light optional). The interface should disappear, allowing users to focus entirely on their work without UI friction or visual clutter.

#### Work Anywhere
Full offline support with sync resolution. Users should be able to work productively regardless of network connectivity, with intelligent conflict resolution when multiple devices sync.

#### Signal over Noise
Classification ensures attention on mission-critical tasks. The system actively helps users distinguish between work that advances their goals and work that merely keeps them busy.

#### Accessibility
WCAG color contrast, ARIA labels, keyboard navigation, font scaling, high-contrast mode. The application must be usable by everyone, regardless of ability or preferred interaction method.

### 3.4 General Requirements

These requirements apply across all features and ensure consistency in user experience:

#### Visual Design
- **Aesthetics:** Rounded corners, sans-serif fonts, shadows, translucency, accent color highlights
- **Layout:** Responsive, touch-friendly, mobile-first design patterns
- **Theming:** Dark theme primary, light theme optional, high-contrast mode available

#### Privacy & Security
- **Privacy Switch:** Every item (column, task, entry, event, tree, branch, node) can be marked private
- **Sessions:** Multi-user sessions with last-writer control and ownership checks  
- **Encryption:** Client-side encryption with server-side validation of permissions

#### User Experience
- **Optimistic UI:** Animations with rollback if errors occur
- **Progressive Disclosure:** Features appear when needed, hide when not
- **Non-blocking Feedback:** Toast notifications instead of blocking alerts

#### System Features
- **Quotas:** Tiered storage/sharing limits, upgrade prompts for resource management
- **Telemetry:** CRUD, navigation, and sharing analytics for product improvement
- **Import/Export:** JSON for migration and backup capabilities
- **Notifications:** Alerts for reminders, quota nearing, conflicts, and collaboration
- **Debugging:** DEVMODE=true logs to debug.log; curl/API tests; offline simulations

### 3.5 User Stories

The following user stories capture the core value propositions and guide feature development:

#### 3.5.1 Privacy & Security
- As a user, I want all of my content to be encrypted end-to-end so that no one else can read it
- As a user, I want to toggle privacy on any item so I can control who sees what  
- As a user, I want to securely share items with other users, granting them view or edit access

#### 3.5.2 Collaboration & Awareness
- As a user, I want to notify others when I change a shared item, so they stay up to date
- As a user, I want to receive a notification when someone else modifies an item I shared with them

#### 3.5.3 Productivity & Workflow  
- As a user, I want to drag and drop to manage my tasks (and later entries, nodes, and segments) for quick organization
- As a user, I want to classify tasks as Signal, Support, Backlog, or Completed to stay focused on what matters
- As a user, I want to attach and manage images within tasks to keep related information in one place
- As a user, I want to email tasks directly into the app so I can capture work quickly

#### 3.5.4 Mobility & Responsiveness
- As a user, I want the app to work seamlessly on both desktop and mobile layouts
- As a user, I want to use the app effectively on my phone while on the go

#### 3.5.5 Reliability & Offline
- As a user, I want to edit offline and have changes auto-sync when I reconnect

#### 3.5.6 Notifications & Limits
- As a user, I want clear notifications for reminders, conflicts, and system alerts
- As a user, I want to be warned when I'm nearing my storage limit so I can manage my files  
- As a user, I want to be prompted before my oldest attachments are deleted, so I can choose what to remove

---

## 4. Functional Specification

### 4.1 Tasks View

The Tasks View serves as the application's primary interface, implementing a Kanban-style board with horizontal scroll on desktop and vertical stack on mobile. All interactions use optimistic updates with rollback on error.

#### 4.1.1 Column Structure

**Header Components:**
- Title (inline edit via double-click)
- Live task count with classification breakdown
- Privacy toggle with visual indicator  
- Actions menu (delete/move/settings)

**Body Layout:**
- Displays task cards with enforced sorting
- Placeholder text for empty columns
- Drag-and-drop targets for cross-column moves

**Footer Interface:**
- Quick-add input field for new tasks
- Transforms to "Move here" button during Mobile Move Mode
- Context-sensitive interaction patterns

#### 4.1.2 Task Card Architecture

**Display Elements:**
- Title (inline edit via double-click)
- Classification status band (clickable popover)
- Checkbox for completion with celebration animation
- Metadata footer (notes indicator, due date, attachments, privacy)

**Interactive Features:**
- Drag-and-drop handle (≡) for desktop reordering
- Actions menu (⋮) for context-sensitive operations  
- Quick Notes card flip for short note editing
- Status band popover for classification changes

**Visual States:**
- **Normal:** Full opacity, standard styling
- **Completed:** Celebration animation, then filtered visibility based on user preference
- **Snoozed:** Opacity 0.65, grayscale(0.3) filter, purple wake indicator
- **Private:** Diagonal line pattern overlay
- **Shared:** Distinct styling with recipient badges

#### 4.1.3 Task Classification System

The classification system implements the core "Signal over Noise" philosophy:

**Classification Types:**
- **Signal (Green):** Directly advances the mission - highest priority
- **Support (Blue):** Enables Signal tasks indirectly - medium priority  
- **Backlog (Orange):** Important but not time-sensitive - lower priority
- **Completed (Gray):** Finished tasks - archived at bottom

**Sorting Rules:**
- Enforced hierarchy: Signal > Support > Backlog > Completed
- Manual ordering preserved within each classification group
- Automatic re-sorting on classification changes and drag-and-drop
- Cross-column moves maintain classification priority

**User Interface:**
- Status band click opens classification popover
- Direct selection instead of cycling through options
- Visual feedback with color-coded left border
- Accessibility patterns for colorblind users

#### 4.1.4 Mobile & Touch Interactions

The application provides dual interaction patterns optimized for different device types:

**Touch Drag & Drop (Mobile/Tablet):**
- Long-press (~350ms) on card handle (≡) to initiate drag
- Visual feedback: elevated shadow, target highlighting
- Support for same-column reordering and cross-column moves
- Automatic scroll when dragging near screen edges

**Mobile Move Mode 2.0 (Enhanced):**
- Enter via Actions → Move, card enters wiggle state
- Top banner appears: "Move 'Task Title' • Cancel"
- Column footers transform to "Move here" buttons
- In-column drop-zones appear between cards for precise positioning
- Multiple abort options: Cancel button, backdrop tap, Esc key, back button

**Accessibility Features:**
- ARIA live regions announce mode changes
- Focus management during Move Mode
- Touch targets meet 44-48px minimum size requirements
- High contrast mode available for improved visibility

#### 4.1.5 Snooze Functionality

Tasks can be temporarily hidden with scheduled wake-up times:

**Snooze Options:**
- Preset durations: 1 week, 1 month, 1 quarter
- Custom date selection with date picker
- "Snooze until..." for specific deadlines

**Visual Implementation:**
- Snoozed tasks receive 'backlog' classification automatically
- Styling: opacity 0.65, grayscale(0.3) filter for muted appearance
- Purple indicator badge with clock icon and wake date
- Clickable indicators for direct snooze editing

**Behavior:**
- Tasks automatically unsnooze at 9 AM local time on scheduled date
- Filter toggle: "Show Snoozed Tasks" in bottom toolbar
- Persistent user preference for filter state
- Wake notification system (implementation pending)

#### 4.1.6 Task Actions & Quick Operations

**Actions Menu (⋮):**
- Notes (opens Unified Editor or Quick Notes flip)
- Due Date (custom modal with date picker)
- Duplicate (creates copy at column end)
- Delete (soft delete with toast-based undo)
- Move (enters Mobile Move Mode with enhanced cancel options)
- Share (opens sharing modal for collaboration)
- Toggle Private (privacy flag with visual feedback)
- Snooze (sub-menu with duration options and custom picker)
- Cycle Classification (alternative to status band popover)

**Completion Workflow:**
- Checkbox click triggers multi-effect celebration animation
- 1.5-second sequence: rainbow glow, confetti burst, bouncing checkmark
- Automatic classification change to 'completed'
- Respects "Hide Completed" filter timing

#### 4.1.7 Attachments System

**File Support:**
- Image formats: JPEG, PNG, GIF, WebP
- Document format: PDF  
- Maximum file size: 5MB per file
- Storage quota: Configurable per user tier

**Upload Methods:**
- File picker dialog ("Browse Files...")
- Drag-and-drop to attachment modal
- Paste from clipboard (images)

**Quota Management:**
- Real-time storage usage indicator
- Automatic oldest-file deletion when quota exceeded
- User confirmation before automatic deletions
- "Manage Attachments" modal for manual file management

**Viewing Experience:**
- Images: In-app modal viewer with natural sizing
- PDFs: Opens in new browser tab for full functionality
- Gallery view with file metadata and deletion options

#### 4.1.8 Privacy & Filtering

**Privacy Implementation:**
- Per-task and per-column privacy toggles
- Visual indicator: diagonal line pattern for private items
- Privacy flag enforcement: private items cannot be shared
- Filter persistence across sessions

**Filter System:**
- Bottom toolbar with filter menu
- "Show Completed" toggle with persistence
- "Show Private Items" toggle with visual feedback
- "Show Snoozed Tasks" toggle with state management
- Future: "Show Shared Items" and "Show Only My Items"

---

### 4.2 Unified Note Editor

The Unified Note Editor provides a full-featured writing environment accessible from any task's note field, with support for both quick edits and extended writing sessions.

#### 4.2.1 Editor Interface

**Modal Structure:**
- Header: Context title, export/print/save buttons
- Toolbar: Format tools, find & replace, search functionality  
- Text Area: Scrollable textarea with line numbers
- Status Bar: Word/character/line counters, last saved timestamp

**Editing Features:**
- Plain text + Markdown support with preview toggle
- Auto-save on pause and explicit save on close
- Font size adjustment (A-/A+) with user preference persistence
- Tab/Shift+Tab for indentation control
- Case conversion tools (UPPER, lower, Title Case)

#### 4.2.2 Quick Notes Integration

For short notes (under 250 characters), tasks feature a "Quick Notes" mode:

**3D Card Flip Animation:**
- Smooth CSS transform-based flip effect
- Front: Standard task card layout
- Back: Simple textarea with Save/Cancel/Expand controls

**Smart Editor Selection:**
- Short notes: Trigger card flip for in-context editing
- Long notes: Open full Unified Editor for extended workspace
- Seamless transition between modes with data preservation

#### 4.2.3 Auto-save & Persistence

**Auto-save Behavior:**
- Debounced auto-save after typing stops (configurable interval)
- Explicit save on close and mode transitions
- Visual feedback for save states and conflicts

**Data Integrity:**
- Optimistic updates with rollback on failure
- Conflict detection for multi-device editing
- Last-writer-wins resolution with user notification

---

### 4.3 Settings Panel & Global Preferences

The Settings Panel provides access to application-wide preferences and user account management.

#### 4.3.1 Display Settings

**Theme Management:**
- Light Mode toggle (default: dark theme)
- High-Contrast Mode toggle (mutually exclusive with Light Mode)
- Font scaling options for accessibility
- Color-blind friendly patterns and indicators

**UI Preferences:**
- Filter state persistence (completed, private, snoozed items)
- Editor font size with cross-device synchronization
- Animation preferences and reduced motion support

#### 4.3.2 Account Management

**Security Settings:**
- Change Password modal with validation
- Security Questions setup for password recovery
- Session management and device logout
- Two-factor authentication (future)

**Data Management:**
- Storage usage overview with quota indicators
- Import/Export functionality for data portability
- Account deletion with data retention policies

---

### 4.4 Collaboration & Sharing (Foundation)

The sharing system enables controlled collaboration while maintaining the zero-knowledge encryption model for private content.

#### 4.4.1 Sharing Model

**Privacy Boundary:**
- Only non-private items can be shared
- Clear user education about encryption trade-offs
- Visual indicators for shared vs. private content

**Permission Levels:**
- View: Read-only access to shared items
- Edit: Full modification rights except sharing/privacy changes
- Owner retains ultimate control and revocation rights

**Hard Delete Model:**
The sharing system uses direct record deletion rather than status-based soft deletes to eliminate state inconsistencies. When a share is revoked, the `shared_items` record is permanently removed, ensuring clean state management between frontend and backend.

**Virtual Column Approach:**
Recipients see shared tasks in a "Shared with Me" virtual column that appears automatically when shares exist. This column is generated server-side during the `getAll` response and provides clear separation between owned and shared content.

**Permission Enforcement (Pending):**
- `view` permission: Read-only access to task content, no modification capabilities
- `edit` permission: Full modification rights except ownership actions (delete, share, privacy)
- Owner retains exclusive rights: delete, duplicate, share management, privacy settings

**Zero-Knowledge Boundary:**
Shared tasks use server-side encryption to enable collaboration, representing a documented trade-off from pure zero-knowledge architecture. Private tasks cannot be shared, maintaining the encryption boundary for sensitive content.

#### 4.4.2 Sharing Workflow

**Share Management:**
- Share modal with recipient selection
- Email or username-based user identification  
- Permission assignment and modification
- Current access list with individual revocation

**Recipient Experience:**
- Shared items appear in dedicated "Shared with Me" column
- Distinct visual styling with owner attribution
- Edit capabilities based on assigned permissions
- "Ready for Review" status for workflow completion

---

### 4.5 Future Views (Deferred)

While current development focuses exclusively on Tasks, the architecture supports planned expansion:

#### 4.5.1 Journal View (Future)
- Chronological daily layout with 1-day, 3-day, 5-day modes
- Entry cards with timeline navigation
- Integration with task attachments and due dates

#### 4.5.2 Outlines View (Future)  
- Hierarchical tree structure for idea organization
- Expand/collapse functionality with infinite nesting
- Linking integration with tasks and journal entries

#### 4.5.3 Events View (Future)
- Multi-day event planning with timeline visualization
- Segment management with participant tracking
- Resource allocation and location management

---

## 5. Technical Specification

### 5.1 System Architecture

MyDayHub follows a modern LAMP stack architecture optimized for security, performance, and maintainability.

#### 5.1.1 Technology Stack

**Backend:**
- PHP 8.2+ with modern language features
- MySQL 8.0+ with JSON column support
- Apache 2.4+ with mod_rewrite
- Composer for dependency management

**Frontend:**
- Vanilla JavaScript ES6+ for maximum performance
- CSS Grid and Flexbox for responsive layouts
- Progressive Web App capabilities via Service Worker
- No framework dependencies for minimal overhead

**Security:**
- CSRF protection on all mutating operations
- Session-based authentication with secure tokens
- Input validation and output encoding
- SQL injection prevention via prepared statements

### 5.2 API Gateway & Architecture

#### 5.2.1 Single Gateway Pattern

All API requests flow through `/api/api.php`, providing:
- Centralized CSRF validation for security
- Consistent error handling and logging
- Request routing to appropriate handlers
- Debug response formatting when DEVMODE=true

**Request Format:**
```json
{
  "module": "tasks",
  "action": "createTask",
  "data": {
	"column_id": 123,
	"title": "New task title"
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "data": { /* response payload */ },
  "debug": [ /* debug messages when DEVMODE=true */ ]
}
```

#### 5.2.2 Module Handlers

**Authentication (`/api/auth.php`):**
- User registration with password hashing
- Login with session creation
- Password reset via secure email tokens
- Logout with session cleanup

**Task Management (`/api/tasks.php`):**
- Complete CRUD operations for tasks and columns
- Drag-and-drop position management
- Classification and privacy controls
- Attachment upload and management

**User Preferences (`/api/users.php`):**
- Settings persistence in JSON format
- Cross-device preference synchronization
- Account management operations

### 5.3 Database Schema

#### 5.3.1 User Management

**users table:**
```sql
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  preferences JSON DEFAULT '{}',
  created_at DATETIME DEFAULT UTC_TIMESTAMP,
  storage_used_bytes BIGINT DEFAULT 0
);
```

**password_resets table:**
```sql
CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT UTC_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

#### 5.3.2 Task Management

**columns table:**
```sql
CREATE TABLE columns (
  column_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  position INT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT UTC_TIMESTAMP,
  updated_at DATETIME DEFAULT UTC_TIMESTAMP ON UPDATE UTC_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**tasks table:**
```sql
CREATE TABLE tasks (
  task_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  column_id INT NOT NULL,
  encrypted_data JSON NOT NULL, -- Contains title, notes in encrypted format
  position INT NOT NULL,
  classification ENUM('signal', 'support', 'backlog', 'completed') DEFAULT 'support',
  is_private BOOLEAN DEFAULT FALSE,
  due_date DATE NULL,
  snoozed_until DATETIME NULL,
  snoozed_at DATETIME NULL,
  created_at DATETIME DEFAULT UTC_TIMESTAMP,
  updated_at DATETIME DEFAULT UTC_TIMESTAMP ON UPDATE UTC_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (column_id) REFERENCES columns(column_id) ON DELETE CASCADE
);
```

#### 5.3.3 File Attachments

**task_attachments table:**
```sql
CREATE TABLE task_attachments (
  attachment_id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  filename_on_server VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  filesize_bytes INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT UTC_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

#### 5.3.4 Collaboration (Foundation)

**shared_items table:**
```sql
CREATE TABLE shared_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  recipient_id INT NOT NULL,
  item_type ENUM('task', 'column') NOT NULL DEFAULT 'task',
  item_id INT NOT NULL,
  permission ENUM('edit', 'view') NOT NULL DEFAULT 'edit',
  status ENUM('active', 'ready_for_review', 'revoked') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT UTC_TIMESTAMP,
  updated_at DATETIME DEFAULT UTC_TIMESTAMP ON UPDATE UTC_TIMESTAMP,
  UNIQUE KEY ux_share (owner_id, recipient_id, item_type, item_id),
  INDEX ix_recipient (recipient_id),
  INDEX ix_owner (owner_id)
);
```

**sharing_activity table:**
```sql
CREATE TABLE sharing_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shared_item_id INT NOT NULL,
  actor_user_id INT NOT NULL,
  action ENUM('created', 'updated', 'revoked', 'marked_ready') NOT NULL,
  payload JSON NULL,
  created_at DATETIME DEFAULT UTC_TIMESTAMP,
  INDEX ix_shared_item (shared_item_id)
);
```

### 5.4 Frontend Architecture

#### 5.4.1 Module Structure

**Core Application (`/uix/app.js`):**
- Global utilities and state management
- Toast notification system  
- CSRF token management
- API communication via `window.apiFetch`

**Task Management (`/uix/tasks.js`):**
- Board rendering and interaction logic
- Drag-and-drop implementation  
- Task CRUD operations
- Mobile Move Mode functionality

**Unified Editor (`/uix/editor.js`):**
- Full-featured text editing
- Auto-save functionality
- Font size preference management
- Modal lifecycle management

**Authentication (`/uix/auth.js`):**
- Login/registration form handling
- Password reset workflow
- Session management

#### 5.4.2 CSS Architecture

**Base Styles (`/uix/style.css`):**
- CSS custom properties for theming
- Responsive grid and flexbox utilities
- Animation and transition definitions
- Accessibility support (high contrast, reduced motion)

**View-Specific Styles:**
- `/uix/tasks.css` - Task board and card styling
- `/uix/editor.css` - Unified Editor interface  
- `/uix/attachments.css` - File management UI
- `/uix/settings.css` - Settings panel styling

#### 5.4.3 Progressive Web App Features

**Service Worker Implementation:**
- Application shell caching for offline access
- Background sync for offline operations
- Push notification support
- Update management and cache versioning

**IndexedDB Integration:**
- Local data mirroring for offline work
- Conflict resolution for multi-device editing
- Write queue for offline operations
- Sync status management

### 5.5 Security Model & Privacy Architecture

#### 5.5.1 Zero-Knowledge Encryption

**Encryption Boundary:**
All cryptographic operations handled by `/uix/crypto.js` module with clear separation between encrypted and plaintext data flows.

**Key Management:**
- Master Key derived on-device using Argon2id from passphrase + salt
- Per-item Data Encryption Keys (DEKs) for granular access control
- DEKs encrypted with user's Master Key before storage
- Server never sees plaintext data or Master Key

**Recovery System:**
- User-generated security questions during setup
- Question answers hash to derive Recovery Key using PBKDF2
- Recovery Key encrypts a copy of the Master Key (Recovery Envelope)
- Password reset requires answering questions to decrypt Master Key copy

#### 5.5.2 Sharing & Collaboration Security

**Privacy Boundaries:**
- Only non-private items can be shared (clear user control)
- Shared items use server-side encryption (documented trade-off)
- Private items remain zero-knowledge encrypted
- Future: Asymmetric key exchange for end-to-end sharing

**Permission Enforcement:**
- Server-side ownership validation on all operations
- CSRF protection on all mutating requests
- Session-based authentication with secure tokens
- Audit trail for all sharing activities

### 5.6 Password Reset & Recovery

#### 5.6.1 Standard Password Reset (Current)

**Implementation:**
- Email-based reset with secure tokens
- SHA-256 hashed tokens with 1-hour expiration
- Single-use tokens prevent replay attacks
- PHPMailer with SMTP for reliable delivery

**Security Considerations:**
- Tokens stored as hashes, never plaintext
- Automatic cleanup of expired tokens
- Rate limiting to prevent abuse
- Secure token generation using cryptographically secure random bytes

#### 5.6.2 Zero-Knowledge Password Reset (Future)

**Challenge:**
Traditional password resets incompatible with zero-knowledge encryption without recovery mechanism.

**Solution:**
- Security questions for recovery key derivation
- Recovery envelope containing encrypted Master Key copy
- User education about trade-offs between security and recoverability
- Clear warnings about data loss if both password and recovery answers are lost

### 5.7 Development & Debugging Infrastructure

#### 5.7.1 Debug System

**Server-Side Debugging:**
- Global debug message collection in `/incs/config.php`
- Automatic debug array inclusion when DEVMODE=true
- File logging fallback to `/debug.log`
- Comprehensive error tracing with context

**Client-Side Integration:**
- Automatic server debug message extraction
- Browser console logging with consistent formatting
- Error correlation between client and server
- Performance monitoring and optimization insights

#### 5.7.2 API Testing

**Automated Testing:**
- CURL command validation for all endpoints
- Authentication flow testing
- CRUD operation verification
- File upload and quota testing

**Manual Testing:**
- Cross-browser compatibility validation
- Mobile responsiveness testing
- Performance testing under load
- Security penetration testing

### 5.8 Environment Configuration

#### 5.8.1 Environment Variables

**Required Configuration (`.env`):**
```
DB_HOST=localhost
DB_NAME=mydayhub
DB_USER=username
DB_PASS=password

SMTP_HOST=smtp.server.com
SMTP_PORT=587
SMTP_USER=email@domain.com
SMTP_PASS=password
SMTP_FROM=noreply@mydayhub.com

APP_URL=https://mydayhub.com
DEV_MODE=false
```

#### 5.8.2 Deployment Environments

**Development:** `localhost` with XAMPP/MAMP
- Full debugging enabled
- File logging active
- SMTP testing via local mail catcher

**Staging:** `breveasy.com` 
- Production-like configuration
- Limited debugging
- Real SMTP for testing

**Production:** `mydayhub.com`
- Debugging disabled
- Performance optimization enabled
- Monitoring and alerting active

### 5.9 Performance & Optimization

#### 5.9.1 Frontend Optimization

**Asset Management:**
- CSS/JS minification for production
- Image optimization and lazy loading
- Font loading optimization
- Critical path CSS prioritization

**JavaScript Performance:**
- Debounced user input handling
- Virtual scrolling for large lists
- Efficient DOM manipulation patterns
- Memory leak prevention

#### 5.9.2 Backend Optimization

**Database Performance:**
- Proper indexing on query patterns
- Query optimization and profiling
- Connection pooling and management
- Caching layer implementation

**API Efficiency:**
- Batch operations where possible
- Pagination for large datasets
- Response compression
- Rate limiting and throttling

---

## 6. Appendices

### 6.1 Glossary

**Application Components:**
- **Task card** = Individual task item in a column
- **Journal entry card** = Daily note item (future feature)
- **Event plan** = Meeting or event container (future feature)
- **Event plan segment** = Time block within an event (future feature)
- **Outlines tree** = Hierarchical structure (future feature)
- **Tree branch** = Section within an outline (future feature)
- **Branch node** = Individual item in outline (future feature)

**Task Classifications:**
- **Signal task** = Directly advances the mission; highest priority work
- **Support task** = Indirectly enables Signal tasks; important but secondary
- **Backlog task** = Important but not time-sensitive; can be deferred
- **Completed task** = Finished item, archived at bottom of column

**Encryption & Security:**
- **Master Key** = User-specific encryption key derived on-device, never transmitted
- **DEK** = Data Encryption Key, unique per item, wrapped with Master Key
- **Recovery Envelope** = Master Key copy encrypted with Recovery Key
- **Recovery Key** = Key derived from security question answers
- **Zero-Knowledge** = Server cannot read user data even if compromised

**User Interface:**
- **Drag-and-Drop** = DnD - Desktop interaction for reordering items
- **Toast Notification** = Non-blocking popup message for feedback
- **Modal Window** = Focused overlay window for specific tasks
- **Move Mode** = Mobile-friendly relocation workflow with visual guides
- **Drag Handle** = The ≡ grip area on task cards for touch DnD initiation
- **Popover** = Small contextual menu (e.g., classification selector)

**System States:**
- **Snoozed Task** = Task with future schedule; visually muted until wake time
- **Private Item** = Content marked private; encrypted and hideable
- **Shared Item** = Content shared with other users with specific permissions

**Environment Types:**
- **hostinger hosted environment** = web-env (production hosting)
- **local hosted environment** = loc-env (development setup)

### 6.2 Wireframe Mockups

#### 6.2.1 Tasks View (Primary Interface)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│[≡] ☕️ MyDayHub [Tasks] [Journal] [Outlines] [Events]      [+ New Column]  │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ Column A ▹ … > │ │ < Column B ▶ … > │ │ < Column C ► … │
│─────────────────│ │──────────────────│ │─────────────────│
│☐ Monday         │ │☐ Blue            │ │☐ Black          │
│☐ Tuesday        │ │☐ White           │ │☐ Red            │
│☐ Wednesday      │ │                  │ │☐ Wash car       │
│☐ Friday         │ │                  │ │☐ Mow lawn       │
│☑ Thursday       │ │                  │ │☐ Water plant    │
│                 │ │                  │ │☐ Garbage out    │
│─────────────────│ │──────────────────│ │─────────────────│
│ + New Task      │ │ + New Task       │ │ + New Task      │
└─────────────────┘ └──────────────────┘ └─────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│ 19.Aug.25, Tuesday                [FILTERS]                        [alfa] │
└─────────────────────────────────────────────────────────────────────────────┘
```

*Visual Elements:*
- Colored status bands on left edge of each task card
- Privacy indicators (diagonal lines for private items)
- Attachment and due date icons in task footer
- Drag handles (≡) visible on hover/mobile

#### 6.2.2 Mobile Layout (Responsive)

```
┌─────────────────────┐
│ [≡] MyDayHub   [⚙] │
├─────────────────────┤
│ Column A        [⋮] │
│─────────────────────│
│ ☐ Monday            │
│ ☐ Tuesday           │
│ ☑ Thursday          │
│─────────────────────│
│ + New Task          │
├─────────────────────┤
│ Column B        [⋮] │
│─────────────────────│
│ ☐ Blue              │
│ ☐ White             │
│─────────────────────│
│ + New Task          │
├─────────────────────┤
│ [FILTERS] [username]│
└─────────────────────┘
```

*Mobile Adaptations:*
- Vertical column stacking
- Touch-friendly targets (44px minimum)
- Hamburger menu for navigation
- Bottom toolbar for filters and user info

#### 6.2.3 Task Actions Menu

```
┌─────────────────────┐
│ ☐ Task Title    [⋮] │ ← Click ⋮ opens menu
│─────────────────────│
│     [📝] Notes      │
│     [📅] Due Date   │
│     [📎] Share      │
│     [👁] Private    │
│     [⏰] Snooze     │
│     [📋] Duplicate  │
│     [🗑] Delete     │
└─────────────────────┘
```

#### 6.2.4 Unified Editor (Modal)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Editing a task's note                                            [□] [×]  │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Format] [Find & Replace] [Search] [Add Task]                           … │
│ [AA] [Aa] [aa] [[]] 🔢  [A-] [A+]                                         │
│─────────────────────────────────────────────────────────────────────────────│
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
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│ Words: 231  Chars: 1664  Lines: 12                      Last saved: Never │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.2.5 Quick Notes (Card Flip)

```
Front Side:                    Back Side (Flipped):
┌─────────────────────┐       ┌─────────────────────┐
│ ☐ Task Title    [⋮] │  →    │ Quick Note:         │
│ 📝 🗓️ 📎 👁          │       │ ┌─────────────────┐ │
│─────────────────────│       │ │                 │ │
│ [Signal] [Support]  │       │ │ Type here...    │ │
└─────────────────────┘       │ │                 │ │
							  │ └─────────────────┘ │
							  │ [Save] [Cancel]     │
							  │      [Expand]       │
							  └─────────────────────┘
```

### 6.3 Application Icons & Visual System

#### 6.3.1 Icon Standards

**Format:** SVG with `currentColor` for theme consistency
**Size:** 16x16px base, scalable to 24x24px for touch targets
**Style:** Minimal, consistent stroke width, rounded corners where appropriate

**Core Icons:**
- 📝 Notes (edit/document symbol)
- 📅 Due Date (calendar symbol)  
- 📎 Attachments (paperclip symbol)
- 👁 Privacy (eye symbol with strikethrough for private)
- 🔄 Share (interconnected nodes)
- ⏰ Snooze (clock with Z symbol)
- ⋮ Actions (vertical ellipsis)
- ≡ Drag Handle (hamburger icon rotated)

**Status Indicators:**
- ✓ Completed (checkmark in circle)
- ▶ Signal (right-pointing triangle, green)
- ◆ Support (diamond, blue with stripes for accessibility)
- ⬣ Backlog (hexagon, orange)
- 🔒 Private (lock symbol)
- 👥 Shared (people symbol)

### 6.4 Color System & Theming

#### 6.4.1 Primary Palette

**Accent Color:** `#3B82F6` (Blue 500)
- Primary interactive elements
- Focus rings and selection states
- Link colors and call-to-action buttons

**Classification Colors:**
- **Signal:** `#10B981` (Green 500) - High priority, mission-critical
- **Support:** `#3B82F6` (Blue 500) - Important, enables Signal tasks  
- **Backlog:** `#F59E0B` (Orange 500) - Deferred, not time-sensitive
- **Completed:** `#6B7280` (Gray 500) - Archived, finished work

#### 6.4.2 Dark Theme (Primary)

**Background Hierarchy:**
- App Background: `#0F172A` (Slate 900)
- Card Background: `#1E293B` (Slate 800)  
- Interactive Background: `#334155` (Slate 700)
- Border Color: `#475569` (Slate 600)

**Text Hierarchy:**
- Primary Text: `#F8FAFC` (Slate 50)
- Secondary Text: `#CBD5E1` (Slate 300)
- Muted Text: `#94A3B8` (Slate 400)

#### 6.4.3 Light Theme (Optional)

**Background Hierarchy:**
- App Background: `#FFFFFF` (White)
- Card Background: `#F8FAFC` (Slate 50)
- Interactive Background: `#F1F5F9` (Slate 100)
- Border Color: `#E2E8F0` (Slate 200)

**Text Hierarchy:**
- Primary Text: `#0F172A` (Slate 900)
- Secondary Text: `#475569` (Slate 600)
- Muted Text: `#64748B` (Slate 500)

#### 6.4.4 High Contrast Mode

Enhanced contrast ratios for accessibility compliance:
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text and UI components
- Enhanced border contrast for better element definition
- Alternative visual patterns for color-dependent information

### 6.5 File Organization

#### 6.5.1 Project Structure

```
mydayhub-app/
├── index.php                  # Main application entry point
├── .env                       # Environment configuration (not in git)
├── .gitignore                 # Git exclusion rules
├── debug.log                  # Development debugging output
├── .htaccess                  # Apache URL rewriting rules
├── composer.json              # PHP dependency management
├── composer.lock              # Locked dependency versions
├── vendor/                    # Composer dependencies (not in git)
│
├── api/                       # Backend API gateway and handlers
│   ├── api.php               # Main API gateway with routing
│   ├── auth.php              # Authentication endpoints
│   ├── tasks.php             # Task management endpoints
│   └── users.php             # User preference endpoints
│
├── uix/                       # Frontend user interface
│   ├── app.js                # Global utilities and state management
│   ├── auth.js               # Authentication form handling
│   ├── editor.js             # Unified Editor functionality
│   ├── tasks.js              # Task board interaction logic
│   ├── style.css             # Global styles and theme variables
│   ├── tasks.css             # Task-specific styling
│   ├── editor.css            # Editor interface styling
│   ├── attachments.css       # File management styling
│   └── settings.css          # Settings panel styling
│
├── media/                     # Static assets and uploads
│   ├── imgs/                 # User-uploaded attachments (organized by user)
│   └── icons/                # Application icons and graphics
│
├── incs/                      # Backend includes and utilities
│   ├── config.php            # Application configuration
│   ├── db.php                # Database connection management
│   ├── mailer.php            # Email sending utilities
│   └── meta/                 # Documentation and specifications
│       ├── spec.md           # This specification document
│       ├── done.md           # Development progress log
│       └── dialogs.md        # Design decision discussions
│
└── login/                     # Authentication pages
	├── login.php             # User login form
	├── register.php          # User registration form
	├── logout.php            # Session termination
	├── forgot-password.php   # Password reset request
	└── reset-password.php    # Password reset completion
```

### 6.6 Development Workflow & Testing

#### 6.6.1 Development Process

**Code Standards:**
- PHP 8.2+ features and type declarations
- ESLint configuration for JavaScript consistency
- CSS naming conventions (BEM methodology)
- Comprehensive inline documentation

**Version Control:**
- Git with atomic commits (≤120 words)
- Descriptive commit messages with scope/files explicit
- Feature branches for major changes
- Pull request reviews for quality assurance

**Testing Strategy:**
- Unit tests for critical business logic
- Integration tests for API endpoints
- Manual testing checklist for UI interactions
- Cross-browser compatibility validation

#### 6.6.2 Debugging & Observability

**Development Mode Features:**
- `DEVMODE=true` enables comprehensive logging
- Debug message collection in global array
- Browser console integration for server messages
- File logging fallback to `/debug.log`

**Production Monitoring:**
- Error tracking and alerting
- Performance monitoring and optimization
- User analytics for feature usage
- Security audit logging

#### 6.6.3 API Testing Patterns

**CURL Testing Examples:**
```bash
# Test user registration
curl -X POST http://localhost/api/api.php \
  -H "Content-Type: application/json" \
  -d '{"module":"auth","action":"register","data":{"username":"test","email":"test@example.com","password":"password123"}}'

# Test task creation with CSRF
curl -X POST http://localhost/api/api.php \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-token-here" \
  -d '{"module":"tasks","action":"createTask","data":{"column_id":1,"title":"Test Task"}}'
```

### 6.7 Deployment & Environment Management

#### 6.7.1 Environment Configuration

**Local Development:**
- XAMPP/MAMP for rapid iteration
- File-based debugging enabled
- Hot reload for frontend changes
- Full error reporting active

**Staging Environment:**
- Production-like configuration
- Limited debugging for security
- Real email delivery testing
- Performance profiling enabled

**Production Deployment:**
- Optimized asset delivery
- Comprehensive monitoring
- Automated backup systems
- Zero-downtime deployment process

#### 6.7.2 Performance Benchmarks

**Target Performance:**
- Initial page load: <2 seconds
- Task operations: <200ms response time
- File uploads: <5 seconds for 5MB files
- Drag operations: 60fps smooth animation

**Scalability Targets:**
- 1000+ tasks per user without performance degradation
- 100+ concurrent users per server
- 99.9% uptime with load balancing
- Automatic scaling based on demand

---

## Conclusion

MyDayHub represents a comprehensive approach to privacy-focused productivity software, balancing the complexity of zero-knowledge encryption with the simplicity users expect from modern applications. The specification outlined above provides a roadmap for building not just a task management tool, but a foundation for the future of private, collaborative software.

The focus on the Tasks View as the primary interface allows for deep optimization and polish in a single domain, while the underlying architecture remains flexible enough to support the planned expansion into Journal, Outlines, and Events views. This focused approach ensures that users receive immediate value while establishing patterns and infrastructure that will scale elegantly.

The technical architecture prioritizes security, performance, and maintainability, with clear separation of concerns between client-side encryption and server-side collaboration features. The hybrid approach to privacy—where users control what content is encrypted versus what can be shared—provides a practical balance between absolute privacy and team collaboration needs.

As development continues, this specification will evolve to reflect lessons learned, user feedback, and emerging best practices in privacy-focused application development. The goal remains constant: to create software that empowers users to focus on what matters while maintaining absolute control over their private information.

---

*This document serves as the definitive specification for MyDayHub development. All implementation decisions should reference this document, and any deviations or additions should be documented through updates to maintain accuracy and team alignment.*