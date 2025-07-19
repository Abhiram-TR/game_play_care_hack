/**
 * Accessibility management system for GazeQuest Adventures
 * Handles WCAG compliance, screen reader support, and inclusive features
 */

export class AccessibilityManager {
  constructor() {
    this.isInitialized = false;
    this.gameEngine = null;
    
    // Accessibility features state
    this.features = {
      screenReader: false,
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      keyboardNavigation: true,
      audioDescriptions: true,
      voiceAnnouncements: true
    };
    
    // Live regions for screen reader announcements
    this.liveRegions = {
      polite: null,
      assertive: null
    };
    
    // Announcement queue
    this.announcementQueue = [];
    this.isAnnouncing = false;
    this.lastAnnouncement = '';
    this.lastAnnouncementTime = 0;
    
    // Focus management
    this.focusHistory = [];
    this.focusTrapStack = [];
    this.lastFocusedElement = null;
    
    // Keyboard navigation
    this.focusableElements = [];
    this.currentFocusIndex = 0;
    this.keyboardNavEnabled = true;
    
    this.eventListeners = new Map();
  }

  /**
   * Initialize accessibility manager
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    
    try {
      // Create live regions for announcements
      this.createLiveRegions();
      
      // Set up keyboard navigation
      this.setupKeyboardNavigation();
      
      // Detect user preferences
      this.detectUserPreferences();
      
      // Load saved accessibility settings
      this.loadAccessibilitySettings();
      
      // Set up mutation observer for dynamic content
      this.setupMutationObserver();
      
      // Apply initial accessibility features
      this.applyAccessibilityFeatures();
      
      this.isInitialized = true;
      console.log('✅ AccessibilityManager initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize AccessibilityManager:', error);
      throw error;
    }
  }

  /**
   * Create ARIA live regions for announcements
   */
  createLiveRegions() {
    // Polite announcements (non-interrupting)
    this.liveRegions.polite = this.createLiveRegion('polite');
    
    // Assertive announcements (interrupting)
    this.liveRegions.assertive = this.createLiveRegion('assertive');
    
    console.log('📢 Live regions created for screen reader announcements');
  }

  /**
   * Create a single live region
   */
  createLiveRegion(priority) {
    const region = document.createElement('div');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', 'status');
    region.className = 'sr-only';
    region.id = `sr-announcements-${priority}`;
    
    // Ensure it's visually hidden but accessible to screen readers
    region.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(region);
    return region;
  }

  /**
   * Set up keyboard navigation system
   */
  setupKeyboardNavigation() {
    // Keyboard event listeners
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
    
    // Update focusable elements periodically
    this.updateFocusableElements();
    setInterval(() => this.updateFocusableElements(), 2000);
    
    console.log('⌨️ Keyboard navigation setup complete');
  }

  /**
   * Detect user accessibility preferences from system/browser
   */
  detectUserPreferences() {
    try {
      // Check for prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.setReducedMotion(true);
      }
      
      // Check for prefers-contrast
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        this.setHighContrast(true);
      }
      
      // Check for prefers-color-scheme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark-theme');
      }
      
      // Listen for changes
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.setReducedMotion(e.matches);
      });
      
      window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
        this.setHighContrast(e.matches);
      });
      
      console.log('🔍 User accessibility preferences detected');
      
    } catch (error) {
      console.warn('Failed to detect user preferences:', error);
    }
  }

  /**
   * Load accessibility settings from user preferences
   */
  loadAccessibilitySettings() {
    if (!this.gameEngine?.stateManager) return;
    
    const settings = this.gameEngine.stateManager.getStateValue('settings.accessibility');
    if (settings) {
      Object.keys(this.features).forEach(feature => {
        if (settings[feature] !== undefined) {
          this.features[feature] = settings[feature];
        }
      });
      
      console.log('📁 Accessibility settings loaded');
    }
  }

  /**
   * Set up mutation observer to handle dynamic content
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdateFocus = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check for new interactive elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (this.isInteractiveElement(node) || 
                  node.querySelector && node.querySelector(this.getFocusableSelector())) {
                shouldUpdateFocus = true;
              }
            }
          });
        }
      });
      
      if (shouldUpdateFocus) {
        // Debounce updates
        clearTimeout(this.focusUpdateTimer);
        this.focusUpdateTimer = setTimeout(() => {
          this.updateFocusableElements();
        }, 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    this.mutationObserver = observer;
  }

  /**
   * Apply all accessibility features based on current settings
   */
  applyAccessibilityFeatures() {
    Object.keys(this.features).forEach(feature => {
      if (this.features[feature]) {
        this.enableFeature(feature);
      }
    });
  }

  /**
   * Enable a specific accessibility feature
   */
  enableFeature(feature) {
    switch (feature) {
      case 'highContrast':
        this.setHighContrast(true);
        break;
      case 'reducedMotion':
        this.setReducedMotion(true);
        break;
      case 'largeText':
        this.setTextSize('large');
        break;
      case 'screenReader':
        this.enableScreenReaderOptimizations();
        break;
    }
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite', options = {}) {
    if (!this.features.voiceAnnouncements || !message) return;
    
    // Avoid duplicate announcements
    const now = Date.now();
    if (message === this.lastAnnouncement && now - this.lastAnnouncementTime < 2000) {
      return;
    }
    
    this.lastAnnouncement = message;
    this.lastAnnouncementTime = now;
    
    // Add to queue
    this.announcementQueue.push({
      message,
      priority,
      timestamp: now,
      options
    });
    
    // Process queue
    this.processAnnouncementQueue();
  }

  /**
   * Process announcement queue
   */
  processAnnouncementQueue() {
    if (this.isAnnouncing || this.announcementQueue.length === 0) return;
    
    this.isAnnouncing = true;
    const announcement = this.announcementQueue.shift();
    
    // Use appropriate live region
    const region = this.liveRegions[announcement.priority] || this.liveRegions.polite;
    
    // Clear region first, then add new content
    region.textContent = '';
    
    setTimeout(() => {
      region.textContent = announcement.message;
      
      // Mark as done after a delay
      setTimeout(() => {
        this.isAnnouncing = false;
        this.processAnnouncementQueue(); // Process next in queue
      }, 100);
    }, 10);
    
    console.log(`📢 Announced: ${announcement.message}`);
  }

  /**
   * Update ARIA labels and descriptions for game elements
   */
  updateGameStateAria() {
    const gameArea = document.getElementById('game-canvas');
    if (!gameArea) return;
    
    const currentScene = this.gameEngine.sceneManager.getCurrentScene();
    if (currentScene) {
      gameArea.setAttribute('aria-label', 
        `${currentScene.name || 'Game Area'}. ${currentScene.description || ''}`);
    }
    
    // Update progress indicators
    const progressElement = document.getElementById('progress-indicator');
    if (progressElement) {
      const progress = this.gameEngine.getState();
      const percentage = Math.round((progress.experience || 0) / 100);
      
      progressElement.setAttribute('aria-valuenow', percentage);
      progressElement.setAttribute('aria-valuetext', 
        `${percentage}% complete. Level ${progress.level || 1}`);
    }
  }

  /**
   * Enable high contrast mode
   */
  setHighContrast(enabled) {
    this.features.highContrast = enabled;
    
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
      this.announce('High contrast mode enabled');
    } else {
      document.documentElement.classList.remove('high-contrast');
      this.announce('High contrast mode disabled');
    }
    
    this.saveAccessibilitySetting('highContrast', enabled);
  }

  /**
   * Enable reduced motion mode
   */
  setReducedMotion(enabled) {
    this.features.reducedMotion = enabled;
    
    const root = document.documentElement;
    
    if (enabled) {
      root.style.setProperty('--transition-fast', '0ms');
      root.style.setProperty('--transition-base', '0ms');
      root.style.setProperty('--transition-slow', '0ms');
      root.classList.add('reduced-motion');
      this.announce('Reduced motion enabled');
    } else {
      root.style.removeProperty('--transition-fast');
      root.style.removeProperty('--transition-base');
      root.style.removeProperty('--transition-slow');
      root.classList.remove('reduced-motion');
      this.announce('Reduced motion disabled');
    }
    
    this.saveAccessibilitySetting('reducedMotion', enabled);
  }

  /**
   * Set text size
   */
  setTextSize(size) {
    const validSizes = ['normal', 'large', 'extra-large'];
    if (!validSizes.includes(size)) return;
    
    // Remove existing text size classes
    validSizes.forEach(s => {
      document.documentElement.classList.remove(`${s}-text`);
    });
    
    // Add new text size class
    if (size !== 'normal') {
      document.documentElement.classList.add(`${size}-text`);
      this.features.largeText = size !== 'normal';
    }
    
    this.announce(`Text size changed to ${size}`);
    this.saveAccessibilitySetting('textSize', size);
  }

  /**
   * Enable screen reader optimizations
   */
  enableScreenReaderOptimizations() {
    this.features.screenReader = true;
    
    // Add screen reader specific styles and behaviors
    document.documentElement.classList.add('screen-reader-optimized');
    
    // Enhance focus indicators
    const style = document.createElement('style');
    style.textContent = `
      .screen-reader-optimized *:focus {
        outline: 3px solid var(--focus-color) !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
    
    this.announce('Screen reader optimizations enabled');
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event) {
    if (!this.keyboardNavEnabled) return;
    
    switch (event.key) {
      case 'Tab':
        this.handleTabNavigation(event);
        break;
      case 'Escape':
        this.handleEscapeKey(event);
        break;
      case 'F1':
        event.preventDefault();
        this.showKeyboardHelp();
        break;
    }
  }

  /**
   * Handle tab navigation
   */
  handleTabNavigation(event) {
    // Let browser handle normal tab navigation
    // This is a hook for custom behavior if needed
    
    // Update focus history
    setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        this.addToFocusHistory(document.activeElement);
      }
    }, 0);
  }

  /**
   * Handle escape key
   */
  handleEscapeKey(event) {
    // Close any active focus traps
    if (this.focusTrapStack.length > 0) {
      const trap = this.focusTrapStack.pop();
      this.releaseFocusTrap(trap);
      event.preventDefault();
    }
    
    // Or go back in focus history
    else if (this.focusHistory.length > 1) {
      const previousElement = this.focusHistory[this.focusHistory.length - 2];
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus();
        event.preventDefault();
      }
    }
  }

  /**
   * Handle focus in events
   */
  handleFocusIn(event) {
    this.lastFocusedElement = event.target;
    this.addToFocusHistory(event.target);
    
    // Announce focused element if it has useful information
    this.announceFocusedElement(event.target);
  }

  /**
   * Handle focus out events
   */
  handleFocusOut(event) {
    // Could add logic here for focus management
  }

  /**
   * Announce focused element
   */
  announceFocusedElement(element) {
    if (!this.features.screenReader) return;
    
    const label = this.getElementLabel(element);
    const role = element.getAttribute('role') || this.getImplicitRole(element);
    
    if (label && role) {
      this.announce(`${label}, ${role}`, 'polite');
    }
  }

  /**
   * Get element label for screen readers
   */
  getElementLabel(element) {
    return element.getAttribute('aria-label') ||
           element.getAttribute('aria-labelledby') && 
           document.getElementById(element.getAttribute('aria-labelledby'))?.textContent ||
           element.getAttribute('title') ||
           element.textContent?.trim() ||
           element.getAttribute('alt') ||
           element.value ||
           null;
  }

  /**
   * Get implicit ARIA role
   */
  getImplicitRole(element) {
    const tagName = element.tagName.toLowerCase();
    const roleMap = {
      button: 'button',
      a: 'link',
      input: 'textbox',
      select: 'combobox',
      textarea: 'textbox',
      h1: 'heading',
      h2: 'heading',
      h3: 'heading',
      h4: 'heading',
      h5: 'heading',
      h6: 'heading'
    };
    
    return roleMap[tagName] || 'element';
  }

  /**
   * Update focusable elements list
   */
  updateFocusableElements() {
    const selector = this.getFocusableSelector();
    this.focusableElements = Array.from(document.querySelectorAll(selector))
      .filter(el => this.isElementVisible(el) && !el.disabled);
    
    // Update current focus index
    const activeElement = document.activeElement;
    if (activeElement) {
      this.currentFocusIndex = this.focusableElements.indexOf(activeElement);
    }
  }

  /**
   * Get selector for focusable elements
   */
  getFocusableSelector() {
    return [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable]:not([disabled])',
      '.focusable:not([disabled])',
      '.game-interactive:not([disabled])'
    ].join(', ');
  }

  /**
   * Check if element is interactive
   */
  isInteractiveElement(element) {
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    return interactiveTags.includes(element.tagName.toLowerCase()) ||
           element.hasAttribute('tabindex') ||
           element.classList.contains('focusable') ||
           element.classList.contains('game-interactive');
  }

  /**
   * Check if element is visible
   */
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           style.opacity !== '0';
  }

  /**
   * Add element to focus history
   */
  addToFocusHistory(element) {
    // Remove element if it already exists
    const index = this.focusHistory.indexOf(element);
    if (index > -1) {
      this.focusHistory.splice(index, 1);
    }
    
    // Add to end
    this.focusHistory.push(element);
    
    // Limit history size
    if (this.focusHistory.length > 10) {
      this.focusHistory.shift();
    }
  }

  /**
   * Create focus trap
   */
  createFocusTrap(container) {
    const focusableElements = container.querySelectorAll(this.getFocusableSelector());
    
    if (focusableElements.length === 0) return null;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const trap = {
      container,
      firstElement,
      lastElement,
      previousFocus: document.activeElement
    };
    
    // Add event listener for trap
    const trapListener = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    trap.listener = trapListener;
    container.addEventListener('keydown', trapListener);
    
    // Focus first element
    firstElement.focus();
    
    // Add to stack
    this.focusTrapStack.push(trap);
    
    return trap;
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap(trap) {
    if (!trap) return;
    
    // Remove event listener
    trap.container.removeEventListener('keydown', trap.listener);
    
    // Restore previous focus
    if (trap.previousFocus && document.contains(trap.previousFocus)) {
      trap.previousFocus.focus();
    }
    
    // Remove from stack
    const index = this.focusTrapStack.indexOf(trap);
    if (index > -1) {
      this.focusTrapStack.splice(index, 1);
    }
  }

  /**
   * Show keyboard help
   */
  showKeyboardHelp() {
    const helpText = `
      Keyboard shortcuts:
      Tab - Navigate between elements
      Enter/Space - Activate buttons
      Arrow keys - Navigate game elements
      Escape - Go back or close dialogs
      F1 - Show this help
      1 - Show hint
      2 - Pause game
      3 - Open menu
    `;
    
    this.announce(helpText, 'assertive');
  }

  /**
   * Save accessibility setting
   */
  saveAccessibilitySetting(setting, value) {
    if (this.gameEngine?.stateManager) {
      this.gameEngine.stateManager.updateSettings(`accessibility.${setting}`, value);
    }
  }

  /**
   * Update accessibility manager
   */
  update(deltaTime) {
    // Update game state ARIA
    this.updateGameStateAria();
    
    // Process any pending announcements
    if (this.announcementQueue.length > 0 && !this.isAnnouncing) {
      this.processAnnouncementQueue();
    }
  }

  /**
   * Get accessibility status
   */
  getStatus() {
    return {
      features: { ...this.features },
      isInitialized: this.isInitialized,
      focusableElementCount: this.focusableElements.length,
      currentFocus: document.activeElement?.tagName || 'none',
      pendingAnnouncements: this.announcementQueue.length
    };
  }

  /**
   * Add event listener
   */
  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType).add(callback);
  }

  /**
   * Remove event listener
   */
  off(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).delete(callback);
    }
  }

  /**
   * Emit event
   */
  emit(eventType, data) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in accessibility manager event listener:', error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Remove live regions
    Object.values(this.liveRegions).forEach(region => {
      if (region && region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    
    // Disconnect mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    // Release all focus traps
    while (this.focusTrapStack.length > 0) {
      this.releaseFocusTrap(this.focusTrapStack.pop());
    }
    
    // Clear timers
    if (this.focusUpdateTimer) {
      clearTimeout(this.focusUpdateTimer);
    }
    
    console.log('🧹 AccessibilityManager destroyed');
  }
}