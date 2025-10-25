-- Migration: Add show_only_with_notes preference to journal_preferences table
-- Version: 8.5 Avellanas
-- Date: 2025-10-25

ALTER TABLE journal_preferences 
ADD COLUMN show_only_with_notes BOOLEAN DEFAULT FALSE AFTER hide_weekends;

-- Update existing records to ensure the column is populated
UPDATE journal_preferences SET show_only_with_notes = FALSE WHERE show_only_with_notes IS NULL;
