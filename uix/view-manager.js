/**
 * View Manager
 *
 * Handles switching between views (Tasks, Journal, Storyboards) with tab navigation
 * Persists view preference to database for cross-session synchronization
 *
 * @version 8.7 Nosara
 */

/**
 * Every view the tab bar can show, in one place.
 *
 * This used to be two views hardcoded in four places — a container-id ternary,
 * two copies of the same preference validation, and an if/else in
 * toggleViewSpecificElements — so adding a third meant finding all four. A view
 * is now a row here: its container, the footer controls only it shows, and the
 * lazy initializer to call the first time it is opened.
 */
const VIEW_REGISTRY = {
    tasks: {
        container: 'task-board-container',
        controls: ['#add-column-container', '#btn-filters', '#filter-menu'],
        init: 'initTasksView'
    },
    journal: {
        container: 'journal-view',
        controls: ['#journal-controls'],
        init: 'initJournalView'
    },
    storyboards: {
        container: 'storyboards-view',
        controls: ['#storyboards-controls'],
        init: 'initStoryboardsView'
    }
};

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
        
        const definition = VIEW_REGISTRY[view];
        const activeContainer = definition ? document.getElementById(definition.container) : null;
        if (activeContainer) {
            activeContainer.classList.add('active');
        } else {
            console.error(`Could not find container for view: ${view}`);
        }

        this.currentView = view;

        // Show/hide view-specific UI elements
        this.toggleViewSpecificElements(view);

        // Initialize the view if needed (lazy loading)
        if (definition && typeof window[definition.init] === 'function') {
            window[definition.init]();
        }

        // Update mission focus chart after view loads (with longer delay for session)
        setTimeout(() => {
            if (typeof window.updateMissionFocusChart === 'function') {
                window.updateMissionFocusChart();
            }
        }, 500);
    }
    
    /**
     * Show/hide view-specific UI elements
     */
    toggleViewSpecificElements(view) {
        // Each view's footer controls show only while that view is active. Driven
        // off the registry so a view that owns no controls still hides the others'.
        Object.entries(VIEW_REGISTRY).forEach(([name, definition]) => {
            definition.controls.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.toggle('hidden', name !== view);
                }
            });
        });
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
                    if (VIEW_REGISTRY[savedView]) {
                        this.setActiveView(savedView);
                        return;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load view preference from database, using default:', error);
        }
        
        // Fallback to localStorage
        const localView = localStorage.getItem('signal-current-view');
        if (localView && VIEW_REGISTRY[localView]) {
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
        localStorage.setItem('signal-current-view', view);
        
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
