// BaseGame - Shared game logic for both modes
// Handles common gameplay mechanics, UI updates, and state management

(function() {
  'use strict';

  class BaseGame {
    constructor(engine, config = {}) {
      this.engine = engine;
      this.config = {
        mode: config.mode || 'classic',
        ...config
      };

      // Game state
      this.gameState = {
        status: 'playing',
        distance: 0,
        speed: 0.00035,
        initSpeed: 0.00035,
        baseSpeed: 0.00035,
        targetBaseSpeed: 0.00035,
        incrementSpeedByTime: 0.0000025,
        incrementSpeedByLevel: 0.000005,
        distanceForSpeedUpdate: 100,
        speedLastUpdate: 0,
        planeDefaultHeight: 100,
        planeAmpHeight: 80,
        planeAmpWidth: 75,
        planeMoveSensivity: 0.005,
        planeRotZSensivity: 0.0004,
        planeFallSpeed: 0.001,
        planeMinSpeed: 1.2,
        planeMaxSpeed: 1.6,
        planeSpeed: 1.3,
        seaRadius: 600,
        seaLength: 800,
        wavesMinAmp: 5,
        wavesMaxAmp: 20,
        wavesMinSpeed: 0.001,
        wavesMaxSpeed: 0.003,
        cameraFarPos: 500,
        cameraNearPos: 150,
        cameraSensivity: 0.002,
        ...config.gameState
      };

      // UI elements
      this.uiElements = {};

      // Callbacks for mode-specific logic
      this.onGameUpdate = config.onGameUpdate || (() => {});
      this.onCollision = config.onCollision || (() => {});
      this.onScoreUpdate = config.onScoreUpdate || (() => {});

      console.log(`[BaseGame] Initialized for mode: ${this.config.mode}`);
    }

    async init() {
      console.log(`[BaseGame] Initializing ${this.config.mode} mode`);

      // Setup UI element references
      this.setupUIElements();

      // Initialize HUD
      this.initHUD();

      // Reset game state
      this.resetGame();

      // Create scene objects
      await this.createScene();

      // Load audio
      await this.loadAudio();

      console.log(`[BaseGame] ${this.config.mode} mode initialization complete`);
    }

    setupUIElements() {
      // Common UI elements that both modes use
      const commonElements = {
        replayMessage: 'replayMessage',
        instructions: 'instructions'
      };

      // Mode-specific elements
      const modeElements = this.config.mode === 'classic' ? {
        distance: 'distValue',
        energy: 'energyBar',
        level: 'levelValue',
        levelCircle: 'levelCircleStroke'
      } : {
        distance: 'distValue-combat',
        coins: 'coinsValue',
        level: 'levelValue-combat',
        levelCircle: 'levelCircleStroke-combat'
      };

      this.uiElements = { ...commonElements, ...modeElements };
    }

    initHUD() {
      // Show/hide appropriate HUD elements
      if (this.config.mode === 'classic') {
        this.showClassicHUD();
      } else {
        this.showCombatHUD();
      }
    }

    showClassicHUD() {
      // Hide combat HUD, show classic HUD
      const classicHeader = document.querySelector('.header:not(.header--combat)');
      const combatHeader = document.querySelector('.header--combat');

      if (classicHeader) classicHeader.style.display = 'block';
      if (combatHeader) combatHeader.style.display = 'none';
    }

    showCombatHUD() {
      // Hide classic HUD, show combat HUD
      const classicHeader = document.querySelector('.header:not(.header--combat)');
      const combatHeader = document.querySelector('.header--combat');

      if (classicHeader) classicHeader.style.display = 'none';
      if (combatHeader) combatHeader.style.display = 'block';
    }

    resetGame() {
      // Reset common game state
      this.gameState.status = 'playing';
      this.gameState.distance = 0;
      this.gameState.speed = this.gameState.initSpeed;

      console.log(`[BaseGame] Game state reset for ${this.config.mode} mode`);
    }

    async createScene() {
      // Create sea (common to both modes)
      await this.createSea();

      // Create airplane (mode-specific)
      await this.createAirplane();

      // Call mode-specific scene creation
      if (this.createModeSpecificScene) {
        await this.createModeSpecificScene();
      }
    }

    async createSea() {
      const geomSea = new THREE.CylinderGeometry(
        this.gameState.seaRadius,
        this.gameState.seaRadius,
        this.gameState.seaLength,
        40, 10
      );
      geomSea.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI/2));

      const matSea = new THREE.MeshPhongMaterial({
        color: this.getGameUtils().Colors.blue,
        transparent: true,
        opacity: 0.6,
        flatShading: true
      });

      const sea = new THREE.Mesh(geomSea, matSea);
      sea.receiveShadow = true;

      this.engine.addSea({ mesh: sea });
    }

    async createAirplane() {
      // To be implemented by subclasses
      throw new Error('createAirplane must be implemented by subclass');
    }

    async loadAudio() {
      if (!this.engine.audioManager) return;

      // Common audio files
      const commonAudioFiles = [
        { name: 'ocean', url: `games/top-rug/assets/audio/ocean.mp3` },
        { name: 'propeller', url: `games/top-rug/assets/audio/propeller.mp3` }
      ];

      for (const audio of commonAudioFiles) {
        await this.engine.audioManager.load(audio.name, audio.url);
      }

      // Load mode-specific audio
      if (this.loadModeSpecificAudio) {
        await this.loadModeSpecificAudio();
      }

      console.log(`[BaseGame] Audio loaded for ${this.config.mode} mode`);
    }

    update(deltaTime) {
      // Update common game logic
      this.updateGameState(deltaTime);

      // Update camera
      this.engine.updateCamera();

      // Update UI
      this.updateUI();

      // Call mode-specific update
      this.onGameUpdate(deltaTime);
    }

    updateGameState(deltaTime) {
      // Update distance
      this.gameState.distance += this.gameState.speed * deltaTime * 100;
    }

    updateUI() {
      // Update common UI elements
      if (this.uiElements.distance) {
        this.updateUIElement(this.uiElements.distance, Math.floor(this.gameState.distance));
      }

      if (this.uiElements.level) {
        this.updateUIElement(this.uiElements.level, this.gameState.level || 1);
      }
    }

    updateUIElement(elementId, value) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value;
      }
    }

    // Utility methods
    getGameUtils() {
      return this.engine.getGameUtils();
    }

    playSound(soundName, options = {}) {
      if (this.engine.audioManager) {
        return this.engine.audioManager.play(soundName, options);
      }
    }

    // Collision detection
    checkCollisions() {
      // To be implemented by subclasses or handle common collisions
      this.onCollision();
    }

    // State management
    getGameState() {
      return { ...this.gameState };
    }

    setGameState(state) {
      this.gameState = { ...this.gameState, ...state };
    }

    // Cleanup
    dispose() {
      console.log(`[BaseGame] Disposing ${this.config.mode} mode`);
      // Cleanup mode-specific resources
    }
  }

  // Export globally
  window.BaseGame = BaseGame;

  console.log('[BaseGame] Shared game logic loaded');

})();
