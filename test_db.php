<?php
// --- Temporary Database Connection Test ---

// 1. Force error reporting ON for this script.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<pre>"; // Use <pre> tag for clean formatting of output.

// 2. Define the path to your config file.
$configPath = __DIR__ . '/incs/config.php';
echo "Attempting to load config file from: " . $configPath . "\n";

if (!file_exists($configPath)) {
	die("FATAL ERROR: Config file not found at the specified path.");
}

// 3. Load the config file.
require_once $configPath;
echo "Config file loaded successfully.\n\n";

// 4. Display the loaded database credentials (except the password).
echo "--- Loaded Credentials ---\n";
echo "DB_HOST: " . (defined('DB_HOST') ? DB_HOST : 'NOT DEFINED') . "\n";
echo "DB_NAME: " . (defined('DB_NAME') ? DB_NAME : 'NOT DEFINED') . "\n";
echo "DB_USER: " . (defined('DB_USER') ? DB_USER : 'NOT DEFINED') . "\n";
echo "DB_PASS is set: " . (defined('DB_PASS') ? 'Yes' : 'No') . "\n\n";

// 5. Attempt to connect to the database.
try {
	echo "Attempting PDO connection...\n";

	$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";

	$options = [
		PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		PDO::ATTR_EMULATE_PREPARES   => false,
	];

	$pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

	echo "SUCCESS: Database connection established!\n";

} catch (PDOException $e) {
	// If the connection fails, this will catch the error.
	die("DATABASE CONNECTION FAILED: " . $e->getMessage());
}

echo "</pre>";

?>