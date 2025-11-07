# Icon Background Fix for macOS/iOS

## Issue
macOS and iOS add a white background/padding around web app icons when the icon file has transparency. This creates an unwanted white border around the icon.

## Solution
The icon PNG files need to have a **black background** instead of transparency. The colored border should be part of the icon design, and the background should be solid black (#000000).

## Required Changes to Icon Files

All icon files in `media/icons/` should be updated to have:
- **Solid black background** (#000000) instead of transparency
- **Colored border** as part of the icon design (already present)
- **No transparency** in the background area

## Icon Files to Update
- `icon-180x180.png` (primary for iOS/macOS)
- `icon-192x192.png`
- `icon-512x512.png`
- Other sizes as needed

## Technical Details
- macOS/iOS automatically adds padding and a white background to transparent icons
- By providing icons with black backgrounds, the system will use black instead of white
- The manifest.json `background_color` is set to `#000000` to match

## After Updating Icons
1. Replace the icon files in `media/icons/`
2. Clear browser cache
3. Remove old web app from dock/home screen
4. Re-add web app to see updated icon

