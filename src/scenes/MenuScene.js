/**
 * Main menu scene for GazeQuest Adventures
 * Entry point with accessibility features and input method selection
 */

export default class MenuScene {
  constructor() {
    this.name = 'menu';
    this.description = 'Main menu with accessibility options';
    this.gameEngine = null;
    this.isActive = false;
    
    // UI elements
    this.menuItems = [];
    this.currentSelection = 0;
    this.backgroundElements = [];
    
    // Animation
    this.animationTime = 0;
    this.particles = [];
    
    // Layout
    this.layout = {
      centerX: 0,
      centerY: 0,
      buttonWidth: 300,
      buttonHeight: 60,
      buttonSpacing: 80
    };
  }

  /**
   * Initialize menu scene
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    
    // Create UI elements
    this.createUI();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('📄 Menu scene initialized');
  }

  /**
   * Create UI elements
   */
  createUI() {
    this.createMainMenu();
  }

  /**
   * Create main menu buttons
   */
  createMainMenu() {
    const gameContainer = document.getElementById('main-content');
    if (!gameContainer) return;
    
    // Create menu overlay
    const menuOverlay = document.createElement('div');
    menuOverlay.id = 'menu-overlay';
    menuOverlay.className = 'menu-overlay';
    menuOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
      z-index: 100;
    `;
    
    // Create title
    const title = document.createElement('h1');
    title.textContent = '🎯 Click & Score!';
    title.style.cssText = `
      font-size: 4rem;
      color: white;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      margin-bottom: 2rem;
      text-align: center;
      font-family: var(--font-family-game);
    `;
    menuOverlay.appendChild(title);
    
    // Create subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Simple & Fun Game for Everyone';
    subtitle.style.cssText = `
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 3rem;
      text-align: center;
    `;
    menuOverlay.appendChild(subtitle);
    
    // Create menu container
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';
    menuContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    `;
    
    // Create game selection buttons
    const gameButtons = [
      { 
        text: '🎯 Click & Score!', 
        action: 'playGame',
        gameId: 'simple_game',
        description: 'Click the colorful circles to score points - fun and easy for everyone!',
        difficulty: 'Fun & Easy',
        inputMethod: 'Click/Touch'
      }
    ];
    
    
    // Create games section
    const gamesSection = document.createElement('div');
    gamesSection.style.cssText = `
      margin-bottom: 2rem;
    `;
    
    const gamesTitle = document.createElement('h3');
    gamesTitle.textContent = 'Ready to Play?';
    gamesTitle.style.cssText = `
      text-align: center;
      color: #87CEEB;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    `;
    gamesSection.appendChild(gamesTitle);
    
    const gamesGrid = document.createElement('div');
    gamesGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    `;
    
    gameButtons.forEach((buttonData, index) => {
      const button = this.createGameButton(buttonData, index);
      gamesGrid.appendChild(button);
      this.menuItems.push(button);
    });
    
    gamesSection.appendChild(gamesGrid);
    menuContainer.appendChild(gamesSection);
    
    menuOverlay.appendChild(menuContainer);
    gameContainer.appendChild(menuOverlay);
    
    this.menuOverlay = menuOverlay;
  }

  /**
   * Create a game selection button
   */
  createGameButton(buttonData, index) {
    const button = document.createElement('button');
    button.className = 'game-button focusable click-interactive';
    button.setAttribute('data-action', buttonData.action);
    button.setAttribute('data-game-id', buttonData.gameId);
    button.setAttribute('aria-label', `${buttonData.text}. ${buttonData.description}. Difficulty: ${buttonData.difficulty}. Input: ${buttonData.inputMethod}`);
    button.setAttribute('title', buttonData.description);
    
    button.style.cssText = `
      min-height: 150px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: left;
    `;
    
    button.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: 10px;">${buttonData.text.split(' ')[0]}</div>
      <div>
        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 8px;">
          ${buttonData.text.substring(buttonData.text.indexOf(' ') + 1)}
        </div>
        <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 12px;">
          ${buttonData.description}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px;">
            ${buttonData.inputMethod}
          </span>
          <span style="background: rgba(0,255,0,0.3); padding: 4px 8px; border-radius: 12px;">
            ${buttonData.difficulty}
          </span>
        </div>
      </div>
    `;
    
    // Add event listeners
    button.addEventListener('click', () => this.handleMenuAction(buttonData.action, buttonData.gameId));
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleMenuAction(buttonData.action, buttonData.gameId);
      }
    });
    
    // Hover effects
    button.addEventListener('mouseenter', () => this.highlightGameButton(button));
    button.addEventListener('mouseleave', () => this.unhighlightGameButton(button));
    button.addEventListener('focus', () => this.highlightGameButton(button));
    button.addEventListener('blur', () => this.unhighlightGameButton(button));
    
    return button;
  }

  /**
   * Create a menu button
   */
  createMenuButton(buttonData, index) {
    const button = document.createElement('button');
    button.className = 'menu-button focusable gaze-interactive';
    button.setAttribute('data-action', buttonData.action);
    button.setAttribute('aria-label', `${buttonData.text}. ${buttonData.description}`);
    button.setAttribute('title', buttonData.description);
    
    button.style.cssText = `
      width: 400px;
      height: 60px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 30px;
      color: white;
      font-size: 1.2rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    `;
    
    // Button text
    const buttonText = document.createElement('span');
    buttonText.textContent = buttonData.text;
    buttonText.style.cssText = `
      position: relative;
      z-index: 2;
    `;
    button.appendChild(buttonText);
    
    // Hover effect background
    const hoverBg = document.createElement('div');
    hoverBg.className = 'button-hover-bg';
    hoverBg.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.3s ease;
      z-index: 1;
    `;
    button.appendChild(hoverBg);
    
    // Add event listeners
    button.addEventListener('click', () => this.handleMenuAction(buttonData.action));
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleMenuAction(buttonData.action);
      }
    });
    
    // Hover effects
    button.addEventListener('mouseenter', () => this.highlightButton(button));
    button.addEventListener('mouseleave', () => this.unhighlightButton(button));
    button.addEventListener('focus', () => this.highlightButton(button));
    button.addEventListener('blur', () => this.unhighlightButton(button));
    
    return button;
  }


  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for input manager events
    if (this.gameEngine.inputManager) {
      this.gameEngine.inputManager.on('input', (data) => {
        this.handleInput(data);
      });
    }
    
    // Listen for keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (this.isActive) {
        this.handleKeyboardNavigation(e);
      }
    });
  }

  /**
   * Handle input events
   */
  handleInput(inputData) {
    switch (inputData.action) {
      case 'select':
        if (inputData.data && inputData.data.element) {
          const action = inputData.data.element.getAttribute('data-action');
          if (action) {
            this.handleMenuAction(action);
          }
        }
        break;
      case 'move':
        this.handleNavigation(inputData.data);
        break;
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNavigation(event) {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.navigateUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.navigateDown();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.activateCurrentSelection();
        break;
    }
  }

  /**
   * Navigate up in menu
   */
  navigateUp() {
    if (this.currentSelection > 0) {
      this.currentSelection--;
      this.updateSelection();
    }
  }

  /**
   * Navigate down in menu
   */
  navigateDown() {
    if (this.currentSelection < this.menuItems.length - 1) {
      this.currentSelection++;
      this.updateSelection();
    }
  }

  /**
   * Update visual selection
   */
  updateSelection() {
    this.menuItems.forEach((item, index) => {
      if (index === this.currentSelection) {
        item.focus();
        this.highlightButton(item);
      } else {
        this.unhighlightButton(item);
      }
    });
  }

  /**
   * Activate current selection
   */
  activateCurrentSelection() {
    if (this.menuItems[this.currentSelection]) {
      const action = this.menuItems[this.currentSelection].getAttribute('data-action');
      this.handleMenuAction(action);
    }
  }

  /**
   * Highlight button
   */
  highlightButton(button) {
    button.style.background = 'rgba(255, 255, 255, 0.2)';
    button.style.borderColor = 'rgba(255, 255, 255, 0.6)';
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    
    const hoverBg = button.querySelector('.button-hover-bg');
    if (hoverBg) {
      hoverBg.style.left = '0%';
    }
  }

  /**
   * Unhighlight button
   */
  unhighlightButton(button) {
    button.style.background = 'rgba(255, 255, 255, 0.1)';
    button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = 'none';
    
    const hoverBg = button.querySelector('.button-hover-bg');
    if (hoverBg) {
      hoverBg.style.left = '-100%';
    }
  }

  /**
   * Highlight game button
   */
  highlightGameButton(button) {
    button.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))';
    button.style.borderColor = 'rgba(255, 255, 255, 0.6)';
    button.style.transform = 'translateY(-5px) scale(1.02)';
    button.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
  }

  /**
   * Unhighlight game button
   */
  unhighlightGameButton(button) {
    button.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
    button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    button.style.transform = 'translateY(0) scale(1)';
    button.style.boxShadow = 'none';
  }

  /**
   * Handle menu actions
   */
  handleMenuAction(action, gameId = null) {
    console.log(`Menu action: ${action}`, gameId ? `Game: ${gameId}` : '');
    
    // Play click sound
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('click');
    }
    
    // Announce action
    if (this.gameEngine.accessibilityManager) {
      const actionText = gameId ? `Starting ${gameId.replace('_', ' ')}` : action.replace(/([A-Z])/g, ' $1').toLowerCase();
      this.gameEngine.accessibilityManager.announce(`Selected ${actionText}`);
    }
    
    switch (action) {
      case 'playGame':
        if (gameId) {
          this.selectRealm(gameId);
        }
        break;
      case 'startGame':
        this.startGame();
        break;
      case 'showTutorial':
        this.showTutorial();
        break;
      case 'showAccessibilitySettings':
        this.showAccessibilitySettings();
        break;
      case 'showInputMethods':
        this.showInputMethodDialog();
        break;
      case 'showAbout':
        this.showAbout();
        break;
    }
  }

  /**
   * Start the game
   */
  async startGame() {
    // Check if user has completed tutorial
    const gameState = this.gameEngine.getState();
    
    if (gameState.level === 1 && gameState.achievements.length === 0) {
      // First time player - suggest tutorial
      const tutorial = confirm('This appears to be your first time playing. Would you like to start with the tutorial?');
      if (tutorial) {
        await this.gameEngine.sceneManager.transitionTo('tutorial');
        return;
      }
    }
    
    // Show realm selection menu
    this.showRealmSelection();
  }

  /**
   * Show realm selection
   */
  showRealmSelection() {
    const gameState = this.gameEngine.getState();
    const unlockedRealms = gameState.unlockedRealms || ['crystal_caves'];
    
    // Create realm selection dialog
    const realmDialog = document.createElement('div');
    realmDialog.className = 'realm-dialog';
    realmDialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      border-radius: 20px;
      padding: 30px;
      color: white;
      z-index: 1000;
      min-width: 600px;
      max-width: 80vw;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    
    // Title
    const title = document.createElement('h2');
    title.textContent = 'Choose Your Adventure Realm';
    title.style.cssText = `
      text-align: center;
      margin-bottom: 30px;
      color: #87CEEB;
      font-size: 2rem;
    `;
    realmDialog.appendChild(title);
    
    // Realm options
    const realms = [
      {
        id: 'crystal_caves',
        name: '🔮 Crystal Caves',
        description: 'Mouse clicking adventure in mystical crystal caverns',
        inputMethod: 'Mouse Clicking',
        difficulty: 'Beginner'
      },
      {
        id: 'wind_valley',
        name: '🌬️ Wind Valley',
        description: 'Voice and breath controlled wind manipulation',
        inputMethod: 'Voice/Breath',
        difficulty: 'Intermediate'
      },
      {
        id: 'motion_mountains',
        name: '⛰️ Motion Mountains',
        description: 'Device tilt platformer with physics challenges',
        inputMethod: 'Device Tilt',
        difficulty: 'Intermediate'
      },
      {
        id: 'switch_sanctuary',
        name: '🔘 Switch Sanctuary',
        description: 'Peaceful single-switch zen activities',
        inputMethod: 'Single Switch',
        difficulty: 'Relaxing'
      }
    ];
    
    const realmContainer = document.createElement('div');
    realmContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    `;
    
    realms.forEach(realm => {
      const isUnlocked = unlockedRealms.includes(realm.id);
      
      const realmCard = document.createElement('div');
      realmCard.className = 'realm-card';
      realmCard.style.cssText = `
        background: ${isUnlocked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 100, 100, 0.1)'};
        border: 2px solid ${isUnlocked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(100, 100, 100, 0.3)'};
        border-radius: 15px;
        padding: 20px;
        cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
        transition: all 0.3s ease;
        opacity: ${isUnlocked ? '1' : '0.6'};
      `;
      
      if (isUnlocked) {
        realmCard.addEventListener('click', () => {
          this.selectRealm(realm.id);
          document.body.removeChild(realmDialog);
        });
        
        realmCard.addEventListener('mouseenter', () => {
          realmCard.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          realmCard.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        realmCard.addEventListener('mouseleave', () => {
          realmCard.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          realmCard.style.background = 'rgba(255, 255, 255, 0.1)';
        });
      }
      
      const realmTitle = document.createElement('h3');
      realmTitle.textContent = realm.name;
      realmTitle.style.cssText = `
        margin: 0 0 10px 0;
        color: ${isUnlocked ? '#87CEEB' : '#999'};
        font-size: 1.3rem;
      `;
      
      const realmDesc = document.createElement('p');
      realmDesc.textContent = realm.description;
      realmDesc.style.cssText = `
        margin: 0 0 15px 0;
        font-size: 0.9rem;
        line-height: 1.4;
        color: ${isUnlocked ? '#ccc' : '#999'};
      `;
      
      const realmInfo = document.createElement('div');
      realmInfo.style.cssText = `
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        color: ${isUnlocked ? '#aaa' : '#777'};
      `;
      
      const inputInfo = document.createElement('span');
      inputInfo.textContent = `Input: ${realm.inputMethod}`;
      
      const difficultyInfo = document.createElement('span');
      difficultyInfo.textContent = realm.difficulty;
      
      realmInfo.appendChild(inputInfo);
      realmInfo.appendChild(difficultyInfo);
      
      if (!isUnlocked) {
        const lockIcon = document.createElement('div');
        lockIcon.textContent = '🔒 Locked';
        lockIcon.style.cssText = `
          text-align: center;
          margin-top: 10px;
          font-weight: bold;
          color: #999;
        `;
        realmCard.appendChild(lockIcon);
      }
      
      realmCard.appendChild(realmTitle);
      realmCard.appendChild(realmDesc);
      realmCard.appendChild(realmInfo);
      
      realmContainer.appendChild(realmCard);
    });
    
    realmDialog.appendChild(realmContainer);
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Back to Menu';
    closeButton.style.cssText = `
      display: block;
      margin: 0 auto;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 25px;
      color: white;
      cursor: pointer;
      font-size: 1rem;
    `;
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(realmDialog);
    });
    
    realmDialog.appendChild(closeButton);
    
    // Add to document
    document.body.appendChild(realmDialog);
    
    // Accessibility announcement
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Realm selection opened. ${unlockedRealms.length} realms available.`);
    }
  }

  /**
   * Select a realm to play
   */
  async selectRealm(realmId) {
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Starting ${realmId.replace('_', ' ')} realm`);
    }
    
    await this.gameEngine.sceneManager.transitionTo(realmId);
  }

  /**
   * Show tutorial
   */
  async showTutorial() {
    await this.gameEngine.sceneManager.transitionTo('tutorial');
  }

  /**
   * Show accessibility settings
   */
  showAccessibilitySettings() {
    // Create accessibility settings dialog
    this.gameEngine.accessibilityManager.announce('Accessibility settings dialog opened');
    
    // For now, just show an alert - would be replaced with full settings UI
    alert('Accessibility settings dialog would open here. Use the quick toggles for now.');
  }

  /**
   * Show input method dialog
   */
  showInputMethodDialog() {
    const capabilities = this.gameEngine.inputManager.getCapabilities();
    const availableMethods = Object.keys(capabilities).filter(method => capabilities[method].available);
    const currentMethod = this.gameEngine.inputManager.getPrimaryInputMethod();
    
    // Create input method selection dialog
    const dialog = document.createElement('div');
    dialog.className = 'input-method-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      border-radius: 20px;
      padding: 30px;
      color: white;
      z-index: 1000;
      min-width: 500px;
      max-width: 80vw;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.2);
    `;
    
    // Title
    const title = document.createElement('h2');
    title.textContent = '🎮 Select Input Method';
    title.style.cssText = `
      text-align: center;
      margin-bottom: 20px;
      color: #87CEEB;
      font-size: 1.8rem;
    `;
    dialog.appendChild(title);
    
    // Current method display
    const currentDisplay = document.createElement('div');
    currentDisplay.style.cssText = `
      text-align: center;
      margin-bottom: 20px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      border-left: 4px solid #4CAF50;
    `;
    currentDisplay.innerHTML = `
      <strong>Current Method:</strong> ${this.gameEngine.inputManager.getInputMethodDisplayName(currentMethod)}
    `;
    dialog.appendChild(currentDisplay);
    
    // Method options
    const methodContainer = document.createElement('div');
    methodContainer.style.cssText = `
      display: grid;
      gap: 15px;
      margin-bottom: 20px;
    `;
    
    const methodDescriptions = {
      keyboard: 'Standard keyboard and mouse controls - reliable and precise',
      eyeTracking: 'Look where you want to interact - requires camera',
      voice: 'Speak commands to control the game - requires microphone',
      breath: 'Control using breath patterns - requires microphone',
      orientation: 'Tilt your device to control movement',
      switch: 'Single button scanning interface - great for limited mobility'
    };
    
    availableMethods.forEach(method => {
      const methodCard = document.createElement('div');
      const methodData = capabilities[method];
      const isActive = method === currentMethod;
      
      methodCard.className = 'method-card';
      methodCard.style.cssText = `
        background: ${isActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
        border: 2px solid ${isActive ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)'};
        border-radius: 15px;
        padding: 20px;
        cursor: ${method === currentMethod ? 'default' : 'pointer'};
        transition: all 0.3s ease;
        position: relative;
      `;
      
      if (method !== currentMethod) {
        methodCard.addEventListener('click', () => {
          this.switchToInputMethod(method);
          document.body.removeChild(dialog);
        });
        
        methodCard.addEventListener('mouseenter', () => {
          methodCard.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          methodCard.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        methodCard.addEventListener('mouseleave', () => {
          methodCard.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          methodCard.style.background = 'rgba(255, 255, 255, 0.1)';
        });
      }
      
      const methodTitle = document.createElement('h3');
      methodTitle.textContent = this.gameEngine.inputManager.getInputMethodDisplayName(method);
      methodTitle.style.cssText = `
        margin: 0 0 10px 0;
        color: ${isActive ? '#4CAF50' : '#87CEEB'};
        font-size: 1.3rem;
      `;
      
      const methodDesc = document.createElement('p');
      methodDesc.textContent = methodDescriptions[method] || 'Input method for game control';
      methodDesc.style.cssText = `
        margin: 0 0 15px 0;
        font-size: 0.9rem;
        line-height: 1.4;
        color: #ccc;
      `;
      
      const methodStatus = document.createElement('div');
      methodStatus.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
      `;
      
      const statusInfo = document.createElement('span');
      statusInfo.style.color = methodData.calibrated ? '#4CAF50' : '#FFA726';
      statusInfo.textContent = methodData.calibrated ? '✅ Calibrated' : '⚠️ Needs Calibration';
      
      const successRate = document.createElement('span');
      successRate.style.color = '#87CEEB';
      successRate.textContent = `Success: ${Math.round(methodData.successRate * 100)}%`;
      
      methodStatus.appendChild(statusInfo);
      methodStatus.appendChild(successRate);
      
      if (isActive) {
        const activeBadge = document.createElement('div');
        activeBadge.textContent = 'ACTIVE';
        activeBadge.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: bold;
        `;
        methodCard.appendChild(activeBadge);
      }
      
      methodCard.appendChild(methodTitle);
      methodCard.appendChild(methodDesc);
      methodCard.appendChild(methodStatus);
      
      methodContainer.appendChild(methodCard);
    });
    
    dialog.appendChild(methodContainer);
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
      display: block;
      margin: 0 auto;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 25px;
      color: white;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s ease;
    `;
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
      closeButton.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
      closeButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    dialog.appendChild(closeButton);
    
    // Add to document
    document.body.appendChild(dialog);
    
    // Accessibility announcement
    this.gameEngine.accessibilityManager.announce(`Input method selection opened. ${availableMethods.length} methods available. Current method: ${this.gameEngine.inputManager.getInputMethodDisplayName(currentMethod)}`);
  }
  
  /**
   * Switch to a specific input method
   */
  async switchToInputMethod(methodName) {
    try {
      const success = await this.gameEngine.inputManager.setActiveInput(methodName);
      
      if (success) {
        // Update the current method display
        const currentMethodEl = document.getElementById('current-input-method');
        if (currentMethodEl) {
          currentMethodEl.textContent = this.gameEngine.inputManager.getInputMethodDisplayName(methodName);
        }
        
        // Show confirmation
        this.showInputSwitchConfirmation(methodName);
        
        if (this.gameEngine.accessibilityManager) {
          this.gameEngine.accessibilityManager.announce(`Successfully switched to ${this.gameEngine.inputManager.getInputMethodDisplayName(methodName)}`);
        }
      } else {
        this.showInputSwitchError(methodName);
      }
    } catch (error) {
      console.error('Failed to switch input method:', error);
      this.showInputSwitchError(methodName);
    }
  }
  
  /**
   * Show input switch confirmation
   */
  showInputSwitchConfirmation(methodName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      z-index: 1001;
      font-size: 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    notification.innerHTML = `
      <strong>✅ Input Method Changed</strong><br>
      Now using: ${this.gameEngine.inputManager.getInputMethodDisplayName(methodName)}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
  
  /**
   * Show input switch error
   */
  showInputSwitchError(methodName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(244, 67, 54, 0.9);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      z-index: 1001;
      font-size: 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    notification.innerHTML = `
      <strong>❌ Switch Failed</strong><br>
      Could not switch to ${this.gameEngine.inputManager.getInputMethodDisplayName(methodName)}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Show about dialog
   */
  showAbout() {
    const aboutText = `GazeQuest Adventures

An inclusive web-based adventure game designed for children with motor impairments.

Features:
• Eye tracking with WebGazer.js
• Voice command recognition
• Breath-controlled interactions
• Device orientation controls
• Single-switch accessibility
• Full keyboard navigation
• WCAG 2.1 AAA compliance

Developed with accessibility and inclusion at its core.`;

    alert(aboutText);
    this.gameEngine.accessibilityManager.announce('About dialog opened');
  }

  /**
   * Apply accessibility setting
   */
  applyAccessibilitySetting(setting, value) {
    if (!this.gameEngine.accessibilityManager) return;
    
    switch (setting) {
      case 'highContrast':
        this.gameEngine.accessibilityManager.setHighContrast(value);
        break;
      case 'largeText':
        this.gameEngine.accessibilityManager.setTextSize(value ? 'large' : 'normal');
        break;
      case 'reducedMotion':
        this.gameEngine.accessibilityManager.setReducedMotion(value);
        break;
    }
  }

  /**
   * Activate scene
   */
  async activate() {
    this.isActive = true;
    
    // Show menu overlay
    if (this.menuOverlay) {
      this.menuOverlay.style.display = 'flex';
    }
    
    // Focus first menu item
    if (this.menuItems.length > 0) {
      this.currentSelection = 0;
      this.updateSelection();
    }
    
    // Start background music
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playMusic('menu', { loop: true, fadeIn: 1 });
    }
    
    // Announce scene
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Welcome to GazeQuest Adventures main menu. Use your preferred input method to navigate.');
    }
    
    console.log('📄 Menu scene activated');
  }

  /**
   * Deactivate scene
   */
  deactivate() {
    this.isActive = false;
    
    // Hide menu overlay
    if (this.menuOverlay) {
      this.menuOverlay.style.display = 'none';
    }
    
    // Stop background music
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.stopMusic(0.5);
    }
    
    console.log('📄 Menu scene deactivated');
  }

  /**
   * Update scene
   */
  update(deltaTime) {
    this.animationTime += deltaTime;
    
    // Update background animations
    this.updateBackgroundAnimation();
  }

  /**
   * Update background animation
   */
  updateBackgroundAnimation() {
    // Simple animated background - could be enhanced
    if (this.menuOverlay) {
      const time = this.animationTime * 0.001;
      const hue = (Math.sin(time * 0.5) * 30) + 240;
      this.menuOverlay.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 60%) 0%, hsl(${hue + 20}, 70%, 50%) 100%)`;
    }
  }

  /**
   * Render scene
   */
  render(context) {
    // Canvas rendering if needed
    // For now, everything is DOM-based
  }

  /**
   * Handle resize
   */
  handleResize(width, height) {
    this.layout.centerX = width / 2;
    this.layout.centerY = height / 2;
    
    // Update UI layout if needed
  }

  /**
   * Handle clicks
   */
  handleClick(data) {
    // Handle canvas clicks if needed
    console.log('Menu scene click:', data);
  }

  /**
   * Handle moves
   */
  handleMove(data) {
    // Handle movement/hover if needed
  }

  /**
   * Handle commands
   */
  handleCommand(data) {
    switch (data.command) {
      case 'menu':
        // Already in menu
        break;
      case 'help':
        this.showAbout();
        break;
    }
  }

  /**
   * Pause scene
   */
  pause() {
    this.isActive = false;
  }

  /**
   * Resume scene
   */
  resume() {
    this.isActive = true;
  }

  /**
   * Destroy scene
   */
  destroy() {
    // Remove menu overlay
    if (this.menuOverlay && this.menuOverlay.parentNode) {
      this.menuOverlay.parentNode.removeChild(this.menuOverlay);
    }
    
    console.log('🧹 Menu scene destroyed');
  }
}