<?php
/**
 * Code for /sb/index.php
 *
 * Signal - Storyboards guest shell
 *
 * Where an invite link lands. Someone with a codeword and no Signal account
 * gets two steps — see what the code opens, then type the name they will appear
 * under — and then the same storyboards view the app's third tab renders, with
 * nothing else around it: no Tasks, no Journal, no settings that belong to an
 * account they do not have.
 *
 * The URL is /sb/?code=… rather than /sb/{code}: .htaccess rewrites only ^api/,
 * so a path segment would 404. The QR code and the copyable invite link both
 * encode this form.
 *
 * @version 8.7 Nosara
 * @author Alex & Claude
 */

declare(strict_types=1);

require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';
require_once __DIR__ . '/../incs/sb_access.php';

$code = isset($_GET['code']) ? trim((string)$_GET['code']) : '';

// A signed-in Signal user does not want the guest shell — they want the tab,
// where the storyboard joins their own dashboard and stays there.
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}
if (!empty($_SESSION['user_id'])) {
	$target = '/';
	if ($code !== '') {
		$target .= '#join=' . rawurlencode($code);
	}
	header('Location: ' . $target);
	exit;
}

$guest = null;
try {
	$guest = sb_participant_for_guest_cookie(get_pdo());
} catch (Throwable $e) {
	error_log('sb/index.php: ' . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Storyboards — Signal</title>
	<link rel="icon" type="image/svg+xml" href="../media/favico.svg">
	<link rel="stylesheet" href="../uix/style.css?v=8.7.3">
	<link rel="stylesheet" href="../uix/storyboards.css?v=8.7.3">
	<style>
		/* The guest shell is the app's chrome with everything an account owns
		   taken out: one header strip and the view. */
		body { overflow: hidden; }

		.sb-guest-shell {
			display: flex;
			flex-direction: column;
			height: 100dvh;
		}

		.sb-guest-header {
			display: flex;
			align-items: center;
			gap: 0.6rem;
			padding: 0.5rem 0.9rem;
			background: var(--app-header-bg);
			color: #fff;
			border-bottom: 1px solid var(--border-color);
			flex: 0 0 auto;
		}

		.sb-guest-header img { height: 1.6rem; width: auto; }
		.sb-guest-header .sb-guest-who { margin-left: auto; font-size: 0.8rem; opacity: 0.8; }

		#storyboards-view { flex: 1 1 auto; display: flex; }

		.sb-gate {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 0.9rem;
			flex: 1;
			padding: 2rem 1.25rem;
			text-align: center;
		}

		.sb-gate-card {
			width: 100%;
			max-width: 24rem;
			background: var(--card-bg);
			border: 1px solid var(--card-border);
			border-radius: 0.5rem;
			padding: 1.1rem;
			text-align: left;
		}

		.sb-gate h1 { margin: 0; font-size: 1.2rem; font-weight: 500; color: var(--text-primary); }
		.sb-gate p { margin: 0; max-width: 32ch; color: var(--text-secondary); line-height: 1.5; font-size: 0.88rem; }
	</style>
</head>
<body>
	<div class="sb-guest-shell">
		<header class="sb-guest-header">
			<img src="../media/icons/icon-192x192.png" alt="Signal">
			<strong style="font-weight:500;font-size:0.95rem">Storyboards</strong>
			<span class="sb-guest-who" id="sb-guest-who"><?php echo $guest ? htmlspecialchars($guest['display_name']) . ' · guest' : ''; ?></span>
		</header>

		<div id="storyboards-view" class="view-container active">
			<div class="sb-loading">Loading…</div>
		</div>
	</div>

	<div id="toast-container"></div>

	<script>
		/*
		 * The view module runs unchanged in both shells. Everything that differs
		 * between them — which gateway to call, which CSRF token to send, where
		 * the images live — is here.
		 */
		window.SB_Config = {
			endpoint: 'api.php',
			csrfToken: <?php echo json_encode($guest['csrf_token'] ?? ''); ?>,
			assetBase: '../',
			guest: <?php echo $guest ? 'true' : 'false'; ?>,
			code: <?php echo json_encode($code); ?>
		};
	</script>
	<script src="../uix/storyboards.js?v=8.7.3" defer></script>
	<script src="guest.js?v=8.7.3" defer></script>
</body>
</html>
