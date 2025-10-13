/**
 * Journal View JavaScript
 * 
 * Handles the journal view functionality with horizontal date columns,
 * entry CRUD operations, and mobile-optimized navigation.
 * 
 * @version 8.0 Herradura
 */

class JournalView {
    constructor() {
        // Initialize to today at noon LOCAL time to avoid timezone issues (following old code pattern)
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        this.currentDate = today;
        
        this.viewMode = '3-day'; // 1-day, 3-day, 5-day (will be adjusted for mobile)
        this.hideWeekends = false;
        this.entries = new Map(); // date -> entries array
        this.isLoading = false;
        this.isMobile = window.innerWidth < 768; // Mobile breakpoint
        
        this.init();
        this.setupResponsiveHandling();
        this.setupHeaderControls();
    }
    
    /**
     * Sets up header control event listeners
     */
    setupHeaderControls() {
        // Handle journal menu button click
        document.addEventListener('click', (e) => {
            if (e.target.matches('#btn-journal-menu') || e.target.closest('#btn-journal-menu')) {
                this.showJournalMenu();
            }
        });
        
        // Close journal menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#btn-journal-menu') && !e.target.closest('#journal-menu-popover')) {
                this.closeJournalMenu();
            }
        });
    }
    
    /**
     * Shows the journal options popover menu
     */
    showJournalMenu() {
        // Close any existing menu first
        this.closeJournalMenu();
        
        const menuButton = document.querySelector('#btn-journal-menu');
        if (!menuButton) return;
        
        const menu = document.createElement('div');
        menu.id = 'journal-menu-popover';
        menu.className = 'journal-menu-popover';
        
        // Create menu items
        const menuItems = [
            {
                id: 'journal-view-1d',
                icon: '1',
                label: '1 Day View',
                action: () => this.setViewMode('1-day'),
                active: this.viewMode === '1-day'
            }
        ];
        
        // Only add 3D and 5D options on desktop
        if (!this.isMobile) {
            menuItems.push(
                {
                    id: 'journal-view-3d',
                    icon: '3',
                    label: '3 Day View',
                    action: () => this.setViewMode('3-day'),
                    active: this.viewMode === '3-day'
                },
                {
                    id: 'journal-view-5d',
                    icon: '5',
                    label: '5 Day View',
                    action: () => this.setViewMode('5-day'),
                    active: this.viewMode === '5-day'
                }
            );
        }
        
        // Add weekends toggle
        const showWeekendsChecked = !this.hideWeekends ? 'checked' : '';
        menuItems.push({
            id: 'journal-weekends-toggle',
            icon: '',
            label: 'Show Weekends',
            action: () => {
                this.toggleWeekends();
                this.closeJournalMenu();
            },
            active: false,
            isToggle: true,
            checked: showWeekendsChecked
        });
        
        // Add navigation options
        menuItems.push(
            {
                id: 'journal-nav-prev-week',
                icon: '‹‹',
                label: 'Previous Week',
                action: () => {
                    this.closeJournalMenu();
                    this.navigateDate('prev-multi');
                },
                active: false
            },
            {
                id: 'journal-nav-next-week',
                icon: '››',
                label: 'Next Week',
                action: () => {
                    this.closeJournalMenu();
                    this.navigateDate('next-multi');
                },
                active: false
            }
        );
        
        // Always add date jump option
        menuItems.push({
            id: 'journal-date-jump',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2"/><path d="M12 12v4"/></svg>`,
            label: 'Jump to Date',
            action: () => {
                this.closeJournalMenu();
                this.showDateJumpModal();
            },
            active: false
        });
        
        const menuHTML = menuItems.map(item => {
            if (item.isToggle) {
                return `
                    <div class="filter-item">
                        <span class="filter-label">${item.label}</span>
                        <label class="switch">
                            <input type="checkbox" data-filter="showWeekends" ${item.checked}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                `;
            } else {
                return `
                    <button class="journal-menu-item ${item.active ? 'active' : ''}" data-action="${item.id}">
                        <span class="journal-menu-icon">${item.icon}</span>
                        <span class="journal-menu-label">${item.label}</span>
                    </button>
                `;
            }
        }).join('');
        
        menu.innerHTML = menuHTML;
        
        // Position the menu centered below the footer
        const buttonRect = menuButton.getBoundingClientRect();
        const menuWidth = 180;
        const menuHeight = menuItems.length * 40 + 16; // Approximate height
        
        // Center horizontally relative to the button
        let left = buttonRect.left + (buttonRect.width - menuWidth) / 2;
        let top = buttonRect.bottom + 8;
        
        // Adjust if menu would go off screen
        if (left < 8) left = 8;
        if (left + menuWidth > window.innerWidth - 8) {
            left = window.innerWidth - menuWidth - 8;
        }
        if (top + menuHeight > window.innerHeight - 8) {
            top = buttonRect.top - menuHeight - 8;
        }
        
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        
        document.body.appendChild(menu);
        
        // Add event listeners for menu items
        menu.addEventListener('click', (e) => {
            const button = e.target.closest('.journal-menu-item');
            if (!button) return;
            
            const actionId = button.dataset.action;
            const item = menuItems.find(i => i.id === actionId);
            if (item) {
                item.action();
            }
        });
        
        // Add event listener for toggle switches
        menu.addEventListener('change', (e) => {
            if (e.target.dataset.filter === 'showWeekends') {
                this.hideWeekends = !e.target.checked;
                this.savePreferences();
                this.renderJournalView();
            }
        });
        
        // Show menu with animation
        setTimeout(() => {
            menu.classList.add('visible');
        }, 10);
        
        this.journalMenu = menu;
    }
    
    /**
     * Closes the journal options popover menu
     */
    closeJournalMenu() {
        if (this.journalMenu) {
            this.journalMenu.remove();
            this.journalMenu = null;
        }
    }
    
    /**
     * Shows a modal for jumping to a specific date
     */
    showDateJumpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div id="journal-date-jump-modal-container">
                <div class="journal-date-jump-modal-header">
                    <h4>Jump to Date</h4>
                    <button class="modal-close-btn btn-icon btn-close">&times;</button>
                </div>
                <div class="journal-date-jump-modal-body">
                    <div class="date-jump-options">
                        <h6>Select Date</h6>
                        <p class="jump-instruction">Choose a date to jump to in your journal:</p>
                        
                        <div class="date-picker-section">
                            <label for="jump-date-picker" class="date-picker-label">Target Date</label>
                            <input type="date" id="jump-date-picker" class="form-control date-input">
                            <button class="btn btn-primary" id="jump-to-date-btn">Jump to Date</button>
                        </div>
                    </div>
                </div>
                <div class="journal-date-jump-modal-footer">
                    <button class="btn btn-secondary" id="cancel-jump-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => {
            modal.classList.add('visible');
            const datePicker = modal.querySelector('#jump-date-picker');
            if (datePicker) {
                datePicker.focus();
            }
        }, 10);
        
        // Set up event listeners
        const closeModal = () => {
            modal.remove();
        };
        
        const jumpToDate = async (targetDate) => {
            if (targetDate) {
                // Set the current date to the target date
                const targetDateObj = new Date(targetDate + 'T12:00:00');
                this.currentDate = targetDateObj;
                
                // Re-render the journal view
                await this.renderJournalView();
                closeModal();
                
                showToast({ message: `Jumped to ${targetDate}`, type: 'success' });
            }
        };
        
        // Date picker
        const datePicker = modal.querySelector('#jump-date-picker');
        const jumpToDateBtn = modal.querySelector('#jump-to-date-btn');
        
        // Set current date as default
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        datePicker.max = today.toISOString().split('T')[0];
        datePicker.value = this.currentDate.toISOString().split('T')[0];
        
        jumpToDateBtn.addEventListener('click', async () => {
            const selectedDate = datePicker.value;
            if (selectedDate) {
                await jumpToDate(selectedDate);
            }
        });
        
        // Add keyboard support
        datePicker.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const selectedDate = datePicker.value;
                if (selectedDate) {
                    await jumpToDate(selectedDate);
                }
            }
        });
        
        // Close modal handlers
        modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modal.querySelector('#cancel-jump-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Register modal for ESC key handling
        window.registerModal('journal-date-jump-modal', closeModal);
    }
    
    /**
     * Sets up responsive handling for mobile vs desktop view modes
     */
    setupResponsiveHandling() {
        // Handle window resize
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;
            
            // If mobile state changed, update view mode and re-render
            if (wasMobile !== this.isMobile) {
                this.updateViewModeForScreenSize();
                this.renderJournalView();
            }
        });
        
        // Set initial view mode based on screen size
        this.updateViewModeForScreenSize();
    }
    
    /**
     * Updates view mode based on current screen size
     */
    updateViewModeForScreenSize() {
        if (this.isMobile) {
            // Force single-day view on mobile
            this.viewMode = '1-day';
        } else {
            // On desktop, use saved preference or default to 3-day
            // This will be handled by loadPreferences()
        }
    }
    
    async init() {
        await this.loadPreferences();
        this.setupEventListeners();
        this.renderJournalView();
    }
    
    async loadPreferences() {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/api/api.php?module=journal&action=getPreferences', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                }
            });
            const result = await response.json();
            
            if (result.status === 'success' && result.data) {
                const savedViewMode = result.data.view_mode || '3-day';
                // Override saved preference if on mobile - force 1-day view
                this.viewMode = this.isMobile ? '1-day' : savedViewMode;
                this.hideWeekends = result.data.hide_weekends || false;
            } else {
                // Use defaults on error, respecting mobile constraint
                this.viewMode = this.isMobile ? '1-day' : '3-day';
            }
        } catch (error) {
            console.error('Failed to load journal preferences:', error);
            // Use defaults on error, respecting mobile constraint
            this.viewMode = this.isMobile ? '1-day' : '3-day';
            this.hideWeekends = false;
        }
    }
    
    setupEventListeners() {
        // Note: View mode and navigation buttons moved to footer popover
        document.addEventListener('click', (e) => {
            // Column navigation buttons
            if (e.target.matches('.journal-nav-btn')) {
                const direction = e.target.dataset.direction;
                this.navigateDate(direction);
            }
            
            // Entry menu toggle
            if (e.target.matches('.journal-entry-menu') || e.target.closest('.journal-entry-menu')) {
                e.stopPropagation();
                const menuButton = e.target.closest('.journal-entry-menu') || e.target;
                const entryCard = menuButton.closest('.journal-entry-card');
                
                // Use the same strategy as tasks view - create new element and append to body
                this.showJournalActionsMenu(menuButton);
                return;
            }
            
            // Classification band click (same pattern as tasks)
            if (e.target.matches('.journal-entry-status-band')) {
                const entryCard = e.target.closest('.journal-entry-card');
                this.showClassificationPopover(entryCard);
                return;
            }
            
            // Close journal menus when clicking outside (same pattern as tasks)
            if (!e.target.closest('.journal-entry-menu') && !e.target.closest('.journal-actions-menu')) {
                this.closeAllJournalActionMenus();
            }
            
            // Close classification popover when clicking outside
            if (!e.target.closest('#journal-classification-popover') && !e.target.closest('.journal-entry-status-band')) {
                this.closeClassificationPopover();
            }
            
            // Collapse expanded footers when clicking outside
            if (!e.target.closest('.journal-column-footer')) {
                document.querySelectorAll('.journal-column-footer.expanded').forEach(footer => {
                    footer.classList.remove('expanded');
                });
            }
            
            // Expand footer for entry creation (copied from tasks.js pattern)
            const footer = e.target.closest('.journal-column-footer');
            if (footer && !footer.classList.contains('expanded')) {
                // Collapse any other expanded footers
                document.querySelectorAll('.journal-column-footer.expanded').forEach(expandedFooter => {
                    expandedFooter.classList.remove('expanded');
                });
                
                // Expand clicked footer
                footer.classList.add('expanded');
                const input = footer.querySelector('.journal-entry-input');
                if (input) {
                    setTimeout(() => input.focus(), 100);
                }
            }
            
            // Task badge click - navigate to task
            if (e.target.matches('.task-badge') && !e.target.classList.contains('deleted')) {
                const taskId = e.target.dataset.taskId;
                const columnId = e.target.dataset.columnId;
                if (taskId && columnId) {
                    this.navigateToTask(taskId, columnId);
                }
            }
        });
        
        // Escape key to collapse footers (copied from tasks.js pattern)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.journal-column-footer.expanded').forEach(footer => {
                    footer.classList.remove('expanded');
                });
            }
        });
        
        // Entry input submission via Enter key (copied from tasks.js pattern)
        document.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && e.target.matches('.journal-entry-input')) {
                e.preventDefault();
                const input = e.target;
                const title = input.value.trim();
                const date = input.dataset.date;
                
                if (title && date) {
                    await this.createEntry(date, title);
                    input.value = '';
                    // Collapse the footer after creating entry
                    const footer = input.closest('.journal-column-footer');
                    if (footer) {
                        footer.classList.remove('expanded');
                    }
                }
            }
        });
        
        // Drag and drop for entries
        this.setupDragAndDrop();
        
        // Journal actions menu handler (separate listener like tasks view)
        document.body.addEventListener('click', async (e) => {
            const actionButton = e.target.closest('.journal-action-btn');
            if (actionButton) {
                const menu = actionButton.closest('.journal-actions-menu');
                if (!menu) return;

                const entryId = menu.dataset.entryId;
                const action = actionButton.dataset.action;

                this.closeAllJournalActionMenus();

                if (action === 'edit') {
                    this.editEntry(entryId);
                } else if (action === 'move') {
                    this.showMoveModal(entryId);
                } else if (action === 'duplicate') {
                    this.duplicateEntry(entryId);
                } else if (action === 'privacy') {
                    this.togglePrivacy(entryId);
                } else if (action === 'delete') {
                    this.deleteEntry(entryId);
                }
            }
        });
    }
    
    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.matches('.journal-entry-card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', e.target.dataset.entryId);
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target.matches('.journal-entry-card')) {
                e.target.classList.remove('dragging');
            }
        });
        
        // Enhanced dragover handler with visual feedback (matching tasks)
        document.addEventListener('dragover', (e) => {
            const entriesContainer = e.target.closest('.journal-entries-container');
            if (entriesContainer) {
                e.preventDefault();
                const draggingCard = document.querySelector('.journal-entry-card.dragging');
                if (!draggingCard) return;
                
                // Remove existing drop indicators
                entriesContainer.querySelectorAll('.drop-indicator').forEach(indicator => {
                    indicator.remove();
                });
                
                const afterElement = this.getDragAfterElement(entriesContainer, e.clientY);
                if (afterElement == null) {
                    entriesContainer.appendChild(draggingCard);
                } else {
                    entriesContainer.insertBefore(draggingCard, afterElement);
                }
                return;
            }
            
            // Handle dropping on column (for date changes)
            const columnEl = e.target.closest('.journal-column');
            if (columnEl) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                columnEl.classList.add('drop-target');
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            const columnEl = e.target.closest('.journal-column');
            if (columnEl && !columnEl.contains(e.relatedTarget)) {
                columnEl.classList.remove('drop-target');
            }
        });
        
        document.addEventListener('drop', (e) => {
            const columnEl = e.target.closest('.journal-column');
            if (columnEl) {
                e.preventDefault();
                columnEl.classList.remove('drop-target');
                const entryId = e.dataTransfer.getData('text/plain');
                const newDate = columnEl.dataset.date;
                this.moveEntry(entryId, newDate);
            }
        });
    }
    
    /**
     * Gets the element to drop a dragged element after (copied from tasks.js).
     */
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.journal-entry-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    async renderJournalView() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const journalContainer = document.getElementById('journal-view');
        if (!journalContainer) return;
        
        try {
            // Calculate date range based on view mode
            const dates = this.getDateRange();
            
            // Load entries for the date range
            await this.loadEntries(dates);
            
            // Render the view
            journalContainer.innerHTML = this.renderJournalHTML(dates);
            
            // Add entries to columns
            dates.forEach(date => {
                const column = document.querySelector(`[data-date="${date}"]`);
                if (column) {
                    const entries = this.entries.get(date) || [];
                    const entriesHTML = entries.map(entry => this.renderEntryCard(entry)).join('');
                    column.querySelector('.journal-entries-container').innerHTML = entriesHTML;
                }
            });
            
        } catch (error) {
            console.error('Failed to render journal view:', error);
            journalContainer.innerHTML = '<div class="error-message">Failed to load journal entries.</div>';
        } finally {
            this.isLoading = false;
        }
    }
    
    getDateRange() {
        const dayCount = this.getDayCount();
        const dates = [];
        
        // Use the proven approach from the previous app version
        const centerIndex = Math.floor(dayCount / 2);
        
        for (let i = 0; i < dayCount; i++) {
            const offset = i - centerIndex;
            let tempDate = new Date(this.currentDate);
            
            // Apply the offset, skipping weekends if needed
            if (offset < 0) {
                // Going backwards
                for (let j = 0; j < Math.abs(offset); j++) {
                    tempDate = this.getOffsetDate(tempDate, -1);
                }
            } else if (offset > 0) {
                // Going forwards
                for (let j = 0; j < offset; j++) {
                    tempDate = this.getOffsetDate(tempDate, 1);
                }
            }
            // offset === 0 means we're at the center (current date)
            
            // Format the date
            const year = tempDate.getFullYear();
            const month = String(tempDate.getMonth() + 1).padStart(2, '0');
            const day = String(tempDate.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
        }
        
        console.log('getDateRange result:', dates);
        return dates;
    }
    
    /**
     * Calculates a new date by adding or subtracting days, optionally skipping weekends.
     * @param {Date} baseDate The starting date.
     * @param {number} direction The direction to move (-1 for previous, 1 for next).
     * @returns {Date} The new calculated Date object.
     */
    getOffsetDate(baseDate, direction) {
        let newDate = new Date(baseDate);
        newDate.setDate(newDate.getDate() + direction);
        
        if (this.hideWeekends) {
            while (newDate.getDay() === 6 || newDate.getDay() === 0) {
                newDate.setDate(newDate.getDate() + direction);
            }
        }
        
        return newDate;
    }

    getStartOffset() {
        // Calculate offset to center the focal column
        switch (this.viewMode) {
            case '1-day': return 0; // Shows [Today]
            case '3-day': return -1; // Shows [Day-1, Today, Day+1] - focal column at index 1 (center)
            case '5-day': return -2; // Shows [Day-2, Day-1, Today, Day+1, Day+2] - focal column at index 2 (center)
            default: return -1;
        }
    }
    
    getDayCount() {
        switch (this.viewMode) {
            case '1-day': return 1;
            case '3-day': return 3;
            case '5-day': return 5;
            default: return 3;
        }
    }
    
    async loadEntries(dates) {
        if (dates.length === 0) return;
        
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        console.log('Loading entries for date range:', { startDate, endDate, dates });
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(`/api/api.php?module=journal&action=getEntries&start_date=${startDate}&end_date=${endDate}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                }
            });
            const result = await response.json();
            
            console.log('Entries API response:', result);
            
            if (result.status === 'success' && result.data) {
                // Group entries by date
                this.entries.clear();
                result.data.forEach(entry => {
                    const date = entry.entry_date;
                    if (!this.entries.has(date)) {
                        this.entries.set(date, []);
                    }
                    this.entries.get(date).push(entry);
                });
                
                console.log('Loaded entries map:', this.entries);
            }
        } catch (error) {
            console.error('Failed to load entries:', error);
            // Continue with empty entries on error
            this.entries.clear();
        }
    }
    
    renderJournalHTML(dates) {
        const centerDate = this.getCenterDate();
        return `
            <div class="journal-inner-container">
                <div class="journal-columns">
                    ${dates.map((date, index) => this.renderDateColumn(date, centerDate, index, dates.length)).join('')}
                </div>
            </div>
        `;
    }
    
    renderDateColumn(date, centerDate, index, totalCols) {
        // IMPORTANT: Append 'T12:00:00' to avoid timezone issues (same as previous app)
        const dateObj = new Date(date + 'T12:00:00');
        // Use local date string to avoid timezone issues
        const centerDateStr = `${centerDate.getFullYear()}-${String(centerDate.getMonth() + 1).padStart(2, '0')}-${String(centerDate.getDate()).padStart(2, '0')}`;
        const isCenter = date === centerDateStr;
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        
        // Debug logging
        console.log(`renderDateColumn - date: ${date}, centerDateStr: ${centerDateStr}, isCenter: ${isCenter}, index: ${index}`);
        
        // Determine navigation buttons based on column position and total columns
        let prevButton = '';
        let nextButton = '';
        
        if (totalCols === 1) {
            // Single column gets both buttons
            prevButton = `<button class="journal-nav-btn prev-btn" data-direction="prev" title="Previous Day">&lt;</button>`;
            nextButton = `<button class="journal-nav-btn next-btn" data-direction="next" title="Next Day">&gt;</button>`;
        } else {
            // Multiple columns - add buttons to outermost columns
            if (index === 0) {
                prevButton = `<button class="journal-nav-btn prev-btn" data-direction="prev" title="Previous Day">&lt;</button>`;
            }
            if (index === totalCols - 1) {
                nextButton = `<button class="journal-nav-btn next-btn" data-direction="next" title="Next Day">&gt;</button>`;
            }
        }
        
        const columnClasses = `journal-column ${isCenter ? 'center' : ''} ${isWeekend ? 'weekend' : ''}`;
        
        return `
            <div class="${columnClasses}" data-date="${date}">
                <div class="journal-column-header">
                    ${prevButton || '<div></div>'}
                    <div class="journal-header-content">
                        <div class="journal-column-date">${this.formatDate(dateObj)}</div>
                        <div class="journal-column-day">${this.getDayName(dateObj)}</div>
                    </div>
                    ${nextButton || '<div></div>'}
                </div>
                
                <div class="journal-entries-container">
                    <!-- Entries will be populated here -->
                </div>
                
                <div class="journal-column-footer" data-date="${date}">
                    <input type="text" class="journal-entry-input" placeholder="+ New Entry" data-date="${date}">
                </div>
            </div>
        `;
    }
    
    renderEntryCard(entry) {
        const isPrivate = entry.is_private;
        const hasTaskRefs = entry.has_task_references;
        const classification = entry.classification || 'support';
        
        const cardHTML = `
            <div class="journal-entry-card ${isPrivate ? 'private' : ''} classification-${classification}" 
                 data-entry-id="${entry.entry_id}" 
                 data-classification="${classification}"
                 draggable="true">
                
                <div class="journal-entry-main">
                    <div class="journal-entry-status-band"></div>
                    <div class="journal-entry-title" contenteditable="true">${entry.title}</div>
                    <div class="journal-entry-actions">
                        ${hasTaskRefs ? '<span class="task-ref-indicator" title="Has linked tasks">📋</span>' : ''}
                        ${isPrivate ? '<span class="privacy-indicator" title="Private entry">🔒</span>' : ''}
                        <button class="journal-entry-menu" aria-label="Entry actions">&vellip;</button>
                    </div>
                </div>
                
                ${entry.content ? `
                    <div class="journal-entry-content">${this.formatContent(entry.content)}</div>
                ` : ''}
                
                <div class="journal-entry-tasks-container" data-entry-id="${entry.entry_id}">
                    <!-- Task badges will be loaded here -->
                </div>
                
                <div class="journal-entry-teal-bar"></div>
            </div>
        `;
        
        // Load linked tasks asynchronously after rendering
        if (hasTaskRefs) {
            setTimeout(() => this.loadLinkedTasks(entry.entry_id), 0);
        }
        
        
        return cardHTML;
    }
    
    formatContent(content) {
        // Format content with task reference links
        return content.replace(/@task\[([^\]]+)\]/g, '<span class="task-reference">@task[$1]</span>');
    }
    
    formatDate(date) {
        if (typeof date === 'string') {
            // IMPORTANT: Append 'T12:00:00' to avoid timezone issues
            date = new Date(date + 'T12:00:00');
        }
        
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
        const day = date.getDate().toString().padStart(2, '0');
        
        return `${year}.${month}.${day}`;
    }
    
    getDayName(date) {
        return date.toLocaleString('default', { weekday: 'long' });
    }
    
    getCenterDate() {
        // currentDate represents the center date (today by default)
        // No offset needed - just return a copy
        const centerDate = new Date(this.currentDate);
        console.log('getCenterDate - this.currentDate:', this.currentDate);
        console.log('getCenterDate - centerDate:', centerDate);
        return centerDate;
    }
    
    async setViewMode(mode) {
        if (this.viewMode === mode) return;
        
        // Prevent view mode changes on mobile - always force 1-day
        if (this.isMobile) {
            this.viewMode = '1-day';
        } else {
            this.viewMode = mode;
        }
        
        // Close and reopen popover if it's currently open to update active state
        const wasPopoverOpen = !!this.journalMenu;
        if (wasPopoverOpen) {
            this.closeJournalMenu();
        }
        
        await this.savePreferences();
        this.renderJournalView();
        
        // Reopen popover with updated active state
        if (wasPopoverOpen) {
            setTimeout(() => {
                this.showJournalMenu();
            }, 100);
        }
    }
    
    /**
     * Toggles the weekends visibility setting
     */
    async toggleWeekends() {
        this.hideWeekends = !this.hideWeekends;
        
        // Save preferences and re-render - no automatic focal column adjustment
        // The user should always see today as the focal column if they want to
        await this.savePreferences();
        this.renderJournalView();
    }
    
    async navigateDate(direction) {
        let days = 0;
        
        switch (direction) {
            case 'prev':
                days = -1;
                break;
            case 'next':
                days = 1;
                break;
            case 'prev-multi':
                days = -this.getDayCount();
                break;
            case 'next-multi':
                days = this.getDayCount();
                break;
        }
        
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + days);
        newDate.setHours(12, 0, 0, 0); // Preserve noon time to avoid timezone issues
        this.currentDate = newDate;
        this.renderJournalView();
    }
    
    async createEntry(date, title = '') {
        console.log('createEntry called with:', { date, title });
        
        if (!title) {
            const input = document.querySelector(`.journal-column[data-date="${date}"] .journal-entry-input`);
            title = input?.value?.trim();
            if (!title) {
                console.warn('No title provided for journal entry');
                return;
            }
        }
        
        console.log('Creating entry with:', { date, title });
        
        try {
            const response = await window.apiFetch({
                module: 'journal',
                action: 'createEntry',
                entry_date: date,
                title: title,
                content: '',
                is_private: false
            });
            
            console.log('API response:', response);
            
            if (response.status === 'success') {
                // Add entry to local data
                if (!this.entries.has(date)) {
                    this.entries.set(date, []);
                }
                this.entries.get(date).push(response.data);
                
                // Re-render the column
                const column = document.querySelector(`[data-date="${date}"]`);
                if (column) {
                    const entries = this.entries.get(date);
                    const entriesHTML = entries.map(entry => this.renderEntryCard(entry)).join('');
                    column.querySelector('.journal-entries-container').innerHTML = entriesHTML;
                }
                
                // Clear input and collapse footer
                const input = document.querySelector(`.journal-column[data-date="${date}"] .journal-entry-input`);
                if (input) {
                    input.value = '';
                    const footer = input.closest('.journal-column-footer');
                    if (footer) {
                        footer.classList.remove('expanded');
                    }
                }
                
                // Show success message
                showToast({ message: 'Journal entry created successfully.', type: 'success' });
                
                // Update mission focus chart if visible
                if (typeof window.updateMissionFocusChart === 'function') {
                    window.updateMissionFocusChart();
                }
            }
        } catch (error) {
            console.error('Failed to create entry:', error);
        }
    }
    
    async editEntry(entryId) {
        // Implementation for entry editing
        console.log('Edit entry:', entryId);
    }
    
    async deleteEntry(entryId) {
        const confirmed = await showConfirm('Are you sure you want to delete this journal entry?');
        if (!confirmed) {
            return;
        }
        
        try {
            const response = await window.apiFetch({
                module: 'journal',
                action: 'deleteEntry',
                entry_id: entryId
            });
            
            if (response.status === 'success') {
                // Remove entry from local data
                for (const [date, entries] of this.entries.entries()) {
                    const index = entries.findIndex(entry => entry.entry_id == entryId);
                    if (index !== -1) {
                        entries.splice(index, 1);
                        
                        // Re-render the column
                        const column = document.querySelector(`[data-date="${date}"]`);
                        if (column) {
                            const entriesHTML = entries.map(entry => this.renderEntryCard(entry)).join('');
                            column.querySelector('.journal-entries-container').innerHTML = entriesHTML;
                        }
                        break;
                    }
                }
                
                // Update mission focus chart if visible
                if (typeof window.updateMissionFocusChart === 'function') {
                    window.updateMissionFocusChart();
                }
            }
        } catch (error) {
            console.error('Failed to delete entry:', error);
        }
    }
    
    async duplicateEntry(entryId) {
        try {
            const response = await window.apiFetch({
                module: 'journal',
                action: 'duplicateEntry',
                entry_id: entryId
            });
            
            if (response.status === 'success') {
                // Reload entries for the affected date
                await this.loadEntries([response.data.entry_date]);
                this.renderJournalView();
            }
        } catch (error) {
            console.error('Failed to duplicate entry:', error);
        }
    }
    
    async togglePrivacy(entryId) {
        try {
            const response = await window.apiFetch({
                module: 'journal',
                action: 'togglePrivacy',
                entry_id: entryId
            });
            
            if (response.status === 'success') {
                // Reload entries to get updated data
                const dates = this.getDateRange();
                await this.loadEntries(dates);
                this.renderJournalView();
            }
        } catch (error) {
            console.error('Failed to toggle privacy:', error);
        }
    }
    
    async moveEntry(entryId, newDate) {
        try {
            const response = await window.apiFetch({
                module: 'journal',
                action: 'moveEntry',
                entry_id: entryId,
                new_date: newDate
            });
            
            if (response.status === 'success') {
                // Reload entries for affected dates
                const dates = this.getDateRange();
                await this.loadEntries(dates);
                this.renderJournalView();
                showToast({ message: 'Entry moved successfully.', type: 'success' });
            } else {
                showToast({ message: response.message || 'Failed to move entry.', type: 'error' });
            }
        } catch (error) {
            console.error('Failed to move entry:', error);
            showToast({ message: 'Failed to move entry.', type: 'error' });
        }
    }
    
    /**
     * Shows a modal for moving an entry to a different date.
     * Includes adjacent column buttons and date picker for non-visible dates.
     */
    showMoveModal(entryId) {
        const entryCard = document.querySelector(`[data-entry-id="${entryId}"]`);
        if (!entryCard) return;
        
        const currentDate = entryCard.closest('.journal-column').dataset.date;
        const entryTitle = entryCard.querySelector('.journal-entry-title').textContent;
        
        // Create modal matching app's modal pattern
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div id="journal-move-modal-container">
                <div class="journal-move-modal-header">
                    <h4 class="modal-title">Move Entry: <span class="entry-title">"${entryTitle}"</span></h4>
                    <button class="modal-close-btn btn-icon btn-close">&times;</button>
                </div>
                <div class="journal-move-modal-body">
                    <div class="move-options">
                        <h6>Choose Target Date</h6>
                        <p class="move-instruction">Select the date to move this entry to (up to 2 days in the future):</p>
                        
                        <div class="date-picker-section">
                            <label for="move-date-picker" class="date-picker-label">Target Date</label>
                            <input type="date" id="move-date-picker" class="form-control date-input">
                            <button class="btn btn-primary" id="move-to-date-btn">Move Entry</button>
                        </div>
                        
                        <hr style="margin: 1.5rem 0; border-color: var(--border-color);">
                        
                        <h6>Quick Options</h6>
                        <div class="adjacent-dates">
                            <button class="btn btn-secondary" data-date="prev">← Previous Day</button>
                            <button class="btn btn-secondary" data-date="next">Next Day →</button>
                        </div>
                    </div>
                </div>
                <div class="journal-move-modal-footer">
                    <button class="btn btn-secondary" id="cancel-move-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => {
            modal.classList.add('visible');
            // Focus the date picker for immediate interaction
            const datePicker = modal.querySelector('#move-date-picker');
            if (datePicker) {
                datePicker.focus();
            }
        }, 10);
        
        // Set up event listeners
        const closeModal = () => {
            modal.remove();
        };
        
        const moveToDate = async (targetDate) => {
            if (targetDate === currentDate) {
                showToast({ message: 'Entry is already on this date.', type: 'info' });
                return;
            }
            
            // Validate target date is not more than 2 days in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const maxAllowed = new Date(today);
            maxAllowed.setDate(maxAllowed.getDate() + 2);
            const targetDateObj = new Date(targetDate + 'T00:00:00');
            
            if (targetDateObj > maxAllowed) {
                showToast({ message: 'Cannot move entries more than 2 days in the future.', type: 'error' });
                return;
            }
            
            await this.moveEntry(entryId, targetDate);
            closeModal();
        };
        
        // Quick move buttons
        modal.querySelectorAll('[data-date="prev"], [data-date="next"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const currentDateObj = new Date(currentDate + 'T12:00:00');
                const direction = btn.dataset.date === 'prev' ? -1 : 1;
                currentDateObj.setDate(currentDateObj.getDate() + direction);
                
                const targetDate = currentDateObj.toISOString().split('T')[0];
                await moveToDate(targetDate);
            });
        });
        
        // Date picker
        const datePicker = modal.querySelector('#move-date-picker');
        const moveToDateBtn = modal.querySelector('#move-to-date-btn');
        
        // Set max date to 2 days in the future
        const maxDate = new Date();
        maxDate.setHours(12, 0, 0, 0);
        maxDate.setDate(maxDate.getDate() + 2);
        datePicker.max = maxDate.toISOString().split('T')[0];
        datePicker.value = currentDate;
        
        moveToDateBtn.addEventListener('click', async () => {
            const selectedDate = datePicker.value;
            if (selectedDate) {
                await moveToDate(selectedDate);
            }
        });
        
        // Add keyboard support for date picker
        datePicker.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const selectedDate = datePicker.value;
                if (selectedDate) {
                    await moveToDate(selectedDate);
                }
            }
        });
        
        // Close modal handlers
        modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modal.querySelector('#cancel-move-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Register modal for ESC key handling
        window.registerModal('journal-move-modal', closeModal);
    }
    
    async loadLinkedTasks(entryId) {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(`/api/api.php?module=journal&action=getLinkedTasks&entry_id=${entryId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                }
            });
            const result = await response.json();
            
            if (result.status === 'success' && result.data && result.data.length > 0) {
                const container = document.querySelector(`.journal-entry-tasks-container[data-entry-id="${entryId}"]`);
                if (container) {
                    const tasksHTML = result.data.map(task => this.renderTaskBadge(task)).join('');
                    container.innerHTML = `<div class="journal-task-badges">${tasksHTML}</div>`;
                }
            }
        } catch (error) {
            console.error('Failed to load linked tasks:', error);
        }
    }
    
    renderTaskBadge(task) {
        const isDeleted = task.is_deleted;
        const taskClass = isDeleted ? 'task-badge deleted' : 'task-badge';
        const taskTitle = task.title || 'Untitled Task';
        const columnTitle = task.column_title || 'Unknown';
        
        return `
            <span class="${taskClass}" 
                  data-task-id="${task.task_id}" 
                  data-column-id="${task.column_id}"
                  title="${isDeleted ? 'Task deleted' : 'Click to view task in ' + columnTitle}">
                ${isDeleted ? '<s>' + taskTitle + '</s>' : taskTitle}
                ${isDeleted ? ' ❌' : ''}
            </span>
        `;
    }
    
    navigateToTask(taskId, columnId) {
        // Switch to Tasks view
        if (window.viewManager) {
            window.viewManager.switchView('tasks');
        }
        
        // Wait for view to render, then scroll and highlight task
        setTimeout(() => {
            const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskCard) {
                // Scroll into view
                taskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Add pulse highlight effect
                taskCard.classList.add('highlight-pulse');
                setTimeout(() => taskCard.classList.remove('highlight-pulse'), 2000);
            }
        }, 300);
    }
    
    async savePreferences() {
        try {
            await window.apiFetch({
                module: 'journal',
                action: 'updatePreferences',
                view_mode: this.viewMode,
                hide_weekends: this.hideWeekends
            });
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }
    
    /**
     * Closes all journal action menus (same pattern as tasks view)
     */
    closeAllJournalActionMenus() {
        document.querySelectorAll('.journal-actions-menu').forEach(menu => menu.remove());
    }
    
    /**
     * Creates and displays the journal actions menu (replicates tasks view strategy)
     */
    showJournalActionsMenu(buttonEl) {
        this.closeAllJournalActionMenus();
        const entryCard = buttonEl.closest('.journal-entry-card');
        if (!entryCard) {
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'journal-actions-menu';
        menu.dataset.entryId = entryCard.dataset.entryId;

        // Check if entry is private
        const isPrivate = entryCard.classList.contains('private');
        const privacyText = isPrivate ? 'Make Public' : 'Make Private';
        const privacyIcon = isPrivate
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

        const menuHTML = `
            <button class="journal-action-btn" data-action="edit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Edit</span>
            </button>
            <button class="journal-action-btn" data-action="move">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 9l-3 3 3 3"/>
                    <path d="M9 5l3-3 3 3"/>
                    <path d="M15 19l-3 3-3-3"/>
                    <path d="M19 15l3-3-3-3"/>
                    <path d="M2 12h20"/>
                    <path d="M12 2v20"/>
                </svg>
                <span>Move</span>
            </button>
            <button class="journal-action-btn" data-action="duplicate">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
                <span>Duplicate</span>
            </button>
            <button class="journal-action-btn" data-action="privacy">
                ${privacyIcon}
                <span>${privacyText}</span>
            </button>
            <button class="journal-action-btn" data-action="delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                <span>Delete</span>
            </button>
        `;

        menu.innerHTML = menuHTML;
        document.body.appendChild(menu);

        // Smart positioning to avoid viewport overflow (same logic as tasks view)
        const btnRect = buttonEl.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate initial position (default: below and right-aligned with button)
        let topPosition = window.scrollY + btnRect.bottom + 5;
        let leftPosition = window.scrollX + btnRect.right - menuRect.width;
        
        // Check if menu would overflow bottom of viewport
        const menuBottom = topPosition + menuRect.height;
        const viewportBottom = window.scrollY + viewportHeight;
        if (menuBottom > viewportBottom) {
            // Position above button instead
            topPosition = window.scrollY + btnRect.top - menuRect.height - 5;
        }
        
        // Check if menu would overflow right edge of viewport
        if (leftPosition < window.scrollX) {
            // Position left-aligned with button instead
            leftPosition = window.scrollX + btnRect.left;
        }
        
        // Check if menu would overflow left edge of viewport
        const menuRight = leftPosition + menuRect.width;
        const viewportRight = window.scrollX + viewportWidth;
        if (menuRight > viewportRight) {
            // Position right-aligned with button instead
            leftPosition = window.scrollX + btnRect.right - menuRect.width;
        }
        
        menu.style.top = `${topPosition}px`;
        menu.style.left = `${leftPosition}px`;

        setTimeout(() => menu.classList.add('visible'), 10);
    }
    
    /**
     * Shows a popover menu to change a journal entry's classification.
     * Based on the tasks classification system.
     */
    showClassificationPopover(entryCard) {
        this.closeClassificationPopover();

        const entryId = entryCard.dataset.entryId;
        if (!entryId) {
            return;
        }

        const popover = document.createElement('div');
        popover.id = 'journal-classification-popover';
        popover.innerHTML = `
            <button class="classification-option" data-value="signal">
                <span class="swatch classification-signal"></span> Signal
            </button>
            <button class="classification-option" data-value="support">
                <span class="swatch classification-support"></span> Support
            </button>
            <button class="classification-option" data-value="backlog">
                <span class="swatch classification-backlog"></span> Backlog
            </button>
        `;

        document.body.appendChild(popover);

        const band = entryCard.querySelector('.journal-entry-status-band');
        const rect = band.getBoundingClientRect();
        popover.style.top = `${window.scrollY + rect.top}px`;
        popover.style.left = `${window.scrollX + rect.right + 5}px`;
        

        // Add visible class after a short delay for CSS transition
        setTimeout(() => popover.classList.add('visible'), 10);

        popover.addEventListener('click', (e) => {
            const button = e.target.closest('.classification-option');
            if (button) {
                const newClassification = button.dataset.value;
                this.setJournalClassification(entryId, newClassification);
                this.closeClassificationPopover();
            }
        });
    }
    
    /**
     * Closes any open journal classification popover.
     */
    closeClassificationPopover() {
        const popover = document.getElementById('journal-classification-popover');
        if (popover) {
            popover.remove();
        }
    }
    
    /**
     * Sets a journal entry's classification via API.
     */
    async setJournalClassification(entryId, newClassification) {
        const entryCardEl = document.querySelector(`.journal-entry-card[data-entry-id="${entryId}"]`);
        try {
            const result = await window.apiFetch({
                module: 'journal',
                action: 'toggleClassification',
                entry_id: entryId,
                classification: newClassification
            });

            if (result.status === 'success') {
                const returnedClassification = result.data.new_classification;
                entryCardEl.dataset.classification = returnedClassification;
                entryCardEl.classList.remove('classification-signal', 'classification-support', 'classification-backlog');
                entryCardEl.classList.add(`classification-${returnedClassification}`);
                
                // Show success message
                showToast({ message: 'Classification updated successfully.', type: 'success' });
                
                // Update mission focus chart if visible
                if (typeof window.updateMissionFocusChart === 'function') {
                    window.updateMissionFocusChart();
                }
            } else {
                showToast({ message: result.message || 'Failed to update classification.', type: 'error' });
            }
        } catch (error) {
            console.error('Failed to update journal classification:', error);
            showToast({ message: 'Failed to update classification.', type: 'error' });
        }
    }
}

// Initialize journal view when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('journal-view')) {
        window.journalView = new JournalView();
    }
});
