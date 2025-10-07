-- Diagnostic SQL to check current database status
-- Run this to see what columns/tables already exist before migration
-- Date: January 7, 2025

-- ==========================================================================
-- DATABASE STATUS CHECK
-- ==========================================================================

-- Check which encryption tables already exist
SELECT 'Encryption Tables Status' as check_type, 
       table_name as table_name,
       'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name IN (
    'encryption_audit_log',
    'encryption_migration_status', 
    'item_encryption_keys',
    'user_encryption_keys',
    'user_security_questions'
  )

UNION ALL

SELECT 'Encryption Tables Status' as check_type,
       table_name as table_name,
       'MISSING' as status
FROM (
  SELECT 'encryption_audit_log' as table_name
  UNION SELECT 'encryption_migration_status'
  UNION SELECT 'item_encryption_keys'
  UNION SELECT 'user_encryption_keys'
  UNION SELECT 'user_security_questions'
) as all_tables
WHERE table_name NOT IN (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = DATABASE()
)

ORDER BY table_name;

-- Check which privacy columns already exist in tasks table
SELECT 'Tasks Table Columns' as check_type,
       column_name as column_name,
       data_type as data_type,
       column_default as default_value,
       'EXISTS' as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'tasks' 
  AND column_name IN ('privacy_inherited', 'privacy_override')

UNION ALL

SELECT 'Tasks Table Columns' as check_type,
       column_name as column_name,
       NULL as data_type,
       NULL as default_value,
       'MISSING' as status
FROM (
  SELECT 'privacy_inherited' as column_name
  UNION SELECT 'privacy_override'
) as all_columns
WHERE column_name NOT IN (
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_schema = DATABASE() 
    AND table_name = 'tasks'
)

ORDER BY column_name;

-- Check which privacy columns already exist in columns table
SELECT 'Columns Table Columns' as check_type,
       column_name as column_name,
       data_type as data_type,
       column_default as default_value,
       'EXISTS' as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'columns' 
  AND column_name = 'has_shared_tasks'

UNION ALL

SELECT 'Columns Table Columns' as check_type,
       'has_shared_tasks' as column_name,
       NULL as data_type,
       NULL as default_value,
       'MISSING' as status
WHERE 'has_shared_tasks' NOT IN (
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_schema = DATABASE() 
    AND table_name = 'columns'
);

-- Check which views already exist
SELECT 'Views Status' as check_type,
       table_name as view_name,
       'EXISTS' as status
FROM information_schema.views 
WHERE table_schema = DATABASE() 
  AND table_name IN (
    'v_shared_tasks_by_column',
    'v_user_encryption_status'
  )

UNION ALL

SELECT 'Views Status' as check_type,
       view_name as view_name,
       'MISSING' as status
FROM (
  SELECT 'v_shared_tasks_by_column' as view_name
  UNION SELECT 'v_user_encryption_status'
) as all_views
WHERE view_name NOT IN (
  SELECT table_name 
  FROM information_schema.views 
  WHERE table_schema = DATABASE()
)

ORDER BY view_name;

-- Check which privacy-related indexes exist
SELECT 'Privacy Indexes' as check_type,
       table_name,
       index_name,
       column_name,
       'EXISTS' as status
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
  AND (
    (table_name = 'tasks' AND index_name = 'idx_tasks_privacy')
    OR (table_name = 'columns' AND index_name = 'idx_columns_privacy')
  )

ORDER BY table_name, index_name;

-- Summary of what needs to be migrated
SELECT 
  'MIGRATION SUMMARY' as summary_type,
  CONCAT(
    'Tables to create: ',
    (5 - (SELECT COUNT(*) FROM information_schema.tables 
           WHERE table_schema = DATABASE() 
             AND table_name IN (
               'encryption_audit_log',
               'encryption_migration_status', 
               'item_encryption_keys',
               'user_encryption_keys',
               'user_security_questions'
             ))),
    ' | Columns to add: ',
    ((SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
        AND table_name = 'tasks' 
        AND column_name IN ('privacy_inherited', 'privacy_override')) +
     (SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
        AND table_name = 'columns' 
        AND column_name = 'has_shared_tasks') - 3),
    ' | Views to create: ',
    (2 - (SELECT COUNT(*) FROM information_schema.views 
           WHERE table_schema = DATABASE() 
             AND table_name IN (
               'v_shared_tasks_by_column',
               'v_user_encryption_status'
             )))
  ) as migration_needed;
