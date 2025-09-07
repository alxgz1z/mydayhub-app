<?php
/**
 * MyDayHub Beta 5 - Main Application Shell
 *
 * This page is the main entry point for authenticated users.
 * It establishes the session and redirects to login if the user is not authenticated.
 *
 * @version 5.6.0
 * @author Alex & Gemini
 */

// Modified to include config for APP_URL
require_once __DIR__ . '/incs/config.php';

// Start a session if one is not already active.
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

// SECURITY: Redirect to the login page if the user is not authenticated.
if (!isset($_SESSION['user_id'])) {
	header('Location: ' . APP_URL . '/login/login.php');
	exit(); // Always call exit() after a header redirect.
}

// Make the username available for display.
$username = $_SESSION['username'] ?? 'User';

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>MyDayHub</title>
	<link rel="icon" type="image/svg+xml" href="media/logo.svg">
	<link rel="stylesheet" href="uix/style.css">
	<link rel="stylesheet" href="uix/tasks.css">
	<link rel="stylesheet" href="uix/editor.css">
	<link rel="stylesheet" href="uix/attachments.css">
	<link rel="stylesheet" href="uix/settings.css"> <script>
		// Expose server-side configuration to client-side JavaScript.
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>"
		};
	</script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.1/math.min.js"></script>
</head>
<body>

	<div id="main-app-container">

		<header id="app-header">
			<div class="header-left">
				<button id="btn-settings-toggle" class="btn-icon" title="Settings">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				</button>
				<h1 id="app-title">MyDayHub</h1>
				<img src="media/logo.svg" alt="MyDayHub Logo" id="header-logo">
			</div>
			<div class="header-right">
				<div id="add-column-container">
					<button id="btn-add-column" class="btn-header">+ New Column</button>
				</div>
			</div>
		</header>

		<main id="main-content">
			<div id="task-board-container">
				<p>Loading Task Board...</p>
			</div>
			<div class="mobile-bottom-spacer"></div>
		</main>

		<footer id="app-footer" class="<?php if (defined('DEVMODE') && DEVMODE) { echo 'dev-mode'; } ?>">
			<div class="footer-left">
				<span>[<?php echo htmlspecialchars($username); ?>]</span>
				<span id="footer-date"></span>
			</div>
			<div class="footer-center">
				<button id="btn-filters" class="btn-footer-icon" title="Show Filters">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M22 3H2l8 9.46V19l4 2v-8.46L22 3z"></path>
					</svg>
					</button>
				</div>
			<div class="footer-right">
				<span><?php echo APP_VER; ?></span>
				<a href="login/logout.php">Logout</a>
			</div>
		</footer>

	</div>

	<div id="settings-panel-overlay" class="hidden">
		<div id="settings-panel">
			<div class="settings-panel-header">
				<h2>Settings</h2>
				<button id="btn-settings-close" class="btn-icon">&times;</button>
			</div>
			<div class="settings-panel-body">
				<p>Global settings will be available here in a future update.</p>
			</div>
		</div>
	</div>
	
	<div id="toast-container"></div>

	<div id="confirm-modal-overlay" class="hidden">
		<div id="confirm-modal">
			<p id="confirm-modal-message">Are you sure?</p>
			<div id="confirm-modal-buttons">
				<button id="btn-confirm-no" class="btn">Cancel</button>
				<button id="btn-confirm-yes" class="btn btn-danger">Confirm</button>
			</div>
		</div>
	</div>

	<div id="unified-editor-overlay" class="hidden">
		<div id="unified-editor-container">
			<div class="editor-header">
				<h3 id="editor-title">Edit Note</h3>
				<div class="editor-controls">
					<button id="btn-editor-save-close" class="btn-icon" title="Save & Close">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path><polyline points="8 14 11 17 16 12"></polyline></svg>
					</button>
					<button id="editor-btn-maximize" class="btn-icon" title="Maximize">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(45 12 12)"><polyline points="6 15 12 21 18 15"></polyline><polyline points="18 9 12 3 6 9"></polyline></g></svg>
					</button>
					<button id="editor-btn-restore" class="btn-icon" title="Restore" style="display: none;">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(45 12 12)"><polyline points="15 6 21 12 15 18"></polyline><polyline points="9 18 3 12 9 6"></polyline></g></svg>
					</button>
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
								<button class="btn-icon" title="Uppercase" data-action="case" data-casetype="upper">AA</button>
								<button class="btn-icon" title="Title Case" data-action="case" data-casetype="title">Aa</button>
								<button class="btn-icon" title="lowercase" data-action="case" data-casetype="lower">aa</button>
								<button class="btn-icon" title="Underline Selection" data-action="underline"><u>U</u></button>
								<button class="btn-icon" title="Frame Selection" data-action="frame">[]</button>
								<button class="btn-icon" title="Calculate Selection" data-action="calculate">🔢</button>
								<button class="btn-icon" title="Decrease Font Size" data-action="font-size" data-change="-1">A-</button>
								<button class="btn-icon" title="Increase Font Size" data-action="font-size" data-change="1">A+</button>
								<button class="btn-icon btn-text-danger" title="Clear Note" data-action="clear-note">[clear note]</button>
								</div>
					</div>
					<div class="ribbon-panel" id="editor-panel-find-replace"></div>
				</div>
			</div>

			<div class="editor-body">
				<textarea id="editor-textarea" placeholder="Start writing..."></textarea>
			</div>

			<div class="editor-footer" id="editor-status-bar">
				<div id="editor-doc-stats">
					<span>Words: 0</span>
					<span>Chars: 0</span>
				</div>
				<div id="editor-save-status">Last saved: Never</div>
			</div>
		</div>
	</div>

	<div id="date-modal-overlay" class="hidden">
		<div id="date-modal-container">
			<h4>Set Due Date</h4>
			<div id="date-modal-content">
				<input type="date" id="date-modal-input">
			</div>
			<div id="date-modal-buttons">
				<button id="btn-date-remove" class="btn btn-danger">Remove Due Date</button>
				<div class="button-group-right">
					<button id="btn-date-cancel" class="btn">Cancel</button>
					<button id="btn-date-save" class="btn btn-primary">Save</button>
				</div>
			</div>
		</div>
	</div>

	<div id="attachments-modal-overlay" class="hidden">
		<div id="attachments-modal-container">
			<div class="attachments-modal-header">
				<h4 id="attachments-modal-title">Attachments</h4>
				<button id="attachments-modal-close-btn" class="btn-icon">&times;</button>
			</div>
			<div id="attachments-modal-body">
				<div id="attachment-drop-zone">
					<p>Drop files here to upload</p>
					<p class="drop-zone-note">Allowed: JPG, PNG, GIF, WebP, PDF (Max 5MB)</p>
				</div>
				<div id="attachment-list">
					<p class="no-attachments-message">No attachments yet.</p>
				</div>
			</div>
			<div class="attachments-modal-footer">
				<div class="attachment-quota-info">
					<span>Storage: </span>
					<progress id="attachment-quota-bar" value="0" max="100"></progress>
					<span id="attachment-quota-text">0 / 50 MB</span>
				</div>
				<div class="footer-button-group">
					<button id="btn-browse-files" class="btn">Browse Files...</button>
					<button id="btn-upload-staged" class="btn btn-success" style="display: none;">Upload</button>
				</div>
				<input type="file" id="attachment-file-input" multiple hidden>
			</div>
		</div>
	</div>

	<div id="attachment-viewer-modal-overlay" class="hidden">
		<button id="attachment-viewer-close-btn" class="btn-icon">&times;</button>
		<div id="attachment-viewer-content"></div>
	</div>

	<script src="uix/app.js" defer></script>
	<script src="uix/editor.js" defer></script>
	<script src="uix/tasks.js" defer></script>

</body>
</html>