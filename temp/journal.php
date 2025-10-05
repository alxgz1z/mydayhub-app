<?php
// /api/journal.php

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

// Ensure user is authenticated
if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['error' => 'User not authenticated.']);
	exit;
}

$user_id = $_SESSION['user_id'];

header('Content-Type: application/json');

// --- LOGIC TO HANDLE JOURNAL EXPORT REQUESTS ---
if (isset($_GET['export']) && $_GET['export'] == 'true') {
	try {
		$range = $_GET['range'] ?? 'all';
		$sql = "SELECT * FROM journal_entries WHERE user_id = ?";
		
		switch ($range) {
			case '1y':
				$sql .= " AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
				break;
			case '3m':
				$sql .= " AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)";
				break;
			case '1m':
				$sql .= " AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
				break;
		}

		$sql .= " ORDER BY entry_date DESC, position_order ASC";

		$stmt = $pdo->prepare($sql);
		$stmt->execute([$user_id]);
		$entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

		echo json_encode($entries);

	} catch (PDOException $e) {
		http_response_code(500);
		echo json_encode(['success' => false, 'message' => 'Export query failed.', 'details' => $e->getMessage()]);
	}
	// Stop the script here to prevent regular GET logic from running
	exit;
}
// --- END OF EXPORT LOGIC ---

$method = $_SERVER['REQUEST_METHOD'];

// Handle regular API requests based on the HTTP method
try {
	switch ($method) {
		case 'GET':
			handleGet($pdo, $user_id);
			break;
		case 'POST':
			handlePost($pdo, $user_id);
			break;
		case 'PUT':
			handlePut($pdo, $user_id);
			break;
		case 'DELETE':
			handleDelete($pdo, $user_id);
			break;
		default:
			http_response_code(405);
			echo json_encode(['error' => 'Method not allowed.']);
			break;
	}
} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['error' => 'An internal server error occurred.', 'details' => $e->getMessage()]);
}

function handleGet($pdo, $user_id) {
	 if (isset($_GET['entry_id'])) {
		 $entry_id = $_GET['entry_id'];
		 $stmt = $pdo->prepare("SELECT * FROM journal_entries WHERE user_id = ? AND entry_id = ?");
		 $stmt->execute([$user_id, $entry_id]);
		 $entry = $stmt->fetch(PDO::FETCH_ASSOC);
		 if ($entry) {
			 echo json_encode($entry);
		 } else {
			 http_response_code(404);
			 echo json_encode(['error' => 'Entry not found.']);
		 }
		 return;
	 }
 
	 if (!isset($_GET['start_date']) || !isset($_GET['end_date'])) {
		 http_response_code(400);
		 echo json_encode(['error' => 'Missing required date parameters.']);
		 return;
	 }
	 $start_date = $_GET['start_date'];
	 $end_date = $_GET['end_date'];
	 $stmt = $pdo->prepare("SELECT * FROM journal_entries WHERE user_id = ? AND entry_date BETWEEN ? AND ? ORDER BY entry_date, position_order ASC");
	 $stmt->execute([$user_id, $start_date, $end_date]);
	 echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
 }

function handlePost($pdo, $user_id) {
	$data = json_decode(file_get_contents('php://input'), true);
	if (!isset($data['entry_date']) || !isset($data['encrypted_data'])) {
		http_response_code(400);
		echo json_encode(['error' => 'Missing required fields in request body.']);
		return;
	}
	
	$entry_date = $data['entry_date'];
	$encrypted_data = $data['encrypted_data'];
	$position_order = 0;

	if (isset($data['position']) && $data['position'] === 'top') {
		$stmt = $pdo->prepare("UPDATE journal_entries SET position_order = position_order + 1 WHERE user_id = ? AND entry_date = ?");
		$stmt->execute([$user_id, $entry_date]);
	} else {
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM journal_entries WHERE user_id = ? AND entry_date = ?");
		$stmt->execute([$user_id, $entry_date]);
		$position_order = $stmt->fetchColumn();
	}
	
	$stmt = $pdo->prepare("INSERT INTO journal_entries (user_id, entry_date, encrypted_data, position_order) VALUES (?, ?, ?, ?)");
	$stmt->execute([$user_id, $entry_date, $encrypted_data, $position_order]);
	
	http_response_code(201);
	echo json_encode(['message' => 'Journal entry created.', 'entry_id' => $pdo->lastInsertId()]);
}

function handlePut($pdo, $user_id) {
	$data = json_decode(file_get_contents('php://input'), true);
	
	if (isset($data['moved_entry_id']) && isset($data['target_date']) && isset($data['ordered_ids_in_column'])) {
		try {
			$pdo->beginTransaction();
			$stmt_update_date = $pdo->prepare("UPDATE journal_entries SET entry_date = ? WHERE entry_id = ? AND user_id = ?");
			$stmt_update_date->execute([$data['target_date'], $data['moved_entry_id'], $user_id]);
			
			$stmt_update_order = $pdo->prepare("UPDATE journal_entries SET position_order = ? WHERE entry_id = ? AND user_id = ?");
			foreach ($data['ordered_ids_in_column'] as $index => $entry_id) {
				$stmt_update_order->execute([$index, $entry_id, $user_id]);
			}
			$pdo->commit();
			echo json_encode(['message' => 'Journal reordered successfully.']);
		} catch (Exception $e) {
			$pdo->rollBack();
			http_response_code(500);
			echo json_encode(['error' => 'Database error during reorder.', 'details' => $e->getMessage()]);
		}
	} else if (isset($data['entry_id']) && isset($data['encrypted_data'])) {
		$stmt = $pdo->prepare("UPDATE journal_entries SET encrypted_data = ? WHERE entry_id = ? AND user_id = ?");
		$stmt->execute([$data['encrypted_data'], $data['entry_id'], $user_id]);
		echo json_encode(['message' => 'Entry updated successfully.']);
	
	} else if (isset($data['entry_id']) && isset($data['is_private'])) {
		$is_private = (int)(bool)$data['is_private'];
		$stmt = $pdo->prepare("UPDATE journal_entries SET is_private = ? WHERE entry_id = ? AND user_id = ?");
		$stmt->execute([$is_private, $data['entry_id'], $user_id]);
		echo json_encode(['message' => 'Entry privacy updated successfully.']);

	} else {
		http_response_code(400);
		echo json_encode(['error' => 'Invalid payload for PUT request.']);
	}
}

function handleDelete($pdo, $user_id) {
	if (!isset($_GET['entry_id'])) {
		http_response_code(400);
		echo json_encode(['error' => 'Missing entry_id parameter.']);
		return;
	}
	
	$stmt = $pdo->prepare("DELETE FROM journal_entries WHERE entry_id = ? AND user_id = ?");
	$stmt->execute([$_GET['entry_id'], $user_id]);
	
	if ($stmt->rowCount() > 0) {
		echo json_encode(['message' => 'Entry deleted successfully.']);
	} else {
		http_response_code(404);
		echo json_encode(['error' => 'Entry not found or user not authorized.']);
	}
}
?>