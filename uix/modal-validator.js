/**
 * Modal, Popover, and Slider Validator
 * Comprehensive validation system for all overlay elements
 * @version 8.6 Nosara
 */

/**
 * Complete list of all modals, popovers, and sliders in the application
 */
const MODAL_REGISTRY = {
	// Settings & Configuration
	'settings-panel-overlay': {
		type: 'panel',
		name: 'Settings Panel',
		display: 'block',
		zIndex: 999,
		openFunction: 'openSettingsPanel',
		closeFunction: 'closeSettingsPanel'
	},
	'user-info-popover-overlay': {
		type: 'popover',
		name: 'User Info Popover',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openUserInfoPopover',
		closeFunction: 'closeUserInfoPopover'
	},
	'accent-color-modal': {
		type: 'modal',
		name: 'Accent Color Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: null, // Opened via initAccentColorPicker
		closeFunction: null
	},
	'session-timeout-modal-overlay': {
		type: 'modal',
		name: 'Session Timeout Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openSessionTimeoutModal',
		closeFunction: 'closeSessionTimeoutModal'
	},
	'usage-stats-modal-overlay': {
		type: 'modal',
		name: 'Usage Stats Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openUsageStatsModal',
		closeFunction: 'closeUsageStatsModal'
	},
	'trust-management-modal-overlay': {
		type: 'modal',
		name: 'Trust Management Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openTrustManagementModal',
		closeFunction: 'closeTrustManagementModal'
	},
	'password-modal-overlay': {
		type: 'modal',
		name: 'Change Password Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openChangePasswordModal',
		closeFunction: 'closeChangePasswordModal'
	},
	
	// Tasks & Attachments
	'attachments-modal-overlay': {
		type: 'modal',
		name: 'Attachments Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openAttachmentsModal',
		closeFunction: null // Closed via window.unregisterModal
	},
	'attachment-viewer-modal-overlay': {
		type: 'modal',
		name: 'Attachment Viewer Modal',
		display: 'flex',
		zIndex: 1050,
		openFunction: null, // Opened from attachments modal
		closeFunction: null
	},
	'file-management-modal-overlay': {
		type: 'modal',
		name: 'File Management Modal',
		display: 'flex',
		zIndex: 1000,
		openFunction: null, // Opened from attachments modal
		closeFunction: null
	},
	'ready-recipients-modal-overlay': {
		type: 'modal',
		name: 'Ready Recipients Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'showReadyRecipientsModal',
		closeFunction: null
	},
	'share-modal-overlay': {
		type: 'modal',
		name: 'Share Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: null, // Created dynamically
		closeFunction: null
	},
	'bulk-delete-modal-overlay': {
		type: 'modal',
		name: 'Bulk Delete Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openBulkDeleteModal',
		closeFunction: 'closeBulkDeleteModal'
	},
	'classification-popover': {
		type: 'popover',
		name: 'Classification Popover',
		display: 'block',
		zIndex: 1000,
		openFunction: null, // Opened via tasks.js
		closeFunction: null
	},
	
	// Calendar
	'calendar-overlay-modal-overlay': {
		type: 'modal',
		name: 'Calendar Overlay Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openCalendarOverlayModal',
		closeFunction: 'closeCalendarOverlayModal'
	},
	'event-modal-overlay': {
		type: 'modal',
		name: 'Event Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: null, // Opened via calendar.js
		closeFunction: null
	},
	'json-import-modal-overlay': {
		type: 'modal',
		name: 'JSON Import Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: null, // Opened via calendar.js
		closeFunction: null
	},
	'calendar-export-modal-overlay': {
		type: 'modal',
		name: 'Calendar Export Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: null, // Opened via calendar.js
		closeFunction: null
	},
	
	// Dialogs & Confirmations
	'confirm-modal-overlay': {
		type: 'modal',
		name: 'Confirm Dialog',
		display: 'flex',
		zIndex: 11000,
		openFunction: 'showConfirm',
		closeFunction: null // Handled internally
	},
	'date-modal-overlay': {
		type: 'modal',
		name: 'Date Picker Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'showDueDateModal',
		closeFunction: null // Handled internally
	},
	
	// User Guide & Help
	'user-guide-modal': {
		type: 'modal',
		name: 'User Guide Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openUserGuideModal',
		closeFunction: 'closeUserGuideModal'
	},
	'mission-focus-popover-overlay': {
		type: 'popover',
		name: 'Mission Focus Popover',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openMissionFocusPopover',
		closeFunction: 'closeMissionFocusPopover'
	},
	
	// Editor
	'unified-editor-overlay': {
		type: 'modal',
		name: 'Unified Editor Overlay',
		display: 'flex',
		zIndex: 1200,
		openFunction: null, // Opened via editor.js
		closeFunction: null
	},
	'regex-help-modal': {
		type: 'modal',
		name: 'Regex Help Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: null, // Opened via editor.js
		closeFunction: null
	},
	'markdown-help-modal': {
		type: 'modal',
		name: 'Markdown Help Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: null, // Opened via editor.js
		closeFunction: null
	},
	
	// Journal
	'journal-menu-popover': {
		type: 'popover',
		name: 'Journal Menu Popover',
		display: 'block',
		zIndex: 1000,
		openFunction: null, // Created dynamically
		closeFunction: null
	},
	'journal-move-modal-container': {
		type: 'modal',
		name: 'Journal Move Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: null, // Created dynamically
		closeFunction: null
	},
	'journal-date-jump-modal-container': {
		type: 'modal',
		name: 'Journal Date Jump Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: null, // Created dynamically
		closeFunction: null
	},
	'journal-classification-popover': {
		type: 'popover',
		name: 'Journal Classification Popover',
		display: 'block',
		zIndex: 1000,
		openFunction: null, // Created dynamically
		closeFunction: null
	},
	
	// Developer Tools
	'developer-tools-modal-overlay': {
		type: 'modal',
		name: 'Developer Tools Modal',
		display: 'flex',
		zIndex: 10000,
		openFunction: 'openDeveloperToolsModal',
		closeFunction: 'closeDeveloperToolsModal'
	}
};

/**
 * Validates all modals, popovers, and sliders
 * @returns {Object} Validation results for all elements
 */
function validateAllModals() {
	const results = {
		total: 0,
		found: 0,
		missing: [],
		valid: [],
		invalid: [],
		issues: []
	};
	
	Object.keys(MODAL_REGISTRY).forEach(modalId => {
		results.total++;
		const element = document.getElementById(modalId);
		const config = MODAL_REGISTRY[modalId];
		
		if (!element) {
			results.missing.push({
				id: modalId,
				name: config.name,
				type: config.type
			});
			return;
		}
		
		results.found++;
		
		// Run validation
		const validation = window.validateAndFixModal ? window.validateAndFixModal(element) : null;
		
		// Get element properties before validation check
		const isHidden = element.classList.contains('hidden');
		const computedStyle = window.getComputedStyle(element);
		const display = computedStyle.display;
		const zIndex = parseInt(computedStyle.zIndex) || 0;
		const position = computedStyle.position;
		const rect = element.getBoundingClientRect();
		
		// Ensure dimensions object exists
		const dimensions = rect ? {
			width: rect.width || 0,
			height: rect.height || 0
		} : { width: 0, height: 0 };
		
		if (!validation) {
			results.invalid.push({
				id: modalId,
				name: config.name,
				type: config.type,
				hidden: isHidden,
				display: display || 'none',
				zIndex: zIndex,
				position: position || 'static',
				dimensions: dimensions,
				inDOM: element.isConnected,
				parent: element.parentElement ? element.parentElement.id || element.parentElement.tagName : 'none',
				error: 'Validation function not available'
			});
			return;
		}
		
		const elementStatus = {
			id: modalId,
			name: config.name,
			type: config.type,
			hidden: isHidden,
			display: display || 'none',
			zIndex: zIndex,
			position: position || 'static',
			dimensions: dimensions,
			inDOM: element.isConnected,
			parent: element.parentElement ? element.parentElement.id || element.parentElement.tagName : 'none',
			validation: validation
		};
		
		// Determine if valid (element exists and structure is correct)
		// Being hidden is OK, but should have proper structure
		const hasValidStructure = 
			element.isConnected &&
			(position === 'fixed' || position === 'absolute') &&
			(display !== 'none' || isHidden); // display: none is OK if hidden class is present
		
		if (hasValidStructure && validation.valid) {
			results.valid.push(elementStatus);
		} else {
			results.invalid.push(elementStatus);
			if (validation.issues && validation.issues.length > 0) {
				results.issues.push({
					id: modalId,
					name: config.name,
					issues: validation.issues
				});
			}
		}
	});
	
	return results;
}

/**
 * Validates a specific modal by ID
 * @param {string} modalId - The ID of the modal to validate
 * @returns {Object} Validation result
 */
function validateModal(modalId) {
	const element = document.getElementById(modalId);
	if (!element) {
		return {
			valid: false,
			error: `Modal with ID "${modalId}" not found in DOM`
		};
	}
	
	const config = MODAL_REGISTRY[modalId];
	if (!config) {
		return {
			valid: false,
			error: `Modal "${modalId}" not found in registry`
		};
	}
	
	const validation = window.validateAndFixModal ? window.validateAndFixModal(element) : null;
	const computedStyle = window.getComputedStyle(element);
	const rect = element.getBoundingClientRect();
	
	return {
		valid: validation ? validation.valid : false,
		id: modalId,
		name: config.name,
		type: config.type,
		element: element,
		hidden: element.classList.contains('hidden'),
		display: computedStyle.display,
		zIndex: parseInt(computedStyle.zIndex) || 0,
		position: computedStyle.position,
		dimensions: { width: rect.width, height: rect.height },
		inDOM: element.isConnected,
		parent: element.parentElement ? element.parentElement.id || element.parentElement.tagName : 'none',
		validation: validation,
		config: config
	};
}

/**
 * Logs validation results in a readable format
 * @param {Object} results - Results from validateAllModals()
 */
function logValidationResults(results) {
	console.group('🔍 Modal Validation Results');
	console.log(`Total registered: ${results.total}`);
	console.log(`Found in DOM: ${results.found}`);
	console.log(`Missing: ${results.missing.length}`);
	console.log(`Valid: ${results.valid.length}`);
	console.log(`Invalid: ${results.invalid.length}`);
	
	if (results.missing.length > 0) {
		console.group('❌ Missing Elements');
		results.missing.forEach(item => {
			console.log(`- ${item.name} (${item.id}) - ${item.type}`);
		});
		console.groupEnd();
	}
	
	if (results.invalid.length > 0) {
		console.group('⚠️ Invalid Elements');
		results.invalid.forEach(item => {
			console.log(`- ${item.name} (${item.id})`);
			console.log(`  Type: ${item.type || 'unknown'}`);
			console.log(`  Hidden: ${item.hidden !== undefined ? item.hidden : 'unknown'}`);
			console.log(`  Display: ${item.display || 'unknown'}`);
			console.log(`  Z-Index: ${item.zIndex !== undefined ? item.zIndex : 'unknown'}`);
			console.log(`  Position: ${item.position || 'unknown'}`);
			if (item.dimensions) {
				console.log(`  Dimensions: ${item.dimensions.width}x${item.dimensions.height}`);
			} else {
				console.log(`  Dimensions: unknown`);
			}
			console.log(`  Parent: ${item.parent || 'unknown'}`);
			if (item.validation && item.validation.issues) {
				console.log(`  Issues:`, item.validation.issues);
			}
		});
		console.groupEnd();
	}
	
	if (results.issues.length > 0) {
		console.group('🐛 Issues Found');
		results.issues.forEach(item => {
			console.log(`- ${item.name} (${item.id}):`, item.issues);
		});
		console.groupEnd();
	}
	
	if (results.valid.length > 0) {
		console.group('✅ Valid Elements');
		console.log(`${results.valid.length} modals/popovers are properly configured`);
		results.valid.forEach(item => {
			console.log(`- ${item.name} (${item.id})`);
		});
		console.groupEnd();
	}
	
	console.groupEnd();
}

// Expose functions globally
window.validateAllModals = validateAllModals;
window.validateModal = validateModal;
window.logValidationResults = logValidationResults;
window.MODAL_REGISTRY = MODAL_REGISTRY;

// Auto-run validation in dev mode
if (window.MyDayHub_Config?.DEV_MODE) {
	document.addEventListener('DOMContentLoaded', () => {
		setTimeout(() => {
			console.log('🔍 Running automatic modal validation...');
			const results = validateAllModals();
			logValidationResults(results);
		}, 1000); // Wait 1 second for all modals to be initialized
	});
}

