-- Calendar Overlay System - Complete Database Schema
-- Version: 7.5 Mission Focus
-- Created: 2025-01-05
-- For Hostinger Mirror Site Deployment

-- Calendar Events Table (Complete with all features)
CREATE TABLE IF NOT EXISTS calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'fiscal', 'holiday', 'birthday', 'custom'
    calendar_name VARCHAR(100) DEFAULT 'Custom Event', -- Grouping for bulk management
    label VARCHAR(100) NOT NULL,     -- 'Q1-M2-Wk7', 'Christmas Day', etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    color VARCHAR(7) DEFAULT '#22c55e', -- Hex color for display
    is_public BOOLEAN DEFAULT FALSE,    -- Whether other users can see this event
    priority INT DEFAULT 0,             -- Priority for header badge display
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, start_date),
    INDEX idx_event_type (event_type),
    INDEX idx_public (is_public),
    INDEX idx_calendar_name (calendar_name),
    INDEX idx_priority (priority)
);

-- User Calendar Preferences Table
CREATE TABLE IF NOT EXISTS user_calendar_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    calendar_type VARCHAR(50) NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_calendar (user_id, calendar_type),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert default calendar preferences for existing users
INSERT IGNORE INTO user_calendar_preferences (user_id, calendar_type, is_visible)
SELECT user_id, 'fiscal', TRUE FROM users;

INSERT IGNORE INTO user_calendar_preferences (user_id, calendar_type, is_visible)
SELECT user_id, 'holiday', TRUE FROM users;

INSERT IGNORE INTO user_calendar_preferences (user_id, calendar_type, is_visible)
SELECT user_id, 'birthday', TRUE FROM users;

INSERT IGNORE INTO user_calendar_preferences (user_id, calendar_type, is_visible)
SELECT user_id, 'custom', TRUE FROM users;

-- Verify tables were created successfully
SHOW TABLES LIKE '%calendar%';

-- Show table structure for verification
DESCRIBE calendar_events;
DESCRIBE user_calendar_preferences;
