<?php
/**
 * code for index.php 
 *
 * MyDayHub - Main Application Shell
 *
 * This page is the main entry point for authenticated users.
 * It establishes the session and redirects to login if the user is not authenticated.
 *
 * @version 8.4 Tamarindo
 *
 * @author Alex & Gemini & Claude & Cursor
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
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
	<title>MyDayHub</title>
	
	<!-- Favicon and App Icons -->
	<link rel="icon" type="image/svg+xml" href="media/leaf.svg">
	<link rel="icon" type="image/png" sizes="32x32" href="media/leaf.svg">
	<link rel="icon" type="image/png" sizes="16x16" href="media/leaf.svg">
	<link rel="apple-touch-icon" href="media/leaf.svg">
	<link rel="apple-touch-icon" sizes="180x180" href="media/leaf.svg">
	<link rel="apple-touch-icon" sizes="152x152" href="media/leaf.svg">
	<link rel="apple-touch-icon" sizes="144x144" href="media/leaf.svg">
	<link rel="apple-touch-icon" sizes="120x120" href="media/leaf.svg">
	<link rel="apple-touch-icon" sizes="114x114" href="media/leaf.svg">
	<link rel="apple-touch-icon" sizes="76x76" href="media/leaf.svg">
	<link rel="apple-touch-icon" sizes="72x72" href="media/leaf.svg">
	<link rel="apple-touch-icon" sizes="60x60" href="media/leaf.svg">
	<link rel="apple-touch-icon" sizes="57x57" href="media/leaf.svg">
	<link rel="icon" type="image/png" sizes="192x192" href="media/leaf.svg">
	<link rel="icon" type="image/png" sizes="512x512" href="media/leaf.svg">
	<link rel="stylesheet" href="uix/style.css">
	<link rel="stylesheet" href="uix/tasks.css">
	<link rel="stylesheet" href="uix/editor.css">
	<link rel="stylesheet" href="uix/attachments.css">
	<link rel="stylesheet" href="uix/settings.css">
	<link rel="stylesheet" href="uix/journal.css">
	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>",
			DEV_MODE: <?php echo defined('DEVMODE') && DEVMODE ? 'true' : 'false'; ?>
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
				<h1 id="app-title">mdh</h1>
				<img src="media/leaf.svg" alt="MyDayHub Logo" id="header-logo">
			</div>
			
			<div class="header-center">
				<nav class="view-tabs">
					<button class="tab-btn active" data-view="tasks" id="tasks-tab">
						<span class="tab-icon">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M9 11l3 3l8-8"></path>
								<path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9s4.03-9 9-9c1.67 0 3.24.46 4.58 1.26"></path>
							</svg>
						</span>
						<span class="tab-label">Tasks</span>
					</button>
					<button class="tab-btn" data-view="journal" id="journal-tab">
						<span class="tab-icon">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<!-- Back page (more visible offset) -->
								<path d="M17 3H9a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" opacity="0.3" stroke-width="1"></path>
								<!-- Front page -->
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
								<polyline points="14,2 14,8 20,8"></polyline>
								<path d="M16 13H8"></path>
								<path d="M16 17H8"></path>
								<path d="M10 9H8"></path>
							</svg>
						</span>
						<span class="tab-label">Journal</span>
					</button>
				</nav>
			</div>
			
			<div class="header-right">
				<div class="user-info-display">
					<span>[<?php echo htmlspecialchars($username); ?>]</span>
					<div id="mission-focus-chart" class="mission-focus-chart" style="display: block;">
						<canvas id="mission-focus-canvas" width="48" height="48"></canvas>
					</div>
					<button id="btn-calendar-badge" class="calendar-badge" title="Calendar Overlays" style="display: none;">
						<!-- Badge content will be populated by JavaScript -->
					</button>
					<span id="header-date"></span>
				</div>
			</div>
		</header>

		<!-- Encryption Status Banner -->
		<div id="encryption-status-banner" class="encryption-banner hidden">
			<div class="encryption-banner-content">
				<div class="encryption-banner-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<circle cx="12" cy="16" r="1"></circle>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
						<path d="M12 1v6"></path>
						<path d="M9 4l3-3 3 3"></path>
					</svg>
				</div>
				<div class="encryption-banner-text">
					<strong>Enhance your privacy</strong> - Set up encryption to secure your private tasks with zero-knowledge encryption.
				</div>
				<div class="encryption-banner-actions">
					<button id="encryption-banner-setup" class="btn btn-primary btn-sm">Set Up</button>
					<button id="encryption-banner-dismiss" class="btn btn-secondary btn-sm">Dismiss</button>
				</div>
			</div>
		</div>

		<main id="main-content">
			<div id="task-board-container" class="view-container active">
				<p>Loading Task Board...</p>
			</div>
			
			<div id="journal-view" class="view-container">
				<p>Loading Journal View...</p>
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
				<div id="add-column-container">
					<button id="btn-add-column" class="btn-header">+ New Column</button>
				</div>
				
			</div>
			<div class="footer-center">
				<button id="btn-filters" class="btn-footer-icon" title="Show Filters">
					<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-label="View Options">
						<line x1="4" y1="7" x2="20" y2="7"></line>
						<circle cx="9" cy="7" r="1.75"></circle>
						<line x1="4" y1="12" x2="20" y2="12"></line>
						<circle cx="15" cy="12" r="1.75"></circle>
						<line x1="4" y1="17" x2="20" y2="17"></line>
						<circle cx="11" cy="17" r="1.75"></circle>
					</svg>
				</button>
				
				<!-- Journal-specific controls (hidden by default) -->
				<div id="journal-controls" class="hidden">
					<button id="btn-journal-menu" class="btn-footer-icon" title="Journal Options">
						<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-label="View Options">
							<line x1="4" y1="7" x2="20" y2="7"></line>
							<circle cx="9" cy="7" r="1.75"></circle>
							<line x1="4" y1="12" x2="20" y2="12"></line>
							<circle cx="15" cy="12" r="1.75"></circle>
							<line x1="4" y1="17" x2="20" y2="17"></line>
							<circle cx="11" cy="17" r="1.75"></circle>
						</svg>
					</button>
				</div>
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
				<button id="btn-settings-inline-toggle" class="btn-icon" title="Close Settings">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				</button>
				<h2>Settings</h2>
				<button id="btn-settings-close" class="btn-icon btn-close" title="Close">&times;</button>
			</div>
			<div class="settings-panel-body">
				<div class="setting-item">
					<span class="setting-label">Theme</span>
					<div class="setting-control">
						<div class="theme-selector">
							<button type="button" class="theme-btn" data-theme="dark" id="theme-dark">Dark</button>
							<button type="button" class="theme-btn" data-theme="light" id="theme-light">Light</button>
							<button type="button" class="theme-btn" data-theme="high-contrast" id="theme-high-contrast">High-Contrast</button>
						</div>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-control">
						<button type="button" id="btn-accent-color" class="btn-accent-color">
							<span class="accent-color-preview"></span>
							<span>Customize Accent Color</span>
						</button>
					</div>
				</div>
				<div class="setting-item">
					<span class="setting-label">Global Font Size</span>
					<div class="setting-control">
						<div class="font-size-selector">
							<button type="button" class="font-btn" data-font="smaller" id="font-smaller">A-</button>
							<button type="button" class="font-btn" data-font="reset" id="font-reset">Reset</button>
							<button type="button" class="font-btn" data-font="larger" id="font-larger">A+</button>
						</div>
					</div>
				</div>
				<div class="setting-item">
					<span class="setting-label">Show Date in Header</span>
					<div class="setting-control">
						<div class="sound-selector">
							<button type="button" class="sound-btn" data-sound="off" id="header-date-off">Hide</button>
							<button type="button" class="sound-btn" data-sound="on" id="header-date-on">Show</button>
						</div>
					</div>
				</div>
				<div class="setting-item">
					<span class="setting-label">Mission Focus Chart</span>
					<div class="setting-control">
						<div class="sound-selector">
							<button type="button" class="sound-btn" data-sound="off" id="mission-focus-off">Hide</button>
							<button type="button" class="sound-btn" data-sound="on" id="mission-focus-on">Show</button>
						</div>
					</div>
				</div>
				<div class="setting-item">
					<span class="setting-label">Completion Sound</span>
					<div class="setting-control">
						<div class="sound-selector">
							<button type="button" class="sound-btn" data-sound="off" id="sound-off">Off</button>
							<button type="button" class="sound-btn" data-sound="on" id="sound-on">On</button>
						</div>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-control">
						<button id="btn-encryption-setup" class="btn">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
								<circle cx="12" cy="16" r="1"></circle>
								<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
								<path d="M12 1v6"></path>
								<path d="M9 4l3-3 3 3"></path>
							</svg>
							<span class="setting-label">Manage Privacy & Encryption</span>
						</button>
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
							<span class="setting-label">Privacy & Encryption - Timeout: 30 minutes</span>
						</button>
					</div>
				</div>
				<div class="setting-item">
					<div class="setting-control">
						<button id="btn-calendar-overlays" class="btn">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
								<line x1="16" y1="2" x2="16" y2="6"></line>
								<line x1="8" y1="2" x2="8" y2="6"></line>
								<line x1="3" y1="10" x2="21" y2="10"></line>
							</svg>
							<span class="setting-label">Calendar Overlays</span>
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
				<div class="setting-item">
					<div class="setting-control">
						<button type="button" id="btn-user-guide" class="btn" onclick="window.open('<?php echo APP_URL; ?>/incs/userguide.php', '_blank')">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<circle cx="12" cy="12" r="10"></circle>
								<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
								<line x1="12" y1="17" x2="12.01" y2="17"></line>
							</svg>
							<span class="setting-label">User Guide</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Accent Color Modal -->
	<div id="accent-color-modal" class="modal hidden">
		<div class="modal-content accent-color-modal-content">
			<div class="modal-header">
				<h3>Customize Accent Color</h3>
				<button class="btn-icon btn-close" id="btn-close-accent-modal">&times;</button>
			</div>
			<div class="modal-body">
				<p class="accent-color-description">Choose a preset or select a custom accent color. Selected colors work across all themes.</p>
				
				<div class="accent-presets">
					<h4>Presets</h4>
					<div class="preset-colors">
						<button class="preset-color-btn" data-color="#22c55e" title="Costa Rica Green (Default)">
							<span class="preset-color-swatch" style="background-color: #22c55e;"></span>
							<span class="preset-color-name">Green</span>
						</button>
						<button class="preset-color-btn" data-color="#3b82f6" title="Ocean Blue">
							<span class="preset-color-swatch" style="background-color: #3b82f6;"></span>
							<span class="preset-color-name">Blue</span>
						</button>
						<button class="preset-color-btn" data-color="#8b5cf6" title="Mystic Purple">
							<span class="preset-color-swatch" style="background-color: #8b5cf6;"></span>
							<span class="preset-color-name">Purple</span>
						</button>
						<button class="preset-color-btn" data-color="#f59e0b" title="Sunset Amber">
							<span class="preset-color-swatch" style="background-color: #f59e0b;"></span>
							<span class="preset-color-name">Amber</span>
						</button>
					</div>
				</div>
				
				<div class="accent-custom">
					<h4>Custom Color</h4>
					<div class="custom-color-picker">
						<input type="color" id="custom-accent-picker" value="#22c55e">
						<label for="custom-accent-picker">Pick any color</label>
					</div>
				</div>
				
				<div class="accent-preview">
					<h4>Preview</h4>
					<div class="preview-elements">
						<button class="btn preview-btn">Sample Button</button>
						<div class="preview-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
							</svg>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" id="btn-reset-accent">Reset to Default</button>
				<button class="btn btn-primary" id="btn-apply-accent">Apply</button>
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
					<button id="editor-btn-voice" class="btn-icon" title="Voice Recording" style="display: none;">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
							<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
							<line x1="12" y1="19" x2="12" y2="23"></line>
							<line x1="8" y1="23" x2="16" y2="23"></line>
						</svg>
					</button>
					<button id="btn-editor-save-close" class="btn-icon" title="Save & Close">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path><polyline points="8 14 11 17 16 12"></polyline></svg>
					</button>
					<button id="editor-btn-maximize" class="btn-icon" title="Maximize">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(45 12 12)"><polyline points="6 15 12 21 18 15"></polyline><polyline points="18 9 12 3 6 9"></polyline></g></svg>
					</button>
					<button id="editor-btn-restore" class="btn-icon" title="Restore" style="display: none;">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(45 12 12)"><polyline points="15 6 21 12 15 18"></polyline><polyline points="9 18 3 12 9 6"></polyline></g></svg>
					</button>
					<button id="editor-btn-close" class="btn-icon btn-close" title="Close">&times;</button>
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
				<button id="attachments-modal-close-btn" class="btn-icon btn-close">&times;</button>
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
		<button id="attachment-viewer-close-btn" class="btn-icon btn-close">&times;</button>
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
					<button id="file-management-close-btn" class="btn-icon btn-close" type="button">&times;</button>
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
				<button id="usage-stats-close-btn" class="btn-icon btn-close" type="button">&times;</button>
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
				<button id="trust-management-close-btn" class="btn-icon btn-close" type="button">&times;</button>
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
	
	<!-- Calendar Overlay Modal -->
	<div id="calendar-overlay-modal-overlay" class="hidden">
		<div id="calendar-overlay-modal-container">
			<div class="calendar-overlay-header">
				<h4>Calendar Overlays</h4>
				<button id="calendar-overlay-close-btn" class="btn-icon btn-close" type="button">&times;</button>
			</div>
			<div class="calendar-overlay-body">
					<div class="calendar-overlay-tabs">
						<button class="calendar-tab active" data-tab="view">View Events</button>
						<button class="calendar-tab" data-tab="manage">Manage Events</button>
						<button class="calendar-tab" data-tab="calendars">Calendar Management</button>
						<button class="calendar-tab" data-tab="preferences">Preferences</button>
					</div>
				
				<!-- View Events Tab -->
				<div id="calendar-tab-view" class="calendar-tab-content active">
					<div class="calendar-view-controls">
						<button id="btn-prev-month" class="btn-icon" title="Previous Month">‹</button>
						<h5 id="current-month-year"></h5>
						<button id="btn-next-month" class="btn-icon" title="Next Month">›</button>
					</div>
					<div id="calendar-grid" class="calendar-grid">
						<!-- Calendar grid will be populated here -->
					</div>
					<div id="today-events" class="today-events">
						<h6>Today's Events</h6>
						<div id="today-events-list"></div>
					</div>
				</div>
				
				<!-- Manage Events Tab -->
				<div id="calendar-tab-manage" class="calendar-tab-content">
					<div class="calendar-manage-controls">
						<div class="manage-controls-left">
							<button id="btn-add-event" class="btn btn-primary">Add Event</button>
							<button id="btn-import-json" class="btn btn-secondary">Import JSON</button>
						</div>
						<div class="manage-controls-right">
							<select id="event-type-filter">
								<option value="">All Event Types</option>
								<option value="fiscal">Fiscal</option>
								<option value="holiday">Holiday</option>
								<option value="birthday">Birthday</option>
								<option value="custom">Custom</option>
							</select>
						</div>
					</div>
					<div id="events-list" class="events-list">
						<!-- Events list will be populated here -->
					</div>
				</div>

				<!-- Calendar Management Tab -->
				<div id="calendar-tab-calendars" class="calendar-tab-content">
					<div class="calendar-management-header">
						<h5>Manage Calendar Imports</h5>
						<p class="calendar-management-description">View, delete, and prioritize your calendar imports</p>
					</div>
					<div id="calendars-list" class="calendars-list">
						<!-- Calendars will be populated here -->
					</div>
				</div>
				
				<!-- Preferences Tab -->
				<div id="calendar-tab-preferences" class="calendar-tab-content">
					<div class="calendar-preferences-section">
						<h6>Calendar Type Visibility</h6>
						<div class="calendar-preferences">
							<div class="preference-item">
								<label class="preference-label">
									<input type="checkbox" id="pref-fiscal" checked>
									<span>Fiscal Calendar</span>
								</label>
							</div>
							<div class="preference-item">
								<label class="preference-label">
									<input type="checkbox" id="pref-holiday" checked>
									<span>Holidays</span>
								</label>
							</div>
							<div class="preference-item">
								<label class="preference-label">
									<input type="checkbox" id="pref-birthday" checked>
									<span>Birthdays</span>
								</label>
							</div>
							<div class="preference-item">
								<label class="preference-label">
									<input type="checkbox" id="pref-custom" checked>
									<span>Custom Events</span>
								</label>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Add/Edit Event Modal -->
	<div id="event-modal-overlay" class="hidden">
		<div id="event-modal-container">
			<div class="event-modal-header">
				<h4 id="event-modal-title">Add Event</h4>
				<button id="event-modal-close-btn" class="btn-icon btn-close" type="button">&times;</button>
			</div>
			<form id="event-form" class="event-form">
				<input type="hidden" id="event-id" name="id">
				<div class="form-group">
					<label for="event-type">Event Type</label>
					<select id="event-type" name="event_type" required>
						<option value="fiscal">📊 Fiscal Calendar</option>
						<option value="holiday">🎉 Holiday</option>
						<option value="birthday">🎂 Birthday</option>
						<option value="custom" selected>⭐ Custom Event</option>
					</select>
				</div>
				<div class="form-group">
					<label for="event-label">Event Label</label>
					<input type="text" id="event-label" name="label" required placeholder="e.g., Q1-M2-Wk7, Christmas Day, Team Meeting" maxlength="100">
				</div>
				<div class="form-row">
					<div class="form-group">
						<label for="event-start-date">Start Date</label>
						<input type="date" id="event-start-date" name="start_date" required>
					</div>
					<div class="form-group">
						<label for="event-end-date">End Date</label>
						<input type="date" id="event-end-date" name="end_date" required>
					</div>
				</div>
				<div class="form-group">
					<label for="event-color">Event Color</label>
					<input type="color" id="event-color" name="color" value="#22c55e" title="Choose a color for this event">
				</div>
				<div class="form-group">
					<label class="checkbox-label">
						<input type="checkbox" id="event-public" name="is_public">
						<span>Make this event public (visible to other users)</span>
					</label>
				</div>
				<div class="event-modal-buttons">
					<button type="button" id="btn-event-cancel" class="btn">Cancel</button>
					<button type="submit" id="btn-event-save" class="btn btn-primary">Save Event</button>
					<button type="button" id="btn-event-delete" class="btn btn-danger" style="display: none;">Delete</button>
				</div>
			</form>
		</div>
	</div>
	
	<!-- JSON Import Modal -->
	<div id="json-import-modal-overlay" class="hidden">
		<div id="json-import-modal-container">
			<div class="json-import-modal-header">
				<h4>Import Calendar Events</h4>
				<button id="json-import-modal-close-btn" class="btn-icon btn-close" type="button">&times;</button>
			</div>
			<div class="json-import-modal-body">
				<div class="import-instructions">
					<h6>Import Instructions</h6>
					<p>Upload a JSON file containing calendar events in the following format:</p>
					<pre><code>[
  {
    "startDate": "2025-07-06",
    "endDate": "2025-07-12", 
    "label": "FY26-Q1-M1-Wk1",
    "name": "Cisco FY26"
  }
]</code></pre>
				</div>
				<div class="import-form">
					<div class="form-group">
						<label for="json-file-input">Select JSON File</label>
						<input type="file" id="json-file-input" accept=".json" />
					</div>
					<div class="form-group">
						<label for="import-calendar-name">Calendar Name *</label>
						<input type="text" id="import-calendar-name" placeholder="e.g., Cisco FY26" required>
						<small class="form-help">Give this calendar import a name to manage it later</small>
					</div>
					<div class="form-group">
						<label for="import-event-type">Event Type</label>
						<select id="import-event-type" required>
							<option value="fiscal">📊 Fiscal Calendar</option>
							<option value="holiday">🎉 Holiday</option>
							<option value="birthday">🎂 Birthday</option>
							<option value="custom">⭐ Custom Event</option>
						</select>
					</div>
					<div class="form-group">
						<label for="import-event-color">Event Color</label>
						<input type="color" id="import-event-color" value="#22c55e">
					</div>
					<div class="form-group">
						<label class="checkbox-label">
							<input type="checkbox" id="import-replace-existing">
							<span>Replace existing events of the same type</span>
						</label>
					</div>
				</div>
				<div id="import-preview" class="import-preview hidden">
					<h6>Import Preview</h6>
					<div id="preview-content"></div>
				</div>
			</div>
			<div class="json-import-modal-buttons">
				<button type="button" id="btn-import-cancel" class="btn">Cancel</button>
				<button type="button" id="btn-import-preview" class="btn btn-secondary" disabled>Preview</button>
				<button type="button" id="btn-import-execute" class="btn btn-primary" disabled>Import Events</button>
			</div>
		</div>
	</div>
	
	
	<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
	<script src="uix/crypto.js" defer></script>
	<script src="uix/encryption-setup.js" defer></script>
	<script src="uix/app.js" defer></script>
	<script src="uix/editor.js" defer></script>
	<script src="uix/view-manager.js" defer></script>
	<script src="uix/tasks.js" defer></script>
	<script src="uix/calendar.js" defer></script>
	<script src="uix/journal.js" defer></script>

</body>
</html>