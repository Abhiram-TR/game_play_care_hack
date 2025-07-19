/**
 * Main entry point for GazeQuest Adventures
 * Initializes the game engine and starts the application
 */

import { GameEngine } from './systems/GameEngine.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import './styles/global.css';

class Application {
  constructor() {
    this.gameEngine = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Set up error handling
      this.setupErrorHandling();
      
      // Show loading screen
      this.showLoadingScreen();
      
      // Check browser compatibility
      await this.checkCompatibility();
      
      // Initialize game engine
      this.gameEngine = new GameEngine();
      await this.gameEngine.init();
      
      // Hide loading screen and show game
      this.hideLoadingScreen();
      
      this.isInitialized = true;
      console.log('🎮 GazeQuest Adventures initialized successfully!');
      
    } catch (error) {
      console.error('Failed to initialize GazeQuest Adventures:', error);
      this.showError('Failed to load the game. Please refresh the page to try again.');
    }
  }

  /**
   * Set up global error handling
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      ErrorHandler.handleError(event.error, 'Global Error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      ErrorHandler.handleError(event.reason, 'Unhandled Promise Rejection');
      event.preventDefault();
    });
  }

  /**
   * Check browser compatibility for required features
   */
  async checkCompatibility() {
    const compatibility = {
      modules: 'noModule' in HTMLScriptElement.prototype,
      webgl: !!document.createElement('canvas').getContext('webgl'),
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      localStorage: typeof Storage !== 'undefined',
      canvas: !!document.createElement('canvas').getContext('2d')
    };

    const missing = Object.entries(compatibility)
      .filter(([key, supported]) => !supported)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Browser missing required features: ${missing.join(', ')}`);
    }

    console.log('✅ Browser compatibility check passed');
  }

  /**
   * Show loading screen
   */
  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen) loadingScreen.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'none';
  }

  /**
   * Hide loading screen and show main content
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 300);
    }
    
    if (mainContent) {
      mainContent.style.display = 'block';
      // Focus the main content for accessibility
      mainContent.focus();
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorBoundary = document.getElementById('error-boundary');
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    
    if (errorBoundary) {
      errorBoundary.querySelector('p').textContent = message;
      errorBoundary.style.display = 'block';
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.init();
});

// Export for potential testing
export { Application };