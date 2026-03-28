# Catppuccin Mocha Style Guide for Armsforge

This document outlines the color scheme and styling conventions used throughout the Armsforge plugin.

## Color Palette

### Base Colors
- **Base**: `#1e1e2e` - Primary background
- **Surface0**: `#313244` - Secondary background
- **Surface1**: `#45475a` - Elevated surfaces
- **Text**: `#cdd6f4` - Primary text

### Accent Colors
- **Mauve**: `#cba6f7` - Primary brand/accent color
- **Red**: `#f38ba8` - Errors, exploits, critical alerts
- **Yellow**: `#f9e2af` - Warnings, OPSEC alerts
- **Green**: `#a6e3a1` - Success, evasion indicators
- **Blue**: `#89b4fa` - Information, functions
- **Pink**: `#f5c2e7` - Loaders, secondary actions
- **Peach**: `#fab387` - Privilege escalation, numbers

## Security Context Colors

### Threat Levels
- 🟢 **Low**: Blue (`#89b4fa`)
- 🟡 **Medium**: Yellow (`#f9e2af`)
- 🟠 **High**: Red (`#f38ba8`)
- 🔴 **Critical**: Bold Red (`#f38ba8`)

### Operation Types
- **Exploit Development**: Red (`#f38ba8`)
- **Payload Generation**: Mauve (`#cba6f7`)
- **Loader Creation**: Pink (`#f5c2e7`)
- **OPSEC Review**: Yellow (`#f9e2af`)
- **Privilege Escalation**: Peach (`#fab387`)
- **Detection Evasion**: Green (`#a6e3a1`)

## Terminal Output Styling

### Status Messages
```
✓ Success messages (Green)
⚠ Warning messages (Yellow)
✗ Error messages (Red)
ℹ Information messages (Blue)
```

### Hierarchical Text
```
═══ Title Text (Mauve, Bold, Underlined) ═══
── Section Headers (Lavender, Bold) ──
• Bullet points (Muted overlay)
→ Arrows and connectors (Muted overlay)
```

### Code Elements
```
`inline code` (Text on Surface0 background)
Variables (Primary text color)
Keywords (Mauve, bold)
Strings (Green)
Numbers (Peach)
Comments (Overlay0, italic)
```

## CSS Variables for Documentation

Use these CSS variables for consistent theming in documentation and web interfaces:

```css
:root {
  /* Base colors */
  --ctp-base: #1e1e2e;
  --ctp-surface0: #313244;
  --ctp-text: #cdd6f4;

  /* Accent colors */
  --ctp-mauve: #cba6f7;
  --ctp-red: #f38ba8;
  --ctp-yellow: #f9e2af;
  --ctp-green: #a6e3a1;
  --ctp-blue: #89b4fa;

  /* Semantic mappings */
  --bg-primary: var(--ctp-base);
  --text-primary: var(--ctp-text);
  --accent-primary: var(--ctp-mauve);
  --success: var(--ctp-green);
  --warning: var(--ctp-yellow);
  --error: var(--ctp-red);
}
```

## Usage Guidelines

### DO:
- Use consistent colors for the same types of operations
- Apply proper contrast ratios for accessibility
- Use icons with semantic meaning
- Maintain color hierarchy (primary → secondary → muted)

### DON'T:
- Mix arbitrary colors outside the palette
- Use red for non-critical messages
- Overuse bright colors (maintain visual balance)
- Ignore accessibility contrast requirements

## Code Template Hints

When creating templates, include syntax highlighting hints in comments:

### Python
```python
# Catppuccin Mocha theme hints for syntax highlighting:
# Comments: #6c7086
# Keywords (def, class, import): #cba6f7
# Strings: #a6e3a1
# Numbers: #fab387
# Functions: #89b4fa
# Variables: #cdd6f4
```

### C#
```csharp
// Catppuccin Mocha theme hints for syntax highlighting:
// Comments: #6c7086
// Keywords (using, class, public): #cba6f7
// Strings: #a6e3a1
// Numbers: #fab387
// Methods: #89b4fa
// Types: #f9e2af
```

## Icons and Symbols

Use these Unicode symbols consistently:

- ⊗ Exploit/Target
- 🎯 Payload
- 📦 Loader
- 👁 OPSEC/Detection
- 🔑 Privilege Escalation
- 🛡 Evasion/Defense
- ★ Important/Featured
- • Bullet points
- → Flow/Direction
- › Nested items

## Accessibility Notes

- All color combinations meet WCAG AA contrast requirements
- Critical information is never conveyed by color alone
- Icons supplement color coding for better accessibility
- Text remains readable on all background variants

## Integration with IDEs

The Catppuccin theme is widely supported across development environments:

- **VS Code**: Catppuccin extension available
- **Vim/Neovim**: Multiple Catppuccin themes
- **Terminal**: Catppuccin terminal themes
- **iTerm2/Windows Terminal**: Theme profiles available

This ensures a consistent visual experience across the entire development workflow.