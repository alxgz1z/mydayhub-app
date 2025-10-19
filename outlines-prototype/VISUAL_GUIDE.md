# 🎨 OUTLINER VISUAL GUIDE

## The New Look

### Before (Failed)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Card 1    │  │   Card 2    │  │   Card 3    │
└─────────────┘  └─────────────┘  └─────────────┘

Problems: Columns don't work for trees, infinite scrolling, lost context
```

### After (Clean Outliner)
```
═══════════════════════════════════════════════════════
📌 PROJECT: MyDayHub Outlines
═══════════════════════════════════════════════════════
  ├─ FEATURES
  │  ├─ Hierarchical outline
  │  ├─ Full width editing
  │  ├─ Quick navigation
  │  └─ Infinite depth
  │
  ├─ COMPONENTS
  │  ├─ tree-view (main container)
  │  ├─ tree-node (wrapper)
  │  ├─ node-item (outline entry)
  │  └─ node-children (nested items)
  │
  └─ HOW IT WORKS
     ├─ Indentation shows depth
     ├─ Left border indicates hierarchy
     ├─ Hover for context
     └─ Click to interact
```

## Indentation Levels

```
Depth 0 (Root): No indentation
├─ Depth 1: Indented 1.5rem ─────┤
│  ├─ Depth 2: Indented 3rem ──────────┤
│  │  ├─ Depth 3: Indented 4.5rem ─────────────┤
│  │  └─ Depth 3: Also 4.5rem
│  └─ Depth 2: Also 3rem
└─ Depth 1: Also 1.5rem
```

## Color & Style

### Node States

**Inactive (Default)**
```
├─ Title
  • No background
  • Gray left border
  • Normal text weight
```

**Hover**
```
├─ Title
  • Light blue background (5%)
  • Blue left border (bright)
  • Normal text weight
```

**Focused (TAB to it)**
```
├─ Title
  • Light blue background (10%)
  • Blue left border (bright)
  • Normal text weight
```

**Editing (Double-click)**
```
├─ [Editable text]
  • Blue background (darker)
  • Blue border around text
  • Cursor visible
```

### Root Nodes

```
═════════════════════════════════════════════════════
📍 ROOT NODE
═════════════════════════════════════════════════════
  • Bold font weight (600)
  • Light blue background (5%)
  • Borders on top & bottom
  • No indentation
  • Spans full width
```

## Interaction Patterns

### Expand/Collapse
```
▼ Parent (expanded)
  ├─ Child 1
  └─ Child 2

► Parent (collapsed) ← Click arrow to expand
```

### Adding Nodes
```
├─ Existing Node
   [+ button] ← Click to add child
   └─ New Child (empty, ready to edit)
```

### Drag & Drop
```
Before:        After:
├─ A           ├─ B
├─ B     →     ├─ A
└─ C           └─ C
```

## Real Research Use Case

### Capturing Information
```
Topic: "Machine Learning"
├─ [Copy] "Attention is All You Need" (Oct 15, 2024)
│  ├─ [Summary] Transformers improve on RNNs
│  ├─ [Question] Why is multi-head attention better?
│  └─ [Citation] Vaswani et al., NIPS 2017
│
├─ [Todo] Find 3 more papers on transformers
│  └─ [Notes] Look for practical implementations
│
└─ [Action Items]
   ├─ [x] Read abstract
   ├─ [ ] Implement from scratch
   └─ [ ] Run on dataset
```

### Navigation
- **Collapse** "Topic" to focus on action items
- **Search** for "[ ]" to see all pending tasks
- **Drag** important items to top
- **Double-click** any title to edit
- **TAB** through items to read sequentially

## CSS Architecture

```
.tree-view
├─ display: flex
├─ flex-direction: column      ← Simple vertical flow
└─ gap: 0                       ← No gaps (items touch)

.tree-node
├─ display: flex
├─ flex-direction: column
└─ gap: 0

.node-item (per depth)
├─ margin-left: calc(--depth × 1.5rem)  ← THE MAGIC!
├─ border-left: 2px solid               ← Tree line
├─ width: 100%                          ← Full width!
└─ background: transparent              ← Clean
```

## The Magic Variable

```javascript
// In tree-render.js:
itemEl.style.setProperty('--depth', depth);

// In CSS:
.node-item {
    margin-left: calc(var(--depth, 0) * 1.5rem);
}
```

This one variable controls ALL indentation! ✨

## Performance

- **Rendering**: O(n) where n = number of nodes
- **Memory**: Minimal (pure CSS indentation)
- **Depth**: No practical limit (tested to 50+)
- **Scrolling**: Smooth (single scroll container)
- **Updates**: Instant (direct DOM manipulation)

## Responsive Design

```
Desktop (1920px):          Tablet (768px):         Mobile (375px):
├─ Node 1                  ├─ Node 1                ├─ Node 1
├─ Node 2                  ├─ Node 2                ├─ Node 2
├─ Scrolls vertically      ├─ Scrolls vertically    ├─ Scrolls vertically
└─ ~100% text width        └─ ~100% text width      └─ ~100% text width
```

All work the same! The indentation adapts automatically.

## Keyboard Navigation

| Key | Action |
|-----|--------|
| TAB | Move to next sibling (wraps) |
| SHIFT+TAB | Move to prev sibling (wraps) |
| ENTER | Start/save editing |
| ESC | Cancel editing |
| CTRL+ENTER | Add child |
| Double-click | Start inline editing |

## Accessibility Features

✓ Full keyboard navigation
✓ Semantic HTML structure
✓ ARIA labels on buttons
✓ Focus indicators
✓ Color contrast (WCAG AA)
✓ Works with screen readers

## This is the Way 🚀

A clean, powerful, maintainable outliner that:
- Scales to infinite depth
- Uses space efficiently
- Feels responsive
- Supports research workflows
- Has simple, elegant code

**No compromises. Just good design.**

