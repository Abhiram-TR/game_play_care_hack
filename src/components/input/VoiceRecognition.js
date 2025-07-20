/**
 * Voice recognition input handler for GazeQuest Adventures
 * Uses Web Speech API for voice commands - FULL IMPLEMENTATION
 */

export class VoiceRecognition {
  constructor() {
    this.isActive = false;
    this.inputManager = null;
    this.eventListeners = new Map();
    
    // Voice recognition instance
    this.recognition = null;
    this.isListening = false;
    
    // Command registry
    this.commands = new Map();
    
    // Configuration
    this.config = {
      language: 'en-US',
      continuous: true,
      interimResults: false,
      confidenceThreshold: 0.7
    };
  }

  /**
   * Check if voice recognition is available
   */
  async isAvailable() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Initialize voice recognition
   */
  async init(inputManager) {
    this.inputManager = inputManager;
    
    if (!await this.isAvailable()) {
      console.warn('⚠️ Voice recognition not available in this browser');
      return;
    }
    
    try {
      // Initialize Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.lang = this.config.language;
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Register default commands
      this.registerDefaultCommands();
      
      console.log('🗣️ Voice recognition initialized (stub)');
      
    } catch (error) {
      console.error('Failed to initialize voice recognition:', error);
      throw error;
    }
  }

  /**
   * Set up voice recognition event handlers
   */
  setupEventHandlers() {
    if (!this.recognition) return;
    
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🗣️ Voice recognition started');
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🗣️ Voice recognition ended');
    };
    
    this.recognition.onresult = (event) => {
      this.handleVoiceResult(event);
    };
    
    this.recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      this.emit('error', new Error(`Voice recognition error: ${event.error}`));
    };
  }

  /**
   * Register default voice commands
   */
  registerDefaultCommands() {
    // Navigation commands
    this.registerCommand(['select', 'click', 'activate', 'choose', 'pick'], () => {
      this.emit('input', {
        action: 'select',
        method: 'voice',
        accuracy: 0.9,
        confidence: 0.8,
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['up', 'move up', 'go up', 'above'], () => {
      this.emit('input', {
        action: 'move',
        direction: 'up',
        method: 'voice',
        accuracy: 0.9,
        confidence: 0.8,
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['down', 'move down', 'go down', 'below'], () => {
      this.emit('input', {
        action: 'move',
        direction: 'down',
        method: 'voice',
        accuracy: 0.9,
        confidence: 0.8,
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['left', 'move left', 'go left'], () => {
      this.emit('input', {
        action: 'move',
        direction: 'left',
        method: 'voice',
        accuracy: 0.9,
        confidence: 0.8,
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['right', 'move right', 'go right'], () => {
      this.emit('input', {
        action: 'move',
        direction: 'right',
        method: 'voice',
        accuracy: 0.9,
        confidence: 0.8,
        timestamp: Date.now()
      });
    });
    
    // Game-specific commands
    this.registerCommand(['menu', 'main menu', 'home'], () => {
      this.emit('input', {
        action: 'command',
        command: 'menu',
        method: 'voice',
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['help', 'assistance', 'guide'], () => {
      this.emit('input', {
        action: 'command',
        command: 'help',
        method: 'voice',
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['pause', 'stop', 'wait'], () => {
      this.emit('input', {
        action: 'command',
        command: 'pause',
        method: 'voice',
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['start', 'play', 'begin', 'go'], () => {
      this.emit('input', {
        action: 'command',
        command: 'start',
        method: 'voice',
        timestamp: Date.now()
      });
    });
    
    // Wind Valley specific commands
    this.registerCommand(['wind', 'blow', 'air'], () => {
      this.emit('input', {
        action: 'wind',
        method: 'voice',
        intensity: 0.8,
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['gentle', 'soft', 'light'], () => {
      this.emit('input', {
        action: 'wind',
        method: 'voice',
        intensity: 0.3,
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['strong', 'powerful', 'hard'], () => {
      this.emit('input', {
        action: 'wind',
        method: 'voice',
        intensity: 1.0,
        timestamp: Date.now()
      });
    });
    
    // Accessibility commands
    this.registerCommand(['high contrast', 'contrast'], () => {
      this.emit('input', {
        action: 'accessibility',
        command: 'toggle_contrast',
        method: 'voice',
        timestamp: Date.now()
      });
    });
    
    this.registerCommand(['large text', 'big text'], () => {
      this.emit('input', {
        action: 'accessibility',
        command: 'toggle_text_size',
        method: 'voice',
        timestamp: Date.now()
      });
    });
  }

  /**
   * Register a voice command
   */
  registerCommand(phrases, callback, options = {}) {
    const commandData = {
      callback,
      confidence: options.confidence || this.config.confidenceThreshold,
      aliases: Array.isArray(phrases) ? phrases : [phrases]
    };
    
    commandData.aliases.forEach(phrase => {
      this.commands.set(phrase.toLowerCase(), commandData);
    });
  }

  /**
   * Handle voice recognition results
   */
  handleVoiceResult(event) {
    const results = event.results;
    const lastResult = results[results.length - 1];
    
    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      const confidence = lastResult[0].confidence;
      
      console.log('🗣️ Voice input:', transcript, 'confidence:', confidence);
      
      // Find matching command
      const command = this.findBestMatch(transcript, confidence);
      if (command) {
        command.callback({
          transcript,
          confidence,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Find best matching command
   */
  findBestMatch(transcript, confidence) {
    // Direct match
    if (this.commands.has(transcript)) {
      const command = this.commands.get(transcript);
      if (confidence >= command.confidence) {
        return command;
      }
    }
    
    // Partial matches
    for (const [phrase, command] of this.commands) {
      if (transcript.includes(phrase) && confidence >= command.confidence) {
        return command;
      }
    }
    
    return null;
  }

  /**
   * Activate voice recognition
   */
  async activate() {
    this.isActive = true;
    
    if (!this.recognition) {
      console.warn('Voice recognition not initialized');
      return;
    }
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start listening
      this.startListening();
      
      console.log('🗣️ Voice recognition activated');
      
    } catch (error) {
      console.error('Failed to activate voice recognition:', error);
      this.isActive = false;
      throw error;
    }
  }

  /**
   * Deactivate voice recognition
   */
  async deactivate() {
    this.isActive = false;
    this.stopListening();
    console.log('🗣️ Voice recognition deactivated');
  }

  /**
   * Start listening for voice commands
   */
  startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
      }
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Failed to stop voice recognition:', error);
      }
    }
  }

  /**
   * Get voice recognition capabilities
   */
  getCapabilities() {
    return {
      supportedActions: ['select', 'move', 'command'],
      hasDirectionalInput: true,
      hasSelectInput: true,
      hasCommandInput: true,
      supportsPreciseInput: false,
      supportsGestures: false,
      reliability: 'medium',
      latency: 'medium',
      requiresCalibration: false,
      configurable: true
    };
  }

  /**
   * Update method (called from InputManager)
   */
  update(deltaTime) {
    // Voice recognition doesn't need frame updates
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
          console.error('Error in voice recognition event listener:', error);
        }
      });
    }
  }
}