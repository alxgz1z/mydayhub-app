<?php
/**
 * Calendar Preferences API Handler
 *
 * MyDayHub - Calendar Preferences Management
 *
 * @version 7.9 Jaco
 * @author Alex & Gemini & Claude & Cursor
 */

/**
 * Handle calendar preferences actions
 */
function handle_calendar_preferences_action($action, $method, $pdo, $user_id, $data) {
    try {
        switch ($action) {
            case 'getPreferences':
                handleGetPreferences($user_id);
                break;
            case 'updatePreferences':
                handleUpdatePreferences($user_id, $data);
                break;
            default:
                send_json_response(['success' => false, 'error' => 'Action not found'], 404);
                break;
        }
    } catch (Exception $e) {
        log_debug_message('Calendar Preferences API Error: ' . $e->getMessage());
        send_json_response(['success' => false, 'error' => 'Internal server error'], 500);
    }
}

/**
 * Handle GET preferences request
 */
function handleGetPreferences($user_id) {
    global $pdo;
    
    $sql = "SELECT calendar_type, is_visible FROM user_calendar_preferences WHERE user_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $preferences = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert to associative array
    $result = [];
    foreach ($preferences as $pref) {
        $result[$pref['calendar_type']] = (bool)$pref['is_visible'];
    }
    
    // Ensure all calendar types have default values
    $default_types = ['fiscal', 'holiday', 'birthday', 'custom'];
    foreach ($default_types as $type) {
        if (!isset($result[$type])) {
            $result[$type] = true; // Default to visible
            
            // Insert default preference
            $insert_sql = "INSERT INTO user_calendar_preferences (user_id, calendar_type, is_visible) VALUES (?, ?, ?)";
            $insert_stmt = $pdo->prepare($insert_sql);
            $insert_stmt->execute([$user_id, $type, 1]);
        }
    }
    
    send_json_response(['success' => true, 'data' => $result]);
}

/**
 * Handle UPDATE preferences request
 */
function handleUpdatePreferences($user_id, $data) {
    global $pdo;
    
    if (!isset($data['preferences']) || !is_array($data['preferences'])) {
        send_json_response(['success' => false, 'error' => 'Preferences data required'], 400);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        foreach ($data['preferences'] as $calendar_type => $is_visible) {
            // Validate calendar type
            $valid_types = ['fiscal', 'holiday', 'birthday', 'custom'];
            if (!in_array($calendar_type, $valid_types)) {
                continue;
            }
            
            // Update or insert preference
            $sql = "INSERT INTO user_calendar_preferences (user_id, calendar_type, is_visible) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE is_visible = ?";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user_id, $calendar_type, $is_visible ? 1 : 0, $is_visible ? 1 : 0]);
        }
        
        $pdo->commit();
        send_json_response(['success' => true]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        send_json_response(['success' => false, 'error' => 'Failed to update preferences'], 500);
    }
}
?>