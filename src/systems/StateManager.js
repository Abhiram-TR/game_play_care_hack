/**
 * State management system for GazeQuest Adventures
 * Handles game state, user progress, and settings persistence
 */

export class StateManager {
  constructor() {
    this.state = {
      // Game progress
      currentScene: 'menu',
      level: 1,
      experience: 0,
      achievements: [],
      unlockedRealms: ['crystal_caves', 'wind_valley', 'motion_mountains', 'switch_sanctuary'],
      
      // User preferences
      settings: {
        inputMethod: 'auto',
        volume: 0.7,
        sfxVolume: 0.8,
        accessibility: {
          highContrast: false,
          textSize: 'normal',
          reducedMotion: false,
          screenReader: false,
          audioDescriptions: true
        },
        inputSettings: {
          eyeTracking: {
            enabled: false,
            calibrated: false,
            precision: 'medium',
            dwellTime: 2000
          },
          voice: {
            enabled: false,
            language: 'en-US',
            sensitivity: 0.7
          },
          breath: {
            enabled: false,
            sensitivity: 'medium',
            calibrated: false
          },
          orientation: {
            enabled: false,
            sensitivity: 'medium'
          },
          switch: {
            enabled: false,
            scanSpeed: 1000,
            autoScan: true
          }
        }
      },
      
      // Session data
      session: {
        startTime: Date.now(),
        totalPlayTime: 0,
        inputMethodChanges: 0,
        errorsEncountered: [],
        adaptiveAdjustments: []
      },
      
      // Performance tracking
      performance: {
        inputLatency: [],
        frameTimes: [],
        errorCount: 0
      }
    };
    
    this.listeners = new Map();
    this.saveDebounceTimer = null;
    this.autoSaveInterval = null;
  }

  /**
   * Initialize state manager
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    
    try {
      // Load saved state
      await this.loadState();
      
      // Ensure all realms are unlocked for demo purposes
      this.unlockAllRealms();
      
      // Set up auto-save
      this.setupAutoSave();
      
      console.log('✅ StateManager initialized');
      
    } catch (error) {
      console.error('Failed to initialize StateManager:', error);
      // Continue with default state
    }
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state
   */
  setState(updates) {
    const oldState = { ...this.state };
    
    // Deep merge updates
    this.state = this.deepMerge(this.state, updates);
    
    // Notify listeners
    this.notifyListeners('stateChanged', { oldState, newState: this.state });
    
    // Schedule save
    this.scheduleSave();
  }

  /**
   * Update specific state path
   */
  updateState(path, value) {
    const keys = path.split('.');
    let current = this.state;
    
    // Navigate to parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Set value
    const lastKey = keys[keys.length - 1];
    const oldValue = current[lastKey];
    current[lastKey] = value;
    
    // Notify specific listeners
    this.notifyListeners(`stateChanged.${path}`, { oldValue, newValue: value });
    this.notifyListeners('stateChanged', { path, oldValue, newValue: value });
    
    // Schedule save
    this.scheduleSave();
  }

  /**
   * Get specific state value
   */
  getStateValue(path) {
    const keys = path.split('.');
    let current = this.state;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Unlock all realms (for demo purposes)
   */
  unlockAllRealms() {
    const allRealms = ['crystal_caves', 'wind_valley', 'motion_mountains', 'switch_sanctuary'];
    this.updateState('unlockedRealms', allRealms);
    console.log('🔓 All realms unlocked for demo access');
  }

  /**
   * Update user progress
   */
  updateProgress(progressData) {
    const updates = {
      currentScene: progressData.currentScene || this.state.currentScene,
      level: Math.max(progressData.level || this.state.level, this.state.level),
      experience: (this.state.experience || 0) + (progressData.experienceGained || 0)
    };
    
    // Add new achievements
    if (progressData.achievements) {
      const newAchievements = progressData.achievements.filter(
        achievement => !this.state.achievements.includes(achievement)
      );
      updates.achievements = [...this.state.achievements, ...newAchievements];
      
      // Announce new achievements
      if (newAchievements.length > 0) {
        this.gameEngine?.accessibilityManager?.announce(
          `Achievement unlocked: ${newAchievements.join(', ')}`
        );
      }
    }
    
    // Unlock new realms based on progress
    if (updates.level >= 5 && !this.state.unlockedRealms.includes('wind_valley')) {
      updates.unlockedRealms = [...this.state.unlockedRealms, 'wind_valley'];
    }
    if (updates.level >= 10 && !this.state.unlockedRealms.includes('motion_mountains')) {
      updates.unlockedRealms = [...this.state.unlockedRealms, 'motion_mountains'];
    }
    if (updates.level >= 15 && !this.state.unlockedRealms.includes('switch_sanctuary')) {
      updates.unlockedRealms = [...this.state.unlockedRealms, 'switch_sanctuary'];
    }
    
    this.setState(updates);
  }

  /**
   * Update user settings
   */
  updateSettings(settingsPath, value) {
    this.updateState(`settings.${settingsPath}`, value);
    
    // Apply settings immediately
    this.applySettings(settingsPath, value);
  }

  /**
   * Apply settings to relevant systems
   */
  applySettings(settingsPath, value) {
    if (!this.gameEngine) return;
    
    try {
      switch (settingsPath) {
        case 'volume':
          // Use skipSave=true to prevent circular dependency
          if (this.gameEngine.audioManager?.setMasterVolume) {
            this.gameEngine.audioManager.setMasterVolume(value, true);
          }
          break;
        case 'sfxVolume':
          // Use skipSave=true to prevent circular dependency
          if (this.gameEngine.audioManager?.setSFXVolume) {
            this.gameEngine.audioManager.setSFXVolume(value, true);
          }
          break;
        case 'accessibility.highContrast':
          if (this.gameEngine.accessibilityManager?.setHighContrast) {
            this.gameEngine.accessibilityManager.setHighContrast(value);
          }
          break;
        case 'accessibility.textSize':
          if (this.gameEngine.accessibilityManager?.setTextSize) {
            this.gameEngine.accessibilityManager.setTextSize(value);
          }
          break;
        case 'accessibility.reducedMotion':
          if (this.gameEngine.accessibilityManager?.setReducedMotion) {
            this.gameEngine.accessibilityManager.setReducedMotion(value);
          }
          break;
      }
    } catch (error) {
      console.warn(`Failed to apply setting ${settingsPath}:`, error);
    }
  }

  /**
   * Record performance data
   */
  recordPerformance(type, data) {
    const perfData = this.state.performance[type] || [];
    perfData.push({
      timestamp: Date.now(),
      value: data
    });
    
    // Keep only recent data (last 100 entries)
    if (perfData.length > 100) {
      perfData.shift();
    }
    
    this.updateState(`performance.${type}`, perfData);
  }

  /**
   * Record session event
   */
  recordSessionEvent(eventType, data) {
    const sessionData = { ...this.state.session };
    
    switch (eventType) {
      case 'inputMethodChange':
        sessionData.inputMethodChanges++;
        break;
      case 'error':
        sessionData.errorsEncountered.push({
          timestamp: Date.now(),
          error: data
        });
        break;
      case 'adaptiveAdjustment':
        sessionData.adaptiveAdjustments.push({
          timestamp: Date.now(),
          adjustment: data
        });
        break;
    }
    
    this.setState({ session: sessionData });
  }

  /**
   * Add state change listener
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove state change listener
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in state listener:', error);
        }
      });
    }
  }

  /**
   * Schedule a save operation (debounced)
   */
  scheduleSave() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    
    this.saveDebounceTimer = setTimeout(() => {
      this.saveState();
    }, 1000); // Save after 1 second of inactivity
  }

  /**
   * Set up automatic saving
   */
  setupAutoSave() {
    // Save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.saveState();
    }, 30000);
  }

  /**
   * Save state to localStorage
   */
  async saveState() {
    try {
      const stateToSave = {
        ...this.state,
        session: {
          ...this.state.session,
          lastSaved: Date.now()
        }
      };
      
      localStorage.setItem('gazequest_state', JSON.stringify(stateToSave));
      console.log('💾 Game state saved');
      
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  async loadState() {
    try {
      const savedState = localStorage.getItem('gazequest_state');
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Merge with default state to handle new properties
        this.state = this.deepMerge(this.state, parsedState);
        
        // Update session start time
        this.state.session.startTime = Date.now();
        
        console.log('📁 Game state loaded');
      }
      
    } catch (error) {
      console.error('Failed to load state:', error);
      // Continue with default state
    }
  }

  /**
   * Reset state to defaults
   */
  resetState() {
    // Keep user settings but reset progress
    const settingsBackup = { ...this.state.settings };
    
    this.state = {
      currentScene: 'menu',
      level: 1,
      experience: 0,
      achievements: [],
      unlockedRealms: ['crystal_caves', 'wind_valley', 'motion_mountains', 'switch_sanctuary'],
      settings: settingsBackup,
      session: {
        startTime: Date.now(),
        totalPlayTime: 0,
        inputMethodChanges: 0,
        errorsEncountered: [],
        adaptiveAdjustments: []
      },
      performance: {
        inputLatency: [],
        frameTimes: [],
        errorCount: 0
      }
    };
    
    this.saveState();
    this.notifyListeners('stateReset', {});
  }

  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.listeners.clear();
  }
}