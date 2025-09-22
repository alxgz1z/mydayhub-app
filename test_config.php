<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "Testing config.php inclusion...\n";
try {
	require_once __DIR__ . '/incs/config.php';
	echo "✅ Config loaded successfully\n";
	echo "Session timeout: " . ($_SESSION['session_timeout'] ?? 'not set') . "\n";
} catch (Exception $e) {
	echo "❌ Error: " . $e->getMessage() . "\n";
}
?>