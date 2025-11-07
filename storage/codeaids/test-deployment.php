<?php
/**
 * Deployment Test File
 * 
 * This file helps verify that auto-deployment is working.
 * It displays the current commit hash and last deployment time.
 * 
 * Usage: Visit https://breveasy.com/test-deployment.php
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Deployment Test - Breveasy.com</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #1a1a1a;
            color: #0f0;
        }
        .info-box {
            background: #2a2a2a;
            border: 1px solid #0f0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        h1 { color: #0f0; }
        .label { color: #0a0; font-weight: bold; }
        .value { color: #0f0; }
        .error { color: #f00; }
        .success { color: #0f0; }
    </style>
</head>
<body>
    <h1>🚀 Breveasy.com Deployment Test</h1>
    
    <div class="info-box">
        <p><span class="label">Test File Created:</span> <span class="value"><?php echo date('Y-m-d H:i:s'); ?></span></p>
        <p><span class="label">Server Time:</span> <span class="value"><?php echo date('Y-m-d H:i:s T'); ?></span></p>
    </div>

    <div class="info-box">
        <h2>Git Information</h2>
        <?php
        $gitDir = __DIR__ . '/.git';
        $gitHeadFile = $gitDir . '/HEAD';
        
        if (file_exists($gitDir)) {
            echo '<p class="success">✓ Git repository found</p>';
            
            // Get current commit hash
            $gitHash = 'unknown';
            if (file_exists($gitHeadFile)) {
                $headContent = trim(file_get_contents($gitHeadFile));
                if (strpos($headContent, 'ref:') === 0) {
                    $refPath = trim(str_replace('ref:', '', $headContent));
                    $refFile = $gitDir . '/' . $refPath;
                    if (file_exists($refFile)) {
                        $gitHash = substr(trim(file_get_contents($refFile)), 0, 7);
                    }
                } else {
                    $gitHash = substr($headContent, 0, 7);
                }
            }
            
            echo '<p><span class="label">Current Commit:</span> <span class="value">' . htmlspecialchars($gitHash) . '</span></p>';
            
            // Get last commit message
            $lastCommitFile = $gitDir . '/logs/HEAD';
            if (file_exists($lastCommitFile)) {
                $lines = file($lastCommitFile);
                if (!empty($lines)) {
                    $lastLine = trim(end($lines));
                    $parts = explode("\t", $lastLine);
                    if (isset($parts[1])) {
                        echo '<p><span class="label">Last Commit Message:</span> <span class="value">' . htmlspecialchars($parts[1]) . '</span></p>';
                    }
                }
            }
            
            // Check if behind/ahead
            $gitStatus = shell_exec('cd ' . escapeshellarg(__DIR__) . ' && git status -sb 2>&1');
            if ($gitStatus) {
                echo '<p><span class="label">Git Status:</span></p>';
                echo '<pre style="background: #1a1a1a; padding: 10px; border: 1px solid #0a0;">' . htmlspecialchars($gitStatus) . '</pre>';
            }
        } else {
            echo '<p class="error">✗ Git repository not found</p>';
        }
        ?>
    </div>

    <div class="info-box">
        <h2>File Information</h2>
        <p><span class="label">File Path:</span> <span class="value"><?php echo __FILE__; ?></span></p>
        <p><span class="label">File Modified:</span> <span class="value"><?php echo date('Y-m-d H:i:s', filemtime(__FILE__)); ?></span></p>
        <p><span class="label">PHP Version:</span> <span class="value"><?php echo phpversion(); ?></span></p>
    </div>

    <div class="info-box">
        <h2>Instructions</h2>
        <ol>
            <li>This file was created in localhost and committed to GitHub</li>
            <li>If auto-deployment is working, this file should appear on breveasy.com</li>
            <li>Check the commit hash above - it should match the latest commit on GitHub</li>
            <li>If the commit hash doesn't match, auto-deployment is not working</li>
        </ol>
    </div>

    <div class="info-box">
        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Check Hostinger Control Panel → Git Integration</li>
            <li>Verify webhook is configured (if using webhooks)</li>
            <li>Check cron jobs (if using scheduled pulls)</li>
            <li>Consider using GitHub Actions workflow (see DEPLOYMENT_DIAGNOSTIC.md)</li>
        </ul>
    </div>
</body>
</html>

