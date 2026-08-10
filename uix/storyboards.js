/**
 * Code for /uix/storyboards.js
 *
 * Signal - Storyboards View
 *
 * A collaborative drafting tool for narrative structure: lay an argument out
 * scene by scene, review it as a team, and export a markdown build brief an
 * agent can turn into a deck or a document.
 *
 * @version 8.7 Nosara
 * @author Alex & Claude
 */

(function () {
	'use strict';

	let initialized = false;

	/**
	 * Lazy entry point, called by ViewManager the first time the tab is opened
	 * and on every switch back to it.
	 */
	window.initStoryboardsView = function initStoryboardsView() {
		const host = document.getElementById('storyboards-view');
		if (!host) return;

		if (!initialized) {
			initialized = true;
			host.innerHTML = '<div class="sb-loading">Loading Storyboards…</div>';
		}
	};
})();
