/**
 * Main App - Application initialization and orchestration
 */
const App = (() => {
    /**
     * Initialize DEV_MODE from query parameter
     */
    const initDevMode = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const devModeParam = urlParams.get('dev');
        
        if (devModeParam === 'true') {
            window.DEV_MODE = true;
            localStorage.setItem('outlines_dev_mode', 'true');
            console.log('✅ DEV_MODE enabled via query parameter');
        } else if (localStorage.getItem('outlines_dev_mode') === 'true') {
            window.DEV_MODE = true;
            console.log('✅ DEV_MODE restored from localStorage');
        } else {
            window.DEV_MODE = false;
            console.log('⊘ DEV_MODE disabled');
        }
        console.log('Window.DEV_MODE =', window.DEV_MODE);
    };

    /**
     * Set up keyboard shortcuts
     */
    const initKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            // Cmd+Shift+D or Ctrl+Shift+D to toggle DEV_MODE
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                window.DEV_MODE = !window.DEV_MODE;
                if (window.DEV_MODE) {
                    localStorage.setItem('outlines_dev_mode', 'true');
                    console.log('✅ DEV_MODE enabled');
                } else {
                    localStorage.removeItem('outlines_dev_mode');
                    console.log('❌ DEV_MODE disabled');
                }
                // Re-render current outline to show/hide labels
                UIHandlers.renderCurrentOutline();
            }
        });
    };

    /**
     * Initialize the application
     */
    const init = () => {
        // Check for force reset parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('force') === 'true') {
            console.log('🔴 FORCE RESET detected - clearing all storage...');
            localStorage.clear();
            // Remove the force parameter from URL
            window.history.replaceState({}, document.title, 'index.html?dev=true');
        }

        // Initialize DEV_MODE
        initDevMode();
        
        // Set up keyboard shortcuts
        initKeyboardShortcuts();

        // Initialize modules
        Storage.init();
        DND.init();
        UIHandlers.init();

        // Load or create default outline
        let outlines = Storage.getAllOutlines();
        let activeId = Storage.getActiveOutlineId();

        if (!activeId || !Storage.getOutline(parseInt(activeId))) {
            if (outlines.length === 0) {
                // Create a rich sample outline for testing
                const sampleOutline = Storage.createOutline('Product Launch Plan');
                
                let nextId = 1;
                
                // Helper to create a node with proper IDs
                const createNode = (title, parentId) => ({
                    id: nextId++,
                    title: title,
                    parent_id: parentId,
                    children: [],
                    is_private: false,
                    is_folded: false,
                    created_at: new Date().toISOString()
                });
                
                // Root Node 1: Planning Phase
                const root1 = createNode('🎯 Planning Phase', null);
                
                const marketResearch = createNode('Market Research', root1.id);
                const competitorAnalysis = createNode('Competitor Analysis', marketResearch.id);
                competitorAnalysis.children.push(
                    createNode('Feature Comparison', competitorAnalysis.id),
                    createNode('Pricing Analysis', competitorAnalysis.id)
                );
                competitorAnalysis.children[0].children.push(
                    createNode('Features vs Competitors', competitorAnalysis.children[0].id),
                    createNode('Quality Metrics', competitorAnalysis.children[0].id)
                );
                marketResearch.children.push(competitorAnalysis);
                marketResearch.children.push(createNode('Customer Interviews', marketResearch.id));
                marketResearch.children.push(createNode('Survey Analysis', marketResearch.id));
                root1.children.push(marketResearch);
                
                const budgetAlloc = createNode('Budget Allocation', root1.id);
                budgetAlloc.children.push(
                    createNode('Marketing Budget', budgetAlloc.id),
                    createNode('Development Budget', budgetAlloc.id),
                    createNode('Operations Budget', budgetAlloc.id)
                );
                root1.children.push(budgetAlloc);
                
                root1.children.push(createNode('Timeline Creation', root1.id));
                root1.children.push(createNode('Stakeholder Alignment', root1.id));
                
                // Root Node 2: Execution Phase
                const root2 = createNode('⚡ Execution Phase', null);
                
                const sprint1 = createNode('Development Sprint 1', root2.id);
                
                const backend = createNode('Backend Development', sprint1.id);
                backend.children.push(
                    createNode('API Endpoints', backend.id),
                    createNode('Database Schema', backend.id),
                    createNode('Authentication', backend.id)
                );
                sprint1.children.push(backend);
                
                const frontend = createNode('Frontend Development', sprint1.id);
                frontend.children.push(
                    createNode('UI Components', frontend.id),
                    createNode('State Management', frontend.id)
                );
                sprint1.children.push(frontend);
                
                sprint1.children.push(createNode('Testing', sprint1.id));
                root2.children.push(sprint1);
                
                root2.children.push(createNode('Marketing Campaign', root2.id));
                root2.children.push(createNode('Customer Support Setup', root2.id));
                
                sampleOutline.root_nodes.push(root1);
                sampleOutline.root_nodes.push(root2);
                Storage.updateRootNodes(sampleOutline.id, sampleOutline.root_nodes);
                Storage.setActiveOutlineId(sampleOutline.id);
            } else {
                Storage.setActiveOutlineId(outlines[0].id);
            }
        }

        // Render initial state
        UIHandlers.renderOutlinesList();
        UIHandlers.renderCurrentOutline();
    };

    return {
        init
    };
})();

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
