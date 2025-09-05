<?php
// A self-contained script to test file uploads end-to-end.

// --- STEP 1: Define the destination directory ---
$upload_dir = __DIR__ . '/media/imgs/';

// --- STEP 2: Handle the POST request when the form is submitted ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	
	header('Content-Type: text/plain'); // Set plain text for clean output
	echo "--- UPLOAD TEST RESULTS ---\n\n";

	// A. Check if the destination directory exists and is writable
	echo "1. Checking destination directory...\n";
	echo "   Path: " . $upload_dir . "\n";
	if (!is_dir($upload_dir)) {
		echo "   ❌ ERROR: Destination directory does not exist.\n";
		exit;
	}
	if (!is_writable($upload_dir)) {
		echo "   ❌ ERROR: Destination directory is NOT WRITABLE by the server.\n";
		echo "   This is the most likely cause of failure. Please re-verify ownership and permissions.\n";
		exit;
	}
	echo "   ✅ Directory exists and is writable.\n\n";
	
	// B. Check if a file was actually sent and if there are any upload errors
	echo "2. Checking uploaded file data...\n";
	if (!isset($_FILES['testfile']) || !is_uploaded_file($_FILES['testfile']['tmp_name'])) {
		echo "   ❌ ERROR: No file was uploaded or there was a server error.\n";
		echo "   Check your server's main error log (php_error_log) for details.\n";
		exit;
	}

	$file = $_FILES['testfile'];

	if ($file['error'] !== UPLOAD_ERR_OK) {
		echo "   ❌ ERROR: File upload failed with error code: " . $file['error'] . "\n";
		echo "   Refer to PHP documentation for what this code means.\n";
		exit;
	}
	echo "   ✅ File received successfully.\n";
	echo "   - Original Name: " . htmlspecialchars($file['name']) . "\n";
	echo "   - Temp Name: " . htmlspecialchars($file['tmp_name']) . "\n";
	echo "   - Size: " . $file['size'] . " bytes\n";
	echo "   - Type: " . $file['type'] . "\n\n";

	// C. Try to move the file to its final destination
	echo "3. Attempting to move the file...\n";
	$original_filename = basename($file['name']);
	$destination_path = $upload_dir . $original_filename;
	
	if (move_uploaded_file($file['tmp_name'], $destination_path)) {
		echo "   ✅ SUCCESS! File was moved to:\n";
		echo "   " . htmlspecialchars($destination_path) . "\n";
	} else {
		echo "   ❌ FAILED: move_uploaded_file() returned false.\n";
		echo "   This confirms a critical failure, almost certainly due to incorrect directory ownership or permissions.\n";
	}

	exit; // Stop the script after processing
}

// --- STEP 3: Display the HTML form for GET requests ---
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>PHP File Upload Test</title>
	<style>
		body { font-family: sans-serif; padding: 2em; line-height: 1.6; }
		.container { max-width: 600px; margin: 0 auto; border: 1px solid #ccc; padding: 2em; border-radius: 8px; }
		input { width: 100%; padding: 8px; margin-bottom: 1em; box-sizing: border-box; }
		input[type="submit"] { background-color: #007bff; color: white; border: none; cursor: pointer; }
		h1 { margin-top: 0; }
	</style>
</head>
<body>
	<div class="container">
		<h1>PHP File Upload Test</h1>
		<p>This form will attempt to upload a file to the <code>/media/imgs/</code> directory.</p>
		<form action="test_upload.php" method="post" enctype="multipart/form-data">
			<label for="file-input">Select a file to upload:</label>
			<input id="file-input" type="file" name="testfile">
			<input type="submit" value="Upload File">
		</form>
	</div>
</body>
</html>