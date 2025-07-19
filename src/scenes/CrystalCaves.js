/**
 * Crystal Caves scene - Eye tracking focused realm
 * First playable realm in GazeQuest Adventures
 */

export default class CrystalCaves {
  constructor() {
    this.name = 'crystal_caves';
    this.description = 'Mystical caves filled with glowing crystals that respond to your gaze';
    this.gameEngine = null;
    this.isActive = false;
    
    // Scene state
    this.crystals = [];
    this.score = 0;
    this.level = 1;
    this.timeRemaining = 60;
    
    // Eye tracking specific
    this.gazeTargets = [];
    this.lastGazeTime = 0;
    
    this.ui = null;
  }

  /**
   * Initialize Crystal Caves scene
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    this.createUI();
    this.setupCrystals();
    
    console.log('💎 Crystal Caves scene initialized');
  }

  /**
   * Create scene UI
   */
  createUI() {
    const container = document.getElementById('main-content');
    
    this.ui = document.createElement('div');
    this.ui.id = 'crystal-caves-overlay';
    this.ui.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      display: none;
      z-index: 150;
      overflow: hidden;
    `;
    
    // Game UI
    this.ui.innerHTML = `
      <div class="cave-ui" style="position: absolute; top: 20px; left: 20px; color: white; font-size: 1.2rem; z-index: 10;">
        <div>Score: <span id="cave-score">0</span></div>
        <div>Level: <span id="cave-level">1</span></div>
        <div>Time: <span id="cave-time">60</span>s</div>
      </div>
      
      <div class="cave-instructions" style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 10px; color: white; max-width: 300px;">
        <h3 style="margin-top: 0;">Crystal Caves</h3>
        <p style="margin-bottom: 0;">Look at the glowing crystals to collect them. Keep your gaze steady!</p>
      </div>
      
      <div class="cave-crystals" id="cave-crystals" style="position: relative; width: 100%; height: 100%;"></div>
      
      <button class="cave-back-btn" style="position: absolute; bottom: 20px; left: 20px; padding: 10px 20px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4); border-radius: 20px; color: white; cursor: pointer;" onclick="window.crystalCaves?.returnToMenu()">
        Back to Menu
      </button>
    `;
    
    container.appendChild(this.ui);
    
    // Store reference for onclick handler
    window.crystalCaves = this;
  }

  /**
   * Set up crystal targets
   */
  setupCrystals() {
    this.crystals = [];
    const crystalContainer = this.ui.querySelector('#cave-crystals');
    
    // Create initial crystals
    for (let i = 0; i < 5; i++) {
      this.createCrystal(crystalContainer);
    }
  }

  /**
   * Create a crystal target
   */
  createCrystal(container) {
    const crystal = document.createElement('div');
    crystal.className = 'crystal gaze-interactive';
    crystal.setAttribute('data-gaze-target', 'true');
    crystal.setAttribute('aria-label', 'Crystal - Look to collect');
    
    // Random position
    const x = Math.random() * (window.innerWidth - 100);
    const y = 100 + Math.random() * (window.innerHeight - 200);
    
    crystal.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 60px;
      height: 60px;
      background: radial-gradient(circle, #00ffff, #0080ff);
      border-radius: 50%;
      box-shadow: 0 0 20px #00ffff;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: crystal-pulse 2s infinite;
    `;
    
    // Add crystal animation
    if (!document.getElementById('crystal-styles')) {
      const style = document.createElement('style');
      style.id = 'crystal-styles';
      style.textContent = `
        @keyframes crystal-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px #00ffff; }
          50% { transform: scale(1.1); box-shadow: 0 0 30px #00ffff, 0 0 40px #00ffff; }
        }
        
        .crystal:hover, .crystal.gaze-hover {
          transform: scale(1.2);
          box-shadow: 0 0 40px #00ffff, 0 0 60px #00ffff;
        }
        
        .crystal.collecting {
          animation: crystal-collect 0.5s ease-out;
        }
        
        @keyframes crystal-collect {
          0% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add click handler for non-gaze users
    crystal.addEventListener('click', () => this.collectCrystal(crystal));
    
    container.appendChild(crystal);
    
    const crystalData = {
      element: crystal,
      x: x,
      y: y,
      collected: false,
      value: 10
    };
    
    this.crystals.push(crystalData);
    this.gazeTargets.push(crystal);
    
    return crystalData;
  }

  /**
   * Collect a crystal
   */
  collectCrystal(crystalElement) {
    const crystalData = this.crystals.find(c => c.element === crystalElement);
    if (!crystalData || crystalData.collected) return;
    
    crystalData.collected = true;
    
    // Visual feedback
    crystalElement.classList.add('collecting');
    
    // Audio feedback
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('success');
    }
    
    // Update score
    this.score += crystalData.value;
    this.updateUI();
    
    // Announce collection
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Crystal collected! Score: ${this.score}`);
    }
    
    // Remove crystal after animation
    setTimeout(() => {
      if (crystalElement.parentNode) {
        crystalElement.parentNode.removeChild(crystalElement);
      }
      
      // Remove from arrays
      this.crystals = this.crystals.filter(c => c !== crystalData);
      this.gazeTargets = this.gazeTargets.filter(t => t !== crystalElement);
      
      // Create new crystal
      const container = this.ui.querySelector('#cave-crystals');
      this.createCrystal(container);
      
    }, 500);
    
    // Check level progression
    if (this.score >= this.level * 50) {
      this.levelUp();
    }
  }

  /**
   * Level up
   */
  levelUp() {
    this.level++;
    this.timeRemaining += 30; // Bonus time
    
    // Audio feedback
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('achievement');
    }
    
    // Announce level up
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Level up! Now level ${this.level}. Bonus time added!`);
    }
    
    // Add more crystals for higher levels
    const container = this.ui.querySelector('#cave-crystals');
    for (let i = 0; i < this.level; i++) {
      this.createCrystal(container);
    }
    
    this.updateUI();
  }

  /**
   * Update UI elements
   */
  updateUI() {
    const scoreEl = this.ui.querySelector('#cave-score');
    const levelEl = this.ui.querySelector('#cave-level');
    const timeEl = this.ui.querySelector('#cave-time');
    
    if (scoreEl) scoreEl.textContent = this.score;
    if (levelEl) levelEl.textContent = this.level;
    if (timeEl) timeEl.textContent = Math.max(0, Math.floor(this.timeRemaining));
  }

  /**
   * Return to menu
   */
  async returnToMenu() {
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Returning to main menu');
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
    this.score = 0;
    this.level = 1;
    this.timeRemaining = 60;
    this.updateUI();
    
    // Set up eye tracking if available
    if (this.gameEngine.inputManager.getActiveInputMethods().includes('eyeTracking')) {
      this.setupEyeTracking();
    }
    
    // Start game timer
    this.startGameTimer();
    
    // Play background music
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playMusic('crystal_caves', { loop: true, fadeIn: 1 });
    }
    
    // Announce scene
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Welcome to Crystal Caves! Look at or click on glowing crystals to collect them.');
    }
    
    console.log('💎 Crystal Caves scene activated');
  }

  /**
   * Set up eye tracking interactions
   */
  setupEyeTracking() {
    if (this.gameEngine.inputManager.inputMethods.has('eyeTracking')) {
      const eyeTracker = this.gameEngine.inputManager.inputMethods.get('eyeTracking').instance;
      
      // Listen for gaze events
      eyeTracker.on('gazeEnter', (data) => {
        if (data.element.classList.contains('crystal')) {
          // Visual feedback for gaze
          data.element.classList.add('gaze-hover');
        }
      });
      
      eyeTracker.on('gazeLeave', (data) => {
        if (data.element.classList.contains('crystal')) {
          data.element.classList.remove('gaze-hover');
        }
      });
      
      // Handle dwell clicks automatically through eye tracker
    }
  }

  /**
   * Start game timer
   */
  startGameTimer() {
    this.gameTimer = setInterval(() => {
      this.timeRemaining -= 1;
      this.updateUI();
      
      if (this.timeRemaining <= 0) {
        this.gameOver();
      }
      
      // Time warning
      if (this.timeRemaining === 10) {
        if (this.gameEngine.accessibilityManager) {
          this.gameEngine.accessibilityManager.announce('10 seconds remaining!');
        }
      }
      
    }, 1000);
  }

  /**
   * Game over
   */
  async gameOver() {
    clearInterval(this.gameTimer);
    
    // Play game over sound
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('notification');
    }
    
    // Announce game over
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Game over! Final score: ${this.score}. Level reached: ${this.level}`);
    }
    
    // Update progress
    this.gameEngine.stateManager.updateProgress({
      currentScene: this.name,
      level: Math.max(this.gameEngine.getState().level, this.level),
      experienceGained: this.score,
      achievements: this.score >= 100 ? ['crystal_master'] : []
    });
    
    // Show game over dialog
    setTimeout(() => {
      const playAgain = confirm(`Game Over!\n\nFinal Score: ${this.score}\nLevel Reached: ${this.level}\n\nWould you like to play again?`);
      
      if (playAgain) {
        this.activate(); // Restart
      } else {
        this.returnToMenu();
      }
    }, 1000);
  }

  /**
   * Deactivate scene
   */
  deactivate() {
    this.isActive = false;
    
    if (this.ui) {
      this.ui.style.display = 'none';
    }
    
    // Clear timer
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    // Stop music
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.stopMusic(0.5);
    }
    
    console.log('💎 Crystal Caves scene deactivated');
  }

  /**
   * Update scene
   */
  update(deltaTime) {
    if (!this.isActive) return;
    
    // Animate crystals
    this.crystals.forEach(crystal => {
      if (!crystal.collected) {
        // Add subtle movement or effects here
      }
    });
  }

  /**
   * Render scene
   */
  render(context) {
    // Crystal Caves uses DOM rendering
  }

  /**
   * Handle resize
   */
  handleResize(width, height) {
    // Reposition crystals if needed
  }

  /**
   * Handle input events
   */
  handleClick(data) {
    // Handled by individual crystal click handlers
  }

  handleMove(data) {
    // Movement handled by eye tracking
  }

  handleCommand(data) {
    switch (data.command) {
      case 'menu':
        this.returnToMenu();
        break;
      case 'pause':
        this.pause();
        break;
    }
  }

  /**
   * Pause scene
   */
  pause() {
    this.isActive = false;
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Game paused');
    }
  }

  /**
   * Resume scene
   */
  resume() {
    this.isActive = true;
    this.startGameTimer();
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Game resumed');
    }
  }

  /**
   * Destroy scene
   */
  destroy() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    if (this.ui && this.ui.parentNode) {
      this.ui.parentNode.removeChild(this.ui);
    }
    
    // Clean up global reference
    delete window.crystalCaves;
    
    console.log('🧹 Crystal Caves scene destroyed');
  }
}