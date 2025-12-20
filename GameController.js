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
    await this.gameEngine.init();

    // Connect core systems to game engine
    this.gameEngine.setAudioManager(this.audioManager);
    this.gameEngine.setUIManager(this.uiManager);
    this.gameEngine.setTextureManager(this.textureManager);

    console.log('[GameController] GameEngine initialized with core systems');
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

    // TODO: Register Combat mode when it's ready
    // let CombatGame;
    // if (typeof require !== 'undefined') {
    //   CombatGame = require('./modes/combat/CombatGame.js');
    // } else {
    //   CombatGame = window.CombatGame;
    // }
    // if (CombatGame) {
    //   const combatGame = new CombatGame(this.gameEngine, this.audioManager, this.textureManager, this.uiManager);
    //   this.gameEngine.registerModeSystem('combat', 'game', combatGame);
    //   console.log('[GameController] Combat mode registered');
    // }
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

      console.log(`[GameController] Game started successfully in ${mode} mode`);

    } catch (error) {
      console.error('[GameController] Failed to start game:', error);
      throw error;
    }
  }

  /**
   * Switch to a different game mode
   */
  async switchMode(mode) {
    console.log(`[GameController] Switching to mode: ${mode}`);

    if (this.currentMode === mode) {
      console.log('[GameController] Already in requested mode');
      return;
    }

    try {
      // Switch mode in game engine
      await this.gameEngine.switchMode(mode);
      this.currentMode = mode;

      console.log(`[GameController] Successfully switched to ${mode} mode`);

    } catch (error) {
      console.error(`[GameController] Failed to switch to ${mode} mode:`, error);
      throw error;
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
}
