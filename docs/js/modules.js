/**
 * Armsforge Website Modules - Deferred JavaScript
 * Non-critical functionality loaded on demand
 */

export class ArmsforgeModules {
  constructor() {
    this.observers = new Map();
    this.animations = new Map();
    this.statsAnimated = false;
  }

  /**
   * Setup copy to clipboard functionality
   */
  setupCopyToClipboard() {
    const copyButtons = document.querySelectorAll('.code-block__copy');

    copyButtons.forEach(button => {
      if (button.dataset.initialized) return;

      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const textToCopy = button.getAttribute('data-copy');

        try {
          await navigator.clipboard.writeText(textToCopy);
          this.showCopyFeedback(button);
        } catch (err) {
          this.fallbackCopyText(textToCopy);
          this.showCopyFeedback(button);
        }
      }, { passive: false });

      button.dataset.initialized = 'true';
    });
  }

  /**
   * Show copy feedback animation
   */
  showCopyFeedback(button) {
    const originalText = button.textContent;
    const originalBg = button.style.backgroundColor;

    button.textContent = 'Copied!';
    button.style.backgroundColor = 'var(--success)';

    // Use animation frame for smooth transition
    requestAnimationFrame(() => {
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = originalBg;
      }, 2000);
    });
  }

  /**
   * Fallback copy method for older browsers
   */
  fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');
    } catch (err) {
      console.warn('Fallback copy failed:', err);
    }

    document.body.removeChild(textarea);
  }

  /**
   * Setup scroll animations using Intersection Observer
   */
  setupScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for older browsers
      this.addAnimationClassesToAll();
      return;
    }

    const observerOptions = {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add staggered animation delay
          const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 100;

          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);

          // Unobserve after animation
          animationObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    const animatableElements = document.querySelectorAll(
      '.premium-card, .tool-card, .agent-card, .step, .section__title, .section__description'
    );

    animatableElements.forEach(el => {
      el.classList.add('animate-on-scroll');
      animationObserver.observe(el);
    });

    this.observers.set('scroll-animations', animationObserver);
  }

  /**
   * Add animation classes immediately (fallback)
   */
  addAnimationClassesToAll() {
    const elements = document.querySelectorAll(
      '.premium-card, .tool-card, .agent-card, .step, .section__title, .section__description'
    );

    elements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, index * 50);
    });
  }

  /**
   * Setup card hover animations
   */
  setupCardAnimations() {
    const cards = document.querySelectorAll('.premium-card, .tool-card, .agent-card');

    cards.forEach(card => {
      if (card.dataset.animationInitialized) return;

      // Optimize animations with transform
      card.style.transformStyle = 'preserve-3d';
      card.style.backfaceVisibility = 'hidden';

      // Use passive event listeners
      card.addEventListener('mouseenter', () => {
        card.style.willChange = 'transform, box-shadow';
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        card.style.willChange = 'auto';
      }, { passive: true });

      card.dataset.animationInitialized = 'true';
    });
  }

  /**
   * Setup stats counter animation
   */
  setupStatsAnimation() {
    if (this.statsAnimated) return;

    const statNumbers = document.querySelectorAll('.stat__number');
    if (statNumbers.length === 0) return;

    const animateStats = () => {
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count')) || 0;
        const duration = 2000;
        const startTime = performance.now();

        const updateStat = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function for smooth animation
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(target * easeOutCubic);

          stat.textContent = current + '+';

          if (progress < 1) {
            requestAnimationFrame(updateStat);
          } else {
            stat.textContent = target + '+';
          }
        };

        requestAnimationFrame(updateStat);
      });
    };

    // Trigger stats animation when hero section is visible
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.statsAnimated) {
            this.statsAnimated = true;
            // Delay for better visual effect
            setTimeout(animateStats, 500);
            heroObserver.disconnect();
          }
        });
      }, { threshold: 0.5 });

      heroObserver.observe(heroSection);
      this.observers.set('stats-animation', heroObserver);
    }
  }

  /**
   * Setup smooth scrolling for anchor links
   */
  setupSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
      if (link.dataset.smoothScrollInitialized) return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          const navHeight = document.querySelector('.nav')?.offsetHeight || 80;
          const offsetTop = targetElement.offsetTop - navHeight;

          // Use smooth scrolling with performance optimization
          if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          } else {
            // Fallback for older browsers
            this.smoothScrollPolyfill(offsetTop);
          }
        }
      });

      link.dataset.smoothScrollInitialized = 'true';
    });
  }

  /**
   * Smooth scroll polyfill
   */
  smoothScrollPolyfill(targetY) {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const duration = 800;
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeInOutCubic = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startY + distance * easeInOutCubic);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }

  /**
   * Setup lazy loading for images
   */
  setupLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        img.src = img.dataset.src;
        img.loading = 'lazy';
      });
    } else {
      // Intersection Observer fallback
      this.setupIntersectionObserverLazyLoading();
    }
  }

  /**
   * Setup Intersection Observer for lazy loading
   */
  setupIntersectionObserverLazyLoading() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px'
    });

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));

    this.observers.set('lazy-loading', imageObserver);
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K for search (placeholder)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.triggerSearch();
      }

      // Escape to close overlays
      if (e.key === 'Escape') {
        this.closeAllOverlays();
      }
    });
  }

  /**
   * Trigger search functionality (placeholder)
   */
  triggerSearch() {
    console.log('Search functionality triggered');
    // Implement search modal or redirect to search page
  }

  /**
   * Close all overlays
   */
  closeAllOverlays() {
    const overlays = document.querySelectorAll('.nav__overlay.active');
    overlays.forEach(overlay => {
      overlay.classList.remove('active');
    });
  }

  /**
   * Initialize all modules
   */
  initAll() {
    this.setupCopyToClipboard();
    this.setupScrollAnimations();
    this.setupCardAnimations();
    this.setupStatsAnimation();
    this.setupSmoothScrolling();
    this.setupLazyLoading();
    this.setupKeyboardShortcuts();
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.observers.forEach(observer => {
      if (observer.disconnect) observer.disconnect();
    });
    this.observers.clear();

    this.animations.forEach(animation => {
      if (animation.cancel) animation.cancel();
    });
    this.animations.clear();
  }
}

// Export as default for dynamic imports
export default ArmsforgeModules;