-- Simple Migration SQL to update breveasy.com database to latest schema
-- This version removes DEFINER clauses that require SET USER privileges
-- Target: Update from mydayhub-behind.sql to mydayhub-latest.sql
-- Date: January 7, 2025

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ==========================================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES (WITH CHECKS)
-- ==========================================================================

-- Add privacy inheritance columns to tasks table (if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema = DATABASE() 
       AND table_name = 'tasks' 
       AND column_name = 'privacy_inherited') = 0,
    'ALTER TABLE `tasks` ADD COLUMN `privacy_inherited` tinyint(1) DEFAULT ''0'' COMMENT ''Task privacy inherited from column''',
    'SELECT ''Column privacy_inherited already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema = DATABASE() 
       AND table_name = 'tasks' 
       AND column_name = 'privacy_override') = 0,
    'ALTER TABLE `tasks` ADD COLUMN `privacy_override` tinyint(1) DEFAULT ''0'' COMMENT ''User explicitly set task privacy''',
    'SELECT ''Column privacy_override already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add shared tasks tracking column to columns table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE table_schema = DATABASE() 
       AND table_name = 'columns' 
       AND column_name = 'has_shared_tasks') = 0,
    'ALTER TABLE `columns` ADD COLUMN `has_shared_tasks` tinyint(1) DEFAULT ''0'' COMMENT ''Column contains shared tasks (blocks privacy)''',
    'SELECT ''Column has_shared_tasks already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================================================
-- 2. CREATE ZERO-KNOWLEDGE ENCRYPTION TABLES (WITH CHECKS)
-- ==========================================================================

-- Create encryption audit log table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
     WHERE table_schema = DATABASE() 
       AND table_name = 'encryption_audit_log') = 0,
    'CREATE TABLE `encryption_audit_log` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `user_id` int(11) NOT NULL,
      `operation` enum(''encrypt'',''decrypt'',''key_derive'',''recovery_used'',''migration'') NOT NULL,
      `item_type` enum(''task'',''column'',''user_key'') DEFAULT NULL,
      `item_id` int(11) DEFAULT NULL,
      `success` tinyint(1) NOT NULL,
      `error_message` text DEFAULT NULL,
      `created_at` timestamp NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      KEY `idx_user_operations` (`user_id`,`operation`,`created_at`),
      KEY `idx_audit_timeline` (`created_at`),
      CONSTRAINT `encryption_audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT ''Table encryption_audit_log already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create encryption migration status table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
     WHERE table_schema = DATABASE() 
       AND table_name = 'encryption_migration_status') = 0,
    'CREATE TABLE `encryption_migration_status` (
      `user_id` int(11) NOT NULL,
      `migration_status` enum(''pending'',''in_progress'',''completed'',''failed'') DEFAULT ''pending'',
      `tasks_migrated` int(11) DEFAULT ''0'',
      `total_tasks` int(11) DEFAULT ''0'',
      `migration_started_at` timestamp NULL DEFAULT NULL,
      `migration_completed_at` timestamp NULL DEFAULT NULL,
      `error_message` text DEFAULT NULL,
      PRIMARY KEY (`user_id`),
      KEY `idx_migration_status` (`migration_status`),
      CONSTRAINT `encryption_migration_status_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT ''Table encryption_migration_status already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create item encryption keys table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
     WHERE table_schema = DATABASE() 
       AND table_name = 'item_encryption_keys') = 0,
    'CREATE TABLE `item_encryption_keys` (
      `item_id` int(11) NOT NULL,
      `item_type` enum(''task'',''column'') NOT NULL,
      `wrapped_dek` blob NOT NULL,
      `created_at` timestamp NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`item_id`,`item_type`),
      KEY `idx_user_items` (`item_type`,`item_id`),
      KEY `idx_item_keys_created` (`created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT ''Table item_encryption_keys already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create user encryption keys table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
     WHERE table_schema = DATABASE() 
       AND table_name = 'user_encryption_keys') = 0,
    'CREATE TABLE `user_encryption_keys` (
      `user_id` int(11) NOT NULL,
      `wrapped_master_key` blob NOT NULL,
      `key_derivation_salt` blob NOT NULL,
      `recovery_envelope` blob DEFAULT NULL,
      `recovery_questions_hash` blob DEFAULT NULL,
      `created_at` timestamp NULL DEFAULT current_timestamp(),
      `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`user_id`),
      KEY `idx_user_encryption_created` (`created_at`),
      CONSTRAINT `user_encryption_keys_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT ''Table user_encryption_keys already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create user security questions table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
     WHERE table_schema = DATABASE() 
       AND table_name = 'user_security_questions') = 0,
    'CREATE TABLE `user_security_questions` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `user_id` int(11) NOT NULL,
      `question_text` text NOT NULL,
      `question_hash` varchar(255) NOT NULL,
      `answer_hash` varchar(255) NOT NULL,
      `question_order` tinyint(4) NOT NULL,
      `created_at` timestamp NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      UNIQUE KEY `unique_user_question` (`user_id`,`question_order`),
      KEY `idx_user_questions` (`user_id`),
      CONSTRAINT `user_security_questions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT ''Table user_security_questions already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================================================
-- 3. ADD MISSING INDEXES (WITH CHECKS)
-- ==========================================================================

-- Add privacy-related indexes for existing tables (if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() 
       AND table_name = 'columns' 
       AND index_name = 'idx_columns_privacy') = 0,
    'ALTER TABLE `columns` ADD KEY `idx_columns_privacy` (`user_id`,`is_private`,`has_shared_tasks`)',
    'SELECT ''Index idx_columns_privacy already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() 
       AND table_name = 'tasks' 
       AND index_name = 'idx_tasks_privacy') = 0,
    'ALTER TABLE `tasks` ADD KEY `idx_tasks_privacy` (`user_id`,`is_private`,`privacy_inherited`)',
    'SELECT ''Index idx_tasks_privacy already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==========================================================================
-- 4. CREATE DATABASE VIEWS (WITHOUT DEFINER CLAUSE)
-- ==========================================================================

-- Create shared tasks by column view (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS 
     WHERE table_schema = DATABASE() 
       AND table_name = 'v_shared_tasks_by_column') = 0,
    'CREATE VIEW `v_shared_tasks_by_column` AS 
    SELECT 
      `t`.`column_id` AS `column_id`, 
      `t`.`user_id` AS `owner_id`, 
      count(`si`.`id`) AS `shared_count`, 
      group_concat(distinct `si`.`recipient_id` separator '','') AS `recipient_ids` 
    FROM (`tasks` `t` 
      LEFT JOIN `shared_items` `si` ON(((`t`.`task_id` = `si`.`item_id`) AND (`si`.`item_type` = ''task'') AND (`si`.`status` = ''active'')))) 
    WHERE (`t`.`deleted_at` IS NULL) 
    GROUP BY `t`.`column_id`, `t`.`user_id`',
    'SELECT ''View v_shared_tasks_by_column already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create user encryption status view (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS 
     WHERE table_schema = DATABASE() 
       AND table_name = 'v_user_encryption_status') = 0,
    'CREATE VIEW `v_user_encryption_status` AS 
    SELECT 
      `u`.`user_id` AS `user_id`, 
      `u`.`username` AS `username`, 
      (CASE WHEN (`uek`.`user_id` IS NOT NULL) THEN ''enabled'' ELSE ''disabled'' END) AS `encryption_status`, 
      (CASE WHEN (`uek`.`recovery_envelope` IS NOT NULL) THEN ''enabled'' ELSE ''disabled'' END) AS `recovery_status`, 
      `ems`.`migration_status` AS `migration_status`, 
      `ems`.`tasks_migrated` AS `tasks_migrated`, 
      `ems`.`total_tasks` AS `total_tasks` 
    FROM ((`users` `u` 
      LEFT JOIN `user_encryption_keys` `uek` ON((`u`.`user_id` = `uek`.`user_id`))) 
      LEFT JOIN `encryption_migration_status` `ems` ON((`u`.`user_id` = `ems`.`user_id`)))',
    'SELECT ''View v_user_encryption_status already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;

-- ==========================================================================
-- MIGRATION COMPLETE
-- ==========================================================================
