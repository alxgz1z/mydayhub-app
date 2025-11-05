-- Task Comments System Migration
-- Version: 8.6 Nosara
-- Created: 2025-11-05
-- Adds social-style comment system for shared tasks

-- ==========================================================================
-- 1. TASK COMMENTS TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS task_comments (
    comment_id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Foreign key constraints
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_task_comments (task_id, deleted_at),
    INDEX idx_user_comments (user_id, created_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 2. TASK ACTIVITY TABLE (for future activity feed)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS task_activity (
    activity_id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    activity_type ENUM('note_edit', 'comment_add', 'comment_edit', 'comment_delete', 'status_change', 'attachment_add', 'attachment_delete', 'ready_for_review', 'reviewed') NOT NULL,
    activity_data JSON DEFAULT NULL, -- Stores additional context (e.g., old value, new value)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_task_activity (task_id, created_at),
    INDEX idx_user_activity (user_id, created_at),
    INDEX idx_activity_type (activity_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- VERIFICATION
-- ==========================================================================

-- Check if tables were created
SELECT 'Tables Check' as verification_type,
       COUNT(*) as found_count,
       CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name IN ('task_comments', 'task_activity');

