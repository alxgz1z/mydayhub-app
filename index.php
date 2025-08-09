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

                <button id="mobile-menu-toggle" class="btn-icon">&#9776;</button>
                <div id="mobile-menu-dropdown"></div>
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
                    <button id="editor-btn-maximize" class="btn-icon" title="Maximize">⬚</button>
                    <button id="editor-btn-restore" class="btn-icon" title="Restore" style="display: none;">□</button>
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
                            
                            <button class="btn-icon" title="Calculate Selection" data-action="calculate">🔢</button>
                        
                            <button class="btn-icon" title="Decrease Font Size" data-action="font-size" data-change="-1">A-</button>
                            <button class="btn-icon" title="Increase Font Size" data-action="font-size" data-change="1">A+</button>
                        </div>
                        </div>
                    </div>
                    <div class="ribbon-panel" id="editor-panel-find-replace">
                        </div>
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