-- Add preferences column to users table for storing user preferences as JSON
-- This migration adds support for accent color and other user preferences

-- Check if column exists, if not add it
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferences TEXT DEFAULT '{}' COMMENT 'User preferences stored as JSON';

-- For MySQL versions that don't support IF NOT EXISTS, use this alternative:
-- SET @dbname = DATABASE();
-- SET @tablename = 'users';
-- SET @columnname = 'preferences';
-- SET @preparedStatement = (SELECT IF(
--   (
--     SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
--     WHERE
--       (table_name = @tablename)
--       AND (table_schema = @dbname)
--       AND (column_name = @columnname)
--   ) > 0,
--   "SELECT 1",
--   CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TEXT DEFAULT '{}' COMMENT 'User preferences stored as JSON';")
-- ));
-- PREPARE alterIfNotExists FROM @preparedStatement;
-- EXECUTE alterIfNotExists;
-- DEALLOCATE PREPARE alterIfNotExists;

-- Verify the column was added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'preferences';

