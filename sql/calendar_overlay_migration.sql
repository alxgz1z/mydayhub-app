-- Calendar Overlay System - Migration Script
-- Version: 7.5 Mission Focus
-- Created: 2025-01-05
-- For Hostinger Mirror Site - Add missing fields to existing tables

-- Add calendar_name column to calendar_events if it doesn't exist
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS calendar_name VARCHAR(100) DEFAULT 'Custom Event' 
AFTER event_type;

-- Add priority column to calendar_events if it doesn't exist
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0 
AFTER is_public;

-- Add indexes for new columns if they don't exist
-- Note: MySQL doesn't support IF NOT EXISTS for indexes, so these may show warnings if they exist
ALTER TABLE calendar_events 
ADD INDEX IF NOT EXISTS idx_calendar_name (calendar_name);

ALTER TABLE calendar_events 
ADD INDEX IF NOT EXISTS idx_priority (priority);

-- Update existing events to have default calendar_name if NULL
UPDATE calendar_events 
SET calendar_name = 'Custom Event' 
WHERE calendar_name IS NULL;

-- Update existing events to have default priority if NULL
UPDATE calendar_events 
SET priority = 0 
WHERE priority IS NULL;

-- Verify the migration
DESCRIBE calendar_events;
