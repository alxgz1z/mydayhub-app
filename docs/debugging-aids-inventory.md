# Debugging Aids Inventory

This document lists all debugging aids that are enabled when DEVMODE is active.

## Frontend Debugging Aids

### 1. Element ID Display
- **Task IDs**: Shows `(task_id)` suffix in task titles
- **Column IDs**: Shows `[column_id]` suffix in column titles  
- **Journal Entry IDs**: Shows `[entry_id]` suffix in journal entry titles
- **Location**: `uix/tasks.js` (lines 2625-2628, 2561, 2600-2602), `uix/journal.js` (line 1062)

### 2. Footer Visual Indicators
- **DEV Badge**: Green "DEV" badge in top-right of footer
- **Footer Border**: 3px green accent border at top of footer
- **Location**: `index.php` (line 675), `uix/style.css` (lines 2077-2115)

### 3. Construction Button
- **Button**: 🚧 emoji button in footer that opens layout report
- **Location**: `index.php` (lines 685-689), `uix/app.js` (lines 763-803)

### 4. Console Debugging
- **Console Messages**: Various `console.log()` statements throughout codebase
- **Console Ring Buffer**: Captures console.error/warn to `window.__consoleBuffer` (max 200 entries)
- **Unhandled Errors**: Captures window.onerror and unhandledrejection events
- **Location**: `uix/app.js` (lines 703-727), various files with console.log statements

### 5. Layout Report Hotkey
- **Hotkey**: Ctrl/Cmd + Alt + D sends layout report to `/api/debug.php`
- **Location**: `uix/tasks.js` (lines 107-159)

### 6. Footer Debug Function
- **Function**: `debugDevModeFooter()` logs footer state to console
- **Location**: `uix/app.js` (lines 3243-3261)

### 7. Modal Validation
- **Auto-validation**: Automatically runs modal validation on page load
- **Location**: `uix/modal-validator.js` (lines 483-488)

### 8. Detailed Error Messages
- **Auth Errors**: Shows detailed error messages in password reset flow
- **Location**: `uix/auth.js` (line 218)

## Backend Debugging Aids

### 9. Debug Messages in JSON Responses
- **Feature**: Adds `debug` array to JSON responses with debug messages
- **Location**: `incs/helpers.php` (lines 26-28), `api/auth.php` (lines 32-34)

### 10. Backend Error Logging
- **Feature**: Logs errors to `php-debug.log` file
- **Location**: `incs/config.php` (lines 94-98, 101-111)

### 11. Detailed Exception Messages
- **Feature**: Shows detailed error messages in exception handlers when DEVMODE is on
- **Location**: Various API files (e.g., `api/tasks.php` lines 2012, 2073, 2120)

### 12. Debug Endpoints Access
- **Endpoints**: `/api/debug.php`, `/api/debug_log.php`, `/api/debug_latest.php`
- **Location**: `api/debug.php`, `api/debug_log.php`, `api/debug_latest.php`

## Summary

**Total Frontend Aids**: 8
**Total Backend Aids**: 4
**Total**: 12 debugging aids

