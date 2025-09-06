<?php
/**
 * MyDayHub - File Upload Test
 *
 * A self-contained script to diagnose file upload issues.
 * It checks:
 * 1. If the target directory exists.
 * 2. If the target directory is writable.
 * 3. The result of the move_uploaded_file() operation.
 *
 * This helps isolate server permission/configuration issues from application logic.
 */

// --- CONFIGURATION ---
// Define the target directory relative to this script's location.
$upload_dir = __DIR__ . '/media/imgs/';
$message = '';

// --- LOGIC ---
// Check if the form has been submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	// Check if a file was uploaded without errors
	if (isset($_FILES['test_file']) && $_FILES['test_file']['error'] === UPLOAD_ERR_OK) {
		
		$file_tmp_path = $_FILES['test_file']['tmp_name'];
		$file_name = $_FILES['test_file']['name'];
		$destination_path = $upload_dir . basename($file_name);

		$message .= "Processing file: " . htmlspecialchars($file_name) . "<br>";
		$message .= "Temporary location: " . htmlspecialchars($file_tmp_path) . "<br>";
		$message .= "Target directory: " . htmlspecialchars($upload_dir) . "<br>";

		// 1. Check if the target directory exists
		if (!is_dir($upload_dir)) {
			$message .= "<strong style='color:red;'>ERROR:</strong> The target directory does not exist. Please create it.<br>";
		} else {
			$message .= "<span style='color:green;'>SUCCESS:</span> Target directory exists.<br>";

			// 2. Check if the target directory is writable
			if (!is_writable($upload_dir)) {
				$message .= "<strong style='color:red;'>ERROR:</strong> The target directory is NOT WRITABLE. Please check server permissions.<br>";
			} else {
				$message .= "<span style='color:green;'>SUCCESS:</span> Target directory is writable.<br>";

				// 3. Attempt to move the uploaded file
				if (move_uploaded_file($file_tmp_path, $destination_path)) {
					$message .= "<strong style='color:green;'>SUCCESS:</strong> File was uploaded and moved successfully! You can verify its existence in the directory.<br>";
				} else {
					$message .= "<strong style='color:red;'>ERROR:</strong> Failed to move the uploaded file. This could be due to more restrictive server policies or permissions.<br>";
				}
			}
		}
	} else {
		// Handle upload errors
		$error_code = isset($_FILES['test_file']['error']) ? $_FILES['test_file']['error'] : 'Unknown';
		$message .= "<strong style='color:red;'>ERROR:</strong> No file was uploaded or an error occurred during upload. Error Code: " . $error_code . "<br>";
		$message .= "Please see PHP documentation for upload error codes. For example, code 1 means the file exceeds the 'upload_max_filesize' directive in php.ini.<br>";
	}
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>File Upload Test</title>
	<style>
		body { font-family: sans-serif; margin: 2em; background-color: #f4f4f9; }
		.container { background-color: #fff; padding: 2em; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
		.message { border: 1px solid #ccc; padding: 1em; margin-top: 1em; background-color: #e9e9e9; border-radius: 4px; }
	</style>
</head>
<body>
	<div class="container">
		<h1>File Upload Test for MyDayHub</h1>
		<p>This form tests the server's ability to upload a file to the <code>/media/imgs/</code> directory.</p>
		<form action="upload_test.php" method="POST" enctype="multipart/form-data">
			<p>
				<label for="file">Select a small image to upload:</label><br><br>
				<input type="file" name="test_file" id="file">
			</p>
			<br>
			<button type="submit">Upload File</button>
		</form>

		<?php if (!empty($message)): ?>
			<div class="message">
				<h2>Test Results:</h2>
				<?php echo $message; ?>
			</div>
		<?php endif; ?>
	</div>
</body>
</html>