<?php
/**
 * MyDayHub v4.1.0
 * Main API Gateway (Single Pipe)
 *
 * Frontend sends JSON to this endpoint:
 * { module: "tasks", action: "getAll" | "createTask" | ..., data?: {...} }
 *
 * This gateway:
 *  - boots config and PDO
 *  - validates HTTP method, content type, and (for mutations) CSRF
 *  - dispatches to /api/modules/{module}.handler.php
 *  - always returns JSON with proper HTTP status codes
 */

declare(strict_types=1);

// ---- Bootstrap -------------------------------------------------------------

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

// Ensure session for CSRF; index.php also initializes one for the page shell.
if (session_status() === PHP_SESSION_NONE) {
	session_start();
	if (empty($_SESSION['csrf_token'])) {
		$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
	}
}

// Always JSON.
header('Content-Type: application/json');

// Current user (stub – replace with real auth later).
$userId = 1;

// Create PDO once.
try {
	$pdo = get_pdo();
} catch (Throwable $e) {
	http_response_code(500);
	if (defined('DEVMODE') && DEVMODE === true) {
		file_put_contents(
			dirname(__DIR__) . '/debug.log',
			'[' . date('Y-m-d H:i:s') . '] PDO bootstrap error: ' . $e->getMessage() . PHP_EOL,
			FILE_APPEND
		);
	}
	echo json_encode(['status' => 'error', 'message' => 'Database unavailable.']);
	exit;
}

// ---- Request parsing -------------------------------------------------------

$method  = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$module  = null;
$action  = null;
$data    = [];

// Accept GET (primarily for reads) and POST (for reads and mutations).
if ($method === 'GET') {
	$module = $_GET['module'] ?? null;
	$action = $_GET['action'] ?? null;
} elseif ($method === 'POST') {
	// Validate JSON content type.
	$ct = $_SERVER['CONTENT_TYPE'] ?? '';
	if (stripos($ct, 'application/json') !== 0) {
		http_response_code(415);
		echo json_encode(['status' => 'error', 'message' => 'Unsupported Media Type. Expect application/json.']);
		exit;
	}
	$raw = file_get_contents('php://input') ?: '';
	$payload = json_decode($raw, true);
	if (!is_array($payload)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload.']);
		exit;
	}
	$module = $payload['module'] ?? null;
	$action = $payload['action'] ?? null;
	$data   = $payload['data']   ?? [];
} else {
	http_response_code(405);
	echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
	exit;
}

if (!$module || !$action) {
	http_response_code(400);
	echo json_encode(['status' => 'error', 'message' => 'Missing module or action.']);
	exit;
}

// For now, allow GET for reads. Mutations must be POST.
$mutatingActions = [
	'createTask','toggleComplete','togglePriority','moveTask','deleteTask','duplicateTask'
];
$isMutation = in_array($action, $mutatingActions, true);

if ($isMutation && $method !== 'POST') {
	http_response_code(405);
	echo json_encode(['status' => 'error', 'message' => 'Use POST for mutating actions.']);
	exit;
}

// CSRF validation only for mutations to avoid breaking legacy GET/POST reads.
if ($isMutation) {
	$csrfHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
	$csrfSession = $_SESSION['csrf_token'] ?? '';
	if (!$csrfHeader || !$csrfSession || !hash_equals($csrfSession, $csrfHeader)) {
		http_response_code(403);
		echo json_encode(['status' => 'error', 'message' => 'CSRF token invalid or missing.']);
		exit;
	}
}

// ---- Dispatch --------------------------------------------------------------

try {
	switch ($module) {
		case 'tasks':
			require_once __DIR__ . '/modules/tasks.handler.php';
			// Signature: ($action, $data, $pdo, $userId)
			handle_tasks_action($action, $data, $pdo, $userId);
			break;

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Module '{$module}' not found."]);
			break;
	}
} catch (Throwable $e) {
	http_response_code(500);
	if (defined('DEVMODE') && DEVMODE === true) {
		file_put_contents(
			dirname(__DIR__) . '/debug.log',
			'[' . date('Y-m-d H:i:s') . "] Uncaught in gateway ({$module}/{$action}): " . $e->getMessage() . PHP_EOL,
			FILE_APPEND
		);
	}
	echo json_encode(['status' => 'error', 'message' => 'Server error. Try again.']);
}
