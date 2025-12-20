/**
 * UIManager - Dynamic UI management system for mode switching
 * Handles HUD switching, fade transitions, and UI state management
 */
class UIManager {
  constructor() {
    this.currentMode = null;
    this.hudElements = {};
    this.modeSelectors = {};
    this.isTransitioning = false;

    // UI containers
    this.gameContainer = null;
    this.modeSelectorContainer = null;

    console.log('[UIManager] Initialized');
  }

  /**
   * Initialize the UI manager with DOM containers
   */
  init(gameContainerId = 'gameHolder', modeSelectorId = 'gameModeSelector') {
    this.gameContainer = document.getElementById(gameContainerId);
    this.modeSelectorContainer = document.getElementById(modeSelectorId);

    if (!this.gameContainer) {
      console.warn(`[UIManager] Game container not found: ${gameContainerId}`);
    }
    if (!this.modeSelectorContainer) {
      console.warn(`[UIManager] Mode selector not found: ${modeSelectorId}`);
    }

    console.log('[UIManager] Initialized with containers');
  }

  /**
   * Register a HUD element for a specific mode
   */
  registerHUDElement(mode, elementId, element) {
    if (!this.hudElements[mode]) {
      this.hudElements[mode] = {};
    }
    this.hudElements[mode][elementId] = element;
    console.log(`[UIManager] Registered HUD element ${elementId} for mode ${mode}`);
  }

  /**
   * Register a mode selector button
   */
  registerModeSelector(mode, buttonElement) {
    this.modeSelectors[mode] = buttonElement;
    console.log(`[UIManager] Registered mode selector for ${mode}`);
  }

  /**
   * Switch UI to a different game mode
   */
  async switchMode(newMode) {
    console.log(`[UIManager] Switching UI from ${this.currentMode} to ${newMode}`);

    if (this.isTransitioning) {
      console.warn('[UIManager] Transition already in progress');
      return;
    }

    this.isTransitioning = true;

    try {
      // Fade out current mode UI
      if (this.currentMode) {
        await this.fadeOutMode(this.currentMode);
      }

      // Switch HUD elements
      await this.switchHUD(newMode);

      // Update mode selectors
      this.updateModeSelectors(newMode);

      // Fade in new mode UI
      await this.fadeInMode(newMode);

      this.currentMode = newMode;
      console.log(`[UIManager] UI switched to mode: ${newMode}`);

    } catch (error) {
      console.error('[UIManager] Error during mode switch:', error);
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Switch visible HUD elements for a mode
   */
  async switchHUD(mode) {
    console.log(`[UIManager] Switching HUD to mode: ${mode}`);

    // Hide all HUD elements first
    this.hideAllHUD();

    // Show HUD elements for the target mode
    const modeHUD = this.hudElements[mode];
    if (modeHUD) {
      for (const [elementId, element] of Object.entries(modeHUD)) {
        if (element) {
          if (typeof element.show === 'function') {
            element.show();
          } else if (element.style) {
            element.style.display = 'block';
          }
          console.log(`[UIManager] Showed HUD element: ${elementId}`);
        }
      }
    }
  }

  /**
   * Hide all HUD elements
   */
  hideAllHUD() {
    for (const modeHUD of Object.values(this.hudElements)) {
      for (const [elementId, element] of Object.entries(modeHUD)) {
        if (element) {
          if (typeof element.hide === 'function') {
            element.hide();
          } else if (element.style) {
            element.style.display = 'none';
          }
        }
      }
    }
    console.log('[UIManager] All HUD elements hidden');
  }

  /**
   * Fade out mode UI
   */
  async fadeOutMode(mode) {
    console.log(`[UIManager] Fading out mode: ${mode}`);

    return new Promise((resolve) => {
      // Get mode-specific container
      const modeContainer = this.getModeContainer(mode);
      if (!modeContainer) {
        resolve();
        return;
      }

      // Add fade-out class
      modeContainer.classList.add('fade-out');

      // Wait for transition to complete
      const transitionDuration = this.getTransitionDuration(modeContainer);
      setTimeout(() => {
        modeContainer.classList.remove('fade-out');
        modeContainer.style.display = 'none';
        resolve();
      }, transitionDuration);
    });
  }

  /**
   * Fade in mode UI
   */
  async fadeInMode(mode) {
    console.log(`[UIManager] Fading in mode: ${mode}`);

    return new Promise((resolve) => {
      // Get mode-specific container
      const modeContainer = this.getModeContainer(mode);
      if (!modeContainer) {
        resolve();
        return;
      }

      // Show container
      modeContainer.style.display = 'block';

      // Force reflow
      modeContainer.offsetHeight;

      // Add fade-in class
      modeContainer.classList.add('fade-in');

      // Wait for transition to complete
      const transitionDuration = this.getTransitionDuration(modeContainer);
      setTimeout(() => {
        modeContainer.classList.remove('fade-in');
        resolve();
      }, transitionDuration);
    });
  }

  /**
   * Get mode-specific container
   */
  getModeContainer(mode) {
    // Map mode names to container IDs
    const containerMap = {
      classic: 'gameHolderTopRug1',
      combat: 'gameHolderTopRug2'
    };

    const containerId = containerMap[mode];
    return containerId ? document.getElementById(containerId) : null;
  }

  /**
   * Get transition duration from CSS
   */
  getTransitionDuration(element) {
    if (!element) return 300; // Default 300ms

    const computedStyle = getComputedStyle(element);
    const transitionDuration = computedStyle.transitionDuration ||
                              computedStyle.animationDuration ||
                              '300ms';

    // Parse duration (simple implementation)
    const match = transitionDuration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 300;
  }

  /**
   * Update mode selector buttons
   */
  updateModeSelectors(activeMode) {
    for (const [mode, button] of Object.entries(this.modeSelectors)) {
      if (button) {
        if (mode === activeMode) {
          button.classList.add('active');
          button.disabled = true;
        } else {
          button.classList.remove('active');
          button.disabled = false;
        }
      }
    }
  }

  /**
   * Show mode selector screen
   */
  showModeSelector() {
    if (this.modeSelectorContainer) {
      this.modeSelectorContainer.style.display = 'flex';
    }

    // Hide game container
    if (this.gameContainer) {
      this.gameContainer.style.display = 'none';
    }

    console.log('[UIManager] Mode selector shown');
  }

  /**
   * Hide mode selector screen
   */
  hideModeSelector() {
    if (this.modeSelectorContainer) {
      this.modeSelectorContainer.style.display = 'none';
    }

    console.log('[UIManager] Mode selector hidden');
  }

  /**
   * Show game screen
   */
  showGame() {
    this.hideModeSelector();

    if (this.gameContainer) {
      this.gameContainer.style.display = 'block';
    }

    console.log('[UIManager] Game screen shown');
  }

  /**
   * Get current UI state
   */
  getState() {
    return {
      currentMode: this.currentMode,
      isTransitioning: this.isTransitioning,
      availableModes: Object.keys(this.hudElements),
      visibleHUD: this.currentMode ? Object.keys(this.hudElements[this.currentMode] || {}) : []
    };
  }

  /**
   * Create mode switcher UI (for in-game mode switching)
   */
  createModeSwitcher(container) {
    const switcher = document.createElement('div');
    switcher.id = 'modeSwitcher';
    switcher.className = 'mode-switcher';

    // Create buttons for each available mode
    for (const mode of Object.keys(this.hudElements)) {
      const button = document.createElement('button');
      button.className = 'mode-switch-button';
      button.dataset.mode = mode;
      button.textContent = this.getModeDisplayName(mode);

      button.addEventListener('click', () => {
        this.handleModeSwitch(mode);
      });

      switcher.appendChild(button);
    }

    // Initially hidden
    switcher.style.display = 'none';

    container.appendChild(switcher);
    this.modeSwitcher = switcher;

    console.log('[UIManager] Mode switcher created');
  }

  /**
   * Handle mode switch from UI
   */
  async handleModeSwitch(targetMode) {
    if (this.isTransitioning || targetMode === this.currentMode) {
      return;
    }

    console.log(`[UIManager] Mode switch requested: ${targetMode}`);

    // Emit event for game engine to handle
    if (typeof window.onModeSwitch === 'function') {
      window.onModeSwitch(targetMode);
    }
  }

  /**
   * Show/hide mode switcher
   */
  toggleModeSwitcher(show = null) {
    if (!this.modeSwitcher) return;

    const shouldShow = show !== null ? show : this.modeSwitcher.style.display === 'none';

    this.modeSwitcher.style.display = shouldShow ? 'block' : 'none';

    console.log(`[UIManager] Mode switcher ${shouldShow ? 'shown' : 'hidden'}`);
  }

  /**
   * Get display name for mode
   */
  getModeDisplayName(mode) {
    const names = {
      classic: 'Classic Mode',
      combat: 'Combat Mode'
    };
    return names[mode] || mode;
  }

  /**
   * Add CSS styles for transitions
   */
  addTransitionStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .fade-out {
        opacity: 0;
        transition: opacity 0.3s ease-out;
      }

      .fade-in {
        opacity: 0;
        animation: fadeIn 0.3s ease-in forwards;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .mode-switcher {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .mode-switch-button {
        padding: 10px 15px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: 1px solid #fff;
        border-radius: 5px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        transition: all 0.2s;
      }

      .mode-switch-button:hover {
        background: rgba(255, 255, 255, 0.9);
        color: black;
      }

      .mode-switch-button.active {
        background: #68c3c0;
        color: white;
      }

      .mode-switch-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
    console.log('[UIManager] Transition styles added');
  }

  /**
   * Show UI for a specific mode
   */
  showModeUI(mode) {
    console.log(`[UIManager] Showing UI for mode: ${mode}`);

    // Hide all mode-specific elements first
    this.hideAllModeUI();

    // Show mode-specific elements
    const modeElements = document.querySelectorAll(`[data-mode-ui="${mode}"]`);
    modeElements.forEach(element => {
      element.style.display = 'block';
    });

    // Update current HUD if it exists
    if (this.currentHUD && typeof this.currentHUD.show === 'function') {
      this.currentHUD.show();
    }
  }

  /**
   * Hide UI for a specific mode
   */
  hideModeUI(mode) {
    console.log(`[UIManager] Hiding UI for mode: ${mode}`);

    const modeElements = document.querySelectorAll(`[data-mode-ui="${mode}"]`);
    modeElements.forEach(element => {
      element.style.display = 'none';
    });

    // Hide current HUD if it exists
    if (this.currentHUD && typeof this.currentHUD.hide === 'function') {
      this.currentHUD.hide();
    }
  }

  /**
   * Hide all mode-specific UI elements
   */
  hideAllModeUI() {
    const allModeElements = document.querySelectorAll('[data-mode-ui]');
    allModeElements.forEach(element => {
      element.style.display = 'none';
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
} else if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}
