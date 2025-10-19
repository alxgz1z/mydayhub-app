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

        // Load or create outlines
        let outlines = Storage.getAllOutlines();
        let activeId = Storage.getActiveOutlineId();

        // If no outlines exist, create sample outlines for testing
        if (outlines.length === 0) {
            console.log('📝 Creating sample outlines for testing...');
            
            // Helper to create a node with proper IDs
            const createNode = (title, parentId, id) => ({
                id: id,
                title: title,
                parent_id: parentId,
                children: [],
                is_private: false,
                is_folded: false,
                created_at: new Date().toISOString()
            });
            
            // OUTLINE 1: Product Launch Plan
            const outline1 = Storage.createOutline('🚀 Product Launch Plan');
            let nodeId = 1;
            
            const planning = createNode('Planning Phase', null, nodeId++);
            const market = createNode('Market Research', planning.id, nodeId++);
            const competitor = createNode('Competitor Analysis', market.id, nodeId++);
            competitor.children = [
                createNode('Feature Comparison', competitor.id, nodeId++),
                createNode('Pricing Strategy', competitor.id, nodeId++)
            ];
            market.children = [competitor, createNode('Customer Surveys', market.id, nodeId++)];
            planning.children = [
                market,
                createNode('Budget Planning', planning.id, nodeId++),
                createNode('Timeline', planning.id, nodeId++)
            ];
            
            const execution = createNode('Execution Phase', null, nodeId++);
            const dev = createNode('Development', execution.id, nodeId++);
            dev.children = [
                createNode('Backend', dev.id, nodeId++),
                createNode('Frontend', dev.id, nodeId++)
            ];
            execution.children = [
                dev,
                createNode('Testing', execution.id, nodeId++),
                createNode('Launch', execution.id, nodeId++)
            ];
            
            outline1.root_nodes = [planning, execution];
            Storage.updateRootNodes(outline1.id, outline1.root_nodes);
            
            // OUTLINE 2: Fantasy World Building
            const outline2 = Storage.createOutline('🐉 Fantasy World Building');
            nodeId = 1;
            
            const world = createNode('World Overview', null, nodeId++);
            const geography = createNode('Geography', world.id, nodeId++);
            geography.children = [
                createNode('Kingdoms', geography.id, nodeId++),
                createNode('Mountains & Rivers', geography.id, nodeId++),
                createNode('Magical Regions', geography.id, nodeId++)
            ];
            const creatures = createNode('Creatures', world.id, nodeId++);
            creatures.children = [
                createNode('Dragons', creatures.id, nodeId++),
                createNode('Elves', creatures.id, nodeId++),
                createNode('Dwarves', creatures.id, nodeId++)
            ];
            world.children = [geography, creatures, createNode('Magic System', world.id, nodeId++)];
            
            const characters = createNode('Character Profiles', null, nodeId++);
            const hero = createNode('Hero: Aragorn', characters.id, nodeId++);
            hero.children = [
                createNode('Backstory', hero.id, nodeId++),
                createNode('Powers', hero.id, nodeId++),
                createNode('Relationships', hero.id, nodeId++)
            ];
            characters.children = [
                hero,
                createNode('Villain: Dark Lord', characters.id, nodeId++),
                createNode('Allies', characters.id, nodeId++)
            ];
            
            outline2.root_nodes = [world, characters];
            Storage.updateRootNodes(outline2.id, outline2.root_nodes);
            
            // OUTLINE 3: Research Project
            const outline3 = Storage.createOutline('🔬 AI Research Project');
            nodeId = 1;
            
            const research = createNode('Research Goals', null, nodeId++);
            const literature = createNode('Literature Review', research.id, nodeId++);
            literature.children = [
                createNode('Transformer Models', literature.id, nodeId++),
                createNode('Attention Mechanisms', literature.id, nodeId++),
                createNode('Recent Papers', literature.id, nodeId++)
            ];
            research.children = [
                literature,
                createNode('Hypothesis', research.id, nodeId++),
                createNode('Methodology', research.id, nodeId++)
            ];
            
            const experiments = createNode('Experiments', null, nodeId++);
            const exp1 = createNode('Experiment 1: Baseline', experiments.id, nodeId++);
            exp1.children = [
                createNode('Setup', exp1.id, nodeId++),
                createNode('Results', exp1.id, nodeId++),
                createNode('Analysis', exp1.id, nodeId++)
            ];
            experiments.children = [
                exp1,
                createNode('Experiment 2: Optimized', experiments.id, nodeId++),
                createNode('Comparative Analysis', experiments.id, nodeId++)
            ];
            
            outline3.root_nodes = [research, experiments];
            Storage.updateRootNodes(outline3.id, outline3.root_nodes);
            
            console.log('✅ Created 3 sample outlines');
            
            // Don't auto-select - let user choose
            activeId = null;
        }

        // If we have a valid active ID, use it; otherwise don't auto-select
        if (activeId && Storage.getOutline(parseInt(activeId))) {
            Storage.setActiveOutlineId(activeId);
        } else {
            // Clear active ID so dropdown shows empty state
            Storage.setActiveOutlineId(null);
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
