/**
 * Storage Module - Handles localStorage persistence for outlines
 */
const Storage = (() => {
    const STORAGE_KEY = 'outlines_data';
    const ACTIVE_OUTLINE_KEY = 'active_outline_id';

    /**
     * Initialize storage with default data if needed
     */
    const init = () => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            const defaultData = {
                outlines: [],
                nextId: 1
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        }
    };

    /**
     * Get all outlines
     */
    const getAllOutlines = () => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return data.outlines || [];
    };

    /**
     * Get a specific outline by ID
     */
    const getOutline = (outlineId) => {
        const outlines = getAllOutlines();
        return outlines.find(o => o.id === outlineId);
    };

    /**
     * Create a new outline
     */
    const createOutline = (name) => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const newOutline = {
            id: data.nextId,
            name: name,
            root_nodes: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        data.outlines.push(newOutline);
        data.nextId++;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return newOutline;
    };

    /**
     * Update outline metadata
     */
    const updateOutline = (outlineId, updates) => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const outline = data.outlines.find(o => o.id === outlineId);
        if (outline) {
            Object.assign(outline, updates, { updated_at: new Date().toISOString() });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        return outline;
    };

    /**
     * Delete an outline
     */
    const deleteOutline = (outlineId) => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        data.outlines = data.outlines.filter(o => o.id !== outlineId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    /**
     * Update root nodes for an outline
     */
    const updateRootNodes = (outlineId, rootNodes) => {
        return updateOutline(outlineId, { root_nodes: rootNodes });
    };

    /**
     * Get active outline ID
     */
    const getActiveOutlineId = () => {
        return localStorage.getItem(ACTIVE_OUTLINE_KEY);
    };

    /**
     * Set active outline ID
     */
    const setActiveOutlineId = (outlineId) => {
        localStorage.setItem(ACTIVE_OUTLINE_KEY, outlineId);
    };

    /**
     * Clear all data (for debugging)
     */
    const clearAll = () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ACTIVE_OUTLINE_KEY);
        init();
    };

    return {
        init,
        getAllOutlines,
        getOutline,
        createOutline,
        updateOutline,
        deleteOutline,
        updateRootNodes,
        getActiveOutlineId,
        setActiveOutlineId,
        clearAll
    };
})();

// Initialize storage on load
Storage.init();
