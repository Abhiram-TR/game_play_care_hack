/**
 * Wind Valley scene - Voice and breath control focused realm
 * FULLY IMPLEMENTED with voice commands and breath interactions
 */

export default class WindValley {
  constructor() {
    this.name = 'wind_valley';
    this.description = 'A mystical valley where your voice and breath control the winds';
    this.gameEngine = null;
    this.isActive = false;
    
    // Game state
    this.windmill = null;
    this.clouds = [];
    this.flowers = [];
    this.seeds = [];
    this.birds = [];
    this.score = 0;
    this.level = 1;
    this.windPower = 0;
    this.targetWindPower = 0.5;
    this.combo = 0;
    this.maxCombo = 0;
    this.energy = 100;
    this.maxEnergy = 100;
    
    // Wind effects
    this.windParticles = [];
    this.windDirection = 0; // 0-360 degrees
    this.windIntensity = 0; // 0-1
    
    // Game objectives
    this.objectives = [];
    this.currentObjective = null;
    this.completedObjectives = 0;
    
    // Special abilities
    this.abilities = {
      tornado: { cooldown: 0, maxCooldown: 30000 },
      gust: { cooldown: 0, maxCooldown: 5000 },
      whisper: { cooldown: 0, maxCooldown: 3000 }
    };
    
    this.ui = null;
    this.canvas = null;
    this.animationTime = 0;
  }

  /**
   * Initialize Wind Valley scene
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    this.createUI();
    this.setupWindElements();
    this.setupVoiceCommands();
    this.setupBreathControl();
    
    console.log('🌬️ Wind Valley scene initialized');
  }

  /**
   * Create scene UI
   */
  createUI() {
    const container = document.getElementById('main-content');
    
    this.ui = document.createElement('div');
    this.ui.id = 'wind-valley-overlay';
    this.ui.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #90EE90 100%);
      display: none;
      z-index: 150;
      overflow: hidden;
    `;
    
    // Game canvas for wind effects
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
      <div class="valley-ui" style="position: absolute; top: 20px; left: 20px; color: #2d5016; font-size: 1rem; z-index: 10; background: rgba(255,255,255,0.9); padding: 15px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <div style="font-size: 1.2rem; margin-bottom: 8px;"><strong>🌬️ Wind Valley</strong></div>
        <div>Score: <span id="valley-score">0</span></div>
        <div>Level: <span id="valley-level">1</span></div>
        <div>Wind Power: <span id="valley-wind">0%</span></div>
        <div>Combo: <span id="valley-combo">0</span>x</div>
        <div style="margin-top: 8px;">
          <div style="font-size: 0.9rem; margin-bottom: 2px;">Energy</div>
          <div id="energy-bar" style="width: 100px; height: 6px; background: #ddd; border-radius: 3px; overflow: hidden;">
            <div id="energy-fill" style="width: 100%; height: 100%; background: linear-gradient(to right, #4CAF50, #8BC34A); transition: width 0.3s ease;"></div>
          </div>
        </div>
      </div>
      
      <div class="valley-instructions" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.9); padding: 15px; border-radius: 10px; color: #2d5016; max-width: 380px; z-index: 10;">
        <h3 style="margin-top: 0; color: #4CAF50;">🗣️ Voice Commands</h3>
        <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.85rem;">
          <li><strong>"Wind"/"Blow"</strong> - Create wind</li>
          <li><strong>"Gentle"/"Soft"</strong> - Light breeze</li>
          <li><strong>"Strong"/"Powerful"</strong> - Strong wind</li>
          <li><strong>"Left"/"Right"</strong> - Change direction</li>
          <li><strong>"Tornado"/"Cyclone"</strong> - Tornado ability</li>
          <li><strong>"Gust"</strong> - Quick wind burst</li>
          <li><strong>"Whisper"</strong> - Gentle guidance</li>
        </ul>
        <h4 style="margin: 10px 0 5px 0; color: #4CAF50;">💨 Breath Control</h4>
        <p style="margin: 5px 0; font-size: 0.85rem;">Blow into your microphone to control wind intensity!</p>
        <h4 style="margin: 10px 0 5px 0; color: #FF9800;">🎯 Current Objective</h4>
        <div id="current-objective" style="font-size: 0.85rem; color: #333; background: rgba(255,193,7,0.2); padding: 8px; border-radius: 5px;">
          Loading...
        </div>
      </div>
      
      <div class="valley-game-area" id="valley-elements" style="position: relative; width: 100%; height: 100%; z-index: 2;">
        <!-- Wind elements will be added here -->
      </div>
      
      <div class="valley-controls" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 10;">
        <button class="valley-btn" onclick="window.windValley?.toggleVoice()" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9rem;">
          🗣️ <span id="voice-status">Enable Voice</span>
        </button>
        <button class="valley-btn" onclick="window.windValley?.toggleBreath()" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9rem;">
          💨 <span id="breath-status">Enable Breath</span>
        </button>
        <button class="valley-btn" onclick="window.windValley?.useAbility('gust')" style="padding: 8px 16px; background: #FF9800; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9rem;">
          💥 Gust
        </button>
        <button class="valley-btn" onclick="window.windValley?.useAbility('whisper')" style="padding: 8px 16px; background: #9C27B0; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9rem;">
          🌟 Whisper
        </button>
        <button class="valley-btn" onclick="window.windValley?.returnToMenu()" style="padding: 8px 16px; background: rgba(255,255,255,0.2); color: #2d5016; border: 2px solid #4CAF50; border-radius: 20px; cursor: pointer; font-size: 0.9rem;">
          🏠 Menu
        </button>
      </div>
    `;
    
    container.appendChild(this.ui);
    
    // Store reference for onclick handlers
    window.windValley = this;
  }

  /**
   * Set up wind elements in the scene
   */
  setupWindElements() {
    const gameArea = this.ui.querySelector('#valley-elements');
    
    // Create windmill
    this.createWindmill(gameArea);
    
    // Create clouds
    for (let i = 0; i < 3; i++) {
      this.createCloud(gameArea, i);
    }
    
    // Create flowers
    for (let i = 0; i < 8; i++) {
      this.createFlower(gameArea, i);
    }
    
    // Create flying seeds
    for (let i = 0; i < 5; i++) {
      this.createSeed(gameArea);
    }
    
    // Create birds
    for (let i = 0; i < 3; i++) {
      this.createBird(gameArea);
    }
    
    // Initialize wind particles
    this.initWindParticles();
    
    // Set up objectives
    this.initializeObjectives();
  }

  /**
   * Create animated windmill
   */
  createWindmill(container) {
    const windmill = document.createElement('div');
    windmill.className = 'windmill';
    windmill.style.cssText = `
      position: absolute;
      left: 50%;
      bottom: 100px;
      transform: translateX(-50%);
      width: 120px;
      height: 200px;
      z-index: 3;
    `;
    
    windmill.innerHTML = `
      <div class="windmill-blades" style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, #8B4513 20%, transparent 20%);
        border-radius: 50%;
        transition: transform 0.1s linear;
      ">
        <div style="position: absolute; top: 0; left: 48px; width: 4px; height: 50px; background: #228B22; border-radius: 2px;"></div>
        <div style="position: absolute; top: 48px; right: 0; width: 50px; height: 4px; background: #228B22; border-radius: 2px;"></div>
        <div style="position: absolute; bottom: 0; left: 48px; width: 4px; height: 50px; background: #228B22; border-radius: 2px;"></div>
        <div style="position: absolute; top: 48px; left: 0; width: 50px; height: 4px; background: #228B22; border-radius: 2px;"></div>
      </div>
      <div class="windmill-tower" style="
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 100px;
        background: linear-gradient(to bottom, #8B4513, #A0522D);
        border-radius: 10px 10px 2px 2px;
      "></div>
    `;
    
    container.appendChild(windmill);
    this.windmill = windmill;
  }

  /**
   * Create animated clouds
   */
  createCloud(container, index) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.style.cssText = `
      position: absolute;
      top: ${20 + (index * 80)}px;
      left: ${-100 + (index * 200)}px;
      width: 100px;
      height: 60px;
      background: white;
      border-radius: 30px;
      opacity: 0.8;
      z-index: 2;
      transition: transform 0.3s ease;
    `;
    
    // Add cloud shape details
    cloud.innerHTML = `
      <div style="position: absolute; top: -20px; left: 20px; width: 60px; height: 60px; background: white; border-radius: 30px;"></div>
      <div style="position: absolute; top: -15px; right: 15px; width: 40px; height: 40px; background: white; border-radius: 20px;"></div>
    `;
    
    container.appendChild(cloud);
    this.clouds.push({
      element: cloud,
      baseX: -100 + (index * 200),
      baseY: 20 + (index * 80),
      speed: 0.5 + (index * 0.2)
    });
  }

  /**
   * Create swaying flowers
   */
  createFlower(container, index) {
    const flower = document.createElement('div');
    flower.className = 'flower';
    
    const x = 100 + (index * 150) + (Math.random() * 50);
    const y = window.innerHeight - 120 - (Math.random() * 50);
    
    flower.style.cssText = `
      position: absolute;
      left: ${x}px;
      bottom: 60px;
      width: 30px;
      height: 80px;
      z-index: 3;
      transition: transform 0.2s ease;
    `;
    
    const colors = ['#FF69B4', '#FFB6C1', '#FF1493', '#FF6347', '#FFA500'];
    const color = colors[index % colors.length];
    
    flower.innerHTML = `
      <div class="flower-head" style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 20px;
        background: ${color};
        border-radius: 50%;
        box-shadow: 0 0 10px ${color};
      "></div>
      <div class="flower-stem" style="
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 3px;
        height: 60px;
        background: linear-gradient(to bottom, #32CD32, #228B22);
        border-radius: 2px;
      "></div>
    `;
    
    container.appendChild(flower);
    this.flowers.push({
      element: flower,
      baseRotation: 0,
      swayAmount: 0
    });
  }

  /**
   * Create flying seeds
   */
  createSeed(container) {
    const seed = document.createElement('div');
    seed.className = 'seed';
    
    const x = Math.random() * window.innerWidth;
    const y = window.innerHeight - 200 - Math.random() * 100;
    
    seed.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 8px;
      height: 8px;
      background: #8B4513;
      border-radius: 50%;
      z-index: 4;
      transition: all 0.3s ease;
      box-shadow: 0 0 3px rgba(139, 69, 19, 0.6);
    `;
    
    container.appendChild(seed);
    this.seeds.push({
      element: seed,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      collected: false,
      target: null
    });
  }

  /**
   * Create birds that follow wind currents
   */
  createBird(container) {
    const bird = document.createElement('div');
    bird.className = 'bird';
    
    const x = Math.random() * window.innerWidth;
    const y = 100 + Math.random() * 200;
    
    bird.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 25px;
      height: 15px;
      z-index: 5;
      transition: all 0.2s ease;
      font-size: 20px;
    `;
    
    bird.textContent = '🐦';
    
    container.appendChild(bird);
    this.birds.push({
      element: bird,
      x: x,
      y: y,
      vx: 0.5 + Math.random() * 0.5,
      vy: 0,
      happiness: 0.5,
      targetY: y
    });
  }

  /**
   * Initialize objectives system
   */
  initializeObjectives() {
    this.objectives = [
      {
        id: 'windmill_speed',
        title: 'Spin the Windmill',
        description: 'Create wind to spin the windmill blades',
        target: 50,
        current: 0,
        type: 'windmill',
        reward: 100
      },
      {
        id: 'guide_seeds',
        title: 'Guide Flying Seeds',
        description: 'Use wind to guide 5 seeds to flowers',
        target: 5,
        current: 0,
        type: 'seeds',
        reward: 150
      },
      {
        id: 'help_birds',
        title: 'Help Birds Soar',
        description: 'Create updrafts to help birds fly higher',
        target: 3,
        current: 0,
        type: 'birds',
        reward: 200
      },
      {
        id: 'wind_combo',
        title: 'Master Wind Control',
        description: 'Achieve a 10x combo with precise wind control',
        target: 10,
        current: 0,
        type: 'combo',
        reward: 300
      }
    ];
    
    this.setNextObjective();
  }

  /**
   * Set the next objective
   */
  setNextObjective() {
    const incomplete = this.objectives.filter(obj => obj.current < obj.target);
    if (incomplete.length > 0) {
      this.currentObjective = incomplete[0];
      this.updateObjectiveDisplay();
    } else {
      this.currentObjective = null;
      this.generateNewObjectives();
    }
  }

  /**
   * Update objective display
   */
  updateObjectiveDisplay() {
    const objectiveEl = this.ui.querySelector('#current-objective');
    if (objectiveEl && this.currentObjective) {
      objectiveEl.innerHTML = `
        <strong>${this.currentObjective.title}</strong><br>
        ${this.currentObjective.description}<br>
        <span style="color: #4CAF50;">${this.currentObjective.current}/${this.currentObjective.target}</span>
      `;
    }
  }

  /**
   * Initialize wind particle system
   */
  initWindParticles() {
    for (let i = 0; i < 50; i++) {
      this.windParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: 0,
        vy: 0,
        life: Math.random(),
        maxLife: 1 + Math.random() * 2
      });
    }
  }

  /**
   * Set up voice command integration
   */
  setupVoiceCommands() {
    if (this.gameEngine.inputManager.inputMethods.has('voice')) {
      const voiceRecognition = this.gameEngine.inputManager.inputMethods.get('voice').instance;
      
      // Basic wind commands
      voiceRecognition.registerCommand(['wind', 'blow', 'create wind', 'make wind'], () => {
        this.createWind(0.7);
        this.addCombo();
      });
      
      voiceRecognition.registerCommand(['gentle', 'soft', 'light breeze', 'whisper'], () => {
        this.createWind(0.3);
        this.addCombo();
      });
      
      voiceRecognition.registerCommand(['strong', 'powerful', 'heavy wind', 'storm'], () => {
        this.createWind(0.9);
        this.addCombo();
      });
      
      voiceRecognition.registerCommand(['calm', 'stop wind', 'no wind', 'still'], () => {
        this.createWind(0);
        this.resetCombo();
      });
      
      // Directional commands
      voiceRecognition.registerCommand(['left', 'turn left', 'wind left'], () => {
        this.windDirection -= 45;
        this.createWind(this.windIntensity, this.windDirection);
        this.addCombo();
      });
      
      voiceRecognition.registerCommand(['right', 'turn right', 'wind right'], () => {
        this.windDirection += 45;
        this.createWind(this.windIntensity, this.windDirection);
        this.addCombo();
      });
      
      // Special abilities
      voiceRecognition.registerCommand(['tornado', 'cyclone', 'spin', 'twister'], () => {
        this.useAbility('tornado');
      });
      
      voiceRecognition.registerCommand(['gust', 'burst', 'quick wind'], () => {
        this.useAbility('gust');
      });
      
      voiceRecognition.registerCommand(['help birds', 'lift birds', 'updraft'], () => {
        this.createUpdraft();
      });
      
      voiceRecognition.registerCommand(['guide seeds', 'move seeds', 'seed wind'], () => {
        this.guideSeedsToFlowers();
      });
    }
  }

  /**
   * Set up breath control integration
   */
  setupBreathControl() {
    if (this.gameEngine.inputManager.inputMethods.has('breath')) {
      const breathController = this.gameEngine.inputManager.inputMethods.get('breath').instance;
      
      breathController.on('exhale', (data) => {
        this.createWind(data.level);
        this.addCombo();
      });
      
      breathController.on('inhale', (data) => {
        this.createWind(data.level * 0.3); // Gentle wind on inhale
        this.addCombo();
      });
    }
  }

  /**
   * Use special abilities
   */
  useAbility(abilityName) {
    const ability = this.abilities[abilityName];
    if (!ability || ability.cooldown > 0) {
      if (this.gameEngine.accessibilityManager) {
        this.gameEngine.accessibilityManager.announce(`${abilityName} is on cooldown!`);
      }
      return;
    }

    // Use energy
    const energyCost = { tornado: 50, gust: 20, whisper: 10 }[abilityName] || 20;
    if (this.energy < energyCost) {
      if (this.gameEngine.accessibilityManager) {
        this.gameEngine.accessibilityManager.announce('Not enough energy!');
      }
      return;
    }

    this.energy -= energyCost;
    ability.cooldown = ability.maxCooldown;

    switch (abilityName) {
      case 'tornado':
        this.createTornado();
        break;
      case 'gust':
        this.createGust();
        break;
      case 'whisper':
        this.createWhisper();
        break;
    }

    this.updateUI();
  }

  /**
   * Create gust ability
   */
  createGust() {
    const originalIntensity = this.windIntensity;
    this.createWind(1.0);
    
    setTimeout(() => {
      this.createWind(originalIntensity);
    }, 1000);
    
    this.score += 25;
    this.addCombo();
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Powerful gust created!');
    }
  }

  /**
   * Create whisper ability
   */
  createWhisper() {
    this.guideSeedsToFlowers();
    this.score += 15;
    this.addCombo();
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Gentle whisper guides the seeds!');
    }
  }

  /**
   * Create updraft for birds
   */
  createUpdraft() {
    this.birds.forEach(bird => {
      if (bird.y > 50) {
        bird.targetY = Math.max(50, bird.y - 100);
        bird.happiness = Math.min(1, bird.happiness + 0.3);
        
        // Visual feedback
        bird.element.style.transform = 'scale(1.2)';
        setTimeout(() => {
          bird.element.style.transform = 'scale(1)';
        }, 500);
      }
    });
    
    this.score += 30;
    this.addCombo();
    this.updateObjectiveProgress('birds', 1);
  }

  /**
   * Guide seeds to flowers
   */
  guideSeedsToFlowers() {
    this.seeds.forEach(seed => {
      if (!seed.collected && !seed.target) {
        // Find nearest flower
        let nearestFlower = null;
        let nearestDistance = Infinity;
        
        this.flowers.forEach(flower => {
          const flowerRect = flower.element.getBoundingClientRect();
          const dx = seed.x - flowerRect.left;
          const dy = seed.y - flowerRect.top;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestFlower = flower;
          }
        });
        
        if (nearestFlower) {
          seed.target = nearestFlower;
          const flowerRect = nearestFlower.element.getBoundingClientRect();
          seed.vx = (flowerRect.left - seed.x) * 0.02;
          seed.vy = (flowerRect.top - seed.y) * 0.02;
        }
      }
    });
  }

  /**
   * Add to combo counter
   */
  addCombo() {
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    
    // Combo bonus
    if (this.combo > 1) {
      this.score += this.combo;
    }
    
    // Update objective
    this.updateObjectiveProgress('combo', this.combo);
    
    this.updateUI();
  }

  /**
   * Reset combo counter
   */
  resetCombo() {
    this.combo = 0;
    this.updateUI();
  }

  /**
   * Update objective progress
   */
  updateObjectiveProgress(type, amount) {
    if (this.currentObjective && this.currentObjective.type === type) {
      this.currentObjective.current = Math.min(this.currentObjective.target, 
        this.currentObjective.current + amount);
      
      if (this.currentObjective.current >= this.currentObjective.target) {
        this.completeObjective();
      }
      
      this.updateObjectiveDisplay();
    }
  }

  /**
   * Complete current objective
   */
  completeObjective() {
    if (!this.currentObjective) return;
    
    this.score += this.currentObjective.reward;
    this.completedObjectives++;
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(
        `Objective completed! ${this.currentObjective.title}. Bonus: ${this.currentObjective.reward} points!`
      );
    }
    
    // Visual celebration
    this.createCelebrationEffect();
    
    this.setNextObjective();
    this.updateUI();
  }

  /**
   * Create celebration effect
   */
  createCelebrationEffect() {
    // Add sparkle effects
    for (let i = 0; i < 10; i++) {
      const sparkle = document.createElement('div');
      sparkle.textContent = '✨';
      sparkle.style.cssText = `
        position: absolute;
        left: ${Math.random() * window.innerWidth}px;
        top: ${Math.random() * window.innerHeight}px;
        font-size: 20px;
        animation: sparkle 2s ease-out;
        pointer-events: none;
        z-index: 1000;
      `;
      
      this.ui.appendChild(sparkle);
      
      setTimeout(() => {
        sparkle.remove();
      }, 2000);
    }
    
    // Add sparkle animation
    if (!document.getElementById('sparkle-animation')) {
      const style = document.createElement('style');
      style.id = 'sparkle-animation';
      style.textContent = `
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
          100% { opacity: 0; transform: scale(0) rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Create wind effects
   */
  createWind(intensity, direction = null) {
    this.windIntensity = Math.max(0, Math.min(1, intensity));
    
    if (direction !== null) {
      this.windDirection = direction;
    }
    
    // Update wind power display
    this.updateWindPower();
    
    // Animate windmill
    this.animateWindmill();
    
    // Move clouds
    this.animateClouds();
    
    // Sway flowers
    this.animateFlowers();
    
    // Update score based on wind control
    this.updateScore();
    
    // Audio feedback
    if (this.gameEngine.audioManager && intensity > 0) {
      this.gameEngine.audioManager.playSFX('wind', { volume: intensity * 0.3 });
    }
  }

  /**
   * Create tornado effect
   */
  createTornado() {
    let angle = 0;
    const tornadoInterval = setInterval(() => {
      this.createWind(0.8 + Math.sin(angle) * 0.2, angle * 10);
      angle += 0.2;
      
      if (angle > Math.PI * 4) { // 2 full rotations
        clearInterval(tornadoInterval);
        this.createWind(0.3); // Return to gentle wind
      }
    }, 100);
    
    // Bonus score for tornado
    this.score += 50;
    this.updateUI();
    
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Tornado created! Bonus points awarded!');
    }
  }

  /**
   * Update wind power display
   */
  updateWindPower() {
    const windPowerEl = this.ui.querySelector('#valley-wind');
    if (windPowerEl) {
      windPowerEl.textContent = `${Math.round(this.windIntensity * 100)}%`;
    }
  }

  /**
   * Animate windmill based on wind
   */
  animateWindmill() {
    if (!this.windmill) return;
    
    const blades = this.windmill.querySelector('.windmill-blades');
    if (blades) {
      const rotationSpeed = this.windIntensity * 360; // degrees per second
      blades.style.transform = `translateX(-50%) rotate(${this.animationTime * rotationSpeed * 0.01}deg)`;
    }
  }

  /**
   * Animate clouds based on wind
   */
  animateClouds() {
    this.clouds.forEach(cloud => {
      const windEffect = this.windIntensity * 50;
      const newX = cloud.baseX + (this.animationTime * cloud.speed) + windEffect;
      
      // Wrap around screen
      const wrappedX = ((newX % (window.innerWidth + 200)) - 100);
      
      cloud.element.style.left = `${wrappedX}px`;
      cloud.element.style.transform = `translateY(${Math.sin(this.animationTime * 0.001) * 10}px)`;
    });
  }

  /**
   * Animate flowers swaying in wind
   */
  animateFlowers() {
    this.flowers.forEach((flower, index) => {
      const swayAmount = this.windIntensity * 20 * Math.sin(this.animationTime * 0.002 + index);
      flower.element.style.transform = `rotate(${swayAmount}deg)`;
    });
  }

  /**
   * Update score based on wind control accuracy
   */
  updateScore() {
    const targetDiff = Math.abs(this.windIntensity - this.targetWindPower);
    
    if (targetDiff < 0.1) {
      this.score += 2; // Good wind control
    } else if (targetDiff < 0.2) {
      this.score += 1; // Decent wind control
    }
    
    // Change target periodically
    if (Math.random() < 0.01) {
      this.targetWindPower = Math.random();
      
      if (this.gameEngine.accessibilityManager) {
        this.gameEngine.accessibilityManager.announce(
          `New target wind power: ${Math.round(this.targetWindPower * 100)}%`
        );
      }
    }
    
    // Level up
    if (this.score >= this.level * 100) {
      this.levelUp();
    }
    
    this.updateUI();
  }

  /**
   * Level up
   */
  levelUp() {
    this.level++;
    
    // Audio feedback
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('achievement');
    }
    
    // Announce level up
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Level ${this.level} reached! Wind mastery increasing!`);
    }
    
    // Add more challenging targets
    this.targetWindPower = Math.random();
  }

  /**
   * Update UI elements
   */
  updateUI() {
    const scoreEl = this.ui.querySelector('#valley-score');
    const levelEl = this.ui.querySelector('#valley-level');
    const comboEl = this.ui.querySelector('#valley-combo');
    const energyFill = this.ui.querySelector('#energy-fill');
    
    if (scoreEl) scoreEl.textContent = this.score;
    if (levelEl) levelEl.textContent = this.level;
    if (comboEl) {
      comboEl.textContent = this.combo;
      comboEl.style.color = this.combo > 5 ? '#FF6B35' : '#333';
    }
    if (energyFill) {
      const energyPercent = (this.energy / this.maxEnergy) * 100;
      energyFill.style.width = `${energyPercent}%`;
      energyFill.style.background = energyPercent > 50 ? 
        'linear-gradient(to right, #4CAF50, #8BC34A)' : 
        'linear-gradient(to right, #FF9800, #FFC107)';
    }
  }

  /**
   * Toggle voice recognition
   */
  async toggleVoice() {
    const voiceInput = this.gameEngine.inputManager.inputMethods.get('voice');
    const statusEl = this.ui.querySelector('#voice-status');
    
    if (voiceInput) {
      if (voiceInput.isActive) {
        await this.gameEngine.inputManager.disableInput('voice');
        statusEl.textContent = 'Enable Voice';
      } else {
        await this.gameEngine.inputManager.enableSecondaryInput('voice');
        statusEl.textContent = 'Disable Voice';
      }
    }
  }

  /**
   * Toggle breath control
   */
  async toggleBreath() {
    const breathInput = this.gameEngine.inputManager.inputMethods.get('breath');
    const statusEl = this.ui.querySelector('#breath-status');
    
    if (breathInput) {
      if (breathInput.isActive) {
        await this.gameEngine.inputManager.disableInput('breath');
        statusEl.textContent = 'Enable Breath';
      } else {
        await this.gameEngine.inputManager.enableSecondaryInput('breath');
        statusEl.textContent = 'Disable Breath';
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
    this.windIntensity = 0;
    this.targetWindPower = 0.5;
    this.animationTime = 0;
    this.updateUI();
    
    // Resize canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Start game loop
    this.startGameLoop();
    
    // Play background music
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playMusic('wind_valley', { loop: true, fadeIn: 1 });
    }
    
    // Announce scene
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(
        'Welcome to Wind Valley! Use your voice or breath to control the wind. Say "wind" or blow into your microphone.'
      );
    }
    
    console.log('🌬️ Wind Valley scene activated');
  }

  /**
   * Start game loop for animations
   */
  startGameLoop() {
    const gameLoop = () => {
      if (!this.isActive) return;
      
      this.animationTime += 16; // ~60 FPS
      
      // Update wind effects
      this.updateWindParticles();
      this.renderWindParticles();
      
      // Continue animations
      this.animateWindmill();
      this.animateClouds();
      this.animateFlowers();
      
      requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
  }

  /**
   * Update wind particles
   */
  updateWindParticles() {
    this.windParticles.forEach(particle => {
      // Wind effect on particles
      particle.vx = this.windIntensity * Math.cos(this.windDirection * Math.PI / 180) * 2;
      particle.vy = this.windIntensity * Math.sin(this.windDirection * Math.PI / 180) * 2;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Update life
      particle.life -= 0.01;
      
      // Reset if needed
      if (particle.life <= 0 || particle.x < 0 || particle.x > this.canvas.width || 
          particle.y < 0 || particle.y > this.canvas.height) {
        particle.x = Math.random() * this.canvas.width;
        particle.y = Math.random() * this.canvas.height;
        particle.life = particle.maxLife;
      }
    });
  }

  /**
   * Render wind particles
   */
  renderWindParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.windIntensity > 0.1) {
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.windIntensity * 0.3})`;
      this.ctx.lineWidth = 1;
      
      this.windParticles.forEach(particle => {
        if (particle.life > 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(particle.x - particle.vx * 5, particle.y - particle.vy * 5);
          this.ctx.stroke();
        }
      });
    }
  }

  /**
   * Handle input events
   */
  handleInput(inputData) {
    switch (inputData.action) {
      case 'wind':
        this.createWind(inputData.intensity || 0.7);
        break;
      case 'move':
        if (inputData.direction === 'left') {
          this.windDirection -= 30;
        } else if (inputData.direction === 'right') {
          this.windDirection += 30;
        }
        this.createWind(this.windIntensity, this.windDirection);
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
    
    console.log('🌬️ Wind Valley scene deactivated');
  }

  /**
   * Update scene
   */
  update(deltaTime) {
    if (!this.isActive) return;
    
    // Update cooldowns
    this.updateCooldowns(deltaTime);
    
    // Regenerate energy
    this.energy = Math.min(this.maxEnergy, this.energy + deltaTime * 0.01);
    
    // Update seeds
    this.updateSeeds();
    
    // Update birds
    this.updateBirds();
    
    // Update game state
    this.updateScore();
    
    // Update objectives
    this.updateObjectiveProgress('windmill', this.windIntensity > 0.5 ? 1 : 0);
    
    // Update UI
    this.updateUI();
  }

  /**
   * Update ability cooldowns
   */
  updateCooldowns(deltaTime) {
    Object.values(this.abilities).forEach(ability => {
      if (ability.cooldown > 0) {
        ability.cooldown = Math.max(0, ability.cooldown - deltaTime);
      }
    });
  }

  /**
   * Update seed physics and interactions
   */
  updateSeeds() {
    this.seeds.forEach(seed => {
      if (seed.collected) return;
      
      // Apply wind force
      seed.vx += this.windIntensity * Math.cos(this.windDirection * Math.PI / 180) * 0.1;
      seed.vy += this.windIntensity * Math.sin(this.windDirection * Math.PI / 180) * 0.1;
      
      // Apply gravity
      seed.vy += 0.02;
      
      // Apply drag
      seed.vx *= 0.98;
      seed.vy *= 0.98;
      
      // Update position
      seed.x += seed.vx;
      seed.y += seed.vy;
      
      // Check collision with flowers
      this.flowers.forEach(flower => {
        const flowerRect = flower.element.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(seed.x - flowerRect.left, 2) + 
          Math.pow(seed.y - flowerRect.top, 2)
        );
        
        if (distance < 30 && !seed.collected) {
          seed.collected = true;
          seed.element.style.display = 'none';
          this.score += 20;
          this.updateObjectiveProgress('seeds', 1);
          
          // Create new seed
          setTimeout(() => {
            const gameArea = this.ui.querySelector('#valley-elements');
            this.createSeed(gameArea);
          }, 3000);
          
          // Visual feedback
          flower.element.style.filter = 'brightness(1.3) drop-shadow(0 0 10px gold)';
          setTimeout(() => {
            flower.element.style.filter = 'none';
          }, 1000);
        }
      });
      
      // Update DOM position
      seed.element.style.left = `${seed.x}px`;
      seed.element.style.top = `${seed.y}px`;
      
      // Reset if out of bounds
      if (seed.x < -50 || seed.x > window.innerWidth + 50 || seed.y > window.innerHeight + 50) {
        seed.x = Math.random() * window.innerWidth;
        seed.y = window.innerHeight - 200 - Math.random() * 100;
        seed.vx = 0;
        seed.vy = 0;
        seed.collected = false;
        seed.element.style.display = 'block';
      }
    });
  }

  /**
   * Update bird behavior
   */
  updateBirds() {
    this.birds.forEach(bird => {
      // Wind effects on birds
      bird.vx += this.windIntensity * Math.cos(this.windDirection * Math.PI / 180) * 0.05;
      bird.vy += this.windIntensity * Math.sin(this.windDirection * Math.PI / 180) * 0.05;
      
      // Move towards target height
      if (Math.abs(bird.y - bird.targetY) > 5) {
        bird.vy += (bird.targetY - bird.y) * 0.01;
      }
      
      // Apply drag
      bird.vx *= 0.95;
      bird.vy *= 0.95;
      
      // Update position
      bird.x += bird.vx;
      bird.y += bird.vy;
      
      // Keep birds in bounds
      if (bird.x < 0) {
        bird.x = window.innerWidth;
      } else if (bird.x > window.innerWidth) {
        bird.x = 0;
      }
      
      bird.y = Math.max(30, Math.min(window.innerHeight - 100, bird.y));
      
      // Update DOM position
      bird.element.style.left = `${bird.x}px`;
      bird.element.style.top = `${bird.y}px`;
      
      // Happiness affects appearance
      const happinessEmoji = bird.happiness > 0.7 ? '🐦✨' : bird.happiness > 0.3 ? '🐦' : '🐦💨';
      bird.element.textContent = happinessEmoji;
    });
  }

  /**
   * Render scene
   */
  render(context) {
    // Wind Valley uses DOM and canvas rendering
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
      case 'wind':
        this.createWind(0.7);
        break;
    }
  }

  handleClick(data) {}
  handleMove(data) {}
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
    delete window.windValley;
    
    console.log('🧹 Wind Valley scene destroyed');
  }
}