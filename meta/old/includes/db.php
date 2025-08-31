<?php
/**
 * MyDayHub v4.1.0
 * PDO bootstrap using constants from includes/config.php
 */

declare(strict_types=1);

/**
 * Returns a configured PDO instance.
 * Uses utf8mb4, exceptions, and disables emulate prepares.
 *
 * @throws PDOException on connection failure.
 */
function get_pdo(): PDO {
	$dsn = sprintf(
		'mysql:host=%s;dbname=%s;charset=utf8mb4',
		DB_HOST,
		DB_NAME
	);

	$options = [
		PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		PDO::ATTR_EMULATE_PREPARES   => false,
	];

	return new PDO($dsn, DB_USER, DB_PASS, $options);
}
