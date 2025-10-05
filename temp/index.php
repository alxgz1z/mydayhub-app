<?php
// Use __DIR__ to create a robust path to the config file.
require_once __DIR__ . '/includes/config.php';
session_start();

// NEW: Define a base path for HTML assets (CSS, JS) to handle dev vs. prod environments
$asset_base_path = (defined('DEV_MODE') && DEV_MODE) ? '/dev/' : '/';

// Developer redirect logic
if (isset($_SESSION['username']) && $_SESSION['username'] === 'toronjo' && strpos($_SERVER['REQUEST_URI'], '/dev/') === false) {
    header('Location: /dev/index.php');
    exit;
}

// Session check
if (!isset($_SESSION['user_id'])) {
    // MODIFIED: Use the asset base path for the redirect
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
    <script>
        // Pass PHP config variables to JavaScript
        window.APP_CONFIG = {
            debug: <?php echo json_encode(defined('DEBUG_MODE') && DEBUG_MODE); ?>,
            // MODIFIED: Use the dynamic asset path and trim the trailing slash
            // This will result in '/dev' or '' (an empty string)
            appUrl: <?php echo json_encode(rtrim($asset_base_path, '/')); ?>
        };
    </script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="<?php echo $asset_base_path; ?>assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.1/math.min.js"></script>
</head>

<body>

    <?php 
    include BASE_PATH . 'includes/_manual.php'; 
    ?>

    <div id="side-menu">
        <div class="side-menu-header">
            <h3>Menu</h3>
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

    <?php if (defined('DEV_MODE') && DEV_MODE): ?>
        <div id="dev-banner">🚧 MAINTENANCE IN PROGRESS 🚧</div>
    <?php endif; ?>

    <div id="main-app-container">
        <header id="app-header" class="container-fluid">
            <div class="header-left">
                <button id="side-menu-toggle-btn" class="btn-icon" title="Menu" style="font-size: 1.8rem; margin-right: 0.5rem; opacity: 1;">&#9776;</button>
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
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>
    <script src="<?php echo $asset_base_path; ?>assets/js/app.js"></script>
</body>
</html>