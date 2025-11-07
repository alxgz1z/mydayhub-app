<?php
/**
 * Encryption Diagnostic Script
 * Checks if zero-knowledge encryption is properly set up
 * Access: breveasy.com/diagnose-encryption.php
 */

require_once __DIR__ . '/incs/config.php';
require_once __DIR__ . '/incs/db.php';

header('Content-Type: application/json');

try {
    $pdo = get_pdo();
    
    // Get alfa user ID
    $stmt = $pdo->prepare("SELECT user_id, username FROM users WHERE username = 'alfa'");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['error' => 'User alfa not found'], JSON_PRETTY_PRINT);
        exit;
    }
    
    $userId = $user['user_id'];
    
    // Check encryption keys
    $stmt = $pdo->prepare("SELECT user_id, 
        CASE WHEN wrapped_master_key IS NOT NULL THEN 'ENABLED' ELSE 'DISABLED' END as encryption_status,
        CASE WHEN recovery_envelope IS NOT NULL THEN 'ENABLED' ELSE 'DISABLED' END as recovery_status,
        LENGTH(wrapped_master_key) as key_length
        FROM user_encryption_keys WHERE user_id = ?");
    $stmt->execute([$userId]);
    $encryptionKeys = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Check journal entry #1
    $stmt = $pdo->prepare("SELECT entry_id, user_id, entry_date, title, 
        CASE WHEN encrypted_data IS NOT NULL AND encrypted_data != '' THEN 'ENCRYPTED' ELSE 'NOT_ENCRYPTED' END as encryption_status,
        LENGTH(encrypted_data) as encrypted_data_length,
        is_private,
        CASE WHEN content IS NOT NULL AND content != '' THEN 'HAS_CONTENT' ELSE 'NO_CONTENT' END as content_status
        FROM journal_entries WHERE entry_id = 1 AND user_id = ?");
    $stmt->execute([$userId]);
    $journalEntry = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Check if title/content are in encrypted_data (should be empty/null if encrypted)
    $stmt = $pdo->prepare("SELECT entry_id, 
        title,
        content,
        encrypted_data,
        CASE WHEN encrypted_data IS NOT NULL AND encrypted_data != '' AND (title IS NULL OR title = '') THEN 'PROPERLY_ENCRYPTED' ELSE 'CHECK_NEEDED' END as encryption_check
        FROM journal_entries WHERE entry_id = 1 AND user_id = ?");
    $stmt->execute([$userId]);
    $encryptionCheck = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $result = [
        'user' => $user,
        'encryption_keys' => $encryptionKeys ?: ['encryption_status' => 'NOT_SETUP'],
        'journal_entry' => $journalEntry,
        'encryption_verification' => [
            'has_encryption_keys' => $encryptionKeys !== false,
            'has_wrapped_master_key' => $encryptionKeys && $encryptionKeys['key_length'] > 0,
            'journal_entry_encrypted' => $journalEntry && $journalEntry['encryption_status'] === 'ENCRYPTED',
            'encrypted_data_length' => $journalEntry ? $journalEntry['encrypted_data_length'] : 0,
            'title_in_encrypted_data' => $encryptionCheck && $encryptionCheck['encryption_check'] === 'PROPERLY_ENCRYPTED'
        ],
        'raw_data_sample' => [
            'title_length' => $encryptionCheck ? strlen($encryptionCheck['title']) : 0,
            'content_length' => $encryptionCheck ? strlen($encryptionCheck['content'] ?? '') : 0,
            'encrypted_data_preview' => $encryptionCheck && $encryptionCheck['encrypted_data'] ? substr($encryptionCheck['encrypted_data'], 0, 50) . '...' : 'NULL'
        ]
    ];
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}

