/**
 * DND Module - Handles drag and drop operations
 */
const DND = (() => {
    let draggedNode = null;
    let dragOverNode = null;
    let dragGhost = null;

    /**
     * Initialize drag and drop
     */
    const init = () => {
        document.addEventListener('dragstart', handleDragStart);
        document.addEventListener('dragover', handleDragOver);
        document.addEventListener('drop', handleDrop);
        document.addEventListener('dragend', handleDragEnd);
        document.addEventListener('dragenter', handleDragEnter);
        document.addEventListener('dragleave', handleDragLeave);
    };

    /**
     * Handle drag start
     */
    const handleDragStart = (e) => {
        if (!e.target.closest('.node-item')) return;
        
        draggedNode = window.draggedNode;
        if (!draggedNode) return;

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.dropEffect = 'move';

        // Create drag image
        const dragImage = document.createElement('div');
        dragImage.textContent = draggedNode.title;
        dragImage.style.position = 'absolute';
        dragImage.style.left = '-1000px';
        dragImage.style.backgroundColor = 'var(--accent-color)';
        dragImage.style.color = 'white';
        dragImage.style.padding = '8px 12px';
        dragImage.style.borderRadius = '4px';
        document.body.appendChild(dragImage);
        
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    /**
     * Handle drag enter
     */
    const handleDragEnter = (e) => {
        if (!e.target.closest('.node-item')) return;
        e.preventDefault();
    };

    /**
     * Handle drag over
     */
    const handleDragOver = (e) => {
        if (!e.target.closest('.node-item')) return;
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const nodeItem = e.target.closest('.node-item');
        if (nodeItem && dragOverNode !== nodeItem) {
            dragOverNode = nodeItem;
            nodeItem.classList.add('drop-target');
        }
    };

    /**
     * Handle drag leave
     */
    const handleDragLeave = (e) => {
        if (e.target === dragOverNode) {
            dragOverNode.classList.remove('drop-target');
            dragOverNode = null;
        }
    };

    /**
     * Handle drag end
     */
    const handleDragEnd = (e) => {
        clearDragState();
    };

    /**
     * Handle drop
     */
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedNode || !window.pendingDrop) return;

        const { draggedNode: dragged, targetNode: target } = window.pendingDrop;
        
        if (dragged.id === target.id) {
            clearDragState();
            return;
        }

        // Perform the reparenting
        const outlineId = parseInt(document.querySelector('[data-outline-id]')?.dataset.outlineId || 
                                  Storage.getActiveOutlineId());
        const outline = Storage.getOutline(outlineId);

        // Remove dragged node from its current parent
        if (dragged.parent_id !== null) {
            const parent = TreeModel.findParentNode(outline.root_nodes, dragged.id);
            if (parent) {
                parent.children = parent.children.filter(c => c.id !== dragged.id);
            }
        } else {
            outline.root_nodes = outline.root_nodes.filter(n => n.id !== dragged.id);
        }

        // Add dragged node to target as child
        dragged.parent_id = target.id;
        target.children.push(dragged);

        // Persist and re-render
        Storage.updateRootNodes(outlineId, outline.root_nodes);
        TreeRender.renderTree(outline.root_nodes, outlineId);

        clearDragState();
    };

    /**
     * Clear drag state
     */
    const clearDragState = () => {
        draggedNode = null;
        dragOverNode = null;
        window.draggedNode = null;
        window.pendingDrop = null;
        
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
    };

    return {
        init,
        clearDragState
    };
})();
