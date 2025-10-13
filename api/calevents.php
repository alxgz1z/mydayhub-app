<?php
/**
 * Calendar Events API Handler
 *
 * MyDayHub - Calendar Events Management
 *
 * @version 8.0 Herradura
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
 */
function handleGetEvents($user_id, $data) {
    global $pdo;
    
    $start_date = $data['start_date'] ?? null;
    $end_date = $data['end_date'] ?? null;
    
    $sql = "SELECT * FROM calendar_events WHERE user_id = ?";
    $params = [$user_id];
    
    if ($start_date && $end_date) {
        $sql .= " AND start_date <= ? AND end_date >= ?";
        $params[] = $end_date;
        $params[] = $start_date;
    }
    
    $sql .= " ORDER BY priority DESC, start_date ASC";
    
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
    
    $sql = "INSERT INTO calendar_events (user_id, event_type, label, start_date, end_date, color, is_public)
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        $user_id,
        $data['event_type'],
        trim($data['label']),
        $data['start_date'],
        $data['end_date'],
        $data['color'] ?? '#22c55e',
        $data['is_public'] ?? false ? 1 : 0
    ]);
    
    if ($result) {
        $event_id = $pdo->lastInsertId();
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
            // Validate event data
            if (!isset($event['startDate']) || !isset($event['endDate']) || !isset($event['label'])) {
                $errors[] = "Event at index $index missing required fields";
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
 */
function handleGetCalendars($user_id) {
    global $pdo;
    
    try {
        $sql = "SELECT 
                    calendar_name,
                    event_type,
                    color,
                    priority,
                    COUNT(*) as event_count,
                    MIN(start_date) as first_event,
                    MAX(end_date) as last_event
                FROM calendar_events 
                WHERE user_id = ? 
                GROUP BY calendar_name, event_type, color, priority
                ORDER BY priority DESC, calendar_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $calendars = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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
 * Validate date format (YYYY-MM-DD)
 */
function validateDate($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}
?>