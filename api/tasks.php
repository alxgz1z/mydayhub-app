<?php
/**
 * MyDayHub v4.1.0
 * Deprecated endpoint stub.
 * All task requests must go through /api/api.php
 */
header('Content-Type: application/json');
http_response_code(410);
echo json_encode([
	'status'  => 'error',
	'message' => 'Deprecated endpoint. Use /api/api.php with {module, action}.'
]);
