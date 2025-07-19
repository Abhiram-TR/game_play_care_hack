/**
 * Audio management system for GazeQuest Adventures
 * Handles background music, sound effects, and accessibility audio features
 */

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    
    this.isInitialized = false;
    this.isEnabled = true;
    this.gameEngine = null;
    
    // Audio sources
    this.currentMusic = null;
    this.musicBuffer = null;
    this.sfxBuffers = new Map();
    this.activeSources = new Set();
    
    // Configuration
    this.config = {
      masterVolume: 0.7,
      musicVolume: 0.6,
      sfxVolume: 0.8,
      enableSpatialAudio: false,
      enableAudioDescriptions: true,
      maxConcurrentSounds: 8
    };
    
    // Audio files
    this.audioAssets = {
      music: {
        menu: '/assets/audio/music/menu.mp3',
        crystal_caves: '/assets/audio/music/crystal_caves.mp3',
        wind_valley: '/assets/audio/music/wind_valley.mp3',
        motion_mountains: '/assets/audio/music/motion_mountains.mp3',
        switch_sanctuary: '/assets/audio/music/switch_sanctuary.mp3'
      },
      sfx: {
        click: '/assets/audio/sfx/click.wav',
        success: '/assets/audio/sfx/success.wav',
        error: '/assets/audio/sfx/error.wav',
        notification: '/assets/audio/sfx/notification.wav',
        switch_highlight: '/assets/audio/sfx/switch_highlight.wav',
        gaze_click: '/assets/audio/sfx/gaze_click.wav',
        voice_command: '/assets/audio/sfx/voice_command.wav',
        achievement: '/assets/audio/sfx/achievement.wav',
        transition: '/assets/audio/sfx/transition.wav'
      }
    };
    
    this.eventListeners = new Map();
  }

  /**
   * Initialize audio system
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    
    try {
      // Initialize Web Audio Context
      await this.initializeAudioContext();
      
      // Set up audio nodes
      this.setupAudioNodes();
      
      // Load user preferences
      this.loadUserSettings();
      
      // Preload essential sounds
      await this.preloadEssentialAudio();
      
      this.isInitialized = true;
      console.log('✅ AudioManager initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize AudioManager:', error);
      
      // Gracefully degrade - disable audio but don't break the game
      this.isEnabled = false;
      console.warn('⚠️ Audio disabled due to initialization failure');
    }
  }

  /**
   * Initialize Web Audio Context
   */
  async initializeAudioContext() {
    // Check for Web Audio API support
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    
    if (!AudioContextClass) {
      throw new Error('Web Audio API not supported');
    }
    
    this.audioContext = new AudioContextClass();
    
    // Handle autoplay policy - audio context starts suspended
    if (this.audioContext.state === 'suspended') {
      // Wait for user interaction to resume context
      this.setupAutoplayHandler();
    }
  }

  /**
   * Set up audio nodes for volume control
   */
  setupAudioNodes() {
    // Master gain node
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.config.masterVolume;
    this.masterGain.connect(this.audioContext.destination);
    
    // Music gain node
    this.musicGain = this.audioContext.createGain();
    this.musicGain.gain.value = this.config.musicVolume;
    this.musicGain.connect(this.masterGain);
    
    // SFX gain node
    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.gain.value = this.config.sfxVolume;
    this.sfxGain.connect(this.masterGain);
  }

  /**
   * Handle autoplay policy
   */
  setupAutoplayHandler() {
    const resumeAudio = async () => {
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log('🔊 Audio context resumed');
        } catch (error) {
          console.warn('Failed to resume audio context:', error);
        }
      }
      
      // Remove listeners after first interaction
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
      document.removeEventListener('touchstart', resumeAudio);
    };
    
    // Listen for user interactions
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
    document.addEventListener('touchstart', resumeAudio);
  }

  /**
   * Load user audio settings
   */
  loadUserSettings() {
    if (this.gameEngine?.stateManager) {
      const settings = this.gameEngine.stateManager.getStateValue('settings');
      if (settings) {
        this.setMasterVolume(settings.volume || this.config.masterVolume);
        this.setSFXVolume(settings.sfxVolume || this.config.sfxVolume);
        
        if (settings.accessibility) {
          this.config.enableAudioDescriptions = settings.accessibility.audioDescriptions !== false;
        }
      }
    }
  }

  /**
   * Preload essential audio files
   */
  async preloadEssentialAudio() {
    const essentialSounds = ['click', 'success', 'error', 'notification'];
    
    const loadPromises = essentialSounds.map(async (soundName) => {
      try {
        await this.loadSFX(soundName);
        console.log(`✅ Loaded audio: ${soundName}`);
      } catch (error) {
        console.warn(`⚠️ Failed to load audio: ${soundName}`, error);
      }
    });
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * Load audio buffer from URL
   */
  async loadAudioBuffer(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio from ${url}:`, error);
      
      // Return a silent buffer as fallback
      return this.createSilentBuffer();
    }
  }

  /**
   * Create a silent audio buffer as fallback
   */
  createSilentBuffer(duration = 0.1) {
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    return buffer;
  }

  /**
   * Load background music
   */
  async loadMusic(sceneName) {
    if (!this.isEnabled || !this.audioAssets.music[sceneName]) {
      return null;
    }
    
    try {
      const url = this.audioAssets.music[sceneName];
      const buffer = await this.loadAudioBuffer(url);
      return buffer;
    } catch (error) {
      console.warn(`Failed to load music for scene: ${sceneName}`, error);
      return null;
    }
  }

  /**
   * Load sound effect
   */
  async loadSFX(soundName) {
    if (!this.isEnabled || !this.audioAssets.sfx[soundName]) {
      return null;
    }
    
    if (this.sfxBuffers.has(soundName)) {
      return this.sfxBuffers.get(soundName);
    }
    
    try {
      const url = this.audioAssets.sfx[soundName];
      const buffer = await this.loadAudioBuffer(url);
      this.sfxBuffers.set(soundName, buffer);
      return buffer;
    } catch (error) {
      console.warn(`Failed to load SFX: ${soundName}`, error);
      return null;
    }
  }

  /**
   * Play background music
   */
  async playMusic(sceneName, options = {}) {
    if (!this.isEnabled) return;
    
    try {
      // Stop current music
      if (this.currentMusic) {
        this.stopMusic();
      }
      
      // Load new music
      const buffer = await this.loadMusic(sceneName);
      if (!buffer) return;
      
      // Create and configure audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = options.loop !== false; // Default to looping
      source.connect(this.musicGain);
      
      // Fade in if requested
      if (options.fadeIn) {
        this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(
          this.config.musicVolume,
          this.audioContext.currentTime + options.fadeIn
        );
      }
      
      // Start playback
      source.start(0);
      this.currentMusic = source;
      
      // Handle end event
      source.onended = () => {
        if (this.currentMusic === source) {
          this.currentMusic = null;
        }
      };
      
      console.log(`🎵 Playing music: ${sceneName}`);
      
    } catch (error) {
      console.error(`Failed to play music: ${sceneName}`, error);
    }
  }

  /**
   * Stop background music
   */
  stopMusic(fadeOut = 0) {
    if (!this.isEnabled || !this.currentMusic) return;
    
    try {
      if (fadeOut > 0) {
        // Fade out
        this.musicGain.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + fadeOut
        );
        
        setTimeout(() => {
          if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
          }
          // Restore volume
          this.musicGain.gain.value = this.config.musicVolume;
        }, fadeOut * 1000);
      } else {
        // Immediate stop
        this.currentMusic.stop();
        this.currentMusic = null;
      }
      
      console.log('🎵 Music stopped');
      
    } catch (error) {
      console.error('Failed to stop music:', error);
    }
  }

  /**
   * Play sound effect
   */
  async playSFX(soundName, options = {}) {
    if (!this.isEnabled) return;
    
    try {
      // Limit concurrent sounds
      if (this.activeSources.size >= this.config.maxConcurrentSounds) {
        console.warn('Max concurrent sounds reached, skipping SFX');
        return;
      }
      
      // Load sound buffer
      const buffer = await this.loadSFX(soundName);
      if (!buffer) return;
      
      // Create audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      
      // Apply options
      if (options.volume !== undefined) {
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume;
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);
      } else {
        source.connect(this.sfxGain);
      }
      
      // Spatial audio (if enabled and position provided)
      if (this.config.enableSpatialAudio && options.position) {
        this.applySpatialAudio(source, options.position);
      }
      
      // Track active source
      this.activeSources.add(source);
      
      // Clean up when finished
      source.onended = () => {
        this.activeSources.delete(source);
      };
      
      // Start playback
      source.start(0);
      
      console.log(`🔊 Playing SFX: ${soundName}`);
      
    } catch (error) {
      console.error(`Failed to play SFX: ${soundName}`, error);
    }
  }

  /**
   * Apply spatial audio positioning
   */
  applySpatialAudio(source, position) {
    try {
      const panner = this.audioContext.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'linear';
      panner.refDistance = 1;
      panner.maxDistance = 10;
      panner.rolloffFactor = 1;
      
      // Set position
      panner.setPosition(position.x || 0, position.y || 0, position.z || 0);
      
      // Connect: source -> panner -> destination
      source.disconnect();
      source.connect(panner);
      panner.connect(this.sfxGain);
      
    } catch (error) {
      console.warn('Failed to apply spatial audio:', error);
      // Fall back to regular audio
      source.connect(this.sfxGain);
    }
  }

  /**
   * Play accessibility audio description
   */
  playAudioDescription(text, options = {}) {
    if (!this.config.enableAudioDescriptions) return;
    
    // Use Speech Synthesis API for audio descriptions
    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = options.volume || 0.8;
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        
        window.speechSynthesis.speak(utterance);
        
        console.log(`🗣️ Audio description: ${text}`);
        
      } catch (error) {
        console.error('Failed to play audio description:', error);
      }
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume) {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    
    if (this.masterGain) {
      this.masterGain.gain.value = this.config.masterVolume;
    }
    
    // Save to user preferences
    if (this.gameEngine?.stateManager) {
      this.gameEngine.stateManager.updateSettings('volume', this.config.masterVolume);
    }
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume) {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.musicGain) {
      this.musicGain.gain.value = this.config.musicVolume;
    }
  }

  /**
   * Set SFX volume
   */
  setSFXVolume(volume) {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.config.sfxVolume;
    }
    
    // Save to user preferences
    if (this.gameEngine?.stateManager) {
      this.gameEngine.stateManager.updateSettings('sfxVolume', this.config.sfxVolume);
    }
  }

  /**
   * Mute/unmute audio
   */
  setMuted(muted) {
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.config.masterVolume;
    }
  }

  /**
   * Enable/disable audio descriptions
   */
  setAudioDescriptions(enabled) {
    this.config.enableAudioDescriptions = enabled;
    
    // Save to user preferences
    if (this.gameEngine?.stateManager) {
      this.gameEngine.stateManager.updateSettings('accessibility.audioDescriptions', enabled);
    }
  }

  /**
   * Update audio system
   */
  update(deltaTime) {
    // Clean up finished sources
    this.activeSources.forEach(source => {
      if (source.playbackState === 'finished') {
        this.activeSources.delete(source);
      }
    });
  }

  /**
   * Get audio capabilities
   */
  getCapabilities() {
    return {
      webAudio: !!this.audioContext,
      speechSynthesis: 'speechSynthesis' in window,
      spatialAudio: this.config.enableSpatialAudio,
      audioDescriptions: this.config.enableAudioDescriptions,
      isEnabled: this.isEnabled,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Get current audio status
   */
  getStatus() {
    return {
      masterVolume: this.config.masterVolume,
      musicVolume: this.config.musicVolume,
      sfxVolume: this.config.sfxVolume,
      isPlaying: !!this.currentMusic,
      activeSources: this.activeSources.size,
      audioContextState: this.audioContext?.state
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
          console.error('Error in audio manager event listener:', error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    try {
      // Stop all audio
      this.stopMusic();
      this.activeSources.forEach(source => {
        if (source.stop) source.stop();
      });
      this.activeSources.clear();
      
      // Close audio context
      if (this.audioContext && this.audioContext.close) {
        this.audioContext.close();
      }
      
      // Clear buffers
      this.sfxBuffers.clear();
      
      console.log('🧹 AudioManager destroyed');
      
    } catch (error) {
      console.error('Error destroying AudioManager:', error);
    }
  }
}