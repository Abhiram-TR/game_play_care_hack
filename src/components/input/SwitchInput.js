/**
 * Switch input handler for GazeQuest Adventures
 * Provides single-switch scanning interface for motor-impaired users
 */

export class SwitchInput {
  constructor() {
    this.isActive = false;
    this.inputManager = null;
    this.eventListeners = new Map();
    
    this.isScanning = false;
    this.scanIndex = 0;
    this.scanElements = [];
    this.scanTimer = null;
    
    // Configuration
    this.config = {
      scanSpeed: 1000,      // ms between scan highlights
      autoScan: true,       // Automatically start scanning
      repeatScans: true,    // Repeat scanning after reaching end
      highlightClass: 'switch-highlight',
      audioFeedback: true,
      dwellTime: 0          // No dwell time for switches
    };
    
    // Switch detection
    this.switchKeys = new Set(['Space', 'Enter', 'NumpadEnter']);
    this.lastSwitchTime = 0;
    this.switchHoldTime = 0;
    this.isHoldMode = false;
    
    // Scanning groups
    this.scanGroups = [];
    this.currentGroup = null;
    this.groupIndex = 0;
  }

  /**
   * Check if switch input is available
   */
  async isAvailable() {
    return true; // Switch input is always available via keyboard
  }

  /**
   * Initialize switch input
   */
  async init(inputManager) {
    this.inputManager = inputManager;
    this.setupEventListeners();
    
    // Load user preferences
    this.loadUserSettings();
    
    console.log('✅ Switch input initialized');
  }

  /**
   * Load user settings from state manager
   */
  loadUserSettings() {
    if (this.inputManager?.gameEngine?.stateManager) {
      const settings = this.inputManager.gameEngine.stateManager.getStateValue('settings.inputSettings.switch');
      if (settings) {
        this.config.scanSpeed = settings.scanSpeed || this.config.scanSpeed;
        this.config.autoScan = settings.autoScan !== undefined ? settings.autoScan : this.config.autoScan;
      }
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Keyboard listeners for switch activation
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Gamepad support for dedicated switches
    if (navigator.getGamepads) {
      this.gamepadInterval = setInterval(this.checkGamepads.bind(this), 50);
    }
    
    // Mouse click as switch (for testing)
    document.addEventListener('click', this.handleMouseClick.bind(this));
  }

  /**
   * Activate switch input
   */
  async activate() {
    this.isActive = true;
    
    // Update scannable elements
    this.updateScanElements();
    
    // Start scanning if auto-scan is enabled
    if (this.config.autoScan && this.scanElements.length > 0) {
      this.startScanning();
    }
    
    // Announce activation
    this.announceToUser('Switch control activated. Press your switch to select highlighted items.');
    
    console.log('🎮 Switch input activated');
  }

  /**
   * Deactivate switch input
   */
  async deactivate() {
    this.isActive = false;
    this.stopScanning();
    this.clearHighlights();
    
    if (this.gamepadInterval) {
      clearInterval(this.gamepadInterval);
    }
    
    console.log('🎮 Switch input deactivated');
  }

  /**
   * Update scannable elements
   */
  updateScanElements() {
    // Find all interactive elements
    const selectors = [
      'button:not([disabled])',
      '[role="button"]:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '.game-interactive:not([disabled])',
      '.focusable:not([disabled])'
    ];
    
    this.scanElements = Array.from(document.querySelectorAll(selectors.join(', ')))
      .filter(element => this.isElementVisible(element))
      .sort((a, b) => this.getTabOrder(a) - this.getTabOrder(b));
    
    // Group elements if there are many
    if (this.scanElements.length > 10) {
      this.createScanGroups();
    } else {
      this.scanGroups = [];
      this.currentGroup = null;
    }
    
    console.log(`Found ${this.scanElements.length} scannable elements`);
  }

  /**
   * Create scanning groups for large element sets
   */
  createScanGroups() {
    const groupSize = Math.ceil(Math.sqrt(this.scanElements.length));
    this.scanGroups = [];
    
    for (let i = 0; i < this.scanElements.length; i += groupSize) {
      this.scanGroups.push(this.scanElements.slice(i, i + groupSize));
    }
    
    console.log(`Created ${this.scanGroups.length} scan groups`);
  }

  /**
   * Check if element is visible and interactable
   */
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           rect.top < window.innerHeight &&
           rect.bottom > 0;
  }

  /**
   * Get tab order for element sorting
   */
  getTabOrder(element) {
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex === null) return 0;
    return parseInt(tabIndex) || 0;
  }

  /**
   * Start scanning process
   */
  startScanning() {
    if (this.isScanning || !this.isActive) return;
    
    this.isScanning = true;
    this.scanIndex = 0;
    this.groupIndex = 0;
    
    // Clear any existing highlights
    this.clearHighlights();
    
    // Start scanning
    this.performScan();
    
    // Announce start
    this.announceToUser('Scanning started. Press your switch when the item you want is highlighted.');
    
    console.log('🔍 Switch scanning started');
  }

  /**
   * Stop scanning process
   */
  stopScanning() {
    if (!this.isScanning) return;
    
    this.isScanning = false;
    
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    
    this.clearHighlights();
    console.log('🔍 Switch scanning stopped');
  }

  /**
   * Perform one scan step
   */
  performScan() {
    if (!this.isScanning || !this.isActive) return;
    
    // Clear previous highlights
    this.clearHighlights();
    
    // Determine what to highlight
    if (this.scanGroups.length > 0 && this.currentGroup === null) {
      // Scanning groups
      this.highlightGroup(this.groupIndex);
      this.announceCurrentItem(this.scanGroups[this.groupIndex], true);
      
      this.groupIndex = (this.groupIndex + 1) % this.scanGroups.length;
    } else {
      // Scanning individual elements
      const elementsToScan = this.currentGroup || this.scanElements;
      
      if (elementsToScan.length > 0) {
        this.highlightElement(elementsToScan[this.scanIndex]);
        this.announceCurrentItem(elementsToScan[this.scanIndex], false);
        
        this.scanIndex = (this.scanIndex + 1) % elementsToScan.length;
      }
    }
    
    // Schedule next scan
    this.scanTimer = setTimeout(() => {
      this.performScan();
    }, this.config.scanSpeed);
  }

  /**
   * Highlight a single element
   */
  highlightElement(element) {
    if (element) {
      element.classList.add(this.config.highlightClass);
      element.setAttribute('aria-selected', 'true');
      
      // Scroll into view if needed
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
      
      // Audio feedback
      if (this.config.audioFeedback) {
        this.playHighlightSound();
      }
    }
  }

  /**
   * Highlight a group of elements
   */
  highlightGroup(groupIndex) {
    const group = this.scanGroups[groupIndex];
    if (group) {
      group.forEach(element => {
        element.classList.add(this.config.highlightClass);
      });
    }
  }

  /**
   * Clear all highlights
   */
  clearHighlights() {
    document.querySelectorAll(`.${this.config.highlightClass}`).forEach(element => {
      element.classList.remove(this.config.highlightClass);
      element.removeAttribute('aria-selected');
    });
  }

  /**
   * Announce current item to screen reader
   */
  announceCurrentItem(item, isGroup = false) {
    let announcement = '';
    
    if (isGroup) {
      announcement = `Group ${this.groupIndex + 1} of ${this.scanGroups.length}. Contains ${item.length} items.`;
    } else {
      const label = this.getElementLabel(item);
      const role = item.getAttribute('role') || item.tagName.toLowerCase();
      announcement = `${label}, ${role}`;
    }
    
    this.announceToUser(announcement);
  }

  /**
   * Get readable label for element
   */
  getElementLabel(element) {
    return element.getAttribute('aria-label') ||
           element.getAttribute('title') ||
           element.textContent?.trim() ||
           element.getAttribute('alt') ||
           element.value ||
           'Unlabeled element';
  }

  /**
   * Handle key down events
   */
  handleKeyDown(event) {
    if (!this.isActive) return;
    
    if (this.switchKeys.has(event.code)) {
      event.preventDefault();
      
      const currentTime = Date.now();
      this.lastSwitchTime = currentTime;
      
      // Handle switch activation
      this.handleSwitchActivation(currentTime);
    }
  }

  /**
   * Handle key up events
   */
  handleKeyUp(event) {
    if (!this.isActive) return;
    
    if (this.switchKeys.has(event.code)) {
      const holdDuration = Date.now() - this.lastSwitchTime;
      
      // Check for long press (configuration/settings)
      if (holdDuration > 2000) {
        this.handleLongPress();
      }
    }
  }

  /**
   * Handle mouse click (for testing)
   */
  handleMouseClick(event) {
    if (!this.isActive || event.target.closest('.switch-control-only')) {
      this.handleSwitchActivation(Date.now());
    }
  }

  /**
   * Check for gamepad input
   */
  checkGamepads() {
    if (!this.isActive) return;
    
    const gamepads = navigator.getGamepads();
    
    for (const gamepad of gamepads) {
      if (gamepad) {
        // Check for any button press
        for (let i = 0; i < gamepad.buttons.length; i++) {
          if (gamepad.buttons[i].pressed) {
            this.handleSwitchActivation(Date.now());
            break;
          }
        }
      }
    }
  }

  /**
   * Handle switch activation
   */
  handleSwitchActivation(timestamp) {
    if (!this.isScanning) {
      // Start scanning if not already scanning
      this.startScanning();
      return;
    }
    
    // Determine what to activate
    if (this.scanGroups.length > 0 && this.currentGroup === null) {
      // Select a group
      this.selectGroup();
    } else {
      // Activate current element
      this.activateCurrentElement();
    }
    
    // Record input event
    const inputData = {
      action: 'select',
      method: 'switch',
      timestamp,
      accuracy: 1.0,
      confidence: 1.0,
      responseTime: timestamp - this.lastSwitchTime
    };
    
    this.emit('input', inputData);
  }

  /**
   * Select a group for detailed scanning
   */
  selectGroup() {
    const selectedGroupIndex = (this.groupIndex - 1 + this.scanGroups.length) % this.scanGroups.length;
    this.currentGroup = this.scanGroups[selectedGroupIndex];
    this.scanIndex = 0;
    
    this.announceToUser(`Group selected. Scanning ${this.currentGroup.length} items.`);
    
    // Continue scanning within the group
    setTimeout(() => {
      this.performScan();
    }, this.config.scanSpeed);
  }

  /**
   * Activate the currently highlighted element
   */
  activateCurrentElement() {
    const elementsToScan = this.currentGroup || this.scanElements;
    const currentElementIndex = (this.scanIndex - 1 + elementsToScan.length) % elementsToScan.length;
    const currentElement = elementsToScan[currentElementIndex];
    
    if (currentElement) {
      this.stopScanning();
      
      // Announce selection
      this.announceToUser(`Selected: ${this.getElementLabel(currentElement)}`);
      
      // Activate the element
      this.activateElement(currentElement);
      
      // Reset group selection
      this.currentGroup = null;
      this.groupIndex = 0;
      
      // Restart scanning after a delay
      setTimeout(() => {
        if (this.config.autoScan && this.isActive) {
          this.updateScanElements();
          this.startScanning();
        }
      }, 2000);
    }
  }

  /**
   * Activate an element (click, focus, etc.)
   */
  activateElement(element) {
    // Focus the element
    element.focus();
    
    // Trigger appropriate event based on element type
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      element.click();
    } else if (element.tagName === 'A') {
      element.click();
    } else if (element.tagName === 'INPUT') {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.click();
      } else {
        element.focus();
      }
    } else {
      // Try to trigger a click event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(clickEvent);
    }
  }

  /**
   * Handle long press for configuration
   */
  handleLongPress() {
    this.announceToUser('Configuration mode. Use switch to adjust scan speed.');
    // Could implement configuration interface here
  }

  /**
   * Play highlight sound
   */
  playHighlightSound() {
    // Simple audio feedback using Web Audio API
    if (this.inputManager?.gameEngine?.audioManager) {
      this.inputManager.gameEngine.audioManager.playSFX('switch_highlight');
    }
  }

  /**
   * Announce message to user
   */
  announceToUser(message) {
    if (this.inputManager?.gameEngine?.accessibilityManager) {
      this.inputManager.gameEngine.accessibilityManager.announce(message);
    }
  }

  /**
   * Adjust scan speed
   */
  adjustScanSpeed(delta) {
    this.config.scanSpeed = Math.max(200, Math.min(3000, this.config.scanSpeed + delta));
    
    // Save to user preferences
    if (this.inputManager?.gameEngine?.stateManager) {
      this.inputManager.gameEngine.stateManager.updateSettings('inputSettings.switch.scanSpeed', this.config.scanSpeed);
    }
    
    this.announceToUser(`Scan speed adjusted to ${this.config.scanSpeed} milliseconds`);
  }

  /**
   * Get switch capabilities
   */
  getCapabilities() {
    return {
      supportedActions: ['select', 'navigate'],
      hasDirectionalInput: false,
      hasSelectInput: true,
      hasCommandInput: false,
      supportsPreciseInput: false,
      supportsGestures: false,
      reliability: 'high',
      latency: 'medium',
      requiresScanning: true,
      configurable: true
    };
  }

  /**
   * Update method
   */
  update(deltaTime) {
    // Update scan elements periodically
    if (this.isActive && Date.now() % 5000 < deltaTime) {
      this.updateScanElements();
    }
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
          console.error('Error in switch input event listener:', error);
        }
      });
    }
  }
}