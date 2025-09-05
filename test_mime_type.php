<?php

/**
 * A self-contained script to specifically test the mime_content_type() function.
 * This is designed to trigger a fatal error if the 'fileinfo' extension is missing.
 */

// Handle the POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	
	header('Content-Type: text/plain');
	echo "--- MIME TYPE TEST RESULTS ---\n\n";

	// Check if a file was sent
	if (!isset($_FILES['testfile']) || $_FILES['testfile']['error'] !== UPLOAD_ERR_OK) {
		echo "   ❌ ERROR: No file was uploaded or an error occurred.\n";
		exit;
	}

	$file = $_FILES['testfile'];
	echo "1. File received: " . htmlspecialchars($file['name']) . "\n";
	echo "2. Attempting to call mime_content_type()...\n\n";

	// This is the line that will cause a fatal error if fileinfo is not loaded.
	$mime_type = mime_content_type($file['tmp_name']);

	// If the script reaches this point, the extension IS working.
	echo "   ✅ SUCCESS! The mime_content_type() function is available.\n";
	echo "   Detected MIME type: " . htmlspecialchars($mime_type) . "\n";

	exit; 
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>MIME Type Test</title>
	<style>
		body { font-family: sans-serif; padding: 2em; line-height: 1.6; }
		.container { max-width: 600px; margin: 0 auto; border: 1px solid #ccc; padding: 2em; border-radius: 8px; }
		input { width: 100%; padding: 8px; margin-bottom: 1em; box-sizing: border-box; }
		input[type="submit"] { background-color: #dc3545; color: white; border: none; cursor: pointer; }
		h1 { margin-top: 0; }
		code { background-color: #f1f1f1; padding: 2px 5px; border-radius: 3px; }
	</style>
</head>
<body>
	<div class="container">
		<h1><code>mime_content_type()</code> Test</h1>
		<p>This script will specifically test the function that is failing in the main application. This test is expected to fail with a 500 server error if the <code>fileinfo</code> extension is not properly installed.</p>
		<form action="test_mime_type.php" method="post" enctype="multipart/form-data">
			<label for="file-input">Select any file to test:</label>
			<input id="file-input" type="file" name="testfile">
			<input type="submit" value="Run Test">
		</form>
	</div>
</body>
</html>