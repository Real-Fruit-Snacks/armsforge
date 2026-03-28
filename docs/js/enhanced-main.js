/**
 * Enhanced Armsforge Website with Accessibility and Professional Features
 * WCAG 2.1 AA Compliance + Professional Polish
 */

class EnhancedArmsforgeWebsite extends ArmsforgeWebsite {
  constructor() {
    super();
    this.initAccessibilityEnhancements();
    this.initProfessionalFeatures();
  }

  /**
   * Initialize accessibility enhancements
   */
  initAccessibilityEnhancements() {
    this.createSkipLinks();
    this.setupAriaAttributes();
    this.setupLiveRegions();
    this.setupKeyboardNavigation();
    this.setupScreenReaderOptimizations();
    this.setupFocusManagement();
    this.setupColorContrastToggle();
    this.announcePageLoad();
  }

  /**
   * Initialize professional features
   */
  initProfessionalFeatures() {
    this.setupStructuredData();
    this.setupPerformanceOptimizations();
    this.setupAnalyticsTracking();
    this.setupServiceWorker();
    this.setupErrorHandling();
  }

  /**
   * Create skip links for accessibility
   */
  createSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main" class="skip-link">Skip to main content</a>
      <a href="#nav-links" class="skip-link">Skip to navigation</a>
      <a href="footer" class="skip-link">Skip to footer</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);

    // Handle skip link functionality
    document.querySelectorAll('.skip-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId) || document.querySelector(link.getAttribute('href'));

        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });

          // Remove tabindex after focus
          target.addEventListener('blur', () => {
            target.removeAttribute('tabindex');
          }, { once: true });

          this.announceToScreenReader(`Jumped to ${target.getAttribute('aria-label') || targetId}`);
        }
      });
    });
  }

  /**
   * Setup comprehensive ARIA attributes
   */
  setupAriaAttributes() {
    // Main content
    const main = document.querySelector('main') || document.querySelector('.hero');
    if (main) {
      main.setAttribute('id', 'main');
      main.setAttribute('role', 'main');
      main.setAttribute('aria-label', 'Main content');
    }

    // Navigation enhancements
    const nav = document.querySelector('.nav');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
    }

    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
      navLinks.setAttribute('role', 'menubar');
      navLinks.querySelectorAll('li').forEach(li => {
        li.setAttribute('role', 'none');
        const link = li.querySelector('a');
        if (link) {
          link.setAttribute('role', 'menuitem');

          // Add aria-label for external links
          if (link.classList.contains('nav__link--external')) {
            const currentLabel = link.getAttribute('aria-label') || link.textContent;
            link.setAttribute('aria-label', `${currentLabel} (opens in new tab)`);
            link.setAttribute('rel', 'noopener noreferrer');
          }
        }
      });
    }

    // Mobile menu enhancements
    const hamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('nav-overlay');

    if (hamburger && overlay) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-controls', 'nav-overlay');
      hamburger.setAttribute('aria-label', 'Toggle navigation menu');

      overlay.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Mobile navigation menu');

      const overlayLinks = overlay.querySelector('.nav__overlay-links');
      if (overlayLinks) {
        overlayLinks.setAttribute('role', 'menu');
        overlayLinks.querySelectorAll('li').forEach(li => {
          li.setAttribute('role', 'none');
          const link = li.querySelector('a');
          if (link) {
            link.setAttribute('role', 'menuitem');
          }
        });
      }
    }

    // Section landmarks
    this.enhanceSectionAccessibility();

    // Form elements (if any)
    this.enhanceFormAccessibility();

    // Button enhancements
    this.enhanceButtonAccessibility();
  }

  /**
   * Enhance section accessibility
   */
  enhanceSectionAccessibility() {
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
      const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        const headingId = `section-heading-${index}`;
        heading.setAttribute('id', headingId);
        section.setAttribute('aria-labelledby', headingId);

        // Add appropriate landmarks based on content
        const headingText = heading.textContent.toLowerCase();
        if (headingText.includes('feature')) {
          section.setAttribute('role', 'region');
          section.setAttribute('aria-label', 'Features section');
        } else if (headingText.includes('install')) {
          section.setAttribute('role', 'region');
          section.setAttribute('aria-label', 'Installation instructions');
        } else if (headingText.includes('tool')) {
          section.setAttribute('role', 'region');
          section.setAttribute('aria-label', 'Tools and utilities');
        } else if (headingText.includes('agent')) {
          section.setAttribute('role', 'region');
          section.setAttribute('aria-label', 'AI agents and specialists');
        }
      }
    });
  }

  /**
   * Enhance form accessibility
   */
  enhanceFormAccessibility() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`) ||
                   input.closest('.form-control')?.querySelector('label');

      if (label && !input.getAttribute('aria-labelledby')) {
        const labelId = `label-${input.id || Math.random().toString(36).substr(2, 9)}`;
        label.setAttribute('id', labelId);
        input.setAttribute('aria-labelledby', labelId);
      }

      // Add required indicator
      if (input.hasAttribute('required')) {
        input.setAttribute('aria-required', 'true');
      }

      // Add error handling
      if (input.getAttribute('aria-invalid')) {
        const errorId = `error-${input.id}`;
        let errorElement = document.getElementById(errorId);
        if (!errorElement) {
          errorElement = document.createElement('div');
          errorElement.id = errorId;
          errorElement.className = 'form-error';
          errorElement.setAttribute('aria-live', 'polite');
          input.parentNode.appendChild(errorElement);
        }
        input.setAttribute('aria-describedby', errorId);
      }
    });
  }

  /**
   * Enhance button accessibility
   */
  enhanceButtonAccessibility() {
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
      if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
        // Add label for icon-only buttons
        const iconClass = button.className;
        if (iconClass.includes('hamburger')) {
          button.setAttribute('aria-label', 'Toggle navigation menu');
        } else if (iconClass.includes('copy')) {
          button.setAttribute('aria-label', 'Copy code to clipboard');
        } else if (iconClass.includes('close')) {
          button.setAttribute('aria-label', 'Close');
        }
      }
    });
  }

  /**
   * Setup live regions for dynamic announcements
   */
  setupLiveRegions() {
    // Polite live region
    if (!document.getElementById('live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'live-region';
      liveRegion.className = 'live-region sr-only';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }

    // Assertive live region
    if (!document.getElementById('status-region')) {
      const statusRegion = document.createElement('div');
      statusRegion.id = 'status-region';
      statusRegion.className = 'live-region sr-only';
      statusRegion.setAttribute('aria-live', 'assertive');
      statusRegion.setAttribute('aria-atomic', 'true');
      statusRegion.setAttribute('role', 'status');
      document.body.appendChild(statusRegion);
    }
  }

  /**
   * Enhanced keyboard navigation
   */
  setupKeyboardNavigation() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt + 1 for main content
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        this.jumpToLandmark('main');
      }

      // Alt + 2 for navigation
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        this.jumpToLandmark('navigation');
      }

      // Alt + 3 for search (if implemented)
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        this.jumpToLandmark('search');
      }

      // Alt + H for help
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        this.showKeyboardShortcuts();
      }
    });

    // Enhanced roving tabindex for main navigation
    this.setupRovingTabindex('.nav__links .nav__link');

    // Enhanced mobile menu keyboard support
    this.enhanceMobileMenuKeyboard();
  }

  /**
   * Setup roving tabindex for menu navigation
   */
  setupRovingTabindex(selector) {
    const items = document.querySelectorAll(selector);
    if (items.length === 0) return;

    let currentIndex = 0;

    // Initialize tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    items.forEach((item, index) => {
      item.addEventListener('keydown', (e) => {
        let newIndex = currentIndex;

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            newIndex = (currentIndex + 1) % items.length;
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
            break;
          case 'Home':
            e.preventDefault();
            newIndex = 0;
            break;
          case 'End':
            e.preventDefault();
            newIndex = items.length - 1;
            break;
          default:
            return;
        }

        currentIndex = newIndex;
        this.updateRovingTabindex(items, currentIndex);
      });

      item.addEventListener('focus', () => {
        currentIndex = index;
        this.updateRovingTabindex(items, currentIndex);
      });
    });
  }

  /**
   * Update roving tabindex
   */
  updateRovingTabindex(items, activeIndex) {
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
    });
    items[activeIndex].focus();
  }

  /**
   * Enhance mobile menu keyboard support
   */
  enhanceMobileMenuKeyboard() {
    const hamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('nav-overlay');

    if (!hamburger || !overlay) return;

    let lastFocusedElement = null;

    // Enhanced hamburger click handling
    hamburger.addEventListener('click', () => {
      lastFocusedElement = document.activeElement;

      setTimeout(() => {
        const isOpen = overlay.classList.contains('active');
        hamburger.setAttribute('aria-expanded', isOpen.toString());
        overlay.setAttribute('aria-hidden', (!isOpen).toString());

        if (isOpen) {
          this.trapFocusInElement(overlay);
          this.announceToScreenReader('Navigation menu opened');
        } else {
          this.restoreFocus(lastFocusedElement);
          this.announceToScreenReader('Navigation menu closed');
        }
      }, 100);
    });

    // Escape key handling for mobile menu
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeMobileMenu();
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (overlay.classList.contains('active') &&
          !overlay.contains(e.target) &&
          !hamburger.contains(e.target)) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Close mobile menu with proper accessibility
   */
  closeMobileMenu() {
    const hamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('nav-overlay');

    if (overlay) {
      overlay.classList.remove('active');
    }

    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.focus();
    }

    if (overlay) {
      overlay.setAttribute('aria-hidden', 'true');
    }

    this.announceToScreenReader('Navigation menu closed');
  }

  /**
   * Trap focus within an element
   */
  trapFocusInElement(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    setTimeout(() => firstElement.focus(), 100);

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    element._focusTrapHandler = handleTabKey;
  }

  /**
   * Restore focus to previous element
   */
  restoreFocus(element) {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }

  /**
   * Jump to landmark
   */
  jumpToLandmark(landmarkType) {
    let target = null;

    switch (landmarkType) {
      case 'main':
        target = document.querySelector('main, [role="main"], #main');
        break;
      case 'navigation':
        target = document.querySelector('nav, [role="navigation"]');
        break;
      case 'search':
        target = document.querySelector('[role="search"], .search');
        break;
      case 'footer':
        target = document.querySelector('footer, [role="contentinfo"]');
        break;
    }

    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });

      this.announceToScreenReader(`Jumped to ${landmarkType}`);

      // Remove tabindex after focus
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  }

  /**
   * Show keyboard shortcuts help
   */
  showKeyboardShortcuts() {
    const shortcuts = [
      'Alt + 1: Jump to main content',
      'Alt + 2: Jump to navigation',
      'Alt + H: Show this help',
      'Escape: Close menus and dialogs',
      'Tab: Navigate forward',
      'Shift + Tab: Navigate backward',
      'Arrow keys: Navigate within menus',
      'Enter/Space: Activate buttons and links'
    ];

    this.announceToScreenReader(`Keyboard shortcuts available: ${shortcuts.join('. ')}`);

    // You could also show a modal here
    console.log('Keyboard Shortcuts:', shortcuts);
  }

  /**
   * Screen reader optimizations
   */
  setupScreenReaderOptimizations() {
    // Hide decorative elements from screen readers
    const decorativeElements = document.querySelectorAll(
      '.floating-card__icon, .premium-card__icon, .tool-card__icon, .agent-card__icon, .nav__logo-icon'
    );

    decorativeElements.forEach(el => {
      el.setAttribute('aria-hidden', 'true');
    });

    // Enhance copy button feedback
    this.enhanceCopyButtonFeedback();

    // Add context to external links
    this.enhanceExternalLinks();

    // Improve stats readability
    this.enhanceStatsForScreenReaders();
  }

  /**
   * Enhance copy button feedback
   */
  enhanceCopyButtonFeedback() {
    const copyButtons = document.querySelectorAll('.code-block__copy');

    copyButtons.forEach(button => {
      const originalHandler = button.onclick;

      button.addEventListener('click', async () => {
        try {
          const textToCopy = button.getAttribute('data-copy');
          await navigator.clipboard.writeText(textToCopy);

          button.setAttribute('aria-live', 'assertive');
          this.announceToScreenReader('Code copied to clipboard', 'assertive');

          // Visual feedback
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          button.style.background = 'var(--success)';

          setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
            button.removeAttribute('aria-live');
          }, 2000);

        } catch (err) {
          this.announceToScreenReader('Failed to copy code', 'assertive');
        }
      });

      // Add keyboard support
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
  }

  /**
   * Enhance external links
   */
  enhanceExternalLinks() {
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([aria-label*="new tab"])');

    externalLinks.forEach(link => {
      const currentLabel = link.getAttribute('aria-label') || link.textContent;
      link.setAttribute('aria-label', `${currentLabel} (opens in new tab)`);
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('target', '_blank');
    });
  }

  /**
   * Enhance stats for screen readers
   */
  enhanceStatsForScreenReaders() {
    const stats = document.querySelectorAll('.stat');

    stats.forEach(stat => {
      const number = stat.querySelector('.stat__number');
      const label = stat.querySelector('.stat__label');

      if (number && label) {
        const value = number.textContent;
        const description = label.textContent;
        stat.setAttribute('aria-label', `${value} ${description}`);

        // Hide individual components from screen readers
        number.setAttribute('aria-hidden', 'true');
        label.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /**
   * Setup color contrast toggle
   */
  setupColorContrastToggle() {
    const toggleButton = document.createElement('button');
    toggleButton.className = 'contrast-toggle';
    toggleButton.setAttribute('aria-label', 'Toggle high contrast mode');
    toggleButton.innerHTML = '<span aria-hidden="true">🌓</span>';

    // Position the button
    toggleButton.style.cssText = `
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      background: var(--accent-primary);
      color: var(--bg-primary);
      border: none;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      z-index: 1000;
      box-shadow: var(--shadow-lg);
      transition: all 0.3s ease;
    `;

    toggleButton.addEventListener('click', () => {
      const isHighContrast = document.body.classList.toggle('high-contrast');

      localStorage.setItem('high-contrast', isHighContrast.toString());

      const message = isHighContrast ? 'High contrast mode enabled' : 'High contrast mode disabled';
      this.announceToScreenReader(message, 'assertive');

      toggleButton.setAttribute('aria-pressed', isHighContrast.toString());
    });

    // Check for saved preference
    const savedPreference = localStorage.getItem('high-contrast') === 'true';
    if (savedPreference) {
      document.body.classList.add('high-contrast');
      toggleButton.setAttribute('aria-pressed', 'true');
    }

    document.body.appendChild(toggleButton);
  }

  /**
   * Announce messages to screen readers
   */
  announceToScreenReader(message, priority = 'polite') {
    const regionId = priority === 'assertive' ? 'status-region' : 'live-region';
    const region = document.getElementById(regionId);

    if (region) {
      region.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * Announce page load
   */
  announcePageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.announceToScreenReader('Armsforge page loaded and ready');
      }, 1000);
    });
  }

  /**
   * Setup structured data enhancements
   */
  setupStructuredData() {
    // Add breadcrumb structured data
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": window.location.origin
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(breadcrumb);
    document.head.appendChild(script);
  }

  /**
   * Setup performance optimizations
   */
  setupPerformanceOptimizations() {
    // Lazy load images
    this.setupLazyLoading();

    // Preload critical resources
    this.preloadCriticalResources();

    // Setup intersection observer for animations
    this.optimizeAnimations();
  }

  /**
   * Setup lazy loading
   */
  setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    // Preload critical fonts
    const fontPreloads = [
      'fonts/outfit-v11-latin-regular.woff2',
      'fonts/outfit-v11-latin-600.woff2'
    ];

    fontPreloads.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize animations based on user preferences
   */
  optimizeAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateAnimations = () => {
      if (prefersReducedMotion.matches) {
        document.body.classList.add('reduce-motion');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    };

    updateAnimations();
    prefersReducedMotion.addEventListener('change', updateAnimations);
  }

  /**
   * Setup analytics tracking
   */
  setupAnalyticsTracking() {
    // Privacy-respecting analytics
    this.trackPageView();
    this.setupInteractionTracking();
  }

  /**
   * Track page view
   */
  trackPageView() {
    // Only track if user hasn't opted out
    if (localStorage.getItem('analytics-opt-out') !== 'true') {
      console.log('📊 Page view tracked (privacy-respecting)');

      // You could send this to your analytics service
      const pageData = {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };
    }
  }

  /**
   * Setup interaction tracking
   */
  setupInteractionTracking() {
    // Track button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('button, .btn')) {
        console.log('📈 Button interaction:', e.target.textContent || e.target.className);
      }
    });

    // Track external link clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('a[href^="http"]')) {
        console.log('📈 External link clicked:', e.target.href);
      }
    });
  }

  /**
   * Setup service worker for PWA features
   */
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('🔧 Service Worker registered:', registration);
          })
          .catch(error => {
            console.log('❌ Service Worker registration failed:', error);
          });
      });
    }
  }

  /**
   * Setup enhanced error handling
   */
  setupErrorHandling() {
    // Enhanced error tracking
    window.addEventListener('error', (e) => {
      console.error('❌ JavaScript error:', {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno,
        error: e.error
      });

      // You could send this to an error tracking service
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('❌ Unhandled promise rejection:', e.reason);
      e.preventDefault();
    });
  }

  /**
   * Enhanced focus management
   */
  setupFocusManagement() {
    // Track keyboard usage
    let isKeyboardUser = false;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isKeyboardUser = true;
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      isKeyboardUser = false;
      document.body.classList.remove('keyboard-nav');
    });

    // Focus restoration for SPA-like behavior
    this.setupFocusRestoration();
  }

  /**
   * Setup focus restoration
   */
  setupFocusRestoration() {
    let lastFocusedElement = null;

    // Store focus before hash changes
    window.addEventListener('beforehashchange', () => {
      lastFocusedElement = document.activeElement;
    });

    // Restore or set appropriate focus after hash change
    window.addEventListener('hashchange', () => {
      const target = document.querySelector(window.location.hash);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();

        target.addEventListener('blur', () => {
          target.removeAttribute('tabindex');
        }, { once: true });
      } else if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    });
  }
}

// Initialize enhanced website
let enhancedArmsforgeWebsite;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Replace the basic instance with enhanced version
    if (window.armsforgeWebsite) {
      window.armsforgeWebsite.destroy();
    }
    enhancedArmsforgeWebsite = new EnhancedArmsforgeWebsite();
    window.armsforgeWebsite = enhancedArmsforgeWebsite;
  });
} else {
  if (window.armsforgeWebsite) {
    window.armsforgeWebsite.destroy();
  }
  enhancedArmsforgeWebsite = new EnhancedArmsforgeWebsite();
  window.armsforgeWebsite = enhancedArmsforgeWebsite;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedArmsforgeWebsite;
}