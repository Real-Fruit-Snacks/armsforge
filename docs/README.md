# Armsforge Website

This directory contains the GitHub Pages website for Armsforge, an offensive security toolkit for Claude Code.

## 🏗️ Structure

```
docs/
├── index.html          # Main website page
├── css/
│   └── style.css       # Catppuccin-themed styling
├── js/
│   └── main.js         # Interactive features
├── assets/             # Images and static assets
├── _config.yml         # GitHub Pages configuration
├── _headers           # Security headers
└── README.md          # This file
```

## 🎨 Design System

### Color Scheme (Catppuccin Mocha)
- **Primary Background**: `#11111b` (base)
- **Secondary Background**: `#181825` (mantle)
- **Accent Colors**: `#f38ba8` (red), `#cba6f7` (mauve), `#f5c2e7` (pink)
- **Text Colors**: `#cdd6f4` (text), `#bac2de` (subtext1), `#a6adc8` (subtext0)

### Typography
- **Primary Font**: Inter (sans-serif)
- **Code Font**: JetBrains Mono (monospace)

### Components
- **Premium Cards**: 3D hover effects with gradient borders
- **Floating Animation**: Offensive security themed floating cards
- **Code Blocks**: Terminal-style with copy functionality
- **Mobile Navigation**: Hamburger menu with focus trapping
- **Scroll Animations**: Intersection Observer-based reveals

## 🚀 Features

### Interactive Elements
- **Mobile-responsive navigation** with hamburger menu
- **Smooth scrolling** to sections
- **Copy-to-clipboard** for code examples
- **Animated statistics** counters
- **Scroll-triggered animations** using Intersection Observer
- **Focus management** for accessibility
- **Keyboard shortcuts** support

### Performance Optimizations
- **Throttled scroll events** (16ms)
- **Debounced resize events** (250ms)
- **Lazy loading** with Intersection Observer
- **Respects `prefers-reduced-motion`**
- **Optimized animations** for smooth 60fps

### Security Features
- **Content Security Policy** headers
- **XSS protection** headers
- **Frame options** to prevent clickjacking
- **Secure referrer policy**

## 🔧 Customization

### Adding New Sections
1. Add HTML structure to `index.html`
2. Add corresponding CSS to `style.css`
3. Update navigation links if needed
4. Add scroll animation classes for auto-reveal

### Modifying Colors
Update CSS custom properties in `:root` selector:
```css
:root {
  --accent-primary: #your-color;
  --bg-primary: #your-bg;
  /* ... other variables */
}
```

### Adding New Tools/Agents
Update the respective grid sections in `index.html`:
- `.tools-grid` for MCP tools
- `.agent-cards` for specialized agents
- `.features-grid` for main features

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 480px - 767px
- **Small Mobile**: <480px

## 🎯 SEO & Performance

### Meta Tags
- Open Graph tags for social sharing
- Twitter Card meta tags
- Structured data for search engines
- Optimized meta descriptions

### Performance
- Optimized font loading with `preconnect`
- Minified and compressed CSS
- Efficient JavaScript with modern patterns
- Progressive enhancement approach

## 🔗 External Dependencies

### Fonts
- **Inter**: Primary UI font from Google Fonts
- **JetBrains Mono**: Code/terminal font from Google Fonts

### APIs Used
- **Intersection Observer**: Scroll animations
- **Clipboard API**: Copy functionality
- **Performance API**: Load time monitoring

## 🚀 Deployment

### GitHub Pages Setup
1. Enable GitHub Pages in repository settings
2. Set source to `/docs` folder
3. Update `_config.yml` with correct URL
4. Update navigation links in `index.html`

### Custom Domain (Optional)
1. Add `CNAME` file with your domain
2. Update `_config.yml` URL setting
3. Configure DNS records

## ⚠️ Legal Compliance

The website includes appropriate disclaimers for offensive security tools:
- Legal use warnings
- Authorized testing requirements
- Responsible disclosure guidelines
- Educational purpose statements

## 🎨 Brand Guidelines

### Logo Usage
- Primary logo: ⚔️ + "Armsforge"
- Color: Use accent colors on dark backgrounds
- Spacing: Maintain proper spacing around logo

### Voice & Tone
- **Professional**: Enterprise security focus
- **Technical**: Detailed technical information
- **Responsible**: Emphasize legal and ethical use
- **Accessible**: Clear documentation and examples

---

**Note**: This website is designed for showcasing an offensive security toolkit. Ensure all content complies with applicable laws and your organization's security policies.