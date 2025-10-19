/**
 * TreeRender - Handles rendering of tree nodes
 */
const TreeRender = (() => {
    /**
     * Helper to create SVG icon button
     */
    const createIconButton = (svgPath, tooltip, onClick) => {
        const btn = document.createElement('button');
        btn.className = 'node-action-btn';
        btn.title = tooltip;
        btn.setAttribute('data-tooltip', tooltip);
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', svgPath);
        svg.appendChild(path);
        
        btn.appendChild(svg);
        btn.addEventListener('click', onClick);
        return btn;
    };

    /**
     * Find the parent container of a node's siblings
     */
    const findSiblingContainer = (nodeEl) => {
        // The node-item is in a node-children container (or tree-view for root)
        const container = nodeEl.closest('.node-children, #tree-view');
        console.log('findSiblingContainer:', {
            nodeId: nodeEl.dataset.nodeId,
            containerClass: container?.className,
            containerId: container?.id,
            containerFound: !!container
        });
        return container;
    };

    /**
     * Get all sibling node-items
     */
    const getSiblingNodes = (nodeEl) => {
        const container = findSiblingContainer(nodeEl);
        if (!container) {
            console.log('getSiblingNodes: no container found');
            return [];
        }
        const siblings = Array.from(container.querySelectorAll(':scope > [data-node-id]'));
        console.log('getSiblingNodes:', {
            nodeId: nodeEl.dataset.nodeId,
            container: container.className || container.id,
            siblingCount: siblings.length,
            siblingIds: siblings.map(s => s.dataset.nodeId)
        });
        return siblings;
    };

    /**
     * Find next sibling node or first sibling if at end
     */
    const getNextSibling = (nodeEl) => {
        const siblings = getSiblingNodes(nodeEl);
        const currentNodeId = nodeEl.dataset.nodeId;
        const currentIndex = siblings.findIndex(s => s.dataset.nodeId === currentNodeId);
        
        if (currentIndex === -1) {
            console.log('❌ getNextSibling: current node not found in siblings!');
            return null;
        }
        
        // Go to next, wrap around to first
        const nextIndex = (currentIndex + 1) % siblings.length;
        const nextNode = siblings[nextIndex];
        
        console.log('→ TAB NAVIGATION:', {
            from: `${currentNodeId} (index ${currentIndex})`,
            to: `${nextNode.dataset.nodeId} (index ${nextIndex})`,
            wrapping: nextIndex === 0 ? '↻ WRAPPED TO FIRST' : 'moving right',
            totalSiblings: siblings.length
        });
        
        return nextNode;
    };

    /**
     * Find previous sibling node or last sibling if at start
     */
    const getPreviousSibling = (nodeEl) => {
        const siblings = getSiblingNodes(nodeEl);
        const currentNodeId = nodeEl.dataset.nodeId;
        const currentIndex = siblings.findIndex(s => s.dataset.nodeId === currentNodeId);
        
        if (currentIndex === -1) {
            console.log('❌ getPreviousSibling: current node not found in siblings!');
            return null;
        }
        
        // Go to previous, wrap around to last
        const prevIndex = (currentIndex - 1 + siblings.length) % siblings.length;
        const prevNode = siblings[prevIndex];
        
        console.log('← SHIFT+TAB NAVIGATION:', {
            from: `${currentNodeId} (index ${currentIndex})`,
            to: `${prevNode.dataset.nodeId} (index ${prevIndex})`,
            wrapping: prevIndex === siblings.length - 1 ? '↻ WRAPPED TO LAST' : 'moving left',
            totalSiblings: siblings.length
        });
        
        return prevNode;
    };

    /**
     * Get first child node if exists and visible
     */
    const getFirstChild = (nodeEl) => {
        const childrenContainer = nodeEl.querySelector('.node-children');
        if (!childrenContainer) return null;
        
        const firstChild = childrenContainer.querySelector(':scope > [data-node-id]');
        return firstChild || null;
    };

    /**
     * Focus a node and start editing its title
     */
    const focusAndEditNode = (nodeEl) => {
        if (!nodeEl) {
            console.log('❌ focusAndEditNode: nodeEl is null');
            return;
        }
        
        const titleEl = nodeEl.querySelector('.node-title');
        if (!titleEl) {
            console.log('❌ focusAndEditNode: titleEl not found');
            return;
        }
        if (titleEl.contentEditable === 'true') {
            console.log('⚠️ focusAndEditNode: already editing');
            return;
        }
        
        const nodeId = parseInt(nodeEl.dataset.nodeId);
        const outlineId = parseInt(nodeEl.parentElement.closest('[data-outline-id]')?.dataset.outlineId || 
                                  nodeEl.parentElement.closest('[data-outlineId]')?.dataset.outlineId ||
                                  Storage.getActiveOutlineId());
        
        // Get fresh node reference
        const outline = Storage.getOutline(outlineId);
        if (!outline) {
            console.log('❌ focusAndEditNode: outline not found');
            return;
        }
        
        const node = TreeModel.findNode(outline.root_nodes, nodeId);
        if (!node) {
            console.log('❌ focusAndEditNode: node not found in tree');
            return;
        }
        
        console.log('✏️ Starting edit on node:', node.id, '→', node.title);
        
        // Start editing
        startInlineEdit(titleEl, node, outlineId);
    };

    /**
     * Start inline editing of node title
     */
    const startInlineEdit = (titleEl, node, outlineId) => {
        const originalText = titleEl.textContent;
        const nodeEl = titleEl.closest('.node-item');
        
        // Make title editable
        titleEl.contentEditable = 'true';
        titleEl.classList.add('editing');
        titleEl.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(titleEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        
        // Handle blur (save on blur)
        const handleBlur = () => {
            finishInlineEdit(titleEl, node, outlineId, originalText);
        };
        
        // Handle keyboard events including TAB navigation
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishInlineEdit(titleEl, node, outlineId, originalText);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelInlineEdit(titleEl, originalText);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                
                console.log('🔄 TAB pressed while editing node:', node.id);
                
                // Save changes first
                finishInlineEdit(titleEl, node, outlineId, originalText);
                
                // Remove listeners before navigating
                titleEl.removeEventListener('blur', handleBlur);
                titleEl.removeEventListener('keydown', handleKeyDown);
                
                // Find next/previous sibling
                let nextNode = null;
                if (e.shiftKey) {
                    // SHIFT+TAB: go to previous sibling
                    nextNode = getPreviousSibling(nodeEl);
                } else {
                    // TAB: go to next sibling
                    nextNode = getNextSibling(nodeEl);
                }
                
                if (nextNode) {
                    // Auto-focus and enter edit mode on the new node
                    setTimeout(() => {
                        focusAndEditNode(nextNode);
                    }, 0);
                } else {
                    console.log('❌ No next sibling found');
                }
            }
        };
        
        titleEl.addEventListener('blur', handleBlur, { once: true });
        titleEl.addEventListener('keydown', handleKeyDown);
        
        // Store handlers for cleanup
        titleEl.dataset.handleBlur = handleBlur;
        titleEl.dataset.handleKeyDown = handleKeyDown;
    };

    /**
     * Finish inline editing and save changes
     */
    const finishInlineEdit = (titleEl, node, outlineId, originalText) => {
        const newText = titleEl.textContent.trim();
        
        // Remove contentEditable
        titleEl.contentEditable = 'false';
        titleEl.classList.remove('editing');
        
        // Only save if text changed and is not empty
        if (newText && newText !== originalText) {
            const outline = Storage.getOutline(outlineId);
            if (!outline) return;
            
            // Get fresh node reference
            const freshNode = TreeModel.findNode(outline.root_nodes, node.id);
            if (freshNode) {
                freshNode.title = newText;
                Storage.updateRootNodes(outlineId, outline.root_nodes);
                // Re-render just this node to reflect changes
                titleEl.textContent = newText;
            }
        } else {
            // Revert if empty
            titleEl.textContent = originalText;
        }
    };

    /**
     * Cancel inline editing
     */
    const cancelInlineEdit = (titleEl, originalText) => {
        titleEl.contentEditable = 'false';
        titleEl.classList.remove('editing');
        titleEl.textContent = originalText;
    };

    /**
     * Render the entire tree
     */
    const renderTree = (tree, outlineId) => {
        const container = document.getElementById('tree-view');
        container.innerHTML = '';

        if (!tree || tree.length === 0) {
            return;
        }

        const treeFragment = document.createDocumentFragment();
        tree.forEach(node => {
            treeFragment.appendChild(renderNode(node, outlineId, 0, tree));
        });
        container.appendChild(treeFragment);
    };

    /**
     * Render a single node
     */
    const renderNode = (node, outlineId, depth, tree) => {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'tree-node';
        nodeEl.dataset.nodeId = node.id;
        nodeEl.dataset.outlineId = outlineId;

        // Node item (card)
        const itemEl = document.createElement('div');
        itemEl.className = 'node-item';
        itemEl.dataset.nodeId = node.id;
        itemEl.dataset.parentId = node.parent_id === null ? 'null' : node.parent_id;
        itemEl.dataset.depth = depth;
        itemEl.style.setProperty('--depth', depth);
        itemEl.tabIndex = 0; // Make focusable
        
        // Handle keyboard navigation on the card itself
        itemEl.addEventListener('keydown', (e) => {
            // Only handle Tab when NOT already editing
            const titleEl = itemEl.querySelector('.node-title');
            if (titleEl && titleEl.contentEditable !== 'true' && e.key === 'Tab') {
                e.preventDefault();
                
                // Auto-enter edit mode
                focusAndEditNode(itemEl);
            }
        });
        
        // Handle focus to show focus state
        itemEl.addEventListener('focus', (e) => {
            itemEl.classList.add('focused');
        });
        
        itemEl.addEventListener('blur', (e) => {
            itemEl.classList.remove('focused');
        });

        // Drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'node-drag-handle';
        dragHandle.title = 'Drag to move node';
        itemEl.appendChild(dragHandle);

        // Node content (title area)
        const contentEl = document.createElement('div');
        contentEl.className = 'node-content';

        // Child count badge (on the left)
        if (node.children.length > 0) {
            const badgeEl = document.createElement('span');
            badgeEl.className = 'node-badge';
            badgeEl.textContent = node.children.length;
            contentEl.appendChild(badgeEl);
        }

        // Node title
        const titleEl = document.createElement('span');
        titleEl.className = 'node-title';
        titleEl.textContent = node.title;
        titleEl.dataset.nodeId = node.id;
        titleEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startInlineEdit(titleEl, node, outlineId);
        });
        contentEl.appendChild(titleEl);

        itemEl.appendChild(contentEl);

        // Root node checkbox (controls toolbar applicability)
        if (node.parent_id === null) {
            const checkboxEl = document.createElement('div');
            checkboxEl.className = 'node-root-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = node.checked_for_toolbar !== false; // Default to true
            checkbox.title = 'Include/exclude this hierarchy from toolbar controls';
            checkbox.addEventListener('change', (e) => {
                node.checked_for_toolbar = checkbox.checked;
                console.log(`✓ Root node ${node.id} toolbar control: ${checkbox.checked}`);
            });
            
            const label = document.createElement('label');
            label.textContent = 'Apply toolbar';
            label.style.marginLeft = '6px';
            label.style.cursor = 'pointer';
            label.style.fontSize = '12px';
            label.style.color = 'var(--text-secondary)';
            label.addEventListener('click', () => {
                checkbox.click();
            });
            
            checkboxEl.appendChild(checkbox);
            checkboxEl.appendChild(label);
            itemEl.appendChild(checkboxEl);
        }

        // Node actions - Footer controls (always visible)
        const actionsEl = document.createElement('div');
        actionsEl.className = 'node-actions';

        // Add Child button
        const addChildBtn = createIconButton(
            'M12 5v14M5 12h14',
            'Add Child Node',
            (e) => {
                e.stopPropagation();
                onContextMenuAction(e, 'add-child', node, outlineId);
            }
        );
        actionsEl.appendChild(addChildBtn);

        // Add Sibling button (only for non-root nodes)
        if (node.parent_id !== null) {
            const addSiblingBtn = createIconButton(
                'M12 5v14M5 12h14M18 8v8M22 12h-8',
                'Add Sibling Node',
                (e) => {
                    e.stopPropagation();
                    onContextMenuAction(e, 'add-sibling', node, outlineId);
                }
            );
            actionsEl.appendChild(addSiblingBtn);
        }

        // Promote/Move buttons - different based on root vs nested
        if (node.parent_id === null) {
            // Root nodes: Move left/right buttons
            const moveLeftBtn = createIconButton(
                'M15 19l-7-7 7-7',
                'Move left',
                (e) => {
                    e.stopPropagation();
                    onContextMenuAction(e, 'move-left', node, outlineId);
                }
            );
            actionsEl.appendChild(moveLeftBtn);
            
            const moveRightBtn = createIconButton(
                'M9 5l7 7-7 7',
                'Move right',
                (e) => {
                    e.stopPropagation();
                    onContextMenuAction(e, 'move-right', node, outlineId);
                }
            );
            actionsEl.appendChild(moveRightBtn);
        } else {
            // Nested nodes: Promote button
            const promoteBtn = createIconButton(
                'M7 14l5-5 5 5M7 10l5-5 5 5',
                'Move to parent level (promote)',
                (e) => {
                    e.stopPropagation();
                    onContextMenuAction(e, 'promote', node, outlineId);
                }
            );
            actionsEl.appendChild(promoteBtn);
        }

        // Demote button (only for nested nodes, not first sibling)
        if (node.parent_id !== null) {
            const demoteBtn = createIconButton(
                'M7 10l5 5 5-5M7 14l5 5 5-5',
                'Move under previous sibling (demote)',
                (e) => {
                    e.stopPropagation();
                    onContextMenuAction(e, 'demote', node, outlineId);
                }
            );
            actionsEl.appendChild(demoteBtn);
        }

        // Fold/Unfold button (always visible if has children)
        if (node.children.length > 0) {
            const foldBtn = createIconButton(
                node.is_folded ? 'M5 12l7 7 7-7' : 'M19 12l-7-7-7 7',
                node.is_folded ? 'Expand children' : 'Collapse children',
                (e) => {
                    e.stopPropagation();
                    onContextMenuAction(e, node.is_folded ? 'unfold' : 'fold', node, outlineId);
                }
            );
            actionsEl.appendChild(foldBtn);
        }

        // Duplicate button
        const duplicateBtn = createIconButton(
            'M8 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v3m-5 4h9a2 2 0 012 2v9a2 2 0 01-2 2h-9a2 2 0 01-2-2v-9a2 2 0 012-2z',
            'Duplicate this branch',
            (e) => {
                e.stopPropagation();
                onContextMenuAction(e, 'duplicate', node, outlineId);
            }
        );
        actionsEl.appendChild(duplicateBtn);

        // Delete button
        const deleteBtn = createIconButton(
            'M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 4v6m4-6v6m5-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3H4v2h16V7h-3z',
            'Delete this node and all children',
            (e) => {
                e.stopPropagation();
                onContextMenuAction(e, 'delete', node, outlineId);
            }
        );
        deleteBtn.classList.add('danger');
        actionsEl.appendChild(deleteBtn);

        // DEV_MODE label badge
        if (window.DEV_MODE && node.parent_id !== null) {
            const label = DevLabels.getLabelForNode(tree, node);
            console.log(`🏷️  DEV_MODE badge check for node ${node.id}: label="${label}", parent_id=${node.parent_id}`);
            if (label) {
                const labelEl = document.createElement('span');
                labelEl.className = 'node-dev-label';
                labelEl.textContent = label;
                actionsEl.appendChild(labelEl);
                console.log(`✅ Badge added: ${label}`);
            }
        } else if (!window.DEV_MODE) {
            console.log(`⊘ DEV_MODE is off`);
        } else if (node.parent_id === null) {
            console.log(`⊘ Node ${node.id} is root (no label)`);
        }

        itemEl.appendChild(actionsEl);

        nodeEl.appendChild(itemEl);

        // Children container - Vertical column (siblings stack here)
        if (node.children.length > 0) {
            const childrenEl = document.createElement('div');
            childrenEl.className = `node-children ${node.is_folded ? 'collapsed' : ''}`;

            // Wrap each child in its own tree-node for proper layout
            node.children.forEach(child => {
                childrenEl.appendChild(renderNode(child, outlineId, depth + 1, tree));
            });

            nodeEl.appendChild(childrenEl);
            
            // Dynamically resize item to fit children
            // Use a ResizeObserver to update width when children change
            const updateItemWidth = () => {
                // Use requestAnimationFrame to batch layout calculations
                requestAnimationFrame(() => {
                    const childrenRect = childrenEl.getBoundingClientRect();
                    const itemRect = itemEl.getBoundingClientRect();
                    
                    // If children are wider than the item, expand the item
                    // Otherwise, let it shrink back to content size
                    if (childrenRect.width > 0) {
                        const childrenWidth = childrenEl.scrollWidth;
                        itemEl.style.minWidth = `${childrenWidth}px`;
                    }
                });
            };
            
            // Update on initial render and when children container resizes
            setTimeout(updateItemWidth, 0);
            
            // Use ResizeObserver to watch for changes in children layout
            const observer = new ResizeObserver(updateItemWidth);
            observer.observe(childrenEl);
            
            // Cleanup observer when element is removed
            nodeEl._resizeObserver = observer;
        }

        // Add drag support only for non-root nodes
        if (node.parent_id !== null) {
            itemEl.draggable = true;
            itemEl.addEventListener('dragstart', (e) => onDragStart(e, node));
            itemEl.addEventListener('dragover', (e) => onDragOver(e, node));
            itemEl.addEventListener('drop', (e) => onDrop(e, node));
            itemEl.addEventListener('dragend', (e) => onDragEnd(e));
            itemEl.addEventListener('dragleave', (e) => onDragLeave(e, itemEl));
        } else {
            // Root nodes: only accept drops, don't allow dragging
            itemEl.addEventListener('dragover', (e) => onDragOver(e, node));
            itemEl.addEventListener('drop', (e) => onDrop(e, node));
        }

        return nodeEl;
    };

    /**
     * Update a node's rendering
     */
    const updateNodeRender = (node, outlineId) => {
        const container = document.getElementById('tree-view');
        const nodeEl = container.querySelector(`[data-node-id="${node.id}"]`);
        
        if (nodeEl) {
            const parent = nodeEl.parentElement;
            const outline = Storage.getOutline(outlineId);
            const tree = outline ? outline.root_nodes : [];
            const newEl = renderNode(node, outlineId, 0, tree);
            parent.replaceChild(newEl, nodeEl);
        }
    };

    /**
     * Toggle node expand/collapse
     */
    const onToggleNode = (node, itemEl) => {
        TreeModel.toggleFold(node);
        
        const toggle = itemEl.querySelector('.node-toggle');
        toggle.classList.toggle('expanded');
        
        const childrenEl = itemEl.parentElement.querySelector('.node-children');
        if (childrenEl) {
            childrenEl.classList.toggle('collapsed');
        }

        // Persist changes
        const outlineId = parseInt(itemEl.parentElement.dataset.outlineId);
        const outline = Storage.getOutline(outlineId);
        Storage.updateRootNodes(outlineId, outline.root_nodes);
    };

    /**
     * Show context menu
     */
    const onShowContextMenu = (e, node) => {
        const menu = document.getElementById('context-menu');
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.style.display = 'block';

        // Store reference to current node
        window.currentContextNode = node;

        // Update menu items based on node state
        const togglePrivacyBtn = menu.querySelector('[data-action="toggle-privacy"]');
        togglePrivacyBtn.textContent = node.is_private ? 'Make Public' : 'Make Private';

        const demoteBtn = menu.querySelector('[data-action="demote"]');
        demoteBtn.style.display = node.parent_id !== null ? 'block' : 'none';

        const promoteBtn = menu.querySelector('[data-action="promote"]');
        promoteBtn.style.display = node.parent_id !== null ? 'block' : 'none';
    };

    /**
     * Handle context menu action directly from render buttons
     */
    const onContextMenuAction = (e, action, node, outlineId) => {
        console.log(`📋 ACTION: "${action}" on node ${node.id} (${node.title})`);
        
        const outline = Storage.getOutline(outlineId);

        if (!node || !outline) {
            console.log(`   ❌ Missing node or outline`);
            return;
        }

        // Get fresh reference to the node from the tree
        const freshNode = TreeModel.findNode(outline.root_nodes, node.id);
        if (!freshNode) {
            console.log(`   ❌ Could not find fresh node reference`);
            return;
        }

        let changed = false;

        switch (action) {
            case 'add-child':
                // Create new child with placeholder title
                const newChild = TreeModel.addChildNode(freshNode, '<add title>');
                changed = true;
                // Queue for edit mode after render
                window.nodeToEdit = { nodeId: newChild.id, outlineId };
                break;

            case 'add-sibling':
                // Create new sibling with placeholder title
                const newSibling = TreeModel.addSiblingNode(outline.root_nodes, freshNode, '<add title>');
                changed = true;
                // Queue for edit mode after render
                window.nodeToEdit = { nodeId: newSibling.id, outlineId };
                break;

            case 'promote':
                console.log(`   🔼 PROMOTE ACTION TRIGGERED`);
                changed = TreeModel.promoteNode(outline.root_nodes, freshNode.id);
                console.log(`   Result: changed=${changed}`);
                
                // Auto-expand parent after promotion
                if (changed) {
                    const parentNode = TreeModel.findParentNode(outline.root_nodes, freshNode.id);
                    if (parentNode) {
                        console.log(`   Auto-expanding parent after promote: ${parentNode.title}`);
                        parentNode.is_folded = false;
                    }
                }
                break;

            case 'demote':
                console.log(`   🔽 DEMOTE ACTION TRIGGERED`);
                changed = TreeModel.demoteNode(outline.root_nodes, freshNode.id);
                console.log(`   Result: changed=${changed}`);
                break;

            case 'fold':
                console.log(`   📦 FOLD: Collapsing node ${freshNode.id}`);
                freshNode.is_folded = true;
                changed = true;
                break;

            case 'unfold':
                console.log(`   📦 UNFOLD: Expanding node ${freshNode.id}`);
                freshNode.is_folded = false;
                changed = true;
                break;

            case 'duplicate':
                TreeModel.duplicateNode(outline.root_nodes, freshNode.id);
                changed = true;
                break;

            case 'delete':
                if (confirm(`Delete "${freshNode.title}" and all its children?`)) {
                    TreeModel.deleteNode(outline.root_nodes, freshNode.id);
                    changed = true;
                }
                break;

            case 'move-left':
                // Move root node left (decrease index)
                const leftIndex = outline.root_nodes.findIndex(n => n.id === freshNode.id);
                if (leftIndex > 0) {
                    // Swap with previous node
                    [outline.root_nodes[leftIndex - 1], outline.root_nodes[leftIndex]] = 
                    [outline.root_nodes[leftIndex], outline.root_nodes[leftIndex - 1]];
                    changed = true;
                }
                break;

            case 'move-right':
                // Move root node right (increase index)
                const rightIndex = outline.root_nodes.findIndex(n => n.id === freshNode.id);
                if (rightIndex < outline.root_nodes.length - 1) {
                    // Swap with next node
                    [outline.root_nodes[rightIndex + 1], outline.root_nodes[rightIndex]] = 
                    [outline.root_nodes[rightIndex], outline.root_nodes[rightIndex + 1]];
                    changed = true;
                }
                break;
        }

        if (changed) {
            Storage.updateRootNodes(outlineId, outline.root_nodes);
            UIHandlers.renderCurrentOutline();
        }
    };

    /**
     * Detect which zone the mouse is in relative to a card element
     * Returns: 'left', 'center', or 'right'
     */
    const detectDropZone = (nodeItem, e) => {
        const rect = nodeItem.getBoundingClientRect();
        const cardWidth = rect.width;
        const relativeX = e.clientX - rect.left;
        
        // Define zone widths based on spacing (roughly 1/5 of card width on each side)
        const zonePadding = Math.max(cardWidth * 0.15, 24); // Min 24px, scales with card
        
        if (relativeX < zonePadding) {
            return 'left';
        } else if (relativeX > cardWidth - zonePadding) {
            return 'right';
        } else {
            return 'center';
        }
    };

    /**
     * Drag start handler - mark the node being dragged
     */
    const onDragStart = (e, node) => {
        // Prevent dragging root nodes
        if (node.parent_id === null) {
            e.preventDefault();
            console.log('ROOT NODE: Cannot drag');
            return;
        }
        
        e.dataTransfer.effectAllowed = 'move';
        
        // Store the node being dragged
        window.draggedNode = node;
        window.draggedOutlineId = parseInt(Storage.getActiveOutlineId());
        
        // Visual feedback
        const nodeItem = e.target.closest('.node-item');
        if (nodeItem) {
            nodeItem.classList.add('dragging');
            nodeItem.classList.add('dragging-sibling');
        }
        
        console.log('DRAG START:', { nodeId: node.id, parentId: node.parent_id });
    };

    /**
     * Drag over handler - determine drop location and show visual feedback
     */
    const onDragOver = (e, node) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (!window.draggedNode) return;
        if (window.draggedNode.id === node.id) return; // Can't drop on self
        
        const nodeItem = e.target.closest('.node-item');
        if (!nodeItem) return;
        
        // Clear all previous zone indicators
        document.querySelectorAll('.zone-left, .zone-center, .zone-right').forEach(el => {
            el.classList.remove('zone-left', 'zone-center', 'zone-right');
        });
        
        // Detect which zone we're over
        const zone = detectDropZone(nodeItem, e);
        
        console.log('DRAG OVER:', { 
            draggedId: window.draggedNode.id, 
            targetId: node.id,
            zone
        });
        
        // Apply visual feedback based on zone
        nodeItem.classList.add(`zone-${zone}`);
        
        // Store the drop intent
        window.dropIntent = {
            zone: zone,
            targetNode: node,
            draggedNode: window.draggedNode
        };
        
        console.log(`  -> Zone: ${zone}`);
    };

    /**
     * Drop handler - execute the move operation
     */
    const onDrop = (e, targetNode) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('DROP EVENT FIRED:', {
            dropIntentExists: !!window.dropIntent,
            dropIntent: window.dropIntent ? {
                zone: window.dropIntent.zone,
                targetNodeId: window.dropIntent.targetNode?.id,
                draggedNodeId: window.dropIntent.draggedNode?.id
            } : 'null',
            paramTargetNodeId: targetNode?.id
        });
        
        if (!window.draggedNode || !window.dropIntent) {
            console.log('DROP ABORTED: missing draggedNode or dropIntent');
            clearDragState();
            return;
        }
        
        const draggedNode = window.draggedNode;
        const { zone, targetNode: intentTarget } = window.dropIntent;
        
        console.log('Using targetNode:', {
            intentTargetId: intentTarget?.id,
            intentTargetParentId: intentTarget?.parent_id
        });
        
        // Prevent dragging root nodes
        if (draggedNode.parent_id === null) {
            console.log('DROP ABORTED: cannot move root node');
            clearDragState();
            return;
        }
        
        // Get outline
        const outlineId = window.draggedOutlineId || parseInt(Storage.getActiveOutlineId());
        const outline = Storage.getOutline(outlineId);
        
        if (!outline) {
            console.log('DROP ABORTED: no outline');
            clearDragState();
            return;
        }
        
        console.log('EXECUTING DROP:', { zone, draggedId: draggedNode.id, targetId: intentTarget.id });
        
        if (zone === 'center') {
            console.log('  -> Reparenting as child...');
            performReparent(outline.root_nodes, draggedNode, intentTarget);
        } else if (zone === 'left') {
            console.log('  -> Reordering BEFORE...');
            performSiblingReorder(outline.root_nodes, draggedNode, intentTarget, 'before');
        } else if (zone === 'right') {
            console.log('  -> Reordering AFTER...');
            performSiblingReorder(outline.root_nodes, draggedNode, intentTarget, 'after');
        }
        
        // Save and re-render
        Storage.updateRootNodes(outlineId, outline.root_nodes);
        UIHandlers.renderCurrentOutline();
        
        clearDragState();
    };

    /**
     * Perform sibling reordering operation
     */
    const performSiblingReorder = (rootNodes, draggedNode, targetNode, position) => {
        // Find the parent that contains both nodes
        let parentArray = null;
        
        if (draggedNode.parent_id === null) {
            parentArray = rootNodes;
        } else {
            const parentNode = TreeModel.findNode(rootNodes, draggedNode.parent_id);
            if (!parentNode || !parentNode.children) {
                console.log('  ! Parent not found');
                return;
            }
            parentArray = parentNode.children;
        }
        
        // Find indices
        const draggedIdx = parentArray.findIndex(n => n.id === draggedNode.id);
        const targetIdx = parentArray.findIndex(n => n.id === targetNode.id);
        
        console.log('  Indices:', { draggedIdx, targetIdx, position, arrayLength: parentArray.length });
        
        if (draggedIdx === -1 || targetIdx === -1) {
            console.log('  ! Invalid indices');
            return;
        }
        
        if (draggedIdx === targetIdx) {
            console.log('  ! Same index');
            return;
        }
        
        // Remove from current position
        parentArray.splice(draggedIdx, 1);
        
        // Calculate new position after removal
        let newIdx = parentArray.findIndex(n => n.id === targetNode.id);
        
        // Adjust index based on direction
        if (position === 'after') {
            newIdx += 1;
        }
        // For 'before', use index as-is (it's already updated after removal)
        
        console.log('  Inserting at index:', newIdx);
        
        // Insert at new position
        parentArray.splice(newIdx, 0, draggedNode);
        console.log('  ✓ Reorder complete');
    };

    /**
     * Perform reparenting operation
     */
    const performReparent = (rootNodes, draggedNode, targetNode) => {
        console.log('REPARENT START:', {
            draggedNodeId: draggedNode.id,
            draggedParentId: draggedNode.parent_id,
            targetNodeId: targetNode.id,
            targetParentId: targetNode.parent_id,
            draggedHasChildren: draggedNode.children?.length || 0,
            targetHasChildren: targetNode.children?.length || 0
        });
        
        // Remove dragged node from its current location
        if (draggedNode.parent_id === null) {
            // Remove from root
            const idx = rootNodes.findIndex(n => n.id === draggedNode.id);
            console.log('  Removing from ROOT - index:', idx, 'total root nodes:', rootNodes.length);
            if (idx !== -1) {
                rootNodes.splice(idx, 1);
                console.log('  ✓ Removed from root, now', rootNodes.length, 'root nodes');
            } else {
                console.log('  ! NOT FOUND in root nodes');
            }
        } else {
            // Remove from parent's children
            const currentParent = TreeModel.findNode(rootNodes, draggedNode.parent_id);
            console.log('  Current parent found?', !!currentParent);
            if (currentParent && currentParent.children) {
                const idx = currentParent.children.findIndex(n => n.id === draggedNode.id);
                console.log('  Removing from parent', draggedNode.parent_id, '- index:', idx, 'total children:', currentParent.children.length);
                if (idx !== -1) {
                    currentParent.children.splice(idx, 1);
                    console.log('  ✓ Removed from parent, now', currentParent.children.length, 'children');
                } else {
                    console.log('  ! NOT FOUND in parent children');
                }
            } else {
                console.log('  ! Parent not found or has no children array');
            }
        }
        
        // Add dragged node as child of target
        console.log('  Adding as child to target', targetNode.id);
        draggedNode.parent_id = targetNode.id;
        console.log('  Set draggedNode.parent_id to', draggedNode.parent_id);
        
        if (!targetNode.children) {
            targetNode.children = [];
            console.log('  Created children array on target');
        }
        
        targetNode.children.push(draggedNode);
        console.log('  ✓ Added to target, now', targetNode.children.length, 'children');
        
        // Auto-expand the target node to show the new child
        targetNode.is_folded = false;
        console.log('  ✓ Expanded target node to show new child');
        
        console.log('REPARENT COMPLETE');
    };

    /**
     * Clear drag state
     */
    const clearDragState = () => {
        window.draggedNode = null;
        window.dropIntent = null;
        window.draggedOutlineId = null;
        document.querySelectorAll('.dragging, .dragging-sibling').forEach(el => {
            el.classList.remove('dragging', 'dragging-sibling');
        });
        document.querySelectorAll('.zone-left, .zone-center, .zone-right').forEach(el => {
            el.classList.remove('zone-left', 'zone-center', 'zone-right');
        });
    };

    /**
     * Drag leave handler
     */
    const onDragLeave = (e, itemEl) => {
        // Only remove if we're actually leaving the element
        if (e.target === itemEl) {
            itemEl.classList.remove('zone-left', 'zone-center', 'zone-right');
        }
    };

    /**
     * Drag end handler
     */
    const onDragEnd = (e) => {
        // Remove dragging visual feedback
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
        
        const nodeItem = e.target.closest('.node-item');
        if (nodeItem) {
            nodeItem.classList.remove('dragging');
            nodeItem.classList.remove('dragging-sibling');
        }
    };

    /**
     * Find a node in the tree by ID (exposed for external use)
     */
    const findNodeInTree = (tree, nodeId) => {
        return TreeModel.findNode(tree, nodeId);
    };

    return {
        renderTree,
        renderNode,
        updateNodeRender,
        onToggleNode,
        onShowContextMenu,
        onContextMenuAction,
        startInlineEdit,
        findNodeInTree,
        focusAndEditNode
    };
})();
