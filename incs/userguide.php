<?php
/**
 * MyDayHub User Guide
 * 
 * Comprehensive user manual with accordion-style sections
 * Follows app theming and visual design patterns
 * 
 * @version 1.0
 * @author Alex & AI Assistant
 */

require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

if (!isset($_SESSION['user_id'])) {
	header('Location: ' . APP_URL . '/login/login.php');
	exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<title>MyDayHub User Guide</title>
	
	<link rel="icon" type="image/svg+xml" href="<?php echo APP_URL; ?>/media/favico.svg">
	<link rel="stylesheet" href="<?php echo APP_URL; ?>/uix/style.css">
	
	<style>
		/* User Guide Specific Styles */
		.user-guide-container {
			max-width: 900px;
			margin: 0 auto;
			padding: 2rem 1.5rem;
			min-height: 100vh;
		}
		
		.guide-header {
			text-align: center;
			padding: 2rem 0 3rem;
			border-bottom: 2px solid var(--border-color);
			margin-bottom: 2rem;
		}
		
		.guide-header h1 {
			font-size: 2.5rem;
			margin: 0 0 0.5rem;
			background: var(--accent-gradient);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		
		.guide-header p {
			color: var(--text-secondary);
			font-size: 1.1rem;
			margin: 0;
		}
		
		.guide-logo {
			width: 80px;
			height: 80px;
			margin: 0 auto 1rem;
			display: block;
		}
		
		/* Accordion Styles */
		.accordion {
			margin-bottom: 1rem;
		}
		
		.accordion-item {
			background: var(--card-bg);
			border: 1px solid var(--border-color);
			border-radius: 0.5rem;
			margin-bottom: 0.75rem;
			overflow: hidden;
			transition: all 0.3s ease;
		}
		
		.accordion-item:hover {
			border-color: var(--accent-color);
			box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
		}
		
		.accordion-header {
			display: flex;
			align-items: center;
			gap: 1rem;
			padding: 1.25rem 1.5rem;
			cursor: pointer;
			user-select: none;
			transition: background-color 0.2s ease;
		}
		
		.accordion-header:hover {
			background: var(--btn-hover-bg);
		}
		
		.accordion-icon {
			flex-shrink: 0;
			width: 32px;
			height: 32px;
			color: var(--accent-color);
		}
		
		.accordion-title {
			flex-grow: 1;
			font-size: 1.1rem;
			font-weight: 600;
			color: var(--text-primary);
		}
		
		.accordion-chevron {
			flex-shrink: 0;
			width: 24px;
			height: 24px;
			color: var(--text-secondary);
			transition: transform 0.3s ease;
		}
		
		.accordion-item.active .accordion-chevron {
			transform: rotate(180deg);
		}
		
		.accordion-content {
			max-height: 0;
			overflow: hidden;
			transition: max-height 0.4s ease, padding 0.4s ease;
		}
		
		.accordion-item.active .accordion-content {
			max-height: 2000px;
		}
		
		.accordion-body {
			padding: 0 1.5rem 1.5rem 5rem;
			color: var(--text-primary);
			line-height: 1.7;
		}
		
		.accordion-body h3 {
			color: var(--accent-color);
			font-size: 1.1rem;
			margin: 1.5rem 0 0.75rem;
		}
		
		.accordion-body h3:first-child {
			margin-top: 0;
		}
		
		.accordion-body p {
			margin: 0 0 1rem;
		}
		
		.accordion-body ul, .accordion-body ol {
			margin: 0 0 1rem;
			padding-left: 1.5rem;
		}
		
		.accordion-body li {
			margin-bottom: 0.5rem;
		}
		
		.accordion-body code {
			background: var(--column-bg);
			padding: 0.2rem 0.5rem;
			border-radius: 0.25rem;
			font-family: 'Courier New', monospace;
			font-size: 0.9em;
			color: var(--accent-color);
		}
		
		.accordion-body .tip-box {
			background: rgba(34, 197, 94, 0.1);
			border-left: 3px solid var(--accent-color);
			padding: 1rem 1.25rem;
			margin: 1rem 0;
			border-radius: 0.25rem;
		}
		
		.accordion-body .warning-box {
			background: rgba(249, 115, 22, 0.1);
			border-left: 3px solid var(--accent-color-secondary);
			padding: 1rem 1.25rem;
			margin: 1rem 0;
			border-radius: 0.25rem;
		}
		
		.classification-badge {
			display: inline-block;
			padding: 0.25rem 0.75rem;
			border-radius: 1rem;
			font-size: 0.85rem;
			font-weight: 600;
			margin: 0 0.25rem;
		}
		
		.badge-signal {
			background: rgba(34, 197, 94, 0.2);
			color: #22c55e;
			border: 1px solid #22c55e;
		}
		
		.badge-support {
			background: rgba(59, 130, 246, 0.2);
			color: #3b82f6;
			border: 1px solid #3b82f6;
		}
		
		.badge-backlog {
			background: rgba(249, 115, 22, 0.2);
			color: #f97316;
			border: 1px solid #f97316;
		}
		
		.back-button {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.75rem 1.5rem;
			background: var(--accent-gradient);
			color: white;
			text-decoration: none;
			border-radius: 0.5rem;
			font-weight: 600;
			margin: 2rem 0;
			transition: all 0.3s ease;
		}
		
		.back-button:hover {
			background: var(--accent-gradient-hover);
			transform: translateX(-4px);
		}
		
		.back-button svg {
			width: 20px;
			height: 20px;
		}
		
		@media (max-width: 768px) {
			.user-guide-container {
				padding: 1rem;
			}
			
			.guide-header h1 {
				font-size: 2rem;
			}
			
			.accordion-body {
				padding: 0 1rem 1rem 3.5rem;
			}
			
			.accordion-icon {
				width: 24px;
				height: 24px;
			}
		}
	</style>
</head>
<body>
	<div class="user-guide-container">
		<a href="<?php echo APP_URL; ?>" class="back-button">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M19 12H5M12 19l-7-7 7-7"/>
			</svg>
			Back to MyDayHub
		</a>
		
		<div class="guide-header">
			<img src="<?php echo APP_URL; ?>/media/leaf.svg" alt="MyDayHub Logo" class="guide-logo">
			<h1>MyDayHub User Guide</h1>
			<p>Your comprehensive guide to mastering productivity with privacy</p>
		</div>
		
		<div class="accordion">
			
			<!-- Section 1: Getting Started -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 2L2 7l10 5 10-5-10-5z"/>
						<path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
					</svg>
					<span class="accordion-title">Getting Started</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<p>Welcome to MyDayHub! This guide will help you understand and make the most of your privacy-focused productivity hub.</p>
						
						<h3>What is MyDayHub?</h3>
						<p>MyDayHub is a privacy-first productivity application designed to help you focus on what truly matters. Unlike traditional task managers, MyDayHub emphasizes <strong>signal over noise</strong>—helping you distinguish between work that advances your mission and work that merely keeps you busy.</p>
						
						<h3>Key Features</h3>
						<ul>
							<li><strong>Tasks View:</strong> Kanban-style board with flexible columns and intelligent task classification</li>
							<li><strong>Journal View:</strong> Daily entries organized by date for reflection and planning</li>
							<li><strong>Privacy-First:</strong> Optional zero-knowledge encryption for sensitive content</li>
							<li><strong>Collaboration:</strong> Controlled sharing with permission management</li>
							<li><strong>Calendar Overlays:</strong> Contextual date information without disrupting your workflow</li>
						</ul>
						
						<div class="tip-box">
							<strong>💡 Tip:</strong> Start with the Tasks view to organize your work, then use the Journal view for daily reflections and planning.
						</div>
					</div>
				</div>
			</div>
			
			<!-- Section 2: Understanding Task Classification -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
						<polyline points="22 4 12 14.01 9 11.01"></polyline>
					</svg>
					<span class="accordion-title">Task Classification: Signal, Support & Backlog</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<p>The heart of MyDayHub's philosophy is the task classification system. Instead of simple priorities, tasks are categorized by their relationship to your mission.</p>
						
						<h3><span class="classification-badge badge-signal">Signal</span> Tasks</h3>
						<p><strong>Definition:</strong> Work that directly advances your mission or core objectives.</p>
						<p><strong>Examples:</strong></p>
						<ul>
							<li>Writing a critical project proposal</li>
							<li>Meeting with key stakeholders</li>
							<li>Developing new product features</li>
							<li>Strategic planning sessions</li>
						</ul>
						<p><strong>Why it matters:</strong> Signal tasks are your highest priority. They represent the 20% of work that generates 80% of your results.</p>
						
						<h3><span class="classification-badge badge-support">Support</span> Tasks</h3>
						<p><strong>Definition:</strong> Work that enables Signal tasks but doesn't directly advance your mission.</p>
						<p><strong>Examples:</strong></p>
						<ul>
							<li>Organizing your workspace</li>
							<li>Responding to routine emails</li>
							<li>Updating documentation</li>
							<li>Administrative tasks</li>
						</ul>
						<p><strong>Why it matters:</strong> Support tasks are important but should never crowd out Signal work. Schedule them strategically.</p>
						
						<h3><span class="classification-badge badge-backlog">Backlog</span> Tasks</h3>
						<p><strong>Definition:</strong> Work that's important but not time-sensitive; can be deferred without immediate consequences.</p>
						<p><strong>Examples:</strong></p>
						<ul>
							<li>Learning a new skill</li>
							<li>Exploring new tools or methods</li>
							<li>Nice-to-have improvements</li>
							<li>Future planning activities</li>
						</ul>
						<p><strong>Why it matters:</strong> Backlog tasks prevent clutter and help you maintain focus on what's urgent and important.</p>
						
						<div class="tip-box">
							<strong>💡 Pro Tip:</strong> Use the Mission Focus Chart in your header to see the distribution of your tasks. Aim for a healthy balance with Signal tasks taking priority.
						</div>
						
						<h3>How to Classify Tasks</h3>
						<p>Click the colored status band on the left edge of any task card to open the classification menu. Select the appropriate category. Tasks will automatically sort within their column: Signal → Support → Backlog → Completed.</p>
					</div>
				</div>
			</div>
			
			<!-- Section 3: Working with Tasks -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
						<line x1="9" y1="9" x2="15" y2="9"/>
						<line x1="9" y1="15" x2="15" y2="15"/>
					</svg>
					<span class="accordion-title">Working with Tasks & Columns</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<h3>Creating Columns</h3>
						<p>Columns help you organize tasks by project, context, or any system that works for you.</p>
						<ul>
							<li>Click <strong>"+ New Column"</strong> in the header</li>
							<li>Enter a descriptive name</li>
							<li>Press Enter or click Save</li>
						</ul>
						
						<h3>Managing Columns</h3>
						<ul>
							<li><strong>Rename:</strong> Double-click the column title</li>
							<li><strong>Reorder:</strong> Use the arrow buttons or drag-and-drop (desktop)</li>
							<li><strong>Delete:</strong> Click the menu (⋮) and select Delete (soft delete with undo)</li>
							<li><strong>Privacy:</strong> Toggle the lock icon to make all tasks in the column private</li>
						</ul>
						
						<h3>Creating Tasks</h3>
						<p>Add tasks quickly using the input field at the bottom of any column:</p>
						<ul>
							<li>Click the <strong>"+ New Task"</strong> field</li>
							<li>Type your task title</li>
							<li>Press Enter to create</li>
						</ul>
						
						<h3>Task Actions</h3>
						<p>Click the menu icon (⋮) on any task to access these options:</p>
						<ul>
							<li><strong>Notes:</strong> Open the full editor for detailed information</li>
							<li><strong>Due Date:</strong> Set or remove deadlines</li>
							<li><strong>Snooze:</strong> Hide tasks until a future date</li>
							<li><strong>Duplicate:</strong> Create a copy of the task</li>
							<li><strong>Move:</strong> Move to another column (especially useful on mobile)</li>
							<li><strong>Share:</strong> Collaborate with other users</li>
							<li><strong>Privacy:</strong> Toggle private/public status</li>
							<li><strong>Delete:</strong> Remove the task (soft delete with undo)</li>
						</ul>
						
						<h3>Quick Actions</h3>
						<ul>
							<li><strong>Complete:</strong> Click the checkbox to mark done</li>
							<li><strong>Edit Title:</strong> Double-click the task title</li>
							<li><strong>Classify:</strong> Click the colored status band on the left</li>
							<li><strong>Quick Notes:</strong> Click anywhere on the task card to flip and add brief notes</li>
						</ul>
						
						<div class="tip-box">
							<strong>💡 Desktop Tip:</strong> Drag tasks by their handle (≡) to reorder within a column or move between columns.
						</div>
					</div>
				</div>
			</div>
			
			<!-- Section 4: Privacy & Encryption -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
					</svg>
					<span class="accordion-title">Privacy & Zero-Knowledge Encryption</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<p>MyDayHub offers optional zero-knowledge encryption to protect your sensitive information. With encryption enabled, your private data is encrypted on your device before being sent to the server—meaning not even we can read it.</p>
						
						<h3>How Encryption Works</h3>
						<ul>
							<li><strong>Client-Side:</strong> Data is encrypted on your device using AES-256-GCM</li>
							<li><strong>Master Key:</strong> Derived from your encryption password, never leaves your device</li>
							<li><strong>Per-Item Keys:</strong> Each private task/entry has its own encryption key</li>
							<li><strong>Zero-Knowledge:</strong> The server stores encrypted data but cannot decrypt it</li>
						</ul>
						
						<h3>Setting Up Encryption</h3>
						<ol>
							<li>Toggle any task or column to private status</li>
							<li>You'll be prompted to set up encryption</li>
							<li>Create a strong encryption password (separate from your login password)</li>
							<li>Answer security questions for password recovery</li>
							<li>Confirm and activate encryption</li>
						</ol>
						
						<div class="warning-box">
							<strong>⚠️ Important:</strong> Your encryption password is NOT your login password. If you forget your encryption password and cannot answer your security questions, encrypted data cannot be recovered. Store your encryption password securely.
						</div>
						
						<h3>Making Items Private</h3>
						<p><strong>Individual Tasks:</strong></p>
						<ul>
							<li>Click the task menu (⋮) and select "Toggle Private"</li>
							<li>Or use the lock icon when it appears</li>
						</ul>
						
						<p><strong>Entire Columns:</strong></p>
						<ul>
							<li>Click the lock icon in the column header</li>
							<li>All tasks in the column automatically become private</li>
							<li>Note: Shared tasks will be unshared when a column is made private</li>
						</ul>
						
						<h3>Hybrid Architecture</h3>
						<p>MyDayHub uses a <strong>hybrid zero-knowledge architecture</strong>:</p>
						<ul>
							<li><strong>Private items:</strong> Encrypted end-to-end, zero-knowledge</li>
							<li><strong>Public items:</strong> Not encrypted, can be shared with collaborators</li>
						</ul>
						<p>This design gives you complete control: encrypt what's sensitive, keep collaboration simple for everything else.</p>
						
						<div class="tip-box">
							<strong>💡 Best Practice:</strong> Use private status for sensitive information like passwords, financial data, personal reflections, or confidential project details. Keep general tasks public for easier collaboration.
						</div>
					</div>
				</div>
			</div>
			
			<!-- Section 5: Sharing & Collaboration -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
						<circle cx="9" cy="7" r="4"/>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
					</svg>
					<span class="accordion-title">Sharing & Collaboration</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<p>MyDayHub allows you to share tasks with other users while maintaining control over permissions and privacy.</p>
						
						<h3>Important: Privacy Boundary</h3>
						<div class="warning-box">
							<strong>⚠️ Privacy Rule:</strong> Only non-private items can be shared. Private (encrypted) tasks cannot be shared to preserve zero-knowledge security. If you need to share a private task, toggle it to public first.
						</div>
						
						<h3>How to Share a Task</h3>
						<ol>
							<li>Click the task menu (⋮)</li>
							<li>Select <strong>"Share"</strong></li>
							<li>Enter the recipient's email or username</li>
							<li>Choose permission level:
								<ul>
									<li><strong>View:</strong> Can see the task but not edit it</li>
									<li><strong>Edit:</strong> Can modify title, notes, due dates, and classification</li>
								</ul>
							</li>
							<li>Click <strong>"Share"</strong> to confirm</li>
						</ol>
						
						<h3>Receiving Shared Tasks</h3>
						<p>When someone shares a task with you:</p>
						<ul>
							<li>It appears in a special <strong>"Shared with Me"</strong> column</li>
							<li>You'll see the owner's name on the task</li>
							<li>Your available actions depend on your permission level</li>
						</ul>
						
						<h3>Permission Levels Explained</h3>
						<p><strong>View Permission:</strong></p>
						<ul>
							<li>See task title, notes, due dates</li>
							<li>Cannot edit, move, delete, or change privacy</li>
							<li>Can mark as "Ready for Review"</li>
						</ul>
						
						<p><strong>Edit Permission:</strong></p>
						<ul>
							<li>All View permissions, plus:</li>
							<li>Edit title and notes</li>
							<li>Change classification and due dates</li>
							<li>Add comments and updates</li>
							<li>Cannot delete, re-share, or change privacy</li>
						</ul>
						
						<p><strong>Owner (You) Always Can:</strong></p>
						<ul>
							<li>Do everything recipients can do, plus:</li>
							<li>Delete the task permanently</li>
							<li>Change privacy settings</li>
							<li>Revoke sharing access</li>
							<li>Share with additional users</li>
						</ul>
						
						<h3>Ready for Review Workflow</h3>
						<p>Recipients can signal when they've completed their part:</p>
						<ol>
							<li>Recipient clicks the status indicator on a shared task</li>
							<li>Selects <strong>"Mark Ready for Review"</strong></li>
							<li>Owner sees a notification badge on the task</li>
							<li>Owner can review and either complete or provide feedback</li>
						</ol>
						
						<h3>Unsharing Tasks</h3>
						<p>As the owner:</p>
						<ul>
							<li>Open the task menu (⋮) and select <strong>"Share"</strong></li>
							<li>Click <strong>"Unshare"</strong> next to any recipient</li>
							<li>They immediately lose access to the task</li>
						</ul>
						
						<div class="tip-box">
							<strong>💡 Collaboration Tip:</strong> Use Edit permission for active collaborators and View permission for stakeholders who just need visibility. The Ready for Review workflow keeps everyone aligned without constant back-and-forth.
						</div>
					</div>
				</div>
			</div>
			
			<!-- Section 6: Journal View -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14 2 14 8 20 8"/>
						<line x1="16" y1="13" x2="8" y2="13"/>
						<line x1="16" y1="17" x2="8" y2="17"/>
						<polyline points="10 9 9 9 8 9"/>
					</svg>
					<span class="accordion-title">Journal View & Daily Entries</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<p>The Journal view provides a date-based organization system for daily reflections, planning, and notes.</p>
						
						<h3>Accessing Journal View</h3>
						<p>Click the <strong>"Journal"</strong> tab in the header to switch from Tasks to Journal view. Each date gets its own column, displayed horizontally with the most recent dates on the right.</p>
						
						<h3>Creating Journal Entries</h3>
						<ol>
							<li>Navigate to the desired date column</li>
							<li>Click <strong>"+ New Entry"</strong> at the bottom</li>
							<li>Enter your entry title</li>
							<li>Press Enter to create</li>
							<li>Click the entry to add detailed notes</li>
						</ol>
						
						<h3>Journal Entry Features</h3>
						<ul>
							<li><strong>Rich Notes:</strong> Use the full editor for detailed content</li>
							<li><strong>Privacy:</strong> Make entries private with encryption</li>
							<li><strong>Organization:</strong> Entries automatically sort by date</li>
							<li><strong>Navigation:</strong> Scroll horizontally to see past and future dates</li>
						</ul>
						
						<h3>Linking Tasks to Journal Entries</h3>
						<p>Connect tasks to specific journal entries to track daily progress:</p>
						<ul>
							<li>Reference task IDs in journal notes</li>
							<li>Use journal entries to plan daily task priorities</li>
							<li>Review completed tasks in daily reflections</li>
						</ul>
						
						<h3>Best Practices for Journaling</h3>
						<ul>
							<li><strong>Morning Planning:</strong> Start each day by reviewing priorities in a new journal entry</li>
							<li><strong>Evening Reflection:</strong> End each day by noting accomplishments and learnings</li>
							<li><strong>Weekly Reviews:</strong> Use Sunday/Monday entries for weekly planning</li>
							<li><strong>Private Thoughts:</strong> Toggle sensitive entries to private for personal reflections</li>
						</ul>
						
						<div class="tip-box">
							<strong>💡 Power User Tip:</strong> Use journal entries to track your Signal task progress. Each evening, note which Signal tasks advanced and which obstacles you overcame. This creates a valuable record of your mission progress over time.
						</div>
					</div>
				</div>
			</div>
			
			<!-- Section 7: Advanced Features -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="3"/>
						<path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
					</svg>
					<span class="accordion-title">Advanced Features</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<h3>Task Snoozing</h3>
						<p>Temporarily hide tasks until a specific date:</p>
						<ul>
							<li>Click task menu (⋮) → <strong>"Snooze"</strong></li>
							<li>Choose preset duration (1 week, 1 month, 1 quarter)</li>
							<li>Or select a custom date</li>
							<li>Task becomes semi-transparent and moves to Backlog classification</li>
							<li>Automatically unsnoozes at 9 AM on the scheduled date</li>
						</ul>
						
						<h3>File Attachments</h3>
						<p>Add images and PDFs to tasks:</p>
						<ul>
							<li>Supported formats: JPEG, PNG, GIF, WebP, PDF</li>
							<li>Maximum file size: 5MB per file</li>
							<li>Access via task menu (⋮) → <strong>"Manage Files"</strong></li>
							<li>Upload by browsing or drag-and-drop</li>
							<li>View in-app (images) or new tab (PDFs)</li>
						</ul>
						
						<h3>Calendar Overlays</h3>
						<p>Add contextual calendar information without cluttering your workflow:</p>
						<ul>
							<li>Access via Settings → <strong>"Calendar Overlays"</strong></li>
							<li>Create fiscal calendars, holidays, birthdays, custom events</li>
							<li>Events appear as badges in the header</li>
							<li>Import/export via JSON for bulk management</li>
							<li>Set priorities to control which events display</li>
						</ul>
						
						<h3>Mission Focus Chart</h3>
						<p>Visualize your task distribution:</p>
						<ul>
							<li>Small doughnut chart in the header</li>
							<li>Shows Signal/Support/Backlog proportions</li>
							<li>Hover to see exact percentages</li>
							<li>Toggle visibility in Settings</li>
							<li>Updates in real-time as you work</li>
						</ul>
						
						<h3>Mobile Move Mode</h3>
						<p>Touch-friendly task movement:</p>
						<ol>
							<li>Open task menu (⋮) → <strong>"Move"</strong></li>
							<li>Task enters "wiggle" state with banner at top</li>
							<li>Column footers change to <strong>"Move here"</strong> buttons</li>
							<li>Click destination column's button</li>
							<li>For in-column moves, use the drop zones between tasks</li>
						</ol>
						
						<h3>Filtering</h3>
						<p>Control what you see:</p>
						<ul>
							<li>Bottom toolbar filter menu</li>
							<li><strong>Show/Hide Completed:</strong> Declutter your view</li>
							<li><strong>Show/Hide Private:</strong> Focus on public or sensitive items</li>
							<li><strong>Show/Hide Snoozed:</strong> Filter out postponed tasks</li>
							<li>Settings persist across sessions</li>
						</ul>
						
						<div class="tip-box">
							<strong>💡 Productivity Hack:</strong> Hide completed tasks during the day to maintain focus, then show them in the evening to review your accomplishments. Use the Mission Focus Chart to ensure you're spending enough time on Signal tasks.
						</div>
					</div>
				</div>
			</div>
			
			<!-- Section 8: Settings & Customization -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="3"/>
						<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
					</svg>
					<span class="accordion-title">Settings & Customization</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<p>Access Settings by clicking the menu icon (☰) in the top-left corner.</p>
						
						<h3>Visual Preferences</h3>
						
						<p><strong>Theme:</strong></p>
						<ul>
							<li><strong>Dark:</strong> Default theme with comfortable dark backgrounds</li>
							<li><strong>Light:</strong> Softer light mode for daytime work</li>
							<li><strong>High-Contrast:</strong> Enhanced contrast for accessibility</li>
						</ul>
						
						<p><strong>Global Font Size:</strong></p>
						<ul>
							<li><strong>A-:</strong> Smaller text (80% of default)</li>
							<li><strong>Reset:</strong> Default size (100%)</li>
							<li><strong>A+:</strong> Larger text (up to 150%)</li>
							<li>Adjusts in 10% increments for fine control</li>
						</ul>
						
						<p><strong>Show Date in Header:</strong></p>
						<ul>
							<li>Toggle current date display in the header</li>
							<li>Hide for a cleaner interface or show for quick reference</li>
						</ul>
						
						<p><strong>Mission Focus Chart:</strong></p>
						<ul>
							<li>Show or hide the task distribution chart</li>
							<li>Personal preference based on whether you use this metric</li>
						</ul>
						
						<p><strong>Completion Sound:</strong></p>
						<ul>
							<li>Toggle audio feedback when completing tasks</li>
							<li>Satisfying chime provides positive reinforcement</li>
							<li>Turn off for quiet environments</li>
						</ul>
						
						<h3>Security Settings</h3>
						
						<p><strong>Manage Privacy & Encryption:</strong></p>
						<ul>
							<li>Set up or manage your encryption system</li>
							<li>View encryption status</li>
							<li>Update security questions</li>
						</ul>
						
						<p><strong>Change Password:</strong></p>
						<ul>
							<li>Update your login password</li>
							<li>Requires current password for security</li>
						</ul>
						
						<p><strong>Privacy & Encryption - Timeout:</strong></p>
						<ul>
							<li>Default: 30 minutes of inactivity</li>
							<li>After timeout, requires re-authentication for encrypted content</li>
						</ul>
						
						<h3>Data Management</h3>
						
						<p><strong>Manage Files:</strong></p>
						<ul>
							<li>View all uploaded attachments</li>
							<li>See storage usage by user</li>
							<li>Delete files to free up space</li>
							<li>Manage storage quotas</li>
						</ul>
						
						<p><strong>Usage Stats:</strong></p>
						<ul>
							<li>View your activity metrics</li>
							<li>Track task creation and completion</li>
							<li>Analyze your productivity patterns</li>
						</ul>
						
						<div class="tip-box">
							<strong>💡 Recommendation:</strong> Start with Dark theme and default font size. Enable the Mission Focus Chart to build awareness of your task distribution. Keep the completion sound on for positive reinforcement of good habits.
						</div>
					</div>
				</div>
			</div>
			
			<!-- Section 9: Keyboard Shortcuts & Tips -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
						<path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
					</svg>
					<span class="accordion-title">Keyboard Shortcuts & Pro Tips</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<h3>Keyboard Shortcuts</h3>
						
						<p><strong>Global:</strong></p>
						<ul>
							<li><strong>Esc:</strong> Close any modal or cancel operation</li>
							<li><strong>Enter:</strong> Save and submit in forms and inputs</li>
						</ul>
						
						<p><strong>Editor (when note editor is open):</strong></p>
						<ul>
							<li><strong>Tab:</strong> Indent selected text</li>
							<li><strong>Shift + Tab:</strong> Unindent selected text</li>
							<li><strong>Ctrl/Cmd + S:</strong> Save notes (auto-save also active)</li>
						</ul>
						
						<h3>Mouse & Touch Shortcuts</h3>
						<ul>
							<li><strong>Double-click:</strong> Edit task title or column name</li>
							<li><strong>Click status band:</strong> Change task classification</li>
							<li><strong>Click task card:</strong> Flip to quick notes (back)</li>
							<li><strong>Long-press (mobile):</strong> Initiate drag for reordering</li>
						</ul>
						
						<h3>Pro Tips for Power Users</h3>
						
						<p><strong>Morning Routine:</strong></p>
						<ol>
							<li>Review yesterday's completed tasks (show completed filter)</li>
							<li>Create today's journal entry with priorities</li>
							<li>Identify 1-3 Signal tasks for the day</li>
							<li>Hide completed tasks and focus on active work</li>
							<li>Check Mission Focus Chart—aim for 60%+ Signal tasks</li>
						</ol>
						
						<p><strong>Weekly Planning:</strong></p>
						<ol>
							<li>Create a "Planning" or "This Week" column</li>
							<li>Pull Backlog tasks that should become active</li>
							<li>Review shared tasks and Ready for Review items</li>
							<li>Set due dates for time-sensitive work</li>
							<li>Snooze tasks that can wait until next week</li>
						</ol>
						
						<p><strong>Collaboration Best Practices:</strong></p>
						<ul>
							<li>Use task notes for context when sharing</li>
							<li>Set clear due dates for shared tasks</li>
							<li>Use "Ready for Review" to signal completion</li>
							<li>Keep private what truly needs encryption</li>
							<li>Unshare promptly when collaboration ends</li>
						</ul>
						
						<p><strong>Staying Focused:</strong></p>
						<ul>
							<li>Create separate columns for different contexts (Work, Personal, Learning)</li>
							<li>Use classification rigorously—be honest about what's truly Signal</li>
							<li>Snooze tasks that distract from this week's priorities</li>
							<li>Hide completed and snoozed tasks during focus time</li>
							<li>Review your Mission Focus Chart weekly</li>
						</ul>
						
						<div class="tip-box">
							<strong>💡 Advanced Tip:</strong> Create a "Waiting For" column for tasks blocked by others. Move tasks here instead of leaving them in active columns. Review weekly and follow up as needed. This keeps your active columns focused on what YOU can advance right now.
						</div>
					</div>
				</div>
			</div>
			
			<!-- Section 10: Troubleshooting -->
			<div class="accordion-item">
				<div class="accordion-header">
					<svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
						<line x1="12" y1="17" x2="12.01" y2="17"/>
					</svg>
					<span class="accordion-title">Troubleshooting & FAQ</span>
					<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</div>
				<div class="accordion-content">
					<div class="accordion-body">
						<h3>Common Issues & Solutions</h3>
						
						<p><strong>Q: I forgot my encryption password. How do I recover it?</strong></p>
						<p>A: Use the "Forgot Encryption Password" option in Privacy & Encryption settings. Answer your security questions to recover access. If you cannot answer the questions, encrypted data cannot be recovered—this is by design for zero-knowledge security.</p>
						
						<p><strong>Q: Why can't I share a private task?</strong></p>
						<p>A: Private tasks are encrypted end-to-end. To maintain zero-knowledge security, they cannot be shared. Toggle the task to public first, then share it.</p>
						
						<p><strong>Q: My tasks aren't sorting correctly.</strong></p>
						<p>A: Tasks sort automatically by classification: Signal → Support → Backlog → Completed. Within each classification, you can manually reorder tasks. Ensure the task has the correct classification by clicking its status band.</p>
						
						<p><strong>Q: What happens to shared tasks if I make a column private?</strong></p>
						<p>A: MyDayHub will prompt you with a warning. If you proceed, all shared tasks in that column will be automatically unshared before the column becomes private. Recipients will lose access.</p>
						
						<p><strong>Q: Can I access MyDayHub offline?</strong></p>
						<p>A: Full offline functionality is planned for a future release. Currently, you need an internet connection to use MyDayHub.</p>
						
						<p><strong>Q: How do I delete my account?</strong></p>
						<p>A: Contact your administrator or use the account deletion option in Settings → Privacy & Encryption. Note that this action is irreversible.</p>
						
						<p><strong>Q: Why is my file upload failing?</strong></p>
						<p>A: Check these common issues:</p>
						<ul>
							<li>File size exceeds 5MB limit</li>
							<li>File format not supported (only JPEG, PNG, GIF, WebP, PDF)</li>
							<li>Storage quota exceeded (check Settings → Manage Files)</li>
						</ul>
						
						<p><strong>Q: How do I undo a deleted task or column?</strong></p>
						<p>A: Deleted items use soft delete. Look for the "Undo" toast notification that appears immediately after deletion. Click "Undo" within a few seconds to restore the item.</p>
						
						<h3>Performance Tips</h3>
						<ul>
							<li>Regularly archive completed tasks to reduce board clutter</li>
							<li>Delete unused attachments to free up storage</li>
							<li>Use filters to show only relevant items</li>
							<li>Limit columns to 5-7 for optimal viewing</li>
						</ul>
						
						<h3>Getting Help</h3>
						<p>If you encounter issues not covered here:</p>
						<ul>
							<li>Check Settings → Usage Stats for system information</li>
							<li>Note any error messages that appear</li>
							<li>Contact your administrator with specific details</li>
							<li>Include browser type and version for technical issues</li>
						</ul>
						
						<div class="warning-box">
							<strong>⚠️ Data Safety:</strong> MyDayHub performs automatic backups, but we recommend periodically reviewing your critical tasks. For encrypted data, ensure you remember your encryption password and security question answers—we cannot recover them for you.
						</div>
					</div>
				</div>
			</div>
			
		</div>
		
		<a href="<?php echo APP_URL; ?>" class="back-button">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M19 12H5M12 19l-7-7 7-7"/>
			</svg>
			Back to MyDayHub
		</a>
	</div>
	
	<script>
		// Load theme preference
		const savedTheme = localStorage.getItem('theme') || 'dark';
		if (savedTheme === 'light') {
			document.body.classList.add('light-mode');
		} else if (savedTheme === 'high-contrast') {
			document.body.classList.add('high-contrast');
		}
		
		// Accordion functionality
		document.querySelectorAll('.accordion-header').forEach(header => {
			header.addEventListener('click', function() {
				const item = this.parentElement;
				const wasActive = item.classList.contains('active');
				
				// Close all accordion items
				document.querySelectorAll('.accordion-item').forEach(i => {
					i.classList.remove('active');
				});
				
				// Open clicked item if it wasn't already active
				if (!wasActive) {
					item.classList.add('active');
					// Smooth scroll to bring item into view
					setTimeout(() => {
						item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
					}, 100);
				}
			});
		});
	</script>
</body>
</html>


