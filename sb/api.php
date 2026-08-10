<?php
/**
 * Code for /sb/api.php
 *
 * Signal - Storyboards guest gateway
 *
 * The second front door to /api/storyboards.php, for people who reached a
 * storyboard with a codeword and have no Signal account.
 *
 * It exists rather than loosening /api/api.php because that file returns 401
 * before any dispatch when $_SESSION['user_id'] is unset, and reads its CSRF
 * token out of $_SESSION — the highest-traffic lines in the codebase. A guest
 * has neither. Widening that gate for one module would put every Signal request
 * through a looser check; a separate entry point costs a few lines of parsing
 * and leaves the account path exactly as it was.
 *
 * The module itself is shared and unchanged: both gateways establish an actor
 * and hand it the same handler.
 *
 * @version 8.8 Samara
 * @author Alex & Claude
 */

declare(strict_types=1);

ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';
require_once __DIR__ . '/../incs/helpers.php';
require_once __DIR__ . '/../incs/sb_access.php';
require_once __DIR__ . '/../api/storyboards.php';

try {
	$pdo = get_pdo();

	// --- REQUEST PARSING (same shapes /api/api.php accepts) ---
	$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
	$action = null;
	$data = [];

	if (stripos($contentType, 'application/json') !== false) {
		$input = json_decode((string)file_get_contents('php://input'), true) ?: [];
		$action = $input['action'] ?? null;
		$data = $input['data'] ?? $input;
	} elseif (stripos($contentType, 'multipart/form-data') !== false) {
		$action = $_POST['action'] ?? null;
		$data = $_POST['data'] ?? [];
		if (is_string($data)) {
			$decoded = json_decode($data, true);
			if (json_last_error() === JSON_ERROR_NONE) {
				$data = $decoded;
			}
		}
	} else {
		send_json_response(['status' => 'error', 'message' => 'Unsupported content type.'], 415);
	}

	if (!$action) {
		send_json_response(['status' => 'error', 'message' => 'An action is required.'], 400);
	}

	/*
	 * Two actions run before a guest has any session at all — that is the whole
	 * point of them. Neither reads or writes anything belonging to the caller, and
	 * both are rate-limited per IP inside the module, which is what protects the
	 * codeword space. There is no session state for a CSRF token to protect yet.
	 */
	if ($action === 'lookupCode') {
		$anonymous = ['participant_id' => 0, 'user_id' => null, 'display_name' => '', 'is_guest' => true];
		$result = handle_storyboards_action('lookupCode', 'POST', $pdo, $anonymous, $data);
		$httpCode = $result['http_code'] ?? 200;
		unset($result['http_code']);
		send_json_response($result, (int)$httpCode);
	}

	if ($action === 'joinAsGuest') {
		// Resolving the code first means a wrong one never leaves a guest
		// participant row behind for a storyboard nobody joined.
		$lookup = handle_storyboards_action('lookupCode', 'POST', $pdo, [
			'participant_id' => 0, 'user_id' => null, 'display_name' => '', 'is_guest' => true,
		], $data);

		if (($lookup['status'] ?? '') !== 'success') {
			$httpCode = $lookup['http_code'] ?? 400;
			unset($lookup['http_code']);
			send_json_response($lookup, (int)$httpCode);
		}

		$session = sb_create_guest_session($pdo, (string)($data['display_name'] ?? ''));
		sb_set_guest_cookie($session['token']);

		$actor = [
			'participant_id' => $session['participant_id'],
			'user_id'        => null,
			'display_name'   => trim((string)$data['display_name']),
			'is_guest'       => true,
		];

		$result = handle_storyboards_action('joinByCode', 'POST', $pdo, $actor, $data);
		$httpCode = $result['http_code'] ?? 200;
		unset($result['http_code']);

		// The shell needs the CSRF token for every request after this one.
		if (($result['status'] ?? '') === 'success') {
			$result['data']['csrf_token'] = $session['csrf_token'];
		}

		send_json_response($result, (int)$httpCode);
	}

	// --- EVERYTHING ELSE NEEDS A GUEST SESSION ---
	$actor = sb_participant_for_guest_cookie($pdo);
	if ($actor === null) {
		send_json_response(['status' => 'error', 'message' => 'Your guest session has expired. Enter the code again.'], 401);
	}

	$submittedToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
	if (!hash_equals($actor['csrf_token'], (string)$submittedToken)) {
		send_json_response(['status' => 'error', 'message' => 'Invalid or missing CSRF token.'], 403);
	}

	$method = $_SERVER['REQUEST_METHOD'] === 'GET' ? 'GET' : 'POST';
	$result = handle_storyboards_action($action, $method, $pdo, $actor, $data);
	$httpCode = $result['http_code'] ?? 200;
	unset($result['http_code']);
	send_json_response($result, (int)$httpCode);

} catch (Throwable $e) {
	error_log('sb/api.php: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
	http_response_code(500);
	header('Content-Type: application/json');
	echo json_encode(['status' => 'error', 'message' => 'An internal server error occurred.']);
}
