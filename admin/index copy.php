<?php
/**
 * Code for /admin/index.php
 *
 * MyDayHub - Admin Dashboard
 *
 * Admin-only interface for managing users, subscriptions, and system overview.
 * Requires admin authentication via ADMIN_EMAILS configuration.
 *
 * @version 7.0.0
 * @author Alex & Gemini & Claude
 */

require_once __DIR__ . '/../incs/config.php';

// Check authentication
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

if (!isset($_SESSION['user_id'])) {
	header('Location: ' . APP_URL . '/login/login.php');
	exit();
}

// Check admin access
if (!is_admin_user((int)$_SESSION['user_id'])) {
	http_response_code(403);
	echo '<!DOCTYPE html><html><head><title>Access Denied</title></head><body>';
	echo '<h1>403 - Access Denied</h1>';
	echo '<p>You do not have permission to access the admin dashboard.</p>';
	echo '<a href="' . APP_URL . '">Return to MyDayHub</a>';
	echo '</body></html>';
	exit();
}

$username = $_SESSION['username'] ?? 'Admin';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token']); ?>">
	<title>MyDayHub Admin Dashboard</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: #f5f5f5;
			color: #333;
			line-height: 1.6;
		}
		
		.admin-header {
			background: #2563eb;
			color: white;
			padding: 1rem 2rem;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		
		.admin-header h1 {
			font-size: 1.5rem;
			font-weight: 600;
		}
		
		.admin-header .user-info {
			font-size: 0.875rem;
		}
		
		.admin-header a {
			color: #bfdbfe;
			text-decoration: none;
			margin-left: 1rem;
		}
		
		.admin-header a:hover {
			color: white;
		}
		
		.admin-nav {
			background: white;
			border-bottom: 1px solid #e5e7eb;
			padding: 0 2rem;
		}
		
		.nav-tabs {
			display: flex;
			gap: 0;
		}
		
		.nav-tab {
			padding: 1rem 1.5rem;
			border: none;
			background: none;
			cursor: pointer;
			border-bottom: 3px solid transparent;
			font-weight: 500;
			transition: all 0.2s;
		}
		
		.nav-tab:hover {
			background: #f9fafb;
		}
		
		.nav-tab.active {
			border-bottom-color: #2563eb;
			color: #2563eb;
		}
		
		.admin-container {
			max-width: 1200px;
			margin: 2rem auto;
			padding: 0 2rem;
		}
		
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 1.5rem;
			margin-bottom: 2rem;
		}
		
		.stat-card {
			background: white;
			padding: 1.5rem;
			border-radius: 8px;
			box-shadow: 0 1px 3px rgba(0,0,0,0.1);
			border-left: 4px solid #2563eb;
		}
		
		.stat-value {
			font-size: 2rem;
			font-weight: 700;
			color: #2563eb;
		}
		
		.stat-label {
			color: #6b7280;
			font-size: 0.875rem;
			margin-top: 0.25rem;
		}
		
		.content-panel {
			background: white;
			border-radius: 8px;
			box-shadow: 0 1px 3px rgba(0,0,0,0.1);
			overflow: hidden;
		}
		
		.panel-hidden {
			display: none;
		}
		
		.panel-header {
			padding: 1.5rem 2rem;
			border-bottom: 1px solid #e5e7eb;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		
		.panel-title {
			font-size: 1.25rem;
			font-weight: 600;
		}
		
		.search-controls {
			display: flex;
			gap: 1rem;
			align-items: center;
		}
		
		.search-input {
			padding: 0.5rem 1rem;
			border: 1px solid #d1d5db;
			border-radius: 6px;
			font-size: 0.875rem;
			width: 200px;
		}
		
		.filter-select {
			padding: 0.5rem 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 6px;
			font-size: 0.875rem;
		}
		
		.btn {
			padding: 0.5rem 1rem;
			border: none;
			border-radius: 6px;
			font-weight: 500;
			cursor: pointer;
			font-size: 0.875rem;
			transition: all 0.2s;
			text-decoration: none;
			display: inline-block;
		}
		
		.btn-primary {
			background: #2563eb;
			color: white;
		}
		
		.btn-primary:hover {
			background: #1d4ed8;
		}
		
		.btn-secondary {
			background: #6b7280;
			color: white;
		}
		
		.btn-danger {
			background: #dc2626;
			color: white;
		}
		
		.btn-warning {
			background: #f59e0b;
			color: white;
		}
		
		.btn-success {
			background: #059669;
			color: white;
		}
		
		.users-table {
			width: 100%;
			border-collapse: collapse;
		}
		
		.users-table th,
		.users-table td {
			padding: 1rem;
			text-align: left;
			border-bottom: 1px solid #e5e7eb;
		}
		
		.users-table th {
			background: #f9fafb;
			font-weight: 600;
			font-size: 0.875rem;
			color: #374151;
		}
		
		.users-table tr:hover {
			background: #f9fafb;
		}
		
		.status-badge {
			padding: 0.25rem 0.75rem;
			border-radius: 9999px;
			font-size: 0.75rem;
			font-weight: 500;
		}
		
		.status-active {
			background: #dcfce7;
			color: #166534;
		}
		
		.status-suspended {
			background: #fed7d7;
			color: #991b1b;
		}
		
		.status-deleted {
			background: #f3f4f6;
			color: #374151;
		}
		
		.subscription-badge {
			padding: 0.25rem 0.75rem;
			border-radius: 9999px;
			font-size: 0.75rem;
			font-weight: 500;
		}
		
		.sub-free {
			background: #f3f4f6;
			color: #374151;
		}
		
		.sub-base {
			background: #dbeafe;
			color: #1e40af;
		}
		
		.sub-pro {
			background: #e0e7ff;
			color: #3730a3;
		}
		
		.sub-elite {
			background: #fde68a;
			color: #92400e;
		}
		
		.pagination {
			display: flex;
			justify-content: center;
			gap: 0.5rem;
			padding: 1.5rem;
		}
		
		.page-btn {
			padding: 0.5rem 0.75rem;
			border: 1px solid #d1d5db;
			background: white;
			cursor: pointer;
			border-radius: 4px;
		}
		
		.page-btn.active {
			background: #2563eb;
			color: white;
			border-color: #2563eb;
		}
		
		.modal {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0,0,0,0.5);
			display: none;
			align-items: center;
			justify-content: center;
			z-index: 1000;
		}
		
		.modal.show {
			display: flex;
		}
		
		.modal-content {
			background: white;
			padding: 2rem;
			border-radius: 8px;
			width: 90%;
			max-width: 500px;
		}
		
		.modal-header {
			margin-bottom: 1.5rem;
		}
		
		.modal-title {
			font-size: 1.25rem;
			font-weight: 600;
		}
		
		.form-group {
			margin-bottom: 1rem;
		}
		
		.form-label {
			display: block;
			font-weight: 500;
			margin-bottom: 0.5rem;
		}
		
		.form-input {
			width: 100%;
			padding: 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 6px;
		}
		
		.form-textarea {
			width: 100%;
			padding: 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 6px;
			rows: 3;
			resize: vertical;
		}
		
		.modal-actions {
			display: flex;
			gap: 1rem;
			justify-content: flex-end;
			margin-top: 1.5rem;
		}
		
		.loading {
			text-align: center;
			padding: 2rem;
			color: #6b7280;
		}
		
		.error-message {
			background: #fef2f2;
			color: #991b1b;
			padding: 1rem;
			border-radius: 6px;
			margin: 1rem 0;
			position: fixed;
			top: 20px;
			right: 20px;
			z-index: 1001;
			min-width: 300px;
		}
		
		.success-message {
			background: #f0fdf4;
			color: #166534;
			padding: 1rem;
			border-radius: 6px;
			margin: 1rem 0;
			position: fixed;
			top: 20px;
			right: 20px;
			z-index: 1001;
			min-width: 300px;
		}
		
		@media (max-width: 768px) {
			.admin-container {
				padding: 0 1rem;
			}
			
			.search-controls {
				flex-direction: column;
				align-items: stretch;
			}
			
			.search-input {
				width: 100%;
			}
			
			.users-table {
				font-size: 0.875rem;
			}
			
			.users-table th,
			.users-table td {
				padding: 0.5rem;
			}
		}
	</style>
</head>
<body>
	<div class="admin-header">
		<h1>MyDayHub Admin Dashboard</h1>
		<div class="user-info">
			Welcome, <?php echo htmlspecialchars($username); ?>
			<a href="<?php echo APP_URL; ?>">← Back to App</a>
			<a href="<?php echo APP_URL; ?>/login/logout.php">Logout</a>
		</div>
	</div>
	
	<nav class="admin-nav">
		<div class="nav-tabs">
			<button class="nav-tab active" data-tab="dashboard">Dashboard</button>
			<button class="nav-tab" data-tab="users">Users</button>
			<button class="nav-tab" data-tab="actions">Admin Actions</button>
		</div>
	</nav>
	
	<div class="admin-container">
		<!-- Dashboard Panel -->
		<div id="dashboard-panel" class="content-panel">
			<div class="panel-header">
				<h2 class="panel-title">System Overview</h2>
			</div>
			
			<div class="stats-grid" id="dashboard-stats">
				<div class="loading">Loading statistics...</div>
			</div>
		</div>
		
		<!-- Users Panel -->
		<div id="users-panel" class="content-panel panel-hidden">
			<div class="panel-header">
				<h2 class="panel-title">User Management</h2>
				<div class="search-controls">
					<input type="text" class="search-input" id="user-search" placeholder="Search users...">
					<select class="filter-select" id="status-filter">
						<option value="all">All Status</option>
						<option value="active">Active</option>
						<option value="suspended">Suspended</option>
						<option value="deleted">Deleted</option>
					</select>
					<select class="filter-select" id="subscription-filter">
						<option value="all">All Subscriptions</option>
						<option value="free">Free</option>
						<option value="base">Base</option>
						<option value="pro">Pro</option>
						<option value="elite">Elite</option>
					</select>
					<button class="btn btn-primary" id="refresh-users">Refresh</button>
				</div>
			</div>
			
			<div id="users-content">
				<div class="loading">Loading users...</div>
			</div>
		</div>
		
		<!-- Admin Actions Panel -->
		<div id="actions-panel" class="content-panel panel-hidden">
			<div class="panel-header">
				<h2 class="panel-title">Admin Action History</h2>
				<div class="search-controls">
					<button class="btn btn-primary" id="refresh-actions">Refresh</button>
				</div>
			</div>
			
			<div id="actions-content">
				<div class="loading">Loading admin actions...</div>
			</div>
		</div>
	</div>
	
	<!-- User Detail Modal -->
	<div id="user-modal" class="modal">
		<div class="modal-content">
			<div class="modal-header">
				<h3 class="modal-title" id="user-modal-title">User Details</h3>
			</div>
			<div id="user-modal-content">
				<!-- Dynamic content -->
			</div>
		</div>
	</div>
	
	<!-- Action Modals -->
	<div id="subscription-modal" class="modal">
		<div class="modal-content">
			<div class="modal-header">
				<h3 class="modal-title">Change Subscription</h3>
			</div>
			<form id="subscription-form">
				<div class="form-group">
					<label class="form-label">New Subscription Level:</label>
					<select class="form-input" id="new-subscription" required>
						<option value="">Select subscription...</option>
						<option value="free">Free</option>
						<option value="base">Base</option>
						<option value="pro">Pro</option>
						<option value="elite">Elite</option>
					</select>
				</div>
				<div class="form-group">
					<label class="form-label">Reason:</label>
					<textarea class="form-textarea" id="subscription-reason" placeholder="Reason for change..."></textarea>
				</div>
				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" onclick="closeModal('subscription-modal')">Cancel</button>
					<button type="submit" class="btn btn-primary">Update Subscription</button>
				</div>
			</form>
		</div>
	</div>
	
	<div id="suspend-modal" class="modal">
		<div class="modal-content">
			<div class="modal-header">
				<h3 class="modal-title">Suspend User</h3>
			</div>
			<form id="suspend-form">
				<div class="form-group">
					<label class="form-label">Reason for suspension:</label>
					<textarea class="form-textarea" id="suspend-reason" placeholder="Enter reason for suspension..." required></textarea>
				</div>
				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" onclick="closeModal('suspend-modal')">Cancel</button>
					<button type="submit" class="btn btn-danger">Suspend User</button>
				</div>
			</form>
		</div>
	</div>
	
	<div id="delete-modal" class="modal">
		<div class="modal-content">
			<div class="modal-header">
				<h3 class="modal-title">Delete User</h3>
			</div>
			<form id="delete-form">
				<p style="margin-bottom: 1rem;">This will soft-delete the user account. Data will be retained for 30 days.</p>
				<div class="form-group">
					<label class="form-label">Reason for deletion:</label>
					<textarea class="form-textarea" id="delete-reason" placeholder="Enter reason for deletion..." required></textarea>
				</div>
				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" onclick="closeModal('delete-modal')">Cancel</button>
					<button type="submit" class="btn btn-danger">Delete User</button>
				</div>
			</form>
		</div>
	</div>

	<script>
		// Configuration
		const API_BASE = '../api/admin.php';
		let currentUser = null;
		let currentPage = 1;
		
		// CSRF Token
		const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
		
		// Initialize
		document.addEventListener('DOMContentLoaded', function() {
			initializeTabs();
			loadDashboard();
			initializeEventListeners();
		});
		
		// Tab Management
		function initializeTabs() {
			document.querySelectorAll('.nav-tab').forEach(tab => {
				tab.addEventListener('click', function() {
					const tabName = this.dataset.tab;
					switchTab(tabName);
				});
			});
		}
		
		function switchTab(tabName) {
			// Update nav
			document.querySelectorAll('.nav-tab').forEach(tab => {
				tab.classList.remove('active');
			});
			document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
			
			// Show panel
			document.querySelectorAll('.content-panel').forEach(panel => {
				panel.classList.add('panel-hidden');
			});
			document.getElementById(`${tabName}-panel`).classList.remove('panel-hidden');
			
			// Load content
			if (tabName === 'dashboard') loadDashboard();
			else if (tabName === 'users') loadUsers();
			else if (tabName === 'actions') loadAdminActions();
		}
		
		// Event Listeners
		function initializeEventListeners() {
			document.getElementById('refresh-users').addEventListener('click', loadUsers);
			document.getElementById('refresh-actions').addEventListener('click', loadAdminActions);
			document.getElementById('user-search').addEventListener('input', debounce(loadUsers, 500));
			document.getElementById('status-filter').addEventListener('change', loadUsers);
			document.getElementById('subscription-filter').addEventListener('change', loadUsers);
			
			// Form submissions
			document.getElementById('subscription-form').addEventListener('submit', handleSubscriptionChange);
			document.getElementById('suspend-form').addEventListener('submit', handleSuspendUser);
			document.getElementById('delete-form').addEventListener('submit', handleDeleteUser);
		}
		
		// API Helper
		async function apiCall(action, data = {}, method = 'POST') {
			const url = method === 'GET' ? `${API_BASE}?action=${action}&${new URLSearchParams(data)}` : API_BASE;
			
			const options = {
				method,
				headers: {
					'Content-Type': 'application/json',
					'X-CSRF-TOKEN': csrfToken
				}
			};
			
			if (method === 'POST') {
				options.body = JSON.stringify({ action, ...data });
			}
			
			const response = await fetch(url, options);
			const result = await response.json();
			
			if (!response.ok) {
				throw new Error(result.message || 'API call failed');
			}
			
			return result;
		}
		
		// Dashboard
		async function loadDashboard() {
			try {
				const result = await apiCall('getAdminStats', {}, 'GET');
				renderDashboardStats(result.data);
			} catch (error) {
				showError('Failed to load dashboard: ' + error.message);
			}
		}
		
		function renderDashboardStats(stats) {
			const statsContainer = document.getElementById('dashboard-stats');
			
			const html = `
				<div class="stat-card">
					<div class="stat-value">${stats.users_by_status?.active || 0}</div>
					<div class="stat-label">Active Users</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">${stats.users_by_status?.suspended || 0}</div>
					<div class="stat-label">Suspended Users</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">${stats.new_users_30_days || 0}</div>
					<div class="stat-label">New Users (30 days)</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">${stats.total_storage_used_mb || 0} MB</div>
					<div class="stat-label">Total Storage Used</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">${stats.total_tasks || 0}</div>
					<div class="stat-label">Total Tasks</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">${stats.total_shares || 0}</div>
					<div class="stat-label">Shared Tasks</div>
				</div>
			`;
			
			statsContainer.innerHTML = html;
		}
		
		// Users Management
		async function loadUsers() {
			const search = document.getElementById('user-search').value;
			const status = document.getElementById('status-filter').value;
			const subscription = document.getElementById('subscription-filter').value;
			
			try {
				const result = await apiCall('getUsers', {
					page: currentPage,
					search,
					status,
					subscription
				}, 'GET');
				
				renderUsers(result.data.users, result.data.pagination);
			} catch (error) {
				showError('Failed to load users: ' + error.message);
			}
		}
		
		function renderUsers(users, pagination) {
			const content = document.getElementById('users-content');
			
			if (users.length === 0) {
				content.innerHTML = '<div class="loading">No users found</div>';
				return;
			}
			
			const tableHTML = `
				<table class="users-table">
					<thead>
						<tr>
							<th>User</th>
							<th>Subscription</th>
							<th>Status</th>
							<th>Storage</th>
							<th>Joined</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						${users.map(user => `
							<tr>
								<td>
									<div><strong>${escapeHtml(user.username)}</strong></div>
									<div style="font-size: 0.875rem; color: #6b7280;">${escapeHtml(user.email)}</div>
								</td>
								<td>
									<span class="subscription-badge sub-${user.subscription_level}">
										${user.subscription_level.toUpperCase()}
									</span>
								</td>
								<td>
									<span class="status-badge status-${user.status}">
										${user.status.toUpperCase()}
									</span>
								</td>
								<td>${user.storage_used_mb} MB</td>
								<td>${new Date(user.created_at).toLocaleDateString()}</td>
								<td>
									<button class="btn btn-primary" onclick="showUserDetails(${user.user_id})" style="margin-right: 0.5rem; margin-bottom: 0.25rem;">Details</button>
									${user.status === 'active' ? 
										`<button class="btn btn-warning" onclick="showSuspendModal(${user.user_id})" style="margin-bottom: 0.25rem;">Suspend</button>` :
										user.status === 'suspended' ?
										`<button class="btn btn-success" onclick="unsuspendUser(${user.user_id})" style="margin-bottom: 0.25rem;">Unsuspend</button>` :
										''
									}
								</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
				${renderPagination(pagination)}
			`;
			
			content.innerHTML = tableHTML;
		}
		
		function renderPagination(pagination) {
			if (pagination.total_pages <= 1) return '';
			
			let html = '<div class="pagination">';
			
			// Previous
			if (pagination.current_page > 1) {
				html += `<button class="page-btn" onclick="changePage(${pagination.current_page - 1})">Previous</button>`;
			}
			
			// Page numbers
			for (let i = 1; i <= pagination.total_pages; i++) {
				if (i === pagination.current_page) {
					html += `<button class="page-btn active">${i}</button>`;
				} else {
					html += `<button class="page-btn" onclick="changePage(${i})">${i}</button>`;
				}
			}
			
			// Next
			if (pagination.current_page < pagination.total_pages) {
				html += `<button class="page-btn" onclick="changePage(${pagination.current_page + 1})">Next</button>`;
			}
			
			html += '</div>';
			return html;
		}
		
		function changePage(page) {
			currentPage = page;
			loadUsers();
		}
		
		// User Details
		async function showUserDetails(userId) {
			try {
				const result = await apiCall('getUserDetails', { user_id: userId }, 'GET');
				const user = result.data.user;
				currentUser = user;
				
				const modalContent = document.getElementById('user-modal-content');
				modalContent.innerHTML = `
					<div style="margin-bottom: 1.5rem;">
						<h4>${escapeHtml(user.username)} (${escapeHtml(user.email)})</h4>
						<p>Status: <span class="status-badge status-${user.status}">${user.status.toUpperCase()}</span></p>
						<p>Subscription: <span class="subscription-badge sub-${user.subscription_level}">${user.subscription_level.toUpperCase()}</span></p>
						<p>Joined: ${new Date(user.created_at).toLocaleDateString()}</p>
						${user.suspended_at ? `<p>Suspended: ${new Date(user.suspended_at).toLocaleDateString()}</p>` : ''}
						${user.suspended_reason ? `<p>Reason: ${escapeHtml(user.suspended_reason)}</p>` : ''}
					</div>
					
					<div style="margin-bottom: 1.5rem;">
						<h5>Usage Statistics</h5>
						<p>Columns: ${user.usage_stats.columns}</p>
						<p>Tasks: ${user.usage_stats.tasks}</p>
						<p>Shared Tasks: ${user.usage_stats.shared_tasks}</p>
						<p>Attachments: ${user.usage_stats.attachments}</p>
						<p>Storage: ${user.storage_used_mb} MB</p>
					</div>
					
					<div class="modal-actions">
						<button class="btn btn-secondary" onclick="closeModal('user-modal')">Close</button>
						<button class="btn btn-primary" onclick="showSubscriptionModal(${userId})">Change Subscription</button>
						${user.status === 'active' ? 
							`<button class="btn btn-warning" onclick="showSuspendModal(${userId})">Suspend</button>` :
							user.status === 'suspended' ?
							`<button class="btn btn-success" onclick="unsuspendUser(${userId})">Unsuspend</button>` :
							''
						}
						<button class="btn btn-secondary" onclick="exportUserData(${userId})">Export Data</button>
						${user.status !== 'deleted' ? `<button class="btn btn-danger" onclick="showDeleteModal(${userId})">Delete</button>` : ''}
					</div>
				`;
				
				showModal('user-modal');
			} catch (error) {
				showError('Failed to load user details: ' + error.message);
			}
		}
		
		// Modal Management
		function showModal(modalId) {
			document.getElementById(modalId).classList.add('show');
		}
		
		function closeModal(modalId) {
			document.getElementById(modalId).classList.remove('show');
		}
		
		// User Actions
		function showSubscriptionModal(userId) {
			currentUser = { user_id: userId };
			showModal('subscription-modal');
		}
		
		function showSuspendModal(userId) {
			currentUser = { user_id: userId };
			showModal('suspend-modal');
		}
		
		function showDeleteModal(userId) {
			currentUser = { user_id: userId };
			showModal('delete-modal');
		}
		
		async function handleSubscriptionChange(e) {
			e.preventDefault();
			
			const subscription = document.getElementById('new-subscription').value;
			const reason = document.getElementById('subscription-reason').value;
			
			try {
				await apiCall('updateUserSubscription', {
					user_id: currentUser.user_id,
					subscription_level: subscription,
					reason
				});
				
				closeModal('subscription-modal');
				closeModal('user-modal');
				showSuccess('Subscription updated successfully');
				loadUsers();
				
				// Reset form
				document.getElementById('subscription-form').reset();
			} catch (error) {
				showError('Failed to update subscription: ' + error.message);
			}
		}
		
		async function handleSuspendUser(e) {
			e.preventDefault();
			
			const reason = document.getElementById('suspend-reason').value;
			
			try {
				await apiCall('suspendUser', {
					user_id: currentUser.user_id,
					reason
				});
				
				closeModal('suspend-modal');
				closeModal('user-modal');
				showSuccess('User suspended successfully');
				loadUsers();
				
				// Reset form
				document.getElementById('suspend-form').reset();
			} catch (error) {
				showError('Failed to suspend user: ' + error.message);
			}
		}
		
		async function unsuspendUser(userId) {
			try {
				await apiCall('unsuspendUser', {
					user_id: userId,
					reason: 'Unsuspended by admin'
				});
				
				closeModal('user-modal');
				showSuccess('User unsuspended successfully');
				loadUsers();
			} catch (error) {
				showError('Failed to unsuspend user: ' + error.message);
			}
		}
		
		async function handleDeleteUser(e) {
			e.preventDefault();
			
			const reason = document.getElementById('delete-reason').value;
			
			try {
				await apiCall('deleteUser', {
					user_id: currentUser.user_id,
					reason
				});
				
				closeModal('delete-modal');
				closeModal('user-modal');
				showSuccess('User deleted successfully');
				loadUsers();
				
				// Reset form
				document.getElementById('delete-form').reset();
			} catch (error) {
				showError('Failed to delete user: ' + error.message);
			}
		}
		
		async function exportUserData(userId) {
			try {
				window.open(`${API_BASE}?action=exportUserData&user_id=${userId}`, '_blank');
				showSuccess('User data export started');
			} catch (error) {
				showError('Failed to export user data: ' + error.message);
			}
		}
		
		// Admin Actions
		async function loadAdminActions() {
			try {
				const result = await apiCall('getAdminActions', {}, 'GET');
				renderAdminActions(result.data.actions, result.data.pagination);
			} catch (error) {
				showError('Failed to load admin actions: ' + error.message);
			}
		}
		
		function renderAdminActions(actions, pagination) {
			const content = document.getElementById('actions-content');
			
			if (actions.length === 0) {
				content.innerHTML = '<div class="loading">No admin actions found</div>';
				return;
			}
			
			const tableHTML = `
				<table class="users-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Admin</th>
							<th>Action</th>
							<th>Target User</th>
							<th>Details</th>
							<th>Reason</th>
						</tr>
					</thead>
					<tbody>
						${actions.map(action => `
							<tr>
								<td>${new Date(action.created_at).toLocaleString()}</td>
								<td>${escapeHtml(action.admin_username)}</td>
								<td>${action.action_type.replace('_', ' ').toUpperCase()}</td>
								<td>
									<div><strong>${escapeHtml(action.target_username)}</strong></div>
									<div style="font-size: 0.875rem; color: #6b7280;">${escapeHtml(action.target_email)}</div>
								</td>
								<td>
									${action.old_value ? `${action.old_value} → ` : ''}${action.new_value || ''}
								</td>
								<td>${escapeHtml(action.reason || '')}</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			`;
			
			content.innerHTML = tableHTML;
		}
		
		// Utility Functions
		function escapeHtml(text) {
			if (!text) return '';
			const div = document.createElement('div');
			div.textContent = text;
			return div.innerHTML;
		}
		
		function showError(message) {
			const errorDiv = document.createElement('div');
			errorDiv.className = 'error-message';
			errorDiv.textContent = message;
			document.body.appendChild(errorDiv);
			setTimeout(() => errorDiv.remove(), 5000);
		}
		
		function showSuccess(message) {
			const successDiv = document.createElement('div');
			successDiv.className = 'success-message';
			successDiv.textContent = message;
			document.body.appendChild(successDiv);
			setTimeout(() => successDiv.remove(), 3000);
		}
		
		function debounce(func, wait) {
			let timeout;
			return function executedFunction(...args) {
				const later = () => {
					clearTimeout(timeout);
					func(...args);
				};
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
			};
		}
	</script>
</body>
</html>