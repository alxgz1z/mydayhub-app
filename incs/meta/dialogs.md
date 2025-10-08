THIS FILE CONSOLIDATES DIALOGS WHILE THE APP ARCHITECTURE WAS DESIGNED (Streamlined)
====================================================================================

Version: 07 Oct 2025 (streamlined summaries)
Source: Consolidated from prior dialogs; original preserved in `dialogs as of 07Oct25.md`

---

## 1) Rationale for restarting at Version 4.0.0

Summary:
- Focus on simplicity, carry forward refined aesthetics, design privacy from day one.
- Centralize encryption/decryption, avoid logic entanglement; fluid SPA UX without page reloads.
- Mobile-first layout, session control with last-writer wins, quotas/telemetry as first-class concerns.

Key asks (condensed from Alex):
- Keep UI simple; reuse the polished look; add universal private toggle across entities.
- Treat sorting logic as critical; progressive show/hide of UI elements.
- Decouple crypto as a proxy layer; enable zero-knowledge with a dev plaintext switch.
- Design for real-time feel and narrow screens first; add session master instance; plan quotas/telemetry.

Outcome:
- Adopt a centralized crypto module, SPA interaction model, and modular JS per view.

---

## 2) Offline functionality (PWA) – staged approach

Summary:
- App shell via Service Worker; data mirror and sync via IndexedDB with write queue; LWW for conflicts.
- Ship online-first, then layer offline in phases to control complexity.

Phases:
- P1 App shell caching; P2 Local mirror + queue; P3 Conflict handling and telemetry.

---

## 3) Email to Task integration

Summary:
- Users email tasks using a per-user token in subject; server polls mailbox (IMAP) and creates temporary tasks.
- Zero-knowledge preserved by encrypting client-side on next app load.

Notes:
- Requires php-imap; two-stage flow: server creates placeholder, client encrypts and finalizes.

---

## 4) Calendar Overlays concept and implementation path

Summary:
- Informational badges for fiscal/holiday/birthday/custom labels by date; no task filtering.
- Data model supports date ranges and single-day events; user-managed via modal; JSON import/export.

Key elements:
- Header badge with highest-priority label; modal with Events, Preferences, Management.
- Tables: calendar_events, user_calendar_preferences.

---

## 5) Analytics, quotas, and resource control

Summary:
- Add `user_activity` logging endpoint; track CRUD and key flows.
- Introduce `users.plan_type` with per-plan limits; enforce limits server-side before writes.

---

## 6) OS notifications

Summary:
- Use Web Notifications API; optional service worker for background delivery.
- Settings toggle to opt in; candidates: due reminders, share updates.

---

## 7) Encryption and offline decisions

Summary:
- Centralized crypto layer; dev switch for plaintext bypass during development.
- Zero-knowledge implies password reset needs recovery; adopt security-questions-based recovery envelope.

Decisions:
- Implement symmetric ZK first with recovery; defer asymmetric sharing until after stable baseline.

---

## 8) Task classification for focus

Summary:
- Prefer Signal/Support/Backlog/Completed classification over simple priority.
- Grouped sorting: Signal > Support > Backlog > Completed; counts enable focus metrics.

---

## 9) Beta 3 vs Beta 4 comparisons and guidance toward Beta 5/6

Summary:
- Choose single API gateway (Beta 4 pattern), consistent CSRF, modular handlers, optimistic UI.
- Reinstate strict client-side crypto boundary (from earlier version) with `encrypted_data` model.
- Fill gaps: classification groups, offline phases, sharing foundation, telemetry.

---

## 10) Mobile Move Mode and touch DnD

Summary:
- Keep desktop drag-and-drop; for mobile, implement Move Mode 2.0:
  - Enter via task menu; wiggle state; top banner with Cancel.
  - Column footers become “Move here”; in-column drop-zones for precise up/down moves.
  - Multiple aborts: Cancel button, backdrop tap, Esc/back.

---

## 11) Sharing feature design (hybrid model)

Summary:
- Pragmatic boundary: private items remain ZK and unshareable; non-private items are shareable (server-readable).
- Phase A: Trust relationships (invite/accept/revoke). Phase B: 1:1 task sharing with permissions and “Ready for Review”.
- Recipient sees a “Shared with Me” column; cannot change privacy or re-share; owner controls revoke.

Data model:
- user_trusts, shared_items, sharing_activity; enforce is_private=0 for share.

---

## 12) File uploads permissions debugging (local dev)

Summary:
- Writable check failed due to ownership mismatch; solution: shared group with setgid or chown to web user; verify via ls -l.

---

## 13) Stylus ink capture (iPad Pencil)

Summary:
- Canvas + Pointer Events with pressure/tilt; save vector strokes JSON and PNG preview; server stores blobs; enhance with smoothing/undo.

---

## 14) “Intel Graph” module idea

Summary:
- Multidimensional knowledge graph anchored on Use Cases; entities: customers, product families, services, competitors, contracts, skills.
- MVP: schema + importer; list views; graph view; saved filters; client-encrypted notes.

---

Change log and traceability:
- Original, full conversational content archived in `dialogs as of 07Oct25.md`.
- This file condenses intents, decisions, and implementation paths while preserving scope and constraints.



