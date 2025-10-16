-- Add journal_entry to item_encryption_keys enum
-- MyDayHub - Add journal_entry support to encryption system
-- @version 8.1 Tamarindo
-- @author Claude & Cursor

-- ==========================================================================
-- 1. UPDATE ITEM_ENCRYPTION_KEYS TABLE
-- ==========================================================================

-- Modify the item_type enum to include journal_entry
ALTER TABLE `item_encryption_keys` 
MODIFY COLUMN `item_type` ENUM('task','column','journal_entry') NOT NULL;

-- ==========================================================================
-- 2. UPDATE ENCRYPTION_AUDIT_LOG TABLE (if it exists)
-- ==========================================================================

-- Check if encryption_audit_log table exists and update it
ALTER TABLE `encryption_audit_log` 
MODIFY COLUMN `item_type` ENUM('task','column','journal_entry','user_key') DEFAULT NULL;

-- ==========================================================================
-- 3. VERIFICATION
-- ==========================================================================

-- Verify the changes
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('item_encryption_keys', 'encryption_audit_log')
  AND COLUMN_NAME = 'item_type';

