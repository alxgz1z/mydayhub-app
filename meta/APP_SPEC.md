MYDAYHUB — APPLICATION SPECIFICATION (V4.7.0)

Audience: Internal Development & PM Use Only
## Environments

• Prod (v3): Isolated; no shared users/DB/files
• Dev (v4): Localhost (127.0.0.1), Apache+PHP 8, MySQL, XAMPP

## Status Legend

[DONE] Feature complete, matches spec intent
[WIP] Under construction, present but evolving
[FIX] Implemented, needs refactoring/bugfixes
[PLAN] Scheduled for future milestone
[IDEA] Proposed, not yet scheduled**

## ExecutiveSummary

• MyDayHub v4 is a ground-up reinvention, guided by lessons from v3. We strive for a cleaner codebase, smarter interactions, robust privacy, and features for modern teams.

• The vision: a productivity tool for tasks, journaling, planning, and sharing, usable by all skill levels, direct yet flexible.

• This spec is a living resource for contributors, testers, and future "Alex”.

## App Description And Philosophy

• MyDayHub is focused on instant feedback, direct manipulation, minimal dialog popups, and safety for all edge cases.
	• Responsive layouts and gesture support for mobile and desktop.
	• Modular features for agile development and future pivots.

• Core Product Goals:
	• Minimal ceremony, fast entry, and context switching.
	• Fluid UX: inline edits, drag/drop, app like flow without reloads.
	• Dark-first UI for comfort and accessibility with light mode as a choice.
	• Security-first: CSRF, ownership, strong session handling, planned privacy switches, zero knowledge.
	• Growable foundation: easily extendable for sharing, analytics, quotas, journaling.

## Narrative High Level Requirements

[DONE] *Modular visibility and dynamic UI*
	• Fast toggling of task board, journal, outlines, meeting, preserving context.
	• Column drag/drop supports intuitive workflow management.

[WIP] *Privacy switch on every item*
	• Each task, journal, outline, or meeting has per-item privacy toggle.

[WIP] *Multi-user authentication/session management*
• Hybrid session: last login has write control. Change notifications.
• Sessions are isolated—no overwrite by concurrent writers.

[DONE] *Fluid, reload-free UI*
	• Optimistic UI: all actions animate visibly and rollback if errors.
	• Hover, drag, and completion animations (“gold flare” for check-off), live counts.

[WIP] *Responsive, mobile-first design*
	• Touch gestures and pull-to-create actions.

[WIP] *Unified Editor*
	• Opens from 'Edit' on Task.
	• [PLAN] Edit titles, notes, due dates, direct new task creation.

[PLAN] *Quotas and usage plans—tiered item/sharing limits and upgrade prompts*

[WIP] *Telemetry and analytics—track CRUD, navigation, sharing for future improvements*

[PLAN] *Import/export (JSON) for migration, backup, test*

[PLAN] *Notification support—desktop/mobile alerts, meeting reminders, mail-to-task/journal entry via unique user tokens*

[PLAN] *Offline support—Service Worker queue, auto-sync*

[PLAN] *Meeting agenda view—multi-segment planning, drag/drop, status, outlining*

## User Stories And Use Cases

**As a user, I want to mark any item as private so I can hide sensitive data instantly**

**As a power user, I want to see usage quotas to optimize my plan**

**As a team member, I want to update notes on shared tasks, acknowledge status, and avoid accidental loss**

**As a user, I want to prevent multiple sessions overwriting my changes.**

**As a user, I want offline support for adding and moving tasks, with sync on reconnect**

**As a leader, I want to organize meetings, delegate, and outline next steps**

## Feature Deep Dives And UX Commentary

*TasksView (Kanban Board)*

**Columns**
	[DONE] User-created with persistent zero-based DB positions.
	[DONE] Editable header, live count, quick actions, inline rename.
	[DONE] Drag/drop within and across columns; instant client sort, server compaction.
	[DONE] Deletion cascades; positions recompact.
	[PLAN] Drag columns to reorder board.
	[DONE] Task footer for adding new tasks, “Move here” support.

**TaskCards**
	[DONE] Inline title edit, duplicate, move, delete, priority/complete.
	[DONE] Status bands for completion/urgency.
	[PLAN] Due date badges, delegation (@user), filters.
	[DONE] Optimistic UI and error rollback.

**Sorting And Persistence**
[DONE] Non-completed float below completed.
[DONE] Above before normal.
[DONE] Manual drag order persists; duplicates appended.
[DONE] Delete/complete instantly compacts.
[DONE] Hover/check-off: gold flare, shadow lift, live counts.

**Journal View And EntryCards**
[PLAN] Each day = column; arrow/swipe for navigation.
[PLAN] Weekend accent, central focus for today.
[PLAN] Footer for rapid entry creation; lift-on-hover animation.
[PLAN] Rich editing—notes, sharing, duplication, delete.
[PLAN] Drag/drop between columns.

**Unified Editor (Notes, Titles, Dates)**
[WIP] Invoked from Tasks for current editing.
[PLAN] Format bar: helpers, search, print/export, ESC to close.
[PLAN] Task creation direct from Editor.

**Toolbar And Controls**

[DONE] "+ New Column" in header/mobile.
[WIP] Filters for completed, priority, delegated.
[PLAN] Sharing for columns/journal/meeting segments.
[PLAN] Toggle date range, create daily summary.

**Security Model And Privacy**
[DONE] CSRF protection: session/meta injection; rejects unsafe requests.
[DONE] Ownership checks; all mutations filtered at server per user.
[PLAN] Real multi-user sessions, renewal, token-based.
[PLAN] Per-item privacy flag, zero-knowledge encryption parity.
	• Rationale: Data security and privacy toggles built to prevent cross-user leaks.
	• Universally necessary for individual/team productivity.

## Technical Architecture

**Database Schema V4 Core**

• users
	user_id INT PK (future fields for auth/plans)

• columns
	column_id INT PK
	user_id INT NOT NULL
	column_name VARCHAR(64) NOT NULL
	position INT NOT NULL
	created_at, updated_at DATETIME NULL

• tasks
	task_id INT PK
	user_id, column_id INT NOT NULL
	encrypted_data TEXT NOT NULL
	position INT NOT NULL
	status ENUM('normal','priority','completed') NOT NULL
	created_at, updated_at DATETIME NULL

**Future Schema Extensions**

• tasks.encrypted_data: "notes", "dueDate"
• tasks.delegated_to: INT FK
• tasks.is_private: BOOL privacy switch
• task_shares: (task_id, owner_id, shared_with_user_id, permissions, shared_at)
• column_shares: (column_id, owner_id, shared_with_user_id, permissions, shared_at)
• Usage logs, plan tiers, analytics tables [PLAN]
• Compaction: Position indices recompact on any task/column change, for fast UI/DB.

## API Gateway And Contracts

• Endpoint: /api/api.php
• Requests: POST JSON {module, action, data}
•  Response: {"status": "...", "data": ...} or {"status": "error", "message": ...}
• All mutations require CSRF token.
• Current Endpoints:
	• getAll [DONE]
	• createTask [DONE]
	• moveTask [DONE]
	• reorderColumn [DONE]
	• toggleComplete [DONE]
	• togglePriority [DONE]
	• deleteTask [DONE]
	• duplicateTask [DONE]
	• renameTaskTitle [DONE]
	• createColumn [DONE]
	• deleteColumn [DONE]
	• renameColumn [DONE]
	• reorderColumns [PLAN]
	• HTTP codes: 200, 201, 400, 403, 404, etc.

## Front end Architecture

• assets/js/app.js: bootstrap, tab/view switch, modal helpers, DEVMODE banner.
• assets/js/tasks.js: board render, column/task creation, drag/drop, sort, editors, rollback.
• assets/css/style.css: global responsive layout.
• assets/css/views/tasks.css, /editor.css: feature-specific styling.

Mobile UX

[DONE] Columns stack vertically at ≤768px width; mobile supports all features.
[DONE] Footer spacers for iOS Safari overlays.
[FIX] Optimize scroll, button hits [pending QA].
[PLAN] Pull-to-create for mobile.

## Versioning And Workflow

• Spec version: v4.7.0 (merged).
• Minor: new features.
• Patch: docs or refactors.
• Source files tagged.
• Git: commits ≤100 words, scope/files explicit.
• Tags: v4.7.x-dev for merged feature sets.

## Debug And Testing Patterns

• Set /includes/config.php DEVMODE=true for debug.log.
• Test API via curl/REST with CSRF.
• Dev test accounts: alfa, delta, omega.


## Roadmap

*NearTerm:*

• Column drag/reorder with reorderColumns.
• Toast/undo for error/deletes.
• Extending encrypted_data, unified editor logic.
• Multi-user auth migration.
• Journal parity with v3.

*Mid Term And Future:*

• Per-item privacy toggle, sharing logic.
• Quota/plan usage, upgrades.
• Analytics/telemetry logs.
• Offline support/sync.
• Meeting segment enhancements.

## Glossary

• Task card = task
• Journal entry card = entry
• Journal entry note = note
• Meeting plan = plan
• Meeting plan segment = segment
• Outlines tree = tree
• Tree branch = branch
• Branch node = node

// End of APP_SPEC v4.7.0 //