/**
 * Crystal Caves scene - Mouse clicking focused realm
 * First playable realm in GazeQuest Adventures
 */

export default class CrystalCaves {
  constructor() {
    this.name = 'crystal_caves';
    this.description = 'Mystical caves filled with glowing crystals that respond to your clicks';
    this.gameEngine = null;
    this.isActive = false;
    
    // Scene state
    this.crystals = [];
    this.score = 0;
    this.level = 1;
    this.timeRemaining = 60;
    
    // Mouse clicking specific
    this.clickTargets = [];
    this.lastClickTime = 0;
    this.animationFrameId = null;
    
    this.ui = null;
  }

  /**
   * Initialize Crystal Caves scene
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    this.createUI();
    this.setupCrystals();
    this.setupMouseClicking();
    
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
        <p style="margin-bottom: 0;">Click on the glowing crystals to collect them. Be quick and accurate!</p>
      </div>
      
      <div class="cave-crystals" id="cave-crystals" style="position: relative; width: 100%; height: 100%;"></div>
      
      <button class="cave-back-btn" id="cave-back-btn" style="position: absolute; bottom: 20px; left: 20px; padding: 10px 20px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4); border-radius: 20px; color: white; cursor: pointer;">
        Back to Menu
      </button>
    `;
    
    container.appendChild(this.ui);
    
    // Store reference for onclick handler
    window.crystalCaves = this;
  }

  /**
   * Set up mouse clicking for this scene
   */
  setupMouseClicking() {
    // Listen for mouse clicks on the UI container
    if (this.ui) {
      this.ui.addEventListener('click', (event) => {
        this.handleMouseClick(event);
      });
      
      // Add mouse move for hover effects
      this.ui.addEventListener('mousemove', (event) => {
        this.handleMouseMove(event);
      });
      
      // Add back button event listener
      const backBtn = this.ui.querySelector('#cave-back-btn');
      if (backBtn) {
        console.log('Back button found and event listener added');
        backBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          console.log('Back button clicked, returning to menu');
          this.returnToMenu();
        });
      } else {
        console.error('Back button not found in Crystal Caves UI');
      }
    }
  }

  /**
   * Handle mouse click events
   */
  handleMouseClick(event) {
    try {
      if (!this.ui || !event) return;
      
      const rect = this.ui.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Check if click hit any crystals
      this.crystals.forEach((crystal) => {
        if (crystal && crystal.element && this.isPointInCrystal(x, y, crystal)) {
          this.collectCrystal(crystal.element);
        }
      });
    } catch (error) {
      console.error('Error in handleMouseClick:', error);
    }
  }

  /**
   * Handle mouse move events for hover effects
   */
  handleMouseMove(event) {
    try {
      if (!this.ui || !event) return;
      
      const rect = this.ui.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Add hover effects to crystals
      this.crystals.forEach((crystal) => {
        if (crystal && crystal.element) {
          const crystalEl = crystal.element;
          if (this.isPointInCrystal(x, y, crystal)) {
            crystalEl.style.transform = 'scale(1.2)';
            crystalEl.style.filter = 'brightness(1.5)';
          } else {
            crystalEl.style.transform = 'scale(1)';
            crystalEl.style.filter = 'brightness(1)';
          }
        }
      });
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
    }
  }

  /**
   * Check if a point is inside a crystal
   */
  isPointInCrystal(x, y, crystal) {
    try {
      if (!crystal || typeof crystal.x !== 'number' || typeof crystal.y !== 'number' || typeof crystal.size !== 'number') {
        return false;
      }
      const dx = x - crystal.x;
      const dy = y - crystal.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= crystal.size / 2;
    } catch (error) {
      console.error('Error in isPointInCrystal:', error);
      return false;
    }
  }

  /**
   * Handle click events (unified handler for different input methods)
   */
  handleClick(inputData) {
    if (inputData.data && inputData.data.element) {
      const element = inputData.data.element;
      
      // Check if user looked at a crystal
      if (element.classList.contains('crystal')) {
        this.collectCrystal(element);
      }
    }
  }

  /**
   * Set up crystal targets
   */
  setupCrystals() {
    this.crystals = [];
    const crystalContainer = this.ui.querySelector('#cave-crystals');
    
    if (!crystalContainer) {
      console.error('Crystal container not found!');
      return;
    }
    
    // Create initial crystals
    for (let i = 0; i < 5; i++) {
      this.createCrystal(crystalContainer);
    }
    
    console.log(`Created ${this.crystals.length} crystals`);
  }

  /**
   * Create a crystal target
   */
  createCrystal(container) {
    if (!container) {
      console.error('No container provided for crystal creation');
      return null;
    }
    
    const crystal = document.createElement('div');
    const crystalId = `crystal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    crystal.id = crystalId;
    crystal.className = 'crystal click-interactive';
    crystal.setAttribute('data-click-target', 'true');
    crystal.setAttribute('aria-label', 'Crystal - Click to collect');
    
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
        
        .crystal:hover, .crystal.click-hover {
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
    
    // Add click handler for crystal clicks
    crystal.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent event bubbling
      this.collectCrystal(crystal);
    });
    
    container.appendChild(crystal);
    
    const crystalData = {
      id: crystalId,
      element: crystal,
      x: x,
      y: y,
      size: 60,
      collected: false,
      value: 10
    };
    
    this.crystals.push(crystalData);
    this.clickTargets.push(crystal);
    
    return crystalData;
  }

  /**
   * Collect a crystal
   */
  collectCrystal(crystalElement) {
    try {
      if (!crystalElement) return;
      
      const crystalData = this.crystals.find(c => c.element === crystalElement);
      
      if (!crystalData || crystalData.collected) {
        return;
      }
      
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
        this.clickTargets = this.clickTargets.filter(t => t !== crystalElement);
        
        // Create new crystal
        const container = this.ui.querySelector('#cave-crystals');
        if (container) {
          this.createCrystal(container);
        } else {
          console.error('Crystal container not found when trying to create new crystal');
        }
        
      }, 500);
      
      // Check level progression
      if (this.score >= this.level * 50) {
        this.levelUp();
      }
    } catch (error) {
      console.error('Error in collectCrystal:', error);
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
    
    // Special celebrations every 5 levels
    const isMilestone = this.level % 5 === 0;
    if (isMilestone) {
      this.celebrateMilestone();
    }
    
    // Announce level up
    const announcement = isMilestone 
      ? `Amazing! Level ${this.level} reached! Special milestone celebration!`
      : `Level up! Now level ${this.level}. Bonus time added!`;
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(announcement);
    }
    
    // Add more crystals for higher levels
    const container = this.ui.querySelector('#cave-crystals');
    for (let i = 0; i < Math.min(this.level, 3); i++) {
      this.createCrystal(container);
    }
    
    this.updateUI();
  }

  /**
   * Celebrate milestone levels (every 5 levels)
   */
  celebrateMilestone() {
    // Change background colors for celebration
    const colors = [
      'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', // Red
      'linear-gradient(135deg, #4834d4 0%, #686de0 100%)', // Purple  
      'linear-gradient(135deg, #00d2d3 0%, #54a0ff 100%)', // Cyan
      'linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)', // Pink
      'linear-gradient(135deg, #feca57 0%, #ff9f43 100%)'  // Orange
    ];
    
    const colorIndex = Math.floor((this.level - 1) / 5) % colors.length;
    this.ui.style.background = colors[colorIndex];
    
    // Create celebration animation
    this.createCelebrationAnimation();
    
    // Show milestone badge
    this.showMilestoneBadge();
    
    // Extra time bonus for milestones
    this.timeRemaining += 60;
  }

  /**
   * Create celebration particle animation
   */
  createCelebrationAnimation() {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: ${['#ffff00', '#ff00ff', '#00ffff', '#ff0000', '#00ff00'][i % 5]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${Math.random() * window.innerWidth}px;
        top: ${Math.random() * window.innerHeight}px;
        animation: celebrate-particle 3s ease-out forwards;
      `;
      
      this.ui.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 3000);
    }
    
    // Add particle animation styles
    if (!document.getElementById('celebration-styles')) {
      const style = document.createElement('style');
      style.id = 'celebration-styles';
      style.textContent = `
        @keyframes celebrate-particle {
          0% { 
            transform: scale(0) rotate(0deg); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.5) rotate(180deg); 
            opacity: 0.8; 
          }
          100% { 
            transform: scale(0) rotate(360deg); 
            opacity: 0; 
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Show milestone achievement badge
   */
  showMilestoneBadge() {
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #ffd700, #ffed4e);
      color: #333;
      padding: 30px;
      border-radius: 20px;
      text-align: center;
      font-size: 2rem;
      font-weight: bold;
      box-shadow: 0 0 50px rgba(255, 215, 0, 0.8);
      z-index: 1001;
      animation: badge-appear 3s ease-out forwards;
    `;
    
    badge.innerHTML = `
      <div>🏆</div>
      <div>LEVEL ${this.level}</div>
      <div style="font-size: 1rem; margin-top: 10px;">Milestone Achieved!</div>
      <div style="font-size: 0.8rem; margin-top: 5px;">+60 Bonus Seconds!</div>
    `;
    
    document.body.appendChild(badge);
    
    // Add badge animation styles
    if (!document.getElementById('badge-styles')) {
      const style = document.createElement('style');
      style.id = 'badge-styles';
      style.textContent = `
        @keyframes badge-appear {
          0% { 
            transform: translate(-50%, -50%) scale(0) rotate(-180deg); 
            opacity: 0; 
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.2) rotate(0deg); 
            opacity: 1; 
          }
          80% { 
            transform: translate(-50%, -50%) scale(1) rotate(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: translate(-50%, -50%) scale(0) rotate(180deg); 
            opacity: 0; 
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Remove badge after animation
    setTimeout(() => {
      if (badge.parentNode) {
        document.body.removeChild(badge);
      }
    }, 3000);
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
    
    // Update global game state for progress bar
    if (this.gameEngine && this.gameEngine.stateManager) {
      this.gameEngine.stateManager.updateState({
        score: this.score,
        level: this.level,
        experience: this.score, // Use score as experience points
        currentScene: this.name
      });
    }
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
    
    // Clear existing crystals and create new ones
    this.crystals = [];
    const crystalContainer = this.ui?.querySelector('#cave-crystals');
    if (crystalContainer) {
      crystalContainer.innerHTML = ''; // Clear existing crystals
      for (let i = 0; i < 5; i++) {
        this.createCrystal(crystalContainer);
      }
    }
    
    this.updateUI();
    
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