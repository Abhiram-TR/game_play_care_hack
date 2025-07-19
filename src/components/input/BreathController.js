/**
 * Breath controller input handler for GazeQuest Adventures
 * Uses microphone audio levels to detect breathing patterns (stub implementation)
 */

export class BreathController {
  constructor() {
    this.isActive = false;
    this.inputManager = null;
    this.eventListeners = new Map();
    
    // Audio analysis
    this.audioContext = null;
    this.microphone = null;
    this.analyser = null;
    this.dataArray = null;
    
    // Breath detection
    this.breathLevel = 0;
    this.breathState = 'idle'; // 'inhale', 'exhale', 'hold', 'idle'
    this.breathHistory = [];
    
    // Configuration
    this.config = {
      sensitivity: 'medium',
      breathInThreshold: 0.3,
      breathOutThreshold: 0.7,
      holdThreshold: 0.1,
      smoothingWindow: 10
    };
    
    this.isCalibrated = false;
  }

  /**
   * Check if breath control is available
   */
  async isAvailable() {
    try {
      // Check for microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize breath controller
   */
  async init(inputManager) {
    this.inputManager = inputManager;
    
    if (!await this.isAvailable()) {
      console.warn('⚠️ Microphone access not available for breath control');
      return;
    }
    
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      console.log('💨 Breath controller initialized (stub)');
      
    } catch (error) {
      console.error('Failed to initialize breath controller:', error);
      throw error;
    }
  }

  /**
   * Set up audio analysis
   */
  async setupAudioAnalysis() {
    try {
      // Get microphone stream
      this.microphone = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      // Create audio nodes
      const source = this.audioContext.createMediaStreamSource(this.microphone);
      this.analyser = this.audioContext.createAnalyser();
      
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      source.connect(this.analyser);
      
      // Create data array for frequency data
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Start analysis loop
      this.startAnalysis();
      
      console.log('🎤 Audio analysis setup complete');
      
    } catch (error) {
      console.error('Failed to setup audio analysis:', error);
      throw error;
    }
  }

  /**
   * Start audio analysis loop
   */
  startAnalysis() {
    const analyze = () => {
      if (!this.isActive || !this.analyser) return;
      
      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculate breath level (simplified)
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      
      const rawLevel = sum / this.dataArray.length / 255;
      
      // Apply smoothing
      this.breathLevel = this.smoothBreathLevel(rawLevel);
      
      // Detect breath state
      this.detectBreathState();
      
      // Continue analysis
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  /**
   * Smooth breath level readings
   */
  smoothBreathLevel(rawLevel) {
    this.breathHistory.push(rawLevel);
    
    // Keep only recent history
    if (this.breathHistory.length > this.config.smoothingWindow) {
      this.breathHistory.shift();
    }
    
    // Calculate average
    const sum = this.breathHistory.reduce((a, b) => a + b, 0);
    return sum / this.breathHistory.length;
  }

  /**
   * Detect breath state from audio level
   */
  detectBreathState() {
    const level = this.breathLevel;
    const prevState = this.breathState;
    
    // Simple state detection (would need calibration in real implementation)
    if (level > this.config.breathOutThreshold) {
      this.breathState = 'exhale';
    } else if (level < this.config.breathInThreshold) {
      this.breathState = 'inhale';
    } else if (Math.abs(level - 0.5) < this.config.holdThreshold) {
      this.breathState = 'hold';
    } else {
      this.breathState = 'idle';
    }
    
    // Emit state change events
    if (this.breathState !== prevState) {
      this.emit(this.breathState, {
        state: this.breathState,
        level: level,
        timestamp: Date.now()
      });
      
      // Convert to input events
      this.convertBreathToInput(this.breathState, level);
    }
  }

  /**
   * Convert breath state to input events
   */
  convertBreathToInput(state, level) {
    let inputEvent = null;
    
    switch (state) {
      case 'exhale':
        inputEvent = {
          action: 'select',
          method: 'breath',
          data: { breathState: state, level },
          timestamp: Date.now()
        };
        break;
      case 'inhale':
        inputEvent = {
          action: 'move',
          direction: 'up',
          method: 'breath',
          data: { breathState: state, level },
          timestamp: Date.now()
        };
        break;
      case 'hold':
        inputEvent = {
          action: 'pause',
          method: 'breath',
          data: { breathState: state, level },
          timestamp: Date.now()
        };
        break;
    }
    
    if (inputEvent) {
      this.emit('input', inputEvent);
    }
  }

  /**
   * Activate breath controller
   */
  async activate() {
    this.isActive = true;
    
    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Set up audio analysis
      await this.setupAudioAnalysis();
      
      console.log('💨 Breath controller activated');
      
    } catch (error) {
      console.error('Failed to activate breath controller:', error);
      this.isActive = false;
      throw error;
    }
  }

  /**
   * Deactivate breath controller
   */
  async deactivate() {
    this.isActive = false;
    
    // Stop microphone
    if (this.microphone) {
      this.microphone.getTracks().forEach(track => track.stop());
      this.microphone = null;
    }
    
    console.log('💨 Breath controller deactivated');
  }

  /**
   * Start calibration process
   */
  async startCalibration() {
    console.log('💨 Breath calibration started (stub)');
    
    // Simplified calibration
    setTimeout(() => {
      this.isCalibrated = true;
      this.emit('calibrationComplete', {
        sensitivity: this.config.sensitivity,
        thresholds: {
          breathIn: this.config.breathInThreshold,
          breathOut: this.config.breathOutThreshold,
          hold: this.config.holdThreshold
        }
      });
    }, 2000);
  }

  /**
   * Get current breath state
   */
  getBreathState() {
    return {
      level: this.breathLevel,
      state: this.breathState,
      isCalibrated: this.isCalibrated
    };
  }

  /**
   * Set breath thresholds
   */
  setThresholds(options) {
    this.config.breathInThreshold = options.breathIn || this.config.breathInThreshold;
    this.config.breathOutThreshold = options.breathOut || this.config.breathOutThreshold;
    this.config.holdThreshold = options.hold || this.config.holdThreshold;
  }

  /**
   * Get breath controller capabilities
   */
  getCapabilities() {
    return {
      supportedActions: ['select', 'move', 'pause'],
      hasDirectionalInput: true,
      hasSelectInput: true,
      hasCommandInput: false,
      supportsPreciseInput: false,
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
    // Breath analysis runs in requestAnimationFrame loop
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
          console.error('Error in breath controller event listener:', error);
        }
      });
    }
  }
}