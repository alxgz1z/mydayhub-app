-- ============================================================================
-- FRESH DATABASE SCHEMA - COMPLETE RECREATION
-- ============================================================================
-- This script drops all existing tables, views, and constraints,
-- then recreates the entire database schema from scratch.
-- Use this to completely reset the database to match localhost structure.
--
-- WARNING: This will DELETE ALL DATA in the database!
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

START TRANSACTION;

-- ============================================================================
-- STEP 1: DROP ALL VIEWS
-- ============================================================================

DROP VIEW IF EXISTS `v_shared_tasks_by_column`;
DROP VIEW IF EXISTS `v_user_encryption_status`;

-- ============================================================================
-- STEP 2: DROP ALL TABLES (in reverse dependency order)
-- ============================================================================

DROP TABLE IF EXISTS `admin_actions`;
DROP TABLE IF EXISTS `calendar_events`;
DROP TABLE IF EXISTS `calendar_settings`;
DROP TABLE IF EXISTS `calendar_subscriptions`;
DROP TABLE IF EXISTS `columns`;
DROP TABLE IF EXISTS `encryption_audit_log`;
DROP TABLE IF EXISTS `encryption_migration_status`;
DROP TABLE IF EXISTS `item_encryption_keys`;
DROP TABLE IF EXISTS `journal_entries`;
DROP TABLE IF EXISTS `journal_preferences`;
DROP TABLE IF EXISTS `journal_task_links`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `pending_registrations`;
DROP TABLE IF EXISTS `shared_items`;
DROP TABLE IF EXISTS `sharing_activity`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `task_activity`;
DROP TABLE IF EXISTS `task_attachments`;
DROP TABLE IF EXISTS `task_comments`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `user_calendar_preferences`;
DROP TABLE IF EXISTS `user_encryption_keys`;
DROP TABLE IF EXISTS `user_security_questions`;
DROP TABLE IF EXISTS `user_trusts`;

-- ============================================================================
-- STEP 3: CREATE ALL TABLES
-- ============================================================================

-- Table: users (must be created first - referenced by many tables)
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `storage_used_bytes` bigint NOT NULL DEFAULT '0',
  `subscription_level` enum('free','base','pro','elite') COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `status` enum('active','suspended','deleted') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `suspended_reason` text COLLATE utf8mb4_unicode_ci,
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `suspended_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: admin_actions
CREATE TABLE `admin_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_user_id` int NOT NULL,
  `target_user_id` int NOT NULL,
  `action_type` enum('subscription_change','status_change','user_delete','data_export','notes_update') COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` text COLLATE utf8mb4_unicode_ci,
  `new_value` text COLLATE utf8mb4_unicode_ci,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_admin_actions_admin` (`admin_user_id`),
  KEY `ix_admin_actions_target` (`target_user_id`),
  KEY `ix_admin_actions_created` (`created_at`),
  CONSTRAINT `admin_actions_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `admin_actions_ibfk_2` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: calendar_events
CREATE TABLE `calendar_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `calendar_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#22c55e',
  `is_public` tinyint(1) DEFAULT '0',
  `priority` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`,`start_date`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_public` (`is_public`),
  KEY `idx_calendar_name` (`user_id`,`calendar_name`),
  KEY `idx_priority` (`user_id`,`priority`),
  CONSTRAINT `calendar_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: calendar_settings
CREATE TABLE `calendar_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `calendar_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_public` tinyint(1) DEFAULT '0',
  `is_visible` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_calendar` (`user_id`,`calendar_name`),
  KEY `idx_user` (`user_id`),
  KEY `idx_public` (`is_public`),
  CONSTRAINT `calendar_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: calendar_subscriptions
CREATE TABLE `calendar_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subscriber_id` int NOT NULL,
  `owner_id` int NOT NULL,
  `calendar_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subscription` (`subscriber_id`,`owner_id`,`calendar_name`),
  KEY `idx_subscriber` (`subscriber_id`),
  KEY `idx_owner_calendar` (`owner_id`,`calendar_name`),
  CONSTRAINT `calendar_subscriptions_ibfk_1` FOREIGN KEY (`subscriber_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `calendar_subscriptions_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: columns
CREATE TABLE `columns` (
  `column_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `column_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` int NOT NULL,
  `is_private` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `has_shared_tasks` tinyint(1) DEFAULT '0' COMMENT 'Column contains shared tasks (blocks privacy)',
  PRIMARY KEY (`column_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_columns_privacy` (`user_id`,`is_private`,`has_shared_tasks`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: encryption_audit_log
CREATE TABLE `encryption_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `operation` enum('encrypt','decrypt','key_derive','recovery_used','migration') COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` enum('task','column','journal_entry','user_key') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_operations` (`user_id`,`operation`,`created_at`),
  KEY `idx_audit_timeline` (`created_at`),
  CONSTRAINT `encryption_audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: encryption_migration_status
CREATE TABLE `encryption_migration_status` (
  `user_id` int NOT NULL,
  `migration_status` enum('pending','in_progress','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `tasks_migrated` int DEFAULT '0',
  `total_tasks` int DEFAULT '0',
  `migration_started_at` timestamp NULL DEFAULT NULL,
  `migration_completed_at` timestamp NULL DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`user_id`),
  KEY `idx_migration_status` (`migration_status`),
  CONSTRAINT `encryption_migration_status_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: item_encryption_keys
CREATE TABLE `item_encryption_keys` (
  `item_id` int NOT NULL,
  `item_type` enum('task','column','journal_entry') COLLATE utf8mb4_unicode_ci NOT NULL,
  `wrapped_dek` blob NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`,`item_type`),
  KEY `idx_user_items` (`item_type`,`item_id`),
  KEY `idx_item_keys_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: journal_entries
CREATE TABLE `journal_entries` (
  `entry_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `entry_date` date NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `encrypted_data` text COLLATE utf8mb4_unicode_ci,
  `is_private` tinyint(1) DEFAULT '0',
  `position` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `classification` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'support',
  PRIMARY KEY (`entry_id`),
  UNIQUE KEY `unique_user_date_title` (`user_id`,`entry_date`,`title`),
  KEY `idx_user_date` (`user_id`,`entry_date`),
  KEY `idx_user_private` (`user_id`,`is_private`),
  KEY `idx_entry_date` (`entry_date`),
  CONSTRAINT `journal_entries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: journal_preferences
CREATE TABLE `journal_preferences` (
  `preference_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `view_mode` enum('1-day','3-day','5-day') COLLATE utf8mb4_unicode_ci DEFAULT '3-day',
  `hide_weekends` tinyint(1) DEFAULT '0',
  `date_format` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'YEAR.MON.DD, Day',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`preference_id`),
  UNIQUE KEY `unique_user_preferences` (`user_id`),
  CONSTRAINT `journal_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: journal_task_links
CREATE TABLE `journal_task_links` (
  `link_id` int NOT NULL AUTO_INCREMENT,
  `journal_entry_id` int NOT NULL,
  `task_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`link_id`),
  UNIQUE KEY `unique_journal_task_link` (`journal_entry_id`,`task_id`),
  KEY `idx_journal_entry` (`journal_entry_id`),
  KEY `idx_task` (`task_id`),
  CONSTRAINT `journal_task_links_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`entry_id`) ON DELETE CASCADE,
  CONSTRAINT `journal_task_links_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: password_resets
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash_UNIQUE` (`token_hash`),
  KEY `user_id_fk_idx` (`user_id`),
  CONSTRAINT `password_resets_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: pending_registrations
CREATE TABLE `pending_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_email_code` (`email`,`code_hash`),
  KEY `ix_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: shared_items
CREATE TABLE `shared_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `recipient_id` int NOT NULL,
  `item_type` enum('task','column') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'task',
  `item_id` int NOT NULL,
  `permission` enum('edit','view') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'edit',
  `status` enum('active','ready_for_review','revoked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ready_for_review` tinyint(1) DEFAULT '0',
  `review_status` enum('pending','in_review','approved','needs_changes','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_share` (`owner_id`,`recipient_id`,`item_type`,`item_id`),
  KEY `ix_recipient` (`recipient_id`),
  KEY `ix_owner` (`owner_id`),
  KEY `ix_recipient_active` (`recipient_id`,`status`),
  KEY `ix_owner_item` (`owner_id`,`item_type`,`item_id`),
  KEY `idx_shared_items_detection` (`owner_id`,`recipient_id`,`item_type`,`item_id`,`status`),
  KEY `idx_review_status` (`review_status`,`item_type`,`item_id`),
  CONSTRAINT `fk_shared_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shared_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: sharing_activity
CREATE TABLE `sharing_activity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shared_item_id` int NOT NULL,
  `actor_user_id` int NOT NULL,
  `action` enum('created','accepted','revoked','updated','marked_ready') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_shared_item` (`shared_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: tasks
CREATE TABLE `tasks` (
  `task_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `column_id` int NOT NULL,
  `encrypted_data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` int NOT NULL,
  `classification` enum('signal','support','backlog','completed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `due_date` date DEFAULT NULL,
  `is_private` tinyint(1) NOT NULL DEFAULT '0',
  `delegated_to` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `snoozed_until` datetime DEFAULT NULL,
  `snoozed_at` datetime DEFAULT NULL,
  `privacy_inherited` tinyint(1) DEFAULT '0' COMMENT 'Task privacy inherited from column',
  `privacy_override` tinyint(1) DEFAULT '0' COMMENT 'User explicitly set task privacy',
  `journal_entry_id` int DEFAULT NULL,
  PRIMARY KEY (`task_id`),
  KEY `user_id` (`user_id`),
  KEY `column_id` (`column_id`),
  KEY `idx_tasks_privacy` (`user_id`,`is_private`,`privacy_inherited`),
  KEY `idx_journal_entry_id` (`journal_entry_id`),
  CONSTRAINT `fk_task_journal_entry` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`entry_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: task_activity
CREATE TABLE `task_activity` (
  `activity_id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `activity_type` enum('note_edit','comment_add','comment_edit','comment_delete','status_change','attachment_add','attachment_delete','ready_for_review','reviewed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`activity_id`),
  KEY `idx_task_activity` (`task_id`,`created_at`),
  KEY `idx_user_activity` (`user_id`,`created_at`),
  KEY `idx_activity_type` (`activity_type`,`created_at`),
  CONSTRAINT `task_activity_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  CONSTRAINT `task_activity_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: task_attachments
CREATE TABLE `task_attachments` (
  `attachment_id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `filename_on_server` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filesize_bytes` int NOT NULL,
  `mime_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attachment_id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: task_comments
CREATE TABLE `task_comments` (
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `idx_task_comments` (`task_id`,`deleted_at`),
  KEY `idx_user_comments` (`user_id`,`created_at`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `task_comments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  CONSTRAINT `task_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_calendar_preferences
CREATE TABLE `user_calendar_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `calendar_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_visible` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_calendar` (`user_id`,`calendar_type`),
  CONSTRAINT `user_calendar_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_encryption_keys
CREATE TABLE `user_encryption_keys` (
  `user_id` int NOT NULL,
  `wrapped_master_key` blob NOT NULL,
  `key_derivation_salt` blob NOT NULL,
  `recovery_envelope` blob,
  `recovery_questions_hash` blob,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `idx_user_encryption_created` (`created_at`),
  CONSTRAINT `user_encryption_keys_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_security_questions
CREATE TABLE `user_security_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_order` tinyint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_question` (`user_id`,`question_order`),
  KEY `idx_user_questions` (`user_id`),
  CONSTRAINT `user_security_questions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_trusts
CREATE TABLE `user_trusts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_user_id` int NOT NULL,
  `trusted_user_id` int NOT NULL,
  `status` enum('pending','accepted','revoked','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `invite_code` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_trust` (`owner_user_id`,`trusted_user_id`),
  KEY `ix_trusted_user` (`trusted_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 4: CREATE VIEWS
-- ============================================================================

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_shared_tasks_by_column` AS 
SELECT 
  `t`.`column_id` AS `column_id`, 
  `t`.`user_id` AS `owner_id`, 
  count(`si`.`id`) AS `shared_count`, 
  group_concat(distinct `si`.`recipient_id` separator ',') AS `recipient_ids` 
FROM (`tasks` `t` 
  LEFT JOIN `shared_items` `si` ON (
    (`t`.`task_id` = `si`.`item_id`) 
    AND (`si`.`item_type` = 'task') 
    AND (`si`.`status` = 'active')
  )
) 
WHERE (`t`.`deleted_at` IS NULL) 
GROUP BY `t`.`column_id`, `t`.`user_id`;

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_user_encryption_status` AS 
SELECT 
  `u`.`user_id` AS `user_id`, 
  `u`.`username` AS `username`, 
  (CASE WHEN (`uek`.`user_id` IS NOT NULL) THEN 'enabled' ELSE 'disabled' END) AS `encryption_status`, 
  (CASE WHEN (`uek`.`recovery_envelope` IS NOT NULL) THEN 'enabled' ELSE 'disabled' END) AS `recovery_status`, 
  `ems`.`migration_status` AS `migration_status`, 
  `ems`.`tasks_migrated` AS `tasks_migrated`, 
  `ems`.`total_tasks` AS `total_tasks` 
FROM ((`users` `u` 
  LEFT JOIN `user_encryption_keys` `uek` ON (`u`.`user_id` = `uek`.`user_id`)) 
  LEFT JOIN `encryption_migration_status` `ems` ON (`u`.`user_id` = `ems`.`user_id`));

-- ============================================================================
-- COMPLETE
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

