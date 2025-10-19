# Outlines Prototype - Quick Start Guide

## Opening the App

1. Navigate to: `http://localhost/outlines-prototype/index.html`
2. Or open the file directly in your browser from the file system

## First Steps

### Step 1: Explore the Sample Outline
The app loads with a "Welcome to Outlines" sample outline containing a sample project structure. Take a moment to explore:
- Click the arrows to expand/collapse nodes
- Hover over nodes to see action buttons
- Notice the child count badges

### Step 2: Create Your First Outline
1. Click the **"+"** button in the sidebar header
2. Enter a name (e.g., "My Project")
3. Press Enter or click "Create"
4. Your new outline appears in the sidebar and is automatically selected

### Step 3: Add Nodes
1. Click **"+ Add Node"** in the toolbar
2. Enter a title for your root node
3. Press Enter
4. The node appears in the tree

### Step 4: Nest Nodes (Build Hierarchy)
1. Right-click on a node
2. Select **"Add Child Node"**
3. Enter the child node title
4. The new node appears indented under the parent

### Step 5: Organize with Drag & Drop
1. Click and hold a node
2. Drag it onto another node
3. Release to make it a child of the target
4. The hierarchy updates automatically

## Common Tasks

### Edit a Node Title
- **Double-click** the node title
- Edit the text in the modal
- Click "Save" or press Enter

### Move a Node
**Option 1: Drag & Drop**
- Drag node onto another to make it a child

**Option 2: Context Menu**
- Right-click → "Promote" (move to parent's level)
- Right-click → "Demote" (move under previous sibling)

### Hide a Branch
- Right-click node → "Fold"
- The entire branch hides
- Click the arrow to expand again

### Duplicate a Node and Its Children
- Right-click node → "Duplicate"
- Creates an exact copy of the node and all its descendants
- Appears right after the original

### Delete a Node
- Right-click node → "Delete"
- Confirm the action
- The node and all its children are removed

### Mark a Node Private
- Right-click node → "Make Private"
- The node shows a diagonal cross-hatch pattern
- Toggle "Make Public" to reverse

## Tips & Tricks

### Batch Operations
- **Expand All**: Click "Expand All" to open all branches
- **Collapse All**: Click "Collapse All" to fold all branches
- Great for navigation or overview switching

### Context Menu
Right-click any node to see all available operations:
- Add Child Node
- Promote / Demote
- Fold / Unfold
- Make Private / Public
- Duplicate
- Delete

### Keyboard Navigation
- **Enter**: Confirm dialogs and modals
- **Escape**: Close dialogs and menus
- **Double-click**: Edit node titles inline

### Child Count Badge
Numbers appearing on nodes indicate how many direct children they have. Private nodes are marked with a subtle diagonal pattern.

## Data Persistence

✅ All changes are automatically saved to your browser's localStorage
✅ Your outlines persist across browser sessions
✅ Each browser profile has its own data storage

To clear all data: Open browser DevTools → Application → localStorage → Remove `outlines_data`

## Troubleshooting

### Changes Not Saving
- Check that localStorage is enabled in your browser
- Most modern browsers have this enabled by default
- Try opening the app in a new tab or refreshing

### Nodes Not Appearing
- Check that the outline is selected in the sidebar
- Try clicking "Expand All" button
- Some nodes may be folded (click arrows to expand)

### Drag & Drop Not Working
- Make sure you're clicking and dragging on the node item
- Try dragging over a node with children first (easier target)
- Give visual feedback 1-2 seconds for the drop animation

## Keyboard Shortcuts Reference

| Action | Shortcut |
|--------|----------|
| Confirm Input | Enter |
| Close Modal | Escape |
| Edit Node | Double-click |
| Right-click Menu | Right-click |
| Drag Node | Click + Drag |

## Sample Use Cases

### Project Planning
1. Create an outline for your project
2. Add phases as root nodes
3. Break down each phase into tasks
4. Use drag & drop to reorganize
5. Mark completed items as private for reference

### Research Organization
1. Create outline for your topic
2. Build a taxonomy of subtopics
3. Add notes as child nodes
4. Fold branches for focused reading
5. Expand when ready to explore

### Meeting Notes
1. Create outline for the meeting
2. Add agenda items as nodes
3. Add action items as children
4. Private node for decisions reached
5. Reference in follow-ups

## What's Next?

Once you're comfortable with the prototype:
- Experiment with complex hierarchies (10+ levels deep)
- Try mixing public and private nodes
- Explore the visual pattern of cross-hatch on private nodes
- Check how your data persists by refreshing the page

## Support

This is a prototype and may have some rough edges. Feedback is welcome!

Report issues or suggest features for integration into the main app.
