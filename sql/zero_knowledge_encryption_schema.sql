-- Zero-Knowledge Encryption Schema
-- MyDayHub - Database Schema for Zero-Knowledge Encryption
-- @version 7.5 - Zero Knowledge
-- @author Alex & Gemini & Claude & Cursor

-- ==========================================================================
-- 1. USER ENCRYPTION KEYS TABLE
-- ==========================================================================

CREATE TABLE `user_encryption_keys` (
  `user_id` int NOT NULL,
  `wrapped_master_key` blob NOT NULL,           -- Master key encrypted with user password
  `key_derivation_salt` blob NOT NULL,          -- Salt for Argon2id key derivation
  `recovery_envelope` blob DEFAULT NULL,        -- Master key copy encrypted with recovery key
  `recovery_questions_hash` blob DEFAULT NULL,  -- Hash of security question answers
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 2. ITEM ENCRYPTION KEYS TABLE (Per-Item DEKs)
-- ==========================================================================

CREATE TABLE `item_encryption_keys` (
  `item_id` int NOT NULL,
  `item_type` enum('task','column') NOT NULL,
  `wrapped_dek` blob NOT NULL,                  -- DEK encrypted with user's Master Key
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`, `item_type`),
  INDEX `idx_user_items` (`item_type`, `item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 3. PRIVACY INHERITANCE TRACKING
-- ==========================================================================

-- Add privacy inheritance columns to tasks table
ALTER TABLE `tasks` 
ADD COLUMN `privacy_inherited` tinyint(1) DEFAULT 0 COMMENT 'Task privacy inherited from column',
ADD COLUMN `privacy_override` tinyint(1) DEFAULT 0 COMMENT 'User explicitly set task privacy';

-- Add shared tasks tracking to columns table  
ALTER TABLE `columns` 
ADD COLUMN `has_shared_tasks` tinyint(1) DEFAULT 0 COMMENT 'Column contains shared tasks (blocks privacy)';

-- ==========================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ==========================================================================

-- Indexes for encryption key lookups
CREATE INDEX `idx_user_encryption_created` ON `user_encryption_keys`(`created_at`);
CREATE INDEX `idx_item_keys_created` ON `item_encryption_keys`(`created_at`);

-- Indexes for privacy queries
CREATE INDEX `idx_tasks_privacy` ON `tasks`(`user_id`, `is_private`, `privacy_inherited`);
CREATE INDEX `idx_columns_privacy` ON `columns`(`user_id`, `is_private`, `has_shared_tasks`);

-- Index for shared tasks detection
CREATE INDEX `idx_shared_items_detection` ON `shared_items`(`owner_id`, `recipient_id`, `item_type`, `item_id`, `status`);

-- ==========================================================================
-- 5. SECURITY QUESTIONS TABLE
-- ==========================================================================

CREATE TABLE `user_security_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_text` text NOT NULL,                -- The actual security question (encrypted)
  `question_hash` varchar(255) NOT NULL,        -- Hash of the security question
  `answer_hash` varchar(255) NOT NULL,          -- Hash of the answer (for verification)
  `question_order` tinyint NOT NULL,            -- Order of questions (1-3)
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_question` (`user_id`, `question_order`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  INDEX `idx_user_questions` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 6. ENCRYPTION MIGRATION TRACKING
-- ==========================================================================

CREATE TABLE `encryption_migration_status` (
  `user_id` int NOT NULL,
  `migration_status` enum('pending','in_progress','completed','failed') DEFAULT 'pending',
  `tasks_migrated` int DEFAULT 0,
  `total_tasks` int DEFAULT 0,
  `migration_started_at` timestamp NULL,
  `migration_completed_at` timestamp NULL,
  `error_message` text DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  INDEX `idx_migration_status` (`migration_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 7. ENCRYPTION AUDIT LOG
-- ==========================================================================

CREATE TABLE `encryption_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `operation` enum('encrypt','decrypt','key_derive','recovery_used','migration') NOT NULL,
  `item_type` enum('task','column','user_key') DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  INDEX `idx_user_operations` (`user_id`, `operation`, `created_at`),
  INDEX `idx_audit_timeline` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 8. VIEWS FOR COMMON QUERIES
-- ==========================================================================

-- View for shared tasks detection
CREATE VIEW `v_shared_tasks_by_column` AS
SELECT 
    t.column_id,
    t.user_id as owner_id,
    COUNT(si.id) as shared_count,
    GROUP_CONCAT(DISTINCT si.recipient_id) as recipient_ids
FROM tasks t
LEFT JOIN shared_items si ON t.task_id = si.item_id AND si.item_type = 'task' AND si.status = 'active'
WHERE t.deleted_at IS NULL
GROUP BY t.column_id, t.user_id;

-- View for encryption status
CREATE VIEW `v_user_encryption_status` AS
SELECT 
    u.user_id,
    u.username,
    CASE WHEN uek.user_id IS NOT NULL THEN 'enabled' ELSE 'disabled' END as encryption_status,
    CASE WHEN uek.recovery_envelope IS NOT NULL THEN 'enabled' ELSE 'disabled' END as recovery_status,
    ems.migration_status,
    ems.tasks_migrated,
    ems.total_tasks
FROM users u
LEFT JOIN user_encryption_keys uek ON u.user_id = uek.user_id
LEFT JOIN encryption_migration_status ems ON u.user_id = ems.user_id;
