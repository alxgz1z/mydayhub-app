<?php
/**
 * MyDayHub - Standalone Database Connection Test
 *
 * This script attempts to connect to the database and fetch a simple record.
 * It has no dependencies on the main application.
 * Access it directly via browser: /api/db_test.php
 */

// --- Test Configuration ---
$db_host = 'localhost';
$db_name = 'mydayhub'; // As per your clarification
$db_user = 'root';     // Standard for XAMPP
$db_pass = '';         // Standard for XAMPP
$charset = 'utf8mb4';

// Set headers to ensure we see a clean JSON or text response
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// --- Connection Attempt ---
try {
	$dsn = "mysql:host=$db_host;dbname=$db_name;charset=$charset";
	$options = [
		PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		PDO::ATTR_EMULATE_PREPARES   => false,
	];

	$pdo = new PDO($dsn, $db_user, $db_pass, $options);

} catch (\PDOException $e) {
	// If connection fails, output a JSON error and stop.
	http_response_code(500);
	echo json_encode([
		'status' => 'error',
		'message' => 'Database Connection Failed.',
		'details' => $e->getMessage()
	]);
	exit;
}


// --- Data Fetch Attempt ---
try {
	// If connection was successful, try to fetch the columns for our test user.
	$stmt = $pdo->prepare("SELECT column_id, column_name, position FROM `columns` WHERE user_id = :userId ORDER BY position ASC");
	$stmt->execute([':userId' => 1]);
	$columns = $stmt->fetchAll();

	// If successful, output the data as JSON.
	http_response_code(200);
	echo json_encode([
		'status' => 'success',
		'message' => 'Successfully fetched data.',
		'data' => $columns
	]);

} catch (\PDOException $e) {
	// If the query fails, output a JSON error.
	http_response_code(500);
	echo json_encode([
		'status' => 'error',
		'message' => 'Data Fetch Failed.',
		'details' => $e->getMessage()
	]);
	exit;
}