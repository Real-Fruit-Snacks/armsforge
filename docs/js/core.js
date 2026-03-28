/**
 * Armsforge Website Core - Critical JavaScript
 * Essential functionality loaded immediately
 */

class ArmsforgeCore {
  constructor() {
    this.isInitialized = false;
    this.modules = new Map();
    this.init();
  }

  init() {
    this.setupCriticalEventListeners();
    this.setupPerformanceOptimizations();
    this.loadDeferredStyles();
    this.isInitialized = true;
  }

  /**
   * Setup critical event listeners for immediate functionality
   */
  setupCriticalEventListeners() {
    // Navigation toggle for mobile
    const hamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('nav-overlay');

    if (hamburger && overlay) {
      hamburger.addEventListener('click', () => this.toggleMobileMenu(), { passive: true });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeMobileMenu();
      }, { passive: true });
    }

    // Escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });

    // Critical scroll handler (throttled)
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          this.updateNavbarOnScroll();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    // Resize handler (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.handleResize(), 150);
    }, { passive: true });
  }

  /**
   * Setup performance optimizations
   */
  setupPerformanceOptimizations() {
    // Preload critical resources
    this.preloadCriticalResources();

    // Setup Intersection Observer for lazy loading
    this.setupIntersectionObserver();

    // Prefetch next likely resources
    this.prefetchResources();
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    const criticalResources = [
      { href: 'css/deferred.css', as: 'style' },
      { href: 'js/modules.js', as: 'script' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.as === 'style') {
        link.onload = () => {
          link.rel = 'stylesheet';
        };
      }
      document.head.appendChild(link);
    });
  }

  /**
   * Load deferred styles after critical path
   */
  loadDeferredStyles() {
    const deferredStylesheets = [
      'css/deferred.css',
      'css/components.css'
    ];

    // Load after initial render
    requestAnimationFrame(() => {
      deferredStylesheets.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.media = 'print';
        link.onload = () => {
          link.media = 'all';
        };
        document.head.appendChild(link);
      });
    });
  }

  /**
   * Setup Intersection Observer for performance
   */
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    const observerOptions = {
      rootMargin: '50px 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Load modules when sections become visible
          const sectionId = entry.target.id;
          if (sectionId && !this.modules.has(sectionId)) {
            this.loadModuleForSection(sectionId);
          }
        }
      });
    }, observerOptions);

    // Observe key sections
    const sections = document.querySelectorAll('section[id], .hero');
    sections.forEach(section => this.observer.observe(section));
  }

  /**
   * Prefetch likely next resources
   */
  prefetchResources() {
    const prefetchResources = [
      'js/modules.js'
    ];

    // Prefetch after a delay
    setTimeout(() => {
      prefetchResources.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      });
    }, 2000);
  }

  /**
   * Load modules dynamically based on section visibility
   */
  async loadModuleForSection(sectionId) {
    if (this.modules.has(sectionId)) return;

    try {
      const module = await import('./modules.js');
      const moduleInstance = new module.ArmsforgeModules();

      switch (sectionId) {
        case 'installation':
          moduleInstance.setupCopyToClipboard();
          break;
        case 'features':
          moduleInstance.setupScrollAnimations();
          break;
        case 'tools':
        case 'agents':
          moduleInstance.setupCardAnimations();
          break;
      }

      this.modules.set(sectionId, moduleInstance);
    } catch (error) {
      console.warn(`Failed to load module for ${sectionId}:`, error);
    }
  }

  /**
   * Mobile menu toggle
   */
  toggleMobileMenu() {
    const overlay = document.getElementById('nav-overlay');
    const hamburger = document.getElementById('nav-hamburger');

    if (!overlay || !hamburger) return;

    const isOpen = overlay.classList.contains('active');

    if (isOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Open mobile menu
   */
  openMobileMenu() {
    const overlay = document.getElementById('nav-overlay');
    const hamburger = document.getElementById('nav-hamburger');

    if (!overlay || !hamburger) return;

    overlay.classList.add('active');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Animate hamburger to X
    const spans = hamburger.querySelectorAll('span');
    if (spans.length >= 3) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    }

    // Setup focus trap
    this.setupFocusTrap(overlay);
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    const overlay = document.getElementById('nav-overlay');
    const hamburger = document.getElementById('nav-hamburger');

    if (!overlay || !hamburger) return;

    overlay.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';

    // Reset hamburger animation
    const spans = hamburger.querySelectorAll('span');
    spans.forEach(span => {
      span.style.transform = '';
      span.style.opacity = '';
    });

    // Remove focus trap
    this.removeFocusTrap();
  }

  /**
   * Setup focus trap for accessibility
   */
  setupFocusTrap(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.focusTrapHandler = (e) => {
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

    document.addEventListener('keydown', this.focusTrapHandler);

    // Focus first element after a frame to ensure menu is visible
    requestAnimationFrame(() => firstElement.focus());
  }

  /**
   * Remove focus trap
   */
  removeFocusTrap() {
    if (this.focusTrapHandler) {
      document.removeEventListener('keydown', this.focusTrapHandler);
      this.focusTrapHandler = null;
    }
  }

  /**
   * Update navbar on scroll (optimized)
   */
  updateNavbarOnScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const scrollY = window.pageYOffset;
    const threshold = 50;

    // Use transform instead of changing background for better performance
    if (scrollY > threshold) {
      navbar.style.setProperty('--nav-bg-opacity', '0.95');
      navbar.style.setProperty('--nav-blur', '20px');
      navbar.style.setProperty('--nav-shadow', '0 4px 20px rgba(0, 0, 0, 0.3)');
    } else {
      navbar.style.setProperty('--nav-bg-opacity', '0.9');
      navbar.style.setProperty('--nav-blur', '10px');
      navbar.style.setProperty('--nav-shadow', 'none');
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768) {
      const overlay = document.getElementById('nav-overlay');
      if (overlay?.classList.contains('active')) {
        this.closeMobileMenu();
      }
    }

    // Recalculate layout-dependent elements
    this.recalculateLayout();
  }

  /**
   * Recalculate layout-dependent elements
   */
  recalculateLayout() {
    // Re-observe elements that might have changed
    if (this.observer) {
      const sections = document.querySelectorAll('section[id]:not(.observed)');
      sections.forEach(section => {
        section.classList.add('observed');
        this.observer.observe(section);
      });
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.modules.forEach(module => {
      if (module.destroy) module.destroy();
    });
    this.modules.clear();

    this.removeFocusTrap();
  }
}

// Performance monitoring
class PerformanceMonitor {
  static init() {
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }

    window.addEventListener('load', () => this.measurePageLoad());
  }

  static setupPerformanceObserver() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`LCP: ${entry.startTime}ms`);
        }
        if (entry.entryType === 'first-input') {
          console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
        }
        if (entry.entryType === 'layout-shift') {
          console.log(`CLS: ${entry.value}`);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Fallback for older browsers
      console.log('Performance Observer not fully supported');
    }
  }

  static measurePageLoad() {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
      const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;

      console.log(`Page Load Time: ${loadTime}ms`);
      console.log(`DOM Content Loaded: ${domContentLoaded}ms`);
      console.log(`First Paint: ${performance.getEntriesByType('paint')[0]?.startTime}ms`);
      console.log(`First Contentful Paint: ${performance.getEntriesByType('paint')[1]?.startTime}ms`);
    }
  }
}

// Error handling
window.addEventListener('error', (e) => {
  console.error('JavaScript error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

// Initialize core functionality
let armsforgeCore;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    armsforgeCore = new ArmsforgeCore();
    PerformanceMonitor.init();
  });
} else {
  armsforgeCore = new ArmsforgeCore();
  PerformanceMonitor.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ArmsforgeCore, PerformanceMonitor };
}