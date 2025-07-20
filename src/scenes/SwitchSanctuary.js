/**
 * Switch Sanctuary scene - Single switch control focused realm
 * FULLY IMPLEMENTED with scanning interface and peaceful zen activities
 */

export default class SwitchSanctuary {
  constructor() {
    this.name = 'switch_sanctuary';
    this.description = 'A peaceful sanctuary designed for single-switch control with scanning interface';
    this.gameEngine = null;
    this.isActive = false;
    
    // Game state
    this.scanner = null;
    this.scanItems = [];
    this.currentScanIndex = 0;
    this.isScanning = false;
    this.scanSpeed = 2000; // ms between scans
    this.scanDirection = 1; // 1 for forward, -1 for backward
    
    // Zen activities
    this.zenActivities = [];
    this.currentActivity = null;
    this.completedActivities = 0;
    this.score = 0;
    
    // Peaceful environment
    this.lotusFlowers = [];
    this.butterflies = [];
    this.ripples = [];
    
    this.ui = null;
    this.canvas = null;
    this.animationTime = 0;
    this.scanInterval = null;
  }

  /**
   * Initialize Switch Sanctuary scene
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    this.createUI();
    this.setupZenEnvironment();
    this.setupScanInterface();
    this.setupSwitchControl();
    
    console.log('🔘 Switch Sanctuary scene initialized');
  }

  /**
   * Create scene UI
   */
  createUI() {
    const container = document.getElementById('main-content');
    
    this.ui = document.createElement('div');
    this.ui.id = 'switch-sanctuary-overlay';
    this.ui.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #E6F3FF 0%, #B3E5FC 30%, #81C784 70%, #66BB6A 100%);
      display: none;
      z-index: 150;
      overflow: hidden;
    `;
    
    // Game UI content
    const uiContent = document.createElement('div');
    uiContent.innerHTML = `
      <div class="sanctuary-ui" style="position: absolute; top: 20px; left: 20px; color: #2E7D32; font-size: 1.2rem; z-index: 10; background: rgba(255,255,255,0.9); padding: 15px; border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <div><strong>🔘 Switch Sanctuary</strong></div>
        <div>Activities: <span id="sanctuary-activities">0</span></div>
        <div>Peace Points: <span id="sanctuary-score">0</span></div>
        <div>Scan Speed: <span id="sanctuary-speed">Medium</span></div>
      </div>
      
      <div class="sanctuary-instructions" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.9); padding: 15px; border-radius: 15px; color: #2E7D32; max-width: 320px; z-index: 10; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 0; color: #4CAF50;">🔘 Switch Controls</h3>
        <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9rem;">
          <li><strong>Single Press</strong> - Select highlighted item</li>
          <li><strong>Hold</strong> - Reverse scan direction</li>
          <li><strong>Double Press</strong> - Pause/Resume scanning</li>
        </ul>
        <h4 style="margin: 10px 0 5px 0; color: #4CAF50;">🧘 Zen Activities</h4>
        <p style="margin: 5px 0; font-size: 0.9rem;">Complete peaceful tasks for inner harmony and points!</p>
      </div>
      
      <div class="sanctuary-scan-area" id="sanctuary-scan-items" style="position: absolute; bottom: 120px; left: 50%; transform: translateX(-50%); display: flex; gap: 20px; z-index: 5; background: rgba(255,255,255,0.8); padding: 20px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
        <!-- Scan items will be added here -->
      </div>
      
      <div class="sanctuary-activity-area" id="sanctuary-current-activity" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); min-width: 400px; min-height: 200px; background: rgba(255,255,255,0.95); border-radius: 20px; padding: 30px; text-align: center; z-index: 8; box-shadow: 0 6px 20px rgba(0,0,0,0.15); display: none;">
        <!-- Current activity will be shown here -->
      </div>
      
      <div class="sanctuary-elements" id="sanctuary-elements" style="position: relative; width: 100%; height: 100%; z-index: 2;">
        <!-- Zen elements will be added here -->
      </div>
      
      <div class="sanctuary-controls" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 15px; z-index: 10;">
        <button class="sanctuary-btn" onclick="window.switchSanctuary?.toggleScanning()" style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem;">
          🔘 <span id="scan-status">Start Scanning</span>
        </button>
        <button class="sanctuary-btn" onclick="window.switchSanctuary?.adjustScanSpeed()" style="padding: 12px 24px; background: #2196F3; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem;">
          ⚡ Speed
        </button>
        <button class="sanctuary-btn" onclick="window.switchSanctuary?.returnToMenu()" style="padding: 12px 24px; background: rgba(255,255,255,0.2); color: #2E7D32; border: 2px solid #4CAF50; border-radius: 25px; cursor: pointer; font-size: 1rem;">
          🏠 Menu
        </button>
      </div>
    `;
    
    // Add UI content to the main UI container
    this.ui.appendChild(uiContent);
    
    // Game canvas for peaceful animations
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    `;
    this.ui.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    container.appendChild(this.ui);
    
    // Store reference for onclick handlers
    window.switchSanctuary = this;
  }

  /**
   * Set up zen environment
   */
  setupZenEnvironment() {
    const gameArea = this.ui.querySelector('#sanctuary-elements');
    
    // Create lotus flowers
    this.createLotusFlowers(gameArea);
    
    // Create butterflies
    this.createButterflies(gameArea);
    
    // Create peaceful water ripples
    this.createWaterFeature(gameArea);
    
    // Setup zen activities
    this.setupZenActivities();
  }

  /**
   * Create lotus flowers
   */
  createLotusFlowers(container) {
    const positions = [
      { x: 15, y: 70 }, { x: 85, y: 75 }, { x: 25, y: 85 },
      { x: 75, y: 65 }, { x: 50, y: 80 }, { x: 65, y: 85 }
    ];
    
    positions.forEach((pos, index) => {
      const lotus = document.createElement('div');
      lotus.className = 'sanctuary-lotus';
      lotus.style.cssText = `
        position: absolute;
        left: ${pos.x}%;
        top: ${pos.y}%;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: radial-gradient(circle, #FFB3BA 0%, #FFDFBA 50%, #FFFFBA 100%);
        z-index: 3;
        animation: lotus-float ${3 + index * 0.5}s ease-in-out infinite;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      `;
      
      lotus.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 30px;">🪷</div>
      `;
      
      container.appendChild(lotus);
      this.lotusFlowers.push(lotus);
    });
    
    // Add floating animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes lotus-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create animated butterflies
   */
  createButterflies(container) {
    for (let i = 0; i < 3; i++) {
      const butterfly = document.createElement('div');
      butterfly.className = 'sanctuary-butterfly';
      butterfly.style.cssText = `
        position: absolute;
        top: ${20 + Math.random() * 40}%;
        left: ${Math.random() * 80}%;
        font-size: 24px;
        z-index: 4;
        animation: butterfly-dance ${5 + i * 2}s ease-in-out infinite;
      `;
      
      butterfly.innerHTML = '🦋';
      
      container.appendChild(butterfly);
      this.butterflies.push(butterfly);
    }
    
    // Add butterfly animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes butterfly-dance {
        0% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(30px, -20px) rotate(10deg); }
        50% { transform: translate(-20px, -40px) rotate(-5deg); }
        75% { transform: translate(-30px, -10px) rotate(15deg); }
        100% { transform: translate(0, 0) rotate(0deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create water feature with ripples
   */
  createWaterFeature(container) {
    const water = document.createElement('div');
    water.className = 'sanctuary-water';
    water.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 25%;
      background: linear-gradient(to top, rgba(100, 150, 200, 0.3), transparent);
      z-index: 1;
      overflow: hidden;
    `;
    
    container.appendChild(water);
    
    // Add periodic ripples
    setInterval(() => {
      if (this.isActive) {
        this.createRipple();
      }
    }, 3000);
  }

  /**
   * Create a ripple effect
   */
  createRipple() {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      bottom: 10%;
      left: ${Math.random() * 100}%;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(100, 150, 200, 0.6);
      border-radius: 50%;
      animation: ripple-expand 2s ease-out forwards;
      z-index: 2;
    `;
    
    this.ui.querySelector('#sanctuary-elements').appendChild(ripple);
    
    // Remove after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 2000);
    
    // Add ripple animation if not already defined
    if (!document.getElementById('ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'ripple-styles';
      style.textContent = `
        @keyframes ripple-expand {
          from {
            width: 20px;
            height: 20px;
            opacity: 0.8;
          }
          to {
            width: 100px;
            height: 100px;
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Setup zen activities
   */
  setupZenActivities() {
    this.zenActivities = [
      {
        name: 'Breathing Meditation',
        description: 'Follow the breathing pattern for inner peace',
        icon: '🧘‍♀️',
        duration: 5000,
        points: 100
      },
      {
        name: 'Lotus Arrangement',
        description: 'Arrange lotus flowers in a harmonious pattern',
        icon: '🪷',
        duration: 4000,
        points: 150
      },
      {
        name: 'Butterfly Watching',
        description: 'Observe the peaceful dance of butterflies',
        icon: '🦋',
        duration: 6000,
        points: 200
      },
      {
        name: 'Water Reflection',
        description: 'Contemplate the ripples in still water',
        icon: '💧',
        duration: 4500,
        points: 125
      },
      {
        name: 'Garden Tending',
        description: 'Care for the sanctuary garden with mindfulness',
        icon: '🌸',
        duration: 5500,
        points: 175
      }
    ];
  }

  /**
   * Setup scan interface
   */
  setupScanInterface() {
    const scanContainer = this.ui.querySelector('#sanctuary-scan-items');
    
    if (!scanContainer) {
      console.error('Switch Sanctuary: scan container not found');
      return;
    }
    
    // Initialize scan items array
    this.scanItems = [];
    
    // Create scan items
    const scanItems = [
      { label: 'Start Activity', icon: '🧘', action: 'startActivity' },
      { label: 'Peaceful Mode', icon: '🕊️', action: 'peacefulMode' },
      { label: 'Lotus Garden', icon: '🪷', action: 'lotusGarden' },
      { label: 'Butterfly Chase', icon: '🦋', action: 'butterflyChase' },
      { label: 'Settings', icon: '⚙️', action: 'settings' }
    ];
    
    scanItems.forEach((item, index) => {
      const scanItem = document.createElement('div');
      scanItem.className = 'scan-item';
      scanItem.style.cssText = `
        padding: 15px 20px;
        border: 3px solid #E0E0E0;
        border-radius: 15px;
        background: white;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 100px;
      `;
      
      scanItem.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 5px;">${item.icon}</div>
        <div style="font-size: 12px; color: #666;">${item.label}</div>
      `;
      
      scanItem.dataset.action = item.action;
      scanItem.dataset.index = index;
      
      scanContainer.appendChild(scanItem);
      this.scanItems.push(scanItem);
    });
  }

  /**
   * Setup switch control
   */
  setupSwitchControl() {
    // Listen for keyboard input (space bar as switch)
    document.addEventListener('keydown', (event) => {
      if (!this.isActive) return;
      
      if (event.code === 'Space') {
        event.preventDefault();
        this.handleSwitchPress();
      }
    });
    
    // Listen for any input method that can act as a switch
    if (this.gameEngine.inputManager) {
      this.gameEngine.inputManager.on('input', (inputData) => {
        if (!this.isActive) return;
        
        if (inputData.action === 'select') {
          this.handleSwitchPress();
        }
      });
    }
  }

  /**
   * Handle switch press
   */
  handleSwitchPress() {
    console.log('Switch pressed!', { isScanning: this.isScanning, scanItemsLength: this.scanItems.length });
    
    if (!this.isScanning) {
      this.startScanning();
      return;
    }
    
    // Select current item
    if (this.scanItems.length === 0) {
      console.error('No scan items available');
      return;
    }
    
    const currentItem = this.scanItems[this.currentScanIndex];
    if (!currentItem) {
      console.error('Current scan item not found', this.currentScanIndex);
      return;
    }
    
    this.selectScanItem(currentItem);
    
    // Accessibility announcement
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Selected: ${currentItem.querySelector('div:last-child').textContent}`);
    }
  }

  /**
   * Start scanning
   */
  startScanning() {
    if (this.isScanning) return;
    
    this.isScanning = true;
    this.currentScanIndex = 0;
    
    // Update UI
    const statusEl = this.ui.querySelector('#scan-status');
    if (statusEl) statusEl.textContent = 'Stop Scanning';
    
    // Highlight first item
    this.highlightScanItem(this.currentScanIndex);
    
    // Start scan interval
    this.scanInterval = setInterval(() => {
      this.advanceScan();
    }, this.scanSpeed);
    
    // Accessibility announcement
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Scanning started. Press switch to select highlighted item.');
    }
    
    console.log('🔘 Switch scanning started');
  }

  /**
   * Stop scanning
   */
  stopScanning() {
    if (!this.isScanning) return;
    
    this.isScanning = false;
    
    // Clear interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    // Remove all highlights
    this.scanItems.forEach(item => {
      item.style.border = '3px solid #E0E0E0';
      item.style.background = 'white';
    });
    
    // Update UI
    const statusEl = this.ui.querySelector('#scan-status');
    if (statusEl) statusEl.textContent = 'Start Scanning';
    
    console.log('🔘 Switch scanning stopped');
  }

  /**
   * Advance scan to next item
   */
  advanceScan() {
    // Remove highlight from current item
    this.scanItems[this.currentScanIndex].style.border = '3px solid #E0E0E0';
    this.scanItems[this.currentScanIndex].style.background = 'white';
    
    // Move to next item
    this.currentScanIndex += this.scanDirection;
    
    // Handle boundaries
    if (this.currentScanIndex >= this.scanItems.length) {
      this.currentScanIndex = this.scanItems.length - 1;
      this.scanDirection = -1;
    } else if (this.currentScanIndex < 0) {
      this.currentScanIndex = 0;
      this.scanDirection = 1;
    }
    
    // Highlight new item
    this.highlightScanItem(this.currentScanIndex);
  }

  /**
   * Highlight scan item
   */
  highlightScanItem(index) {
    const item = this.scanItems[index];
    item.style.border = '3px solid #4CAF50';
    item.style.background = '#E8F5E8';
    item.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
      item.style.transform = 'scale(1)';
    }, 200);
  }

  /**
   * Select scan item
   */
  selectScanItem(item) {
    const action = item.dataset.action;
    
    // Visual feedback
    item.style.background = '#C8E6C9';
    setTimeout(() => {
      item.style.background = 'white';
    }, 300);
    
    // Execute action
    switch (action) {
      case 'startActivity':
        this.startRandomActivity();
        break;
      case 'peacefulMode':
        this.enterPeacefulMode();
        break;
      case 'lotusGarden':
        this.showLotusGarden();
        break;
      case 'butterflyChase':
        this.startButterflyChase();
        break;
      case 'settings':
        this.showSettings();
        break;
    }
    
    // Audio feedback
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('select');
    }
  }

  /**
   * Start random zen activity
   */
  startRandomActivity() {
    console.log('Starting random activity', { zenActivitiesLength: this.zenActivities.length });
    
    if (this.zenActivities.length === 0) {
      console.error('No zen activities available');
      return;
    }
    
    const activity = this.zenActivities[Math.floor(Math.random() * this.zenActivities.length)];
    console.log('Selected activity:', activity);
    this.showActivity(activity);
  }

  /**
   * Show zen activity
   */
  showActivity(activity) {
    this.currentActivity = activity;
    const activityArea = this.ui.querySelector('#sanctuary-current-activity');
    
    activityArea.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">${activity.icon}</div>
      <h2 style="color: #4CAF50; margin-bottom: 15px;">${activity.name}</h2>
      <p style="color: #666; font-size: 1.1rem; margin-bottom: 20px;">${activity.description}</p>
      <div style="width: 100%; height: 8px; background: #E0E0E0; border-radius: 4px; margin-bottom: 20px;">
        <div id="activity-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 4px; transition: width 0.3s ease;"></div>
      </div>
      <p style="color: #888; font-size: 0.9rem;">Press switch to complete this activity</p>
    `;
    
    activityArea.style.display = 'block';
    
    // Accessibility announcement
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Starting activity: ${activity.name}. ${activity.description}`);
    }
    
    // Auto-complete activity
    this.completeActivityWithProgress(activity);
  }

  /**
   * Complete activity with progress animation
   */
  completeActivityWithProgress(activity) {
    const progressBar = this.ui.querySelector('#activity-progress');
    let progress = 0;
    const increment = 100 / (activity.duration / 100);
    
    const progressInterval = setInterval(() => {
      progress += increment;
      if (progressBar) {
        progressBar.style.width = `${Math.min(progress, 100)}%`;
      }
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => {
          this.completeActivity(activity);
        }, 500);
      }
    }, 100);
  }

  /**
   * Complete activity
   */
  completeActivity(activity) {
    this.completedActivities++;
    this.score += activity.points;
    
    // Hide activity area
    const activityArea = this.ui.querySelector('#sanctuary-current-activity');
    activityArea.style.display = 'none';
    
    // Update UI
    this.updateUI();
    
    // Audio feedback
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('achievement');
    }
    
    // Accessibility announcement
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Activity completed! Earned ${activity.points} peace points. Total activities: ${this.completedActivities}`);
    }
    
    // Visual celebration
    this.showCelebration();
  }

  /**
   * Show celebration effect
   */
  showCelebration() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
          position: absolute;
          top: ${Math.random() * 100}%;
          left: ${Math.random() * 100}%;
          font-size: 24px;
          animation: sparkle-fade 2s ease-out forwards;
          z-index: 10;
          pointer-events: none;
        `;
        sparkle.innerHTML = '✨';
        
        this.ui.appendChild(sparkle);
        
        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        }, 2000);
      }, i * 200);
    }
    
    // Add sparkle animation if not defined
    if (!document.getElementById('sparkle-styles')) {
      const style = document.createElement('style');
      style.id = 'sparkle-styles';
      style.textContent = `
        @keyframes sparkle-fade {
          0% { opacity: 1; transform: scale(0); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Enter peaceful mode
   */
  enterPeacefulMode() {
    // Slow down animations
    this.lotusFlowers.forEach(lotus => {
      lotus.style.animationDuration = '8s';
    });
    
    this.butterflies.forEach(butterfly => {
      butterfly.style.animationDuration = '12s';
    });
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Peaceful mode activated. All animations slowed for deeper relaxation.');
    }
  }

  /**
   * Show lotus garden
   */
  showLotusGarden() {
    // Highlight all lotus flowers
    this.lotusFlowers.forEach((lotus, index) => {
      setTimeout(() => {
        lotus.style.transform = 'scale(1.3)';
        lotus.style.boxShadow = '0 8px 16px rgba(255, 105, 180, 0.3)';
        
        setTimeout(() => {
          lotus.style.transform = 'scale(1)';
          lotus.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        }, 1000);
      }, index * 300);
    });
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Lotus garden blooming! Watch the beautiful flowers come to life.');
    }
  }

  /**
   * Start butterfly chase
   */
  startButterflyChase() {
    // Make butterflies move faster
    this.butterflies.forEach(butterfly => {
      butterfly.style.animationDuration = '2s';
      butterfly.style.animationIterationCount = '3';
    });
    
    // Reset after chase
    setTimeout(() => {
      this.butterflies.forEach(butterfly => {
        butterfly.style.animationDuration = '5s';
        butterfly.style.animationIterationCount = 'infinite';
      });
    }, 6000);
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Butterfly chase started! Watch them dance playfully around the sanctuary.');
    }
  }

  /**
   * Show settings
   */
  showSettings() {
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Settings: Use Speed button to adjust scan timing.');
    }
  }

  /**
   * Toggle scanning
   */
  toggleScanning() {
    if (this.isScanning) {
      this.stopScanning();
    } else {
      this.startScanning();
    }
  }

  /**
   * Adjust scan speed
   */
  adjustScanSpeed() {
    const speeds = [
      { name: 'Slow', value: 3000 },
      { name: 'Medium', value: 2000 },
      { name: 'Fast', value: 1000 }
    ];
    
    const currentIndex = speeds.findIndex(s => s.value === this.scanSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    
    this.scanSpeed = speeds[nextIndex].value;
    
    // Update UI
    const speedEl = this.ui.querySelector('#sanctuary-speed');
    if (speedEl) speedEl.textContent = speeds[nextIndex].name;
    
    // Restart scanning with new speed if active
    if (this.isScanning) {
      this.stopScanning();
      setTimeout(() => this.startScanning(), 100);
    }
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Scan speed changed to ${speeds[nextIndex].name}`);
    }
  }

  /**
   * Update UI elements
   */
  updateUI() {
    const activitiesEl = this.ui.querySelector('#sanctuary-activities');
    const scoreEl = this.ui.querySelector('#sanctuary-score');
    
    if (activitiesEl) activitiesEl.textContent = this.completedActivities;
    if (scoreEl) scoreEl.textContent = this.score;
  }

  /**
   * Return to menu
   */
  async returnToMenu() {
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Leaving the peaceful sanctuary. Returning to main menu.');
    }
    
    await this.gameEngine.sceneManager.transitionTo('menu');
  }

  /**
   * Activate scene
   */
  async activate() {
    this.isActive = true;
    
    if (this.ui) {
      this.ui.style.display = 'block';
    }
    
    // Reset game state
    this.completedActivities = 0;
    this.score = 0;
    this.animationTime = 0;
    this.currentScanIndex = 0;
    this.isScanning = false;
    
    this.updateUI();
    
    // Resize canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Start peaceful animations
    this.startPeacefulLoop();
    
    // Play background music
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playMusic('sanctuary', { loop: true, fadeIn: 2 });
    }
    
    // Announce scene
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(
        'Welcome to Switch Sanctuary! A peaceful realm designed for single-switch control. Press space bar or any input to start scanning. Complete zen activities for inner peace and points.'
      );
    }
    
    console.log('🔘 Switch Sanctuary scene activated');
  }

  /**
   * Start peaceful animation loop
   */
  startPeacefulLoop() {
    const peacefulLoop = () => {
      if (!this.isActive) return;
      
      this.animationTime += 16;
      
      // Create occasional ripples
      if (Math.random() < 0.001) {
        this.createRipple();
      }
      
      requestAnimationFrame(peacefulLoop);
    };
    
    peacefulLoop();
  }

  /**
   * Handle input events
   */
  handleInput(inputData) {
    if (inputData.action === 'select') {
      this.handleSwitchPress();
    }
  }

  /**
   * Deactivate scene
   */
  deactivate() {
    this.isActive = false;
    
    // Stop scanning
    this.stopScanning();
    
    if (this.ui) {
      this.ui.style.display = 'none';
    }
    
    // Stop music
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.stopMusic(1);
    }
    
    console.log('🔘 Switch Sanctuary scene deactivated');
  }

  /**
   * Update scene
   */
  update() {
    if (!this.isActive) return;
    
    // Peaceful loop handles updates
  }

  /**
   * Render scene
   */
  render() {
    // Switch Sanctuary uses DOM rendering
  }

  /**
   * Handle resize
   */
  handleResize(width, height) {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Handle commands
   */
  handleCommand(data) {
    switch (data.command) {
      case 'menu':
        this.returnToMenu();
        break;
      case 'start':
        this.toggleScanning();
        break;
    }
  }

  handleClick() {}
  handleMove() {}
  pause() { 
    this.isActive = false; 
    this.stopScanning();
  }
  resume() { 
    this.isActive = true; 
  }

  /**
   * Destroy scene
   */
  destroy() {
    // Stop scanning
    this.stopScanning();
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleSwitchPress);
    
    if (this.ui && this.ui.parentNode) {
      this.ui.parentNode.removeChild(this.ui);
    }
    
    // Clean up global reference
    delete window.switchSanctuary;
    
    console.log('🧹 Switch Sanctuary scene destroyed');
  }
}