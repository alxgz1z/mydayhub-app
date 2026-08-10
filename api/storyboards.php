<?php
/**
 * Code for /api/storyboards.php
 *
 * Signal - Storyboards Module Handler
 *
 * Every action behind the Storyboards view. Reached from two gateways — the
 * app's /api/api.php for signed-in accounts and /sb/api.php for codeword guests
 * — which differ only in how they establish the actor. Both hand this file an
 * actor array with a participant_id, and from here on the two are the same.
 *
 * Contract: every handler RETURNS its payload; nothing echoes or exits. An
 * 'http_code' key on the returned array is the status the gateway should send
 * and is stripped before the body goes out.
 *
 * @version 8.8 Samara
 * @author Alex & Claude
 */

declare(strict_types=1);

require_once __DIR__ . '/../incs/sb_access.php';
require_once __DIR__ . '/sb_export.php';

/** Reference images live alongside Signal's task attachments. */
define('SB_IMAGE_DIR', __DIR__ . '/../media/imgs/');
define('SB_IMAGE_URL_BASE', 'media/imgs/');
define('SB_MAX_IMAGES_PER_SCENE', 4);
define('SB_MAX_IMAGE_BYTES', 5 * 1024 * 1024);
define('SB_ALLOWED_IMAGE_MIMES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

/** The frameworks reference doc, read-only reading material (§7). */
define('SB_FRAMEWORK_FILE', __DIR__ . '/../storage/frameworks/Business_Communication_Frameworks.md');

/**
 * The delivery brief, defined once.
 *
 * The scenes carry *what* is being said. The brief carries *the situation it is
 * said into* — the same scenes make a very different artifact for fifteen
 * minutes with a VP than for a document someone reads alone.
 *
 * The form renders from this list, the exported header is generated from it, and
 * the completeness check counts against it, so a field cannot be required in one
 * place and forgotten in another. Order is the form's order and the header's.
 *
 * The placeholders are an invented, generic stalled-project scenario. They ship
 * to every user and render on every storyboard: an example seeded from a real
 * engagement would publish that detail to everyone who opens the form.
 */
function sb_brief_fields(): array {
	return [
		[
			'key' => 'audience', 'label' => 'Audience', 'required' => true, 'multiline' => true,
			'hint' => 'Who they are, their seniority, and what they already know.',
			'placeholder' => 'Three department heads and the finance partner. They know the project exists, not why it stalled.',
		],
		[
			'key' => 'desired_outcome', 'label' => 'Desired outcome', 'required' => true, 'multiline' => true,
			'hint' => 'What they should think, decide or do afterwards — what the agent builds towards.',
			'placeholder' => 'They approve the revised timeline and name one owner per workstream.',
		],
		[
			'key' => 'modality', 'label' => 'Modality', 'required' => true, 'multiline' => true,
			'hint' => 'Presented live, read alone, sent ahead — how much the artifact must carry by itself.',
			'placeholder' => 'Presented live over video; the deck is sent afterwards as the record.',
		],
		[
			'key' => 'presenter', 'label' => 'Presenter', 'required' => true, 'multiline' => false,
			'hint' => 'Who delivers it — sets the voice.',
			'placeholder' => 'The programme lead.',
		],
		[
			'key' => 'delivery_format', 'label' => 'Format', 'required' => true, 'multiline' => false,
			'hint' => 'The artifact to produce.',
			'placeholder' => 'Slide deck.',
		],
		[
			'key' => 'time_constraint', 'label' => 'Time constraint', 'required' => true, 'multiline' => false,
			'hint' => 'What sizes the deliverable.',
			'placeholder' => '20 minutes, plus questions.',
		],
		[
			'key' => 'target_language', 'label' => 'Target language', 'required' => true, 'multiline' => false,
			'hint' => 'Language, and any regional variant.',
			'placeholder' => 'English (UK).',
		],
		[
			'key' => 'tone', 'label' => 'Tone', 'required' => false, 'multiline' => false,
			'hint' => 'Optional. The register to write in.',
			'placeholder' => 'Direct and unhurried. No jargon.',
		],
		[
			'key' => 'sensitivities', 'label' => 'Sensitivities and constraints', 'required' => false, 'multiline' => true,
			'hint' => 'Optional. What to avoid, omit or handle carefully — the one thing an agent cannot infer.',
			'placeholder' => 'Do not name the vendor. Headcount numbers stay out.',
		],
	];
}

/** Required brief answers still blank, by label. */
function sb_brief_missing(array $storyboard): array {
	$missing = [];
	foreach (sb_brief_fields() as $field) {
		if (!$field['required']) continue;
		if (trim((string)($storyboard[$field['key']] ?? '')) === '') {
			$missing[] = $field['label'];
		}
	}
	return $missing;
}

/* ==========================================================================
   Router
   ========================================================================== */

function handle_storyboards_action(string $action, string $method, PDO $pdo, array $actor, array $data): array {
	try {
		switch ($action) {
			// Documents
			case 'listStoryboards':    return sb_list_storyboards($pdo, $actor);
			case 'createStoryboard':   return sb_create_storyboard($pdo, $actor, $data);
			case 'getStoryboard':      return sb_get_storyboard($pdo, $actor, $data);
			case 'updateStoryboard':   return sb_update_storyboard($pdo, $actor, $data);
			case 'deleteStoryboard':   return sb_delete_storyboard($pdo, $actor, $data);

			// Codeword and members
			case 'lookupCode':         return sb_lookup_code($pdo, $actor, $data);
			case 'joinByCode':         return sb_join_by_code($pdo, $actor, $data);
			case 'rotateCode':         return sb_rotate_code($pdo, $actor, $data);
			case 'deactivateCode':     return sb_deactivate_code($pdo, $actor, $data);
			case 'listMembers':        return sb_list_members($pdo, $actor, $data);
			case 'updateMember':       return sb_update_member($pdo, $actor, $data);

			// Scenes
			case 'listScenes':         return sb_list_scenes($pdo, $actor, $data);
			case 'getScene':           return sb_get_scene($pdo, $actor, $data);
			case 'createScene':        return sb_create_scene($pdo, $actor, $data);
			case 'updateScene':        return sb_update_scene($pdo, $actor, $data);
			case 'deleteScene':        return sb_delete_scene($pdo, $actor, $data);
			case 'reorderScenes':      return sb_reorder_scenes($pdo, $actor, $data);

			// Scene content
			case 'createText':         return sb_create_text($pdo, $actor, $data);
			case 'updateText':         return sb_update_text($pdo, $actor, $data);
			case 'deleteText':         return sb_delete_text($pdo, $actor, $data);
			case 'uploadImage':        return sb_upload_image($pdo, $actor, $data);
			case 'updateImage':        return sb_update_image($pdo, $actor, $data);
			case 'deleteImage':        return sb_delete_image($pdo, $actor, $data);
			case 'reorderElements':    return sb_reorder_elements($pdo, $actor, $data);
			case 'moveElement':        return sb_move_element($pdo, $actor, $data);

			// Review log
			case 'listComments':       return sb_list_comments($pdo, $actor, $data);
			case 'createComment':      return sb_create_comment($pdo, $actor, $data);
			case 'updateComment':      return sb_update_comment($pdo, $actor, $data);
			case 'deleteComment':      return sb_delete_comment($pdo, $actor, $data);

			// Brief, export, reference
			case 'getBriefSchema':     return ['status' => 'success', 'data' => ['fields' => sb_brief_fields()]];
			case 'updateBrief':        return sb_update_brief($pdo, $actor, $data);
			case 'exportStoryboard':   return sb_export_storyboard($pdo, $actor, $data);
			case 'listExports':        return sb_list_exports($pdo, $actor, $data);
			case 'getExport':          return sb_get_export($pdo, $actor, $data);
			case 'getFrameworks':      return sb_get_frameworks();

			default:
				return ['status' => 'error', 'message' => "Action '{$action}' not found in storyboards module.", 'http_code' => 404];
		}
	} catch (SbException $e) {
		return ['status' => 'error', 'message' => $e->getMessage(), 'http_code' => $e->getHttpCode()];
	} catch (Throwable $e) {
		if (function_exists('log_debug_message')) {
			log_debug_message('storyboards: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
		}
		error_log('storyboards: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
		return ['status' => 'error', 'message' => 'An internal server error occurred.', 'http_code' => 500];
	}
}

/* ==========================================================================
   Small shared helpers
   ========================================================================== */

function sb_ok($data = null): array {
	return $data === null ? ['status' => 'success'] : ['status' => 'success', 'data' => $data];
}

function sb_int($data, string $key): int {
	$value = $data[$key] ?? 0;
	if (!is_numeric($value) || (int)$value <= 0) {
		throw new SbException("A valid {$key} is required.", 400);
	}
	return (int)$value;
}

function sb_str($data, string $key, int $max = 255, bool $required = false): string {
	$value = trim((string)($data[$key] ?? ''));
	if ($required && $value === '') {
		throw new SbException(ucfirst(str_replace('_', ' ', $key)) . ' is required.', 400);
	}
	return mb_substr($value, 0, $max);
}

/**
 * Where a newly added element goes: the end of the scene's list.
 *
 * Text boxes and images share one 0..N-1 sequence across two tables, so taking
 * the max over one table hands the new element a number the other table already
 * holds. Nothing fails when that happens — the two just tie, sort by id, and the
 * element silently lands in the wrong place. Hence one helper, used by both.
 */
function sb_next_element_seq(PDO $pdo, int $sceneId): int {
	$stmt = $pdo->prepare(
		"SELECT GREATEST(
			COALESCE((SELECT MAX(sort_order) FROM sb_scene_texts  WHERE scene_id = :sid1), -1),
			COALESCE((SELECT MAX(sort_order) FROM sb_scene_assets WHERE scene_id = :sid2), -1)
		) AS max_seq"
	);
	$stmt->execute([':sid1' => $sceneId, ':sid2' => $sceneId]);

	return (int)$stmt->fetchColumn() + 1;
}

/**
 * Close the gaps a delete leaves, so the badges on the canvas read 1, 2, 3
 * rather than 1, 3, 4.
 */
function sb_resequence_scene(PDO $pdo, int $sceneId): void {
	$stmt = $pdo->prepare(
		"SELECT 'text' AS kind, text_id AS id, sort_order FROM sb_scene_texts WHERE scene_id = :sid1
		 UNION ALL
		 SELECT 'image' AS kind, asset_id AS id, sort_order FROM sb_scene_assets WHERE scene_id = :sid2
		 ORDER BY sort_order, id"
	);
	$stmt->execute([':sid1' => $sceneId, ':sid2' => $sceneId]);
	$elements = $stmt->fetchAll(PDO::FETCH_ASSOC);

	$updateText  = $pdo->prepare("UPDATE sb_scene_texts  SET sort_order = :seq WHERE text_id  = :id");
	$updateImage = $pdo->prepare("UPDATE sb_scene_assets SET sort_order = :seq WHERE asset_id = :id");

	foreach ($elements as $index => $element) {
		if ((int)$element['sort_order'] === $index) continue;
		$stmt = $element['kind'] === 'text' ? $updateText : $updateImage;
		$stmt->execute([':seq' => $index, ':id' => (int)$element['id']]);
	}
}

/**
 * A storyboard's scene ids and positions, both ways round.
 *
 * Cross-references are STORED against scene ids (`<<@12>>`) so reordering never
 * repoints them, and are READ AND WRITTEN as positions (`<<3>>`) because that is
 * what an author can see on the screen. Every conversion in either direction
 * goes through this map.
 */
function sb_scene_position_maps(PDO $pdo, int $storyboardId): array {
	$stmt = $pdo->prepare("SELECT scene_id, position FROM sb_scenes WHERE storyboard_id = :sid");
	$stmt->execute([':sid' => $storyboardId]);

	$idToPosition = [];
	$positionToId = [];
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
		$idToPosition[(int)$row['scene_id']] = (int)$row['position'];
		$positionToId[(int)$row['position']] = (int)$row['scene_id'];
	}

	return ['id_to_position' => $idToPosition, 'position_to_id' => $positionToId];
}

/**
 * Turn what an author typed into what gets stored.
 *
 * A reference to a position that holds no scene is left exactly as typed. The
 * author gets their own text back and can see the mistake, which beats a token
 * that silently disappears on save.
 */
function sb_store_refs(PDO $pdo, int $storyboardId, string $body): string {
	$maps = sb_scene_position_maps($pdo, $storyboardId);

	return sb_refs_positions_to_ids($body, $maps['position_to_id']);
}

/** A scene's text boxes and images as one ordered list, the way the canvas draws them. */
function sb_scene_elements(PDO $pdo, int $sceneId, ?array $idToPosition = null): array {
	$stmt = $pdo->prepare(
		"SELECT t.text_id AS id, 'text' AS type, t.body, t.sort_order, t.author_name,
		        NULL AS description, NULL AS filename, NULL AS mime
		 FROM sb_scene_texts t WHERE t.scene_id = :sid1
		 UNION ALL
		 SELECT a.asset_id AS id, 'image' AS type, NULL AS body, a.sort_order, NULL AS author_name,
		        a.description, a.filename, a.mime
		 FROM sb_scene_assets a WHERE a.scene_id = :sid2
		 ORDER BY sort_order, id"
	);
	$stmt->execute([':sid1' => $sceneId, ':sid2' => $sceneId]);

	$elements = [];
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
		$element = [
			'id'         => (int)$row['id'],
			'type'       => $row['type'],
			'sort_order' => (int)$row['sort_order'],
		];
		if ($row['type'] === 'text') {
			// Positions on the way out; the canvas and the edit box both want
			// what the author typed, not the stable ids underneath.
			$element['body'] = $idToPosition === null
				? (string)$row['body']
				: sb_refs_ids_to_positions((string)$row['body'], $idToPosition);
			$element['author_name'] = $row['author_name'];
		} else {
			$element['description'] = (string)$row['description'];
			$element['url'] = SB_IMAGE_URL_BASE . $row['filename'];
			$element['mime'] = $row['mime'];
		}
		$elements[] = $element;
	}

	return $elements;
}

/** Storyboard rows shaped for the client: no generated column, no raw code for non-owners. */
function sb_storyboard_payload(array $storyboard, string $role, string $access): array {
	$payload = [
		'storyboard_id' => (int)$storyboard['storyboard_id'],
		'title'         => $storyboard['title'],
		'description'   => $storyboard['description'],
		'status'        => $storyboard['status'],
		'join_role'     => $storyboard['join_role'],
		'code_version'  => (int)$storyboard['code_version'],
		'owner_name'    => $storyboard['owner_name'] ?? null,
		'role'          => $role,
		'access'        => $access,
		'brief_missing' => sb_brief_missing($storyboard),
		'created_at'    => $storyboard['created_at'],
		'updated_at'    => $storyboard['updated_at'],
	];

	foreach (sb_brief_fields() as $field) {
		$payload[$field['key']] = $storyboard[$field['key']];
	}

	// The codeword is a credential. The owner shares it; nobody else is shown it,
	// even though they used it to get in — a viewer who can read the code can
	// hand out access the owner never granted.
	if ($role === 'owner') {
		$payload['access_code'] = $storyboard['access_code'];
	}

	return $payload;
}

/* ==========================================================================
   Documents
   ========================================================================== */

/**
 * The dashboard: every storyboard this actor owns or has joined.
 *
 * The counts are what the cards read at a glance — an arc strip one segment per
 * scene, open comments, and whether the brief still blocks an export — so they
 * are aggregated here rather than leaving the client to fan out per card.
 */
function sb_list_storyboards(PDO $pdo, array $actor): array {
	$stmt = $pdo->prepare(
		"SELECT s.*, owner.display_name AS owner_name,
		        m.role AS member_role, m.joined_code_version,
		        (SELECT COUNT(*) FROM sb_scenes sc WHERE sc.storyboard_id = s.storyboard_id) AS scene_count,
		        (SELECT COUNT(*) FROM sb_comments c
		          WHERE c.storyboard_id = s.storyboard_id AND c.status = 'open') AS open_comments
		 FROM sb_storyboards s
		 JOIN sb_participants owner ON owner.participant_id = s.owner_participant_id
		 LEFT JOIN sb_memberships m
		        ON m.storyboard_id = s.storyboard_id AND m.participant_id = :pid AND m.status = 'active'
		 WHERE s.owner_participant_id = :owner_pid OR m.membership_id IS NOT NULL
		 ORDER BY s.updated_at DESC"
	);
	$stmt->execute([':pid' => $actor['participant_id'], ':owner_pid' => $actor['participant_id']]);

	$cards = [];
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
		$isOwner = (int)$row['owner_participant_id'] === (int)$actor['participant_id'];
		$role = $isOwner ? 'owner' : (string)$row['member_role'];

		$access = 'read';
		if ($isOwner) {
			$access = $row['status'] === 'archived' ? 'read' : 'write';
		} elseif ($row['access_code'] === null) {
			$access = 'closed';
		} elseif ((int)$row['joined_code_version'] !== (int)$row['code_version']) {
			$access = 'stale';
		} elseif ($row['member_role'] === 'editor' && $row['status'] !== 'archived') {
			$access = 'write';
		}

		$card = sb_storyboard_payload($row, $role, $access);
		$card['scene_count'] = (int)$row['scene_count'];
		$card['open_comments'] = (int)$row['open_comments'];
		$cards[] = $card;
	}

	return sb_ok(['storyboards' => $cards]);
}

/**
 * New storyboard. Asks only for a title; everything else is filled in later.
 *
 * Owning requires an account: a guest's storyboard would vanish behind a cookie
 * nobody can recover, so a document would have no durable owner.
 */
function sb_create_storyboard(PDO $pdo, array $actor, array $data): array {
	if (empty($actor['user_id'])) {
		throw new SbException('Only signed-in Signal users can create a storyboard.', 403);
	}

	$title = sb_str($data, 'title', 255, true);
	$description = sb_str($data, 'description', 2000);

	$pdo->beginTransaction();
	try {
		$stmt = $pdo->prepare(
			"INSERT INTO sb_storyboards (owner_participant_id, title, description, access_code, code_version, code_updated_at, created_at, updated_at)
			 VALUES (:pid, :title, :description, :code, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt->execute([
			':pid'         => $actor['participant_id'],
			':title'       => $title,
			':description' => $description !== '' ? $description : null,
			':code'        => sb_unique_codeword($pdo),
		]);
		$storyboardId = (int)$pdo->lastInsertId();

		// The owner gets a membership row too, so "who is on this storyboard"
		// is one query rather than a union with the owner column.
		$stmt = $pdo->prepare(
			"INSERT INTO sb_memberships (storyboard_id, participant_id, role, joined_code_version, joined_at)
			 VALUES (:sid, :pid, 'owner', NULL, UTC_TIMESTAMP())"
		);
		$stmt->execute([':sid' => $storyboardId, ':pid' => $actor['participant_id']]);

		$pdo->commit();
	} catch (Throwable $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		throw $e;
	}

	sb_log_event($pdo, $storyboardId, (int)$actor['participant_id'], 'storyboard_created', $title);

	return sb_get_storyboard($pdo, $actor, ['storyboard_id' => $storyboardId]);
}

function sb_get_storyboard(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	$resolved = sb_resolve_access($pdo, $storyboardId, $actor);

	// 'stale' and 'closed' are returned rather than refused: the UI has a
	// specific screen for each, and both need the storyboard's title to say
	// which storyboard they are talking about.
	$payload = sb_storyboard_payload($resolved['storyboard'], $resolved['role'], $resolved['access']);

	$stmt = $pdo->prepare("SELECT COUNT(*) FROM sb_scenes WHERE storyboard_id = :sid");
	$stmt->execute([':sid' => $storyboardId]);
	$payload['scene_count'] = (int)$stmt->fetchColumn();

	return sb_ok(['storyboard' => $payload]);
}

function sb_update_storyboard(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');

	// Title and description are collaborative; the access settings are not.
	$needsOwner = isset($data['status']) || isset($data['join_role']);
	$resolved = sb_require_access($pdo, $storyboardId, $actor, $needsOwner ? 'own' : 'write');

	$sets = [];
	$params = [':sid' => $storyboardId];

	if (isset($data['title'])) {
		$sets[] = 'title = :title';
		$params[':title'] = sb_str($data, 'title', 255, true);
	}
	if (array_key_exists('description', $data)) {
		$description = sb_str($data, 'description', 2000);
		$sets[] = 'description = :description';
		$params[':description'] = $description !== '' ? $description : null;
	}
	if (isset($data['status'])) {
		if (!in_array($data['status'], ['active', 'archived'], true)) {
			throw new SbException('Status must be active or archived.', 400);
		}
		$sets[] = 'status = :status';
		$params[':status'] = $data['status'];
	}
	if (isset($data['join_role'])) {
		if (!in_array($data['join_role'], ['editor', 'viewer'], true)) {
			throw new SbException('Join role must be editor or viewer.', 400);
		}
		$sets[] = 'join_role = :join_role';
		$params[':join_role'] = $data['join_role'];
	}

	if (!$sets) {
		throw new SbException('Nothing to update.', 400);
	}

	// An archived storyboard is read-only, which the access check above enforces
	// — but restoring one has to be allowed to run against it.
	if ($resolved['storyboard']['status'] === 'archived' && !isset($data['status'])) {
		throw new SbException('This storyboard is archived. Restore it to make changes.', 403);
	}

	$stmt = $pdo->prepare("UPDATE sb_storyboards SET " . implode(', ', $sets) . ", updated_at = UTC_TIMESTAMP() WHERE storyboard_id = :sid");
	$stmt->execute($params);

	return sb_get_storyboard($pdo, $actor, ['storyboard_id' => $storyboardId]);
}

function sb_delete_storyboard(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	sb_require_access($pdo, $storyboardId, $actor, 'own');

	// Take the files out before the rows go: the cascade would leave every
	// reference image orphaned on disk, still counted against a storage quota.
	$stmt = $pdo->prepare("SELECT storage_path, byte_size FROM sb_scene_assets WHERE storyboard_id = :sid");
	$stmt->execute([':sid' => $storyboardId]);
	$freed = 0;
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $asset) {
		$path = SB_IMAGE_DIR . basename((string)$asset['storage_path']);
		if (is_file($path)) unlink($path);
		$freed += (int)$asset['byte_size'];
	}
	if ($freed > 0 && !empty($actor['user_id'])) {
		$stmt = $pdo->prepare("UPDATE users SET storage_used_bytes = GREATEST(0, storage_used_bytes - :freed) WHERE user_id = :uid");
		$stmt->execute([':freed' => $freed, ':uid' => $actor['user_id']]);
	}

	$stmt = $pdo->prepare("DELETE FROM sb_storyboards WHERE storyboard_id = :sid");
	$stmt->execute([':sid' => $storyboardId]);

	return sb_ok(['storyboard_id' => $storyboardId]);
}

/* ==========================================================================
   Codeword and members
   ========================================================================== */

/**
 * What a code opens, without joining.
 *
 * The join screen names the storyboard before anyone commits to it — that is
 * what catches a mistyped or rotated code before you are standing inside
 * someone else's work. Rate-limited exactly like the join itself, because
 * otherwise this becomes the enumeration oracle the join is protected against.
 */
function sb_lookup_code(PDO $pdo, array $actor, array $data): array {
	sb_check_join_rate_limit($pdo);
	$code = sb_str($data, 'code', 64, true);

	$stmt = $pdo->prepare(
		"SELECT s.storyboard_id, s.title, s.join_role, s.code_version, p.display_name AS owner_name,
		        (SELECT COUNT(*) FROM sb_scenes sc WHERE sc.storyboard_id = s.storyboard_id) AS scene_count
		 FROM sb_storyboards s
		 JOIN sb_participants p ON p.participant_id = s.owner_participant_id
		 WHERE s.active_code = :code"
	);
	$stmt->execute([':code' => $code]);
	$storyboard = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($storyboard === false) {
		sb_record_join_attempt($pdo, false);
		// One generic message for every failure: a distinct "no such code" and
		// "that code is closed" would let an attacker map the code space.
		throw new SbException('No storyboard matches that code.', 404);
	}

	sb_record_join_attempt($pdo, true);

	$alreadyMember = false;
	if (!empty($actor['participant_id'])) {
		$stmt = $pdo->prepare(
			"SELECT 1 FROM sb_memberships
			 WHERE storyboard_id = :sid AND participant_id = :pid AND status = 'active'
			   AND (joined_code_version = :version OR role = 'owner')"
		);
		$stmt->execute([
			':sid'     => $storyboard['storyboard_id'],
			':pid'     => $actor['participant_id'],
			':version' => $storyboard['code_version'],
		]);
		$alreadyMember = $stmt->fetchColumn() !== false;
	}

	return sb_ok([
		'storyboard_id'  => (int)$storyboard['storyboard_id'],
		'title'          => $storyboard['title'],
		'owner_name'     => $storyboard['owner_name'],
		'scene_count'    => (int)$storyboard['scene_count'],
		'join_role'      => $storyboard['join_role'],
		'already_member' => $alreadyMember,
	]);
}

/**
 * Join by codeword.
 *
 * A member re-joining after a rotation keeps whatever role the owner last gave
 * them rather than being reset to the storyboard's join_role. Resetting would
 * silently undo an owner's deliberate downgrade every time they rotated the
 * code, which is the opposite of what rotation is for.
 */
function sb_join_by_code(PDO $pdo, array $actor, array $data): array {
	sb_check_join_rate_limit($pdo);
	$code = sb_str($data, 'code', 64, true);

	$stmt = $pdo->prepare("SELECT * FROM sb_storyboards WHERE active_code = :code");
	$stmt->execute([':code' => $code]);
	$storyboard = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($storyboard === false) {
		sb_record_join_attempt($pdo, false);
		throw new SbException('No storyboard matches that code.', 404);
	}
	sb_record_join_attempt($pdo, true);

	$storyboardId = (int)$storyboard['storyboard_id'];
	$participantId = (int)$actor['participant_id'];

	$stmt = $pdo->prepare("SELECT * FROM sb_memberships WHERE storyboard_id = :sid AND participant_id = :pid");
	$stmt->execute([':sid' => $storyboardId, ':pid' => $participantId]);
	$existing = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($existing !== false) {
		$stmt = $pdo->prepare(
			"UPDATE sb_memberships
			 SET joined_code_version = :version, status = 'active', last_active_at = UTC_TIMESTAMP()
			 WHERE membership_id = :mid"
		);
		$stmt->execute([':version' => $storyboard['code_version'], ':mid' => $existing['membership_id']]);
	} else {
		$stmt = $pdo->prepare(
			"INSERT INTO sb_memberships (storyboard_id, participant_id, role, joined_code_version, joined_at, last_active_at)
			 VALUES (:sid, :pid, :role, :version, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
		);
		$stmt->execute([
			':sid'     => $storyboardId,
			':pid'     => $participantId,
			':role'    => $storyboard['join_role'],
			':version' => $storyboard['code_version'],
		]);
	}

	sb_log_event($pdo, $storyboardId, $participantId, 'joined', $actor['display_name']);

	return sb_get_storyboard($pdo, $actor, ['storyboard_id' => $storyboardId]);
}

/**
 * Rotate the codeword: new code, code_version + 1.
 *
 * That single UPDATE is the entire lockout. Every membership stamped with the
 * old version stops resolving on its next request, with no session sweep and no
 * row-by-row revocation to get half-done.
 */
function sb_rotate_code(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	sb_require_access($pdo, $storyboardId, $actor, 'own');

	$custom = sb_str($data, 'code', 64);
	if ($custom !== '') {
		if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9 _-]{2,63}$/', $custom)) {
			throw new SbException('A custom code must be 3–64 letters, numbers, spaces, hyphens or underscores.', 400);
		}
		$stmt = $pdo->prepare("SELECT 1 FROM sb_storyboards WHERE active_code = :code AND storyboard_id <> :sid");
		$stmt->execute([':code' => $custom, ':sid' => $storyboardId]);
		if ($stmt->fetchColumn() !== false) {
			throw new SbException('That code is already in use by another storyboard.', 409);
		}
	}
	$code = $custom !== '' ? $custom : sb_unique_codeword($pdo);

	$stmt = $pdo->prepare(
		"UPDATE sb_storyboards
		 SET access_code = :code, code_version = code_version + 1,
		     code_updated_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
		 WHERE storyboard_id = :sid"
	);
	$stmt->execute([':code' => $code, ':sid' => $storyboardId]);

	// The owner's own membership is stamped NULL and is never checked against
	// the version, so rotation cannot lock an owner out of their own work.
	$stmt = $pdo->prepare(
		"SELECT COUNT(*) FROM sb_memberships WHERE storyboard_id = :sid AND role <> 'owner' AND status = 'active'"
	);
	$stmt->execute([':sid' => $storyboardId]);
	$affected = (int)$stmt->fetchColumn();

	sb_log_event($pdo, $storyboardId, (int)$actor['participant_id'], 'code_rotated', "affects {$affected} collaborator(s)");

	$result = sb_get_storyboard($pdo, $actor, ['storyboard_id' => $storyboardId]);
	$result['data']['locked_out'] = $affected;

	return $result;
}

/** Close the storyboard: no new joins, and existing non-owner access freezes. */
function sb_deactivate_code(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	sb_require_access($pdo, $storyboardId, $actor, 'own');

	$stmt = $pdo->prepare(
		"UPDATE sb_storyboards SET access_code = NULL, code_updated_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
		 WHERE storyboard_id = :sid"
	);
	$stmt->execute([':sid' => $storyboardId]);

	sb_log_event($pdo, $storyboardId, (int)$actor['participant_id'], 'code_deactivated', null);

	return sb_get_storyboard($pdo, $actor, ['storyboard_id' => $storyboardId]);
}

function sb_list_members(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	$resolved = sb_require_access($pdo, $storyboardId, $actor, 'read');

	$stmt = $pdo->prepare(
		"SELECT m.membership_id, m.participant_id, m.role, m.status, m.joined_code_version,
		        m.joined_at, m.last_active_at, p.display_name, p.is_guest
		 FROM sb_memberships m
		 JOIN sb_participants p ON p.participant_id = m.participant_id
		 WHERE m.storyboard_id = :sid
		 ORDER BY (m.role = 'owner') DESC, p.display_name"
	);
	$stmt->execute([':sid' => $storyboardId]);

	$currentVersion = (int)$resolved['storyboard']['code_version'];
	$members = [];
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
		$members[] = [
			'participant_id' => (int)$row['participant_id'],
			'display_name'   => $row['display_name'],
			'is_guest'       => (bool)$row['is_guest'],
			'role'           => $row['role'],
			'status'         => $row['status'],
			// Surfaced so the owner can see who a rotation actually affected.
			'stale'          => $row['role'] !== 'owner' && (int)$row['joined_code_version'] !== $currentVersion,
			'joined_at'      => $row['joined_at'],
			'last_active_at' => $row['last_active_at'],
		];
	}

	return sb_ok(['members' => $members]);
}

function sb_update_member(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	$participantId = sb_int($data, 'participant_id');
	sb_require_access($pdo, $storyboardId, $actor, 'own');

	if ($participantId === (int)$actor['participant_id']) {
		throw new SbException('You cannot change your own role on a storyboard you own.', 400);
	}

	$sets = [];
	$params = [':sid' => $storyboardId, ':pid' => $participantId];

	if (isset($data['role'])) {
		if (!in_array($data['role'], ['editor', 'viewer'], true)) {
			throw new SbException('Role must be editor or viewer.', 400);
		}
		$sets[] = 'role = :role';
		$params[':role'] = $data['role'];
	}
	if (isset($data['status'])) {
		if (!in_array($data['status'], ['active', 'left'], true)) {
			throw new SbException('Status must be active or left.', 400);
		}
		$sets[] = 'status = :status';
		$params[':status'] = $data['status'];
	}
	if (!$sets) {
		throw new SbException('Nothing to update.', 400);
	}

	$stmt = $pdo->prepare(
		"UPDATE sb_memberships SET " . implode(', ', $sets) . "
		 WHERE storyboard_id = :sid AND participant_id = :pid AND role <> 'owner'"
	);
	$stmt->execute($params);

	return sb_list_members($pdo, $actor, ['storyboard_id' => $storyboardId]);
}

/* ==========================================================================
   Scenes
   ========================================================================== */

/**
 * The scene index, with every scene's content in one response.
 *
 * The tiles are live miniatures, not thumbnails — the same markup at a smaller
 * width — so they need the actual elements. Fetching them per tile would be one
 * request per scene on every visit to the index.
 */
function sb_list_scenes(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	$resolved = sb_require_access($pdo, $storyboardId, $actor, 'read');

	$stmt = $pdo->prepare(
		"SELECT sc.*,
		        (SELECT COUNT(*) FROM sb_comments c WHERE c.scene_id = sc.scene_id AND c.status = 'open') AS open_comments
		 FROM sb_scenes sc WHERE sc.storyboard_id = :sid ORDER BY sc.position, sc.scene_id"
	);
	$stmt->execute([':sid' => $storyboardId]);

	$maps = sb_scene_position_maps($pdo, $storyboardId);

	$scenes = [];
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
		$scenes[] = [
			'scene_id'      => (int)$row['scene_id'],
			'title'         => $row['title'],
			'position'      => (int)$row['position'],
			'kind'          => $row['kind'],
			'owner_label'   => $row['owner_label'],
			'is_backup'     => (bool)$row['is_backup'],
			'open_comments' => (int)$row['open_comments'],
			'elements'      => sb_scene_elements($pdo, (int)$row['scene_id'], $maps['id_to_position']),
		];
	}

	return sb_ok([
		'scenes'     => $scenes,
		'storyboard' => sb_storyboard_payload($resolved['storyboard'], $resolved['role'], $resolved['access']),
	]);
}

function sb_get_scene(PDO $pdo, array $actor, array $data): array {
	$sceneId = sb_int($data, 'scene_id');
	$resolved = sb_require_scene_access($pdo, $sceneId, $actor, 'read');
	$scene = $resolved['scene'];
	$maps = sb_scene_position_maps($pdo, (int)$scene['storyboard_id']);

	return sb_ok([
		'scene' => [
			'scene_id'      => (int)$scene['scene_id'],
			'storyboard_id' => (int)$scene['storyboard_id'],
			'title'         => $scene['title'],
			'position'      => (int)$scene['position'],
			'kind'          => $scene['kind'],
			'owner_label'   => $scene['owner_label'],
			'is_backup'     => (bool)$scene['is_backup'],
			'elements'      => sb_scene_elements($pdo, $sceneId, $maps['id_to_position']),
		],
		// So the client can turn a rendered `<<3>>` into a link that navigates.
		'position_to_id' => $maps['position_to_id'],
	]);
}

function sb_create_scene(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	sb_require_access($pdo, $storyboardId, $actor, 'write');

	$title = sb_str($data, 'title', 255);
	if ($title === '') $title = 'Untitled scene';

	$stmt = $pdo->prepare("SELECT COALESCE(MAX(position), 0) + 1 FROM sb_scenes WHERE storyboard_id = :sid");
	$stmt->execute([':sid' => $storyboardId]);
	$position = (int)$stmt->fetchColumn();

	$stmt = $pdo->prepare(
		"INSERT INTO sb_scenes (storyboard_id, title, position, created_at, updated_at)
		 VALUES (:sid, :title, :position, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
	);
	$stmt->execute([':sid' => $storyboardId, ':title' => $title, ':position' => $position]);
	$sceneId = (int)$pdo->lastInsertId();

	sb_touch_storyboard($pdo, $storyboardId);
	sb_log_event($pdo, $storyboardId, (int)$actor['participant_id'], 'scene_added', $title);

	return sb_get_scene($pdo, $actor, ['scene_id' => $sceneId]);
}

function sb_update_scene(PDO $pdo, array $actor, array $data): array {
	$sceneId = sb_int($data, 'scene_id');
	$resolved = sb_require_scene_access($pdo, $sceneId, $actor, 'write');

	$sets = [];
	$params = [':sceneId' => $sceneId];

	if (isset($data['title'])) {
		$sets[] = 'title = :title';
		$params[':title'] = sb_str($data, 'title', 255, true);
	}
	if (array_key_exists('owner_label', $data)) {
		$label = sb_str($data, 'owner_label', 120);
		$sets[] = 'owner_label = :owner_label';
		$params[':owner_label'] = $label !== '' ? $label : null;
	}
	if (isset($data['is_backup'])) {
		$sets[] = 'is_backup = :is_backup';
		$params[':is_backup'] = !empty($data['is_backup']) ? 1 : 0;
	}
	if (!$sets) {
		throw new SbException('Nothing to update.', 400);
	}

	$stmt = $pdo->prepare("UPDATE sb_scenes SET " . implode(', ', $sets) . ", updated_at = UTC_TIMESTAMP() WHERE scene_id = :sceneId");
	$stmt->execute($params);

	sb_touch_storyboard($pdo, (int)$resolved['storyboard']['storyboard_id']);

	return sb_get_scene($pdo, $actor, ['scene_id' => $sceneId]);
}

function sb_delete_scene(PDO $pdo, array $actor, array $data): array {
	$sceneId = sb_int($data, 'scene_id');
	$resolved = sb_require_scene_access($pdo, $sceneId, $actor, 'write');
	$storyboardId = (int)$resolved['storyboard']['storyboard_id'];

	sb_free_scene_images($pdo, $sceneId, $storyboardId);

	$stmt = $pdo->prepare("DELETE FROM sb_scenes WHERE scene_id = :sceneId");
	$stmt->execute([':sceneId' => $sceneId]);

	// Positions are the argument's running order and are read as 1..N — a gap
	// would show up as a skipped number on the very next tile.
	sb_renumber_scenes($pdo, $storyboardId);
	sb_touch_storyboard($pdo, $storyboardId);

	return sb_list_scenes($pdo, $actor, ['storyboard_id' => $storyboardId]);
}

function sb_reorder_scenes(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	sb_require_access($pdo, $storyboardId, $actor, 'write');

	$order = $data['order'] ?? [];
	if (!is_array($order) || !$order) {
		throw new SbException('An order is required.', 400);
	}

	// Only scenes in this storyboard move, and each only once: a crafted list
	// could otherwise renumber a scene the caller cannot even see.
	$stmt = $pdo->prepare("SELECT scene_id FROM sb_scenes WHERE storyboard_id = :sid");
	$stmt->execute([':sid' => $storyboardId]);
	$owned = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));

	$pdo->beginTransaction();
	try {
		$update = $pdo->prepare("UPDATE sb_scenes SET position = :position WHERE scene_id = :sceneId AND storyboard_id = :sid");
		$position = 0;
		$seen = [];
		foreach ($order as $sceneId) {
			$sceneId = (int)$sceneId;
			if (!in_array($sceneId, $owned, true) || isset($seen[$sceneId])) continue;
			$seen[$sceneId] = true;
			$update->execute([':position' => ++$position, ':sceneId' => $sceneId, ':sid' => $storyboardId]);
		}
		// Anything the client left out keeps its relative order after the rest,
		// rather than colliding at position 0.
		foreach ($owned as $sceneId) {
			if (isset($seen[$sceneId])) continue;
			$update->execute([':position' => ++$position, ':sceneId' => $sceneId, ':sid' => $storyboardId]);
		}
		$pdo->commit();
	} catch (Throwable $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		throw $e;
	}

	sb_touch_storyboard($pdo, $storyboardId);

	return sb_list_scenes($pdo, $actor, ['storyboard_id' => $storyboardId]);
}

function sb_renumber_scenes(PDO $pdo, int $storyboardId): void {
	$stmt = $pdo->prepare("SELECT scene_id FROM sb_scenes WHERE storyboard_id = :sid ORDER BY position, scene_id");
	$stmt->execute([':sid' => $storyboardId]);
	$update = $pdo->prepare("UPDATE sb_scenes SET position = :position WHERE scene_id = :sceneId");

	$position = 0;
	foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $sceneId) {
		$update->execute([':position' => ++$position, ':sceneId' => (int)$sceneId]);
	}
}

/** Keeps the dashboard's "last activity" honest: content changes are activity. */
function sb_touch_storyboard(PDO $pdo, int $storyboardId): void {
	$stmt = $pdo->prepare("UPDATE sb_storyboards SET updated_at = UTC_TIMESTAMP() WHERE storyboard_id = :sid");
	$stmt->execute([':sid' => $storyboardId]);
}

/* ==========================================================================
   Scene content — text boxes
   ========================================================================== */

function sb_create_text(PDO $pdo, array $actor, array $data): array {
	$sceneId = sb_int($data, 'scene_id');
	$resolved = sb_require_scene_access($pdo, $sceneId, $actor, 'write');

	$stmt = $pdo->prepare(
		"INSERT INTO sb_scene_texts (scene_id, storyboard_id, author_participant_id, author_name, body, sort_order, created_at, updated_at)
		 VALUES (:sceneId, :sid, :pid, :name, :body, :seq, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
	);
	$stmt->execute([
		':sceneId' => $sceneId,
		':sid'     => (int)$resolved['storyboard']['storyboard_id'],
		':pid'     => $actor['participant_id'],
		':name'    => $actor['display_name'],
		':body'    => sb_store_refs($pdo, (int)$resolved['storyboard']['storyboard_id'], (string)($data['body'] ?? '')),
		':seq'     => sb_next_element_seq($pdo, $sceneId),
	]);

	sb_touch_storyboard($pdo, (int)$resolved['storyboard']['storyboard_id']);

	return sb_get_scene($pdo, $actor, ['scene_id' => $sceneId]);
}

function sb_update_text(PDO $pdo, array $actor, array $data): array {
	$textId = sb_int($data, 'text_id');

	$stmt = $pdo->prepare("SELECT scene_id FROM sb_scene_texts WHERE text_id = :textId");
	$stmt->execute([':textId' => $textId]);
	$sceneId = $stmt->fetchColumn();
	if ($sceneId === false) {
		throw new SbException('Text box not found.', 404);
	}

	$resolved = sb_require_scene_access($pdo, (int)$sceneId, $actor, 'write');

	$stmt = $pdo->prepare("UPDATE sb_scene_texts SET body = :body, updated_at = UTC_TIMESTAMP() WHERE text_id = :textId");
	$stmt->execute([
		':body'   => sb_store_refs($pdo, (int)$resolved['storyboard']['storyboard_id'], (string)($data['body'] ?? '')),
		':textId' => $textId,
	]);

	return sb_get_scene($pdo, $actor, ['scene_id' => (int)$sceneId]);
}

function sb_delete_text(PDO $pdo, array $actor, array $data): array {
	$textId = sb_int($data, 'text_id');

	$stmt = $pdo->prepare("SELECT scene_id FROM sb_scene_texts WHERE text_id = :textId");
	$stmt->execute([':textId' => $textId]);
	$sceneId = $stmt->fetchColumn();
	if ($sceneId === false) {
		throw new SbException('Text box not found.', 404);
	}

	sb_require_scene_access($pdo, (int)$sceneId, $actor, 'write');

	$stmt = $pdo->prepare("DELETE FROM sb_scene_texts WHERE text_id = :textId");
	$stmt->execute([':textId' => $textId]);

	sb_resequence_scene($pdo, (int)$sceneId);

	return sb_get_scene($pdo, $actor, ['scene_id' => (int)$sceneId]);
}

/* ==========================================================================
   Scene content — reference images
   ========================================================================== */

/**
 * Add a reference image. A non-empty description is required, not encouraged.
 *
 * The description is the image's alt-text, its tooltip, and the only thing the
 * exported brief can tell an agent about what a screenshot shows. An unlabelled
 * screenshot is close to useless to whoever builds from the brief, so the upload
 * is refused rather than accepted with a blank.
 */
function sb_upload_image(PDO $pdo, array $actor, array $data): array {
	$sceneId = sb_int($data, 'scene_id');
	$resolved = sb_require_scene_access($pdo, $sceneId, $actor, 'write');
	$storyboardId = (int)$resolved['storyboard']['storyboard_id'];

	$description = sb_str($data, 'description', 1000, true);

	if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
		throw new SbException('No image was received.', 400);
	}
	$file = $_FILES['image'];

	if ((int)$file['size'] > SB_MAX_IMAGE_BYTES) {
		throw new SbException('That image is larger than 5 MB.', 413);
	}
	$mime = mime_content_type($file['tmp_name']);
	if (!in_array($mime, SB_ALLOWED_IMAGE_MIMES, true)) {
		throw new SbException('Images must be JPEG, PNG, GIF or WebP.', 415);
	}

	$stmt = $pdo->prepare("SELECT COUNT(*) FROM sb_scene_assets WHERE scene_id = :sceneId");
	$stmt->execute([':sceneId' => $sceneId]);
	if ((int)$stmt->fetchColumn() >= SB_MAX_IMAGES_PER_SCENE) {
		throw new SbException('A scene holds at most ' . SB_MAX_IMAGES_PER_SCENE . ' reference images.', 409);
	}

	// Bytes are charged to the storyboard's owner. A guest has no account and so
	// no quota of their own, and the owner is who invited them.
	$quotaUserId = sb_storage_account($pdo, $storyboardId);
	sb_check_storage_quota($pdo, $quotaUserId, (int)$file['size']);

	$extension = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
	if (!preg_match('/^[a-z0-9]{1,5}$/', $extension)) {
		$extension = 'img';
	}
	$filename = 'sb' . $storyboardId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;

	if (!move_uploaded_file($file['tmp_name'], SB_IMAGE_DIR . $filename)) {
		throw new SbException('The image could not be saved.', 500);
	}

	$stmt = $pdo->prepare(
		"INSERT INTO sb_scene_assets
		   (scene_id, storyboard_id, kind, sort_order, description, filename, mime, byte_size, storage_path, uploaded_by_participant_id, created_at, updated_at)
		 VALUES (:sceneId, :sid, 'reference_image', :seq, :description, :filename, :mime, :size, :path, :pid, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
	);
	$stmt->execute([
		':sceneId'     => $sceneId,
		':sid'         => $storyboardId,
		':seq'         => sb_next_element_seq($pdo, $sceneId),
		':description' => $description,
		':filename'    => $filename,
		':mime'        => $mime,
		':size'        => (int)$file['size'],
		':path'        => $filename,
		':pid'         => $actor['participant_id'],
	]);

	if ($quotaUserId !== null) {
		$stmt = $pdo->prepare("UPDATE users SET storage_used_bytes = storage_used_bytes + :size WHERE user_id = :uid");
		$stmt->execute([':size' => (int)$file['size'], ':uid' => $quotaUserId]);
	}

	sb_touch_storyboard($pdo, $storyboardId);

	return sb_get_scene($pdo, $actor, ['scene_id' => $sceneId]);
}

function sb_update_image(PDO $pdo, array $actor, array $data): array {
	$assetId = sb_int($data, 'asset_id');

	$stmt = $pdo->prepare("SELECT scene_id FROM sb_scene_assets WHERE asset_id = :assetId");
	$stmt->execute([':assetId' => $assetId]);
	$sceneId = $stmt->fetchColumn();
	if ($sceneId === false) {
		throw new SbException('Image not found.', 404);
	}

	sb_require_scene_access($pdo, (int)$sceneId, $actor, 'write');

	// Same rule as upload: a description can be rewritten, never emptied.
	$description = sb_str($data, 'description', 1000, true);

	$stmt = $pdo->prepare("UPDATE sb_scene_assets SET description = :description, updated_at = UTC_TIMESTAMP() WHERE asset_id = :assetId");
	$stmt->execute([':description' => $description, ':assetId' => $assetId]);

	return sb_get_scene($pdo, $actor, ['scene_id' => (int)$sceneId]);
}

function sb_delete_image(PDO $pdo, array $actor, array $data): array {
	$assetId = sb_int($data, 'asset_id');

	$stmt = $pdo->prepare("SELECT scene_id, storyboard_id, storage_path, byte_size FROM sb_scene_assets WHERE asset_id = :assetId");
	$stmt->execute([':assetId' => $assetId]);
	$asset = $stmt->fetch(PDO::FETCH_ASSOC);
	if ($asset === false) {
		throw new SbException('Image not found.', 404);
	}

	sb_require_scene_access($pdo, (int)$asset['scene_id'], $actor, 'write');

	$path = SB_IMAGE_DIR . basename((string)$asset['storage_path']);
	if (is_file($path)) unlink($path);

	$stmt = $pdo->prepare("DELETE FROM sb_scene_assets WHERE asset_id = :assetId");
	$stmt->execute([':assetId' => $assetId]);

	$quotaUserId = sb_storage_account($pdo, (int)$asset['storyboard_id']);
	if ($quotaUserId !== null) {
		$stmt = $pdo->prepare("UPDATE users SET storage_used_bytes = GREATEST(0, storage_used_bytes - :size) WHERE user_id = :uid");
		$stmt->execute([':size' => (int)$asset['byte_size'], ':uid' => $quotaUserId]);
	}

	sb_resequence_scene($pdo, (int)$asset['scene_id']);

	return sb_get_scene($pdo, $actor, ['scene_id' => (int)$asset['scene_id']]);
}

/** The account that pays for a storyboard's images: its owner. */
function sb_storage_account(PDO $pdo, int $storyboardId): ?int {
	$stmt = $pdo->prepare(
		"SELECT p.user_id FROM sb_storyboards s
		 JOIN sb_participants p ON p.participant_id = s.owner_participant_id
		 WHERE s.storyboard_id = :sid"
	);
	$stmt->execute([':sid' => $storyboardId]);
	$userId = $stmt->fetchColumn();

	return ($userId === false || $userId === null) ? null : (int)$userId;
}

function sb_check_storage_quota(PDO $pdo, ?int $userId, int $incomingBytes): void {
	if ($userId === null || !function_exists('getUserSubscriptionLimits')) {
		return;
	}

	$stmt = $pdo->prepare("SELECT storage_used_bytes FROM users WHERE user_id = :uid");
	$stmt->execute([':uid' => $userId]);
	$used = (int)$stmt->fetchColumn();

	$limits = getUserSubscriptionLimits($pdo, $userId);
	$quota = (int)($limits['storage_mb'] ?? 0) * 1024 * 1024;

	if ($quota > 0 && ($used + $incomingBytes) > $quota) {
		throw new SbException('The storyboard owner is out of storage. Remove some images and try again.', 413);
	}
}

/** Delete a scene's image files and refund their bytes. */
function sb_free_scene_images(PDO $pdo, int $sceneId, int $storyboardId): void {
	$stmt = $pdo->prepare("SELECT storage_path, byte_size FROM sb_scene_assets WHERE scene_id = :sceneId");
	$stmt->execute([':sceneId' => $sceneId]);

	$freed = 0;
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $asset) {
		$path = SB_IMAGE_DIR . basename((string)$asset['storage_path']);
		if (is_file($path)) unlink($path);
		$freed += (int)$asset['byte_size'];
	}

	if ($freed > 0) {
		$quotaUserId = sb_storage_account($pdo, $storyboardId);
		if ($quotaUserId !== null) {
			$stmt = $pdo->prepare("UPDATE users SET storage_used_bytes = GREATEST(0, storage_used_bytes - :freed) WHERE user_id = :uid");
			$stmt->execute([':freed' => $freed, ':uid' => $quotaUserId]);
		}
	}
}

/* ==========================================================================
   Scene content — the shared element sequence
   ========================================================================== */

/**
 * Rewrite a scene's whole element order in one call.
 *
 * The client sends every element on the scene, once, in its new order. Applying
 * a partial list would leave the sequence with holes or duplicates across the
 * two tables, which is exactly the state sb_next_element_seq() then misreads.
 */
function sb_reorder_elements(PDO $pdo, array $actor, array $data): array {
	$sceneId = sb_int($data, 'scene_id');
	sb_require_scene_access($pdo, $sceneId, $actor, 'write');

	$order = $data['order'] ?? [];
	if (!is_array($order) || !$order) {
		throw new SbException('An order is required.', 400);
	}

	$existing = [];
	foreach (sb_scene_elements($pdo, $sceneId) as $element) {
		$existing[$element['type'] . ':' . $element['id']] = true;
	}

	$pdo->beginTransaction();
	try {
		$updateText  = $pdo->prepare("UPDATE sb_scene_texts  SET sort_order = :seq WHERE text_id  = :id AND scene_id = :sceneId");
		$updateImage = $pdo->prepare("UPDATE sb_scene_assets SET sort_order = :seq WHERE asset_id = :id AND scene_id = :sceneId");

		$seq = 0;
		$seen = [];
		foreach ($order as $element) {
			$type = (string)($element['type'] ?? '');
			$id = (int)($element['id'] ?? 0);
			$key = $type . ':' . $id;
			if (!isset($existing[$key]) || isset($seen[$key])) continue;
			$seen[$key] = true;

			$stmt = $type === 'text' ? $updateText : $updateImage;
			$stmt->execute([':seq' => $seq++, ':id' => $id, ':sceneId' => $sceneId]);
		}
		$pdo->commit();
	} catch (Throwable $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		throw $e;
	}

	// Anything the client omitted still needs a place in the sequence.
	sb_resequence_scene($pdo, $sceneId);

	return sb_get_scene($pdo, $actor, ['scene_id' => $sceneId]);
}

/** Send one element to another scene in the same storyboard. */
function sb_move_element(PDO $pdo, array $actor, array $data): array {
	$sceneId = sb_int($data, 'scene_id');
	$targetSceneId = sb_int($data, 'target_scene_id');
	$elementId = sb_int($data, 'element_id');
	$type = (string)($data['element_type'] ?? '');

	if (!in_array($type, ['text', 'image'], true)) {
		throw new SbException('An element type of text or image is required.', 400);
	}

	$source = sb_require_scene_access($pdo, $sceneId, $actor, 'write');
	$target = sb_require_scene_access($pdo, $targetSceneId, $actor, 'write');

	if ((int)$source['storyboard']['storyboard_id'] !== (int)$target['storyboard']['storyboard_id']) {
		throw new SbException('An element can only move within its own storyboard.', 400);
	}

	$table = $type === 'text' ? 'sb_scene_texts' : 'sb_scene_assets';
	$key = $type === 'text' ? 'text_id' : 'asset_id';

	$stmt = $pdo->prepare("UPDATE {$table} SET scene_id = :target, sort_order = :seq WHERE {$key} = :id AND scene_id = :sceneId");
	$stmt->execute([
		':target'  => $targetSceneId,
		':seq'     => sb_next_element_seq($pdo, $targetSceneId),
		':id'      => $elementId,
		':sceneId' => $sceneId,
	]);

	if ($stmt->rowCount() === 0) {
		throw new SbException('That element is not on this scene.', 404);
	}

	sb_resequence_scene($pdo, $sceneId);

	return sb_get_scene($pdo, $actor, ['scene_id' => $sceneId]);
}

/* ==========================================================================
   Team Notes — the review log
   ========================================================================== */

function sb_list_comments(PDO $pdo, array $actor, array $data): array {
	$sceneId = sb_int($data, 'scene_id');
	$resolved = sb_require_scene_access($pdo, $sceneId, $actor, 'read');
	$maps = sb_scene_position_maps($pdo, (int)$resolved['storyboard']['storyboard_id']);

	$includeClosed = !empty($data['include_closed']) && $data['include_closed'] !== 'false';

	$sql = "SELECT * FROM sb_comments WHERE scene_id = :sceneId";
	if (!$includeClosed) {
		$sql .= " AND status = 'open'";
	}
	$sql .= " ORDER BY comment_id";

	$stmt = $pdo->prepare($sql);
	$stmt->execute([':sceneId' => $sceneId]);

	$comments = [];
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
		$comments[] = [
			'comment_id'     => (int)$row['comment_id'],
			'body'           => sb_refs_ids_to_positions((string)$row['body'], $maps['id_to_position']),
			'author_name'    => $row['author_name'],
			'is_mine'        => (int)$row['author_participant_id'] === (int)$actor['participant_id'],
			'status'         => $row['status'],
			'is_action_item' => (bool)$row['is_action_item'],
			'action_owner'   => $row['action_owner'],
			'created_at'     => $row['created_at'],
			'updated_at'     => $row['updated_at'],
		];
	}

	return sb_ok(['comments' => $comments]);
}

function sb_create_comment(PDO $pdo, array $actor, array $data): array {
	$sceneId = sb_int($data, 'scene_id');
	// Commenting is reviewing, and a viewer is exactly the person invited to
	// review — so this needs read access, not write.
	$resolved = sb_require_scene_access($pdo, $sceneId, $actor, 'read');

	$body = sb_str($data, 'body', 5000, true);

	$stmt = $pdo->prepare(
		"INSERT INTO sb_comments (scene_id, storyboard_id, author_participant_id, author_name, body, created_at, updated_at)
		 VALUES (:sceneId, :sid, :pid, :name, :body, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
	);
	$stmt->execute([
		':sceneId' => $sceneId,
		':sid'     => (int)$resolved['storyboard']['storyboard_id'],
		':pid'     => $actor['participant_id'],
		// A snapshot, so losing access later never erases who said what.
		':name'    => $actor['display_name'],
		':body'    => sb_store_refs($pdo, (int)$resolved['storyboard']['storyboard_id'], $body),
	]);

	sb_touch_storyboard($pdo, (int)$resolved['storyboard']['storyboard_id']);

	return sb_list_comments($pdo, $actor, ['scene_id' => $sceneId, 'include_closed' => $data['include_closed'] ?? false]);
}

function sb_update_comment(PDO $pdo, array $actor, array $data): array {
	$commentId = sb_int($data, 'comment_id');

	$stmt = $pdo->prepare("SELECT * FROM sb_comments WHERE comment_id = :commentId");
	$stmt->execute([':commentId' => $commentId]);
	$comment = $stmt->fetch(PDO::FETCH_ASSOC);
	if ($comment === false) {
		throw new SbException('Comment not found.', 404);
	}

	$resolved = sb_require_scene_access($pdo, (int)$comment['scene_id'], $actor, 'read');
	$isAuthor = (int)$comment['author_participant_id'] === (int)$actor['participant_id'];

	$sets = [];
	$params = [':commentId' => $commentId];

	if (isset($data['body'])) {
		// Rewriting what someone said is not a moderation power.
		if (!$isAuthor) {
			throw new SbException('Only the author can edit a comment.', 403);
		}
		$sets[] = 'body = :body';
		$params[':body'] = sb_store_refs(
			$pdo,
			(int)$resolved['storyboard']['storyboard_id'],
			sb_str($data, 'body', 5000, true)
		);
	}
	// Closing, and flagging an action item, are review actions the whole team
	// takes — a note is resolved by whoever resolved it, not only its author.
	if (isset($data['status'])) {
		if (!in_array($data['status'], ['open', 'closed'], true)) {
			throw new SbException('Status must be open or closed.', 400);
		}
		$sets[] = 'status = :status';
		$params[':status'] = $data['status'];
	}
	if (isset($data['is_action_item'])) {
		$sets[] = 'is_action_item = :flag';
		$params[':flag'] = !empty($data['is_action_item']) ? 1 : 0;
	}
	if (array_key_exists('action_owner', $data)) {
		$owner = sb_str($data, 'action_owner', 120);
		$sets[] = 'action_owner = :owner';
		$params[':owner'] = $owner !== '' ? $owner : null;
	}

	if (!$sets) {
		throw new SbException('Nothing to update.', 400);
	}

	$stmt = $pdo->prepare("UPDATE sb_comments SET " . implode(', ', $sets) . ", updated_at = UTC_TIMESTAMP() WHERE comment_id = :commentId");
	$stmt->execute($params);

	return sb_list_comments($pdo, $actor, [
		'scene_id'       => (int)$comment['scene_id'],
		'include_closed' => $data['include_closed'] ?? false,
	]);
}

function sb_delete_comment(PDO $pdo, array $actor, array $data): array {
	$commentId = sb_int($data, 'comment_id');

	$stmt = $pdo->prepare("SELECT * FROM sb_comments WHERE comment_id = :commentId");
	$stmt->execute([':commentId' => $commentId]);
	$comment = $stmt->fetch(PDO::FETCH_ASSOC);
	if ($comment === false) {
		throw new SbException('Comment not found.', 404);
	}

	$resolved = sb_require_scene_access($pdo, (int)$comment['scene_id'], $actor, 'read');
	$isAuthor = (int)$comment['author_participant_id'] === (int)$actor['participant_id'];

	if (!$isAuthor && $resolved['role'] !== 'owner') {
		throw new SbException('Only the author or the storyboard owner can delete a comment.', 403);
	}

	$stmt = $pdo->prepare("DELETE FROM sb_comments WHERE comment_id = :commentId");
	$stmt->execute([':commentId' => $commentId]);

	return sb_list_comments($pdo, $actor, [
		'scene_id'       => (int)$comment['scene_id'],
		'include_closed' => $data['include_closed'] ?? false,
	]);
}

/* ==========================================================================
   Delivery brief
   ========================================================================== */

/**
 * Answer the brief.
 *
 * Write access, not ownership: any member may export, so gating the brief on
 * ownership would leave an editor blocked from exporting and unable to fix why.
 */
function sb_update_brief(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	sb_require_access($pdo, $storyboardId, $actor, 'write');

	$sets = [];
	$params = [':sid' => $storyboardId];

	foreach (sb_brief_fields() as $field) {
		if (!array_key_exists($field['key'], $data)) continue;
		$value = trim((string)$data[$field['key']]);
		$sets[] = "{$field['key']} = :{$field['key']}";
		$params[":{$field['key']}"] = $value !== '' ? mb_substr($value, 0, 2000) : null;
	}

	if (!$sets) {
		throw new SbException('Nothing to update.', 400);
	}

	$stmt = $pdo->prepare("UPDATE sb_storyboards SET " . implode(', ', $sets) . ", updated_at = UTC_TIMESTAMP() WHERE storyboard_id = :sid");
	$stmt->execute($params);

	return sb_get_storyboard($pdo, $actor, ['storyboard_id' => $storyboardId]);
}

/* ==========================================================================
   Frameworks reference (§7) — reading material, writes nothing
   ========================================================================== */

/**
 * Parse the frameworks doc into a list the reference modal can read.
 *
 * Two passes over the same file, because it is written in two shapes: Part 1
 * carries `**NAME** (expansion) — summary` paragraphs, Part 3 carries `### NAME`
 * sections of `**Label:** value` fields. Part 3 defines the entries; the Part 1
 * summaries are attached to them by name.
 */
function sb_get_frameworks(): array {
	if (!is_file(SB_FRAMEWORK_FILE)) {
		// An empty catalogue rather than an error: the reference is a
		// convenience, and losing it should never look like a broken app.
		return sb_ok(['frameworks' => []]);
	}

	$lines = preg_split('/\r?\n/', (string)file_get_contents(SB_FRAMEWORK_FILE));

	$summaries = [];
	foreach ($lines as $line) {
		if (preg_match('/^\*\*(.+?)\*\*\s*(?:\(([^)]*)\))?\s*[—–-]\s*(.+)$/u', trim($line), $m)) {
			$summaries[trim($m[1])] = ['summary' => trim($m[3]), 'expansion' => isset($m[2]) ? trim($m[2]) : null];
		}
	}

	$frameworks = [];
	$name = null;
	$buffer = [];

	$flush = function () use (&$frameworks, &$name, &$buffer, $summaries) {
		if ($name === null) {
			$buffer = [];
			return;
		}
		$entry = sb_parse_framework_section($name, $buffer);
		// A `###` heading with no labelled fields is prose, not a framework.
		if ($entry['full_name'] || $entry['components'] || $entry['when_to_use'] || $entry['example']) {
			$entry['summary'] = $summaries[$name]['summary'] ?? null;
			$entry['expansion'] = $summaries[$name]['expansion'] ?? null;
			$frameworks[] = $entry;
		}
		$name = null;
		$buffer = [];
	};

	foreach ($lines as $line) {
		if (preg_match('/^###\s+(.+?)\s*$/', $line, $m)) {
			$flush();
			$name = trim($m[1]);
		} elseif (preg_match('/^##\s+/', $line)) {
			$flush(); // a new Part ends the previous section
		} elseif ($name !== null) {
			$buffer[] = $line;
		}
	}
	$flush();

	return sb_ok(['frameworks' => $frameworks]);
}

function sb_parse_framework_section(string $name, array $lines): array {
	$entry = [
		'name'            => $name,
		'summary'         => null,
		'expansion'       => null,
		'full_name'       => null,
		'components'      => [],
		'when_to_use'     => null,
		'when_not_to_use' => null,
		'example'         => null,
		'sources'         => [],
	];

	$inComponents = false;
	foreach ($lines as $raw) {
		$line = trim($raw);
		if ($line === '') continue;

		if (preg_match('/^\*\*(.+?):\*\*\s*(.*)$/u', $line, $m)) {
			$label = mb_strtolower(trim($m[1]));
			$value = trim($m[2]);
			$inComponents = false;

			switch ($label) {
				case 'full name':       $entry['full_name'] = $value; break;
				case 'components':      $inComponents = true; break; // a numbered list follows
				case 'when to use':     $entry['when_to_use'] = $value; break;
				case 'when not to use': $entry['when_not_to_use'] = $value; break;
				case 'example':         $entry['example'] = $value; break;
				// The doc gives a prose source and a link source under the same
				// label; keep both rather than letting the second overwrite.
				case 'source':          $entry['sources'][] = $value; break;
			}
			continue;
		}

		if ($inComponents && preg_match('/^(?:\d+\.|[-*])\s*(.+)$/', $line, $m)) {
			$entry['components'][] = trim($m[1]);
		}
	}

	return $entry;
}
