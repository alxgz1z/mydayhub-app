<?php
/**
 * Encryption Management API
 * MyDayHub - Zero-Knowledge Encryption Backend
 * @version 7.5 - Zero Knowledge
 * @author Alex & Gemini & Claude & Cursor
 */

require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';

function handle_encryption_action($action, $method, $pdo, $userId, $data) {
    switch ($action) {
        case 'setupEncryption':
            if ($method !== 'POST') {
                return ['success' => false, 'message' => 'Method not allowed'];
            }
            return handle_setup_encryption($userId, $data, $pdo);
            
        case 'getEncryptionStatus':
            if ($method !== 'GET') {
                return ['success' => false, 'message' => 'Method not allowed'];
            }
            return handle_get_encryption_status($userId, $pdo);
            
        case 'migrateTasks':
            if ($method !== 'POST') {
                return ['success' => false, 'message' => 'Method not allowed'];
            }
            return handle_migrate_tasks($userId, $data, $pdo);
            
        case 'getMigrationStatus':
            if ($method !== 'GET') {
                return ['success' => false, 'message' => 'Method not allowed'];
            }
            return handle_get_migration_status($userId, $pdo);
            
        case 'updateRecoveryEnvelope':
            if ($method !== 'POST') {
                return ['success' => false, 'message' => 'Method not allowed'];
            }
            return handle_update_recovery_envelope($userId, $data, $pdo);
            
        default:
            return ['success' => false, 'message' => 'Unknown action: ' . $action];
    }
}

/**
 * Setup encryption for a user
 */
function handle_setup_encryption($userId, $data, $pdo) {
    try {
        $wrappedMasterKey = $data['wrapped_master_key'] ?? null;
        $keyDerivationSalt = $data['key_derivation_salt'] ?? null;
        $recoveryEnvelope = $data['recovery_envelope'] ?? null;
        $recoveryQuestionsHash = $data['recovery_questions_hash'] ?? null;
        
        if (!$wrappedMasterKey || !$keyDerivationSalt) {
            return ['success' => false, 'message' => 'Missing required encryption data'];
        }
        
        // Check if encryption is already setup
        $stmt = $pdo->prepare("SELECT user_id FROM user_encryption_keys WHERE user_id = ?");
        $stmt->execute([$userId]);
        if ($stmt->fetch()) {
            return ['success' => false, 'message' => 'Encryption already setup for this user'];
        }
        
        // Validate recovery data if provided
        if ($recoveryEnvelope && $recoveryQuestionsHash) {
            // Verify security questions exist
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_security_questions WHERE user_id = ?");
            $stmt->execute([$userId]);
            $questionCount = $stmt->fetchColumn();
            
            if ($questionCount < 3) {
                return ['success' => false, 'message' => 'Security questions required before enabling recovery'];
            }
        }
        
        $pdo->beginTransaction();
        
        try {
            // Insert encryption keys
            $stmt = $pdo->prepare("
                INSERT INTO user_encryption_keys 
                (user_id, wrapped_master_key, key_derivation_salt, recovery_envelope, recovery_questions_hash)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                json_encode($wrappedMasterKey),
                json_encode($keyDerivationSalt),
                $recoveryEnvelope ? json_encode($recoveryEnvelope) : null,
                $recoveryQuestionsHash ? json_encode($recoveryQuestionsHash) : null
            ]);
            
            // Initialize migration status
            $stmt = $pdo->prepare("
                INSERT INTO encryption_migration_status (user_id, migration_status, total_tasks)
                VALUES (?, 'pending', (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND is_private = 1 AND deleted_at IS NULL))
            ");
            $stmt->execute([$userId, $userId]);
            
            $pdo->commit();
            
            // Log encryption setup
            log_encryption_operation($pdo, $userId, 'encrypt', 'user_key', null, true);
            
            return [
                'success' => true,
                'message' => 'Encryption setup successfully',
                'data' => ['encryption_enabled' => true]
            ];
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (Exception $e) {
        error_log("Encryption setup error: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to setup encryption'];
    }
}

/**
 * Get encryption status for a user
 */
function handle_get_encryption_status($userId, $pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                uek.user_id,
                uek.recovery_envelope,
                uek.recovery_questions_hash,
                uek.created_at as encryption_setup_at,
                ems.migration_status,
                ems.tasks_migrated,
                ems.total_tasks,
                ems.migration_completed_at,
                (SELECT COUNT(*) FROM user_security_questions WHERE user_id = ?) as security_questions_count
            FROM user_encryption_keys uek
            LEFT JOIN encryption_migration_status ems ON uek.user_id = ems.user_id
            WHERE uek.user_id = ?
        ");
        $stmt->execute([$userId, $userId]);
        $encryptionData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$encryptionData) {
            return [
                'success' => true,
                'data' => [
                    'encryption_enabled' => false,
                    'recovery_enabled' => false,
                    'migration_status' => 'not_applicable'
                ]
            ];
        }
        
        return [
            'success' => true,
            'data' => [
                'encryption_enabled' => true,
                'recovery_enabled' => !empty($encryptionData['recovery_envelope']),
                'security_questions_count' => (int)$encryptionData['security_questions_count'],
                'migration_status' => $encryptionData['migration_status'],
                'tasks_migrated' => (int)$encryptionData['tasks_migrated'],
                'total_tasks' => (int)$encryptionData['total_tasks'],
                'encryption_setup_at' => $encryptionData['encryption_setup_at'],
                'migration_completed_at' => $encryptionData['migration_completed_at']
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Get encryption status error: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to get encryption status'];
    }
}

/**
 * Start migration of existing private tasks
 */
function handle_migrate_tasks($userId, $data, $pdo) {
    try {
        // Check if encryption is enabled
        $stmt = $pdo->prepare("SELECT user_id FROM user_encryption_keys WHERE user_id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            return ['success' => false, 'message' => 'Encryption not enabled'];
        }
        
        // Get migration status
        $stmt = $pdo->prepare("SELECT migration_status FROM encryption_migration_status WHERE user_id = ?");
        $stmt->execute([$userId]);
        $migrationStatus = $stmt->fetchColumn();
        
        if ($migrationStatus === 'completed') {
            return [
                'success' => true,
                'message' => 'Migration already completed',
                'data' => ['migration_status' => 'completed']
            ];
        }
        
        if ($migrationStatus === 'in_progress') {
            return [
                'success' => true,
                'message' => 'Migration already in progress',
                'data' => ['migration_status' => 'in_progress']
            ];
        }
        
        // Start migration
        $stmt = $pdo->prepare("
            UPDATE encryption_migration_status 
            SET migration_status = 'in_progress', migration_started_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        
        // Get tasks to migrate
        $stmt = $pdo->prepare("
            SELECT task_id, encrypted_data, is_private
            FROM tasks
            WHERE user_id = ? AND is_private = 1 AND deleted_at IS NULL
            ORDER BY task_id
        ");
        $stmt->execute([$userId]);
        $tasksToMigrate = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'message' => 'Migration started',
            'data' => [
                'migration_status' => 'in_progress',
                'tasks_to_migrate' => count($tasksToMigrate),
                'tasks' => $tasksToMigrate
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Start migration error: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to start migration'];
    }
}

/**
 * Get migration status
 */
function handle_get_migration_status($userId, $pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT migration_status, tasks_migrated, total_tasks, migration_started_at, migration_completed_at
            FROM encryption_migration_status
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $status = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$status) {
            return [
                'success' => true,
                'data' => ['migration_status' => 'not_applicable']
            ];
        }
        
        return [
            'success' => true,
            'data' => [
                'migration_status' => $status['migration_status'],
                'tasks_migrated' => (int)$status['tasks_migrated'],
                'total_tasks' => (int)$status['total_tasks'],
                'migration_started_at' => $status['migration_started_at'],
                'migration_completed_at' => $status['migration_completed_at']
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Get migration status error: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to get migration status'];
    }
}

/**
 * Update recovery envelope
 */
function handle_update_recovery_envelope($userId, $data, $pdo) {
    try {
        $recoveryEnvelope = $data['recovery_envelope'] ?? null;
        $recoveryQuestionsHash = $data['recovery_questions_hash'] ?? null;
        
        if (!$recoveryEnvelope || !$recoveryQuestionsHash) {
            return ['success' => false, 'message' => 'Missing recovery data'];
        }
        
        // Verify encryption is enabled
        $stmt = $pdo->prepare("SELECT user_id FROM user_encryption_keys WHERE user_id = ?");
        $stmt->execute([$userId]);
        if (!$stmt->fetch()) {
            return ['success' => false, 'message' => 'Encryption not enabled'];
        }
        
        // Update recovery envelope
        $stmt = $pdo->prepare("
            UPDATE user_encryption_keys 
            SET recovery_envelope = ?, recovery_questions_hash = ?, updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([
            json_encode($recoveryEnvelope),
            json_encode($recoveryQuestionsHash),
            $userId
        ]);
        
        return [
            'success' => true,
            'message' => 'Recovery envelope updated successfully',
            'data' => ['recovery_enabled' => true]
        ];
        
    } catch (Exception $e) {
        error_log("Update recovery envelope error: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to update recovery envelope'];
    }
}

/**
 * Log encryption operations for audit
 */
function log_encryption_operation($pdo, $userId, $operation, $itemType = null, $itemId = null, $success = true, $errorMessage = null) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO encryption_audit_log (user_id, operation, item_type, item_id, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $operation, $itemType, $itemId, $success ? 1 : 0, $errorMessage]);
    } catch (Exception $e) {
        error_log("Failed to log encryption operation: " . $e->getMessage());
    }
}
?>
