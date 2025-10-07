-- Rollback SQL to revert breveasy.com database to previous schema
-- Use this ONLY if the migration needs to be reverted
-- Date: January 7, 2025

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ==========================================================================
-- ROLLBACK MIGRATION (USE WITH CAUTION)
-- ==========================================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS `v_user_encryption_status`;
DROP VIEW IF EXISTS `v_shared_tasks_by_column`;

-- Drop zero-knowledge encryption tables
DROP TABLE IF EXISTS `user_security_questions`;
DROP TABLE IF EXISTS `user_encryption_keys`;
DROP TABLE IF EXISTS `item_encryption_keys`;
DROP TABLE IF EXISTS `encryption_migration_status`;
DROP TABLE IF EXISTS `encryption_audit_log`;

-- Remove added columns from existing tables
ALTER TABLE `tasks` 
DROP COLUMN IF EXISTS `privacy_override`,
DROP COLUMN IF EXISTS `privacy_inherited`;

ALTER TABLE `columns` 
DROP COLUMN IF EXISTS `has_shared_tasks`;

-- Remove added indexes (they will be automatically removed with columns)
-- Note: Some indexes may need manual removal if they were added separately

COMMIT;

-- ==========================================================================
-- ROLLBACK COMPLETE
-- ==========================================================================
