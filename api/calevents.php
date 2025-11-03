<?php
/**
 * Calendar Events API Handler
 *
 * MyDayHub - Calendar Events Management
 *
 * @version 8.5 Avellanas
 * @author Alex & Gemini & Claude & Cursor
 */

/**
 * Handle calendar events actions
 */
function handle_calendar_events_action($action, $method, $pdo, $user_id, $data) {
    try {
        switch ($action) {
            case 'getEvents':
                handleGetEvents($user_id, $data);
                break;
            case 'createEvent':
                handleCreateEvent($user_id, $data);
                break;
            case 'updateEvent':
                handleUpdateEvent($user_id, $data);
                break;
            case 'deleteEvent':
                handleDeleteEvent($user_id, $data);
                break;
            case 'bulk_import':
                handleBulkImport($user_id, $data);
                break;
            case 'getCalendars':
                handleGetCalendars($user_id);
                break;
            case 'deleteCalendar':
                handleDeleteCalendar($user_id, $data);
                break;
            case 'setCalendarPriority':
                handleSetCalendarPriority($user_id, $data);
                break;
            case 'listPublicCalendars':
                handleListPublicCalendars($user_id, $data);
                break;
            case 'subscribeToCalendar':
                handleSubscribeToCalendar($user_id, $data);
                break;
            case 'unsubscribeFromCalendar':
                handleUnsubscribeFromCalendar($user_id, $data);
                break;
            case 'setCalendarPublic':
                handleSetCalendarPublic($user_id, $data);
                break;
            case 'setCalendarVisible':
                handleSetCalendarVisible($user_id, $data);
                break;
            case 'exportCalendar':
                handleExportCalendar($user_id, $data);
                break;
            default:
                send_json_response(['success' => false, 'error' => 'Action not found'], 404);
                break;
        }
    } catch (Exception $e) {
        log_debug_message('Calendar Events API Error: ' . $e->getMessage());
        send_json_response(['success' => false, 'error' => 'Internal server error'], 500);
    }
}

/**
 * Handle GET events request
 * Includes user's own events (respecting visibility) and events from subscribed public calendars
 */
function handleGetEvents($user_id, $data) {
    global $pdo;
    
    $start_date = $data['start_date'] ?? null;
    $end_date = $data['end_date'] ?? null;
    
    // Check if calendar_subscriptions and calendar_settings tables exist
    $subs_table_check = false;
    $settings_table_check = false;
    try {
        $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_subscriptions'");
        $subs_table_check = $check_stmt->rowCount() > 0;
        $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_settings'");
        $settings_table_check = $check_stmt->rowCount() > 0;
    } catch (Exception $e) {
        // Tables don't exist
    }
    
    // Build query to get user's own events and subscribed calendar events
    if ($subs_table_check) {
        // Full query with subscriptions
        $sql = "(
            SELECT ce.*, ce.user_id as owner_id, u.username as owner_username, 0 as is_subscribed
            FROM calendar_events ce
            JOIN users u ON u.user_id = ce.user_id
            WHERE ce.user_id = ?";
        
        // If calendar_settings table exists, filter by visibility for owner's own calendars
        if ($settings_table_check) {
            $sql .= " AND (
                NOT EXISTS (
                    SELECT 1 FROM calendar_settings cs 
                    WHERE cs.user_id = ce.user_id 
                    AND cs.calendar_name = ce.calendar_name 
                    AND cs.is_visible = 0
                )
            )";
        }
        
        $params = [$user_id];
        
        if ($start_date && $end_date) {
            $sql .= " AND ce.start_date <= ? AND ce.end_date >= ?";
            $params[] = $end_date;
            $params[] = $start_date;
        }
        
        $sql .= ") UNION (
            SELECT ce.*, ce.user_id as owner_id, u.username as owner_username, 1 as is_subscribed
            FROM calendar_events ce
            JOIN calendar_subscriptions cs ON cs.owner_id = ce.user_id AND cs.calendar_name = ce.calendar_name
            JOIN users u ON u.user_id = ce.user_id
            WHERE cs.subscriber_id = ? 
            AND ce.is_public = 1";
        
        $params[] = $user_id;
        
        if ($start_date && $end_date) {
            $sql .= " AND ce.start_date <= ? AND ce.end_date >= ?";
            $params[] = $end_date;
            $params[] = $start_date;
        }
        
        $sql .= ") ORDER BY priority DESC, start_date ASC";
    } else {
        // Fallback: only user's own events
        $sql = "SELECT ce.*, ce.user_id as owner_id, u.username as owner_username, 0 as is_subscribed
                FROM calendar_events ce
                JOIN users u ON u.user_id = ce.user_id
                WHERE ce.user_id = ?";
        
        // If calendar_settings table exists, filter by visibility
        if ($settings_table_check) {
            $sql .= " AND (
                NOT EXISTS (
                    SELECT 1 FROM calendar_settings cs 
                    WHERE cs.user_id = ce.user_id 
                    AND cs.calendar_name = ce.calendar_name 
                    AND cs.is_visible = 0
                )
            )";
        }
        
        $params = [$user_id];
        
        if ($start_date && $end_date) {
            $sql .= " AND ce.start_date <= ? AND ce.end_date >= ?";
            $params[] = $end_date;
            $params[] = $start_date;
        }
        
        $sql .= " ORDER BY priority DESC, start_date ASC";
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    send_json_response(['success' => true, 'data' => $events]);
}

/**
 * Handle CREATE event request
 */
function handleCreateEvent($user_id, $data) {
    global $pdo;
    
    // Validate required fields
    if (!isset($data['event_type']) || !isset($data['label']) || !isset($data['start_date']) || !isset($data['end_date'])) {
        send_json_response(['success' => false, 'error' => 'Missing required fields'], 400);
        return;
    }
    
    // Validate event type
    $valid_types = ['fiscal', 'holiday', 'birthday', 'custom'];
    if (!in_array($data['event_type'], $valid_types)) {
        send_json_response(['success' => false, 'error' => 'Invalid event type'], 400);
        return;
    }
    
    // Validate dates
    if (!validateDate($data['start_date']) || !validateDate($data['end_date'])) {
        send_json_response(['success' => false, 'error' => 'Invalid date format'], 400);
        return;
    }
    
    if ($data['start_date'] > $data['end_date']) {
        send_json_response(['success' => false, 'error' => 'Start date cannot be after end date'], 400);
        return;
    }
    
    $sql = "INSERT INTO calendar_events (user_id, event_type, calendar_name, label, start_date, end_date, color, is_public)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    $calendar_name = $data['calendar_name'] ?? 'Custom Event';
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        $user_id,
        $data['event_type'],
        $calendar_name,
        trim($data['label']),
        $data['start_date'],
        $data['end_date'],
        $data['color'] ?? '#22c55e',
        $data['is_public'] ?? false ? 1 : 0
    ]);
    
    if ($result) {
        $event_id = $pdo->lastInsertId();
        
        // Initialize calendar settings if table exists
        $settings_table_check = false;
        try {
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_settings'");
            $settings_table_check = $check_stmt->rowCount() > 0;
        } catch (Exception $e) {
            $settings_table_check = false;
        }
        
        if ($settings_table_check) {
            // Initialize calendar settings (default: private, visible)
            $settings_sql = "INSERT INTO calendar_settings (user_id, calendar_name, is_public, is_visible)
                             VALUES (?, ?, 0, 1)
                             ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP";
            $settings_stmt = $pdo->prepare($settings_sql);
            $settings_stmt->execute([$user_id, $calendar_name]);
        }
        
        send_json_response(['success' => true, 'data' => ['id' => $event_id]]);
    } else {
        send_json_response(['success' => false, 'error' => 'Failed to create event'], 500);
    }
}

/**
 * Handle UPDATE event request
 */
function handleUpdateEvent($user_id, $data) {
    global $pdo;
    
    if (!isset($data['id'])) {
        send_json_response(['success' => false, 'error' => 'Event ID required'], 400);
        return;
    }
    
    // Check if event belongs to user
    $check_sql = "SELECT id FROM calendar_events WHERE id = ? AND user_id = ?";
    $check_stmt = $pdo->prepare($check_sql);
    $check_stmt->execute([$data['id'], $user_id]);
    
    if (!$check_stmt->fetch()) {
        send_json_response(['success' => false, 'error' => 'Event not found'], 404);
        return;
    }
    
    // Build update query dynamically
    $update_fields = [];
    $params = [];
    
    if (isset($data['event_type'])) {
        $valid_types = ['fiscal', 'holiday', 'birthday', 'custom'];
        if (!in_array($data['event_type'], $valid_types)) {
            send_json_response(['success' => false, 'error' => 'Invalid event type'], 400);
            return;
        }
        $update_fields[] = "event_type = ?";
        $params[] = $data['event_type'];
    }
    
    if (isset($data['label'])) {
        $update_fields[] = "label = ?";
        $params[] = trim($data['label']);
    }
    
    if (isset($data['start_date'])) {
        if (!validateDate($data['start_date'])) {
            send_json_response(['success' => false, 'error' => 'Invalid start date format'], 400);
            return;
        }
        $update_fields[] = "start_date = ?";
        $params[] = $data['start_date'];
    }
    
    if (isset($data['end_date'])) {
        if (!validateDate($data['end_date'])) {
            send_json_response(['success' => false, 'error' => 'Invalid end date format'], 400);
            return;
        }
        $update_fields[] = "end_date = ?";
        $params[] = $data['end_date'];
    }
    
    if (isset($data['color'])) {
        $update_fields[] = "color = ?";
        $params[] = $data['color'];
    }
    
    if (isset($data['is_public'])) {
        $update_fields[] = "is_public = ?";
        $params[] = $data['is_public'] ? 1 : 0;
    }
    
    if (empty($update_fields)) {
        send_json_response(['success' => false, 'error' => 'No fields to update'], 400);
        return;
    }
    
    // Validate date range if both dates are being updated
    if (isset($data['start_date']) && isset($data['end_date'])) {
        if ($data['start_date'] > $data['end_date']) {
            send_json_response(['success' => false, 'error' => 'Start date cannot be after end date'], 400);
            return;
        }
    }
    
    $sql = "UPDATE calendar_events SET " . implode(', ', $update_fields) . " WHERE id = ? AND user_id = ?";
    $params[] = $data['id'];
    $params[] = $user_id;
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute($params);
    
    if ($result) {
        send_json_response(['success' => true]);
    } else {
        send_json_response(['success' => false, 'error' => 'Failed to update event'], 500);
    }
}

/**
 * Handle DELETE event request
 */
function handleDeleteEvent($user_id, $data) {
    global $pdo;
    
    if (!isset($data['id'])) {
        send_json_response(['success' => false, 'error' => 'Event ID required'], 400);
        return;
    }
    
    $sql = "DELETE FROM calendar_events WHERE id = ? AND user_id = ?";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$data['id'], $user_id]);
    
    if ($result && $stmt->rowCount() > 0) {
        send_json_response(['success' => true]);
    } else {
        send_json_response(['success' => false, 'error' => 'Event not found or already deleted'], 404);
    }
}

/**
 * Handle bulk import of calendar events
 */
function handleBulkImport($user_id, $data) {
    global $pdo;
    
    // Validate required fields
    if (!isset($data['events']) || !is_array($data['events'])) {
        send_json_response(['success' => false, 'error' => 'Events array required'], 400);
        return;
    }
    
    if (!isset($data['event_type'])) {
        send_json_response(['success' => false, 'error' => 'Event type required'], 400);
        return;
    }
    
    $event_type = $data['event_type'];
    $color = $data['color'] ?? '#22c55e';
    $calendar_name = $data['calendar_name'] ?? 'Imported Calendar';
    $replace_existing = isset($data['replace_existing']) ? (bool)$data['replace_existing'] : false;
    
    // Validate calendar name
    if (empty(trim($calendar_name))) {
        send_json_response(['success' => false, 'error' => 'Calendar name is required'], 400);
        return;
    }
    
    // Validate event type
    $valid_types = ['fiscal', 'holiday', 'birthday', 'custom'];
    if (!in_array($event_type, $valid_types)) {
        send_json_response(['success' => false, 'error' => 'Invalid event type'], 400);
        return;
    }
    
    // Validate color format
    if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
        $color = '#22c55e';
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        $imported_count = 0;
        $errors = [];
        
        // If replace_existing is true, delete existing events from the same calendar
        if ($replace_existing) {
            $delete_sql = "DELETE FROM calendar_events WHERE user_id = ? AND calendar_name = ?";
            $delete_stmt = $pdo->prepare($delete_sql);
            $delete_stmt->execute([$user_id, $calendar_name]);
        }
        
        // Get the highest priority for this user to set this calendar as highest priority
        $priority_sql = "SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM calendar_events WHERE user_id = ?";
        $priority_stmt = $pdo->prepare($priority_sql);
        $priority_stmt->execute([$user_id]);
        $next_priority = $priority_stmt->fetchColumn();
        
        // Import each event
        foreach ($data['events'] as $index => $event) {
            // Validate event data - only require startDate, endDate, and label
            // The 'name' field (if present) is ignored - calendar_name comes from the import form
            if (!isset($event['startDate']) || !isset($event['endDate']) || !isset($event['label'])) {
                $errors[] = "Event at index $index missing required fields (startDate, endDate, label)";
                continue;
            }
            
            $start_date = $event['startDate'];
            $end_date = $event['endDate'];
            $label = trim($event['label']);
            
            // Validate dates
            if (!validateDate($start_date) || !validateDate($end_date)) {
                $errors[] = "Event at index $index has invalid date format";
                continue;
            }
            
            if ($start_date > $end_date) {
                $errors[] = "Event at index $index has start date after end date";
                continue;
            }
            
            // Insert event
            $sql = "INSERT INTO calendar_events (user_id, event_type, calendar_name, label, start_date, end_date, color, is_public, priority)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)";
            
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute([$user_id, $event_type, $calendar_name, $label, $start_date, $end_date, $color, $next_priority]);
            
            if ($result) {
                $imported_count++;
            } else {
                $errors[] = "Failed to import event at index $index";
            }
        }
        
        $pdo->commit();
        
        // Initialize calendar settings if table exists
        $settings_table_check = false;
        try {
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_settings'");
            $settings_table_check = $check_stmt->rowCount() > 0;
        } catch (Exception $e) {
            $settings_table_check = false;
        }
        
        if ($settings_table_check && $imported_count > 0) {
            // Initialize calendar settings for imported calendar (default: private, visible)
            $settings_sql = "INSERT INTO calendar_settings (user_id, calendar_name, is_public, is_visible)
                             VALUES (?, ?, 0, 1)
                             ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP";
            $settings_stmt = $pdo->prepare($settings_sql);
            $settings_stmt->execute([$user_id, $calendar_name]);
        }
        
        $response = [
            'success' => true,
            'data' => [
                'imported_count' => $imported_count,
                'total_events' => count($data['events']),
                'errors' => $errors
            ]
        ];
        
        send_json_response($response);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        send_json_response(['success' => false, 'error' => 'Import failed: ' . $e->getMessage()], 500);
    }
}

/**
 * Get all calendars for a user with event counts and priority info
 * Includes user's own calendars (respecting visibility) and subscribed calendars
 */
function handleGetCalendars($user_id) {
    global $pdo;
    
    try {
        // Check if calendar_subscriptions and calendar_settings tables exist
        $subs_table_check = false;
        $settings_table_check = false;
        try {
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_subscriptions'");
            $subs_table_check = $check_stmt->rowCount() > 0;
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_settings'");
            $settings_table_check = $check_stmt->rowCount() > 0;
        } catch (Exception $e) {
            // Tables don't exist
        }
        
        // Get user's own calendars
        $sql = "SELECT 
                    ce.calendar_name,
                    COUNT(*) as total_events,
                    MIN(ce.start_date) as first_event,
                    MAX(ce.end_date) as last_event,
                    MAX(ce.priority) as priority,
                    MAX(ce.event_type) as event_type,
                    MAX(ce.color) as color";
        
        if ($settings_table_check) {
            $sql .= ", COALESCE(cs.is_public, 
                CASE 
                    WHEN COUNT(*) = SUM(CASE WHEN ce.is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
                    THEN 1 ELSE 0 END
                ) as is_public,
                COALESCE(cs.is_visible, 1) as is_visible";
        } else {
            $sql .= ", CASE 
                WHEN COUNT(*) = SUM(CASE WHEN ce.is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
                THEN 1 ELSE 0 END as is_public,
                1 as is_visible";
        }
        
        $sql .= " FROM calendar_events ce";
        
        if ($settings_table_check) {
            $sql .= " LEFT JOIN calendar_settings cs ON cs.user_id = ce.user_id AND cs.calendar_name = ce.calendar_name";
        }
        
        $sql .= " WHERE ce.user_id = ? GROUP BY ce.calendar_name";
        
        if ($settings_table_check) {
            $sql .= ", cs.is_public, cs.is_visible";
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $calendars_raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Build calendars array - include ALL calendars for management, but mark visibility
        $calendars = [];
        foreach ($calendars_raw as $cal) {
            $calendars[] = [
                'calendar_name' => $cal['calendar_name'],
                'event_type' => $cal['event_type'],
                'color' => $cal['color'],
                'priority' => $cal['priority'],
                'event_count' => $cal['total_events'],
                'first_event' => $cal['first_event'],
                'last_event' => $cal['last_event'],
                'is_public' => $cal['is_public'],
                'is_visible' => $cal['is_visible'],
                'is_subscribed' => 0,
                'owner_id' => $user_id,
                'owner_username' => null
            ];
        }
        
        // Add subscribed calendars
        if ($subs_table_check) {
            $subscribed_sql = "SELECT 
                        ce.user_id as owner_id,
                        u.username as owner_username,
                        ce.calendar_name,
                        COUNT(*) as event_count,
                        MIN(ce.start_date) as first_event,
                        MAX(ce.end_date) as last_event,
                        MAX(ce.priority) as priority,
                        MAX(ce.event_type) as event_type,
                        MAX(ce.color) as color
                    FROM calendar_events ce
                    JOIN calendar_subscriptions cs ON cs.owner_id = ce.user_id AND cs.calendar_name = ce.calendar_name
                    JOIN users u ON u.user_id = ce.user_id
                    WHERE cs.subscriber_id = ?
                    GROUP BY ce.user_id, ce.calendar_name, u.username";
            
            $subscribed_stmt = $pdo->prepare($subscribed_sql);
            $subscribed_stmt->execute([$user_id]);
            $subscribed_raw = $subscribed_stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($subscribed_raw as $cal) {
                $calendars[] = [
                    'calendar_name' => $cal['calendar_name'],
                    'event_type' => $cal['event_type'],
                    'color' => $cal['color'],
                    'priority' => $cal['priority'],
                    'event_count' => $cal['event_count'],
                    'first_event' => $cal['first_event'],
                    'last_event' => $cal['last_event'],
                    'is_public' => 1,
                    'is_visible' => 1,
                    'is_subscribed' => 1,
                    'owner_id' => $cal['owner_id'],
                    'owner_username' => $cal['owner_username']
                ];
            }
        }
        
        // Sort by priority DESC, then calendar_name
        usort($calendars, function($a, $b) {
            if ($a['priority'] != $b['priority']) {
                return $b['priority'] - $a['priority'];
            }
            return strcmp($a['calendar_name'], $b['calendar_name']);
        });
        
        send_json_response(['success' => true, 'data' => $calendars]);
        
    } catch (Exception $e) {
        send_json_response(['success' => false, 'error' => 'Failed to get calendars'], 500);
    }
}

/**
 * Delete all events from a specific calendar
 */
function handleDeleteCalendar($user_id, $data) {
    global $pdo;
    
    try {
        $calendar_name = $data['calendar_name'] ?? '';
        
        if (empty($calendar_name)) {
            send_json_response(['success' => false, 'error' => 'Calendar name required'], 400);
            return;
        }
        
        $sql = "DELETE FROM calendar_events WHERE user_id = ? AND calendar_name = ?";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([$user_id, $calendar_name]);
        
        $deleted_count = $stmt->rowCount();
        
        send_json_response([
            'success' => true, 
            'message' => "Deleted {$deleted_count} events from calendar '{$calendar_name}'",
            'deleted_count' => $deleted_count
        ]);
        
    } catch (Exception $e) {
        send_json_response(['success' => false, 'error' => 'Failed to delete calendar'], 500);
    }
}

/**
 * Set priority for a calendar (higher priority shows in title bar)
 */
function handleSetCalendarPriority($user_id, $data) {
    global $pdo;
    
    try {
        $calendar_name = $data['calendar_name'] ?? '';
        $priority = $data['priority'] ?? 1;
        
        if (empty($calendar_name)) {
            send_json_response(['success' => false, 'error' => 'Calendar name required'], 400);
            return;
        }
        
        if (!is_numeric($priority) || $priority < 1) {
            send_json_response(['success' => false, 'error' => 'Priority must be a positive number'], 400);
            return;
        }
        
        $pdo->beginTransaction();
        
        try {
            // Update priority for all events in this calendar
            $sql = "UPDATE calendar_events SET priority = ? WHERE user_id = ? AND calendar_name = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$priority, $user_id, $calendar_name]);
            
            $updated_count = $stmt->rowCount();
            
            $pdo->commit();
            
            send_json_response([
                'success' => true,
                'message' => "Set priority {$priority} for {$updated_count} events in calendar '{$calendar_name}'",
                'updated_count' => $updated_count
            ]);
            
        } catch (Exception $e) {
            $pdo->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        send_json_response(['success' => false, 'error' => 'Failed to set calendar priority'], 500);
    }
}

/**
 * Get all public calendars available for subscription (excluding user's own calendars)
 */
function handleListPublicCalendars($user_id, $data) {
    global $pdo;
    
    try {
        // Check if calendar_subscriptions table exists
        $table_check = false;
        try {
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_subscriptions'");
            $table_check = $check_stmt->rowCount() > 0;
        } catch (Exception $e) {
            $table_check = false;
        }
        
        if (!$table_check) {
            // Table doesn't exist yet, return empty array
            send_json_response(['success' => true, 'data' => []]);
            return;
        }
        
        // Get calendars where all events are public, excluding user's own calendars
        // Use calendar_settings table if available, otherwise fall back to checking all events
        $sql = "SELECT 
                    ce.user_id as owner_id,
                    u.username as owner_username,
                    ce.calendar_name,
                    COUNT(*) as total_events,
                    MIN(ce.start_date) as first_event,
                    MAX(ce.end_date) as last_event,
                    MAX(ce.priority) as priority,
                    MAX(ce.event_type) as event_type,
                    MAX(ce.color) as color,
                    CASE 
                        WHEN cs.id IS NOT NULL THEN 1 
                        ELSE 0 
                    END as is_subscribed";
        
        if ($settings_table_check) {
            $sql .= ", COALESCE(cal_settings.is_public, 
                CASE 
                    WHEN COUNT(*) = SUM(CASE WHEN ce.is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
                    THEN 1 ELSE 0 END
                ) as is_public_calendar";
        } else {
            $sql .= ", CASE 
                WHEN COUNT(*) = SUM(CASE WHEN ce.is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
                THEN 1 ELSE 0 END as is_public_calendar";
        }
        
        $sql .= " FROM calendar_events ce
                JOIN users u ON u.user_id = ce.user_id
                LEFT JOIN calendar_subscriptions cs ON cs.subscriber_id = ? 
                    AND cs.owner_id = ce.user_id 
                    AND cs.calendar_name = ce.calendar_name";
        
        if ($settings_table_check) {
            $sql .= " LEFT JOIN calendar_settings cal_settings ON cal_settings.user_id = ce.user_id 
                    AND cal_settings.calendar_name = ce.calendar_name";
        }
        
        $sql .= " WHERE ce.user_id != ?
                GROUP BY ce.user_id, ce.calendar_name, u.username, cs.id";
        
        if ($settings_table_check) {
            $sql .= ", cal_settings.is_public";
        }
        
        $sql .= " HAVING COUNT(*) > 0";
        
        if ($settings_table_check) {
            $sql .= " AND COALESCE(cal_settings.is_public, 
                CASE 
                    WHEN COUNT(*) = SUM(CASE WHEN ce.is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
                    THEN 1 ELSE 0 END
                ) = 1";
        } else {
            $sql .= " AND COUNT(*) = SUM(CASE WHEN ce.is_public = 1 THEN 1 ELSE 0 END)";
        }
        
        $sql .= " ORDER BY MAX(ce.priority) DESC, ce.calendar_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $user_id]);
        $calendars_raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the response
        $calendars = [];
        foreach ($calendars_raw as $cal) {
            $calendars[] = [
                'owner_id' => $cal['owner_id'],
                'owner_username' => $cal['owner_username'],
                'calendar_name' => $cal['calendar_name'],
                'event_type' => $cal['event_type'],
                'color' => $cal['color'],
                'priority' => $cal['priority'],
                'event_count' => $cal['total_events'],
                'first_event' => $cal['first_event'],
                'last_event' => $cal['last_event'],
                'is_subscribed' => $cal['is_subscribed']
            ];
        }
        
        send_json_response(['success' => true, 'data' => $calendars]);
        
    } catch (Exception $e) {
        send_json_response(['success' => false, 'error' => 'Failed to get public calendars'], 500);
    }
}

/**
 * Subscribe to a public calendar
 */
function handleSubscribeToCalendar($user_id, $data) {
    global $pdo;
    
    try {
        // Check if calendar_subscriptions table exists
        $table_check = false;
        try {
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_subscriptions'");
            $table_check = $check_stmt->rowCount() > 0;
        } catch (Exception $e) {
            $table_check = false;
        }
        
        if (!$table_check) {
            send_json_response(['success' => false, 'error' => 'Subscription feature not available. Please run the database migration first.'], 503);
            return;
        }
        
        $owner_id = $data['owner_id'] ?? null;
        $calendar_name = $data['calendar_name'] ?? '';
        
        if (!$owner_id || empty($calendar_name)) {
            send_json_response(['success' => false, 'error' => 'Owner ID and calendar name required'], 400);
            return;
        }
        
        // Prevent self-subscription
        if ($owner_id == $user_id) {
            send_json_response(['success' => false, 'error' => 'Cannot subscribe to your own calendar'], 400);
            return;
        }
        
        // Verify calendar exists and is public
        $check_sql = "SELECT COUNT(*) as total";
        
        // Check if calendar_settings table exists
        $settings_table_check = false;
        try {
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_settings'");
            $settings_table_check = $check_stmt->rowCount() > 0;
        } catch (Exception $e) {
            $settings_table_check = false;
        }
        
        if ($settings_table_check) {
            $check_sql .= ", COALESCE(cs.is_public, 
                CASE 
                    WHEN COUNT(*) = SUM(CASE WHEN ce.is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
                    THEN 1 ELSE 0 END
                ) as is_public_calendar";
            $check_sql .= " FROM calendar_events ce
                      LEFT JOIN calendar_settings cs ON cs.user_id = ce.user_id AND cs.calendar_name = ce.calendar_name
                      WHERE ce.user_id = ? AND ce.calendar_name = ?
                      GROUP BY ce.user_id, ce.calendar_name, cs.is_public";
        } else {
            $check_sql .= ", CASE 
                WHEN COUNT(*) = SUM(CASE WHEN ce.is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
                THEN 1 ELSE 0 END as is_public_calendar
                      FROM calendar_events ce
                      WHERE ce.user_id = ? AND ce.calendar_name = ?";
        }
        
        $check_stmt = $pdo->prepare($check_sql);
        $check_stmt->execute([$owner_id, $calendar_name]);
        $check_result = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$check_result || $check_result['total'] == 0) {
            send_json_response(['success' => false, 'error' => 'Calendar not found'], 404);
            return;
        }
        
        if ($check_result['is_public_calendar'] != 1) {
            send_json_response(['success' => false, 'error' => 'Calendar is not public'], 403);
            return;
        }
        
        // Check if already subscribed
        $existing_sql = "SELECT id FROM calendar_subscriptions 
                         WHERE subscriber_id = ? AND owner_id = ? AND calendar_name = ?";
        $existing_stmt = $pdo->prepare($existing_sql);
        $existing_stmt->execute([$user_id, $owner_id, $calendar_name]);
        
        if ($existing_stmt->fetch()) {
            send_json_response(['success' => false, 'error' => 'Already subscribed to this calendar'], 409);
            return;
        }
        
        // Create subscription
        $insert_sql = "INSERT INTO calendar_subscriptions (subscriber_id, owner_id, calendar_name) 
                       VALUES (?, ?, ?)";
        $insert_stmt = $pdo->prepare($insert_sql);
        $insert_stmt->execute([$user_id, $owner_id, $calendar_name]);
        
        send_json_response([
            'success' => true,
            'message' => "Subscribed to calendar '{$calendar_name}'"
        ]);
        
    } catch (Exception $e) {
        send_json_response(['success' => false, 'error' => 'Failed to subscribe to calendar'], 500);
    }
}

/**
 * Unsubscribe from a public calendar
 */
function handleUnsubscribeFromCalendar($user_id, $data) {
    global $pdo;
    
    try {
        // Check if calendar_subscriptions table exists
        $table_check = false;
        try {
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_subscriptions'");
            $table_check = $check_stmt->rowCount() > 0;
        } catch (Exception $e) {
            $table_check = false;
        }
        
        if (!$table_check) {
            send_json_response(['success' => false, 'error' => 'Subscription feature not available'], 503);
            return;
        }
        
        $owner_id = $data['owner_id'] ?? null;
        $calendar_name = $data['calendar_name'] ?? '';
        
        if (!$owner_id || empty($calendar_name)) {
            send_json_response(['success' => false, 'error' => 'Owner ID and calendar name required'], 400);
            return;
        }
        
        $sql = "DELETE FROM calendar_subscriptions 
                WHERE subscriber_id = ? AND owner_id = ? AND calendar_name = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $owner_id, $calendar_name]);
        
        if ($stmt->rowCount() > 0) {
            send_json_response([
                'success' => true,
                'message' => "Unsubscribed from calendar '{$calendar_name}'"
            ]);
        } else {
            send_json_response(['success' => false, 'error' => 'Subscription not found'], 404);
        }
        
    } catch (Exception $e) {
        send_json_response(['success' => false, 'error' => 'Failed to unsubscribe from calendar'], 500);
    }
}

/**
 * Set calendar public/private status (calendar-level control)
 * When a calendar is public, all its events become public
 */
function handleSetCalendarPublic($user_id, $data) {
    global $pdo;
    
    try {
        $calendar_name = $data['calendar_name'] ?? '';
        $is_public = isset($data['is_public']) ? (bool)$data['is_public'] : false;
        
        if (empty($calendar_name)) {
            send_json_response(['success' => false, 'error' => 'Calendar name required'], 400);
            return;
        }
        
        // Check if calendar_settings table exists
        $table_check = false;
        try {
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_settings'");
            $table_check = $check_stmt->rowCount() > 0;
        } catch (Exception $e) {
            $table_check = false;
        }
        
        $pdo->beginTransaction();
        
        try {
            if ($table_check) {
                // Update calendar-level setting
                $settings_sql = "INSERT INTO calendar_settings (user_id, calendar_name, is_public, is_visible)
                                 VALUES (?, ?, ?, 1)
                                 ON DUPLICATE KEY UPDATE is_public = ?, updated_at = CURRENT_TIMESTAMP";
                $settings_stmt = $pdo->prepare($settings_sql);
                $settings_stmt->execute([$user_id, $calendar_name, $is_public ? 1 : 0, $is_public ? 1 : 0]);
            }
            
            // Update all events in the calendar to match calendar-level setting
            $sql = "UPDATE calendar_events SET is_public = ? WHERE user_id = ? AND calendar_name = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$is_public ? 1 : 0, $user_id, $calendar_name]);
            
            $updated_count = $stmt->rowCount();
            
            // If making calendar private, remove all subscriptions
            if (!$is_public) {
                $subs_table_check = false;
                try {
                    $subs_check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_subscriptions'");
                    $subs_table_check = $subs_check_stmt->rowCount() > 0;
                } catch (Exception $e) {
                    $subs_table_check = false;
                }
                
                if ($subs_table_check) {
                    $delete_subs_sql = "DELETE FROM calendar_subscriptions WHERE owner_id = ? AND calendar_name = ?";
                    $delete_subs_stmt = $pdo->prepare($delete_subs_sql);
                    $delete_subs_stmt->execute([$user_id, $calendar_name]);
                }
            }
            
            $pdo->commit();
            
            send_json_response([
                'success' => true,
                'message' => "Set calendar '{$calendar_name}' as " . ($is_public ? 'public' : 'private'),
                'updated_count' => $updated_count
            ]);
            
        } catch (Exception $e) {
            $pdo->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        send_json_response(['success' => false, 'error' => 'Failed to set calendar public status'], 500);
    }
}

/**
 * Set calendar visibility for owner (hide/show from own view)
 */
function handleSetCalendarVisible($user_id, $data) {
    global $pdo;
    
    try {
        $calendar_name = $data['calendar_name'] ?? '';
        $is_visible = isset($data['is_visible']) ? (bool)$data['is_visible'] : true;
        
        if (empty($calendar_name)) {
            send_json_response(['success' => false, 'error' => 'Calendar name required'], 400);
            return;
        }
        
        // Check if calendar_settings table exists
        $table_check = false;
        try {
            $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_settings'");
            $table_check = $check_stmt->rowCount() > 0;
        } catch (Exception $e) {
            $table_check = false;
        }
        
        if (!$table_check) {
            // Table doesn't exist, create entry with default public status
            $settings_sql = "INSERT INTO calendar_settings (user_id, calendar_name, is_public, is_visible)
                             VALUES (?, ?, 0, ?)
                             ON DUPLICATE KEY UPDATE is_visible = ?, updated_at = CURRENT_TIMESTAMP";
            $settings_stmt = $pdo->prepare($settings_sql);
            $settings_stmt->execute([$user_id, $calendar_name, $is_visible ? 1 : 0, $is_visible ? 1 : 0]);
        } else {
            // Update visibility
            $settings_sql = "INSERT INTO calendar_settings (user_id, calendar_name, is_public, is_visible)
                             VALUES (?, ?, 
                                (SELECT CASE 
                                    WHEN COUNT(*) = SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) AND COUNT(*) > 0 
                                    THEN 1 ELSE 0 END
                                 FROM calendar_events 
                                 WHERE user_id = ? AND calendar_name = ?), ?)
                             ON DUPLICATE KEY UPDATE is_visible = ?, updated_at = CURRENT_TIMESTAMP";
            $settings_stmt = $pdo->prepare($settings_sql);
            $settings_stmt->execute([$user_id, $calendar_name, $user_id, $calendar_name, $is_visible ? 1 : 0, $is_visible ? 1 : 0]);
        }
        
        send_json_response([
            'success' => true,
            'message' => "Calendar '{$calendar_name}' is now " . ($is_visible ? 'visible' : 'hidden') . " in your view"
        ]);
        
    } catch (Exception $e) {
        send_json_response(['success' => false, 'error' => 'Failed to set calendar visibility'], 500);
    }
}

/**
 * Export calendar events as JSON
 * Returns events in the import format (without name field)
 */
function handleExportCalendar($user_id, $data) {
    global $pdo;
    
    try {
        $calendar_name = $data['calendar_name'] ?? '';
        $owner_id = $data['owner_id'] ?? $user_id; // Default to own calendar
        
        if (empty($calendar_name)) {
            send_json_response(['success' => false, 'error' => 'Calendar name required'], 400);
            return;
        }
        
        // If exporting someone else's calendar, verify subscription
        if ($owner_id != $user_id) {
            // Check if calendar_subscriptions table exists
            $subs_table_check = false;
            try {
                $check_stmt = $pdo->query("SHOW TABLES LIKE 'calendar_subscriptions'");
                $subs_table_check = $check_stmt->rowCount() > 0;
            } catch (Exception $e) {
                $subs_table_check = false;
            }
            
            if ($subs_table_check) {
                $sub_check = $pdo->prepare("SELECT id FROM calendar_subscriptions 
                                           WHERE subscriber_id = ? AND owner_id = ? AND calendar_name = ?");
                $sub_check->execute([$user_id, $owner_id, $calendar_name]);
                if (!$sub_check->fetch()) {
                    send_json_response(['success' => false, 'error' => 'Access denied'], 403);
                    return;
                }
            } else {
                send_json_response(['success' => false, 'error' => 'Access denied'], 403);
                return;
            }
        }
        
        // Fetch all events for this calendar
        $sql = "SELECT start_date, end_date, label 
                FROM calendar_events 
                WHERE user_id = ? AND calendar_name = ?
                ORDER BY start_date ASC, end_date ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$owner_id, $calendar_name]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format events for export (matching import format)
        $export_data = array_map(function($event) {
            return [
                'startDate' => $event['start_date'],
                'endDate' => $event['end_date'],
                'label' => $event['label']
            ];
        }, $events);
        
        send_json_response([
            'success' => true,
            'data' => $export_data,
            'calendar_name' => $calendar_name,
            'event_count' => count($export_data)
        ]);
        
    } catch (Exception $e) {
        send_json_response(['success' => false, 'error' => 'Failed to export calendar'], 500);
    }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}
?>