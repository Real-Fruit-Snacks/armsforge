/**
 * Armsforge Website Interactive Features
 * Modern JavaScript for navigation, animations, and user interactions
 */

class ArmsforgeWebsite {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupScrollAnimations();
    this.setupMobileNavigation();
    this.setupCopyToClipboard();
    this.setupStatsAnimation();
    this.setupSmoothScrolling();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // DOM content loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeComponents();
      });
    } else {
      this.initializeComponents();
    }

    // Window events
    window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 16));
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  /**
   * Initialize components after DOM is ready
   */
  initializeComponents() {
    console.log('🚀 Armsforge website initialized');
    this.updateNavbarOnScroll();
  }

  /**
   * Setup mobile navigation toggle
   */
  setupMobileNavigation() {
    const hamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('nav-overlay');
    const overlayLinks = document.querySelectorAll('.nav__overlay-link');

    if (!hamburger || !overlay) return;

    // Toggle mobile menu
    hamburger.addEventListener('click', () => {
      this.toggleMobileMenu(hamburger, overlay);
    });

    // Close menu when clicking links
    overlayLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.closeMobileMenu(hamburger, overlay);
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        this.closeMobileMenu(hamburger, overlay);
      }
    });

    // Close menu when clicking outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeMobileMenu(hamburger, overlay);
      }
    });
  }

  /**
   * Toggle mobile menu state
   */
  toggleMobileMenu(hamburger, overlay) {
    const isOpen = overlay.classList.contains('active');

    if (isOpen) {
      this.closeMobileMenu(hamburger, overlay);
    } else {
      this.openMobileMenu(hamburger, overlay);
    }
  }

  /**
   * Open mobile menu
   */
  openMobileMenu(hamburger, overlay) {
    overlay.classList.add('active');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Animate hamburger to X
    const spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';

    // Focus trap
    this.setupFocusTrap(overlay);
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(hamburger, overlay) {
    overlay.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';

    // Reset hamburger animation
    const spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';

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
    firstElement.focus();
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
   * Setup scroll-triggered animations
   */
  setupScrollAnimations() {
    // Use Intersection Observer for better performance
    const observerOptions = {
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1
    };

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    const animatableElements = document.querySelectorAll(
      '.premium-card, .tool-card, .agent-card, .step, .section__title, .section__description'
    );

    animatableElements.forEach(el => {
      el.classList.add('animate-on-scroll');
      this.scrollObserver.observe(el);
    });
  }

  /**
   * Setup copy to clipboard functionality
   */
  setupCopyToClipboard() {
    const copyButtons = document.querySelectorAll('.code-block__copy');

    copyButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const textToCopy = button.getAttribute('data-copy');

        try {
          await navigator.clipboard.writeText(textToCopy);
          this.showCopyFeedback(button);
        } catch (err) {
          // Fallback for older browsers
          this.fallbackCopyText(textToCopy);
          this.showCopyFeedback(button);
        }
      });
    });
  }

  /**
   * Show copy feedback animation
   */
  showCopyFeedback(button) {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = 'var(--success)';

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }

  /**
   * Fallback copy method for older browsers
   */
  fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  /**
   * Setup stats counter animation
   */
  setupStatsAnimation() {
    const statNumbers = document.querySelectorAll('.stat__number');

    const animateStats = () => {
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const updateStat = () => {
          current += step;
          if (current < target) {
            stat.textContent = Math.floor(current) + '+';
            requestAnimationFrame(updateStat);
          } else {
            stat.textContent = target + '+';
          }
        };

        updateStat();
      });
    };

    // Trigger stats animation when hero section is visible
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.statsAnimated) {
            this.statsAnimated = true;
            setTimeout(animateStats, 500); // Delay for better effect
            heroObserver.disconnect();
          }
        });
      });

      heroObserver.observe(heroSection);
    }
  }

  /**
   * Setup smooth scrolling for anchor links
   */
  setupSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar

          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    this.updateNavbarOnScroll();
  }

  /**
   * Update navbar appearance on scroll
   */
  updateNavbarOnScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const scrollY = window.scrollY;
    const threshold = 50;

    if (scrollY > threshold) {
      navbar.style.background = 'rgba(17, 17, 27, 0.95)';
      navbar.style.backdropFilter = 'blur(20px)';
      navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
      navbar.style.background = 'rgba(17, 17, 27, 0.9)';
      navbar.style.backdropFilter = 'blur(10px)';
      navbar.style.boxShadow = '';
    }
  }

  /**
   * Handle window resize events
   */
  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768) {
      const hamburger = document.getElementById('nav-hamburger');
      const overlay = document.getElementById('nav-overlay');

      if (hamburger && overlay && overlay.classList.contains('active')) {
        this.closeMobileMenu(hamburger, overlay);
      }
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeydown(e) {
    // Cmd/Ctrl + K for search (placeholder for future implementation)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      console.log('Search shortcut triggered (not implemented yet)');
    }
  }

  /**
   * Throttle function for performance optimization
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Debounce function for performance optimization
   */
  debounce(func, wait, immediate) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  /**
   * Cleanup method for removing event listeners
   */
  destroy() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }

    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('keydown', this.handleKeydown);

    this.removeFocusTrap();
  }
}

// Analytics and Performance Monitoring (placeholder)
class ArmsforgeAnalytics {
  static trackPageView() {
    // Placeholder for analytics tracking
    console.log('📊 Page view tracked');
  }

  static trackEvent(category, action, label) {
    // Placeholder for event tracking
    console.log(`📈 Event tracked: ${category} - ${action} - ${label}`);
  }

  static trackPerformance() {
    // Basic performance monitoring
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
      console.log(`⚡ Page load time: ${loadTime}ms`);
    });
  }
}

// Error Handling
window.addEventListener('error', (e) => {
  console.error('❌ JavaScript error:', e.error);
  // In production, you might want to send this to an error tracking service
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

// Initialize the website when DOM is ready
let armsforgeWebsite;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    armsforgeWebsite = new ArmsforgeWebsite();
    ArmsforgeAnalytics.trackPageView();
    ArmsforgeAnalytics.trackPerformance();
  });
} else {
  armsforgeWebsite = new ArmsforgeWebsite();
  ArmsforgeAnalytics.trackPageView();
  ArmsforgeAnalytics.trackPerformance();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ArmsforgeWebsite, ArmsforgeAnalytics };
}