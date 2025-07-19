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
    this.createInputMethodSelector();
    this.createAccessibilityControls();
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
    title.textContent = 'GazeQuest Adventures';
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
    subtitle.textContent = 'Inclusive Gaming for Everyone';
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
    
    // Create menu buttons
    const menuButtons = [
      { 
        text: 'Start Adventure', 
        action: 'startGame',
        description: 'Begin your accessible gaming journey'
      },
      { 
        text: 'Tutorial', 
        action: 'showTutorial',
        description: 'Learn how to play with your preferred input method'
      },
      { 
        text: 'Accessibility Settings', 
        action: 'showAccessibilitySettings',
        description: 'Customize the game for your needs'
      },
      { 
        text: 'Input Methods', 
        action: 'showInputMethods',
        description: 'Choose and calibrate your input method'
      },
      { 
        text: 'About', 
        action: 'showAbout',
        description: 'Learn about GazeQuest Adventures'
      }
    ];
    
    menuButtons.forEach((buttonData, index) => {
      const button = this.createMenuButton(buttonData, index);
      menuContainer.appendChild(button);
      this.menuItems.push(button);
    });
    
    menuOverlay.appendChild(menuContainer);
    gameContainer.appendChild(menuOverlay);
    
    this.menuOverlay = menuOverlay;
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
   * Create input method selector
   */
  createInputMethodSelector() {
    const selector = document.createElement('div');
    selector.id = 'input-method-selector';
    selector.className = 'input-selector';
    selector.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 10px;
      padding: 15px;
      color: white;
      min-width: 200px;
    `;
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Input Method';
    title.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 1rem;
      color: var(--color-accent);
    `;
    selector.appendChild(title);
    
    // Current method display
    const currentMethod = document.createElement('div');
    currentMethod.id = 'current-input-method';
    currentMethod.textContent = 'Keyboard';
    currentMethod.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
    `;
    selector.appendChild(currentMethod);
    
    // Switch button
    const switchButton = document.createElement('button');
    switchButton.textContent = 'Change Method';
    switchButton.className = 'button--small focusable';
    switchButton.addEventListener('click', () => this.showInputMethodDialog());
    selector.appendChild(switchButton);
    
    this.menuOverlay.appendChild(selector);
  }

  /**
   * Create accessibility controls
   */
  createAccessibilityControls() {
    const controls = document.createElement('div');
    controls.id = 'accessibility-quick-controls';
    controls.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 10px;
      padding: 15px;
      color: white;
    `;
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Quick Settings';
    title.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 1rem;
      color: var(--color-accent);
    `;
    controls.appendChild(title);
    
    // High contrast toggle
    const contrastToggle = this.createToggleButton('High Contrast', 'highContrast', false);
    controls.appendChild(contrastToggle);
    
    // Large text toggle
    const textToggle = this.createToggleButton('Large Text', 'largeText', false);
    controls.appendChild(textToggle);
    
    // Reduced motion toggle
    const motionToggle = this.createToggleButton('Reduced Motion', 'reducedMotion', false);
    controls.appendChild(motionToggle);
    
    this.menuOverlay.appendChild(controls);
  }

  /**
   * Create toggle button
   */
  createToggleButton(label, setting, initialValue) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    `;
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      font-size: 0.9rem;
      margin-right: 10px;
    `;
    
    const toggle = document.createElement('button');
    toggle.className = 'toggle-button focusable';
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', initialValue);
    toggle.setAttribute('aria-label', `Toggle ${label}`);
    toggle.style.cssText = `
      width: 40px;
      height: 20px;
      background: ${initialValue ? 'var(--color-success)' : '#666'};
      border: none;
      border-radius: 10px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s ease;
    `;
    
    const slider = document.createElement('div');
    slider.style.cssText = `
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: ${initialValue ? '22px' : '2px'};
      transition: left 0.3s ease;
    `;
    toggle.appendChild(slider);
    
    // Toggle functionality
    let isToggled = initialValue;
    toggle.addEventListener('click', () => {
      isToggled = !isToggled;
      toggle.setAttribute('aria-checked', isToggled);
      toggle.style.background = isToggled ? 'var(--color-success)' : '#666';
      slider.style.left = isToggled ? '22px' : '2px';
      
      // Apply setting
      this.applyAccessibilitySetting(setting, isToggled);
    });
    
    container.appendChild(labelEl);
    container.appendChild(toggle);
    
    return container;
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
   * Handle menu actions
   */
  handleMenuAction(action) {
    console.log(`Menu action: ${action}`);
    
    // Play click sound
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('click');
    }
    
    // Announce action
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Selected ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    }
    
    switch (action) {
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
    
    // Go to first available realm
    const unlockedRealms = gameState.unlockedRealms || ['crystal_caves'];
    await this.gameEngine.sceneManager.transitionTo(unlockedRealms[0]);
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
    
    let methodList = 'Available input methods:\n\n';
    availableMethods.forEach((method, index) => {
      const displayName = this.gameEngine.inputManager.getInputMethodDisplayName(method);
      const status = capabilities[method].active ? ' (Active)' : '';
      methodList += `${index + 1}. ${displayName}${status}\n`;
    });
    
    // For now, use alert - would be replaced with proper dialog
    alert(methodList + '\nUse the Input Methods settings to configure your preferred method.');
    
    this.gameEngine.accessibilityManager.announce('Input method selection dialog opened');
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