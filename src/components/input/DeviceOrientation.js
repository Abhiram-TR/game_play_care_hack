/**
 * Device orientation input handler for GazeQuest Adventures
 * Uses device orientation/motion for head movement tracking (stub implementation)
 */

export class DeviceOrientation {
  constructor() {
    this.isActive = false;
    this.inputManager = null;
    this.eventListeners = new Map();
    
    // Orientation data
    this.currentOrientation = {
      alpha: 0, // Z-axis rotation
      beta: 0,  // X-axis rotation (front-to-back)
      gamma: 0  // Y-axis rotation (left-to-right)
    };
    
    this.baselineOrientation = null;
    this.orientationHistory = [];
    
    // Configuration
    this.config = {
      sensitivity: 'medium',
      deadZone: 5, // degrees
      maxTilt: 45, // degrees
      smoothingWindow: 5
    };
    
    this.isCalibrated = false;
    this.permissionGranted = false;
  }

  /**
   * Check if device orientation is available
   */
  async isAvailable() {
    return !!(window.DeviceOrientationEvent || window.DeviceMotionEvent);
  }

  /**
   * Initialize device orientation
   */
  async init(inputManager) {
    this.inputManager = inputManager;
    
    if (!await this.isAvailable()) {
      console.warn('⚠️ Device orientation not available');
      return;
    }
    
    try {
      // Request permission on iOS 13+
      await this.requestPermission();
      
      console.log('📱 Device orientation initialized (stub)');
      
    } catch (error) {
      console.error('Failed to initialize device orientation:', error);
      throw error;
    }
  }

  /**
   * Request device orientation permission
   */
  async requestPermission() {
    // Check if permission is needed (iOS 13+)
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        this.permissionGranted = permission === 'granted';
        
        if (!this.permissionGranted) {
          throw new Error('Device orientation permission denied');
        }
        
      } catch (error) {
        console.error('Failed to request device orientation permission:', error);
        throw error;
      }
    } else {
      // Permission not needed on other platforms
      this.permissionGranted = true;
    }
  }

  /**
   * Set up orientation event listeners
   */
  setupEventListeners() {
    if (!this.permissionGranted) return;
    
    // Device orientation event
    window.addEventListener('deviceorientation', (event) => {
      this.handleOrientationChange(event);
    });
    
    // Device motion event (for additional data)
    window.addEventListener('devicemotion', (event) => {
      this.handleMotionChange(event);
    });
  }

  /**
   * Handle device orientation change
   */
  handleOrientationChange(event) {
    if (!this.isActive) return;
    
    const newOrientation = {
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0,
      timestamp: Date.now()
    };
    
    // Apply smoothing
    this.currentOrientation = this.smoothOrientation(newOrientation);
    
    // Convert to input events
    this.convertOrientationToInput();
  }

  /**
   * Handle device motion change
   */
  handleMotionChange(event) {
    if (!this.isActive) return;
    
    // Could use acceleration data for additional input methods
    const acceleration = event.acceleration;
    if (acceleration) {
      // Process motion data
    }
  }

  /**
   * Smooth orientation readings
   */
  smoothOrientation(newOrientation) {
    this.orientationHistory.push(newOrientation);
    
    // Keep only recent history
    if (this.orientationHistory.length > this.config.smoothingWindow) {
      this.orientationHistory.shift();
    }
    
    // Calculate average
    const avgOrientation = {
      alpha: 0,
      beta: 0,
      gamma: 0,
      timestamp: newOrientation.timestamp
    };
    
    this.orientationHistory.forEach(orientation => {
      avgOrientation.alpha += orientation.alpha;
      avgOrientation.beta += orientation.beta;
      avgOrientation.gamma += orientation.gamma;
    });
    
    const count = this.orientationHistory.length;
    avgOrientation.alpha /= count;
    avgOrientation.beta /= count;
    avgOrientation.gamma /= count;
    
    return avgOrientation;
  }

  /**
   * Convert orientation to input events
   */
  convertOrientationToInput() {
    if (!this.isCalibrated || !this.baselineOrientation) return;
    
    // Calculate relative movement from baseline
    const deltaGamma = this.currentOrientation.gamma - this.baselineOrientation.gamma;
    const deltaBeta = this.currentOrientation.beta - this.baselineOrientation.beta;
    
    // Apply dead zone
    if (Math.abs(deltaGamma) < this.config.deadZone && Math.abs(deltaBeta) < this.config.deadZone) {
      return;
    }
    
    // Determine movement direction
    let inputEvent = null;
    
    if (Math.abs(deltaGamma) > Math.abs(deltaBeta)) {
      // Horizontal movement (left/right)
      if (Math.abs(deltaGamma) > this.config.deadZone) {
        inputEvent = {
          action: 'move',
          direction: deltaGamma > 0 ? 'right' : 'left',
          method: 'orientation',
          data: {
            deltaGamma,
            deltaBeta,
            intensity: Math.min(Math.abs(deltaGamma) / this.config.maxTilt, 1)
          },
          timestamp: Date.now()
        };
      }
    } else {
      // Vertical movement (up/down)
      if (Math.abs(deltaBeta) > this.config.deadZone) {
        inputEvent = {
          action: 'move',
          direction: deltaBeta > 0 ? 'down' : 'up',
          method: 'orientation',
          data: {
            deltaGamma,
            deltaBeta,
            intensity: Math.min(Math.abs(deltaBeta) / this.config.maxTilt, 1)
          },
          timestamp: Date.now()
        };
      }
    }
    
    if (inputEvent) {
      this.emit('input', inputEvent);
    }
  }

  /**
   * Activate device orientation
   */
  async activate() {
    this.isActive = true;
    
    if (!this.permissionGranted) {
      await this.requestPermission();
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start calibration if not already calibrated
    if (!this.isCalibrated) {
      this.startCalibration();
    }
    
    console.log('📱 Device orientation activated');
  }

  /**
   * Deactivate device orientation
   */
  async deactivate() {
    this.isActive = false;
    
    // Remove event listeners
    window.removeEventListener('deviceorientation', this.handleOrientationChange);
    window.removeEventListener('devicemotion', this.handleMotionChange);
    
    console.log('📱 Device orientation deactivated');
  }

  /**
   * Start calibration process
   */
  startCalibration() {
    console.log('📱 Device orientation calibration started (stub)');
    
    // Simple calibration - capture current orientation as baseline
    setTimeout(() => {
      this.baselineOrientation = { ...this.currentOrientation };
      this.isCalibrated = true;
      
      this.emit('calibrationComplete', {
        baseline: this.baselineOrientation,
        sensitivity: this.config.sensitivity
      });
      
      console.log('📱 Device orientation calibrated');
    }, 3000);
    
    // Announce calibration
    if (this.inputManager?.gameEngine?.accessibilityManager) {
      this.inputManager.gameEngine.accessibilityManager.announce(
        'Device orientation calibration started. Hold your device in a comfortable position for 3 seconds.'
      );
    }
  }

  /**
   * Get current orientation data
   */
  getCurrentOrientation() {
    return {
      ...this.currentOrientation,
      relative: this.baselineOrientation ? {
        gamma: this.currentOrientation.gamma - this.baselineOrientation.gamma,
        beta: this.currentOrientation.beta - this.baselineOrientation.beta,
        alpha: this.currentOrientation.alpha - this.baselineOrientation.alpha
      } : null
    };
  }

  /**
   * Set orientation sensitivity
   */
  setSensitivity(sensitivity) {
    const sensitivityMap = {
      low: { deadZone: 10, maxTilt: 60 },
      medium: { deadZone: 5, maxTilt: 45 },
      high: { deadZone: 2, maxTilt: 30 }
    };
    
    const settings = sensitivityMap[sensitivity] || sensitivityMap.medium;
    this.config.deadZone = settings.deadZone;
    this.config.maxTilt = settings.maxTilt;
    this.config.sensitivity = sensitivity;
  }

  /**
   * Get device orientation capabilities
   */
  getCapabilities() {
    return {
      supportedActions: ['move'],
      hasDirectionalInput: true,
      hasSelectInput: false,
      hasCommandInput: false,
      supportsPreciseInput: true,
      supportsGestures: true,
      reliability: 'medium',
      latency: 'low',
      requiresCalibration: true,
      configurable: true
    };
  }

  /**
   * Update method (called from InputManager)
   */
  update(deltaTime) {
    // Orientation events are handled by event listeners
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
          console.error('Error in device orientation event listener:', error);
        }
      });
    }
  }
}