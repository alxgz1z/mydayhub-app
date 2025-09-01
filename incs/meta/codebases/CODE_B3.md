# FULL CODE APP BETA 3
*snapshot 8/30/25*

## index.php 
*START FULL CODE FOR FILE:	index.php*
~~~
<?php
// Use __DIR__ to create a robust path to the config file.
require_once __DIR__ . '/includes/config.php';
session_start();

// The asset base path is now always the root for this environment.
$asset_base_path = '/';

// Session check
if (!isset($_SESSION['user_id'])) {
	// Redirect to the login page at the site's root.
	header('Location: ' . $asset_base_path . 'login.php');
	exit;
}
$username = $_SESSION['username'];
?>
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Tasks & Journal</title>

	<link rel="icon" href="assets/images/favicon.png" type="image/png">
	<link rel="apple-touch-icon" href="assets/images/icon.png">

	<script>
		// Pass PHP config variables to JavaScript
		window.APP_CONFIG = {
			debug: <?php echo json_encode(defined('DEBUG_MODE') && DEBUG_MODE); ?>,
			appUrl: <?php echo json_encode(APP_URL); ?>
		};
	</script>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
	<link rel="stylesheet" href="<?php echo $asset_base_path; ?>assets/css/style.css">
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.1/math.min.js"></script>
</head>

<body class="<?php echo (defined('DEV_MODE') && DEV_MODE) ? 'dev-mode-active' : ''; ?>">

	<?php 
	include BASE_PATH . 'includes/_manual.php'; 
	?>

	<div id="side-menu">
		<div class="side-menu-header">
			<h3>Settings</h3>
			<button id="side-menu-close-btn" class="close-modal-btn">&times;</button>
		</div>
		<div class="side-menu-body">
			<div class="setting-item">
				<label for="sound-toggle">Enable Task Completion Sound</label>
				<div class="form-check form-switch">
					<input class="form-check-input" type="checkbox" role="switch" id="sound-toggle">
				</div>
			</div>
			<div class="setting-item">
				<label>Theme</label>
				<div class="btn-group" id="theme-toggle-group" role="group">
					<button type="button" class="btn btn-outline-secondary" data-theme="dark">Dark</button>
					<button type="button" class="btn btn-outline-secondary" data-theme="light">Light</button>
				</div>
			</div>
			<div class="setting-item">
				<label for="private-view-only-toggle">Private View Only</label>
				<div class="form-check form-switch">
					<input class="form-check-input" type="checkbox" role="switch" id="private-view-only-toggle">
				</div>
			</div>
			<div class="setting-item">
				<label for="skip-weekends-toggle">Skip Weekends in Journal</label>
				<div class="form-check form-switch">
					<input class="form-check-input" type="checkbox" role="switch" id="skip-weekends-toggle">
				</div>
			</div>
			<div class="setting-item">
				<label>Calendar Overlays</label>
				<button id="open-calendar-settings-btn" class="btn btn-sm btn-outline-secondary">Manage</button>
			</div>
			<div class="setting-item">
				<label>Global Font Size</label>
				<div class="btn-group" role="group">
					<button type="button" id="font-decrease-btn" class="btn btn-outline-secondary">A-</button>
					<button type="button" id="font-increase-btn" class="btn btn-outline-secondary">A+</button>
				</div>
			</div>
			<div class="setting-item">
				<label for="session-timeout-select">Automatic Logout</label>
				<select id="session-timeout-select" class="form-select" style="width: auto;">
					<option value="5">After 5 minutes</option>
					<option value="30" selected>After 30 minutes</option>
					<option value="120">After 2 hours</option>
					<option value="0">Never</option>
				</select>
			</div>
		
			<div class="help-item">
				<button class="help-item-header">Change Password</button>
				<div class="help-item-content">
				  <form id="change-password-form" class="mt-3">
					  <input type="text" value="<?php echo htmlspecialchars($username); ?>" autocomplete="username" class="d-none">
					  
					  <div class="mb-3">
						  <label for="current-password" class="form-label">Current Password</label>
						  <input type="password" id="current-password" class="form-control" required autocomplete="current-password">
					  </div>
					  <div class="mb-3">
						  <label for="new-password" class="form-label">New Password</label>
						  <input type="password" id="new-password" class="form-control" required autocomplete="new-password">
					  </div>
					  <div class="mb-3">
						  <label for="confirm-password" class="form-label">Confirm New Password</label>
						  <input type="password" id="confirm-password" class="form-control" required autocomplete="new-password">
					  </div>
					  <button type="submit" class="btn btn-primary">Update Password</button>
					  <div id="change-password-message" class="mt-3"></div>
				  </form>
				</div>
			</div>
			
			<div class="help-item">
				<button class="help-item-header">Custom Fillers</button>
				<div class="help-item-content">
					<p class="setting-description">Define snippets for the '1' through '5' buttons on the format bar.</p>
					<div class="custom-fillers-grid">
						<input type="text" class="form-control" id="filler-1" data-filler-id="1" placeholder="Filler 1">
						<input type="text" class="form-control" id="filler-2" data-filler-id="2" placeholder="Filler 2">
						<input type="text" class="form-control" id="filler-3" data-filler-id="3" placeholder="Filler 3">
						<input type="text" class="form-control" id="filler-4" data-filler-id="4" placeholder="Filler 4">
						<input type="text" class="form-control" id="filler-5" data-filler-id="5" placeholder="Filler 5">
					</div>
				</div>
			</div>
			
			<div class="help-item">
				<button class="help-item-header">Contact Aliases</button>
				<div class="help-item-content">
					<p class="setting-description">Manage contacts for sharing. Use the alias in a task title, like "@alias".</p>
					<div id="contact-alias-list" class="mb-3">
						</div>
					<div class="d-flex justify-content-between">
						<button id="add-alias-row-btn" class="btn btn-sm btn-outline-secondary">Add Alias</button>
						<button id="save-aliases-btn" class="btn btn-sm btn-primary">Save Contacts</button>
					</div>
					<div id="alias-message" class="mt-3"></div>
				</div>
			</div>
			<div class="help-item">
				<button class="help-item-header">Import / Export</button>
				<div class="help-item-content io-panel">
					<div class="io-section">
						<div class="io-header">
							<label>Export Tasks</label>
							<button class="btn btn-sm btn-outline-primary" id="export-tasks-btn">Export</button>
						</div>
						<div class="form-check form-switch">
							<input class="form-check-input" type="checkbox" role="switch" id="export-include-completed-toggle">
							<label class="form-check-label" for="export-include-completed-toggle">Include completed tasks</label>
						</div>
					</div>
					<hr>
					<div class="io-section">
						<label>Import Tasks</label>
						<button class="btn btn-sm btn-outline-primary" id="import-tasks-btn">Import</button>
					</div>
					<hr>
					<div class="io-section">
						 <div class="io-header">
							<label>Export Journal</label>
							<button class="btn btn-sm btn-outline-primary" id="export-journal-btn">Export</button>
						</div>
						<select id="export-journal-range" class="form-select form-select-sm">
							<option value="all" selected>All time</option>
							<option value="1y">Past year</option>
							<option value="3m">Past 3 months</option>
							<option value="1m">Past month</option>
						</select>
					</div>
					<hr>
					<div class="io-section">
						<label>Import Journal</label>
						<button class="btn btn-sm btn-outline-primary" id="import-journal-btn">Import</button>
					</div>
				</div>
			</div>
		
			<div class="setting-item">
				<label>Help</label>
				<a href="#" data-action="toggle-help">View User Manual</a>
			</div>
		</div>
	
		<div class="side-menu-footer">
			<a href="<?php echo $asset_base_path; ?>logout.php" id="side-menu-logout-btn">
				<span class="logout-icon">&#x23FB;</span> Logout
			</a>
			<div class="support-info">
				<p>Ideas, glitches: <a href="mailto:support@mytsks.com">support@mytsks.com</a></p>
				<p>This mailer is reviewed sporadically.</p>
			</div>
			<div class="version-info">
				<span><?php echo APP_VERSION; ?></span>
			</div>
		</div>
	</div>

	<div id="move-task-modal" class="modal-container hidden">
		<div class="modal-content" style="max-width: 400px;">
			<div class="modal-header">
				<h2 id="move-task-modal-title">Move Task</h2>
				<button class="close-modal-btn" data-target-modal="move-task-modal">&times;</button>
			</div>
			<div class="modal-body" id="move-task-column-list">
			</div>
		</div>
	</div>


	<div id="share-task-modal" class="modal-container hidden">
		 <div class="modal-content" style="max-width: 500px;">
			 <div class="modal-header">
				 <h2 id="share-task-modal-title">Share Task</h2>
				 <button class="close-modal-btn" data-target-modal="share-task-modal">&times;</button>
			 </div>
			 <div class="modal-body">
				 <p class="mb-2"><strong>Currently shared with:</strong></p>
				 <div id="share-recipient-list" class="mb-3">
					 <p class="text-secondary small">Not shared with anyone.</p>
				 </div>
				 <hr>
				 <p class="mb-2"><strong>Add a recipient:</strong></p>
				 <form id="share-add-recipient-form">
					 <div class="input-group">
						 <input type="text" id="share-add-recipient-input" class="form-control" placeholder="Type @alias to add..." autocomplete="off">
						 <button type="submit" class="btn btn-outline-secondary">Add</button>
					 </div>
				 </form>
				 <div id="share-alias-suggestions" class="list-group mt-1"></div>
			 </div>
			 <div class="modal-footer">
				 <button id="share-save-btn" class="btn btn-primary">Done</button>
			 </div>
		 </div>
	 </div>


	<div id="export-modal" class="modal-container hidden">
		<div class="modal-content">
			<div class="modal-header">
				<h2 id="export-modal-title">Export Data</h2>
				<button class="close-modal-btn" data-target-modal="export-modal">&times;</button>
			</div>
			<div class="modal-body">
				<p>Copy the JSON data below.</p>
				<textarea id="export-json-output" class="form-control" rows="15" readonly></textarea>
			</div>
		</div>
	</div>
	
	<div id="import-modal" class="modal-container hidden">
		<div class="modal-content">
			<div class="modal-header">
				<h2 id="import-modal-title">Import Data</h2>
				<button class="close-modal-btn" data-target-modal="import-modal">&times;</button>
			</div>
			<div class="modal-body">
				<p>Paste your JSON data into the text box below.</p>
				<textarea id="import-json-input" class="form-control" rows="15" placeholder="[... Paste JSON here ...]"></textarea>
				<button id="import-confirm-btn" class="btn btn-primary mt-3">Import</button>
				<div id="import-message" class="mt-3"></div>
			</div>
		</div>
	</div>
	
	
	<div id="calendar-settings-modal" class="modal-container hidden">
		<div class="modal-content">
			<div class="modal-header">
				<h2>Manage Calendar Overlays</h2>
				<button class="close-modal-btn" data-target-modal="calendar-settings-modal">&times;</button>
			</div>
			<div class="modal-body">
				<p class="setting-description">Select the calendars you want to see as badges on your Journal view.</p>
				<div id="calendar-list-container" class="mt-3">
					<p>Loading calendars...</p>
				</div>
			</div>
			<div class="modal-footer">
				 <button id="save-calendar-prefs-btn" class="btn btn-primary">Save Preferences</button>
			</div>
		</div>
	</div>

	<div id="main-app-container">
		<header id="app-header" class="container-fluid">
			<div class="header-left">
				<button id="side-menu-toggle-btn" class="btn-icon" title="Menu" style="font-size: 1.8rem; margin-right: 0.5rem; opacity: 1;">&#9776;</button>
				<img src="assets/images/favicon.png" alt="App Logo" id="header-logo">
				<h1 id="app-title" contenteditable="false" title="Double-click to edit">My Journal</h1>
				<div class="view-tabs">
					<button class="view-tab" data-view="tasks" data-pref-key="tasks_tab_title" title="Double-click to edit">My Tasks</button>
					<button class="view-tab active" data-view="journal" data-pref-key="journal_tab_title" title="Double-click to edit">Journal</button>
				</div>
			</div>
			<div class="header-right">
				<div id="desktop-header-options">
					<form id="header-journal-search-form" class="d-none">
						<input type="text" class="form-control" placeholder="Search Journal..." name="term">
						<select class="form-select" name="range">
							<option value="all" selected>All Time</option>
							<option value="7d">Past 7 Days</option>
							<option value="30d">Past 30 Days</option>
							<option value="1y">Past Year</option>
						</select>
						<button type="submit" class="btn btn-primary">Search</button>
					</form>
					<form class="d-none" id="add-item-form">
						<input class="form-control me-2" type="text" id="new-item-name" placeholder="New Column..." maxlength="30" required>
						<button class="btn btn-primary" type="submit" title="Add New Column">+</button>
					</form>
					<div id="journal-nav-group" class="d-flex">
						<button id="today-btn" class="btn btn-secondary ms-2" title="Go to Today">Today</button>
						<input type="date" id="date-jump-input" class="form-control ms-2" title="Jump to Date">
					</div>
				</div>
			
				<button id="mobile-header-toggle-btn" class="btn-icon">&#8942;</button>
			
				<div id="mobile-header-dropdown"></div>
			</div>
		</header>
		<main class="container-fluid">
			<div id="task-board-container" class="d-flex flex-nowrap overflow-auto d-none">
			</div>
			<div id="journal-board-container" class="flex-nowrap overflow-auto">
			</div>
		
			<div id="main-search-results-container" class="d-none">
				<div class="d-flex justify-content-between align-items-center mb-3">
					<h3>Search Results</h3>
					<button id="close-main-search-btn" class="btn btn-outline-secondary">Close Search</button>
				</div>
				<div id="main-search-output"></div>
			</div>
		</main>
	</div>

	<div id="toast-notification"></div>
	
	<div id="editor-mode-container" class="d-none">
		<div id="editor-mode-header">
		<div class="editor-header-row">
			<div id="editor-mode-title-container">
				<span id="editor-mode-date-prefix"></span>
				<h3 id="editor-mode-title-text" contenteditable="false" title="Double-click to edit"></h3>
			</div>
			<div class="editor-mode-actions">
				<button id="editor-mode-print-btn" class="btn btn-outline-secondary">Print</button>
				<button id="editor-mode-close-btn" class="btn btn-outline-secondary">Close</button>
			</div>
		</div>
	</div>

		<div id="editor-ribbon-container">
			<div id="ribbon-nav">
				<button class="ribbon-nav-btn active" data-target="format-panel">Format</button>
				<button class="ribbon-nav-btn" data-target="search-panel">Search</button>
				<button class="ribbon-nav-btn" data-target="add-task-panel">Add Task</button>
				<button class="ribbon-nav-btn" data-target="find-panel">Find & Replace</button>
			</div>
		
			<div id="ribbon-content">
				<div id="format-panel" class="ribbon-panel active">
					<div id="format-panel-main-groups">
						<div class="format-group">
							<button class="format-btn" title="Insert Star" data-insert="⭐">⭐</button>
							<button class="format-btn" title="Insert Idea" data-insert="💡">💡</button>
							<button class="format-btn" title="Insert Fire" data-insert="🔥">🔥</button>
							<button class="format-btn" title="Insert Target" data-insert="🎯">🎯</button>
							<button class="format-btn" title="Insert Warning" data-insert="⚠️">⚠️</button>
						</div>
						<div class="format-group">
							<button class="format-btn" title="Bulleted List (Circle)" data-list-style="⊙">⊙</button>
							<button class="format-btn" title="Numbered List" data-list-style="1.">1.</button>
							<button class="format-btn" title="Remove List Formatting" data-list-style="remove">🧹</button>
						</div>
						<div class="format-group">
							<button class="format-btn" title="UPPERCASE" data-case="upper">AA</button>
							<button class="format-btn" title="Title Case" data-case="title">Aa</button>
							<button class="format-btn" title="lowercase" data-case="lower">aa</button>
						</div>
						<div class="format-group">
							<button class="format-btn" title="Calculate Expression" data-action="calculate">🧮</button>
							<button class="format-btn" title="Underline Selected Text" data-action="underline">U̲</button>
							<button class="format-btn" title="Frame (Single Line)" data-action="frame-single">[]</button>
							<button class="format-btn" title="Frame (Double Line)" data-action="frame-double">[[]]</button>
							<button class="format-btn" title="Clean Up Text" data-action="cleanup">✨</button>
						</div>
						<div class="format-group">
							<button class="format-btn" title="Insert Timestamp" data-action="timestamp">📅</button>
							<button class="format-btn" title="Insert Horizontal Rule" data-action="horizontal-rule">—</button>
						</div>
						<div class="format-group">
							<button class="format-btn" title="Decrease Editor Font Size" data-action="editor-font-decrease">A-</button>
							<button class="format-btn" title="Increase Editor Font Size" data-action="editor-font-increase">A+</button>
						</div>
						<div class="format-group format-group-fillers">
							<button class="format-btn" title="Custom Filler 1" data-filler="1">1</button>
							<button class="format-btn" title="Custom Filler 2" data-filler="2">2</button>
							<button class="format-btn" title="Custom Filler 3" data-filler="3">3</button>
							<button class="format-btn" title="Custom Filler 4" data-filler="4">4</button>
							<button class="format-btn" title="Custom Filler 5" data-filler="5">5</button>
						</div>
					</div>
					<div id="format-panel-right-aligned">
						<button id="format-bar-more-btn" class="btn-icon">⋮</button>
						<div id="format-bar-dropdown"></div>
					</div>
				</div>
				
				<div id="search-panel" class="ribbon-panel">
					<form id="journal-search-form">
						<input type="text" class="form-control" id="journal-search-term" placeholder="Search entries in editor..." style="flex-grow: 1;">
						<select class="form-select" id="journal-search-range">
							<option value="all" selected>All Time</option>
							<option value="1y">Past Year</option>
							<option value="30d">Past 30 Days</option>
							<option value="7d">Past 7 Days</option>
						</select>
						<button type="submit" class="btn btn-primary">Find</button>
						<button type="button" class="btn btn-outline-secondary" id="back-to-editor-btn">Back to Editor</button>
					</form>
				</div>

				<div id="add-task-panel" class="ribbon-panel">
					<form id="editor-add-task-form">
						<input type="text" class="form-control" id="editor-new-task-title" placeholder="New task title..." style="flex-grow: 1;" required>
						<select class="form-select" id="editor-task-column-select" required></select>
						<div class="form-check form-switch d-flex align-items-center" title="Mark as priority">
							<input class="form-check-input" type="checkbox" role="switch" id="editor-task-priority-check">
							<label class="form-check-label ms-2" for="editor-task-priority-check">Priority</label>
						</div>
						<button class="btn btn-primary" type="submit">Create Task</button>
					</form>
				</div>

				<div id="find-panel" class="ribbon-panel">
					<form id="find-replace-form" class="w-100" onsubmit="return false;">
						<input type="text" id="find-term-input" class="form-control" placeholder="Find">
						<span id="find-counter" class="btn">0 / 0</span>
						<button type="button" id="find-prev-btn" class="btn btn-secondary">&lt;</button>
						<button type="button" id="find-next-btn" class="btn btn-secondary">&gt;</button>
						<input type="text" id="replace-term-input" class="form-control ms-3" placeholder="Replace with">
						<button type="button" id="replace-btn" class="btn btn-secondary">Replace</button>
						<button type="button" id="replace-all-btn" class="btn btn-secondary">Replace All</button>
						<div class="form-check d-flex align-items-center ms-3">
							<input class="form-check-input" type="checkbox" id="find-match-case-check">
							<label class="form-check-label ms-2" for="find-match-case-check">Match Case</label>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div id="editor-content-wrapper">
	<textarea id="editor-mode-editor" class="form-control"></textarea>
	<div id="journal-search-results-container" class="d-none"></div>

	<div id="editor-info-bar">
		<div class="info-bar-left">
			<span>Chars: <span id="char-counter">0</span></span>
			<span>Words: <span id="word-counter">0</span></span>
			<span>Lines: <span id="line-counter">0</span></span>
		</div>
		<div class="info-bar-right">
			<span id="editor-last-updated"></span>
			<span id="editor-auto-save-status"></span>
		</div>
	</div>
	</div>
		
		
	</div>

   <footer id="app-footer">
	   <div class="footer-left">
		   <span id="footer-date"></span>
	   </div>
	   <div class="footer-center">
		   <button class="btn-footer" id="toggle-private-columns-btn" title="Show/Hide Private Columns">🙈</button>
		   <div id="task-filters" class="d-flex d-none">
			   <span class="footer-divider">|&nbsp;</span>
			   <button class="btn-footer" id="filter-mine-btn" title="Show/Hide Mine">🙋‍♂️</button>
			   <button class="btn-footer" id="filter-assigned-btn" title="Show/Hide Delegated">👉</button>
			   <button class="btn-footer" id="filter-priority-btn" title="Show High Priority">⭐️</button>
			   <button class="btn-footer" id="filter-completed-btn" title="Show/Hide Complete">✅</button>
		   </div>
		   <div id="journal-filters" class="d-flex">
			   <span class="footer-divider">|</span>
			   <div class="btn-group view-count-controls" role="group">
				   <button type="button" class="btn-footer" data-count="1">1</button>
				   <button type="button" class="btn-footer active" data-count="3">3</button>
				   <button type="button" class="btn-footer" data-count="5">5</button>
			   </div>
			   <button class="btn-footer" id="day-wrap-up-btn" title="Create Day Wrap-up">Wrap-up</button>
		   </div>
	   </div>
	   <div class="footer-right">
		   <span id="username-display">[ <?php echo htmlspecialchars($username); ?> ]</span>
	   </div>
   </footer>

	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>
	<script src="<?php echo $asset_base_path; ?>assets/js/app.js"></script>
</body>
</html>
~~~
*END FULL CODE FOR FILE: index.php* 


## config.php
*START FULL CODE FOR FILE: 	/includes/config.php*
~~~ 
<?php
/**
 * Main Configuration File for the Task & Journal Application
 *
 * This file contains the database connection credentials, SMTP settings for email,
 * and other core application settings.
 */

// -- CORE PATHS --
// Defines the absolute path to the project root. Ends with a slash.
// This makes file includes much more reliable.
define('BASE_PATH', dirname(__DIR__) . '/');

// -- DATABASE CREDENTIALS --
define('DB_HOST', 'localhost');
define('DB_NAME', 'u258668246_mdh');
define('DB_USER', 'u258668246_dba');
define('DB_PASS', 'F1123581321i');    

// -- ENVIRONMENT & VERSION --
// Set DEV_MODE to 'true' to show the "MAINTENANCE IN PROGRESS" banner.
define('DEV_MODE', false); 
// Set DEBUG_MODE to 'true' to enable JavaScript console.log messages.
define('DEBUG_MODE', false);
define('APP_VERSION', 'Version 3.2.4 Beta DEV'); 

// -- SMTP EMAIL SETTINGS --
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_USERNAME', 'support@mydayhub.com');
define('SMTP_PASSWORD', 'F1123581321i@');
define('SMTP_PORT', 587);
define('SMTP_FROM_EMAIL', 'support@mydayhub.com');
define('SMTP_FROM_NAME', 'MyDayHub');

// -- APPLICATION SETTINGS --
// MODIFIED: Added /dev to the URL for the development environment.
define('APP_URL', 'https://mydayhub.com'); 
define('SESSION_SECRET_KEY', 'generate_a_long_random_string_for_this');

?>
~~~
*<END FULL CODE FOR FILE: 	/includes/config.php>*

## db.php
*START FULL CODE FOR FILE: 	/includes/db.php*
~~~ 		
<?php
/**
 * Database Connection File
 *
 * This script establishes a connection to the database using PDO.
 * It is included by any script that needs to interact with the database.
 */

// Include the configuration file which contains our credentials.
// Using require_once ensures it's included only once and will halt execution if the file is missing.
require_once __DIR__ . '/config.php';

// Set up the DSN (Data Source Name) for the PDO connection.
// We specify the database type (mysql), host, database name, and charset.
// Using utf8mb4 is important for full Unicode support (including emojis).
$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";

// Set PDO options for how the connection should behave.
$options = [
	// Throw an exception when a database error occurs, which we can catch.
	PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
	// Fetch results as associative arrays (e.g., $row['column_name']).
	PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
	// Disable emulation of prepared statements for security. This uses real prepared statements.
	PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
	// Attempt to create a new PDO instance (i.e., connect to the database).
	$pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
	// If the connection fails, catch the exception.
	// In a production environment, you would log this error to a file and show a generic user-friendly message.
	// For development, we can show the error message to help with debugging.
	http_response_code(500); // Internal Server Error
	die("Database connection failed: " . $e->getMessage());
}

// If the script reaches this point, the $pdo variable holds our successful database connection object.
// Other files that include this script can now use the $pdo variable to execute queries.

?>
~~~
*<END FULL CODE FOR FILE: 	/includes/db.php>*

## mailer.php
*START FULL CODE FOR FILE: 	/includes/mailer.php*
~~~ 		
<?php
// /includes/mailer.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once dirname(__DIR__) . '/vendor/autoload.php';

/**
 * Sends an email using the SMTP settings defined in config.php.
 *
 * @param string $to The recipient's email address.
 * @param string $subject The subject of the email.
 * @param string $body The HTML body content of the email.
 * @return bool True on success, false on failure.
 */
function send_email($to, $subject, $body) {
	$mail = new PHPMailer(true);

	try {
		// --- Server Settings ---
		
		// NEW: Conditional Debugging Logic
		// If DEBUG_MODE is true in config.php, log the detailed server conversation.
		if (defined('DEBUG_MODE') && DEBUG_MODE) {
			$mail->SMTPDebug = 2; // Enable verbose debug output
			$log_path = BASE_PATH . 'debug.log'; // Log file in the project root
			
			// Capture the debug output and write it to our log file
			$mail->Debugoutput = function($str, $level) use ($log_path) {
				file_put_contents($log_path, date('Y-m-d H:i:s') . "\t" . $str, FILE_APPEND);
			};
		} else {
			$mail->SMTPDebug = 0; // Disable debug output for production
		}

		$mail->isSMTP();
		$mail->Host = SMTP_HOST;
		$mail->SMTPAuth = true;
		$mail->Username = SMTP_USERNAME;
		$mail->Password = SMTP_PASSWORD;
		$mail->SMTPSecure = 'tls';
		$mail->Port = SMTP_PORT;

		// -- Recipients --
		$mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
		$mail->addAddress($to);

		// -- Content --
		$mail->isHTML(true);
		$mail->Subject = $subject;
		$mail->Body    = $body;
		$mail->AltBody = strip_tags($body);

		$mail->send();
		return true;

	} catch (Exception $e) {
		// Enhanced error logging
		$error_message = "Mailer Error: {$mail->ErrorInfo}" . PHP_EOL;
		// Always log to the server's main error log
		error_log($error_message); 
		// Also log to our debug file if debugging is enabled
		if (defined('DEBUG_MODE') && DEBUG_MODE) {
			file_put_contents(BASE_PATH . 'debug.log', date('Y-m-d H:i:s') . "\t" . $error_message, FILE_APPEND);
		}
		return false;
	}
}
?>
~~~
*<END FULL CODE FOR FILE: 	/includes/mailer.php>*

## session.php
*START FULL CODE FOR FILE: 	/includes/session.php*
~~~ 		
<?php
// /includes/session.php

/**
 * This file is responsible for starting and managing user sessions securely.
 * It should be included at the top of any PHP script that requires user authentication.
 */

// Start the session only if one does not already exist.
if (session_status() === PHP_SESSION_NONE) {
	// Set session cookie parameters for enhanced security.
	session_set_cookie_params([
		'lifetime' => 86400, // Session lasts for 24 hours
		'path' => '/',     // Available across the entire domain
		'domain' => '',    // Set your domain name here if you have subdomains
		'secure' => isset($_SERVER['HTTPS']), // Send cookie only over HTTPS
		'httponly' => true, // Prevent client-side script access to the cookie
		'samesite' => 'Lax' // Provides some protection against CSRF attacks
	]);

	// Start the session.
	session_start();
}

// There should be no other code or output in this file.
?>
~~~
*<END FULL CODE FOR FILE: 	/includes/session.php>*

## auth.php
*START FULL CODE FOR FILE: 	/api/auth.php*
~~~
<?php
// /api/auth.php

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';
require_once BASE_PATH . 'includes/mailer.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'register') {
	if (empty($input['username']) || empty($input['email']) || empty($input['password'])) {
		echo json_encode(['success' => false, 'message' => 'Please fill in all fields.']);
		exit;
	}
	$username = $input['username'];
	$email = $input['email'];
	$password = $input['password'];
	$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
	$stmt->execute([$username, $email]);
	if ($stmt->fetch()) {
		echo json_encode(['success' => false, 'message' => 'Username or email already exists.']);
		exit;
	}
	try {
		$verification_token = bin2hex(random_bytes(32));
		$password_hash = password_hash($password, PASSWORD_DEFAULT);
		
		// MODIFIED: Removed encryption_key from the INSERT statement
		$stmt = $pdo->prepare(
			"INSERT INTO users (username, email, password_hash, email_verification_token) VALUES (?, ?, ?, ?)"
		);
		// MODIFIED: Removed the plaintext $password from the execution
		$stmt->execute([$username, $email, $password_hash, $verification_token]);

		$verification_link = APP_URL . "/verify.php?token=" . $verification_token;
		$subject = "Verify Your Account - Tasks & Journal";
		$body = "<h2>Welcome!</h2><p>Click the link to verify your account: <a href='{$verification_link}'>{$verification_link}</a></p>";
		$email_sent = send_email($email, $subject, $body);
		if ($email_sent) {
			echo json_encode(['success' => true, 'message' => 'Registration successful! Please check your email to verify your account.']);
		} else {
			echo json_encode(['success' => false, 'message' => 'Registration successful, but we could not send a verification email.']);
		}
	} catch (Exception $e) {
		error_log($e->getMessage());
		echo json_encode(['success' => false, 'message' => 'An error occurred during registration.']);
	}
	exit;
}

if ($action === 'login') {
	if (empty($input['username']) || empty($input['password'])) {
		echo json_encode(['success' => false, 'message' => 'Please enter username and password.']);
		exit;
	}
	$username = $input['username'];
	$password = $input['password'];
	$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
	$stmt->execute([$username]);
	$user = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($user && password_verify($password, $user['password_hash'])) {
		if ($user['is_email_verified'] == 0) {
			echo json_encode(['success' => false, 'message' => 'Your account is not verified. Please check your email.']);
			exit;
		}

		if (empty($user['public_key'])) {
			$config = [
				"digest_alg" => "sha512",
				"private_key_bits" => 2048,
				"private_key_type" => OPENSSL_KEYTYPE_RSA,
			];
			$res = openssl_pkey_new($config);
			openssl_pkey_export($res, $private_key);
			$public_key_details = openssl_pkey_get_details($res);
			$public_key = $public_key_details["key"];
			$iv = openssl_random_pseudo_bytes(16);
			$encrypted_private_key = openssl_encrypt($private_key, 'aes-256-cbc', $password, OPENSSL_RAW_DATA, $iv);
			$payload_to_store = base64_encode($iv . $encrypted_private_key);
			$stmt_update = $pdo->prepare("UPDATE users SET public_key = ?, encrypted_private_key = ? WHERE user_id = ?");
			$stmt_update->execute([$public_key, $payload_to_store, $user['user_id']]);
		}

		$_SESSION['user_id'] = $user['user_id'];
		$_SESSION['username'] = $user['username'];
		// MODIFIED: Removed the insecure line that set the encryption key in the session from the database
		echo json_encode(['success' => true, 'message' => 'Login successful!']);

	} else {
		echo json_encode(['success' => false, 'message' => 'Invalid credentials.']);
	}
	exit;
}

if ($action === 'change_password') {
	// This action remains unchanged as it did not use the encryption_key column
	if (!isset($_SESSION['user_id'])) {
		echo json_encode(['success' => false, 'message' => 'Authentication required.']);
		exit;
	}
	if (empty($input['currentPassword'])) {
		echo json_encode(['success' => false, 'message' => 'Please provide your current password.']);
		exit;
	}
	$currentPassword = $input['currentPassword'];
	$user_id = $_SESSION['user_id'];
	$stmt = $pdo->prepare("SELECT password_hash FROM users WHERE user_id = ?");
	$stmt->execute([$user_id]);
	$user = $stmt->fetch();
	if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
		echo json_encode(['success' => false, 'message' => 'Incorrect current password.']);
		exit;
	}
	try {
		$stmt_tasks = $pdo->prepare("SELECT task_id, encrypted_data FROM tasks t JOIN columns c ON t.column_id = c.column_id WHERE c.owner_id = ?");
		$stmt_tasks->execute([$user_id]);
		$tasks = $stmt_tasks->fetchAll(PDO::FETCH_ASSOC);
		$stmt_journal = $pdo->prepare("SELECT entry_id, encrypted_data FROM journal_entries WHERE user_id = ?");
		$stmt_journal->execute([$user_id]);
		$journal_entries = $stmt_journal->fetchAll(PDO::FETCH_ASSOC);
		echo json_encode([
			'success' => true,
			'message' => 'Password verified. Data ready for re-encryption.',
			'data' => ['tasks' => $tasks, 'journal_entries' => $journal_entries]
		]);
	} catch (Exception $e) {
		http_response_code(500);
		echo json_encode(['success' => false, 'message' => 'Failed to fetch user data for re-encryption.']);
	}
	exit;
}

if ($action === 're_encrypt_and_update') {
	if (!isset($_SESSION['user_id'])) {
		http_response_code(401);
		echo json_encode(['success' => false, 'message' => 'Authentication required.']);
		exit;
	}
	if (!isset($input['newPassword']) || !isset($input['tasks']) || !isset($input['journal_entries'])) {
		http_response_code(400);
		echo json_encode(['success' => false, 'message' => 'Invalid payload.']);
		exit;
	}
	$user_id = $_SESSION['user_id'];
	$newPassword = $input['newPassword'];
	$tasks = $input['tasks'];
	$journal_entries = $input['journal_entries'];
	try {
		$pdo->beginTransaction();
		$stmt_tasks = $pdo->prepare("UPDATE tasks SET encrypted_data = ? WHERE task_id = ?");
		foreach ($tasks as $task) {
			$stmt_tasks->execute([$task['encrypted_data'], $task['task_id']]);
		}
		$stmt_journal = $pdo->prepare("UPDATE journal_entries SET encrypted_data = ? WHERE entry_id = ? AND user_id = ?");
		foreach ($journal_entries as $entry) {
			$stmt_journal->execute([$entry['encrypted_data'], $entry['entry_id'], $user_id]);
		}
		$new_password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
		
		// MODIFIED: Removed encryption_key from the UPDATE statement
		$stmt_user = $pdo->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
		$stmt_user->execute([$new_password_hash, $user_id]);

		$pdo->commit();

		// MODIFIED: Removed insecure session key update
		echo json_encode(['success' => true, 'message' => 'Password and data successfully updated.']);
	} catch (Exception $e) {
		$pdo->rollBack();
		http_response_code(500);
		error_log("Re-encryption failed: " . $e->getMessage());
		echo json_encode(['success' => false, 'message' => 'A critical error occurred while updating data. All changes have been reversed.']);
	}
	exit;
}

if ($action === 'forgot_password') {
	// This action remains unchanged as it did not use the encryption_key column
	if (empty($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
		echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
		exit;
	}
	$email = $input['email'];
	$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
	$stmt->execute([$email]);
	$user = $stmt->fetch();
	$success_message = 'If an account with that email exists, a password reset link has been sent.';
	if ($user) {
		try {
			$token = bin2hex(random_bytes(32));
			$expiry_time = date('Y-m-d H:i:s', time() + 3600);
			$stmt = $pdo->prepare("UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE user_id = ?");
			$stmt->execute([$token, $expiry_time, $user['user_id']]);
			$reset_link = APP_URL . "/reset-password.php?token=" . $token;
			$subject = "Password Reset Request - Tasks & Journal";
			$body = "<p>You requested a password reset. Click the link below to set a new password. This link is valid for 1 hour.</p><p><a href='{$reset_link}'>{$reset_link}</a></p>";
			send_email($email, $subject, $body);
		} catch (Exception $e) {
			error_log("Forgot password error: " . $e->getMessage());
		}
	}
	echo json_encode(['success' => true, 'message' => $success_message]);
	exit;
}

if ($action === 'reset_password') {
	if (empty($input['token']) || empty($input['newPassword'])) {
		echo json_encode(['success' => false, 'message' => 'Token and new password are required.']);
		exit;
	}
	
	$token = $input['token'];
	$newPassword = $input['newPassword'];

	$stmt = $pdo->prepare("SELECT user_id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()");
	$stmt->execute([$token]);
	$user = $stmt->fetch();

	if ($user) {
		$user_id = $user['user_id'];
		$new_password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
		
		// MODIFIED: Removed encryption_key from the UPDATE statement
		$stmt_update = $pdo->prepare(
			"UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE user_id = ?"
		);
		
		// MODIFIED: Removed the plaintext newPassword from the execution
		if ($stmt_update->execute([$new_password_hash, $user_id])) {
			echo json_encode(['success' => true, 'message' => 'Your password has been reset successfully. You can now log in.']);
		} else {
			echo json_encode(['success' => false, 'message' => 'Failed to update password.']);
		}
	} else {
		echo json_encode(['success' => false, 'message' => 'This password reset link is invalid or has expired.']);
	}
	exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid API action.']);
?>
~~~
*END FULL CODE FOR FILE: 	/api/auth.php*
		
## calendar_events.php
*START FULL CODE FOR FILE: 	/api/calendar_events.php*
~~~
<?php
// /api/calendar_events.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['error' => 'User not authenticated.']);
	exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
	try {
		// MODIFIED: Removed the "WHERE user_id = ?" clause to make all calendar events global.
		$stmt = $pdo->prepare("SELECT * FROM `calendar_events` ORDER BY start_date ASC");
		$stmt->execute(); // No user ID parameter is needed now.
		$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
		echo json_encode($events);
	} catch (PDOException $e) {
		http_response_code(500);
		echo json_encode(['error' => 'Database query failed.', 'details' => $e->getMessage()]);
	}
} else {
	http_response_code(405);
	echo json_encode(['error' => 'Method not allowed.']);
}

?>
~~~
*END FULL CODE FOR FILE: 	/api/calendar_events.php*

## calendars.php
*START FULL CODE FOR FILE: 	/api/calendars.php*
~~~
<?php
// /api/calendars.php

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

// Ensure user is authenticated
if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['error' => 'User not authenticated.']);
	exit;
}

// NOTE: We still require a user to be logged in to see the list,
// but the list itself is now global.
$user_id = $_SESSION['user_id']; 
header('Content-Type: application/json');

try {
	// MODIFIED: This query now selects all unique 'event_type' values from the entire table,
	// making the list of available calendars global to all users.
	$stmt = $pdo->prepare(
		"SELECT DISTINCT event_type 
		 FROM calendar_events 
		 WHERE event_type IS NOT NULL AND event_type != ''
		 ORDER BY event_type ASC"
	);
	// The execute call is now empty as there are no parameters to bind.
	$stmt->execute();

	// Fetch the results as a simple array of strings, e.g., ["cisco", "fiscal", "holidays"]
	$calendar_types = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

	echo json_encode($calendar_types);

} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['error' => 'An internal server error occurred.', 'details' => $e->getMessage()]);
}
?>
~~~
*END FULL CODE FOR FILE: 	/api/calendars.php*


## columns.php
*START FULL CODE FOR FILE: 	/api/columns.php*
~~~
<?php
ob_start(); // Start output buffering

// /api/columns.php

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

// Ensure user is authenticated
if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['error' => 'User not authenticated.']);
	exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

header('Content-Type: application/json');

try {
	switch ($method) {
		case 'GET':
		// Fetch all columns for the current user, ordered by their position
		$stmt = $pdo->prepare("SELECT * FROM columns WHERE owner_id = ? ORDER BY position_order ASC");
		$stmt->execute([$user_id]);
		
		ob_clean(); // NEW: Clear any accidental output from the buffer
		echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
		break;

		case 'POST':
			$input = json_decode(file_get_contents('php://input'), true);
			if (empty($input['column_name'])) {
				http_response_code(400);
				echo json_encode(['error' => 'Column name is required.']);
				exit;
			}

			// Get the next position for the new column
			$posStmt = $pdo->prepare("SELECT COUNT(*) FROM columns WHERE owner_id = ?");
			$posStmt->execute([$user_id]);
			$position = $posStmt->fetchColumn();

			$stmt = $pdo->prepare("INSERT INTO columns (owner_id, column_name, position_order) VALUES (?, ?, ?)");
			$stmt->execute([$user_id, $input['column_name'], $position]);
			
			http_response_code(201);
			echo json_encode(['success' => true, 'column_id' => $pdo->lastInsertId()]);
			break;

		case 'PUT':
			$input = json_decode(file_get_contents('php://input'), true);
			
			// Handle re-ordering of all columns
			if (isset($input['ordered_columns']) && is_array($input['ordered_columns'])) {
				$pdo->beginTransaction();
				$stmt = $pdo->prepare("UPDATE columns SET position_order = ? WHERE column_id = ? AND owner_id = ?");
				foreach ($input['ordered_columns'] as $index => $columnId) {
					$stmt->execute([$index, $columnId, $user_id]);
				}
				$pdo->commit();
				echo json_encode(['success' => true, 'message' => 'Column order updated.']);
			
			// Handle updating a single column's properties (name or privacy)
			} elseif (isset($input['column_id'])) {
				$columnId = $input['column_id'];
				
				// Update column name
				if (isset($input['column_name'])) {
					$stmt = $pdo->prepare("UPDATE columns SET column_name = ? WHERE column_id = ? AND owner_id = ?");
					$stmt->execute([$input['column_name'], $columnId, $user_id]);
				}
				
				// Update privacy status
				if (isset($input['is_private'])) {
					$is_private = $input['is_private'] ? 1 : 0;
					$stmt = $pdo->prepare("UPDATE columns SET is_private = ? WHERE column_id = ? AND owner_id = ?");
					$stmt->execute([$is_private, $columnId, $user_id]);
				}
				echo json_encode(['success' => true, 'message' => 'Column updated successfully.']);

			} else {
				http_response_code(400);
				echo json_encode(['error' => 'Invalid payload for PUT request.']);
			}
			break;

		case 'DELETE':
			if (!isset($_GET['column_id'])) {
				http_response_code(400);
				echo json_encode(['error' => 'Column ID is required.']);
				exit;
			}
			$column_id = $_GET['column_id'];

			// NOTE: The database should have ON DELETE CASCADE set for the foreign key 
			// in the 'tasks' table to automatically delete tasks in the deleted column.
			$stmt = $pdo->prepare("DELETE FROM columns WHERE column_id = ? AND owner_id = ?");
			$stmt->execute([$column_id, $user_id]);

			if ($stmt->rowCount() > 0) {
				echo json_encode(['success' => true, 'message' => 'Column deleted successfully.']);
			} else {
				http_response_code(404);
				echo json_encode(['error' => 'Column not found or user not authorized.']);
			}
			break;

		default:
			http_response_code(405);
			echo json_encode(['error' => 'Method not allowed.']);
			break;
	}
} catch (Exception $e) {
	if ($pdo->inTransaction()) {
		$pdo->rollBack();
	}
	http_response_code(500);
	echo json_encode(['error' => 'An internal server error occurred.', 'details' => $e->getMessage()]);
}
?>
~~~
*END FULL CODE FOR FILE: 	/api/columns.php*

## get_shares.php
*START FULL CODE FOR FILE: 	/api/get_shares.php*
~~~
<?php
// /api/get_shares.php

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

header('Content-Type: application/json');

// 1. Authenticate the user
if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['success' => false, 'message' => 'User not authenticated.']);
	exit;
}
$userId = $_SESSION['user_id'];

// 2. Validate the input
if (!isset($_GET['task_id'])) {
	http_response_code(400);
	echo json_encode(['success' => false, 'message' => 'Task ID is required.']);
	exit;
}
$taskId = $_GET['task_id'];

try {
	// 3. Security Check: Verify the current user is the owner of the task.
	$stmt_owner_check = $pdo->prepare(
		"SELECT c.owner_id FROM tasks t JOIN `columns` c ON t.column_id = c.column_id WHERE t.task_id = ? AND c.owner_id = ?"
	);
	$stmt_owner_check->execute([$taskId, $userId]);
	if (!$stmt_owner_check->fetch()) {
		http_response_code(403);
		echo json_encode(['success' => false, 'message' => 'Permission denied. Only the task owner can view shares.']);
		exit;
	}

	// 4. Fetch the list of users the task is shared with
	$stmt = $pdo->prepare(
		"SELECT u.user_id, u.username, u.email FROM task_shares ts JOIN users u ON ts.shared_with_user_id = u.user_id WHERE ts.task_id = ?"
	);
	$stmt->execute([$taskId]);
	$recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);

	echo json_encode(['success' => true, 'recipients' => $recipients]);

} catch (PDOException $e) {
	http_response_code(500);
	error_log('Get shares error: ' . $e->getMessage());
	echo json_encode(['success' => false, 'message' => 'An internal server error occurred.']);
}
?>
~~~
*END FULL CODE FOR FILE: 	/api/get_shares.php*

## import.php
*START FULL CODE FOR FILE: 	/api/import.php*
~~~
<?php
// /api/import.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['success' => false, 'message' => 'User not authenticated.']);
	exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
	http_response_code(405);
	echo json_encode(['success' => false, 'message' => 'Method not allowed. Only POST is accepted.']);
	exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Handle Task Imports
if (isset($input['tasks']) && is_array($input['tasks'])) {
	if (!isset($input['action'])) {
		http_response_code(400);
		echo json_encode(['success' => false, 'message' => 'Invalid payload. Task imports require an "action".']);
		exit;
	}
	
	$tasksToImport = $input['tasks'];
	$action = $input['action'];
	$placeholderColumnName = 'Imported Tasks';
	$placeholderColumnId = null;

	try {
		$pdo->beginTransaction();
		$stmt = $pdo->prepare("SELECT column_name, column_id FROM `columns` WHERE owner_id = ?");
		$stmt->execute([$userId]);
		$existingColumns = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
		
		$columnLookup = [];
		foreach ($existingColumns as $name => $id) {
			$columnLookup[strtolower($name)] = $id;
		}

		foreach ($tasksToImport as $task) {
			// MODIFIED: We now expect pre-encrypted data
			if (empty($task['encryptedData']) || empty($task['columnName'])) continue;

			$targetColumnName = $task['columnName'];
			$targetColumnId = null;
			$lowerTargetColumnName = strtolower($targetColumnName);

			if (isset($columnLookup[$lowerTargetColumnName])) {
				$targetColumnId = $columnLookup[$lowerTargetColumnName];
			} else {
				if ($action === 'create') {
					$colPosStmt = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE owner_id = ?");
					$colPosStmt->execute([$userId]);
					$colPosition = (int) $colPosStmt->fetchColumn();
					$stmt = $pdo->prepare("INSERT INTO `columns` (owner_id, column_name, position_order) VALUES (?, ?, ?)");
					$stmt->execute([$userId, $targetColumnName, $colPosition]);
					$newColumnId = $pdo->lastInsertId();
					$columnLookup[$lowerTargetColumnName] = $newColumnId;
					$targetColumnId = $newColumnId;
				} else { 
					if ($placeholderColumnId === null) {
						if (isset($columnLookup[strtolower($placeholderColumnName)])) {
							$placeholderColumnId = $columnLookup[strtolower($placeholderColumnName)];
						} else {
							$colPosStmt = $pdo->prepare("SELECT COUNT(*) FROM `columns` WHERE owner_id = ?");
							$colPosStmt->execute([$userId]);
							$colPosition = (int) $colPosStmt->fetchColumn();
							$stmt = $pdo->prepare("INSERT INTO `columns` (owner_id, column_name, position_order) VALUES (?, ?, ?)");
							$stmt->execute([$userId, $placeholderColumnName, $colPosition]);
							$newColumnId = $pdo->lastInsertId();
							$columnLookup[strtolower($placeholderColumnName)] = $newColumnId;
							$placeholderColumnId = $newColumnId;
						}
					}
					$targetColumnId = $placeholderColumnId;
				}
			}
			
			// Get the already-encrypted data from the payload
			$encryptedData = $task['encryptedData'];
			$status = ($task['isPriority'] ?? false) ? 2 : 1;
			$dueDate = !empty($task['dueDate']) ? $task['dueDate'] : null;

			$posStmt = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE column_id = ?");
			$posStmt->execute([$targetColumnId]);
			$position = (int) $posStmt->fetchColumn();

			$stmt = $pdo->prepare("INSERT INTO `tasks` (column_id, encrypted_data, status, due_date, position, delegated_to) VALUES (?, ?, ?, ?, ?, ?)");
			$stmt->execute([$targetColumnId, $encryptedData, $status, $dueDate, $position, '']);
		}
		$pdo->commit();
		echo json_encode(['success' => true, 'message' => 'Tasks imported successfully.']);

	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		http_response_code(500);
		echo json_encode(['success' => false, 'message' => 'An error occurred during the task import process.', 'details' => $e->getMessage()]);
	}

// Handle Journal Imports
} elseif (isset($input['journal']) && is_array($input['journal'])) {
	$entriesToImport = $input['journal'];
	try {
		$pdo->beginTransaction();
		foreach($entriesToImport as $entry) {
			// MODIFIED: We now expect pre-encrypted data
			if (empty($entry['encryptedData']) || empty($entry['date'])) continue;
			
			$encryptedData = $entry['encryptedData'];
			$isPrivate = ($entry['isPrivate'] ?? false) ? 1 : 0;

			$posStmt = $pdo->prepare("SELECT COUNT(*) FROM journal_entries WHERE user_id = ? AND entry_date = ?");
			$posStmt->execute([$userId, $entry['date']]);
			$position = (int) $posStmt->fetchColumn();

			$stmt = $pdo->prepare("INSERT INTO journal_entries (user_id, entry_date, encrypted_data, is_private, position_order) VALUES (?, ?, ?, ?, ?)");
			$stmt->execute([$userId, $entry['date'], $encryptedData, $isPrivate, $position]);
		}
		$pdo->commit();
		echo json_encode(['success' => true, 'message' => 'Journal entries imported successfully.']);
	} catch (Exception $e) {
		if ($pdo->inTransaction()) $pdo->rollBack();
		http_response_code(500);
		echo json_encode(['success' => false, 'message' => 'An error occurred during the journal import process.', 'details' => $e->getMessage()]);
	}
} else {
	http_response_code(400);
	echo json_encode(['success' => false, 'message' => 'Invalid payload. Request must contain a "tasks" or "journal" array.']);
}
?>
~~~
*END FULL CODE FOR FILE: 	/api/import.php*

## journal.php
*START FULL CODE FOR FILE: 	/api/journal.php*
~~~
<?php
// /api/journal.php

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

// Ensure user is authenticated
if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['error' => 'User not authenticated.']);
	exit;
}

$user_id = $_SESSION['user_id'];

header('Content-Type: application/json');

// --- LOGIC TO HANDLE JOURNAL EXPORT REQUESTS ---
if (isset($_GET['export']) && $_GET['export'] == 'true') {
	try {
		$range = $_GET['range'] ?? 'all';
		$sql = "SELECT * FROM journal_entries WHERE user_id = ?";
		
		switch ($range) {
			case '1y':
				$sql .= " AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
				break;
			case '3m':
				$sql .= " AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)";
				break;
			case '1m':
				$sql .= " AND entry_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
				break;
		}

		$sql .= " ORDER BY entry_date DESC, position_order ASC";

		$stmt = $pdo->prepare($sql);
		$stmt->execute([$user_id]);
		$entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

		echo json_encode($entries);

	} catch (PDOException $e) {
		http_response_code(500);
		echo json_encode(['success' => false, 'message' => 'Export query failed.', 'details' => $e->getMessage()]);
	}
	// Stop the script here to prevent regular GET logic from running
	exit;
}
// --- END OF EXPORT LOGIC ---

$method = $_SERVER['REQUEST_METHOD'];

// Handle regular API requests based on the HTTP method
try {
	switch ($method) {
		case 'GET':
			handleGet($pdo, $user_id);
			break;
		case 'POST':
			handlePost($pdo, $user_id);
			break;
		case 'PUT':
			handlePut($pdo, $user_id);
			break;
		case 'DELETE':
			handleDelete($pdo, $user_id);
			break;
		default:
			http_response_code(405);
			echo json_encode(['error' => 'Method not allowed.']);
			break;
	}
} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['error' => 'An internal server error occurred.', 'details' => $e->getMessage()]);
}

function handleGet($pdo, $user_id) {
	 if (isset($_GET['entry_id'])) {
		 $entry_id = $_GET['entry_id'];
		 $stmt = $pdo->prepare("SELECT * FROM journal_entries WHERE user_id = ? AND entry_id = ?");
		 $stmt->execute([$user_id, $entry_id]);
		 $entry = $stmt->fetch(PDO::FETCH_ASSOC);
		 if ($entry) {
			 echo json_encode($entry);
		 } else {
			 http_response_code(404);
			 echo json_encode(['error' => 'Entry not found.']);
		 }
		 return;
	 }
 
	 if (!isset($_GET['start_date']) || !isset($_GET['end_date'])) {
		 http_response_code(400);
		 echo json_encode(['error' => 'Missing required date parameters.']);
		 return;
	 }
	 $start_date = $_GET['start_date'];
	 $end_date = $_GET['end_date'];
	 $stmt = $pdo->prepare("SELECT * FROM journal_entries WHERE user_id = ? AND entry_date BETWEEN ? AND ? ORDER BY entry_date, position_order ASC");
	 $stmt->execute([$user_id, $start_date, $end_date]);
	 echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
 }

function handlePost($pdo, $user_id) {
	$data = json_decode(file_get_contents('php://input'), true);
	if (!isset($data['entry_date']) || !isset($data['encrypted_data'])) {
		http_response_code(400);
		echo json_encode(['error' => 'Missing required fields in request body.']);
		return;
	}
	
	$entry_date = $data['entry_date'];
	$encrypted_data = $data['encrypted_data'];
	$position_order = 0;

	if (isset($data['position']) && $data['position'] === 'top') {
		$stmt = $pdo->prepare("UPDATE journal_entries SET position_order = position_order + 1 WHERE user_id = ? AND entry_date = ?");
		$stmt->execute([$user_id, $entry_date]);
	} else {
		$stmt = $pdo->prepare("SELECT COUNT(*) FROM journal_entries WHERE user_id = ? AND entry_date = ?");
		$stmt->execute([$user_id, $entry_date]);
		$position_order = $stmt->fetchColumn();
	}
	
	$stmt = $pdo->prepare("INSERT INTO journal_entries (user_id, entry_date, encrypted_data, position_order) VALUES (?, ?, ?, ?)");
	$stmt->execute([$user_id, $entry_date, $encrypted_data, $position_order]);
	
	http_response_code(201);
	echo json_encode(['message' => 'Journal entry created.', 'entry_id' => $pdo->lastInsertId()]);
}

function handlePut($pdo, $user_id) {
	$data = json_decode(file_get_contents('php://input'), true);
	
	if (isset($data['moved_entry_id']) && isset($data['target_date']) && isset($data['ordered_ids_in_column'])) {
		try {
			$pdo->beginTransaction();
			$stmt_update_date = $pdo->prepare("UPDATE journal_entries SET entry_date = ? WHERE entry_id = ? AND user_id = ?");
			$stmt_update_date->execute([$data['target_date'], $data['moved_entry_id'], $user_id]);
			
			$stmt_update_order = $pdo->prepare("UPDATE journal_entries SET position_order = ? WHERE entry_id = ? AND user_id = ?");
			foreach ($data['ordered_ids_in_column'] as $index => $entry_id) {
				$stmt_update_order->execute([$index, $entry_id, $user_id]);
			}
			$pdo->commit();
			echo json_encode(['message' => 'Journal reordered successfully.']);
		} catch (Exception $e) {
			$pdo->rollBack();
			http_response_code(500);
			echo json_encode(['error' => 'Database error during reorder.', 'details' => $e->getMessage()]);
		}
	} else if (isset($data['entry_id']) && isset($data['encrypted_data'])) {
		$stmt = $pdo->prepare("UPDATE journal_entries SET encrypted_data = ? WHERE entry_id = ? AND user_id = ?");
		$stmt->execute([$data['encrypted_data'], $data['entry_id'], $user_id]);
		echo json_encode(['message' => 'Entry updated successfully.']);
	
	} else if (isset($data['entry_id']) && isset($data['is_private'])) {
		$is_private = (int)(bool)$data['is_private'];
		$stmt = $pdo->prepare("UPDATE journal_entries SET is_private = ? WHERE entry_id = ? AND user_id = ?");
		$stmt->execute([$is_private, $data['entry_id'], $user_id]);
		echo json_encode(['message' => 'Entry privacy updated successfully.']);

	} else {
		http_response_code(400);
		echo json_encode(['error' => 'Invalid payload for PUT request.']);
	}
}

function handleDelete($pdo, $user_id) {
	if (!isset($_GET['entry_id'])) {
		http_response_code(400);
		echo json_encode(['error' => 'Missing entry_id parameter.']);
		return;
	}
	
	$stmt = $pdo->prepare("DELETE FROM journal_entries WHERE entry_id = ? AND user_id = ?");
	$stmt->execute([$_GET['entry_id'], $user_id]);
	
	if ($stmt->rowCount() > 0) {
		echo json_encode(['message' => 'Entry deleted successfully.']);
	} else {
		http_response_code(404);
		echo json_encode(['error' => 'Entry not found or user not authorized.']);
	}
}
?>
~~~
*END FULL CODE FOR FILE: 	/api/journal.php*

## preferences.php
*START FULL CODE FOR FILE: 	/api/modules/preferences.php*
~~~
<?php
// /api/preferences.php

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . '/includes/session.php';
require_once BASE_PATH . '/includes/db.php';

if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['error' => 'User not authenticated.']);
	exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

header('Content-Type: application/json');

switch ($method) {
	case 'GET':
		handleGet($pdo, $user_id);
		break;
	case 'PUT':
		handlePut($pdo, $user_id);
		break;
	default:
		http_response_code(405);
		echo json_encode(['error' => 'Method not allowed.']);
		break;
}

function handleGet($pdo, $user_id) {
	// MODIFIED: Added contact_aliases to the SELECT statement
	$sql = "SELECT
				u.app_title,
				p.user_id AS pref_user_id,
				p.theme,
				p.show_shared,
				p.show_assigned,
				p.show_mine,
				p.hide_completed,
				p.current_view,
				p.tasks_tab_title,
				p.journal_tab_title,
				p.filters,
				p.priority_only,
				p.sound_effects_enabled,
				p.session_timeout_minutes,
				p.custom_fillers,
				p.contact_aliases,
				p.journal_column_count,
				p.hide_private,
				p.private_view_only,
				p.editor_font_size_px,
				p.visible_calendars
			FROM users u
			LEFT JOIN user_preferences p ON u.user_id = p.user_id
			WHERE u.user_id = ?";

	$stmt = $pdo->prepare($sql);
	$stmt->execute([$user_id]);
	$preferences = $stmt->fetch(PDO::FETCH_ASSOC);

	if (!$preferences || $preferences['pref_user_id'] === null) {
		$stmt_insert = $pdo->prepare("INSERT INTO user_preferences (user_id) VALUES (?)");
		$stmt_insert->execute([$user_id]);
		
		$stmt->execute([$user_id]);
		$preferences = $stmt->fetch(PDO::FETCH_ASSOC);
	}
	
	if (!empty($preferences['visible_calendars'])) {
		$preferences['visible_calendars'] = json_decode($preferences['visible_calendars'], true);
	}

	echo json_encode($preferences);
}

function handlePut($pdo, $user_id) {
	$data = json_decode(file_get_contents('php://input'), true);

	if (!isset($data['key'])) {
		http_response_code(400);
		echo json_encode(['error' => 'Request must include a "key".']);
		return;
	}

	$key = $data['key'];
	$value = $data['value'];

	$boolean_keys = ['show_shared', 'show_assigned', 'show_mine', 'hide_completed', 'priority_only', 'hide_private', 'private_view_only', 'sound_effects_enabled'];

	if (in_array($key, $boolean_keys)) {
		$value = $value ? 1 : 0;
	}

	$sql = "";
	
	switch ($key) {
		case 'app_title':
			$sql = "UPDATE users SET app_title = ? WHERE user_id = ?";
			break;
		
		// MODIFIED: Add 'contact_aliases' as a valid key to update
		case 'contact_aliases':
		case 'visible_calendars':
		case 'tasks_tab_title':
		case 'journal_tab_title':
		case 'current_view':
		case 'theme':    
		case 'show_assigned':
		case 'show_mine':
		case 'hide_completed':
		case 'priority_only':
		case 'journal_column_count':
		case 'custom_fillers':
		case 'hide_private':
		case 'private_view_only':
		case 'sound_effects_enabled':
		case 'editor_font_size_px':
		case 'session_timeout_minutes':
		case 'show_shared':
		case 'filters':
			$stmt_check = $pdo->prepare("SELECT COUNT(*) FROM user_preferences WHERE user_id = ?");
			$stmt_check->execute([$user_id]);
			if ($stmt_check->fetchColumn() == 0) {
				$stmt_insert = $pdo->prepare("INSERT INTO user_preferences (user_id) VALUES (?)");
				$stmt_insert->execute([$user_id]);
			}
			$sql = "UPDATE user_preferences SET `$key` = ? WHERE user_id = ?";
			break;

		default:
			http_response_code(400);
			echo json_encode(['error' => 'Invalid preference key provided.']);
			return;
	}

	$stmt = $pdo->prepare($sql);
	
	if ($stmt->execute([$value, $user_id])) {
		echo json_encode(['message' => 'Preference updated successfully.']);
	} else {
		http_response_code(500);
		echo json_encode(['error' => 'Database operation failed.']);
	}
}
?>
~~~
*END FULL CODE FOR FILE: 	/api/modules/preferences.php*
		

## search.php
*START FULL CODE FOR FILE: 	/api/modules/search.php*
~~~
<?php
// /api/search.php

// MODIFIED: Use a robust absolute path to load the config first.
require_once dirname(__DIR__) . '/includes/config.php';
// MODIFIED: Now use the BASE_PATH constant for all other includes.
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

// Ensure user is authenticated
if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['error' => 'User not authenticated.']);
	exit;
}

header('Content-Type: application/json');

try {
	$user_id = $_SESSION['user_id'];
	
	// Simply fetch all journal entries for the user and send them to the client.
	$stmt = $pdo->prepare("SELECT entry_id, entry_date, encrypted_data FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC");
	$stmt->execute([$user_id]);
	$all_entries = $stmt->fetchAll(PDO::FETCH_ASSOC);
	
	echo json_encode($all_entries);

} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Could not fetch entries.', 'details' => $e->getMessage()]);
}
?>
~~~
*END FULL CODE FOR FILE: 	/api/modules/search.php*


## share.php
*START FULL CODE FOR FILE: 	/api/modules/share.php*
~~~
<?php
// /api/share.php

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

header('Content-Type: application/json');

// 1. Authenticate the user
if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['success' => false, 'message' => 'User not authenticated.']);
	exit;
}
$ownerId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

// 2. Validate incoming data
if (!isset($data['task_id']) || !isset($data['recipient_emails']) || !is_array($data['recipient_emails'])) {
	http_response_code(400);
	echo json_encode(['success' => false, 'message' => 'A task_id and an array of recipient_emails are required.']);
	exit;
}
$taskId = $data['task_id'];
$newRecipientEmails = $data['recipient_emails'];

try {
	// 3. Security Check: Verify the current user is the owner of the task.
	$stmt_owner_check = $pdo->prepare(
		"SELECT c.owner_id FROM tasks t JOIN `columns` c ON t.column_id = c.column_id WHERE t.task_id = ? AND c.owner_id = ?"
	);
	$stmt_owner_check->execute([$taskId, $ownerId]);
	if (!$stmt_owner_check->fetch()) {
		http_response_code(403);
		echo json_encode(['success' => false, 'message' => 'Permission denied. Only the task owner can manage shares.']);
		exit;
	}

	// 4. Begin a transaction for data integrity
	$pdo->beginTransaction();

	// 5. Convert the list of new recipient emails into user IDs
	$newRecipientIds = [];
	if (!empty($newRecipientEmails)) {
		$placeholders = implode(',', array_fill(0, count($newRecipientEmails), '?'));
		$stmt_ids = $pdo->prepare("SELECT user_id FROM users WHERE email IN ($placeholders)");
		$stmt_ids->execute($newRecipientEmails);
		// fetchAll with FETCH_COLUMN gets just the user_id values in a simple array
		$newRecipientIds = $stmt_ids->fetchAll(PDO::FETCH_COLUMN);
	}

	// 6. Get the list of users the task is currently shared with
	$stmt_current = $pdo->prepare("SELECT shared_with_user_id FROM task_shares WHERE task_id = ?");
	$stmt_current->execute([$taskId]);
	$currentRecipientIds = $stmt_current->fetchAll(PDO::FETCH_COLUMN);

	// 7. Reconcile the lists to determine who to add and who to remove
	$idsToDelete = array_diff($currentRecipientIds, $newRecipientIds);
	$idsToInsert = array_diff($newRecipientIds, $currentRecipientIds);

	// 8. Perform deletions
	if (!empty($idsToDelete)) {
		$deletePlaceholders = implode(',', array_fill(0, count($idsToDelete), '?'));
		$stmt_delete = $pdo->prepare(
			"DELETE FROM task_shares WHERE task_id = ? AND shared_with_user_id IN ($deletePlaceholders)"
		);
		$stmt_delete->execute(array_merge([$taskId], array_values($idsToDelete)));
	}

	// 9. Perform insertions
	if (!empty($idsToInsert)) {
		$stmt_insert = $pdo->prepare(
			"INSERT INTO task_shares (task_id, owner_id, shared_with_user_id) VALUES (?, ?, ?)"
		);
		foreach ($idsToInsert as $recipientId) {
			// Prevent sharing with oneself, just in case
			if ($recipientId != $ownerId) {
				$stmt_insert->execute([$taskId, $ownerId, $recipientId]);
			}
		}
	}

	// 10. Commit the transaction
	$pdo->commit();

	echo json_encode(['success' => true, 'message' => 'Share settings updated successfully.']);

} catch (Exception $e) {
	if ($pdo->inTransaction()) {
		$pdo->rollBack();
	}
	http_response_code(500);
	error_log('Share task sync error: ' . $e->getMessage());
	echo json_encode(['success' => false, 'message' => 'An internal server error occurred while updating shares.']);
}
?>
~~~
*END FULL CODE FOR FILE: 	/api/modules/share.php*


## tasks.php
*START FULL CODE FOR FILE: 	/api/modules/tasks.php*
~~~
<?php
// /api/tasks.php

// These debugging lines have been removed to prevent JSON corruption.

header('Content-Type: application/json');

require_once dirname(__DIR__) . '/includes/config.php';
require_once BASE_PATH . 'includes/session.php';
require_once BASE_PATH . 'includes/db.php';

if (!isset($_SESSION['user_id'])) {
	http_response_code(401);
	echo json_encode(['success' => false, 'message' => 'User not authenticated.']);
	exit;
}

$userId = $_SESSION['user_id'];

// --- NEW: LOGIC TO HANDLE EXPORT REQUESTS ---
if (isset($_GET['export']) && $_GET['export'] == 'true') {
	try {
		$includeCompleted = isset($_GET['include_completed']) && $_GET['include_completed'] === 'true';

		// Base query to get all tasks for the logged-in user
		$sql = "SELECT t.* FROM `tasks` t JOIN `columns` c ON t.column_id = c.column_id WHERE c.owner_id = ?";
		
		// If 'include_completed' is false, add a condition to filter out completed tasks (status = 0)
		if (!$includeCompleted) {
			$sql .= " AND t.status != 0";
		}

		$sql .= " ORDER BY t.position ASC";

		$stmt = $pdo->prepare($sql);
		$stmt->execute([$userId]);
		$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
		
		echo json_encode($tasks);

	} catch (PDOException $e) {
		http_response_code(500);
		echo json_encode(['success' => false, 'message' => 'Export query failed.']);
	}
	// Stop the script here to prevent the regular GET logic from running
	exit;
}
// --- END OF NEW EXPORT LOGIC ---


$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
	case 'GET':
	try {
		// --- MODIFIED: This query now joins with shares and users to get a recipient list ---
		$ownedTasksSql = "
			SELECT 
				t.*,
				(CASE WHEN COUNT(ts.share_id) > 0 THEN 1 ELSE 0 END) AS is_shared,
				GROUP_CONCAT(u.username SEPARATOR ', ') AS shared_with_list,
				NULL AS owner_username
			FROM tasks t
			JOIN `columns` c ON t.column_id = c.column_id
			LEFT JOIN task_shares ts ON t.task_id = ts.task_id
			LEFT JOIN users u ON ts.shared_with_user_id = u.user_id
			WHERE c.owner_id = ?
			GROUP BY t.task_id
			ORDER BY t.position ASC
		";
		$stmt1 = $pdo->prepare($ownedTasksSql);
		$stmt1->execute([$userId]);
		$ownedTasks = $stmt1->fetchAll(PDO::FETCH_ASSOC);
	
		// --- Query 2 for tasks shared with the user is unchanged ---
		$sharedTasksSql = "
			SELECT t.*, 1 AS is_shared, u.username AS owner_username
			FROM task_shares ts
			JOIN tasks t ON ts.task_id = t.task_id
			JOIN users u ON ts.owner_id = u.user_id
			WHERE ts.shared_with_user_id = ?
		";
		$stmt2 = $pdo->prepare($sharedTasksSql);
		$stmt2->execute([$userId]);
		$sharedTasks = $stmt2->fetchAll(PDO::FETCH_ASSOC);
	
		echo json_encode([
			'owned' => $ownedTasks,
			'shared' => $sharedTasks
		]);
	
	} catch (PDOException $e) {
		error_log("Task fetch error: " . $e->getMessage());
		http_response_code(500);
		echo json_encode(['success' => false, 'message' => 'Database query failed.', 'details' => $e->getMessage()]);
	}
	break;

	case 'POST':
		$input = json_decode(file_get_contents('php://input'), true);
		if (empty($input['encrypted_data']) || empty($input['column_id'])) {
			http_response_code(400);
			echo json_encode(['success' => false, 'message' => 'Encrypted data and column ID are required.']);
			exit;
		}
		try {
			$stmt = $pdo->prepare("SELECT owner_id FROM `columns` WHERE column_id = ?");
			$stmt->execute([$input['column_id']]);
			$column = $stmt->fetch();
		
			if (!$column || $column['owner_id'] != $userId) {
				http_response_code(403);
				echo json_encode(['success' => false, 'message' => 'Authorization failed.']);
				exit;
			}
		
			$posStmt = $pdo->prepare("SELECT COUNT(*) FROM tasks WHERE column_id = ?");
			$posStmt->execute([$input['column_id']]);
			$position = $posStmt->fetchColumn();
		
			$status = $input['status'] ?? 1;
		
			if (!in_array($status, [0, 1, 2], true)) {
				$status = 1; 
			}
		
			$stmt = $pdo->prepare("INSERT INTO `tasks` (column_id, encrypted_data, status, position) VALUES (?, ?, ?, ?)");
			$stmt->execute([$input['column_id'], $input['encrypted_data'], $status, $position]);
			
			http_response_code(201);
			echo json_encode(['success' => true, 'task_id' => $pdo->lastInsertId()]);
		} catch (Exception $e) {
			http_response_code(500);
			echo json_encode(['success' => false, 'message' => 'Database operation failed.']);
		}
		break;

	case 'PUT':
	$input = json_decode(file_get_contents('php://input'), true);
	
	if (isset($input['ordered_tasks'])) {
		try {
			$pdo->beginTransaction();
			$stmt = $pdo->prepare("UPDATE tasks SET position = ? WHERE task_id = ?");
			foreach ($input['ordered_tasks'] as $index => $taskId) {
				$stmt->execute([$index, $taskId]);
			}
			$pdo->commit();
			echo json_encode(['success' => true, 'message' => 'Task order updated.']);
		} catch (Exception $e) {
			$pdo->rollBack();
			http_response_code(500);
			echo json_encode(['success' => false, 'message' => 'Failed to update task order.']);
		}
		exit;
	}
	
	if (!isset($input['task_id'])) {
		http_response_code(400);
		echo json_encode(['success' => false, 'message' => 'Task ID is required.']);
		exit;
	}
	
	// --- NEW, SIMPLIFIED PERMISSION CHECK ---
	$taskId = $input['task_id'];
	$isOwner = false;
	$isRecipient = false;
	
	// 1. Check if the user is the owner of the task's column
	$stmt_owner_check = $pdo->prepare(
		"SELECT c.owner_id FROM tasks t JOIN `columns` c ON t.column_id = c.column_id WHERE t.task_id = ? AND c.owner_id = ?"
	);
	$stmt_owner_check->execute([$taskId, $userId]);
	if ($stmt_owner_check->fetch()) {
		$isOwner = true;
	}
	
	// 2. If the user is not the owner, check if the task has been shared with them
	if (!$isOwner) {
		$stmt_recipient_check = $pdo->prepare(
			"SELECT share_id FROM task_shares WHERE task_id = ? AND shared_with_user_id = ?"
		);
		$stmt_recipient_check->execute([$taskId, $userId]);
		if ($stmt_recipient_check->fetch()) {
			$isRecipient = true;
		}
	}
	
	// 3. Deny access if the user is neither the owner nor a valid recipient
	if (!$isOwner && !$isRecipient) {
		http_response_code(403);
		echo json_encode(['success' => false, 'message' => 'Permission denied.']);
		exit;
	}
	// --- END OF NEW PERMISSION CHECK ---
	
	$updateMade = false;
	$errorMessage = 'Update failed: No changes were made or task not found.';
	
	if (isset($input['encrypted_data'])) {
		$stmt = $pdo->prepare("UPDATE tasks SET encrypted_data = ?, updated_at = NOW() WHERE task_id = ?");
		$stmt->execute([$input['encrypted_data'], $taskId]);
		if ($stmt->rowCount() > 0) $updateMade = true;
	
	} elseif (isset($input['column_id'])) {
		if (!$isOwner) {
			http_response_code(403);
			echo json_encode(['success' => false, 'message' => 'Only the owner can move this task.']);
			exit;
		}
		$stmt = $pdo->prepare("UPDATE tasks SET column_id = ? WHERE task_id = ?");
		$stmt->execute([$input['column_id'], $taskId]);
		if ($stmt->rowCount() > 0) $updateMade = true;
	
	} elseif (isset($input['status'])) {
		$status = $input['status'];
		if (!in_array($status, [0, 1, 2], true)) {
			http_response_code(400);
			echo json_encode(['success' => false, 'message' => 'Invalid status value provided.']);
			exit;
		}
		$stmt = $pdo->prepare("UPDATE tasks SET status = ? WHERE task_id = ?");
		$stmt->execute([$status, $taskId]);
		if ($stmt->rowCount() > 0) $updateMade = true;
	
	} elseif (array_key_exists('due_date', $input)) {
		$stmt = $pdo->prepare("UPDATE tasks SET due_date = ? WHERE task_id = ?");
		$stmt->execute([$input['due_date'], $taskId]);
		if ($stmt->rowCount() > 0) $updateMade = true;
	
	} else {
		http_response_code(400);
		echo json_encode(['success' => false, 'message' => 'Invalid PUT request payload.']);
		exit;
	}
	
	if ($updateMade) {
		echo json_encode(['success' => true, 'message' => 'Task updated successfully.']);
	} else {
		http_response_code(409);
		echo json_encode(['success' => false, 'message' => $errorMessage]);
	}
	break;
	
	case 'DELETE':
	if (!isset($_GET['task_id'])) {
		http_response_code(400);
		echo json_encode(['success' => false, 'message' => 'Task ID is required.']);
		exit;
	}
	$taskId = $_GET['task_id'];
	
	// --- NEW, SIMPLIFIED PERMISSION CHECK ---
	// First, get the column_id for the given task.
	$stmt_col = $pdo->prepare("SELECT column_id FROM tasks WHERE task_id = ?");
	$stmt_col->execute([$taskId]);
	$task = $stmt_col->fetch();
	
	if (!$task) {
		http_response_code(404);
		echo json_encode(['success' => false, 'message' => 'Task not found.']);
		exit;
	}
	
	// Now, check if the user owns the column this task belongs to.
	$stmt_owner = $pdo->prepare("SELECT owner_id FROM `columns` WHERE column_id = ? AND owner_id = ?");
	$stmt_owner->execute([$task['column_id'], $userId]);
	if (!$stmt_owner->fetch()) {
		http_response_code(403);
		echo json_encode(['success' => false, 'message' => 'Permission denied to delete this task.']);
		exit;
	}
	// --- END OF NEW PERMISSION CHECK ---
	
	try {
		$stmt = $pdo->prepare("DELETE FROM tasks WHERE task_id = ?");
		$stmt->execute([$taskId]);
	
		if ($stmt->rowCount() > 0) {
			echo json_encode(['success' => true, 'message' => 'Task deleted successfully.']);
		} else {
			// This case should not be reached due to the checks above, but it is good practice.
			http_response_code(404);
			echo json_encode(['success' => false, 'message' => 'Task not found during delete operation.']);
		}
	} catch (PDOException $e) {
		http_response_code(500);
		echo json_encode(['success' => false, 'message' => 'Database delete failed.']);
	}
	break;
		
	default:
		http_response_code(405);
		echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
		break;
}
?>
~~~
*END FULL CODE FOR FILE: 	/api/modules/tasks.php*


## style.css
*START FULL CODE FOR FILE: 	/assets/css/style.css*
~~~
/* ==========================================================================
   1. THEME VARIABLES
   ========================================================================== */
:root {
	--bg-color: #202124;
	--column-header-bg: #1c1c1e;
	--app-header-bg: rgba(32, 33, 36, 0.85);
	--active-tab-bg: var(--column-bg); /* NEW: Variable for active tab background */
	--text-primary: #f2f2f7;
	--text-secondary: #8e8e93;
	--text-tertiary: #555;
	--accent-color: #0d6efd;
	--column-bg: #282a2d; 
	--card-bg: #3c4043;
	--card-border: rgba(255, 255, 255, 0.12);
	--input-bg: #2c2c2e;
	--input-border: #4a4a4c;
	--btn-hover-bg: rgba(255, 255, 255, 0.1);
	--btn-active-bg: rgba(0, 122, 255, 0.3);
	--status-green: #30d158;
	--status-red: #ff453a;
	--status-gray: #8e8e93;
	--status-orange: #ff9f0a;
	--delegated-brown: #20c997; /* This is a shade of teal */
	--scrollbar-track: #2b2b2b;
	--scrollbar-thumb: #555;
	--private-pattern: rgba(255, 255, 255, 0.07);
}

html.light-mode {
	--bg-color: #d9d9e0;
	--column-header-bg: #e9e9ed;
	--app-header-bg: rgba(249, 249, 249, 0.85);
	--active-tab-bg: var(--bg-color); /* NEW: Variable for active tab background */
	--text-primary: #000000;
	--text-secondary: #555555;
	--text-tertiary: #8a8a8e;
	--accent-color: #0066cc;
	--column-bg: rgba(255, 255, 255, 0.75);
	--card-bg: #ffffff;
	--card-border: #dcdcdc;
	--input-bg: #f0f0f5;
	--input-border: #cccccc;
	--btn-hover-bg: #e9e9e9;
	--btn-active-bg: rgba(0, 102, 204, 0.15);
	--status-orange: #d97400;
	--delegated-brown: #8b4513;
	--scrollbar-track: #e9e9eb;
	--scrollbar-thumb: #c7c7cc;
	--private-pattern: rgba(0, 0, 0, 0.05);
}

/* ==========================================================================
   2. GLOBAL & LAYOUT STYLES
   ========================================================================== */
body {
	background-color: var(--bg-color);
	color: var(--text-primary);
	font-family: 'Roboto', sans-serif;
	margin: 0;
	height: 100vh;
	display: flex;
	flex-direction: column;
	overflow: hidden; 
}

#main-app-container {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	height: 100%;
}

#main-app-container.hidden {
	opacity: 0;
	pointer-events: none;
}

#main-app-container > main {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
	/* FIXED: Reduced the top padding from 1.5rem to 0.75rem */
	padding: 0.75rem 1.5rem 1rem 1.5rem;
}
/* ==========================================================================
   3. APP HEADER & TABS
   ========================================================================== */
#app-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem 0 1.5rem;
	position: relative;
	z-index: 1000;
	background: var(--app-header-bg);
	backdrop-filter: blur(15px);
	-webkit-backdrop-filter: blur(15px);
	border-bottom: none;
	flex-shrink: 0;
}

.header-left, .header-right {
	display: flex;
	align-items: center; /* Changed from baseline to center */
	gap: 1rem;
}

#app-title {
	font-size: 1.75rem;
	font-weight: bold;
	margin-bottom: 0;
	outline: none;
	border-radius: 5px;
	padding: 0 0.25rem;
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
	margin-bottom: 0;
	cursor: pointer;
	padding: 0.75rem 1.25rem;
	transition: opacity 0.2s, color 0.2s, border-color 0.2s;
	outline: none;
	border-top-left-radius: 6px;
	border-top-right-radius: 6px;
	border: 1px solid transparent;
	border-bottom: 1px solid var(--card-border);
	opacity: 0.6;
}

.view-tab.active {
	background-color: var(--active-tab-bg); /* MODIFIED: Use the new variable */
	color: var(--accent-color);
	font-weight: 600;
	border-color: var(--card-border);
	border-bottom-color: var(--active-tab-bg); /* MODIFIED: Use the new variable */
	opacity: 1;
}

#header-logo {
	height: 1.8rem; /* Using 'rem' makes it scale with the global font size */
	width: auto;
	margin-right: 0.25rem;
}

/* ==========================================================================
   4. MAIN CONTENT AREA (TASK & JOURNAL BOARDS)
   ========================================================================== */
#task-board-container,
#journal-board-container {
	display: flex;
	gap: 1.5rem;
	flex: 1;
	min-height: 0;
	overflow-x: auto;
}

#task-board-container {
	flex-wrap: nowrap;
}

#journal-board-container {
	transition: width 0.3s ease-in-out;
}

/* ==========================================================================
   5. COLUMNS (TASK & JOURNAL)
   ========================================================================== */
.task-column {
	min-width: 300px;
	max-width: 450px;
	flex: 1;
	background: var(--column-bg);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	border: 1px solid var(--card-border);
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	border-radius: 12px;
	transition: border-color 0.3s, box-shadow 0.3s;
	overflow: hidden;
	box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	position: relative;
}
   
.task-column > .card-header,
.journal-column-header {
	background-color: var(--column-header-bg);
	border-bottom: 1px solid var(--card-border);
	color: var(--text-primary);
	padding: 0.5rem 0.75rem;
	transition: background-color 0.3s;
	flex-shrink: 0;
}

.task-column > .card-footer {
	background-color: var(--column-header-bg);
	border-top: 1px solid var(--card-border);
	padding: 0.75rem;
	flex-shrink: 0;
}

.card-body {
	flex-grow: 1;
	overflow-y: auto;
	padding: 0.75rem;
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
	font-weight: 600;
	padding: 2px 8px;
	border-radius: 10px;
	margin-left: 0.75rem;
}

.btn-icon,
.delete-column-btn {
	background: none;
	border: none;
	color: var(--text-secondary);
	font-size: 1.5rem;
	font-weight: bold;
	line-height: 1;
	padding: 0 0.2rem;
	opacity: 0;
	transition: all 0.2s ease-in-out;
}

.task-column .card-header:hover .btn-icon,
.task-column .card-header:hover .delete-column-btn {
	opacity: 1;
}

.delete-column-btn::after {
	content: '×';
}

.btn-icon:hover,
.delete-column-btn:hover {
	color: var(--text-primary);
	opacity: 1;
}

.private-column-toggle {
	opacity: 0;
	transition: opacity 0.2s ease-in-out;
}

.task-column .card-header:hover .private-column-toggle {
	opacity: 1;
}

.journal-column-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.journal-column-header h5 {
	flex-grow: 1;
	text-align: center;
	margin-bottom: 0;
}

.journal-nav-btn {
	background: none;
	border: none;
	color: var(--text-secondary);
	font-size: 1.5rem;
	font-weight: bold;
	cursor: pointer;
	padding: 0 0.5rem;
}

.journal-column.is-center {
	border-color: var(--accent-color);
	box-shadow: 0 0 15px rgba(13, 110, 253, 0.2);
}

.journal-column.is-center .journal-column-header {
	background-color: rgba(13, 110, 253, 0.1);
}

.is-weekend {
	color: var(--status-orange);
	font-weight: 500;
}

.journal-header-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	flex-grow: 1;
}

.event-labels-container {
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
	justify-content: center;
}

.calendar-event-label {
	font-size: 0.8rem;
	font-weight: 500;
	padding: 2px 6px;
	border-radius: 4px;
	background-color: var(--input-bg);
	color: var(--text-primary);
	border: 1px solid var(--card-border);
	white-space: nowrap;
}

/* Style for tasks shared with others */
.task-card.shared-task {
	background-image: repeating-linear-gradient(
		-45deg,
		transparent,
		transparent 10px,
		rgba(0, 255, 255, 0.05) 10px,
		rgba(0, 255, 255, 0.05) 20px
	);
	border-color: var(--status-teal);
}

/* ==========================================================================
   6. CARDS (TASK & JOURNAL)
   ========================================================================== */
.task-card, .journal-entry-card {
	background-color: var(--card-bg);
	color: var(--text-primary);
	margin-bottom: 0.75rem;
	position: relative;
	border-radius: 8px;
	transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
   
.task-card {
	display: flex;
	border: 1px solid var(--card-border);
}

.journal-entry-card {
	display: flex;
	flex-direction: column;
	padding: 0;
	overflow: hidden; 
}

.task-card:hover,
.journal-entry-card:hover {
	transform: translateY(-3px);
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.task-card.dragging, .journal-entry-card.dragging {
	opacity: 0.5;
	transform: rotate(2deg);
}

.task-card-main-content {
	padding: 0.8rem;
	flex-grow: 1;
	min-width: 0;
}

.task-card-content {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
}

.task-title, .entry-title {
	word-break: break-word;
	flex-grow: 1;
	min-width: 0;
}

.entry-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	flex-grow: 1;
	padding: 0.75rem;
}

.entry-notes-icon {
	display: none; 
	font-size: 0.8em;
	margin-left: 0.25rem;
}

.journal-entry-card.has-notes .entry-notes-icon {
	display: inline;
}

.journal-entry-indicator-bar {
	height: 4px; 
	width: 100%;
	background-color: var(--delegated-brown); 
}

/* --- Task Card Status & Styles --- */
.task-status-band {
	width: 8px;
	flex-shrink: 0;
	cursor: pointer;
	background-color: var(--accent-color);
	transition: background-color 0.2s;
	border-top-left-radius: 8px;
	border-bottom-left-radius: 8px;
}

.task-card.priority .task-status-band { background-color: var(--status-orange); }
.task-card.completed .task-status-band { background-color: var(--status-gray); }

.task-card.completed .task-title {
	text-decoration: line-through;
	color: var(--status-gray);
}

.task-card.delegated-task .task-title {
	color: var(--delegated-brown);
}

.task-card.delegated-task.completed .task-title {
	color: var(--status-gray);
}

.due-date-indicator {
	color: #38bdf8;
	font-size: 0.8rem;
	font-weight: 500;
}

.task-card.past-due .task-title,
.task-card.past-due .due-date-indicator {
	color: #f59e0b;
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
}

@keyframes flash {
	0% { left: -100%; }
	100% { left: 150%; }
}

/* --- Card Menus & Expanded Content --- */
.task-card.is-menu-open, .journal-entry-card.is-menu-open {
	z-index: 20;
	overflow: visible;
}

.task-menu-container {
	position: relative;
	opacity: 0;
	transition: opacity 0.2s ease-in-out;
}

.task-card:hover .task-menu-container,
.journal-entry-card:hover .task-menu-container {
	opacity: 1;
}

.task-control-btn {
	background-color: transparent;
	border: none;
	color: var(--text-secondary);
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.2rem;
	font-weight: bold;
	line-height: 1;
	transition: background-color 0.2s, color 0.2s;
}

.task-control-btn:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}

.task-menu {
	position: absolute;
	top: 100%;
	right: 0;
	z-index: 10;
	background-color: var(--card-bg);
	border: 1px solid var(--input-border);
	border-radius: 6px;
	box-shadow: 0 4px 12px rgba(0,0,0,0.2);
	width: 150px;
	padding: 0.25rem 0;
}

.task-menu.drop-up {
	top: auto;
	bottom: 100%;
	margin-bottom: 4px;
}

.task-menu-item {
	display: block;
	width: 100%;
	padding: 0.5rem 1rem;
	text-align: left;
	background: none;
	border: none;
	color: var(--text-primary);
	text-decoration: none;
}

.task-menu-item:hover {
	background-color: var(--btn-hover-bg);
}

.task-menu-item-delete {
	color: var(--status-red);
}

.task-notes-container {
	margin-top: 0.75rem;
	padding-top: 0.75rem;
	border-top: 1px solid var(--input-border);
}

.task-notes-header {
	padding-bottom: 0.75rem;
	margin-bottom: 0.75rem;
	border-bottom: 1px solid var(--input-border);
	font-size: 0.8rem;
	color: var(--text-secondary);
	display: flex;
	flex-wrap: wrap;
	gap: 0.25rem 0.75rem;
}

.task-duedate-container {
	margin-top: 0.75rem;
	padding-top: 0.75rem;
	border-top: 1px solid var(--input-border);
	display: flex;
	gap: 0.5rem;
	align-items: center;
	flex-wrap: nowrap;
}

.due-date-display {
	margin: 0;
	font-size: 0.85rem;
	color: var(--text-secondary);
	flex-grow: 1;
}

.task-duedate-picker {
	width: auto;
}

/* Apply special title color to shared tasks */
.task-card.shared-task .task-title {
	color: var(--delegated-brown); /* This is a teal color in dark mode */
}

.task-card.shared-task.completed .task-title {
	color: var(--status-gray);
}

.share-indicator {
	font-size: 1.1rem;
	margin-left: 0.5rem;
	cursor: default;
	opacity: 0.7;
}

/* ==========================================================================
   7. FORMS & INPUTS
   ========================================================================== */
.form-control, .task-notes-editor {
	background-color: var(--input-bg);
	border: 1px solid var(--input-border);
	color: var(--text-primary);
	border-radius: 4px;
}
.form-control:focus {
	background-color: var(--input-bg);
	color: var(--text-primary);
	border-color: var(--accent-color);
	box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
.form-control::placeholder {
	color: var(--text-secondary);
	opacity: 0.8;
}

/* ==========================================================================
   8. SIDE MENU & MODALS
   ========================================================================== */
#side-menu {
	position: fixed;
	top: 0;
	left: -320px;
	width: 320px;
	height: 100%;
	background-color: var(--column-bg);
	backdrop-filter: blur(15px);
	-webkit-backdrop-filter: blur(15px);
	z-index: 1050;
	transition: left 0.3s ease-in-out;
	border-right: 1px solid var(--card-border);
	display: flex;
	flex-direction: column;
	box-shadow: 4px 0 15px rgba(0,0,0,0.2);
}
   
#side-menu.show {
	left: 0;
}
   
.side-menu-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid var(--card-border);
	flex-shrink: 0;
}
   
.side-menu-header h3 {
	margin: 0;
	font-size: 1.5rem;
}
   
.side-menu-body {
	flex-grow: 1;
	overflow-y: auto;
	padding: 0.5rem 0;
}
   
.side-menu-body .setting-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid var(--input-border);
}
   
.side-menu-body .setting-item:last-of-type {
	border-bottom: none;
}
   
.setting-item label {
	margin: 0;
	font-weight: 500;
}
   
#theme-toggle-group .btn.active {
	background-color: var(--accent-color);
	color: white;
	border-color: var(--accent-color);
}
   
.setting-item a[data-action="toggle-help"] {
	color: var(--accent-color);
	text-decoration: none;
	font-weight: 500;
}
   
.setting-item a[data-action="toggle-help"]:hover {
	text-decoration: underline;
}
   
.setting-description {
	font-size: 0.85rem;
	color: var(--text-secondary);
	margin: -0.5rem 0 0.5rem 0;
}
   
.custom-fillers-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.75rem;
	width: 100%;
}
   
.side-menu-footer {
	padding: 0.75rem 1.5rem; /* MODIFIED: Reduced top/bottom padding */
	border-top: 1px solid var(--card-border);
	flex-shrink: 0;
	background-color: var(--column-header-bg);
}

#side-menu-logout-btn {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.5rem 1rem; /* MODIFIED: Reduced top/bottom padding */
	text-align: left;
	background: none;
	border: none;
	color: var(--status-red);
	text-decoration: none;
	font-size: 1.2rem;
	font-weight: 500;
	border-radius: 6px;
	transition: background-color 0.2s;
}

#side-menu-logout-btn:hover {
	background-color: rgba(255, 69, 58, 0.15);
}

.logout-icon {
	font-size: 1.5rem;
	line-height: 1;
}

.support-info {
	font-size: 0.8rem;
	color: var(--text-secondary);
	margin: 0.75rem 0 0.5rem 0; /* MODIFIED: Significantly reduced margin */
	line-height: 1.4;
}

.version-info {
	font-size: 0.85rem;
	color: var(--text-tertiary);
	text-align: center;
}

.modal-container {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(5px);
	-webkit-backdrop-filter: blur(5px);
	z-index: 1060;
	display: flex;
	justify-content: center;
	align-items: center;
	opacity: 0;
	transition: opacity 0.3s, visibility 0.3s;
	visibility: hidden;
}

.modal-container:not(.hidden) {
	opacity: 1;
	visibility: visible;
}

.modal-content {
	background-color: var(--bg-color);
	border: 1px solid var(--card-border);
	border-radius: 12px;
	width: 90%;
	max-width: 800px;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	box-shadow: 0 8px 30px rgba(0,0,0,0.3);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid var(--card-border);
	flex-shrink: 0;
}

.modal-header h2 {
	margin: 0;
	font-size: 1.5rem;
}

.close-modal-btn {
	background: none;
	border: none;
	font-size: 2.5rem;
	line-height: 1;
	color: var(--text-secondary);
	cursor: pointer;
}

.modal-body {
	padding: 1.5rem;
	overflow-y: auto;
}

/* ==========================================================================
   9. HELP ACCORDION (IN SIDE MENU)
   ========================================================================== */
.side-menu-body .help-item {
	margin: 0.5rem 1.5rem;
}

.help-item-header {
	width: 100%;
	background-color: var(--input-bg);
	border: 1px solid var(--input-border);
	border-radius: 6px;
	text-align: left;
	padding: 0.75rem 1rem;
	font-size: 1.1rem;
	font-weight: 500;
	color: var(--text-primary);
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: background-color 0.2s;
}

.help-item-header:hover {
	background-color: var(--btn-hover-bg);
}

.help-item-header::after {
	content: '›';
	font-size: 1.8rem;
	font-weight: bold;
	color: var(--text-secondary);
	transition: transform 0.3s ease-in-out;
}

.help-item-header.active::after {
	transform: rotate(90deg);
}

.help-item-content {
	max-height: 0;
	overflow: hidden;
	transition: max-height 0.3s ease-in-out, padding 0.3s ease-in-out;
	padding: 0 1rem;
	font-size: 0.95rem;
	line-height: 1.6;
	color: var(--text-secondary);
}

.help-item-content.show {
	max-height: 500px; /* Or other appropriate value */
	padding: 1rem 1rem 1rem 1rem;
}

/* ==========================================================================
   10. FOOTER TOOLBAR
   ========================================================================== */
#app-footer {
	position: relative;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 1.5rem;
	background: var(--app-header-bg);
	backdrop-filter: blur(15px);
	-webkit-backdrop-filter: blur(15px);
	border-top: 1px solid var(--card-border);
	z-index: 999;
	color: var(--text-secondary);
	flex-shrink: 0;
}

.footer-center {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: nowrap;
	flex-grow: 1;
}

.btn-footer {
	background: none;
	border: none;
	color: var(--text-secondary);
	padding: 0.25rem 0.5rem;
	border-radius: 5px;
	transition: background-color 0.2s;
	white-space: nowrap;
}

.btn-footer:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}

.btn-footer.active,
.view-count-controls .btn-footer.active {
	background-color: var(--btn-active-bg);
	color: var(--text-primary);
}

.footer-divider {
	color: var(--text-tertiary);
	margin: 0 0.5rem;
}

.footer-right {
	position: absolute;
	right: 1.5rem;
	top: 50%;
	transform: translateY(-50%);
}

#username-display {
	color: var(--text-secondary);
	font-size: 0.9em;
}

/* ==========================================================================
   11. SEARCH RESULTS
   ========================================================================== */
#main-search-results-container {
	width: 80%;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
	padding-top: 1.5rem;
}

.search-results-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 0.75rem;
	margin-bottom: 0.75rem;
	border-bottom: 1px solid var(--input-border);
	flex-shrink: 0;
}

#journal-search-results-container, #main-search-output {
	overflow-y: auto;
	flex-grow: 1;
	padding-right: 5px;
}

.search-result-item {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	padding: 0.75rem 1rem;
	border-radius: 8px;
	margin-bottom: 0.75rem;
	cursor: pointer;
	transition: background-color 0.2s, border-color 0.2s;
}

.search-result-item:hover {
	background-color: var(--btn-hover-bg);
	border-color: var(--accent-color);
}

.search-result-item .search-result-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.25rem;
	border-bottom: none;
	padding-bottom: 0;
}

.search-result-title {
	font-size: 1.1rem;
	font-weight: 500;
	color: var(--accent-color);
}

.search-result-date {
	font-size: 0.85rem;
	color: var(--text-secondary);
}

.search-result-snippet {
	font-size: 0.9rem;
	color: var(--text-primary);
	opacity: 0.8;
}

.search-result-full-content {
	padding-top: 0.75rem;
	border-top: 1px solid var(--input-border);
	margin-top: 0.75rem;
	font-size: 0.95rem;
	line-height: 1.5;
	display: none;
}

.search-result-item.is-expanded .search-result-snippet {
	display: none;
}

.search-result-item.is-expanded .search-result-full-content {
	display: block;
}

/* ==========================================================================
   12. EDITOR INTERFACE
   ========================================================================== */
/* --- Main Containers --- */
#editor-mode-container {
	position: fixed;
	top: 0; left: 0;
	width: 100%; height: 100%;
	background-color: var(--bg-color);
	z-index: 2000;
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
}

#editor-content-wrapper {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	position: relative;
	min-height: 0;
}

#editor-mode-editor {
	flex-grow: 1;
	font-family: Consolas, Monaco, 'Courier New', monospace;
	font-size: 1rem;
	line-height: 1.6;
	padding: 1rem;
	background-color: var(--input-bg);
	border: 1px solid var(--input-border);
	border-radius: 8px;
	box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

/* --- Editor Header --- */
#editor-mode-header {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	align-items: stretch;
	flex-shrink: 0;
	background-color: var(--column-header-bg);
	padding: 1rem 1.5rem;
	border-bottom: 1px solid var(--card-border);
}

.editor-header-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1.5rem;
	width: 100%;
}

#editor-mode-title-container {
	display: flex;
	align-items: baseline;
	gap: 0.75rem;
	font-weight: 500;
	flex-grow: 1;
}

#editor-mode-date-prefix {
	font-size: 1.25rem;
	font-weight: 400;
	color: var(--text-secondary);
	white-space: nowrap;
}

#editor-mode-title-text {
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--accent-color);
}

.editor-mode-actions {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-shrink: 0;
}

/* --- Editor Ribbon --- */
#editor-ribbon-container {
	border-top: 1px solid var(--input-border);
	border-bottom: 1px solid var(--input-border);
	margin-bottom: 1rem;
	flex-shrink: 0;
	position: relative;
}

#ribbon-nav {
	display: flex;
	background-color: var(--column-bg);
	padding: 0 0.5rem;
}

.ribbon-nav-btn {
	background-color: var(--column-bg);
	border: 1px solid transparent;
	border-bottom: 1px solid var(--input-border);
	color: var(--text-secondary);
	padding: 0.5rem 1rem;
	font-weight: 500;
	transition: all 0.2s ease-in-out;
	border-top-left-radius: 6px;
	border-top-right-radius: 6px;
	margin-top: 4px;
}

.ribbon-nav-btn:hover {
	color: var(--text-primary);
}

.ribbon-nav-btn.active {
	background-color: var(--column-header-bg);
	color: var(--text-primary);
	border-color: var(--input-border);
	border-bottom-color: transparent;
}

#ribbon-content {
	padding: 1rem;
	background-color: var(--column-header-bg);
}

.ribbon-panel {
	display: none;
	align-items: center;
	gap: 0.75rem;
}

.ribbon-panel.active {
	display: flex;
}

/* --- Format Bar Panel --- */
#format-panel.active {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

#format-panel-main-groups {
	display: flex;
	flex-wrap: nowrap;
	gap: 0.5rem 1rem;
	overflow: hidden;
}

.format-group {
	display: flex;
	gap: 2px;
}

.format-group + .format-group {
	border-left: 1px solid var(--input-border);
	margin-left: 0.5rem;
	padding-left: 0.5rem;
}

.format-btn {
	background: none;
	border: 1px solid transparent;
	color: var(--text-secondary);
	padding: 0.25rem;
	border-radius: 5px;
	transition: background-color 0.2s, color 0.2s;
	font-size: 1.1rem;
	line-height: 1;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.format-btn:hover {
	background-color: var(--btn-hover-bg);
	color: var(--text-primary);
}

#format-bar-dropdown {
	display: none;
	position: absolute;
	top: 100%;
	right: 1.5rem;
	padding: 0.5rem;
	background-color: var(--column-header-bg);
	border: 1px solid var(--card-border);
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0,0,0,0.2);
	z-index: 1003;
	flex-wrap: wrap;
	gap: 0.5rem 1rem;
	justify-content: flex-end;
}

#format-bar-dropdown.show {
	display: flex;
}

/* --- Ribbon Panel Forms (FIXED) --- */
#ribbon-content form {
	width: 100%;
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

#ribbon-content .form-control {
	flex: 1 1 auto; /* Allows inputs to grow to fill available space */
}

/* Prevents buttons and checkboxes from shrinking */
#ribbon-content .btn,
#ribbon-content .form-check {
	flex-shrink: 0;
}

/* FIX: Specifically targets dropdowns to override Bootstrap's default style */
#ribbon-content .form-select {
	flex-shrink: 0;
	width: auto; /* This tells the dropdown to size to its content */
	min-width: 150px; /* Ensures it has a reasonable minimum width */
}

#find-counter {
	min-width: 50px;
	text-align: center;
	color: var(--text-secondary);
	flex-shrink: 0;
}

/* --- Editor Info Bar --- */
#editor-info-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 1rem;
	margin-top: 0.5rem;
	background-color: var(--column-bg);
	border: 1px solid var(--input-border);
	border-radius: 4px;
	font-size: 0.8rem;
	color: var(--text-secondary);
	flex-shrink: 0;
}

.info-bar-left, .info-bar-right {
	display: flex;
	gap: 1.5rem;
}

/* ==========================================================================
   13. VISUAL PATTERNS & PRIVACY
   ========================================================================== */
.task-column[data-is-private="1"] {
	background: repeating-linear-gradient(
		-45deg,
		var(--private-pattern),
		var(--private-pattern) 2px,
		transparent 2px,
		transparent 10px
	), var(--column-bg);
}

.journal-entry-card[data-is-private="1"] {
	background-image: repeating-linear-gradient(
		-45deg,
		var(--private-pattern),
		var(--private-pattern) 2px,
		transparent 2px,
		transparent 10px
	);
}

#task-board-container.hide-private .task-column[data-is-private="1"] {
	display: none;
}

#journal-board-container.hide-private .journal-entry-card[data-is-private="1"] {
	display: none;
}

#task-board-container.private-only-mode .task-column[data-is-private="0"],
#journal-board-container.private-only-mode .journal-entry-card[data-is-private="0"] {
	display: none !important;
}

/* ==========================================================================
   14. HEADER FORM OVERRIDES
   ========================================================================== */
#app-header .form-control,
#app-header .form-select {
	background-color: var(--input-bg);
	border: 1px solid var(--input-border);
	color: var(--text-primary);
	min-width: 120px;
}

#app-header .form-control:focus,
#app-header .form-select:focus {
	border-color: var(--accent-color);
	box-shadow: 0 0 0 2px var(--btn-active-bg);
}

#app-header .btn-primary {
	background-color: var(--accent-color);
	border-color: var(--accent-color);
	color: var(--text-primary);
	font-weight: 500;
}

#app-header .btn-primary:hover {
	filter: brightness(110%);
}

#app-header .btn-secondary {
	background-color: var(--card-bg);
	border-color: var(--card-border);
	color: var(--text-primary);
}

#app-header .btn-secondary:hover {
	background-color: var(--btn-hover-bg);
	border-color: var(--input-border);
}

/* ==========================================================================
   15. MOBILE HEADER DROPDOWN
   ========================================================================== */
#desktop-header-options {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-wrap: nowrap;
}

#mobile-header-toggle-btn {
	display: none;
	font-size: 1.8rem;
	padding: 0.25rem 0.5rem;
	border-radius: 6px;
}
#mobile-header-toggle-btn:hover {
	background-color: var(--btn-hover-bg);
}

#mobile-header-dropdown {
	display: none;
	position: absolute;
	top: calc(100% + 5px);
	right: 1.5rem;
	background-color: var(--column-header-bg);
	border: 1px solid var(--card-border);
	border-radius: 8px;
	padding: 1rem;
	z-index: 1001;
	box-shadow: 0 4px 12px rgba(0,0,0,0.2);
	flex-direction: column;
	gap: 1rem;
	min-width: 280px;
}

#mobile-header-dropdown.show {
	display: flex;
}

/* ==========================================================================
   16. SCROLLBARS, PRINT, & MISC
   ========================================================================== */
*::-webkit-scrollbar {
	width: 8px;
	height: 12px;
}
*::-webkit-scrollbar-track {
	background: var(--scrollbar-track);
	border-radius: 10px;
}
*::-webkit-scrollbar-thumb {
	background-color: var(--scrollbar-thumb);
	border-radius: 10px;
	border: 3px solid var(--scrollbar-track);
}

@media print {
	body > #main-app-container, body > #app-footer, #editor-mode-container {
		display: none !important;
	}
}

/* NEW: Adds a distinct bottom border to the header when in dev mode */
body.dev-mode-active #app-header {
	border-bottom: 3px solid #e0740b; /* A distinct orange for high visibility */
}

/* ==========================================================================
   17. RESPONSIVE STYLES
   ========================================================================== */
@media (max-width: 768px) {
	/* --- Main Header --- */
	#desktop-header-options {
		display: none;
	}

	#mobile-header-toggle-btn {
		display: block;
		opacity: 1;
	}

	#app-title {
		font-size: 1.2rem;
	}
	.view-tab {
		font-size: 1rem;
		padding: 0.5rem 0.6rem;
	}
	.view-tabs {
		gap: 0.75rem;
	}
	.header-left {
		gap: 0.5rem;
		flex-shrink: 1;
		min-width: 0;
	}
	
	/* --- Editor Header --- */
	.editor-header-row {
	/* The 'flex-wrap: wrap;' rule has been removed */
	}
	
	#editor-mode-title-container {
		width: 100%;
		margin-bottom: 0.75rem;
	}
	#editor-mode-title-text {
		font-size: 1.1rem;
	}
	#editor-mode-date-prefix {
		font-size: 0.75rem;
	}

	/* --- Editor Ribbon --- */
	/* Hide overflowing format buttons */
	#format-panel-main-groups .format-group:nth-child(n+3) {
		display: none;
	}
	/* Show the "more" button and ensure it's fully visible */
	#format-bar-more-btn {
		display: flex;
		opacity: 1;
	}

	/* Allow ribbon forms to wrap their content on small screens */
	#ribbon-content form {
		flex-wrap: wrap;
	}
}

/* ==========================================================================
   18. TOAST NOTIFICATIONS 
   ========================================================================== */
#toast-notification {
	position: fixed;
	top: 1.5rem;
	left: 50%;
	transform: translateX(-50%);
	background-color: var(--accent-color);
	color: white;
	padding: 0.75rem 1.5rem;
	border-radius: 25px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	z-index: 2100;
	font-weight: 500;
	opacity: 0;
	visibility: hidden;
	transition: opacity 0.3s, visibility 0.3s;
}

#toast-notification.show {
	opacity: 1;
	visibility: visible;
}
~~~
*END FULL CODE FOR FILE: 	/assets/css/style.css*
		

## app.js
*START FULL CODE FOR FILE: 	/assets/js/app.js*
~~~
document.addEventListener('DOMContentLoaded', () => {
// This setTimeout ensures that the script runs after the browser has finished
// all its initial rendering tasks, fixing the timing issue.
setTimeout(() => {
	let state = {
		draggedTask: null,
		draggedJournalEntry: null,
		encryptionKey: null,
		currentView: 'tasks',
		currentJournalDate: new Date(),
		skipWeekends: false,
		activeEditor: {
			entryData: null,
			originalNoteTitle: '',
			autoSaveTimerId: null, 
			lastSavedContent: ''   
		},
		filters: {
			showAssigned: true,
			showMine: true,
			showCompleted: false,
			priorityOnly: false,
			hidePrivate: false,
			privateViewOnly: false,
			showShared: true,
			savedFilters: null
		},
		theme: 'dark',
		fontSize: 16,
		editorFontSize: 16,
		journalEntriesCache: [],
		calendarEvents: [],
		journalColumnCount: 3,
		customFillers: [],
		contact_aliases: {}, // NEW: Will hold contacts as {alias: email}
		whooshSound: new Audio('assets/sounds/whoosh.mp3'),
		soundEffectsEnabled: true,
		sessionTimeoutMinutes: 30,
		sessionTimeoutId: null,
		activeTaskPanel: null,
		findState: {
			term: '',
			replaceTerm: '',
			matchCase: false,
			results: [], 
			currentIndex: -1
		}
	};
	
		// --- DOM SELECTORS ---
		const mainAppContainer = document.querySelector('#main-app-container');
		const taskBoardContainer = document.querySelector('#task-board-container');
		const journalBoardContainer = document.querySelector('#journal-board-container');
		const addItemForm = document.querySelector('#add-item-form');
		const newItemInput = document.querySelector('#new-item-name');
		const viewTabs = document.querySelectorAll('.view-tab');
		const appTitleEl = document.querySelector('#app-title');
		const journalNavGroup = document.querySelector('#journal-nav-group');
		const todayBtn = document.querySelector('#today-btn');
		const dateJumpInput = document.querySelector('#date-jump-input');
		const footerDateEl = document.querySelector('#footer-date');
		const taskFilters = document.querySelector('#task-filters');
		const journalFilters = document.querySelector('#journal-filters');
		const dayWrapUpBtn = document.querySelector('#day-wrap-up-btn');
		const filterAssignedBtn = document.querySelector('#filter-assigned-btn');
		const filterMineBtn = document.querySelector('#filter-mine-btn');
		const filterCompletedBtn = document.querySelector('#filter-completed-btn');
		const filterPriorityBtn = document.querySelector('#filter-priority-btn');
		const themeToggleBtn = document.querySelector('#theme-toggle-btn');
		const fontDecreaseBtn = document.querySelector('#font-decrease-btn');
		const fontIncreaseBtn = document.querySelector('#font-increase-btn');
		const rootEl = document.documentElement;
		const headerJournalSearchForm = document.querySelector('#header-journal-search-form');
		const mainSearchResultsContainer = document.querySelector('#main-search-results-container');
		const editorModeContainer = document.querySelector('#editor-mode-container');
		const editorModeDatePrefix = document.querySelector('#editor-mode-date-prefix');
		const editorModeTitleText = document.querySelector('#editor-mode-title-text');
		const editorModeCloseBtn = document.querySelector('#editor-mode-close-btn');
		const editorModePrintBtn = document.querySelector('#editor-mode-print-btn');
		const journalSearchForm = document.querySelector('#journal-search-form');
		const journalSearchResultsArea = document.querySelector('#journal-search-results-area');
		const viewCountControls = document.querySelector('.view-count-controls');
		const findReplaceForm = document.querySelector('#find-replace-form');
		const findTermInput = document.querySelector('#find-term-input');
		const findCounter = document.querySelector('#find-counter');
		const replaceTermInput = document.querySelector('#replace-term-input');
		const findMatchCaseCheck = document.querySelector('#find-match-case-check');
	
		// --- ENCRYPTION / DECRYPTION & DATE HELPERS ---
		
		
		/**
		 * Initiates the process of sharing a task with another user by calling the backend.
		 * @param {number} taskId The ID of the task to share.
		 * @param {string} recipientEmail The email of the user to share with.
		 */
		async function shareTask(taskId, recipientEmail) {
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/share.php`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						task_id: taskId,
						recipient_email: recipientEmail
					})
				});
		
				const result = await response.json();
		
				if (response.ok) {
					// CORRECTED: Changed to showToastNotification
					showToastNotification(result.message || 'Task shared!');
				} else {
					// CORRECTED: Changed to showToastNotification
					showToastNotification(result.message || 'Failed to share task.');
				}
		
			} catch (error) {
				console.error('Share task fetch error:', error);
				// CORRECTED: Changed to showToastNotification
				showToastNotification('Could not contact server to share task.');
			}
		}
		
		/**
		* Handles the responsive header for mobile devices.
		*/
		const mobileHeaderToggleBtn = document.querySelector('#mobile-header-toggle-btn');
		if (mobileHeaderToggleBtn) {
			const desktopOptionsContainer = document.querySelector('#desktop-header-options');
			const mobileDropdown = document.querySelector('#mobile-header-dropdown');
		
			mobileHeaderToggleBtn.addEventListener('click', (e) => {
				e.stopPropagation(); // Prevent the document click listener from closing it immediately
		
				const isShown = mobileDropdown.classList.toggle('show');
		
				// If we are showing the dropdown, move the currently active controls into it.
				if (isShown) {
					// Find all direct children of the desktop container that are NOT hidden by 'd-none'
					const activeControls = [...desktopOptionsContainer.children].filter(child => {
						return !child.classList.contains('d-none');
					});
					// Move them into the dropdown
					activeControls.forEach(control => mobileDropdown.appendChild(control));
				}
			});
		
			// Add a listener to close the dropdown when clicking elsewhere
			document.addEventListener('click', (e) => {
				if (!mobileDropdown.classList.contains('show')) return;
		
				// If the click was inside the dropdown or on the toggle button, do nothing
				if (mobileDropdown.contains(e.target) || mobileHeaderToggleBtn.contains(e.target)) {
					return;
				}
				
				// Otherwise, hide the dropdown
				mobileDropdown.classList.remove('show');
			});
		
			// Listen for the dropdown to be hidden, and move controls back to the desktop container
			mobileDropdown.addEventListener('transitionend', () => {
				if (!mobileDropdown.classList.contains('show')) {
					const mobileControls = [...mobileDropdown.children];
					mobileControls.forEach(control => desktopOptionsContainer.appendChild(control));
				}
			});
		}
		
		
		/**
		* Handles saving the user's calendar visibility preferences.
		*/
		const saveCalendarPrefsBtn = document.querySelector('#save-calendar-prefs-btn');
		if (saveCalendarPrefsBtn) {
			saveCalendarPrefsBtn.addEventListener('click', async () => {
				const checkboxes = document.querySelectorAll('.calendar-toggle-check:checked');
				const selectedCalendars = Array.from(checkboxes).map(cb => cb.dataset.calendarType);
		
				try {
					await savePreference('visible_calendars', selectedCalendars);
					
					// Manually update the state so the UI can refresh without a page reload
					// This fetch reloads the main calendar events based on the user's new selections.
					const eventsRes = await fetch(`${window.APP_CONFIG.appUrl}/api/calendar_events.php`);
					if(eventsRes.ok) {
						state.calendarEvents = await eventsRes.json();
					}
					
					// Close the modal
					document.querySelector('#calendar-settings-modal').classList.add('hidden');
		
					// MODIFIED: Call the main updateView() function
					// This will refresh the correct board (Tasks or Journal) instead of always showing the Journal.
					updateView();
		
				} catch (error) {
					alert('Failed to save calendar preferences. Please try again.');
				}
			});
		}
		
		
		/**
		* Handles the entire import process for both Tasks and Journal.
		*/
		const importConfirmBtn = document.querySelector('#import-confirm-btn');
		if (importConfirmBtn) {
			let validatedImportData = null;
			const importModal = document.querySelector('#import-modal');
			const importMessage = document.querySelector('#import-message');
			
			// Helper function to send TASK data to the backend
			const sendTasksToBackend = async (tasks, action) => {
				importMessage.textContent = 'Encrypting & Importing...';
				importMessage.className = 'mt-3 alert alert-info';
		
				// --- MODIFIED BLOCK START ---
				// 1. Encrypt the data on the client-side first.
				const payload = tasks.map(task => {
					const dataToEncrypt = {
						task_text: task.title,
						task_notes: task.notes || ''
					};
					const encryptedData = encrypt(JSON.stringify(dataToEncrypt), state.encryptionKey);
		
					return {
						columnName: task.columnName,
						isPriority: task.isPriority || false,
						dueDate: task.dueDate || null,
						encryptedData: encryptedData // Send the encrypted blob
					};
				});
				// --- MODIFIED BLOCK END ---
		
				try {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/import.php`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						// Send the newly created payload
						body: JSON.stringify({ tasks: payload, action: action }) 
					});
					const result = await response.json();
					if (!response.ok || !result.success) throw new Error(result.details || result.message || 'An unknown server error occurred.');
					
					importMessage.textContent = 'Import successful! The board will now reload.';
					importMessage.classList.replace('alert-info', 'alert-success');
					setTimeout(() => {
						importModal.classList.add('hidden');
						renderTaskBoard(); 
					}, 2000);
		
				} catch (error) {
					importMessage.textContent = `Import failed: ${error.message}`;
					importMessage.classList.replace('alert-info', 'alert-danger');
				}
			};
		
			// Helper function to send JOURNAL data to the backend
			const sendJournalToBackend = async (entries) => {
				importMessage.textContent = 'Encrypting & Importing...';
				importMessage.className = 'mt-3 alert alert-info';
		
				// --- MODIFIED BLOCK START ---
				// 1. Encrypt the data on the client-side first.
				const payload = entries.map(entry => {
					const dataToEncrypt = {
						entry_title: entry.title,
						entry_notes: entry.notes || ''
					};
					const encryptedData = encrypt(JSON.stringify(dataToEncrypt), state.encryptionKey);
					
					return {
						date: entry.date,
						isPrivate: entry.isPrivate || false,
						encryptedData: encryptedData // Send the encrypted blob
					};
				});
				// --- MODIFIED BLOCK END ---
		
				try {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/import.php`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ journal: payload }) // Send the new payload
					});
					const result = await response.json();
					if (!response.ok || !result.success) throw new Error(result.details || result.message || 'An unknown server error occurred.');
		
					importMessage.textContent = 'Import successful! The board will now reload.';
					importMessage.classList.replace('alert-info', 'alert-success');
					setTimeout(() => {
						importModal.classList.add('hidden');
						renderJournalBoard();
					}, 2000);
		
				} catch (error) {
					importMessage.textContent = `Import failed: ${error.message}`;
					importMessage.classList.replace('alert-info', 'alert-danger');
				}
			};
		
			// Main listener for the "Import" button, no changes needed here.
			importConfirmBtn.addEventListener('click', async () => {
				const importType = importConfirmBtn.dataset.importType;
				const importTextarea = document.querySelector('#import-json-input');
				const jsonText = importTextarea.value;
				
				importMessage.textContent = '';
				importMessage.className = 'mt-3';
		
				if (!jsonText) {
					importMessage.textContent = 'Text box cannot be empty.';
					importMessage.classList.add('alert', 'alert-danger');
					return;
				}
		
				try {
					validatedImportData = JSON.parse(jsonText);
					if (!Array.isArray(validatedImportData)) throw new Error('JSON must be an array of objects.');
				} catch (error) {
					importMessage.textContent = `Invalid JSON format: ${error.message}`;
					importMessage.classList.add('alert', 'alert-danger');
					return;
				}
				
				if (importType === 'tasks') {
					try {
						importMessage.textContent = 'Validating...';
						importMessage.classList.add('alert', 'alert-info');
						const columnsRes = await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`);
						const existingColumns = await columnsRes.json();
						const existingColumnNames = new Set(existingColumns.map(c => c.column_name.toLowerCase()));
						const importedColumnNames = new Set(validatedImportData.map(task => (task.columnName || '').toLowerCase()));
						const newColumns = [...importedColumnNames].filter(name => name && !existingColumnNames.has(name));
		
						if (newColumns.length === 0) {
							sendTasksToBackend(validatedImportData, 'create');
						} else {
							importMessage.innerHTML = `
								<p><strong>Action Required:</strong> The following new columns were found:</p>
								<ul>${newColumns.map(name => `<li>${name}</li>`).join('')}</ul>
								<p>How would you like to handle these?</p>
								<div class="d-flex gap-2 mt-3">
									<button class="btn btn-primary" id="import-action-create-cols">Create New Columns & Import</button>
									<button class="btn btn-secondary" id="import-action-placeholder-col">Place in 'Imported Tasks' Column</button>
								</div>
							`;
						}
					} catch (error) {
						importMessage.textContent = `An error occurred during validation: ${error.message}`;
						importMessage.classList.add('alert', 'alert-danger');
					}
				} else if (importType === 'journal') {
					sendJournalToBackend(validatedImportData);
				}
			});
		
			// Listener for the dynamically added task confirmation buttons, no changes needed here.
			importMessage.addEventListener('click', (e) => {
				const target = e.target;
				if (target.id === 'import-action-create-cols') {
					sendTasksToBackend(validatedImportData, 'create');
				} else if (target.id === 'import-action-placeholder-col') {
					sendTasksToBackend(validatedImportData, 'placeholder');
				}
			});
		}
		
		/**
		* Calculates and updates the char, word, and line counts in the editor info bar.
		*/
		function updateEditorCounters() {
			const editorTextarea = document.querySelector('#editor-mode-editor');
			if (!editorTextarea) return;
		
			const text = editorTextarea.value;
		
			const charCount = text.length;
			const lineCount = text.split('\n').length;
			const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
		
			document.querySelector('#char-counter').textContent = charCount;
			document.querySelector('#word-counter').textContent = wordCount;
			document.querySelector('#line-counter').textContent = lineCount;
		}
		
		/**
		* Resets the session timeout timer. Clears any existing timer and
		* starts a new one based on the user's preference.
		*/
		function resetSessionTimer() {
			if (state.sessionTimeoutId) {
				clearTimeout(state.sessionTimeoutId);
			}
		
			if (state.sessionTimeoutMinutes === 0) {
				return;
			}
		
			const timeoutMilliseconds = state.sessionTimeoutMinutes * 60 * 1000;
		
			state.sessionTimeoutId = setTimeout(() => {
				window.location.href = 'logout.php';
			}, timeoutMilliseconds);
		}
		
		/**
		* Encrypts a string using the stored session encryption key.
		* @param {string} text The plain text to encrypt.
		* @param {string} key The encryption key.
		* @returns {string|null} The encrypted string or null if no key exists.
		*/
		function encrypt(text, key) {
			if (!key) return null;
			return CryptoJS.AES.encrypt(text, key).toString();
		}
	
		/**
		* Decrypts a string using the stored session encryption key.
		* @param {string} encryptedData The encrypted data string.
		* @param {string} key The encryption key.
		* @returns {string} The decrypted text or an error message string.
		*/
		function decrypt(encryptedData, key) {
			if (!key || !encryptedData) return "[decryption failed]";
			try {
				const bytes = CryptoJS.AES.decrypt(encryptedData, key);
				const originalText = bytes.toString(CryptoJS.enc.Utf8);
				return originalText || "[decryption failed]";
			} catch (e) {
				return "[decryption failed]";
			}
		}
	
		/**
		* Formats a Date object into a 'YYYY-MM-DD' string.
		* @param {Date} date The date object to format.
		* @returns {string} The formatted date string.
		*/
		function formatDate(date) {
			return date.toISOString().split('T')[0];
		}
	
		/**
		* Formats a Date object into a more readable 'YYYY.Mon.DD, DayName' string.
		* @param {Date} dateObj The date object to format.
		* @returns {string} The formatted date string.
		*/
		function formatDateWithDay(dateObj) {
			const year = dateObj.getFullYear();
			const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
			const day = String(dateObj.getDate()).padStart(2, '0');
			const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
			return `${year}.${month}.${day}, ${dayName}`;
		}
	
		/**
		* Updates the date display in the main application footer.
		*/
		function updateFooterDate() {
			if (!footerDateEl) return;
			const now = new Date();
			footerDateEl.innerHTML = formatDateWithDay(now);
		}
	
		/**
		* Calculates a new date by adding or subtracting days, optionally skipping weekends.
		* @param {Date} baseDate The starting date.
		* @param {number} direction The direction to move (-1 for previous, 1 for next).
		* @returns {Date} The new calculated Date object.
		*/
		function getOffsetDate(baseDate, direction) {
			let newDate = new Date(baseDate);
			newDate.setDate(newDate.getDate() + direction);
			if (state.skipWeekends) {
				while (newDate.getDay() === 6 || newDate.getDay() === 0) {
					newDate.setDate(newDate.getDate() + direction);
				}
			}
			return newDate;
		}
	
		// --- UI & PREFERENCE FUNCTIONS ---
		
		/**
		* Applies the font size from the state to the editor's textarea.
		*/
		function applyEditorFontSize() {
			const editor = document.querySelector('#editor-mode-editor');
			if (editor) {
				editor.style.fontSize = `${state.editorFontSize}px`;
			}
		}
		
		/**
		* Displays a short-lived notification banner at the top of the screen.
		* @param {string} message The message to display.
		* @param {number} [duration=3000] The duration in ms to show the banner.
		*/
		function showToastNotification(message, duration = 3000) {
			const toast = document.querySelector('#toast-notification');
			if (!toast) return;
		
			toast.textContent = message;
			toast.classList.add('show');
		
			setTimeout(() => {
				toast.classList.remove('show');
			}, duration);
		}
		
		/**
		 * Updates the visual state of the task filter buttons in the footer.
		 * This should be called only when the task view is active.
		 */
		function updateTaskFilterButtonsUI() {
			// A null check on each button makes this function robust.
			if (filterAssignedBtn) filterAssignedBtn.classList.toggle('active', state.filters.showAssigned);
			if (filterMineBtn) filterMineBtn.classList.toggle('active', state.filters.showMine);
			if (filterCompletedBtn) filterCompletedBtn.classList.toggle('active', state.filters.showCompleted);
			if (filterPriorityBtn) filterPriorityBtn.classList.toggle('active', state.filters.priorityOnly);
		}
		
		
		/**
		* Toggles the 'light-mode' class on the HTML element based on the current theme state.
		*/
		function applyTheme() {
			rootEl.classList.toggle('light-mode', state.theme === 'light');
		}
		
		/**
		* Applies the global font size from the state to the root HTML element.
		*/
		function applyFontSize() {
			rootEl.style.fontSize = `${state.fontSize}px`;
		}
		
		/**
		* Updates the tooltips for the 5 custom filler buttons on the format bar.
		*/
		function updateFillerTooltips() {
			for (let i = 1; i <= 5; i++) {
				const button = document.querySelector(`#format-panel .format-btn[data-filler="${i}"]`);
				if (button) {
					const fillerText = state.customFillers[i - 1];
					button.title = fillerText ? fillerText : '<add custom filler text>';
				}
			}
		}
		
		/**
		* Applies the current task filters to all tasks on the board, toggling their visibility.
		*/
		function applyTaskFilters() {
			document.querySelectorAll('.task-card').forEach(task => {
				const title = task.querySelector('.task-title').textContent;
				const status = task.dataset.status;
				const isAssigned = title.startsWith('@');
				const isMine = !isAssigned;
				const isCompleted = status == 0;
				const isPriority = status == 2;
		
				let shouldBeVisible;
		
				if (state.filters.priorityOnly) {
					shouldBeVisible = isPriority;
				} else {
					const isVisibleByType = (isAssigned && state.filters.showAssigned) || (isMine && state.filters.showMine);
					const isVisibleByStatus = isCompleted ? state.filters.showCompleted : true;
					
					shouldBeVisible = isVisibleByType && isVisibleByStatus;
				}
		
				task.classList.toggle('d-none', !shouldBeVisible);
			});
			
			document.querySelectorAll('.tasks-container').forEach(container => {
				const visibleTasks = container.querySelectorAll('.task-card:not(.d-none)').length;
				let placeholder = container.querySelector('.no-tasks-placeholder');
				if (visibleTasks === 0 && !placeholder) {
					placeholder = document.createElement('p');
					placeholder.className = 'text-secondary p-2 no-tasks-placeholder';
					placeholder.textContent = 'No tasks to show';
					container.appendChild(placeholder);
				} else if (visibleTasks > 0 && placeholder) {
					placeholder.remove();
				}
			});
		}
	
		// --- RENDER FUNCTIONS ---
		
		/**
		* Creates and returns a DOM element for a single task column.
		* @param {object} column The column data object from the database.
		* @returns {HTMLElement} The generated column div element.
		*/
		function createColumnElement(column) {
			const columnEl = document.createElement('div');
			columnEl.className = 'task-column card';
			columnEl.dataset.columnId = column.column_id;
			columnEl.dataset.isPrivate = column.is_private;
		
			const isChecked = column.is_private ? 'checked' : '';
		
			columnEl.innerHTML = `
				<div class="card-header d-flex justify-content-between align-items-center">
					<div class="column-header-left d-flex align-items-center">
						<button class="btn-icon move-column-left-btn" title="Move Left">&lt;</button>
						<h5 class="column-title" contenteditable="false" title="Double-click to edit">${column.column_name}</h5>
						<span class="task-count">0</span>
					</div>
					<div class="column-header-right d-flex align-items-center">
						<div class="form-check form-switch private-column-toggle" title="Mark column as private">
							<input class="form-check-input private-column-checkbox" type="checkbox" role="switch" ${isChecked}>
						</div>
						<button class="btn-icon move-column-right-btn" title="Move Right">&gt;</button>
						<button class="delete-column-btn" title="Delete Column"></button>
					</div>
				</div>
				<div class="card-body tasks-container"></div>
				<div class="card-footer">
					<form class="add-task-form">
						<div class="input-group">
							<input type="text" class="form-control" placeholder="New Task" required>
							<button class="btn btn-outline-primary" type="submit" title="Add New Task">+</button>
						</div>
					</form>
				</div>`;
			const tasksContainer = columnEl.querySelector('.tasks-container');
			tasksContainer.addEventListener('dragover', e => {
				e.preventDefault();
				const afterElement = getDragAfterElement(tasksContainer, e.clientY);
				const dragging = document.querySelector('.dragging');
				if (dragging) {
					if (afterElement == null) {
						tasksContainer.appendChild(dragging);
					} else {
						tasksContainer.insertBefore(dragging, afterElement);
					}
				}
			});
			columnEl.addEventListener('drop', e => {
				e.preventDefault();
				handleTaskDrop(e);
			});
			return columnEl;
		}
		
		/**
		* Updates the visual task count in a column's header.
		* @param {HTMLElement} columnEl The column element to update.
		*/
		function updateTaskCount(columnEl) {
			if (!columnEl) return;
			const count = columnEl.querySelectorAll('.task-card').length;
			const countEl = columnEl.querySelector('.task-count');
			if (countEl) countEl.textContent = count;
		}
		
		/**
		* Hides the navigation buttons on the first and last columns on the task board.
		*/
		function updateColumnButtonVisibility() {
			const columns = taskBoardContainer.querySelectorAll('.task-column');
			columns.forEach((col, index) => {
				const leftBtn = col.querySelector('.move-column-left-btn');
				const rightBtn = col.querySelector('.move-column-right-btn');
				if (leftBtn) leftBtn.style.visibility = (index === 0) ? 'hidden' : 'visible';
				if (rightBtn) rightBtn.style.visibility = (index === columns.length - 1) ? 'hidden' : 'visible';
			});
		}
	
		/**
		* Determines which element a dragged item should be placed before during a drag-and-drop operation.
		* @param {HTMLElement} container The container being dragged over.
		* @param {number} y The vertical position of the cursor.
		* @returns {HTMLElement|null} The element to insert before, or null to append at the end.
		*/
		function getDragAfterElement(container, y) {
			const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging), .journal-entry-card:not(.dragging)')];
			return draggableElements.reduce((closest, child) => {
				const box = child.getBoundingClientRect();
				const offset = y - box.top - box.height / 2;
				if (offset < 0 && offset > closest.offset) {
					return { offset: offset, element: child };
				} else {
					return closest;
				}
			}, { offset: Number.NEGATIVE_INFINITY }).element;
		}
	
		/**
		* Enforces the column sorting rules (Priority > Normal > Completed)
		* while preserving the user's manual sort order within each group.
		* @param {HTMLElement} columnEl The column element to sort.
		*/
		function enforceColumnSortRules(columnEl) {
			if (!columnEl) return;
			const tasksContainer = columnEl.querySelector('.tasks-container');
			
			const priorityTasks = Array.from(tasksContainer.querySelectorAll('.task-card[data-status="2"]'));
			const normalTasks = Array.from(tasksContainer.querySelectorAll('.task-card[data-status="1"]'));
			const completedTasks = Array.from(tasksContainer.querySelectorAll('.task-card[data-status="0"]'));
		
			const sortedTasks = [...priorityTasks, ...normalTasks, ...completedTasks];
		
			sortedTasks.forEach(task => tasksContainer.appendChild(task));
		}
	
		function createTaskElement(task) {
			const taskEl = document.createElement('div');
			taskEl.dataset.taskId = task.task_id;
			taskEl.dataset.status = task.status;
			taskEl.dataset.dueDate = task.due_date || '';
			taskEl.dataset.createdAt = task.created_at;
			taskEl.dataset.position = task.position;
			taskEl.dataset.encryptedData = task.encrypted_data;
		
			const isShared = !!task.is_shared;
			const isReceivedTask = !!task.owner_username;
			
			taskEl.draggable = !isReceivedTask;
		
			let taskText = "[Task Failed to Load]";
			let taskNotes = "";
			const decryptedString = decrypt(task.encrypted_data, state.encryptionKey);
			if (decryptedString && decryptedString !== "[decryption failed]") {
				try {
					const taskData = JSON.parse(decryptedString);
					taskText = taskData.task_text || "Untitled Task";
					taskNotes = taskData.task_notes || "";
				} catch (e) {
					taskText = decryptedString;
				}
			}
		
			taskEl.className = `task-card ${task.status == 0 ? 'completed' : ''} ${isShared ? 'shared-task' : ''}`;
			
			if (task.status == 2) taskEl.classList.add('priority');
			
			taskEl.dataset.notes = taskNotes;
			
			const isChecked = task.status == 0 ? 'checked' : '';
			const isCheckboxDisabled = isReceivedTask ? 'disabled' : '';
			let menuHTML = '';
			let ownerInfoHTML = '';
			let shareInfoHTML = ''; // <-- NEW: Variable for the share icon and tooltip
		
			if (isReceivedTask) {
				menuHTML = `
					<a href="#" class="task-menu-item" data-action="notes">Notes</a>
					<a href="#" class="task-menu-item" data-action="duedate">Due Date</a>
				`;
				ownerInfoHTML = `<div class="task-owner-info">From: ${task.owner_username}</div>`;
			} else {
				menuHTML = `
					<a href="#" class="task-menu-item" data-action="notes">Notes</a>
					<a href="#" class="task-menu-item" data-action="duedate">Due Date</a>
					<a href="#" class="task-menu-item" data-action="share">Share...</a>
					<a href="#" class="task-menu-item" data-action="move">Move to...</a>
					<a href="#" class="task-menu-item" data-action="duplicate">Duplicate</a>
					<a href="#" class="task-menu-item task-menu-item-delete" data-action="delete">Delete</a>
				`;
				// If the task is shared, create the icon and tooltip
				if (isShared && task.shared_with_list) {
					shareInfoHTML = `<div class="share-indicator" title="Shared with: ${task.shared_with_list}">👥</div>`;
				}
			}
		
			let formattedDueDateForDisplay = 'No due date';
			let titleSuffix = '';
			let notesHeaderHTML = '';
			const now = new Date();
			now.setHours(0,0,0,0);
			const creationDate = new Date(task.created_at);
			creationDate.setHours(0,0,0,0);
			const diffTimeCreated = Math.abs(now - creationDate);
			const daysSinceCreation = Math.ceil(diffTimeCreated / (1000 * 60 * 60 * 24));
			notesHeaderHTML += `<span>Created: ${daysSinceCreation} days ago</span>`;
			if (task.due_date) {
				const dueDate = new Date(task.due_date + 'T12:00:00');
				if (dueDate < now) taskEl.classList.add('past-due');
				const month = String(dueDate.getMonth() + 1).padStart(2, '0');
				const day = String(dueDate.getDate()).padStart(2, '0');
				const formattedDate = `${month}/${day}`;
				titleSuffix = `&nbsp;&nbsp;<span class="due-date-indicator">${formattedDate}</span>`;
				formattedDueDateForDisplay = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'long' });
				const diffTimeDue = dueDate - now;
				const daysToDue = Math.ceil(diffTimeDue / (1000 * 60 * 60 * 24));
				notesHeaderHTML += ` <span class="footer-divider">|</span> <span>Due in: ${daysToDue} days</span>`;
			}
		
			taskEl.innerHTML = `
				<div class="task-status-band"></div>
				<div class="task-card-main-content">
					<div class="task-card-content">
						<input type="checkbox" class="task-complete-checkbox" title="Mark complete" ${isChecked} ${isCheckboxDisabled}>
						<span class="task-title" contenteditable="false" title="${isReceivedTask ? 'Title cannot be edited' : 'Double-click to edit'}">${taskText}${titleSuffix}</span>
						${shareInfoHTML} <div class="task-menu-container">
							<button class="task-control-btn" data-action="toggle-menu" title="More options">...</button>
							<div class="task-menu" style="display: none;">
								${menuHTML}
							</div>
						</div>
					</div>
					${ownerInfoHTML}
					<div class="task-notes-container" style="display: none;">
						<div class="task-notes-header">${notesHeaderHTML}</div>
						<textarea class="form-control task-notes-editor" placeholder="Add notes...">${taskNotes}</textarea>
					</div>
					<div class="task-duedate-container" style="display: none;">
						<p class="due-date-display">${formattedDueDateForDisplay}</p>
						<input type="date" class="form-control task-duedate-picker" value="${task.due_date || ''}">
						<button class="btn btn-sm btn-outline-secondary clear-due-date-btn">Clear</button>
					</div>
				</div>`;
				
			if (!isReceivedTask) {
				taskEl.addEventListener('dragstart', e => {
					if (document.activeElement.isContentEditable) {
						e.preventDefault();
						return;
					}
					state.draggedTask = task;
					setTimeout(() => e.target.classList.add('dragging'), 0);
				});
				taskEl.addEventListener('dragend', () => taskEl.classList.remove('dragging'));
			}
			
			return taskEl;
		}
		
		
		/**
		* Creates and returns a DOM element for the read-only "Shared with Me" column.
		* @returns {HTMLElement} The generated column div element.
		*/
		function createSharedColumnElement() {
			const columnEl = document.createElement('div');
			// Add a specific class for styling and identification
			columnEl.className = 'task-column card shared-tasks-column';
			// Set a static ID for this special column
			columnEl.dataset.columnId = 'shared-with-me';
		
			// Note the simplified structure: no editing, moving, or privacy toggles.
			columnEl.innerHTML = `
				<div class="card-header d-flex justify-content-between align-items-center">
					<div class="column-header-left d-flex align-items-center">
						<h5 class="column-title">Shared with Me</h5>
						<span class="task-count">0</span>
					</div>
				</div>
				<div class="card-body tasks-container"></div>
				`;
			
			// The tasks container for shared tasks should not allow dropping new tasks.
			const tasksContainer = columnEl.querySelector('.tasks-container');
			tasksContainer.addEventListener('dragover', e => {
				e.preventDefault();
				e.dataTransfer.dropEffect = 'none'; // Visually indicate that dropping is not allowed
			});
		
			return columnEl;
		}
		
		/**
		 * Fetches all columns and tasks (owned and shared), then builds and renders the entire Kanban board UI.
		 */
		async function renderTaskBoard() {
			try {
				const [columnsRes, tasksRes] = await Promise.all([
					fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`),
					fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`)
				]);
		
				if (!columnsRes.ok || !tasksRes.ok) throw new Error('Failed to fetch board data.');
		
				const columns = await columnsRes.json();
				// --- MODIFIED: Read the new structured response from the API ---
				const tasksData = await tasksRes.json();
				const ownedTasks = tasksData.owned || [];
				const sharedTasks = tasksData.shared || [];
		
				// --- Render user's own columns and tasks ---
				if (columns.length === 0 && sharedTasks.length === 0) {
					taskBoardContainer.innerHTML = `
						<div class="container-fluid text-center p-5 text-secondary">
							<p class="lead">Welcome! 👋</p>
							<h4 class="mb-3">Create your first column to get started.</h4>
							<p>Use the "New Column..." form in the header above.</p>
						</div>`;
					return;
				}
		
				const tasksByColumn = {};
				ownedTasks.forEach(task => {
					if (!tasksByColumn[task.column_id]) tasksByColumn[task.column_id] = [];
					tasksByColumn[task.column_id].push(task);
				});
		
				taskBoardContainer.innerHTML = ''; // Clear the container
		
				columns.forEach(column => {
					const columnEl = createColumnElement(column);
					taskBoardContainer.appendChild(columnEl);
					const tasksContainer = columnEl.querySelector('.tasks-container');
					(tasksByColumn[column.column_id] || []).forEach(task => {
						tasksContainer.appendChild(createTaskElement(task));
					});
					enforceColumnSortRules(columnEl);
					updateTaskCount(columnEl);
				});
		
				// --- Render the "Shared with Me" column ONLY with tasks shared by others ---
				if (sharedTasks.length > 0) {
					const sharedColumnEl = createSharedColumnElement();
					const sharedTasksContainer = sharedColumnEl.querySelector('.tasks-container');
					
					sharedTasks.forEach(task => {
						sharedTasksContainer.appendChild(createTaskElement(task));
					});
					
					taskBoardContainer.appendChild(sharedColumnEl);
					updateTaskCount(sharedColumnEl);
				}
		
				updateColumnButtonVisibility();
				applyTaskFilters();
		
			} catch (error) {
				console.error("Error rendering task board:", error);
				taskBoardContainer.innerHTML = `<p class="text-danger">Could not load board. Please try again later.</p>`;
			}
		}
		
		/**
		 * Fetches all journal entries for the currently displayed date range and renders the journal board UI.
		 */
		async function renderJournalBoard() {
			journalBoardContainer.innerHTML = `<p class="text-secondary p-3">Loading journal...</p>`;
		
			// --- NEW LOGIC START ---
			// If skip weekends is on, and the current date is a weekend, jump to the next Monday.
			if (state.skipWeekends) {
				const dayOfWeek = state.currentJournalDate.getDay(); // 0=Sun, 6=Sat
				if (dayOfWeek === 6) { // If it's Saturday
					// Advance the date by 2 days to get to Monday
					state.currentJournalDate.setDate(state.currentJournalDate.getDate() + 2);
				} else if (dayOfWeek === 0) { // If it's Sunday
					// Advance the date by 1 day to get to Monday
					state.currentJournalDate.setDate(state.currentJournalDate.getDate() + 1);
				}
			}
			// --- NEW LOGIC END ---
		
			const hidePrivateClass = state.filters.hidePrivate ? 'hide-private' : '';
			const privateOnlyClass = state.filters.privateViewOnly ? 'private-only-mode' : '';
			journalBoardContainer.className = `d-flex flex-nowrap overflow-auto column-count-${state.journalColumnCount} ${hidePrivateClass} ${privateOnlyClass}`;
		
			const numCols = state.journalColumnCount;
			const centerIndex = Math.floor(numCols / 2);
			let dateRange = [];
			for (let i = 0; i < numCols; i++) {
				const offset = i - centerIndex;
				let tempDate = new Date(state.currentJournalDate);
				if (offset < 0) {
					for(let j=0; j < Math.abs(offset); j++) tempDate = getOffsetDate(tempDate, -1);
				} else if (offset > 0) {
					for(let j=0; j < offset; j++) tempDate = getOffsetDate(tempDate, 1);
				}
				dateRange[i] = tempDate;
			}
			const dateStrings = dateRange.map(formatDate);
			const firstDate = dateStrings[0];
			const lastDate = dateStrings[dateStrings.length - 1];
			try {
				const res = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php?start_date=${firstDate}&end_date=${lastDate}`);
				if (!res.ok) throw new Error('Failed to fetch journal entries.');
				const entries = await res.json();
				const entriesByDate = {};
				entries.forEach(entry => {
					if (!entriesByDate[entry.entry_date]) entriesByDate[entry.entry_date] = [];
					entriesByDate[entry.entry_date].push(entry);
				});
				journalBoardContainer.innerHTML = '';
				dateRange.forEach((dateObj, index) => {
					const dateStr = formatDate(dateObj);
					const entriesForDate = entriesByDate[dateStr] || [];
					const isCenter = (index === centerIndex);
					const columnEl = createJournalColumnElement(dateObj, entriesForDate, index, numCols, isCenter);
					journalBoardContainer.appendChild(columnEl);
				});
			} catch (error) {
				journalBoardContainer.innerHTML = `<p class="text-danger">Could not load journal. ${error.message}</p>`;
			}
		}
	
		/**
		* Creates and returns a DOM element for a single journal column.
		* @param {Date} dateObj The date for this column.
		* @param {Array} entries An array of entry objects for this date.
		* @param {number} index The column's index in the display.
		* @param {number} totalCols The total number of columns being displayed.
		* @param {boolean} isCenter Whether this is the visually distinct center column.
		* @returns {HTMLElement} The generated column div element.
		*/
		function createJournalColumnElement(dateObj, entries, index, totalCols, isCenter = false) {
			const columnEl = document.createElement('div');
			const dateStr = formatDate(dateObj);
			columnEl.className = `task-column card journal-column ${isCenter ? 'is-center' : ''}`;
			columnEl.dataset.date = dateStr;
		
			let eventLabelsHTML = '';
			// MODIFIED: This filter now also checks against the user's preferences
			const matchingEvents = state.calendarEvents.filter(event => {
				const dateMatch = dateStr >= event.start_date && dateStr <= event.end_date;
				// Also check if the event's type is in the user's set of visible calendars
				const isVisible = state.visibleCalendars.has(event.event_type);
				return dateMatch && isVisible;
			});
		
			if (matchingEvents.length > 0) {
				const labels = matchingEvents.map(event => 
					`<span class="calendar-event-label" title="${event.event_type}">${event.label}</span>`
				).join('');
				eventLabelsHTML = `<div class="event-labels-container">${labels}</div>`;
			}
			
			let prevButton = '';
			let nextButton = '';
			if (totalCols === 1) {
				prevButton = `<button class="journal-nav-btn prev-btn" data-direction="prev" title="Previous Day">&lt;</button>`;
				nextButton = `<button class="journal-nav-btn next-btn" data-direction="next" title="Next Day">&gt;</button>`;
			} else {
				if (index === 0) {
					prevButton = `<button class="journal-nav-btn prev-btn" data-direction="prev" title="Previous Day">&lt;</button>`;
				}
				if (index === totalCols - 1) {
					nextButton = `<button class="journal-nav-btn next-btn" data-direction="next" title="Next Day">&gt;</button>`;
				}
			}
			const formattedHeader = formatDateWithDay(dateObj);
			const weekendClass = (dateObj.getDay() === 0 || dateObj.getDay() === 6) ? 'is-weekend' : '';
		
			columnEl.innerHTML = `
				<div class="card-header journal-column-header">
					${prevButton || '<div></div>'}
					<div class="journal-header-content">
						<h5 class="${weekendClass}">${formattedHeader}</h5>
						${eventLabelsHTML}
					</div>
					${nextButton || '<div></div>'}
				</div>
				<div class="card-body journal-entries-container">
					${entries.length === 0 ? '<p class="text-secondary p-2">No entries to show</p>' : ''}
				</div>
				<div class="card-footer">
					<form class="add-journal-entry-form" data-date="${dateStr}">
						<div class="input-group">
							<input type="text" class="form-control" placeholder="New Entry..." required>
							<button class="btn btn-outline-primary" type="submit" title="Add New Entry">+</button>
						</div>
					</form>
				</div>`;
			const entriesContainer = columnEl.querySelector('.journal-entries-container');
			entries.forEach(entry => {
				entriesContainer.appendChild(createJournalEntryElement(entry));
			});
			entriesContainer.addEventListener('dragover', e => {
				e.preventDefault();
				const placeholder = entriesContainer.querySelector('p.text-secondary');
				if (placeholder) placeholder.remove();
				const afterElement = getDragAfterElement(entriesContainer, e.clientY);
				const dragging = document.querySelector('.dragging');
				if (dragging) {
					if (afterElement == null) entriesContainer.appendChild(dragging);
					else entriesContainer.insertBefore(dragging, afterElement);
				}
			});
			entriesContainer.addEventListener('drop', e => {
				e.preventDefault();
				handleJournalDrop(e);
			});
			return columnEl;
		}
	
		/**
		* Creates and returns a DOM element for a single journal entry card.
		* @param {object} entry The journal entry data object from the database.
		* @returns {HTMLElement} The generated entry card div element.
		*/
		function createJournalEntryElement(entry) {
			const entryEl = document.createElement('div');
			entryEl.className = 'journal-entry-card';
			entryEl.dataset.entryId = entry.entry_id;
			entryEl.dataset.date = entry.entry_date;
			entryEl.dataset.encryptedData = entry.encrypted_data;
		
			entryEl.dataset.isPrivate = entry.is_private ?? 0;
		
			entryEl.draggable = true;
			let entryTitle = "New Entry",
				entryNotes = "";
			const decryptedString = decrypt(entry.encrypted_data, state.encryptionKey);
			if (decryptedString !== "[decryption failed]") {
				try {
					const entryData = JSON.parse(decryptedString);
					entryTitle = entryData.entry_title || "New Entry";
					entryNotes = entryData.entry_notes || "";
				} catch (e) {
					entryTitle = decryptedString;
				}
			}
			// This existing logic correctly adds our .has-notes class, which we'll use in the CSS
			if (typeof entryNotes === 'string' && entryNotes.trim() !== '' && entryNotes.trim() !== '<p><br></p>') {
				entryEl.classList.add('has-notes');
			}
			
			const privateToggleText = (entry.is_private == 1) ? 'Make Public' : 'Make Private';
		
			// UPDATED: The HTML structure for the card
			entryEl.innerHTML = `
				<div class="entry-header">
					<span class="entry-title" contenteditable="false" title="Double-click to edit">${entryTitle}</span>
					<span class="entry-notes-icon" title="Has Notes">📝</span>
					<div class="task-menu-container">
						<button class="task-control-btn" data-action="toggle-menu" title="More options">...</button>
						<div class="task-menu" style="display: none;">
							<a href="#" class="task-menu-item" data-action="notes">Notes</a>
							<a href="#" class="task-menu-item" data-action="toggle-private">${privateToggleText}</a>
							<a href="#" class="task-menu-item" data-action="duplicate">Duplicate</a>
							<a href="#" class="task-menu-item task-menu-item-delete" data-action="delete">Delete</a>
						</div>
					</div>
				</div>
				<div class="journal-entry-indicator-bar"></div>`;
		
			entryEl.addEventListener('dragstart', (e) => {
				if (document.activeElement.isContentEditable) {
					e.preventDefault();
					return;
				}
				state.draggedJournalEntry = entry;
				setTimeout(() => e.target.classList.add('dragging'), 0);
			});
			entryEl.addEventListener('dragend', () => entryEl.classList.remove('dragging'));
			return entryEl;
		}
	
		/**
		* Fetches a single journal entry by its ID and opens it in the editor.
		* @param {number} entryId The ID of the journal entry to open.
		*/
		async function openEditorById(entryId) {
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php?entry_id=${entryId}`);
				if (!response.ok) throw new Error('Could not fetch entry data.');
				const entryData = await response.json();
				openEditorMode(entryData);
			} catch (error) {
				alert('Failed to load the selected journal entry.');
			}
		}

		
		/**
		 * Opens the full-screen editor view for a given journal entry.
		 * @param {object} entryData The full data object for the journal entry.
		 */
		async function openEditorMode(entryData) {
			const columnSelect = document.querySelector('#editor-task-column-select');
			columnSelect.innerHTML = ''; 
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`);
				const columns = await response.json();
				if (columns.length === 0) {
					columnSelect.disabled = true;
					columnSelect.innerHTML = '<option>No columns found</option>';
				} else {
					columnSelect.disabled = false;
					columns.forEach(column => {
						const option = document.createElement('option');
						option.value = column.column_id;
						option.textContent = column.column_name;
						columnSelect.appendChild(option);
					});
				}
			} catch (error) {
				console.error("Failed to fetch columns for dropdown.", error);
				columnSelect.disabled = true;
				columnSelect.innerHTML = '<option>Error loading columns</option>';
			}
			
			state.activeEditor.entryData = entryData;
			const decryptedString = decrypt(entryData.encrypted_data, state.encryptionKey);
			let entryContent = {
				entry_title: "New Note",
				entry_notes: ""
			};
			if (decryptedString && decryptedString !== "[decryption failed]") {
				try {
					entryContent = JSON.parse(decryptedString);
				} catch (e) {
					entryContent.entry_title = decryptedString;
				}
			}
			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = entryContent.entry_notes || "";
			const plainTextNotes = tempDiv.textContent || tempDiv.innerText || "";
			const dateObj = new Date(entryData.entry_date + 'T12:00:00');
			
			// REMOVED: The following lines that format and display the date are no longer needed.
			// const formattedDate = formatDateWithDay(dateObj);
			// const weekendClass = (dateObj.getDay() === 0 || dateObj.getDay() === 6) ? 'is-weekend' : '';
			// editorModeDatePrefix.innerHTML = `<span class="${weekendClass}">[ ${formattedDate} ]</span>`;
			editorModeDatePrefix.innerHTML = ''; // Explicitly clear the date prefix
		
			editorModeTitleText.textContent = entryContent.entry_title;
			const editorTextarea = document.querySelector('#editor-mode-editor');
			editorTextarea.value = plainTextNotes;
			
			const journalSearchResultsContainer = document.querySelector('#journal-search-results-container');
			if (journalSearchResultsContainer) {
				journalSearchResultsContainer.innerHTML = '';
				journalSearchResultsContainer.classList.add('d-none');
			}
			editorTextarea.classList.remove('d-none');
			mainAppContainer.classList.add('hidden');
			editorModeContainer.classList.remove('d-none');
		
			applyEditorFontSize();
		
			editorTextarea.focus();
		
			editorTextarea.selectionStart = 0;
			editorTextarea.selectionEnd = 0;
		
			updateEditorCounters();
		
			const lastUpdatedEl = document.querySelector('#editor-last-updated');
			if (lastUpdatedEl && entryData.updated_at) {
				const lastUpdatedDate = new Date(entryData.updated_at);
				lastUpdatedEl.textContent = `Prior save: ${lastUpdatedDate.toLocaleString()}`;
			}
		
			const autoSaveStatusEl = document.querySelector('#editor-auto-save-status');
			if (autoSaveStatusEl) {
				autoSaveStatusEl.textContent = 'No changes in this session.';
			}
		
			if (state.activeEditor.autoSaveTimerId) {
				clearInterval(state.activeEditor.autoSaveTimerId);
			}
			state.activeEditor.lastSavedContent = editorTextarea.value;
			state.activeEditor.autoSaveTimerId = setInterval(autoSaveNote, 60000);
		}
	
		/**
		* Saves the current content of the editor (title and notes) to the database.
		*/
		async function saveCurrentEditorNote() {
			if (!state.activeEditor.entryData) return;
			const editorTextarea = document.querySelector('#editor-mode-editor');
			const updatedContent = {
				entry_title: editorModeTitleText.textContent,
				entry_notes: editorTextarea.value
			};
			const encryptedData = encrypt(JSON.stringify(updatedContent), state.encryptionKey);
			if (!encryptedData) return alert("Encryption failed.");
			await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					entry_id: state.activeEditor.entryData.entry_id,
					encrypted_data: encryptedData
				})
			});
		}
		
		/**
		 * Checks if the note in the editor has changed and saves it. Called by a timer.
		 */
		async function autoSaveNote() {
			if (!state.activeEditor.entryData) return;
		
			const editorTextarea = document.querySelector('#editor-mode-editor');
			const currentContent = editorTextarea.value;
		
			if (currentContent !== state.activeEditor.lastSavedContent) {
				if (window.APP_CONFIG && window.APP_CONFIG.debug) {
					console.log(`Auto-saving note at ${new Date().toLocaleTimeString()}...`);
				}
		
				await saveCurrentEditorNote();
		
				state.activeEditor.lastSavedContent = currentContent;
		
				showToastNotification("Note auto-saved", 2000);
		
				const autoSaveStatusEl = document.querySelector('#editor-auto-save-status');
				if (autoSaveStatusEl) {
					const now = new Date();
					const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
					// UPDATED: Changed text to your preferred wording.
					autoSaveStatusEl.textContent = `Current changes saved: ${timeString}`;
				}
			}
		}
	
		/**
		* Closes the full-screen editor, saving the note and returning to the previous view.
		*/
		async function closeEditorMode() {
			if (state.activeEditor.autoSaveTimerId) {
				clearInterval(state.activeEditor.autoSaveTimerId);
			}
			state.activeEditor.autoSaveTimerId = null;
			state.activeEditor.lastSavedContent = '';
		
			if (!state.activeEditor.entryData) return;
			
			await saveCurrentEditorNote();
			
			state.activeEditor.entryData = null;
			editorModeContainer.classList.add('d-none');
			mainAppContainer.classList.remove('hidden');
			
			if (state.currentView === 'journal') {
				renderJournalBoard();
			}
		}
	
		/**
		* Renders a list of search result items into a specified container.
		* @param {Array} entries The array of matching entry objects.
		* @param {HTMLElement} container The DOM element to render the results into.
		*/
		function renderSearchResults(entries, container) {
			if (!container) return;
			container.innerHTML = '';
			if (entries.length === 0) {
				container.innerHTML = '<p class="text-secondary p-3">No matching entries found.</p>';
				return;
			}
			entries.forEach(entry => {
				const resultEl = document.createElement('div');
				resultEl.className = 'search-result-item';
				resultEl.dataset.entryId = entry.entry_id;
				const title = entry.decrypted_data.entry_title || 'Untitled';
				const notes = entry.decrypted_data.entry_notes || '';
				const snippet = (notes.replace(/<[^>]+>/g, '')).substring(0, 150) + '...';
				const dateObj = new Date(entry.entry_date + 'T12:00:00');
				const formattedDate = dateObj.toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
				resultEl.innerHTML = `
					<div class="search-result-header">
						<span class="search-result-title">${title}</span>
						<span class="search-result-date">${formattedDate}</span>
					</div>
					<p class="search-result-snippet">${snippet}</p>
					<div class="search-result-full-content" style="display: none;">${notes}</div>
				`;
				container.appendChild(resultEl);
			});
		}
	
		/**
		* Performs a client-side search of journal entries.
		* @param {string} term The search keyword.
		* @param {string} range The date range ('7d', '30d', '1y', 'all').
		* @param {HTMLElement} resultsContainer The container to display results in.
		*/
		async function performJournalSearch(term, range, resultsContainer) {
			if (!term) return;
			term = term.trim().toLowerCase();
			resultsContainer.innerHTML = '<p class="text-secondary p-3">Searching...</p>';
			try {
				if (state.journalEntriesCache.length === 0) {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/search.php`);
					if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
					state.journalEntriesCache = await response.json();
				}
				let entries_in_range = state.journalEntriesCache;
				if (range !== 'all') {
					const now = new Date();
					let days_to_subtract = 0;
					if (range === '7d') days_to_subtract = 7;
					if (range === '30d') days_to_subtract = 30;
					if (range === '1y') days_to_subtract = 365;
					const cutoffDate = new Date();
					cutoffDate.setDate(now.getDate() - days_to_subtract);
					entries_in_range = state.journalEntriesCache.filter(entry => new Date(entry.entry_date) >= cutoffDate);
				}
				const matching_entries = [];
				for (const entry of entries_in_range) {
					const decryptedString = decrypt(entry.encrypted_data, state.encryptionKey);
					if (decryptedString && decryptedString !== "[decryption failed]") {
						try {
							const data = JSON.parse(decryptedString);
							const title = (data.entry_title || '').toLowerCase();
							if (title.includes(term)) {
								entry.decrypted_data = data;
								matching_entries.push(entry);
							}
						} catch (e) {
							continue;
						}
					}
				}
				renderSearchResults(matching_entries, resultsContainer);
			} catch (error) {
				console.error("Search failed:", error);
				resultsContainer.innerHTML = '<p class="text-danger p-3">Search request failed.</p>';
			}
		}
	
		// --- EVENT HANDLERS ---
		
	/**
	 * Main event listener for the editor format bar and its responsive controls.
	 */
	const formatPanel = document.querySelector('#format-panel');
	if (formatPanel) {
		// This first listener handles clicks on ANY of the format buttons (e.g., Bold, Frame, Calculate)
		formatPanel.addEventListener('click', e => {
			const button = e.target.closest('.format-btn');
			if (!button) return;
	
			const editor = document.querySelector('#editor-mode-editor');
			const {
				insert,
				filler,
				listStyle,
				action,
				case: caseType
			} = button.dataset;
	
			const insertTextAtCursor = (text) => {
				const start = editor.selectionStart;
				const end = editor.selectionEnd;
				editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
				editor.selectionStart = editor.selectionEnd = start + text.length;
				editor.focus();
			};
	
			const modifySelectedText = (transform) => {
				const start = editor.selectionStart;
				const end = editor.selectionEnd;
				if (start === end && !['cleanup', 'calculate'].includes(action)) return;
				const textToTransform = (action === 'cleanup') ? editor.value : editor.value.substring(start, end);
				if (!textToTransform && action === 'calculate') return;
				const transformedText = transform(textToTransform);
				const before = editor.value.substring(0, start);
				const after = editor.value.substring(end);
				editor.value = before + transformedText + after;
				editor.selectionStart = start;
				editor.selectionEnd = start + transformedText.length;
				editor.focus();
			};
	
			if (insert) {
				insertTextAtCursor(insert + ' ');
			} else if (filler) {
				const fillerIndex = parseInt(filler) - 1;
				if (state.customFillers && state.customFillers[fillerIndex]) {
					insertTextAtCursor(state.customFillers[fillerIndex]);
				}
			} else if (listStyle) {
				modifySelectedText(text => {
					const lines = text.split('\n');
					const cleanedLines = lines.map(line => line.replace(/^(⊙ |› |[0-9]+\. )/, ''));
					if (listStyle === 'remove') return cleanedLines.join('\n');
					if (listStyle === '1.') return cleanedLines.map((line, i) => `${i + 1}. ${line}`).join('\n');
					return cleanedLines.map(line => `${listStyle} ${line}`).join('\n');
				});
			} else if (caseType) {
				modifySelectedText(text => {
					if (caseType === 'upper') return text.toUpperCase();
					if (caseType === 'lower') return text.toLowerCase();
					if (caseType === 'title') return text.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
					return text;
				});
			} else if (action === 'frame-single' || action === 'frame-double') {
				const start = editor.selectionStart;
				const end = editor.selectionEnd;
				if (start === end || editor.value.substring(start, end).includes('\n')) return;
				const selection = editor.value.substring(start, end);
				const chars = (action === 'frame-single') 
					? { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' }
					: { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' };
				const lineLength = selection.length + 2;
				const top = chars.tl + chars.h.repeat(lineLength) + chars.tr;
				const middle = chars.v + ' ' + selection + ' ' + chars.v;
				const bottom = chars.bl + chars.h.repeat(lineLength) + chars.br;
				const before = editor.value.substring(0, start);
				const after = editor.value.substring(end);
				const prefix = (before.endsWith('\n') || before === '') ? '' : '\n';
				const suffix = (after.startsWith('\n') || after === '') ? '' : '\n';
				const framedText = `${prefix}${top}\n${middle}\n${bottom}${suffix}`;
				editor.value = before + framedText + after;
				editor.focus();
				editor.selectionStart = editor.selectionEnd = start + framedText.length - suffix.length;
			} else if (action === 'calculate') {
				const start = editor.selectionStart;
				const end = editor.selectionEnd;
				if (start === end) return;
				const text = editor.value.substring(start, end);
				let resultText;
				try {
					let expression = text.trim().replace(/x/g, '*').replace(/ˆ/g, '^').replace(/√\s*([\d\.]+)/g, 'sqrt($1)');
					const result = math.evaluate(expression);
					const formattedResult = (Number.isInteger(result)) ? result : parseFloat(result.toFixed(4));
					resultText = `${text} = ${formattedResult}`;
				} catch (err) {
					resultText = `${text} = NA`;
				}
				const before = editor.value.substring(0, start);
				const after = editor.value.substring(end);
				editor.value = before + resultText + after;
				editor.selectionStart = start;
				editor.selectionEnd = start + resultText.length;
				editor.focus();
			} else if (action === 'underline') {
				const start = editor.selectionStart;
				const end = editor.selectionEnd;
				if (start === end || editor.value.substring(start, end).includes('\n')) return;
				let lineStartIndex = start;
				while (lineStartIndex > 0 && editor.value[lineStartIndex - 1] !== '\n') lineStartIndex--;
				let lineEndIndex = end;
				while (lineEndIndex < editor.value.length && editor.value[lineEndIndex] !== '\n') lineEndIndex++;
				const columnStart = start - lineStartIndex;
				const selectionLength = end - start;
				const padding = ' '.repeat(columnStart);
				const underline = '-'.repeat(selectionLength);
				const textToInsert = `\n${padding}${underline}`;
				editor.value = editor.value.substring(0, lineEndIndex) + textToInsert + editor.value.substring(lineEndIndex);
				editor.focus();
				editor.selectionStart = editor.selectionEnd = end;
			// NEW: Logic for timestamp and horizontal rule buttons
			} else if (action === 'timestamp') {
				const timestamp = new Date().toLocaleString();
				insertTextAtCursor(timestamp + ' ');
			} else if (action === 'horizontal-rule') {
				insertTextAtCursor('\n\n------------------------------------\n\n');
			} else if (action === 'cleanup') {
				modifySelectedText(text => {
					let cleanedText = text.replace(/ +/g, ' ').split('\n').map(line => line.trim()).join('\n');
					cleanedText = cleanedText.replace(/ \./g, '.').replace(/ ,/g, ',');
					cleanedText = cleanedText.replace(/\.(?! |$|\n)/g, '. ').replace(/,(?! |$|\n)/g, ', ');
					cleanedText = cleanedText.replace(/^(\* |- )/gm, '⊙ ').replace(/^> ?/gm, '');
					return cleanedText.replace(/\n{3,}/g, '\n\n');
				});
			} else if (action === 'editor-font-decrease' || action === 'editor-font-increase') {
				const change = (action === 'editor-font-decrease') ? -1 : 1;
				const newSize = state.editorFontSize + change;
				if (newSize >= 10 && newSize <= 32) {
					state.editorFontSize = newSize;
					applyEditorFontSize();
					savePreference('editor_font_size_px', state.editorFontSize);
				}
			}
			
			updateEditorCounters();
		});
	
		// This second listener handles the responsive "more options" functionality
		formatPanel.addEventListener('click', (e) => {
			// Ignore clicks on actual format buttons
			if (e.target.closest('.format-btn')) return;
	
			// If the click was on the panel's background, toggle its expanded state
			formatPanel.classList.toggle('is-expanded');
		});
	}
		
		/**
		* Event listener for the Change Password form in the settings modal.
		* Handles the two-stage re-encryption process.
		*/
		const changePasswordForm = document.querySelector('#change-password-form');
		if (changePasswordForm) {
			changePasswordForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				
				const currentPassword = document.querySelector('#current-password').value;
				const newPassword = document.querySelector('#new-password').value;
				const confirmPassword = document.querySelector('#confirm-password').value;
				const messageDiv = document.querySelector('#change-password-message');
		
				messageDiv.textContent = '';
				messageDiv.className = '';
		
				if (!currentPassword || !newPassword || !confirmPassword) {
					messageDiv.textContent = 'Please fill in all fields.';
					messageDiv.className = 'alert alert-danger p-2';
					return;
				}
		
				if (newPassword !== confirmPassword) {
					messageDiv.textContent = 'New passwords do not match.';
					messageDiv.className = 'alert alert-danger p-2';
					return;
				}
				
				// STAGE 1: Verify current password and fetch all data
				try {
					messageDiv.textContent = 'Verifying password and fetching data...';
					messageDiv.className = 'alert alert-info p-2';
		
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/auth.php?action=change_password`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ currentPassword })
					});
		
					const result = await response.json();
		
					if (result.success) {
						// STAGE 2: Data fetched, now re-encrypt on the client-side.
						messageDiv.textContent = 'Password verified. Re-encrypting data, please wait...';
						
						const { tasks, journal_entries } = result.data;
						const reEncryptedTasks = [];
						const reEncryptedJournalEntries = [];
		
						// Re-encrypt all tasks
						for (const task of tasks) {
							const decrypted = decrypt(task.encrypted_data, currentPassword);
							if (decrypted === '[decryption failed]') throw new Error(`Decryption failed for task ID ${task.task_id}`);
							const reEncrypted = encrypt(decrypted, newPassword);
							reEncryptedTasks.push({ task_id: task.task_id, encrypted_data: reEncrypted });
						}
		
						// Re-encrypt all journal entries
						for (const entry of journal_entries) {
							const decrypted = decrypt(entry.encrypted_data, currentPassword);
							if (decrypted === '[decryption failed]') throw new Error(`Decryption failed for entry ID ${entry.entry_id}`);
							const reEncrypted = encrypt(decrypted, newPassword);
							reEncryptedJournalEntries.push({ entry_id: entry.entry_id, encrypted_data: reEncrypted });
						}
		
						// STAGE 3: Send all re-encrypted data back to the server to be updated
						const updateResponse = await fetch(`${window.APP_CONFIG.appUrl}/api/auth.php?action=re_encrypt_and_update`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								newPassword: newPassword,
								tasks: reEncryptedTasks,
								journal_entries: reEncryptedJournalEntries
							})
						});
		
						const updateResult = await updateResponse.json();
		
						if (updateResult.success) {
							// CRITICAL: Update the key in the current session
							state.encryptionKey = newPassword;
							sessionStorage.setItem('encryptionKey', newPassword);
							
							messageDiv.textContent = 'Password and all data updated successfully!';
							messageDiv.className = 'alert alert-success p-2';
							changePasswordForm.reset();
						} else {
							throw new Error(updateResult.message || 'Failed to save re-encrypted data.');
						}
		
					} else {
						// This handles the "Incorrect current password" error from the server
						messageDiv.textContent = result.message;
						messageDiv.className = 'alert alert-danger p-2';
					}
				} catch (error) {
					console.error('Password change process failed:', error);
					messageDiv.textContent = `A critical error occurred: ${error.message}`;
					messageDiv.className = 'alert alert-danger p-2';
				}
			});
		}
		
		
		
		
		/**
		* Event listener for the main "Hide Private" toggle in the footer.
		*/
		const togglePrivateBtn = document.querySelector('#toggle-private-columns-btn');
		if (togglePrivateBtn) {
			togglePrivateBtn.addEventListener('click', () => {
				state.filters.hidePrivate = !state.filters.hidePrivate;
				togglePrivateBtn.classList.toggle('active', state.filters.hidePrivate);
				
				taskBoardContainer.classList.toggle('hide-private', state.filters.hidePrivate);
				journalBoardContainer.classList.toggle('hide-private', state.filters.hidePrivate);
		
				savePreference('hide_private', state.filters.hidePrivate);
			});
		}
		
		/**
		* Adds event listeners to the document to reset the session inactivity timer upon user activity.
		*/
		['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
			document.addEventListener(event, resetSessionTimer);
		});
		
		/**
		* Event listener for the session timeout dropdown in the settings modal.
		*/
		const sessionTimeoutSelect = document.querySelector('#session-timeout-select');
		if (sessionTimeoutSelect) {
			sessionTimeoutSelect.addEventListener('change', (e) => {
				const newTimeout = parseInt(e.target.value, 10);
				state.sessionTimeoutMinutes = newTimeout;
				savePreference('session_timeout_minutes', newTimeout);
				resetSessionTimer();
			});
		}
		
		/**
		* Main event listener for the settings modal, handling various preference changes.
		*/
		const settingsModal = document.querySelector('#settings-modal');
		if (settingsModal) {
			settingsModal.addEventListener('click', (e) => {
				const target = e.target;
				const action = target.dataset.action;
		
				if (action === 'toggle-help') {
					const helpModal = document.querySelector('#help-modal');
					settingsModal.classList.add('hidden');
					if (helpModal) {
						helpModal.classList.remove('hidden');
					}
				}
			});
		
			settingsModal.addEventListener('change', e => {
				const target = e.target;
				
				if (target.matches('[data-filler-id]')) {
					const fillerInputs = settingsModal.querySelectorAll('[data-filler-id]');
					const fillerValues = Array.from(fillerInputs).map(input => input.value);
					
					state.customFillers = fillerValues;
					savePreference('custom_fillers', fillerValues);
		
					updateFillerTooltips();
				
				} else if (target.id === 'private-view-only-toggle') {
					const isEnabled = target.checked;
					
					state.filters.privateViewOnly = isEnabled;
					savePreference('private_view_only', isEnabled);
		
					togglePrivateBtn.disabled = isEnabled;
					
					taskBoardContainer.classList.toggle('private-only-mode', isEnabled);
					journalBoardContainer.classList.toggle('private-only-mode', isEnabled);
		
					if (isEnabled) {
						taskBoardContainer.classList.remove('hide-private');
						journalBoardContainer.classList.remove('hide-private');
					}
				}
			});
		}
		
		/**
		 * Renders the list of contact aliases into the Settings panel UI.
		 */
		function renderContactAliases() {
			const container = document.querySelector('#contact-alias-list');
			if (!container) return;
		
			const aliases = state.contact_aliases || {};
			// Sort aliases alphabetically for a consistent order
			const sortedAliases = Object.keys(aliases).sort();
		
			if (sortedAliases.length === 0) {
				container.innerHTML = `<p class="text-secondary small ps-1">No contacts saved yet.</p>`;
				return;
			}
		
			// Build the HTML for each contact row
			const aliasRowsHtml = sortedAliases.map(alias => {
				const email = aliases[alias];
				return `
					<div class="d-flex gap-2 mb-2 alias-row">
						<input type="text" class="form-control form-control-sm alias-key" placeholder="Alias" value="${alias}">
						<input type="email" class="form-control form-control-sm alias-value" placeholder="Email Address" value="${email}">
						<button class="btn btn-sm btn-outline-danger delete-alias-btn" title="Delete Alias">&times;</button>
					</div>
				`;
			}).join('');
		
			container.innerHTML = aliasRowsHtml;
		}
		
		
		/**
		* Event listener for the theme toggle buttons (Dark/Light).
		*/
		const themeToggleGroup = document.querySelector('#theme-toggle-group');
		if (themeToggleGroup) {
			themeToggleGroup.addEventListener('click', (e) => {
				const target = e.target.closest('button');
				if (!target) return;
		
				const newTheme = target.dataset.theme;
				if (newTheme && newTheme !== state.theme) {
					state.theme = newTheme;
					applyTheme();
					savePreference('theme', newTheme);
					
					themeToggleGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
					target.classList.add('active');
				}
			});
		}
		
		/**
		* Event listener for the sound effects toggle in settings.
		*/
		const soundToggle = document.querySelector('#sound-toggle');
		if (soundToggle) {
			soundToggle.addEventListener('change', (e) => {
				state.soundEffectsEnabled = e.target.checked;
				savePreference('sound_effects_enabled', state.soundEffectsEnabled);
			});
		}
		
		/**
		 * REVISED & CONSOLIDATED: Event listeners to control the slide-out side menu.
		 */
		const sideMenu = document.querySelector('#side-menu');
		const sideMenuToggleBtn = document.querySelector('#side-menu-toggle-btn');
		const sideMenuCloseBtn = document.querySelector('#side-menu-close-btn');
		
		if (sideMenu && sideMenuToggleBtn && sideMenuCloseBtn) {
		
			// Listener for the sandwich icon in the header to open the menu
			sideMenuToggleBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				sideMenu.classList.add('show');
				renderContactAliases();
			});
		
			// Listener for the 'x' button inside the menu to close it
			sideMenuCloseBtn.addEventListener('click', () => {
				sideMenu.classList.remove('show');
			});
		
			// Listener for clicks INSIDE the menu to handle specific actions
			sideMenu.addEventListener('click', async (e) => {
				const target = e.target;
		
				// --- CONTACT ALIAS MANAGEMENT START ---
				if (target.id === 'add-alias-row-btn') {
					const listContainer = document.querySelector('#contact-alias-list');
					if (listContainer) {
						const placeholder = listContainer.querySelector('p');
						if (placeholder) placeholder.remove();
						const newRowHtml = `
							<div class="d-flex gap-2 mb-2 alias-row">
								<input type="text" class="form-control form-control-sm alias-key" placeholder="Alias">
								<input type="email" class="form-control form-control-sm alias-value" placeholder="Email Address">
								<button class="btn btn-sm btn-outline-danger delete-alias-btn" title="Delete Alias">&times;</button>
							</div>
						`;
						listContainer.insertAdjacentHTML('beforeend', newRowHtml);
						listContainer.querySelector('.alias-row:last-child .alias-key').focus();
					}
					return;
				}
		
				if (target.classList.contains('delete-alias-btn')) {
					target.closest('.alias-row')?.remove();
					return;
				}
		
				if (target.id === 'save-aliases-btn') {
					const aliasRows = document.querySelectorAll('#contact-alias-list .alias-row');
					const messageDiv = document.querySelector('#alias-message');
					const newAliases = {};
					const usedAliases = new Set();
					let isValid = true;
					messageDiv.textContent = '';
					messageDiv.className = 'mt-3';
					aliasRows.forEach(row => {
						const aliasInput = row.querySelector('.alias-key');
						const emailInput = row.querySelector('.alias-value');
						const alias = aliasInput.value.trim().toLowerCase();
						const email = emailInput.value.trim();
						aliasInput.classList.remove('is-invalid');
						emailInput.classList.remove('is-invalid');
						if (!alias && !email) return;
						if (!alias || !email || usedAliases.has(alias) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
							isValid = false;
							if (!alias) aliasInput.classList.add('is-invalid');
							if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) emailInput.classList.add('is-invalid');
							if (usedAliases.has(alias)) aliasInput.classList.add('is-invalid');
						} else {
							usedAliases.add(alias);
							newAliases[alias] = email;
						}
					});
					if (isValid) {
						state.contact_aliases = newAliases;
						await savePreference('contact_aliases', JSON.stringify(newAliases));
						messageDiv.textContent = 'Contacts saved successfully!';
						messageDiv.className = 'mt-3 alert alert-success p-2';
						setTimeout(() => {
							messageDiv.textContent = '';
							messageDiv.className = 'mt-3';
						}, 3000);
					} else {
						messageDiv.textContent = 'Please fix the errors before saving.';
						messageDiv.className = 'mt-3 alert alert-danger p-2';
					}
					return;
				}
				// --- CONTACT ALIAS MANAGEMENT END ---
		
				const helpLink = target.closest('a[data-action="toggle-help"]');
				if (helpLink) {
					const helpModal = document.querySelector('#help-modal');
					if (helpModal) helpModal.classList.remove('hidden');
					sideMenu.classList.remove('show');
					return;
				}
		
				const exportTasksBtn = target.closest('#export-tasks-btn');
				if (exportTasksBtn) {
					const includeCompleted = document.querySelector('#export-include-completed-toggle').checked;
					const exportModal = document.querySelector('#export-modal');
					const outputTextarea = document.querySelector('#export-json-output');
					if (!exportModal || !outputTextarea) return;
					document.querySelector('#export-modal-title').textContent = 'Export Tasks';
					outputTextarea.value = 'Generating export...';
					exportModal.classList.remove('hidden');
					try {
						const [tasksRes, columnsRes] = await Promise.all([
							fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php?export=true&include_completed=${includeCompleted}`),
							fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`)
						]);
						if (!tasksRes.ok || !columnsRes.ok) throw new Error('Failed to fetch data for export.');
						const tasks = await tasksRes.json();
						const columns = await columnsRes.json();
						const columnMap = new Map(columns.map(col => [col.column_id, col.column_name]));
						const exportData = tasks.map(task => {
							const decryptedString = decrypt(task.encrypted_data, state.encryptionKey);
							let taskData = { task_text: 'Decryption Failed', task_notes: '' };
							if (decryptedString !== "[decryption failed]") {
								try { taskData = JSON.parse(decryptedString); } catch (e) { taskData.task_text = decryptedString; }
							}
							return {
								title: taskData.task_text || '',
								columnName: columnMap.get(task.column_id) || 'Unknown Column',
								isPriority: task.status == 2,
								dueDate: task.due_date || '',
								notes: taskData.task_notes || ''
							};
						});
						outputTextarea.value = JSON.stringify(exportData, null, 2);
					} catch (error) {
						outputTextarea.value = `Error generating export: ${error.message}`;
					}
					return;
				}
		
				const exportJournalBtn = target.closest('#export-journal-btn');
				if (exportJournalBtn) {
					const range = document.querySelector('#export-journal-range').value;
					const exportModal = document.querySelector('#export-modal');
					const outputTextarea = document.querySelector('#export-json-output');
					if (!exportModal || !outputTextarea) return;
					document.querySelector('#export-modal-title').textContent = 'Export Journal';
					outputTextarea.value = 'Generating export...';
					exportModal.classList.remove('hidden');
					try {
						const res = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php?export=true&range=${range}`);
						if (!res.ok) throw new Error('Failed to fetch journal data for export.');
						const entries = await res.json();
						const exportData = entries.map(entry => {
							const decryptedString = decrypt(entry.encrypted_data, state.encryptionKey);
							let entryData = { entry_title: 'Decryption Failed', entry_notes: '' };
							if (decryptedString !== "[decryption failed]") {
								try { entryData = JSON.parse(decryptedString); } catch (e) { entryData.entry_title = decryptedString; }
							}
							return {
								title: entryData.entry_title || '',
								date: entry.entry_date,
								notes: entryData.entry_notes || '',
								isPrivate: !!parseInt(entry.is_private)
							};
						});
						outputTextarea.value = JSON.stringify(exportData, null, 2);
					} catch (error) {
						outputTextarea.value = `Error generating export: ${error.message}`;
					}
					return;
				}
		
				const importTasksBtn = target.closest('#import-tasks-btn');
				if (importTasksBtn) {
					const importModal = document.querySelector('#import-modal');
					const importTextarea = document.querySelector('#import-json-input');
					const importMessage = document.querySelector('#import-message');
					const confirmBtn = document.querySelector('#import-confirm-btn');
					if (!importModal || !importTextarea || !importMessage) return;
					document.querySelector('#import-modal-title').textContent = 'Import Tasks';
					importTextarea.value = '';
					importMessage.textContent = '';
					importMessage.className = 'mt-3';
					confirmBtn.dataset.importType = 'tasks';
					importModal.classList.remove('hidden');
					return;
				}
				
				const importJournalBtn = target.closest('#import-journal-btn');
				if (importJournalBtn) {
					const importModal = document.querySelector('#import-modal');
					const importTextarea = document.querySelector('#import-json-input');
					const importMessage = document.querySelector('#import-message');
					const confirmBtn = document.querySelector('#import-confirm-btn');
					if (!importModal || !importTextarea || !importMessage) return;
					document.querySelector('#import-modal-title').textContent = 'Import Journal';
					importTextarea.value = '';
					importMessage.textContent = '';
					importMessage.className = 'mt-3';
					confirmBtn.dataset.importType = 'journal';
					importModal.classList.remove('hidden');
					return;
				}
		
				const openCalendarBtn = target.closest('#open-calendar-settings-btn');
				if (openCalendarBtn) {
					const modal = document.querySelector('#calendar-settings-modal');
					const listContainer = document.querySelector('#calendar-list-container');
					if (!modal || !listContainer) return;
		
					listContainer.innerHTML = '<p>Loading calendars...</p>';
					modal.classList.remove('hidden');
					sideMenu.classList.remove('show');
		
					try {
						const [calendarsRes, prefsRes] = await Promise.all([
							fetch(`${window.APP_CONFIG.appUrl}/api/calendars.php`),
							fetch(`${window.APP_CONFIG.appUrl}/api/preferences.php`)
						]);
						if (!calendarsRes.ok || !prefsRes.ok) throw new Error('Could not load calendar data.');
						const allCalendars = await calendarsRes.json();
						const userPrefs = await prefsRes.json();
						const visibleCalendars = new Set(userPrefs.visible_calendars || []);
						listContainer.innerHTML = '';
						if (allCalendars.length === 0) {
							listContainer.innerHTML = '<p>No custom calendars found.</p>';
							return;
						}
						allCalendars.forEach(calendarType => {
							const isChecked = visibleCalendars.has(calendarType);
							const itemHtml = `
								<div class="form-check form-switch">
									<input class="form-check-input calendar-toggle-check" type="checkbox" role="switch" id="cal-toggle-${calendarType}" data-calendar-type="${calendarType}" ${isChecked ? 'checked' : ''}>
									<label class="form-check-label" for="cal-toggle-${calendarType}">${calendarType}</label>
								</div>
							`;
							listContainer.insertAdjacentHTML('beforeend', itemHtml);
						});
					} catch (error) {
						listContainer.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
					}
					return;
				}
			});
		
			sideMenu.addEventListener('change', e => {
				const target = e.target;
				if (target.matches('[data-filler-id]')) {
					const fillerInputs = sideMenu.querySelectorAll('[data-filler-id]');
					const fillerValues = Array.from(fillerInputs).map(input => input.value);
					state.customFillers = fillerValues;
					savePreference('custom_fillers', fillerValues);
					updateFillerTooltips();
				} else if (target.id === 'private-view-only-toggle') {
					const isEnabled = target.checked;
					const togglePrivateBtn = document.querySelector('#toggle-private-columns-btn');
					state.filters.privateViewOnly = isEnabled;
					savePreference('private_view_only', isEnabled);
					if(togglePrivateBtn) togglePrivateBtn.disabled = isEnabled;
					taskBoardContainer.classList.toggle('private-only-mode', isEnabled);
					journalBoardContainer.classList.toggle('private-only-mode', isEnabled);
					if (isEnabled) {
						taskBoardContainer.classList.remove('hide-private');
						journalBoardContainer.classList.remove('hide-private');
					}
				}
			});
		}
		
		// MOVED: This listener is now outside the IF block but checks for element existence.
		document.addEventListener('click', (e) => {
			const sideMenuEl = document.querySelector('#side-menu');
			const sideMenuToggleBtnEl = document.querySelector('#side-menu-toggle-btn');
			
			// Ensure elements exist and the menu is actually shown before proceeding
			if (!sideMenuEl || !sideMenuEl.classList.contains('show')) return;
			
			// Check if the click was on the toggle button itself (it handles its own closing)
			if (sideMenuToggleBtnEl && sideMenuToggleBtnEl.contains(e.target)) return;
			
			// Check if the click was inside the menu
			if (sideMenuEl.contains(e.target)) return;
			
			// If the click was outside, close the menu
			sideMenuEl.classList.remove('show');
		});
		
	/**
		* Generic event listener to handle accordion-style UIs in modals.
		*/
		document.addEventListener('click', e => {
			if (e.target.matches('.help-item-header')) {
				const header = e.target;
				const content = header.nextElementSibling;
				// FIXED: Look for either the old modal class or the new side-menu ID
				const parentContainer = header.closest('.modal-container, #side-menu');
		
				// If the accordion isn't in a recognized container, do nothing.
				if (!content || !parentContainer) return;
		
				const isCurrentlyOpen = content.classList.contains('show');
		
				// Close any other open accordions within the same container
				parentContainer.querySelectorAll('.help-item-content.show').forEach(openContent => {
					// Don't close the one we're about to open
					if (openContent !== content) {
						openContent.classList.remove('show');
						openContent.previousElementSibling.classList.remove('active');
					}
				});
		
				// Toggle the clicked accordion
				if (isCurrentlyOpen) {
					content.classList.remove('show');
					header.classList.remove('active');
				} else {
					content.classList.add('show');
					header.classList.add('active');
				}
			}
		});
		
		/**
		 * Switches the main application view between 'Tasks' and 'Journal'.
		 */
		function updateView() {
			localStorage.setItem('currentView', state.currentView);
			mainSearchResultsContainer.classList.add('d-none');
		
			if (state.currentView === 'tasks') {
				taskBoardContainer.classList.remove('d-none');
				journalBoardContainer.classList.add('d-none');
				journalNavGroup.classList.add('d-none');
				headerJournalSearchForm.classList.add('d-none');
				taskFilters.classList.remove('d-none');
				journalFilters.classList.add('d-none');
				
				// NEW: Call the UI update function now that the buttons are visible.
				updateTaskFilterButtonsUI();
				
				renderTaskBoard();
			} else { // Journal View
				taskBoardContainer.classList.add('d-none');
				journalBoardContainer.classList.remove('d-none');
				journalNavGroup.classList.remove('d-none');
				headerJournalSearchForm.classList.remove('d-none');
				headerJournalSearchForm.classList.add('d-flex');
				taskFilters.classList.add('d-none');
				journalFilters.classList.remove('d-none');
				renderJournalBoard();
			}
			
			const isTasksView = state.currentView === 'tasks';
			addItemForm.classList.toggle('d-none', !isTasksView);
			addItemForm.classList.toggle('d-flex', isTasksView);
		
			viewTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.view === state.currentView));
		}
	
		/**
		* Event listener for the main view tabs ('Tasks' and 'Journal').
		*/
		viewTabs.forEach(tab => {
			tab.addEventListener('click', (e) => {
				const newView = e.currentTarget.dataset.view;
				if (newView === state.currentView) return;
				state.currentView = newView;
				updateView();
				savePreference('current_view', newView);
			});
		});
	
		/**
		* Event listener for the 'Show Assigned' filter button.
		*/
		filterAssignedBtn.addEventListener('click', () => {
			state.filters.showAssigned = !state.filters.showAssigned;
			filterAssignedBtn.classList.toggle('active', state.filters.showAssigned);
			applyTaskFilters();
			savePreference('show_assigned', state.filters.showAssigned);
		});
		/**
		* Event listener for the 'Show Mine' filter button.
		*/
		filterMineBtn.addEventListener('click', () => {
			state.filters.showMine = !state.filters.showMine;
			filterMineBtn.classList.toggle('active', state.filters.showMine);
			applyTaskFilters();
			savePreference('show_mine', state.filters.showMine);
		});
		/**
		* Event listener for the 'Show/Hide Completed' filter button.
		*/
		filterCompletedBtn.addEventListener('click', () => {
			state.filters.showCompleted = !state.filters.showCompleted;
			filterCompletedBtn.classList.toggle('active', state.filters.showCompleted);
			applyTaskFilters();
			savePreference('hide_completed', !state.filters.showCompleted);
		});
		/**
		* Event listener for the 'Show Priority Only' filter button.
		*/
		filterPriorityBtn.addEventListener('click', () => {
			state.filters.priorityOnly = !state.filters.priorityOnly;
			filterPriorityBtn.classList.toggle('active', state.filters.priorityOnly);
			applyTaskFilters();
			savePreference('priority_only', state.filters.priorityOnly);
		});
	
		/**
		* Event listener for the global font size increase button.
		*/
		fontIncreaseBtn.addEventListener('click', () => {
			if (state.fontSize < 20) {
				state.fontSize += 1;
				applyFontSize();
				localStorage.setItem('appFontSize', state.fontSize);
			}
		});
		/**
		* Event listener for the global font size decrease button.
		*/
		fontDecreaseBtn.addEventListener('click', () => {
			if (state.fontSize > 12) {
				state.fontSize -= 1;
				applyFontSize();
				localStorage.setItem('appFontSize', state.fontSize);
			}
		});
	
		/**
		* Saves the current order of columns to the database.
		*/
		async function saveColumnOrder() {
			const orderedColumnIds = Array.from(taskBoardContainer.querySelectorAll('.task-column')).map(col => col.dataset.columnId);
			try {
				await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ordered_columns: orderedColumnIds
					})
				});
			} catch (error) {
				console.error('Failed to save column order:', error);
			}
		}
		
		/**
		* Saves the current order of tasks within a specific column to the database.
		* @param {HTMLElement} columnEl The column element whose task order needs to be saved.
		*/
		async function saveTaskOrder(columnEl) {
			const tasksContainer = columnEl.querySelector('.tasks-container');
			const orderedTaskIds = Array.from(tasksContainer.querySelectorAll('.task-card')).map(card => card.dataset.taskId);
			try {
				await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ordered_tasks: orderedTaskIds
					})
				});
			} catch (error) {
				console.error('Failed to save task order:', error);
			}
		}
			
		/**
		* Handles the drop event for a task card, updating its column and position.
		* @param {DragEvent} e The drop event object.
		*/
		async function handleTaskDrop(e) {
			const task = state.draggedTask;
			if (!task) return;
		
			const sourceColumnEl = document.querySelector(`.task-column[data-column-id="${task.column_id}"]`);
			const targetColumnEl = e.currentTarget.closest('.task-column');
			const targetColumnId = targetColumnEl.dataset.columnId;
		
			if (sourceColumnEl && targetColumnEl && sourceColumnEl !== targetColumnEl) {
				task.column_id = targetColumnId;
				await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						task_id: task.task_id,
						column_id: targetColumnId
					})
				});
			}
		
			enforceColumnSortRules(targetColumnEl);
			if (sourceColumnEl && sourceColumnEl !== targetColumnEl) {
				enforceColumnSortRules(sourceColumnEl);
			}
		
			if (sourceColumnEl) {
				updateTaskCount(sourceColumnEl);
			}
			if (targetColumnEl && sourceColumnEl !== targetColumnEl) {
				updateTaskCount(targetColumnEl);
			}
		
			await saveTaskOrder(targetColumnEl);
			if (sourceColumnEl && sourceColumnEl !== targetColumnEl) {
				await saveTaskOrder(sourceColumnEl);
			}
		
			state.draggedTask = null;
		}
		
		/**
		* Handles the drop event for a journal entry, updating its date and position.
		* @param {DragEvent} e The drop event object.
		*/
		async function handleJournalDrop(e) {
			const entry = state.draggedJournalEntry;
			if (!entry) return;
			const targetColumnBody = e.currentTarget;
			const targetColumn = targetColumnBody.closest('.task-column');
			const targetDate = targetColumn.dataset.date;
			const entryElements = targetColumn.querySelectorAll('.journal-entry-card');
			const orderedIds = Array.from(entryElements).map(el => el.dataset.entryId);
			const payload = {
				moved_entry_id: entry.entry_id,
				target_date: targetDate,
				ordered_ids_in_column: orderedIds
			};
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(payload)
				});
				if (!response.ok) throw new Error('Server responded with an error.');
				const droppedCard = journalBoardContainer.querySelector(`[data-entry-id="${entry.entry_id}"]`);
				if (droppedCard) droppedCard.dataset.date = targetDate;
				entry.entry_date = targetDate;
			} catch (error) {
				alert('Could not save new order. Reverting.');
				renderJournalBoard();
			} finally {
				state.draggedJournalEntry = null;
			}
		}
	
		/**
		* Saves a single user preference to the database.
		* @param {string} key The preference key (matches a database column name).
		* @param {*} value The value to save for the preference.
		*/
		async function savePreference(key, value) {
			try {
				await fetch(`${window.APP_CONFIG.appUrl}/api/preferences.php`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						key,
						value
					})
				});
			} catch (error) {
				console.error('Failed to save preference:', error);
			}
		}
		
	/**
	 * Global event listener to enable inline editing on double-click.
	 */
	document.body.addEventListener('dblclick', e => {
		const target = e.target;
		if (target.matches('#app-title, .view-tab, .column-title, .task-title, .entry-title, #editor-mode-title-text')) {
			
			// If the double-clicked item is a journal title, clear the single-click timer.
			if (target.matches('.entry-title')) {
				const entryCard = target.closest('.journal-entry-card');
				if (entryCard && entryCard.dataset.clickTimer) {
					clearTimeout(entryCard.dataset.clickTimer);
					entryCard.dataset.clickTimer = '';
				}
			}
			
			target.contentEditable = true;
			target.focus();
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(target);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	});
	
	/**
	 * Global event listener to save changes when an inline-editable field loses focus.
	 */
	document.body.addEventListener('blur', async (e) => {
		const target = e.target;
		if (!target.isContentEditable) return;
		target.contentEditable = false;
	
		if (target.matches('#app-title')) {
			savePreference('app_title', target.textContent);
		} else if (target.matches('.view-tab')) {
			savePreference(target.dataset.prefKey, target.textContent);
		} else if (target.matches('.column-title')) {
			const columnId = target.closest('.task-column').dataset.columnId;
			await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					column_id: columnId,
					column_name: target.textContent
				})
			});
		} else if (target.matches('.task-title')) {
			const taskEl = target.closest('.task-card');
			const taskId = taskEl.dataset.taskId;
			const taskTitle = target.textContent;
			
			const taskData = {
				task_text: taskTitle,
				task_notes: taskEl.dataset.notes || ""
			};
			const encryptedData = encrypt(JSON.stringify(taskData), state.encryptionKey);
			await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					task_id: taskId,
					encrypted_data: encryptedData
				})
			});
	
			// Obsolete styling logic has been removed.
	
			applyTaskFilters();
	
		} else if (target.matches('#editor-mode-title-text')) {
			await saveCurrentEditorNote();
			state.activeEditor.originalNoteTitle = target.textContent;
		} else if (target.matches('.entry-title')) {
			const entryCard = target.closest('.journal-entry-card');
			if (entryCard) {
				const entryId = entryCard.dataset.entryId;
				const encryptedData = entryCard.dataset.encryptedData;
				const decryptedString = decrypt(encryptedData, state.encryptionKey);
				if (decryptedString && decryptedString !== "[decryption failed]") {
					try {
						const data = JSON.parse(decryptedString);
						data.entry_title = target.textContent;
						const newEncryptedData = encrypt(JSON.stringify(data), state.encryptionKey);
						entryCard.dataset.encryptedData = newEncryptedData;
						fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								entry_id: entryId,
								encrypted_data: newEncryptedData
							})
						});
					} catch (e) {
						console.error("Failed to process entry title change.", e);
					}
				}
			}
		}
	}, true);
	
	/**
		 * Global keydown listener for handling 'Enter' and 'Escape' keys in specific contexts.
		 */
		document.body.addEventListener('keydown', e => {
			if (e.target.matches('.add-task-form input') && e.key === 'Enter') {
				e.preventDefault();
				e.target.closest('.add-task-form').querySelector('button[type="submit"]').click();
			} else if (e.target.matches('.add-journal-entry-form input') && e.key === 'Enter') {
				e.preventDefault();
				e.target.closest('.add-journal-entry-form').querySelector('button[type="submit"]').click();
			} else if (e.target.isContentEditable && e.key === 'Enter') {
				e.preventDefault();
				e.target.blur();
			} else if (e.key === 'Escape' && !editorModeContainer.classList.contains('d-none')) {
				e.preventDefault();
				closeEditorMode();
			} else if (e.key === 'Escape' && sideMenu.classList.contains('show')) {
				// NEW: Close the side menu if Escape is pressed while it's open.
				e.preventDefault();
				sideMenu.classList.remove('show');
			}
		});
	
		/**
		* Event listener for the 'Add Column' form in the header.
		*/
		if (addItemForm) {
			addItemForm.addEventListener('submit', async e => {
				e.preventDefault();
				const itemName = newItemInput.value.trim();
				if (!itemName) return;
				if (state.currentView === 'tasks') {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							column_name: itemName
						})
					});
					if (response.ok) {
						const newColumn = await response.json();
						const columnData = {
							column_id: newColumn.column_id,
							column_name: itemName
						};
						const newColumnEl = createColumnElement(columnData);
						taskBoardContainer.appendChild(newColumnEl);
						updateColumnButtonVisibility();
						newItemInput.value = '';
					} else {
						alert('Failed to add column.');
					}
				}
			});
		}
	
		/**
		* Event listener for adding new tasks via the form in a column's footer.
		*/
		taskBoardContainer.addEventListener('submit', async e => {
			if (e.target.matches('.add-task-form')) {
				e.preventDefault();
				const form = e.target;
				const input = form.querySelector('input');
				const taskText = input.value.trim();
				const columnEl = form.closest('.task-column');
				const columnId = columnEl.dataset.columnId;
				if (!taskText) return;
		
				const jsonData = JSON.stringify({
					task_text: taskText,
					task_notes: ""
				});
				const encryptedData = encrypt(jsonData, state.encryptionKey);
				if (!encryptedData) return alert('Could not encrypt task.');
		
				try {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							column_id: columnId,
							encrypted_data: encryptedData
						})
					});
		
					if (response.ok) {
						const newRecord = await response.json();
						const taskObject = {
							task_id: newRecord.task_id,
							column_id: columnId,
							encrypted_data: encryptedData,
							status: 1,
							due_date: null
						};
						const newTaskEl = createTaskElement(taskObject);
						const tasksContainer = columnEl.querySelector('.tasks-container');
						const placeholder = tasksContainer.querySelector('.no-tasks-placeholder');
						if (placeholder) placeholder.remove();
						
						tasksContainer.appendChild(newTaskEl);
						updateTaskCount(columnEl);
						input.value = '';
						input.focus();
		
						// --- CLEANED UP: Obsolete auto-sharing logic has been removed ---
		
					} else {
						alert('Failed to add task.');
					}
				} catch (error) {
					console.error('Error creating task:', error);
					alert('An error occurred while adding the task.');
				}
			}
		});
	
	
		/**
		 * Opens the share modal and populates it with data for a given task.
		 * @param {number} taskId The ID of the task to share.
		 */
		async function openShareModal(taskId) {
			const shareModal = document.querySelector('#share-task-modal');
			const modalTitle = document.querySelector('#share-task-modal-title');
			const recipientList = document.querySelector('#share-recipient-list');
			const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
			if (!shareModal || !taskCard) return;
		
			const taskTitle = taskCard.querySelector('.task-title').childNodes[0].nodeValue.trim();
		
			modalTitle.textContent = `Share "${taskTitle}"`;
			shareModal.dataset.taskId = taskId;
			recipientList.innerHTML = '<p class="text-secondary small">Loading...</p>';
			shareModal.classList.remove('hidden');
		
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/get_shares.php?task_id=${taskId}`);
				const data = await response.json();
		
				if (response.ok && data.success) {
					recipientList.innerHTML = '';
					if (data.recipients.length === 0) {
						recipientList.innerHTML = '<p class="text-secondary small">Not shared with anyone.</p>';
					} else {
						data.recipients.forEach(recipient => {
							const recipientEl = document.createElement('div');
							recipientEl.className = 'd-flex justify-content-between align-items-center mb-2';
							recipientEl.dataset.recipientEmail = recipient.email;
							recipientEl.innerHTML = `
								<span>${recipient.username} (${recipient.email})</span>
								<button class="btn btn-sm btn-outline-danger">&times;</button>
							`;
							recipientList.appendChild(recipientEl);
						});
					}
				} else {
					recipientList.innerHTML = `<p class="text-danger small">${data.message || 'Could not load recipient list.'}</p>`;
				}
			} catch (error) {
				recipientList.innerHTML = '<p class="text-danger small">Error contacting the server.</p>';
			}
		}
	
		/**
		* Main event delegation handler for all clicks and taps within the task board.
		*/
		const handleTaskBoardInteraction = async (e) => {
			const target = e.target;
		
			if (e.type === 'touchstart') {
				const interactiveSelectors = [
					'.task-status-band',
					'[data-action]',
					'.move-column-left-btn',
					'.move-column-right-btn',
					'.delete-column-btn'
				].join(',');
		
				if (!target.closest(interactiveSelectors)) {
					return;
				}
				e.preventDefault();
			}
		
			const taskCard = target.closest('.task-card');
		
			if (target.matches('.task-status-band')) {
				if (taskCard) {
					const taskId = taskCard.dataset.taskId;
					let currentStatus = taskCard.dataset.status;
					let newStatus;
		
					if (currentStatus == 0) return;
		
					if (currentStatus == 2) {
						newStatus = 1;
						taskCard.classList.remove('priority');
					} else {
						newStatus = 2;
						taskCard.classList.add('priority');
					}
		
					taskCard.dataset.status = newStatus;
					
					const columnEl = taskCard.closest('.task-column');
		
					enforceColumnSortRules(columnEl);
					saveTaskOrder(columnEl);
		
					await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ task_id: taskId, status: newStatus })
					});
					return;
				}
			}
		
			if (taskCard) {
				const action = target.closest('[data-action]')?.dataset.action;
				const taskId = taskCard.dataset.taskId;
		
				if (action === 'toggle-menu') {
					const menu = taskCard.querySelector('.task-menu');
					if (menu) {
						const isVisible = menu.style.display === 'block';
						document.querySelectorAll('.task-menu').forEach(m => m.style.display = 'none');
						document.querySelectorAll('.task-card.is-menu-open').forEach(c => c.classList.remove('is-menu-open'));
						if (!isVisible) {
							menu.style.display = 'block';
							taskCard.classList.add('is-menu-open');
						}
					}
				} else if (action === 'share') {
					openShareModal(taskId);
				} else if (action === 'move') {
					const moveModal = document.querySelector('#move-task-modal');
					const columnList = document.querySelector('#move-task-column-list');
					const modalTitle = document.querySelector('#move-task-modal-title');
					const taskTitle = taskCard.querySelector('.task-title').textContent;
		
					moveModal.dataset.taskIdToMove = taskId;
					modalTitle.textContent = `Move "${taskTitle}"`;
					columnList.innerHTML = '';
		
					const currentColumnId = taskCard.closest('.task-column').dataset.columnId;
					const allColumns = document.querySelectorAll('#task-board-container .task-column');
		
					allColumns.forEach(col => {
						const isHidden = col.offsetParent === null;
						if (col.dataset.columnId !== currentColumnId && !isHidden) {
							const moveButton = document.createElement('button');
							moveButton.className = 'btn btn-outline-primary w-100 mb-2';
							moveButton.textContent = col.querySelector('.column-title').textContent;
							moveButton.dataset.targetColumnId = col.dataset.columnId;
							columnList.appendChild(moveButton);
						}
					});
		
					moveModal.classList.remove('hidden');
					document.querySelectorAll('.task-menu').forEach(m => m.style.display = 'none');
					document.querySelectorAll('.task-card.is-menu-open').forEach(c => c.classList.remove('is-menu-open'));
		
				} else if (action === 'notes' || action === 'duedate') {
					const panelToToggle = taskCard.querySelector(action === 'notes' ? '.task-notes-container' : '.task-duedate-container');
					const isOpening = panelToToggle.style.display === 'none';
					if (state.activeTaskPanel) state.activeTaskPanel.style.display = 'none';
					if (isOpening) {
						panelToToggle.style.display = (action === 'duedate') ? 'flex' : 'block';
						state.activeTaskPanel = panelToToggle;
					} else {
						state.activeTaskPanel = null;
					}
				} else if (action === 'delete') {
					if (confirm('Are you sure you want to delete this task?')) {
						fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php?task_id=${taskId}`, { method: 'DELETE' }).then(response => {
							if (response.ok) {
								renderTaskBoard();
							} else {
								alert('Failed to delete task.');
							}
						});
					}
				} else if (action === 'duplicate') {
					const columnId = taskCard.closest('.task-column').dataset.columnId;
					const encryptedData = taskCard.dataset.encryptedData;
					const decryptedString = decrypt(encryptedData, state.encryptionKey);
					if (decryptedString && decryptedString !== "[decryption failed]") {
						const originalData = JSON.parse(decryptedString);
						originalData.task_text = `${originalData.task_text} (Copy)`;
						const newEncryptedData = encrypt(JSON.stringify(originalData), state.encryptionKey);
						fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ column_id: columnId, encrypted_data: newEncryptedData })
						}).then(() => renderTaskBoard());
					} else {
						alert('Could not duplicate task: failed to read original data.');
					}
				}
			} else {
				const columnEl = target.closest('.task-column');
				if (columnEl) {
					if (target.matches('.move-column-left-btn')) {
						const prevSibling = columnEl.previousElementSibling;
						if (prevSibling) {
							taskBoardContainer.insertBefore(columnEl, prevSibling);
							updateColumnButtonVisibility();
							saveColumnOrder();
						}
					} else if (target.matches('.move-column-right-btn')) {
						const nextSibling = columnEl.nextElementSibling;
						if (nextSibling) {
							taskBoardContainer.insertBefore(nextSibling, columnEl);
							updateColumnButtonVisibility();
							saveColumnOrder();
						}
					} else if (target.matches('.delete-column-btn')) {
						const columnId = columnEl.dataset.columnId;
						const columnName = columnEl.querySelector('.column-title').textContent;
						if (confirm(`Are you sure you want to delete the column "${columnName}" and all its tasks? This cannot be undone.`)) {
							fetch(`${window.APP_CONFIG.appUrl}/api/columns.php?column_id=${columnId}`, { method: 'DELETE' })
								.then(response => {
									if (response.ok) {
										columnEl.remove();
										updateColumnButtonVisibility();
									} else {
										alert('Failed to delete the column.');
									}
								});
						}
					}
				}
			}
		};
		
		
		/**
		 * Handles all interactive logic within the Share Task modal.
		 */
		const shareModal = document.querySelector('#share-task-modal');
		if (shareModal) {
			const recipientInput = document.querySelector('#share-add-recipient-input');
			const suggestionsContainer = document.querySelector('#share-alias-suggestions');
			const recipientList = document.querySelector('#share-recipient-list');
			const addRecipientForm = document.querySelector('#share-add-recipient-form');
			const saveBtn = document.querySelector('#share-save-btn');
		
			// Show alias suggestions as the user types
			recipientInput.addEventListener('input', () => {
				const inputText = recipientInput.value.toLowerCase();
				suggestionsContainer.innerHTML = '';
			
				if (inputText.length > 0) {
					const matchingAliases = Object.keys(state.contact_aliases).filter(alias => 
						alias.toLowerCase().startsWith(inputText)
					);
			
					matchingAliases.forEach(alias => {
						const suggestionEl = document.createElement('a');
						suggestionEl.href = '#';
						suggestionEl.className = 'list-group-item list-group-item-action py-1';
						// MODIFIED: Removed the "@" symbol from the display text
						suggestionEl.textContent = alias; 
						suggestionEl.dataset.alias = alias;
						suggestionsContainer.appendChild(suggestionEl);
					});
				}
			});
		
			// Handle clicking on a suggestion
			suggestionsContainer.addEventListener('click', (e) => {
				if (e.target.matches('.list-group-item')) {
					e.preventDefault();
					recipientInput.value = e.target.dataset.alias; // Use the clean alias
					suggestionsContainer.innerHTML = '';
					addRecipientForm.dispatchEvent(new Event('submit'));
				}
			});
		
			// Handle submitting the form to add a recipient
			addRecipientForm.addEventListener('submit', (e) => {
				e.preventDefault();
				const alias = recipientInput.value.trim().replace('@', ''); // Clean the input
				
				recipientInput.value = '';
				suggestionsContainer.innerHTML = '';
		
				if (alias && state.contact_aliases[alias]) {
					const placeholder = recipientList.querySelector('p.text-secondary');
					if (placeholder) placeholder.remove();
		
					// Prevent adding the same person twice
					const existingEmails = Array.from(recipientList.querySelectorAll('[data-recipient-email]')).map(el => el.dataset.recipientEmail);
					if (existingEmails.includes(state.contact_aliases[alias])) {
						showToastNotification('That person is already in the share list.', 3000);
						return;
					}
		
					const recipientEl = document.createElement('div');
					recipientEl.className = 'd-flex justify-content-between align-items-center mb-2';
					recipientEl.dataset.recipientEmail = state.contact_aliases[alias]; 
					recipientEl.innerHTML = `
						<span>${state.contact_aliases[alias]} (Pending)</span>
						<button class="btn btn-sm btn-outline-danger">&times;</button>
					`;
					recipientList.appendChild(recipientEl);
				} else if (alias) {
					showToastNotification('Invalid alias selected.', 3000);
				}
			});
		
			// Handle removing a recipient from the list
			recipientList.addEventListener('click', (e) => {
				const removeBtn = e.target.closest('button');
				if (removeBtn) {
					removeBtn.closest('.d-flex').remove();
					if (recipientList.children.length === 0) {
						recipientList.innerHTML = '<p class="text-secondary small">Not shared with anyone.</p>';
					}
				}
			});
		
			// Handle saving the final list of recipients
			saveBtn.addEventListener('click', async () => {
				const taskId = shareModal.dataset.taskId;
				if (!taskId) return;
				const recipientElements = recipientList.querySelectorAll('[data-recipient-email]');
				const recipientEmails = Array.from(recipientElements).map(el => el.dataset.recipientEmail);
				try {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/share.php`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							task_id: taskId,
							recipient_emails: recipientEmails
						})
					});
					if (response.ok) {
						shareModal.classList.add('hidden');
						showToastNotification('Share settings updated!');
						renderTaskBoard();
					} else {
						const result = await response.json();
						alert(`Failed to update shares: ${result.message}`);
					}
				} catch (error) {
					alert('An error occurred while saving share settings.');
				}
			});
		}
		
		
		taskBoardContainer.addEventListener('click', handleTaskBoardInteraction);
		taskBoardContainer.addEventListener('touchstart', handleTaskBoardInteraction);
	
		/**
		* Event listener for the editor ribbon tabs, switching between format, search, etc.
		*/
		const ribbonNav = document.querySelector('#ribbon-nav');
		if (ribbonNav) {
			ribbonNav.addEventListener('click', e => {
				const targetButton = e.target.closest('.ribbon-nav-btn');
				if (!targetButton) return;
		
				e.preventDefault();
		
				const targetPanelId = targetButton.dataset.target;
				const ribbonContent = document.querySelector('#ribbon-content');
		
				if (!targetPanelId || !ribbonContent) return; 
		
				ribbonNav.querySelectorAll('.ribbon-nav-btn').forEach(btn => btn.classList.remove('active'));
				ribbonContent.querySelectorAll('.ribbon-panel').forEach(panel => panel.classList.remove('active'));
		
				targetButton.classList.add('active');
				const targetPanel = document.querySelector(`#${targetPanelId}`);
				if (targetPanel) {
					targetPanel.classList.add('active');
				}
			});
		}
	
	
		/**
		* Event listener for handling changes within the task board (checkboxes, etc.).
		*/
		taskBoardContainer.addEventListener('change', e => {
			if (e.target.matches('.task-complete-checkbox')) {
				const taskCard = e.target.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
				const isCompleted = e.target.checked;
				let newStatus;
		
				taskCard.classList.toggle('completed', isCompleted);
		
				if (isCompleted) {
					newStatus = 0;
					taskCard.classList.remove('priority');
		
					if (state.soundEffectsEnabled && state.whooshSound) {
						state.whooshSound.currentTime = 0;
						state.whooshSound.play();
					}
					taskCard.classList.add('flash-animation');
					
				} else {
					newStatus = 1;
				}
				
				taskCard.dataset.status = newStatus;
		
				const columnEl = taskCard.closest('.task-column');
				enforceColumnSortRules(columnEl);
				
				saveTaskOrder(columnEl);
		
				if (isCompleted) {
					setTimeout(() => {
						taskCard.classList.remove('flash-animation');
						applyTaskFilters();
					}, 3500);
				} else {
					applyTaskFilters();
				}
		
				fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ task_id: taskId, status: newStatus })
				});
			} else if (e.target.matches('.private-column-checkbox')) {
				const columnEl = e.target.closest('.task-column');
				const columnId = columnEl.dataset.columnId;
				const isPrivate = e.target.checked;
		
				columnEl.dataset.isPrivate = isPrivate ? 1 : 0;
		
				fetch(`${window.APP_CONFIG.appUrl}/api/columns.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						column_id: columnId,
						is_private: isPrivate
					})
				});
			} else if (e.target.matches('.task-duedate-picker')) {
				const taskCard = e.target.closest('.task-card');
				const taskId = taskCard.dataset.taskId;
				const newDueDate = e.target.value || null;
		
				fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ task_id: taskId, due_date: newDueDate })
				}).then(response => {
					if (!response.ok) {
						alert('Failed to update due date.');
						return;
					}
		
					const titleEl = taskCard.querySelector('.task-title');
					let indicatorEl = titleEl.querySelector('.due-date-indicator');
					if (indicatorEl) indicatorEl.remove();
		
					taskCard.dataset.dueDate = newDueDate || '';
					taskCard.classList.remove('past-due');
		
					if (newDueDate) {
						const dueDate = new Date(newDueDate + 'T12:00:00');
						const now = new Date();
						now.setHours(0, 0, 0, 0);
		
						if (dueDate < now) {
							taskCard.classList.add('past-due');
						}
						const month = String(dueDate.getMonth() + 1).padStart(2, '0');
						const day = String(dueDate.getDate()).padStart(2, '0');
						const formattedDate = `${month}/${day}`;
		
						titleEl.insertAdjacentHTML('beforeend', `&nbsp;&nbsp;<span class="due-date-indicator">${formattedDate}</span>`);
		
						taskCard.querySelector('.due-date-display').textContent = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'long' });
					} else {
						taskCard.querySelector('.due-date-display').textContent = 'No due date';
					}
				});
			}
		});
		
		
		/**
		 * Event listener for saving task notes when the editor loses focus.
		 */
		taskBoardContainer.addEventListener('blur', async (e) => {
			// We listen for the blur event on the container, in the "capture" phase.
			if (e.target.matches('.task-notes-editor')) {
				const notesEditor = e.target;
				const taskCard = notesEditor.closest('.task-card');
				if (!taskCard) return;
		
				const taskId = taskCard.dataset.taskId;
				const currentNotes = taskCard.dataset.notes || '';
				const newNotes = notesEditor.value;
		
				// Only save if the notes have actually changed.
				if (newNotes !== currentNotes) {
					const taskTitleEl = taskCard.querySelector('.task-title');
					// We need to get just the title text, without the due date span
					const taskTitle = taskTitleEl.childNodes[0].nodeValue.trim();
					
					// Re-create the data object with the updated notes.
					const taskData = {
						task_text: taskTitle,
						task_notes: newNotes
					};
		
					const encryptedData = encrypt(JSON.stringify(taskData), state.encryptionKey);
		
					try {
						const response = await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								task_id: taskId,
								encrypted_data: encryptedData
							})
						});
		
						const result = await response.json();
		
						if (response.ok) {
							// Update the local state so we don't re-save unnecessarily.
							taskCard.dataset.notes = newNotes;
							showToastNotification('Notes saved!');
						} else {
							// The backend will now report a meaningful error if it fails.
							alert(`Failed to save notes: ${result.message}`);
							// Revert the editor to the old notes to prevent confusion.
							notesEditor.value = currentNotes;
						}
					} catch (error) {
						alert('An error occurred while saving notes.');
						notesEditor.value = currentNotes;
					}
				}
			}
		}, true); // The 'true' is important; it enables event capturing for blur events.
		
		
		
		
		/**
		 * Handles the "more options" button on the responsive format bar.
		 */
		const formatBarMoreBtn = document.querySelector('#format-bar-more-btn');
		if (formatBarMoreBtn) {
			const formatBarDropdown = document.querySelector('#format-bar-dropdown');
			const mainFormatGroups = document.querySelector('#format-panel-main-groups');
		
			formatBarMoreBtn.addEventListener('click', (e) => {
				e.stopPropagation(); // Prevent the document click listener from closing it immediately
				
				const isShown = formatBarDropdown.classList.toggle('show');
		
				if (isShown) {
					// Clear any previous items
					formatBarDropdown.innerHTML = '';
					
					// Find all the format groups that are currently hidden
					const hiddenGroups = mainFormatGroups.querySelectorAll('.format-group:nth-child(n+3)');
					
					// Clone them and add them to the dropdown
					hiddenGroups.forEach(group => {
						formatBarDropdown.appendChild(group.cloneNode(true));
					});
				}
			});
		
			// Add a listener to close the dropdown when clicking anywhere else
			document.addEventListener('click', (e) => {
				if (formatBarDropdown.classList.contains('show') && !formatBarDropdown.contains(e.target)) {
					formatBarDropdown.classList.remove('show');
				}
			});
		}
		
		
		const handleJournalBoardInteraction = async (e) => {
			const target = e.target;
		
			if (e.type === 'touchstart') {
				const interactiveSelectors = ['[data-action]', '.journal-nav-btn'].join(',');
				if (!target.closest(interactiveSelectors)) {
					return;
				}
				e.preventDefault();
			}
		
			const entryCard = target.closest('.journal-entry-card');
		
			if (target.matches('.journal-nav-btn')) {
				const direction = target.dataset.direction === 'next' ? 1 : -1;
				state.currentJournalDate = getOffsetDate(state.currentJournalDate, direction);
				renderJournalBoard();
				return;
			}
		
			if (entryCard) {
				if (target.isContentEditable) {
					return;
				}
				
				const action = target.closest('[data-action]')?.dataset.action;
				const entryId = entryCard.dataset.entryId;
		
				if (action) {
					// An explicit action was clicked, so cancel any pending single-click timer.
					if (entryCard.dataset.clickTimer) {
						clearTimeout(parseInt(entryCard.dataset.clickTimer));
						entryCard.dataset.clickTimer = '';
					}
		
					// Now, handle the specific action that was clicked.
					if (action === 'toggle-menu') {
						const menu = entryCard.querySelector('.task-menu');
						if (menu) {
							const isVisible = menu.style.display === 'block';
							document.querySelectorAll('.task-menu').forEach(m => m.style.display = 'none');
							document.querySelectorAll('.journal-entry-card.is-menu-open').forEach(c => c.classList.remove('is-menu-open'));
							if (!isVisible) {
								entryCard.classList.add('is-menu-open');
								menu.style.display = 'block';
								const cardRect = entryCard.getBoundingClientRect();
								const menuHeight = menu.offsetHeight;
								const isNearBottom = (window.innerHeight - cardRect.bottom) < (menuHeight + 10);
								menu.classList.toggle('drop-up', isNearBottom);
							}
						}
					} else if (action === 'delete') {
						if (confirm('Are you sure you want to delete this journal entry?')) {
							fetch(`${window.APP_CONFIG.appUrl}/api/journal.php?entry_id=${entryId}`, {
								method: 'DELETE'
							}).then(res => {
								if (res.ok) entryCard.remove();
								else alert('Failed to delete entry.');
							});
						}
					} else if (action === 'notes') {
						// If "Notes" is clicked in the menu, open the editor immediately.
						openEditorById(entryId);
					}
				} else {
					// No specific action was clicked; it was a click on the card body.
					// Set a timer to open the editor, allowing time for a dblclick to cancel it.
					const clickTimer = setTimeout(() => {
						openEditorById(entryId);
					}, 250); // 250ms delay
					entryCard.dataset.clickTimer = clickTimer;
				}
			}
		};
		
		// NEW: Make the editor counters update live as the user types.
		const editorTextareaForCounter = document.querySelector('#editor-mode-editor');
		if (editorTextareaForCounter) {
			editorTextareaForCounter.addEventListener('input', updateEditorCounters);
		}
		
		
		
		journalBoardContainer.addEventListener('click', handleJournalBoardInteraction);
		journalBoardContainer.addEventListener('touchstart', handleJournalBoardInteraction);
	
		/**
		* Event listener for adding a new journal entry via the form in a column's footer.
		*/
		journalBoardContainer.addEventListener('submit', async e => {
			if (e.target.matches('.add-journal-entry-form')) {
				e.preventDefault();
				const form = e.target;
				const input = form.querySelector('input');
				const entryTitle = input.value.trim();
				const entryDate = form.dataset.date;
				if (!entryTitle || !entryDate) return;
				const jsonData = JSON.stringify({
					entry_title: entryTitle,
					entry_notes: ""
				});
				const encryptedData = encrypt(jsonData, state.encryptionKey);
				if (!encryptedData) return alert('Could not encrypt entry.');
				try {
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							entry_date: entryDate,
							encrypted_data: encryptedData
						})
					});
					if (response.ok) {
						const newEntry = await response.json();
						const entryObjectForUI = {
							entry_id: newEntry.entry_id,
							entry_date: entryDate,
							encrypted_data: encryptedData,
						};
						const newEntryEl = createJournalEntryElement(entryObjectForUI);
						const container = form.closest('.task-column').querySelector('.journal-entries-container');
						const placeholder = container.querySelector('p.text-secondary');
						if (placeholder) placeholder.remove();
						container.appendChild(newEntryEl);
						input.value = '';
						input.focus();
					} else {
						alert('Failed to add journal entry.');
					}
				} catch (error) {
					alert('An error occurred while adding the entry.');
				}
			}
		});
	
		/**
	 * Event listener for the 'Add Task' form in the editor header.
	 */
	const editorAddTaskForm = document.querySelector('#editor-add-task-form');
	if (editorAddTaskForm) { // This 'if' check prevents the error
		editorAddTaskForm.addEventListener('submit', async (e) => {
			e.preventDefault();
		
			const titleInput = document.querySelector('#editor-new-task-title');
			const columnSelect = document.querySelector('#editor-task-column-select');
			const priorityCheck = document.querySelector('#editor-task-priority-check');
		
			const taskText = titleInput.value.trim();
			if (!taskText || columnSelect.disabled) {
				return;
			}
		
			const columnId = columnSelect.value;
			const status = priorityCheck.checked ? 2 : 1;
		
			const taskData = {
				task_text: taskText,
				task_notes: ""
			};
			const encryptedData = encrypt(JSON.stringify(taskData), state.encryptionKey);
			if (!encryptedData) return alert('Could not encrypt task.');
		
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						column_id: columnId,
						encrypted_data: encryptedData,
						status: status
					})
				});
		
				if (response.ok) {
					titleInput.value = '';
					priorityCheck.checked = false;
					showToastNotification('Task Created');
				} else {
					alert('Failed to create task.');
				}
			} catch (error) {
				alert('An error occurred while creating the task.');
			}
		});
	}
		
		/**
		* Event listener for the editor's close button.
		*/
		editorModeCloseBtn.addEventListener('click', closeEditorMode);
	
		/**
		* Event listener for the main search form in the application header.
		*/
		headerJournalSearchForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const term = e.target.querySelector('input[name="term"]').value;
			const range = e.target.querySelector('select[name="range"]').value;
			const resultsContainer = document.querySelector('#main-search-output');
			performJournalSearch(term, range, resultsContainer);
			journalBoardContainer.classList.add('d-none');
			mainSearchResultsContainer.classList.remove('d-none');
		});
	
		/**
		* Event listener for the search form within the editor's ribbon.
		*/
		journalSearchForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const term = e.target.querySelector('#journal-search-term').value;
			const range = e.target.querySelector('#journal-search-range').value;
			const resultsContainer = document.querySelector('#journal-search-results-container');
			performJournalSearch(term, range, resultsContainer);
			const editorTextarea = document.querySelector('#editor-mode-editor');
			editorTextarea.classList.add('d-none');
			const journalSearchResultsArea = document.querySelector('#journal-search-results-area');
			journalSearchResultsArea.classList.remove('d-none');
		});
	
		/**
		* Event listener for interactions within the editor container (e.g., closing search results).
		*/
		editorModeContainer.addEventListener('click', (e) => {
			if (e.target.id === 'back-to-editor-btn') {
				if (state.activeEditor.entryData) {
					openEditorMode(state.activeEditor.entryData);
				}
			}
		});
	
		/**
		* Global click listener for handling modal closing and menu pop-up dismissal.
		*/
		document.addEventListener('click', e => {
			const target = e.target;
		
			if (target.matches('.close-modal-btn')) {
				const modalId = target.dataset.targetModal;
				if (modalId) {
					const modal = document.querySelector(`#${modalId}`);
					if (modal) {
						modal.classList.add('hidden');
					}
				}
			}
		
			if (!target.closest('.task-menu-container')) {
				document.querySelectorAll('.task-menu').forEach(menu => menu.style.display = 'none');
				document.querySelectorAll('.task-card').forEach(c => c.classList.remove('is-menu-open'));
				document.querySelectorAll('.journal-entry-card').forEach(c => c.classList.remove('is-menu-open'));
			}
		
			if (state.activeTaskPanel) {
				if (!state.activeTaskPanel.closest('.task-card').contains(target)) {
					state.activeTaskPanel.style.display = 'none';
					state.activeTaskPanel = null;
				}
			}
			
			if (target.id === 'close-main-search-btn') {
				mainSearchResultsContainer.classList.add('d-none');
				journalBoardContainer.classList.remove('d-none');
				headerJournalSearchForm.querySelector('input[name="term"]').value = '';
			}
		
			const resultItem = target.closest('.search-result-item');
			if (resultItem) {
				const header = target.closest('.search-result-header');
				const snippet = target.closest('.search-result-snippet');
				if (header || snippet) {
					const fullContent = resultItem.querySelector('.search-result-full-content');
					const snippetContent = resultItem.querySelector('.search-result-snippet');
					const isNowExpanded = resultItem.classList.toggle('is-expanded');
					if (fullContent) fullContent.style.display = isNowExpanded ? 'block' : 'none';
					if (snippetContent) snippetContent.style.display = isNowExpanded ? 'none' : 'block';
				}
			}
		});
		
		/**
		* Global double-click listener for opening a search result in the editor.
		*/
		document.addEventListener('dblclick', e => {
			const resultItem = e.target.closest('.search-result-item');
			if (resultItem) {
				const entryId = resultItem.dataset.entryId;
				if (editorModeContainer.classList.contains('d-none')) {
					openEditorById(entryId);
				} else if (state.activeEditor.entryData) {
					saveCurrentEditorNote().then(() => {
						openEditorById(entryId);
					});
				} else {
					openEditorById(entryId);
				}
			}
		});
	
		/**
		* Event listener for the 'Skip Weekends' toggle in the side menu.
		*/
		const skipWeekendsToggle = document.querySelector('#skip-weekends-toggle');
		if (skipWeekendsToggle) {
			skipWeekendsToggle.addEventListener('change', (e) => {
				state.skipWeekends = e.target.checked;
				localStorage.setItem('skipWeekends', state.skipWeekends);
				
				const day = state.currentJournalDate.getDay();
				if (state.skipWeekends && (day === 6 || day === 0)) {
					todayBtn.click();
				} else {
					renderJournalBoard();
				}
			});
		}
	
		/**
		* Event listener for the journal day-count view controls (1, 3, 5 days).
		*/
		viewCountControls.addEventListener('click', e => {
			const target = e.target.closest('button');
			if (!target) return;
		
			const count = parseInt(target.dataset.count, 10);
			if (count === state.journalColumnCount) return;
		
			state.journalColumnCount = count;
			viewCountControls.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
			target.classList.add('active');
		
			savePreference('journal_column_count', count);
		
			renderJournalBoard();
		});
	
		/**
		* Event listener for the 'Today' button to jump to the current date.
		*/
		todayBtn.addEventListener('click', () => {
			const today = new Date();
			today.setHours(12, 0, 0, 0);
			state.currentJournalDate = today;
		
			if (state.skipWeekends) {
				const day = state.currentJournalDate.getDay();
				if (day === 6) { 
					state.currentJournalDate.setDate(state.currentJournalDate.getDate() + 2);
				} else if (day === 0) {
					state.currentJournalDate.setDate(state.currentJournalDate.getDate() + 1);
				}
			}
			renderJournalBoard();
		});
		
		/**
		* Event listener for the date picker input to jump to a specific date.
		*/
		dateJumpInput.addEventListener('change', e => {
			const dateValue = e.target.value;
			if (dateValue) {
				const selectedDate = new Date(dateValue + 'T12:00:00');
				if (!isNaN(selectedDate.getTime())) {
					state.currentJournalDate = selectedDate;
					renderJournalBoard();
				}
			}
		});
	
		/**
		* Event listener for the 'Wrap-up' button to create a summary note for the day.
		*/
		dayWrapUpBtn.addEventListener('click', async () => {
			const dateStr = formatDate(state.currentJournalDate);
			const columnEl = document.querySelector(`.task-column[data-date="${dateStr}"]`);
			if (!columnEl) return alert('Could not find the current day\'s column.');
			const entriesToWrap = [];
			const entryCards = columnEl.querySelectorAll('.journal-entry-card');
		
			const stripHtml = (html) => {
				const tempDiv = document.createElement("div");
				tempDiv.innerHTML = html;
				return tempDiv.textContent || tempDiv.innerText || "";
			};
		
			entryCards.forEach(card => {
				const titleEl = card.querySelector('.entry-title');
				if (titleEl) {
					if (titleEl.textContent.includes('Wrap-up')) return;
		
					const decryptedString = decrypt(card.dataset.encryptedData, state.encryptionKey);
					let notes = "";
					if (decryptedString !== "[decryption failed]") {
						try {
							notes = JSON.parse(decryptedString).entry_notes || "";
						} catch(e) { /* Fails gracefully */ }
					}
					entriesToWrap.push({
						title: titleEl.textContent,
						notes: notes
					});
				}
			});
		
			if (entriesToWrap.length === 0) return alert('No entries to wrap-up for this day.');
		
			const originalDatePart = formatDate(state.currentJournalDate).replace(/-/g, '.');
			const originalWeekday = state.currentJournalDate.toLocaleDateString('en-US', {
				weekday: 'long'
			});
			const newTitle = `[${originalDatePart} ~ ${originalWeekday}] Wrap-up`;
		
			const year = state.currentJournalDate.getFullYear();
			const month = state.currentJournalDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
			const day = String(state.currentJournalDate.getDate()).padStart(2, '0');
			const formattedDate = `DATE: ${year}.${month}.${day}`;
			const weekday = `WEEKDAY: ${state.currentJournalDate.toLocaleDateString('en-us', { weekday: 'long' }).toUpperCase()}`;
			
			const headerWidth = 58;
			const titleText = "D A Y   W R A P - U P";
			const titlePadding = ' '.repeat(Math.floor((headerWidth - titleText.length) / 2));
			const datePadding = ' '.repeat(headerWidth - formattedDate.length - weekday.length - 4);
		
			const topBorder = `╓${'─'.repeat(headerWidth)}╖`;
			const titleLine = `║${titlePadding}${titleText}${' '.repeat(headerWidth - titleText.length - titlePadding.length)}║`;
			const middleBorder = `╟${'─'.repeat(headerWidth)}╢`;
			const dateLine = `║  ${formattedDate}${datePadding}${weekday}  ║`;
			const bottomBorder = `╙${'─'.repeat(headerWidth)}╜`;
			
			let newNotes = [topBorder, titleLine, middleBorder, dateLine, bottomBorder, ''].join('\n');
		
			entriesToWrap.forEach((entry, index) => {
				const title = entry.title;
				const content = stripHtml(entry.notes);
				const topicHeader = `-ˋˏ ༻ ${title} ༺ ˎˊ-`;
				const titleUnderline = '-'.repeat(topicHeader.length);
		
				newNotes += `\n${titleUnderline}\n${topicHeader}\n${titleUnderline}\n`;
		
				if (content) {
					newNotes += `${content}\n`;
				}
				
				if (index < entriesToWrap.length - 1) {
					newNotes += "\n---\n";
				}
			});
			
			const entryData = {
				entry_title: newTitle,
				entry_notes: newNotes
			};
			const encryptedData = encrypt(JSON.stringify(entryData), state.encryptionKey);
		
			if (!encryptedData) return alert('Could not encrypt the wrap-up entry.');
		
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/journal.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						entry_date: dateStr,
						encrypted_data: encryptedData,
						position: 'top'
					})
				});
		
				if (response.ok) {
					renderJournalBoard();
				} else {
					alert('Failed to save the wrap-up entry to the server.');
				}
			} catch (error) {
				alert('An error occurred while creating the wrap-up entry.');
			}
		});
		
		/**
		* Event listener for the editor's print button.
		*/
		if (editorModePrintBtn) {
			editorModePrintBtn.addEventListener('click', () => {
				const titleHTML = editorModeDatePrefix.innerHTML + ' ' + editorModeTitleText.textContent;
				const contentHTML = document.querySelector('#editor-mode-editor').value.replace(/\n/g, '<br>');
				
				const fullPrintHTML = `
					<html>
						<head>
							<title>Print - ${document.title}</title>
							<style>
								body { 
									font-family: Consolas, Monaco, 'Courier New', monospace; 
									font-size: 12pt;
									line-height: 1.5;
								}
								h1 {
									font-size: 16pt;
								}
							</style>
						</head>
						<body>
							<h1>${titleHTML}</h1>
							<div>${contentHTML}</div>
						</body>
					</html>`;
		
				const printWindow = window.open('', '_blank');
				printWindow.document.write(fullPrintHTML);
				printWindow.document.close();
				printWindow.focus();
				printWindow.print();
				printWindow.close();
			});
		}
	
	
		// Handle saving the final list of recipients
		const saveBtn = document.querySelector('#share-save-btn');
		saveBtn.addEventListener('click', async () => {
			const taskId = shareModal.dataset.taskId;
			if (!taskId) return;
		
			// Collect all recipient emails from the list
			const recipientElements = recipientList.querySelectorAll('[data-recipient-email]');
			const recipientEmails = Array.from(recipientElements).map(el => el.dataset.recipientEmail);
		
			try {
				const response = await fetch(`${window.APP_CONFIG.appUrl}/api/share.php`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						task_id: taskId,
						recipient_emails: recipientEmails
					})
				});
		
				if (response.ok) {
					shareModal.classList.add('hidden');
					showToastNotification('Share settings updated!');
					renderTaskBoard(); // Refresh board to show changes
				} else {
					const result = await response.json();
					alert(`Failed to update shares: ${result.message}`);
				}
			} catch (error) {
				alert('An error occurred while saving share settings.');
			}
		});
	
	
		/**
		* Main logic for the Find & Replace feature in the editor.
		*/
		function updateFindState() {
			const editor = document.querySelector('#editor-mode-editor');
			const searchTerm = state.findState.term;
			const content = editor.value;
			const matchCase = state.findState.matchCase;
			
			state.findState.results = [];
			state.findState.currentIndex = -1;
		
			if (!searchTerm) {
				updateFindCounter();
				return;
			}
		
			const searchFlags = matchCase ? 'g' : 'gi';
			const safeSearchTerm = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			const regex = new RegExp(safeSearchTerm, searchFlags);
			let match;
		
			while ((match = regex.exec(content)) !== null) {
				state.findState.results.push(match.index);
			}
			updateFindCounter();
		}
		
		function updateFindCounter() {
			const total = state.findState.results.length;
			const current = state.findState.currentIndex;
			findCounter.textContent = `${total > 0 ? current + 1 : 0} / ${total}`;
			
			findTermInput.classList.toggle('is-invalid', state.findState.term && total === 0);
		}
		
		function highlightCurrentMatch() {
			const results = state.findState.results;
			const currentIndex = state.findState.currentIndex;
			if (currentIndex === -1 || results.length === 0) return;
		
			const editor = document.querySelector('#editor-mode-editor');
			const start = results[currentIndex];
			const end = start + state.findState.term.length;
		
			editor.focus();
			editor.setSelectionRange(start, end);
		
			const fullText = editor.value;
			const textBefore = fullText.substring(0, start);
			const lines = textBefore.split('\n').length;
			editor.scrollTop = (lines - 5) * 1.5 * state.editorFontSize;
		
			updateFindCounter();
		}
		
		if (findReplaceForm) {
			findReplaceForm.addEventListener('click', e => {
				const target = e.target.closest('button');
				if (!target) return;
		
				const action = target.id;
				let { currentIndex, results } = state.findState;
				const total = results.length;
				const editor = document.querySelector('#editor-mode-editor');
		
				if (action === 'find-next-btn') {
					if (total === 0) return;
					state.findState.currentIndex = (currentIndex + 1) % total;
					highlightCurrentMatch();
				} else if (action === 'find-prev-btn') {
					if (total === 0) return;
					state.findState.currentIndex = (currentIndex - 1 + total) % total;
					highlightCurrentMatch();
				} else if (action === 'replace-btn') {
					if (currentIndex === -1 || total === 0) return;
					
					const start = results[currentIndex];
					const end = start + state.findState.term.length;
					
					editor.value = editor.value.substring(0, start) + state.findState.replaceTerm + editor.value.substring(end);
					
					updateFindState();
					if (state.findState.results.length > 0) {
						state.findState.currentIndex = currentIndex < state.findState.results.length ? currentIndex : state.findState.results.length - 1;
						highlightCurrentMatch();
					}
				} else if (action === 'replace-all-btn') {
					if (total === 0) return;
					
					const searchFlags = state.findState.matchCase ? 'g' : 'gi';
					const safeSearchTerm = state.findState.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
					const regex = new RegExp(safeSearchTerm, searchFlags);
		
					editor.value = editor.value.replace(regex, state.findState.replaceTerm);
					updateFindState();
				}
			});
		
			findReplaceForm.addEventListener('input', e => {
				if (e.target.id === 'find-term-input') {
					state.findState.term = e.target.value;
					updateFindState();
				} else if (e.target.id === 'replace-term-input') {
					state.findState.replaceTerm = e.target.value;
				}
			});
		
			findReplaceForm.addEventListener('change', e => {
				if (e.target.id === 'find-match-case-check') {
					state.findState.matchCase = e.target.checked;
					updateFindState();
				}
			});
		}
	
		/**
		* Event listener for handling clicks within the 'Move Task' modal.
		*/
		const moveTaskModal = document.querySelector('#move-task-modal');
		if (moveTaskModal) {
			moveTaskModal.addEventListener('click', async (e) => {
				const target = e.target;
				if (target.matches('[data-target-column-id]')) {
					const taskId = moveTaskModal.dataset.taskIdToMove;
					const targetColumnId = target.dataset.targetColumnId;
		
					if (!taskId || !targetColumnId) return;
		
					const response = await fetch(`${window.APP_CONFIG.appUrl}/api/tasks.php`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							task_id: taskId,
							column_id: targetColumnId
						})
					});
		
					if (response.ok) {
						moveTaskModal.classList.add('hidden');
						renderTaskBoard();
					} else {
						alert('Failed to move the task. Please try again.');
					}
				}
			});
		}
	
		async function initializeApp() {
			state.encryptionKey = sessionStorage.getItem('encryptionKey');
			if (!state.encryptionKey) {
				window.location.href = 'login.php';
				return;
			}
			try {
				const prefsRes = await fetch(`${window.APP_CONFIG.appUrl}/api/preferences.php?t=` + new Date().getTime());
				const prefs = await prefsRes.json();
		
				const eventsRes = await fetch(`${window.APP_CONFIG.appUrl}/api/calendar_events.php`);
				if (eventsRes.ok) {
					state.calendarEvents = await eventsRes.json();
				}
		
				if (window.APP_CONFIG && window.APP_CONFIG.debug) {
					console.log("Preferences loaded from server:", prefs);
					console.log("Calendar Events loaded:", state.calendarEvents);
				}
		
				// --- Start: Set state and UI from DB preferences ---
				if (prefs.app_title) {
					appTitleEl.textContent = prefs.app_title;
					document.title = prefs.app_title;
				}
				if (prefs.tasks_tab_title) document.querySelector('.view-tab[data-view="tasks"]').textContent = prefs.tasks_tab_title;
				if (prefs.journal_tab_title) document.querySelector('.view-tab[data-view="journal"]').textContent = prefs.journal_tab_title;
		
				state.theme = prefs.theme || 'dark';
				applyTheme();
		
				state.editorFontSize = parseInt(prefs.editor_font_size_px ?? 16);
				state.journalColumnCount = parseInt(prefs.journal_column_count ?? 3);
		
				if (prefs.custom_fillers) {
					try {
						state.customFillers = JSON.parse(prefs.custom_fillers);
						state.customFillers.forEach((fillerText, index) => {
							const input = document.querySelector(`#filler-${index + 1}`);
							if (input) input.value = fillerText;
						});
					} catch (e) {
						console.error("Could not parse custom fillers preference.", e);
						state.customFillers = [];
					}
				}
				
				// --- NEW LOGIC START ---
				// Load and parse contact aliases from preferences
				if (prefs.contact_aliases) {
					try {
						state.contact_aliases = JSON.parse(prefs.contact_aliases);
						// Ensure it's a valid object, not an array or null
						if (typeof state.contact_aliases !== 'object' || state.contact_aliases === null || Array.isArray(state.contact_aliases)) {
							console.warn('Contact aliases preference is not a valid object, resetting.');
							state.contact_aliases = {};
						}
					} catch (e) {
						console.error("Could not parse contact aliases preference.", e);
						state.contact_aliases = {};
					}
				}
				// --- NEW LOGIC END ---
		
				if (prefs.filters) {
					try {
						state.filters.savedFilters = JSON.parse(prefs.filters);
					} catch (e) {
						console.error("Could not parse saved filters preference.", e);
						state.filters.savedFilters = null;
					}
				}
		
				updateFillerTooltips();
		
				state.filters.showAssigned = !!parseInt(prefs.show_assigned ?? 1);
				state.filters.showMine = !!parseInt(prefs.show_mine ?? 1);
				state.filters.showCompleted = !parseInt(prefs.hide_completed ?? 1);
				state.filters.priorityOnly = !!parseInt(prefs.priority_only ?? 0);
				state.filters.hidePrivate = !!parseInt(prefs.hide_private ?? 0);
				state.filters.privateViewOnly = !!parseInt(prefs.private_view_only ?? 0);
				state.filters.showShared = !!parseInt(prefs.show_shared ?? 1);
				state.soundEffectsEnabled = !!parseInt(prefs.sound_effects_enabled ?? 1);
				state.sessionTimeoutMinutes = parseInt(prefs.session_timeout_minutes ?? 30);
				state.visibleCalendars = new Set(prefs.visible_calendars || []);
		
				document.querySelector('#sound-toggle').checked = state.soundEffectsEnabled;
				document.querySelector('#session-timeout-select').value = state.sessionTimeoutMinutes;
				
				document.querySelectorAll('.view-count-controls button').forEach(btn => {
					btn.classList.toggle('active', parseInt(btn.dataset.count) === state.journalColumnCount);
				});
		
				const themeToggleGroup = document.querySelector('#theme-toggle-group');
				if (themeToggleGroup) {
					themeToggleGroup.querySelector(`[data-theme="${state.theme}"]`)?.classList.add('active');
				}
		
				togglePrivateBtn.classList.toggle('active', state.filters.hidePrivate);
				taskBoardContainer.classList.toggle('hide-private', state.filters.hidePrivate);
				journalBoardContainer.classList.toggle('hide-private', state.filters.hidePrivate);
		
				const privateViewOnlyToggle = document.querySelector('#private-view-only-toggle');
				if (privateViewOnlyToggle) {
					privateViewOnlyToggle.checked = state.filters.privateViewOnly;
				}
				if (togglePrivateBtn) togglePrivateBtn.disabled = state.filters.privateViewOnly;
				
				taskBoardContainer.classList.toggle('private-only-mode', state.filters.privateViewOnly);
				journalBoardContainer.classList.toggle('private-only-mode', state.filters.privateViewOnly);
		
			} catch (error) {
				console.error("Could not load user preferences.", error);
			}
			
			// --- Start: Set state and UI from localStorage ---
			const savedView = localStorage.getItem('currentView');
			if (savedView === 'journal') state.currentView = 'journal';
			
			const savedFontSize = localStorage.getItem('appFontSize');
			if (savedFontSize) state.fontSize = parseFloat(savedFontSize);
			applyFontSize();
		
			state.skipWeekends = localStorage.getItem('skipWeekends') === 'true';
			const skipWeekendsToggle = document.querySelector('#skip-weekends-toggle');
			if(skipWeekendsToggle) {
				skipWeekendsToggle.checked = state.skipWeekends;
			}
		
			// --- Final setup ---
			const today = new Date();
			today.setHours(12, 0, 0, 0); 
			state.currentJournalDate = today;
		
			updateFooterDate();
			setInterval(updateFooterDate, 60000);
			updateView();
		
			resetSessionTimer();
		}
	
		initializeApp();
	}, 0); // A 0ms delay is all that is needed.
	});
~~~
*END FULL CODE FOR FILE: 	/assets/js/app.js*
		

## auth.js
*START FULL CODE FOR FILE: 	/assets/js/auth.js*
~~~
// A log here will confirm the script is parsed, even before the page is fully loaded.
console.log('auth.js: Script parsing started.');

document.addEventListener('DOMContentLoaded', () => {
	// This log tells us the page's HTML is ready.
	console.log('auth.js: DOMContentLoaded event fired.');

	const loginForm = document.querySelector('#login-form');
	console.log('auth.js: Searching for #login-form. Found:', loginForm);

	const registrationForm = document.querySelector('#registration-form');
	const forgotPasswordForm = document.querySelector('#forgot-password-form');
	const resetPasswordForm = document.querySelector('#reset-password-form');
	const messageDiv = document.querySelector('#message');

	if (registrationForm) {
		registrationForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const formData = new FormData(registrationForm);
			const data = Object.fromEntries(formData.entries());
			try {
				const response = await fetch('api/auth.php?action=register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				});
				const result = await response.json();
				if (result.success) {
					messageDiv.className = 'alert alert-success';
				} else {
					messageDiv.className = 'alert alert-danger';
				}
				messageDiv.textContent = result.message;
			} catch (error) {
				messageDiv.className = 'alert alert-danger';
				messageDiv.textContent = 'An error occurred during registration.';
			}
		});
	}

	if (loginForm) {
		console.log('auth.js: Login form was found. Attaching the submit event listener.');
		loginForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			console.log('auth.js: Login form SUBMITTED.');
			const formData = new FormData(loginForm);
			const data = Object.fromEntries(formData.entries());
			try {
				const response = await fetch('api/auth.php?action=login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				});
				const result = await response.json();
				if (result.success) {
					sessionStorage.setItem('encryptionKey', data.password);
					window.location.href = 'index.php';
				} else {
					messageDiv.className = 'alert alert-danger';
					messageDiv.textContent = result.message;
				}
			} catch (error) {
				messageDiv.className = 'alert alert-danger';
				messageDiv.textContent = 'Could not contact the server.';
			}
		});
	} else {
		console.log('auth.js: Login form was NOT found. No listener attached.');
	}

	if (forgotPasswordForm) {
		forgotPasswordForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const email = forgotPasswordForm.querySelector('#email').value;
			const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');

			if (!email) {
				messageDiv.className = 'alert alert-danger';
				messageDiv.textContent = 'Please enter your email address.';
				return;
			}

			messageDiv.className = 'alert alert-info';
			messageDiv.textContent = 'Sending request...';
			submitButton.disabled = true;

			try {
				const response = await fetch('api/auth.php?action=forgot_password', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: email })
				});

				const result = await response.json();

				if (result.success) {
					messageDiv.className = 'alert alert-success';
				} else {
					messageDiv.className = 'alert alert-danger';
					submitButton.disabled = false;
				}
				messageDiv.textContent = result.message;

			} catch (error) {
				messageDiv.className = 'alert alert-danger';
				messageDiv.textContent = 'Could not contact the server.';
				submitButton.disabled = false;
			}
		});
	}
	
	if (resetPasswordForm) {
		resetPasswordForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			
			const token = resetPasswordForm.querySelector('input[name="token"]').value;
			const newPassword = resetPasswordForm.querySelector('#new-password').value;
			const confirmPassword = resetPasswordForm.querySelector('#confirm-password').value;

			if (!newPassword || !confirmPassword) {
				messageDiv.className = 'alert alert-danger';
				messageDiv.textContent = 'Please fill in all fields.';
				return;
			}
			if (newPassword !== confirmPassword) {
				messageDiv.className = 'alert alert-danger';
				messageDiv.textContent = 'Passwords do not match.';
				return;
			}

			try {
				const response = await fetch('api/auth.php?action=reset_password', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token: token, newPassword: newPassword })
				});

				const result = await response.json();

				if (result.success) {
					messageDiv.className = 'alert alert-success text-center';
					resetPasswordForm.style.display = 'none';
					// MODIFIED: Use innerHTML to add the success message and a login button.
					messageDiv.innerHTML = `
						${result.message}
						<br><br>
						<a href="login.php" class="btn btn-secondary btn-sm">Back to Login</a>
					`;
				} else {
					messageDiv.className = 'alert alert-danger';
					messageDiv.textContent = result.message;
				}
			} catch (error) {
				messageDiv.className = 'alert alert-danger';
				messageDiv.textContent = 'An error occurred. Please try again.';
			}
		});
	}
});
~~~
*END FULL CODE FOR FILE: 	/assets/js/auth.js*
		

## forgot-password.php
*START FULL CODE FOR FILE: 	forgot-password.php*
~~~
<?php
// Use __DIR__ to include the config for the APP_URL constant
require_once __DIR__ . '/includes/config.php';
?>
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Forgot Password - MyDayHub</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
	<script>
		// Pass the appUrl to JavaScript for API calls
		window.APP_CONFIG = {
			appUrl: <?php echo json_encode(APP_URL); ?>
		};
	</script>
	<style>
		body {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
		}
		.auth-card {
			width: 100%;
			max-width: 420px;
			padding: 2rem;
			border: 0;
			border-radius: 1rem;
			background-color: rgba(33, 37, 41, 0.9);
			backdrop-filter: blur(10px);
		}
	</style>
</head>
<body>

	<div class="card auth-card">
		<div class="card-body">
			<h3 class="card-title text-center mb-4">Forgot Password</h3>
			
			<p class="text-secondary text-center small mb-3">Enter your email address and we will send you a link to reset your password.</p>

			<div id="message" class="mb-3"></div>

			<form id="forgot-password-form">
				<div class="mb-3">
					<label for="email" class="form-label">Email address</label>
					<input type="email" class="form-control" id="email" name="email" required>
				</div>

				<div class="alert alert-warning small p-2 mb-3" role="alert">
					<strong>Warning:</strong> Because this is a zero-knowledge app, resetting your password creates a new encryption key. All of your existing encrypted data will become permanently unreadable.
				</div>

				<div class="d-grid">
					<button type="submit" class="btn btn-primary">Send Reset Link</button>
				</div>
			</form>

			<div class="text-center mt-4">
				<p class="mb-0 small">
					Remembered your password? <a href="login.php">Back to Login</a>
				</p>
			</div>
		</div>
	</div>

	<script src="assets/js/auth.js"></script>
</body>
</html>
~~~
*END FULL CODE FOR FILE: 	forgot-password.php*


## login.php
*START FULL CODE FOR FILE: 	login.php*
~~~
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Login - MyDayHub</title>
	
	<link rel="icon" href="assets/images/favicon.png" type="image/png">
	<link rel="apple-touch-icon" href="assets/images/icon.png">

	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
	<style>
		body {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
		}
		.auth-card {
			width: 100%;
			max-width: 420px;
			padding: 2rem;
			border: 0;
			border-radius: 1rem;
			background-color: rgba(33, 37, 41, 0.9);
			backdrop-filter: blur(10px);
		}
		.login-logo-container {
			text-align: center;
			margin-bottom: 1.5rem;
		}
		.login-logo-container img {
			max-width: 200px;
			height: auto;
			border-radius: 12px; /* Rounded corners */
		}
	</style>
</head>
<body>

	<div class="card auth-card">
		<div class="card-body">
			<div class="login-logo-container">
				<img src="assets/images/sitelogo.png" alt="MyDayHub Logo">
			</div>

			<h3 class="card-title text-center mb-4">Login</h3>

			<div id="message" class="mb-3"></div>

			<form id="login-form"  novalidate>
				<div class="mb-3">
					<label for="username" class="form-label">Username</label>
					<input type="text" class="form-control" id="username" name="username" required>
				</div>
				<div class="mb-3">
					<label for="password" class="form-label">Password</label>
					<input type="password" class="form-control" id="password" name="password" required>
				</div>

				<div class="alert alert-warning small p-2 mb-3" role="alert">
					<strong>Zero Knowledge Notice:</strong> We cannot recover your password. A forgotten password means your encrypted data will be lost forever.
				</div>

				<div class="d-grid">
					<button type="submit" class="btn btn-primary">Login</button>
				</div>
			</form>

			<div class="text-center mt-4">
				<p class="mb-0 small">
					<a href="forgot-password.php">Forgot Password?</a> | 
					<a href="register.php">Register here</a>
				</p>
			</div>
		</div>
	</div>

	<script src="assets/js/auth.js"></script>
</body>
</html>
~~~
*END FULL CODE FOR FILE: 	login.php*


## logout.php
*START FULL CODE FOR FILE: 	logout.php*
~~~
<?php
// 1. Initialize the session
session_start();

// 2. Unset all of the session variables
$_SESSION = array();

// 3. Destroy the session cookie
if (ini_get("session.use_cookies")) {
	$params = session_get_cookie_params();
	setcookie(session_name(), '', time() - 42000,
		$params["path"], $params["domain"],
		$params["secure"], $params["httponly"]
	);
}

// 4. Finally, destroy the session
session_destroy();

// 5. Redirect to the login page
header("Location: login.php");
exit;
?>
~~~
*END FULL CODE FOR FILE: 	logout.php*


## register.php
*START FULL CODE FOR FILE: 	register.php*
~~~
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Register - Tasks & Journal</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
	<style>
		body {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
		}
		.auth-card {
			width: 100%;
			max-width: 420px; /* Increased width slightly for new text */
			padding: 2rem;
			border: 0;
			border-radius: 1rem;
			background-color: rgba(33, 37, 41, 0.9);
			backdrop-filter: blur(10px);
		}
	</style>
</head>
<body>

	<div class="card auth-card">
		<div class="card-body">
			<h3 class="card-title text-center mb-4">Create Account</h3>

			<div id="message" class="mb-3"></div>

			<form id="registration-form">
				<div class="mb-3">
					<label for="username" class="form-label">Username</label>
					<input type="text" class="form-control" id="username" name="username" required>
				</div>
				<div class="mb-3">
					<label for="email" class="form-label">Email address</label>
					<input type="email" class="form-control" id="email" name="email" required>
				</div>
				<div class="mb-3">
					<label for="password" class="form-label">Password</label>
					<input type="password" class="form-control" id="password" name="password" required>
				</div>

				<div class="alert alert-warning small p-2 mb-3" role="alert">
					<strong>Important:</strong> Your password encrypts your data. We cannot recover it. If you forget your password, your data will be permanently lost.
				</div>

				<div class="d-grid">
					<button type="submit" class="btn btn-primary">Register</button>
				</div>
			</form>

			<div class="text-center mt-4">
				<p class="mb-0">Already have an account? <a href="login.php">Login here</a></p>
			</div>
		</div>
	</div>

	<script src="assets/js/auth.js"></script>
</body>
</html>
~~~
*END FULL CODE FOR FILE: 	register.php*

## reset-password.php
*START FULL CODE FOR FILE: 	reset-password.php*
~~~
<?php
require_once __DIR__ . '/includes/config.php';
require_once BASE_PATH . 'includes/db.php';

$token_is_valid = false;
$error_message = '';
$token = $_GET['token'] ?? '';

if (!empty($token)) {
	// Check if the token exists and has not expired.
	$stmt = $pdo->prepare("SELECT user_id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()");
	$stmt->execute([$token]);
	$user = $stmt->fetch();

	if ($user) {
		$token_is_valid = true;
	} else {
		$error_message = "This password reset link is invalid or has expired. Please request a new one.";
	}
} else {
	$error_message = "No password reset token was provided. Please use the link from your email.";
}
?>
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reset Password - MyDayHub</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
	<script>
		window.APP_CONFIG = {
			appUrl: <?php echo json_encode(APP_URL); ?>
		};
	</script>
	<style>
		body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
		.auth-card { width: 100%; max-width: 420px; padding: 2rem; border: 0; border-radius: 1rem; background-color: rgba(33, 37, 41, 0.9); backdrop-filter: blur(10px); }
	</style>
</head>
<body>

	<div class="card auth-card">
		<div class="card-body">
			<h3 class="card-title text-center mb-4">Set New Password</h3>
			<div id="message" class="mb-3"></div>

			<?php if ($token_is_valid): ?>
				<form id="reset-password-form">
					<input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
					<div class="mb-3">
						<label for="new-password" class="form-label">New Password</label>
						<input type="password" class="form-control" id="new-password" name="newPassword" required>
					</div>
					<div class="mb-3">
						<label for="confirm-password" class="form-label">Confirm New Password</label>
						<input type="password" class="form-control" id="confirm-password" name="confirmPassword" required>
					</div>
					<div class="d-grid">
						<button type="submit" class="btn btn-primary">Reset Password</button>
					</div>
				</form>
			<?php else: ?>
				<div class="alert alert-danger"><?php echo htmlspecialchars($error_message); ?></div>
				<div class="text-center mt-4">
					<a href="forgot-password.php">Request another link</a>
				</div>
			<?php endif; ?>
		</div>
	</div>

	<script src="assets/js/auth.js"></script>
</body>
</html>
~~~
*END FULL CODE FOR FILE: 	reset-password.php*

## verify.php
*START FULL CODE FOR FILE: 	verify.php*
~~~
<?php
require_once __DIR__ . '/includes/config.php';
require_once BASE_PATH . 'includes/db.php';

$message = '';
$alert_class = 'alert-danger'; // Default to an error style

if (isset($_GET['token']) && !empty($_GET['token'])) {
	$token = $_GET['token'];

	// Find a user with the given verification token
	$stmt = $pdo->prepare("SELECT * FROM users WHERE email_verification_token = ?");
	$stmt->execute([$token]);
	$user = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($user) {
		// User found, update their status to verified and clear the token
		$update_stmt = $pdo->prepare(
			"UPDATE users SET is_email_verified = 1, email_verification_token = NULL WHERE user_id = ?"
		);
		if ($update_stmt->execute([$user['user_id']])) {
			$message = "Your account has been successfully verified! You can now log in.";
			$alert_class = 'alert-success';
		} else {
			$message = "An error occurred while verifying your account. Please try again or contact support.";
		}
	} else {
		// No user found with that token
		$message = "This verification link is invalid or has already been used.";
	}
} else {
	// No token provided in the URL
	$message = "Invalid verification link. Please make sure you have copied the full URL from your email.";
}
?>
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Account Verification - Tasks & Journal</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
	<style>
		body {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
		}
		.auth-card {
			width: 100%;
			max-width: 500px;
			padding: 2rem;
			border: 0;
			border-radius: 1rem;
			background-color: rgba(33, 37, 41, 0.9);
			backdrop-filter: blur(10px);
		}
	</style>
</head>
<body>
	<div class="card auth-card">
		<div class="card-body text-center">
			<h3 class="card-title mb-4">Account Verification</h3>
			<div class="alert <?php echo $alert_class; ?>" role="alert">
				<?php echo htmlspecialchars($message); ?>
			</div>
			<?php if ($alert_class === 'alert-success'): ?>
				<a href="login.php" class="btn btn-primary">Go to Login</a>
			<?php endif; ?>
		</div>
	</div>
</body>
</html>
~~~
*END FULL CODE FOR FILE: 	verify.php*