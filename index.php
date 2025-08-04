<?php
/**
 * MyDayHub 4.0.0 Beta - Main Application Shell
 */

// Load the core application configuration.
require_once __DIR__ . '/includes/config.php';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>MyDayHub</title>

    <link rel="icon" href="assets/images/favicon.png" type="image/png">
    <link rel="stylesheet" href="/assets/css/style.css">
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
            </div>
        </header>

        <main id="main-content">
            <div id="task-board-container" class="view-container active">
                <div id="task-columns-wrapper">
                </div>
            </div>
        
            <div id="journal-view-container" class="view-container">
            </div>
        
            <div id="outlines-view-container" class="view-container">
            </div>
        
            <div id="meetings-view-container" class="view-container">
            </div>
        </main>
        
        <div id="move-mode-cancel-bar">
            <button id="btn-cancel-move" class="btn btn-secondary">Cancel Move</button>
        </div>

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

    <script defer src="/assets/js/tasks.js"></script>
    <script defer src="/assets/js/app.js"></script>

</body>
</html>