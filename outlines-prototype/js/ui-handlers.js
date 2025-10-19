/**
 * UI Handlers - Manages UI interactions and events
 */
const UIHandlers = (() => {
    // State tracking for depth level display
    let currentDepthLevel = null; // null = fully expanded, or number for specific level

    /**
     * Initialize all UI handlers
     */
    const init = () => {
        initModals();
        initContextMenu();
        initButtons();
    };

    /**
     * Initialize modal handlers
     */
    const initModals = () => {
        const editModal = document.getElementById('edit-modal');
        const newOutlineModal = document.getElementById('new-outline-modal');
        const overlay = document.getElementById('modal-overlay');

        // Edit modal save
        document.getElementById('btn-edit-save').addEventListener('click', handleEditSave);
        document.getElementById('btn-edit-cancel').addEventListener('click', () => closeModals());
        document.getElementById('edit-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleEditSave();
        });

        // New outline modal save
        document.getElementById('btn-outline-save').addEventListener('click', handleOutlineCreate);
        document.getElementById('btn-outline-cancel').addEventListener('click', () => closeModals());
        document.getElementById('new-outline-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleOutlineCreate();
        });

        // Close on overlay click
        overlay.addEventListener('click', closeModals);

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModals();
        });
    };

    /**
     * Initialize context menu handlers
     */
    const initContextMenu = () => {
        const contextMenu = document.getElementById('context-menu');
        const menuItems = contextMenu.querySelectorAll('[data-action]');

        menuItems.forEach(item => {
            item.addEventListener('click', handleContextMenuAction);
        });

        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.node-action-btn') && !e.target.closest('.context-menu')) {
                contextMenu.style.display = 'none';
            }
        });
    };

    /**
     * Initialize button handlers
     */
    const initButtons = () => {
        document.getElementById('btn-add-root').addEventListener('click', handleAddRootNode);
        document.getElementById('btn-expand-all').addEventListener('click', handleExpandAll);
        document.getElementById('btn-collapse-all').addEventListener('click', handleCollapseAll);
        document.getElementById('btn-new-outline').addEventListener('click', handleNewOutline);
        document.getElementById('btn-home').addEventListener('click', handleHome);
    };

    /**
     * Handle edit save
     */
    const handleEditSave = () => {
        const input = document.getElementById('edit-input');
        const node = window.currentEditNode;
        const outlineId = parseInt(Storage.getActiveOutlineId());

        if (!node || !input.value.trim()) {
            closeModals();
            return;
        }

        node.title = input.value.trim();
        const outline = Storage.getOutline(outlineId);
        Storage.updateRootNodes(outlineId, outline.root_nodes);
        
        closeModals();
        renderCurrentOutline();
    };

    /**
     * Handle outline create
     */
    const handleOutlineCreate = () => {
        const input = document.getElementById('new-outline-input');
        const name = input.value.trim();

        if (!name) {
            closeModals();
            return;
        }

        const outline = Storage.createOutline(name);
        Storage.setActiveOutlineId(outline.id);
        
        closeModals();
        renderOutlinesList();
        renderCurrentOutline();
    };

    /**
     * Handle context menu action
     */
    const handleContextMenuAction = (e) => {
        const action = e.target.dataset.action;
        const node = window.currentContextNode;
        const outlineId = parseInt(Storage.getActiveOutlineId());
        const outline = Storage.getOutline(outlineId);

        if (!node) return;

        let changed = false;

        switch (action) {
            case 'add-child':
                const childTitle = prompt('Enter child node title:');
                if (childTitle) {
                    TreeModel.addChildNode(node, childTitle);
                    changed = true;
                }
                break;

            case 'promote':
                changed = TreeModel.promoteNode(outline.root_nodes, node.id);
                break;

            case 'demote':
                changed = TreeModel.demoteNode(outline.root_nodes, node.id);
                break;

            case 'fold':
                TreeModel.foldAll(node);
                changed = true;
                break;

            case 'unfold':
                TreeModel.unfoldAll(node);
                changed = true;
                break;

            case 'toggle-privacy':
                TreeModel.togglePrivacy(node);
                changed = true;
                break;

            case 'duplicate':
                TreeModel.duplicateNode(outline.root_nodes, node.id);
                changed = true;
                break;

            case 'delete':
                if (confirm(`Delete "${node.title}" and all its children?`)) {
                    TreeModel.deleteNode(outline.root_nodes, node.id);
                    changed = true;
                }
                break;
        }

        if (changed) {
            Storage.updateRootNodes(outlineId, outline.root_nodes);
            renderCurrentOutline();
        }

        document.getElementById('context-menu').style.display = 'none';
    };

    /**
     * Handle add root node
     */
    const handleAddRootNode = () => {
        const title = prompt('Enter node title:');
        if (!title) return;

        const outlineId = parseInt(Storage.getActiveOutlineId());
        if (!outlineId) return;

        const outline = Storage.getOutline(outlineId);
        TreeModel.addRootNode(outline.root_nodes, title);
        Storage.updateRootNodes(outlineId, outline.root_nodes);
        renderCurrentOutline();
    };

    /**
     * Handle expand all
     */
    const handleExpandAll = () => {
        currentDepthLevel = null; // Reset depth level tracking
        const outlineId = parseInt(Storage.getActiveOutlineId());
        const outline = Storage.getOutline(outlineId);

        if (!outline) return;

        TreeModel.expandAll(outline.root_nodes);
        Storage.updateRootNodes(outlineId, outline.root_nodes);
        renderCurrentOutline();
    };

    /**
     * Handle collapse all
     */
    const handleCollapseAll = () => {
        currentDepthLevel = null; // Reset depth level tracking
        const outlineId = parseInt(Storage.getActiveOutlineId());
        const outline = Storage.getOutline(outlineId);

        if (!outline) return;

        TreeModel.collapseAll(outline.root_nodes);
        Storage.updateRootNodes(outlineId, outline.root_nodes);
        renderCurrentOutline();
    };

    /**
     * Update depth controls based on tree structure
     */
    const updateDepthControls = (outline) => {
        const depthControls = document.getElementById('depth-controls');
        if (!outline || !outline.root_nodes) {
            depthControls.style.display = 'none';
            return;
        }

        // Calculate max depth for each checked root node
        const maxDepths = outline.root_nodes
            .filter(root => root.checked_for_toolbar !== false)
            .map(root => TreeModel.getMaxDepth([root]));

        const maxDepth = maxDepths.length > 0 ? Math.max(...maxDepths) : 0;

        if (maxDepth <= 1) {
            depthControls.style.display = 'none';
            return;
        }

        // Show depth controls
        depthControls.style.display = 'flex';

        // Remove existing buttons (keep the label)
        const buttons = depthControls.querySelectorAll('.depth-btn');
        buttons.forEach(btn => btn.remove());

        // Add buttons for each depth level
        for (let depth = 1; depth <= maxDepth; depth++) {
            const btn = document.createElement('button');
            btn.className = 'depth-btn';
            btn.textContent = depth;
            btn.title = `Expand to level ${depth}`;
            btn.addEventListener('click', () => handleDepthExpand(outline, depth));
            depthControls.appendChild(btn);
        }
    };

    /**
     * Handle depth expand with toggle behavior
     * Clicking level 3 shows only levels 1-3
     * Clicking level 3 again shows all levels (toggle back)
     */
    const handleDepthExpand = (outline, depth) => {
        const outlineId = parseInt(Storage.getActiveOutlineId());

        // Check if clicking the same level - toggle back to fully expanded
        if (currentDepthLevel === depth) {
            console.log(`🎯 Toggling OFF depth ${depth} → showing all levels`);
            currentDepthLevel = null;
            
            // Expand all checked roots fully
            outline.root_nodes.forEach(root => {
                if (root.checked_for_toolbar !== false) {
                    TreeModel.expandAll([root]);
                }
            });
        } else {
            // Set to new depth level
            console.log(`🎯 Setting depth display to level ${depth}`);
            currentDepthLevel = depth;
            
            // First collapse everything, then unfold to specific depth
            outline.root_nodes.forEach(root => {
                if (root.checked_for_toolbar !== false) {
                    // Start fresh: collapse all
                    TreeModel.collapseAll([root]);
                    // Then unfold to the target depth
                    TreeModel.unfoldToDepth([root], depth);
                }
            });
        }

        Storage.updateRootNodes(outlineId, outline.root_nodes);
        renderCurrentOutline();
    };

    /**
     * Handle new outline
     */
    const handleNewOutline = () => {
        const modal = document.getElementById('new-outline-modal');
        const input = document.getElementById('new-outline-input');
        const overlay = document.getElementById('modal-overlay');

        input.value = '';
        modal.style.display = 'block';
        overlay.style.display = 'block';
        input.focus();
    };

    /**
     * Handle home button
     */
    const handleHome = () => {
        const treeView = document.getElementById('tree-view');
        
        // Scroll to top
        treeView.scrollTo(0, 0);
        
        // Collapse all but keep outline selected
        const outlineId = parseInt(Storage.getActiveOutlineId());
        if (outlineId) {
            const outline = Storage.getOutline(outlineId);
            if (outline) {
                TreeModel.collapseAll(outline.root_nodes);
                Storage.updateRootNodes(outlineId, outline.root_nodes);
                renderCurrentOutline();
            }
        }
    };

    /**
     * Close all modals
     */
    const closeModals = () => {
        document.getElementById('edit-modal').style.display = 'none';
        document.getElementById('new-outline-modal').style.display = 'none';
        document.getElementById('modal-overlay').style.display = 'none';
        window.currentEditNode = null;
    };

    /**
     * Render current outline
     */
    const renderCurrentOutline = () => {
        const outlineId = parseInt(Storage.getActiveOutlineId());
        if (!outlineId) return;

        const outline = Storage.getOutline(outlineId);
        if (!outline) return;

        // Initialize the tree model's ID counter based on existing nodes
        TreeModel.initializeIdCounter(outline.root_nodes);

        const emptyState = document.getElementById('empty-state');
        const treeView = document.getElementById('tree-view');

        if (outline.root_nodes.length === 0) {
            treeView.style.display = 'none';
            emptyState.style.display = 'flex';
        } else {
            treeView.style.display = 'block';
            emptyState.style.display = 'none';
            TreeRender.renderTree(outline.root_nodes, outlineId);
            
            // Update depth controls based on tree structure
            updateDepthControls(outline);
            
            // After rendering, check if we need to activate edit mode for a newly created node
            if (window.nodeToEdit) {
                const editNode = window.nodeToEdit;
                window.nodeToEdit = null;
                
                // Use setTimeout to ensure DOM is fully rendered before finding the element
                setTimeout(() => {
                    const titleEl = document.querySelector(`[data-node-id="${editNode.nodeId}"] .node-title`);
                    if (titleEl) {
                        // Find the node object from the tree
                        const node = TreeRender.findNodeInTree(outline.root_nodes, editNode.nodeId);
                        if (node) {
                            TreeRender.startInlineEdit(titleEl, node, editNode.outlineId);
                        }
                    }
                }, 0);
            }
        }
    };

    /**
     * Render outlines list
     */
    const renderOutlinesList = () => {
        // Now renders to dropdown selector instead of sidebar list
        const selector = document.getElementById('outline-selector');
        const outlines = Storage.getAllOutlines();
        const activeId = parseInt(Storage.getActiveOutlineId());

        // Keep the "+ New Outline" option
        selector.innerHTML = '<option value="">+ New Outline</option>';

        outlines.forEach(outline => {
            const option = document.createElement('option');
            option.value = outline.id;
            option.textContent = outline.name;
            if (outline.id === activeId) {
                option.selected = true;
            }
            selector.appendChild(option);
        });

        // Add change event listener
        selector.onchange = (e) => {
            if (e.target.value === '') {
                // "+ New Outline" was selected
                const name = prompt('Enter outline name:');
                if (name && name.trim()) {
                    const newOutline = Storage.createOutline(name.trim());
                    Storage.setActiveOutlineId(newOutline.id);
                    renderOutlinesList();
                    renderCurrentOutline();
                }
            } else {
                Storage.setActiveOutlineId(parseInt(e.target.value));
                renderOutlinesList();
                renderCurrentOutline();
            }
        };
    };

    return {
        init,
        renderOutlinesList,
        renderCurrentOutline,
        closeModals
    };
})();
