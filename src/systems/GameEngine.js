/**
 * Main game engine that coordinates all systems
 * Manages the game loop, input, rendering, and state
 */

import { InputManager } from './InputManager.js';
import { SceneManager } from './SceneManager.js';
import { AudioManager } from './AudioManager.js';
import { StateManager } from './StateManager.js';
import { AccessibilityManager } from './AccessibilityManager.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

export class GameEngine {
  constructor() {
    this.inputManager = new InputManager();
    this.sceneManager = new SceneManager();
    this.audioManager = new AudioManager();
    this.stateManager = new StateManager();
    this.accessibilityManager = new AccessibilityManager();
    this.performanceMonitor = new PerformanceMonitor();
    
    this.isRunning = false;
    this.isPaused = false;
    this.deltaTime = 0;
    this.lastFrameTime = 0;
    this.canvas = null;
    this.context = null;
    
    // Game configuration
    this.config = {
      targetFPS: 60,
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
    };
  }

  /**
   * Initialize all systems and start game loop
   */
  async init() {
    try {
      console.log('🚀 Initializing GameEngine...');
      
      // Set up canvas and rendering context
      this.setupCanvas();
      
      // Initialize all subsystems
      await this.initializeSystems();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start the game loop
      this.start();
      
      console.log('✅ GameEngine initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize GameEngine:', error);
      throw error;
    }
  }

  /**
   * Set up canvas and rendering context
   */
  setupCanvas() {
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) {
      throw new Error('Game canvas not found');
    }
    
    this.context = this.canvas.getContext('2d');
    if (!this.context) {
      throw new Error('Could not get 2D rendering context');
    }
    
    // Set canvas size
    this.resizeCanvas();
    
    // Set up canvas accessibility
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', 'GazeQuest Adventures Game Area');
    this.canvas.setAttribute('tabindex', '0');
  }

  /**
   * Resize canvas to fit viewport
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Update canvas style size
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    // Notify scene manager of resize
    if (this.sceneManager) {
      this.sceneManager.handleResize(rect.width, rect.height);
    }
  }

  /**
   * Initialize all subsystems
   */
  async initializeSystems() {
    const systems = [
      { name: 'AccessibilityManager', system: this.accessibilityManager },
      { name: 'StateManager', system: this.stateManager },
      { name: 'AudioManager', system: this.audioManager },
      { name: 'InputManager', system: this.inputManager },
      { name: 'SceneManager', system: this.sceneManager }
    ];

    for (const { name, system } of systems) {
      try {
        console.log(`Initializing ${name}...`);
        await system.init(this);
        console.log(`✅ ${name} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${name}:`, error);
        throw new Error(`System initialization failed: ${name}`);
      }
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
    
    // Visibility change (pause when tab hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
    
    // Canvas focus/blur for accessibility
    this.canvas.addEventListener('focus', () => {
      this.accessibilityManager.announce('Game area focused. Use your preferred input method to play.');
    });
  }

  /**
   * Start the game
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    
    console.log('🎮 Starting game loop...');
    this.gameLoop();
  }

  /**
   * Pause the game
   */
  pause() {
    this.isPaused = true;
    this.accessibilityManager.announce('Game paused');
    console.log('⏸️ Game paused');
  }

  /**
   * Resume the game
   */
  resume() {
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.accessibilityManager.announce('Game resumed');
    console.log('▶️ Game resumed');
  }

  /**
   * Stop the game
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    console.log('⏹️ Game stopped');
  }

  /**
   * Main game loop
   */
  gameLoop() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    this.deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Update performance monitor
    this.performanceMonitor.update(currentTime);
    
    // Only update if not paused
    if (!this.isPaused) {
      this.update(this.deltaTime);
      this.render();
    }
    
    // Schedule next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update all systems
   */
  update(deltaTime) {
    try {
      // Update input first
      this.inputManager.update(deltaTime);
      
      // Update current scene
      this.sceneManager.update(deltaTime);
      
      // Update audio
      this.audioManager.update(deltaTime);
      
      // Update accessibility features
      this.accessibilityManager.update(deltaTime);
      
    } catch (error) {
      console.error('Error during update:', error);
      this.handleUpdateError(error);
    }
  }

  /**
   * Render the current frame
   */
  render() {
    try {
      // Clear canvas
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Render current scene
      this.sceneManager.render(this.context);
      
      // Render debug info if enabled
      if (this.config.debugMode) {
        this.renderDebugInfo();
      }
      
    } catch (error) {
      console.error('Error during render:', error);
      this.handleRenderError(error);
    }
  }

  /**
   * Render debug information
   */
  renderDebugInfo() {
    const fps = this.performanceMonitor.getFPS();
    const activeInputs = this.inputManager.getActiveInputMethods();
    
    this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.context.fillRect(10, 10, 200, 80);
    
    this.context.fillStyle = 'white';
    this.context.font = '12px monospace';
    this.context.fillText(`FPS: ${fps}`, 20, 30);
    this.context.fillText(`Inputs: ${activeInputs.join(', ')}`, 20, 50);
    this.context.fillText(`Scene: ${this.sceneManager.getCurrentSceneName()}`, 20, 70);
  }

  /**
   * Handle update errors gracefully
   */
  handleUpdateError(error) {
    console.warn('Recovering from update error:', error);
    // Could implement error recovery strategies here
  }

  /**
   * Handle render errors gracefully
   */
  handleRenderError(error) {
    console.warn('Recovering from render error:', error);
    // Could implement fallback rendering here
  }

  /**
   * Get current game state
   */
  getState() {
    return this.stateManager.getState();
  }

  /**
   * Update game state
   */
  setState(newState) {
    this.stateManager.setState(newState);
  }

  /**
   * Get current scene
   */
  getCurrentScene() {
    return this.sceneManager.getCurrentScene();
  }

  /**
   * Get canvas dimensions
   */
  getCanvasDimensions() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }
}