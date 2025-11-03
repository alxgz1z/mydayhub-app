-- Calendar Subscriptions Migration
-- Version: 8.5 Avellanas
-- Created: 2025-10-31
-- Adds support for public calendars and user subscriptions

-- Calendar Subscriptions Table
-- Tracks which users have subscribed to which public calendars
CREATE TABLE IF NOT EXISTS calendar_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscriber_id INT NOT NULL,
    owner_id INT NOT NULL,
    calendar_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_subscription (subscriber_id, owner_id, calendar_name),
    FOREIGN KEY (subscriber_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_subscriber (subscriber_id),
    INDEX idx_owner_calendar (owner_id, calendar_name)
);

-- Determine calendar public status based on events
-- A calendar is considered public if ALL events in that calendar_name have is_public = 1
-- This will be checked dynamically in queries, but we'll add a helper view

CREATE OR REPLACE VIEW calendar_public_status AS
SELECT 
    user_id,
    calendar_name,
    CASE 
        WHEN COUNT(*) = SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
        THEN 1 
        ELSE 0 
    END as is_public,
    COUNT(*) as event_count,
    MIN(start_date) as first_event,
    MAX(end_date) as last_event
FROM calendar_events
GROUP BY user_id, calendar_name;

