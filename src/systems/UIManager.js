/**
 * UI Manager for handling overlay UI components
 * Manages progress indicator, input selector, and game controls
 */

export class UIManager {
  constructor() {
    this.gameEngine = null;
    this.elements = {
      gameControls: null
    };
    this.isInitialized = false;
    this.updateInterval = null;
  }

  /**
   * Initialize UI Manager
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    
    try {
      // Wait a bit for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get UI elements
      this.elements.gameControls = document.getElementById('game-controls');
      
      // Log which elements were found
      console.log('UI Elements found:', {
        gameControls: !!this.elements.gameControls
      });
      
      // Initialize components (with defensive checks)
      this.initializeGameControls();
      
      // Start update loop
      this.startUpdateLoop();
      
      this.isInitialized = true;
      console.log('✅ UI Manager initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize UI Manager:', error);
      // Don't throw - allow game to continue without UI Manager
      this.isInitialized = false;
    }
  }


  /**
   * Initialize game controls
   */
  initializeGameControls() {
    if (!this.elements.gameControls) return;
    
    // Create basic game controls
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;
    
    content.innerHTML = `
      <button id="pause-btn" class="control-button" title="Pause Game" aria-label="Pause Game">
        ⏸️
      </button>
      <button id="menu-btn" class="control-button" title="Open Menu" aria-label="Open Menu">
        📱
      </button>
      <button id="help-btn" class="control-button" title="Help" aria-label="Show Help">
        ❓
      </button>
    `;
    
    // Add control button styles
    const style = document.createElement('style');
    style.textContent = `
      .control-button {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        transition: all 0.3s ease;
        backdrop-filter: blur(5px);
      }
      
      .control-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }
      
      .control-button:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
    
    this.elements.gameControls.appendChild(content);
    
    // Add event listeners
    content.querySelector('#pause-btn')?.addEventListener('click', () => {
      this.togglePause();
    });
    
    content.querySelector('#menu-btn')?.addEventListener('click', () => {
      this.openMenu();
    });
    
    content.querySelector('#help-btn')?.addEventListener('click', () => {
      this.showHelp();
    });
  }

  /**
   * Start update loop for dynamic content
   */
  startUpdateLoop() {
    // No updates needed without progress indicator and input selector
  }


  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.gameEngine) {
      if (this.gameEngine.isPaused) {
        this.gameEngine.resume();
        if (this.gameEngine.accessibilityManager) {
          this.gameEngine.accessibilityManager.announce('Game resumed');
        }
      } else {
        this.gameEngine.pause();
        if (this.gameEngine.accessibilityManager) {
          this.gameEngine.accessibilityManager.announce('Game paused');
        }
      }
    }
  }

  /**
   * Open menu
   */
  openMenu() {
    if (this.gameEngine?.sceneManager) {
      this.gameEngine.sceneManager.transitionTo('menu');
      if (this.gameEngine.accessibilityManager) {
        this.gameEngine.accessibilityManager.announce('Opening menu');
      }
    }
  }

  /**
   * Show help
   */
  showHelp() {
    if (this.gameEngine?.accessibilityManager) {
      this.gameEngine.accessibilityManager.showKeyboardHelp();
    } else {
      alert('Help: Use your selected input method to interact with the game. Press F1 for keyboard shortcuts.');
    }
  }

  /**
   * Show/hide UI elements
   */
  setUIVisibility(visible) {
    const elements = [
      this.elements.gameControls
    ];
    
    elements.forEach(element => {
      if (element) {
        element.style.display = visible ? 'block' : 'none';
      }
    });
  }

  /**
   * Update UI for different scenes
   */
  updateForScene(sceneName) {
    // Hide UI in menu, show in game scenes
    const showUI = sceneName !== 'menu';
    this.setUIVisibility(showUI);
  }

  /**
   * Destroy UI Manager
   */
  destroy() {
    try {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      
      this.isInitialized = false;
      this.gameEngine = null;
      
      console.log('🧹 UI Manager destroyed');
    } catch (error) {
      console.warn('Error during UI Manager destruction:', error);
    }
  }
}