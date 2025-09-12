<?php
/**
 * MyDayHub Beta 6 - Mailer Test Script
 *
 * This is a standalone diagnostic script to test the email sending functionality.
 * It bypasses the main application's API gateway to directly test the mailer.
 *
 * Instructions:
 * 1. Place this file in the root directory of your MyDayHub application.
 * 2. Change the $recipientEmail and $recipientName variables below.
 * 3. Access this file directly in your browser (e.g., http://localhost/mydayhub/test_mailer.php).
 */

// Force maximum error reporting to the screen for this test.
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<pre>"; // Use <pre> tag for cleaner output formatting.

echo "--- Mailer Test Initialized ---<br>";

try {
	// --- 1. Bootstrap the necessary files ---
	echo "Loading configuration...<br>";
	require_once __DIR__ . '/incs/config.php';
	echo "Configuration loaded.<br>";

	echo "Loading mailer utility...<br>";
	require_once __DIR__ . '/incs/mailer.php';
	echo "Mailer utility loaded.<br>";

	// --- 2. Configuration Check ---
	echo "Checking SMTP configuration...<br>";
	if (!defined('SMTP_HOST') || !getenv('SMTP_HOST')) die("ERROR: SMTP_HOST is not defined in your .env file.<br>");
	if (!defined('SMTP_USER') || !getenv('SMTP_USER')) die("ERROR: SMTP_USER is not defined in your .env file.<br>");
	if (!defined('SMTP_PASS') || !getenv('SMTP_PASS')) die("ERROR: SMTP_PASS is not defined in your .env file.<br>");
	if (!defined('SMTP_PORT') || !getenv('SMTP_PORT')) die("ERROR: SMTP_PORT is not defined in your .env file.<br>");
	echo "SMTP configuration seems to be present.<br>";

	// --- 3. Define Test Parameters ---
	// Modified for Correct Email Address
	$recipientEmail = 'jalexg+delta@gmail.com';
	$recipientName = 'MyDayHub Test Recipient';
	$subject = 'MyDayHub Mailer Test (Corrected Address)';
	$htmlBody = '<h1>Success!</h1><p>If you received this email, your PHPMailer SMTP configuration for MyDayHub is working correctly.</p>';

	echo "Attempting to send email to: {$recipientEmail}...<br>";

	// --- 4. Send the Email ---
	$success = send_email($recipientEmail, $recipientName, $subject, $htmlBody);

	if ($success) {
		echo "<br><strong>--- SUCCESS ---</strong><br>";
		echo "The send_email() function returned true.<br>";
		echo "Check the inbox for '{$recipientEmail}' to confirm delivery.<br>";
	} else {
		// This block might not be reached if PHPMailer throws an exception,
		// but it's here for completeness.
		echo "<br><strong>--- FAILURE ---</strong><br>";
		echo "The send_email() function returned false.<br>";
	}

} catch (Exception $e) {
	echo "<br><strong>--- CATCHABLE EXCEPTION ---</strong><br>";
	echo "An error occurred: " . $e->getMessage() . "<br>";
	echo "Check your SMTP credentials in the .env file and ensure the server can reach the SMTP host.<br>";
}

echo "</pre>";