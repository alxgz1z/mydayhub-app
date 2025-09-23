# ### Index
1 App Foundation and Core Principles
2 Privacy, Encryption, and Zero-Knowledge Decisions
3 Task Classification and Signal vs Noise
4 Offline Support and PWA Strategy
5 Session Control and Multi-User Management
6 Resource Quotas and Telemetry
7 Task Sharing Architecture and Trust Model
8 UI/UX Design Advancements and Recommendations
9 Calendar Overlays and Custom Events
10 Task Card Meta & Footer Indicators
11 Knowledge Management Graph Module
12 Troubleshooting, Testing, and Migration Practices

⠀
### 1. App Foundation and Core Principles
Summary:
- Development guided by simplicity, privacy, and modularity. Mobile-first UI, responsive layouts, and fluid SPA experience are foundational. All business logic is modular, with strict adherence to progressive improvement, visual clarity, no modal overload, and only essential settings surfaced per screen.
- Decisions:
* Core: simplicity, incremental aesthetic changes, privacy-first design.
* Every app entity supports a private toggle; toggle logic standardized throughout.
* Sorting: dedicated logic, animation on status change, maintain clean testable utilities.

⠀
### 2. Privacy, Encryption, and Zero-Knowledge Decisions
Summary:
- Zero-knowledge encryption is defensive: all sensitive data is encrypted client-side, never stored or transmitted as plaintext. Symmetric encryption for own data; asymmetric encryption needed for sharing. Dedicated crypto module isolates all cryptographic logic for maintainability and debugging.
- Decisions:
* Use centralized crypto.js; other modules call only via this boundary.
* Plaintext debugging switch present during dev; zero-knowledge is default for production.
* Security questions chosen by user for master key recovery; trade-off is that forgotten questions mean data loss.
* Private items are not shareable; non-private content is readable when sharing unless E2E crypto implemented.

⠀
### 3. Task Classification and Signal vs Noise
Summary:
- Task view optimized for focus: instead of priority only, every task is classified as Signal, Support, Noise, or Completed. This structure supports analytics and nudges for productivity.
- Decisions:
* Classification field replaces status in schema (enum: signal, support, noise, completed).
* UI: left band color-coded, cycling status, supports grouped sorting and analytics.
* Initial implementation prompts user to focus on progress rather than urgency alone.

⠀
### 4. Offline Support and PWA Strategy
Summary:
- Service Worker and IndexedDB adopted for full offline capability. App shell cached for quick load; data operations queued locally and synced when online; last-write-wins resolves conflicts.
- Decisions:
* PWA rollout is phased: core online app first, then shell cache, finally IndexedDB mirror and sync.
* Queue modifications offline, sync on reconnect, fallback to local operations when offline; UI reflects offline/online status.

⠀
### 5. Session Control and Multi-User Management
Summary:
- Last-write wins: only active session may edit, others read-only. Automatic session reclamation and front-end indicators (dot/banner) persist session status.
- Decisions:
* Hybrid session model—active session receives full permissions; reclaim button allows switching.
* Backed by server session store, possibly SSE for real-time updates.

⠀
### 6. Resource Quotas and Telemetry
Summary:
- All plans enforce quotas on items and storage. Admin and user dashboards provide usage. Activity tracking via event logs logged to DB for analytics and ops.
- Decisions:
* Per-user plan controls: limits on task/journal/attachment count via config and enforced on backend.
* Telemetry events: create, edit, share, delete, login tracked for analytics; privacy preserved by local logging.
* Warnings prompt users when approaching limits; analytics to guide development decisions.

⠀
### 7. Task Sharing Architecture and Trust Model
Summary:
- Sharing is staged: foundation sets user trust links; task sharing built on non-private, server-readable entities first; privacy boundaries explicit and enforced.
- Decisions:
* Trust relationships (invites) and shared items tracked in new tables.
* Only non-private items are shareable; server validates, manages revocation, activities.
* UI exposes "Shared with Me" column for recipients, badges for shared items, strict permission checks.
* Option to upgrade to E2E encryption for shared items planned, but not first implemented.

⠀
### 8. UI/UX Design Advancements and Recommendations
Summary:
- SPA optimized for mobile and touch-first interaction. Task cards have clear status bands, quick action menus, and modal note editor. Recommendations stress minimalism, accessibility, and contextual guidance.
- Decisions:
* Footer for metadata/icons keeps cards readable and scalable.
* Touch DnD: long-press on mobile, drag handles for clarity, fallback to Move Mode for older browsers.
* Onboarding includes sample column/tasks for new users.
* High-contrast modes, ARIA attributes, and font scaling ensure accessibility.

⠀
### 9. Calendar Overlays and Custom Events
Summary:
- Flexible event overlays supported in journal view. JSON file maps date ranges/types for fiscal/calendar/holidays; management UI to be built in Phase 2.
- Decisions:
* Ranges supported for multi-day events; type field enables custom styling.
* Initial data file required, management interface planned later.

⠀
### 10. Task Card Meta & Footer Indicators
Summary:
- Meta info (due date, notes) moved to card footer for better mobile/touch experience and scalability.
- Decisions:
* Icons for notes/due date show in footer, not inline; color signals overdue state.
* Touch targets sized for accessibility, UI uncluttered, adaptable to future icons.

⠀
### 11. Knowledge Management Graph Module
Summary:
- LAMP-powered multidimensional graph overlays allow relational queries across customers, products, contracts, competitors, and more.
- Decisions:
* Each entity and relationship type uniquely identified; API supports pivot queries and relation mapping.
* Notes and sensitive data encrypted per node/edge, with access control per session/user.

⠀
### 12. Troubleshooting, Testing, and Migration Practices
Summary:
- Testing covers regression, API contract, UI flows, and security. Migrations are transactional and automated, with backup and downtime planning.
- Decisions:
* Each API endpoint and schema change accompanied by robust unit/integration tests.
* Use portable SQL (CURRENT_TIMESTAMP, avoid inline comments), MySQL/MariaDB compatibility.
* Migration scripts and admin queries staged before rollout.

⠀
### END