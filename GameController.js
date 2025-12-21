/**
 * GameController - Main game controller for unified Top Rug game
 * Orchestrates GameEngine, UIManager, and mode systems
 */
class GameController {
  constructor() {
    this.gameEngine = null;
    this.uiManager = null;
    this.audioManager = null;
    this.textureManager = null;
    this.modeController = null;
    this.storageManager = null;
    this.currentMode = null;

    this.isInitialized = false;
    this.isRunning = false;

    console.log('[GameController] Initialized');
  }

  /**
   * Initialize the game controller and all systems
   */
  async init() {
    if (this.isInitialized) {
      console.log('[GameController] Already initialized');
      return;
    }

    console.log('[GameController] Starting initialization...');

    try {
      // Initialize core systems
      await this.initCoreSystems();

      // Initialize UI system
      await this.initUISystem();

      // Initialize game engine
      await this.initGameEngine();

      // Initialize mode controller
      await this.initModeController();

      // Register game modes
      await this.registerGameModes();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('[GameController] Initialization complete');

    } catch (error) {
      console.error('[GameController] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize core systems (Audio, Texture)
   */
  async initCoreSystems() {
    console.log('[GameController] Initializing core systems...');

    // Initialize AudioManager
    let AudioManager;
    if (typeof require !== 'undefined') {
      AudioManager = require('./core/audio/AudioManager.js');
    } else {
      AudioManager = window.AudioManager;
    }

    if (!AudioManager) {
      throw new Error('AudioManager not found');
    }

    this.audioManager = new AudioManager();
    console.log('[GameController] AudioManager created');

    // Initialize TextureManager
    let TextureManager;
    if (typeof require !== 'undefined') {
      TextureManager = require('./core/assets/TextureManager.js');
    } else {
      TextureManager = window.TextureManager;
    }

    if (!TextureManager) {
      throw new Error('TextureManager not found');
    }

    this.textureManager = new TextureManager();
    console.log('[GameController] TextureManager created');

    // Initialize StorageManager
    let StorageManager;
    if (typeof require !== 'undefined') {
      const storageModule = require('./core/StorageManager.js');
      StorageManager = storageModule.StorageManager;
    } else {
      StorageManager = window.StorageManager;
    }

    if (StorageManager) {
      this.storageManager = new StorageManager();
      console.log('[GameController] StorageManager created');
    } else {
      console.warn('[GameController] StorageManager not available');
    }
  }

  /**
   * Initialize UI system
   */
  async initUISystem() {
    console.log('[GameController] Initializing UI system...');

    let UIManager;
    if (typeof require !== 'undefined') {
      UIManager = require('./core/ui/UIManager.js');
    } else {
      UIManager = window.UIManager;
    }

    if (!UIManager) {
      throw new Error('UIManager not found');
    }

    this.uiManager = new UIManager();
    this.uiManager.init();
    console.log('[GameController] UIManager created');
  }

  /**
   * Initialize game engine with core systems
   */
  async initGameEngine() {
    console.log('[GameController] Initializing game engine...');

    let GameEngine;
    if (typeof require !== 'undefined') {
      GameEngine = require('./core/engine/GameEngine.js');
    } else {
      GameEngine = window.GameEngine;
    }

    if (!GameEngine) {
      throw new Error('GameEngine not found');
    }

    this.gameEngine = new GameEngine();
    await this.gameEngine.init('gameHolder');

    // Connect core systems to game engine
    this.gameEngine.setAudioManager(this.audioManager);
    this.gameEngine.setUIManager(this.uiManager);
    this.gameEngine.setTextureManager(this.textureManager);

    console.log('[GameController] GameEngine initialized with core systems');
  }

  /**
   * Initialize mode controller
   */
  async initModeController() {
    console.log('[GameController] Initializing mode controller...');

    let ModeController;
    if (typeof require !== 'undefined') {
      ModeController = require('./core/ModeController.js');
    } else {
      ModeController = window.ModeController;
    }

    if (!ModeController) {
      throw new Error('ModeController not found');
    }

    this.modeController = new ModeController(this);
    console.log('[GameController] ModeController initialized');
  }

  /**
   * Register available game modes
   */
  async registerGameModes() {
    console.log('[GameController] Registering game modes...');

    // Register Classic mode
    let ClassicGame;
    if (typeof require !== 'undefined') {
      ClassicGame = require('./modes/classic/ClassicGame.js');
    } else {
      ClassicGame = window.ClassicGame;
    }

    if (ClassicGame) {
      const classicGame = new ClassicGame(this.gameEngine, this.audioManager, this.textureManager, this.uiManager);
      this.gameEngine.registerModeSystem('classic', 'game', classicGame);
      console.log('[GameController] Classic mode registered');
    } else {
      console.warn('[GameController] ClassicGame not found, skipping registration');
    }

    // Register Combat mode
    let CombatGame;
    if (typeof require !== 'undefined') {
      CombatGame = require('./modes/combat/CombatGame.js');
    } else {
      CombatGame = window.CombatGame;
    }

    if (CombatGame) {
      const combatGame = new CombatGame(this.gameEngine, this.audioManager, this.textureManager, this.uiManager);
      this.gameEngine.registerModeSystem('combat', 'game', combatGame);
      console.log('[GameController] Combat mode registered');
    } else {
      console.warn('[GameController] CombatGame not available, skipping registration');
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    console.log('[GameController] Setting up event listeners...');

    // Global mode switch handler
    window.onModeSwitch = (targetMode) => {
      this.switchMode(targetMode);
    };

    // Button click handlers for mode selection
    const classicButton = document.querySelector('[data-mode="classic"]');
    const combatButton = document.querySelector('[data-mode="combat"]');

    if (classicButton) {
      classicButton.addEventListener('click', () => {
        console.log('[GameController] Classic mode button clicked');
        this.selectMode('classic');
      });
    }

    if (combatButton) {
      combatButton.addEventListener('click', () => {
        console.log('[GameController] Combat mode button clicked');
        this.selectMode('combat');
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        this.cycleMode();
      }
    });

    // Window resize handler
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });

    console.log('[GameController] Event listeners set up');
  }

  /**
   * Start the game in the specified mode
   */
  async start(mode = 'classic') {
    if (!this.isInitialized) {
      throw new Error('GameController not initialized');
    }

    if (this.isRunning) {
      console.log('[GameController] Game already running');
      return;
    }

    console.log(`[GameController] Starting game in mode: ${mode}`);

    try {
      // Switch to the requested mode
      await this.switchMode(mode);

      // Start the game engine
      this.gameEngine.start();
      this.isRunning = true;

      // Hide mode selector and show game
      this.uiManager.hideModeSelector();
      this.uiManager.showGame();

      // Show mode switch toggle
      this.showModeSwitchToggle();

      console.log(`[GameController] Game started successfully in ${mode} mode`);

    } catch (error) {
      console.error('[GameController] Failed to start game:', error);
      throw error;
    }
  }

  /**
   * Select and start a game mode
   */
  async selectMode(modeName) {
    console.log(`[GameController] Selecting mode: ${modeName}`);

    if (!this.isInitialized) {
      console.error('[GameController] Not initialized yet');
      return;
    }

    try {
      // Hide mode selector
      const modeSelector = document.getElementById('gameModeSelector');
      if (modeSelector) {
        modeSelector.style.display = 'none';
      }

      // Show game container
      const gameContainer = document.getElementById('gameHolder');
      if (gameContainer) {
        gameContainer.style.display = 'block';
      }

      // Start the game in the selected mode
      await this.start(modeName);

      console.log(`[GameController] Successfully started ${modeName} mode`);

    } catch (error) {
      console.error(`[GameController] Failed to start ${modeName} mode:`, error);
    }
  }

  /**
   * Cycle between available modes
   */
  cycleMode() {
    const modes = ['classic', 'combat'];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    console.log(`[GameController] Cycling from ${this.currentMode} to ${nextMode}`);
    this.selectMode(nextMode);
  }

  /**
   * Switch to a different game mode
   */
  async switchMode(mode, options = {}) {
    console.log(`[GameController] Switching to mode: ${mode}`);

    if (!this.modeController) {
      throw new Error('ModeController not initialized');
    }

    // Use the ModeController for seamless switching
    const success = await this.modeController.switchMode(mode, options);

    if (success) {
      this.currentMode = mode;
      console.log(`[GameController] Successfully switched to ${mode} mode`);
    } else {
      throw new Error(`Failed to switch to ${mode} mode`);
    }
  }

  /**
   * Stop the game
   */
  stop() {
    console.log('[GameController] Stopping game');

    if (this.gameEngine) {
      this.gameEngine.stop();
    }

    this.isRunning = false;
    this.currentMode = null;

    // Hide mode switch toggle
    this.hideModeSwitchToggle();
  }

  /**
   * Show the mode switch toggle button
   */
  showModeSwitchToggle() {
    const toggle = document.getElementById('modeSwitchToggle');
    if (toggle) {
      toggle.style.display = 'block';
    }
  }

  /**
   * Hide the mode switch toggle button
   */
  hideModeSwitchToggle() {
    const toggle = document.getElementById('modeSwitchToggle');
    if (toggle) {
      toggle.style.display = 'none';
    }
  }

  // ===== STORAGE MANAGEMENT =====

  /**
   * Save high score for current mode
   */
  saveHighScore(score, level = 1) {
    if (this.storageManager && this.currentMode) {
      const isNewRecord = this.storageManager.saveHighScore(this.currentMode, score, level);
      if (isNewRecord) {
        console.log(`[GameController] New high score for ${this.currentMode}: ${score}`);
      }
      return isNewRecord;
    }
    return false;
  }

  /**
   * Get high score for a mode
   */
  getHighScore(mode = null) {
    const targetMode = mode || this.currentMode;
    if (this.storageManager && targetMode) {
      return this.storageManager.getHighScore(targetMode);
    }
    return { score: 0, level: 1 };
  }

  /**
   * Save game settings
   */
  saveSettings(settings) {
    if (this.storageManager) {
      return this.storageManager.saveSettings(settings);
    }
    return false;
  }

  /**
   * Load game settings
   */
  loadSettings() {
    if (this.storageManager) {
      return this.storageManager.loadSettings();
    }
    return {};
  }

  /**
   * Update game statistics
   */
  updateStats(stats) {
    if (this.storageManager) {
      return this.storageManager.updateStats(stats);
    }
    return false;
  }

  /**
   * Get game statistics
   */
  getStats() {
    if (this.storageManager) {
      return this.storageManager.loadStats();
    }
    return {};
  }

  /**
   * Clear all saved data
   */
  clearAllData() {
    if (this.storageManager) {
      this.storageManager.clear();
      console.log('[GameController] All saved data cleared');
      return true;
    }
    return false;
  }

  /**
   * Export all game data
   */
  exportData() {
    if (this.storageManager) {
      return this.storageManager.exportData();
    }
    return null;
  }

  /**
   * Import game data
   */
  importData(data) {
    if (this.storageManager) {
      return this.storageManager.importData(data);
    }
    return false;
  }

  /**
   * Get storage information
   */
  getStorageInfo() {
    if (this.storageManager) {
      return this.storageManager.getStorageInfo();
    }
    return { available: false };
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    console.log('[GameController] Handling window resize');

    // Notify current mode system of resize
    if (this.currentMode && this.gameEngine) {
      const modeSystem = this.gameEngine.getModeSystem(this.currentMode, 'game');
      if (modeSystem && typeof modeSystem.handleWindowResize === 'function') {
        modeSystem.handleWindowResize();
      }
    }
  }

  /**
   * Get current game state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      currentMode: this.currentMode,
      availableModes: this.gameEngine ? Object.keys(this.gameEngine.modeSystems) : [],
      engineState: this.gameEngine ? this.gameEngine.getState() : null
    };
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('[GameController] Disposing resources');

    // Stop game if running
    this.stop();

    // Dispose game engine
    if (this.gameEngine) {
      // Note: GameEngine dispose method would need to be implemented
      this.gameEngine = null;
    }

    // Clear references
    this.uiManager = null;
    this.audioManager = null;
    this.textureManager = null;
    this.currentMode = null;
    this.isInitialized = false;
    this.isRunning = false;
  }
}

// Global game controller instance
let gameControllerInstance = null;

/**
 * Get or create the global game controller
 */
function getGameController() {
  if (!gameControllerInstance) {
    gameControllerInstance = new GameController();
  }
  return gameControllerInstance;
}

/**
 * Initialize the game
 */
async function initGame(mode = 'classic') {
  const controller = getGameController();
  await controller.init();
  await controller.start(mode);
  return controller;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameController, getGameController, initGame };
} else if (typeof window !== 'undefined') {
  window.GameController = GameController;
  window.getGameController = getGameController;
  window.initGame = initGame;

  // Auto-initialize when window is fully loaded (all scripts loaded)
  if (document.readyState === 'complete') {
    initializeGame();
  } else {
    window.addEventListener('load', initializeGame);
  }

  async function initializeGame() {
    console.log('[GameController] DOM ready, initializing unified game...');
    console.log('[GameController] Checking global objects...');
    console.log('window.AudioManager:', typeof window.AudioManager);
    console.log('window.GameEngine:', typeof window.GameEngine);
    console.log('window.UIManager:', typeof window.UIManager);
    console.log('window.TextureManager:', typeof window.TextureManager);
    console.log('window.StorageManager:', typeof window.StorageManager);
    console.log('window.ModeController:', typeof window.ModeController);
    console.log('window.ClassicGame:', typeof window.ClassicGame);
    console.log('window.CombatGame:', typeof window.CombatGame);

    try {
      const controller = getGameController();
      await controller.init();
      console.log('[GameController] Unified game initialization complete. Ready to play!');
    } catch (error) {
      console.error('[GameController] Failed to initialize unified game:', error);

      // Show user-friendly error
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 10000;
        max-width: 400px;
      `;
      errorDiv.innerHTML = `
        <h2>🚫 Game Failed to Load</h2>
        <p>${error.message}</p>
        <p>Check browser console for details.</p>
        <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: white; color: red; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
      `;
      document.body.appendChild(errorDiv);
    }
  }
}
