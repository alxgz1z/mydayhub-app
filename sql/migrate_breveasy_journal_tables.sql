-- ==========================================================================
-- JOURNAL VIEW TABLES MIGRATION FOR BREVEASY.COM
-- ==========================================================================
-- This script creates the journal tables for the hosted development mirror
-- Safe migration with existence checks to prevent errors on partial runs

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

-- Check if journal_entry_id column exists before adding it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'tasks' 
  AND COLUMN_NAME = 'journal_entry_id';

-- Add journal_entry_id column to tasks table if it doesn't exist
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE tasks ADD COLUMN journal_entry_id INT NULL',
    'SELECT "journal_entry_id column already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if column was added
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE tasks ADD CONSTRAINT fk_task_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(entry_id) ON DELETE SET NULL',
    'SELECT "Foreign key constraint already exists or not needed" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for performance if column was added
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE tasks ADD INDEX idx_journal_entry_id (journal_entry_id)',
    'SELECT "Index already exists or not needed" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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
-- 5. VERIFICATION
-- ==========================================================================

-- Verify tables were created successfully
SELECT 'journal_entries' as table_name, COUNT(*) as row_count FROM journal_entries
UNION ALL
SELECT 'journal_task_links' as table_name, COUNT(*) as row_count FROM journal_task_links
UNION ALL
SELECT 'journal_preferences' as table_name, COUNT(*) as row_count FROM journal_preferences;

-- Check if journal_entry_id was added to tasks table
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'journal_entry_id column exists in tasks table'
        ELSE 'journal_entry_id column NOT found in tasks table'
    END as status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'tasks' 
  AND COLUMN_NAME = 'journal_entry_id';

