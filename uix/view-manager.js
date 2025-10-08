/**
 * View Manager
 * 
 * Handles switching between different views (Tasks, Journal) with tab navigation
 */

class ViewManager {
    constructor() {
        this.currentView = 'tasks';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setActiveView(this.currentView);
    }
    
    setupEventListeners() {
        // Tab click handlers
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tab-btn') || e.target.closest('.tab-btn')) {
                const tab = e.target.closest('.tab-btn');
                const view = tab.dataset.view;
                this.setActiveView(view);
            }
        });
    }
    
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
            console.log(`Removed active from: ${container.id}`);
        });
        
        const activeContainer = document.getElementById(`${view === 'tasks' ? 'task-board-container' : 'journal-view'}`);
        if (activeContainer) {
            activeContainer.classList.add('active');
            console.log(`Added active to: ${activeContainer.id}`);
        } else {
            console.error(`Could not find container for view: ${view}`);
        }
        
        this.currentView = view;
        
        // Initialize the view if needed
        if (view === 'journal' && !window.journalView) {
            // Initialize journal view
            setTimeout(() => {
                if (window.journalView) {
                    window.journalView.renderJournalView();
                }
            }, 100);
        }
        
        // Store current view in localStorage for persistence
        localStorage.setItem('mydayhub-current-view', view);
    }
    
    getCurrentView() {
        return this.currentView;
    }
    
    // Restore view from localStorage
    restoreView() {
        const savedView = localStorage.getItem('mydayhub-current-view');
        if (savedView && (savedView === 'tasks' || savedView === 'journal')) {
            this.setActiveView(savedView);
        }
    }
}

// Initialize view manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.viewManager = new ViewManager();
    
    // Restore saved view after a short delay to ensure all components are loaded
    setTimeout(() => {
        window.viewManager.restoreView();
    }, 500);
});
