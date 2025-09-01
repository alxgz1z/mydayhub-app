<?php
// --- Temporary Environment Variable Test ---

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<pre>"; // Use <pre> tag for clean formatting.

// --- 1. Define Root Path ---
define('ROOT_PATH', __DIR__);
echo "Project Root Path: " . ROOT_PATH . "\n\n";

// --- 2. Check for Composer's Autoloader ---
$autoloaderPath = ROOT_PATH . '/vendor/autoload.php';
echo "Looking for autoloader at: " . $autoloaderPath . "\n";
if (!file_exists($autoloaderPath)) {
	die("FATAL ERROR: Composer autoloader not found. Please run 'composer require vlucas/phpdotenv'.");
}
require_once $autoloaderPath;
echo "Autoloader found and included successfully.\n\n";

// --- 3. Check for .env file ---
$envPath = ROOT_PATH . '/.env';
echo "Looking for .env file at: " . $envPath . "\n";
if (!file_exists($envPath)) {
	die("FATAL ERROR: .env file not found in the project root.");
}
echo ".env file found.\n\n";

// --- 4. Load .env and Print Variables ---
try {
	$dotenv = Dotenv\Dotenv::createImmutable(ROOT_PATH);
	$dotenv->load();
	echo "Dotenv library loaded successfully.\n\n";

	echo "--- ENVIRONMENT VARIABLES LOADED --- \n";

	// Print out the variables that our app uses
	echo "DEV_MODE = " . ($_ENV['DEV_MODE'] ?? 'NOT SET') . "\n";
	echo "DB_HOST = " . ($_ENV['DB_HOST'] ?? 'NOT SET') . "\n";
	echo "DB_NAME = " . ($_ENV['DB_NAME'] ?? 'NOT SET') . "\n";
	echo "DB_USER = " . ($_ENV['DB_USER'] ?? 'NOT SET') . "\n";
	echo "DB_PASS = " . (isset($_ENV['DB_PASS']) ? 'SET (hidden for security)' : 'NOT SET') . "\n";

} catch (Exception $e) {
	die("ERROR loading .env file: " . $e->getMessage());
}

echo "</pre>";

?>