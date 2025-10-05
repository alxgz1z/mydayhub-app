<?php
// /api/calendars.php

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

// Ensure user is authenticated
if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['error' => 'User not authenticated.']);
	exit;
}

// NOTE: We still require a user to be logged in to see the list,
// but the list itself is now global.
$user_id = $_SESSION['user_id']; 
header('Content-Type: application/json');

try {
	// MODIFIED: This query now selects all unique 'event_type' values from the entire table,
	// making the list of available calendars global to all users.
	$stmt = $pdo->prepare(
		"SELECT DISTINCT event_type 
		 FROM calendar_events 
		 WHERE event_type IS NOT NULL AND event_type != ''
		 ORDER BY event_type ASC"
	);
	// The execute call is now empty as there are no parameters to bind.
	$stmt->execute();

	// Fetch the results as a simple array of strings, e.g., ["cisco", "fiscal", "holidays"]
	$calendar_types = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

	echo json_encode($calendar_types);

} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['error' => 'An internal server error occurred.', 'details' => $e->getMessage()]);
}
?>