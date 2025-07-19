/**
 * Scene management system for GazeQuest Adventures
 * Handles scene loading, transitions, and rendering
 */

export class SceneManager {
  constructor() {
    this.currentScene = null;
    this.scenes = new Map();
    this.isTransitioning = false;
    this.gameEngine = null;
    
    this.eventListeners = new Map();
    
    // Scene configuration
    this.config = {
      transitionDuration: 500, // ms
      preloadAdjacentScenes: true,
      maxCachedScenes: 5
    };
    
    this.sceneHistory = [];
    this.preloadedScenes = new Set();
  }

  /**
   * Initialize scene manager
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    
    try {
      // Register built-in scenes
      await this.registerBuiltInScenes();
      
      // Load initial scene
      await this.loadInitialScene();
      
      console.log('✅ SceneManager initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize SceneManager:', error);
      throw error;
    }
  }

  /**
   * Register built-in game scenes
   */
  async registerBuiltInScenes() {
    const sceneConfigs = [
      { name: 'menu', module: () => import('../scenes/MenuScene.js') },
      { name: 'tutorial', module: () => import('../scenes/TutorialScene.js') },
      { name: 'crystal_caves', module: () => import('../scenes/CrystalCaves.js') },
      { name: 'wind_valley', module: () => import('../scenes/WindValley.js') },
      { name: 'motion_mountains', module: () => import('../scenes/MotionMountains.js') },
      { name: 'switch_sanctuary', module: () => import('../scenes/SwitchSanctuary.js') }
    ];

    for (const config of sceneConfigs) {
      this.scenes.set(config.name, {
        name: config.name,
        module: config.module,
        instance: null,
        isLoaded: false,
        lastUsed: 0
      });
    }
  }

  /**
   * Load initial scene based on game state
   */
  async loadInitialScene() {
    const gameState = this.gameEngine.getState();
    const targetScene = gameState.currentScene || 'menu';
    
    await this.loadScene(targetScene);
  }

  /**
   * Load a scene
   */
  async loadScene(sceneName, options = {}) {
    if (!this.scenes.has(sceneName)) {
      throw new Error(`Scene '${sceneName}' not found`);
    }

    const sceneData = this.scenes.get(sceneName);
    
    try {
      // Load scene module if not already loaded
      if (!sceneData.isLoaded) {
        console.log(`📄 Loading scene: ${sceneName}`);
        
        const module = await sceneData.module();
        const SceneClass = module.default || module[Object.keys(module)[0]];
        
        sceneData.instance = new SceneClass();
        await sceneData.instance.init(this.gameEngine);
        sceneData.isLoaded = true;
        
        console.log(`✅ Scene loaded: ${sceneName}`);
      }
      
      sceneData.lastUsed = Date.now();
      return sceneData.instance;
      
    } catch (error) {
      console.error(`❌ Failed to load scene '${sceneName}':`, error);
      throw error;
    }
  }

  /**
   * Transition to a new scene
   */
  async transitionTo(sceneName, transitionOptions = {}) {
    if (this.isTransitioning) {
      console.warn('Scene transition already in progress');
      return false;
    }

    if (this.currentScene?.name === sceneName) {
      console.warn(`Already in scene: ${sceneName}`);
      return false;
    }

    this.isTransitioning = true;

    try {
      console.log(`🔄 Transitioning to scene: ${sceneName}`);
      
      // Start transition
      this.emit('transitionStart', { from: this.currentScene?.name, to: sceneName });
      
      // Load new scene
      const newScene = await this.loadScene(sceneName);
      
      // Execute transition
      await this.executeTransition(newScene, transitionOptions);
      
      // Update game state
      this.gameEngine.setState({ currentScene: sceneName });
      
      // Add to history
      if (this.currentScene) {
        this.sceneHistory.push(this.currentScene.name);
      }
      
      // Set new current scene
      this.currentScene = newScene;
      
      // Cleanup old scenes if needed
      this.cleanupUnusedScenes();
      
      // Preload adjacent scenes
      if (this.config.preloadAdjacentScenes) {
        this.preloadAdjacentScenes(sceneName);
      }
      
      this.emit('transitionComplete', { scene: sceneName });
      console.log(`✅ Scene transition complete: ${sceneName}`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to transition to scene '${sceneName}':`, error);
      this.emit('transitionError', { error, sceneName });
      return false;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Execute scene transition with visual effects
   */
  async executeTransition(newScene, options) {
    const duration = options.duration || this.config.transitionDuration;
    const type = options.type || 'fade';
    
    // Pause current scene
    if (this.currentScene && this.currentScene.pause) {
      this.currentScene.pause();
    }
    
    // Start transition effect
    await this.startTransitionEffect(type, duration / 2);
    
    // Activate new scene
    if (newScene.activate) {
      await newScene.activate();
    }
    
    // Complete transition effect
    await this.completeTransitionEffect(type, duration / 2);
    
    // Deactivate old scene
    if (this.currentScene && this.currentScene.deactivate) {
      this.currentScene.deactivate();
    }
  }

  /**
   * Start visual transition effect
   */
  async startTransitionEffect(type, duration) {
    return new Promise(resolve => {
      const canvas = this.gameEngine.canvas;
      const ctx = this.gameEngine.context;
      
      switch (type) {
        case 'fade':
          this.fadeTransition(ctx, canvas, 0, 1, duration, resolve);
          break;
        case 'slide':
          this.slideTransition(ctx, canvas, duration, resolve);
          break;
        default:
          setTimeout(resolve, duration);
      }
    });
  }

  /**
   * Complete visual transition effect
   */
  async completeTransitionEffect(type, duration) {
    return new Promise(resolve => {
      const canvas = this.gameEngine.canvas;
      const ctx = this.gameEngine.context;
      
      switch (type) {
        case 'fade':
          this.fadeTransition(ctx, canvas, 1, 0, duration, resolve);
          break;
        default:
          setTimeout(resolve, duration);
      }
    });
  }

  /**
   * Fade transition effect
   */
  fadeTransition(ctx, canvas, startAlpha, endAlpha, duration, callback) {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const alpha = startAlpha + (endAlpha - startAlpha) * progress;
      
      // Draw fade overlay
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback();
      }
    };
    
    animate();
  }

  /**
   * Slide transition effect
   */
  slideTransition(ctx, canvas, duration, callback) {
    // Simple slide effect placeholder
    setTimeout(callback, duration);
  }

  /**
   * Go back to previous scene
   */
  async goBack() {
    if (this.sceneHistory.length === 0) {
      console.warn('No previous scene to go back to');
      return false;
    }
    
    const previousScene = this.sceneHistory.pop();
    return await this.transitionTo(previousScene);
  }

  /**
   * Preload adjacent scenes
   */
  async preloadAdjacentScenes(currentSceneName) {
    // Define scene adjacencies (which scenes are commonly accessed from each scene)
    const adjacencies = {
      menu: ['tutorial', 'crystal_caves'],
      tutorial: ['crystal_caves', 'menu'],
      crystal_caves: ['wind_valley', 'menu'],
      wind_valley: ['motion_mountains', 'crystal_caves'],
      motion_mountains: ['switch_sanctuary', 'wind_valley'],
      switch_sanctuary: ['menu', 'motion_mountains']
    };
    
    const adjacentScenes = adjacencies[currentSceneName] || [];
    
    for (const sceneName of adjacentScenes) {
      if (!this.preloadedScenes.has(sceneName)) {
        try {
          await this.loadScene(sceneName);
          this.preloadedScenes.add(sceneName);
          console.log(`📦 Preloaded scene: ${sceneName}`);
        } catch (error) {
          console.warn(`Failed to preload scene '${sceneName}':`, error);
        }
      }
    }
  }

  /**
   * Cleanup unused scenes to free memory
   */
  cleanupUnusedScenes() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    let cleanedCount = 0;
    
    this.scenes.forEach((sceneData, sceneName) => {
      if (sceneData.isLoaded && 
          sceneData.instance !== this.currentScene &&
          now - sceneData.lastUsed > maxAge &&
          this.scenes.size - cleanedCount > this.config.maxCachedScenes) {
        
        // Cleanup scene
        if (sceneData.instance.destroy) {
          sceneData.instance.destroy();
        }
        
        sceneData.instance = null;
        sceneData.isLoaded = false;
        this.preloadedScenes.delete(sceneName);
        cleanedCount++;
        
        console.log(`🧹 Cleaned up scene: ${sceneName}`);
      }
    });
  }

  /**
   * Update current scene
   */
  update(deltaTime) {
    if (this.currentScene && this.currentScene.update) {
      try {
        this.currentScene.update(deltaTime);
      } catch (error) {
        console.error('Error updating current scene:', error);
        this.emit('sceneError', { error, scene: this.currentScene.name });
      }
    }
  }

  /**
   * Render current scene
   */
  render(context) {
    if (this.currentScene && this.currentScene.render) {
      try {
        this.currentScene.render(context);
      } catch (error) {
        console.error('Error rendering current scene:', error);
        this.emit('sceneError', { error, scene: this.currentScene.name });
      }
    }
  }

  /**
   * Handle resize event
   */
  handleResize(width, height) {
    if (this.currentScene && this.currentScene.handleResize) {
      this.currentScene.handleResize(width, height);
    }
  }

  /**
   * Handle input events
   */
  handleClick(data) {
    if (this.currentScene && this.currentScene.handleClick) {
      this.currentScene.handleClick(data);
    }
  }

  handleMove(data) {
    if (this.currentScene && this.currentScene.handleMove) {
      this.currentScene.handleMove(data);
    }
  }

  handleCommand(data) {
    if (this.currentScene && this.currentScene.handleCommand) {
      this.currentScene.handleCommand(data);
    }
  }

  /**
   * Get current scene
   */
  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Get current scene name
   */
  getCurrentSceneName() {
    return this.currentScene?.name || 'none';
  }

  /**
   * Get all available scenes
   */
  getAvailableScenes() {
    return Array.from(this.scenes.keys());
  }

  /**
   * Check if scene is loaded
   */
  isSceneLoaded(sceneName) {
    const sceneData = this.scenes.get(sceneName);
    return sceneData ? sceneData.isLoaded : false;
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
          console.error('Error in scene manager event listener:', error);
        }
      });
    }
  }
}