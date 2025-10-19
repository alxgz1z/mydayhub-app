# OUTLINES PROTOTYPE - COMPLETE REDESIGN

## The Problem with Previous Attempts
We were trying to force a "nested columns" layout that would fit N cards per row horizontally. This doesn't work because:
1. Flexbox/Grid flattens nested structures
2. Parent-child relationships get lost in layout
3. Infinite nesting makes horizontal scrolling chaotic

## The Solution: Hierarchical Outliner (Research Tool)

Instead of mindmap cards, build a **tree outliner** like Roam Research/Logseq:

### Core Concept
```
├─ Root 1
│  ├─ Child A
│  │  ├─ Grandchild A1
│  │  └─ Grandchild A2
│  └─ Child B
└─ Root 2
   └─ Child C
```

### Key Features
1. **Vertical hierarchy** - no horizontal columns needed
2. **Indentation** shows depth - parents on left, children indented right
3. **Collapsible** - each node can fold/unfold
4. **Inline editing** - edit titles directly
5. **Full width usage** - cards expand to use available space
6. **Connection lines** - visual hierarchy with borders
7. **Drag & drop** - move nodes around
8. **Quick add** - buttons to add/edit

### Layout Approach
```css
.outline-item {
    margin-left: (depth * indent-amount);
    border-left: 2px solid accent;
    padding-left: 1rem;
}
```

Simple! Each depth level gets more indentation.

### Why This Works for Research
1. **Tree structure** matches how research works - explore branches
2. **Quick navigation** - collapse branches you don't need
3. **Inline editing** - capture thoughts immediately
4. **Clean view** - focus on what matters
5. **Infinite depth** - no layout constraints
6. **Print/export** - works naturally for outlines

## Implementation Strategy

1. Delete all current CSS for tree layout
2. Create simple outliner CSS (indentation + borders)
3. Rebuild HTML rendering to use indentation not columns
4. Keep all JavaScript features (edit, add, delete, drag-drop)
5. Add visual enhancements (colors, hover effects, icons)
6. Test with deep nesting (10+ levels)

