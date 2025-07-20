/**
 * Motion Mountains scene - Device orientation focused realm
 * FULLY IMPLEMENTED with device tilt controls and mountain climbing
 */

export default class MotionMountains {
  constructor() {
    this.name = 'motion_mountains';
    this.description = 'Navigate treacherous mountain paths using device tilt controls';
    this.gameEngine = null;
    this.isActive = false;
    
    // Game state
    this.player = null;
    this.obstacles = [];
    this.platforms = [];
    this.collectibles = [];
    this.score = 0;
    this.level = 1;
    this.playerPosition = { x: 50, y: 80 };
    this.targetPosition = { x: 50, y: 20 };
    
    // Mountain environment
    this.mountains = [];
    this.clouds = [];
    this.stars = [];
    
    this.ui = null;
    this.canvas = null;
    this.animationTime = 0;
    
    // Game mechanics
    this.gravity = 0.3;
    this.playerVelocity = { x: 0, y: 0 };
    this.onGround = false;
  }

  /**
   * Initialize Motion Mountains scene
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    this.createUI();
    this.setupMountainEnvironment();
    this.setupOrientationControl();
    
    console.log('⛰️ Motion Mountains scene initialized');
  }

  /**
   * Create scene UI
   */
  createUI() {
    const container = document.getElementById('main-content');
    
    this.ui = document.createElement('div');
    this.ui.id = 'motion-mountains-overlay';
    this.ui.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #1e3c72 0%, #2a5298 30%, #8B4513 70%, #654321 100%);
      display: none;
      z-index: 150;
      overflow: hidden;
    `;
    
    // Game canvas for rendering
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
    
    // Game UI
    this.ui.innerHTML += `
      <div class="mountains-ui" style="position: absolute; top: 20px; left: 20px; color: white; font-size: 1.2rem; z-index: 10; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 10px;">
        <div><strong>⛰️ Motion Mountains</strong></div>
        <div>Score: <span id="mountains-score">0</span></div>
        <div>Level: <span id="mountains-level">1</span></div>
        <div>Altitude: <span id="mountains-altitude">80%</span></div>
      </div>
      
      <div class="mountains-instructions" style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 10px; color: white; max-width: 300px; z-index: 10;">
        <h3 style="margin-top: 0; color: #87CEEB;">📱 Tilt Controls</h3>
        <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9rem;">
          <li><strong>Tilt Left/Right</strong> - Move horizontally</li>
          <li><strong>Tilt Forward</strong> - Jump/Climb up</li>
          <li><strong>Tilt Back</strong> - Duck/Slide down</li>
        </ul>
        <p style="margin: 5px 0; font-size: 0.8rem; color: #87CEEB;">Reach the mountain peak while avoiding obstacles!</p>
      </div>
      
      <div class="mountains-game-area" id="mountains-elements" style="position: relative; width: 100%; height: 100%; z-index: 2;">
        <!-- Mountain elements will be added here -->
      </div>
      
      <div class="mountains-controls" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10;">
        <button class="mountains-btn" onclick="window.motionMountains?.toggleOrientation()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 20px; cursor: pointer;">
          📱 <span id="orientation-status">Enable Tilt</span>
        </button>
        <button class="mountains-btn" onclick="window.motionMountains?.resetPlayer()" style="padding: 10px 20px; background: #FF9800; color: white; border: none; border-radius: 20px; cursor: pointer;">
          🔄 Reset
        </button>
        <button class="mountains-btn" onclick="window.motionMountains?.returnToMenu()" style="padding: 10px 20px; background: rgba(255,255,255,0.2); color: white; border: 2px solid #4CAF50; border-radius: 20px; cursor: pointer;">
          🏠 Menu
        </button>
      </div>
    `;
    
    container.appendChild(this.ui);
    
    // Store reference for onclick handlers
    window.motionMountains = this;
  }

  /**
   * Set up mountain environment
   */
  setupMountainEnvironment() {
    const gameArea = this.ui.querySelector('#mountains-elements');
    
    // Create player character
    this.createPlayer(gameArea);
    
    // Create mountain backdrop
    this.createMountains(gameArea);
    
    // Create platforms and obstacles
    this.createPlatforms(gameArea);
    this.createObstacles(gameArea);
    this.createCollectibles(gameArea);
    
    // Create atmospheric elements
    this.createClouds(gameArea);
    this.createStars(gameArea);
  }

  /**
   * Create player character
   */
  createPlayer(container) {
    const player = document.createElement('div');
    player.className = 'mountains-player';
    player.style.cssText = `
      position: absolute;
      left: ${this.playerPosition.x}%;
      top: ${this.playerPosition.y}%;
      width: 40px;
      height: 40px;
      background: #FF6B35;
      border-radius: 50%;
      z-index: 5;
      transition: all 0.1s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    
    // Add player details
    player.innerHTML = `
      <div style="position: absolute; top: 5px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      <div style="position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); width: 15px; height: 3px; background: #333; border-radius: 2px;"></div>
    `;
    
    container.appendChild(player);
    this.player = player;
  }

  /**
   * Create mountain backdrop
   */
  createMountains(container) {
    for (let i = 0; i < 4; i++) {
      const mountain = document.createElement('div');
      mountain.className = 'mountain';
      
      const height = 40 + (i * 15);
      const left = i * 25;
      
      mountain.style.cssText = `
        position: absolute;
        left: ${left}%;
        bottom: 0;
        width: 0;
        height: 0;
        border-left: ${60 + i * 20}px solid transparent;
        border-right: ${60 + i * 20}px solid transparent;
        border-bottom: ${height}vh solid #${i % 2 ? '5D4E75' : '4A4458'};
        z-index: 0;
        opacity: ${0.7 - i * 0.1};
      `;
      
      container.appendChild(mountain);
      this.mountains.push(mountain);
    }
  }

  /**
   * Create platforms for climbing
   */
  createPlatforms(container) {
    const platformData = [
      { x: 20, y: 75, width: 15 },
      { x: 60, y: 65, width: 20 },
      { x: 15, y: 55, width: 18 },
      { x: 70, y: 45, width: 15 },
      { x: 25, y: 35, width: 22 },
      { x: 65, y: 25, width: 20 }
    ];
    
    platformData.forEach((platform) => {
      const platformEl = document.createElement('div');
      platformEl.className = 'mountain-platform';
      platformEl.style.cssText = `
        position: absolute;
        left: ${platform.x}%;
        top: ${platform.y}%;
        width: ${platform.width}%;
        height: 8px;
        background: linear-gradient(to bottom, #8B7355, #654321);
        border-radius: 4px;
        z-index: 3;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      
      container.appendChild(platformEl);
      this.platforms.push({
        element: platformEl,
        x: platform.x,
        y: platform.y,
        width: platform.width,
        height: 8
      });
    });
  }

  /**
   * Create obstacles
   */
  createObstacles(container) {
    const obstacleData = [
      { x: 45, y: 70, type: 'rock' },
      { x: 35, y: 50, type: 'tree' },
      { x: 55, y: 40, type: 'rock' },
      { x: 40, y: 30, type: 'ice' }
    ];
    
    obstacleData.forEach((obstacle) => {
      const obstacleEl = document.createElement('div');
      obstacleEl.className = 'mountain-obstacle';
      
      let style = '';
      let content = '';
      
      switch (obstacle.type) {
        case 'rock':
          style = 'background: #696969; border-radius: 30% 70% 70% 30%;';
          content = '🗿';
          break;
        case 'tree':
          style = 'background: #228B22; border-radius: 50% 50% 0 0;';
          content = '🌲';
          break;
        case 'ice':
          style = 'background: linear-gradient(45deg, #B0E0E6, #87CEEB); border-radius: 20%;';
          content = '🧊';
          break;
      }
      
      obstacleEl.style.cssText = `
        position: absolute;
        left: ${obstacle.x}%;
        top: ${obstacle.y}%;
        width: 30px;
        height: 30px;
        ${style}
        z-index: 4;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      
      obstacleEl.innerHTML = content;
      
      container.appendChild(obstacleEl);
      this.obstacles.push({
        element: obstacleEl,
        x: obstacle.x,
        y: obstacle.y,
        type: obstacle.type
      });
    });
  }

  /**
   * Create collectible gems
   */
  createCollectibles(container) {
    const gemData = [
      { x: 30, y: 60 },
      { x: 75, y: 50 },
      { x: 20, y: 40 },
      { x: 80, y: 30 },
      { x: 50, y: 20 }
    ];
    
    gemData.forEach((gem) => {
      const gemEl = document.createElement('div');
      gemEl.className = 'mountain-gem';
      gemEl.style.cssText = `
        position: absolute;
        left: ${gem.x}%;
        top: ${gem.y}%;
        width: 20px;
        height: 20px;
        background: linear-gradient(45deg, #FF69B4, #FFB6C1);
        transform: rotate(45deg);
        z-index: 4;
        animation: gem-sparkle 2s infinite;
        box-shadow: 0 0 10px rgba(255, 105, 180, 0.5);
      `;
      
      container.appendChild(gemEl);
      this.collectibles.push({
        element: gemEl,
        x: gem.x,
        y: gem.y,
        collected: false
      });
    });
    
    // Add sparkle animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gem-sparkle {
        0%, 100% { transform: rotate(45deg) scale(1); }
        50% { transform: rotate(45deg) scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create atmospheric clouds
   */
  createClouds(container) {
    for (let i = 0; i < 5; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'mountain-cloud';
      cloud.style.cssText = `
        position: absolute;
        top: ${10 + (i * 15)}%;
        left: ${-50 + (i * 30)}%;
        width: 80px;
        height: 40px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 20px;
        z-index: 1;
        animation: cloud-drift ${8 + i * 2}s infinite linear;
      `;
      
      container.appendChild(cloud);
      this.clouds.push(cloud);
    }
    
    // Add cloud animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes cloud-drift {
        from { transform: translateX(-100px); }
        to { transform: translateX(calc(100vw + 100px)); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create twinkling stars
   */
  createStars(container) {
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.className = 'mountain-star';
      star.style.cssText = `
        position: absolute;
        top: ${Math.random() * 40}%;
        left: ${Math.random() * 100}%;
        width: 4px;
        height: 4px;
        background: white;
        border-radius: 50%;
        z-index: 1;
        animation: star-twinkle ${1 + Math.random() * 3}s infinite;
      `;
      
      container.appendChild(star);
      this.stars.push(star);
    }
    
    // Add twinkle animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes star-twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Set up device orientation control
   */
  setupOrientationControl() {
    if (this.gameEngine.inputManager.inputMethods.has('orientation')) {
      const orientationInput = this.gameEngine.inputManager.inputMethods.get('orientation').instance;
      
      orientationInput.on('input', (data) => {
        this.handleOrientationInput(data);
      });
    }
  }

  /**
   * Handle device orientation input
   */
  handleOrientationInput(data) {
    if (!this.isActive) return;
    
    const intensity = data.data.intensity || 0.5;
    
    switch (data.direction) {
      case 'left':
        this.playerVelocity.x = Math.max(this.playerVelocity.x - intensity * 2, -5);
        break;
      case 'right':
        this.playerVelocity.x = Math.min(this.playerVelocity.x + intensity * 2, 5);
        break;
      case 'up':
        if (this.onGround) {
          this.playerVelocity.y = -8; // Jump
          this.onGround = false;
        }
        break;
      case 'down':
        this.playerVelocity.y += intensity; // Faster fall
        break;
    }
  }

  /**
   * Update player physics and position
   */
  updatePlayer() {
    // Apply gravity
    if (!this.onGround) {
      this.playerVelocity.y += this.gravity;
    }
    
    // Apply friction
    this.playerVelocity.x *= 0.95;
    
    // Update position
    this.playerPosition.x += this.playerVelocity.x * 0.5;
    this.playerPosition.y += this.playerVelocity.y * 0.5;
    
    // Constrain to screen bounds
    this.playerPosition.x = Math.max(2, Math.min(98, this.playerPosition.x));
    this.playerPosition.y = Math.max(5, Math.min(95, this.playerPosition.y));
    
    // Check platform collisions
    this.checkPlatformCollisions();
    
    // Check obstacle collisions
    this.checkObstacleCollisions();
    
    // Check collectible collisions
    this.checkCollectibleCollisions();
    
    // Update player element position
    if (this.player) {
      this.player.style.left = `${this.playerPosition.x}%`;
      this.player.style.top = `${this.playerPosition.y}%`;
    }
    
    // Check win condition
    this.checkWinCondition();
    
    // Update altitude display
    this.updateAltitude();
  }

  /**
   * Check platform collisions
   */
  checkPlatformCollisions() {
    this.onGround = false;
    
    this.platforms.forEach(platform => {
      if (this.playerPosition.x + 2 > platform.x && 
          this.playerPosition.x - 2 < platform.x + platform.width &&
          this.playerPosition.y + 2 > platform.y &&
          this.playerPosition.y - 2 < platform.y + platform.height) {
        
        // Landing on top of platform
        if (this.playerVelocity.y > 0 && this.playerPosition.y < platform.y + platform.height / 2) {
          this.playerPosition.y = platform.y - 2;
          this.playerVelocity.y = 0;
          this.onGround = true;
        }
      }
    });
    
    // Ground collision
    if (this.playerPosition.y >= 90) {
      this.playerPosition.y = 90;
      this.playerVelocity.y = 0;
      this.onGround = true;
    }
  }

  /**
   * Check obstacle collisions
   */
  checkObstacleCollisions() {
    this.obstacles.forEach(obstacle => {
      if (this.playerPosition.x + 2 > obstacle.x && 
          this.playerPosition.x - 2 < obstacle.x + 3 &&
          this.playerPosition.y + 2 > obstacle.y &&
          this.playerPosition.y - 2 < obstacle.y + 3) {
        
        // Collision detected - reset player
        this.resetPlayerPosition();
        
        // Audio feedback
        if (this.gameEngine.audioManager) {
          this.gameEngine.audioManager.playSFX('collision');
        }
        
        // Accessibility announcement
        if (this.gameEngine.accessibilityManager) {
          this.gameEngine.accessibilityManager.announce('Obstacle hit! Returning to last safe position.');
        }
      }
    });
  }

  /**
   * Check collectible collisions
   */
  checkCollectibleCollisions() {
    this.collectibles.forEach(collectible => {
      if (!collectible.collected &&
          this.playerPosition.x + 2 > collectible.x && 
          this.playerPosition.x - 2 < collectible.x + 2 &&
          this.playerPosition.y + 2 > collectible.y &&
          this.playerPosition.y - 2 < collectible.y + 2) {
        
        // Collect gem
        collectible.collected = true;
        collectible.element.style.display = 'none';
        
        // Award points
        this.score += 100;
        this.updateUI();
        
        // Audio feedback
        if (this.gameEngine.audioManager) {
          this.gameEngine.audioManager.playSFX('collect');
        }
        
        // Accessibility announcement
        if (this.gameEngine.accessibilityManager) {
          this.gameEngine.accessibilityManager.announce('Gem collected! 100 points awarded.');
        }
      }
    });
  }

  /**
   * Check win condition
   */
  checkWinCondition() {
    if (this.playerPosition.y <= 25 && this.playerPosition.x >= 45 && this.playerPosition.x <= 55) {
      // Reached the peak!
      this.levelUp();
    }
  }

  /**
   * Update altitude display
   */
  updateAltitude() {
    const altitude = Math.round(100 - this.playerPosition.y);
    const altitudeEl = this.ui.querySelector('#mountains-altitude');
    if (altitudeEl) {
      altitudeEl.textContent = `${altitude}%`;
    }
  }

  /**
   * Reset player to safe position
   */
  resetPlayerPosition() {
    this.playerPosition = { x: 50, y: 85 };
    this.playerVelocity = { x: 0, y: 0 };
  }

  /**
   * Reset player (button action)
   */
  resetPlayer() {
    this.resetPlayerPosition();
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Player reset to starting position');
    }
  }

  /**
   * Level up
   */
  levelUp() {
    this.level++;
    this.score += 500;
    
    // Reset collectibles
    this.collectibles.forEach(collectible => {
      collectible.collected = false;
      collectible.element.style.display = 'block';
    });
    
    // Reset player position
    this.resetPlayerPosition();
    
    // Audio feedback
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('achievement');
    }
    
    // Accessibility announcement
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Mountain peak reached! Level ${this.level} unlocked! Bonus 500 points awarded.`);
    }
    
    this.updateUI();
  }

  /**
   * Update UI elements
   */
  updateUI() {
    const scoreEl = this.ui.querySelector('#mountains-score');
    const levelEl = this.ui.querySelector('#mountains-level');
    
    if (scoreEl) scoreEl.textContent = this.score;
    if (levelEl) levelEl.textContent = this.level;
  }

  /**
   * Toggle device orientation
   */
  async toggleOrientation() {
    const orientationInput = this.gameEngine.inputManager.inputMethods.get('orientation');
    const statusEl = this.ui.querySelector('#orientation-status');
    
    if (orientationInput) {
      if (orientationInput.isActive) {
        await this.gameEngine.inputManager.disableInput('orientation');
        statusEl.textContent = 'Enable Tilt';
      } else {
        await this.gameEngine.inputManager.enableSecondaryInput('orientation');
        statusEl.textContent = 'Disable Tilt';
      }
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
    this.animationTime = 0;
    this.resetPlayerPosition();
    
    // Reset collectibles
    this.collectibles.forEach(collectible => {
      collectible.collected = false;
      collectible.element.style.display = 'block';
    });
    
    this.updateUI();
    
    // Resize canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Start game loop
    this.startGameLoop();
    
    // Play background music
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playMusic('motion_mountains', { loop: true, fadeIn: 1 });
    }
    
    // Announce scene
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(
        'Welcome to Motion Mountains! Tilt your device to navigate the treacherous mountain paths. Reach the peak while collecting gems and avoiding obstacles.'
      );
    }
    
    console.log('⛰️ Motion Mountains scene activated');
  }

  /**
   * Start game loop
   */
  startGameLoop() {
    const gameLoop = () => {
      if (!this.isActive) return;
      
      this.animationTime += 16;
      
      // Update player physics
      this.updatePlayer();
      
      requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
  }

  /**
   * Handle input events
   */
  handleInput(inputData) {
    switch (inputData.action) {
      case 'move':
        this.handleOrientationInput(inputData);
        break;
    }
  }

  /**
   * Deactivate scene
   */
  deactivate() {
    this.isActive = false;
    
    if (this.ui) {
      this.ui.style.display = 'none';
    }
    
    // Stop music
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.stopMusic(0.5);
    }
    
    console.log('⛰️ Motion Mountains scene deactivated');
  }

  /**
   * Update scene
   */
  update() {
    if (!this.isActive) return;
    
    // Game loop handles updates
  }

  /**
   * Render scene
   */
  render() {
    // Motion Mountains uses DOM rendering
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
      case 'reset':
        this.resetPlayer();
        break;
    }
  }

  handleClick() {}
  handleMove() {}
  pause() { this.isActive = false; }
  resume() { this.isActive = true; }

  /**
   * Destroy scene
   */
  destroy() {
    if (this.ui && this.ui.parentNode) {
      this.ui.parentNode.removeChild(this.ui);
    }
    
    // Clean up global reference
    delete window.motionMountains;
    
    console.log('🧹 Motion Mountains scene destroyed');
  }
}