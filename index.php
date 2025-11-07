<?php
/**
 * code for index.php 
 *
 * MyDayHub - Main Application Shell
 *
 * This page is the main entry point for authenticated users.
 * It establishes the session and redirects to login if the user is not authenticated.
 *
 * @version 8.7 Nosara
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

// Check if current user is a developer (for developer settings access)
$isCurrentUserDeveloper = isset($_SESSION['user_id']) ? isDeveloperMode() : false;

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
	<title>mdhub</title>
	
	<!-- Web App Manifest for PWA support -->
	<link rel="manifest" href="manifest.json">
	
	<!-- Favicon and App Icons -->
	<!-- Primary icon for iOS/macOS - 180x180 is the standard for modern iOS -->
	<link rel="apple-touch-icon" sizes="180x180" href="media/icons/icon-180x180.png">
	<!-- Fallback for older devices -->
	<link rel="apple-touch-icon" href="media/icons/icon-180x180.png">
	<!-- Standard favicons -->
	<link rel="icon" type="image/png" sizes="32x32" href="media/icons/icon-32x32.png">
	<link rel="icon" type="image/png" sizes="16x16" href="media/icons/icon-16x16.png">
	<link rel="icon" type="image/png" sizes="192x192" href="media/icons/icon-192x192.png">
	<link rel="icon" type="image/png" sizes="512x512" href="media/icons/icon-512x512.png">
	
	<!-- Web App Meta Tags -->
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="apple-mobile-web-app-title" content="mdhub">
	<meta name="theme-color" content="#FD7E13">
	
	<!-- Google Fonts - Inter for elegant typography -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
	
	<link rel="stylesheet" href="uix/style.css">
	<link rel="stylesheet" href="uix/tasks.css?v=8.7">
	<link rel="stylesheet" href="uix/editor.css?v=8.7">
	<link rel="stylesheet" href="uix/attachments.css">
	<link rel="stylesheet" href="uix/settings.css">
	
	<style>
		/* User Guide Modal Styles */
		.user-guide-modal-content {
			max-width: 900px;
			width: 90vw;
			max-height: 90vh;
			overflow-y: auto;
		}
		
		.user-guide-modal-body {
			padding: 0;
		}
		
		.user-guide-container {
			padding: 2rem;
		}
		
		.guide-header {
			text-align: center;
			padding: 2rem 0 3rem;
			border-bottom: 2px solid var(--border-color);
			margin-bottom: 2rem;
		}
		
		.guide-header h1 {
			color: var(--accent-color);
			font-size: 2.5rem;
			font-weight: 600;
			margin: 1rem 0 0.5rem;
		}
		
		.guide-header p {
			color: var(--text-secondary);
			font-size: 1.1rem;
			margin: 0;
		}
		
		.guide-logo {
			width: 64px;
			height: 64px;
			margin: 0 auto 1rem;
			display: block;
		}
		
		.accordion {
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}
		
		.accordion-item {
			background: var(--card-bg);
			border: 1px solid var(--border-color);
			border-radius: 0.5rem;
			overflow: hidden;
			transition: all 0.3s ease;
		}
		
		.accordion-item:hover {
			border-color: var(--accent-color);
			box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
		}
		
		.accordion-header {
			display: flex;
			align-items: center;
			gap: 1rem;
			padding: 1.25rem 1.5rem;
			cursor: pointer;
			transition: background-color 0.2s ease;
		}
		
		.accordion-header:hover {
			background-color: var(--hover-bg);
		}
		
		.accordion-icon {
			width: 24px;
			height: 24px;
			color: var(--accent-color);
			flex-shrink: 0;
		}
		
		.accordion-title {
			font-size: 1.1rem;
			font-weight: 500;
			color: var(--text-primary);
			flex: 1;
		}
		
		.accordion-chevron {
			width: 20px;
			height: 20px;
			color: var(--text-secondary);
			transition: transform 0.3s ease;
		}
		
		.accordion-item.active .accordion-chevron {
			transform: rotate(180deg);
		}
		
		.accordion-content {
			max-height: 0;
			overflow: hidden;
			transition: max-height 0.4s ease, padding 0.4s ease;
		}
		
		.accordion-item.active .accordion-content {
			max-height: 2000px;
		}
		
		.accordion-body {
			padding: 0 1.5rem 1.5rem 5rem;
			color: var(--text-primary);
			line-height: 1.7;
		}
		
		.accordion-body h3 {
			color: var(--accent-color);
			font-size: 1.2rem;
			font-weight: 600;
			margin: 1.5rem 0 0.75rem;
		}
		
		.accordion-body h4 {
			color: var(--text-primary);
			font-size: 1.1rem;
			font-weight: 500;
			margin: 1.25rem 0 0.5rem;
		}
		
		.accordion-body ul, .accordion-body ol {
			margin: 0.75rem 0;
			padding-left: 1.5rem;
		}
		
		.accordion-body li {
			margin: 0.5rem 0;
		}
		
		.accordion-body p {
			margin: 0.75rem 0;
		}
		
		.tip-box, .warning-box {
			padding: 1rem;
			border-radius: 0.5rem;
			margin: 1rem 0;
			border-left: 4px solid;
		}
		
		.tip-box {
			background-color: rgba(34, 197, 94, 0.1);
			border-left-color: var(--accent-color);
		}
		
		.warning-box {
			background-color: rgba(239, 68, 68, 0.1);
			border-left-color: #ef4444;
		}
		
		.tip-box strong, .warning-box strong {
			font-weight: 600;
		}
		
		/* Responsive adjustments */
		@media (max-width: 768px) {
			.user-guide-modal-content {
				width: 95vw;
				max-height: 95vh;
			}
			
			.user-guide-container {
				padding: 1rem;
			}
			
			.guide-header h1 {
				font-size: 2rem;
			}
			
			.accordion-body {
				padding: 0 1rem 1rem 3rem;
			}
		}
		
		/* Search Notes Modal Styles */
		.search-modal-content {
			max-width: 1000px;
			width: 90vw;
			max-height: 90vh;
			overflow-y: auto;
		}
		
		.search-input-section {
			margin-bottom: 1.5rem;
		}
		
		.search-input-group {
			display: flex;
			gap: 0.75rem;
			margin-bottom: 1rem;
		}
		
		#search-notes-input {
			flex: 1;
			padding: 0.75rem;
			border: 1px solid var(--border-color);
			border-radius: 0.5rem;
			background: var(--input-bg);
			color: var(--text-primary);
			font-size: 1rem;
		}
		
		#search-notes-input:focus {
			outline: none;
			border-color: var(--accent-color);
			box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
		}
		
		.search-options {
			display: flex;
			gap: 1.5rem;
		}
		
		.search-results-section {
			border-top: 1px solid var(--border-color);
			padding-top: 1.5rem;
		}
		
		.search-placeholder {
			text-align: center;
			color: var(--text-secondary);
			padding: 2rem;
		}
		
		.search-result-item {
			background: var(--card-bg);
			border: 1px solid var(--border-color);
			border-radius: 0.5rem;
			margin-bottom: 0.75rem;
			overflow: hidden;
			transition: all 0.2s ease;
		}
		
		.search-result-item:hover {
			border-color: var(--accent-color);
			box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
		}
		
		.search-result-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 1rem 1.25rem;
			cursor: pointer;
			transition: background-color 0.2s ease;
		}
		
		.search-result-header:hover {
			background-color: var(--hover-bg);
		}
		
		.search-result-title {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			flex: 1;
		}
		
		.search-result-type {
			background: var(--accent-color);
			color: white;
			padding: 0.25rem 0.5rem;
			border-radius: 0.25rem;
			font-size: 0.75rem;
			font-weight: 500;
		}
		
		.search-result-type.journal {
			background: #3b82f6;
		}
		
		.search-result-type.task {
			background: #8b5cf6;
		}
		
		.search-result-meta {
			display: flex;
			align-items: center;
			gap: 1rem;
			color: var(--text-secondary);
			font-size: 0.875rem;
		}
		
		.search-result-date {
			display: flex;
			align-items: center;
			gap: 0.25rem;
		}
		
		.search-result-chevron {
			width: 16px;
			height: 16px;
			color: var(--text-secondary);
			transition: transform 0.2s ease;
		}
		
		.search-result-item.expanded .search-result-chevron {
			transform: rotate(180deg);
		}
		
		.search-result-content {
			max-height: 0;
			overflow: hidden;
			transition: max-height 0.3s ease;
		}
		
		.search-result-item.expanded .search-result-content {
			max-height: 500px;
		}
		
		.search-result-body {
			padding: 0 1.25rem 1.25rem;
			border-top: 1px solid var(--border-color);
		}
		
		.search-result-preview {
			background: var(--bg-color);
			border: 1px solid var(--border-color);
			border-radius: 0.375rem;
			padding: 1rem;
			margin-bottom: 0.75rem;
			font-family: 'Inter', monospace;
			font-size: 0.875rem;
			line-height: 1.5;
			max-height: 200px;
			overflow-y: auto;
		}
		
		.search-result-actions {
			display: flex;
			gap: 0.5rem;
		}
		
		.search-result-copy {
			background: var(--accent-color);
			color: white;
			border: none;
			padding: 0.5rem 1rem;
			border-radius: 0.375rem;
			font-size: 0.875rem;
			cursor: pointer;
			transition: background-color 0.2s ease;
		}
		
		.search-result-copy:hover {
			background: #16a34a;
		}
		
		.search-no-results {
			text-align: center;
			color: var(--text-secondary);
			padding: 2rem;
		}
		
		.search-loading {
			text-align: center;
			color: var(--text-secondary);
			padding: 2rem;
		}
		
		.search-loading::after {
			content: '';
			display: inline-block;
			width: 20px;
			height: 20px;
			border: 2px solid var(--border-color);
			border-radius: 50%;
			border-top-color: var(--accent-color);
			animation: spin 1s linear infinite;
			margin-left: 0.5rem;
		}
		
		@keyframes spin {
			to { transform: rotate(360deg); }
		}
		
		/* Search Results Panel Styles */
		.search-results-panel {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: 40vh;
			background: var(--card-bg);
			border-top: 2px solid var(--border-color);
			display: flex;
			flex-direction: column;
			z-index: 1100;
			box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
		}
		
		.search-results-panel.hidden {
			display: none !important;
		}
		
		.search-panel-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1rem;
			border-bottom: 1px solid var(--border-color);
			background: var(--toolbar-bg);
		}
		
		.search-panel-header h3 {
			margin: 0;
			font-size: 1rem;
			font-weight: 500;
			color: var(--text-primary);
		}
		
		.search-panel-controls {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}
		
		.search-panel-search-input {
			padding: 0.5rem 0.75rem;
			border: 1px solid var(--border-color);
			border-radius: 0.375rem;
			background: var(--bg-color);
			color: var(--text-primary);
			font-size: 0.875rem;
			width: 200px;
		}
		
		.search-panel-search-input:focus {
			outline: none;
			border-color: var(--accent-color);
			box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
		}
		
		.search-panel-content {
			flex: 1;
			overflow-y: auto;
			padding: 1rem;
		}
		
		.search-placeholder {
			text-align: center;
			color: var(--text-secondary);
			padding: 2rem;
		}
		
		}
	</style>
	<link rel="stylesheet" href="uix/journal.css">
	<script>
		window.MyDayHub_Config = {
			appURL: "<?php echo APP_URL; ?>",
			DEVMODE: <?php echo defined('DEVMODE') && DEVMODE ? 'true' : 'false'; ?>
		};
	</script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.1/math.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js"></script>
</head>
<body>

	<div id="main-app-container">

		<!-- Background Arches -->
		<svg class="app-background-arches" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
			<!-- Large back arch - most transparent -->
			<path d="M 0 300 Q 360 150 720 150 Q 1080 150 1440 300 L 1440 0 L 0 0 Z" fill="var(--accent-color)" opacity="0.08"/>
			
			<!-- Second arch -->
			<path d="M 0 400 Q 360 280 720 280 Q 1080 280 1440 400 L 1440 0 L 0 0 Z" fill="var(--accent-color)" opacity="0.06"/>
			
			<!-- Third arch -->
			<path d="M 0 500 Q 360 380 720 380 Q 1080 380 1440 500 L 1440 0 L 0 0 Z" fill="var(--accent-color)" opacity="0.05"/>
			
			<!-- Fourth arch - slightly darker -->
			<path d="M 0 600 Q 360 450 720 450 Q 1080 450 1440 600 L 1440 0 L 0 0 Z" fill="var(--accent-color)" opacity="0.07"/>
			
			<!-- Bottom arch - most visible -->
			<path d="M 0 750 Q 360 580 720 580 Q 1080 580 1440 750 L 1440 0 L 0 0 Z" fill="var(--accent-color)" opacity="0.04"/>
		</svg>

		<header id="app-header">
			<div class="header-left">
				<button id="btn-settings-toggle" class="btn-icon" title="Settings">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				</button>
				<img src="media/icons/icon-192x192.png" alt="MyDayHub Logo" id="header-logo">
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

		<!-- Quota Limit Banner -->
		<div id="quota-limit-banner" class="quota-banner hidden">
			<div class="quota-banner-content">
				<div class="quota-banner-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
					</svg>
				</div>
				<div class="quota-banner-text">
					<strong>Quota Limit Reached</strong>
					<span id="quota-banner-message">You've reached your subscription limits. Upgrade to create more content.</span>
				</div>
				<div class="quota-banner-actions">
					<button id="quota-banner-view-usage" class="btn btn-sm btn-primary">View Usage</button>
					<button id="quota-banner-bulk-delete" class="btn btn-sm btn-secondary">Bulk Delete</button>
					<button id="quota-banner-dismiss" class="btn btn-sm btn-secondary">Dismiss</button>
				</div>
			</div>
		</div>

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

		<footer id="app-footer" class="<?php if (defined('DEVMODE') && DEVMODE) { echo 'dev-mode'; } ?>" data-devmode="<?php echo defined('DEVMODE') && DEVMODE ? 'true' : 'false'; ?>">
			<div class="footer-left">
			<span id="footer-username" data-username="<?php echo htmlspecialchars($username); ?>" title="Username"></span>
			<?php if ($isCurrentUserAdmin): ?>
				<a href="/admin/" id="admin-access-link" title="Admin Panel">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
					</svg>
				</a>
				<?php endif; ?>
				<?php if (defined('DEVMODE') && DEVMODE): ?>
					<button id="btn-dev-report" class="btn-footer-icon" title="Open latest layout report" style="margin-left: 0.5rem; display: none;">
						<span role="img" aria-label="construction">🚧</span>
					</button>
				<?php endif; ?>
				<div id="add-column-container" style="display: none;">
					<button id="btn-add-column" class="btn-header">+ New Column</button>
				</div>
				
			</div>
			<div class="footer-center">
				<button id="btn-filters" class="btn-footer-icon" title="Tasks View Options">
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
				<?php if (defined('DEVMODE') && DEVMODE): ?>
					<?php
					// Get git commit hash for tracking (only when DEVMODE is enabled)
					$gitHash = 'unknown';
					$gitHashFile = __DIR__ . '/.git/HEAD';
					if (file_exists($gitHashFile)) {
						$headContent = trim(file_get_contents($gitHashFile));
						if (strpos($headContent, 'ref:') === 0) {
							$refPath = trim(str_replace('ref:', '', $headContent));
							$refFile = __DIR__ . '/.git/' . $refPath;
							if (file_exists($refFile)) {
								$gitHash = substr(trim(file_get_contents($refFile)), 0, 7);
							}
						} else {
							$gitHash = substr($headContent, 0, 7);
						}
					}
					?>
					<span id="dev-commit-hash-badge" class="dev-commit-hash-badge hidden" title="Git Commit Hash (DEVMODE)"><?php echo htmlspecialchars($gitHash); ?></span>
				<?php endif; ?>
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
						<button type="button" id="btn-user-guide" class="btn">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<circle cx="12" cy="12" r="10"></circle>
								<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
								<line x1="12" y1="17" x2="12.01" y2="17"></line>
							</svg>
							<span class="setting-label">User Guide</span>
						</button>
					</div>
				</div>
				<?php if ($isCurrentUserDeveloper): ?>
				<div class="setting-item">
					<div class="setting-control">
						<button type="button" id="btn-developer-settings" class="btn">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-right: 0.5rem;">
								<circle cx="12" cy="12" r="3"></circle>
								<path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
								<path d="M12 1a11 11 0 1 0 11 11"></path>
							</svg>
							<span class="setting-label">Developer Settings</span>
						</button>
					</div>
				</div>
				<?php endif; ?>
			</div>
		</div>
	</div>
	
	<!-- User Info Popover -->
	<div id="user-info-popover" class="user-info-popover hidden">
		<div class="user-info-content">
			<div class="user-info-header">
				<h4>User Information</h4>
				<button class="btn-icon btn-close" id="btn-close-user-info">&times;</button>
			</div>
			<div class="user-info-body">
				<div class="user-info-item">
					<label>Username:</label>
					<span id="user-info-username"></span>
				</div>
				<div class="user-info-item">
					<label>Email:</label>
					<span id="user-info-email"></span>
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
	
	<!-- Developer Settings Modal -->
	<?php if ($isCurrentUserDeveloper): ?>
	<div id="developer-settings-modal" class="modal hidden">
		<div class="modal-content developer-settings-modal-content">
			<div class="modal-header">
				<h3>Developer Debug Settings</h3>
				<button class="btn-icon btn-close" id="btn-close-developer-settings">&times;</button>
			</div>
			<div class="modal-body">
				<p class="developer-settings-description">Configure which debugging aids are enabled. Settings are saved in localStorage only.</p>
				
				<div class="debug-settings-section">
					<h4>Visual Indicators</h4>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-show-task-ids" class="debug-checkbox" checked>
							<span>Show Task IDs in task titles</span>
						</label>
						<p class="debug-setting-description">Displays task ID as suffix: "Task Title (123)"</p>
					</div>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-show-column-ids" class="debug-checkbox" checked>
							<span>Show Column IDs in column titles</span>
						</label>
						<p class="debug-setting-description">Displays column ID as suffix: "Column Name [5]"</p>
					</div>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-show-entry-ids" class="debug-checkbox" checked>
							<span>Show Journal Entry IDs in entry titles</span>
						</label>
						<p class="debug-setting-description">Displays entry ID as suffix: "Entry Title [42]"</p>
					</div>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-show-footer-badge" class="debug-checkbox" checked>
							<span>Show DEV badge and border in footer</span>
						</label>
						<p class="debug-setting-description">Displays green DEV badge and border at top of footer</p>
					</div>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-show-construction-button" class="debug-checkbox" checked>
							<span>Show construction button (🚧) in footer</span>
						</label>
						<p class="debug-setting-description">Shows button to open latest layout report</p>
					</div>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-show-commit-hash" class="debug-checkbox" checked>
							<span>Show commit hash badge in footer</span>
						</label>
						<p class="debug-setting-description">Displays current Git commit hash in footer for tracking code versions</p>
					</div>
				</div>
				
				<div class="debug-settings-section">
					<h4>Console & Logging</h4>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-console-messages" class="debug-checkbox" checked>
							<span>Enable console debugging messages</span>
						</label>
						<p class="debug-setting-description">Outputs console.log() statements throughout the application</p>
					</div>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-console-buffer" class="debug-checkbox" checked>
							<span>Capture console errors/warnings to ring buffer</span>
						</label>
						<p class="debug-setting-description">Captures console.error/warn and unhandled errors to window.__consoleBuffer</p>
					</div>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-footer-debug-function" class="debug-checkbox" checked>
							<span>Run footer debug function</span>
						</label>
						<p class="debug-setting-description">Logs footer state information to console on page load</p>
					</div>
				</div>
				
				<div class="debug-settings-section">
					<h4>Developer Tools</h4>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-layout-report-hotkey" class="debug-checkbox" checked>
							<span>Enable layout report hotkey (Ctrl/Cmd + Alt + D)</span>
						</label>
						<p class="debug-setting-description">Sends layout report to /api/debug.php when hotkey is pressed</p>
					</div>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-modal-validation" class="debug-checkbox" checked>
							<span>Auto-run modal validation on page load</span>
						</label>
						<p class="debug-setting-description">Automatically validates all modals when page loads</p>
					</div>
					<div class="debug-setting-item">
						<label class="debug-setting-label">
							<input type="checkbox" id="debug-detailed-errors" class="debug-checkbox" checked>
							<span>Show detailed error messages</span>
						</label>
						<p class="debug-setting-description">Shows detailed error messages in auth flows and exception handlers</p>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" id="btn-reset-debug-settings">Reset to Defaults</button>
				<button class="btn btn-primary" id="btn-apply-debug-settings">Apply Settings</button>
			</div>
		</div>
	</div>
	<?php endif; ?>
	
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
					<button id="editor-btn-maximize" class="btn-icon" title="Maximize">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(45 12 12)"><polyline points="6 15 12 21 18 15"></polyline><polyline points="18 9 12 3 6 9"></polyline></g></svg>
					</button>
					<button id="editor-btn-restore" class="btn-icon" title="Restore" style="display: none;">
						<svg width="24" height="24" viewBox="0 0 316 330" xmlns="http://www.w3.org/2000/svg" fill="none">
							<g transform="translate(-1352 -838)">
								<g>
									<path d="M1524.5 849.5 1524.5 981.271" stroke="currentColor" stroke-width="20.625" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="8" fill="none"/>
									<path d="M0 0 131.214 0.000360892" stroke="currentColor" stroke-width="20.625" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="8" fill="none" transform="matrix(-1 0 0 1 1655.71 982.5)"/>
									<path d="M1496.5 1156.27 1496.5 1024.5" stroke="currentColor" stroke-width="20.625" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="8" fill="none"/>
									<path d="M0 0 131.214 0.000360892" stroke="currentColor" stroke-width="20.625" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="8" fill="none" transform="matrix(1 -1.22465e-16 -1.22465e-16 -1 1364.5 1024.5)"/>
								</g>
							</g>
						</svg>
					</button>
					<button id="editor-btn-close" class="btn-icon btn-close" title="Save and Close">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
			</div>

			<div id="editor-ribbon">
				<nav id="editor-ribbon-tabs">
					<button class="ribbon-tab active" data-panel="format">Format</button>
					<button class="ribbon-tab" data-panel="preview">Export</button>
					<button class="ribbon-tab" data-panel="find-replace">Find & Replace</button>
					<button class="ribbon-tab" data-panel="attachments" id="editor-tab-attachments" style="display: none;">Attachments</button>
				</nav>
				<div id="editor-ribbon-panels">
					<div class="ribbon-panel active" id="editor-panel-format">
						<div class="ribbon-button-group">
								<button class="btn-icon" title="Undo (Ctrl+Z / Cmd+Z)" id="editor-btn-undo" data-action="undo">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M3 7v6h6"></path>
										<path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
									</svg>
								</button>
								<button class="btn-icon" title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)" id="editor-btn-redo" data-action="redo">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M21 7v6h-6"></path>
										<path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
									</svg>
								</button>
								<button class="btn-icon" title="Toggle Line Numbers" id="editor-btn-line-numbers" data-action="toggle-line-numbers">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<line x1="6" y1="4" x2="6" y2="20"></line>
										<line x1="10" y1="4" x2="10" y2="20"></line>
										<line x1="14" y1="4" x2="14" y2="20"></line>
										<line x1="18" y1="4" x2="18" y2="20"></line>
										<path d="M5 8l-2 0"></path>
										<path d="M5 12l-2 0"></path>
										<path d="M5 16l-2 0"></path>
										<path d="M5 20l-2 0"></path>
									</svg>
								</button>
								<button class="btn-icon" title="Search Notes & Tasks" id="editor-btn-search" data-action="search-notes">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="11" cy="11" r="8"></circle>
										<path d="m21 21-4.35-4.35"></path>
									</svg>
								</button>
								<span class="button-separator"></span>
								<button class="btn-icon" title="Bold (**text**)" data-action="markdown-bold">**</button>
								<button class="btn-icon" title="Italic (_text_)" data-action="markdown-italic">_</button>
								<button class="btn-icon" title="Code (`text`)" data-action="markdown-code">`</button>
								<button class="btn-icon" title="Heading 1 (# Heading)" data-action="markdown-h1">H1</button>
								<button class="btn-icon" title="Heading 2 (## Heading)" data-action="markdown-h2">H2</button>
								<button class="btn-icon" title="Markdown Help" id="editor-markdown-help">?</button>
								<span class="button-separator"></span>
								<button class="btn-icon" title="Uppercase" data-action="case" data-casetype="upper">AA</button>
								<button class="btn-icon" title="Title Case" data-action="case" data-casetype="title">Aa</button>
								<button class="btn-icon" title="lowercase" data-action="case" data-casetype="lower">aa</button>
								<button class="btn-icon" title="Underline Selection" data-action="underline"><u>U</u></button>
								<button class="btn-icon" title="Frame Selection" data-action="frame">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<!-- Outer double box -->
										<rect x="3" y="3" width="18" height="18"></rect>
										<rect x="4" y="4" width="16" height="16"></rect>
										<!-- Inner content indicator -->
										<line x1="7" y1="12" x2="17" y2="12"></line>
									</svg>
								</button>
								<button class="btn-icon" title="Calculate Selection" data-action="calculate">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
										<rect x="4" y="2" width="16" height="5"></rect>
										<line x1="8" y1="9" x2="8" y2="10"></line>
										<line x1="12" y1="9" x2="12" y2="10"></line>
										<line x1="16" y1="9" x2="16" y2="10"></line>
										<line x1="8" y1="14" x2="16" y2="14"></line>
										<line x1="8" y1="18" x2="16" y2="18"></line>
									</svg>
								</button>
								<button class="btn-icon" title="Decrease Font Size" data-action="font-size" data-change="-1">A-</button>
								<button class="btn-icon" title="Increase Font Size" data-action="font-size" data-change="1">A+</button>
								<button class="btn-icon btn-text-danger" title="Clear all note contents" id="editor-btn-clear" data-action="clear">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="3 6 5 6 21 6"></polyline>
										<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
										<line x1="10" y1="11" x2="10" y2="17"></line>
										<line x1="14" y1="11" x2="14" y2="17"></line>
									</svg>
								</button>
								<div class="btn-more-menu">
								<button class="more-menu-button" id="editor-btn-more-menu" title="More options">⋯</button>
								<div class="more-menu-dropdown" id="editor-more-menu-dropdown">
									<button class="btn-icon" data-action="case" data-casetype="upper" title="Uppercase">
										<span class="more-menu-icon">AA</span>
										<span class="more-menu-label">Uppercase</span>
									</button>
									<button class="btn-icon" data-action="case" data-casetype="title" title="Title Case">
										<span class="more-menu-icon">Aa</span>
										<span class="more-menu-label">Title Case</span>
									</button>
									<button class="btn-icon" data-action="case" data-casetype="lower" title="lowercase">
										<span class="more-menu-icon">aa</span>
										<span class="more-menu-label">lowercase</span>
									</button>
									<button class="btn-icon" data-action="underline" title="Underline Selection">
										<span class="more-menu-icon"><u>U</u></span>
										<span class="more-menu-label">Underline</span>
									</button>
									<button class="btn-icon" data-action="frame" title="Frame Selection">
										<span class="more-menu-icon">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<rect x="3" y="3" width="18" height="18"></rect>
												<rect x="4" y="4" width="16" height="16"></rect>
												<!-- Inner content indicator -->
												<line x1="7" y1="12" x2="17" y2="12"></line>
											</svg>
										</span>
										<span class="more-menu-label">Frame</span>
									</button>
									<button class="btn-icon" data-action="calculate" title="Calculate Selection">
										<span class="more-menu-icon">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
												<rect x="4" y="2" width="16" height="5"></rect>
												<line x1="8" y1="9" x2="8" y2="10"></line>
												<line x1="12" y1="9" x2="12" y2="10"></line>
												<line x1="16" y1="9" x2="16" y2="10"></line>
												<line x1="8" y1="14" x2="16" y2="14"></line>
												<line x1="8" y1="18" x2="16" y2="18"></line>
											</svg>
										</span>
										<span class="more-menu-label">Calculate</span>
									</button>
									<button class="btn-icon" data-action="font-size" data-change="-1" title="Decrease Font Size">
										<span class="more-menu-icon">A-</span>
										<span class="more-menu-label">Decrease</span>
									</button>
									<button class="btn-icon" data-action="font-size" data-change="1" title="Increase Font Size">
										<span class="more-menu-icon">A+</span>
										<span class="more-menu-label">Increase</span>
									</button>
									<button class="btn-icon btn-text-danger" data-action="clear" title="Clear all note contents">
										<span class="more-menu-icon">[clear]</span>
										<span class="more-menu-label">Clear</span>
									</button>
								</div>
							</div>
							</div>
					</div>
					<div class="ribbon-panel" id="editor-panel-preview">
						<div class="preview-controls">
							<button class="btn-small" id="editor-btn-refresh-preview" title="Refresh Preview">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="23 4 23 10 17 10"></polyline>
									<polyline points="1 20 1 14 7 14"></polyline>
									<path d="M3.51 9a9 9 0 0114.85-3.36M20.49 15a9 9 0 01-14.85 3.36"></path>
								</svg>
								Refresh Preview
							</button>
							<button class="btn-small" data-export-format="html" title="Export as HTML">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 12 9 16 15 4"></polyline>
									<path d="M4 12H2a10 10 0 1020 0h-2"></path>
								</svg>
								HTML
							</button>
							<button class="btn-small" data-export-format="markdown" title="Export as Markdown">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M3 6h2l3 4 3-4h2M3 18h18"></path>
									<line x1="3" y1="9" x2="3" y2="15"></line>
									<line x1="21" y1="9" x2="21" y2="15"></line>
								</svg>
								Markdown
							</button>
							<button class="btn-small" data-export-format="plaintext" title="Export as Plain Text">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
									<line x1="7" y1="9" x2="17" y2="9"></line>
									<line x1="7" y1="13" x2="13" y2="13"></line>
								</svg>
								Plain Text
							</button>
						</div>
						<div id="editor-preview-content" class="markdown-preview"></div>
					</div>
					<div class="ribbon-panel" id="editor-panel-find-replace">
						<div class="find-replace-container">
							<div class="find-replace-row">
								<input type="text" id="editor-find-input" placeholder="Find..." class="find-replace-input">
								<button class="btn-icon" title="Find Next" id="editor-find-next">↓</button>
								<button class="btn-icon" title="Find Previous" id="editor-find-prev">↑</button>
								<span id="editor-match-count" class="match-count">0 matches</span>
							</div>
							<div class="find-replace-row">
								<input type="text" id="editor-replace-input" placeholder="Replace with..." class="find-replace-input">
								<button class="btn-primary btn-small" title="Replace Current" id="editor-replace-btn">Replace</button>
								<button class="btn-primary btn-small" title="Replace All" id="editor-replace-all-btn">Replace All</button>
							</div>
							<div class="find-replace-row">
								<label class="checkbox-label">
									<input type="checkbox" id="editor-case-sensitive"> Case sensitive
								</label>
								<label class="checkbox-label">
									<input type="checkbox" id="editor-whole-word"> Whole word
								</label>
								<label class="checkbox-label">
									<input type="checkbox" id="editor-regex-mode" title="Use regular expressions (.*+?[](){}|^$)">
									<code>.*</code> Regex
									<button class="btn-icon-small" id="editor-regex-help" title="Regex help">?</button>
								</label>
							</div>
						</div>
					</div>
					<div class="ribbon-panel" id="editor-panel-attachments">
						<div class="attachments-panel-container">
							<div id="editor-attachments-list" class="editor-attachments-list">
								<p class="no-attachments-message">Loading attachments...</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div id="editor-content">
				<div class="editor-body">
					<div class="line-numbers-wrapper" id="line-numbers-wrapper">
						<div class="line-numbers" id="line-numbers"></div>
					</div>
					<textarea id="editor-textarea" placeholder="Start writing..."></textarea>
				</div>
			</div>

			<div id="editor-status-bar">
				<div id="editor-doc-stats">
					<span>Words: 0</span>
					<span>Chars: 0</span>
				</div>
				<div id="editor-save-status">Last saved: Never</div>
			</div>

			<!-- Search Drawer (slides down from editor) -->
			<div id="search-results-drawer" class="search-drawer hidden">
				<div class="search-drawer-header">
					<h3>Search Results</h3>
					<div class="search-drawer-controls">
						<label class="search-option-label">
							<input type="checkbox" id="search-exact-match" title="Exact match only">
							<span>Exact</span>
						</label>
						<label class="search-option-label">
							<input type="checkbox" id="search-regex-mode" title="Use regular expressions">
							<span>Regex</span>
							<button class="btn-icon-small" id="search-regex-help" title="Regex help">?</button>
						</label>
						<input type="text" id="search-drawer-input" placeholder="Search..." class="search-drawer-input">
						<button class="btn btn-primary" id="btn-search-drawer" title="Search">Search</button>
						<button class="btn-icon" id="btn-close-search-drawer" title="Close">✕</button>
					</div>
				</div>
				<div id="search-drawer-content" class="search-drawer-content">
					<div class="search-placeholder">
						<p>Enter a search term to find related notes and tasks</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Search Results Panel (appears below editor) -->
	<div id="search-results-panel" class="search-results-panel hidden">
		<div class="search-panel-header">
			<h3>Search Results</h3>
			<div class="search-panel-controls">
				<input type="text" id="search-panel-input" placeholder="Search..." class="search-panel-search-input">
				<button class="btn btn-primary" id="btn-search-notes" title="Search">Search</button>
				<button class="btn-icon" id="btn-close-search-panel" title="Close search panel">✕</button>
			</div>
		</div>
		<div id="search-panel-content" class="search-panel-content">
			<div class="search-placeholder">
				<p>Use the search button in the editor to find related notes and tasks</p>
			</div>
		</div>
	</div>

	<div id="regex-help-modal" class="modal hidden">
		<div class="modal-content">
			<div class="modal-header">
				<h3>Regular Expression Syntax Guide</h3>
				<button class="btn-icon btn-close" id="btn-close-regex-help">&times;</button>
			</div>
			<div class="modal-body regex-help-content">
				<div class="regex-section">
					<h4>Characters</h4>
					<table class="regex-table">
						<tr><td><code>.</code></td><td>Any character except newline</td></tr>
						<tr><td><code>\d</code></td><td>Digit (0-9)</td></tr>
						<tr><td><code>\w</code></td><td>Word character (a-z, A-Z, 0-9, _)</td></tr>
						<tr><td><code>\s</code></td><td>Whitespace (space, tab, newline)</td></tr>
						<tr><td><code>.</code></td><td>Literal dot (when escaped)</td></tr>
					</table>
				</div>

				<div class="regex-section">
					<h4>Quantifiers</h4>
					<table class="regex-table">
						<tr><td><code>*</code></td><td>0 or more times</td></tr>
						<tr><td><code>+</code></td><td>1 or more times</td></tr>
						<tr><td><code>?</code></td><td>0 or 1 time (optional)</td></tr>
						<tr><td><code>{n}</code></td><td>Exactly n times</td></tr>
						<tr><td><code>{n,m}</code></td><td>Between n and m times</td></tr>
					</table>
				</div>

				<div class="regex-section">
					<h4>Character Classes</h4>
					<table class="regex-table">
						<tr><td><code>[abc]</code></td><td>a, b, or c</td></tr>
						<tr><td><code>[a-z]</code></td><td>a through z</td></tr>
						<tr><td><code>[^abc]</code></td><td>Not a, b, or c</td></tr>
					</table>
				</div>

				<div class="regex-section">
					<h4>Anchors</h4>
					<table class="regex-table">
						<tr><td><code>^</code></td><td>Start of line</td></tr>
						<tr><td><code>$</code></td><td>End of line</td></tr>
						<tr><td><code>\b</code></td><td>Word boundary</td></tr>
					</table>
				</div>

				<div class="regex-section">
					<h4>Alternation & Grouping</h4>
					<table class="regex-table">
						<tr><td><code>a|b</code></td><td>a or b</td></tr>
						<tr><td><code>(abc)</code></td><td>Group abc</td></tr>
					</table>
				</div>

				<div class="regex-section">
					<h4>Examples</h4>
					<table class="regex-table">
						<tr><td><code>^Note:</code></td><td>Lines starting with "Note:"</td></tr>
						<tr><td><code>\d{3}-\d{4}</code></td><td>Phone numbers like 123-4567</td></tr>
						<tr><td><code>[Dd]allas</code></td><td>"Dallas" or "dallas"</td></tr>
						<tr><td><code>trip.*Dallas</code></td><td>"trip" followed by anything then "Dallas"</td></tr>
						<tr><td><code>Austin|Dallas</code></td><td>Either "Austin" or "Dallas"</td></tr>
						<tr><td><code>\b\w{4}\b</code></td><td>Exactly 4-letter words</td></tr>
					</table>
				</div>
			</div>
		</div>
	</div>

	<div id="markdown-help-modal" class="modal hidden">
		<div class="modal-content">
			<div class="modal-header">
				<h3>Markdown Syntax Guide</h3>
				<button class="btn-icon btn-close" id="btn-close-markdown-help">&times;</button>
			</div>
			<div class="modal-body markdown-help-content">
				<div class="markdown-section">
					<h4>Text Formatting</h4>
					<table class="markdown-table">
						<tr><td><code>**bold**</code></td><td><strong>bold</strong></td></tr>
						<tr><td><code>_italic_</code></td><td><em>italic</em></td></tr>
						<tr><td><code>`code`</code></td><td><code>code</code></td></tr>
						<tr><td><code>~~strikethrough~~</code></td><td><s>strikethrough</s></td></tr>
					</table>
				</div>

				<div class="markdown-section">
					<h4>Headings</h4>
					<table class="markdown-table">
						<tr><td><code># Heading 1</code></td><td>Largest heading</td></tr>
						<tr><td><code>## Heading 2</code></td><td>Subheading</td></tr>
						<tr><td><code>### Heading 3</code></td><td>Smaller heading</td></tr>
						<tr><td><code>#### Heading 4</code></td><td>Even smaller</td></tr>
						<tr><td><code>##### Heading 5</code></td><td>Very small</td></tr>
						<tr><td><code>###### Heading 6</code></td><td>Smallest</td></tr>
					</table>
				</div>

				<div class="markdown-section">
					<h4>Lists</h4>
					<table class="markdown-table">
						<tr><td><code>- item 1<br>- item 2</code></td><td>Bullet list</td></tr>
						<tr><td><code>1. item 1<br>2. item 2</code></td><td>Numbered list</td></tr>
						<tr><td><code>- [ ] task<br>- [x] done</code></td><td>Checkbox list</td></tr>
					</table>
				</div>

				<div class="markdown-section">
					<h4>Links & Images</h4>
					<table class="markdown-table">
						<tr><td><code>[link text](url)</code></td><td>Hyperlink</td></tr>
						<tr><td><code>[link](https://example.com)</code></td><td>Full URL</td></tr>
						<tr><td><code>![alt text](image.jpg)</code></td><td>Image</td></tr>
					</table>
				</div>

				<div class="markdown-section">
					<h4>Code Blocks</h4>
					<table class="markdown-table">
						<tr><td><code>```<br>code here<br>```</code></td><td>Code block</td></tr>
						<tr><td><code>```javascript<br>const x = 1;<br>```</code></td><td>Syntax highlighting</td></tr>
					</table>
				</div>

				<div class="markdown-section">
					<h4>Other</h4>
					<table class="markdown-table">
						<tr><td><code>&gt; quote</code></td><td>Blockquote</td></tr>
						<tr><td><code>---</code></td><td>Horizontal rule</td></tr>
						<tr><td><code>| a | b |</code></td><td>Tables (GitHub)</td></tr>
					</table>
				</div>
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
					<button id="btn-take-photo" class="btn">Take Photo</button>
					<button id="btn-upload-staged" class="btn btn-success" style="display: none;">Upload</button>
				</div>
				<input type="file" id="attachment-file-input" multiple accept="image/*,application/pdf" hidden>
				<input type="file" id="attachment-camera-input" accept="image/*" capture="environment" hidden>
			</div>
		</div>
	</div>

	<!-- Comments Modal -->
	<div id="comments-modal-overlay" class="hidden">
		<div id="comments-modal-container">
			<div class="comments-modal-header">
				<h4 id="comments-modal-title">Comments</h4>
				<button id="comments-modal-close-btn" class="btn-icon btn-close">&times;</button>
			</div>
			<div id="comments-modal-body">
				<div id="comments-list">
					<p class="no-comments-message">Loading comments...</p>
				</div>
				<div id="add-comment-section">
					<textarea id="new-comment-input" placeholder="Add a comment..." rows="3"></textarea>
					<button id="btn-add-comment" class="btn btn-primary">Post Comment</button>
				</div>
			</div>
		</div>
	</div>

	<div id="attachment-viewer-modal-overlay" class="hidden">
		<button id="attachment-viewer-close-btn" class="btn-icon btn-close">&times;</button>
		<div id="attachment-viewer-content"></div>
	</div>

	<!-- Mission Focus Chart Modal -->
	<div id="mission-focus-modal-overlay" class="hidden">
		<div id="mission-focus-modal-container">
			<div class="mission-focus-modal-header">
				<h4>Mission Focus Chart</h4>
				<button id="mission-focus-modal-close-btn" class="btn-icon btn-close">&times;</button>
			</div>
			<div id="mission-focus-modal-body">
				<div id="mission-focus-modal-chart-container">
					<canvas id="mission-focus-modal-canvas"></canvas>
				</div>
				<div id="mission-focus-modal-legend">
					<div class="legend-item">
						<span class="legend-color" style="background-color: #22c55e;"></span>
						<span class="legend-label">Signal</span>
						<span id="mission-focus-signal-percent" class="legend-percent">0%</span>
					</div>
					<div class="legend-item">
						<span class="legend-color" style="background-color: #3b82f6;"></span>
						<span class="legend-label">Support</span>
						<span id="mission-focus-support-percent" class="legend-percent">0%</span>
					</div>
					<div class="legend-item">
						<span class="legend-color" style="background-color: #f97316;"></span>
						<span class="legend-label">Backlog</span>
						<span id="mission-focus-backlog-percent" class="legend-percent">0%</span>
					</div>
				</div>
				<div id="mission-focus-modal-footer">
					<p class="mission-focus-modal-note">Based on tasks and journal entries from the last 30 days</p>
				</div>
			</div>
		</div>
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
							<span class="usage-label">Journal Entries</span>
							<span id="journal-entries-usage-text" class="usage-text">0 of 0</span>
						</div>
						<div class="usage-bar-container">
							<div class="usage-bar">
								<div id="journal-entries-usage-fill" class="usage-fill" style="width: 0%"></div>
							</div>
							<span id="journal-entries-usage-percentage" class="usage-percentage">0%</span>
						</div>
					</div>
					<div class="usage-category">
						<div class="usage-category-header">
							<span class="usage-label">Sharing</span>
							<span id="sharing-status" class="usage-text">Loading...</span>
						</div>
					</div>
				</div>
				<div class="usage-stats-actions">
					<button id="usage-stats-bulk-delete" class="btn btn-secondary">Bulk Delete</button>
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
						<button class="calendar-tab" data-tab="public">Public Calendars</button>
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
				
				<!-- Public Calendars Tab -->
				<div id="calendar-tab-public" class="calendar-tab-content">
					<div class="calendar-management-header">
						<h5>Browse Public Calendars</h5>
						<p class="calendar-management-description">Discover and subscribe to calendars shared by other users</p>
					</div>
					<div id="public-calendars-list" class="calendars-list">
						<!-- Public calendars will be populated here -->
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
    "startDate": "2025-11-01",
    "endDate": "2025-11-05",
    "label": "Discover"
  },
  {
    "startDate": "2025-11-06",
    "endDate": "2025-11-10",
    "label": "Report"
  }
]</code></pre>
					<p class="form-help">Note: Enter the calendar name in the field below. All events in this import will be grouped under that name, allowing you to delete them all at once if needed.</p>
				</div>
				<div class="import-form">
					<div class="import-method-tabs">
						<button type="button" class="import-method-tab active" data-method="file">Upload File</button>
						<button type="button" class="import-method-tab" data-method="paste">Paste JSON</button>
					</div>
					
					<!-- File Upload Section -->
					<div id="import-file-section" class="import-method-section active">
						<div class="form-group">
							<label for="json-file-input">Select JSON File</label>
							<input type="file" id="json-file-input" accept=".json" />
						</div>
					</div>
					
					<!-- Paste JSON Section -->
					<div id="import-paste-section" class="import-method-section hidden">
						<div class="form-group">
							<label for="json-paste-input">Paste JSON Data</label>
							<textarea id="json-paste-input" rows="10" placeholder='[\n  {\n    "startDate": "2025-11-01",\n    "endDate": "2025-11-05",\n    "label": "Discover"\n  }\n]'></textarea>
							<small class="form-help">Paste your JSON array directly into this field</small>
						</div>
					</div>
					
					<div class="form-group">
						<label for="import-calendar-name">Calendar Name *</label>
						<input type="text" id="import-calendar-name" placeholder="e.g. report dates" required>
						<small class="form-help">Give this calendar import a name to manage it later</small>
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
	
	<!-- Calendar Export Modal -->
	<div id="calendar-export-modal-overlay" class="hidden">
		<div id="calendar-export-modal-container">
			<div class="calendar-export-modal-header">
				<h4>Export Calendar: <span id="export-calendar-name"></span></h4>
				<button id="calendar-export-modal-close-btn" class="btn-icon btn-close" type="button">&times;</button>
			</div>
			<div class="calendar-export-modal-body">
				<div class="export-instructions">
					<p>Copy the JSON data below to reuse this calendar elsewhere:</p>
				</div>
				<div class="form-group">
					<label for="calendar-export-json">Calendar JSON</label>
					<textarea id="calendar-export-json" rows="15" readonly></textarea>
				</div>
				<div class="calendar-export-modal-buttons">
					<button type="button" id="btn-copy-export-json" class="btn btn-primary">Copy All</button>
					<button type="button" id="btn-export-close" class="btn">Close</button>
				</div>
			</div>
		</div>
	</div>
	
	<!-- User Guide Modal -->
	<div id="user-guide-modal" class="modal hidden">
		<div class="modal-content user-guide-modal-content">
			<div class="modal-header">
				<h3>MyDayHub User Guide</h3>
				<button class="btn-icon btn-close" id="btn-close-user-guide">&times;</button>
			</div>
			<div class="modal-body user-guide-modal-body">
				<div class="user-guide-container">
					<div class="guide-header">
						<img src="<?php echo APP_URL; ?>/media/icons/icon-192x192.png" alt="MyDayHub Logo" class="guide-logo">
						<h1>MyDayHub User Guide</h1>
						<p>Your comprehensive guide to mastering productivity with privacy</p>
					</div>
					
					<div class="accordion">
						
						<!-- Section 1: Getting Started -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M12 2L2 7l10 5 10-5-10-5z"/>
									<path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
								</svg>
								<span class="accordion-title">Getting Started</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<p>Welcome to MyDayHub! This guide will help you understand and make the most of your privacy-focused productivity hub.</p>
									
									<h3>What is MyDayHub?</h3>
									<p>MyDayHub is a privacy-first productivity application designed to help you focus on what truly matters. Unlike traditional task managers, MyDayHub emphasizes <strong>signal over noise</strong>—helping you distinguish between work that advances your mission and work that merely keeps you busy.</p>
									
									<h3>Key Features</h3>
									<ul>
										<li><strong>Tasks View:</strong> Kanban-style board with flexible columns and intelligent task classification</li>
										<li><strong>Journal View:</strong> Daily entries organized by date for reflection and planning</li>
										<li><strong>Privacy-First:</strong> Optional zero-knowledge encryption for sensitive content</li>
										<li><strong>Collaboration:</strong> Controlled sharing with permission management</li>
										<li><strong>Calendar Overlays:</strong> Contextual date information without disrupting your workflow</li>
									</ul>
									
									<div class="tip-box">
										<strong>💡 Tip:</strong> Start with the Tasks view to organize your work, then use the Journal view for daily reflections and planning.
									</div>
								</div>
							</div>
						</div>
						
						<!-- Section 2: Understanding Task Classification -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
									<polyline points="22 4 12 14.01 9 11.01"></polyline>
								</svg>
								<span class="accordion-title">Task Classification: Signal, Support & Backlog</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<p>MyDayHub uses a three-tier classification system to help you focus on what truly matters:</p>
									
									<h3>Signal (Green) - Mission-Critical Work</h3>
									<p>Tasks that directly advance your most important goals. These are your highest priority items that move the needle on your mission.</p>
									<ul>
										<li>Strategic projects that create lasting value</li>
										<li>Work that builds your reputation or expertise</li>
										<li>Tasks that open new opportunities</li>
										<li>Activities that align with your core values</li>
									</ul>
									
									<h3>Support (Blue) - Necessary Maintenance</h3>
									<p>Important tasks that keep things running smoothly but don't directly advance your mission.</p>
									<ul>
										<li>Administrative tasks and paperwork</li>
										<li>Routine maintenance and updates</li>
										<li>Meeting preparation and follow-ups</li>
										<li>System maintenance and organization</li>
									</ul>
									
									<h3>Backlog (Gray) - Future Possibilities</h3>
									<p>Tasks that might be valuable someday but aren't urgent or directly mission-critical.</p>
									<ul>
										<li>Nice-to-have improvements</li>
										<li>Future research and exploration</li>
										<li>Optional enhancements</li>
										<li>Low-priority maintenance</li>
									</ul>
									
									<div class="tip-box">
										<strong>💡 Pro Tip:</strong> Aim for 70% Signal, 20% Support, and 10% Backlog. This ratio ensures you're focused on mission-critical work while maintaining necessary systems.
									</div>
								</div>
							</div>
						</div>
						
						<!-- Section 3: Working with Tasks & Columns -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
									<polyline points="14 2 14 8 20 8"/>
									<line x1="16" y1="13" x2="8" y2="13"/>
									<line x1="16" y1="17" x2="8" y2="17"/>
									<polyline points="10 9 9 9 8 9"/>
								</svg>
								<span class="accordion-title">Working with Tasks & Columns</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<h3>Creating Tasks</h3>
									<ol>
										<li>Click <strong>"+ New Task"</strong> at the bottom of any column</li>
										<li>Type your task title and press Enter</li>
										<li>Click the task to add detailed notes, due dates, or attachments</li>
										<li>Use the classification menu to set Signal/Support/Backlog</li>
									</ol>
									
									<h3>Managing Columns</h3>
									<ul>
										<li><strong>Create:</strong> Click the "+" button in the header</li>
										<li><strong>Rename:</strong> Click the column title to edit</li>
										<li><strong>Reorder:</strong> Drag columns by their headers</li>
										<li><strong>Delete:</strong> Use the column menu (⋮) → Delete</li>
									</ul>
									
									<h3>Moving Tasks</h3>
									<p><strong>Desktop:</strong> Drag and drop tasks between columns or within columns to reorder</p>
									<p><strong>Mobile:</strong> Use the task menu (⋮) → Move, then select destination</p>
									
									<h3>Keyboard Shortcuts</h3>
									<ul>
										<li><strong>Enter:</strong> Create new task in focused column</li>
										<li><strong>Escape:</strong> Cancel current action</li>
										<li><strong>Tab:</strong> Move between columns</li>
									</ul>
								</div>
							</div>
						</div>
						
						<!-- Section 4: Privacy & Zero-Knowledge Encryption -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
									<circle cx="12" cy="16" r="1"/>
									<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
								</svg>
								<span class="accordion-title">Privacy & Zero-Knowledge Encryption</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<p>MyDayHub offers optional zero-knowledge encryption to protect your most sensitive information.</p>
									
									<h3>Setting Up Encryption</h3>
									<ol>
										<li>Go to Settings → <strong>"Privacy & Encryption"</strong></li>
										<li>Click <strong>"Set Up Encryption"</strong></li>
										<li>Create security questions for recovery</li>
										<li>Your encryption is now active!</li>
									</ol>
									
									<h3>Using Private Items</h3>
									<ul>
										<li>Toggle the lock icon on any task or journal entry</li>
										<li>Private items are encrypted before storage</li>
										<li>Only you can decrypt and view private content</li>
										<li>Private items cannot be shared with others</li>
									</ul>
									
									<h3>Recovery</h3>
									<p>If you forget your password, use your security questions to recover access to your encrypted data.</p>
									
									<div class="warning-box">
										<strong>⚠️ Important:</strong> If you change your password, old encrypted data becomes unrecoverable. This is by design for maximum security.
									</div>
								</div>
							</div>
						</div>
						
						<!-- Section 5: Sharing & Collaboration -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
									<circle cx="9" cy="7" r="4"/>
									<path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
								</svg>
								<span class="accordion-title">Sharing & Collaboration</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<p>Share tasks and journal entries with team members while maintaining control over your data.</p>
									
									<h3>Sharing Tasks</h3>
									<ol>
										<li>Click the task menu (⋮) → <strong>"Share"</strong></li>
										<li>Enter the recipient's email address</li>
										<li>Choose permission level: View or Edit</li>
										<li>Recipient receives email with access link</li>
									</ol>
									
									<h3>Permission Levels</h3>
									<ul>
										<li><strong>View:</strong> Can see task content but cannot edit</li>
										<li><strong>Edit:</strong> Can modify task content and classification</li>
									</ul>
									
									<h3>Ready-for-Review Workflow</h3>
									<p>Recipients can mark shared items as "Ready for Review" to notify you when they've completed their work.</p>
									
									<h3>Managing Shares</h3>
									<ul>
										<li>View all your shared items in Settings</li>
										<li>Revoke access at any time</li>
										<li>Change permission levels</li>
										<li>See who has access to your items</li>
									</ul>
									
									<div class="tip-box">
										<strong>💡 Best Practice:</strong> Only share non-private items. Private items remain encrypted and cannot be shared for security reasons.
									</div>
								</div>
							</div>
						</div>
						
						<!-- Section 6: Journal View -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
									<polyline points="14 2 14 8 20 8"/>
									<line x1="16" y1="13" x2="8" y2="13"/>
									<line x1="16" y1="17" x2="8" y2="17"/>
									<polyline points="10 9 9 9 8 9"/>
								</svg>
								<span class="accordion-title">Journal View & Daily Entries</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<p>The Journal view provides a date-based organization system for daily reflections, planning, and notes.</p>
									
									<h3>Accessing Journal View</h3>
									<p>Click the <strong>"Journal"</strong> tab in the header to switch from Tasks to Journal view. Each date gets its own column, displayed horizontally with the most recent dates on the right.</p>
									
									<h3>View Modes & Filtering</h3>
									<p>Customize your journal view with flexible display options:</p>
									<ul>
										<li><strong>Day Count:</strong> Choose 1-day, 3-day, or 5-day views (mobile automatically uses 1-day)</li>
										<li><strong>Filter Modes:</strong>
											<ul>
												<li><strong>Show All Days:</strong> Display all dates including weekends</li>
												<li><strong>Weekdays Only:</strong> Hide Saturday and Sunday columns</li>
												<li><strong>Only Days with Notes:</strong> Show only dates that have journal entries</li>
											</ul>
										</li>
										<li><strong>Navigation:</strong> Use < and > buttons in column headers or << >> buttons in the footer menu</li>
									</ul>
									
									<h3>Creating Journal Entries</h3>
									<ol>
										<li>Navigate to the desired date column</li>
										<li>Click <strong>"+ New Entry"</strong> at the bottom</li>
										<li>Enter your entry title</li>
										<li>Press Enter to create</li>
										<li>Click the entry to add detailed notes</li>
									</ol>
									
									<h3>Journal Entry Features</h3>
									<ul>
										<li><strong>Rich Notes:</strong> Use the full editor for detailed content with Markdown support</li>
										<li><strong>Classification:</strong> Organize entries as Signal, Support, or Backlog (matching task classification)</li>
										<li><strong>Privacy:</strong> Make entries private with encryption</li>
										<li><strong>Organization:</strong> Entries automatically sort by date</li>
										<li><strong>Navigation:</strong> Scroll horizontally to see past and future dates</li>
										<li><strong>Drag & Drop:</strong> Move entries between date columns</li>
									</ul>
									
									<h3>Linking Tasks to Journal Entries</h3>
									<p>Connect tasks to specific journal entries to track daily progress:</p>
									<ul>
										<li>Reference task IDs in journal notes</li>
										<li>Use journal entries to plan daily task priorities</li>
										<li>Review completed tasks in daily reflections</li>
									</ul>
									
									<h3>Best Practices for Journaling</h3>
									<ul>
										<li><strong>Morning Planning:</strong> Start each day by reviewing priorities in a new journal entry</li>
										<li><strong>Evening Reflection:</strong> End each day by noting accomplishments and learnings</li>
										<li><strong>Weekly Reviews:</strong> Use Sunday/Monday entries for weekly planning</li>
										<li><strong>Private Thoughts:</strong> Toggle sensitive entries to private for personal reflections</li>
									</ul>
									
									<div class="tip-box">
										<strong>💡 Power User Tip:</strong> Use journal entries to track your Signal task progress. Each evening, note which Signal tasks advanced and which obstacles you overcame. This creates a valuable record of your mission progress over time.
									</div>
								</div>
							</div>
						</div>
						
						<!-- Section 7: Advanced Features -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="3"/>
									<path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
								</svg>
								<span class="accordion-title">Advanced Features</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<h3>Task Snoozing</h3>
									<p>Temporarily hide tasks until a specific date:</p>
									<ul>
										<li>Click task menu (⋮) → <strong>"Snooze"</strong></li>
										<li>Choose preset duration (1 week, 1 month, 1 quarter)</li>
										<li>Or select a custom date</li>
										<li>Task becomes semi-transparent and moves to Backlog classification</li>
										<li>Automatically unsnoozes at 9 AM on the scheduled date</li>
									</ul>
									
									<h3>File Attachments</h3>
									<p>Add images and PDFs to tasks:</p>
									<ul>
										<li>Supported formats: JPEG, PNG, GIF, WebP, PDF</li>
										<li>Maximum file size: 5MB per file</li>
										<li>Access via task menu (⋮) → <strong>"Manage Files"</strong></li>
										<li>Upload by browsing or drag-and-drop</li>
										<li>View in-app (images) or new tab (PDFs)</li>
									</ul>
									
									<h3>Calendar Overlays</h3>
									<p>Add contextual calendar information without cluttering your workflow:</p>
									<ul>
										<li>Access via Settings → <strong>"Calendar Overlays"</strong></li>
										<li>Create fiscal calendars, holidays, birthdays, custom events</li>
										<li>Events appear as badges in the header</li>
										<li>Import/export via JSON for bulk management</li>
										<li>Set priorities to control which events display</li>
									</ul>
									
									<h3>Mission Focus Chart</h3>
									<p>Visualize your task distribution:</p>
									<ul>
										<li>Small doughnut chart in the header</li>
										<li>Shows Signal/Support/Backlog proportions</li>
										<li>Hover to see exact percentages</li>
										<li>Toggle visibility in Settings</li>
										<li>Updates in real-time as you work</li>
									</ul>
									
									<h3>Design & Typography</h3>
									<p>MyDayHub features a modern, elegant design system:</p>
									<ul>
										<li><strong>Inter Font:</strong> Professional, highly legible typeface designed for digital interfaces</li>
										<li><strong>Light Typography:</strong> Refined font weights for a clean, modern appearance</li>
										<li><strong>Consistent Icons:</strong> Professional SVG icons throughout the interface</li>
										<li><strong>Theme Support:</strong> Dark (default), Light, and High-Contrast modes</li>
										<li><strong>Accent Colors:</strong> Customizable accent colors with automatic contrast adjustment</li>
									</ul>
									
									<h3>Mobile Move Mode</h3>
									<p>Touch-friendly task movement:</p>
									<ol>
										<li>Open task menu (⋮) → <strong>"Move"</strong></li>
										<li>Task enters "wiggle" state with banner at top</li>
										<li>Column footers change to <strong>"Move here"</strong> buttons</li>
										<li>Click destination column's button</li>
										<li>For in-column moves, use the drop zones between tasks</li>
									</ol>
									
									<h3>Filtering</h3>
									<p>Control what you see:</p>
									<ul>
										<li>Bottom toolbar filter menu</li>
										<li>Show/Hide Completed tasks</li>
										<li>Show/Hide Private items</li>
										<li>Show/Hide Snoozed tasks</li>
										<li>Filter states persist across sessions</li>
									</ul>
									
									<h3>Keyboard Shortcuts</h3>
									<ul>
										<li><strong>Ctrl/Cmd + N:</strong> Create new task</li>
										<li><strong>Ctrl/Cmd + F:</strong> Focus search</li>
										<li><strong>Escape:</strong> Close modals/cancel actions</li>
										<li><strong>Tab:</strong> Navigate between elements</li>
									</ul>
								</div>
							</div>
						</div>
						
						<!-- Section 8: Settings & Customization -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="3"/>
									<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
								</svg>
								<span class="accordion-title">Settings & Customization</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<h3>Theme Selection</h3>
									<p>Choose your preferred visual style:</p>
									<ul>
										<li><strong>Dark:</strong> Default theme with dark backgrounds</li>
										<li><strong>Light:</strong> Light backgrounds for bright environments</li>
										<li><strong>High-Contrast:</strong> Maximum contrast for accessibility</li>
									</ul>
									
									<h3>Accent Color Customization</h3>
									<p>Personalize your interface with custom accent colors:</p>
									<ul>
										<li>Choose from preset colors or create custom ones</li>
										<li>Accent color affects buttons, links, and highlights</li>
										<li>Automatic contrast adjustment for readability</li>
										<li>Colors persist across theme changes</li>
									</ul>
									
									<h3>Font Size Controls</h3>
									<p>Adjust text size for better readability:</p>
									<ul>
										<li>Global font scaling affects all text</li>
										<li>Use A- and A+ buttons in Settings</li>
										<li>Changes apply immediately</li>
										<li>Settings persist across sessions</li>
									</ul>
									
									<h3>Mission Focus Chart</h3>
									<p>Control the header chart visibility:</p>
									<ul>
										<li>Toggle on/off in Settings</li>
										<li>Visible by default for new users</li>
										<li>Helps track your Signal/Support/Backlog ratio</li>
									</ul>
									
									<h3>Completion Sound</h3>
									<p>Enable or disable audio feedback:</p>
									<ul>
										<li>Toggle completion sound in Settings</li>
										<li>Plays when tasks are marked complete</li>
										<li>Respects system volume settings</li>
									</ul>
								</div>
							</div>
						</div>
						
						<!-- Section 9: Keyboard Shortcuts & Pro Tips -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M9 12l2 2 4-4"/>
									<path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
									<path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
									<path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
									<path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
								</svg>
								<span class="accordion-title">Keyboard Shortcuts & Pro Tips</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<h3>Essential Keyboard Shortcuts</h3>
									<ul>
										<li><strong>Ctrl/Cmd + N:</strong> Create new task in focused column</li>
										<li><strong>Ctrl/Cmd + F:</strong> Focus search bar</li>
										<li><strong>Escape:</strong> Close modals, cancel actions</li>
										<li><strong>Tab:</strong> Navigate between columns</li>
										<li><strong>Enter:</strong> Create task or save changes</li>
									</ul>
									
									<h3>Power User Workflows</h3>
									<p><strong>Morning Routine:</strong></p>
									<ol>
										<li>Review yesterday's journal entry</li>
										<li>Check Mission Focus Chart for balance</li>
										<li>Create today's journal entry with priorities</li>
										<li>Move Signal tasks to active columns</li>
									</ol>
									
									<p><strong>Weekly Review:</strong></p>
									<ol>
										<li>Review all completed Signal tasks</li>
										<li>Assess Support/Backlog balance</li>
										<li>Plan next week's Signal priorities</li>
										<li>Update journal entries with insights</li>
									</ol>
									
									<h3>Productivity Tips</h3>
									<ul>
										<li><strong>Batch Similar Tasks:</strong> Group Support tasks together</li>
										<li><strong>Time Blocking:</strong> Use journal entries to plan focused work sessions</li>
										<li><strong>Regular Reviews:</strong> Check Mission Focus Chart daily</li>
										<li><strong>Private Reflection:</strong> Use private journal entries for honest self-assessment</li>
									</ul>
									
									<div class="tip-box">
										<strong>💡 Pro Tip:</strong> Start each day by creating a journal entry with your top 3 Signal tasks. End each day by noting what you accomplished and what obstacles you overcame.
									</div>
								</div>
							</div>
						</div>
						
						<!-- Section 10: Troubleshooting & FAQ -->
						<div class="accordion-item">
							<div class="accordion-header">
								<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"/>
									<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
									<line x1="12" y1="17" x2="12.01" y2="17"/>
								</svg>
								<span class="accordion-title">Troubleshooting & FAQ</span>
								<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="accordion-content">
								<div class="accordion-body">
									<h3>Common Issues</h3>
									
									<h4>Tasks not saving?</h4>
									<ul>
										<li>Check your internet connection</li>
										<li>Try refreshing the page</li>
										<li>Clear browser cache if problems persist</li>
									</ul>
									
									<h4>Can't see shared tasks?</h4>
									<ul>
										<li>Check your email for the share notification</li>
										<li>Ensure you're logged in with the correct account</li>
										<li>Contact the person who shared the task</li>
									</ul>
									
									<h4>Encryption setup not working?</h4>
									<ul>
										<li>Ensure you have a stable internet connection</li>
										<li>Try using a different browser</li>
										<li>Check that JavaScript is enabled</li>
									</ul>
									
									<h3>Performance Tips</h3>
									<ul>
										<li><strong>Regular Cleanup:</strong> Archive completed tasks periodically</li>
										<li><strong>Limit Attachments:</strong> Keep file sizes under 5MB</li>
										<li><strong>Browser Updates:</strong> Keep your browser updated for best performance</li>
										<li><strong>Clear Cache:</strong> Clear browser cache if the app feels slow</li>
									</ul>
									
									<h3>Data Safety</h3>
									<ul>
										<li>Your data is encrypted and stored securely</li>
										<li>Regular backups are created automatically</li>
										<li>Private items remain encrypted even on the server</li>
										<li>You can export your data anytime via Settings</li>
									</ul>
									
									<h3>Getting Help</h3>
									<p>If you need additional support:</p>
									<ul>
										<li>Check this user guide for detailed instructions</li>
										<li>Try the troubleshooting steps above</li>
										<li>Include browser type and version for technical issues</li>
									</ul>
								</div>
							</div>
						</div>
						
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Search Notes & Tasks Modal -->
	<div id="search-notes-modal" class="modal hidden">
		<div class="modal-content search-modal-content">
			<div class="modal-header">
				<h3>Search Notes & Tasks</h3>
				<button class="btn-icon btn-close" id="btn-close-search-notes">&times;</button>
			</div>
			<div class="modal-body">
				<div class="search-input-section">
					<div class="search-input-group">
						<input type="text" id="search-notes-input" placeholder="Search journal entries and tasks..." autocomplete="off">
						<button class="btn btn-primary" id="btn-search-notes">Search</button>
					</div>
					<div class="search-options">
						<label class="checkbox-label">
							<input type="checkbox" id="search-journal-entries" checked>
							<span>Journal Entries</span>
						</label>
						<label class="checkbox-label">
							<input type="checkbox" id="search-tasks" checked>
							<span>Tasks</span>
						</label>
					</div>
				</div>
				<div class="search-results-section">
					<div id="search-results-container">
						<div class="search-placeholder">
							<p>Enter a search term to find related notes and tasks</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	
	<script>
		// Make username available globally for JavaScript
		window.appUsername = '<?php echo htmlspecialchars($username); ?>';
		// Make user email available globally for JavaScript
		<?php
		// Get user email from database using username
		$userEmail = '';
		if (isset($_SESSION['user_id'])) {
			try {
				require_once 'incs/db.php';
				$pdo = get_pdo();
				$stmt = $pdo->prepare("SELECT email FROM users WHERE user_id = :userId");
				$stmt->execute([':userId' => $_SESSION['user_id']]);
				$userEmail = $stmt->fetchColumn() ?: '';
			} catch (Exception $e) {
				$userEmail = '';
			}
		}
		?>
		window.appUserEmail = '<?php echo htmlspecialchars($userEmail); ?>';
		
		// Debug DEVMODE
		console.log('PHP DEVMODE:', <?php echo defined('DEVMODE') && DEVMODE ? 'true' : 'false'; ?>);
		console.log('PHP DEVELOPERS from .env:', '<?php echo getenv('DEVELOPERS') ?: 'NOT SET'; ?>');
		console.log('PHP _ENV_VARS DEVELOPERS:', '<?php echo isset($_ENV_VARS['DEVELOPERS']) ? $_ENV_VARS['DEVELOPERS'] : 'NOT IN ARRAY'; ?>');
		console.log('Full _ENV_VARS:', <?php echo json_encode($_ENV_VARS); ?>);
	</script>
	<!-- DEBUG OUTPUT -->
	<!--
	PHP DEVMODE: <?php echo defined('DEVMODE') && DEVMODE ? 'TRUE' : 'FALSE'; ?>
	SESSION user_id: <?php echo $_SESSION['user_id'] ?? 'NOT SET'; ?>
	SESSION username: <?php echo $_SESSION['username'] ?? 'NOT SET'; ?>
	_ENV_VARS DEVELOPERS: <?php echo isset($_ENV_VARS['DEVELOPERS']) ? $_ENV_VARS['DEVELOPERS'] : 'NOT IN ARRAY'; ?>
	User email from DB query below:
	-->
	<?php
	// Quick debug: Get user email and compare
	if (isset($_SESSION['user_id'])) {
		try {
			require_once 'incs/db.php';
			$pdo = get_pdo();
			$stmt = $pdo->prepare("SELECT email FROM users WHERE user_id = :userId");
			$stmt->execute([':userId' => $_SESSION['user_id']]);
			$dbEmail = $stmt->fetchColumn();
			
			$developers = isset($_ENV_VARS['DEVELOPERS']) ? $_ENV_VARS['DEVELOPERS'] : '';
			$developerEmails = array_map('trim', explode(',', $developers));
			
			echo '<!-- DEBUG: User email: ' . htmlspecialchars($dbEmail) . " -->\n";
			echo '<!-- DEBUG: Developer emails: ' . htmlspecialchars(implode(', ', $developerEmails)) . " -->\n";
			echo '<!-- DEBUG: in_array result: ' . (in_array($dbEmail, $developerEmails) ? 'MATCH' : 'NO MATCH') . " -->\n";
			
			foreach ($developerEmails as $devEmail) {
				echo '<!-- DEBUG: Comparing ' . htmlspecialchars($dbEmail) . ' === ' . htmlspecialchars($devEmail) . ': ' . ($dbEmail === $devEmail ? 'EXACT MATCH' : 'no') . " -->\n";
			}
		} catch (Exception $e) {
			echo '<!-- DEBUG ERROR: ' . htmlspecialchars($e->getMessage()) . " -->\n";
		}
	}
	?>
		</div>
	</div>
	
	<!-- Bulk Delete Modal -->
	<div id="bulk-delete-modal-overlay" class="hidden">
		<div id="bulk-delete-modal-container">
			<div class="bulk-delete-modal-header">
				<h4>Bulk Delete</h4>
				<button id="bulk-delete-modal-close-btn" class="btn-icon btn-close" type="button">&times;</button>
			</div>
			<div class="bulk-delete-modal-body">
				<div class="bulk-delete-filters">
					<div class="form-group">
						<label for="bulk-delete-item-type">Item Type</label>
						<select id="bulk-delete-item-type">
							<option value="tasks">Tasks</option>
							<option value="journal_entries">Journal Entries</option>
						</select>
					</div>
					<div class="form-group">
						<label for="bulk-delete-filter-type">Filter By</label>
						<select id="bulk-delete-filter-type">
							<option value="all">All Items</option>
							<option value="oldest">Oldest X Items</option>
							<option value="deleted">Deleted Items</option>
							<option value="deleted_older_than">Deleted Items Older Than X Days</option>
						</select>
					</div>
					<div class="form-group" id="bulk-delete-count-group" style="display: none;">
						<label for="bulk-delete-count">Count</label>
						<input type="number" id="bulk-delete-count" min="1" value="10">
					</div>
					<div class="form-group" id="bulk-delete-days-group" style="display: none;">
						<label for="bulk-delete-days">Days</label>
						<input type="number" id="bulk-delete-days" min="1" value="30">
					</div>
					<div class="bulk-delete-actions">
						<button id="bulk-delete-apply-filter" class="btn btn-primary">Apply Filter</button>
						<button id="bulk-delete-reset-filter" class="btn btn-secondary">Reset</button>
					</div>
				</div>
				<div class="bulk-delete-results" id="bulk-delete-results" style="display: none;">
					<div class="bulk-delete-results-header">
						<div class="bulk-delete-results-info">
							<span id="bulk-delete-results-count">0 items found</span>
							<label class="bulk-delete-select-all">
								<input type="checkbox" id="bulk-delete-select-all">
								Select All
							</label>
						</div>
					</div>
					<div class="bulk-delete-results-list" id="bulk-delete-results-list">
						<!-- Results will be populated here -->
					</div>
					<div class="bulk-delete-confirm-section">
						<button id="bulk-delete-confirm" class="btn btn-danger" disabled>Delete Selected (<span id="bulk-delete-selected-count">0</span>)</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
	<script src="uix/crypto.js" defer></script>
	<script src="uix/encryption-setup.js" defer></script>
	<script src="uix/app.js" defer></script>
	<?php if ($isCurrentUserDeveloper): ?>
	<script src="uix/developer-settings.js" defer></script>
	<?php endif; ?>
	<script src="uix/editor.js" defer></script>
	<script src="uix/view-manager.js" defer></script>
	<script src="uix/tasks.js" defer></script>
	<script src="uix/calendar.js" defer></script>
	<script src="uix/journal.js?v=8.8" defer></script>

</body>
</html>