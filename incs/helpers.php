<?php
/**
 * Code for /incs/helpers.php
 *
 * MyDayHub - Global Helper Functions
 *
 * This file contains utility functions that are used across multiple
 * parts of the backend application.
 *
 * @version 7.3 Tamarindo
 * @author Alex & Gemini & Claude
 */

declare(strict_types=1);

if (!function_exists('send_json_response')) {
	/**
	 * Encodes and sends a JSON response, appending debug messages if in DEVMODE.
	 * This function also terminates script execution.
	 *
	 * @param array $data The payload to send.
	 * @param int $http_code The HTTP status code to set.
	 */
	function send_json_response(array $data, int $http_code = 200): void {
		global $__DEBUG_MESSAGES__;
		if (defined('DEVMODE') && DEVMODE && !empty($__DEBUG_MESSAGES__)) {
			$data['debug'] = $__DEBUG_MESSAGES__;
		}
		http_response_code($http_code);
		header('Content-Type: application/json');
		echo json_encode($data);
		exit();
	}
}