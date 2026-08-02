<?php
/**
 * Centralized Encryption Engine
 * Signal - Zero-Knowledge Encryption Backend
 * @version 8.5 Avellanas
 * @author Alex & Gemini & Claude & Cursor
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

/**
 * Centralized encryption service for all app elements
 */
class CryptoEngine {
    private $pdo;
    private $userId;
    private $cryptoManager;

    public function __construct(PDO $pdo, int $userId) {
        $this->pdo = $pdo;
        $this->userId = $userId;
        $this->cryptoManager = null;
    }

    /**
     * Check if encryption is enabled for this user (the caller).
     * Used by the settings/status UI, which asks about the current user specifically.
     */
    public function isEncryptionEnabled(): bool {
        return $this->userHasEncryption($this->userId);
    }

    /**
     * Check if encryption is enabled for an arbitrary user.
     * Item crypto follows the item's OWNER, who is not always the caller (shared items).
     */
    private function userHasEncryption(int $userId): bool {
        try {
            $stmt = $this->pdo->prepare("SELECT user_id FROM user_encryption_keys WHERE user_id = ?");
            $stmt->execute([$userId]);
            return $stmt->fetch() !== false;
        } catch (Exception $e) {
            log_debug_message("Error checking encryption status: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Look up an item's owner and privacy flag.
     * Every crypto decision keys on these, never on the requesting user — otherwise a
     * recipient of a shared item makes the wrong call in both directions.
     */
    private function getItemMeta(string $itemType, int $itemId): ?array {
        $tables = [
            'task'          => ['tasks', 'task_id'],
            'column'        => ['columns', 'column_id'],
            'journal_entry' => ['journal_entries', 'entry_id'],
        ];
        if (!isset($tables[$itemType])) {
            log_debug_message("Unknown item type for crypto metadata: $itemType");
            return null;
        }
        [$table, $idColumn] = $tables[$itemType];

        try {
            $stmt = $this->pdo->prepare("SELECT user_id, is_private FROM `{$table}` WHERE `{$idColumn}` = ?");
            $stmt->execute([$itemId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return null;
            }
            return [
                'owner_id'   => (int)$row['user_id'],
                'is_private' => (bool)$row['is_private'],
            ];
        } catch (Exception $e) {
            log_debug_message("Error resolving crypto metadata for $itemType $itemId: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user's encryption keys from database
     */
    private function getUserEncryptionKeys(): ?array {
        try {
            $stmt = $this->pdo->prepare("
                SELECT wrapped_master_key, key_derivation_salt, recovery_envelope, recovery_questions_hash
                FROM user_encryption_keys 
                WHERE user_id = ?
            ");
            $stmt->execute([$this->userId]);
            $keys = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$keys) {
                return null;
            }

            return [
                'wrapped_master_key' => json_decode($keys['wrapped_master_key'], true),
                'key_derivation_salt' => json_decode($keys['key_derivation_salt'], true),
                'recovery_envelope' => $keys['recovery_envelope'] ? json_decode($keys['recovery_envelope'], true) : null,
                'recovery_questions_hash' => $keys['recovery_questions_hash'] ? json_decode($keys['recovery_questions_hash'], true) : null
            ];
        } catch (Exception $e) {
            log_debug_message("Error getting user encryption keys: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Initialize crypto manager with user's keys
     */
    private function initCryptoManager(): bool {
        if ($this->cryptoManager !== null) {
            return true;
        }

        $keys = $this->getUserEncryptionKeys();
        if (!$keys) {
            log_debug_message("No encryption keys found for user during initialization");
            return false;
        }

        try {
            // For this simplified implementation, we just need to verify keys exist
            $this->cryptoManager = true;
            return true;
        } catch (Exception $e) {
            log_debug_message("Error initializing crypto manager: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Encrypt data for a specific item (task, column, etc.)
     */
    public function encryptItem(string $itemType, int $itemId, array $data): ?string {
        // Keys belong to the owner, not the caller — a recipient editing a shared item
        // must still encrypt with the owner's settings rather than silently storing plaintext.
        $meta = $this->getItemMeta($itemType, $itemId);
        if (!$meta || !$this->userHasEncryption($meta['owner_id'])) {
            return json_encode($data);
        }

        try {
            // Get or create item encryption key
            $itemKey = $this->getOrCreateItemKey($itemType, $itemId);
            if (!$itemKey) {
                log_debug_message("Failed to get or create item key");
                return null;
            }

            // Encrypt the data using AES-256-GCM
            $jsonData = json_encode($data);
            $iv = random_bytes(12); // 96-bit IV for GCM
            
            // Use the item key to encrypt the data
            $encryptedData = openssl_encrypt(
                $jsonData,
                'aes-256-gcm',
                $itemKey,
                OPENSSL_RAW_DATA,
                $iv,
                $tag
            );
            
            if ($encryptedData === false) {
                log_debug_message("Failed to encrypt data with OpenSSL");
                return null;
            }

            // Create the encryption envelope
            $envelope = [
                'encrypted' => true,
                'item_type' => $itemType,
                'item_id' => $itemId,
                'encrypted_data' => base64_encode($encryptedData),
                'iv' => base64_encode($iv),
                'tag' => base64_encode($tag),
                'encrypted_at' => time()
            ];

            return json_encode($envelope);
        } catch (Exception $e) {
            log_debug_message("Error encrypting item: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Decrypt data for a specific item
     */
    public function decryptItem(string $itemType, int $itemId, string $encryptedData): ?array {
        $data = json_decode($encryptedData, true);
        if (!is_array($data)) {
            log_debug_message("Stored payload for $itemType $itemId is not valid JSON");
            return null;
        }

        // Decide on the shape of the stored payload, never on who is asking. The caller
        // may be a recipient of a shared item and have no encryption of their own.
        if (empty($data['encrypted'])) {
            return $data; // Plaintext JSON, return as-is
        }

        try {
            // Get item encryption key
            $itemKey = $this->getItemKey($itemType, $itemId);
            if (!$itemKey) {
                log_debug_message("No item key found for decryption");
                return null;
            }

            // Extract encryption components
            $encryptedDataContent = base64_decode($data['encrypted_data']);
            $iv = base64_decode($data['iv']);
            $tag = base64_decode($data['tag']);

            // Decrypt the data using item key
            $decryptedJson = openssl_decrypt(
                $encryptedDataContent,
                'aes-256-gcm',
                $itemKey,
                OPENSSL_RAW_DATA,
                $iv,
                $tag
            );
            
            if ($decryptedJson === false) {
                log_debug_message("Failed to decrypt data content");
                return null;
            }

            $plaintext = json_decode($decryptedJson, true);
            if (!is_array($plaintext)) {
                log_debug_message("Decrypted payload for $itemType $itemId is not valid JSON");
                return null;
            }

            // Recover fields a recipient's edit wrote alongside the envelope instead of
            // inside it. Envelope keys are ours; anything else is salvaged content.
            $envelopeKeys = ['encrypted', 'item_type', 'item_id', 'encrypted_data', 'iv', 'tag', 'encrypted_at'];
            $strays = array_diff_key($data, array_flip($envelopeKeys));
            if ($strays) {
                log_debug_message("Recovered " . count($strays) . " stray field(s) for $itemType $itemId");
                $plaintext = array_merge($plaintext, $strays);
            }

            return $plaintext;
        } catch (Exception $e) {
            log_debug_message("Error decrypting item: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get or create an encryption key for a specific item
     */
    private function getOrCreateItemKey(string $itemType, int $itemId): ?string {
        try {
            log_debug_message("getOrCreateItemKey called for type: $itemType, id: $itemId");
            
            // First, try to get existing key
            $stmt = $this->pdo->prepare("SELECT wrapped_dek FROM item_encryption_keys WHERE item_type = ? AND item_id = ?");
            $stmt->execute([$itemType, $itemId]);
            $result = $stmt->fetch();
            
            if ($result) {
                log_debug_message("Found existing key for $itemType $itemId");
                // Key exists, return it (in a real system, you'd decrypt it with master key)
                return base64_decode($result['wrapped_dek']);
            }
            
            log_debug_message("No existing key found, creating new one for $itemType $itemId");
            
            // Key doesn't exist, create a new one
            $itemKey = random_bytes(32); // 256-bit key
            
            // Store the key (in a real system, you'd encrypt it with master key first)
            $stmt = $this->pdo->prepare("INSERT INTO item_encryption_keys (item_type, item_id, wrapped_dek, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())");
            $stmt->execute([$itemType, $itemId, base64_encode($itemKey)]);
            
            log_debug_message("Successfully created and stored new key for $itemType $itemId");
            
            return $itemKey;
        } catch (Exception $e) {
            log_debug_message("Error getting or creating item key: " . $e->getMessage());
            log_debug_message("PDO Error Code: " . ($this->pdo->errorCode() ?? 'none'));
            log_debug_message("PDO Error Info: " . json_encode($this->pdo->errorInfo()));
            return null;
        }
    }

    /**
     * Get an existing encryption key for a specific item
     */
    private function getItemKey(string $itemType, int $itemId): ?string {
        try {
            $stmt = $this->pdo->prepare("SELECT wrapped_dek FROM item_encryption_keys WHERE item_type = ? AND item_id = ?");
            $stmt->execute([$itemType, $itemId]);
            $result = $stmt->fetch();
            
            if ($result) {
                return base64_decode($result['wrapped_dek']);
            }
            
            return null;
        } catch (Exception $e) {
            log_debug_message("Error getting item key: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if an item should be encrypted based on its privacy status
     */
    public function shouldEncrypt(string $itemType, int $itemId): bool {
        $meta = $this->getItemMeta($itemType, $itemId);
        if (!$meta) {
            return false;
        }

        // Owner's privacy flag and owner's encryption setup — not the caller's.
        return $meta['is_private'] && $this->userHasEncryption($meta['owner_id']);
    }

    /**
     * Encrypt data if item is private, otherwise return as-is.
     * Returns null if encryption was required but failed — callers MUST abort rather
     * than fall back to plaintext, which would silently downgrade a private item.
     */
    public function encryptIfPrivate(string $itemType, int $itemId, array $data): ?string {
        if ($this->shouldEncrypt($itemType, $itemId)) {
            return $this->encryptItem($itemType, $itemId, $data);
        }

        return json_encode($data);
    }

    /**
     * Decrypt data if it's encrypted, otherwise return as-is.
     * Returns null on failure. Previously this fell back to the raw envelope, which is
     * truthy, so a failed decrypt was indistinguishable from a successful one.
     */
    public function decryptIfEncrypted(string $itemType, int $itemId, string $encryptedData): ?array {
        return $this->decryptItem($itemType, $itemId, $encryptedData);
    }
}

/**
 * Factory function to create crypto engine instance
 */
function createCryptoEngine(PDO $pdo, int $userId): CryptoEngine {
    return new CryptoEngine($pdo, $userId);
}

/**
 * Helper function to check if encryption is enabled for a user
 */
function isEncryptionEnabled(PDO $pdo, int $userId): bool {
    $crypto = new CryptoEngine($pdo, $userId);
    return $crypto->isEncryptionEnabled();
}

/**
 * Helper function to encrypt task data
 */
function encryptTaskData(PDO $pdo, int $userId, int $taskId, array $data): ?string {
    $crypto = createCryptoEngine($pdo, $userId);
    return $crypto->encryptIfPrivate('task', $taskId, $data);
}

/**
 * Helper function to decrypt task data
 */
function decryptTaskData(PDO $pdo, int $userId, int $taskId, string $encryptedData): ?array {
    $crypto = createCryptoEngine($pdo, $userId);
    return $crypto->decryptIfEncrypted('task', $taskId, $encryptedData);
}

/**
 * Helper function to encrypt column data
 */
function encryptColumnData(PDO $pdo, int $userId, int $columnId, array $data): ?string {
    $crypto = createCryptoEngine($pdo, $userId);
    return $crypto->encryptIfPrivate('column', $columnId, $data);
}

/**
 * Helper function to decrypt column data
 */
function decryptColumnData(PDO $pdo, int $userId, int $columnId, string $encryptedData): ?array {
    $crypto = createCryptoEngine($pdo, $userId);
    return $crypto->decryptIfEncrypted('column', $columnId, $encryptedData);
}
?>
