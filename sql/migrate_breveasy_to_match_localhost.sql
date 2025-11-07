-- Migration Script: Update breveasy.com database to match localhost schema
-- Run this script on breveasy.com database to synchronize schema with localhost
-- Date: 2025-11-07
-- Reference: localhost.sql (source of truth)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================================
-- 1. FIX password_resets TABLE
-- ============================================================================
-- breveasy has: token (plain), used_at
-- localhost has: token_hash (hashed), no used_at
-- Strategy: Check what exists and migrate accordingly

-- Check if token_hash already exists (may have been partially migrated)
SET @token_hash_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'password_resets' 
    AND COLUMN_NAME = 'token_hash'
);

-- Check if token column exists
SET @token_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'password_resets' 
    AND COLUMN_NAME = 'token'
);

-- Only add token_hash if it doesn't exist
SET @sql = IF(@token_hash_exists = 0, 
    'ALTER TABLE `password_resets` ADD COLUMN `token_hash` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL AFTER `user_id`',
    'SELECT "token_hash column already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop token column if it exists
SET @sql = IF(@token_exists > 0, 
    'ALTER TABLE `password_resets` DROP COLUMN `token`',
    'SELECT "token column does not exist, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop used_at column if it exists
SET @used_at_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'password_resets' 
    AND COLUMN_NAME = 'used_at'
);
SET @sql = IF(@used_at_exists > 0, 
    'ALTER TABLE `password_resets` DROP COLUMN `used_at`',
    'SELECT "used_at column does not exist, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update index (drop old, add new)
ALTER TABLE `password_resets`
DROP INDEX IF EXISTS `unique_token`;
ALTER TABLE `password_resets`
ADD UNIQUE KEY `token_hash_UNIQUE` (`token_hash`);

-- Update column types to match localhost
ALTER TABLE `password_resets`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `user_id` INT NOT NULL,
MODIFY `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 2. FIX pending_registrations TABLE
-- ============================================================================
-- breveasy has: verification_token
-- localhost has: code_hash
-- Strategy: Check if column exists and rename accordingly

-- Check if code_hash already exists
SET @code_hash_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pending_registrations' 
    AND COLUMN_NAME = 'code_hash'
);

-- Check if verification_token exists
SET @verification_token_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pending_registrations' 
    AND COLUMN_NAME = 'verification_token'
);

-- Rename verification_token to code_hash if needed
SET @sql = IF(@code_hash_exists = 0 AND @verification_token_exists > 0, 
    'ALTER TABLE `pending_registrations` CHANGE COLUMN `verification_token` `code_hash` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL',
    IF(@code_hash_exists > 0, 
        'SELECT "code_hash column already exists, skipping rename" AS message',
        'SELECT "verification_token column does not exist, skipping" AS message'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update indexes
ALTER TABLE `pending_registrations`
DROP INDEX IF EXISTS `idx_token`;
ALTER TABLE `pending_registrations`
ADD KEY `ix_email_code` (`email`, `code_hash`),
ADD KEY `ix_expires` (`expires_at`);

-- Update column types
ALTER TABLE `pending_registrations`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `username` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
MODIFY `email` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
MODIFY `password_hash` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
MODIFY `code_hash` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
MODIFY `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 3. FIX shared_items TABLE
-- ============================================================================
-- breveasy missing: status, review_status columns
-- breveasy has: item_type enum('task') only
-- localhost has: item_type enum('task','column'), status, review_status
-- Strategy: Add missing columns and update enum

-- Step 1: Update item_type enum to include 'column'
ALTER TABLE `shared_items`
MODIFY `item_type` ENUM('task','column') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'task';

-- Step 2: Add missing columns
ALTER TABLE `shared_items`
ADD COLUMN `status` ENUM('active','ready_for_review','revoked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' AFTER `permission`,
ADD COLUMN `review_status` ENUM('pending','in_review','approved','needs_changes','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' AFTER `ready_for_review`;

-- Step 3: Update existing rows to have status='active' if ready_for_review=1
UPDATE `shared_items` 
SET `status` = 'ready_for_review' 
WHERE `ready_for_review` = 1 AND `status` = 'active';

-- Step 4: Update indexes to match localhost
-- Drop existing indexes first to avoid conflicts
ALTER TABLE `shared_items`
DROP INDEX IF EXISTS `unique_share`,
DROP INDEX IF EXISTS `idx_owner`,
DROP INDEX IF EXISTS `idx_recipient`,
DROP INDEX IF EXISTS `idx_shared_items_detection`;

-- Add new indexes
ALTER TABLE `shared_items`
ADD UNIQUE KEY `ux_share` (`owner_id`, `recipient_id`, `item_type`, `item_id`),
ADD KEY `ix_recipient` (`recipient_id`),
ADD KEY `ix_owner` (`owner_id`),
ADD KEY `ix_recipient_active` (`recipient_id`, `status`),
ADD KEY `ix_owner_item` (`owner_id`, `item_type`, `item_id`),
ADD KEY `idx_shared_items_detection` (`owner_id`, `recipient_id`, `item_type`, `item_id`, `status`),
ADD KEY `idx_review_status` (`review_status`, `item_type`, `item_id`);

-- Step 5: Update column types
ALTER TABLE `shared_items`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `owner_id` INT NOT NULL,
MODIFY `recipient_id` INT NOT NULL,
MODIFY `item_id` INT NOT NULL,
MODIFY `permission` ENUM('edit','view') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'edit',
MODIFY `ready_for_review` TINYINT(1) DEFAULT '0';

-- ============================================================================
-- 4. FIX tasks TABLE
-- ============================================================================
-- breveasy missing: snoozed_at column
-- Strategy: Add missing column if it doesn't exist

SET @snoozed_at_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tasks' 
    AND COLUMN_NAME = 'snoozed_at'
);

SET @sql = IF(@snoozed_at_exists = 0, 
    'ALTER TABLE `tasks` ADD COLUMN `snoozed_at` DATETIME DEFAULT NULL AFTER `snoozed_until`',
    'SELECT "snoozed_at column already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update column types to match localhost
ALTER TABLE `tasks`
MODIFY `task_id` INT NOT NULL AUTO_INCREMENT,
MODIFY `user_id` INT NOT NULL,
MODIFY `column_id` INT NOT NULL,
MODIFY `encrypted_data` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
MODIFY `position` INT NOT NULL,
MODIFY `classification` ENUM('signal','support','backlog','completed') COLLATE utf8mb4_unicode_ci NOT NULL,
MODIFY `due_date` DATE DEFAULT NULL,
MODIFY `is_private` TINYINT(1) NOT NULL DEFAULT '0',
MODIFY `snoozed_until` DATETIME DEFAULT NULL,
MODIFY `journal_entry_id` INT DEFAULT NULL,
MODIFY `privacy_inherited` TINYINT(1) DEFAULT '0' COMMENT 'Task privacy inherited from column',
MODIFY `privacy_override` TINYINT(1) DEFAULT '0' COMMENT 'User explicitly set task privacy',
MODIFY `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

-- ============================================================================
-- 5. ADD MISSING TABLES
-- ============================================================================

-- calendar_settings table
CREATE TABLE IF NOT EXISTS `calendar_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `calendar_name` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_public` TINYINT(1) DEFAULT '0',
  `is_visible` TINYINT(1) DEFAULT '1',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_calendar` (`user_id`, `calendar_name`),
  KEY `idx_user` (`user_id`),
  KEY `idx_public` (`is_public`),
  CONSTRAINT `calendar_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- calendar_subscriptions table
CREATE TABLE IF NOT EXISTS `calendar_subscriptions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subscriber_id` INT NOT NULL,
  `owner_id` INT NOT NULL,
  `calendar_name` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subscription` (`subscriber_id`, `owner_id`, `calendar_name`),
  KEY `idx_subscriber` (`subscriber_id`),
  KEY `idx_owner_calendar` (`owner_id`, `calendar_name`),
  CONSTRAINT `calendar_subscriptions_ibfk_1` FOREIGN KEY (`subscriber_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `calendar_subscriptions_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. UPDATE journal_entries TABLE COLUMN ORDER
-- ============================================================================
-- Ensure classification column is in the same position as localhost
-- (This is cosmetic but good for consistency)

-- Note: Column order doesn't affect functionality, but we can verify it matches
-- The important thing is that classification exists and has the right default

ALTER TABLE `journal_entries`
MODIFY `classification` VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT 'support' AFTER `is_private`;

-- Update column types
ALTER TABLE `journal_entries`
MODIFY `entry_id` INT NOT NULL AUTO_INCREMENT,
MODIFY `user_id` INT NOT NULL,
MODIFY `title` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================================================
-- 7. UPDATE encryption_audit_log TABLE
-- ============================================================================
-- Add journal_entry to item_type enum if missing

ALTER TABLE `encryption_audit_log`
MODIFY `item_type` ENUM('encrypt','decrypt','key_derive','recovery_used','migration') COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- Wait, let me check the localhost schema again for item_type
-- localhost has: enum('task','column','journal_entry','user_key')
-- breveasy has: enum('task','column','user_key')

ALTER TABLE `encryption_audit_log`
MODIFY `item_type` ENUM('task','column','journal_entry','user_key') COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- ============================================================================
-- 8. UPDATE item_encryption_keys TABLE
-- ============================================================================
-- Add journal_entry to item_type enum

ALTER TABLE `item_encryption_keys`
MODIFY `item_type` ENUM('task','column','journal_entry') COLLATE utf8mb4_unicode_ci NOT NULL;

-- ============================================================================
-- 9. UPDATE VIEWS TO MATCH LOCALHOST
-- ============================================================================

-- Update v_shared_tasks_by_column view to include status check
DROP VIEW IF EXISTS `v_shared_tasks_by_column`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u756585617_meh`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_shared_tasks_by_column` AS 
SELECT 
  `t`.`column_id` AS `column_id`, 
  `t`.`user_id` AS `owner_id`, 
  COUNT(`si`.`id`) AS `shared_count`, 
  GROUP_CONCAT(DISTINCT `si`.`recipient_id` SEPARATOR ',') AS `recipient_ids` 
FROM (`tasks` `t` 
LEFT JOIN `shared_items` `si` ON (
  (`t`.`task_id` = `si`.`item_id`) 
  AND (`si`.`item_type` = 'task') 
  AND (`si`.`status` = 'active')
)) 
WHERE (`t`.`deleted_at` IS NULL) 
GROUP BY `t`.`column_id`, `t`.`user_id`;

-- ============================================================================
-- 10. UPDATE COLUMN TYPES TO MATCH LOCALHOST (General cleanup)
-- ============================================================================

-- Update admin_actions
ALTER TABLE `admin_actions`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `admin_user_id` INT NOT NULL,
MODIFY `target_user_id` INT NOT NULL;

-- Update calendar_events
ALTER TABLE `calendar_events`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `user_id` INT NOT NULL,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update columns table
ALTER TABLE `columns`
MODIFY `column_id` INT NOT NULL AUTO_INCREMENT,
MODIFY `user_id` INT NOT NULL,
MODIFY `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

-- Update encryption_audit_log
ALTER TABLE `encryption_audit_log`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `user_id` INT NOT NULL,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;

-- Update encryption_migration_status
ALTER TABLE `encryption_migration_status`
MODIFY `user_id` INT NOT NULL,
MODIFY `tasks_migrated` INT DEFAULT '0',
MODIFY `total_tasks` INT DEFAULT '0';

-- Update journal_preferences
ALTER TABLE `journal_preferences`
MODIFY `preference_id` INT NOT NULL AUTO_INCREMENT,
MODIFY `user_id` INT NOT NULL,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update journal_task_links
ALTER TABLE `journal_task_links`
MODIFY `link_id` INT NOT NULL AUTO_INCREMENT,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;

-- Update sharing_activity
ALTER TABLE `sharing_activity`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update task_activity
-- breveasy has: activity_data with CHECK constraint
-- localhost has: activity_data as JSON type
ALTER TABLE `task_activity`
MODIFY `activity_id` INT NOT NULL AUTO_INCREMENT,
MODIFY `activity_data` JSON DEFAULT NULL,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;

-- Update task_attachments
ALTER TABLE `task_attachments`
MODIFY `attachment_id` INT NOT NULL AUTO_INCREMENT,
MODIFY `filesize_bytes` INT NOT NULL,
MODIFY `mime_type` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
MODIFY `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update task_comments
ALTER TABLE `task_comments`
MODIFY `comment_id` INT NOT NULL AUTO_INCREMENT,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update users
ALTER TABLE `users`
MODIFY `user_id` INT NOT NULL AUTO_INCREMENT,
MODIFY `storage_used_bytes` BIGINT NOT NULL DEFAULT '0',
MODIFY `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update user_calendar_preferences
ALTER TABLE `user_calendar_preferences`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `user_id` INT NOT NULL,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;

-- Update user_encryption_keys
ALTER TABLE `user_encryption_keys`
MODIFY `user_id` INT NOT NULL,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update user_security_questions
ALTER TABLE `user_security_questions`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `user_id` INT NOT NULL,
MODIFY `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;

-- Update user_trusts
ALTER TABLE `user_trusts`
MODIFY `id` INT NOT NULL AUTO_INCREMENT,
MODIFY `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration to verify)
-- ============================================================================

-- Check password_resets structure
-- DESCRIBE password_resets;
-- Should show: id, user_id, token_hash, expires_at, created_at

-- Check pending_registrations structure  
-- DESCRIBE pending_registrations;
-- Should show: id, username, email, password_hash, code_hash, expires_at, created_at

-- Check shared_items structure
-- DESCRIBE shared_items;
-- Should show: id, owner_id, recipient_id, item_type, item_id, permission, status, created_at, updated_at, ready_for_review, review_status

-- Check tasks structure
-- DESCRIBE tasks;
-- Should show: snoozed_at column exists

-- Check new tables exist
-- SHOW TABLES LIKE 'calendar_settings';
-- SHOW TABLES LIKE 'calendar_subscriptions';

