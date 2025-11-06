# LATEST SAFE CODE BASE TO ROLL BACK TO

**Version: Nosara 8.7**

**Date: November 5, 2025**

## IMPORTANT

This commit represents the **LATEST SAFE CODE BASE TO ROLL BACK TO**. 

Until further instructions, if you are asked to pull a stable codebase, **this is it**.

## What's Included

- Developer Debug Settings modal with granular preference controls
- Improved "+New Entry" and "+New Task" input behavior (stays focused after Enter)
- Consistent DEVMODE usage across the codebase
- All debugging aids properly controlled by individual preferences

## Key Features

- Developer Settings modal allows individual control of 11 debug preferences
- Fluid entry creation: input fields stay focused and expanded after Enter key
- ESC key or click outside to collapse input fields
- Complete DEVMODE standardization

## Rollback Instructions

To rollback to this stable point:

```bash
git checkout <commit-hash-of-nosara-8.7>
```

Or use the git tag if one is created:

```bash
git checkout nosara-8.7
```

---

**Note:** This document should be updated whenever a new stable rollback point is established.

