# Outlines View - Prototype

A standalone, front-end only prototype of a hierarchical mind-map inspired outline/note-taking system. This prototype uses localStorage for persistence and adheres to the MyDayHub design aesthetics.

## Overview

The Outlines View provides a flexible, tree-based interface for structuring complex ideas, planning projects, and organizing information. All data is stored locally in the browser using localStorage.

## Features Implemented

### Core Functionality
- ✅ **Multiple Outlines**: Create, manage, and switch between different outlines
- ✅ **Hierarchical Tree Structure**: Infinite nesting of nodes with parent-child relationships
- ✅ **Expand/Collapse**: Collapsible tree with smooth animations and state persistence
- ✅ **Inline Editing**: Double-click node titles to edit them
- ✅ **Drag and Drop**: Move nodes within the hierarchy by dragging and dropping
- ✅ **Promote/Demote**: Move nodes up or down in the hierarchy via context menu
- ✅ **Duplicate**: Create copies of nodes and their entire branches
- ✅ **Delete**: Remove nodes and all their descendants
- ✅ **Privacy Toggle**: Mark nodes as private (visual indicator with cross-hatch pattern)
- ✅ **Fold/Unfold**: Manually collapse or expand entire branches
- ✅ **Batch Operations**: Expand/collapse all nodes at once
- ✅ **Child Count Badges**: Visual indicator of how many children a node has

### UI Components
- ✅ **Dark Theme**: Full app-matching dark theme with accent color
- ✅ **Responsive Layout**: Sidebar with outline list, tree view container
- ✅ **Context Menu**: Right-click menu with all node operations
- ✅ **Modal Dialogs**: For editing and creating outlines
- ✅ **Empty States**: Helpful messages when no data exists
- ✅ **Hover Effects**: Visual feedback on interactive elements

### Data Persistence
- ✅ **localStorage Integration**: All data persists across sessions
- ✅ **Automatic Saving**: Changes are immediately persisted
- ✅ **Active Outline Tracking**: Remember which outline was last viewed

## Architecture

### Module Organization

**js/storage.js**
- Handles localStorage CRUD operations
- Manages outline and node persistence
- Provides data access layer

**js/tree-model.js**
- Core tree operations (add, delete, find, move)
- Node manipulation (promote, demote, fold, duplicate)
- Traversal and search utilities

**js/tree-render.js**
- DOM rendering of tree structure
- Event binding for interactions
- UI feedback and updates

**js/dnd.js**
- Drag and drop implementation
- Node reparenting logic
- Visual feedback during drag operations

**js/ui-handlers.js**
- Modal and dialog management
- Context menu handling
- Button event listeners
- Render orchestration

**js/app.js**
- Application initialization
- Module coordination
- Default data setup

**css/style.css**
- Complete styling matching MyDayHub design
- Dark theme with accent color support
- Animations and transitions
- Responsive layout

### Data Structure

```javascript
// Outline
{
  id: number,
  name: string,
  root_nodes: [Node, ...],
  created_at: ISO8601,
  updated_at: ISO8601
}

// Node
{
  id: number,
  title: string,
  parent_id: number | null,
  children: [Node, ...],
  is_private: boolean,
  is_folded: boolean,
  created_at: ISO8601
}
```

## Usage

### Starting the App
1. Open `index.html` in a web browser
2. The app creates a sample outline on first load
3. Create new outlines using the "+" button in the sidebar
4. Select an outline to view and edit its tree

### Creating Nodes
1. Click "+ Add Node" in the toolbar to add root nodes
2. Right-click a node and select "Add Child Node" to nest nodes
3. Double-click a node title to edit it inline

### Organizing Nodes
- **Drag & Drop**: Drag a node onto another to make it a child
- **Promote**: Right-click → "Promote" to move node to parent's level
- **Demote**: Right-click → "Demote" to move node under previous sibling
- **Expand/Collapse**: Click the arrow icon or use toolbar buttons

### Privacy & Visibility
- **Make Private**: Right-click → "Make Private" to mark a node
- **Fold/Unfold**: Hide or show entire branches manually
- **Visual Indicator**: Private nodes show a diagonal cross-hatch pattern

## Keyboard Shortcuts

- `Enter` - Confirm modal input
- `Escape` - Close modals and menus
- `Double-click` - Edit node title

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern browsers with localStorage support

## localStorage Keys

- `outlines_data` - Main data store containing all outlines and nodes
- `active_outline_id` - Currently selected outline

## Future Enhancements

These features are intentionally deferred for the production version:

- Task Column Integration: Link outlines to Task columns
- Journal Integration: Link outline nodes to Journal entries
- Advanced Formatting: Rich text editing within nodes
- Sharing & Collaboration: Multi-user access
- Export Options: PDF, Markdown, JSON export
- Search & Filter: Find nodes across outlines
- Undo/Redo: Change history
- Custom Styling: Node color coding
- Templates: Pre-built outline templates

## Notes for Integration

When integrating this prototype into the main app:

1. **No Changes to Main App**: This prototype is completely self-contained
2. **Separate Styles**: CSS is isolated in `css/style.css` with BEM naming
3. **Modular JS**: All JavaScript is modular and can be refactored to use app patterns
4. **localStorage Namespace**: Uses `outlines_data` key (configurable in storage.js)
5. **Database Ready**: Tree structure maps directly to potential SQL schema
6. **API Ready**: All localStorage calls can be replaced with API calls

## Development

To modify the prototype:

1. Edit HTML structure in `index.html`
2. Update styles in `css/style.css`
3. Modify tree logic in `js/tree-model.js`
4. Adjust rendering in `js/tree-render.js`
5. Add new features in respective modules

All modules follow the Module Pattern with clear public APIs.

## Testing

### Manual Test Scenarios

1. **Create an Outline**
   - Click "+" button, enter name
   - Verify it appears in sidebar and is selected

2. **Add Nodes**
   - Click "+ Add Node", enter title
   - Verify node appears in tree

3. **Edit Node**
   - Double-click a node title
   - Verify edit modal opens and saves changes

4. **Drag & Drop**
   - Drag a node onto another
   - Verify it becomes a child with indentation

5. **Privacy Toggle**
   - Right-click node → "Make Private"
   - Verify cross-hatch pattern appears

6. **Expand/Collapse**
   - Click arrow or use toolbar buttons
   - Verify smooth animations and state persistence

7. **Refresh Browser**
   - Make changes, refresh page
   - Verify all data persists

## License

This prototype is part of MyDayHub and follows the same license as the main application.
