<?php
/**
 * code for index.php 
 *
 * MyDayHub - Main Application Shell
 *
 * This page is the main entry point for authenticated users.
 * It establishes the session and redirects to login if the user is not authenticated.
 *
 * @version 7.3.0
 *
 * @author Alex & Gemini & Claude
 */ 

require_once __DIR__ . '/incs/config.php';

if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

if (!isset($_SESSION['user_id'])) {
	header('Location: ' . APP_URL . '/login/login.php');
	exit();
}

$username = $_SESSION['username'] ?? 'User';

// Check if current user is admin
$isCurrentUserAdmin = isset($_SESSION['user_id']) ? is_admin_user((int)$_SESSION['user_id']) : false;

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
	<title>MyDayHub</title>
	<link rel="icon" type="image/svg+xml" href="media/logo.svg">
	<link rel="stylesheet" href="uix/style.css">
	<link rel="stylesheet" href="uix/tasks.css">
	<link rel="stylesheet" href="uix/editor.css">
	<link rel="stylesheet" href="uix/attachments.css">
	<link rel="stylesheet" href="uix/settings.css">
	<script>
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
				<?php if ($isCurrentUserAdmin): ?>
				<a href="/admin/" id="admin-access-link" title="Admin Panel">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
					</svg>
				</a>
				<?php endif; ?>
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
				<div class="setting-item">
					<span class="setting-label">Light Mode</span>
					<div class="setting-control">
						<label class="switch">
							<input type="checkbox" id="toggle-light-mode">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="setting-item">
					<span class="setting-label">High-Contrast Mode</span>
					<div class="setting-control">
						<label class="switch">
							<input type="checkbox" id="toggle-high-contrast">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-control">
						<button id="btn-change-password" class="btn">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
								<circle cx="12" cy="16" r="1"></circle>
								<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
							</svg>
							<span class="setting-label">Change Password</span>
						</button>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-control">
						<button id="btn-session-timeout" class="btn">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<circle cx="12" cy="12" r="10"></circle>
								<polyline points="12,6 12,12 16,14"></polyline>
							</svg>
							<span class="setting-label">Session Timeout</span>
							30 minutes
						</button>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-control">
						<button type="button" onclick="openFileManagementModal()" class="btn">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
							</svg>
							<span class="setting-label">Manage Files</span>
						</button>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-control">
						<button type="button" id="btn-usage-stats" class="btn">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<path d="M3 3v18h18"></path>
								<path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
							</svg>
							<span class="setting-label">Usage Stats</span>
						</button>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-control">
						<button type="button" id="btn-trust-management" class="btn">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<circle cx="18" cy="5" r="3"></circle>
								<circle cx="6" cy="12" r="3"></circle>
								<circle cx="18" cy="19" r="3"></circle>
								<path d="M8.8 10.9l6.4-3.8M8.8 13.1l6.4 3.8"></path>
							</svg>
							<span class="setting-label">Trust Management</span>
						</button>
					</div>
				</div>
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
	
	<div id="password-modal-overlay" class="hidden">
		<div id="password-modal-container">
			<h4>Change Password</h4>
			<form id="change-password-form">
				<input type="text" name="username" value="<?php echo htmlspecialchars($username); ?>" autocomplete="username" style="display: none;">
				<div class="form-group">
					<label for="current_password">Current Password</label>
					<input type="password" id="current_password" required autocomplete="current-password">
				</div>
				<div class="form-group">
					<label for="new_password">New Password</label>
					<input type="password" id="new_password" required autocomplete="new-password">
				</div>
				<div class="form-group">
					<label for="confirm_password">Confirm New Password</label>
					<input type="password" id="confirm_password" required autocomplete="new-password">
				</div>
				<div id="password-modal-buttons">
					<button type="button" id="btn-password-cancel" class="btn">Cancel</button>
					<button type="submit" class="btn btn-primary">Update Password</button>
				</div>
			</form>
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

	<!-- File Management Modal -->
	<!-- Modified for File Management Feature - Global attachment management interface -->
	<div id="file-management-modal-overlay" class="hidden">
		<div id="file-management-modal-container">
			<div class="file-management-header">
				<h4>File Management</h4>
				<div class="file-management-header-controls">
					<span id="file-management-count" class="file-management-count">Loading...</span>
					<select id="file-management-sort">
						<option value="date_desc">Newest First</option>
						<option value="date_asc">Oldest First</option>
						<option value="size_desc">Largest First</option>
						<option value="size_asc">Smallest First</option>
					</select>
					<button id="file-management-close-btn" class="btn-icon" type="button">&times;</button>
				</div>
			</div>
			<div id="file-management-body">
				<div id="file-management-list">
					<!-- File list will be populated by JavaScript -->
				</div>
			</div>
			<div class="file-management-footer">
				<div class="file-management-quota-info">
					<span>Storage Used:</span>
					<progress id="file-management-quota-bar" value="0" max="100"></progress>
					<span id="file-management-quota-text">0 / 50 MB (0%)</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Session Timeout Modal -->
	<div id="session-timeout-modal-overlay" class="hidden">
		<div id="session-timeout-modal-container">
			<h4>Session Timeout</h4>
			<div id="session-timeout-content">
				<p>Choose how long to keep you logged in during inactivity:</p>
				<div class="timeout-options">
					<label class="timeout-option">
						<input type="radio" name="timeout" value="300">
						<span>5 minutes</span>
					</label>
					<label class="timeout-option">
						<input type="radio" name="timeout" value="1800" checked>
						<span>30 minutes (recommended)</span>
					</label>
					<label class="timeout-option">
						<input type="radio" name="timeout" value="7200">
						<span>2 hours</span>
					</label>
					<label class="timeout-option">
						<input type="radio" name="timeout" value="28800">
						<span>8 hours</span>
					</label>
				</div>
			</div>
			<div id="session-timeout-buttons">
				<button id="btn-timeout-cancel" class="btn">Cancel</button>
				<button id="btn-timeout-save" class="btn btn-primary">Save</button>
			</div>
		</div>
	</div>
	
	<!-- Usage Stats Modal -->
	<div id="usage-stats-modal-overlay" class="hidden">
		<div id="usage-stats-modal-container">
			<div class="usage-stats-header">
				<h4>Subscription Usage</h4>
				<button id="usage-stats-close-btn" class="btn-icon" type="button">&times;</button>
			</div>
			<div id="usage-stats-body">
				<div class="subscription-info">
					<div class="subscription-tier">
						<span class="tier-label">Current Plan:</span>
						<span id="current-tier" class="tier-value">Loading...</span>
					</div>
				</div>
				<div class="usage-categories">
					<div class="usage-category">
						<div class="usage-category-header">
							<span class="usage-label">Tasks</span>
							<span id="tasks-usage-text" class="usage-text">0 of 0</span>
						</div>
						<div class="usage-bar-container">
							<div class="usage-bar">
								<div id="tasks-usage-fill" class="usage-fill" style="width: 0%"></div>
							</div>
							<span id="tasks-usage-percentage" class="usage-percentage">0%</span>
						</div>
					</div>
					<div class="usage-category">
						<div class="usage-category-header">
							<span class="usage-label">Columns</span>
							<span id="columns-usage-text" class="usage-text">0 of 0</span>
						</div>
						<div class="usage-bar-container">
							<div class="usage-bar">
								<div id="columns-usage-fill" class="usage-fill" style="width: 0%"></div>
							</div>
							<span id="columns-usage-percentage" class="usage-percentage">0%</span>
						</div>
					</div>
					<div class="usage-category">
						<div class="usage-category-header">
							<span class="usage-label">Storage</span>
							<span id="storage-usage-text" class="usage-text">0 MB of 0 MB</span>
						</div>
						<div class="usage-bar-container">
							<div class="usage-bar">
								<div id="storage-usage-fill" class="usage-fill" style="width: 0%"></div>
							</div>
							<span id="storage-usage-percentage" class="usage-percentage">0%</span>
						</div>
					</div>
					<div class="usage-category">
						<div class="usage-category-header">
							<span class="usage-label">Sharing</span>
							<span id="sharing-status" class="usage-text">Loading...</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Trust Management Modal -->
	<div id="trust-management-modal-overlay" class="hidden">
		<div id="trust-management-modal-container">
			<div class="trust-management-header">
				<h4>Trust Management</h4>
				<button id="trust-management-close-btn" class="btn-icon" type="button">&times;</button>
			</div>
			<div id="trust-management-stats" class="trust-stats-overview">
				<div class="stat-item">
					<span class="stat-value" id="tasks-shared-by-me">0</span>
					<span class="stat-label">Tasks Shared by Me</span>
				</div>
				<div class="stat-item">
					<span class="stat-value" id="tasks-shared-with-me">0</span>
					<span class="stat-label">Tasks Shared with Me</span>
				</div>
				<div class="stat-item">
					<span class="stat-value" id="people-i-share-with">0</span>
					<span class="stat-label">People I Share With</span>
				</div>
				<div class="stat-item">
					<span class="stat-value" id="ready-for-review-count">0</span>
					<span class="stat-label">Ready for Review</span>
				</div>
			</div>
			<div class="trust-management-tabs">
				<button class="trust-tab active" data-tab="outgoing">Shared by Me</button>
				<button class="trust-tab" data-tab="incoming">Shared with Me</button>
			</div>
			<div id="trust-management-body">
				<div id="trust-tab-outgoing" class="trust-tab-content active">
					<div id="outgoing-shares-list" class="shares-list">
						<!-- Outgoing shares will be populated here -->
					</div>
				</div>
				<div id="trust-tab-incoming" class="trust-tab-content">
					<div id="incoming-shares-list" class="shares-list">
						<!-- Incoming shares will be populated here -->
					</div>
				</div>
			</div>
		</div>
	</div>
	
	
	<script src="uix/app.js" defer></script>
	<script src="uix/editor.js" defer></script>
	<script src="uix/tasks.js" defer></script>

</body>
</html>