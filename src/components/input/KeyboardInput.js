/**
 * Keyboard input handler for GazeQuest Adventures
 * Provides reliable fallback input with full keyboard navigation
 */

export class KeyboardInput {
  constructor() {
    this.isActive = false;
    this.inputManager = null;
    this.eventListeners = new Map();
    
    this.keyBindings = new Map([
      ['Space', { action: 'select', description: 'Select/Activate' }],
      ['Enter', { action: 'select', description: 'Select/Activate' }],
      ['ArrowUp', { action: 'move', direction: 'up', description: 'Move Up' }],
      ['ArrowDown', { action: 'move', direction: 'down', description: 'Move Down' }],
      ['ArrowLeft', { action: 'move', direction: 'left', description: 'Move Left' }],
      ['ArrowRight', { action: 'move', direction: 'right', description: 'Move Right' }],
      ['Escape', { action: 'cancel', description: 'Cancel/Back' }],
      ['Tab', { action: 'navigate', description: 'Navigate' }],
      ['1', { action: 'command', command: 'hint', description: 'Show Hint' }],
      ['2', { action: 'command', command: 'pause', description: 'Pause Game' }],
      ['3', { action: 'command', command: 'menu', description: 'Open Menu' }]
    ]);
    
    this.pressedKeys = new Set();
    this.repeatTimers = new Map();
    this.lastKeyTime = 0;
    
    // Configuration
    this.config = {
      repeatDelay: 500, // ms before key starts repeating
      repeatRate: 100,  // ms between repeats
      doubleClickTime: 300 // ms for double-click detection
    };
  }

  /**
   * Check if keyboard input is available
   */
  async isAvailable() {
    return true; // Keyboard is always available in browsers
  }

  /**
   * Initialize keyboard input
   */
  async init(inputManager) {
    this.inputManager = inputManager;
    this.setupEventListeners();
    console.log('✅ Keyboard input initialized');
  }

  /**
   * Set up keyboard event listeners
   */
  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Focus management
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
    
    // Prevent default behavior for game keys
    document.addEventListener('keydown', (event) => {
      if (this.isActive && this.keyBindings.has(event.code)) {
        event.preventDefault();
      }
    });
  }

  /**
   * Activate keyboard input
   */
  async activate() {
    this.isActive = true;
    
    // Ensure document or game canvas has focus
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
      gameCanvas.focus();
    }
    
    console.log('🎮 Keyboard input activated');
  }

  /**
   * Deactivate keyboard input
   */
  async deactivate() {
    this.isActive = false;
    this.clearRepeatTimers();
    this.pressedKeys.clear();
    console.log('🎮 Keyboard input deactivated');
  }

  /**
   * Handle key down events
   */
  handleKeyDown(event) {
    if (!this.isActive) return;
    
    const key = event.code;
    const currentTime = Date.now();
    
    // Ignore if key is already pressed (prevents key repeat spam)
    if (this.pressedKeys.has(key)) return;
    
    this.pressedKeys.add(key);
    this.lastKeyTime = currentTime;
    
    // Handle the key binding
    if (this.keyBindings.has(key)) {
      const binding = this.keyBindings.get(key);
      this.executeKeyAction(binding, event, currentTime);
      
      // Set up key repeat if it's a movement key
      if (binding.action === 'move') {
        this.setupKeyRepeat(key, binding, currentTime);
      }
    }
    
    // Handle special keys
    this.handleSpecialKeys(event, currentTime);
  }

  /**
   * Handle key up events
   */
  handleKeyUp(event) {
    if (!this.isActive) return;
    
    const key = event.code;
    this.pressedKeys.delete(key);
    
    // Clear repeat timer for this key
    if (this.repeatTimers.has(key)) {
      clearTimeout(this.repeatTimers.get(key));
      this.repeatTimers.delete(key);
    }
  }

  /**
   * Execute key action
   */
  executeKeyAction(binding, event, timestamp) {
    const inputData = {
      action: binding.action,
      key: event.code,
      keyName: event.key,
      timestamp,
      accuracy: 1.0,
      confidence: 1.0,
      responseTime: timestamp - this.lastKeyTime
    };
    
    // Add action-specific data
    switch (binding.action) {
      case 'move':
        inputData.direction = binding.direction;
        inputData.x = binding.direction === 'left' ? -1 : binding.direction === 'right' ? 1 : 0;
        inputData.y = binding.direction === 'up' ? -1 : binding.direction === 'down' ? 1 : 0;
        break;
      case 'command':
        inputData.command = binding.command;
        break;
      case 'navigate':
        inputData.shift = event.shiftKey;
        break;
    }
    
    // Emit input event
    this.emit('input', inputData);
    
    // Record performance
    this.recordInputPerformance(inputData);
  }

  /**
   * Set up key repeat for movement keys
   */
  setupKeyRepeat(key, binding, startTime) {
    const repeatTimer = setTimeout(() => {
      if (this.pressedKeys.has(key) && this.isActive) {
        // Execute the action again
        this.executeKeyAction(binding, { code: key, key: key }, Date.now());
        
        // Set up next repeat
        const nextRepeatTimer = setInterval(() => {
          if (this.pressedKeys.has(key) && this.isActive) {
            this.executeKeyAction(binding, { code: key, key: key }, Date.now());
          } else {
            clearInterval(nextRepeatTimer);
          }
        }, this.config.repeatRate);
        
        this.repeatTimers.set(key + '_repeat', nextRepeatTimer);
      }
    }, this.config.repeatDelay);
    
    this.repeatTimers.set(key, repeatTimer);
  }

  /**
   * Handle special key combinations
   */
  handleSpecialKeys(event, timestamp) {
    // Alt + Tab prevention
    if (event.altKey && event.code === 'Tab') {
      event.preventDefault();
    }
    
    // Ctrl/Cmd combinations
    if (event.ctrlKey || event.metaKey) {
      switch (event.code) {
        case 'KeyR': // Refresh
          event.preventDefault();
          this.emit('command', { command: 'restart', timestamp });
          break;
        case 'KeyM': // Mute
          event.preventDefault();
          this.emit('command', { command: 'mute', timestamp });
          break;
        case 'Equal': // Zoom in
          event.preventDefault();
          this.emit('command', { command: 'zoomIn', timestamp });
          break;
        case 'Minus': // Zoom out
          event.preventDefault();
          this.emit('command', { command: 'zoomOut', timestamp });
          break;
      }
    }
    
    // Function keys
    if (event.code.startsWith('F')) {
      switch (event.code) {
        case 'F1': // Help
          event.preventDefault();
          this.emit('command', { command: 'help', timestamp });
          break;
        case 'F11': // Fullscreen
          event.preventDefault();
          this.emit('command', { command: 'fullscreen', timestamp });
          break;
      }
    }
  }

  /**
   * Handle focus in events
   */
  handleFocusIn(event) {
    if (this.isActive) {
      // Announce focused element to screen readers
      const element = event.target;
      const label = element.getAttribute('aria-label') || 
                   element.getAttribute('title') || 
                   element.textContent?.trim();
      
      if (label) {
        this.emit('focus', { 
          element, 
          label, 
          timestamp: Date.now() 
        });
      }
    }
  }

  /**
   * Handle focus out events
   */
  handleFocusOut(event) {
    if (this.isActive) {
      this.emit('blur', { 
        element: event.target, 
        timestamp: Date.now() 
      });
    }
  }

  /**
   * Clear all repeat timers
   */
  clearRepeatTimers() {
    this.repeatTimers.forEach(timer => clearTimeout(timer));
    this.repeatTimers.clear();
  }

  /**
   * Record input performance metrics
   */
  recordInputPerformance(inputData) {
    // Simple performance tracking for keyboard input
    if (this.inputManager?.gameEngine?.stateManager) {
      this.inputManager.gameEngine.stateManager.recordPerformance('inputLatency', {
        method: 'keyboard',
        action: inputData.action,
        responseTime: inputData.responseTime || 0,
        timestamp: inputData.timestamp
      });
    }
  }

  /**
   * Get keyboard capabilities
   */
  getCapabilities() {
    return {
      supportedActions: Array.from(new Set(Array.from(this.keyBindings.values()).map(b => b.action))),
      hasDirectionalInput: true,
      hasSelectInput: true,
      hasCommandInput: true,
      supportsPreciseInput: false,
      supportsGestures: false,
      reliability: 'high',
      latency: 'low'
    };
  }

  /**
   * Get current key bindings
   */
  getKeyBindings() {
    const bindings = {};
    this.keyBindings.forEach((binding, key) => {
      bindings[key] = binding;
    });
    return bindings;
  }

  /**
   * Update key binding
   */
  setKeyBinding(key, action, options = {}) {
    this.keyBindings.set(key, {
      action,
      ...options
    });
  }

  /**
   * Remove key binding
   */
  removeKeyBinding(key) {
    this.keyBindings.delete(key);
  }

  /**
   * Check if key is currently pressed
   */
  isKeyPressed(key) {
    return this.pressedKeys.has(key);
  }

  /**
   * Get currently pressed keys
   */
  getPressedKeys() {
    return Array.from(this.pressedKeys);
  }

  /**
   * Update method (called from InputManager)
   */
  update(deltaTime) {
    // Keyboard input doesn't need frame-by-frame updates
    // but we could add debouncing or other time-based features here
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
          console.error('Error in keyboard input event listener:', error);
        }
      });
    }
  }
}