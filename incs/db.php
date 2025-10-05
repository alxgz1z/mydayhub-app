<?php
/**
 * Code for /incs/db.php
 *
 * MyDayHub - Database Connection
 *
 * This file provides a function to establish a secure and configured
 * PDO database connection using the credentials from /incs/config.php.
 *
 * @version 7.4 Jaco
 * @author Alex & Gemini & Claude
 */

// Enable strict typing for function arguments and return values.
declare(strict_types=1);

// Require the configuration file once. This will halt execution if it's missing.
// __DIR__ ensures the path is always relative to the current file's directory.
require_once __DIR__ . '/config.php';

/**
 * Returns a configured PDO instance for database interaction.
 *
 * This function encapsulates the database connection logic, ensuring
 * consistent settings across the application.
 *
 * @return PDO The configured PDO connection object.
 * @throws PDOException on connection failure.
 */
function get_pdo(): PDO {
	// Data Source Name (DSN) for the connection.
	// Specifies the driver, host, database name, and character set.
	$dsn = sprintf(
		'mysql:host=%s;dbname=%s;charset=utf8mb4',
		DB_HOST,
		DB_NAME
	);

	// PDO connection options for security and error handling.
	$options = [
		// Throw exceptions on SQL errors instead of warnings.
		PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
		// Fetch results as associative arrays (e.g., $row['column_name']).
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		// Use the database's native prepared statements for better security.
		PDO::ATTR_EMULATE_PREPARES   => false,
	];

	// Create and return the new PDO object.
	return new PDO($dsn, DB_USER, DB_PASS, $options);
}