/**
 * Eye tracking input handler using WebGazer.js
 * Provides gaze-based interaction for GazeQuest Adventures
 */

export class EyeTracker {
  constructor() {
    this.isActive = false;
    this.isInitialized = false;
    this.isCalibrated = false;
    this.inputManager = null;
    this.eventListeners = new Map();
    
    // WebGazer instance
    this.webgazer = null;
    
    // Gaze data
    this.currentGaze = { x: 0, y: 0, timestamp: 0 };
    this.gazeHistory = [];
    this.smoothingWindow = 5;
    
    // Interaction tracking
    this.dwellTargets = new Map();
    this.gazeElements = new Set();
    this.lastElementLookedAt = null;
    
    // Configuration
    this.config = {
      precision: 'medium',        // 'low', 'medium', 'high'
      dwellTime: 2000,           // ms to trigger dwell click
      smoothing: true,           // Enable gaze smoothing
      calibrationPoints: 9,      // Number of calibration points
      minConfidence: 0.5,        // Minimum prediction confidence
      maxGazeAge: 500,          // Max age of gaze data in ms
      deadZone: 50              // Pixels around edge to ignore
    };
    
    // Calibration
    this.calibrationData = {
      points: [],
      accuracy: 0,
      isCalibrating: false,
      currentPoint: 0
    };
    
    // Performance tracking
    this.performance = {
      averageAccuracy: 0,
      predictionCount: 0,
      calibrationAccuracy: 0
    };
  }

  /**
   * Check if eye tracking is available
   */
  async isAvailable() {
    try {
      // Check for camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Check for HTTPS (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.warn('Eye tracking requires HTTPS');
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.warn('Eye tracking not available:', error.message);
      return false;
    }
  }

  /**
   * Initialize eye tracking
   */
  async init(inputManager) {
    this.inputManager = inputManager;
    
    try {
      console.log('👁️ Initializing eye tracking...');
      
      // Load WebGazer dynamically
      await this.loadWebGazer();
      
      // Initialize WebGazer
      await this.initializeWebGazer();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Load user settings
      this.loadUserSettings();
      
      this.isInitialized = true;
      console.log('✅ Eye tracking initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize eye tracking:', error);
      throw error;
    }
  }

  /**
   * Load WebGazer library
   */
  async loadWebGazer() {
    if (window.webgazer) {
      this.webgazer = window.webgazer;
      return;
    }
    
    try {
      // Load WebGazer from CDN
      if (!document.querySelector('script[src*="webgazer"]')) {
        const script = document.createElement('script');
        script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
        document.head.appendChild(script);
        
        // Wait for script to load
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      
      // Wait for webgazer to be available
      let attempts = 0;
      while (!window.webgazer && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.webgazer) {
        throw new Error('WebGazer not loaded after waiting');
      }
      
      this.webgazer = window.webgazer;
      console.log('✅ WebGazer loaded successfully');
      
    } catch (error) {
      console.error('Failed to load WebGazer:', error);
      throw new Error('WebGazer library could not be loaded');
    }
  }

  /**
   * Initialize WebGazer
   */
  async initializeWebGazer() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔧 Configuring WebGazer...');
        
        // Configure WebGazer
        this.webgazer
          .setRegression('ridge')
          .setTracker('TFFacemesh')
          .setGazeListener(this.handleGazeData.bind(this))
          .showVideoPreview(false)  // Hide video preview initially
          .showPredictionPoints(false)
          .showFaceOverlay(false)
          .showFaceFeedbackBox(false);
        
        console.log('🚀 Starting WebGazer...');
        
        // Start WebGazer
        this.webgazer.begin()
          .then(() => {
            console.log('👁️ WebGazer started successfully');
            
            // Pause initially until activation
            this.webgazer.pause();
            
            // Set up camera permissions handler
            this.handleCameraPermissions();
            
            resolve();
          })
          .catch(error => {
            console.error('WebGazer start failed:', error);
            reject(new Error(`WebGazer initialization failed: ${error.message}`));
          });
          
      } catch (error) {
        console.error('WebGazer setup failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle camera permissions
   */
  handleCameraPermissions() {
    navigator.permissions?.query({ name: 'camera' })
      .then(permissionStatus => {
        if (permissionStatus.state === 'granted') {
          console.log('📷 Camera permission granted');
        } else if (permissionStatus.state === 'prompt') {
          this.announceToUser('Please allow camera access for eye tracking to work.');
        } else {
          this.announceToUser('Camera access denied. Eye tracking will not work.');
        }
        
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'granted') {
            this.announceToUser('Camera access granted. Eye tracking is now available.');
          } else if (permissionStatus.state === 'denied') {
            this.announceToUser('Camera access denied. Please enable camera access to use eye tracking.');
          }
        };
      })
      .catch(error => {
        console.warn('Could not query camera permissions:', error);
      });
  }

  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    // Handle page visibility for performance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseTracking();
      } else {
        this.resumeTracking();
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Load user settings
   */
  loadUserSettings() {
    if (this.inputManager?.gameEngine?.stateManager) {
      const settings = this.inputManager.gameEngine.stateManager.getStateValue('settings.inputSettings.eyeTracking');
      if (settings) {
        this.config.precision = settings.precision || this.config.precision;
        this.config.dwellTime = settings.dwellTime || this.config.dwellTime;
        this.isCalibrated = settings.calibrated || false;
        
        // Apply precision settings
        this.applyPrecisionSettings();
      }
    }
  }

  /**
   * Apply precision settings to WebGazer
   */
  applyPrecisionSettings() {
    if (!this.webgazer) return;
    
    const precisionSettings = {
      low: { samples: 30, tolerance: 100 },
      medium: { samples: 50, tolerance: 70 },
      high: { samples: 70, tolerance: 50 }
    };
    
    const settings = precisionSettings[this.config.precision] || precisionSettings.medium;
    
    // Configure WebGazer precision (if methods are available)
    if (this.webgazer.params) {
      this.webgazer.params.imgWidth = settings.samples;
      this.webgazer.params.imgHeight = settings.samples;
    }
  }

  /**
   * Setup video preview with custom styling
   */
  setupVideoPreview() {
    // Wait for WebGazer to create the video element
    setTimeout(() => {
      const videoContainer = document.getElementById('webgazerVideoContainer');
      const video = document.getElementById('webgazerVideoFeed');
      
      if (videoContainer) {
        videoContainer.style.cssText = `
          position: fixed !important;
          bottom: 20px !important;
          right: 20px !important;
          width: 200px !important;
          height: 150px !important;
          z-index: 1000 !important;
          border: 2px solid #00ffff !important;
          border-radius: 10px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 12px rgba(0, 255, 255, 0.3) !important;
        `;
        
        // Add title
        const title = document.createElement('div');
        title.textContent = 'Eye Tracking Camera';
        title.style.cssText = `
          position: absolute;
          top: -25px;
          left: 0;
          color: #00ffff;
          font-size: 12px;
          font-weight: bold;
          background: rgba(0, 0, 0, 0.7);
          padding: 2px 8px;
          border-radius: 4px;
        `;
        videoContainer.appendChild(title);
      }
      
      if (video) {
        video.style.cssText = `
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        `;
      }
    }, 1000);
  }

  /**
   * Activate eye tracking
   */
  async activate() {
    if (!this.isInitialized) {
      throw new Error('Eye tracking not initialized');
    }
    
    this.isActive = true;
    
    try {
      // Resume WebGazer
      await this.webgazer.resume();
      
      // Show video preview for user feedback with custom positioning
      this.webgazer.showVideoPreview(true);
      this.setupVideoPreview();
      
      // Start prediction
      this.startPrediction();
      
      // Check if calibration is needed
      if (!this.isCalibrated) {
        this.announceToUser('Eye tracking activated. Calibration is recommended for best accuracy.');
        this.emit('calibrationNeeded');
      } else {
        this.announceToUser('Eye tracking activated and ready to use.');
      }
      
      console.log('👁️ Eye tracking activated');
      
    } catch (error) {
      console.error('Failed to activate eye tracking:', error);
      this.isActive = false;
      throw error;
    }
  }

  /**
   * Deactivate eye tracking
   */
  async deactivate() {
    this.isActive = false;
    
    try {
      // Pause WebGazer
      this.webgazer?.pause();
      
      // Hide video preview
      this.webgazer?.showVideoPreview(false);
      
      // Stop prediction
      this.stopPrediction();
      
      // Clear tracking data
      this.clearTrackingData();
      
      console.log('👁️ Eye tracking deactivated');
      
    } catch (error) {
      console.error('Error deactivating eye tracking:', error);
    }
  }

  /**
   * Start gaze prediction
   */
  startPrediction() {
    if (this.webgazer) {
      this.webgazer.resume();
    }
  }

  /**
   * Stop gaze prediction
   */
  stopPrediction() {
    if (this.webgazer) {
      this.webgazer.pause();
    }
  }

  /**
   * Pause tracking (for performance)
   */
  pauseTracking() {
    if (this.isActive && this.webgazer) {
      this.webgazer.pause();
    }
  }

  /**
   * Resume tracking
   */
  resumeTracking() {
    if (this.isActive && this.webgazer) {
      this.webgazer.resume();
    }
  }

  /**
   * Handle gaze data from WebGazer
   */
  handleGazeData(data, timestamp) {
    if (!data) return;
    
    // Always update gaze data, even during calibration
    const currentTime = timestamp || Date.now();
    
    // Validate gaze data
    if (!this.isValidGazeData(data)) {
      console.warn('Invalid gaze data received:', data);
      return;
    }
    
    // Apply smoothing if not in calibration mode
    const smoothedGaze = (this.config.smoothing && !this.calibrationData.isCalibrating) ? 
      this.applySmoothingFilter(data) : data;
    
    // Update current gaze
    this.currentGaze = {
      x: smoothedGaze.x,
      y: smoothedGaze.y,
      timestamp: currentTime,
      raw: data,
      confidence: data.confidence || 1.0
    };
    
    // Add to history
    this.addToGazeHistory(this.currentGaze);
    
    // Log gaze data during calibration for debugging
    if (this.calibrationData.isCalibrating) {
      console.log(`👁️ Gaze detected: (${Math.round(this.currentGaze.x)}, ${Math.round(this.currentGaze.y)})`);
    }
    
    // Process gaze interactions only if active
    if (this.isActive) {
      this.processGazeInteractions();
    }
    
    // Emit gaze event
    this.emit('gaze', this.currentGaze);
    
    // Update performance metrics
    this.updatePerformanceMetrics(data);
  }

  /**
   * Validate gaze data
   */
  isValidGazeData(data) {
    if (!data || typeof data.x !== 'number' || typeof data.y !== 'number') {
      return false;
    }
    
    // Check for NaN or infinite values
    if (isNaN(data.x) || isNaN(data.y) || !isFinite(data.x) || !isFinite(data.y)) {
      return false;
    }
    
    // During calibration, be more permissive with bounds
    if (this.calibrationData.isCalibrating) {
      // Just check if values are reasonable (not negative or way too large)
      if (data.x < -100 || data.x > window.innerWidth + 100 ||
          data.y < -100 || data.y > window.innerHeight + 100) {
        return false;
      }
      return true;
    }
    
    // Normal bounds checking when not calibrating
    const deadZone = this.config.deadZone;
    if (data.x < deadZone || data.x > window.innerWidth - deadZone ||
        data.y < deadZone || data.y > window.innerHeight - deadZone) {
      return false;
    }
    
    // Check if data is too old (but only when not calibrating)
    const now = Date.now();
    if (this.currentGaze.timestamp && now - this.currentGaze.timestamp > this.config.maxGazeAge) {
      return false;
    }
    
    return true;
  }

  /**
   * Apply smoothing filter to gaze data
   */
  applySmoothingFilter(newGaze) {
    this.gazeHistory.push(newGaze);
    
    // Keep only recent history
    if (this.gazeHistory.length > this.smoothingWindow) {
      this.gazeHistory.shift();
    }
    
    // Calculate moving average
    const avgX = this.gazeHistory.reduce((sum, gaze) => sum + gaze.x, 0) / this.gazeHistory.length;
    const avgY = this.gazeHistory.reduce((sum, gaze) => sum + gaze.y, 0) / this.gazeHistory.length;
    
    return { x: avgX, y: avgY };
  }

  /**
   * Add gaze point to history
   */
  addToGazeHistory(gaze) {
    this.gazeHistory.push(gaze);
    
    // Maintain history size
    if (this.gazeHistory.length > 100) {
      this.gazeHistory.shift();
    }
  }

  /**
   * Process gaze interactions (dwell clicks, hover, etc.)
   */
  processGazeInteractions() {
    const gazePoint = this.currentGaze;
    const elementAtGaze = this.getElementAtGaze(gazePoint.x, gazePoint.y);
    
    // Handle element hover/leave
    if (elementAtGaze !== this.lastElementLookedAt) {
      if (this.lastElementLookedAt) {
        this.handleGazeLeave(this.lastElementLookedAt);
      }
      
      if (elementAtGaze) {
        this.handleGazeEnter(elementAtGaze);
      }
      
      this.lastElementLookedAt = elementAtGaze;
    }
    
    // Handle dwell interaction
    if (elementAtGaze && this.isDwellTarget(elementAtGaze)) {
      this.processDwellInteraction(elementAtGaze, gazePoint);
    }
  }

  /**
   * Get element at gaze coordinates
   */
  getElementAtGaze(x, y) {
    try {
      const element = document.elementFromPoint(x, y);
      return element;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if element is a dwell target
   */
  isDwellTarget(element) {
    return element?.classList.contains('gaze-interactive') ||
           element?.hasAttribute('data-gaze-target') ||
           element?.tagName === 'BUTTON' ||
           element?.getAttribute('role') === 'button' ||
           element?.tagName === 'A';
  }

  /**
   * Handle gaze entering an element
   */
  handleGazeEnter(element) {
    element.classList?.add('gaze-hover');
    
    // Start dwell timer for interactive elements
    if (this.isDwellTarget(element)) {
      const dwellData = {
        element,
        startTime: Date.now(),
        dwellTime: this.config.dwellTime,
        timer: setTimeout(() => {
          this.triggerDwellClick(element);
        }, this.config.dwellTime)
      };
      
      this.dwellTargets.set(element, dwellData);
      
      // Visual feedback
      this.showDwellProgress(element, this.config.dwellTime);
      
      // Announce to screen reader
      this.announceGazeTarget(element);
    }
    
    // Emit event
    this.emit('gazeEnter', { element, gaze: this.currentGaze });
  }

  /**
   * Handle gaze leaving an element
   */
  handleGazeLeave(element) {
    element.classList?.remove('gaze-hover');
    
    // Cancel dwell timer
    const dwellData = this.dwellTargets.get(element);
    if (dwellData) {
      clearTimeout(dwellData.timer);
      this.dwellTargets.delete(element);
      this.hideDwellProgress(element);
    }
    
    // Emit event
    this.emit('gazeLeave', { element, gaze: this.currentGaze });
  }

  /**
   * Process dwell interaction
   */
  processDwellInteraction(element, gazePoint) {
    const dwellData = this.dwellTargets.get(element);
    if (!dwellData) return;
    
    const elapsed = Date.now() - dwellData.startTime;
    const progress = Math.min(elapsed / dwellData.dwellTime, 1);
    
    // Update visual progress
    this.updateDwellProgress(element, progress);
    
    // Emit dwell progress event
    this.emit('dwellProgress', { element, progress, gaze: gazePoint });
  }

  /**
   * Trigger dwell click
   */
  triggerDwellClick(element) {
    // Remove from dwell targets
    this.dwellTargets.delete(element);
    this.hideDwellProgress(element);
    
    // Create click event
    const clickEvent = {
      element,
      x: this.currentGaze.x,
      y: this.currentGaze.y,
      timestamp: Date.now(),
      method: 'eyeTracking',
      action: 'dwellClick'
    };
    
    // Emit input event
    this.emit('input', {
      action: 'select',
      data: clickEvent,
      accuracy: this.calculateGazeAccuracy(),
      confidence: this.calculateGazeConfidence(),
      responseTime: this.config.dwellTime
    });
    
    // Visual/audio feedback
    this.provideDwellFeedback(element);
    
    // Activate element
    this.activateElement(element);
    
    console.log('👁️ Dwell click triggered:', element);
  }

  /**
   * Show dwell progress indicator
   */
  showDwellProgress(element, duration) {
    const indicator = document.createElement('div');
    indicator.className = 'dwell-progress-indicator';
    indicator.style.cssText = `
      position: absolute;
      top: -5px;
      left: -5px;
      right: -5px;
      bottom: -5px;
      border: 3px solid var(--focus-color);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
    `;
    
    // Create progress circle
    const circle = document.createElement('div');
    circle.className = 'dwell-progress-circle';
    circle.style.cssText = `
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: conic-gradient(from 0deg, var(--focus-color) 0%, transparent 0%);
      transition: background 100ms linear;
    `;
    
    indicator.appendChild(circle);
    element.style.position = 'relative';
    element.appendChild(indicator);
  }

  /**
   * Update dwell progress
   */
  updateDwellProgress(element, progress) {
    const indicator = element.querySelector('.dwell-progress-circle');
    if (indicator) {
      const percentage = Math.round(progress * 100);
      indicator.style.background = `conic-gradient(from 0deg, var(--focus-color) ${percentage}%, transparent ${percentage}%)`;
    }
  }

  /**
   * Hide dwell progress indicator
   */
  hideDwellProgress(element) {
    const indicator = element.querySelector('.dwell-progress-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Provide feedback for dwell click
   */
  provideDwellFeedback(element) {
    // Visual feedback
    element.classList.add('gaze-clicked');
    setTimeout(() => {
      element.classList.remove('gaze-clicked');
    }, 200);
    
    // Audio feedback
    if (this.inputManager?.gameEngine?.audioManager) {
      this.inputManager.gameEngine.audioManager.playSFX('gaze_click');
    }
    
    // Screen reader announcement
    const label = this.getElementLabel(element);
    this.announceToUser(`Activated: ${label}`);
  }

  /**
   * Announce gaze target to screen reader
   */
  announceGazeTarget(element) {
    const label = this.getElementLabel(element);
    const dwellTime = Math.round(this.config.dwellTime / 1000);
    
    if (label) {
      this.announceToUser(`Looking at ${label}. Keep looking for ${dwellTime} seconds to activate.`);
    }
  }

  /**
   * Get element label
   */
  getElementLabel(element) {
    return element.getAttribute('aria-label') ||
           element.getAttribute('title') ||
           element.textContent?.trim() ||
           element.getAttribute('alt') ||
           'Unlabeled element';
  }

  /**
   * Activate element (click, focus, etc.)
   */
  activateElement(element) {
    // Focus first
    if (element.focus) {
      element.focus();
    }
    
    // Then trigger appropriate action
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      element.click();
    } else if (element.tagName === 'A') {
      element.click();
    } else if (element.hasAttribute('data-gaze-action')) {
      const action = element.getAttribute('data-gaze-action');
      this.emit('gazeAction', { action, element });
    } else {
      // Generic click
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: this.currentGaze.x,
        clientY: this.currentGaze.y
      });
      element.dispatchEvent(clickEvent);
    }
  }

  /**
   * Start calibration process
   */
  async startCalibration() {
    if (this.calibrationData.isCalibrating) {
      console.warn('Calibration already in progress');
      return;
    }
    
    try {
      console.log('👁️ Starting eye tracking calibration...');
      
      this.calibrationData.isCalibrating = true;
      this.calibrationData.currentPoint = 0;
      this.calibrationData.points = [];
      
      // Show calibration UI
      await this.showCalibrationUI();
      
      // Announce to user
      this.announceToUser('Eye tracking calibration started. Look at each point as it appears and keep looking until it disappears.');
      
    } catch (error) {
      console.error('Failed to start calibration:', error);
      this.calibrationData.isCalibrating = false;
      throw error;
    }
  }

  /**
   * Show calibration UI
   */
  async showCalibrationUI() {
    return new Promise((resolve) => {
      // Add pulse animation styles if not present
      if (!document.getElementById('calibration-styles')) {
        const style = document.createElement('style');
        style.id = 'calibration-styles';
        style.textContent = `
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1); 
              box-shadow: 0 0 20px rgba(255, 107, 107, 0.8);
            }
            50% { 
              transform: scale(1.2); 
              box-shadow: 0 0 30px rgba(255, 107, 107, 1), 0 0 40px rgba(255, 107, 107, 0.6);
            }
          }
        `;
        document.head.appendChild(style);
      }

      // Create calibration overlay
      const overlay = document.createElement('div');
      overlay.id = 'eye-tracking-calibration';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        text-align: center;
      `;
      
      // Create calibration instructions
      const instructions = document.createElement('div');
      instructions.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-size: 1.5rem;
        color: white;
        z-index: 10001;
      `;
      instructions.innerHTML = `
        <h2 style="color: #ff6b6b; margin-bottom: 20px;">👁️ Eye Tracking Calibration</h2>
        <p>Look at each red dot as it appears and keep looking until it disappears</p>
        <p style="font-size: 1rem; color: #ccc;">Point 1 of 9</p>
      `;
      overlay.appendChild(instructions);
      
      // Create calibration point
      const point = document.createElement('div');
      point.className = 'calibration-point';
      point.style.cssText = `
        width: 24px;
        height: 24px;
        background: #ff4444;
        border: 3px solid #ff6b6b;
        border-radius: 50%;
        position: absolute;
        cursor: none;
        box-shadow: 0 0 20px rgba(255, 107, 107, 0.8);
        animation: pulse 1s infinite;
        z-index: 10002;
      `;
      
      overlay.appendChild(point);
      document.body.appendChild(overlay);
      
      this.calibrationOverlay = overlay;
      this.calibrationPoint = point;
      this.calibrationInstructions = instructions;
      
      console.log('👁️ Calibration UI created, starting sequence...');
      
      // Start calibration sequence
      this.runCalibrationSequence(resolve);
    });
  }

  /**
   * Run calibration sequence
   */
  runCalibrationSequence(onComplete) {
    const points = this.generateCalibrationPoints();
    let currentPoint = 0;
    
    const showNextPoint = () => {
      if (currentPoint >= points.length) {
        this.completeCalibration(onComplete);
        return;
      }
      
      // Update progress
      if (this.calibrationInstructions) {
        const progressText = this.calibrationInstructions.querySelector('p:last-child');
        if (progressText) {
          progressText.textContent = `Point ${currentPoint + 1} of 9`;
        }
      }
      
      const point = points[currentPoint];
      console.log(`👁️ Showing calibration point ${currentPoint + 1} at (${point.x}, ${point.y})`);
      
      this.showCalibrationPoint(point, () => {
        currentPoint++;
        setTimeout(showNextPoint, 500);
      });
    };
    
    // Start after a brief delay to ensure UI is ready
    setTimeout(showNextPoint, 1000);
  }

  /**
   * Generate calibration points
   */
  generateCalibrationPoints() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const margin = 100;
    
    // 9-point calibration grid
    return [
      { x: margin, y: margin },                    // Top-left
      { x: width / 2, y: margin },                 // Top-center
      { x: width - margin, y: margin },            // Top-right
      { x: margin, y: height / 2 },                // Middle-left
      { x: width / 2, y: height / 2 },             // Center
      { x: width - margin, y: height / 2 },        // Middle-right
      { x: margin, y: height - margin },           // Bottom-left
      { x: width / 2, y: height - margin },        // Bottom-center
      { x: width - margin, y: height - margin }    // Bottom-right
    ];
  }

  /**
   * Show single calibration point
   */
  showCalibrationPoint(point, onComplete) {
    // Make sure the point is visible and positioned correctly
    this.calibrationPoint.style.display = 'block';
    this.calibrationPoint.style.left = `${point.x - 12}px`; // Center the 24px point
    this.calibrationPoint.style.top = `${point.y - 12}px`;
    this.calibrationPoint.style.opacity = '1';
    
    console.log(`🎯 Red dot positioned at (${point.x}, ${point.y})`);
    
    // Hide instructions during point viewing
    if (this.calibrationInstructions) {
      this.calibrationInstructions.style.display = 'none';
    }
    
    // Create a progress indicator around the dot
    this.createCalibrationProgress(point);
    
    // Add WebGazer calibration with proper click simulation
    if (this.webgazer) {
      // Ensure WebGazer is tracking the user's face
      this.webgazer.resume();
      
      // Create multiple calibration samples for better accuracy
      const calibrationSamples = [];
      const sampleInterval = 300; // Sample every 300ms
      const totalSamples = 8; // 8 samples over ~2.4 seconds
      
      for (let i = 0; i < totalSamples; i++) {
        setTimeout(() => {
          // Simulate a click at the calibration point for WebGazer
          const clickEvent = document.createEvent('MouseEvents');
          clickEvent.initMouseEvent('click', true, true, window, 0, 
            point.x, point.y, point.x, point.y, false, false, false, false, 0, null);
          
          // Manually add calibration data to WebGazer
          if (this.webgazer.recordScreenPosition) {
            this.webgazer.recordScreenPosition(point.x, point.y);
          }
          
          // Also store for our own tracking
          calibrationSamples.push({
            x: point.x,
            y: point.y,
            timestamp: Date.now(),
            gazeData: this.currentGaze ? { ...this.currentGaze } : null
          });
          
          console.log(`👁️ Calibration sample ${i + 1}/${totalSamples} recorded at (${point.x}, ${point.y})`);
          
          // Update progress
          this.updateCalibrationProgress((i + 1) / totalSamples);
          
        }, sampleInterval * i);
      }
    }
    
    // Wait for user to look at point (3.5 seconds for all samples)
    setTimeout(() => {
      // Remove progress indicator
      this.removeCalibrationProgress();
      
      // Show instructions again
      if (this.calibrationInstructions) {
        this.calibrationInstructions.style.display = 'block';
      }
      
      // Record calibration point with all samples
      this.calibrationData.points.push({
        target: point,
        gaze: { ...this.currentGaze },
        timestamp: Date.now(),
        samples: calibrationSamples || []
      });
      
      console.log(`✅ Calibration point ${this.calibrationData.points.length} completed with ${calibrationSamples.length} samples`);
      
      onComplete();
    }, 3500);
  }

  /**
   * Create progress indicator for calibration point
   */
  createCalibrationProgress(point) {
    const progressRing = document.createElement('div');
    progressRing.className = 'calibration-progress-ring';
    progressRing.style.cssText = `
      position: absolute;
      left: ${point.x - 20}px;
      top: ${point.y - 20}px;
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      z-index: 10001;
      pointer-events: none;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.className = 'calibration-progress-fill';
    progressFill.style.cssText = `
      position: absolute;
      left: ${point.x - 18}px;
      top: ${point.y - 18}px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, #4CAF50 0%, transparent 0%);
      z-index: 10001;
      pointer-events: none;
      transition: background 0.3s ease;
    `;
    
    this.calibrationOverlay.appendChild(progressRing);
    this.calibrationOverlay.appendChild(progressFill);
    
    this.progressRing = progressRing;
    this.progressFill = progressFill;
  }

  /**
   * Update calibration progress
   */
  updateCalibrationProgress(progress) {
    if (this.progressFill) {
      const percentage = Math.round(progress * 100);
      this.progressFill.style.background = `conic-gradient(from 0deg, #4CAF50 ${percentage}%, transparent ${percentage}%)`;
    }
  }

  /**
   * Remove calibration progress indicator
   */
  removeCalibrationProgress() {
    if (this.progressRing) {
      this.progressRing.remove();
      this.progressRing = null;
    }
    if (this.progressFill) {
      this.progressFill.remove();
      this.progressFill = null;
    }
  }

  /**
   * Complete calibration
   */
  completeCalibration(callback) {
    // Calculate calibration accuracy
    this.calculateCalibrationAccuracy();
    
    // Mark as calibrated
    this.isCalibrated = true;
    this.calibrationData.isCalibrating = false;
    
    // Remove calibration UI
    if (this.calibrationOverlay) {
      this.calibrationOverlay.remove();
      this.calibrationOverlay = null;
      this.calibrationPoint = null;
      this.calibrationInstructions = null;
    }
    
    // Save calibration status
    this.saveCalibrationData();
    
    // Announce completion
    const accuracy = Math.round(this.calibrationData.accuracy * 100);
    this.announceToUser(`Eye tracking calibration completed with ${accuracy}% accuracy.`);
    
    // Emit completion event
    this.emit('calibrationComplete', {
      accuracy: this.calibrationData.accuracy,
      points: this.calibrationData.points.length
    });
    
    console.log(`✅ Eye tracking calibration completed (${accuracy}% accuracy)`);
    
    if (callback) callback();
  }

  /**
   * Calculate calibration accuracy
   */
  calculateCalibrationAccuracy() {
    if (this.calibrationData.points.length === 0) {
      this.calibrationData.accuracy = 0;
      return;
    }
    
    let totalError = 0;
    let totalSamples = 0;
    
    this.calibrationData.points.forEach(point => {
      if (point.samples && point.samples.length > 0) {
        // Use samples if available for more accurate calculation
        point.samples.forEach(sample => {
          if (sample.gazeData && sample.gazeData.x !== undefined) {
            const dx = point.target.x - sample.gazeData.x;
            const dy = point.target.y - sample.gazeData.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            totalError += distance;
            totalSamples++;
          }
        });
      } else if (point.gaze && point.gaze.x !== undefined) {
        // Fallback to single gaze point
        const dx = point.target.x - point.gaze.x;
        const dy = point.target.y - point.gaze.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        totalError += distance;
        totalSamples++;
      }
    });
    
    if (totalSamples === 0) {
      this.calibrationData.accuracy = 0.5; // Default accuracy if no gaze data
      return;
    }
    
    const averageError = totalError / totalSamples;
    const maxError = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight) / 4;
    
    // Calculate accuracy with better scaling
    const errorRatio = averageError / maxError;
    this.calibrationData.accuracy = Math.max(0.1, Math.min(1.0, 1 - errorRatio));
    this.performance.calibrationAccuracy = this.calibrationData.accuracy;
    
    console.log(`📊 Calibration accuracy: ${Math.round(this.calibrationData.accuracy * 100)}% (avg error: ${Math.round(averageError)}px from ${totalSamples} samples)`);
  }

  /**
   * Save calibration data
   */
  saveCalibrationData() {
    if (this.inputManager?.gameEngine?.stateManager) {
      this.inputManager.gameEngine.stateManager.updateSettings('inputSettings.eyeTracking.calibrated', true);
      this.inputManager.gameEngine.stateManager.updateSettings('inputSettings.eyeTracking.accuracy', this.calibrationData.accuracy);
    }
  }

  /**
   * Calculate current gaze accuracy
   */
  calculateGazeAccuracy() {
    // Use calibration accuracy as base
    return this.calibrationData.accuracy || 0.5;
  }

  /**
   * Calculate gaze confidence
   */
  calculateGazeConfidence() {
    // Simple confidence based on recent gaze stability
    if (this.gazeHistory.length < 3) return 0.5;
    
    const recent = this.gazeHistory.slice(-3);
    const variance = this.calculateGazeVariance(recent);
    
    // Lower variance = higher confidence
    return Math.max(0.1, 1 - (variance / 1000));
  }

  /**
   * Calculate gaze variance
   */
  calculateGazeVariance(gazePoints) {
    if (gazePoints.length < 2) return 0;
    
    const avgX = gazePoints.reduce((sum, p) => sum + p.x, 0) / gazePoints.length;
    const avgY = gazePoints.reduce((sum, p) => sum + p.y, 0) / gazePoints.length;
    
    const variance = gazePoints.reduce((sum, p) => {
      const dx = p.x - avgX;
      const dy = p.y - avgY;
      return sum + (dx * dx + dy * dy);
    }, 0) / gazePoints.length;
    
    return variance;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(gazeData) {
    this.performance.predictionCount++;
    
    // Could add more sophisticated performance tracking here
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Clear calibration if window size changes significantly
    if (this.isCalibrated) {
      console.log('👁️ Window resized - recalibration may be needed');
      this.emit('calibrationNeeded');
    }
  }

  /**
   * Clear tracking data
   */
  clearTrackingData() {
    this.gazeHistory = [];
    this.dwellTargets.clear();
    this.lastElementLookedAt = null;
  }

  /**
   * Adjust timing settings
   */
  adjustTiming(adjustment) {
    if (adjustment.dwellTime) {
      this.config.dwellTime = Math.max(500, Math.min(5000, adjustment.dwellTime));
      
      // Save setting
      if (this.inputManager?.gameEngine?.stateManager) {
        this.inputManager.gameEngine.stateManager.updateSettings('inputSettings.eyeTracking.dwellTime', this.config.dwellTime);
      }
      
      console.log(`👁️ Dwell time adjusted to ${this.config.dwellTime}ms`);
    }
  }

  /**
   * Get current gaze position
   */
  getCurrentGaze() {
    return { ...this.currentGaze };
  }

  /**
   * Check if looking at element
   */
  isLookingAt(element, threshold = 50) {
    if (!element || !this.currentGaze) return false;
    
    const rect = element.getBoundingClientRect();
    const gaze = this.currentGaze;
    
    return (
      gaze.x >= rect.left - threshold &&
      gaze.x <= rect.right + threshold &&
      gaze.y >= rect.top - threshold &&
      gaze.y <= rect.bottom + threshold
    );
  }

  /**
   * Get eye tracking capabilities
   */
  getCapabilities() {
    return {
      supportedActions: ['select', 'hover', 'dwell'],
      hasDirectionalInput: false,
      hasSelectInput: true,
      hasCommandInput: false,
      supportsPreciseInput: true,
      supportsGestures: false,
      reliability: this.isCalibrated ? 'high' : 'medium',
      latency: 'low',
      requiresCalibration: true,
      configurable: true
    };
  }

  /**
   * Announce to user via accessibility manager
   */
  announceToUser(message) {
    if (this.inputManager?.gameEngine?.accessibilityManager) {
      this.inputManager.gameEngine.accessibilityManager.announce(message);
    }
  }

  /**
   * Update method
   */
  update(deltaTime) {
    // Clean up old dwell targets
    this.dwellTargets.forEach((dwellData, element) => {
      if (!document.contains(element)) {
        clearTimeout(dwellData.timer);
        this.dwellTargets.delete(element);
      }
    });
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
          console.error('Error in eye tracker event listener:', error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    try {
      // Stop WebGazer
      if (this.webgazer) {
        this.webgazer.end();
      }
      
      // Clear timers
      this.dwellTargets.forEach(dwellData => {
        clearTimeout(dwellData.timer);
      });
      this.dwellTargets.clear();
      
      // Remove calibration UI if present
      if (this.calibrationOverlay) {
        this.calibrationOverlay.remove();
      }
      
      // Clear data
      this.clearTrackingData();
      
      console.log('🧹 Eye tracker destroyed');
      
    } catch (error) {
      console.error('Error destroying eye tracker:', error);
    }
  }
}