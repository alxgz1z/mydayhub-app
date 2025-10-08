# MyDayHub Reference Specification (Proposed)

Version: Beta 7.7 (Optional Encryption UX)
Audience: Internal Development & Product
Last Updated: 2025-10-08

---

## Table of Contents

1. Introduction & Philosophy
2. Product Scope & Primary View
3. Core Functional Specification
4. Collaboration & Sharing (Foundations)
5. Zero‑Knowledge Privacy & Recovery (Conceptual)
6. Calendar Overlay System (Conceptual)
7. Mission Focus Chart (Conceptual)
8. Settings, Theming, Accessibility
9. Network & Environment
10. API Model (Descriptions Only)
11. Data Model (Tables and Fields)
12. Non‑Goals & Deferred Items
13. Roadmap & Priorities
14. Glossary

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

Scope focuses on the Tasks View (Kanban) as the primary interface. Journal, Outlines, and Events are future expansions. The Tasks View delivers:
- Columns with header (title, count, privacy toggle, actions)
- Task cards with classification, completion, notes, due date, attachments, privacy indicator, and share state
- Drag‑and‑drop and a touch‑friendly move mode
- Snooze with visual indicators and filters

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

## 6. Calendar Overlay System (Conceptual)

Purpose:
- Show contextual date information (fiscal, holidays, birthdays, custom) without disrupting task focus

Key elements:
- Header badge shows highest‑priority event label for the selected date
- Modal with tabs: Events, Preferences, Calendar Management
- JSON import/export; calendar grouping; group priority affects badge display

---

## 7. Mission Focus Chart (Conceptual)

Purpose:
- Visualize distribution of Signal/Support/Backlog among active tasks (excludes completed/deleted/received shares)

Behavior:
- Small header chart; optional via Settings; updates as tasks change

---

## 8. Settings, Theming, Accessibility

Settings:
- Theme: Dark (default), Light, High‑Contrast
- Font size: global scaling controls
- Completion sound: on/off
- Filter state persistence
- **Privacy & Encryption: encryption setup and management (IMPLEMENTED)**
- **Debug Mode: task_id and column_id display for development**

Theming & Accessibility:
- Dark‑first palette with clear hierarchy; high‑contrast variant
- Touch targets ≥44px, ARIA patterns, keyboard navigation support

---

## 9. Network & Environment

URL detection:
- Stable hostnames for local development and LAN testing (e.g., localhost, jagmac.local)
- Environment variable override supported

Environments:
- Local development, network development, staging, production
- Debug logging enabled only where appropriate

---

## 10. API Model (Descriptions Only)

Single‑gateway API pattern with modular handlers. All mutating actions enforce session auth, CSRF validation, ownership checks, and consistent error semantics.

Representative capability areas (non‑exhaustive, no request/response bodies here):
- Authentication & User: register, login, logout, password reset flows, change password, preference persistence
- Tasks & Columns: board retrieval, column CRUD/reorder, task CRUD/reorder, classification, privacy (with encryption setup prompts), snooze, attachments, soft‑delete and restore
- Sharing (Foundations): share/unshare, list shares, ready‑for‑review flags, permission‑gated actions
- Calendar Overlay: events CRUD, bulk import/export, calendar grouping and priority; calendar visibility preferences
- **Zero‑Knowledge (IMPLEMENTED): optional encryption setup, status, migration progress, recovery questions, decryptTaskData endpoint**

---

## 11. Data Model (Tables and Fields)

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

11.5 Zero‑Knowledge Encryption (Conceptual Store)
- user_encryption_keys: user_id, wrapped_master_key, kdf_params, created_at, updated_at
- item_encryption_keys: id, user_id, item_type, item_id, wrapped_dek, created_at, updated_at
- user_security_questions: id, user_id, questions_meta, created_at
- encryption_migration_status: id, user_id, phase, progress, last_checked_at
- encryption_audit_log: id, user_id, item_type, item_id, operation, metadata, created_at
- tasks privacy flags (within tasks): privacy_inherited, privacy_override
- columns privacy aid (within columns): has_shared_tasks

Relationship highlights:
- users 1‑to‑many columns, tasks, attachments
- tasks many‑to‑one columns; tasks optionally appear in shared_items for collaboration
- calendar_events and preferences scoped per user
- encryption records keyed to user and item boundaries

---

## 12. Non‑Goals & Deferred Items

- Full offline‑first data model and sync engine (IndexedDB, background sync, conflict handling)
- End‑to‑end encrypted sharing with asymmetric keys
- Journal, Outlines, Events full views (only foundational concepts documented)

---

## 13. Roadmap & Priorities

**COMPLETED:**
- ✅ **Encryption data path fixed** - Task payloads are encrypted end‑to‑end for private items
- ✅ **Hybrid zero-knowledge architecture implemented** - Server decrypts for display, maintains encrypted storage
- ✅ **Optional encryption setup** - User-triggered workflow with settings panel integration
- ✅ **Security questions recovery** - Password recovery without compromising zero-knowledge principle

Immediate priorities:
- Enforce permission‑based UI restrictions for shared items
- Polish sharing workflow in mobile contexts
- Implement password change with decrypt/re-encrypt of private items

Medium term:
- End‑to‑end encrypted sharing via asymmetric key exchange
- Enhanced recovery options (backup codes, multi‑factor)

Long term:
- Offline MVP (app shell, local cache, write queue, LWW)
- Accessibility refinements and performance tuning at scale

---

## 14. Glossary

- Task card: the unit of work in a column
- Classification: Signal (highest priority), Support, Backlog, Completed
- Private item: content encrypted client‑side; cannot be shared
- Shared item: content visible to recipients per permission model
- DEK: Data Encryption Key per item; wrapped by user master key
- Recovery envelope: encrypted copy of master key protected by recovery key

---

Notes on this refactor:
- Removed code snippets and DDL; retained only product, behavior, and data naming semantics
- Consolidated scattered sections (encryption, sharing, calendar, mission focus) into single topical areas
- Schemas expressed as table names with field lists to remain descriptive without embedding code

