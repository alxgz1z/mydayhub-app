# Modal, Popover, and Slider Inventory

## Complete List of Overlay Elements

### Settings & Configuration (7)
1. **Settings Panel** (`settings-panel-overlay`)
   - Type: Panel (slide-in)
   - Z-Index: 999
   - Status: ✅ Fixed - Now uses ensureModalVisible with proper display override

2. **User Info Popover** (`user-info-popover-overlay`)
   - Type: Popover
   - Z-Index: 10000
   - Status: ✅ Uses ensureModalVisible

3. **Accent Color Modal** (`accent-color-modal`)
   - Type: Modal
   - Z-Index: 10000
   - Status: ⚠️ Needs validation check

4. **Session Timeout Modal** (`session-timeout-modal-overlay`)
   - Type: Modal
   - Z-Index: 10000
   - Status: ✅ Uses ensureModalVisible

5. **Usage Stats Modal** (`usage-stats-modal-overlay`)
   - Type: Modal
   - Z-Index: 10000
   - Status: ✅ Uses ensureModalVisible

6. **Trust Management Modal** (`trust-management-modal-overlay`)
   - Type: Modal
   - Z-Index: 10000
   - Status: ✅ Uses ensureModalVisible

7. **Change Password Modal** (`password-modal-overlay`)
   - Type: Modal
   - Z-Index: 10000
   - Status: ✅ Uses ensureModalVisible

### Tasks & Attachments (6)
8. **Attachments Modal** (`attachments-modal-overlay`)
   - Type: Modal
   - Z-Index: 10000
   - Status: ✅ Uses ensureModalVisible

9. **Attachment Viewer Modal** (`attachment-viewer-modal-overlay`)
   - Type: Modal
   - Z-Index: 1050
   - Status: ⚠️ Needs ensureModalVisible integration

10. **File Management Modal** (`file-management-modal-overlay`)
    - Type: Modal
    - Z-Index: 1000
    - Status: ⚠️ Needs ensureModalVisible integration

11. **Ready Recipients Modal** (`ready-recipients-modal-overlay`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

12. **Share Modal** (`share-modal-overlay`)
    - Type: Modal (dynamically created)
    - Z-Index: 10000
    - Status: ⚠️ Created dynamically, needs validation on creation

13. **Bulk Delete Modal** (`bulk-delete-modal-overlay`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

14. **Classification Popover** (`classification-popover`)
    - Type: Popover
    - Z-Index: 1000
    - Status: ⚠️ Different structure, may not need ensureModalVisible

### Calendar (4)
15. **Calendar Overlay Modal** (`calendar-overlay-modal-overlay`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

16. **Event Modal** (`event-modal-overlay`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

17. **JSON Import Modal** (`json-import-modal-overlay`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

18. **Calendar Export Modal** (`calendar-export-modal-overlay`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

### Dialogs & Confirmations (2)
19. **Confirm Dialog** (`confirm-modal-overlay`)
    - Type: Modal
    - Z-Index: 11000 (highest priority)
    - Status: ✅ Uses ensureModalVisible with special z-index handling

20. **Date Picker Modal** (`date-modal-overlay`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

### User Guide & Help (2)
21. **User Guide Modal** (`user-guide-modal`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

22. **Mission Focus Popover** (`mission-focus-popover-overlay`)
    - Type: Popover
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

### Editor (3)
23. **Unified Editor Overlay** (`unified-editor-overlay`)
    - Type: Modal
    - Z-Index: 1200
    - Status: ⚠️ Lower z-index, may need ensureModalVisible integration

24. **Regex Help Modal** (`regex-help-modal`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ⚠️ Needs ensureModalVisible integration

25. **Markdown Help Modal** (`markdown-help-modal`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ⚠️ Needs ensureModalVisible integration

### Journal (4)
26. **Journal Menu Popover** (`journal-menu-popover`)
    - Type: Popover (dynamically created)
    - Z-Index: 1000
    - Status: ⚠️ Created dynamically, needs validation on creation

27. **Journal Move Modal** (`journal-move-modal-container`)
    - Type: Modal (dynamically created)
    - Z-Index: 10000
    - Status: ⚠️ Created dynamically, needs validation on creation

28. **Journal Date Jump Modal** (`journal-date-jump-modal-container`)
    - Type: Modal (dynamically created)
    - Z-Index: 10000
    - Status: ⚠️ Created dynamically, needs validation on creation

29. **Journal Classification Popover** (`journal-classification-popover`)
    - Type: Popover
    - Z-Index: 1000
    - Status: ⚠️ Different structure, may not need ensureModalVisible

### Developer Tools (1)
30. **Developer Tools Modal** (`developer-tools-modal-overlay`)
    - Type: Modal
    - Z-Index: 10000
    - Status: ✅ Uses ensureModalVisible

## Summary

**Total Modals/Popovers: 30**

- ✅ **Validated & Fixed: 18** (60%)
- ⚠️ **Needs Integration: 12** (40%)

## Z-Index Hierarchy

1. **Confirm Dialogs**: 11000 (highest - always on top)
2. **Standard Modals**: 10000 (most modals)
3. **Editor Overlay**: 1200 (special case)
4. **Attachment Viewer**: 1050 (above attachments modal)
5. **Settings Panel**: 999 (slide-in panel)
6. **Popovers**: 1000 (contextual)
7. **File Management**: 1000 (nested modals)

## Usage

### In Browser Console:

```javascript
// Validate all modals
const results = validateAllModals();
logValidationResults(results);

// Validate specific modal
const status = validateModal('settings-panel-overlay');
console.log(status);

// Access registry
console.log(MODAL_REGISTRY);
```

### Automatic Validation

In development mode, validation runs automatically 1 second after page load and logs results to console.

## Next Steps

1. Integrate `ensureModalVisible` into remaining modals
2. Test all modals for proper visibility
3. Standardize z-index values where needed
4. Ensure dynamically created modals use validation

