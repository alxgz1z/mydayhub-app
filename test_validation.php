<?php

/**
 * A self-contained script to test the multi-layered image validation logic.
 * This version uses getimagesize() as an alternative to the fileinfo extension.
 */

// --- HELPER FUNCTION: Our new validation logic ---
function is_valid_image_upload(array $file): bool {
	// 1. Check for basic upload errors
	if ($file['error'] !== UPLOAD_ERR_OK) {
		return false;
	}

	// 2. Check file extension
	$allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
	$file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
	if (!in_array($file_extension, $allowed_extensions)) {
		return false;
	}

	// 3. Use getimagesize() to verify it's a real image by reading its structure
	// The '@' suppresses warnings if the file is not an image, allowing us to handle the error gracefully.
	if (@getimagesize($file['tmp_name']) === false) {
		return false;
	}

	return true;
}

// --- Define the destination directory ---
$upload_dir = __DIR__ . '/media/imgs/';

// --- Handle the POST request when the form is submitted ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	
	header('Content-Type: text/plain');
	echo "--- VALIDATION TEST RESULTS ---\n\n";

	// A. Check that a file was sent
	if (!isset($_FILES['testfile']) || empty($_FILES['testfile']['tmp_name'])) {
		echo "   ❌ ERROR: No file was uploaded. Please select a file and try again.\n";
		exit;
	}

	$file = $_FILES['testfile'];
	echo "1. File received successfully.\n";
	echo "   - Original Name: " . htmlspecialchars($file['name']) . "\n\n";

	// B. Perform our multi-layered validation
	echo "2. Performing security validation...\n";
	if (is_valid_image_upload($file)) {
		echo "   ✅ Validation Passed: File appears to be a valid image.\n\n";
	
		// C. If validation passes, attempt to move the file
		echo "3. Attempting to move the file...\n";
		$original_filename = basename($file['name']);
		$destination_path = $upload_dir . $original_filename;
	
		if (move_uploaded_file($file['tmp_name'], $destination_path)) {
			echo "   ✅ SUCCESS! File was moved to:\n";
			echo "   " . htmlspecialchars($destination_path) . "\n";
		} else {
			echo "   ❌ FAILED: move_uploaded_file() returned false.\n";
			echo "   This suggests a lingering file permission/ownership issue.\n";
		}

	} else {
		echo "   ❌ Validation FAILED: The file is not a valid image or is of a disallowed type.\n";
		echo "   The upload was correctly and securely aborted.\n";
	}

	exit; // Stop the script after processing
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>PHP Validation Test</title>
	<style>
		body { font-family: sans-serif; padding: 2em; line-height: 1.6; }
		.container { max-width: 600px; margin: 0 auto; border: 1px solid #ccc; padding: 2em; border-radius: 8px; }
		input { width: 100%; padding: 8px; margin-bottom: 1em; box-sizing: border-box; }
		input[type="submit"] { background-color: #007bff; color: white; border: none; cursor: pointer; }
		h1 { margin-top: 0; }
		code { background-color: #f1f1f1; padding: 2px 5px; border-radius: 3px; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Image Validation Test</h1>
		<p>This form will test a multi-layered image validation function that does not require the <code>fileinfo</code> extension.</p>
		<form action="test_validation.php" method="post" enctype="multipart/form-data">
			<label for="file-input">Select a file to upload:</label>
			<input id="file-input" type="file" name="testfile">
			<input type="submit" value="Upload & Validate">
		</form>
	</div>
</body>
</html>