/**
 * Encryption Setup Wizard
 * MyDayHub - Zero-Knowledge Encryption Setup UI
 * @version 8.1 Tamarindo
 * @author Alex & Gemini & Claude & Cursor
 */

// ==========================================================================
// 1. ENCRYPTION SETUP WIZARD
// ==========================================================================

class EncryptionSetupWizard {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 2; // Reduced from 3 to 2 (removed password step)
        this.securityQuestions = [];
        this.answers = [];
        this.recoveryEnvelope = null;
    }

    // ==========================================================================
    // 2. WIZARD INITIALIZATION
    // ==========================================================================

    /**
     * Get the current user's login password
     * This will be stored temporarily during login for encryption setup
     */
    async getCurrentUserPassword() {
        // Check if password is stored in session storage (set during login)
        const storedPassword = sessionStorage.getItem('temp_login_password');
        if (storedPassword) {
            // Clear it after use for security
            sessionStorage.removeItem('temp_login_password');
            return storedPassword;
        }
        
        // If not found, prompt user to re-enter their current password
        return await this.promptForCurrentPassword();
    }

    /**
     * Prompt user to enter their current login password for encryption setup
     */
    async promptForCurrentPassword() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content encryption-modal">
                    <div class="modal-header">
                        <h3>Enter Current Password</h3>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>To enable encryption, please enter your current login password:</p>
                        <div class="form-group">
                            <input type="password" id="current-password-input" placeholder="Current Password" required autofocus>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-password">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirm-password">Continue</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const closeModal = () => {
                document.body.removeChild(modal);
            };
            
            const currentPasswordInput = modal.querySelector('#current-password-input');
            const confirmBtn = modal.querySelector('#confirm-password');
            const cancelBtn = modal.querySelector('#cancel-password');
            const closeBtn = modal.querySelector('.modal-close-btn');
            
            const handleConfirm = () => {
                const password = currentPasswordInput.value.trim();
                closeModal();
                resolve(password);
            };
            
            const handleCancel = () => {
                closeModal();
                resolve(null);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            closeBtn.addEventListener('click', handleCancel);
            
            currentPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleConfirm();
                }
            });
        });
    }

    async init() {
        // Check if encryption is already setup
        const status = await this.checkEncryptionStatus();
        
        if (status.encryption_enabled) {
            console.log('Encryption already enabled');
            return;
        }

        // Check if Web Crypto API is available
        if (!window.crypto || !window.crypto.subtle) {
            console.log('Web Crypto API not available');
            return;
        }

        // Don't auto-show wizard - wait for user to need it
        console.log('Encryption setup available but not auto-triggered');
    }

    // New method to manually trigger encryption setup
    async triggerSetup() {
        const status = await this.checkEncryptionStatus();
        
        if (status.encryption_enabled) {
            console.log('Encryption already enabled');
            return;
        }

        // Check if Web Crypto API is available
        if (!window.crypto || !window.crypto.subtle) {
            console.log('Web Crypto API not available - showing skip option');
            this.showSkipEncryptionOption();
            return;
        }

        // Show setup wizard
        this.showWizard();
    }

    async checkEncryptionStatus() {
        try {
            if (window.MyDayHub_Config?.DEV_MODE) {
                console.log('Checking encryption status...');
            }
            
            // Use direct fetch with GET method for status check
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const appURL = window.MyDayHub_Config?.appURL || '';
            
            const response = await fetch(`${appURL}/api/api.php?module=encryption&action=getEncryptionStatus`, {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                }
            });
            
            const responseData = await response.json();
            if (window.MyDayHub_Config?.DEV_MODE) {
                console.log('Encryption status response:', responseData);
            }
            return responseData.data || { encryption_enabled: false };
        } catch (error) {
            console.error('Failed to check encryption status:', error);
            return { encryption_enabled: false };
        }
    }

    showWizard() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        `;
        
        modal.innerHTML = `
            <div class="modal-container encryption-setup-modal" style="
                background-color: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 0.75rem;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                z-index: 10001;
                opacity: 1;
            ">
                <div class="modal-header" style="
                    padding: 1.5rem 1.5rem 0 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 1.5rem;
                ">
                    <h2 style="
                        margin: 0 0 0.5rem 0;
                        font-size: 1.5rem;
                        color: var(--text-primary);
                    ">🔐 Enable Zero-Knowledge Encryption</h2>
                    <p style="
                        margin: 0;
                        color: var(--text-secondary);
                        font-size: 0.875rem;
                    ">Protect your private tasks with end-to-end encryption</p>
                </div>
                
                <div class="modal-body" style="padding: 0 1.5rem;">
                    <div class="setup-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
                        </div>
                        <div class="progress-text">Step ${this.currentStep} of ${this.totalSteps}</div>
                    </div>
                    
                    <div class="setup-content">
                        ${this.renderCurrentStep()}
                    </div>
                </div>
                
                <div class="modal-footer" style="
                    padding: 1.5rem;
                    border-top: 1px solid var(--border-color);
                    margin-top: 1.5rem;
                ">
                    <div class="setup-buttons">
                        ${this.renderStepButtons()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
        this.setupEventListeners();
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
        
        // Handle click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.cancelSetup();
            }
        });
        
        // Handle ESC key to close
        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                this.cancelSetup();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    }

    // ==========================================================================
    // 3. STEP RENDERING
    // ==========================================================================

    renderCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.renderSecurityQuestionsStep();
            case 2:
                return this.renderSetupCompleteStep();
            default:
                return '<div>Unknown step</div>';
        }
    }

    renderSecurityQuestionsStep() {
        return `
            <div class="setup-step security-questions-step">
                <h3>🛡️ Security Questions</h3>
                <p>Set up security questions to recover your encryption key if you forget your password.</p>
                
                <div class="security-questions-form">
                    ${this.generateSecurityQuestionsForm()}
                </div>
                
                <div class="security-info">
                    <h4>Why Security Questions?</h4>
                    <ul>
                        <li>🔒 Your data is encrypted with a key derived from your password</li>
                        <li>🚫 If you forget your password, your data is permanently lost</li>
                        <li>🛡️ Security questions provide a recovery mechanism</li>
                        <li>⚠️ Choose questions only you can answer</li>
                        <li>🌍 Create questions that are meaningful to you personally</li>
                        <li>⏰ Use questions with answers that won't change over time</li>
                    </ul>
                </div>
            </div>
        `;
    }

    renderPasswordStep() {
        return `
            <div class="setup-step password-step">
                <h3>🔑 Encryption Password</h3>
                <p>Enter a strong password to encrypt your private tasks. This password will be used to generate your encryption key.</p>
                
                <div class="password-form">
                    <div class="form-group">
                        <label for="encryption-password">Encryption Password</label>
                        <input type="password" id="encryption-password" class="form-input" 
                               placeholder="Enter a strong password" required>
                        <div class="password-strength" id="password-strength"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm-password">Confirm Password</label>
                        <input type="password" id="confirm-password" class="form-input" 
                               placeholder="Confirm your password" required>
                        <div class="password-match" id="password-match"></div>
                    </div>
                </div>
                
                <div class="password-info">
                    <h4>Password Requirements</h4>
                    <ul>
                        <li>✅ At least 12 characters long</li>
                        <li>✅ Mix of uppercase, lowercase, numbers, and symbols</li>
                        <li>✅ Not used elsewhere</li>
                        <li>✅ Easy for you to remember</li>
                    </ul>
                </div>
            </div>
        `;
    }

    renderSetupCompleteStep() {
        return `
            <div class="setup-step complete-step">
                <div class="success-icon">✅</div>
                <h3>🎉 Encryption Enabled!</h3>
                <p>Your private tasks are now protected with zero-knowledge encryption.</p>
                
                <div class="setup-summary">
                    <h4>What's Protected</h4>
                    <ul>
                        <li>🔒 All private task titles and notes</li>
                        <li>🔒 Private column titles</li>
                        <li>🔒 Your encryption keys are stored securely</li>
                        <li>🔒 Only you can decrypt your data</li>
                    </ul>
                    
                    <h4>Recovery Options</h4>
                    <ul>
                        <li>🛡️ Security questions are set up</li>
                        <li>🔄 You can recover your data if you forget your password</li>
                        <li>⚠️ Keep your password and answers secure</li>
                    </ul>
                </div>
                
                <div class="migration-status" id="migration-status">
                    <h4>📦 Migrating Existing Data</h4>
                    <p>Encrypting your existing private tasks...</p>
                    <div class="migration-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="migration-progress"></div>
                        </div>
                        <div class="progress-text" id="migration-text">Starting migration...</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================================================
    // 4. SECURITY QUESTIONS GENERATION
    // ==========================================================================

    generateSecurityQuestionsForm() {
        let html = `
            <div class="security-warning">
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                    <h4>Important: Your Responsibility</h4>
                    <p>You are creating your own security questions and answers. Choose questions that:</p>
                    <ul>
                        <li>Only you can answer</li>
                        <li>You will remember years from now</li>
                        <li>Have answers that won't change over time</li>
                        <li>Are meaningful to you personally</li>
                    </ul>
                    <p><strong>Warning:</strong> If you forget your password and cannot answer these questions correctly, your encrypted data will be permanently lost. No one can recover it for you.</p>
                </div>
            </div>
            
            <div class="questions-grid">
        `;
        
        // Create 3 custom question inputs
        for (let i = 0; i < 3; i++) {
            html += `
                <div class="question-group">
                    <label for="question-${i}">Security Question ${i + 1}</label>
                    <input type="text" id="question-${i}" class="form-input question-input" 
                           placeholder="Enter your security question..." required>
                    <label for="answer-${i}">Your Answer</label>
                    <input type="text" id="answer-${i}" class="form-input answer-input" 
                           placeholder="Enter your answer..." required>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // ==========================================================================
    // 5. EVENT HANDLERS
    // ==========================================================================

    setupEventListeners() {
        const nextBtn = this.modal.querySelector('.btn-next');
        const backBtn = this.modal.querySelector('.btn-back');
        const cancelBtn = this.modal.querySelector('.btn-cancel');
        const completeBtn = this.modal.querySelector('.btn-complete');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => this.prevStep());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelSetup());
        }

        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeSetup());
        }

        // Password strength checking
        const passwordInput = this.modal.querySelector('#encryption-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }

        // Password confirmation
        const confirmInput = this.modal.querySelector('#confirm-password');
        if (confirmInput) {
            confirmInput.addEventListener('input', (e) => this.checkPasswordMatch());
        }
    }

    async nextStep() {
        if (this.currentStep === 1) {
            // Validate security questions
            if (!await this.validateSecurityQuestions()) {
                return;
            }
            // After security questions, validate password and setup encryption
            if (!await this.validatePasswordAndSetup()) {
                return;
            }
        }

        // Don't go beyond the last step
        if (this.currentStep >= this.totalSteps) {
            return;
        }

        this.currentStep++;
        this.updateStepDisplay();
        
        if (this.currentStep === 2) {
            // Start migration
            this.startMigration();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    cancelSetup() {
        if (confirm('Are you sure you want to cancel encryption setup? Your private tasks will remain unencrypted.')) {
            this.closeWizard();
        }
    }

    completeSetup() {
        console.log('Completing encryption setup...');
        this.closeWizard();
        showToast({
            message: 'Encryption setup complete! Your private tasks are now encrypted.',
            type: 'success'
        });
    }

    // ==========================================================================
    // 6. VALIDATION METHODS
    // ==========================================================================

    async validateSecurityQuestions() {
        this.securityQuestions = [];
        this.answers = [];
        
        for (let i = 0; i < 3; i++) {
            const questionInput = this.modal.querySelector(`#question-${i}`);
            const answerInput = this.modal.querySelector(`#answer-${i}`);
            
            const question = questionInput.value.trim();
            const answer = answerInput.value.trim();
            
            if (!question) {
                showToast({
                    message: `Please enter question ${i + 1}`,
                    type: 'error'
                });
                questionInput.focus();
                return false;
            }
            
            if (!answer) {
                showToast({
                    message: `Please answer question ${i + 1}`,
                    type: 'error'
                });
                answerInput.focus();
                return false;
            }
            
            // Check for duplicate questions
            if (this.securityQuestions.includes(question)) {
                showToast({
                    message: `Question ${i + 1} is the same as another question. Please make each question unique.`,
                    type: 'error'
                });
                questionInput.focus();
                return false;
            }
            
            // Check for duplicate answers
            if (this.answers.includes(answer)) {
                showToast({
                    message: `Answer ${i + 1} is the same as another answer. Please make each answer unique.`,
                    type: 'error'
                });
                answerInput.focus();
                return false;
            }
            
            this.securityQuestions.push(question);
            this.answers.push(answer);
        }

        // Save security questions
        try {
            await window.apiFetch({
                module: 'security_questions',
                action: 'setupQuestions',
                data: {
                    questions: this.securityQuestions,
                    answers: this.answers
                }
            });

            return true;
        } catch (error) {
            showToast({
                message: 'Failed to save security questions: ' + error.message,
                type: 'error'
            });
            return false;
        }
    }

    async validatePasswordAndSetup() {
        // Get the current user's login password from session storage or prompt
        const currentPassword = await this.getCurrentUserPassword();
        
        if (!currentPassword) {
            showToast({
                message: 'Unable to retrieve current password. Please log out and log back in.',
                type: 'error'
            });
            return false;
        }

        // Setup encryption using the login password
        try {
            await this.setupEncryption(currentPassword);
            return true;
        } catch (error) {
            console.error('Encryption setup error:', error);
            
            let userMessage = 'Failed to setup encryption: ' + error.message;
            
            // Provide more helpful error messages
            if (error.message.includes('crypto.subtle is not available')) {
                userMessage = `Encryption setup failed: Web Crypto API is not available.
                
This usually happens because:
• You're not using HTTPS (required for security)
• Your browser doesn't support modern encryption
• Browser security restrictions

Solutions:
• Use HTTPS for your app
• Try a modern browser (Chrome, Firefox, Safari)
• Contact support if the issue persists`;
            } else if (error.message.includes('importKey')) {
                userMessage = `Encryption setup failed: Browser crypto API error.
                
This suggests your browser has restricted crypto access.
Try refreshing the page or using a different browser.`;
            }
            
            showToast({
                message: userMessage,
                type: 'error',
                duration: 10000 // Show longer for complex error messages
            });
            return false;
        }
    }

    async setupEncryption(password) {
        // Generate salt and derive master key
        const salt = window.cryptoManager.generateSalt();
        const masterKey = await window.cryptoManager.deriveMasterKey(password, salt);
        
        // Create recovery envelope
        const recoveryKey = await window.cryptoManager.generateRecoveryKey(this.answers);
        const recoveryEnvelope = await window.cryptoManager.createRecoveryEnvelope(masterKey, recoveryKey);
        
        // Export master key for storage (this is a simplified approach)
        const exportedMasterKey = await window.crypto.subtle.exportKey('raw', masterKey);
        const wrappedMasterKey = {
            keyData: Array.from(new Uint8Array(exportedMasterKey))
        };
        
        // Save encryption setup
        await window.apiFetch({
            module: 'encryption',
            action: 'setupEncryption',
            data: {
                wrapped_master_key: wrappedMasterKey,
                key_derivation_salt: salt,
                recovery_envelope: recoveryEnvelope,
                recovery_questions_hash: recoveryKey
            }
        });

        // Store master key for session
        window.cryptoManager.masterKey = masterKey;
    }

    // ==========================================================================
    // 7. MIGRATION PROCESS
    // ==========================================================================

    async startMigration() {
        try {
            const response = await window.apiFetch({
                module: 'encryption',
                action: 'migrateTasks'
            });

            if (response.success) {
                this.monitorMigration(response.data);
            } else {
                showToast({
                    message: 'Failed to start migration: ' + response.message,
                    type: 'error'
                });
            }
        } catch (error) {
            showToast({
                message: 'Migration error: ' + error.message,
                type: 'error'
            });
        }
    }

    async monitorMigration(initialData) {
        const progressBar = this.modal.querySelector('#migration-progress');
        const progressText = this.modal.querySelector('#migration-text');
        
        const updateProgress = async () => {
            try {
                // Use direct fetch with GET method for migration status
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                const appURL = window.MyDayHub_Config?.appURL || '';
                
                const response = await fetch(`${appURL}/api/api.php?module=encryption&action=getMigrationStatus`, {
                    method: 'GET',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    }
                });
                
                const responseData = await response.json();

                if (responseData.success) {
                    const { migration_status, tasks_migrated, total_tasks } = responseData.data;
                    
                    if (migration_status === 'completed') {
                        progressBar.style.width = '100%';
                        progressText.textContent = 'Migration completed successfully!';
                        
                        // Update the button to "Complete Setup"
                        const nextBtn = this.modal.querySelector('.btn-next');
                        if (nextBtn) {
                            nextBtn.textContent = 'Complete Setup';
                            nextBtn.className = 'btn btn-primary btn-complete';
                            nextBtn.onclick = () => this.completeSetup();
                        }
                        
                        return;
                    } else if (migration_status === 'in_progress') {
                        const progress = total_tasks > 0 ? (tasks_migrated / total_tasks) * 100 : 0;
                        progressBar.style.width = progress + '%';
                        progressText.textContent = `Migrated ${tasks_migrated} of ${total_tasks} tasks...`;
                        
                        setTimeout(updateProgress, 1000);
                    } else {
                        progressText.textContent = 'Starting migration...';
                        setTimeout(updateProgress, 2000);
                    }
                } else {
                    console.error('Failed to get migration status:', responseData.message);
                    progressText.textContent = 'Migration failed';
                }
            } catch (error) {
                console.error('Migration monitoring error:', error);
                setTimeout(updateProgress, 2000);
            }
        };

        updateProgress();
    }

    // ==========================================================================
    // 8. UTILITY METHODS
    // ==========================================================================

    isStrongPassword(password) {
        if (password.length < 12) return false;
        
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return hasUpper && hasLower && hasNumber && hasSpecial;
    }

    checkPasswordStrength(password) {
        const strengthDiv = this.modal.querySelector('#password-strength');
        if (!strengthDiv) return;

        const strength = this.calculatePasswordStrength(password);
        strengthDiv.innerHTML = `
            <div class="strength-meter">
                <div class="strength-fill" style="width: ${strength.score * 20}%; background-color: ${strength.color}"></div>
            </div>
            <div class="strength-text">${strength.text}</div>
        `;
    }

    calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

        const levels = [
            { score: 0, color: '#ef4444', text: 'Very Weak' },
            { score: 1, color: '#f97316', text: 'Weak' },
            { score: 2, color: '#eab308', text: 'Fair' },
            { score: 3, color: '#22c55e', text: 'Good' },
            { score: 4, color: '#16a34a', text: 'Strong' },
            { score: 5, color: '#15803d', text: 'Very Strong' }
        ];

        return levels[score] || levels[0];
    }

    checkPasswordMatch() {
        const password = this.modal.querySelector('#encryption-password').value;
        const confirm = this.modal.querySelector('#confirm-password').value;
        const matchDiv = this.modal.querySelector('#password-match');
        
        if (!matchDiv) return;

        if (confirm === '') {
            matchDiv.innerHTML = '';
        } else if (password === confirm) {
            matchDiv.innerHTML = '<div class="match-indicator success">✓ Passwords match</div>';
        } else {
            matchDiv.innerHTML = '<div class="match-indicator error">✗ Passwords do not match</div>';
        }
    }

    updateStepDisplay() {
        const progressFill = this.modal.querySelector('.progress-fill');
        const progressText = this.modal.querySelector('.progress-text');
        const content = this.modal.querySelector('.setup-content');

        if (progressFill) {
            progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
        }

        if (progressText) {
            progressText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
        }

        if (content) {
            content.innerHTML = this.renderCurrentStep();
            this.setupEventListeners();
        }
    }

    renderStepButtons() {
        let buttons = '';

        if (this.currentStep > 1) {
            buttons += '<button type="button" class="btn btn-secondary btn-back">← Back</button>';
        }

        if (this.currentStep < this.totalSteps) {
            buttons += '<button type="button" class="btn btn-primary btn-next">Next →</button>';
        }

        if (this.currentStep === this.totalSteps) {
            buttons += '<button type="button" class="btn btn-primary btn-complete">Complete Setup</button>';
        }

        buttons += '<button type="button" class="btn btn-text btn-cancel">Cancel</button>';

        return buttons;
    }

    showSkipEncryptionOption() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        `;
        
        modal.innerHTML = `
            <div class="modal-container encryption-setup-modal" style="
                background-color: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 0.75rem;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                max-width: 600px;
                width: 100%;
                position: relative;
                z-index: 10001;
                opacity: 1;
            ">
                <div class="modal-header" style="
                    padding: 1.5rem 1.5rem 0 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 1.5rem;
                ">
                    <h2 style="
                        margin: 0 0 0.5rem 0;
                        font-size: 1.5rem;
                        color: var(--text-primary);
                    ">🔐 Encryption Setup</h2>
                    <p style="
                        margin: 0;
                        color: var(--text-secondary);
                        font-size: 0.875rem;
                    ">Web Crypto API is not available in your current environment</p>
                </div>
                
                <div class="modal-body" style="padding: 0 1.5rem;">
                    <div class="warning-section" style="
                        background-color: #fef3c7;
                        border: 2px solid #f59e0b;
                        border-radius: 0.75rem;
                        padding: 1.5rem;
                        margin-bottom: 1.5rem;
                    ">
                        <h3 style="margin: 0 0 1rem 0; color: #92400e;">⚠️ Encryption Not Available</h3>
                        <p style="margin: 0 0 1rem 0; color: #92400e;">
                            Your browser/environment doesn't support the Web Crypto API required for zero-knowledge encryption.
                        </p>
                        <p style="margin: 0; color: #92400e; font-weight: 600;">
                            This usually happens when accessing from a network computer instead of localhost.
                        </p>
                    </div>
                    
                    <div class="options-section">
                        <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Your Options:</h3>
                        
                        <div class="option" style="
                            background-color: var(--bg-secondary);
                            border: 1px solid var(--border-color);
                            border-radius: 0.5rem;
                            padding: 1rem;
                            margin-bottom: 1rem;
                        ">
                            <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">Option 1: Set up encryption on localhost</h4>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">
                                Access the app from the computer running MyDayHub using <code>http://localhost</code> to set up encryption.
                            </p>
                        </div>
                        
                        <div class="option" style="
                            background-color: var(--bg-secondary);
                            border: 1px solid var(--border-color);
                            border-radius: 0.5rem;
                            padding: 1rem;
                            margin-bottom: 1rem;
                        ">
                            <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">Option 2: Continue without encryption</h4>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">
                                Use the app without encryption. Your private tasks will be stored as plaintext on the server.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer" style="
                    padding: 1.5rem;
                    border-top: 1px solid var(--border-color);
                    margin-top: 1.5rem;
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                ">
                    <button type="button" class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); document.body.style.overflow = '';" style="
                        background-color: #22c55e;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Continue Without Encryption
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove(); document.body.style.overflow = ''; window.open('http://localhost', '_blank');" style="
                        background-color: var(--bg-secondary);
                        color: var(--text-primary);
                        border: 1px solid var(--border-color);
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Open Localhost
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    closeWizard() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Remove ESC key listener
            if (this.escHandler) {
                document.removeEventListener('keydown', this.escHandler);
                this.escHandler = null;
            }
        }
    }
}

// ==========================================================================
// 9. GLOBAL INITIALIZATION
// ==========================================================================

// Initialize encryption setup wizard (but don't auto-trigger)
document.addEventListener('DOMContentLoaded', async () => {
    // Make encryption setup wizard globally available for on-demand use
    if (window.cryptoManager) {
        window.encryptionSetupWizard = new EncryptionSetupWizard();
        if (window.MyDayHub_Config?.DEV_MODE) {
            console.log('Encryption setup wizard ready for on-demand use');
        }
        
        // Check encryption status and show banner if needed
        await checkAndShowEncryptionBanner();
    }
});

/**
 * Check encryption status and show banner if encryption is not set up
 */
async function checkAndShowEncryptionBanner() {
    try {
        const status = await window.encryptionSetupWizard.checkEncryptionStatus();
        
        // Only show banner if encryption is not enabled and user hasn't dismissed it
        const bannerDismissed = localStorage.getItem('encryption-banner-dismissed') === 'true';
        
        if (!status.encryption_enabled && !bannerDismissed) {
            showEncryptionBanner();
        }
    } catch (error) {
        console.error('Failed to check encryption status for banner:', error);
    }
}

/**
 * Show the encryption status banner
 */
function showEncryptionBanner() {
    const banner = document.getElementById('encryption-status-banner');
    if (banner) {
        banner.classList.remove('hidden');
        
        // Add event listeners
        const setupBtn = document.getElementById('encryption-banner-setup');
        const dismissBtn = document.getElementById('encryption-banner-dismiss');
        
        if (setupBtn) {
            setupBtn.addEventListener('click', async () => {
                banner.classList.add('hidden');
                if (window.encryptionSetupWizard) {
                    await window.encryptionSetupWizard.triggerSetup();
                }
            });
        }
        
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                banner.classList.add('hidden');
                localStorage.setItem('encryption-banner-dismissed', 'true');
            });
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EncryptionSetupWizard;
}
