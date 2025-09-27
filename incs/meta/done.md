# 2025-08-04 — Environment & Mobile UX
Stabilized local development and improved mobile experience. Fixed server and CSS issues, created mobile-responsive header/menu, unified modal, columns now stack vertically on mobile. Implemented Move Mode for touch.

---

# 2025-08-04 — Unified Note Editor Foundation
Replaced simple modal with reusable Unified Editor. New shell in HTML, CSS, JS modules added for open/close, maximize. Editor decoupled from tasks logic.

---

# 2025-08-08 — Task Card Icons (SVG)
Replaced emoji icons with clean SVG set styled by currentColor, consolidated menu CSS, finalized icon appearance and theme tuning.

---

# 2025-08-08 — Unified Editor Polish
Enhanced header/status bar, maximize/restore logic, monospace textarea, simplified ribbon, added formatting tools and live metrics. Ready for backend integration.

---

# 2025-08-08 — Backend Architecture
Developed v4 schema with user JSON prefs and ENUM task statuses. Single-pipe API gateway and backend handler modules live; DB and gateway staged, frontend still using local data.

---

# 2025-08-08 — Backend Debugging & Logging
Switched frontend to live API, replaced local data, added custom error handler and logging. Fixed permissions, verified DB connectivity, ready for UI debugging.

---

# 2025-08-10 — Tasks: Persistence & UX Stability
Enabled createTask persistence, normalized payloads, counter and sorting improvements, blur/submit race fixed, enhanced post-drag logic. 
*
**Next:*** persist completion, priority, improved reordering, and error UX.

---

# 2025-08-10 — Session Summary & 
**Next:** Steps
Full board flow stabilized for load, create, move. Mutations and sorting documented, 
**Next:** tasks include completion/priority wiring, column reordering, error UX, CSRF/session support.

---

# 2025-08-15 — Inline Editing & Persistence Pass
Brought inline editing to columns/tasks; priority, complete, and order now persist instantly with optimistic UI and rollback, plus editor double-commit guard.

---

# 2025-08-20 — Rollback & Stabilization
Reverted failed journal scaffold to restore board stability. Confirmed API and feature integrity; incremental journal view planned.

---

# 2025-08-30 — Beta 5 Foundation & Authentication
Built core session-based authentication (registration/login). Protected board shell via session, backend and API handlers ready for task data.

---

# 2025-08-31 — Tasks View: Core Interactivity
Created column/task UI, backend persistence for create, complete, drag/drop. Mobile layout, DnD foundations established.

---

# 2025-08-31 — Environment Configuration & Stability
Fixed 500 error in production, refactored credential management to use .env, loaded via Composer. Dynamic URL, file cleanup for universal deployment.

---

# 2025-09-01 — Task & Column Management Overhaul
Implemented Signal/Support/Noise classification stack, robust sorting, contextual actions for tasks and columns, inline editing. Board stable; ready for actions menu and enhancements.

---

# 2025-09-01 — UI Polish, Task Duplication, Toast Notifications
Header branding, complete duplicate feature, built reusable toast system. Replaced alerts with non-blocking notifications. UI visually polished.

---

# 2025-09-01 — Unified Editor & UI Polish
Replaced confirm dialogs with custom modal. Integrated persistent task note editor; font size, indentation controls, versioning, and bug fixes for improved UX.

---

# 2025-09-02 — Editor Enhancements, Due Dates
Added autosave, font size preferences, full-stack task Due Dates, and standardized UTC. Major UI bugs resolved.

---

# 2025-09-03 — App Version & Dev Mode Indicator
Footer now shows app version, dev-mode indicator, dynamic date formatting; removed fallback credentials for security.

---

# 2025-09-03 — Bottom Toolbar & Persistent Filters
Created toolbar, persistent "Show Completed" filter, state saved to user profile. Mobile-first filter controls.

---

# 2025-09-04 — Task Attachments Foundation
Built DB table for attachments, API for upload/retrieval, frontend gallery modal. Debugged frontend CSS/JS and stabilized attachment UI.

---

# 2025-09-05 — Task Attachments Stabilization
Diagnosed critical 500 error (missing created_at); fixed backend/DB. File upload and 
**Next:** steps (delete and paste-to-upload) staged.

---

# 2025-09-05 — Attachment Viewer & PDF Support
Viewer logic: images modal, PDFs open in new tab, keyboard accessibility added, drag/drop double upload fixed. Delete action pending.

---

# 2025-09-06 — Feature Polish: Attachments & Classification
Clarified modal UI, dynamic quota. Replaced Priority with Cycle Classification button. Fixed debounce bugs in modals.

---

# 2025-09-06 — Attachments UI Integrity
Fixed UI freeze after attachment delete, hardened quota bar logic. Attachments feature stable and robust.

---

# 2025-09-07 — Privacy & Filtering System
Added privacy toggles for columns/tasks and persistent filtering. Diagonal style for private items, bug fixes, Settings Panel shell added.

---

# 2025-09-07 — Undo Deletes & Bug Fixes
Implemented soft-delete in DB/backend for columns/tasks with undo feature in toast notifications. Fixed Safari and regression bugs.

---

# 2025-09-07 — Classification Popover & CSRF Foundation
Complete popover selector for classification, global CSRF token logic and secure apiFetch. Refactored mutating API calls.

---

# 2025-09-07 — Security & Major UI Polish
Enabled server-side CSRF validation, deployed Move Mode for mobile, visual accent color, new header, and improved animations.

---

# 2025-09-08 — Quick Notes Card Flip
Introduced quick note editor with 3D card flip. Short notes use flip, longer notes open full editor. Lightweight, integrated API logic.

---

# 2025-09-08 — Bug Fixes: Quick Notes UI & Save Logic
Critical save bug fixed, vertical button stack redesigned, card flip improved for mobile, live note handoff rebuilt.

---

# 2025-09-10 — Forgot Password Flow
PHPMailer adopted, complete password reset DB, API, UI flow built. Debug tools and error reporting set up; backend SMTP bug blocks delivery.

---

# 2025-09-11 — Debugging: Silent Failure in Forgot Password
Verified mailer, isolated bug in API handler. Built inline pipeline for diagnostics.

---

# 2025-09-12 — Critical Bug Fix: Password Reset Email
Fixed JSON corruption due to SMTPDebug, debug system refactored, reset flow tested and functional.

---

# 2025-09-12 — Regression: Task Completion Animation
Celebration confetti broke completion persistence. Feature disabled, bug scheduled for fix.

---

# 2025-09-12 — Critical Regression Fix: Task Completion & Animation
Bug in toggleTaskComplete fixed with restored API path; redesigned celebration animations for task completion. Processing guards added, filters respect animation. Backend flow validated.
**Next:** steps: Column drag-and-drop, Settings Panel improvements, production testing, optimize accessibility.

---

# 2025-09-12 — Column Drag & Drop + Backend Integration Validation
Implemented header drag-and-drop for columns with refined visual feedback. Backend refactored for deployment reliability. Fully tested authentication and data flows for production readiness.
**Next:** steps: Consolidate crypto ops, mobile Move Mode tweaks, sharing setup, performance and accessibility improvements.

---

# 2025-09-13 — Task Snooze Feature Implementation & Refinement
Completed snooze feature: snooze/unsnooze actions, visual indicators (purple), Show Snoozed filter with persistent user pref. UTC fixes, syntax clean-up, and bug resolution.
**Next:** steps: Wake notifications, private/snooze visuals, finish item encryption, Settings Panel, drag-and-drop polish.

---

# 2025-09-14 — Task Sharing Foundation Initialization
Built sharing modals, backend logic with CSRF, debugging surfaced JSON handling errors in MariaDB, improved errors and toasts.
**Next:** steps: Harden error handling, badge workflow, DB data integration, broad testing.

---

# 2025-09-15 — Sharing Feature Foundation (Backend Stabilization)
Improved backend error handling, fixed parameter/schema bugs, raw API debugging, replaced alerts with toasts. Backend sharing record creation OK, API uses 'revoked' audit. Badges pending.
*
**Next:*** Debug, finish badges, data flow, E2E polish.

---

# 2025-09-16 — Task Sharing Foundation Complete
Full-stack sharing: backend handlers, lookup, auto-shared column, robust delete. Improved error logging and status badges.
*
**Next:*** Restrict actions for recipients, mobile, dynamic UI, performance.

---

# 2025-09-17 — Ready-for-Review Workflow (Partial)
Enabled collaborative "Ready for Review": API toggle, menu integration, owner badges, but sync bugs and query gaps remain.
*
**Next:*** Bugfix sync, query, badge/UI cleanup, permissions.

---

# 2025-09-18 — Ready-for-Review Workflow & Notifications
Fixed ready-for-review sync bugs, added owner badge pulse, full data and audit trail, visual polish.
*
**Next:*** History table, menu filter, mobile, crypto, unsnooze notify.

---

# 2025-09-21 — File Management System Implementation
Backend endpoint for user file listing, new modal UI for file sort and quota, accessibility polish in Settings.
*
**Next:*** Trust management, bulk search/export, mobile, analytics, permission system polish.

---

# 2025-09-21 — Authentication System Overhaul & Timeout
Added session timeouts with configurable UI warning/logout, verified password reset/session flows across environments; security hardened. 
*
**Next:*** Multi-session tracking, email verify, login audit, password strength, 2FA foundation.

---

# 2025-09-22 — Email Verification Registration System
Implemented 2-step email verification for user registration to improve UX and security. Replaced registration links with 6-digit verification codes sent via email, eliminating tab-switching issues. Added `pending_registrations` database table with 15-minute expiration, new API endpoints (`sendVerificationCode`, `verifyEmailCode`), and updated frontend to support seamless verification flow with auto-login after email confirmation. Fixed MySQL constraint error for `preferences` field during registration.
**Next:*** Test email delivery across environments, implement cleanup job for expired pending registrations, consider rate limiting for verification attempts.

---

# 2025-09-23 — Admin System Foundation Complete
Implemented comprehensive admin superuser system with subscription management, quota enforcement, and user administration capabilities. Created database schema modifications, admin API endpoints, and dark-themed admin interface with user management dashboard.
**Database Schema Implemented:**
* Added subscription_level, status, suspended_reason, suspended_at, and admin_notes fields to users table
* Created admin_actions audit table with complete action tracking
* Modified admin_actions enum to include 'notes_update' action type
* All schema changes tested and deployed successfully

⠀**Admin API Module Complete:**
* Built /api/admin.php with full CRUD operations for user management
* Implemented getAllUsers, updateUserSubscription, updateUserStatus, deleteUser endpoints
* Added updateAdminNotes functionality for support staff annotations
* Complete audit logging for all admin actions with old/new value tracking
* Admin authentication via ADMIN_EMAILS environment variable

⠀**Admin Interface Delivered:**
* Dark-themed responsive admin dashboard at /admin/index.php
* Three-tab interface: Dashboard, Users, Admin Actions
* User management with search, filtering, subscription controls
* Modal-based workflows for subscription changes, user suspension, notes editing
* Real-time user statistics and system overview
* Mobile-responsive design with proper button alignment

⠀**Security & Configuration:**
* Environment-based admin designation via ADMIN_EMAILS configuration
* Role-based access control with email-based authentication
* Complete audit trail for accountability and compliance
* 30-day grace period policy for suspended users with data export capability

⠀**Subscription Tier Framework:**
* FREE: 10MB, 3 columns, 60 tasks, no sharing
* BASE: 10MB, 5 columns, 200 tasks, sharing enabled
* PRO: 50MB, 10 columns, 500 tasks, full features
* ELITE: 1GB, unlimited columns/tasks, full access

⠀**Next Steps:**
* Integrate quota validation into existing APIs (createTask, createColumn, uploadAttachment)
* Implement quota blocking UI with "Manage Files" modal redirect
* Add admin notes display in user detail modals
* Test admin interface across both localhost and breveasy.com environments
* Consider notification system for quota violations and user status changes

---

# ### 2025-09-25 - Proactive Quota Management & API Consolidation
**Completed Work**
* **Proactive Quota-Aware UI System**: Implemented subscription limit enforcement that prevents failed user actions by disabling interface elements before quota violations occur
  * Added quota status to board data API response with current usage counts and limits per subscription tier
  * Created quota-aware UI functions that replace "New Task" inputs and "New Column" button with friendly blue gradient upgrade messaging when limits reached
  * Implemented immediate quota tracking updates after create/delete operations with undo support
  * Modified task actions menu to hide share options for FREE users, showing upgrade messaging instead
  * Added friendly CSS styling (blue gradients, subtle animations) replacing aggressive red error states
* **Usage Statistics Modal Enhancement**: Fixed getUserUsageStats API method mismatch (GET→POST) enabling proper subscription usage display
* **API Architecture Consolidation**: Merged /api/api.php and /api/api.app.php into single file, eliminating confusing dual-file structure while preserving all error handling and routing functionality

⠀**Partially Implemented**
* **Quota UI Auto-Updates**: Column quota tracking works when called manually but doesn't update automatically after column creation due to timing/event flow issues in showAddColumnForm() success handler

⠀**Known Issues Identified**
* **Column Quota UI Updates**: Creating 3rd column (hitting FREE limit) doesn't automatically change "New Column" button to upgrade message - requires manual updateColumnCreationUI() call
* **Shared Task Notes Persistence**: Recipients of shared tasks can edit notes but changes aren't being saved to database

⠀**Next Steps (Priority Order)**
**1** **Debug column quota auto-update timing issue** - investigate why updateQuotaStatusAfterOperation() call in showAddColumnForm() isn't triggering UI refresh
**2** **Fix shared task notes persistence** - ensure note edits by task recipients (non-owners) are properly saved via API
**3** **Add quota enforcement to duplicate/restore operations** - extend quota tracking to cover task duplication and item restoration
**4** **Implement server-side quota validation** - add backend checks in create/duplicate operations to prevent quota bypass
**5** **Add subscription upgrade CTAs** - integrate upgrade links/messaging with actual subscription management system

⠀**Implementation Status**
* ✅ **Proactive quota messaging system** - prevents user frustration with clear upgrade paths
* ✅ **API file consolidation** - improved developer experience and reduced cognitive overhead
* ✅ **Usage stats modal functionality** - proper subscription limit visibility
* ⚠️ **Real-time quota UI updates** - works manually but needs automatic triggering fix
* ❌ **Shared notes persistence** - identified but not addressed

---

# # 2025-09-26 — Virtual Column Positioning & Shared Task Fixes
**Completed Core Fixes:**
* **Virtual Column Positioning**: Fixed "Shared with Me" column to consistently appear rightmost by adding sorting logic after virtual column creation and updating column map references post-sort
* **Frontend Column Creation**: Modified showAddColumnForm() to insert new user columns before existing virtual columns instead of always appending to end, maintaining proper column order without page refresh
* **Shared Task Notes Persistence**: Resolved critical bug where recipients couldn't save note edits by removing user_id restriction from UPDATE query in handle_save_task_details() - permission validation already ensures proper access control
* **Owner Badge Persistence**: Fixed disappearing owner badges when recipients edit notes by adding shared_by data to task card datasets and including it in getTaskDataFromElement() reconstruction
* **Orphaned Share Cleanup**: Added user status filtering to shared tasks query (AND u.status = 'active') to automatically exclude tasks from deleted/suspended users from "Shared with Me" columns

⠀**Technical Achievements:**
* Virtual column sorting ensures rightmost placement with position 9999 value
* Shared task permission model allows recipients to edit notes while maintaining ownership boundaries
* Owner identification badges display consistently for task recipients with proper data persistence
* Automatic cleanup prevents display of invalid shares from deactivated accounts

⠀**System Status:**
* Sharing foundation fully functional with proper permission enforcement
* Notes collaboration working bidirectionally between owners and recipients
* Virtual columns maintain consistent positioning across all user interactions
* Database integrity maintained with active user filtering

⠀**Next Steps (Priority Order):**
**1** **Trust Management System** - User interface for viewing and managing all trust relationships and shared task recipients
**2** **Permission System Completion** - Full recipient permission enforcement for shared task actions (view vs edit restrictions)
**3** **File Management Enhancements** - Bulk operations, search functionality, and storage analytics for attachment management
**4** **Touch Moves: Mobile Move Mode 2.0** - Enhanced mobile task movement with shared task restrictions and permission indicators
**5** **Zero-Knowledge Baseline** - Consolidate crypto operations to /uix/crypto.js and prepare per-item DEK architecture
