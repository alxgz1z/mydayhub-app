/**
 * Journal View JavaScript
 * 
 * Handles the journal view functionality with horizontal date columns,
 * entry CRUD operations, and mobile-optimized navigation.
 */

class JournalView {
    constructor() {
        this.currentDate = new Date();
        this.viewMode = '3-day'; // 1-day, 3-day, 5-day
        this.hideWeekends = false;
        this.entries = new Map(); // date -> entries array
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        await this.loadPreferences();
        this.setupEventListeners();
        this.renderJournalView();
    }
    
    async loadPreferences() {
        try {
            const response = await fetch('/api/api.php?module=journal&action=getPreferences');
            const result = await response.json();
            
            if (result.status === 'success') {
                this.viewMode = result.data.view_mode;
                this.hideWeekends = result.data.hide_weekends;
            }
        } catch (error) {
            console.error('Failed to load journal preferences:', error);
        }
    }
    
    setupEventListeners() {
        // View mode toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('.journal-view-mode-btn')) {
                this.setViewMode(e.target.dataset.mode);
            }
            
            // Date navigation
            if (e.target.matches('.journal-nav-btn')) {
                const direction = e.target.dataset.direction;
                this.navigateDate(direction);
            }
            
            // Entry actions
            if (e.target.matches('.journal-entry-edit')) {
                const entryId = e.target.closest('.journal-entry-card').dataset.entryId;
                this.editEntry(entryId);
            }
            
            if (e.target.matches('.journal-entry-delete')) {
                const entryId = e.target.closest('.journal-entry-card').dataset.entryId;
                this.deleteEntry(entryId);
            }
            
            if (e.target.matches('.journal-entry-duplicate')) {
                const entryId = e.target.closest('.journal-entry-card').dataset.entryId;
                this.duplicateEntry(entryId);
            }
            
            if (e.target.matches('.journal-entry-privacy')) {
                const entryId = e.target.closest('.journal-entry-card').dataset.entryId;
                this.togglePrivacy(entryId);
            }
            
            // Entry creation
            if (e.target.matches('.journal-entry-create-btn')) {
                const date = e.target.dataset.date;
                this.createEntry(date);
            }
            
            // Entry input submission
            if (e.target.matches('.journal-entry-input')) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const date = e.target.dataset.date;
                    const title = e.target.value.trim();
                    if (title) {
                        this.createEntry(date, title);
                        e.target.value = '';
                    }
                }
            }
        });
        
        // Drag and drop for entries
        this.setupDragAndDrop();
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
        
        document.addEventListener('dragover', (e) => {
            if (e.target.matches('.journal-column')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }
        });
        
        document.addEventListener('drop', (e) => {
            if (e.target.matches('.journal-column')) {
                e.preventDefault();
                const entryId = e.dataTransfer.getData('text/plain');
                const newDate = e.target.dataset.date;
                this.moveEntry(entryId, newDate);
            }
        });
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
        const dates = [];
        const startOffset = this.getStartOffset();
        const dayCount = this.getDayCount();
        
        for (let i = 0; i < dayCount; i++) {
            const date = new Date(this.currentDate);
            date.setDate(date.getDate() + startOffset + i);
            
            // Skip weekends if hide_weekends is enabled
            if (this.hideWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
                continue;
            }
            
            dates.push(date.toISOString().split('T')[0]);
        }
        
        return dates;
    }
    
    getStartOffset() {
        switch (this.viewMode) {
            case '1-day': return 0;
            case '3-day': return -1;
            case '5-day': return -2;
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
        
        try {
            const response = await fetch(`/api/api.php?module=journal&action=getEntries&start_date=${startDate}&end_date=${endDate}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                // Group entries by date
                this.entries.clear();
                result.data.forEach(entry => {
                    const date = entry.entry_date;
                    if (!this.entries.has(date)) {
                        this.entries.set(date, []);
                    }
                    this.entries.get(date).push(entry);
                });
            }
        } catch (error) {
            console.error('Failed to load entries:', error);
        }
    }
    
    renderJournalHTML(dates) {
        const centerDate = this.getCenterDate();
        
        return `
            <div class="journal-header">
                <div class="journal-nav">
                    <button class="journal-nav-btn" data-direction="prev">‹</button>
                    <button class="journal-nav-btn" data-direction="prev-multi">‹‹</button>
                    <button class="journal-nav-btn" data-direction="next-multi">››</button>
                    <button class="journal-nav-btn" data-direction="next">›</button>
                </div>
                
                <div class="journal-view-modes">
                    <button class="journal-view-mode-btn ${this.viewMode === '1-day' ? 'active' : ''}" data-mode="1-day">1 Day</button>
                    <button class="journal-view-mode-btn ${this.viewMode === '3-day' ? 'active' : ''}" data-mode="3-day">3 Days</button>
                    <button class="journal-view-mode-btn ${this.viewMode === '5-day' ? 'active' : ''}" data-mode="5-day">5 Days</button>
                </div>
                
                <div class="journal-date-display">
                    ${this.formatDate(centerDate)}
                </div>
            </div>
            
            <div class="journal-columns">
                ${dates.map(date => this.renderDateColumn(date, centerDate)).join('')}
            </div>
        `;
    }
    
    renderDateColumn(date, centerDate) {
        const dateObj = new Date(date);
        const isCenter = date === centerDate.toISOString().split('T')[0];
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        
        return `
            <div class="journal-column ${isCenter ? 'center' : ''} ${isWeekend ? 'weekend' : ''}" data-date="${date}">
                <div class="journal-column-header">
                    <div class="journal-column-date">${this.formatDate(dateObj)}</div>
                    <div class="journal-column-day">${this.getDayName(dateObj)}</div>
                </div>
                
                <div class="journal-entries-container">
                    <!-- Entries will be populated here -->
                </div>
                
                <div class="journal-column-footer">
                    <input type="text" class="journal-entry-input" placeholder="Add journal entry..." data-date="${date}">
                    <button class="journal-entry-create-btn" data-date="${date}">+</button>
                </div>
            </div>
        `;
    }
    
    renderEntryCard(entry) {
        const isPrivate = entry.is_private;
        const hasTaskRefs = entry.has_task_references;
        
        return `
            <div class="journal-entry-card ${isPrivate ? 'private' : ''}" 
                 data-entry-id="${entry.entry_id}" 
                 draggable="true">
                
                <div class="journal-entry-header">
                    <div class="journal-entry-title" contenteditable="true">${entry.title}</div>
                    <div class="journal-entry-actions">
                        ${hasTaskRefs ? '<span class="task-ref-indicator">📋</span>' : ''}
                        ${isPrivate ? '<span class="privacy-indicator">🔒</span>' : ''}
                        <button class="journal-entry-menu">⋯</button>
                    </div>
                </div>
                
                ${entry.content ? `
                    <div class="journal-entry-content">${this.formatContent(entry.content)}</div>
                ` : ''}
                
                <div class="journal-entry-teal-bar"></div>
                
                <div class="journal-entry-menu-dropdown hidden">
                    <button class="journal-entry-edit">Edit</button>
                    <button class="journal-entry-duplicate">Duplicate</button>
                    <button class="journal-entry-privacy">${isPrivate ? 'Make Public' : 'Make Private'}</button>
                    <button class="journal-entry-delete">Delete</button>
                </div>
            </div>
        `;
    }
    
    formatContent(content) {
        // Format content with task reference links
        return content.replace(/@task\[([^\]]+)\]/g, '<span class="task-reference">@task[$1]</span>');
    }
    
    formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
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
        const offset = this.getStartOffset() + Math.floor(this.getDayCount() / 2);
        const centerDate = new Date(this.currentDate);
        centerDate.setDate(centerDate.getDate() + offset);
        return centerDate;
    }
    
    async setViewMode(mode) {
        if (this.viewMode === mode) return;
        
        this.viewMode = mode;
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
        
        this.currentDate.setDate(this.currentDate.getDate() + days);
        this.renderJournalView();
    }
    
    async createEntry(date, title = '') {
        if (!title) {
            const input = document.querySelector(`[data-date="${date}"] .journal-entry-input`);
            title = input?.value?.trim();
            if (!title) return;
        }
        
        try {
            const response = await window.apiFetch({
                module: 'journal',
                action: 'createEntry',
                entry_date: date,
                title: title,
                content: '',
                is_private: false
            });
            
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
                
                // Clear input
                const input = document.querySelector(`[data-date="${date}"] .journal-entry-input`);
                if (input) input.value = '';
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
        if (!confirm('Are you sure you want to delete this journal entry?')) {
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
            }
        } catch (error) {
            console.error('Failed to move entry:', error);
        }
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
}

// Initialize journal view when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('journal-view')) {
        window.journalView = new JournalView();
    }
});
