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
                <img src="/assets/images/sitelogo.png" alt="MyDayHub Logo" id="header-logo">
                <h1 id="app-title">MyDayHub</h1>
                <nav class="view-tabs">
                    <button class="view-tab active" data-view="tasks">Tasks</button>
                    <button class="view-tab" data-view="journal">Journal</button>
                    <button class="view-tab" data-view="outlines">Outlines</button>
                    <button class="view-tab" data-view="meetings">Meetings</button>
                </nav>
            </div>
            <div class="header-right">
                </div>
        </header>

        <main id="main-content">
            <div id="task-board-container" class="view-container active">
                <div id="add-column-form-container">
                    <form id="add-column-form">
                        <input type="text" id="new-column-title" class="form-control" placeholder="Add New Column..." maxlength="50" required>
                        <button type="submit" class="btn btn-primary">Add</button>
                    </form>
                </div>
                <div id="task-columns-wrapper">
                    </div>
            </div>

            <div id="journal-view-container" class="view-container" style="display: none;">
                </div>

            <div id="outlines-view-container" class="view-container" style="display: none;">
                </div>

            <div id="meetings-view-container" class="view-container" style="display: none;">
                </div>
        </main>

    </div>

    <script defer src="/assets/js/app.js"></script>

</body>
</html>