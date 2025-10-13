<?php
/**
 * Journal API Handler
 * 
 * Handles CRUD operations for journal entries, including privacy integration
 * with the existing zero-knowledge encryption system.
 * 
 * @version 8.0 Herradura
 */

declare(strict_types=1);

require_once __DIR__ . '/../incs/helpers.php';
require_once __DIR__ . '/../incs/crypto.php';

/**
 * Main handler function for journal actions
 */
function handle_journal_action(string $action, string $method, PDO $pdo, int $userId, array $data): array {
    try {
        switch ($action) {
            case 'getEntries':
                if ($method === 'GET') {
                    return handle_get_journal_entries($pdo, $userId, $data);
                }
                break;
                
            case 'createEntry':
                if ($method === 'POST') {
                    return handle_create_journal_entry($pdo, $userId, $data);
                }
                break;
                
            case 'updateEntry':
                if ($method === 'PUT') {
                    return handle_update_journal_entry($pdo, $userId, $data);
                }
                break;
                
            case 'deleteEntry':
                if ($method === 'DELETE') {
                    return handle_delete_journal_entry($pdo, $userId, $data);
                }
                break;
                
            case 'togglePrivacy':
                if ($method === 'POST') {
                    return handle_toggle_journal_privacy($pdo, $userId, $data);
                }
                break;
                
            case 'moveEntry':
                if ($method === 'POST') {
                    return handle_move_journal_entry($pdo, $userId, $data);
                }
                break;
                
            case 'duplicateEntry':
                if ($method === 'POST') {
                    return handle_duplicate_journal_entry($pdo, $userId, $data);
                }
                break;
                
            case 'getPreferences':
                if ($method === 'GET') {
                    return handle_get_journal_preferences($pdo, $userId);
                }
                break;
                
            case 'updatePreferences':
                if ($method === 'POST') {
                    return handle_update_journal_preferences($pdo, $userId, $data);
                }
                break;
                
            case 'createTaskFromMarkup':
                if ($method === 'POST') {
                    return handle_create_task_from_markup($pdo, $userId, $data);
                }
                break;
                
            case 'getLinkedTasks':
                if ($method === 'GET') {
                    return handle_get_linked_tasks($pdo, $userId, $data);
                }
                break;
                
            case 'getTaskOriginEntry':
                if ($method === 'GET') {
                    return handle_get_task_origin_entry($pdo, $userId, $data);
                }
                break;
                
            case 'toggleClassification':
                if ($method === 'POST') {
                    return handle_toggle_journal_classification($pdo, $userId, $data);
                }
                break;
                
            default:
                return ['status' => 'error', 'message' => 'Invalid action specified.'];
        }
        
        return ['status' => 'error', 'message' => 'Invalid method for this action.'];
        
    } catch (Exception $e) {
        log_debug_message('Error in journal.php: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'A server error occurred.'];
    }
}

/**
 * Retrieves journal entries for a date range
 */
function handle_get_journal_entries(PDO $pdo, int $userId, array $data): array {
    $startDate = $data['start_date'] ?? date('Y-m-d', strtotime('-3 days'));
    $endDate = $data['end_date'] ?? date('Y-m-d', strtotime('+3 days'));
    
    try {
        // Get journal entries for the date range
        // Check if classification column exists
        $columnCheck = $pdo->prepare("SHOW COLUMNS FROM journal_entries LIKE 'classification'");
        $columnCheck->execute();
        $hasClassification = $columnCheck->fetch() !== false;
        
        if ($hasClassification) {
            $stmt = $pdo->prepare("
                SELECT 
                    entry_id,
                    entry_date,
                    title,
                    content,
                    encrypted_data,
                    is_private,
                    classification,
                    position,
                    created_at,
                    updated_at
                FROM journal_entries 
                WHERE user_id = :userId 
                AND entry_date BETWEEN :startDate AND :endDate
                ORDER BY entry_date ASC, position ASC
            ");
        } else {
            $stmt = $pdo->prepare("
                SELECT 
                    entry_id,
                    entry_date,
                    title,
                    content,
                    encrypted_data,
                    is_private,
                    'support' as classification,
                    position,
                    created_at,
                    updated_at
                FROM journal_entries 
                WHERE user_id = :userId 
                AND entry_date BETWEEN :startDate AND :endDate
                ORDER BY entry_date ASC, position ASC
            ");
        }
        
        $stmt->execute([
            ':userId' => $userId,
            ':startDate' => $startDate,
            ':endDate' => $endDate
        ]);
        
        $entries = [];
        while ($entry = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Decrypt entry data if private
            if ($entry['is_private']) {
                $decryptedData = decryptJournalData($pdo, $userId, $entry['entry_id'], $entry['encrypted_data']);
                if ($decryptedData) {
                    $entry['title'] = $decryptedData['title'];
                    $entry['content'] = $decryptedData['content'];
                }
            } else {
                // For public entries, encrypted_data contains the JSON
                if ($entry['encrypted_data']) {
                    $data = json_decode($entry['encrypted_data'], true);
                    $entry['title'] = $data['title'] ?? $entry['title'];
                    $entry['content'] = $data['content'] ?? $entry['content'];
                }
            }
            
            // Check for task references in content
            $entry['has_task_references'] = hasTaskReferences($entry['content'] ?? '');
            
            $entries[] = $entry;
        }
        
        return ['status' => 'success', 'data' => $entries];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_get_journal_entries: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to retrieve journal entries.', 'debug' => [$e->getMessage()]];
    }
}

/**
 * Creates a new journal entry
 */
function handle_create_journal_entry(PDO $pdo, int $userId, array $data): array {
    $entryDate = $data['entry_date'] ?? date('Y-m-d');
    $title = trim($data['title'] ?? '');
    $content = $data['content'] ?? '';
    $isPrivate = $data['is_private'] ?? false;
    
    if (empty($title)) {
        return ['status' => 'error', 'message' => 'Entry title is required.'];
    }
    
    try {
        // Get next position for the date
        $positionStmt = $pdo->prepare("
            SELECT COALESCE(MAX(position), 0) + 1 as next_position 
            FROM journal_entries 
            WHERE user_id = :userId AND entry_date = :entryDate
        ");
        $positionStmt->execute([':userId' => $userId, ':entryDate' => $entryDate]);
        $position = $positionStmt->fetchColumn();
        
        // Prepare entry data
        $entryData = [
            'title' => $title,
            'content' => $content,
            'created_at' => time()
        ];
        
        $encryptedData = null;
        if ($isPrivate) {
            // Encrypt private entries
            $encryptedData = encryptJournalData($pdo, $userId, $entryData);
            if (!$encryptedData) {
                return ['status' => 'error', 'message' => 'Failed to encrypt entry data.'];
            }
            $title = 'Private Entry'; // Don't store actual title in plaintext
            $content = '';
        } else {
            // Store public entries as JSON
            $encryptedData = json_encode($entryData);
        }
        
        // Insert the entry (handle missing classification column gracefully)
        $stmt = $pdo->prepare("
            INSERT INTO journal_entries (user_id, entry_date, title, content, encrypted_data, is_private, position) 
            VALUES (:userId, :entryDate, :title, :content, :encryptedData, :isPrivate, :position)
        ");
        
        $stmt->execute([
            ':userId' => $userId,
            ':entryDate' => $entryDate,
            ':title' => $title,
            ':content' => $content,
            ':encryptedData' => $encryptedData,
            ':isPrivate' => $isPrivate ? 1 : 0,
            ':position' => $position
        ]);
        
        $entryId = (int)$pdo->lastInsertId();
        
        // Process task references if any
        $createdTasks = [];
        if (!$isPrivate) {
            $createdTasks = processTaskReferences($pdo, $userId, $entryId, $content);
        }
        
        return [
            'status' => 'success', 
            'message' => count($createdTasks) > 0 ? 
                'Entry created with ' . count($createdTasks) . ' task(s).' : 
                'Entry created successfully.',
            'data' => [
                'entry_id' => $entryId,
                'entry_date' => $entryDate,
                'created_tasks' => $createdTasks,
                'title' => $entryData['title'],
                'content' => $entryData['content'],
                'is_private' => $isPrivate,
                'position' => $position
            ]
        ];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_create_journal_entry: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create journal entry.'];
    }
}

/**
 * Updates an existing journal entry
 */
function handle_update_journal_entry(PDO $pdo, int $userId, array $data): array {
    $entryId = $data['entry_id'] ?? null;
    $title = trim($data['title'] ?? '');
    $content = $data['content'] ?? '';
    
    if (!$entryId) {
        return ['status' => 'error', 'message' => 'Entry ID is required.'];
    }
    
    if (empty($title)) {
        return ['status' => 'error', 'message' => 'Entry title is required.'];
    }
    
    try {
        // Get current entry to check ownership and privacy status
        $stmt = $pdo->prepare("
            SELECT user_id, is_private, encrypted_data 
            FROM journal_entries 
            WHERE entry_id = :entryId
        ");
        $stmt->execute([':entryId' => $entryId]);
        $entry = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$entry || $entry['user_id'] != $userId) {
            return ['status' => 'error', 'message' => 'Entry not found or access denied.'];
        }
        
        // Prepare updated entry data
        $entryData = [
            'title' => $title,
            'content' => $content,
            'updated_at' => time()
        ];
        
        $encryptedData = null;
        $updateTitle = $title;
        $updateContent = $content;
        
        if ($entry['is_private']) {
            // Encrypt private entries
            $encryptedData = encryptJournalData($pdo, $userId, $entryData);
            if (!$encryptedData) {
                return ['status' => 'error', 'message' => 'Failed to encrypt entry data.'];
            }
            $updateTitle = 'Private Entry';
            $updateContent = '';
        } else {
            // Store public entries as JSON
            $encryptedData = json_encode($entryData);
        }
        
        // Update the entry
        $updateStmt = $pdo->prepare("
            UPDATE journal_entries 
            SET title = :title, content = :content, encrypted_data = :encryptedData, updated_at = CURRENT_TIMESTAMP
            WHERE entry_id = :entryId AND user_id = :userId
        ");
        
        $updateStmt->execute([
            ':title' => $updateTitle,
            ':content' => $updateContent,
            ':encryptedData' => $encryptedData,
            ':entryId' => $entryId,
            ':userId' => $userId
        ]);
        
        // Process task references if not private
        $createdTasks = [];
        if (!$entry['is_private']) {
            $createdTasks = processTaskReferences($pdo, $userId, $entryId, $content);
        }
        
        return [
            'status' => 'success', 
            'message' => count($createdTasks) > 0 ? 
                'Entry updated with ' . count($createdTasks) . ' new task(s).' : 
                'Entry updated successfully.',
            'data' => [
                'created_tasks' => $createdTasks
            ]
        ];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_update_journal_entry: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update journal entry.'];
    }
}

/**
 * Deletes a journal entry
 */
function handle_delete_journal_entry(PDO $pdo, int $userId, array $data): array {
    $entryId = $data['entry_id'] ?? null;
    
    if (!$entryId) {
        return ['status' => 'error', 'message' => 'Entry ID is required.'];
    }
    
    try {
        $pdo->beginTransaction();
        
        // Verify ownership
        $checkStmt = $pdo->prepare("
            SELECT entry_id FROM journal_entries 
            WHERE entry_id = :entryId AND user_id = :userId
        ");
        $checkStmt->execute([':entryId' => $entryId, ':userId' => $userId]);
        
        if (!$checkStmt->fetch()) {
            $pdo->rollBack();
            return ['status' => 'error', 'message' => 'Entry not found or access denied.'];
        }
        
        // Orphan tasks that originated from this entry (independence rule)
        // Clear journal_entry_id but don't delete the tasks
        $orphanStmt = $pdo->prepare("
            UPDATE tasks 
            SET journal_entry_id = NULL 
            WHERE journal_entry_id = :entryId AND user_id = :userId
        ");
        $orphanStmt->execute([':entryId' => $entryId, ':userId' => $userId]);
        
        // Remove all bidirectional links
        $unlinkStmt = $pdo->prepare("
            DELETE FROM journal_task_links 
            WHERE journal_entry_id = :entryId
        ");
        $unlinkStmt->execute([':entryId' => $entryId]);
        
        // Delete the journal entry
        $deleteStmt = $pdo->prepare("
            DELETE FROM journal_entries 
            WHERE entry_id = :entryId AND user_id = :userId
        ");
        $deleteStmt->execute([':entryId' => $entryId, ':userId' => $userId]);
        
        $pdo->commit();
        
        return ['status' => 'success', 'message' => 'Entry deleted successfully.'];
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        log_debug_message('Error in handle_delete_journal_entry: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to delete journal entry.'];
    }
}

/**
 * Toggles privacy status of a journal entry
 */
function handle_toggle_journal_privacy(PDO $pdo, int $userId, array $data): array {
    $entryId = $data['entry_id'] ?? null;
    
    if (!$entryId) {
        return ['status' => 'error', 'message' => 'Entry ID is required.'];
    }
    
    try {
        // Get current entry
        $stmt = $pdo->prepare("
            SELECT user_id, is_private, title, content, encrypted_data 
            FROM journal_entries 
            WHERE entry_id = :entryId
        ");
        $stmt->execute([':entryId' => $entryId]);
        $entry = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$entry || $entry['user_id'] != $userId) {
            return ['status' => 'error', 'message' => 'Entry not found or access denied.'];
        }
        
        $newPrivacyStatus = !$entry['is_private'];
        
        // Prepare entry data
        $entryData = [
            'title' => $entry['title'],
            'content' => $entry['content'],
            'updated_at' => time()
        ];
        
        // If currently private, decrypt first
        if ($entry['is_private']) {
            $decryptedData = decryptJournalData($pdo, $userId, $entryId, $entry['encrypted_data']);
            if ($decryptedData) {
                $entryData = $decryptedData;
            }
        } else {
            // If currently public, parse JSON
            $data = json_decode($entry['encrypted_data'], true);
            if ($data) {
                $entryData = $data;
            }
        }
        
        $encryptedData = null;
        $updateTitle = $entryData['title'];
        $updateContent = $entryData['content'];
        
        if ($newPrivacyStatus) {
            // Encrypt for private
            $encryptedData = encryptJournalData($pdo, $userId, $entryData);
            if (!$encryptedData) {
                return ['status' => 'error', 'message' => 'Failed to encrypt entry data.'];
            }
            $updateTitle = 'Private Entry';
            $updateContent = '';
        } else {
            // Store as JSON for public
            $encryptedData = json_encode($entryData);
        }
        
        // Update the entry
        $updateStmt = $pdo->prepare("
            UPDATE journal_entries 
            SET title = :title, content = :content, encrypted_data = :encryptedData, is_private = :isPrivate, updated_at = CURRENT_TIMESTAMP
            WHERE entry_id = :entryId AND user_id = :userId
        ");
        
        $updateStmt->execute([
            ':title' => $updateTitle,
            ':content' => $updateContent,
            ':encryptedData' => $encryptedData,
            ':isPrivate' => $newPrivacyStatus ? 1 : 0,
            ':entryId' => $entryId,
            ':userId' => $userId
        ]);
        
        return [
            'status' => 'success', 
            'message' => 'Privacy status updated successfully.',
            'data' => ['is_private' => $newPrivacyStatus]
        ];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_toggle_journal_privacy: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update privacy status.'];
    }
}

/**
 * Moves a journal entry to a different date
 */
function handle_move_journal_entry(PDO $pdo, int $userId, array $data): array {
    $entryId = $data['entry_id'] ?? null;
    $newDate = $data['new_date'] ?? null;
    
    if (!$entryId || !$newDate) {
        return ['status' => 'error', 'message' => 'Entry ID and new date are required.'];
    }
    
    // Validate date format and prevent moves beyond 2 days in the future
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $newDate)) {
        return ['status' => 'error', 'message' => 'Invalid date format.'];
    }
    
    $today = date('Y-m-d');
    $maxDate = date('Y-m-d', strtotime('+2 days'));
    if ($newDate > $maxDate) {
        return ['status' => 'error', 'message' => 'Cannot move entries more than 2 days in the future.'];
    }
    
    try {
        // Verify ownership
        $stmt = $pdo->prepare("
            SELECT user_id FROM journal_entries 
            WHERE entry_id = :entryId
        ");
        $stmt->execute([':entryId' => $entryId]);
        $entry = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$entry || $entry['user_id'] != $userId) {
            return ['status' => 'error', 'message' => 'Entry not found or access denied.'];
        }
        
        // Get next position for the new date
        $positionStmt = $pdo->prepare("
            SELECT COALESCE(MAX(position), 0) + 1 as next_position 
            FROM journal_entries 
            WHERE user_id = :userId AND entry_date = :newDate
        ");
        $positionStmt->execute([':userId' => $userId, ':newDate' => $newDate]);
        $position = $positionStmt->fetchColumn();
        
        // Update the entry
        $updateStmt = $pdo->prepare("
            UPDATE journal_entries 
            SET entry_date = :newDate, position = :position, updated_at = CURRENT_TIMESTAMP
            WHERE entry_id = :entryId AND user_id = :userId
        ");
        
        $updateStmt->execute([
            ':newDate' => $newDate,
            ':position' => $position,
            ':entryId' => $entryId,
            ':userId' => $userId
        ]);
        
        return [
            'status' => 'success', 
            'message' => 'Entry moved successfully.',
            'data' => ['new_date' => $newDate, 'position' => $position]
        ];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_move_journal_entry: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to move entry.'];
    }
}

/**
 * Duplicates a journal entry
 */
function handle_duplicate_journal_entry(PDO $pdo, int $userId, array $data): array {
    $entryId = $data['entry_id'] ?? null;
    $targetDate = $data['target_date'] ?? null;
    
    if (!$entryId) {
        return ['status' => 'error', 'message' => 'Entry ID is required.'];
    }
    
    try {
        // Get the original entry
        $stmt = $pdo->prepare("
            SELECT user_id, entry_date, title, content, encrypted_data, is_private
            FROM journal_entries 
            WHERE entry_id = :entryId
        ");
        $stmt->execute([':entryId' => $entryId]);
        $originalEntry = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$originalEntry || $originalEntry['user_id'] != $userId) {
            return ['status' => 'error', 'message' => 'Entry not found or access denied.'];
        }
        
        // Use target date or same date as original
        $newDate = $targetDate ?: $originalEntry['entry_date'];
        
        // Get next position for the new date
        $positionStmt = $pdo->prepare("
            SELECT COALESCE(MAX(position), 0) + 1 as next_position 
            FROM journal_entries 
            WHERE user_id = :userId AND entry_date = :newDate
        ");
        $positionStmt->execute([':userId' => $userId, ':newDate' => $newDate]);
        $position = $positionStmt->fetchColumn();
        
        // Create duplicate entry
        $duplicateStmt = $pdo->prepare("
            INSERT INTO journal_entries (user_id, entry_date, title, content, encrypted_data, is_private, position) 
            VALUES (:userId, :entryDate, :title, :content, :encryptedData, :isPrivate, :position)
        ");
        
        $duplicateStmt->execute([
            ':userId' => $userId,
            ':entryDate' => $newDate,
            ':title' => $originalEntry['title'],
            ':content' => $originalEntry['content'],
            ':encryptedData' => $originalEntry['encrypted_data'],
            ':isPrivate' => $originalEntry['is_private'],
            ':position' => $position
        ]);
        
        $newEntryId = $pdo->lastInsertId();
        
        return [
            'status' => 'success', 
            'message' => 'Entry duplicated successfully.',
            'data' => ['new_entry_id' => $newEntryId, 'entry_date' => $newDate]
        ];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_duplicate_journal_entry: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to duplicate entry.'];
    }
}

/**
 * Gets journal preferences for a user
 */
function handle_get_journal_preferences(PDO $pdo, int $userId): array {
    try {
        $stmt = $pdo->prepare("
            SELECT view_mode, hide_weekends, date_format
            FROM journal_preferences 
            WHERE user_id = :userId
        ");
        $stmt->execute([':userId' => $userId]);
        $preferences = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$preferences) {
            // Return default preferences
            $preferences = [
                'view_mode' => '3-day',
                'hide_weekends' => false,
                'date_format' => 'YEAR.MON.DD, Day'
            ];
        }
        
        return ['status' => 'success', 'data' => $preferences];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_get_journal_preferences: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to retrieve preferences.'];
    }
}

/**
 * Updates journal preferences for a user
 */
function handle_update_journal_preferences(PDO $pdo, int $userId, array $data): array {
    $viewMode = $data['view_mode'] ?? null;
    $hideWeekends = $data['hide_weekends'] ?? null;
    $dateFormat = $data['date_format'] ?? null;
    
    if (!$viewMode && $hideWeekends === null && !$dateFormat) {
        return ['status' => 'error', 'message' => 'No preferences to update.'];
    }
    
    try {
        // Check if preferences exist
        $checkStmt = $pdo->prepare("SELECT preference_id FROM journal_preferences WHERE user_id = :userId");
        $checkStmt->execute([':userId' => $userId]);
        $exists = $checkStmt->fetchColumn();
        
        if ($exists) {
            // Update existing preferences
            $updateFields = [];
            $params = [':userId' => $userId];
            
            if ($viewMode) {
                $updateFields[] = 'view_mode = :viewMode';
                $params[':viewMode'] = $viewMode;
            }
            if ($hideWeekends !== null) {
                $updateFields[] = 'hide_weekends = :hideWeekends';
                $params[':hideWeekends'] = $hideWeekends ? 1 : 0;
            }
            if ($dateFormat) {
                $updateFields[] = 'date_format = :dateFormat';
                $params[':dateFormat'] = $dateFormat;
            }
            
            $updateFields[] = 'updated_at = CURRENT_TIMESTAMP';
            
            $stmt = $pdo->prepare("
                UPDATE journal_preferences 
                SET " . implode(', ', $updateFields) . "
                WHERE user_id = :userId
            ");
            $stmt->execute($params);
        } else {
            // Insert new preferences
            $stmt = $pdo->prepare("
                INSERT INTO journal_preferences (user_id, view_mode, hide_weekends, date_format) 
                VALUES (:userId, :viewMode, :hideWeekends, :dateFormat)
            ");
            
            $stmt->execute([
                ':userId' => $userId,
                ':viewMode' => $viewMode ?: '3-day',
                ':hideWeekends' => $hideWeekends !== null ? ($hideWeekends ? 1 : 0) : 0,
                ':dateFormat' => $dateFormat ?: 'YEAR.MON.DD, Day'
            ]);
        }
        
        return ['status' => 'success', 'message' => 'Preferences updated successfully.'];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_update_journal_preferences: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update preferences.'];
    }
}

/**
 * Creates tasks from journal entry markup
 */
function handle_create_task_from_markup(PDO $pdo, int $userId, array $data): array {
    $journalEntryId = $data['journal_entry_id'] ?? null;
    $taskText = $data['task_text'] ?? '';
    $columnId = $data['column_id'] ?? null;
    
    if (!$journalEntryId || empty($taskText)) {
        return ['status' => 'error', 'message' => 'Journal entry ID and task text are required.'];
    }
    
    try {
        // Verify journal entry ownership
        $stmt = $pdo->prepare("
            SELECT user_id FROM journal_entries 
            WHERE entry_id = :entryId
        ");
        $stmt->execute([':entryId' => $journalEntryId]);
        $journalEntry = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$journalEntry || $journalEntry['user_id'] != $userId) {
            return ['status' => 'error', 'message' => 'Journal entry not found or access denied.'];
        }
        
        // Get default column if not specified
        if (!$columnId) {
            $columnStmt = $pdo->prepare("
                SELECT column_id FROM columns 
                WHERE user_id = :userId AND deleted_at IS NULL 
                ORDER BY position ASC LIMIT 1
            ");
            $columnStmt->execute([':userId' => $userId]);
            $columnId = $columnStmt->fetchColumn();
        }
        
        if (!$columnId) {
            return ['status' => 'error', 'message' => 'No column available for task creation.'];
        }
        
        // Create task data
        $taskData = [
            'title' => $taskText,
            'notes' => "Created from journal entry #{$journalEntryId}",
            'source' => 'journal_markup'
        ];
        
        $encryptedData = json_encode($taskData);
        
        // Insert the task
        $taskStmt = $pdo->prepare("
            INSERT INTO tasks (user_id, column_id, encrypted_data, classification, journal_entry_id, created_at) 
            VALUES (:userId, :columnId, :encryptedData, 'support', :journalEntryId, UTC_TIMESTAMP())
        ");
        
        $taskStmt->execute([
            ':userId' => $userId,
            ':columnId' => $columnId,
            ':encryptedData' => $encryptedData,
            ':journalEntryId' => $journalEntryId
        ]);
        
        $taskId = $pdo->lastInsertId();
        
        // Create bidirectional link
        $linkStmt = $pdo->prepare("
            INSERT INTO journal_task_links (journal_entry_id, task_id) 
            VALUES (:journalEntryId, :taskId)
        ");
        $linkStmt->execute([
            ':journalEntryId' => $journalEntryId,
            ':taskId' => $taskId
        ]);
        
        return [
            'status' => 'success', 
            'message' => 'Task created successfully.',
            'data' => [
                'task_id' => $taskId,
                'journal_entry_id' => $journalEntryId
            ]
        ];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_create_task_from_markup: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to create task from markup.'];
    }
}

/**
 * Helper function to encrypt journal data
 */
function encryptJournalData(PDO $pdo, int $userId, array $data): ?string {
    // Use existing crypto system for consistency
    $cryptoEngine = new CryptoEngine($pdo, $userId);
    return $cryptoEngine->encryptItem('journal_entry', 0, $data); // 0 is placeholder for new entries
}

/**
 * Helper function to decrypt journal data
 */
function decryptJournalData(PDO $pdo, int $userId, int $entryId, string $encryptedData): ?array {
    // Use existing crypto system for consistency
    $cryptoEngine = new CryptoEngine($pdo, $userId);
    return $cryptoEngine->decryptItem('journal_entry', $entryId, $encryptedData);
}

/**
 * Helper function to check for task references in content
 */
function hasTaskReferences(string $content): bool {
    return preg_match('/@task\[([^\]]+)\]/', $content) === 1;
}

/**
 * Gets all tasks linked to a journal entry
 */
function handle_get_linked_tasks(PDO $pdo, int $userId, array $data): array {
    $entryId = $data['entry_id'] ?? null;
    
    if (!$entryId) {
        return ['status' => 'error', 'message' => 'Entry ID is required.'];
    }
    
    try {
        // Verify entry ownership
        $checkStmt = $pdo->prepare("
            SELECT entry_id FROM journal_entries 
            WHERE entry_id = :entryId AND user_id = :userId
        ");
        $checkStmt->execute([':entryId' => $entryId, ':userId' => $userId]);
        
        if (!$checkStmt->fetch()) {
            return ['status' => 'error', 'message' => 'Entry not found or access denied.'];
        }
        
        // Get linked tasks
        $stmt = $pdo->prepare("
            SELECT 
                t.task_id,
                t.column_id,
                t.encrypted_data,
                t.is_private,
                t.classification,
                t.deleted_at,
                c.title as column_title
            FROM journal_task_links jtl
            JOIN tasks t ON jtl.task_id = t.task_id
            LEFT JOIN columns c ON t.column_id = c.column_id
            WHERE jtl.journal_entry_id = :entryId
            AND t.user_id = :userId
            ORDER BY t.created_at DESC
        ");
        
        $stmt->execute([
            ':entryId' => $entryId,
            ':userId' => $userId
        ]);
        
        $tasks = [];
        while ($task = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Decode task data
            $taskData = json_decode($task['encrypted_data'], true);
            $task['title'] = $taskData['title'] ?? 'Untitled Task';
            $task['is_deleted'] = !empty($task['deleted_at']);
            
            $tasks[] = $task;
        }
        
        return ['status' => 'success', 'data' => $tasks];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_get_linked_tasks: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to retrieve linked tasks.'];
    }
}

/**
 * Gets the origin journal entry for a task
 */
function handle_get_task_origin_entry(PDO $pdo, int $userId, array $data): array {
    $taskId = $data['task_id'] ?? null;
    
    if (!$taskId) {
        return ['status' => 'error', 'message' => 'Task ID is required.'];
    }
    
    try {
        // Verify task ownership and get origin entry
        $stmt = $pdo->prepare("
            SELECT 
                je.entry_id,
                je.entry_date,
                je.title,
                je.content,
                je.encrypted_data,
                je.is_private
            FROM tasks t
            LEFT JOIN journal_entries je ON t.journal_entry_id = je.entry_id
            WHERE t.task_id = :taskId AND t.user_id = :userId
        ");
        
        $stmt->execute([
            ':taskId' => $taskId,
            ':userId' => $userId
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return ['status' => 'error', 'message' => 'Task not found or no origin entry.'];
        }
        
        // If no entry_id, task has no origin
        if (!$result['entry_id']) {
            return ['status' => 'success', 'data' => null];
        }
        
        // Decrypt entry data if private
        if ($result['is_private']) {
            $decryptedData = decryptJournalData($pdo, $userId, $result['entry_id'], $result['encrypted_data']);
            if ($decryptedData) {
                $result['title'] = $decryptedData['title'];
                $result['content'] = $decryptedData['content'];
            }
        } else {
            // For public entries, encrypted_data contains the JSON
            if ($result['encrypted_data']) {
                $data = json_decode($result['encrypted_data'], true);
                $result['title'] = $data['title'] ?? $result['title'];
                $result['content'] = $data['content'] ?? $result['content'];
            }
        }
        
        return ['status' => 'success', 'data' => $result];
        
    } catch (Exception $e) {
        log_debug_message('Error in handle_get_task_origin_entry: ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to retrieve origin entry.'];
    }
}

/**
 * Helper function to process task references in content
 */
/**
 * Processes @task[...] markup in journal entry content
 * Creates tasks automatically and links them bidirectionally
 * 
 * Supports two formats:
 * - @task[Task Title] -> Creates task in Backlog column (default)
 * - @task[Column Name/Task Title] -> Creates task in specified column
 */
function processTaskReferences(PDO $pdo, int $userId, int $entryId, string $content): array {
    $createdTasks = [];
    
    // Match @task[...] patterns
    // Supports: @task[title] or @task[column/title]
    preg_match_all('/@task\[([^\]]+)\]/', $content, $matches);
    
    if (empty($matches[1])) {
        return $createdTasks;
    }
    
    try {
        // Get all user's columns for lookup
        $columnsStmt = $pdo->prepare("
            SELECT column_id, title 
            FROM columns 
            WHERE user_id = :userId AND deleted_at IS NULL
        ");
        $columnsStmt->execute([':userId' => $userId]);
        $columns = $columnsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Create column name -> ID map (case-insensitive)
        $columnMap = [];
        $backlogColumnId = null;
        foreach ($columns as $col) {
            $columnMap[strtolower($col['title'])] = $col['column_id'];
            if (strtolower($col['title']) === 'backlog') {
                $backlogColumnId = $col['column_id'];
            }
        }
        
        // If no Backlog column exists, use first column as fallback
        if (!$backlogColumnId && !empty($columns)) {
            $backlogColumnId = $columns[0]['column_id'];
        }
        
        if (!$backlogColumnId) {
            log_debug_message("No columns available for user {$userId} to create tasks from journal");
            return $createdTasks;
        }
        
        // Process each task markup
        foreach ($matches[1] as $taskMarkup) {
            $taskMarkup = trim($taskMarkup);
            if (empty($taskMarkup)) continue;
            
            // Parse format: "Column Name/Task Title" or just "Task Title"
            $columnId = $backlogColumnId; // Default to Backlog
            $taskTitle = $taskMarkup;
            
            if (strpos($taskMarkup, '/') !== false) {
                list($columnName, $taskTitle) = explode('/', $taskMarkup, 2);
                $columnName = trim($columnName);
                $taskTitle = trim($taskTitle);
                
                // Look up column by name (case-insensitive)
                $columnKey = strtolower($columnName);
                if (isset($columnMap[$columnKey])) {
                    $columnId = $columnMap[$columnKey];
                } else {
                    // Column not found, default to Backlog
                    log_debug_message("Column '{$columnName}' not found, defaulting to Backlog");
                }
            }
            
            if (empty($taskTitle)) continue;
            
            // Check if task already exists to prevent duplicates
            $checkStmt = $pdo->prepare("
                SELECT task_id FROM journal_task_links 
                WHERE journal_entry_id = :entryId
                AND task_id IN (
                    SELECT task_id FROM tasks 
                    WHERE user_id = :userId 
                    AND JSON_UNQUOTE(JSON_EXTRACT(encrypted_data, '$.title')) = :taskTitle
                    AND deleted_at IS NULL
                )
            ");
            $checkStmt->execute([
                ':entryId' => $entryId,
                ':userId' => $userId,
                ':taskTitle' => $taskTitle
            ]);
            
            if ($checkStmt->fetch()) {
                // Task already linked, skip
                continue;
            }
            
            // Create the task
            $taskData = [
                'title' => $taskTitle,
                'notes' => '',
                'source' => 'journal_markup',
                'created_from_journal' => true
            ];
            
            $encryptedData = json_encode($taskData);
            
            // Get next position in column
            $posStmt = $pdo->prepare("
                SELECT COALESCE(MAX(position), 0) + 1 as next_position 
                FROM tasks 
                WHERE column_id = :columnId AND deleted_at IS NULL
            ");
            $posStmt->execute([':columnId' => $columnId]);
            $position = $posStmt->fetchColumn();
            
            // Insert the task
            $taskStmt = $pdo->prepare("
                INSERT INTO tasks (
                    user_id, column_id, encrypted_data, classification, 
                    journal_entry_id, position, created_at
                ) 
                VALUES (
                    :userId, :columnId, :encryptedData, 'support', 
                    :journalEntryId, :position, UTC_TIMESTAMP()
                )
            ");
            
            $taskStmt->execute([
                ':userId' => $userId,
                ':columnId' => $columnId,
                ':encryptedData' => $encryptedData,
                ':journalEntryId' => $entryId,
                ':position' => $position
            ]);
            
            $taskId = (int)$pdo->lastInsertId();
            
            // Create bidirectional link
            $linkStmt = $pdo->prepare("
                INSERT INTO journal_task_links (journal_entry_id, task_id) 
                VALUES (:journalEntryId, :taskId)
                ON DUPLICATE KEY UPDATE task_id = task_id
            ");
            $linkStmt->execute([
                ':journalEntryId' => $entryId,
                ':taskId' => $taskId
            ]);
            
            $createdTasks[] = [
                'task_id' => $taskId,
                'title' => $taskTitle,
                'column_id' => $columnId
            ];
        }
        
        return $createdTasks;
        
    } catch (Exception $e) {
        log_debug_message('Error processing task references: ' . $e->getMessage());
        return $createdTasks;
    }
}

/**
 * Toggles a journal entry's classification (Signal, Support, or Backlog).
 * Based on the tasks classification system.
 */
function handle_toggle_journal_classification(PDO $pdo, int $userId, array $data): array {
    $entryId = isset($data['entry_id']) ? (int)$data['entry_id'] : 0;
    $newClassification = $data['classification'] ?? null;

    if ($entryId <= 0 || empty($newClassification) || !in_array($newClassification, ['signal', 'support', 'backlog'])) {
        return ['status' => 'error', 'message' => 'Entry ID and a valid classification are required.'];
    }

    try {
        $stmtUpdate = $pdo->prepare(
            "UPDATE journal_entries 
             SET classification = :newClassification, updated_at = UTC_TIMESTAMP() 
             WHERE entry_id = :entryId AND user_id = :userId"
        );
        $stmtUpdate->execute([':newClassification' => $newClassification, ':entryId' => $entryId, ':userId' => $userId]);

        if ($stmtUpdate->rowCount() === 0) {
            return ['status' => 'error', 'message' => 'Journal entry not found or permission denied.'];
        }

        return [
            'status' => 'success',
            'message' => 'Classification updated successfully.',
            'data' => [
                'entry_id' => $entryId,
                'new_classification' => $newClassification
            ]
        ];

    } catch (Exception $e) {
        log_debug_message('Error in journal.php handle_toggle_journal_classification(): ' . $e->getMessage());
        return ['status' => 'error', 'message' => 'A server error occurred.'];
    }
}
?>