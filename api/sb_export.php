<?php
/**
 * Code for /api/sb_export.php
 *
 * Signal - Storyboards markdown build brief
 *
 * The payoff of the whole view: a storyboard becomes a scene-by-scene set of
 * instructions precise enough that an AI agent can build the deck or document
 * without further context.
 *
 * Two things this file is careful about. Cross-references are stored against
 * stable scene ids and resolved here to "Scene 3 — Title", never to a bare
 * number, so the brief explains itself to a reader who has never seen the app.
 * And the review log is emitted as context under a scene, never mixed into its
 * content — what the reviewers saw as the scene is exactly what the agent gets.
 *
 * @version 8.8 Samara
 * @author Alex & Claude
 */

declare(strict_types=1);

/**
 * The cross-reference token in either form: `<<3>>` as typed, `<<@12>>` as
 * stored. Comma lists parse so an old body written by hand still resolves.
 */
define('SB_CROSSREF_TOKEN', '/<<\s*([^<>]*?)\s*>>/');

/** Split a token's inner text into its parts. */
function sb_ref_parts(string $inner): array {
	return array_values(array_filter(array_map('trim', explode(',', $inner)), static fn($p) => $p !== ''));
}

/**
 * Editing form → stored form: `<<3>>` becomes `<<@12>>`.
 *
 * Binding to the scene's id rather than its position is what lets a storyboard
 * be reordered without silently repointing every reference in it. A position
 * that matches no scene is left exactly as typed rather than dropped — the
 * author gets their text back, not a swallowed mistake.
 */
function sb_refs_positions_to_ids(string $body, array $positionToId): string {
	return (string)preg_replace_callback(SB_CROSSREF_TOKEN, static function (array $m) use ($positionToId): string {
		$parts = sb_ref_parts($m[1]);
		if (!$parts) return $m[0];

		$ids = [];
		foreach ($parts as $part) {
			if (!preg_match('/^\d+$/', $part) || !isset($positionToId[(int)$part])) {
				return $m[0];
			}
			$ids[] = '@' . $positionToId[(int)$part];
		}

		return '<<' . implode(',', $ids) . '>>';
	}, $body);
}

/** Stored form → editing form, for populating an edit box with what was typed. */
function sb_refs_ids_to_positions(string $body, array $idToPosition): string {
	return (string)preg_replace_callback(SB_CROSSREF_TOKEN, static function (array $m) use ($idToPosition): string {
		$parts = sb_ref_parts($m[1]);
		if (!$parts) return $m[0];

		$positions = [];
		foreach ($parts as $part) {
			if (!preg_match('/^@\d+$/', $part) || !isset($idToPosition[(int)substr($part, 1)])) {
				return $m[0];
			}
			$positions[] = $idToPosition[(int)substr($part, 1)];
		}

		return '<<' . implode(',', $positions) . '>>';
	}, $body);
}

/** Stored form → "Scene 3 — Title" labels, for the brief. */
function sb_refs_to_labels(string $body, array $idToLabel): string {
	return (string)preg_replace_callback(SB_CROSSREF_TOKEN, static function (array $m) use ($idToLabel): string {
		$parts = sb_ref_parts($m[1]);
		if (!$parts) return $m[0];

		$labels = [];
		foreach ($parts as $part) {
			if (!preg_match('/^@\d+$/', $part) || !isset($idToLabel[(int)substr($part, 1)])) {
				return $m[0];
			}
			$labels[] = $idToLabel[(int)substr($part, 1)];
		}

		return implode(', ', $labels);
	}, $body);
}

/** Collapse a multi-line body onto one line — markdown list items are one line. */
function sb_one_line(string $text): string {
	return trim((string)preg_replace('/\s*\R+\s*/u', ' ', $text));
}

/* ==========================================================================
   Export actions
   ========================================================================== */

/**
 * Produce the brief and snapshot it.
 *
 * Available to any member: producing a brief changes nothing, and a reviewer who
 * cannot get the artifact out has to ask someone else to press the button.
 *
 * Refused while the delivery brief is incomplete, and the refusal names the
 * fields — those seven answers are the ones that most change what gets built,
 * and they are the author's to make, not the agent's to guess.
 */
function sb_export_storyboard(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	$resolved = sb_require_access($pdo, $storyboardId, $actor, 'read');
	$storyboard = $resolved['storyboard'];

	$missing = sb_brief_missing($storyboard);
	if ($missing) {
		return [
			'status'    => 'error',
			'message'   => 'The delivery brief is incomplete: ' . implode(', ', $missing) . '.',
			'data'      => ['missing' => $missing],
			'http_code' => 409,
		];
	}

	$scope = ($data['scope'] ?? 'all') === 'exclude_backup' ? 'exclude_backup' : 'all';
	$includeNotes = !isset($data['include_notes']) || (!empty($data['include_notes']) && $data['include_notes'] !== 'false');

	$markdown = sb_generate_brief($pdo, $storyboard, $scope, $includeNotes, (string)$actor['display_name']);

	$stmt = $pdo->prepare(
		"INSERT INTO sb_exports (storyboard_id, created_by_participant_id, created_by_name, format, scope, content, created_at)
		 VALUES (:sid, :pid, :name, 'markdown', :scope, :content, UTC_TIMESTAMP())"
	);
	$stmt->execute([
		':sid'     => $storyboardId,
		':pid'     => $actor['participant_id'],
		':name'    => $actor['display_name'],
		':scope'   => $scope,
		':content' => $markdown,
	]);
	$exportId = (int)$pdo->lastInsertId();

	sb_log_event($pdo, $storyboardId, (int)$actor['participant_id'], 'exported', $scope);

	// A filename an agent can be handed as-is.
	$slug = strtolower((string)preg_replace('/[^A-Za-z0-9]+/', '-', (string)$storyboard['title']));
	$slug = trim($slug, '-');
	if ($slug === '') $slug = 'storyboard';

	return sb_ok([
		'export_id' => $exportId,
		'filename'  => $slug . '-build-brief.md',
		'content'   => $markdown,
	]);
}

function sb_list_exports(PDO $pdo, array $actor, array $data): array {
	$storyboardId = sb_int($data, 'storyboard_id');
	sb_require_access($pdo, $storyboardId, $actor, 'read');

	$stmt = $pdo->prepare(
		"SELECT export_id, created_by_name, format, scope, created_at, CHAR_LENGTH(content) AS size
		 FROM sb_exports WHERE storyboard_id = :sid ORDER BY export_id DESC LIMIT 25"
	);
	$stmt->execute([':sid' => $storyboardId]);

	$exports = [];
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
		$exports[] = [
			'export_id'  => (int)$row['export_id'],
			'created_by' => $row['created_by_name'],
			'scope'      => $row['scope'],
			'created_at' => $row['created_at'],
			'size'       => (int)$row['size'],
		];
	}

	return sb_ok(['exports' => $exports]);
}

function sb_get_export(PDO $pdo, array $actor, array $data): array {
	$exportId = sb_int($data, 'export_id');

	$stmt = $pdo->prepare("SELECT * FROM sb_exports WHERE export_id = :eid");
	$stmt->execute([':eid' => $exportId]);
	$export = $stmt->fetch(PDO::FETCH_ASSOC);
	if ($export === false) {
		throw new SbException('Export not found.', 404);
	}

	sb_require_access($pdo, (int)$export['storyboard_id'], $actor, 'read');

	return sb_ok([
		'export_id'  => $exportId,
		'content'    => $export['content'],
		'created_at' => $export['created_at'],
		'created_by' => $export['created_by_name'],
	]);
}

/* ==========================================================================
   The brief itself
   ========================================================================== */

function sb_generate_brief(PDO $pdo, array $storyboard, string $scope, bool $includeNotes, string $generatedBy): string {
	$storyboardId = (int)$storyboard['storyboard_id'];

	$stmt = $pdo->prepare("SELECT * FROM sb_scenes WHERE storyboard_id = :sid ORDER BY position, scene_id");
	$stmt->execute([':sid' => $storyboardId]);
	$scenes = $stmt->fetchAll(PDO::FETCH_ASSOC);

	if ($scope === 'exclude_backup') {
		$scenes = array_values(array_filter($scenes, static fn(array $s) => !(int)$s['is_backup']));
	}

	// Labels are built over the INCLUDED scenes only: a reference pointing at a
	// scene this export left out must stay literal rather than name a section
	// the reader cannot find.
	$idToLabel = [];
	foreach ($scenes as $scene) {
		$idToLabel[(int)$scene['scene_id']] = 'Scene ' . (int)$scene['position'] . ' — ' . $scene['title'];
	}

	$out = [];
	$out[] = '# Build Brief — ' . $storyboard['title'];
	$out[] = '';
	$out[] = '_Generated by Signal Storyboards on ' . gmdate('Y-m-d') . ' by ' . $generatedBy
		. '. This is a scene-by-scene content set for an AI agent to build a presentation deck or '
		. 'document from ' . count($scenes) . ' scenes. If a deck, target 16:9._';
	$out[] = '';
	$out[] = '_The scenes are not intended to be one slide each, nor separate sections of a document, '
		. 'although either may turn out to be right. Use your own judgement, on the delivery brief '
		. 'and the content below, to decide how best to achieve the communication objective._';
	$out[] = '';

	// Rendered from the shared field list, so the header can never drift from
	// what the form collects or what the export gate requires. Optional answers
	// left blank are simply absent.
	foreach (sb_brief_fields() as $field) {
		$value = trim((string)($storyboard[$field['key']] ?? ''));
		if ($value !== '') {
			$out[] = '_' . $field['label'] . ': ' . sb_one_line($value) . '_';
		}
	}
	$out[] = '';

	$out[] = '## How to read this brief';
	$out[] = '- Each `## Scene N` section is one point of the argument. How many slides or sections it '
		. 'becomes is your call — one scene may need several, or several may merge into one.';
	$out[] = '- Scene order is the order of the argument — preserve it; do not reorder.';
	$out[] = "- **Content to build** is the scene's elements — text boxes and reference images — "
		. 'numbered in the order the author arranged them. Render them all, in that order.';
	$out[] = '- **BACKUP** scenes are reserve/appendix — build only if asked.';
	if ($includeNotes) {
		$out[] = "- **Review notes** under a scene are the team's discussion about it, not content to render. "
			. 'Treat them as intent and open questions; where one contradicts the content, the content wins.';
	}
	$out[] = '';

	$out[] = '## Storyboard overview';
	if (!empty($storyboard['description'])) {
		$out[] = (string)$storyboard['description'];
	}
	$out[] = '';

	foreach ($scenes as $scene) {
		$sceneId = (int)$scene['scene_id'];

		$out[] = '---';
		$out[] = '';
		$out[] = '## Scene ' . (int)$scene['position'] . ' — ' . $scene['title']
			. ((int)$scene['is_backup'] ? ' _(BACKUP)_' : '');
		if (!empty($scene['owner_label'])) {
			$out[] = '- **Owner:** ' . $scene['owner_label'];
		}
		$out[] = '';

		$elements = sb_scene_elements($pdo, $sceneId);

		if (!$elements) {
			$out[] = '### Content to build';
			// Named rather than skipped: a gap in the argument is something the
			// author should see in the brief, not something it quietly hides.
			$out[] = '- _No content yet — placeholder only._';
		} else {
			$out[] = "### Content to build (the scene's elements, in order)";
			$hasImage = false;
			foreach ($elements as $index => $element) {
				$n = $index + 1;
				if ($element['type'] === 'text') {
					$out[] = $n . '. ' . sb_one_line(sb_refs_to_labels((string)$element['body'], $idToLabel));
				} else {
					$hasImage = true;
					$out[] = $n . '. _Reference image_ `' . basename((string)$element['url']) . '` — _"'
						. str_replace('"', "'", (string)$element['description']) . '"_';
				}
			}
			if ($hasImage) {
				$out[] = '';
				$out[] = '- Reference images show the layout to match at that point in the sequence; do not copy them verbatim.';
			}
		}

		if ($includeNotes) {
			$stmt = $pdo->prepare("SELECT * FROM sb_comments WHERE scene_id = :sceneId AND status = 'open' ORDER BY comment_id");
			$stmt->execute([':sceneId' => $sceneId]);
			$notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

			if ($notes) {
				// Context, not content — hence its own heading below the scene's
				// elements rather than mixed in among them.
				$out[] = '';
				$out[] = '### Review notes (context, not content)';
				foreach ($notes as $note) {
					$flag = '';
					if ((int)$note['is_action_item']) {
						$flag = ' _(action item' . (!empty($note['action_owner']) ? ' — ' . $note['action_owner'] : '') . ')_';
					}
					$out[] = '- **' . $note['author_name'] . ':**' . $flag . ' '
						. sb_one_line(sb_refs_to_labels((string)$note['body'], $idToLabel));
				}
			}
		}

		$out[] = '';
	}

	$markdown = implode("\n", $out);
	$markdown = (string)preg_replace("/\n{3,}/", "\n\n", $markdown);

	return rtrim($markdown) . "\n";
}
