-- Privacy Inheritance Schema Update
-- Adds support for tracking which tasks had their privacy changed by column inheritance

-- Add privacy_inherited column to track tasks affected by column privacy changes
ALTER TABLE tasks ADD COLUMN privacy_inherited BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX idx_tasks_privacy_inherited ON tasks(privacy_inherited);

-- Update existing tasks to have privacy_inherited = FALSE (they weren't inherited)
UPDATE tasks SET privacy_inherited = FALSE WHERE privacy_inherited IS NULL;
