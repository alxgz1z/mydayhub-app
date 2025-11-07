# DEV_MODE Badge - Troubleshooting Guide

## Badge Not Showing? Follow These Steps:

### Step 1: Verify DEV_MODE is Enabled

**Method A: Check URL**
1. Open: `http://localhost/outlines-prototype/index.html?dev=true`
2. Open browser console (F12)
3. Look for: `✅ DEV_MODE enabled via query parameter`

**Method B: Check localStorage**
1. Open app normally
2. Press `Cmd+Shift+D` (Mac) or `Ctrl+Shift+D` (Windows)
3. Open browser console
4. Look for: `✅ DEV_MODE enabled` or `❌ DEV_MODE disabled`
5. Type: `window.DEV_MODE` and press Enter
6. Should show: `true`

### Step 2: Verify Tree Structure

1. Create at least one root node
2. Add at least one child to that root node
3. Check browser console - should see logs like:
   ```
   🏷️  DEV_MODE badge check for node 2: label="A", parent_id=1
   ✅ Badge added: A
   ```

### Step 3: Check CSS is Loading

1. Open DevTools (F12)
2. Right-click on a node
3. Click "Inspect"
4. Look for `.node-dev-label` element
5. Check "Styles" tab - should see orange styling:
   - `background-color: rgba(255, 165, 0, 0.15)`
   - `border: 1px solid #ffa500`
   - `color: #ffa500`

### Step 4: Check for JavaScript Errors

1. Open DevTools Console (F12)
2. Look for any red error messages
3. Common errors:
   - `DevLabels is not defined` → `tree-model.js` didn't load
   - `Cannot read property 'getLabelForNode'` → Same issue
   - `window.DEV_MODE is undefined` → `app.js` didn't load

### Step 5: Manual Verification

1. Open: `http://localhost/outlines-prototype/test-dev-mode.html`
2. Click "Check DEV_MODE Status"
3. Click "Test Label Generation"
4. Should see expected badge labels

## Expected Console Logs

When rendering nodes with DEV_MODE enabled, you should see:

```
✅ DEV_MODE enabled via query parameter
Window.DEV_MODE = true
🏷️  DEV_MODE badge check for node 2: label="A", parent_id=1
✅ Badge added: A
🏷️  DEV_MODE badge check for node 3: label="A1", parent_id=2
✅ Badge added: A1
```

## Visual Verification

### What You Should See:
- Orange badge appears in node footer
- Badge shows letter/number (e.g., "A", "A1", "B2a")
- Badge is to the right of all action buttons
- Badge moves with the node when dragging

### What You Should NOT See:
- Root nodes never have badges
- Badges should be monospace font, small (12px)
- Badges should have orange border and background

## If Still Not Working

1. **Clear browser cache:**
   - Cmd+Shift+Delete (Mac) / Ctrl+Shift+Delete (Windows)
   - Select "Cached images and files"
   - Clear

2. **Check file timestamps:**
   ```bash
   ls -lt outlines-prototype/js/*.js
   ls -lt outlines-prototype/css/*.css
   ```

3. **Verify files were edited:**
   ```bash
   grep -n "node-dev-label" outlines-prototype/css/style.css
   grep -n "DevLabels" outlines-prototype/js/tree-model.js
   grep -n "window.DEV_MODE" outlines-prototype/js/tree-render.js
   ```

4. **Hard reload the page:**
   - Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
   - This bypasses cache

5. **Open diagnostic page:**
   ```
   http://localhost/outlines-prototype/test-dev-mode.html
   ```

## Debug Mode Tricks

### Enable Debug Logging
In browser console:
```javascript
// Enable DEV_MODE
localStorage.setItem('outlines_dev_mode', 'true');
location.reload();

// Check it's enabled
console.log('DEV_MODE:', window.DEV_MODE);
```

### Monitor Console Output
```javascript
// Watch for badge additions
setInterval(() => {
    const badges = document.querySelectorAll('.node-dev-label');
    console.log(`Found ${badges.length} DEV_MODE badges`);
}, 1000);
```

### Check Node Structure
```javascript
// In browser console:
const nodes = document.querySelectorAll('.node-item');
console.log(`Total nodes: ${nodes.length}`);
nodes.forEach(node => {
    const badge = node.querySelector('.node-dev-label');
    console.log(`Node: ${node.dataset.nodeId}, Badge: ${badge?.textContent || 'NONE'}`);
});
```

## Still Stuck?

1. Open browser console (F12)
2. Copy all console output
3. Check:
   - Is `DevLabels` defined?
   - Does `tree-render.js` have the badge code?
   - Does CSS file have `.node-dev-label`?
   - Is `window.DEV_MODE` true?

Share these details for debugging!
