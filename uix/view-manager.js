/**
 * View Manager
 * 
 * Handles switching between different views (Tasks, Journal) with tab navigation
 * Persists view preference to database for cross-session synchronization
 * 
 * @version 8.0 Herradura
 */

class ViewManager {
    constructor() {
        this.currentView = 'tasks';
        this.isInitialized = false;
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadViewPreference();
        this.isInitialized = true;
    }
    
    setupEventListeners() {
        // Tab click handlers
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tab-btn') || e.target.closest('.tab-btn')) {
                const tab = e.target.closest('.tab-btn');
                const view = tab.dataset.view;
                this.switchView(view);
            }
        });
    }
    
    /**
     * Switch to a different view and persist the preference
     */
    async switchView(view) {
        this.setActiveView(view);
        await this.saveViewPreference(view);
    }
    
    /**
     * Set the active view in the UI
     */
    setActiveView(view) {
        // Update tab states
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-view="${view}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update view containers
        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.remove('active');
        });
        
        const activeContainer = document.getElementById(`${view === 'tasks' ? 'task-board-container' : 'journal-view'}`);
        if (activeContainer) {
            activeContainer.classList.add('active');
        } else {
            console.error(`Could not find container for view: ${view}`);
        }
        
        this.currentView = view;
        
        // Show/hide view-specific UI elements
        this.toggleViewSpecificElements(view);
        
        // Initialize the view if needed
        if (view === 'journal' && !window.journalView) {
            // Initialize journal view
            setTimeout(() => {
                if (window.journalView) {
                    window.journalView.renderJournalView();
                }
            }, 100);
        }
    }
    
    /**
     * Show/hide view-specific UI elements
     */
    toggleViewSpecificElements(view) {
        // Task-specific elements (show only in tasks view)
        const taskElements = [
            '#add-column-container',
            '#btn-filters',
            '#filter-menu'
        ];
        
        // Journal-specific elements (show only in journal view)
        const journalElements = [
            '#journal-controls'
        ];
        
        if (view === 'tasks') {
            // Show task elements, hide journal elements
            taskElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.remove('hidden');
                }
            });
            
            journalElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.add('hidden');
                }
            });
        } else if (view === 'journal') {
            // Hide task elements, show journal elements
            taskElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.add('hidden');
                }
            });
            
            journalElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.remove('hidden');
                }
            });
        }
    }
    
    /**
     * Load view preference from database
     * Falls back to localStorage if DB fetch fails
     */
    async loadViewPreference() {
        try {
            // First, try to get from database (synced across sessions)
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/api/api.php?module=users&action=getUserPreferences', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success' && result.data?.current_view) {
                    const savedView = result.data.current_view;
                    if (savedView === 'tasks' || savedView === 'journal') {
                        this.setActiveView(savedView);
                        return;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load view preference from database, using default:', error);
        }
        
        // Fallback to localStorage
        const localView = localStorage.getItem('mydayhub-current-view');
        if (localView && (localView === 'tasks' || localView === 'journal')) {
            this.setActiveView(localView);
        } else {
            // Default to tasks view
            this.setActiveView('tasks');
        }
    }
    
    /**
     * Save view preference to database
     * Also updates localStorage as backup
     */
    async saveViewPreference(view) {
        // Update localStorage immediately for instant feedback
        localStorage.setItem('mydayhub-current-view', view);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/api/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({
                    module: 'users',
                    action: 'saveUserPreference',
                    key: 'current_view',
                    value: view
                })
            });
            
            if (!response.ok) {
                console.warn('Failed to save view preference to database');
            }
        } catch (error) {
            console.error('Error saving view preference:', error);
            // Continue - localStorage backup is already set
        }
    }
    
    getCurrentView() {
        return this.currentView;
    }
}

// Initialize view manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.viewManager = new ViewManager();
});
