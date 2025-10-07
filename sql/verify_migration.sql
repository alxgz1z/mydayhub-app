-- Verification SQL to check if migration was successful
-- Run this after applying the migration to ensure everything is correct
-- Date: January 7, 2025

-- ==========================================================================
-- MIGRATION VERIFICATION QUERIES
-- ==========================================================================

-- Check if all new tables exist
SELECT 'Tables Check' as verification_type, 
       COUNT(*) as found_count,
       CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name IN (
    'encryption_audit_log',
    'encryption_migration_status', 
    'item_encryption_keys',
    'user_encryption_keys',
    'user_security_questions'
  );

-- Check if all new columns exist
SELECT 'Columns Check' as verification_type,
       COUNT(*) as found_count,
       CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND (
    (table_name = 'tasks' AND column_name IN ('privacy_inherited', 'privacy_override'))
    OR (table_name = 'columns' AND column_name = 'has_shared_tasks')
  );

-- Check if all views exist
SELECT 'Views Check' as verification_type,
       COUNT(*) as found_count,
       CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.views 
WHERE table_schema = DATABASE() 
  AND table_name IN (
    'v_shared_tasks_by_column',
    'v_user_encryption_status'
  );

-- Check if foreign key constraints exist
SELECT 'Foreign Keys Check' as verification_type,
       COUNT(*) as found_count,
       CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = DATABASE() 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'encryption_audit_log',
    'encryption_migration_status',
    'user_encryption_keys',
    'user_security_questions'
  );

-- Check if indexes exist
SELECT 'Indexes Check' as verification_type,
       COUNT(*) as found_count,
       CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
  AND (
    (table_name = 'encryption_audit_log' AND index_name != 'PRIMARY')
    OR (table_name = 'encryption_migration_status' AND index_name != 'PRIMARY')
    OR (table_name = 'item_encryption_keys' AND index_name != 'PRIMARY')
    OR (table_name = 'user_encryption_keys' AND index_name != 'PRIMARY')
    OR (table_name = 'user_security_questions' AND index_name != 'PRIMARY')
    OR (table_name = 'tasks' AND index_name = 'idx_tasks_privacy')
    OR (table_name = 'columns' AND index_name = 'idx_columns_privacy')
  );

-- ==========================================================================
-- DETAILED VERIFICATION (Optional - run these individually if needed)
-- ==========================================================================

-- Show all tables (should include the 5 new encryption tables)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name;

-- Show all columns in tasks table (should include privacy_inherited and privacy_override)
-- SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tasks' ORDER BY ordinal_position;

-- Show all columns in columns table (should include has_shared_tasks)
-- SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'columns' ORDER BY ordinal_position;

-- Show all views (should include the 2 new views)
-- SELECT table_name FROM information_schema.views WHERE table_schema = DATABASE() ORDER BY table_name;

-- ==========================================================================
-- VERIFICATION COMPLETE
-- ==========================================================================
