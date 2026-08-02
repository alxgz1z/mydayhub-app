# Encryption & Sharing — Diagnosis

Date: 2026-08-01
Scope: `incs/crypto.php`, `api/encryption.php`, `api/tasks.php` (share paths), `api/journal.php`, `uix/tasks.js`, `uix/crypto.js`
Reference: `incs/meta/spec.md` §1, §4 (Collaboration & Sharing), §5 (Zero-Knowledge Privacy), §13 (Non-Goals), §14 (Roadmap)

---

## First: the question that decides whether this diagnosis is complete

**Does the failure also happen with shared tasks that are NOT private?**

- **Only private ones break** → the diagnosis below is complete, and fixes A/B/C/E are the work.
- **Non-private shared tasks break too** → the root cause below does *not* explain what you're seeing.
  A non-private task's `encrypted_data` is plain JSON and the read path handles it fine. The likely other
  culprit is §14's own open item, *"Enforce permission-based UI restrictions for shared items"*, which is
  listed as an unfinished immediate priority.

Discriminator: **the owner sees a private task fine; only the recipient sees it broken.** Owned private
tasks are decrypted server-side at `tasks.php:1142`. Shared ones are not.

---

## Summary

One root cause sits behind most of the trouble:

> **Every encryption call site keys on the *requesting* user, never the *owning* user.**

`isEncryptionEnabled()` checks the caller's keys. `shouldEncrypt()` filters `WHERE ... AND user_id = <caller>`.
`handle_decrypt_task_data()` filters `WHERE ... AND user_id = <caller>`. Sharing is the only cross-user path
in the app, so it is the only place this assumption breaks — and it breaks in every direction at once.

Layered on top: the spec's own rule that **"only non-private items can be shared"** (§4) is **not enforced
anywhere in code**, so the exact state that triggers the breakage is freely reachable from the UI.

**None of this is a recent regression.** The uncommitted diffs in both `dev/` and `prod/` are purely the
MyDayHub→Signal rename (2-line header changes per file). This is the committed baseline. The recent
mail/Resend work is unrelated.

**Precondition:** all of this fires only when the **owner has completed encryption setup**. See finding #0 —
if they haven't, private tasks are stored as plaintext and sharing appears to work fine.

---

## Findings

### 0. `is_private = 1` without encryption setup stores plaintext at rest

`encryptIfPrivate()` → `shouldEncrypt()` → `if (!$this->isEncryptionEnabled()) return false;` → falls through
to `return json_encode($data);` (`crypto.php:258-259`, `:288-294`).

Encryption setup is **optional** by design (§5: *"optional and recommendation-based, not mandatory"*). So for
any user who never ran it, marking a task private sets a flag and **changes nothing about storage** — the
title and notes sit in the database as readable JSON.

This directly contradicts spec §1's stated core principle — *"plaintext never stored for private items"* —
and §14's *"✅ Encryption data path fixed."* It also means the sharing bugs below are invisible for such
users, which is likely why this has been inconsistent and hard to pin down.

### 1. Shared tasks are never decrypted — the recipient's card renders "Encrypted Task" forever

**Server side.** `api/tasks.php:1159-1161`, the "Shared with Me" loop:

```php
// For shared tasks, we don't decrypt them as they belong to other users
// The frontend will handle decryption if needed
$encryptedData = json_decode($task['encrypted_data'], true);
```

The raw envelope is shipped to the client untouched.

**Client side.** `uix/tasks.js:2609` detects it and renders a placeholder:

```js
if (data.encrypted && data.item_type === 'task') {
    taskTitle = 'Encrypted Task';
```

then schedules an async retry via `decryptTaskDataFrontend()` (`tasks.js:21`) → `getItemEncryptionKey()`
(`tasks.js:45`) → `GET /api/api.php?module=tasks&action=decryptTaskData`.

**That endpoint is owner-scoped.** `handle_decrypt_task_data` (`tasks.php:1242`):

```sql
SELECT encrypted_data FROM tasks WHERE task_id = :taskId AND user_id = :userId
```

A recipient always gets **404 "Task not found."** `decryptedData` is null, the re-render never happens, and
the card stays **"Encrypted Task"** permanently. The retry path is guaranteed to fail 100% of the time.

**Symptoms, precisely:**
- Task board, "Shared with Me" column: title reads **"Encrypted Task"**, no notes.
- Trust Relationships modal: title reads **"Untitled Task"** — a different code path
  (`tasks.php:2669`, `:2701`) that does `json_decode(...)['title'] ?? 'Untitled Task'` with no decrypt and
  no retry at all.

**Also dead:** `uix/crypto.js` exports `decryptTask()`/`decryptItem()` with **no caller anywhere** in
`uix/*.js`. The envelope formats are incompatible regardless — PHP writes
`{encrypted, item_type, item_id, encrypted_data, iv, tag}` as base64 (`crypto.php:129-137`); the JS expects
`{ciphertext, iv}` as byte arrays (`crypto.js:230-236`).

### 2. Nothing stops you sharing a private task

Spec §4: *"Only non-private items can be shared."*

`handle_share_task()` (`tasks.php:1907`) validates: task exists, caller owns it, subscription allows sharing,
recipient exists, not self-share, not already shared. It **never checks `is_private`**.

The reverse is equally unguarded:
- `toggle_privacy` (`tasks.php:732`) does not check for rows in `shared_items`.
- Column privacy inheritance (`tasks.php:823-841`) mass-encrypts **every** task in a column — including
  shared ones — via a blanket `UPDATE tasks SET is_private = 1, privacy_inherited = 1`.

Three routes into the broken state, no warning on any of them.

### 3. A recipient with edit permission corrupts the task on save — CONFIRMED reachable

`handle_update_task` (`tasks.php:915-931`) explicitly authorizes recipients:

```sql
CASE WHEN t.user_id = ? THEN 'owner'
     WHEN s.permission = 'edit' THEN 'edit'
     ELSE 'view' END as access_level
...
LEFT JOIN shared_items s ON s.item_id = t.task_id AND s.item_type = 'task' AND s.recipient_id = ?
```

Only `'view'` is rejected. An `'edit'` recipient proceeds to `tasks.php:935` and `:941`:

```php
$currentData = decryptTaskData($pdo, $userId, $taskId, $task['encrypted_data']) ?: [];
$currentData['notes'] = $notes;
$newDataJson = encryptTaskData($pdo, $userId, $taskId, $currentData);
```

Both calls pass the **recipient's** `$userId`. Two outcomes, both bad:

- **Recipient has encryption set up:** decrypt *succeeds* — `getItemKey()` (`crypto.php:237`) looks up
  `WHERE item_type = ? AND item_id = ?` with **no user scoping**, so it happily hands over the owner's DEK.
  Then `shouldEncrypt()` finds no `tasks` row for the recipient → returns false → the task is **written back
  as plaintext**, silently dropping out of encryption while `is_private` stays `1`.
- **Recipient has no encryption set up:** `decryptItem()` early-returns at `crypto.php:150` and hands back
  **the envelope object itself**. `?: []` doesn't catch it (it's truthy). `notes` is appended to the
  *envelope*, and the whole thing is written as plaintext. The original title/notes survive inside the
  nested `encrypted_data` field, so the owner's next read still decrypts — but **the recipient's edit is
  silently discarded**.

### 4. Failures are structurally silent

`crypto.php:302`:

```php
return $decrypted ?: json_decode($encryptedData, true);
```

The `?:` swallows every decryption failure and returns the **envelope array**, which is truthy.
`tasks.php:1145` then re-encodes that into `encrypted_data` and ships it onward. **A failed decrypt is
indistinguishable from a successful one downstream.** Same shape at `crypto.php:150`.

This is why the feature has been so hard to debug: nothing throws, nothing logs an error, nothing 500s.
The data just quietly turns into the wrong shape.

### 5. The zero-knowledge layer is not zero-knowledge

- DEKs are stored **unwrapped** in `item_encryption_keys.wrapped_dek` — plain base64 of 32 random bytes.
  The code says so: *"in a real system, you'd encrypt it with master key first"* (`crypto.php:210`, `:219`).
- The client-derived `wrapped_master_key` in `user_encryption_keys` is written by `handle_setup_encryption()`
  and **never read by any encrypt or decrypt path**. `getUserEncryptionKeys()` fetches it, then
  `initCryptoManager()` sets `$this->cryptoManager = true` and discards it (`crypto.php:83-86`).
- Net effect: `user_encryption_keys` is a **boolean "encryption is on" flag** (`isEncryptionEnabled()` just
  tests row existence), and the server stores key and ciphertext side by side in the same database.

Two consequences:
- **Good news for the fix:** there is no real key hierarchy, so making sharing work does *not* require
  asymmetric key exchange. The server can already decrypt anything.
- **Bad news for the docs:** §5's "zero-knowledge" framing and §14's *"✅ Encryption data path fixed — Task
  payloads are encrypted end-to-end for private items"* are both inaccurate as written.

### 6. Journal sharing does not exist

`api/journal.php` contains **no** share / `shared_items` code. `shared_items.item_type` is written as
`'task'` at the only insert site (`tasks.php:2006`) and read as `= 'task'` everywhere else.

Sharing journal entries is **unimplemented**, not broken. Journal entries do use `CryptoEngine`
(`journal.php:688, 1125, 1140`), so findings #0, #4 and #5 apply to them — but #1, #2 and #3 cannot fire
because there is no cross-user path.

### 7. Task migration never completes

`handle_migrate_tasks()` (`encryption.php:185`) sets `migration_status = 'in_progress'`, returns the list of
tasks to migrate, and **never migrates anything or marks it `completed`**. `tasks_migrated` is never
incremented. Once triggered, status is permanently `in_progress`.

### 8. Minor: `item_encryption_keys` has no user scoping or cleanup

Keyed on `(item_type, item_id)` only — which is exactly what lets a recipient's decrypt silently succeed in
#3. No visible uniqueness constraint, and no delete-cascade when a task is removed, so orphan keys accumulate.

---

## Recommended direction

§13 explicitly defers *"End-to-end encrypted sharing with asymmetric keys"*; §14 puts it in **Medium term**.
So the cheap, spec-aligned fix is to **enforce the mutual exclusion the spec already states**, not to build
key exchange:

- **A.** `handle_share_task()`: reject sharing a task with `is_private = 1`, with a clear message.
- **B.** `toggle_privacy`: when a task has rows in `shared_items`, block or prompt. §5 already mentions
  *"shared task conflict resolution with user confirmation"* — that is the intended UX, and it is unimplemented.
- **C.** Column privacy inheritance: skip shared tasks, or surface them in the confirmation.
- **D.** Reconcile existing violators — rows that are both `is_private = 1` and present in `shared_items`.
  Needs the DB counts below to size, **and** finding #3 means some may already hold nested-envelope garbage.
- **E.** Make failure loud: drop the `?:` fallback at `crypto.php:302` and the `isEncryptionEnabled()`
  early-return at `:150`. This alone would have surfaced everything above long ago.
- **F.** Delete the dead paths (`uix/crypto.js` encrypt/decrypt, `decryptTaskDataFrontend`'s guaranteed-404
  retry) and correct §1/§5/§14's inaccurate claims.

**Alternative, if the actual goal is "share a private task and have the recipient read it":** because DEKs
are server-held anyway (#5), this is a *small* change rather than asymmetric crypto — key `CryptoEngine` on
the **owner's** user ID for shared items instead of the caller's. But it must be done on **both** directions:
finding #3 confirms recipients can write, so fixing only the read path leaves the silent-plaintext write in
place. It also contradicts §4 as written, so the spec would need updating to match.

---

## UPDATE 2026-08-01 — fix applied, and what the counts revealed

The owner-keying fix is implemented and verified (commit "Key item encryption on the owner, not
the requester"). Verified against live data: a user with **no encryption keys of their own** now reads
a private task's real title instead of the envelope; a corrupt payload returns null instead of silently
succeeding; and fields stranded outside the envelope by the old recipient-write bug are recovered.

**But the live counts change the conclusion about what Alex is experiencing:**

| metric | count |
|---|---|
| private tasks | 1 |
| tasks stored as ciphertext | 1 |
| **shared AND private** | **0** |
| private but stored as plaintext (finding #0) | 0 |
| users with encryption keys | 3 of 5 |
| shares total | 1 (task 15, **not private**, permission `edit`) |

**No task is currently both shared and private.** So the bug fixed here — real, reachable, and now
closed — does **not** explain a present-day "sharing doesn't work well" complaint. The only live share
is a non-private task whose payload is plain JSON and always rendered correctly.

That means the answer to the headline question above is very likely *"yes, it fails with non-private
shared tasks too"* — which points at §14's own open item, **"Enforce permission-based UI restrictions
for shared items,"** not at encryption. That is the next thing to investigate.

---

## Not yet verified

A read-only count against the live prod DB was blocked by the sandbox permission classifier. To size the
existing damage:

```sql
SELECT 'total_tasks' k, COUNT(*) v FROM tasks WHERE deleted_at IS NULL
UNION ALL SELECT 'private_tasks',    COUNT(*) FROM tasks WHERE is_private=1 AND deleted_at IS NULL
UNION ALL SELECT 'ciphertext_tasks', COUNT(*) FROM tasks WHERE encrypted_data LIKE '%"encrypted":true%' AND deleted_at IS NULL
UNION ALL SELECT 'shares_total',     COUNT(*) FROM shared_items
-- private+shared, but only actually-broken if the OWNER has encryption enabled:
UNION ALL SELECT 'shared_private_owner_encrypted', COUNT(*)
    FROM shared_items s
    JOIN tasks t ON t.task_id = s.item_id
    JOIN user_encryption_keys k ON k.user_id = t.user_id
    WHERE s.item_type='task' AND t.is_private=1 AND t.deleted_at IS NULL
-- private but stored as plaintext (finding #0) — a spec violation, not a sharing break:
UNION ALL SELECT 'private_no_encryption_setup', COUNT(*)
    FROM tasks t LEFT JOIN user_encryption_keys k ON k.user_id = t.user_id
    WHERE t.is_private=1 AND t.deleted_at IS NULL AND k.user_id IS NULL
UNION ALL SELECT 'users_with_enc_keys', COUNT(*) FROM user_encryption_keys
UNION ALL SELECT 'item_enc_keys',       COUNT(*) FROM item_encryption_keys;
```

`shared_private_owner_encrypted` is the count of tasks currently rendering as "Encrypted Task" in someone's
board. `private_no_encryption_setup` is the count sitting in plaintext despite the privacy flag.
