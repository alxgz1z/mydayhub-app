<?php
/**
 * MyDayHub Beta 5 - Mailer Utility
 *
 * This file contains a reusable function for sending emails via SMTP
 * using the PHPMailer library.
 *
 * @version 6.4.0
 * @author Alex & Gemini
 */

declare(strict_types=1);

// Use the PHPMailer classes from the vendor directory
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Require Composer's autoloader to make the library available
require_once __DIR__ . '/../vendor/autoload.php';

/**
 * Sends a password reset email to a user.
 *
 * @param string $recipientEmail The user's email address.
 * @param string $token The raw password reset token (not the hash).
 * @return bool True on success, false on failure.
 */
function send_password_reset_email(string $recipientEmail, string $token): bool {
	$mail = new PHPMailer(true);

	try {
		// --- Server settings from config.php (which reads from .env) ---
		$mail->isSMTP();
		$mail->Host       = SMTP_HOST;
		$mail->SMTPAuth   = true;
		$mail->Username   = SMTP_USER;
		$mail->Password   = SMTP_PASS;
		$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
		$mail->Port       = SMTP_PORT;

		// --- Recipients ---
		$mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
		$mail->addAddress($recipientEmail);

		// --- Content ---
		$mail->isHTML(true);
		$mail->Subject = 'Your MyDayHub Password Reset Request';
		
		// Create the reset link
		$resetLink = APP_URL . '/login/reset-password.php?token=' . urlencode($token);

		// Simple HTML email body
		$mail->Body    = "
			<p>Hello,</p>
			<p>We received a request to reset your password for your MyDayHub account.</p>
			<p>Please click the link below to set a new password:</p>
			<p><a href='{$resetLink}'>{$resetLink}</a></p>
			<p>This link will expire in 1 hour.</p>
			<p>If you did not request a password reset, you can safely ignore this email.</p>
			<p>Thanks,<br>The MyDayHub Team</p>
		";
		
		$mail->AltBody = "To reset your password, please visit the following link: {$resetLink}";

		$mail->send();
		return true;
	} catch (Exception $e) {
		// In dev mode, log the detailed error. In production, this would go to a more secure log.
		if (defined('DEVMODE') && DEVMODE) {
			error_log("Mailer Error: {$mail->ErrorInfo}");
		}
		return false;
	}
}