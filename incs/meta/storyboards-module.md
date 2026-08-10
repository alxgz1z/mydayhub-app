# Storyboards — the third Signal view

**Status:** design of record for the `storyboards` module
**Source of the feature:** the standalone STORYBOARDS app (`/home/alex/storyboards`, TypeScript /
Fastify / Postgres / React). That app is **not** changed by this work and shares no code, data or
runtime with Signal. What is replicated is its *behaviour*; everything about how that behaviour is
built follows Signal.

---

## 1. What the feature is

A collaborative drafting tool for narrative structure. A user opens a **storyboard**, lays out its
argument **scene** by scene, the team comments and iterates, and when the story is agreed the
storyboard exports as a **markdown build brief** an AI agent can turn into a deck or a document.

Vocabulary is fixed and the word *slide* is not used anywhere in the UI, the code, or the file
names — it survives only inside the exported brief, naming what an agent should produce downstream.

| Concept | Term |
|---|---|
| The document unit | **Storyboard** |
| One step of the argument | **Scene** |
| The overview grid | **scene index** |
| Cross-reference | `<<3>>` jumps to scene 3 |

---

## 2. How it fits Signal

Signal's patterns win everywhere they touch this feature.

- **One gateway.** No REST surface. Everything is `POST /api/api.php` with
  `{module:'storyboards', action:'…', data:{…}}` and the `X-CSRF-TOKEN` header, or a `GET` with
  `module`/`action` query params. The handler follows the `journal.php` contract — it *returns* an
  array and the gateway sends it — not the `tasks.php` contract of calling `send_json_response`
  itself.
- **One monolith.** `api/storyboards.php` for the backend, `uix/storyboards.js` and
  `uix/storyboards.css` for the front end, vanilla JS, no build step, no framework. Files are
  bind-mounted, so an edit is live.
- **One theme layer.** Signal's CSS variables and its six theme blocks. New colour lives in a
  `--sb-*` token family added to every block.
- **Signal's chrome.** The same modals, toasts (`window.showToast`), confirms
  (`window.showConfirm`), `window.apiFetch`, footer control groups, and mobile behaviour as Tasks
  and Journal.

### Decisions taken against the source app

| Topic | STORYBOARDS | Here | Why |
|---|---|---|---|
| Content encryption | none | **none** | Signal's own rule: only non-private items are shareable. A storyboard is inherently shared, exactly like a shared task. |
| Table names | `narratives` / `boards` (kept to dodge a migration on live data) | `sb_storyboards` / `sb_scenes` | Greenfield tables, so no reason to inherit names the source app's own spec calls historical. |
| Built scenes (uploaded HTML) | supported | **not built** | Serving user HTML same-origin is stored XSS against a session holding encryption keys. `sb_scenes.kind` is kept so it can be added later behind a sandbox. |
| Image storage | `assets/{id}/…` | Signal's `media/imgs` + `users.storage_used_bytes` | Reuses the attachment quota already enforced. |
| Access | codeword + guests | **codeword + guests** | Alex's call. See §4. |

---

## 3. Data model

MariaDB, InnoDB, `utf8mb4_unicode_ci`, every table prefixed `sb_`. Signal's users table has PK
`user_id`, which is what the foreign keys reference.

- **`sb_participants`** — one identity row per person *in this feature*: either a Signal account
  (`user_id` set) or a codeword guest (`user_id` NULL, `display_name` typed at join). Authorship
  everywhere points at `participant_id`, so one foreign key covers both kinds and Signal's core
  `users` table is never given nullable credentials or guest rows that would pollute the admin
  panel, the quota tiers, and the encryption setup.

  **`participant_id` is the only identity this feature has.** Ownership points at it too
  (`sb_storyboards.owner_participant_id`), *not* at `users.user_id` — an owner with a `user_id` on
  the storyboard row and a `participant_id` on the membership row would be two identities for one
  person, leaving every access check to reconcile them and "is this comment mine?" with two answers.
  Ownership still requires an account: the owner's participant row must have `user_id IS NOT NULL`,
  enforced on create. Where a real Signal account is genuinely needed — charging a storage quota —
  the code joins through to `sb_participants.user_id`.
- **`sb_guest_sessions`** — opaque cookie token (stored hashed) → participant, with an expiry and its
  own CSRF token. Guests never get a PHP login session.
- **`sb_storyboards`** — owner (a participant backed by a real Signal account, always), title,
  description, `access_code`, `code_version`, `join_role`, `status`, and the nine delivery-brief
  fields.
- **`sb_memberships`** — `(storyboard_id, participant_id)`, role, `joined_code_version`, status.
- **`sb_scenes`** — title, `position`, `kind`, `owner_label`, `is_backup`.
- **`sb_scene_texts`** / **`sb_scene_assets`** — a scene's text boxes and its up-to-four reference
  images, sharing **one** `sort_order` sequence across both tables so a text box can sit between two
  images. Every image carries a required non-empty description.
- **`sb_comments`** — the review log: open/closed (closed = hidden), `is_action_item` +
  `action_owner`. Never exported.
- **`sb_exports`**, **`sb_events`** — export snapshots and a light audit trail.

Cross-references are stored as stable id tokens (`<<@{scene_id}>>`) and rendered as the target's
*current* position, so reordering never breaks a link. A reference only ever resolves inside its own
storyboard.

---

## 4. Access model

Two ways in, one authorization path.

1. **Signal account** — a logged-in user reaches the Storyboards tab in the app shell. They own
   storyboards, and their participant row is created lazily on first use.
2. **Codeword guest** — anyone with the code opens `/sb/?code=…`, sees what the code opens *before*
   committing (title, scene count, who shared it, the role they get), types a display name, and
   lands in a guest shell with only that storyboard. No account, no Tasks, no Journal.

### The guest path never touches Signal's auth

`api/api.php` returns 401 before any dispatch when `$_SESSION['user_id']` is unset, and its CSRF
check reads `$_SESSION['csrf_token']` — neither of which a guest has. Rather than loosen the auth
gate every Signal request passes through, guests get **their own gateway**: `sb/api.php`
authenticates the `sb_guest` cookie against `sb_guest_sessions`, checks the guest's own CSRF token,
and then includes the *same* `api/storyboards.php` handler. One handler, two front doors, and
Signal's auth path is untouched.

The guest shell echoes the session's CSRF token into `<meta name="csrf-token">` and points the
client at its own gateway, so `uix/storyboards.js` runs unchanged in both shells.

The invite link is `/sb/?code=XXXX` — a query parameter, not a path segment, because `.htaccess`
rewrites only `^api/`, so `/sb/XXXX` would 404. The QR code encodes the same URL.

Guests have no `users` row and therefore no storage quota of their own; an image a guest uploads is
charged to the **storyboard owner's** account.

Access is decided per request: the owner always passes; anyone else passes only while their
membership is active **and** `joined_code_version` still equals the storyboard's `code_version`.
Rotating the codeword is therefore one UPDATE that locks every stale collaborator out atomically;
they see "the access code changed" and can rejoin by entering the new one. Deactivating the code
closes the storyboard. Join attempts are rate-limited and fail generically, so codes cannot be
enumerated.

The codeword is a shared meeting-level secret, not a password — it is stored readable so the owner
can share it, and it is protected by rate-limiting, entropy, and easy rotation.

---

## 5. UI surfaces

1. **Dashboard** — storyboard cards (owned + joined) carrying an arc strip, one segment per scene;
   status pills for open comments, an incomplete brief, and emptiness; New Storyboard; Join by code.
2. **Scene index** — the tile grid. Each tile is a frame with a caption under it: a live miniature
   of the scene rendered by the same markup and fit pass as the full canvas, an arc hue driven by
   position, a numeral chip, and status. Drag to reorder on a pointer, move mode on touch.
3. **Scene canvas** — one scene, fluid to the viewport, never boxed to 16:9. Text boxes and images
   interleave in one ordered sequence, each with a badge that doubles as a drag handle. Text scales
   to fill the stage. Team Notes sits alongside, with a full-width mode that drops it below.
4. **Codeword panel** (owner) — view/copy the code and invite link, rotate, deactivate, manage
   member roles.
5. **Delivery brief** — the nine questions that decide what the export is *for*; export is refused
   while any of the seven required answers is blank, and the refusal names what is missing.
6. **Export panel** — scope, whether to include review notes and images, download, history.
7. **Frameworks reference** — the communication-frameworks catalogue as reading material. It seeds
   nothing and writes nothing.

### Colour

Signal's accent stays the accent. Two additions, both as `--sb-*` tokens defined in all six theme
blocks so no theme falls through to the dark defaults:

- **The arc ramp `--sb-arc-1…6`** — a scene's *position* drives its hue, worn as the tile's top
  edge, its numeral chip, and a very low-alpha wash on the miniature. Position is real ordered data,
  so the hue carries information rather than decorating. Past six scenes the ramp cycles.
- **Status** — open comments and an incomplete brief need to read at a glance without opening
  anything.

They are deliberately *not* routed through `--accent-color`: the accent customiser overrides that
with `!important`, which would collapse the whole ramp onto whatever colour the user picked.

---

## 6. Blast radius

The module is self-contained; the shared files it touches are touched additively so a failure in
Storyboards cannot take down Tasks or Journal:

- `api/api.php` — one `case 'storyboards'`
- `index.php` — a tab button, a view container, a footer control group, script/style includes
- `uix/view-manager.js` — generalised past the two views it hardcodes in four places
- `uix/style.css` — the `--sb-*` token additions
