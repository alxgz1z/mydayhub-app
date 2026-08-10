<?php
/**
 * Code for /incs/sb_access.php
 *
 * Signal - Storyboards access and identity
 *
 * Everything about *who is asking* and *what they may do* in the Storyboards
 * view. Two kinds of person reach this feature — a logged-in Signal account and
 * a codeword guest with no account at all — and they arrive through two
 * different gateways. This file is what makes them one thing to everything
 * downstream: an actor with a participant id.
 *
 * @version 8.8 Samara
 * @author Alex & Claude
 */

declare(strict_types=1);

/** How long a guest stays signed in to a storyboard. */
define('SB_GUEST_SESSION_DAYS', 30);

/** Cookie carrying the guest's opaque session token. */
define('SB_GUEST_COOKIE', 'sb_guest');

/** Failed join attempts allowed from one IP inside the window. */
define('SB_JOIN_MAX_ATTEMPTS', 10);
define('SB_JOIN_WINDOW_MINUTES', 15);

/**
 * Anything that should become a clean HTTP response rather than a 500.
 *
 * The code path from "an action was requested" to "the caller may not do that"
 * runs through several helpers, and threading an error return through all of
 * them made every caller responsible for a check it usually forgot. Throwing
 * puts the refusal where the reason is known.
 */
class SbException extends Exception {
	private int $httpCode;

	public function __construct(string $message, int $httpCode = 400) {
		parent::__construct($message);
		$this->httpCode = $httpCode;
	}

	public function getHttpCode(): int {
		return $this->httpCode;
	}
}

/* ==========================================================================
   Identity
   ========================================================================== */

/**
 * The participant row for a Signal account, created on first use.
 *
 * Accounts do not get a participant row at registration: most Signal users
 * never open this tab, and a table of rows for people who have never used the
 * feature is a table that lies about who is involved.
 */
function sb_participant_for_user(PDO $pdo, int $userId): array {
	$stmt = $pdo->prepare(
		"SELECT p.participant_id, p.user_id, p.display_name, p.is_guest, u.username
		 FROM sb_participants p
		 JOIN users u ON u.user_id = p.user_id
		 WHERE p.user_id = :userId"
	);
	$stmt->execute([':userId' => $userId]);
	$row = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($row !== false) {
		// The display name is a copy of the username, so it has to follow a
		// rename — otherwise the author line on old and new content disagrees.
		if ($row['display_name'] !== $row['username']) {
			$upd = $pdo->prepare("UPDATE sb_participants SET display_name = :name WHERE participant_id = :pid");
			$upd->execute([':name' => $row['username'], ':pid' => $row['participant_id']]);
			$row['display_name'] = $row['username'];
		}
		return [
			'participant_id' => (int)$row['participant_id'],
			'user_id'        => (int)$row['user_id'],
			'display_name'   => (string)$row['display_name'],
			'is_guest'       => false,
		];
	}

	$stmt = $pdo->prepare("SELECT username FROM users WHERE user_id = :userId");
	$stmt->execute([':userId' => $userId]);
	$username = $stmt->fetchColumn();
	if ($username === false) {
		throw new SbException('User not found.', 404);
	}

	$ins = $pdo->prepare(
		"INSERT INTO sb_participants (user_id, display_name, is_guest, created_at)
		 VALUES (:userId, :name, 0, UTC_TIMESTAMP())"
	);
	$ins->execute([':userId' => $userId, ':name' => $username]);

	return [
		'participant_id' => (int)$pdo->lastInsertId(),
		'user_id'        => $userId,
		'display_name'   => (string)$username,
		'is_guest'       => false,
	];
}

/**
 * The actor behind a guest cookie, or null if there is no valid session.
 *
 * Returning null rather than throwing is deliberate: the guest gateway needs to
 * tell "no session yet, show the join screen" apart from "session rejected".
 */
function sb_participant_for_guest_cookie(PDO $pdo): ?array {
	$token = $_COOKIE[SB_GUEST_COOKIE] ?? '';
	if (!is_string($token) || $token === '') {
		return null;
	}

	$stmt = $pdo->prepare(
		"SELECT s.session_id, s.csrf_token, p.participant_id, p.display_name
		 FROM sb_guest_sessions s
		 JOIN sb_participants p ON p.participant_id = s.participant_id
		 WHERE s.token_hash = :hash AND s.expires_at > UTC_TIMESTAMP()"
	);
	$stmt->execute([':hash' => hash('sha256', $token)]);
	$row = $stmt->fetch(PDO::FETCH_ASSOC);
	if ($row === false) {
		return null;
	}

	$touch = $pdo->prepare("UPDATE sb_guest_sessions SET last_seen_at = UTC_TIMESTAMP() WHERE session_id = :sid");
	$touch->execute([':sid' => $row['session_id']]);

	return [
		'participant_id' => (int)$row['participant_id'],
		'user_id'        => null,
		'display_name'   => (string)$row['display_name'],
		'is_guest'       => true,
		'csrf_token'     => (string)$row['csrf_token'],
	];
}

/**
 * Create a guest participant and sign them in.
 *
 * The cookie value is random and opaque; only its hash is stored, so a dump of
 * sb_guest_sessions cannot be replayed as a login. The CSRF token is minted
 * here because guests have no $_SESSION for Signal's usual token to live in.
 *
 * @return array{participant_id:int, token:string, csrf_token:string}
 */
function sb_create_guest_session(PDO $pdo, string $displayName): array {
	$displayName = trim($displayName);
	if ($displayName === '') {
		throw new SbException('A display name is required to join as a guest.', 400);
	}
	if (mb_strlen($displayName) > 100) {
		$displayName = mb_substr($displayName, 0, 100);
	}

	$ins = $pdo->prepare(
		"INSERT INTO sb_participants (user_id, display_name, is_guest, created_at)
		 VALUES (NULL, :name, 1, UTC_TIMESTAMP())"
	);
	$ins->execute([':name' => $displayName]);
	$participantId = (int)$pdo->lastInsertId();

	$token = bin2hex(random_bytes(32));
	$csrf  = bin2hex(random_bytes(32));

	$stmt = $pdo->prepare(
		"INSERT INTO sb_guest_sessions (participant_id, token_hash, csrf_token, created_at, expires_at, user_agent)
		 VALUES (:pid, :hash, :csrf, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL :days DAY), :ua)"
	);
	$stmt->execute([
		':pid'  => $participantId,
		':hash' => hash('sha256', $token),
		':csrf' => $csrf,
		':days' => SB_GUEST_SESSION_DAYS,
		':ua'   => mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
	]);

	return ['participant_id' => $participantId, 'token' => $token, 'csrf_token' => $csrf];
}

/**
 * Put the guest session token in the browser.
 *
 * HttpOnly so script cannot read it, SameSite=Lax so following an invite link
 * still arrives signed in, Secure whenever the request came over HTTPS.
 */
function sb_set_guest_cookie(string $token): void {
	setcookie(SB_GUEST_COOKIE, $token, [
		'expires'  => time() + (SB_GUEST_SESSION_DAYS * 86400),
		'path'     => '/',
		'secure'   => !empty($_SERVER['HTTPS']) || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https',
		'httponly' => true,
		'samesite' => 'Lax',
	]);
}

/* ==========================================================================
   Codewords
   ========================================================================== */

/**
 * A readable three-word codeword, e.g. "latam-amber-quartz".
 *
 * Readable because it gets said out loud in a meeting and typed from a slide.
 * Three words from these lists is roughly 2^20 combinations, which is thin
 * against an unlimited attacker and ample against a rate-limited one — which is
 * why sb_check_join_rate_limit() is not optional decoration.
 */
function sb_generate_codeword(): string {
	$places = ['latam', 'nordic', 'delta', 'harbor', 'summit', 'atlas', 'meadow', 'canyon', 'orbit', 'pacific', 'tundra', 'basin'];
	$colors = ['amber', 'cobalt', 'crimson', 'indigo', 'jade', 'ivory', 'olive', 'saffron', 'slate', 'teal', 'violet', 'coral'];
	$things = ['quartz', 'lantern', 'compass', 'ember', 'falcon', 'harbor', 'juniper', 'meridian', 'pillar', 'signal', 'thistle', 'anchor'];

	return $places[random_int(0, count($places) - 1)]
		. '-' . $colors[random_int(0, count($colors) - 1)]
		. '-' . $things[random_int(0, count($things) - 1)];
}

/**
 * A codeword nobody else is currently using.
 *
 * The unique index is the real guarantee; this only keeps the common case from
 * having to hit it.
 */
function sb_unique_codeword(PDO $pdo): string {
	for ($i = 0; $i < 10; $i++) {
		$code = sb_generate_codeword();
		$stmt = $pdo->prepare("SELECT 1 FROM sb_storyboards WHERE active_code = :code");
		$stmt->execute([':code' => $code]);
		if ($stmt->fetchColumn() === false) {
			return $code;
		}
	}
	// Every candidate collided, which at this table size means something is
	// wrong rather than unlucky. A suffix guarantees an answer either way.
	return sb_generate_codeword() . '-' . bin2hex(random_bytes(2));
}

function sb_client_ip(): string {
	$forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
	if ($forwarded !== '') {
		$first = trim(explode(',', $forwarded)[0]);
		if ($first !== '') {
			return mb_substr($first, 0, 45);
		}
	}
	return mb_substr((string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
}

/**
 * Refuse a caller who has been guessing codewords.
 *
 * Only failures count. Someone rejoining after a rotation, or a team of ten
 * behind one office NAT all typing the code correctly, is not an attack and
 * should never be told to wait.
 */
function sb_check_join_rate_limit(PDO $pdo): void {
	$ip = sb_client_ip();

	$stmt = $pdo->prepare(
		"SELECT COUNT(*) FROM sb_join_attempts
		 WHERE ip_address = :ip AND succeeded = 0
		   AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL :mins MINUTE)"
	);
	$stmt->execute([':ip' => $ip, ':mins' => SB_JOIN_WINDOW_MINUTES]);

	if ((int)$stmt->fetchColumn() >= SB_JOIN_MAX_ATTEMPTS) {
		throw new SbException('Too many attempts. Wait a few minutes and try again.', 429);
	}
}

function sb_record_join_attempt(PDO $pdo, bool $succeeded): void {
	$stmt = $pdo->prepare(
		"INSERT INTO sb_join_attempts (ip_address, succeeded, created_at) VALUES (:ip, :ok, UTC_TIMESTAMP())"
	);
	$stmt->execute([':ip' => sb_client_ip(), ':ok' => $succeeded ? 1 : 0]);

	// Opportunistic pruning — the table is a rate-limit window, not a log, and
	// nothing here is worth a cron entry.
	if (random_int(1, 50) === 1) {
		$pdo->exec("DELETE FROM sb_join_attempts WHERE created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY)");
	}
}

/* ==========================================================================
   Authorization
   ========================================================================== */

/**
 * What this actor may do with this storyboard.
 *
 * The rule, evaluated fresh on every request:
 *
 *  - the owner always passes; ownership is held by account, so rotating the
 *    code can never lock an owner out of their own work;
 *  - anyone else passes only while their membership is active AND their
 *    joined_code_version still matches the storyboard's.
 *
 * That second clause is the whole point of the codeword design. Rotating is one
 * UPDATE that bumps code_version, and every stale collaborator is locked out
 * atomically — no session sweep, no row-by-row revocation.
 *
 * Two states are reported rather than thrown, because the UI has something
 * specific to say about each: `stale` (the code moved on — enter the new one)
 * and `closed` (the owner deactivated the code).
 *
 * @return array{storyboard:array, role:string, access:string}
 */
function sb_resolve_access(PDO $pdo, int $storyboardId, array $actor): array {
	$stmt = $pdo->prepare(
		"SELECT s.*, p.display_name AS owner_name, p.user_id AS owner_user_id
		 FROM sb_storyboards s
		 JOIN sb_participants p ON p.participant_id = s.owner_participant_id
		 WHERE s.storyboard_id = :sid"
	);
	$stmt->execute([':sid' => $storyboardId]);
	$storyboard = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($storyboard === false) {
		throw new SbException('Storyboard not found.', 404);
	}

	$isOwner = (int)$storyboard['owner_participant_id'] === (int)$actor['participant_id'];

	if ($isOwner) {
		// Archiving makes a storyboard read-only for everyone, its owner
		// included: an archived document you can still edit is not archived.
		return [
			'storyboard' => $storyboard,
			'role'       => 'owner',
			'access'     => $storyboard['status'] === 'archived' ? 'read' : 'write',
		];
	}

	$stmt = $pdo->prepare(
		"SELECT * FROM sb_memberships WHERE storyboard_id = :sid AND participant_id = :pid"
	);
	$stmt->execute([':sid' => $storyboardId, ':pid' => $actor['participant_id']]);
	$membership = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($membership === false || $membership['status'] !== 'active') {
		throw new SbException('You do not have access to this storyboard.', 403);
	}

	// A closed storyboard (the owner deactivated the code) freezes all non-owner
	// access, and an archived one is read-only for everyone.
	if ($storyboard['access_code'] === null) {
		return ['storyboard' => $storyboard, 'role' => $membership['role'], 'access' => 'closed'];
	}

	if ((int)$membership['joined_code_version'] !== (int)$storyboard['code_version']) {
		return ['storyboard' => $storyboard, 'role' => $membership['role'], 'access' => 'stale'];
	}

	$access = 'read';
	if ($membership['role'] === 'editor' && $storyboard['status'] !== 'archived') {
		$access = 'write';
	}

	return ['storyboard' => $storyboard, 'role' => $membership['role'], 'access' => $access];
}

/**
 * Resolve access and refuse anything short of what the action needs.
 *
 * $need is 'read', 'write' or 'own'. Every handler that touches a storyboard
 * starts here, so an action can never reach data by forgetting a check.
 */
function sb_require_access(PDO $pdo, int $storyboardId, array $actor, string $need = 'read'): array {
	$resolved = sb_resolve_access($pdo, $storyboardId, $actor);

	if ($resolved['access'] === 'stale') {
		throw new SbException("This storyboard's access code changed — enter the new code to rejoin.", 409);
	}
	if ($resolved['access'] === 'closed') {
		throw new SbException('This storyboard is closed. Ask the owner to share a new code.', 403);
	}
	if ($need === 'own' && $resolved['role'] !== 'owner') {
		throw new SbException('Only the storyboard owner can do that.', 403);
	}
	if ($need === 'write' && $resolved['access'] !== 'write') {
		throw new SbException(
			$resolved['storyboard']['status'] === 'archived'
				? 'This storyboard is archived. Restore it to make changes.'
				: 'You have view-only access to this storyboard.',
			403
		);
	}

	return $resolved;
}

/**
 * Resolve the storyboard a scene belongs to, and check access in one step.
 *
 * Scene-level actions take a scene id, not a storyboard id, so without this the
 * scoping check ("is this scene even in a storyboard you can see?") is one a
 * handler has to remember to write.
 *
 * @return array{scene:array, storyboard:array, role:string, access:string}
 */
function sb_require_scene_access(PDO $pdo, int $sceneId, array $actor, string $need = 'read'): array {
	$stmt = $pdo->prepare("SELECT * FROM sb_scenes WHERE scene_id = :sceneId");
	$stmt->execute([':sceneId' => $sceneId]);
	$scene = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($scene === false) {
		throw new SbException('Scene not found.', 404);
	}

	$resolved = sb_require_access($pdo, (int)$scene['storyboard_id'], $actor, $need);
	$resolved['scene'] = $scene;

	return $resolved;
}

/* ==========================================================================
   Audit
   ========================================================================== */

/**
 * Record something worth being able to look back at: rotations, joins, exports.
 *
 * Never allowed to break the action it describes — a storyboard that refuses to
 * export because its audit row failed to write would be a worse product than
 * one with a gap in its history.
 */
function sb_log_event(PDO $pdo, ?int $storyboardId, ?int $participantId, string $kind, ?string $detail = null): void {
	try {
		$stmt = $pdo->prepare(
			"INSERT INTO sb_events (storyboard_id, participant_id, kind, detail, created_at)
			 VALUES (:sid, :pid, :kind, :detail, UTC_TIMESTAMP())"
		);
		$stmt->execute([
			':sid'    => $storyboardId,
			':pid'    => $participantId,
			':kind'   => $kind,
			':detail' => $detail,
		]);
	} catch (Throwable $e) {
		if (function_exists('log_debug_message')) {
			log_debug_message('sb_log_event failed: ' . $e->getMessage());
		}
	}
}
