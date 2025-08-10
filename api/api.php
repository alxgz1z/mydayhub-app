<?php
/**
 * MyDayHub v4.0.0
 * Main API Gateway (Single Pipe)
 *
 * Routes all frontend requests to module handlers.
 * This version initializes PDO and passes it to handlers.
 */

declare(strict_types=1);

// TEMP: hardcoded dev user until auth exists.
$userId = 1;

// Core config (DEVMODE, DB constants, error handler, etc.)
require_once __DIR__ . '/../includes/config.php';

// Respond JSON always
header('Content-Type: application/json');

// --- Parse request payload (POST JSON) with GET fallback for quick testing ---
$rawBody = file_get_contents('php://input') ?: '';
$payload = json_decode($rawBody, true) ?: [];

$module = $_GET['module'] ?? ($payload['module'] ?? null);
$action = $_GET['action'] ?? ($payload['action'] ?? null);
$data   = $payload['data'] ?? [];

if (!$module || !$action) {
	http_response_code(400);
	echo json_encode(['status' => 'error', 'message' => 'Missing module or action.']);
	exit;
}

// --- Initialize PDO (UTF-8, exceptions, no emulation) ---
try {
	$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
	$options = [
		PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		PDO::ATTR_EMULATE_PREPARES   => false,
	];
	$pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
	// Log in dev; keep response tidy
	if (defined('DEVMODE') && DEVMODE === true) {
		$log = "[" . date('Y-m-d H:i:s') . "] PDO connect error in " . __FILE__ . ": " . $e->getMessage() . "\n";
		// __DIR__ is /api ; go up one to project root
		file_put_contents(__DIR__ . '/../debug.log', $log, FILE_APPEND);
	}
	http_response_code(500);
	echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
	exit;
}

// --- Route to module handler ---
switch ($module) {
	case 'tasks':
		require_once __DIR__ . '/modules/tasks.handler.php';
		// Handler echoes JSON and exits
		handle_tasks_action($action, $data, $pdo, $userId);
		break;

	// Future: journal, users, etc.

	default:
		http_response_code(404);
		echo json_encode(['status' => 'error', 'message' => "Module '{$module}' not found."]);
		break;
}
