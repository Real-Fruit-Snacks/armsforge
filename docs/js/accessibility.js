/**
 * Accessibility Enhancements for Armsforge Website
 * WCAG 2.1 AA Compliance JavaScript
 */

class AccessibilityEnhancements {
  constructor() {
    this.init();
  }

  init() {
    this.setupKeyboardNavigation();
    this.setupAriaAttributes();
    this.setupLiveRegions();
    this.setupFocusManagement();
    this.setupScreenReaderOptimizations();
    this.setupColorContrastToggle();
    this.setupReducedMotionSupport();
    this.announcePageLoad();
  }

  /**
   * Enhanced keyboard navigation
   */
  setupKeyboardNavigation() {
    // Escape key handling
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });

    // Skip link functionality
    this.createSkipLink();

    // Roving tabindex for navigation menu
    this.setupRovingTabindex();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  /**
   * Create and manage skip links
   */
  createSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('tabindex', '0');

    // Insert at the very beginning of the body
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Handle skip link activation
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const main = document.getElementById('main') || document.querySelector('main');
      if (main) {
        main.focus();
        main.scrollIntoView({ behavior: 'smooth' });
        this.announceToScreenReader('Skipped to main content');
      }
    });
  }

  /**
   * Setup roving tabindex for menu navigation
   */
  setupRovingTabindex() {
    const menuItems = document.querySelectorAll('.nav__link');
    let currentIndex = 0;

    // Set initial tabindex
    menuItems.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    // Handle arrow key navigation
    menuItems.forEach((item, index) => {
      item.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          currentIndex = (currentIndex + 1) % menuItems.length;
          this.focusMenuItem(menuItems, currentIndex);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          currentIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
          this.focusMenuItem(menuItems, currentIndex);
        } else if (e.key === 'Home') {
          e.preventDefault();
          currentIndex = 0;
          this.focusMenuItem(menuItems, currentIndex);
        } else if (e.key === 'End') {
          e.preventDefault();
          currentIndex = menuItems.length - 1;
          this.focusMenuItem(menuItems, currentIndex);
        }
      });
    });
  }

  /**
   * Focus specific menu item
   */
  focusMenuItem(menuItems, index) {
    menuItems.forEach((item, i) => {
      item.setAttribute('tabindex', i === index ? '0' : '-1');
    });
    menuItems[index].focus();
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + M for main content
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const main = document.getElementById('main') || document.querySelector('main');
        if (main) {
          main.focus();
          this.announceToScreenReader('Jumped to main content');
        }
      }

      // Alt + N for navigation
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const nav = document.querySelector('.nav__link');
        if (nav) {
          nav.focus();
          this.announceToScreenReader('Jumped to navigation');
        }
      }

      // Alt + F for footer
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const footer = document.querySelector('footer');
        if (footer) {
          footer.focus();
          this.announceToScreenReader('Jumped to footer');
        }
      }
    });
  }

  /**
   * Setup ARIA attributes dynamically
   */
  setupAriaAttributes() {
    // Set main content aria-label
    const main = document.querySelector('main') || document.querySelector('.hero');
    if (main) {
      main.setAttribute('id', 'main');
      main.setAttribute('role', 'main');
      main.setAttribute('aria-label', 'Main content');
      main.setAttribute('tabindex', '-1');
    }

    // Enhance navigation
    const nav = document.querySelector('.nav');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
    }

    // Enhance buttons with better descriptions
    const hamburger = document.getElementById('nav-hamburger');
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-controls', 'nav-overlay');
      hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    }

    // Enhance sections with proper headings and landmarks
    this.enhanceSectionAccessibility();

    // Add aria-current for current page/section
    this.setupAriaCurrent();
  }

  /**
   * Enhance section accessibility
   */
  enhanceSectionAccessibility() {
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
      const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        const headingText = heading.textContent.trim();
        section.setAttribute('aria-labelledby', `section-heading-${index}`);
        heading.setAttribute('id', `section-heading-${index}`);

        // Add appropriate landmarks
        if (headingText.toLowerCase().includes('feature')) {
          section.setAttribute('role', 'region');
          section.setAttribute('aria-label', 'Features section');
        } else if (headingText.toLowerCase().includes('install')) {
          section.setAttribute('role', 'region');
          section.setAttribute('aria-label', 'Installation section');
        }
      }
    });
  }

  /**
   * Setup aria-current for navigation
   */
  setupAriaCurrent() {
    const currentHash = window.location.hash;
    const navLinks = document.querySelectorAll('.nav__link');

    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentHash) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // Update on hash change
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash;
      navLinks.forEach(link => {
        if (link.getAttribute('href') === newHash) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }

  /**
   * Setup live regions for dynamic content
   */
  setupLiveRegions() {
    // Create live region if it doesn't exist
    if (!document.getElementById('live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'live-region';
      liveRegion.className = 'live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }

    // Status region for copy operations
    this.createStatusRegion();
  }

  /**
   * Create status region for user feedback
   */
  createStatusRegion() {
    const statusRegion = document.createElement('div');
    statusRegion.id = 'status-region';
    statusRegion.className = 'live-region';
    statusRegion.setAttribute('aria-live', 'assertive');
    statusRegion.setAttribute('aria-atomic', 'true');
    statusRegion.setAttribute('role', 'status');
    document.body.appendChild(statusRegion);
  }

  /**
   * Announce messages to screen readers
   */
  announceToScreenReader(message, priority = 'polite') {
    const regionId = priority === 'assertive' ? 'status-region' : 'live-region';
    const liveRegion = document.getElementById(regionId);

    if (liveRegion) {
      liveRegion.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * Enhanced focus management
   */
  setupFocusManagement() {
    // Focus trap for mobile menu
    this.setupMobileFocusTrap();

    // Focus restoration
    this.setupFocusRestoration();

    // Focus indicators
    this.enhanceFocusIndicators();
  }

  /**
   * Setup focus trap for mobile menu
   */
  setupMobileFocusTrap() {
    const overlay = document.getElementById('nav-overlay');
    const hamburger = document.getElementById('nav-hamburger');

    if (!overlay || !hamburger) return;

    let lastFocusedElement = null;

    // Store last focused element before opening menu
    hamburger.addEventListener('click', () => {
      lastFocusedElement = document.activeElement;

      setTimeout(() => {
        if (overlay.classList.contains('active')) {
          this.trapFocus(overlay);
          hamburger.setAttribute('aria-expanded', 'true');
          overlay.setAttribute('aria-hidden', 'false');
          this.announceToScreenReader('Navigation menu opened');
        }
      }, 100);
    });

    // Restore focus when menu closes
    document.addEventListener('click', (e) => {
      if (!overlay.contains(e.target) && !hamburger.contains(e.target) && overlay.classList.contains('active')) {
        this.closeMobileMenu(overlay, hamburger, lastFocusedElement);
      }
    });

    // Close on Escape
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMobileMenu(overlay, hamburger, lastFocusedElement);
      }
    });
  }

  /**
   * Close mobile menu with proper focus restoration
   */
  closeMobileMenu(overlay, hamburger, lastFocusedElement) {
    overlay.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }

    this.announceToScreenReader('Navigation menu closed');
  }

  /**
   * Trap focus within an element
   */
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const trapHandler = (e) => {
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

    element.addEventListener('keydown', trapHandler);

    // Store handler for cleanup
    element._focusTrapHandler = trapHandler;
  }

  /**
   * Setup focus restoration
   */
  setupFocusRestoration() {
    // Store focus before navigation
    document.addEventListener('beforeunload', () => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement !== document.body) {
        sessionStorage.setItem('lastFocusedElement', activeElement.id || activeElement.className);
      }
    });

    // Restore focus on page load
    window.addEventListener('load', () => {
      const lastFocused = sessionStorage.getItem('lastFocusedElement');
      if (lastFocused) {
        const element = document.getElementById(lastFocused) || document.querySelector(`.${lastFocused}`);
        if (element && element.focus) {
          element.focus();
        }
        sessionStorage.removeItem('lastFocusedElement');
      }
    });
  }

  /**
   * Enhance focus indicators
   */
  enhanceFocusIndicators() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  /**
   * Screen reader optimizations
   */
  setupScreenReaderOptimizations() {
    // Add screen reader only text for context
    this.addScreenReaderText();

    // Enhance copy button feedback
    this.enhanceCopyButtonAccessibility();

    // Add loading states
    this.setupLoadingStates();
  }

  /**
   * Add screen reader only text for better context
   */
  addScreenReaderText() {
    // Add context to external links
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach(link => {
      if (!link.getAttribute('aria-label')) {
        const srText = document.createElement('span');
        srText.className = 'sr-only';
        srText.textContent = ' (opens in new tab)';
        link.appendChild(srText);
      }
    });

    // Add context to icon-only elements
    const iconElements = document.querySelectorAll('.floating-card__icon, .premium-card__icon');
    iconElements.forEach(icon => {
      icon.setAttribute('aria-hidden', 'true');
    });
  }

  /**
   * Enhance copy button accessibility
   */
  enhanceCopyButtonAccessibility() {
    const copyButtons = document.querySelectorAll('.code-block__copy');

    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.announceToScreenReader('Code copied to clipboard', 'assertive');
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
   * Setup loading states for dynamic content
   */
  setupLoadingStates() {
    // Add loading indicators for async operations
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('loading')) {
              node.setAttribute('aria-busy', 'true');
              node.setAttribute('aria-live', 'polite');
            }
          });

          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('loading')) {
              this.announceToScreenReader('Content loaded');
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Color contrast toggle for accessibility
   */
  setupColorContrastToggle() {
    const toggleButton = this.createContrastToggle();

    // Check for user preference
    const preferredContrast = localStorage.getItem('high-contrast') === 'true';
    if (preferredContrast) {
      this.toggleHighContrast(true);
    }
  }

  /**
   * Create contrast toggle button
   */
  createContrastToggle() {
    const button = document.createElement('button');
    button.className = 'contrast-toggle';
    button.setAttribute('aria-label', 'Toggle high contrast mode');
    button.innerHTML = '🌓';

    button.addEventListener('click', () => {
      const isHighContrast = document.body.classList.contains('high-contrast');
      this.toggleHighContrast(!isHighContrast);

      const message = !isHighContrast ? 'High contrast mode enabled' : 'High contrast mode disabled';
      this.announceToScreenReader(message, 'assertive');
    });

    // Add to page (you might want to position this appropriately)
    document.body.appendChild(button);

    return button;
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(enable) {
    if (enable) {
      document.body.classList.add('high-contrast');
      localStorage.setItem('high-contrast', 'true');
    } else {
      document.body.classList.remove('high-contrast');
      localStorage.setItem('high-contrast', 'false');
    }
  }

  /**
   * Reduced motion support
   */
  setupReducedMotionSupport() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
      document.body.classList.add('reduce-motion');
    }

    prefersReducedMotion.addEventListener('change', () => {
      if (prefersReducedMotion.matches) {
        document.body.classList.add('reduce-motion');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    });
  }

  /**
   * Handle Escape key globally
   */
  handleEscape() {
    const overlay = document.getElementById('nav-overlay');
    const hamburger = document.getElementById('nav-hamburger');

    // Close mobile menu
    if (overlay && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      overlay.setAttribute('aria-hidden', 'true');
      hamburger.focus();
      this.announceToScreenReader('Navigation menu closed');
    }

    // Close any modals or overlays
    const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
    modals.forEach(modal => {
      if (modal.style.display !== 'none') {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /**
   * Announce page load to screen readers
   */
  announcePageLoad() {
    // Wait for page to fully load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.announceToScreenReader('Armsforge page loaded');
      }, 1000);
    });
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Remove event listeners and clean up
    const overlay = document.getElementById('nav-overlay');
    if (overlay && overlay._focusTrapHandler) {
      overlay.removeEventListener('keydown', overlay._focusTrapHandler);
    }
  }
}

// Initialize accessibility enhancements when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AccessibilityEnhancements();
  });
} else {
  new AccessibilityEnhancements();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityEnhancements;
}