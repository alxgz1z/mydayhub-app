# DEV_MODE: Node Label Badges

## Overview
When DEV_MODE is enabled, hierarchical labels are displayed in the footer of each node (except root nodes). These labels help track the origin and depth of each node in the tree structure.

## Enabling DEV_MODE

### Method 1: Query Parameter
```
http://localhost/outlines-prototype/index.html?dev=true
```

### Method 2: Keyboard Shortcut
Press **Cmd+Shift+D** (Mac) or **Ctrl+Shift+D** (Windows/Linux) to toggle DEV_MODE on/off.

### Method 3: Direct localStorage
Open browser DevTools Console and run:
```javascript
localStorage.setItem('outlines_dev_mode', 'true');
location.reload();
```

## Label Format

Labels follow a hierarchical pattern:

- **Root nodes**: No label (no badge shown)
- **Children of Root**: `A`, `B`, `C`, `D`, ... (uppercase letters)
- **Children of A**: `A1`, `A2`, `A3`, ... (letter + numbers)
- **Children of A1**: `A1a`, `A1b`, `A1c`, ... (alternating letters/numbers)
- **Children of A1a**: `A1a1`, `A1a2`, ... (continuing pattern)

### Example Tree Structure
```
Root Node 1
├─ A (first child)
│  ├─ A1 (first child of A)
│  │  ├─ A1a (first child of A1)
│  │  └─ A1b (second child of A1)
│  └─ A2 (second child of A)
└─ B (second child of root)
   └─ B1 (first child of B)
```

## Visual Appearance

Labels appear as small badges in the node's action footer with:
- **Background**: Orange with 15% opacity (`rgba(255, 165, 0, 0.15)`)
- **Border**: Orange (#ffa500)
- **Text Color**: Orange (#ffa500)
- **Font**: Monospace, 12px, semi-bold
- **Padding**: Minimal (2px 8px)

Labels are read-only and move with their nodes, regardless of tree structure changes.

## Use Cases

- **Debugging**: Track node positions in complex trees
- **Documentation**: Reference specific nodes by their labels
- **Testing**: Verify tree structure integrity
- **Development**: Monitor hierarchy changes during operations

## Technical Details

- Labels are generated dynamically based on current tree structure
- If a node is moved or reparented, its label updates automatically on re-render
- Root nodes never have labels (first-level children only)
- Labels are always visible when DEV_MODE is enabled, in the footer next to action buttons
