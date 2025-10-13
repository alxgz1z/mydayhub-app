/**
 * Zero-Knowledge Encryption Module
 * MyDayHub - Client-Side Encryption for Private Tasks
 * @version 8.0 Herradura
 * @author Alex & Gemini & Claude & Cursor
 */

// ==========================================================================
// 1. CRYPTO MANAGER CLASS
// ==========================================================================

class CryptoManager {
    constructor() {
        this.masterKey = null;
        this.keyCache = new Map(); // Cache for unwrapped DEKs
        this.worker = null;
        this.isInitialized = false;
        
        // Initialize Web Worker for crypto operations
        this.initWorker();
    }

    // ==========================================================================
    // 2. CRYPTO FUNCTIONS (Main Thread)
    // ==========================================================================

    async initWorker() {
        // Check if Web Crypto API is available
        if (window.MyDayHub_Config?.DEV_MODE) {
            console.log('Checking crypto availability:');
            console.log('window.crypto:', !!window.crypto);
            console.log('window.crypto.subtle:', !!window.crypto?.subtle);
        }
        
        if (!window.crypto) {
            throw new Error('window.crypto is not available in this browser');
        }
        
        if (!window.crypto.subtle) {
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
            const errorMsg = `window.crypto.subtle is not available. This is likely due to:
1) Non-HTTPS connection (current: ${window.location.protocol}//${window.location.hostname})
2) Browser security restrictions
3) Older browser version

For localhost development, HTTPS is not required, but for other domains it is mandatory for Web Crypto API.`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        // Test basic crypto functionality
        try {
            const testKey = await window.crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
            if (window.MyDayHub_Config?.DEV_MODE) {
                console.log('Crypto test successful:', !!testKey);
            }
        } catch (error) {
            console.error('Crypto test failed:', error);
            throw new Error('Web Crypto API test failed: ' + error.message);
        }
        
        if (window.MyDayHub_Config?.DEV_MODE) {
            console.log('Crypto manager initialized successfully on main thread');
        }
        this.isInitialized = true;
    }

    // ==========================================================================
    // 3. KEY DERIVATION & MANAGEMENT
    // ==========================================================================

    async deriveMasterKey(password, salt) {
        try {
            console.log('Starting key derivation...');
            console.log('Password length:', password.length);
            console.log('Salt length:', salt.length);
            console.log('window.crypto.subtle available:', !!window.crypto?.subtle);
            
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);
            const saltBuffer = new Uint8Array(salt);
            
            console.log('Password buffer length:', passwordBuffer.length);
            console.log('Salt buffer length:', saltBuffer.length);
            
            // Import password as key material
            console.log('Importing key material...');
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );
            console.log('Key material imported successfully');
            
            // Derive master key using PBKDF2
            console.log('Deriving master key...');
            this.masterKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: 100000, // Argon2id equivalent iterations
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                true, // Make extractable for recovery envelope
                ['encrypt', 'decrypt']
            );
            
            console.log('Master key derived successfully');
            return this.masterKey;
        } catch (error) {
            console.error('Failed to derive master key:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw new Error('Key derivation failed: ' + error.message);
        }
    }

    async generateDEK() {
        try {
            return await window.crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true, // extractable
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Failed to generate DEK:', error);
            throw new Error('DEK generation failed: ' + error.message);
        }
    }

    async wrapDEK(dek, masterKey = this.masterKey) {
        if (!masterKey) {
            throw new Error('Master key not available');
        }
        
        try {
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const wrappedKey = await window.crypto.subtle.exportKey('raw', dek);
            
            const ciphertext = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                masterKey,
                wrappedKey
            );
            
            return {
                ciphertext: Array.from(new Uint8Array(ciphertext)),
                iv: Array.from(iv)
            };
        } catch (error) {
            console.error('Failed to wrap DEK:', error);
            throw new Error('DEK wrapping failed: ' + error.message);
        }
    }

    async unwrapDEK(wrappedDEK, masterKey = this.masterKey) {
        if (!masterKey) {
            throw new Error('Master key not available');
        }

        // Check cache first
        const cacheKey = JSON.stringify(wrappedDEK);
        if (this.keyCache.has(cacheKey)) {
            return this.keyCache.get(cacheKey);
        }

        try {
            const ciphertext = new Uint8Array(wrappedDEK.ciphertext);
            const iv = new Uint8Array(wrappedDEK.iv);
            
            const decryptedKey = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                masterKey,
                ciphertext
            );
            
            const dek = await window.crypto.subtle.importKey(
                'raw',
                decryptedKey,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
            
            this.keyCache.set(cacheKey, dek);
            return dek;
        } catch (error) {
            console.error('Failed to unwrap DEK:', error);
            throw new Error('DEK unwrapping failed: ' + error.message);
        }
    }

    // ==========================================================================
    // 4. DATA ENCRYPTION/DECRYPTION
    // ==========================================================================

    async encryptItem(data, dek) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const ciphertext = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                dek,
                dataBuffer
            );
            
            return {
                ciphertext: Array.from(new Uint8Array(ciphertext)),
                iv: Array.from(iv)
            };
        } catch (error) {
            console.error('Failed to encrypt data:', error);
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    async decryptItem(encryptedData, dek) {
        try {
            const ciphertext = new Uint8Array(encryptedData.ciphertext);
            const iv = new Uint8Array(encryptedData.iv);
            
            const decryptedData = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                dek,
                ciphertext
            );
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedData));
        } catch (error) {
            console.error('Failed to decrypt data:', error);
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    // ==========================================================================
    // 5. SECURITY QUESTIONS & RECOVERY
    // ==========================================================================

    async generateRecoveryKey(answers) {
        try {
            // Hash security question answers
            const encoder = new TextEncoder();
            const answersText = answers.join('|');
            const data = encoder.encode(answersText);
            
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            
            return hashArray;
        } catch (error) {
            console.error('Failed to generate recovery key:', error);
            throw new Error('Recovery key generation failed: ' + error.message);
        }
    }

    async createRecoveryEnvelope(masterKey, recoveryKey) {
        try {
            // Export master key
            const exportedKey = await window.crypto.subtle.exportKey('raw', masterKey);
            
            // Import recovery key
            const recoveryKeyObj = await window.crypto.subtle.importKey(
                'raw',
                new Uint8Array(recoveryKey),
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
            
            // Encrypt master key with recovery key
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const ciphertext = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                recoveryKeyObj,
                exportedKey
            );
            
            return {
                ciphertext: Array.from(new Uint8Array(ciphertext)),
                iv: Array.from(iv)
            };
        } catch (error) {
            console.error('Failed to create recovery envelope:', error);
            throw new Error('Recovery envelope creation failed: ' + error.message);
        }
    }

    async decryptRecoveryEnvelope(recoveryEnvelope, recoveryKey) {
        try {
            // Import recovery key
            const recoveryKeyObj = await window.crypto.subtle.importKey(
                'raw',
                new Uint8Array(recoveryKey),
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
            
            // Decrypt master key
            const ciphertext = new Uint8Array(recoveryEnvelope.ciphertext);
            const iv = new Uint8Array(recoveryEnvelope.iv);
            
            const decryptedKey = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                recoveryKeyObj,
                ciphertext
            );
            
            // Import master key
            return await window.crypto.subtle.importKey(
                'raw',
                decryptedKey,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Failed to decrypt recovery envelope:', error);
            throw new Error('Recovery envelope decryption failed: ' + error.message);
        }
    }

    // ==========================================================================
    // 6. UTILITY FUNCTIONS
    // ==========================================================================

    generateSalt(length = 32) {
        return Array.from(window.crypto.getRandomValues(new Uint8Array(length)));
    }

    clearCache() {
        this.keyCache.clear();
    }

    isInitialized() {
        return this.masterKey !== null && this.isInitialized;
    }

    destroy() {
        this.clearCache();
        this.masterKey = null;
        this.isInitialized = false;
    }
}

// ==========================================================================
// 7. GLOBAL CRYPTO MANAGER INSTANCE
// ==========================================================================

window.cryptoManager = new CryptoManager();

// ==========================================================================
// 8. CONVENIENCE FUNCTIONS
// ==========================================================================

/**
 * Initialize encryption for a user
 */
async function initUserEncryption(password) {
    try {
        // Generate salt
        const salt = window.cryptoManager.generateSalt();
        
        // Derive master key
        const masterKey = await window.cryptoManager.deriveMasterKey(password, salt);
        
        return { masterKey, salt };
    } catch (error) {
        console.error('Failed to initialize user encryption:', error);
        throw error;
    }
}

/**
 * Encrypt a task with automatic DEK generation
 */
async function encryptTask(taskData, masterKey = window.cryptoManager.masterKey) {
    try {
        // Generate DEK for this task
        const dek = await window.cryptoManager.generateDEK();
        
        // Encrypt task data
        const encryptedData = await window.cryptoManager.encryptItem(taskData, dek);
        
        // Wrap DEK with master key
        const wrappedDEK = await window.cryptoManager.wrapDEK(dek, masterKey);
        
        return { encryptedData, wrappedDEK };
    } catch (error) {
        console.error('Failed to encrypt task:', error);
        throw error;
    }
}

/**
 * Decrypt a task using wrapped DEK
 */
async function decryptTask(encryptedData, wrappedDEK, masterKey = window.cryptoManager.masterKey) {
    try {
        // Unwrap DEK
        const dek = await window.cryptoManager.unwrapDEK(wrappedDEK, masterKey);
        
        // Decrypt task data
        const taskData = await window.cryptoManager.decryptItem(encryptedData, dek);
        
        return taskData;
    } catch (error) {
        console.error('Failed to decrypt task:', error);
        throw error;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CryptoManager, initUserEncryption, encryptTask, decryptTask };
}
