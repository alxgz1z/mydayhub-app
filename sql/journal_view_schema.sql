-- ==========================================================================
-- JOURNAL VIEW DATABASE SCHEMA
-- ==========================================================================
-- This script creates the necessary tables for the Journal View functionality
-- Includes privacy integration with existing encryption system

-- ==========================================================================
-- 1. JOURNAL ENTRIES TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS journal_entries (
    entry_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    entry_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    encrypted_data TEXT, -- For private entries (uses existing encryption system)
    is_private BOOLEAN DEFAULT FALSE,
    position INT DEFAULT 0, -- For ordering entries within a day
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_user_date (user_id, entry_date),
    INDEX idx_user_private (user_id, is_private),
    INDEX idx_entry_date (entry_date),
    
    -- Unique constraint for user-date-title combination
    UNIQUE KEY unique_user_date_title (user_id, entry_date, title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 2. TASK-JOURNAL LINKS TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS journal_task_links (
    link_id INT PRIMARY KEY AUTO_INCREMENT,
    journal_entry_id INT NOT NULL,
    task_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(entry_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate links
    UNIQUE KEY unique_journal_task_link (journal_entry_id, task_id),
    
    -- Indexes for performance
    INDEX idx_journal_entry (journal_entry_id),
    INDEX idx_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 3. ADD JOURNAL REFERENCE TO TASKS TABLE
-- ==========================================================================

-- Add journal_entry_id column to tasks table if it doesn't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS journal_entry_id INT NULL,
ADD CONSTRAINT fk_task_journal_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(entry_id) ON DELETE SET NULL;

-- Add index for performance
ALTER TABLE tasks 
ADD INDEX IF NOT EXISTS idx_journal_entry_id (journal_entry_id);

-- ==========================================================================
-- 4. JOURNAL VIEW PREFERENCES TABLE
-- ==========================================================================

CREATE TABLE IF NOT EXISTS journal_preferences (
    preference_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    view_mode ENUM('1-day', '3-day', '5-day') DEFAULT '3-day',
    hide_weekends BOOLEAN DEFAULT FALSE,
    date_format VARCHAR(20) DEFAULT 'YEAR.MON.DD, Day',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Unique constraint (one preference record per user)
    UNIQUE KEY unique_user_preferences (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 5. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ==========================================================================

-- Insert sample journal entries for testing (uncomment if needed)
/*
INSERT INTO journal_entries (user_id, entry_date, title, content, is_private, position) VALUES
(1, '2025-10-08', 'Morning Standup', 'Discussed project priorities and blockers. Need to follow up on @task[Review mockups by Friday].', FALSE, 1),
(1, '2025-10-08', 'Design Review', 'Met with design team. @task[Budget approval process] needs attention from finance.', FALSE, 2),
(1, '2025-10-07', 'Personal Reflection', 'Feeling good about the encryption implementation. The hybrid approach is working well.', TRUE, 1);

-- Insert sample preferences
INSERT INTO journal_preferences (user_id, view_mode, hide_weekends, date_format) VALUES
(1, '3-day', FALSE, 'YEAR.MON.DD, Day');
*/

-- ==========================================================================
-- 6. VERIFICATION QUERIES
-- ==========================================================================

-- Verify tables were created successfully
SELECT 'journal_entries' as table_name, COUNT(*) as row_count FROM journal_entries
UNION ALL
SELECT 'journal_task_links' as table_name, COUNT(*) as row_count FROM journal_task_links
UNION ALL
SELECT 'journal_preferences' as table_name, COUNT(*) as row_count FROM journal_preferences;

-- Show table structure
DESCRIBE journal_entries;
DESCRIBE journal_task_links;
DESCRIBE journal_preferences;
