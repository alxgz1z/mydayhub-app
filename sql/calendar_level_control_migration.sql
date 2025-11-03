-- Calendar-Level Control Migration
-- Version: 8.5 Avellanas
-- Created: 2025-10-31
-- Adds calendar-level public/private and visibility controls

-- Calendar Settings Table
-- Stores calendar-level settings like public/private status and visibility
CREATE TABLE IF NOT EXISTS calendar_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    calendar_name VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,    -- Calendar-level public/private
    is_visible BOOLEAN DEFAULT TRUE,    -- Owner visibility (hide from own view)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_calendar (user_id, calendar_name),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_public (is_public)
);

-- Initialize calendar_settings from existing calendar_events
-- A calendar is public if ALL its events are public
INSERT INTO calendar_settings (user_id, calendar_name, is_public, is_visible)
SELECT 
    user_id,
    calendar_name,
    CASE 
        WHEN COUNT(*) = SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
        THEN 1 
        ELSE 0 
    END as is_public,
    1 as is_visible
FROM calendar_events
GROUP BY user_id, calendar_name
ON DUPLICATE KEY UPDATE 
    is_public = VALUES(is_public),
    updated_at = CURRENT_TIMESTAMP;

