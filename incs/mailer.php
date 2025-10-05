<?php
/**
 * Code for /incs/mailer.php
 *
 * MyDayHub - Mailer Utility
 *
 * This file provides a centralized function for sending emails using PHPMailer,
 * configured with credentials from the .env file.
 *
 * @version 7.4 Jaco
 * @author Alex & Gemini & Claude
 */

declare(strict_types=1);

// --- PHPMailer ---
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once ROOT_PATH . '/vendor/autoload.php';

/**
 * Sends an email using the application's configured SMTP settings.
 *
 * @param string $toEmail The recipient's email address.
 * @param string $toName The recipient's name.
 * @param string $subject The subject of the email.
 * @param string $htmlBody The HTML content of the email.
 * @param string $altBody An optional plain-text alternative body.
 * @return bool True on success, false on failure.
 * @throws Exception For detailed PHPMailer errors if DEVMODE is on.
 */
function send_email(string $toEmail, string $toName, string $subject, string $htmlBody, string $altBody = ''): bool {
	$mail = new PHPMailer(true); 

	try {
		// --- Server Settings ---
		// Modified for Clean JSON Response: Always disable SMTP debug output
		$mail->SMTPDebug = 0; // Disabled to prevent corrupting JSON responses
		$mail->isSMTP();
		$mail->Host       = SMTP_HOST;
		$mail->SMTPAuth   = true;
		$mail->Username   = SMTP_USER;
		$mail->Password   = SMTP_PASS;
		$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
		$mail->Port       = SMTP_PORT;

		// --- Recipients ---
		// Modified for Deliverability Test: Temporarily using the SMTP username as the "From" address.
		// The SMTP_USER is an email address that Hostinger's mail server is inherently authorized to send from.
		// This helps bypass potential SPF/DKIM domain validation issues for debugging.
		$mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
		$mail->addAddress($toEmail, $toName);

		// --- Content ---
		$mail->isHTML(true);
		$mail->Subject = $subject;
		$mail->Body    = $htmlBody;
		$mail->AltBody = ($altBody === '') ? strip_tags($htmlBody) : $altBody;

		$mail->send();
		return true;

	} catch (Exception $e) {
		if (DEVMODE) {
			error_log("Mailer Error: {$mail->ErrorInfo}");
		}
		throw $e;
	}
}