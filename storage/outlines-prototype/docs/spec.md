# Outlines Prototype — Feature Specification

**Project**: Research Aid Tool (Hierarchical Outliner)  
**Version**: 1.0  
**Last Updated**: 2025-10-19  
**Type**: Standalone Web Application (localStorage-based)

---

## 1. Overview

### Purpose
Lightweight, browser-based hierarchical outliner designed as a research and brainstorming aid. Inspired by mindmap tools and knowledge management systems (Roam Research, Obsidian), but using a vertical, indentation-based layout for optimal information density and space utilization.

### Core Philosophy
- **Local First**: All data stored in browser localStorage (no server required)
- **Simplicity**: Focus on core outlining functionality without distracting features
- **Keyboard-Friendly**: Efficient keyboard navigation and editing
- **Visual Clarity**: Distinct visual hierarchy and clear parent-child relationships
- **Research Aid**: Tool for collecting, organizing, and refining information as it arrives

### Intended Use Cases
- Research note-taking and organization
- Project planning and breakdown
- Book/article outline writing
- Brainstorming and idea capture
- Personal knowledge management
- Creative writing (character/world building)
- Complex problem decomposition

---

## 2. Feature Specification

### 2.1 Hierarchical Tree Structure

#### Feature
- **Unlimited Nesting Depth**: Create nodes at any depth level
- **Multiple Root Nodes**: Support 1 to many top-level outline entries
- **Parent-Child Relationships**: Clear hierarchy with automatic structure management

#### Data Model
```javascript
{
  id: number,                // Unique node ID (auto-incremented)
  title: string,             // Node content/label
  parent_id: number | null,  // null for root nodes
  children: array,           // Child node objects (recursive)
  is_folded: boolean,        // Collapsed/expanded state
  is_private: boolean,       // Privacy setting (future feature)
  created_at: ISO8601,       // Creation timestamp
  updated_at: ISO8601        // Last update timestamp
}
```

#### Operations
- **Add Child**: Insert new node as child of selected node
- **Add Sibling**: Insert new node as sibling to selected node
- **Delete**: Remove node and all descendants (with confirmation)
- **Promote**: Move node up one level (becomes sibling of parent)
- **Demote**: Move node down one level (becomes child of previous sibling)
- **Reorder**: Change position among siblings via drag-and-drop
- **Fold/Unfold**: Toggle visibility of child nodes
- **Fold at Depth**: Show/hide all nodes beyond specified depth level

---

### 2.2 Node Editing

#### Inline Editing
- **Click-to-Edit**: Click on node title to activate edit mode
- **Auto-Focus**: Text cursor positioned at end of title
- **Multi-line Support**: Support for titles with line breaks (if needed in future)
- **Save Shortcuts**:
  - **ENTER**: Save changes and exit edit mode
  - **ESC**: Cancel without saving
- **Visual Feedback**: Edit mode shows input field instead of static text

#### Title Requirements
- **Min Length**: 1 character
- **Max Length**: Unlimited (but reasonable UX limit ~500 chars)
- **Special Characters**: Support all Unicode characters
- **Placeholder**: "<add title>" when creating new node without input

---

### 2.3 Keyboard Navigation

#### Navigation
- **TAB**: Move to next sibling
  - Wraps around: Last sibling → First sibling
  - Auto-enters edit mode on arrival
  - If editing: Saves changes and moves
  - If node has children and is expanded: Enter first child
  - If node collapsed: Move to next sibling

- **SHIFT+TAB**: Move to previous sibling
  - Wraps around: First sibling → Last sibling
  - Auto-enters edit mode on arrival
  - Inverse of TAB behavior

- **ENTER**: Save and exit edit mode (while editing)

- **ESC**: Cancel edit without saving (while editing)

- **Cmd/Ctrl+Shift+D**: Toggle DEV_MODE (developer feature)

#### Click Navigation
- **Indentation Line** (left of node): Toggle fold/unfold entire subtree under that node
- **Home Button**: Scroll to top and reset focus to tree root
- **Depth Control Buttons**: Show/hide nodes beyond specified depth

---

### 2.4 Drag and Drop

#### Three-Zone System
1. **Left Padded Zone** (15% of card width)
   - **Visual**: Tilted dashed outline preview on left
   - **Action**: Insert before target node
   - **Result**: Node becomes sibling (previous)

2. **Center Zone** (core card area)
   - **Visual**: Thick dashed border (3px) around incumbent node
   - **Action**: Drop on top of node
   - **Result**: Arriving node takes incumbent's place, incumbent shifts down one position

3. **Right Padded Zone** (15% of card width)
   - **Visual**: Tilted dashed outline preview on right
   - **Action**: Insert after target node
   - **Result**: Node becomes sibling (next)

#### Constraints
- **Root nodes cannot be dragged** (visually indicated by no drag handle on roots)
- **Nodes with children can be dragged** (entire subtree moves as unit)
- **Self-drop prevented**: Cannot drop node on itself
- **Visual feedback**: Source card fades to 50% opacity while dragging

#### Behavior
- All drop operations result in **sibling reordering** (no reparenting)
- Incumbent node shifts to accommodate arriving node
- Tree structure remains flat at each level (no nesting changes)

---

### 2.5 Outline Management

#### Outline CRUD
- **Create**: New outline via dropdown "+ New Outline" option
  - Prompt for outline name
  - Auto-saves to localStorage
  - Becomes active outline
  
- **List**: Dropdown selector showing all available outlines
  - Shows outline name
  - Indicates currently active outline
  
- **Switch**: Click dropdown option to switch active outline
  - Immediately loads selected outline
  - Updates all views
  
- **Delete**: Long-press or right-click context menu (future enhancement)
  - Shows confirmation dialog
  - Removes from localStorage

#### Storage
- **Key**: `outlines_data` in localStorage
- **Format**: JSON object with array of outlines
- **Structure**:
  ```javascript
  {
    outlines: [
      {
        id: number,
        name: string,
        root_nodes: array,
        created_at: ISO8601,
        updated_at: ISO8601
      }
    ],
    nextId: number
  }
  ```

#### Persistence
- **Auto-Save**: Every operation immediately persists to localStorage
- **No Undo**: Changes are permanent (future: add undo stack)
- **No Sync**: Local only; no cloud backup (future enhancement)

---

### 2.6 Toolbar Controls

#### Buttons
- **Home**: Collapse all and scroll to tree top
- **Expand All**: Recursively unfold entire tree
- **Collapse All**: Recursively fold entire tree
- **+ Add Node**: Create new root-level node

#### Depth Controls
- **Visibility**: Show/hide based on maximum tree depth
  - Hidden if max depth = 1
  - Show levels 1-5+ as needed

- **Behavior**: Toggle mode
  - Click depth level N: Show all nodes up to level N (fold deeper)
  - Click same level again: Expand everything
  - Click different level: Switch to that level
  - Tracks `currentDepthLevel` state

#### Root Node Checkboxes (Advanced)
- **Purpose**: Enable/disable toolbar applicability per hierarchy
- **Behavior**: 
  - Checked: Toolbar operations apply to this root + descendants
  - Unchecked: Skip this hierarchy when using toolbar
  - Helpful when managing multiple independent outlines in same tree

---

### 2.7 Visual Design

#### Theme Integration
- **Accent Color**: Uses `--accent-color` CSS variable from MyDayHub
- **Dark/Light Modes**: Inherits from main app theme system
- **High-Contrast Mode**: Full support for accessibility

#### Node Appearance
- **Normal Nodes**: 
  - White/light background
  - 6px border-radius
  - 1px subtle border
  - Consistent padding and spacing

- **Root Nodes**:
  - Distinct background color (light accent)
  - Left-aligned border glow (2px solid accent)
  - Slightly bolder font
  - More visual prominence

- **Hovered Nodes**:
  - Light background color shift
  - Enhanced left border glow

- **Focused Nodes** (keyboard focus):
  - Clear outline
  - Background highlight
  - Indicates keyboard target

#### Layout
- **Indentation**: `--depth` CSS variable × 1.5rem per level
- **Vertical Stacking**: Nodes stack vertically with consistent spacing
- **Left Indentation Line**: Visual connection showing hierarchy
- **Scrolling**: Vertical scroll in tree container, horizontal scroll if needed

#### Typography
- **Font**: Inherit from main app (currently system sans-serif)
- **Size**: 14px for node titles
- **Weight**: 400 (normal) for regular nodes, 500 for root nodes
- **Spacing**: Consistent with main app conventions

---

### 2.8 DEV_MODE Features

#### Purpose
- **Debugging**: Track node origin and hierarchy depth
- **Development**: Verify tree structure integrity

#### Badge Display
- **Trigger**: `window.DEV_MODE = true` or URL parameter `?dev=true`
- **Toggle**: Cmd/Ctrl+Shift+D keyboard shortcut

#### Label Format
Hierarchical system showing node ancestry:
- **Root nodes**: No label (implicit)
- **Root children**: A, B, C, D, E, ...
- **Root child A's children**: A1, A2, A3, ...
- **Root child A1's children**: A1A, A1B, A1C, ...
- **Alternating**: Lowercase letters (a-z), then numbers (1-9), then back to letters

#### Appearance
- **Position**: Fixed to left of node footer
- **Styling**: 
  - Orange background with border
  - Monospace font
  - 12px size, bold weight
  - Slight glow effect
  - Pointer-events: none (non-interactive)

---

### 2.9 Sample Data

#### Initial Outlines
Three richly populated sample outlines auto-created on first run:

1. **🚀 Product Launch Plan** (Project Management)
   - Planning Phase
     - Market Research
       - Competitor Analysis
         - Feature Comparison
         - Pricing Strategy
       - Customer Surveys
     - Budget Planning
     - Timeline
   - Execution Phase
     - Development
       - Backend
       - Frontend
     - Testing
     - Launch

2. **🐉 Fantasy World Building** (Creative Writing)
   - World Overview
     - Geography
       - Kingdoms
       - Mountains & Rivers
       - Magical Regions
     - Creatures
       - Dragons
       - Elves
       - Dwarves
     - Magic System
   - Character Profiles
     - Hero: Aragorn
       - Backstory
       - Powers
       - Relationships
     - Villain: Dark Lord
     - Allies

3. **🔬 AI Research Project** (Research Documentation)
   - Research Goals
     - Literature Review
   - [Additional sections...]

#### User Preferences
- **Last Opened**: Stored in `active_outline_id` localStorage key
- **First Run**: Forces outline selection (no auto-selection)
- **Reset**: URL parameter `?force=true` clears data and reloads samples

---

## 3. Technical Specification

### 3.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **HTML** | HTML5 | Semantic markup |
| **Styling** | CSS3 | Layout, theming, animations |
| **Frontend** | JavaScript (Vanilla ES6+) | All interactivity and state management |
| **Storage** | localStorage API | Persistent data (JSON) |
| **Build** | None | Single-file deployment (no build step) |
| **Testing** | Manual | In-browser testing |

### 3.2 Browser Requirements

**Minimum Support**
- Chrome 88+
- Firefox 87+
- Safari 14+
- Edge 88+

**Features Required**
- localStorage (5-10MB minimum)
- ES6 JavaScript support
- CSS Grid/Flexbox
- Drag & Drop API
- contentEditable (for inline editing)

### 3.3 Module Architecture

#### `app.js` — Application Entry Point
- **Responsibilities**:
  - Initialize all modules
  - Load user preferences from localStorage
  - Handle DEV_MODE toggling
  - Manage keyboard shortcuts
  - Create sample data on first run
  
- **Dependencies**: All other modules
- **Exports**: `window.TreeModel`, `window.Storage`, etc. (module instances)

#### `storage.js` — Data Persistence Layer
- **Responsibilities**:
  - CRUD operations for outlines
  - Root node management
  - Active outline tracking
  - localStorage read/write
  
- **Key Functions**:
  - `getAllOutlines()` → array of outline objects
  - `getOutline(id)` → single outline or null
  - `createOutline(name)` → new outline
  - `updateOutline(id, data)` → update existing
  - `deleteOutline(id)` → remove outline
  - `getActiveOutlineId()` → current outline ID
  - `setActiveOutlineId(id)` → switch active outline
  
- **Dependencies**: None (pure localStorage wrapper)

#### `tree-model.js` — Tree Operations
- **Responsibilities**:
  - Node CRUD operations
  - Hierarchy traversal (find, parent lookup)
  - Structural modifications (promote, demote, reorder)
  - Depth calculations
  - Fold/unfold logic
  
- **Key Functions**:
  - `createNode(title, parentId)` → new node
  - `findNode(rootNodes, nodeId)` → node search
  - `addChildNode(parentId)` → add child
  - `addSiblingNode(nodeId)` → add sibling
  - `deleteNode(nodeId)` → remove
  - `promoteNode(nodeId)` → move up one level
  - `demoteNode(nodeId)` → move down one level
  - `foldAtDepth(rootNodes, depth)` → toggle depth
  
- **Dependencies**: None (pure tree operations)

#### `tree-render.js` — DOM Rendering & Events
- **Responsibilities**:
  - Render tree to DOM
  - Inline editing (contentEditable)
  - Keyboard navigation (TAB, SHIFT+TAB, ENTER, ESC)
  - Drag & drop event handling
  - Visual feedback (zones, dragging state)
  - DEV_MODE badge rendering
  
- **Key Functions**:
  - `renderTree(tree)` → full render
  - `renderNode(node, tree)` → single node render
  - `startInlineEdit(node)` → activate edit mode
  - `finishInlineEdit(save)` → save/discard changes
  - `onDragStart/Over/End/Drop()` → drag handler suite
  - `performSiblingInsert()` → execute drop operation
  
- **Dependencies**: `TreeModel` (for node operations), `Storage` (for persistence)

#### `ui-handlers.js` — UI Logic & Modals
- **Responsibilities**:
  - Modal dialogs (create outline)
  - Button click handlers
  - Toolbar controls (Expand/Collapse/Depth)
  - Outline selector dropdown
  - View updates after operations
  
- **Key Functions**:
  - `init()` → initialize all handlers
  - `renderOutlinesList()` → populate dropdown
  - `renderCurrentOutline()` → update tree view
  - `handleAddRootNode()` → new root node
  - `handleExpandAll/CollapseAll()` → toolbar buttons
  - `handleDepthExpand(depth)` → show to depth level
  
- **Dependencies**: All other modules

### 3.4 Data Flow Diagram

```
User Interaction
    ↓
DOM Event (click, drag, keydown)
    ↓
Event Handler (tree-render.js, ui-handlers.js)
    ↓
Tree Operation (tree-model.js)
    ↓
Persist to Storage (storage.js → localStorage)
    ↓
Re-render Tree (tree-render.js)
    ↓
Visual Update
```

### 3.5 Storage Schema

#### localStorage Keys

**`outlines_data`** — Main data store
```javascript
{
  "outlines": [
    {
      "id": 1,
      "name": "🚀 Product Launch Plan",
      "root_nodes": [
        {
          "id": 1,
          "title": "Planning Phase",
          "parent_id": null,
          "children": [...],
          "is_folded": false,
          "is_private": false,
          "created_at": "2025-10-19T...",
          "updated_at": "2025-10-19T..."
        }
      ],
      "created_at": "2025-10-19T...",
      "updated_at": "2025-10-19T..."
    }
  ],
  "nextId": 50
}
```

**`active_outline_id`** — Currently selected outline
```javascript
"1"
```

**`DEV_MODE`** — Developer mode toggle
```javascript
"true" or "false"
```

---

## 4. User Experience

### 4.1 First-Run Experience
1. User opens app
2. Empty state message displayed
3. Dropdown shows "+ New Outline" and 3 sample outlines
4. User clicks sample outline to load it
5. Tree displays with full sample data
6. User can start creating/editing

### 4.2 Typical Workflows

#### Creating an Outline
1. Click "+ New Outline" in dropdown
2. Enter outline name in prompt
3. Outline created with one empty root node
4. Focus on new node for immediate editing

#### Adding Nodes
1. Click "+ Child" button on node → new child appears
2. Click "+ Sibling" button on node → new sibling appears
3. Click any node title to edit immediately

#### Reorganizing
- **Reorder Siblings**: Drag node left/right within sibling group
- **Promote**: Click "↑" button to move up one level
- **Demote**: Click "↓" button to move down one level
- **Move Subtree**: Drag node with children (entire subtree moves)

#### Browsing Deep Trees
- **Collapse**: Click indentation line to fold subtree
- **Expand**: Click indentation line to unfold subtree
- **Show Level**: Use depth controls to show up to specific depth
- **Navigate**: TAB/SHIFT+TAB to move between siblings

---

## 5. Accessibility

### WCAG 2.1 Compliance Target: AA

| Criterion | Status | Notes |
|-----------|--------|-------|
| Color Contrast | ✅ Pass | Text meets 4.5:1 minimum ratio |
| Keyboard Navigation | ✅ Full | TAB, SHIFT+TAB, ENTER, ESC work throughout |
| Focus Management | ✅ Pass | Visible focus indicators on all interactive elements |
| Semantic HTML | ✅ Full | Proper heading hierarchy and button semantics |
| ARIA Labels | ⏳ Partial | Basic labels present; full ARIA tree implementation pending |
| Motion Sensitivity | ✅ Pass | Respects `prefers-reduced-motion` media query |

---

## 6. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Initial Load** | < 500ms | Single HTML file, minimal JS |
| **Node Add** | < 50ms | Immediate DOM insertion + re-render |
| **Node Delete** | < 100ms | Includes re-render of tree |
| **Drag & Drop** | < 16ms (60fps) | Smooth animations during drag |
| **Outline Switch** | < 200ms | Full tree re-render from localStorage |
| **Storage Write** | < 10ms | localStorage JSON serialization |
| **Max Outline Size** | ~1000 nodes | Tested performance limit before noticeable lag |

---

## 7. Future Enhancements

### Phase 2: Export/Import
- [ ] Export as OPML (standard outline format)
- [ ] Export as Markdown nested lists
- [ ] Export as JSON (portable format)
- [ ] Import from OPML files
- [ ] Import from text files (auto-parsing)

### Phase 3: Search & Filtering
- [ ] Full-text search across all nodes
- [ ] Filter by depth level
- [ ] Search history
- [ ] Saved searches

### Phase 4: Rich Content
- [ ] Markdown rendering in nodes
- [ ] Code syntax highlighting
- [ ] Inline links and references
- [ ] Embedded media (images, links)

### Phase 5: Collaboration
- [ ] Read-only share links
- [ ] Export for sharing
- [ ] Optional server sync
- [ ] Multi-device sync

### Phase 6: Advanced Features
- [ ] Undo/Redo stack
- [ ] Version history
- [ ] Node templates
- [ ] Custom colors per node
- [ ] Tags and categories
- [ ] Backlinks and bi-directional links

---

## 8. Known Issues & Workarounds

### Current Limitations
- **No Undo**: Changes are permanent after save
  - Workaround: Keep browser history for accidental deletes
  
- **localStorage Quota**: Limited to ~5-10MB per domain
  - Workaround: Export/backup large outlines regularly
  
- **Single Device**: No cross-device sync
  - Workaround: Manual export/import to share between devices
  
- **No Search**: Must manually navigate to find nodes
  - Workaround: Use browser Ctrl+F (searches visible nodes only)

---

## 9. Testing Procedures

### Manual Test Suite

**Node Operations**
- [ ] Create root node
- [ ] Create nested child (2+ levels)
- [ ] Edit node title (click, edit, ENTER/ESC)
- [ ] Delete single node
- [ ] Delete node with children (confirm behavior)
- [ ] Promote node (move up one level)
- [ ] Demote node (move down one level)

**Keyboard Navigation**
- [ ] TAB moves to next sibling and enters edit mode
- [ ] SHIFT+TAB moves to previous sibling
- [ ] TAB wraps from last to first sibling
- [ ] SHIFT+TAB wraps from first to last sibling
- [ ] ENTER saves edit
- [ ] ESC cancels edit without saving
- [ ] Cmd/Ctrl+Shift+D toggles DEV_MODE

**Drag & Drop**
- [ ] Drag left of node → preview outline appears left
- [ ] Drag center of node → thick border on target
- [ ] Drag right of node → preview outline appears right
- [ ] Drop left → node inserted before
- [ ] Drop center → node shifts incumbent down
- [ ] Drop right → node inserted after
- [ ] Drag with children → entire subtree moves

**Toolbar**
- [ ] Expand All unfolds entire tree
- [ ] Collapse All folds entire tree
- [ ] Home button scrolls to top
- [ ] Depth level buttons show/hide appropriately
- [ ] Depth toggle works as expected

**Outline Management**
- [ ] Create new outline with valid name
- [ ] Switch between outlines via dropdown
- [ ] Active outline persists on page reload
- [ ] Sample outlines load on first run
- [ ] Force reset clears data and reloads samples

---

## 10. Deployment & Distribution

### Current Deployment
- **Location**: `/outlines-prototype/` directory on MyDayHub server
- **URL**: `http://localhost/outlines-prototype/` (development)
- **Access**: Direct HTTP (no authentication required for prototype)

### Future Integration
- Add "Outlines" tab to main MyDayHub application
- Share authentication session with main app
- Integrate with MyDayHub theme system (already partially implemented)
- Optional backend storage for outline sync

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 0.1 | 2025-10-14 | ✅ Complete | Initial prototype, core functionality |
| 0.2 | 2025-10-15 | ✅ Complete | Keyboard navigation, DEV_MODE |
| 0.3 | 2025-10-16 | ✅ Complete | Layout redesign to hierarchical outliner |
| 1.0 | 2025-10-19 | ✅ Complete | Drag & drop refinement, visual feedback |

---

**Document Author**: AI Assistant  
**Last Review**: 2025-10-19  
**Status**: Ready for Implementation Handoff
