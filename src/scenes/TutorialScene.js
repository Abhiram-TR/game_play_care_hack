/**
 * Tutorial scene for GazeQuest Adventures
 * Teaches players how to use different input methods
 */

export default class TutorialScene {
  constructor() {
    this.name = 'tutorial';
    this.description = 'Learn how to play with your preferred input method';
    this.gameEngine = null;
    this.isActive = false;
    
    this.currentStep = 0;
    this.tutorialSteps = [];
    this.ui = null;
  }

  /**
   * Initialize tutorial scene
   */
  async init(gameEngine) {
    this.gameEngine = gameEngine;
    this.setupTutorialSteps();
    this.createUI();
    console.log('📚 Tutorial scene initialized');
  }

  /**
   * Set up tutorial steps
   */
  setupTutorialSteps() {
    this.tutorialSteps = [
      {
        title: "Welcome to GazeQuest Adventures!",
        content: "This tutorial will teach you how to play using your preferred input method.",
        action: "continue"
      },
      {
        title: "Keyboard Navigation",
        content: "Use Tab to move between elements, Enter or Space to activate them, and Arrow keys for navigation.",
        action: "practice_keyboard"
      },
      {
        title: "Accessibility Features",
        content: "You can enable high contrast, large text, and reduced motion at any time.",
        action: "show_accessibility"
      },
      {
        title: "Input Methods",
        content: "Choose from eye tracking, voice control, breath control, or switch control based on your needs.",
        action: "show_input_methods"
      },
      {
        title: "Ready to Play!",
        content: "You're all set to begin your adventure. Have fun exploring the accessible realms!",
        action: "complete"
      }
    ];
  }

  /**
   * Create tutorial UI
   */
  createUI() {
    const container = document.getElementById('main-content');
    
    this.ui = document.createElement('div');
    this.ui.id = 'tutorial-overlay';
    this.ui.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 200;
      color: white;
      text-align: center;
      padding: 20px;
    `;
    
    container.appendChild(this.ui);
  }

  /**
   * Activate tutorial scene
   */
  async activate() {
    this.isActive = true;
    this.currentStep = 0;
    
    if (this.ui) {
      this.ui.style.display = 'flex';
    }
    
    this.showCurrentStep();
    
    // Announce tutorial start
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Tutorial started. Learn how to navigate and play GazeQuest Adventures.');
    }
    
    console.log('📚 Tutorial scene activated');
  }

  /**
   * Show current tutorial step
   */
  showCurrentStep() {
    if (!this.ui || this.currentStep >= this.tutorialSteps.length) return;
    
    const step = this.tutorialSteps[this.currentStep];
    
    this.ui.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h1 style="font-size: 3rem; margin-bottom: 2rem;">${step.title}</h1>
        <p style="font-size: 1.5rem; line-height: 1.6; margin-bottom: 3rem;">${step.content}</p>
        
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          ${this.currentStep > 0 ? '<button id="prev-btn" class="tutorial-btn">Previous</button>' : ''}
          ${this.currentStep < this.tutorialSteps.length - 1 ? '<button id="next-btn" class="tutorial-btn">Next</button>' : '<button id="complete-btn" class="tutorial-btn">Start Playing!</button>'}
          <button id="skip-btn" class="tutorial-btn tutorial-btn--secondary">Skip Tutorial</button>
        </div>
        
        <div style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.8;">
          Step ${this.currentStep + 1} of ${this.tutorialSteps.length}
        </div>
      </div>
    `;
    
    // Add button styles
    const style = document.createElement('style');
    style.textContent = `
      .tutorial-btn {
        padding: 12px 24px;
        font-size: 1.1rem;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-radius: 25px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 120px;
      }
      
      .tutorial-btn:hover, .tutorial-btn:focus {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.8);
        transform: translateY(-2px);
        outline: 3px solid #ffbf00;
        outline-offset: 2px;
      }
      
      .tutorial-btn--secondary {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }
    `;
    this.ui.appendChild(style);
    
    // Add event listeners
    this.setupStepEventListeners();
    
    // Focus first button
    const firstBtn = this.ui.querySelector('button');
    if (firstBtn) {
      setTimeout(() => firstBtn.focus(), 100);
    }
    
    // Announce step
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce(`Tutorial step ${this.currentStep + 1}: ${step.title}`);
    }
  }

  /**
   * Set up event listeners for current step
   */
  setupStepEventListeners() {
    const prevBtn = this.ui.querySelector('#prev-btn');
    const nextBtn = this.ui.querySelector('#next-btn');
    const completeBtn = this.ui.querySelector('#complete-btn');
    const skipBtn = this.ui.querySelector('#skip-btn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousStep());
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    
    if (completeBtn) {
      completeBtn.addEventListener('click', () => this.completeTutorial());
    }
    
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipTutorial());
    }
    
    // Keyboard navigation
    this.ui.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (prevBtn) {
            e.preventDefault();
            this.previousStep();
          }
          break;
        case 'ArrowRight':
          if (nextBtn) {
            e.preventDefault();
            this.nextStep();
          } else if (completeBtn) {
            e.preventDefault();
            this.completeTutorial();
          }
          break;
        case 'Escape':
          e.preventDefault();
          this.skipTutorial();
          break;
      }
    });
  }

  /**
   * Go to previous step
   */
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showCurrentStep();
      
      // Play navigation sound
      if (this.gameEngine.audioManager) {
        this.gameEngine.audioManager.playSFX('click');
      }
    }
  }

  /**
   * Go to next step
   */
  nextStep() {
    if (this.currentStep < this.tutorialSteps.length - 1) {
      this.currentStep++;
      this.showCurrentStep();
      
      // Play navigation sound
      if (this.gameEngine.audioManager) {
        this.gameEngine.audioManager.playSFX('click');
      }
    }
  }

  /**
   * Complete tutorial
   */
  async completeTutorial() {
    // Play success sound
    if (this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSFX('success');
    }
    
    // Announce completion
    if (this.gameEngine.accessibilityManager) {
      this.gameEngine.accessibilityManager.announce('Tutorial completed! Starting your adventure.');
    }
    
    // Mark tutorial as completed in game state
    this.gameEngine.stateManager.updateProgress({
      achievements: ['tutorial_completed']
    });
    
    // Transition to first game scene
    await this.gameEngine.sceneManager.transitionTo('crystal_caves');
  }

  /**
   * Skip tutorial
   */
  async skipTutorial() {
    // Confirm skip
    const confirmed = confirm('Are you sure you want to skip the tutorial? You can always access it later from the main menu.');
    
    if (confirmed) {
      // Announce skip
      if (this.gameEngine.accessibilityManager) {
        this.gameEngine.accessibilityManager.announce('Tutorial skipped. Returning to main menu.');
      }
      
      // Return to menu
      await this.gameEngine.sceneManager.transitionTo('menu');
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
    
    console.log('📚 Tutorial scene deactivated');
  }

  /**
   * Update scene
   */
  update(deltaTime) {
    // Tutorial doesn't need frame-by-frame updates
  }

  /**
   * Render scene
   */
  render(context) {
    // Tutorial is DOM-based, no canvas rendering needed
  }

  /**
   * Handle resize
   */
  handleResize(width, height) {
    // Tutorial UI is responsive via CSS
  }

  /**
   * Handle input events
   */
  handleClick(data) {
    // Tutorial uses DOM events
  }

  handleMove(data) {
    // Not needed for tutorial
  }

  handleCommand(data) {
    switch (data.command) {
      case 'menu':
        this.skipTutorial();
        break;
      case 'help':
        // Already in tutorial
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
    if (this.ui && this.ui.parentNode) {
      this.ui.parentNode.removeChild(this.ui);
    }
    
    console.log('🧹 Tutorial scene destroyed');
  }
}