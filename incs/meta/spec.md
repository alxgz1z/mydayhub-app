# MyDayHub Reference Specification

Version: Tamarindo 8.1 (Mission Focus Integration Complete)
Audience: Internal Development & Product
Last Updated: 2025-10-15

---

## Table of Contents

1. Introduction & Philosophy
2. Product Scope & Primary View
3. Core Functional Specification
4. Collaboration & Sharing (Foundations)
5. Zero‑Knowledge Privacy & Recovery (Implemented)
6. Calendar Overlay System (Implemented)
7. Mission Focus Chart (Implemented & Enhanced)
8. Settings, Theming, Accessibility
9. User Guide & Documentation
10. Network & Environment
11. API Model (Descriptions Only)
12. Data Model (Tables and Fields)
13. Non‑Goals & Deferred Items
14. Roadmap & Priorities
15. Glossary

---

## 1. Introduction & Philosophy

MyDayHub is a productivity hub emphasizing signal over noise. The objective is a fast, fluid, mobile‑friendly experience that keeps sensitive data private by default while enabling practical collaboration when explicitly chosen.

Core principles:
- **Hybrid zero-knowledge privacy**: Server decrypts for display, maintains encrypted storage; plaintext never stored for private items.
- Fluid experience: Inline edits, optimistic updates, non‑blocking feedback.
- Modern, minimalist UI: Dark‑first visual language with accessibility baked in.
- Signal over noise: Classification drives focus and decisions.
- Work anywhere: Resilient UX patterns; offline is a long‑term objective.
- Accessibility: WCAG contrast, keyboard navigation, high‑contrast theme.

---

## 2. Product Scope & Primary View

Scope focuses on the Tasks View (Kanban) as the primary interface, with Journal View now implemented. The Tasks View delivers:
- Columns with header (title, count, privacy toggle, actions)
- Task cards with classification, completion, notes, due date, attachments, privacy indicator, and share state
- Drag‑and‑drop and a touch‑friendly move mode
- Snooze with visual indicators and filters

The Journal View delivers:
- Horizontal date-based columns with scrollable navigation
- Journal entries with rich text editing and task linking via @task[description] markup
- Same privacy/encryption system as tasks
- Mobile-optimized collapsible tab navigation

Non‑goals for the current milestone: full offline engine, full end‑to‑end encrypted sharing, and cross‑view integrations beyond the Calendar Overlay basics.

---

## 3. Core Functional Specification

3.1 Columns
- Create, rename, delete (soft delete with undo), reorder
- Privacy inheritance (making a column private encrypts its tasks)
- Privacy toggle prompts encryption setup if not configured

3.2 Tasks
- Create, rename, duplicate, delete (soft with undo), move within/between columns
- Classify: Signal, Support, Backlog, Completed; enforced sorting rules
- Complete/uncomplete with visual and audio feedback
- Due date, snooze (preset and custom), notes via Unified Editor
- Attachments (images, PDFs) with quotas
- Privacy toggle with visual indicators; prompts encryption setup if not configured

3.3 Filters & Toolbar
- Show/Hide Completed, Private, Snoozed; state persists

3.4 Unified Editor
- Modal editor for task notes with autosave, formatting tools, and font sizing

3.5 Journal View (IMPLEMENTED & REFINED)
- Horizontal date-based columns with scrollable navigation (1-day, 3-day, 5-day views)
- Journal entries: create, edit, delete with rich text support and classification system
- Classification: Signal/Support/Backlog matching task card patterns with color bands and popover menus
- Drag-and-drop: move entries between date columns with mobile-friendly modal for date selection
- Task linking via @task[description] markup that creates linked tasks
- Privacy integration: private journal entries encrypted same as tasks
- Mobile-optimized: 1-day view enforced on mobile, responsive column layout
- Navigation: < > buttons integrated in column headers, << >> buttons in footer popover
- View switching: seamless transition between Tasks and Journal views
- Vertical space optimization: removed header ribbon, integrated controls into footer popover

---

## 4. Collaboration & Sharing (Foundations)

Model favors clarity and safety:
- Only non‑private items can be shared
- Permissions: view or edit; owners retain share/privacy controls
- Recipient experience: “Shared with Me” virtual column; permission‑based action visibility
- Ready‑for‑Review workflow: recipients mark ready; owners see non‑blocking notifications

Out‑of‑scope for current milestone: full end‑to‑end encrypted sharing. A documented trade‑off is used for shareable items.

---

## 5. Zero‑Knowledge Privacy & Recovery (IMPLEMENTED)

**Hybrid Zero-Knowledge Architecture:**
- Private data is encrypted using AES-256-GCM before storage
- Server can decrypt for display purposes (hybrid approach)
- Per‑item data keys (DEKs) managed server-side with proper encryption
- Master key derived from user password using PBKDF2

**Setup & User Experience (COMPLETE):**
- Encryption setup is optional and recommendation-based, not mandatory on login
- Triggered when users attempt to make items private for the first time
- Available via Settings panel "Privacy & Encryption" section
- Optional banner notification can be dismissed permanently
- 2-step setup: Security questions → Setup complete

**Recovery (IMPLEMENTED):**
- Security questions allow password recovery via security questions
- Password reset makes old encrypted data unrecoverable (by design)
- Recovery envelope contains encrypted master key

**Technical Implementation:**
- AES-256-GCM encryption with proper IV and authentication tags
- Column privacy inheritance: making columns private encrypts all tasks
- Shared task conflict resolution with user confirmation
- Environment variable security for SSL certificates
- Debug information available in DEV_MODE

---

## 6. Calendar Overlay System (IMPLEMENTED)

Purpose:
- Show contextual date information (fiscal, holidays, birthdays, custom) without disrupting task focus

Implementation:
- Header badge shows highest‑priority event label for the selected date
- Modal with tabs: Events, Preferences, Calendar Management
- JSON import/export; calendar grouping; group priority affects badge display
- CRUD operations for calendar events with user preference management
- Integration with journal view column headers for event display

---

## 7. Mission Focus Chart (IMPLEMENTED & ENHANCED)

Purpose:
- Visualize distribution of Signal/Support/Backlog among active tasks and journal entries from last 30 calendar days.

Implementation:
- Header donut (Chart.js), visible by default for new users.
- Real‑time updates when tasks or journal entries are created, modified, deleted, or reclassified.
- Journal entries fetched via `/api/api.php?module=journal&action=getEntries` with GET param pass‑through in the API gateway.
- Robust parsing and empty-response guards; console warnings without breaking app.
- Tooltip: “Tasks + Last 30 Days”.

Behavior:
- Combines active tasks (excludes completed/deleted/received shares) + last‑30‑day journal entries.
- Updates without refresh and after view switches (lazy‑loaded views supported).
- Optional via Settings (Hide/Show).

---

## 8. Settings, Theming, Accessibility

Settings:
- Theme: Dark (default), Light, High‑Contrast (accent reapplied on theme switch).
- Font size: global scaling controls.
- Completion sound: on/off.
- Mission Focus Chart: Hide/Show (default: Show for new users).
- Privacy & Encryption management.
- User Guide.
- Accent Color Customization: presets + custom color picker + reset to default; persisted to localStorage and `users.preferences`; applied via dynamic CSS variables with `!important` and mirrored on `body` for light‑mode overrides.

Theming & Accessibility:
- Dark‑first palette; high‑contrast variant.
- Automatic contrast for toast text; settings active buttons compute readable text color from accent.
- SVG icons; keyboard/focus states; large touch targets.

---

## 9. User Guide & Documentation

**Implementation Complete:**
- Comprehensive user manual at `/incs/userguide.php`
- Accordion-style interface with one-section-at-a-time expansion
- Theme-aware styling matching app design system
- Opens in new tab from Settings panel

**Content Coverage (10 sections):**
1. **Getting Started** - Overview, philosophy, key features introduction
2. **Task Classification** - Deep dive into Signal/Support/Backlog philosophy with examples
3. **Working with Tasks & Columns** - Complete CRUD operations, keyboard shortcuts
4. **Privacy & Zero-Knowledge Encryption** - Setup process, usage patterns, security model
5. **Sharing & Collaboration** - Permissions, workflows, Ready-for-Review process
6. **Journal View** - Daily entries, best practices, task linking
7. **Advanced Features** - Snoozing, attachments, calendar overlays, Mission Focus Chart (with journal integration), mobile features
8. **Settings & Customization** - All preferences explained with recommendations
9. **Keyboard Shortcuts & Pro Tips** - Power user workflows, morning/weekly routines
10. **Troubleshooting & FAQ** - Common issues, performance tips, data safety

**Visual Design:**
- SVG icons from app for section headers
- Classification badges matching task styling
- Tip boxes (green) and warning boxes (orange) for important information
- Smooth accordion animations with scroll-into-view
- Fully responsive for mobile and desktop
- Back to MyDayHub buttons for easy navigation

**User Experience:**
- Friendly, approachable tone following industry best practices
- Real-world examples and use cases throughout
- Progressive disclosure via accordion prevents overwhelm
- Searchable via browser find (all content in DOM)

---

## 10. Network & Environment

URL detection:
- Stable hostnames for local development and LAN testing (e.g., localhost, jagmac.local)
- Environment variable override supported

Environments:
- Local development, network development, staging, production
- Debug logging enabled only where appropriate

---

## 11. API Model (Descriptions Only)

Single‑gateway API pattern with modular handlers. All mutating actions enforce session auth, CSRF validation, ownership checks, and consistent error semantics.

Representative capability areas (non‑exhaustive, no request/response bodies here):
- Authentication & User: register, login, logout, password reset flows, change password, preference persistence
- Tasks & Columns: board retrieval, column CRUD/reorder, task CRUD/reorder, classification, privacy (with encryption setup prompts), snooze, attachments, soft‑delete and restore
- Sharing (Foundations): share/unshare, list shares, ready‑for‑review flags, permission‑gated actions
- Calendar Overlay: events CRUD, bulk import/export, calendar grouping and priority; calendar visibility preferences
- **Zero‑Knowledge (IMPLEMENTED): optional encryption setup, status, migration progress, recovery questions, decryptTaskData endpoint**
- **Journal View (IMPLEMENTED): entries CRUD, preferences management, task reference processing, classification system (Signal/Support/Backlog)**
- **Mission Focus Chart (IMPLEMENTED): real-time updates for tasks and journal entries, 30-day journal window integration**

---

## 12. Data Model (Tables and Fields)

Note: This section lists tables and key fields only. It avoids schema DDL and focuses on meaning and relationships.

11.1 Users & Auth
- users: user_id, username, email, password_hash, preferences, created_at, storage_used_bytes
- password_resets: id, user_id, token_hash, expires_at, created_at

11.2 Board & Tasks
- columns: column_id, user_id, column_name, position, is_private, created_at, updated_at, deleted_at
- tasks: task_id, user_id, column_id, encrypted_data, position, classification, is_private, due_date, snoozed_until, snoozed_at, created_at, updated_at, deleted_at
- task_attachments: attachment_id, task_id, user_id, filename_on_server, original_filename, filesize_bytes, mime_type, created_at

11.3 Sharing (Foundations)
- shared_items: id, owner_id, recipient_id, item_type, item_id, permission, ready_for_review, created_at, updated_at, unique share constraint, owner/recipient indexes
- sharing_activity: id, shared_item_id, actor_user_id, action, payload, created_at

11.4 Calendar Overlay
- calendar_events: id, user_id, event_type, calendar_name, label, start_date, end_date, color, is_public, priority, created_at, updated_at
- user_calendar_preferences: id, user_id, calendar_type, is_visible, created_at

11.5 Zero‑Knowledge Encryption (IMPLEMENTED)
- user_encryption_keys: user_id, wrapped_master_key, kdf_params, created_at, updated_at
- item_encryption_keys: id, user_id, item_type, item_id, wrapped_dek, created_at, updated_at
- user_security_questions: id, user_id, questions_meta, created_at
- encryption_migration_status: id, user_id, phase, progress, last_checked_at
- encryption_audit_log: id, user_id, item_type, item_id, operation, metadata, created_at
- tasks privacy flags (within tasks): privacy_inherited, privacy_override
- columns privacy aid (within columns): has_shared_tasks

11.6 Journal View (IMPLEMENTED & REFINED)
- journal_entries: entry_id, user_id, entry_date, title, content, is_private, encrypted_data, classification, created_at, updated_at
- journal_task_links: link_id, entry_id, task_id, user_id, created_at
- journal_preferences: id, user_id, view_mode, hide_weekends, created_at, updated_at

Relationship highlights:
- users 1‑to‑many columns, tasks, attachments
- tasks many‑to‑one columns; tasks optionally appear in shared_items for collaboration
- calendar_events and preferences scoped per user
- encryption records keyed to user and item boundaries

---

## 13. Non‑Goals & Deferred Items

- Full offline‑first data model and sync engine (IndexedDB, background sync, conflict handling)
- End‑to‑end encrypted sharing with asymmetric keys
- Outlines, Events full views (only foundational concepts documented)
- Voice input for journal entries (iOS Web Speech API integration)
- Calendar integration for journal entries
- Offline capability for journal entries

---

## 14. Roadmap & Priorities

**COMPLETED:**
- ✅ **Encryption data path fixed** - Task payloads are encrypted end‑to‑end for private items
- ✅ **Hybrid zero-knowledge architecture implemented** - Server decrypts for display, maintains encrypted storage
- ✅ **Optional encryption setup** - User-triggered workflow with settings panel integration
- ✅ **Security questions recovery** - Password recovery without compromising zero-knowledge principle
- ✅ **Journal View implementation** - Horizontal date columns, CRUD operations, privacy integration
- ✅ **Journal classification system** - Signal/Support/Backlog classification matching task card patterns
- ✅ **Journal drag-and-drop** - Move entries between date columns with mobile-friendly date selection modal
- ✅ **Journal navigation refinement** - Integrated < > buttons in column headers, << >> buttons in footer popover
- ✅ **Mobile responsiveness** - 1-day view enforced on mobile, responsive layout optimization
- ✅ **Vertical space optimization** - Removed header ribbon, integrated all controls into footer popover
- ✅ **View switching architecture** - Seamless transition between Tasks and Journal views
- ✅ **Smart contextual menu positioning** - Auto-adjusting menus to prevent viewport overflow
- ✅ **User Guide & Documentation** - Comprehensive accordion-style user manual accessible from Settings
- ✅ **SVG tab icons** - Replaced emoji with theme-aware SVG icons for Tasks and Journal tabs
- ✅ **Mission Focus Chart Enhancement** - Integrated journal entries from last 30 days for comprehensive signal tracking
- ✅ **Real-time Chart Updates** - Chart updates immediately for all task and journal operations without refresh
- ✅ **Chart Default Visibility** - Mission Focus Chart now visible by default for new users, improving mission awareness
- ✅ **Calendar Overlay System** - Events CRUD, preferences management, JSON import/export, header badge integration
- ✅ **Accent Color Persistence** - Accent color preference persists across theme changes
- ✅ **Theme Reapply** - Theme selection persists across page reloads

Immediate priorities:
- Implement @task[description] markup detection and smart task creation from journal entries
- Enforce permission‑based UI restrictions for shared items
- Polish sharing workflow in mobile contexts
- Implement password change with decrypt/re-encrypt of private items

Medium term:
- End‑to‑end encrypted sharing via asymmetric key exchange
- Enhanced recovery options (backup codes, multi‑factor)
- Voice input integration for journal entries (iOS Web Speech API)
- Calendar integration for journal entries

Long term:
- Offline MVP (app shell, local cache, write queue, LWW)
- Accessibility refinements and performance tuning at scale

---

## 15. Glossary

- Task card: the unit of work in a column
- Classification: Signal (highest priority), Support, Backlog, Completed
- Private item: content encrypted client‑side; cannot be shared
- Shared item: content visible to recipients per permission model
- DEK: Data Encryption Key per item; wrapped by user master key
- Recovery envelope: encrypted copy of master key protected by recovery key
- Journal entry: date-based entry in the Journal View with rich text content and classification
- Journal classification: Signal/Support/Backlog classification system matching task card patterns
- Task markup: @task[description] syntax within journal entries to create linked tasks
- View switching: seamless transition between Tasks (Kanban) and Journal (date-based) views
- Navigation buttons: < > for single-day navigation, << >> for multi-day navigation
- Footer popover: centralized controls menu for view modes, date jumping, and navigation
- Vertical space optimization: removal of header ribbon to maximize content area
- User Guide: comprehensive accordion-style documentation accessible from Settings panel
- Accordion UI: collapsible sections that expand one at a time for focused reading
- Mission Focus Chart: header donut chart showing Signal/Support/Backlog distribution across tasks and journal entries (30-day window)
- Real-time chart updates: immediate chart refresh when tasks or journal entries are modified without page reload
- Chart default visibility: Mission Focus Chart visible by default for new users to improve mission awareness
- Calendar Overlay System: contextual date information display with events, preferences, and header badge integration
- Calendar events: user-defined events with types, labels, date ranges, and visibility preferences

---

Notes on this refactor:
- Removed code snippets and DDL; retained only product, behavior, and data naming semantics
- Consolidated scattered sections (encryption, sharing, calendar, mission focus) into single topical areas
- Schemas expressed as table names with field lists to remain descriptive without embedding code

