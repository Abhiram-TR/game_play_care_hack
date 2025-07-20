/**
 * Input management system for GazeQuest Adventures
 * Handles multiple input methods and adaptive switching
 */

// import { EyeTracker } from '../components/input/EyeTracker.js'; // Disabled to prevent camera requests
import { VoiceRecognition } from '../components/input/VoiceRecognition.js';
import { BreathController } from '../components/input/BreathController.js';
import { DeviceOrientation } from '../components/input/DeviceOrientation.js';
import { SwitchInput } from '../components/input/SwitchInput.js';
import { KeyboardInput } from '../components/input/KeyboardInput.js';
import { AdaptiveInputAI } from '../utils/AdaptiveInputAI.js';

export class InputManager {
  constructor() {
    this.inputMethods = new Map();
    this.activeInputs = new Set();
    this.primaryInput = null;
    this.fallbackInputs = [];
    
    this.inputHistory = [];
    this.calibrationData = {};
    this.adaptiveAI = new AdaptiveInputAI();
    
    this.eventListeners = new Map();
    this.inputEvents = [];
    
    this.isInitialized = false;
    this.gameEngine = null;
    
    // Configuration
    this.config = {
      maxInputHistory: 1000,
      adaptiveUpdateInterval: 5000, // ms
      inputSwitchCooldown: 2000, // ms
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
    };
    
    this.lastInputSwitch = 0;
  }

  /**
   * Initialize all available input methods
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    
    try {
      console.log('🎮 Initializing InputManager...');
      
      // Initialize input methods
      await this.initializeInputMethods();
      
      // Set up adaptive AI
      this.setupAdaptiveAI();
      
      // Set up event handling
      this.setupEventHandling();
      
      // Auto-detect best initial input method
      await this.autoSelectInitialInput();
      
      this.isInitialized = true;
      console.log('✅ InputManager initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize InputManager:', error);
      throw error;
    }
  }

  /**
   * Initialize all input method instances
   */
  async initializeInputMethods() {
    const inputClasses = [
      { name: 'keyboard', class: KeyboardInput, priority: 1 },
      { name: 'switch', class: SwitchInput, priority: 2 },
      // { name: 'eyeTracking', class: EyeTracker, priority: 3 }, // Disabled by default to prevent camera requests
      { name: 'voice', class: VoiceRecognition, priority: 4 },
      { name: 'breath', class: BreathController, priority: 5 },
      { name: 'orientation', class: DeviceOrientation, priority: 6 }
    ];

    for (const { name, class: InputClass, priority } of inputClasses) {
      try {
        const inputInstance = new InputClass();
        
        // Check if input method is available
        const isAvailable = await inputInstance.isAvailable();
        
        if (isAvailable) {
          await inputInstance.init(this);
          
          this.inputMethods.set(name, {
            instance: inputInstance,
            priority,
            isActive: false,
            isCalibrated: false,
            lastUsed: 0,
            errorCount: 0,
            successRate: 1.0
          });
          
          console.log(`✅ ${name} input method initialized`);
        } else {
          console.log(`ℹ️ ${name} input method not available`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Failed to initialize ${name} input:`, error);
      }
    }
  }

  /**
   * Set up adaptive AI system
   */
  setupAdaptiveAI() {
    // Update adaptive recommendations periodically
    setInterval(() => {
      if (this.isInitialized && this.inputHistory.length > 10) {
        const recommendations = this.adaptiveAI.analyze(
          this.inputHistory,
          this.calibrationData,
          this.getCurrentContext()
        );
        
        this.handleAdaptiveRecommendations(recommendations);
      }
    }, this.config.adaptiveUpdateInterval);
  }

  /**
   * Set up event handling for input methods
   */
  setupEventHandling() {
    // Listen for input events from all methods
    this.inputMethods.forEach((methodData, methodName) => {
      const instance = methodData.instance;
      
      // Register common events
      instance.on('input', (data) => this.handleInputEvent(methodName, 'input', data));
      instance.on('error', (error) => this.handleInputError(methodName, error));
      instance.on('calibrationComplete', (data) => this.handleCalibrationComplete(methodName, data));
      instance.on('calibrationNeeded', () => this.handleCalibrationNeeded(methodName));
    });
  }

  /**
   * Auto-select the best initial input method
   */
  async autoSelectInitialInput() {
    // Check user preferences first
    const preferredInput = this.gameEngine.stateManager.getStateValue('settings.inputMethod');
    
    if (preferredInput && preferredInput !== 'auto' && this.inputMethods.has(preferredInput)) {
      await this.setActiveInput(preferredInput);
      return;
    }
    
    // Auto-detect based on availability and user capabilities
    const availableMethods = Array.from(this.inputMethods.keys());
    
    if (availableMethods.length === 0) {
      throw new Error('No input methods available');
    }
    
    // Start with most reliable method (keyboard/switch)
    const reliableMethods = ['keyboard', 'switch'].filter(method => 
      this.inputMethods.has(method)
    );
    
    if (reliableMethods.length > 0) {
      await this.setActiveInput(reliableMethods[0]);
    } else {
      // Fall back to first available method
      await this.setActiveInput(availableMethods[0]);
    }
    
    // Enable fallback inputs
    this.setupFallbackInputs();
  }

  /**
   * Set up fallback input methods
   */
  setupFallbackInputs() {
    this.fallbackInputs = Array.from(this.inputMethods.keys())
      .filter(method => method !== this.primaryInput)
      .sort((a, b) => {
        const aData = this.inputMethods.get(a);
        const bData = this.inputMethods.get(b);
        return aData.priority - bData.priority;
      });
  }

  /**
   * Set the active input method
   */
  async setActiveInput(methodName) {
    if (!this.inputMethods.has(methodName)) {
      throw new Error(`Input method '${methodName}' not available`);
    }
    
    const now = Date.now();
    
    // Check cooldown
    if (now - this.lastInputSwitch < this.config.inputSwitchCooldown) {
      console.warn('Input switch cooldown active');
      return false;
    }
    
    try {
      // Deactivate current primary input
      if (this.primaryInput) {
        const currentMethod = this.inputMethods.get(this.primaryInput);
        await currentMethod.instance.deactivate();
        currentMethod.isActive = false;
        this.activeInputs.delete(this.primaryInput);
      }
      
      // Activate new primary input
      const newMethod = this.inputMethods.get(methodName);
      await newMethod.instance.activate();
      newMethod.isActive = true;
      newMethod.lastUsed = now;
      this.activeInputs.add(methodName);
      
      this.primaryInput = methodName;
      this.lastInputSwitch = now;
      
      // Update user preferences
      this.gameEngine.stateManager.updateSettings('inputMethod', methodName);
      
      // Record session event
      this.gameEngine.stateManager.recordSessionEvent('inputMethodChange', {
        from: this.primaryInput,
        to: methodName,
        timestamp: now
      });
      
      // Announce change
      this.gameEngine.accessibilityManager.announce(
        `Input method changed to ${this.getInputMethodDisplayName(methodName)}`
      );
      
      console.log(`🎮 Primary input method set to: ${methodName}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to set active input to ${methodName}:`, error);
      return false;
    }
  }

  /**
   * Enable additional input method as secondary
   */
  async enableSecondaryInput(methodName) {
    if (!this.inputMethods.has(methodName) || methodName === this.primaryInput) {
      return false;
    }
    
    try {
      const method = this.inputMethods.get(methodName);
      
      if (!method.isActive) {
        await method.instance.activate();
        method.isActive = true;
        method.lastUsed = Date.now();
        this.activeInputs.add(methodName);
        
        console.log(`🎮 Secondary input enabled: ${methodName}`);
      }
      
      return true;
      
    } catch (error) {
      console.error(`Failed to enable secondary input ${methodName}:`, error);
      return false;
    }
  }

  /**
   * Disable input method
   */
  async disableInput(methodName) {
    if (!this.inputMethods.has(methodName)) {
      return false;
    }
    
    try {
      const method = this.inputMethods.get(methodName);
      
      if (method.isActive) {
        await method.instance.deactivate();
        method.isActive = false;
        this.activeInputs.delete(methodName);
        
        // If this was the primary input, switch to fallback
        if (this.primaryInput === methodName) {
          await this.switchToFallback();
        }
        
        console.log(`🎮 Input disabled: ${methodName}`);
      }
      
      return true;
      
    } catch (error) {
      console.error(`Failed to disable input ${methodName}:`, error);
      return false;
    }
  }

  /**
   * Switch to fallback input method
   */
  async switchToFallback() {
    for (const fallbackMethod of this.fallbackInputs) {
      if (this.inputMethods.has(fallbackMethod)) {
        const success = await this.setActiveInput(fallbackMethod);
        if (success) {
          console.log(`🎮 Switched to fallback input: ${fallbackMethod}`);
          return true;
        }
      }
    }
    
    console.error('No fallback input methods available');
    return false;
  }

  /**
   * Handle input events from any input method
   */
  handleInputEvent(methodName, eventType, data) {
    const timestamp = Date.now();
    
    // Record input event
    const inputEvent = {
      method: methodName,
      type: eventType,
      data,
      timestamp,
      accuracy: data.accuracy || 1.0,
      confidence: data.confidence || 1.0
    };
    
    this.inputEvents.push(inputEvent);
    this.inputHistory.push(inputEvent);
    
    // Maintain history size
    if (this.inputHistory.length > this.config.maxInputHistory) {
      this.inputHistory.shift();
    }
    
    // Update method statistics
    const method = this.inputMethods.get(methodName);
    if (method) {
      method.lastUsed = timestamp;
      
      // Update success rate based on accuracy
      if (data.accuracy !== undefined) {
        method.successRate = (method.successRate * 0.9) + (data.accuracy * 0.1);
      }
    }
    
    // Emit event to game engine
    this.emit('input', inputEvent);
    
    // Record performance data
    if (data.responseTime) {
      this.gameEngine.stateManager.recordPerformance('inputLatency', data.responseTime);
    }
  }

  /**
   * Handle input errors
   */
  handleInputError(methodName, error) {
    console.error(`Input error from ${methodName}:`, error);
    
    const method = this.inputMethods.get(methodName);
    if (method) {
      method.errorCount++;
      
      // If error rate is too high, consider switching
      if (method.errorCount > 5 && method === this.primaryInput) {
        console.warn(`High error rate for ${methodName}, considering fallback`);
        this.considerInputSwitch('high_error_rate');
      }
    }
    
    // Record error
    this.gameEngine.stateManager.recordSessionEvent('error', {
      source: 'input',
      method: methodName,
      error: error.message || String(error)
    });
  }

  /**
   * Handle calibration completion
   */
  handleCalibrationComplete(methodName, calibrationData) {
    const method = this.inputMethods.get(methodName);
    if (method) {
      method.isCalibrated = true;
      this.calibrationData[methodName] = calibrationData;
      
      console.log(`✅ Calibration completed for ${methodName}`);
      
      // Announce completion
      this.gameEngine.accessibilityManager.announce(
        `${this.getInputMethodDisplayName(methodName)} calibration completed successfully`
      );
    }
  }

  /**
   * Handle calibration needed
   */
  handleCalibrationNeeded(methodName) {
    console.log(`🎯 Calibration needed for ${methodName}`);
    
    // Announce to user
    this.gameEngine.accessibilityManager.announce(
      `${this.getInputMethodDisplayName(methodName)} needs calibration. Please follow the calibration instructions.`
    );
    
    // Could trigger calibration UI here
    this.emit('calibrationNeeded', { method: methodName });
  }

  /**
   * Handle adaptive AI recommendations
   */
  handleAdaptiveRecommendations(recommendations) {
    for (const recommendation of recommendations) {
      switch (recommendation.type) {
        case 'switch_input':
          this.considerInputSwitch('adaptive_recommendation', recommendation.data);
          break;
        case 'adjust_timing':
          this.adjustInputTiming(recommendation.data);
          break;
        case 'recalibrate':
          this.requestRecalibration(recommendation.data.method);
          break;
      }
    }
  }

  /**
   * Consider switching input method
   */
  async considerInputSwitch(reason, data = {}) {
    const currentTime = Date.now();
    
    // Check if switch is appropriate
    if (currentTime - this.lastInputSwitch < this.config.inputSwitchCooldown) {
      return;
    }
    
    // Get recommendation from adaptive AI
    const recommendation = this.adaptiveAI.getInputRecommendation(
      this.inputHistory,
      this.getCurrentContext()
    );
    
    if (recommendation && recommendation.method !== this.primaryInput) {
      console.log(`🤖 AI recommends switching to ${recommendation.method} (reason: ${reason})`);
      
      const success = await this.setActiveInput(recommendation.method);
      if (success) {
        // Record adaptive adjustment
        this.gameEngine.stateManager.recordSessionEvent('adaptiveAdjustment', {
          type: 'input_switch',
          reason,
          from: this.primaryInput,
          to: recommendation.method,
          confidence: recommendation.confidence
        });
      }
    }
  }

  /**
   * Adjust input timing based on AI recommendations
   */
  adjustInputTiming(adjustmentData) {
    const method = this.inputMethods.get(adjustmentData.method);
    if (method && method.instance.adjustTiming) {
      method.instance.adjustTiming(adjustmentData);
      
      console.log(`⏱️ Adjusted timing for ${adjustmentData.method}`);
      
      // Record adjustment
      this.gameEngine.stateManager.recordSessionEvent('adaptiveAdjustment', {
        type: 'timing_adjustment',
        method: adjustmentData.method,
        adjustment: adjustmentData
      });
    }
  }

  /**
   * Request recalibration for input method
   */
  requestRecalibration(methodName) {
    const method = this.inputMethods.get(methodName);
    if (method && method.instance.startCalibration) {
      console.log(`🎯 Requesting recalibration for ${methodName}`);
      method.instance.startCalibration();
    }
  }

  /**
   * Get current context for adaptive AI
   */
  getCurrentContext() {
    return {
      currentScene: this.gameEngine.sceneManager.getCurrentSceneName(),
      gameState: this.gameEngine.getState(),
      performance: this.gameEngine.getPerformanceMetrics(),
      userFatigue: this.estimateUserFatigue(),
      timeOfDay: new Date().getHours()
    };
  }

  /**
   * Estimate user fatigue based on session data
   */
  estimateUserFatigue() {
    const session = this.gameEngine.stateManager.getStateValue('session');
    const playTime = Date.now() - session.startTime;
    const errorRate = this.getRecentErrorRate();
    
    // Simple fatigue estimation
    let fatigue = Math.min(playTime / (60 * 60 * 1000), 1.0); // 0-1 based on hours played
    fatigue += errorRate * 0.5; // Increase based on error rate
    
    return Math.min(fatigue, 1.0);
  }

  /**
   * Get recent error rate
   */
  getRecentErrorRate() {
    const recentEvents = this.inputHistory.slice(-100);
    if (recentEvents.length === 0) return 0;
    
    const errors = recentEvents.filter(event => event.accuracy < 0.5).length;
    return errors / recentEvents.length;
  }

  /**
   * Update input manager
   */
  update(deltaTime) {
    // Update all active input methods
    this.activeInputs.forEach(methodName => {
      const method = this.inputMethods.get(methodName);
      if (method && method.instance.update) {
        method.instance.update(deltaTime);
      }
    });
    
    // Process queued input events
    this.processInputEvents();
  }

  /**
   * Process queued input events
   */
  processInputEvents() {
    while (this.inputEvents.length > 0) {
      const event = this.inputEvents.shift();
      this.handleProcessedInput(event);
    }
  }

  /**
   * Handle processed input event
   */
  handleProcessedInput(event) {
    // Route to appropriate game systems based on event type
    switch (event.type) {
      case 'click':
      case 'select':
        this.gameEngine.sceneManager.handleClick(event.data);
        break;
      case 'move':
      case 'gaze':
        this.gameEngine.sceneManager.handleMove(event.data);
        break;
      case 'command':
        this.gameEngine.sceneManager.handleCommand(event.data);
        break;
    }
  }

  /**
   * Get active input methods
   */
  getActiveInputMethods() {
    return Array.from(this.activeInputs);
  }

  /**
   * Get primary input method
   */
  getPrimaryInputMethod() {
    return this.primaryInput;
  }

  /**
   * Get input method capabilities
   */
  getCapabilities() {
    const capabilities = {};
    
    this.inputMethods.forEach((methodData, methodName) => {
      capabilities[methodName] = {
        available: true,
        active: methodData.isActive,
        calibrated: methodData.isCalibrated,
        successRate: methodData.successRate,
        errorCount: methodData.errorCount,
        capabilities: methodData.instance.getCapabilities()
      };
    });
    
    return capabilities;
  }

  /**
   * Get input method display name
   */
  getInputMethodDisplayName(methodName) {
    const displayNames = {
      keyboard: 'Keyboard',
      switch: 'Switch Control',
      eyeTracking: 'Eye Tracking',
      voice: 'Voice Control',
      breath: 'Breath Control',
      orientation: 'Head Movement'
    };
    
    return displayNames[methodName] || methodName;
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
   * Emit event to listeners
   */
  emit(eventType, data) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in input event listener:', error);
        }
      });
    }
  }
}