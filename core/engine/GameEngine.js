/**
 * GameEngine - Core game management system
 * Integrates SceneManager from Maverick with unified architecture
 */
class GameEngine {
  constructor() {
    this.currentMode = null;
    this.sceneManager = null; // Will be initialized when first mode loads
    this.audioManager = null; // Will be set externally
    this.uiManager = null; // Will be set externally
    this.textureManager = null; // Will be set externally

    // Mode-specific systems (loaded dynamically)
    this.modeSystems = {};

    // Game state
    this.isInitialized = false;
    this.isRunning = false;

    console.log('[GameEngine] Initialized');
  }

  /**
   * Initialize the game engine
   */
  async init(containerId = 'gameHolder') {
    console.log('[GameEngine] init() called with containerId:', containerId);

    if (this.isInitialized) {
      console.warn('[GameEngine] Already initialized');
      return;
    }

    console.log('[GameEngine] Starting initialization...');

    // Get the container
    console.log('[GameEngine] Looking for container:', containerId);
    this.container = document.getElementById(containerId);
    console.log('[GameEngine] Container found:', !!this.container);
    if (!this.container) {
      throw new Error(`Game container not found: ${containerId}`);
    }

    // Initialize Three.js scene, camera, and renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.set(0, 100, 200);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Initialize scene manager
    console.log('[GameEngine] Creating sceneManager...');
    this.sceneManager = {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      add: function(obj) { this.scene.add(obj); },
      remove: function(obj) { this.scene.remove(obj); },
      clear: function() {
        while(this.scene.children.length > 0){
          const object = this.scene.children[0];
          this.scene.remove(object);
        }
      }
    };
    console.log('[GameEngine] sceneManager created:', !!this.sceneManager, 'camera:', !!this.sceneManager.camera);

    // Handle window resize
    window.addEventListener('resize', this.handleWindowResize.bind(this), false);

    // Initialize managers (will be set by the main game controller)
    if (!this.audioManager) {
      console.warn('[GameEngine] No AudioManager set');
    }
    if (!this.uiManager) {
      console.warn('[GameEngine] No UIManager set');
    }
    if (!this.textureManager) {
      console.warn('[GameEngine] No TextureManager set');
    }

    this.isInitialized = true;
    console.log('[GameEngine] Initialization complete - sceneManager:', !!this.sceneManager, 'camera:', !!this.sceneManager.camera);
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  /**
   * Set the audio manager
   */
  setAudioManager(audioManager) {
    this.audioManager = audioManager;
    console.log('[GameEngine] AudioManager set');
  }

  /**
   * Set the UI manager
   */
  setUIManager(uiManager) {
    this.uiManager = uiManager;
    console.log('[GameEngine] UIManager set');
  }

  /**
   * Set the texture manager
   */
  setTextureManager(textureManager) {
    this.textureManager = textureManager;
    console.log('[GameEngine] TextureManager set');
  }

  /**
   * Register a mode-specific system
   */
  registerModeSystem(mode, systemName, systemInstance) {
    if (!this.modeSystems[mode]) {
      this.modeSystems[mode] = {};
    }
    this.modeSystems[mode][systemName] = systemInstance;
    console.log(`[GameEngine] Registered ${systemName} for mode ${mode}`);
  }

  /**
   * Get a mode-specific system
   */
  getModeSystem(mode, systemName) {
    if (!this.modeSystems[mode]) {
      return null;
    }
    return this.modeSystems[mode][systemName] || null;
  }

  /**
   * Switch to a different game mode
   */
  async switchMode(newMode) {
    console.log(`[GameEngine] Switching from ${this.currentMode} to ${newMode}`);

    if (this.currentMode === newMode) {
      console.log('[GameEngine] Already in target mode');
      return;
    }

    // Validate mode exists
    if (!this.modeSystems[newMode]) {
      throw new Error(`[GameEngine] Mode '${newMode}' not registered`);
    }

    // 1. Fade out current mode (if any)
    if (this.currentMode && this.uiManager) {
      await this.uiManager.fadeOutMode(this.currentMode);
    }

    // 2. Save current mode state (if any)
    if (this.currentMode) {
      await this.saveModeState(this.currentMode);
    }

    // 3. Unload current mode systems
    if (this.currentMode) {
      await this.unloadMode(this.currentMode);
    }

    // 4. Load new mode systems
    await this.loadMode(newMode);

    // 5. Configure systems for new mode
    await this.configureMode(newMode);

    // 6. Restore saved state or initialize fresh
    await this.restoreModeState(newMode);

    // 7. Fade in new mode
    if (this.uiManager) {
      await this.uiManager.fadeInMode(newMode);
    }

    this.currentMode = newMode;
    console.log(`[GameEngine] Successfully switched to mode: ${newMode}`);
  }

  /**
   * Load all systems for a mode
   */
  async loadMode(mode) {
    console.log(`[GameEngine] Loading mode: ${mode}`);

    const modeSystems = this.modeSystems[mode];
    if (!modeSystems) {
      throw new Error(`[GameEngine] No systems registered for mode: ${mode}`);
    }

    // Load each system in the mode
    for (const [systemName, system] of Object.entries(modeSystems)) {
      if (system && typeof system.load === 'function') {
        console.log(`[GameEngine] Loading system: ${systemName}`);
        await system.load();
      }
    }

    // Initialize SceneManager if not already done
    if (!this.sceneManager && modeSystems.sceneManager) {
      this.sceneManager = modeSystems.sceneManager;
      console.log('[GameEngine] SceneManager initialized from mode');
    }
  }

  /**
   * Unload all systems for a mode
   */
  async unloadMode(mode) {
    console.log(`[GameEngine] Unloading mode: ${mode}`);

    const modeSystems = this.modeSystems[mode];
    if (!modeSystems) {
      return; // No systems to unload
    }

    // Unload each system in the mode
    for (const [systemName, system] of Object.entries(modeSystems)) {
      if (system && typeof system.unload === 'function') {
        console.log(`[GameEngine] Unloading system: ${systemName}`);
        await system.unload();
      }
    }
  }

  /**
   * Configure systems for a specific mode
   */
  async configureMode(mode) {
    console.log(`[GameEngine] Configuring mode: ${mode}`);

    // Configure audio for mode
    if (this.audioManager && typeof this.audioManager.switchAudioMode === 'function') {
      await this.audioManager.switchAudioMode(mode);
    }

    // Configure UI for mode
    if (this.uiManager) {
      this.uiManager.switchMode(mode);
    }

    // Configure texture system for mode
    if (this.textureManager && typeof this.textureManager.switchMode === 'function') {
      await this.textureManager.switchMode(mode);
    }
  }

  /**
   * Save state for a mode
   */
  async saveModeState(mode) {
    console.log(`[GameEngine] Saving state for mode: ${mode}`);

    const modeSystems = this.modeSystems[mode];
    if (!modeSystems) return;

    const state = {};

    // Save state from each system
    for (const [systemName, system] of Object.entries(modeSystems)) {
      if (system && typeof system.saveState === 'function') {
        state[systemName] = await system.saveState();
      }
    }

    // Store in localStorage
    try {
      localStorage.setItem(`gameState_${mode}`, JSON.stringify(state));
      console.log(`[GameEngine] State saved for mode: ${mode}`);
    } catch (error) {
      console.error('[GameEngine] Failed to save state:', error);
    }
  }

  /**
   * Restore state for a mode
   */
  async restoreModeState(mode) {
    console.log(`[GameEngine] Restoring state for mode: ${mode}`);

    const modeSystems = this.modeSystems[mode];
    if (!modeSystems) return;

    // Load from localStorage
    let state = {};
    try {
      const savedState = localStorage.getItem(`gameState_${mode}`);
      if (savedState) {
        state = JSON.parse(savedState);
        console.log(`[GameEngine] State loaded for mode: ${mode}`);
      }
    } catch (error) {
      console.error('[GameEngine] Failed to load state:', error);
    }

    // Restore state to each system
    for (const [systemName, system] of Object.entries(modeSystems)) {
      if (system && typeof system.loadState === 'function' && state[systemName]) {
        await system.loadState(state[systemName]);
      }
    }
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) {
      console.warn('[GameEngine] Already running');
      return;
    }

    console.log('[GameEngine] Starting game loop');
    this.isRunning = true;
    this.gameLoop();
  }

  /**
   * Stop the game loop
   */
  stop() {
    console.log('[GameEngine] Stopping game loop');
    this.isRunning = false;
  }

  /**
   * Main game loop
   */
  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime || 0;
    this.lastTime = currentTime;

    // Update current mode systems
    this.update(deltaTime);

    // Render
    this.render();

    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update all systems
   */
  update(deltaTime) {
    if (!this.currentMode || !this.modeSystems[this.currentMode]) return;

    const modeSystems = this.modeSystems[this.currentMode];

    // Update each system
    for (const [systemName, system] of Object.entries(modeSystems)) {
      if (system && typeof system.update === 'function') {
        system.update(deltaTime);
      }
    }

    // Update SceneManager if available
    if (this.sceneManager && typeof this.sceneManager.tick === 'function') {
      this.sceneManager.tick(deltaTime);
    }
  }

  /**
   * Render the Three.js scene
   */
  render() {
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Get current game state
   */
  getState() {
    return {
      currentMode: this.currentMode,
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      availableModes: Object.keys(this.modeSystems)
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
} else if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}
