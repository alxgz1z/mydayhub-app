# FULL CODE APP BETA 4
*snapshot 8/30/25*

## index.php 
*START FULL CODE FOR FILE:	index.php*
~~~
<?php
/**
 * MyDayHub 4.4.0 Beta - Main Application Shell
 */

require_once __DIR__ . '/includes/config.php';

/**
 * Ensure a PHP session exists and expose a CSRF token for the frontend.
 * The API gateway also relies on the same session cookie, so the token here
 * and the token the API validates are the same value.
 */
if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
if (empty($_SESSION['csrf_token'])) {
	$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$CSRF_TOKEN = $_SESSION['csrf_token'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<!-- viewport-fit=cover is needed for iOS safe-area handling -->
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

	<title>MyDayHub</title>

	<!-- Expose CSRF token for /assets/js/* to read -->
	<meta name="csrf" content="<?php echo htmlspecialchars($CSRF_TOKEN, ENT_QUOTES, 'UTF-8'); ?>">

	<link rel="icon" href="assets/images/favicon.png" type="image/png">
	<link rel="stylesheet" href="/assets/css/style.css">
	<link rel="stylesheet" href="/assets/css/views/tasks.css">
	<link rel="stylesheet" href="/assets/css/views/editor.css">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.1/math.min.js"></script>
</head>
<body <?php if (DEVMODE) echo 'class="dev-mode-active"'; ?>>

	<div id="main-app-container">

		<header id="app-header">
			<div class="header-left">
				<img src="/assets/images/icon.png" alt="MyDayHub Logo" id="header-logo">
				<h1 id="app-title">MyDayHub</h1>
				<nav class="view-tabs">
					<button class="view-tab active" data-view="tasks">Tasks</button>
					<button class="view-tab" data-view="journal">Journal</button>
					<button class="view-tab" data-view="outlines">Outlines</button>
					<button class="view-tab" data-view="meetings">Meetings</button>
				</nav>
			</div>
			<div class="header-right">
				<div id="add-column-container">
					<button id="btn-add-new-column">+ New Column</button>
				</div>

				<button id="mobile-menu-toggle" class="btn-icon">&## 9776;</button>
				<div id="mobile-menu-dropdown"></div>
			</div>
		</header>

		<main id="main-content">
			<div id="task-board-container" class="view-container active">
				<div id="task-columns-wrapper"></div>
			</div>

			<div id="journal-view-container" class="view-container"></div>
			<div id="outlines-view-container" class="view-container"></div>
			<div id="meetings-view-container" class="view-container"></div>
		</main>

	</div>

	<div id="confirmation-modal-overlay" class="modal-overlay">
		<div class="modal-dialog">
			<h3 id="modal-title">Confirmation</h3>
			<p id="modal-message">Are you sure?</p>
			<div class="modal-actions">
				<button id="modal-btn-cancel" class="btn btn-secondary">Cancel</button>
				<button id="modal-btn-confirm" class="btn btn-primary">OK</button>
			</div>
		</div>
	</div>

	<div id="unified-editor-overlay" class="modal-overlay">
		<div id="unified-editor-container" class="modal-dialog">

			<div class="modal-header">
				<h3 id="editor-title">Edit Note</h3>
				<div class="editor-controls">
					<!-- Modified for notes_save_close -->
					<button id="btn-editor-save-close" class="btn-icon" title="Save & Close">
					  ??
					</button>
					<button id="editor-btn-maximize" class="btn-icon" title="Maximize">?</button>
					<button id="editor-btn-restore" class="btn-icon" title="Restore" style="display: none;">?</button>
					<button id="editor-btn-close" class="btn-icon" title="Close">&times;</button>
				</div>
			</div>

			<div id="editor-ribbon">
				<nav id="editor-ribbon-tabs">
					<button class="ribbon-tab active" data-panel="format">Format</button>
					<button class="ribbon-tab" data-panel="find-replace">Find & Replace</button>
				</nav>
				<div id="editor-ribbon-panels">
					<div class="ribbon-panel active" id="editor-panel-format">
						<div class="ribbon-button-group">
							<div class="visible-buttons">
								<button class="btn-icon" title="Uppercase" data-action="case" data-casetype="upper">AA</button>
								<button class="btn-icon" title="Title Case" data-action="case" data-casetype="title">Aa</button>
								<button class="btn-icon" title="lowercase" data-action="case" data-casetype="lower">aa</button>
								<button class="btn-icon" title="Underline Selection" data-action="underline"><u>U</u></button>
								<button class="btn-icon" title="Frame Selection" data-action="frame">[]</button>
								<button class="btn-icon" title="Calculate Selection" data-action="calculate">??</button>
								<button class="btn-icon" title="Decrease Font Size" data-action="font-size" data-change="-1">A-</button>
								<button class="btn-icon" title="Increase Font Size" data-action="font-size" data-change="1">A+</button>
							</div>
						</div>
					</div>
					<div class="ribbon-panel" id="editor-panel-find-replace"></div>
				</div>
			</div>

			<div class="modal-body">
				<textarea id="editor-textarea" placeholder="Start writing..."></textarea>
			</div>

			<div class="modal-footer" id="editor-status-bar">
				<div id="editor-doc-stats">
					<span>Words: 0</span>
					<span>Chars: 0</span>
				</div>
				<div id="editor-save-status">Last saved: Never</div>
			</div>

		</div>
	</div>

	<script defer src="/assets/js/editor.js"></script>
	<script defer src="/assets/js/tasks.js"></script>
	<script defer src="/assets/js/app.js"></script>

</body>
</html>
~~~
*END FULL CODE FOR FILE: index.php* 


## config.php
*START FULL CODE FOR FILE: 	/include/config.php*
~~~ 
<?php
/**
 * MyDayHub 4.0.0 Beta - Core Configuration
 *
 * This file contains the essential configuration settings for the application.
 * It initializes constants for directory paths, database credentials, and
 * operational modes like DEVMODE. This centralized approach ensures that all
 * other scripts can access these core settings reliably.
 *
 * @version 4.0.0
 * @author Alex & Gemini
 */

// --- CORE CONSTANTS & ERROR REPORTING --- //

/**
 * DEVMODE: The master switch for debugging.
 * Set to TRUE to enable detailed error logging, visual debug markers,
 * and extra console output.
 * Set to FALSE for production environments.
 */
define('DEVMODE', true);

// Set error reporting based on DEVMODE.
if (DEVMODE) {
	// Report all possible errors and display them directly in the output.
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);
} else {
	// Disable error display in production and rely on server logs.
	ini_set('display_errors', 0);
	ini_set('display_startup_errors', 0);
	error_reporting(0);
}


// --- CUSTOM ERROR HANDLER (FOR DEVMODE) --- //
// This block defines a custom error handler to log errors to a file
// instead of outputting them as HTML, which would break JSON responses.
if (DEVMODE) {
	/**
	 * Custom error handler to log errors to debug.log.
	 * @param int $errno The error level.
	 * @param string $errstr The error message.
	 * @param string $errfile The file where the error occurred.
	 * @param int $errline The line number of the error.
	 */
	function mydayhub_error_handler($errno, $errstr, $errfile, $errline) {
		// Only handle the error if it's included in the current error_reporting level.
		if (!(error_reporting() & $errno)) {
			return false;
		}

		$logMessage = "[" . date('Y-m-d H:i:s') . "] ";
		switch ($errno) {
			case E_USER_ERROR:   $logMessage .= "Fatal Error"; break;
			case E_USER_WARNING: $logMessage .= "Warning"; break;
			case E_USER_NOTICE:  $logMessage .= "Notice"; break;
			default:             $logMessage .= "Error ($errno)"; break;
		}

		$logMessage .= ": {$errstr} in {$errfile} on line {$errline}\n";

		// Use ROOT_PATH (defined below) to ensure we log to the project root.
		file_put_contents(ROOT_PATH . '/debug.log', $logMessage, FILE_APPEND);

		// Don't execute the default PHP internal error handler, and halt the script
		// to prevent broken output from being sent to the client.
		exit(1);
	}

	// Set our custom function as the default error handler for the application.
	set_error_handler('mydayhub_error_handler');
}


// --- DATABASE CREDENTIALS (UPDATED FOR LOCAL MAMP) --- //
define('DB_HOST', '');
define('DB_USER', '');
define('DB_PASS', '');
define('DB_NAME', '');


// --- SESSION & SECURITY --- //
define('SESSION_TIMEOUT_SECONDS', 28800); // 8 hours


// --- SMTP (MAIL) SERVICE --- //
define('SMTP_HOST', '');
define('SMTP_USER', '');
define('SMTP_PASS', '');
define('SMTP_PORT', 587);
define('SMTP_FROM_EMAIL', '');
define('SMTP_FROM_NAME', '');


// --- FILE PATHS --- //
define('INCLUDES_PATH', __DIR__);
define('ROOT_PATH', dirname(INCLUDES_PATH));

// The stray `}` that was causing the parse error has been removed from the end.
<END FULL CODE FOR FILE: 	/include/config.php	  >
		
## <START FULL CODE FOR FILE: 	/include/db.php	  >
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
<END FULL CODE FOR FILE: 	/include/db.php	  >
~~~
		

## api.php
*START FULL CODE FOR FILE: 	/api/api.php*
~~~
<?php
/**
 * MyDayHub v4.1.1
 * Main API Gateway (Single Pipe)
 *
 * Frontend sends JSON to this endpoint:
 * { module: "tasks", action: "getAll" | "createTask" | ..., data?: {...} }
 *
 * This gateway:
 *  - boots config and PDO
 *  - validates HTTP method, content type, and (for mutations) CSRF
 *  - dispatches to /api/modules/{module}.handler.php
 *  - always returns JSON with proper HTTP status codes
 */

declare(strict_types=1);

// ---- Bootstrap -------------------------------------------------------------

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

// Ensure session for CSRF; index.php also initializes one for the page shell.
if (session_status() === PHP_SESSION_NONE) {
	session_start();
	if (empty($_SESSION['csrf_token'])) {
		$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
	}
}

// Always JSON.
header('Content-Type: application/json');

// Small helper for dev logging.
$devlog = function (string $msg): void {
	if (defined('DEVMODE') && DEVMODE === true) {
		@file_put_contents(
			dirname(__DIR__) . '/debug.log',
			'[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL,
			FILE_APPEND
		);
	}
};

// Current user (stub – replace with real auth later).
$userId = 1;

// Create PDO once.
try {
	$pdo = get_pdo();
} catch (Throwable $e) {
	http_response_code(500);
	$devlog('PDO bootstrap error: ' . $e->getMessage());
	echo json_encode(['status' => 'error', 'message' => 'Database unavailable.']);
	exit;
}

// ---- Request parsing -------------------------------------------------------

$method  = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$module  = null;
$action  = null;
$data    = [];

// Accept GET (primarily for reads) and POST (for reads and mutations).
if ($method === 'GET') {
	$module = $_GET['module'] ?? null;
	$action = $_GET['action'] ?? null;
} elseif ($method === 'POST') {
	// Validate JSON content type.
	$ct = $_SERVER['CONTENT_TYPE'] ?? '';
	if (stripos($ct, 'application/json') !== 0) {
		http_response_code(415);
		echo json_encode([
			'status'  => 'error',
			'message' => 'Unsupported Media Type. Expect application/json.'
		]);
		exit;
	}
	$raw = file_get_contents('php://input') ?: '';
	$payload = json_decode($raw, true);
	if (!is_array($payload)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload.']);
		exit;
	}
	$module = $payload['module'] ?? null;
	$action = $payload['action'] ?? null;
	$data   = $payload['data']   ?? [];
} else {
	http_response_code(405);
	echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
	exit;
}

if (!$module || !$action) {
	http_response_code(400);
	echo json_encode(['status' => 'error', 'message' => 'Missing module or action.']);
	exit;
}

// For now, allow GET for reads. Mutations must be POST.
$mutatingActions = [
	// existing
	'createTask','toggleComplete','togglePriority','moveTask','deleteTask','duplicateTask',
	// added for columns persistence
	'createColumn','deleteColumn'
];
$isMutation = in_array($action, $mutatingActions, true);

if ($isMutation && $method !== 'POST') {
	http_response_code(405);
	echo json_encode(['status' => 'error', 'message' => 'Use POST for mutating actions.']);
	exit;
}

// CSRF validation only for mutations to avoid breaking legacy GET/POST reads.
if ($isMutation) {
	$csrfHeader  = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
	$csrfSession = $_SESSION['csrf_token']       ?? '';
	if (!$csrfHeader || !$csrfSession || !hash_equals($csrfSession, $csrfHeader)) {
		http_response_code(403);
		echo json_encode(['status' => 'error', 'message' => 'CSRF token invalid or missing.']);
		exit;
	}
}

// ---- Dispatch --------------------------------------------------------------

try {
	switch ($module) {
		case 'tasks':
			require_once __DIR__ . '/modules/tasks.handler.php';
			// Signature: ($action, $data, $pdo, $userId)
			handle_tasks_action($action, $data, $pdo, $userId);
			break;

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Module '{$module}' not found."]);
			break;
	}
} catch (Throwable $e) {
	http_response_code(500);
	$devlog("Uncaught in gateway ({$module}/{$action}): " . $e->getMessage());
	echo json_encode(['status' => 'error', 'message' => 'Server error. Try again.']);
}
~~~
*END FULL CODE FOR FILE: 	/api/api.php*
		

## tasks.handler.php
*START FULL CODE FOR FILE: 	/api/modules/tasks.handler.php*
~~~
<?php
/**
 * MyDayHub v4.4.4
 * Tasks Module Handler
 *
 * Business logic for all "tasks" module actions.
 * Included by /api/api.php (gateway).
 *
 * Gateway calls:
 *   handle_tasks_action($action, $data, $pdo, $userId)
 */

declare(strict_types=1);

function handle_tasks_action($action, $data, $pdo, $userId) {
	switch ($action) {
		case 'getAll':          get_all_board_data($pdo, (int)$userId);         break;
		case 'createTask':      create_task($pdo, (int)$userId, $data);         break;
		case 'moveTask':        move_task($pdo, (int)$userId, $data);           break;
		case 'toggleComplete':  toggle_complete($pdo, (int)$userId, $data);     break;
		case 'togglePriority':  toggle_priority($pdo, (int)$userId, $data);     break;
		case 'reorderColumn':   reorder_column($pdo, (int)$userId, $data);      break;

		// Columns
		case 'createColumn':    create_column($pdo, (int)$userId, $data);       break;
		case 'deleteColumn':    delete_column($pdo, (int)$userId, $data);       break;
		case 'renameColumn':    rename_column($pdo, (int)$userId, $data);       break;

		// NEW: Tasks – persistence for quick actions
		case 'deleteTask':      delete_task($pdo, (int)$userId, $data);         break;
		case 'duplicateTask':   duplicate_task($pdo, (int)$userId, $data);      break;

		// Modified for inline_rename_tasks
		case 'renameTaskTitle': rename_task_title($pdo, (int)$userId, $data);   break;

		default:
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => "Action '{$action}' not found in tasks module."]);
			break;
	}
}

/** ---------------------------------------------------------------------- **
 * Board (columns + tasks)
 ** ---------------------------------------------------------------------- */
function get_all_board_data(PDO $pdo, int $userId): void {
	try {
		$stmtColumns = $pdo->prepare(
			"SELECT column_id, column_name, position
			   FROM `columns`
			  WHERE user_id = :uid
			  ORDER BY position ASC"
		);
		$stmtColumns->execute([':uid' => $userId]);

		$columnsMap = [];
		while ($row = $stmtColumns->fetch(PDO::FETCH_ASSOC)) {
			$row['column_id'] = (int)$row['column_id'];
			$row['position']  = (int)$row['position'];
			$row['tasks']     = [];
			$columnsMap[$row['column_id']] = $row;
		}

		$stmtTasks = $pdo->prepare(
			"SELECT task_id, column_id, encrypted_data, position, status
			   FROM tasks
			  WHERE user_id = :uid
			  ORDER BY position ASC"
		);
		$stmtTasks->execute([':uid' => $userId]);

		while ($task = $stmtTasks->fetch(PDO::FETCH_ASSOC)) {
			$cid = (int)$task['column_id'];
			if (!isset($columnsMap[$cid])) continue;
			$data = json_decode($task['encrypted_data'], true);
			$columnsMap[$cid]['tasks'][] = [
				'task_id'   => (int)$task['task_id'],
				'column_id' => $cid,
				'position'  => (int)$task['position'],
				'status'    => $task['status'],
				'data'      => (json_last_error() === JSON_ERROR_NONE) ? $data : ['title' => 'Untitled Task']
			];
		}

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => array_values($columnsMap)]);
	} catch (PDOException $e) {
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'A database error occurred.']);
	}
}

/** ---------------------------------------------------------------------- **
 * Tasks: create / move / toggle / reorder
 ** ---------------------------------------------------------------------- */
function create_task(PDO $pdo, int $userId, array $data): void {
	try {
		$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
		$title    = isset($data['title']) ? trim((string)$data['title']) : '';
		$status   = (isset($data['status']) &&
					 in_array($data['status'], ['normal','priority','completed'], true))
				   ? $data['status'] : 'normal';

		if ($columnId <= 0 || $title === '') {
			http_response_code(400);
			echo json_encode(['status' => 'error', 'message' => 'Invalid column_id or title.']);
			return;
		}

		$cstmt = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
		$cstmt->execute([':cid' => $columnId, ':uid' => $userId]);
		if (!$cstmt->fetchColumn()) {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		$pstmt = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid"
		);
		$pstmt->execute([':uid' => $userId, ':cid' => $columnId]);
		$nextPos = (int)$pstmt->fetchColumn();

		$edata = json_encode(['title' => $title], JSON_UNESCAPED_UNICODE);

		$istmt = $pdo->prepare(
			"INSERT INTO tasks (user_id, column_id, encrypted_data, position, status, created_at, updated_at)
			 VALUES (:uid, :cid, :edata, :pos, :status, NOW(), NOW())"
		);
		$istmt->execute([
			':uid'    => $userId,
			':cid'    => $columnId,
			':edata'  => $edata,
			':pos'    => $nextPos,
			':status' => $status
		]);

		$newId = (int)$pdo->lastInsertId();
		http_response_code(201);
		echo json_encode([
			'status' => 'success',
			'data'   => [
				'task_id'   => $newId,
				'column_id' => $columnId,
				'position'  => $nextPos,
				'status'    => $status,
				'data'      => ['title' => $title]
			]
		]);
	} catch (PDOException $e) {
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not create task.']);
	}
}

function move_task(PDO $pdo, int $userId, array $data): void {
	$taskId     = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$toColumnId = isset($data['to_column_id']) ? (int)$data['to_column_id'] : 0;

	if ($taskId <= 0 || $toColumnId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id or to_column_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$tstmt = $pdo->prepare(
			"SELECT task_id, user_id, column_id, position, status, encrypted_data
			   FROM tasks
			  WHERE task_id = :tid AND user_id = :uid
			  FOR UPDATE"
		);
		$tstmt->execute([':tid' => $taskId, ':uid' => $userId]);
		$task = $tstmt->fetch(PDO::FETCH_ASSOC);
		if (!$task) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}

		$fromColumnId = (int)$task['column_id'];
		if ($fromColumnId === $toColumnId) {
			$pdo->commit();
			http_response_code(200);
			echo json_encode(['status' => 'success', 'data' => _normalize_task($task)]);
			return;
		}

		$cstmt = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
		$cstmt->execute([':cid' => $toColumnId, ':uid' => $userId]);
		if (!$cstmt->fetchColumn()) {
			$pdo->rollBack();
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		$pstmt = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid"
		);
		$pstmt->execute([':uid' => $userId, ':cid' => $toColumnId]);
		$nextPos = (int)$pstmt->fetchColumn();

		$ustmt = $pdo->prepare(
			"UPDATE tasks
				SET column_id = :to_cid, position = :pos, updated_at = NOW()
			  WHERE task_id = :tid AND user_id = :uid"
		);
		$ustmt->execute([
			':to_cid' => $toColumnId,
			':pos'    => $nextPos,
			':tid'    => $taskId,
			':uid'    => $userId
		]);

		$sstmt = $pdo->prepare(
			"SELECT task_id
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid
			  ORDER BY position ASC"
		);
		$sstmt->execute([':uid' => $userId, ':cid' => $fromColumnId]);

		$newPos = 0;
		$up = $pdo->prepare("UPDATE tasks SET position = :p, updated_at = NOW() WHERE task_id = :tid");
		while ($id = $sstmt->fetchColumn()) {
			$up->execute([':p' => $newPos++, ':tid' => (int)$id]);
		}

		$dstmt = $pdo->prepare(
			"SELECT task_id, column_id, position, status, encrypted_data
			   FROM tasks
			  WHERE task_id = :tid"
		);
		$dstmt->execute([':tid' => $taskId]);
		$final = $dstmt->fetch(PDO::FETCH_ASSOC);

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => _normalize_task($final)]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not move task.']);
	}
}

function toggle_complete(PDO $pdo, int $userId, array $data): void {
	$taskId    = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$completed = isset($data['completed']) ? (bool)$data['completed'] : false;

	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$ustatus = $completed ? 'completed' : 'normal';
		$pdo->prepare(
			"UPDATE tasks SET status = :st, updated_at = NOW()
			  WHERE task_id = :tid AND user_id = :uid"
		)->execute([':st' => $ustatus, ':tid' => $taskId, ':uid' => $userId]);

		$sel = $pdo->prepare(
			"SELECT task_id, column_id, position, status, encrypted_data
			   FROM tasks
			  WHERE task_id = :tid AND user_id = :uid"
		);
		$sel->execute([':tid' => $taskId, ':uid' => $userId]);
		$row = $sel->fetch(PDO::FETCH_ASSOC);
		if (!$row) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => _normalize_task($row)]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not update completion.']);
	}
}

/**
 * Toggle a task's priority status and return the updated task.
 *
 * Input (JSON data under "data"):
 *   { "task_id": <int>, "priority": <bool> }
 */
function toggle_priority(PDO $pdo, int $userId, array $data): void
{
	if (!isset($data['task_id'], $data['priority'])) {
		http_response_code(400);
		echo json_encode([
			'status'  => 'error',
			'message' => 'Missing required fields: task_id, priority',
			'code'    => 400
		]);
		return;
	}

	$taskId   = (int)$data['task_id'];
	$toHigh   = (bool)$data['priority'];
	$newState = $toHigh ? 'priority' : 'normal';

	try {
		$stmt = $pdo->prepare("
			SELECT task_id, user_id, column_id, status
			  FROM tasks
			 WHERE task_id = :task_id
			 LIMIT 1
		");
		$stmt->execute([':task_id' => $taskId]);
		$task = $stmt->fetch(PDO::FETCH_ASSOC);

		if (!$task) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found', 'code' => 404]);
			return;
		}
		if ((int)$task['user_id'] !== $userId) {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden', 'code' => 403]);
			return;
		}
		if ($task['status'] === 'completed') {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Completed tasks cannot be prioritized', 'code' => 403]);
			return;
		}

		$upd = $pdo->prepare("
			UPDATE tasks
			   SET status = :status, updated_at = NOW()
			 WHERE task_id = :task_id AND user_id = :user_id
			 LIMIT 1
		");
		$upd->execute([
			':status'  => $newState,
			':task_id' => $taskId,
			':user_id' => $userId
		]);

		$out = $pdo->prepare("
			SELECT t.task_id, t.user_id, t.column_id, t.status, t.position, t.encrypted_data, t.created_at, t.updated_at
			  FROM tasks t
			 WHERE t.task_id = :task_id
			 LIMIT 1
		");
		$out->execute([':task_id' => $taskId]);
		$updated = $out->fetch(PDO::FETCH_ASSOC);
		if (!$updated) {
			http_response_code(500);
			echo json_encode(['status' => 'error', 'message' => 'Task update failed to load', 'code' => 500]);
			return;
		}

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => $updated]);
	} catch (Throwable $e) {
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Server error while toggling priority', 'code' => 500]);
	}
}

function reorder_column(PDO $pdo, int $userId, array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
	$ordered  = isset($data['ordered']) && is_array($data['ordered']) ? $data['ordered'] : [];

	if ($columnId <= 0 || empty($ordered)) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid column_id or empty order.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$c = $pdo->prepare("SELECT 1 FROM `columns` WHERE column_id = :cid AND user_id = :uid");
		$c->execute([':cid' => $columnId, ':uid' => $userId]);
		if (!$c->fetchColumn()) {
			$pdo->rollBack();
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		$u = $pdo->prepare(
			"UPDATE tasks
				SET position = :pos, updated_at = NOW()
			  WHERE task_id = :tid AND user_id = :uid AND column_id = :cid"
		);
		foreach ($ordered as $i => $taskId) {
			$u->execute([
				':pos' => (int)$i,
				':tid' => (int)$taskId,
				':uid' => $userId,
				':cid' => $columnId
			]);
		}

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success']);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not reorder column.']);
	}
}

/** ---------------------------------------------------------------------- **
 * Columns
 ** ---------------------------------------------------------------------- */
function create_column(PDO $pdo, int $userId, array $data): void {
	$name = isset($data['column_name']) ? trim((string)$data['column_name']) : '';
	if ($name === '') {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Column name required.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$q = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1 FROM `columns` WHERE user_id = :uid"
		);
		$q->execute([':uid' => $userId]);
		$nextPos = (int)$q->fetchColumn();

		try {
			$ins = $pdo->prepare(
				"INSERT INTO `columns` (user_id, column_name, position, created_at, updated_at)
				 VALUES (:uid, :name, :pos, NOW(), NOW())"
			);
			$ins->execute([':uid' => $userId, ':name' => $name, ':pos' => $nextPos]);
		} catch (PDOException $e) {
			if ($e->getCode() !== '42S22') throw $e; // unknown column
			$ins2 = $pdo->prepare(
				"INSERT INTO `columns` (user_id, column_name, position)
				 VALUES (:uid, :name, :pos)"
			);
			$ins2->execute([':uid' => $userId, ':name' => $name, ':pos' => $nextPos]);
		}

		$newId = (int)$pdo->lastInsertId();
		$pdo->commit();

		http_response_code(201);
		echo json_encode(['status' => 'success', 'data' => [
			'column_id'   => $newId,
			'column_name' => $name,
			'position'    => $nextPos
		]]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not create column.']);
	}
}

function delete_column(PDO $pdo, int $userId, array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
	if ($columnId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid column_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$chk = $pdo->prepare(
			"SELECT position FROM `columns` WHERE column_id = :cid AND user_id = :uid FOR UPDATE"
		);
		$chk->execute([':cid' => $columnId, ':uid' => $userId]);
		if (!$chk->fetch(PDO::FETCH_ASSOC)) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Column not found.']);
			return;
		}

		$pdo->prepare(
			"DELETE FROM tasks WHERE user_id = :uid AND column_id = :cid"
		)->execute([':uid' => $userId, ':cid' => $columnId]);

		$pdo->prepare(
			"DELETE FROM `columns` WHERE column_id = :cid AND user_id = :uid"
		)->execute([':cid' => $columnId, ':uid' => $userId]);

		$sel = $pdo->prepare(
			"SELECT column_id FROM `columns` WHERE user_id = :uid ORDER BY position ASC"
		);
		$sel->execute([':uid' => $userId]);

		$pos = 0;
		$withUpdated = true;
		while ($cid = $sel->fetchColumn()) {
			try {
				if ($withUpdated) {
					$up = $pdo->prepare(
						"UPDATE `columns` SET position = :p, updated_at = NOW() WHERE column_id = :cid"
					);
				} else {
					$up = $pdo->prepare(
						"UPDATE `columns` SET position = :p WHERE column_id = :cid"
					);
				}
				$up->execute([':p' => $pos++, ':cid' => (int)$cid]);
			} catch (PDOException $e) {
				if ($e->getCode() === '42S22' && $withUpdated) {
					$withUpdated = false;
					$pdo->prepare(
						"UPDATE `columns` SET position = :p WHERE column_id = :cid"
					)->execute([':p' => $pos - 1, ':cid' => (int)$cid]);
				} else {
					throw $e;
				}
			}
		}

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => ['column_id' => $columnId]]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not delete column.']);
	}
}

/** Modified for inline_rename_columns (already required by JS) */
function rename_column(PDO $pdo, int $userId, array $data): void {
	$columnId = isset($data['column_id']) ? (int)$data['column_id'] : 0;
	$name     = isset($data['column_name']) ? trim((string)$data['column_name']) : '';

	if ($columnId <= 0 || $name === '') {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid column_id or column_name.']);
		return;
	}

	try {
		$chk = $pdo->prepare("SELECT column_id, user_id FROM `columns` WHERE column_id = :cid LIMIT 1");
		$chk->execute([':cid' => $columnId]);
		$row = $chk->fetch(PDO::FETCH_ASSOC);

		if (!$row) {
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Column not found.']);
			return;
		}
		if ((int)$row['user_id'] !== $userId) {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Forbidden.']);
			return;
		}

		try {
			$upd = $pdo->prepare(
				"UPDATE `columns`
					SET column_name = :name, updated_at = NOW()
				  WHERE column_id = :cid AND user_id = :uid
				  LIMIT 1"
			);
			$upd->execute([':name' => $name, ':cid' => $columnId, ':uid' => $userId]);
		} catch (PDOException $e) {
			if ($e->getCode() !== '42S22') throw $e;
			$upd2 = $pdo->prepare(
				"UPDATE `columns`
					SET column_name = :name
				  WHERE column_id = :cid AND user_id = :uid
				  LIMIT 1"
			);
			$upd2->execute([':name' => $name, ':cid' => $columnId, ':uid' => $userId]);
		}

		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => ['column_id' => $columnId, 'column_name' => $name]]);
	} catch (PDOException $e) {
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not rename column.']);
	}
}

// Modified for inline_rename_tasks
/**
 * Rename a task's title (updates the encrypted_data JSON).
 * Input:  data = { "task_id": <int>, "title": <string> }
 * Output: {"status":"success","data": <normalized task> }
 */
function rename_task_title(PDO $pdo, int $userId, array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	$title  = isset($data['title']) ? trim((string)$data['title']) : '';

	if ($taskId <= 0 || $title === '') {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id or title.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$sel = $pdo->prepare("
			SELECT task_id, user_id, column_id, position, status, encrypted_data
			  FROM tasks
			 WHERE task_id = :tid AND user_id = :uid
			 FOR UPDATE
		");
		$sel->execute([':tid' => $taskId, ':uid' => $userId]);
		$row = $sel->fetch(PDO::FETCH_ASSOC);
		if (!$row) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}

		// Preserve any existing fields; only update title
		$dataJson = json_decode((string)$row['encrypted_data'], true);
		if (json_last_error() !== JSON_ERROR_NONE || !is_array($dataJson)) {
			$dataJson = [];
		}
		$dataJson['title'] = $title;
		$edata = json_encode($dataJson, JSON_UNESCAPED_UNICODE);

		$upd = $pdo->prepare("
			UPDATE tasks
			   SET encrypted_data = :edata, updated_at = NOW()
			 WHERE task_id = :tid AND user_id = :uid
			 LIMIT 1
		");
		$upd->execute([':edata' => $edata, ':tid' => $taskId, ':uid' => $userId]);

		// Return normalized task
		$get = $pdo->prepare("
			SELECT task_id, column_id, position, status, encrypted_data
			  FROM tasks
			 WHERE task_id = :tid
			 LIMIT 1
		");
		$get->execute([':tid' => $taskId]);
		$out = $get->fetch(PDO::FETCH_ASSOC);

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => _normalize_task($out)]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not rename task.']);
	}
}

/** ---------------------------------------------------------------------- **
 * NEW: Tasks – delete / duplicate
 ** ---------------------------------------------------------------------- */

/**
 * Delete a task and recompact the positions in the same column.
 * Expects: data = { task_id: int }
 */
function delete_task(PDO $pdo, int $userId, array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		$sel = $pdo->prepare(
			"SELECT column_id FROM tasks WHERE task_id = :tid AND user_id = :uid FOR UPDATE"
		);
		$sel->execute([':tid' => $taskId, ':uid' => $userId]);
		$row = $sel->fetch(PDO::FETCH_ASSOC);
		if (!$row) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}
		$columnId = (int)$row['column_id'];

		$pdo->prepare("DELETE FROM tasks WHERE task_id = :tid AND user_id = :uid")
			->execute([':tid' => $taskId, ':uid' => $userId]);

		// Compact positions in that column
		$ids = $pdo->prepare(
			"SELECT task_id FROM tasks WHERE user_id = :uid AND column_id = :cid ORDER BY position ASC"
		);
		$ids->execute([':uid' => $userId, ':cid' => $columnId]);

		$posU = $pdo->prepare("UPDATE tasks SET position = :p, updated_at = NOW() WHERE task_id = :tid");
		$p = 0;
		while ($id = $ids->fetchColumn()) {
			$posU->execute([':p' => $p++, ':tid' => (int)$id]);
		}

		$pdo->commit();
		http_response_code(200);
		echo json_encode(['status' => 'success', 'data' => ['task_id' => $taskId]]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not delete task.']);
	}
}

/**
 * Duplicate a task into the same column at the end.
 * Resets status to 'normal'. Returns the newly created task.
 * Expects: data = { task_id: int }
 */
function duplicate_task(PDO $pdo, int $userId, array $data): void {
	$taskId = isset($data['task_id']) ? (int)$data['task_id'] : 0;
	if ($taskId <= 0) {
		http_response_code(400);
		echo json_encode(['status' => 'error', 'message' => 'Invalid task_id.']);
		return;
	}

	try {
		$pdo->beginTransaction();

		// Lock source task
		$src = $pdo->prepare(
			"SELECT column_id, encrypted_data
			   FROM tasks
			  WHERE task_id = :tid AND user_id = :uid
			  FOR UPDATE"
		);
		$src->execute([':tid' => $taskId, ':uid' => $userId]);
		$row = $src->fetch(PDO::FETCH_ASSOC);
		if (!$row) {
			$pdo->rollBack();
			http_response_code(404);
			echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
			return;
		}
		$columnId = (int)$row['column_id'];

		// Next position at end of the same column
		$pstmt = $pdo->prepare(
			"SELECT COALESCE(MAX(position), -1) + 1
			   FROM tasks
			  WHERE user_id = :uid AND column_id = :cid"
		);
		$pstmt->execute([':uid' => $userId, ':cid' => $columnId]);
		$nextPos = (int)$pstmt->fetchColumn();

		// Build new title "… (Copy)"
		$srcData  = json_decode($row['encrypted_data'], true);
		if (json_last_error() !== JSON_ERROR_NONE || !is_array($srcData)) {
			$srcData = ['title' => 'Untitled Task'];
		}
		$srcTitle = (string)($srcData['title'] ?? 'Untitled Task');
		$newTitle = $srcTitle . ' (Copy)';
		$edata    = json_encode(['title' => $newTitle], JSON_UNESCAPED_UNICODE);

		// Insert duplicate with status 'normal'
		$ins = $pdo->prepare(
			"INSERT INTO tasks (user_id, column_id, encrypted_data, position, status, created_at, updated_at)
			 VALUES (:uid, :cid, :edata, :pos, 'normal', NOW(), NOW())"
		);
		$ins->execute([
			':uid'   => $userId,
			':cid'   => $columnId,
			':edata' => $edata,
			':pos'   => $nextPos
		]);

		$newId = (int)$pdo->lastInsertId();
		$pdo->commit();

		http_response_code(201);
		echo json_encode([
			'status' => 'success',
			'data'   => [
				'task_id'   => $newId,
				'column_id' => $columnId,
				'position'  => $nextPos,
				'status'    => 'normal',
				'data'      => ['title' => $newTitle]
			]
		]);
	} catch (PDOException $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		_log_pdo(__FILE__, $e);
		http_response_code(500);
		echo json_encode(['status' => 'error', 'message' => 'Could not duplicate task.']);
	}
}

/** ---------------------------------------------------------------------- **
 * Helpers
 ** ---------------------------------------------------------------------- */
function _normalize_task(array $row): array {
	$data = json_decode($row['encrypted_data'], true);
	return [
		'task_id'   => (int)$row['task_id'],
		'column_id' => (int)$row['column_id'],
		'position'  => (int)$row['position'],
		'status'    => $row['status'],
		'data'      => (json_last_error() === JSON_ERROR_NONE) ? $data : ['title' => 'Untitled Task']
	];
}

function _log_pdo(string $file, PDOException $e): void {
	if (defined('DEVMODE') && DEVMODE === true) {
		@file_put_contents(__DIR__ . '/../../debug.log',
			'[' . date('Y-m-d H:i:s') . "] PDOException in {$file}: {$e->getMessage()}\n",
			FILE_APPEND
		);
	}
}
~~~
*END FULL CODE FOR FILE: 	/api/modules/tasks.handler.php*
		

## style.css
*START FULL CODE FOR FILE: 	/assets/css/style.css*
~~~
/* ==========================================================================
   MyDayHub 4.0.0 Beta - Core Stylesheet (Scaffold)
   ========================================================================== */

/* Import view-specific styles */
@import url("views/tasks.css");
@import url("views/editor.css"); /* Added import for the new Unified Editor */

/* ==========================================================================
   1. THEME VARIABLES
   ========================================================================== */
:root {
	--bg-color: #202124;
	--column-header-bg: #1c1c1e;
	--app-header-bg: rgba(32, 33, 36, 0.85);
	--active-tab-bg: #282a2d;
	--text-primary: #f2f2f7;
	--text-secondary: #8e8e93;
	--accent-color: #0d6efd;
	--priority-color: #e0740b; /* Orange for priority tasks */
	--column-bg: #282a2d;
	--card-bg: #3c4043;
	--card-border: rgba(255, 255, 255, 0.12);
	--input-bg: #2c2c2e;
	--input-border: #4a4a4c;
	--btn-hover-bg: rgba(255, 255, 255, 0.1);
}

/* ==========================================================================
   2. GLOBAL & LAYOUT STYLES
   ========================================================================== */
html {
	height: 100%;
}

body {
	background-color: var(--bg-color);
	color: var(--text-primary);
	font-family: 'Roboto', sans-serif;
	margin: 0;

	/* Make the page a flex column; the main area will scroll */
	height: 100vh;              /* fallback */
	min-height: 100vh;          /* fallback */

	/* Modern viewport units for iOS Safari to avoid toolbar jumps */
	height: 100dvh;
	min-height: 100dvh;

	display: flex;
	flex-direction: column;

	/* Prevent body from scrolling; we will scroll the main content */
	overflow: hidden;
}

#main-app-container {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	height: 100%;
}

/* We keep the original rule for layout & padding… */
#main-app-container > main {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
	padding: 0.75rem 1.5rem 1rem 1.5rem;
}

/* …and explicitly make the main element the vertical scroller.
   This is critical for iOS Safari. */
#main-content {
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	-webkit-overflow-scrolling: touch; /* iOS momentum scroll */
}

/* Base styles for all main view containers. They are hidden by default. */
.view-container {
	display: none;
	flex: 1;
	min-height: 0;
	flex-direction: column;
}

/* Only the active view should be visible, displayed as a flex container. */
.view-container.active {
	display: flex;
}


/* ==========================================================================
   3. APP HEADER & TABS
   ========================================================================== */
#app-header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	padding: 1rem 1.5rem 0 1.5rem;
	background: var(--app-header-bg);
	backdrop-filter: blur(15px);
	-webkit-backdrop-filter: blur(15px);
	border-bottom: none;
	flex-shrink: 0;
	position: relative;
	transform: translateZ(0);
}

.header-left, .header-right {
	display: flex;
	align-items: baseline;
	gap: 1rem;
}

#header-logo {
	height: 2rem;
}

#app-title {
	font-size: 1.75rem;
	font-weight: bold;
	margin-bottom: 0;
}

.view-tabs {
	display: flex;
	gap: 1.5rem;
	margin-left: 1rem;
}

.view-tab {
	background: none;
	font-size: 1.1rem;
	font-weight: 500;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 0.75rem 1.25rem;
	border: 1px solid transparent;
	border-bottom: 1px solid var(--card-border);
	border-top-left-radius: 6px;
	border-top-right-radius: 6px;
	opacity: 0.6;
}

.view-tab.active {
	background-color: var(--active-tab-bg);
	color: var(--accent-color);
	font-weight: 600;
	border-color: var(--card-border);
	border-bottom-color: var(--active-tab-bg);
	opacity: 1;
}

body.dev-mode-active #app-header {
	border-bottom: 3px solid #e0740b;
}

/* ==========================================================================
   4. FORMS & INPUTS
   ========================================================================== */
.form-control {
	background-color: var(--input-bg);
	border: 1px solid var(--input-border);
	color: var(--text-primary);
	border-radius: 4px;
	padding: 0.5rem 0.75rem;
	font-size: 0.95rem;
	font-family: inherit;
}

.form-control:focus {
	border-color: var(--accent-color);
	box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
	outline: none;
}

.btn {
	padding: 0.5rem 1rem;
	border-radius: 4px;
	border: 1px solid transparent;
	cursor: pointer;
	font-weight: 500;
}

.btn-primary {
	background-color: var(--accent-color);
	color: var(--text-primary);
}

.btn-primary:hover {
	filter: brightness(110%);
}

.btn-secondary {
	background-color: var(--card-bg);
	color: var(--text-primary);
	border: 1px solid var(--input-border);
}

.btn-secondary:hover {
	filter: brightness(115%);
}

/* ==========================================================================
   5. MODALS & OVERLAYS
   ========================================================================== */
.modal-overlay {
	display: none; /* Hidden by default */
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(5px);
	-webkit-backdrop-filter: blur(5px);
	z-index: 2000;
	align-items: center;
	justify-content: center;
}

.modal-overlay.active {
	display: flex; /* Show the modal when this class is added */
}

.modal-dialog {
	background-color: var(--column-bg);
	padding: 24px;
	border-radius: 12px;
	border: 1px solid var(--card-border);
	box-shadow: 0 8px 24px rgba(0,0,0,0.3);
	max-width: 450px;
	width: 90%;
}

#modal-title {
	font-size: 1.5rem;
	font-weight: 500;
	margin-top: 0;
	margin-bottom: 12px;
}

#modal-message {
	font-size: 1rem;
	color: var(--text-secondary);
	margin-top: 0;
	margin-bottom: 24px;
	line-height: 1.5;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
}

/*
   REMOVED: Section 6 for Quick Actions Menu. This has been moved
   to /assets/css/views/tasks.css for better modularity.
*/

/* ==========================================================================
   7. MOBILE RESPONSIVE STYLES
   ========================================================================== */

/* Default styles for mobile elements (hidden on desktop) */
#mobile-menu-toggle {
	display: none;
	background: transparent;
	border: none;
	color: var(--text-primary);
	font-size: 1.75rem;
	cursor: pointer;
	padding: 0.5rem;
}

#mobile-menu-dropdown {
	display: none;
	position: fixed;
	top: 58px;
	right: 0.75rem;
	width: 250px;
	background-color: var(--column-header-bg);
	border: 1px solid var(--card-border);
	border-radius: 8px;
	padding: 0.5rem;
	z-index: 9999;
	box-shadow: 0 8px 16px rgba(0,0,0,0.3);
	flex-direction: column;
	gap: 0.25rem;
}

#mobile-menu-dropdown.show {
	display: flex;
}

#mobile-menu-dropdown .view-tab,
#mobile-menu-dropdown #btn-add-new-column {
	width: 100%;
	text-align: left;
	justify-content: flex-start;
	border: none;
	opacity: 1;
	font-weight: 500;
}

#mobile-menu-dropdown .view-tab.active {
	background-color: var(--accent-color);
	color: var(--text-primary);
}

/* ---- Mobile layout adjustments ---- */
@media (max-width: 768px) {
	#main-app-container > main {
		/* Narrower side padding on mobile */
		padding: 0.75rem 0.5rem;
	}

	/* Make sure the scroll container has *extra bottom padding* to expose the
	   last column footer (add safe-area inset as well). */
	#main-content {
		padding-bottom: calc(180px + env(safe-area-inset-bottom, 0px));
	}

	.view-tabs {
		display: none;
	}
	body.view-tasks-active #add-column-container {
		display: none;
	}

	#mobile-menu-toggle {
		display: block;
	}

	#app-header {
		padding: 0.5rem 0.75rem;
	}
}
~~~
*END FULL CODE FOR FILE: 	/assets/css/style.css*
		

##  tasks.css
*START FULL CODE FOR FILE: 	/assets/css/views/tasks.css*
~~~
/* ==========================================================================
   MyDayHub 4.0.0 Beta - Tasks View Styles
   ========================================================================== */

/* ==========================================================================
   1. TASK BOARD & COLUMNS
   ========================================================================== */
#add-column-container {
	display: none;
}

/* ONLY show the '+ New Column' button when the tasks view is active. */
.view-tasks-active #add-column-container {
	display: flex;
}

#btn-add-new-column {
	background: transparent;
	border: 1px solid transparent;
	color: var(--text-primary);
	padding: 0.5rem 1rem;
	border-radius: 4px;
	cursor: pointer;
	font-weight: 500;
	font-size: 0.95rem;
	transition: background-color 0.2s ease-out;
}

#btn-add-new-column:hover {
	background-color: var(--btn-hover-bg);
}

#add-column-form {
	display: flex;
	gap: 0.5rem;
}

/* The task board is a specific type of view that scrolls horizontally. */
#task-board-container {
	flex-direction: row;
	gap: 1.5rem;
	overflow-x: auto;
	padding-top: 1rem;
}

#task-columns-wrapper {
	display: flex;
	gap: 1.5rem;
	flex-grow: 1;
	min-height: 0;
	height: 100%;
}

.task-column {
	width: 320px;
	flex-shrink: 0;
	background: var(--column-bg);
	border: 1px solid var(--card-border);
	display: flex;
	flex-direction: column;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.task-column > .card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	background-color: var(--column-header-bg);
	border-bottom: 1px solid var(--card-border);
	color: var(--text-primary);
	padding: 0.5rem 0.75rem;
}

.column-title {
	margin: 0 0.5rem;
	font-size: 1.1rem;
	font-weight: 500;
}

.task-count {
	background-color: var(--input-bg);
	color: var(--text-secondary);
	font-size: 0.8em;
	padding: 2px 8px;
	border-radius: 10px;
	margin-left: 0.75rem;
}

.column-controls {
	position: relative;
}

.btn-column-actions {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 1.2rem;
	line-height: 1;
	font-weight: bold;
	transition: background-color 0.2s ease-out;
}

.btn-column-actions:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}

.column-actions-menu {
	position: absolute;
	top: calc(100% + 5px);
	right: 0;
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: 6px;
	box-shadow: 0 4px 12px rgba(0,0,0,0.2);
	z-index: 10;
	min-width: 160px;
	padding: 5px;
}

.column-actions-menu ul {
	margin: 0;
	padding: 0;
	list-style: none;
}

.column-actions-menu button {
	display: block;
	width: 100%;
	background: none;
	border: none;
	color: var(--text-primary);
	text-align: left;
	padding: 8px 12px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.95rem;
}

.column-actions-menu button:hover {
	background-color: var(--accent-color);
	color: white;
}

.card-body {
	flex-grow: 1;
	overflow-y: auto;
	padding: 0.75rem;
}

.task-column > .card-footer {
	background-color: var(--column-header-bg);
	border-top: 1px solid var(--card-border);
	padding: 0.5rem;
}

.btn-add-task {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	padding: 6px 8px;
	text-align: left;
	width: 100%;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.95rem;
	font-weight: normal;
	transition: background-color 0.2s ease-out;
}

.btn-add-task:hover {
	background-color: var(--card-bg);
	color: var(--text-primary);
}

.card-footer .add-task-form input {
	width: 100%;
	box-sizing: border-box;
}

/* ==========================================================================
   2. TASK CARD STYLES
   ========================================================================== */
.task-card {
	background-color: var(--card-bg);
	color: var(--text-primary);
	margin-bottom: 0.75rem;
	position: relative;
	border-radius: 8px;
	display: flex;
	border: 1px solid var(--card-border);
	cursor: grab;
	transition: opacity 0.2s ease-out, transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.task-card:hover {
	transform: translateY(-3px);
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.task-card.dragging {
	opacity: 0.5;
	transform: rotate(2deg);
}

.task-status-band {
	width: 8px;
	flex-shrink: 0;
	background-color: var(--accent-color);
	border-top-left-radius: 8px;
	border-bottom-left-radius: 8px;
	transition: background-color 0.2s ease-out;
}

.task-card-main-content {
	padding: 0.8rem;
	flex-grow: 1;
	min-width: 0;
	/* Arrange the main content (title/checkbox) and meta indicators vertically */
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 0.5rem; /* Space between title area and indicators */
}

.task-card-content {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
}

.task-complete-checkbox {
	-webkit-appearance: none;
	appearance: none;
	flex-shrink: 0;
	height: 16px;
	width: 16px;
	background-color: var(--input-bg);
	border: 1px solid var(--input-border);
	border-radius: 3px;
	cursor: pointer;
	position: relative;
	transition: background-color 0.2s ease-out;
}

.task-complete-checkbox:hover {
	border-color: var(--text-secondary);
}

.task-complete-checkbox::after {
	content: '';
	display: block;
	position: absolute;
	width: 5px;
	height: 10px;
	border: solid var(--text-secondary);
	border-width: 0 2px 2px 0;
	transform: rotate(45deg);
	left: 4px;
	top: 0px;
	opacity: 0;
	transition: opacity 0.2s ease-out;
}

.task-complete-checkbox:checked::after {
	opacity: 1;
}

.task-title {
	word-break: break-word;
	flex-grow: 1;
	min-width: 0;
	transition: color 0.2s ease-out;
	-webkit-user-select: none;
	user-select: none;
}

.btn-task-actions {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 4px 8px;
	margin-left: auto; /* Push to the right */
	border-radius: 4px;
	font-size: 1.2rem;
	line-height: 1;
	font-weight: bold;
	flex-shrink: 0;
	transition: background-color 0.2s ease-out;
}

.btn-task-actions:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}

.task-card.high-priority .task-status-band {
	background-color: var(--priority-color);
}

.task-card.completed {
	opacity: 0.7;
}

.task-card.completed .task-title {
	text-decoration: line-through;
	color: var(--text-secondary);
}

.task-card.completed .task-status-band {
	background-color: var(--text-secondary);
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.task-card.new-card {
	animation: fadeInUp 0.5s ease-out;
}

.task-card.flash-animation::after {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 50%;
	height: 100%;
	background: linear-gradient(90deg, rgba(255,215,0,0) 0%, rgba(255,215,0,0.4) 50%, rgba(255,215,0,0) 100%);
	transform: skewX(-25deg);
	animation: flash 0.35s ease-out;
	pointer-events: none; /* ensure it never blocks clicks */
}

@keyframes flash {
	0% { left: -100%; }
	100% { left: 150%; }
}

/* ==========================================================================
   3. TASK CARD META INDICATORS (NEW)
   ========================================================================== */
/* This container will hold all the small indicator badges. */
/* It will be added via JS when a card has meta info. */
.task-meta-indicators {
	display: flex;
	gap: 0.5rem;
	align-items: center;
	/* This container should only appear if it has children. */
	/* We will handle this logic in JS. If empty, it won't be in the DOM. */
}

.meta-indicator {
	display: inline-flex;
	align-items: center;
	gap: 0.35em;
	background-color: var(--column-bg); /* Use a subtle background */
	color: var(--text-secondary);
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 0.8rem;
	font-weight: 500;
	border: 1px solid var(--card-border);
}

/* Specific styling for the emoji inside the badge */
.meta-indicator .icon {
	font-size: 0.9em;
}

/* ==========================================================================
   4. MOVE MODE STYLES
   ========================================================================== */
/* Highlight the task being moved */
.task-card.is-moving {
	box-shadow: 0 0 0 3px var(--accent-color);
	border-color: var(--accent-color);
	cursor: default;
}

/* When moving, disable the hover effect on the moving card */
.task-card.is-moving:hover {
	transform: none;
	box-shadow: 0 0 0 3px var(--accent-color);
}

/* Style for the "Move here" button in destination column footers */
.btn-move-task-here {
	width: 100%;
	padding: 0.75rem;
	background-color: var(--accent-color);
	color: var(--text-primary);
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-weight: 500;
}

.btn-move-task-here:hover {
	filter: brightness(115%);
}

/* Style for the "Cancel Move" button in the source column footer */
.btn-cancel-move-inline {
	width: 100%;
	padding: 0.75rem;
	background-color: var(--card-bg);
	color: var(--text-secondary);
	border: 1px solid var(--card-border);
	border-radius: 4px;
	cursor: pointer;
	font-weight: 500;
}

.btn-cancel-move-inline:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}

/* ==========================================================================
   5. RESPONSIVE STYLES
   ========================================================================== */
@media (max-width: 768px) {
	/* Switch the board to vertical scrolling */
	#task-board-container {
		flex-direction: column;
		overflow-x: hidden; /* Hide horizontal scrollbar */
		gap: 1.5rem; /* This now becomes vertical gap */
	}

	#task-columns-wrapper {
		flex-direction: column;
		height: auto; /* Allow the wrapper to grow vertically */
	}

	/* Make columns take up the full width */
	.task-column {
		width: 100%;
		max-height: none; /* Allow columns to be as tall as their content */
	}
}

/* ==========================================================================
   6. QUICK ACTIONS MENU (TASK-SPECIFIC)
   ========================================================================== */
.quick-actions-menu {
	position: absolute;
	background-color: var(--column-bg);
	border: 1px solid var(--card-border);
	border-radius: 30px; /* Pill shape */
	box-shadow: 0 5px 15px rgba(0,0,0,0.3);
	z-index: 1010;
	display: flex;
	gap: 4px;
	padding: 5px;
	transform: scale(0.95);
	opacity: 0;
	transition: transform 0.1s ease-out, opacity 0.1s ease-out;
}

.quick-actions-menu.visible {
	transform: scale(1);
	opacity: 1;
}

.quick-action-btn {
	background-color: var(--card-bg);
	border: 1px solid transparent;
	/* UPDATED: Default color is now the primary text color (white). */
	color: var(--text-primary);
	border-radius: 50%; /* Circle */
	width: 38px;
	height: 38px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: background-color 0.2s ease-out, border-color 0.2s ease-out, color 0.2s ease-out;
}

.quick-action-btn:hover {
	background-color: var(--accent-color);
	border-color: var(--accent-color);
	color: white; /* Makes the SVG icon white on hover */
}

/* NEW: Rule to style the SVG icons inside the buttons */
.quick-action-btn svg {
	width: 22px; /* Adjusted size for crisp look */
	height: 22px;
}

/* ==========================================================================
   7. MOBILE BOTTOM SPACER (NEW)
   ========================================================================== */
/* Hidden by default; only shown on small screens.
   The element itself is placed after #task-columns-wrapper in index.php. */
.mobile-bottom-spacer {
	display: none;
}

@media (max-width: 768px) {
	.mobile-bottom-spacer {
		display: block;
		height: calc(160px + env(safe-area-inset-bottom, 0px));
		flex: 0 0 auto;
		pointer-events: none; /* never intercept taps */
	}
}
~~~
*END FULL CODE FOR FILE: 	/assets/css/views/tasks.css*
		

## editor.css
*START FULL CODE FOR FILE: 	/assets/css/views/editor.css*
~~~
/* ==========================================================================
   MyDayHub 4.0.0 Beta - Unified Note Editor Styles
   ========================================================================== */

/* ==========================================================================
   1. EDITOR MAIN LAYOUT & STRUCTURE
   ========================================================================== */

#unified-editor-container.modal-dialog {
	display: flex;
	flex-direction: column;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.editor-controls {
	display: flex;
	gap: 4px;
}

/* CORRECTED: Added more padding */
.modal-footer#editor-status-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 0.8rem;
	color: var(--text-secondary);
	padding: 0.5rem 1rem; /* Added padding */
}

#editor-ribbon {
	display: flex;
	flex-direction: column;
	border-bottom: 1px solid var(--card-border);
	background-color: var(--column-header-bg);
	flex-shrink: 0;
}

#editor-ribbon-tabs {
	display: flex;
	padding: 4px 4px 0 4px;
	gap: 4px;
}

.ribbon-tab {
	padding: 8px 12px;
	border: 1px solid transparent;
	border-top: 3px solid transparent; /* Add space for the accent border */
	border-bottom: none;
	border-top-left-radius: 6px;
	border-top-right-radius: 6px;
	background: transparent;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.2s ease-out;
}

/* CORRECTED: Added accent color to active tab */
.ribbon-tab.active {
	background: var(--column-bg);
	border-color: var(--card-border);
	border-top-color: var(--accent-color); /* The new accent! */
	color: var(--text-primary);
}

#editor-ribbon-panels {
	background: var(--column-bg);
	border-top: 1px solid var(--card-border);
}

.ribbon-panel {
	display: none;
}
.ribbon-panel.active {
	display: block;
}

.modal-body {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* CORRECTED: Set a monospace font family */
#editor-textarea {
	flex-grow: 1;
	width: 100%;
	resize: none;
	border: none;
	background: var(--card-bg);
	color: var(--text-primary);
	padding: 1rem;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
	font-size: 1rem;
	box-sizing: border-box;
}

#editor-textarea:focus {
	outline: none;
}

.modal-dialog.is-maximized {
	width: 100vw;
	height: 100vh;
	max-width: 100vw;
	max-height: 100vh;
	border-radius: 0;
	top: 0;
	left: 0;
}

/* ==========================================================================
   2. EDITOR RIBBON
   ========================================================================== */

.ribbon-button-group {
	display: flex;
	align-items: flex-start;
	padding: 4px;
	width: 100%;
	min-height: 42px;
}

.visible-buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	flex-grow: 1;
}

.ribbon-button-group .btn-icon {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	color: var(--text-primary);
	border-radius: 6px;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
	transition: background-color 0.2s ease-out, border-color 0.2s ease-out;
}

.ribbon-button-group .btn-icon:hover {
	background-color: var(--accent-color);
	border-color: var(--accent-color);
	color: white;
}

/* Modified for notes_save_close */
#btn-editor-save-close.btn-icon {
  background-color: var(--card-bg);
}
#btn-editor-save-close.btn-icon:hover {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}
~~~
*END FULL CODE FOR FILE: 	/assets/css/views/editor.css*
		

## app.js
*START FULL CODE FOR FILE: 	/assets/js/app.js*
~~~
/**
 * MyDayHub 4.0.0 Beta - Main Application Logic (Glue)
 */

/**
 * Initializes the view switcher to handle tab-based navigation.
 */
const initViewSwitcher = () => {
	const viewTabs = document.querySelectorAll('.view-tab');
	const viewContainers = document.querySelectorAll('.view-container');
	const body = document.body;

	const initialActiveTab = document.querySelector('.view-tab.active');
	if (initialActiveTab) {
		body.classList.add(`view-${initialActiveTab.dataset.view}-active`);
	}

	viewTabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const targetViewId = tab.dataset.view;
			const targetView = document.getElementById(`${targetViewId}-view-container`);

			if (tab.classList.contains('active')) return;

			viewTabs.forEach(t => t.classList.remove('active'));
			viewContainers.forEach(c => c.classList.remove('active'));

			tab.classList.add('active');
			if (targetView) targetView.classList.add('active');

			body.classList.remove('view-tasks-active', 'view-journal-active', 'view-outlines-active', 'view-meetings-active');
			body.classList.add(`view-${targetViewId}-active`);
		});
	});
};

/**
 * REFACTORED: Creates and displays the 'Add New Column' form in the header.
 */
const showAddColumnForm = () => {
	const container = document.getElementById('add-column-container');
	if (!container) return;

	const originalButtonHTML = `<button id="btn-add-new-column">+ New Column</button>`;
	container.innerHTML = `
		<form id="add-column-form">
			<input type="text" id="new-column-title" class="form-control" placeholder="New Column Title..." maxlength="50" required autofocus>
		</form>
	`;

	const form = container.querySelector('#add-column-form');
	const input = form.querySelector('#new-column-title');

	const revertToButton = () => {
		if (document.getElementById('add-column-form')) {
			container.innerHTML = originalButtonHTML;
		}
	};

	input.addEventListener('blur', revertToButton);

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const newTitle = input.value.trim();
		if (newTitle && typeof addColumnToBoard === 'function') {
			addColumnToBoard(newTitle);
		}
		revertToButton();
	});
};

/**
 * Shows a custom confirmation modal and returns a Promise<boolean>.
 */
const showConfirmationModal = ({ title, message, confirmText = 'OK', cancelText = 'Cancel' }) => {
	const modalOverlay = document.getElementById('confirmation-modal-overlay');
	const modalTitle = document.getElementById('modal-title');
	const modalMessage = document.getElementById('modal-message');
	const btnConfirm = document.getElementById('modal-btn-confirm');
	const btnCancel = document.getElementById('modal-btn-cancel');

	if (!modalOverlay || !modalTitle || !modalMessage || !btnConfirm || !btnCancel) {
		console.error("Modal elements not found in the DOM.");
		return Promise.resolve(false);
	}

	modalTitle.textContent = title;
	modalMessage.textContent = message;
	btnConfirm.textContent = confirmText;
	btnCancel.textContent = cancelText;

	modalOverlay.classList.add('active');

	return new Promise(resolve => {
		const close = (decision) => {
			modalOverlay.classList.remove('active');
			btnConfirm.onclick = null;
			btnCancel.onclick = null;
			resolve(decision);
		};
		btnConfirm.onclick = () => close(true);
		btnCancel.onclick = () => close(false);
	});
};

/**
 * Initializes the responsive mobile header menu.
 */
const initMobileMenu = () => {
	const toggleBtn = document.getElementById('mobile-menu-toggle');
	const dropdown = document.getElementById('mobile-menu-dropdown');
	if (!toggleBtn || !dropdown) return;

	let isMenuPopulated = false;

	const populateMenu = () => {
		dropdown.innerHTML = '';

		const viewTabs = document.querySelectorAll('.view-tabs .view-tab');
		viewTabs.forEach(tab => {
			const clone = tab.cloneNode(true);
			clone.addEventListener('click', () => dropdown.classList.remove('show'));
			dropdown.appendChild(clone);
		});

		const addColumnBtn = document.getElementById('btn-add-new-column');
		if (addColumnBtn) {
			const clone = addColumnBtn.cloneNode(true);
			clone.addEventListener('click', () => dropdown.classList.remove('show'));
			dropdown.appendChild(clone);
		}
		isMenuPopulated = true;
	};

	toggleBtn.addEventListener('click', (event) => {
		event.stopPropagation();
		if (!isMenuPopulated) populateMenu();
		dropdown.classList.toggle('show');
	});

	window.addEventListener('click', (event) => {
		if (dropdown.classList.contains('show') && !toggleBtn.contains(event.target)) {
			dropdown.classList.remove('show');
		}
	});
};

/* ========= NEW: Dynamic viewport height fix for iOS/Android browsers ====== */
const setViewportHeightVar = () => {
	// 1% of the current viewport height
	const vh = window.innerHeight * 0.01;
	document.documentElement.style.setProperty('--vh', `${vh}px`);
};

/* ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
	// Set dynamic vh once and on viewport changes
	setViewportHeightVar();
	window.addEventListener('resize', setViewportHeightVar);
	window.addEventListener('orientationchange', setViewportHeightVar);

	console.log("MyDayHub App Initialized");

	initViewSwitcher();
	initMobileMenu();

	// Initialize the new Unified Editor module.
	if (typeof UnifiedEditor !== 'undefined' && UnifiedEditor.init) {
		UnifiedEditor.init();
	}

	// Initialize the event listeners for the Tasks view.
	if (typeof initTasksView === 'function') {
		initTasksView();
	}

	// Global delegated event listener for '+ New Column' button.
	document.addEventListener('click', (event) => {
		if (event.target && event.target.id === 'btn-add-new-column') {
			event.preventDefault();
			showAddColumnForm();
		}
	});
});
~~~
*END FULL CODE FOR FILE: 	/assets/js/app.js*
		

## editor.js
*START FULL CODE FOR FILE: 	/assets/js/editor.js*
~~~
/**
 * MyDayHub v4 — Unified Note Editor
 * File: /assets/js/editor.js
 *
 * Modified for notes_save_close:
 * - Save & Close button lives in the header controls next to window controls.
 * - IDs used (must exist in index.php):
 *     #btn-editor-save-close, #editor-btn-maximize,
 *     #editor-btn-restore, #editor-btn-close
 *
 * Public API:
 *   window.Editor.open({ id, kind, title, content })
 *   window.Editor.close()
 *   window.Editor.save(reason?)
 *   window.Editor.getContent() / .setContent(text)
 *   window.Editor.maximize() / .restore()
 *   window.Editor.isOpen() / .isDirty() / .getMeta()
 *
 * Integration:
 *   - Optional delegate: window.EditorSaveDelegate(id, kind, content, {reason})
 *   - Event: document listens to 'editor:save' (detail: {id,kind,content,reason})
 */

(function () {
  "use strict";

  // ----------------------------
  // Element handles (late bound)
  // ----------------------------
  let $root;             // #unified-editor-container
  let $title;            // #editor-title
  let $controls;         // .editor-controls
  let $tabs;             // #editor-ribbon-tabs
  let $panels;           // #editor-ribbon-panels
  let $textarea;         // #editor-textarea
  let $status;           // #editor-status-bar

  // Header buttons (provided in index.php)
  let $btnSaveClose;     // #btn-editor-save-close
  let $btnMax;           // #editor-btn-maximize
  let $btnRestore;       // #editor-btn-restore
  let $btnClose;         // #editor-btn-close

  // ----------------------------
  // Session state
  // ----------------------------
  const STATE = {
	open: false,
	id: null,            // note/task id
	kind: "note",        // "note" | "task"
	title: "",
	isMaximized: false,
	lastSavedAt: null,
	autosaveMs: 15000,   // 15s
	idleSaveMs: 1200,    // debounced save after typing stops
	autosaveTimer: null,
	idleTimer: null,
	dirty: false
  };

  // ----------------------------
  // Utilities
  // ----------------------------
  const debounce = (fn, ms) => {
	let t = null;
	return (...args) => { if (t) clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  const dispatch = (name, detail) => {
	document.dispatchEvent(new CustomEvent(name, { detail }));
  };

  const safe = (n) => (n == null ? "" : String(n));

  const devlog = (...args) => {
	if (window && window.DEVMODE) console.debug("[Editor]", ...args);
  };

  // ----------------------------
  // Core behaviors
  // ----------------------------
  function ensureElements() {
	$root     = document.getElementById("unified-editor-container");
	$title    = document.getElementById("editor-title");
	$controls = document.querySelector(".editor-controls");
	$tabs     = document.getElementById("editor-ribbon-tabs");
	$panels   = document.getElementById("editor-ribbon-panels");
	$textarea = document.getElementById("editor-textarea");
	$status   = document.getElementById("editor-status-bar");

	$btnSaveClose = document.getElementById("btn-editor-save-close");
	$btnMax       = document.getElementById("editor-btn-maximize");
	$btnRestore   = document.getElementById("editor-btn-restore");
	$btnClose     = document.getElementById("editor-btn-close");

	if (!$root || !$textarea) throw new Error("Unified Editor: missing required DOM");
  }

  function setStatus(text) {
	if ($status) $status.textContent = text;
  }

  function markSaved() {
	STATE.lastSavedAt = new Date();
	STATE.dirty = false;
	setStatus("Saved " + STATE.lastSavedAt.toLocaleTimeString());
  }

  function markDirty() {
	STATE.dirty = true;
	setStatus("Unsaved changes …");
  }

  function getContent() { return $textarea ? $textarea.value : ""; }

  function setContent(text) {
	if ($textarea) $textarea.value = safe(text);
	markDirty(); // content considered pending until saved
  }

  function setHeaderTitle(text) { if ($title) $title.textContent = safe(text); }

  // ----------------------------
  // Saving flows
  // ----------------------------
  async function performSave(reason = "manual") {
	if (!STATE.open || !$textarea) return { ok: true, skipped: true };
	const id = STATE.id;
	const kind = STATE.kind;
	const content = getContent();

	// Optional host delegate
	let delegateOk = true;
	if (typeof window.EditorSaveDelegate === "function") {
	  try {
		const res = await Promise.resolve(
		  window.EditorSaveDelegate(id, kind, content, { reason })
		);
		delegateOk = res !== false;
	  } catch (e) {
		delegateOk = false;
		devlog("Delegate save failed:", e);
	  }
	}

	// Broadcast
	dispatch("editor:save", { id, kind, content, reason });

	if (delegateOk) { markSaved(); return { ok: true }; }
	setStatus("Save failed");
	return { ok: false };
  }

  const debouncedIdleSave = debounce(() => {
	if (STATE.dirty) performSave("idle");
  }, STATE.idleSaveMs);

  function startAutosave() {
	stopAutosave();
	STATE.autosaveTimer = setInterval(() => {
	  if (STATE.dirty) performSave("autosave");
	}, STATE.autosaveMs);
  }

  function stopAutosave() {
	if (STATE.autosaveTimer) {
	  clearInterval(STATE.autosaveTimer);
	  STATE.autosaveTimer = null;
	}
  }

  // ----------------------------
  // Open / Close / Max / Restore
  // ----------------------------
  function openEditor(opts) {
	ensureElements();

	const { id, kind = "note", title = "Editor", content = "" } = opts || {};
	STATE.id = id != null ? id : null;
	STATE.kind = kind;
	STATE.title = title;

	setHeaderTitle(title);
	setContent(content);

	$root.classList.add("open");
	$root.classList.remove("is-maximized");
	STATE.isMaximized = false;

	STATE.open = true;
	markDirty();
	setStatus("Editing…");

	startAutosave();
	bindKeyHandlers();
	wireHeaderButtons(); // ensure listeners bound to your header IDs
  }

  async function closeEditor() {
	ensureElements();
	if (STATE.dirty) await performSave("close-soft");
	stopAutosave();
	unbindKeyHandlers();
	$root.classList.remove("open");
	STATE.open = false;
	STATE.id = null;
	STATE.title = "";
	setStatus("");
  }

  function maximize() {
	ensureElements();
	$root.classList.add("is-maximized");
	STATE.isMaximized = true;
	// Toggle header buttons visual state if needed
	if ($btnMax) $btnMax.style.display = "none";
	if ($btnRestore) $btnRestore.style.display = "";
  }

  function restore() {
	ensureElements();
	$root.classList.remove("is-maximized");
	STATE.isMaximized = false;
	if ($btnMax) $btnMax.style.display = "";
	if ($btnRestore) $btnRestore.style.display = "none";
  }

  // ----------------------------
  // Header controls wiring
  // ----------------------------
  function wireHeaderButtons() {
	// Save & Close
	if ($btnSaveClose && !$btnSaveClose.__wired) {
	  $btnSaveClose.addEventListener("click", async () => {
		const res = await performSave("save-close"); // Modified for notes_save_close
		if (res && res.ok) closeEditor();
	  });
	  $btnSaveClose.__wired = true;
	}

	// Maximize
	if ($btnMax && !$btnMax.__wired) {
	  $btnMax.addEventListener("click", () => maximize());
	  $btnMax.__wired = true;
	}

	// Restore
	if ($btnRestore && !$btnRestore.__wired) {
	  $btnRestore.addEventListener("click", () => restore());
	  $btnRestore.__wired = true;
	  // honor initial style from HTML (hidden by default)
	}

	// Close (soft save)
	if ($btnClose && !$btnClose.__wired) {
	  $btnClose.addEventListener("click", () => closeEditor());
	  $btnClose.__wired = true;
	}
  }

  // ----------------------------
  // Ribbon: tabs & simple tools (optional)
  // ----------------------------
  function selectRibbonTab(tabId) {
	if (!$tabs || !$panels) return;
	const allTabs = $tabs.querySelectorAll(".ribbon-tab");
	const panels  = $panels.querySelectorAll(".ribbon-panel");
	allTabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabId));
	panels.forEach(p => p.classList.toggle("active", p.dataset.tab === tabId));
  }

  function initRibbon() {
	if ($tabs) {
	  $tabs.addEventListener("click", (e) => {
		const btn = e.target.closest(".ribbon-tab");
		if (!btn) return;
		const tab = btn.dataset.tab;
		if (tab) selectRibbonTab(tab);
	  });
	}
  }

  // ----------------------------
  // Text helpers
  // ----------------------------
  function getSelectionRange() {
	if (!$textarea) return { start: 0, end: 0 };
	return { start: $textarea.selectionStart, end: $textarea.selectionEnd };
  }

  function setSelectionRange(start, end) {
	if (!$textarea) return;
	$textarea.focus();
	$textarea.setSelectionRange(start, end);
  }

  function applyTransform(fn) {
	if (!$textarea) return;
	const { start, end } = getSelectionRange();
	const v = $textarea.value;
	const before = v.slice(0, start);
	const sel    = v.slice(start, end);
	const after  = v.slice(end);
	const nextSel = fn(sel);
	$textarea.value = before + nextSel + after;
	setSelectionRange(start, start + nextSel.length);
	markDirty();
	debouncedIdleSave();
  }

  function wrapSelection(prefix, suffix) {
	if (!$textarea) return;
	const { start, end } = getSelectionRange();
	const v = $textarea.value;
	const before = v.slice(0, start);
	const sel    = v.slice(start, end);
	const after  = v.slice(end);
	const nextSel = prefix + sel + suffix;
	$textarea.value = before + nextSel + after;
	setSelectionRange(start + prefix.length, start + prefix.length + sel.length);
	markDirty();
	debouncedIdleSave();
  }

  // ----------------------------
  // Keyboard handling
  // ----------------------------
  function bindKeyHandlers() {
	if (!$textarea) return;
	$textarea.addEventListener("input", onInput);
	$textarea.addEventListener("keydown", onKeydown);
	document.addEventListener("keydown", onGlobalKeydown, true);
  }

  function unbindKeyHandlers() {
	if (!$textarea) return;
	$textarea.removeEventListener("input", onInput);
	$textarea.removeEventListener("keydown", onKeydown);
	document.removeEventListener("keydown", onGlobalKeydown, true);
  }

  function onInput() {
	markDirty();
	debouncedIdleSave();
  }

  function onKeydown(e) {
	// Cmd/Ctrl+S => Save
	if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
	  e.preventDefault();
	  performSave("hotkey");
	}
  }

  function onGlobalKeydown(e) {
	if (!STATE.open) return;

	// Esc => Close (soft save)
	if (e.key === "Escape") {
	  e.preventDefault();
	  closeEditor();
	  return;
	}

	// Cmd/Ctrl+Enter => Save & Close
	if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
	  e.preventDefault();
	  performSave("save-close").then((r) => r && r.ok && closeEditor());
	}

	// F11 => toggle maximize
	if (e.key === "F11") {
	  e.preventDefault();
	  STATE.isMaximized ? restore() : maximize();
	}
  }

  // ----------------------------
  // Public API
  // ----------------------------
  const Editor = {
	open(opts) { openEditor(opts || {}); },
	close() { return closeEditor(); },
	save(reason = "manual") { return performSave(reason); },
	getContent() { return getContent(); },
	setContent(text) { setContent(text); },
	maximize() { maximize(); },
	restore() { restore(); },
	isOpen() { return !!STATE.open; },
	isDirty() { return !!STATE.dirty; },
	getMeta() {
	  return {
		id: STATE.id,
		kind: STATE.kind,
		title: STATE.title,
		isMaximized: STATE.isMaximized,
		lastSavedAt: STATE.lastSavedAt ? STATE.lastSavedAt.toISOString() : null
	  };
	}
  };

  // ----------------------------
  // Boot
  // ----------------------------
  function boot() {
	try {
	  ensureElements();
	  initRibbon();
	  // Honor initial restore button visibility defined in HTML
	  if ($btnRestore && !$root.classList.contains("is-maximized")) {
		$btnRestore.style.display = "none";
	  }
	  devlog("Unified Editor ready");
	} catch (e) {
	  console.error("Unified Editor failed to initialize:", e);
	}
  }

  if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot);
  } else {
	boot();
  }

  // Expose
  window.Editor = Editor;

})();
~~~
*END FULL CODE FOR FILE: 	/assets/js/editor.js*
		

## tasks.js
*START FULL CODE FOR FILE: 	/assets/js/tasks.js*
~~~
/**
 * MyDayHub 4.5.0 Beta - Tasks View Module
 */

// Module-level state variables
let taskToMoveId = null;
let dragFromColumnId = null;

// Modified for double_tap_support
let __lastTapTime = 0;
let __lastTapTarget = null;

// --- Small helpers for API calls ---
const getCsrfToken = () =>
  (document.querySelector('meta[name="csrf"]')?.content || '');

const apiPost = (payload) => {
  return fetch('/api/api.php', {
	method: 'POST',
	headers: {
	  'Content-Type': 'application/json',
	  'X-CSRF-Token': getCsrfToken()
	},
	body: JSON.stringify(payload)
  });
};

/**
 * =========================================================================
 * API & DATA HANDLING FUNCTIONS
 * =========================================================================
 */
async function fetchAndRenderBoard() {
  try {
	const response = await apiPost({ module: 'tasks', action: 'getAll' });
	if (!response.ok) throw new Error(`API status ${response.status}`);
	const result = await response.json();
	if (result.status === 'success') {
	  renderBoard(result.data);
	} else {
	  throw new Error(result.message || 'Failed to fetch board.');
	}
  } catch (error) {
	console.error('Error fetching board data:', error);
	const wrap = document.getElementById('task-columns-wrapper');
	if (wrap) {
	  wrap.innerHTML = `<p class="error-message">Could not load board. Please try again later.</p>`;
	}
  }
}

/**
 * Renders the entire board from API data.
 * @param {Array} boardData
 */
function renderBoard(boardData) {
  const wrap = document.getElementById('task-columns-wrapper');
  if (!wrap) return;
  wrap.innerHTML = '';

  (boardData || []).forEach(columnData => {
	addColumnToBoard(columnData.column_name, columnData.column_id);
	const columnEl = wrap.lastElementChild;
	if (!columnEl) return;

	const body = columnEl.querySelector('.card-body');
	if (body && columnData.tasks) {
	  columnData.tasks.forEach(taskData => {
		const html = createTaskCard(taskData);
		body.insertAdjacentHTML('beforeend', html);
	  });
	  // ensure initial sort after rendering tasks
	  sortTasksInColumn(body);
	}
	updateColumnTaskCount(columnEl);
  });
}

/**
 * =========================================================================
 * CORE TASK VIEW FUNCTIONS
 * =========================================================================
 */
const addColumnToBoard = (title, columnId) => {
  const wrap = document.getElementById('task-columns-wrapper');
  if (!wrap) return;
  const html = `
	<div class="task-column" id="column-${columnId}">
	  <div class="card-header">
		<span class="column-title">${title}</span>
		<span class="task-count">0</span>
		<div class="column-controls">
		  <button class="btn-icon btn-column-actions" title="Column Actions">&#8230;</button>
		</div>
	  </div>
	  <div class="card-body"></div>
	  <div class="card-footer">
		<button class="btn-add-task">+ New Task</button>
	  </div>
	</div>
  `;
  wrap.insertAdjacentHTML('beforeend', html);
};

const createTaskCard = (task) => {
  const taskId = `task-${task.task_id}`;
  const title = task.data?.title || 'Untitled Task';
  const statusClass =
	task.status === 'priority' ? 'high-priority' :
	task.status === 'completed' ? 'completed' : '';

  return `
	<div class="task-card ${statusClass}" id="${taskId}" draggable="true" data-notes="" data-due-date="">
	  <div class="task-status-band"></div>
	  <div class="task-card-main-content">
		<div class="task-card-content">
		  <input type="checkbox" class="task-complete-checkbox" title="Mark as complete" ${task.status === 'completed' ? 'checked' : ''}>
		  <span class="task-title">${title}</span>
		  <button class="btn-task-actions" title="Task Actions">&#8230;</button>
		</div>
		<div class="task-meta-indicators"></div>
	  </div>
	</div>
  `;
};

// --- counts ---
const updateColumnTaskCount = (columnEl) => {
  if (!columnEl) return;
  const countEl = columnEl.querySelector('.task-count');
  const bodyEl  = columnEl.querySelector('.card-body');
  if (!countEl || !bodyEl) return;
  countEl.textContent = bodyEl.querySelectorAll('.task-card').length;
};

const updateAllColumnCounts = () => {
  document.querySelectorAll('.task-column').forEach(updateColumnTaskCount);
};

// --- sorting ---
const sortTasksInColumn = (body) => {
  if (!body) return;
  const tasks = Array.from(body.querySelectorAll('.task-card'));
  tasks.sort((a, b) => {
	const aCompleted = a.classList.contains('completed');
	const bCompleted = b.classList.contains('completed');
	const aPriority = a.classList.contains('high-priority');
	const bPriority = b.classList.contains('high-priority');
	if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
	if (aPriority !== bPriority) return aPriority ? -1 : 1;
	return 0;
  }).forEach(t => body.appendChild(t));
};

// Modified for persist_in_column_reorder
const initDragAndDrop = () => {
  const board = document.getElementById('task-board-container');
  if (!board) return;

  // Track where the drag started so we know if it’s a cross-column move
  board.addEventListener('dragstart', (e) => {
	closeAllQuickActionsMenus();
	closeAllColumnActionMenus();
	const card = e.target.closest('.task-card');
	if (card) {
	  card.classList.add('dragging');
	  const fromColumn = card.closest('.task-column');
	  dragFromColumnId = fromColumn ? parseInt(fromColumn.id.replace('column-',''), 10) : null;
	}
  });

  board.addEventListener('dragend', async (e) => {
	const card = e.target.closest('.task-card');
	if (!card) return;
	card.classList.remove('dragging');

	const destBody   = card.closest('.card-body');
	if (!destBody) return;
	const destColumn = destBody.closest('.task-column');
	const destColumnId = destColumn ? parseInt(destColumn.id.replace('column-',''), 10) : null;

	// Local UI feedback first
	sortTasksInColumn(destBody);
	updateColumnTaskCount(destColumn);

	try {
	  if (dragFromColumnId && destColumnId && dragFromColumnId !== destColumnId) {
		// Cross-column move: persist append at destination (existing behavior)
		const taskId = parseInt(card.id.replace('task-',''), 10);
		const res = await apiPost({
		  module: 'tasks',
		  action: 'moveTask',
		  data: { task_id: taskId, to_column_id: destColumnId }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') {
		  throw new Error(json.message || `HTTP ${res.status}`);
		}
		// Update source column count too
		const fromColumnEl = document.getElementById(`column-${dragFromColumnId}`);
		if (fromColumnEl) updateColumnTaskCount(fromColumnEl);
	  } else if (dragFromColumnId && destColumnId && dragFromColumnId === destColumnId) {
		// Same-column reorder: gather ordered task IDs and persist
		const orderedIds = Array.from(destBody.querySelectorAll('.task-card'))
		  .map(el => parseInt(el.id.replace('task-',''), 10))
		  .filter(Number.isFinite);

		const res = await apiPost({
		  module: 'tasks',
		  action: 'reorderColumn',
		  data: { column_id: destColumnId, ordered: orderedIds }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') {
		  throw new Error(json.message || `HTTP ${res.status}`);
		}
	  }
	} catch (err) {
	  console.error('DnD persist failed:', err);
	  alert('Could not save the new order. Reloading the board.');
	  fetchAndRenderBoard();
	}

	// Reset tracker for next drag
	dragFromColumnId = null;
  });

  board.addEventListener('dragover', (e) => {
	const dropZone = e.target.closest('.card-body');
	if (dropZone) {
	  e.preventDefault();
	  const dragging = document.querySelector('.dragging');
	  if (!dragging) return;
	  const after = getDragAfterElement(dropZone, e.clientY);
	  if (after == null) dropZone.appendChild(dragging);
	  else dropZone.insertBefore(dragging, after);
	}
  });
};



const getDragAfterElement = (container, y) => {
  const others = [...container.querySelectorAll('.task-card:not(.dragging)')];
  return others.reduce((closest, child) => {
	const box = child.getBoundingClientRect();
	const offset = y - box.top - box.height / 2;
	if (offset < 0 && offset > closest.offset) {
	  return { offset, element: child };
	} else {
	  return closest;
	}
  }, { offset: Number.NEGATIVE_INFINITY }).element;
};

// --- Quick actions / menus ---
const closeAllQuickActionsMenus = () => {
  document.querySelectorAll('.quick-actions-menu').forEach(m => m.remove());
};

const showQuickActionsMenu = (buttonEl) => {
  closeAllQuickActionsMenus();
  const card = buttonEl.closest('.task-card');
  if (!card) return;
  const menu = document.createElement('div');
  menu.className = 'quick-actions-menu';
  menu.dataset.taskId = card.id;
  menu.innerHTML = `
	<button class="quick-action-btn" data-action="toggle-high-priority" title="Change Priority">
	<!-- Modified for priority_icon_update (rotated "< >") -->
	<svg xmlns="http://www.w3.org/2000/svg"
		 width="24" height="24" viewBox="0 0 24 24"
		 fill="none" stroke="currentColor"
		 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	  <polyline points="6 15 12 21 18 15"></polyline>
	  <polyline points="18 9 12 3 6 9"></polyline>
	</svg></button>
	
	<button class="quick-action-btn" data-action="edit-task" title="Edit Note and Due Date"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
	
	<button class="quick-action-btn" data-action="start-move" title="Change Column">
	<!-- Modified for move_icon_update ("< >" style) -->
	<svg xmlns="http://www.w3.org/2000/svg"
		 width="24" height="24" viewBox="0 0 24 24"
		 fill="none" stroke="currentColor"
		 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	  <polyline points="15 6 21 12 15 18"></polyline>
	  <polyline points="9 18 3 12 9 6"></polyline>
	</svg>
	</button>
	
	<button class="quick-action-btn" data-action="share-task" title="Share">
	<svg width="24" height="24" viewBox="0 0 24 24" 
		fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98m0-9.98-6.83 3.98"/>
	</svg>
	</button>
	
	<button class="quick-action-btn" data-action="make-private" title="Mark as Private"<!-- eye-off with pupil -->
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
		viewBox="0 0 24 24" fill="none" stroke="currentColor"
		stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a20.29 20.29 0 0 1 4.23-5.29"/>
		<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.29 20.29 0 0 1-2.88 3.88"/>
		<circle cx="12" cy="12" r="3"></circle>
		<line x1="2" y1="2" x2="22" y2="22"></line>
	</svg>
	  </button>
	
	<button class="quick-action-btn" data-action="duplicate-task" title="Duplicate Task">
	<svg width="24" height="24" viewBox="0 0 24 24" 
		fill="none" 	stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
	</svg>
	</button>
	
	<button class="quick-action-btn" data-action="delete-task" title="Delete">
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
		stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
	</svg>
	</button>
  `;
  document.body.appendChild(menu);
  const r = buttonEl.getBoundingClientRect();
  menu.style.top = `${window.scrollY + r.bottom + 5}px`;
  menu.style.left = `${window.scrollX + r.right - menu.offsetWidth}px`;
  setTimeout(() => menu.classList.add('visible'), 10);
};

const closeAllColumnActionMenus = () => {
  document.querySelectorAll('.column-actions-menu').forEach(m => m.remove());
};

const toggleColumnActionsMenu = (buttonEl) => {
  const controls = buttonEl.parentElement;
  const existing = controls.querySelector('.column-actions-menu');
  closeAllColumnActionMenus();
  if (existing) return;
  const menu = document.createElement('div');
  menu.className = 'column-actions-menu';
  menu.innerHTML = `<ul><li><button class="btn-delete-column">Delete Column</button></li></ul>`;
  controls.appendChild(menu);
};

const showAddTaskForm = (footer) => {
  const original = footer.innerHTML;

  footer.innerHTML =
	`<form class="add-task-form">
	   <input type="text"
			  class="form-control"
			  placeholder="Enter task title..."
			  maxlength="200"
			  autofocus
			  required>
	 </form>`;

  const form  = footer.querySelector('.add-task-form');
  const input = form.querySelector('input');

  // --- Make restoration safe to call multiple times ---
  let restored = false;
  const restoreOnce = () => {
	if (restored) return;
	restored = true;
	try {
	  footer.innerHTML = original;
	} catch (e) {
	  // If footer got detached or replaced, just swallow.
	  console.warn('Footer restore skipped:', e);
	}
  };

  // On blur, restore once (e.g., clicking elsewhere)
  const onBlur = () => restoreOnce();
  input.addEventListener('blur', onBlur);

  form.addEventListener('submit', async (e) => {
	e.preventDefault();

	// Prevent the blur handler from racing against submit
	input.removeEventListener('blur', onBlur);

	const title = input.value.trim();
	if (!title) { restoreOnce(); return; }

	const column   = footer.closest('.task-column');
	const colId    = parseInt((column?.id || '').replace('column-', ''), 10);
	const body     = column?.querySelector('.card-body');

	try {
	  const res  = await apiPost({
		module: 'tasks',
		action: 'createTask',
		data: { column_id: colId, title }
	  });
	  const json = await res.json();
	  if (!res.ok || json.status !== 'success') {
		throw new Error(json.message || `HTTP ${res.status}`);
	  }

	  if (body) {
		body.insertAdjacentHTML('beforeend', createTaskCard(json.data));
		sortTasksInColumn(body);
	  }
	  if (column) updateColumnTaskCount(column);
	} catch (err) {
	  console.error('createTask failed:', err);
	  alert('Could not create the task. Please try again.');
	} finally {
	  restoreOnce();
	}
  });
};

/**
 * =========================================================================
 * MOVE MODE (persist on "Move here")
 * =========================================================================
 */
// Modified for move_mode_hardening
 const enterMoveMode = (taskCardEl) => {
   if (!taskCardEl) return;
   taskToMoveId = taskCardEl.id;
 
   document.body.classList.add('move-mode-active');
   taskCardEl.classList.add('is-moving');
   closeAllQuickActionsMenus();
 
   document.querySelectorAll('.task-column').forEach((column) => {
	 const footer = column.querySelector('.card-footer');
	 if (!footer) return; // Be null-safe
 
	 // Remember original footer markup once
	 if (!footer.dataset.originalHtml) {
	   footer.dataset.originalHtml = footer.innerHTML;
	 }
 
	 // Show context actions
	 if (column.contains(taskCardEl)) {
	   footer.innerHTML = `<button class="btn-cancel-move-inline">Cancel Move</button>`;
	 } else {
	   footer.innerHTML = `<button class="btn-move-task-here">Move here</button>`;
	 }
   });
 };


const exitMoveMode = () => {
  const movingTask = document.querySelector('.task-card.is-moving');
  if (movingTask) movingTask.classList.remove('is-moving');
  document.body.classList.remove('move-mode-active');
  document.querySelectorAll('.task-column .card-footer').forEach(footer => {
	if (footer.dataset.originalHtml) {
	  footer.innerHTML = footer.dataset.originalHtml;
	  delete footer.dataset.originalHtml;
	}
  });
  taskToMoveId = null;
};

/**
 * =========================================================================
 * INITIALIZATION
 * =========================================================================
 */
const initTasksView = () => {
  const board = document.getElementById('task-board-container');
  if (!board) return;

  fetchAndRenderBoard();
  initDragAndDrop();

  document.addEventListener('click', async (event) => {
	const target = event.target;

	if (!document.body.classList.contains('move-mode-active')) {
	  if (!target.closest('.column-controls, .quick-actions-menu, .btn-task-actions')) {
		closeAllColumnActionMenus();
		closeAllQuickActionsMenus();
	  }
	}

	const quickActionEdit = target.closest('[data-action="edit-task"]');
	const quickActionDuplicate = target.closest('[data-action="duplicate-task"]');
	const quickActionPriority = target.closest('[data-action="toggle-high-priority"]');
	const quickActionMove = target.closest('[data-action="start-move"]');
	const quickActionDelete = target.closest('[data-action="delete-task"]');

	if (target.matches('.btn-task-actions')) {
	  showQuickActionsMenu(target);

	} else if (quickActionEdit) {
	  const menu = quickActionEdit.closest('.quick-actions-menu');
	  const taskCard = document.getElementById(menu.dataset.taskId);
	  if (taskCard) {
		const taskData = {
		  id: taskCard.id,
		  title: taskCard.querySelector('.task-title').textContent,
		  notes: taskCard.dataset.notes || '',
		  dueDate: taskCard.dataset.dueDate || ''
		};
		// Modified for notes_button_fix: use the unified Editor API
		if (window.Editor && typeof window.Editor.open === 'function') {
		  window.Editor.open({
			id: String(taskData.id).replace(/^task-/, ''),
			kind: 'task',
			title: 'Edit Note',
			content: taskData.notes || ''
		  });
		} else {
		  console.warn('Editor API not available');
		  alert('Editor not available.');
		}
	  }
	  closeAllQuickActionsMenus();

	} else if (quickActionDuplicate) {
	  // PERSISTED DUPLICATE
	  const menu = quickActionDuplicate.closest('.quick-actions-menu');
	  const originalCard = document.getElementById(menu.dataset.taskId);
	  if (originalCard) {
		const taskId = parseInt(originalCard.id.replace('task-',''), 10);
		const column = originalCard.closest('.task-column');
		const body   = column?.querySelector('.card-body');

		try {
		  const res = await apiPost({
			module: 'tasks',
			action: 'duplicateTask',
			data: { task_id: taskId }
		  });
		  const json = await res.json();
		  if (!res.ok || json.status !== 'success') {
			throw new Error(json.message || `HTTP ${res.status}`);
		  }
		  // Insert the real, persisted copy (API returns full task object)
		  originalCard.insertAdjacentHTML('afterend', createTaskCard(json.data));
		  if (body) sortTasksInColumn(body);
		  if (column) updateColumnTaskCount(column);
		} catch (err) {
		  console.error('duplicateTask failed:', err);
		  alert('Could not duplicate the task. Please try again.');
		}
	  }
	  closeAllQuickActionsMenus();

	// Modified for togglePriority_persistence (task_id normalization)
	} else if (quickActionPriority) {
	  const menu     = quickActionPriority.closest('.quick-actions-menu');
	  const cardId   = menu?.dataset?.taskId || ''; // may be "task-123" or "123"
	  const numericIdMatch = String(cardId).match(/\d+/);
	  const taskId   = numericIdMatch ? Number(numericIdMatch[0]) : NaN;
	
	  const taskCard = document.getElementById(cardId);
	  if (!taskCard || Number.isNaN(taskId)) {
		console.error('togglePriority: cannot resolve task_id from', { cardId });
		alert('Could not identify task. Please refresh and try again.');
		closeAllQuickActionsMenus();
		return;
	  }
	
	  // Guard: backend ignores priority changes when task is completed.
	  if (taskCard.classList.contains('completed')) {
		alert('Completed tasks cannot be prioritized.');
		closeAllQuickActionsMenus();
		return;
	  }
	
	  const body       = taskCard.closest('.card-body');
	  const wasHigh    = taskCard.classList.contains('high-priority');
	  const nextIsHigh = !wasHigh;
	
	  // Optimistic UI
	  taskCard.classList.toggle('high-priority', nextIsHigh);
	  sortTasksInColumn(body);
	  updateColumnTaskCount(body.closest('.task-column'));
	
	  try {
		// Helpful log in dev
		console.debug('togglePriority → POST', { task_id: taskId, priority: nextIsHigh });
	
		const res  = await apiPost({
		  module: 'tasks',
		  action: 'togglePriority',
		  data: {
			task_id: taskId,           // NOTE: always numeric
			priority: nextIsHigh       // boolean
		  }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') {
		  throw new Error(json.message || `HTTP ${res.status}`);
		}
		// Success: keep optimistic state.
	  } catch (err) {
		// Rollback on error
		taskCard.classList.toggle('high-priority', wasHigh);
		sortTasksInColumn(body);
		updateColumnTaskCount(body.closest('.task-column'));
		console.error('togglePriority failed:', err);
		alert('Could not update priority. Please try again.');
	  } finally {
		closeAllQuickActionsMenus();
	  }

	} else if (target.matches('.btn-move-task-here')) {
	  if (taskToMoveId) {
		const taskToMove = document.getElementById(taskToMoveId);
		const destinationColumn = target.closest('.task-column');
		const sourceColumnBody = taskToMove.closest('.card-body');
		if (taskToMove && destinationColumn) {
		  const destinationBody = destinationColumn.querySelector('.card-body');
		  destinationBody.appendChild(taskToMove);
		  sortTasksInColumn(destinationBody);
		  updateColumnTaskCount(destinationColumn);
		  updateColumnTaskCount(sourceColumnBody.closest('.task-column'));

		  // Persist the move
		  const movedId = parseInt(taskToMoveId.replace('task-',''),10);
		  const destId = parseInt(destinationColumn.id.replace('column-',''),10);
		  try {
			const res = await apiPost({
			  module: 'tasks',
			  action: 'moveTask',
			  data: { task_id: movedId, to_column_id: destId }
			});
			const json = await res.json();
			if (!res.ok || json.status !== 'success') {
			  throw new Error(json.message || `HTTP ${res.status}`);
			}
		  } catch (err) {
			console.error('moveTask failed:', err);
			alert('Could not save the move. Reloading the board.');
			fetchAndRenderBoard();
		  }
		}
		exitMoveMode();
	  }
	
	// Modified for move_mode_hardening
	} else if (quickActionMove) {
	  // End any previous move context first
	  exitMoveMode();
	
	  // Resolve the task card robustly
	  const menu = quickActionMove.closest('.quick-actions-menu');
	  const fromButtonCard = quickActionMove.closest('.task-card');
	  const cardIdRaw =
		(menu && menu.dataset && menu.dataset.taskId) ||
		(fromButtonCard && fromButtonCard.id) ||
		'';
	
	  const idMatch = String(cardIdRaw).match(/\d+/);
	  const numId = idMatch ? Number(idMatch[0]) : NaN;
	
	  // Try both "task-<id>" and "<id>" as DOM ids
	  const taskCard =
		document.getElementById(cardIdRaw) ||
		document.getElementById(`task-${numId}`);
	
	  if (!taskCard || Number.isNaN(numId)) {
		console.error('start-move: could not resolve task card/id', { cardIdRaw });
		alert('Could not identify the task to move. Please refresh and try again.');
		closeAllQuickActionsMenus();
		return;
	  }
	
	  // Enter move mode and reveal footers with Move/Cancel controls
	  enterMoveMode(taskCard);
	
	  // Close the floating menu so the footer buttons are easy to see/click
	  closeAllQuickActionsMenus();

	
	} else if (target.matches('.btn-cancel-move-inline')) {
	  exitMoveMode();

	} else if (target.matches('.btn-add-task')) {
	  showAddTaskForm(target.parentElement);
	
	// Modified for createColumn_persistence
	} else if (target.matches('#btn-add-new-column')) {
	  // Ask for the column name (minimal UI for now; can swap to modal later)
	  const name = (prompt('Name your new column:') || '').trim();
	  if (!name) {
		// No-op if user cancelled or blank name
		closeAllColumnActionMenus();
		closeAllQuickActionsMenus();
		return;
	  }
	
	  try {
		const res = await apiPost({
		  module: 'tasks',
		  action: 'createColumn',
		  data: { column_name: name }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') {
		  throw new Error(json.message || `HTTP ${res.status}`);
		}
	
		// Render the persisted column returned by the server
		addColumnToBoard(json.data.column_name, json.data.column_id);
	
		// Optional nicety: scroll last column into view
		const wrap = document.getElementById('task-columns-wrapper');
		if (wrap && wrap.lastElementChild) {
		  wrap.lastElementChild.scrollIntoView({ behavior: 'smooth', inline: 'end' });
		}
	  } catch (err) {
		console.error('createColumn failed:', err);
		alert('Could not create the column. Please try again.');
	  } finally {
		closeAllColumnActionMenus();
		closeAllQuickActionsMenus();
	  }
	} else if (target.matches('.btn-column-actions')) {
	  toggleColumnActionsMenu(target);

	// ===== Persisted delete column =====
	} else if (target.matches('.btn-delete-column')) {
	  const column = target.closest('.task-column');
	  closeAllColumnActionMenus();
	  if (column) {
		const confirmed = await showConfirmationModal({
		  title: 'Delete Column',
		  message: 'Delete this column and all its tasks? This cannot be undone.',
		  confirmText: 'Delete'
		});
		if (!confirmed) return;

		const columnId = parseInt(column.id.replace('column-',''), 10);
		try {
		  const res = await apiPost({
			module: 'tasks',
			action: 'deleteColumn',
			data: { column_id: columnId }
		  });
		  const json = await res.json();
		  if (!res.ok || json.status !== 'success') {
			throw new Error(json.message || `HTTP ${res.status}`);
		  }
		  column.remove();
		} catch (err) {
		  console.error('deleteColumn failed:', err);
		  alert('Could not delete the column. Please try again.');
		}
	  }
	}
  });

  // Modified for inline_rename_columns
  // Double-click to inline-edit a column title; Enter/blur commits; Esc cancels.
  // Modified for inline_rename_columns_guard
  document.addEventListener('dblclick', (e) => {
	if (document.body.classList.contains('move-mode-active')) return;
  
	const titleEl = e.target.closest('.column-title');
	if (!titleEl) return;
  
	const columnEl = titleEl.closest('.task-column');
	if (!columnEl) return;
  
	const columnId = parseInt(String(columnEl.id).replace('column-',''), 10);
	if (!Number.isFinite(columnId)) return;
  
	const original = (titleEl.textContent || '').trim();
  
	const input = document.createElement('input');
	input.type = 'text';
	input.className = 'inline-title-input';
	input.value = original;
	input.setAttribute('maxlength', '120');
	input.style.width = Math.max(120, titleEl.clientWidth) + 'px';
  
	titleEl.replaceWith(input);
	input.focus();
	input.select();
  
	let finalized = false; // guard against double commit (Enter + blur)
  
	const restoreSpan = (text) => {
	  const span = document.createElement('span');
	  span.className = 'column-title';
	  span.textContent = text;
	  if (input.isConnected) input.replaceWith(span);
	  else {
		const existing = columnEl.querySelector('.column-title');
		if (existing) existing.textContent = text;
	  }
	};
  
	const commit = async () => {
	  if (finalized) return;
	  finalized = true;
	  input.removeEventListener('blur', commit);
	  const name = (input.value || '').trim();
  
	  if (!name || name === original) {
		restoreSpan(original);
		return;
	  }
  
	  // Optimistic UI
	  restoreSpan(name);
  
	  try {
		const res = await apiPost({
		  module: 'tasks',
		  action: 'renameColumn',
		  data: { column_id: columnId, column_name: name }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') throw new Error(json.message || `HTTP ${res.status}`);
  
		const span = columnEl.querySelector('.column-title');
		if (span) span.textContent = json.data?.column_name ?? name;
	  } catch (err) {
		console.error('renameColumn failed:', err);
		alert('Could not rename the column. Restoring previous title.');
		const span = columnEl.querySelector('.column-title');
		if (span) span.textContent = original;
	  }
	};
  
	const cancel = () => {
	  if (finalized) return;
	  finalized = true;
	  input.removeEventListener('blur', commit);
	  restoreSpan(original);
	};
  
	input.addEventListener('keydown', (ev) => {
	  if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
	  else if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
	});
	input.addEventListener('blur', commit, { once: true });
  });


  // Modified for inline_rename_tasks
  // Double-click to inline-edit a task title; Enter/blur commits; Esc cancels.
  // Modified for inline_rename_tasks_guard
  document.addEventListener('dblclick', (e) => {
	if (document.body.classList.contains('move-mode-active')) return;
  
	const span = e.target.closest('.task-title');
	if (!span) return;
  
	const card = span.closest('.task-card');
	if (!card) return;
  
	const idMatch = String(card.id).match(/\d+/);
	const taskId  = idMatch ? Number(idMatch[0]) : NaN;
	if (!Number.isFinite(taskId)) return;
  
	const original = (span.textContent || '').trim();
  
	const input = document.createElement('input');
	input.type = 'text';
	input.className = 'inline-title-input';
	input.value = original;
	input.setAttribute('maxlength', '200');
	input.style.width = Math.max(140, span.clientWidth) + 'px';
  
	span.replaceWith(input);
	input.focus();
	input.select();
  
	let finalized = false; // prevents Enter+blur double-run
  
	const restoreSpan = (text) => {
	  const s = document.createElement('span');
	  s.className = 'task-title';
	  s.textContent = text;
	  if (input.isConnected) input.replaceWith(s);
	  else {
		const existing = card.querySelector('.task-title');
		if (existing) existing.textContent = text;
	  }
	};
  
	const commit = async () => {
	  if (finalized) return;
	  finalized = true;
	  input.removeEventListener('blur', commit);
	  const name = (input.value || '').trim();
  
	  if (!name || name === original) {
		restoreSpan(original);
		return;
	  }
  
	  // Optimistic
	  restoreSpan(name);
  
	  try {
		const res = await apiPost({
		  module: 'tasks',
		  action: 'renameTaskTitle',
		  data: { task_id: taskId, title: name }
		});
		const json = await res.json();
		if (!res.ok || json.status !== 'success') throw new Error(json.message || `HTTP ${res.status}`);
  
		const s = card.querySelector('.task-title');
		if (s) s.textContent = json.data?.data?.title ?? name;
	  } catch (err) {
		console.error('renameTaskTitle failed:', err);
		alert('Could not rename the task. Restoring previous title.');
		const s = card.querySelector('.task-title');
		if (s) s.textContent = original;
	  }
	};
  
	const cancel = () => {
	  if (finalized) return;
	  finalized = true;
	  input.removeEventListener('blur', commit);
	  restoreSpan(original);
	};
  
	input.addEventListener('keydown', (ev) => {
	  if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
	  else if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
	});
	input.addEventListener('blur', commit, { once: true });
  });


  // Modified for double_tap_support
  // Mobile: treat a fast second tap on a title as a double-click.
  document.addEventListener('touchend', (e) => {
	const el = e.target.closest('.column-title, .task-title');
	if (!el) return;

	const now = Date.now();
	if (__lastTapTarget === el && (now - __lastTapTime) < 300) {
	  e.preventDefault();
	  // Fire a synthetic dblclick so the above handlers run.
	  el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	  __lastTapTime = 0;
	  __lastTapTarget = null;
	} else {
	  __lastTapTime = now;
	  __lastTapTarget = el;
	}
  }, { passive: true });

  // Modified for toggleComplete_persistence
  // Delegated handler for completion checkbox changes
  document.addEventListener('change', async (e) => {
	const el = e.target;
	// Try common selectors for the completion checkbox:
	//  - .task-complete-checkbox   (recommended class)
	//  - input[type="checkbox"][data-complete]
	// If your markup differs, this still works because we fall back to finding
	// the nearest task card and its id.
	const isCompletionToggle =
	  el.matches('.task-complete-checkbox') ||
	  el.matches('input[type="checkbox"][data-complete]');
  
	if (!isCompletionToggle) return;
  
	// Resolve the task card and numeric id (handles "task-123" and "123")
	const taskCard = el.closest('.task-card') || el.closest('[id^="task-"]') || el.closest('[id]');
	const cardId   = taskCard ? taskCard.id : '';
	const idMatch  = String(cardId).match(/\d+/);
	const taskId   = idMatch ? Number(idMatch[0]) : NaN;
  
	if (!taskCard || Number.isNaN(taskId)) {
	  console.error('toggleComplete: cannot resolve task_id from', { cardId });
	  alert('Could not identify task. Please refresh and try again.');
	  return;
	}
  
	// Desired state from the checkbox
	const nextCompleted = !!el.checked;
  
	// Optimistic UI: toggle class and reflow
	const body    = taskCard.closest('.card-body');
	const wasDone = taskCard.classList.contains('completed');
	taskCard.classList.toggle('completed', nextCompleted);
	if (body) {
	  sortTasksInColumn(body);
	  const col = body.closest('.task-column');
	  if (col) updateColumnTaskCount(col);
	}
  
	try {
	  console.debug('toggleComplete → POST', { task_id: taskId, completed: nextCompleted });
	  const res  = await apiPost({
		module: 'tasks',
		action: 'toggleComplete',
		data: {
		  task_id: taskId,          // numeric
		  completed: nextCompleted  // boolean
		}
	  });
	  const json = await res.json();
	  if (!res.ok || json.status !== 'success') {
		throw new Error(json.message || `HTTP ${res.status}`);
	  }
	  // Success: keep optimistic state (no-op).
	} catch (err) {
	  // Rollback UI if server rejected
	  console.error('toggleComplete failed:', err);
	  taskCard.classList.toggle('completed', wasDone);
	  if (body) {
		sortTasksInColumn(body);
		const col = body.closest('.task-column');
		if (col) updateColumnTaskCount(col);
	  }
	  // Rollback checkbox state to match UI
	  el.checked = wasDone;
	  alert('Could not update completion. Please try again.');
	}
  });
  
  // Modified for notes_button_fix
  document.addEventListener('click', function (e) {
	// Works for taps and clicks inside the task context menu
	const btn =
	  e.target.closest('[data-task-action="edit-notes"]') ||
	  e.target.closest('[data-entry-action="edit-notes"]') || // fallback if menu used this name
	  e.target.closest('.menu-item-edit-notes');               // legacy class fallback
  
	if (!btn) return;
  
	e.preventDefault();
  
	// Find the owning task card
	const card = btn.closest('.task-card') ||
				 document.querySelector(`#${btn.dataset.taskId}`) ||
				 btn.closest('[data-task-id]');
	if (!card) return;
  
	// Resolve task id and existing note text
	const taskId =
	  card.dataset.taskId ||
	  card.getAttribute('data-task-id') ||
	  card.id?.replace(/^task-/, '') ||
	  null;
  
	// Prefer a dedicated notes holder if present; otherwise empty string
	const existingNotes =
	  (card.querySelector('.task-notes')?.textContent ?? '')
		.toString()
		.trim();
  
	// Open the unified editor
	if (window.Editor && typeof window.Editor.open === 'function') {
	  window.Editor.open({
		id: taskId,
		kind: 'task',
		title: 'Edit Note',
		content: existingNotes
	  });
	} else {
	  // Minimal fallback to avoid dead click if Editor failed to load
	  alert('Editor not available.');
	}
  
	// Close the context menu if your code exposes a closer
	if (typeof window.closeTaskContextMenu === 'function') {
	  window.closeTaskContextMenu();
	} else {
	  // Generic fallback: remove any open menus
	  document.querySelectorAll('.task-context-menu, .entry-actions-menu')
		.forEach(el => el.remove());
	}
  });

  
};
// end of /assets/js/tasks.js v4.5.0
~~~
*END FULL CODE FOR FILE: 	/assets/js/tasks.js*






