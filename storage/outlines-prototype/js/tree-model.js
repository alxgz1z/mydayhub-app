/**
 * TreeModel - Manages tree structure operations
 */
const TreeModel = (() => {
    let nodeIdCounter = 1;

    /**
     * Find the maximum node ID in the tree
     */
    const findMaxNodeId = (tree) => {
        let maxId = 0;
        const traverse = (nodes) => {
            nodes.forEach(node => {
                if (node.id > maxId) maxId = node.id;
                if (node.children && node.children.length > 0) {
                    traverse(node.children);
                }
            });
        };
        traverse(tree);
        return maxId;
    };

    /**
     * Initialize the node ID counter based on existing tree
     */
    const initializeIdCounter = (tree) => {
        const maxId = findMaxNodeId(tree);
        nodeIdCounter = maxId + 1;
        console.log('TreeModel: Initialized nodeIdCounter to', nodeIdCounter);
    };

    /**
     * Create a new node
     */
    const createNode = (title, parentId = null, isPrivate = false) => {
        const node = {
            id: nodeIdCounter++,
            title: title,
            parent_id: parentId,
            children: [],
            is_private: isPrivate,
            is_folded: false,
            created_at: new Date().toISOString()
        };
        console.log('TreeModel: Created node', { id: node.id, title, parentId });
        return node;
    };

    /**
     * Add a child node to a parent
     */
    const addChildNode = (parentNode, title, isPrivate = false) => {
        const newNode = createNode(title, parentNode.id, isPrivate);
        parentNode.children.push(newNode);
        return newNode;
    };

    /**
     * Add a root node to the tree
     */
    const addRootNode = (tree, title, isPrivate = false) => {
        const newNode = createNode(title, null, isPrivate);
        tree.push(newNode);
        return newNode;
    };

    /**
     * Add a sibling node (at same level as another node)
     */
    const addSiblingNode = (tree, siblingNode, title, isPrivate = false) => {
        const newNode = createNode(title, siblingNode.parent_id, isPrivate);
        
        // If root level sibling, add to root array
        if (siblingNode.parent_id === null) {
            const index = tree.indexOf(siblingNode);
            if (index !== -1) {
                tree.splice(index + 1, 0, newNode);
            }
        } else {
            // Find parent and add sibling after this node
            const parentNode = findNode(tree, siblingNode.parent_id);
            if (parentNode) {
                const index = parentNode.children.indexOf(siblingNode);
                if (index !== -1) {
                    parentNode.children.splice(index + 1, 0, newNode);
                }
            }
        }
        
        return newNode;
    };

    /**
     * Find a node by ID in the tree
     */
    const findNode = (tree, nodeId) => {
        for (let node of tree) {
            if (node.id === nodeId) return node;
            const found = findNodeInChildren(node, nodeId);
            if (found) return found;
        }
        return null;
    };

    /**
     * Find node in children recursively
     */
    const findNodeInChildren = (node, nodeId) => {
        for (let child of node.children) {
            if (child.id === nodeId) return child;
            const found = findNodeInChildren(child, nodeId);
            if (found) return found;
        }
        return null;
    };

    /**
     * Find parent node
     */
    const findParentNode = (tree, nodeId) => {
        for (let node of tree) {
            if (node.children.find(c => c.id === nodeId)) return node;
            const parent = findParentInChildren(node, nodeId);
            if (parent) return parent;
        }
        return null;
    };

    /**
     * Find parent in children recursively
     */
    const findParentInChildren = (node, nodeId) => {
        for (let child of node.children) {
            if (child.children.find(c => c.id === nodeId)) return child;
            const parent = findParentInChildren(child, nodeId);
            if (parent) return parent;
        }
        return null;
    };

    /**
     * Delete a node and its children
     */
    const deleteNode = (tree, nodeId) => {
        for (let i = 0; i < tree.length; i++) {
            if (tree[i].id === nodeId) {
                tree.splice(i, 1);
                return true;
            }
            if (deleteNodeFromChildren(tree[i], nodeId)) {
                return true;
            }
        }
        return false;
    };

    /**
     * Delete node from children recursively
     */
    const deleteNodeFromChildren = (node, nodeId) => {
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].id === nodeId) {
                node.children.splice(i, 1);
                return true;
            }
            if (deleteNodeFromChildren(node.children[i], nodeId)) {
                return true;
            }
        }
        return false;
    };

    /**
     * Duplicate a node and its entire branch
     */
    const duplicateNode = (tree, nodeId) => {
        const node = findNode(tree, nodeId);
        if (!node) return null;

        const parentNode = findParentNode(tree, nodeId);
        const duplicate = JSON.parse(JSON.stringify(node));
        
        // Reassign IDs to all nodes in the branch
        reassignNodeIds(duplicate);

        if (parentNode) {
            parentNode.children.push(duplicate);
        } else {
            tree.push(duplicate);
        }

        return duplicate;
    };

    /**
     * Recursively reassign node IDs
     */
    const reassignNodeIds = (node) => {
        node.id = nodeIdCounter++;
        for (let child of node.children) {
            reassignNodeIds(child);
        }
    };

    /**
     * Toggle fold state
     */
    const toggleFold = (node) => {
        node.is_folded = !node.is_folded;
    };

    /**
     * Fold all descendants
     */
    const foldAll = (node) => {
        node.is_folded = true;
        for (let child of node.children) {
            foldAll(child);
        }
    };

    /**
     * Unfold all descendants
     */
    const unfoldAll = (node) => {
        node.is_folded = false;
        for (let child of node.children) {
            unfoldAll(child);
        }
    };

    /**
     * Toggle privacy of node
     */
    const togglePrivacy = (node) => {
        node.is_private = !node.is_private;
    };

    /**
     * Make all descendants private
     */
    const makePrivate = (node) => {
        node.is_private = true;
        for (let child of node.children) {
            makePrivate(child);
        }
    };

    /**
     * Count children
     */
    const countChildren = (node) => {
        return node.children.length;
    };

    /**
     * Promote a node (move to parent's level)
     */
    const promoteNode = (tree, nodeId) => {
        console.log(`🔼 PROMOTE: Starting promote for node ${nodeId}`);
        
        const node = findNode(tree, nodeId);
        const parentNode = findParentNode(tree, nodeId);
        
        console.log(`   Node found: ${node ? 'YES' : 'NO'}`, node?.title);
        console.log(`   Parent found: ${parentNode ? 'YES' : 'NO'}`, parentNode?.title);
        
        if (!node || !parentNode) {
            console.log(`   ❌ PROMOTE FAILED: node=${!!node}, parent=${!!parentNode}`);
            return false;
        }

        // Remove from parent
        const index = parentNode.children.indexOf(node);
        console.log(`   Removing from parent's children at index ${index}`);
        console.log(`   Parent had ${parentNode.children.length} children`);
        parentNode.children.splice(index, 1);
        console.log(`   Parent now has ${parentNode.children.length} children`);

        // Update parent reference
        node.parent_id = parentNode.parent_id;
        console.log(`   Updated node.parent_id to ${node.parent_id}`);

        // Add to parent's level
        const grandparent = findParentNode(tree, parentNode.id);
        console.log(`   Grandparent found: ${grandparent ? 'YES' : 'NO'}`, grandparent?.title);
        
        if (grandparent) {
            const parentIndex = grandparent.children.indexOf(parentNode);
            console.log(`   Adding to grandparent's children at index ${parentIndex + 1}`);
            console.log(`   Grandparent had ${grandparent.children.length} children`);
            grandparent.children.splice(parentIndex + 1, 0, node);
            console.log(`   Grandparent now has ${grandparent.children.length} children`);
        } else {
            const parentIndex = tree.indexOf(parentNode);
            console.log(`   Adding to root level at index ${parentIndex + 1}`);
            console.log(`   Root had ${tree.length} nodes`);
            tree.splice(parentIndex + 1, 0, node);
            console.log(`   Root now has ${tree.length} nodes`);
        }

        console.log(`   ✅ PROMOTE SUCCESSFUL for node ${nodeId}`);
        return true;
    };

    /**
     * Demote a node (move to previous sibling's children)
     */
    const demoteNode = (tree, nodeId) => {
        const node = findNode(tree, nodeId);
        const parentNode = findParentNode(tree, nodeId);
        
        if (!node || !parentNode) return false;

        const siblings = parentNode.children;
        const index = siblings.indexOf(node);
        
        if (index <= 0) return false; // Can't demote if first child

        const previousSibling = siblings[index - 1];

        // Remove from parent
        siblings.splice(index, 1);

        // Add to previous sibling's children
        node.parent_id = previousSibling.id;
        previousSibling.children.push(node);

        return true;
    };

    /**
     * Expand all nodes in tree
     */
    const expandAll = (tree) => {
        for (let node of tree) {
            unfoldAll(node);
        }
    };

    /**
     * Collapse all nodes in tree
     */
    const collapseAll = (tree) => {
        for (let node of tree) {
            foldAll(node);
        }
    };

    /**
     * Calculate maximum depth of tree
     */
    const getMaxDepth = (tree) => {
        let maxDepth = 0;
        const traverse = (nodes, depth) => {
            nodes.forEach(node => {
                maxDepth = Math.max(maxDepth, depth);
                if (node.children && node.children.length > 0) {
                    traverse(node.children, depth + 1);
                }
            });
        };
        traverse(tree, 1);
        return maxDepth;
    };

    /**
     * Fold all nodes at a specific depth level
     * @param tree - The tree to fold
     * @param targetDepth - Depth level to fold (1 = first level children, 2 = grandchildren, etc)
     */
    const foldAtDepth = (tree, targetDepth) => {
        const traverse = (nodes, currentDepth) => {
            nodes.forEach(node => {
                if (currentDepth === targetDepth) {
                    node.is_folded = true;
                }
                if (node.children && node.children.length > 0 && currentDepth < targetDepth) {
                    traverse(node.children, currentDepth + 1);
                }
            });
        };
        traverse(tree, 1);
    };

    /**
     * Unfold all nodes at a specific depth level and above
     * @param tree - The tree to unfold
     * @param targetDepth - Expand up to this depth level
     */
    const unfoldToDepth = (tree, targetDepth) => {
        const traverse = (nodes, currentDepth) => {
            nodes.forEach(node => {
                if (currentDepth <= targetDepth) {
                    node.is_folded = false;
                }
                if (node.children && node.children.length > 0) {
                    traverse(node.children, currentDepth + 1);
                }
            });
        };
        traverse(tree, 1);
    };

    return {
        createNode,
        addChildNode,
        addRootNode,
        addSiblingNode,
        findNode,
        findParentNode,
        deleteNode,
        duplicateNode,
        reassignNodeIds,
        toggleFold,
        foldAll,
        unfoldAll,
        promoteNode,
        demoteNode,
        expandAll,
        collapseAll,
        initializeIdCounter,
        getMaxDepth,
        foldAtDepth,
        unfoldToDepth
    };
})();

/**
 * DEV_MODE Label Generator
 * Generates hierarchical labels: Root=none, A/B/C/..., A1/A2/..., A1a/A1b/...
 */
const DevLabels = (() => {
    /**
     * Get label for a node based on its depth and position among siblings
     * Depth 0 (root): no label
     * Depth 1: A, B, C, D, ...
     * Depth 2: A1, A2, B1, B2, ... (child of A is A1, A2; child of B is B1, B2)
     * Depth 3: A1a, A1b, A2a, ... (child of A1 is A1a, A1b)
     */
    const getLabelForNode = (tree, node) => {
        // Root nodes have no label
        if (node.parent_id === null) {
            return '';
        }
        
        // Build path from root to node
        const path = [];
        let currentNode = node;
        
        // Trace back to root
        while (currentNode.parent_id !== null) {
            const parent = TreeModel.findNode(tree, currentNode.parent_id);
            if (!parent) break;
            
            const index = parent.children.findIndex(n => n.id === currentNode.id);
            if (index !== -1) {
                path.unshift(index);
            }
            
            currentNode = parent;
        }
        
        // Convert path to label
        // Path example: [0, 1, 0] means first root's second child's first child
        // Result: A2a (A = root 0, 2 = second child of A, a = first grandchild)
        
        if (path.length === 0) return '';
        
        let label = '';
        for (let i = 0; i < path.length; i++) {
            const index = path[i];
            
            if (i % 2 === 0) {
                // Even position in path = use uppercase letters
                label += String.fromCharCode(65 + index); // A, B, C, ...
            } else {
                // Odd position in path = use numbers
                label += (index + 1).toString(); // 1, 2, 3, ...
            }
        }
        
        return label;
    };

    return {
        getLabelForNode
    };
})();
