<?php
// /api/calendar_events.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['error' => 'User not authenticated.']);
	exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
	try {
		// MODIFIED: Removed the "WHERE user_id = ?" clause to make all calendar events global.
		$stmt = $pdo->prepare("SELECT * FROM `calendar_events` ORDER BY start_date ASC");
		$stmt->execute(); // No user ID parameter is needed now.
		$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
		echo json_encode($events);
	} catch (PDOException $e) {
		http_response_code(500);
		echo json_encode(['error' => 'Database query failed.', 'details' => $e->getMessage()]);
	}
} else {
	http_response_code(405);
	echo json_encode(['error' => 'Method not allowed.']);
}

?>