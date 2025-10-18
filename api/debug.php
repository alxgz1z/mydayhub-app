<?php
// Minimal debug collector (DEV only). Writes JSON payloads to storage/debug/*.json with timestamp.
declare(strict_types=1);

require_once __DIR__ . '/../incs/config.php';

// Block if not DEV mode (uses DEV_MODE from .env via incs/config.php)
if (!defined('DEVMODE') || !DEVMODE) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Debug endpoint disabled']);
    exit;
}

header('Content-Type: application/json');

$raw = file_get_contents('php://input') ?: '';
if ($raw === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Empty body']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
    exit;
}

$dir = __DIR__ . '/../storage/debug';
if (!is_dir($dir)) {
    @mkdir($dir, 0775, true);
}

$ts = date('Ymd_His');
$fname = $dir . '/report_' . $ts . '_' . bin2hex(random_bytes(3)) . '.json';
file_put_contents($fname, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo json_encode(['status' => 'ok', 'file' => basename($fname)]);
?>


