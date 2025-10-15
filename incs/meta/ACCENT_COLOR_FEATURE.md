# Accent Color Customization Feature

## Overview
The MyDayHub app now supports user-customizable accent colors with preset options and a custom color picker. The selected color persists across sessions and works seamlessly with all three theme modes (Dark, Light, High-Contrast).

## Features Implemented

### 1. Settings Panel Integration
- **Location**: Settings panel → "Accent Color" option
- **Button**: Shows current accent color preview with "Customize" text
- **Hover Effect**: Smooth gradient hover effect matching app design language

### 2. Accent Color Modal
- **Preset Colors**: 4 carefully selected colors that work well across all themes:
  - **Green** (#22c55e) - Costa Rica Green (Default)
  - **Blue** (#3b82f6) - Ocean Blue
  - **Purple** (#8b5cf6) - Mystic Purple
  - **Amber** (#f59e0b) - Sunset Amber

- **Custom Color Picker**: Native HTML5 color picker for unlimited customization
- **Live Preview**: Real-time preview of selected color on sample button and icon
- **Reset to Default**: One-click reset to Costa Rica Green

### 3. Dynamic CSS Variable Updates
The accent color dynamically updates the following CSS custom properties:
- `--accent-color`: Primary accent color
- `--accent-gradient`: Gradient for buttons and highlights
- `--accent-gradient-light`: Lighter gradient variant
- `--accent-gradient-hover`: Darker gradient for hover states
- `--btn-hover-bg`: Button hover background (10% opacity of accent)
- `--btn-success-bg`: Success button background
- `--btn-success-hover-bg`: Success button hover state
- `--toast-success-bg`: Success toast notification background

### 4. Color Variations
Automatically generates lighter (+20%) and darker (-15%) variations for:
- Gradient effects
- Hover states
- Button states
- UI depth and hierarchy

### 5. Persistence
- **localStorage**: Immediate application on page load
- **Database**: Persists across devices and browsers via user preferences API
- **Sync**: Automatically syncs between localStorage and backend

### 6. Theme Compatibility
All preset colors have been tested to ensure:
- Sufficient contrast in Dark mode
- Readability in Light mode
- High visibility in High-Contrast mode
- WCAG AA compliance for text on colored backgrounds

## Technical Implementation

### Files Modified

#### 1. `/index.php`
- Added "Accent Color" button to settings panel
- Added accent color modal with preset grid and custom picker
- Includes preview section for real-time color testing

#### 2. `/uix/settings.css`
- Styled accent color button with preview swatch
- Complete modal styling with responsive grid layout
- Preset color buttons with hover and selected states
- Custom color picker styling
- Preview element styling

#### 3. `/uix/app.js`
- `initAccentColorPicker()`: Initializes modal and event listeners
- `updateAccentPreview()`: Updates preview elements with selected color
- `updatePresetSelection()`: Manages preset button selection state
- `applyAccentColorToUI()`: Applies color to CSS custom properties
- `generateColorVariations()`: Generates lighter/darker variations
- `adjustBrightness()`: Helper function for color manipulation
- `loadAccentColorPreference()`: Loads saved color from backend
- `saveAccentColorPreference()`: Saves color to backend and localStorage

#### 4. `/api/users.php`
- Modified `getUserPreferences` to accept both GET and POST methods
- Uses existing `saveUserPreference` infrastructure
- Stores accent color in user preferences JSON field

## Usage

### For Users
1. Open Settings panel (hamburger icon)
2. Click "Accent Color" → "Customize"
3. Choose a preset or pick a custom color
4. See live preview
5. Click "Apply" to save
6. Click "Reset to Default" to restore Costa Rica Green

### For Developers
```javascript
// Apply a custom accent color programmatically
applyAccentColorToUI('#3b82f6');

// Save accent color to backend
await saveAccentColorPreference('#3b82f6');

// Load accent color from backend
await loadAccentColorPreference();
```

## Color Accessibility Guidelines

When users select custom colors, the app ensures:
- Automatic generation of harmonious variations
- Consistent opacity levels for hover states
- Preservation of UI hierarchy through color variations

### Recommended Color Ranges
- **Saturation**: 50-100% for vibrant UI elements
- **Lightness**: 40-60% for optimal contrast in all themes
- **Avoid**: Very dark (<20% lightness) or very light (>80% lightness) colors

## Future Enhancements
- Color palette suggestions based on user's current theme
- Ability to save multiple custom color presets
- Color blindness simulation and recommendations
- Export/import custom color schemes
- Seasonal theme presets

## Browser Compatibility
- **Color Picker**: Supported in all modern browsers (Chrome 91+, Safari 14.1+, Firefox 89+)
- **CSS Custom Properties**: Supported in all modern browsers
- **Fallback**: Default Costa Rica Green for unsupported browsers

## Testing Notes
- All preset colors tested in Dark, Light, and High-Contrast themes
- Custom colors automatically generate appropriate variations
- Color persistence verified across page refreshes and sessions
- Modal interactions tested on desktop and mobile viewports

