-- ==========================================================================
-- ADD CLASSIFICATION COLUMN TO JOURNAL ENTRIES
-- ==========================================================================
-- This script adds the classification column to the existing journal_entries table

-- Add classification column with default value
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS classification VARCHAR(20) DEFAULT 'support';

-- Update existing entries to have 'support' classification (they already have the default)
-- This is just to be explicit about the migration
UPDATE journal_entries 
SET classification = 'support' 
WHERE classification IS NULL OR classification = '';

-- Verify the column was added successfully
DESCRIBE journal_entries;

-- Show sample of updated data
SELECT entry_id, title, classification, is_private 
FROM journal_entries 
ORDER BY entry_date DESC, position ASC 
LIMIT 5;
