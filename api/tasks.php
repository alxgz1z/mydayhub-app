<?php
/**
 * MyDayHub Beta 5 - Tasks Module Handler
 *
 * Contains all business logic for task-related API actions.
 * This file is included and called by the main API gateway.
 *
 * @version 5.0.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

/**
 * Fetches all columns and their associated tasks for a given user.
 *
 * @param PDO $pdo The database connection object.
 * @param int $userId The ID of the authenticated user.
 * @return void
 */
function handle_get_all_board_data(PDO $pdo, int $userId): void {
	try {
		// First, get all columns for the user, ordered by their position.
		$stmtColumns = $pdo->prepare(
			"SELECT column_id, column_name, position FROM `columns` WHERE user_id = :userId ORDER BY position ASC"
		);
		$stmtColumns->execute([':userId' => $userId]);
		$columns = $stmtColumns->fetchAll();

		// Prepare the final board structure.
		$boardData = [];
		$columnMap = []; // Use a map for quick lookups.

		foreach ($columns as $column) {
			$column['tasks'] = []; // Initialize an empty tasks array for each column.
			$boardData[] = $column;
			$columnMap[$column['column_id']] = &$boardData[count($boardData) - 1];
		}

		// Now, get all tasks for the user.
		$stmtTasks = $pdo->prepare(
			"SELECT task_id, column_id, encrypted_data, position, classification FROM tasks WHERE user_id = :userId ORDER BY position ASC"
		);
		$stmtTasks->execute([':userId' => $userId]);

		// Distribute tasks into their respective columns.
		while ($task = $stmtTasks->fetch()) {
			$columnId = $task['column_id'];
			if (isset($columnMap[$columnId])) {
				// For now, we just pass the encrypted data. The frontend will handle decryption.
				$columnMap[$columnId]['tasks'][] = $task;
			}
		}

		// Send the complete board data as a success response.
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => $boardData]);

	} catch (Exception $e) {
		if (defined('DEVMODE') && DEVMODE) {
			error_log('Error in tasks.handler.php handle_get_all_board_data(): ' . $e->getMessage());
		}
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A server error occurred while fetching board data.']);
	}
}