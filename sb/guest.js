/**
 * Code for /sb/guest.js
 *
 * Signal - Storyboards guest entry
 *
 * The two steps in front of the guest shell: resolve the code and show what it
 * opens, then take a display name and join.
 *
 * Showing the storyboard before committing is the point of the first step. A
 * codeword belongs to one storyboard, not to the app — this is what makes that
 * visible, and what catches a mistyped or rotated code before someone is
 * standing inside a stranger's work under a name they did not mean to use.
 *
 * @version 8.8 Samara
 * @author Alex & Claude
 */

(function () {
	'use strict';

	const host = document.getElementById('storyboards-view');

	function esc(value) {
		return String(value ?? '').replace(/[&<>"']/g, (c) => ({
			'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
		}[c]));
	}

	async function post(action, data) {
		const response = await fetch('api.php', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRF-TOKEN': window.SB_Config.csrfToken || '',
			},
			body: JSON.stringify({ module: 'storyboards', action, data }),
		});
		const payload = await response.json().catch(() => ({ status: 'error', message: 'Unexpected response.' }));
		if (!response.ok || payload.status === 'error') {
			throw new Error(payload.message || 'Something went wrong.');
		}
		return payload.data || {};
	}

	function gate(html) {
		host.innerHTML = `<div class="sb-gate">${html}</div>`;
	}

	function showCodeForm(message) {
		gate(`
			<h1>Open a storyboard</h1>
			<p>Enter the access code someone shared with you.</p>
			<div class="sb-gate-card">
				<div class="sb-field">
					<label for="sb-code">Access code</label>
					<input id="sb-code" type="text" autocomplete="off" placeholder="latam-amber-quartz"
						value="${esc(window.SB_Config.code || '')}">
				</div>
				<button class="sb-btn primary" id="sb-code-go" style="width:100%">Continue</button>
				${message ? `<p class="sb-hint" style="margin-top:0.6rem;color:var(--sb-danger)">${esc(message)}</p>` : ''}
			</div>
			<p class="sb-hint">Have a Signal account? <a href="../login/login.php" style="color:var(--accent-color)">Sign in</a>
			to keep your storyboards together.</p>
		`);

		const input = document.getElementById('sb-code');
		const go = document.getElementById('sb-code-go');
		const submit = () => lookup(input.value.trim());

		go.addEventListener('click', submit);
		input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') submit();
		});
		input.focus();
	}

	async function lookup(code) {
		if (!code) return;
		gate('<p>Looking that code up…</p>');
		try {
			const found = await post('lookupCode', { code });
			showJoinForm(code, found);
		} catch (error) {
			showCodeForm(error.message);
		}
	}

	function showJoinForm(code, found) {
		gate(`
			<h1>${esc(found.title)}</h1>
			<p>${found.scene_count} scene${found.scene_count === 1 ? '' : 's'} ·
			shared by ${esc(found.owner_name)} · you join as a ${esc(found.join_role)}</p>
			<div class="sb-gate-card">
				<div class="sb-field">
					<label for="sb-name">Your name</label>
					<input id="sb-name" type="text" maxlength="100" autocomplete="name" placeholder="How you will appear">
					<span class="sb-hint">This is the name on everything you write here.</span>
				</div>
				<button class="sb-btn primary" id="sb-join-go" style="width:100%">Join storyboard</button>
				<button class="sb-btn" id="sb-join-back" style="width:100%;margin-top:0.4rem">Use a different code</button>
			</div>
		`);

		const name = document.getElementById('sb-name');
		const go = document.getElementById('sb-join-go');

		const join = async () => {
			const displayName = name.value.trim();
			if (!displayName) {
				name.focus();
				return;
			}
			go.disabled = true;
			try {
				const data = await post('joinAsGuest', { code, display_name: displayName });
				// Every request from here carries the session's own CSRF token —
				// a guest has no $_SESSION for Signal's usual one to live in.
				window.SB_Config.csrfToken = data.csrf_token;
				window.SB_Config.guest = true;
				document.getElementById('sb-guest-who').textContent = `${displayName} · guest`;
				window.initStoryboardsView();
			} catch (error) {
				go.disabled = false;
				gate(`<h1>Could not join</h1><p>${esc(error.message)}</p>`);
				setTimeout(() => showCodeForm(), 2200);
			}
		};

		go.addEventListener('click', join);
		name.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') join();
		});
		document.getElementById('sb-join-back').addEventListener('click', () => showCodeForm());
		name.focus();
	}

	// An expired cookie and a fresh visit look the same from here: no session, so
	// the code is the way in either way.
	if (window.SB_Config.guest && window.SB_Config.csrfToken) {
		window.initStoryboardsView();
	} else if (window.SB_Config.code) {
		lookup(window.SB_Config.code);
	} else {
		showCodeForm();
	}
})();
