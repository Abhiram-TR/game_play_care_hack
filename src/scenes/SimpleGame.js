/**
 * Simple Click Game - One easy and fun game for everyone
 * Click the colorful circles to score points!
 */

export default class SimpleGame {
  constructor() {
    this.name = 'simple_game';
    this.description = 'Click the colorful circles to score points!';
    this.gameEngine = null;
    this.isActive = false;
    
    // Game state
    this.score = 0;
    this.timeLeft = 30;
    this.circles = [];
    this.gameTimer = null;
    this.spawnTimer = null;
    this.isGameRunning = false;
    
    this.ui = null;
  }

  /**
   * Initialize Simple Game scene
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    this.createUI();
    console.log('🎯 Simple Game initialized');
  }

  /**
   * Create game UI
   */
  createUI() {
    const container = document.getElementById('main-content');
    
    this.ui = document.createElement('div');
    this.ui.id = 'simple-game-overlay';
    this.ui.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: none;
      z-index: 150;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    this.ui.innerHTML = `
      <!-- Game Header -->
      <div class="game-header" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); text-align: center; color: white; z-index: 10;">
        <h1 style="margin: 0; font-size: 2.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎯 Click & Score!</h1>
        <p style="margin: 10px 0; font-size: 1.2rem; opacity: 0.9;">Click the colorful circles to earn points</p>
      </div>
      
      <!-- Score & Timer -->
      <div class="game-stats" style="position: absolute; top: 20px; left: 20px; color: white; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 15px; backdrop-filter: blur(5px);">
        <div style="font-size: 1.5rem; font-weight: bold;">Score: <span id="game-score">0</span></div>
        <div style="font-size: 1.2rem; margin-top: 5px;">Time: <span id="game-time">30</span>s</div>
      </div>
      
      <!-- Game Area -->
      <div id="game-area" style="position: relative; width: 100%; height: 100%; cursor: crosshair;">
        <!-- Circles will appear here -->
      </div>
      
      <!-- Start/End Screen -->
      <div id="game-start-screen" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: rgba(255,255,255,0.95); padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        <h2 style="color: #333; margin-bottom: 20px; font-size: 2rem;">🎮 Ready to Play?</h2>
        <p style="color: #666; margin-bottom: 30px; font-size: 1.1rem;">Click the colorful circles as fast as you can!<br>You have 30 seconds to get the highest score!</p>
        <button id="start-game-btn" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; border: none; padding: 15px 30px; font-size: 1.3rem; border-radius: 25px; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
          🚀 Start Game
        </button>
      </div>
      
      <!-- Game Over Screen -->
      <div id="game-over-screen" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: rgba(255,255,255,0.95); padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); display: none;">
        <h2 style="color: #333; margin-bottom: 20px; font-size: 2rem;">🎉 Game Over!</h2>
        <div style="margin-bottom: 20px;">
          <div style="font-size: 3rem; color: #667eea; font-weight: bold;" id="final-score">0</div>
          <div style="color: #666; font-size: 1.2rem;">Points Scored!</div>
        </div>
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button id="play-again-btn" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; border: none; padding: 12px 25px; font-size: 1.1rem; border-radius: 20px; cursor: pointer; transition: all 0.3s ease;">
            🔄 Play Again
          </button>
          <button id="menu-btn" style="background: rgba(108, 117, 125, 0.1); color: #666; border: 2px solid #ddd; padding: 12px 25px; font-size: 1.1rem; border-radius: 20px; cursor: pointer; transition: all 0.3s ease;">
            🏠 Menu
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(this.ui);
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Start game button
    const startBtn = this.ui.querySelector('#start-game-btn');
    startBtn.addEventListener('click', () => this.startGame());
    
    // Play again button
    const playAgainBtn = this.ui.querySelector('#play-again-btn');
    playAgainBtn.addEventListener('click', () => this.startGame());
    
    // Menu button
    const menuBtn = this.ui.querySelector('#menu-btn');
    menuBtn.addEventListener('click', () => this.returnToMenu());
    
    // Add hover effects
    [startBtn, playAgainBtn, menuBtn].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = btn.id === 'menu-btn' ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)';
      });
    });
  }

  /**
   * Start the game
   */
  startGame() {
    this.score = 0;
    this.timeLeft = 30;
    this.circles = [];
    this.isGameRunning = true;
    
    // Hide screens
    this.ui.querySelector('#game-start-screen').style.display = 'none';
    this.ui.querySelector('#game-over-screen').style.display = 'none';
    
    // Clear game area
    const gameArea = this.ui.querySelector('#game-area');
    gameArea.innerHTML = '';
    
    // Update UI
    this.updateUI();
    
    // Start game timer
    this.gameTimer = setInterval(() => {
      this.timeLeft--;
      this.updateUI();
      
      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
    
    // Start spawning circles
    this.spawnCircle();
    this.spawnTimer = setInterval(() => {
      if (this.isGameRunning) {
        this.spawnCircle();
      }
    }, 800); // Spawn every 0.8 seconds
    
    console.log('🎮 Game started!');
  }

  /**
   * End the game
   */
  endGame() {
    this.isGameRunning = false;
    
    // Clear timers
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }
    
    // Clear remaining circles
    this.circles.forEach(circle => {
      if (circle.element && circle.element.parentNode) {
        circle.element.parentNode.removeChild(circle.element);
      }
    });
    this.circles = [];
    
    // Show game over screen
    this.ui.querySelector('#final-score').textContent = this.score;
    this.ui.querySelector('#game-over-screen').style.display = 'block';
    
    console.log('🏁 Game ended! Final score:', this.score);
  }

  /**
   * Spawn a new circle
   */
  spawnCircle() {
    if (!this.isGameRunning) return;
    
    const gameArea = this.ui.querySelector('#game-area');
    const circle = document.createElement('div');
    
    // Random position (with margins to keep circles fully visible)
    const size = 60 + Math.random() * 40; // 60-100px
    const x = Math.random() * (window.innerWidth - size - 40) + 20;
    const y = Math.random() * (window.innerHeight - size - 200) + 120; // Account for header
    
    // Random bright color
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    circle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
      animation: circleAppear 0.3s ease-out;
      z-index: 5;
    `;
    
    // Add circle appear animation
    if (!document.getElementById('circle-animations')) {
      const style = document.createElement('style');
      style.id = 'circle-animations';
      style.textContent = `
        @keyframes circleAppear {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes circleClick {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(0); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add click handler
    circle.addEventListener('click', () => {
      if (!this.isGameRunning) return;
      
      // Animate circle disappearing
      circle.style.animation = 'circleClick 0.3s ease-out';
      
      // Update score
      const points = Math.floor(100 / size * 60); // Smaller circles = more points
      this.score += points;
      this.updateUI();
      
      // Remove circle after animation
      setTimeout(() => {
        if (circle.parentNode) {
          circle.parentNode.removeChild(circle);
        }
      }, 300);
      
      // Remove from circles array
      this.circles = this.circles.filter(c => c.element !== circle);
    });
    
    gameArea.appendChild(circle);
    
    // Store circle data
    const circleData = {
      element: circle,
      x: x,
      y: y,
      size: size,
      spawned: Date.now()
    };
    this.circles.push(circleData);
    
    // Auto-remove circle after 3 seconds
    setTimeout(() => {
      if (circle.parentNode && this.circles.includes(circleData)) {
        circle.style.animation = 'circleClick 0.3s ease-out';
        setTimeout(() => {
          if (circle.parentNode) {
            circle.parentNode.removeChild(circle);
          }
        }, 300);
        this.circles = this.circles.filter(c => c !== circleData);
      }
    }, 3000);
  }

  /**
   * Update UI elements
   */
  updateUI() {
    const scoreEl = this.ui.querySelector('#game-score');
    const timeEl = this.ui.querySelector('#game-time');
    
    if (scoreEl) scoreEl.textContent = this.score;
    if (timeEl) timeEl.textContent = this.timeLeft;
  }

  /**
   * Return to menu
   */
  async returnToMenu() {
    // Stop game if running
    if (this.isGameRunning) {
      this.endGame();
    }
    
    if (this.gameEngine.sceneManager) {
      await this.gameEngine.sceneManager.transitionTo('menu');
    }
  }

  /**
   * Activate scene
   */
  async activate() {
    this.isActive = true;
    
    if (this.ui) {
      this.ui.style.display = 'block';
    }
    
    // Show start screen
    this.ui.querySelector('#game-start-screen').style.display = 'block';
    this.ui.querySelector('#game-over-screen').style.display = 'none';
    
    console.log('🎯 Simple Game activated');
  }

  /**
   * Deactivate scene
   */
  deactivate() {
    this.isActive = false;
    
    // Stop game if running
    if (this.isGameRunning) {
      this.endGame();
    }
    
    if (this.ui) {
      this.ui.style.display = 'none';
    }
    
    console.log('🎯 Simple Game deactivated');
  }

  /**
   * Update scene
   */
  update(deltaTime) {
    // No continuous updates needed for this simple game
  }

  /**
   * Render scene
   */
  render(context) {
    // Using DOM rendering, no canvas needed
  }

  /**
   * Handle resize
   */
  handleResize(width, height) {
    // Game adapts automatically with CSS
  }

  /**
   * Handle input events
   */
  handleClick(data) {
    // Clicks are handled by individual circle elements
  }

  handleMove(data) {
    // No movement handling needed
  }

  handleCommand(data) {
    switch (data.command) {
      case 'menu':
        this.returnToMenu();
        break;
      case 'pause':
        if (this.isGameRunning) {
          this.endGame();
        }
        break;
    }
  }

  /**
   * Pause scene
   */
  pause() {
    if (this.isGameRunning) {
      this.endGame();
    }
  }

  /**
   * Resume scene
   */
  resume() {
    // Game will restart from the start screen
  }

  /**
   * Destroy scene
   */
  destroy() {
    // Stop game if running
    if (this.isGameRunning) {
      this.endGame();
    }
    
    if (this.ui && this.ui.parentNode) {
      this.ui.parentNode.removeChild(this.ui);
    }
    
    console.log('🧹 Simple Game destroyed');
  }
}