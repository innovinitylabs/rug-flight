/**
 * ClassicGame - Classic mode implementation
 * Based on Top Rug's core gameplay with banner physics
 */
class ClassicGame {
  constructor(gameEngine, audioManager, textureManager, uiManager) {
    this.gameEngine = gameEngine;
    this.audioManager = audioManager;
    this.textureManager = textureManager;
    this.uiManager = uiManager;

    // Game state
    this.game = null;
    this.deltaTime = 0;
    this.newTime = new Date().getTime();
    this.oldTime = new Date().getTime();

    // Object pools
    this.ennemiesPool = [];
    this.particlesPool = [];
    this.particlesInUse = [];

    // 3D Objects
    this.airplane = null;
    this.sea = null;
    this.sky = null;
    this.coinsHolder = null;
    this.ennemiesHolder = null;
    this.particlesHolder = null;
    this.bannerSystem = null;

    // HUD system
    this.hud = null;

    // Mouse/ touch handling
    this.mousePos = { x: 0, y: 0 };

    // Screen dimensions
    this.HEIGHT = 0;
    this.WIDTH = 0;

    console.log('[ClassicGame] Initialized');
  }

  /**
   * Get current game state for mode switching
   */
  getState() {
    return {
      game: this.game ? { ...this.game } : null,
      airplane: this.airplane ? {
        position: this.airplane.mesh.position.clone(),
        rotation: this.airplane.mesh.rotation.clone()
      } : null,
      camera: this.gameEngine.camera ? {
        position: this.gameEngine.camera.position.clone(),
        rotation: this.gameEngine.camera.rotation.clone()
      } : null
    };
  }

  /**
   * Set game state for mode switching
   */
  setState(state) {
    if (state.game) {
      this.game = { ...state.game };
    }

    if (state.airplane && this.airplane) {
      this.airplane.mesh.position.copy(state.airplane.position);
      this.airplane.mesh.rotation.copy(state.airplane.rotation);
    }

    if (state.camera && this.gameEngine.camera) {
      this.gameEngine.camera.position.copy(state.camera.position);
      this.gameEngine.camera.rotation.copy(state.camera.rotation);
    }
  }

  /**
   * Activate this mode (called by ModeController)
   */
  async activate(options = {}) {
    console.log('[ClassicGame] Activating');

    // Start the game if not already running
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Deactivate this mode (called by ModeController)
   */
  async deactivate() {
    console.log('[ClassicGame] Deactivating');

    // Stop the game
    if (this.isRunning) {
      this.stop();
    }
  }

  /**
   * Initialize the classic game mode
   */
  async init() {
    console.log('[ClassicGame] Initializing...');
    console.log('[ClassicGame] gameEngine:', !!this.gameEngine);
    console.log('[ClassicGame] sceneManager:', !!this.gameEngine?.sceneManager);
    console.log('[ClassicGame] camera:', !!this.gameEngine?.sceneManager?.camera);

    // Initialize game state first
    this.resetGame();

    // Set screen dimensions
    this.HEIGHT = window.innerHeight;
    this.WIDTH = window.innerWidth;

    // Initialize HUD
    await this.initHUD();

    // Initialize audio
    if (this.audioManager) {
      console.log('[ClassicGame] About to init audio...');
      console.log('[ClassicGame] sceneManager:', this.gameEngine.sceneManager);
      console.log('[ClassicGame] camera:', this.gameEngine.sceneManager?.camera);
      await this.audioManager.init(this.gameEngine.sceneManager.camera);
      console.log('[ClassicGame] Audio initialized successfully');
    }

    // Load sounds
    await this.loadSounds();

    // Create game objects
    this.createScene();
    this.createLights();
    this.createPlane();
    await this.createBannerSystem();
    this.createSea();
    this.createSky();
    this.createCoins();
    this.createEnnemies();
    this.createParticles();

    // Set up controls
    this.setupControls();

    console.log('[ClassicGame] Initialization complete');
  }

  /**
   * Initialize the HUD system
   */
  async initHUD() {
    // Import ClassicHUD dynamically
    let ClassicHUD;
    if (typeof require !== 'undefined') {
      ClassicHUD = require('./ClassicHUD.js');
    } else {
      ClassicHUD = window.ClassicHUD;
    }

    if (!ClassicHUD) {
      console.error('[ClassicGame] ClassicHUD not available');
      return;
    }

    this.hud = new ClassicHUD(this.uiManager);
    await this.hud.init();
  }

  /**
   * Load audio files
   */
  async loadSounds() {
    if (!this.audioManager) return;

    try {
      // Background sounds
      await this.audioManager.load('ocean', null, 'modes/classic/assets/audio/ocean.mp3');
      await this.audioManager.load('propeller', null, 'modes/classic/assets/audio/propeller.mp3');

      // Coin sounds
      await this.audioManager.load('coin-1', 'coin', 'modes/classic/assets/audio/coin-1.mp3');
      await this.audioManager.load('coin-2', 'coin', 'modes/classic/assets/audio/coin-2.mp3');
      await this.audioManager.load('coin-3', 'coin', 'modes/classic/assets/audio/coin-3.mp3');
      await this.audioManager.load('jar-1', 'coin', 'modes/classic/assets/audio/jar-1.mp3');
      await this.audioManager.load('jar-2', 'coin', 'modes/classic/assets/audio/jar-2.mp3');
      await this.audioManager.load('jar-3', 'coin', 'modes/classic/assets/audio/jar-3.mp3');
      await this.audioManager.load('jar-4', 'coin', 'modes/classic/assets/audio/jar-4.mp3');
      await this.audioManager.load('jar-5', 'coin', 'modes/classic/assets/audio/jar-5.mp3');
      await this.audioManager.load('jar-6', 'coin', 'modes/classic/assets/audio/jar-6.mp3');
      await this.audioManager.load('jar-7', 'coin', 'modes/classic/assets/audio/jar-7.mp3');

      // Crash sounds
      await this.audioManager.load('airplane-crash-1', 'airplane-crash', 'modes/classic/assets/audio/airplane-crash-1.mp3');
      await this.audioManager.load('airplane-crash-2', 'airplane-crash', 'modes/classic/assets/audio/airplane-crash-2.mp3');
      await this.audioManager.load('airplane-crash-3', 'airplane-crash', 'modes/classic/assets/audio/airplane-crash-3.mp3');
      await this.audioManager.load('airplane-crash-4', 'airplane-crash', 'modes/classic/assets/audio/airplane-crash-4.mp3');

      console.log('[ClassicGame] All sounds loaded');
    } catch (error) {
      console.error('[ClassicGame] Error loading sounds:', error);
    }
  }

  /**
   * Reset the game state
   */
  resetGame(){
    this.game = {
      speed: 0,
      initSpeed: .00035,
      baseSpeed: .00035,
      targetBaseSpeed: .00035,
      incrementSpeedByTime: .0000025,
      incrementSpeedByLevel: .000005,
      distanceForSpeedUpdate: 100,
      speedLastUpdate: 0,

      distance: 0,
      ratioSpeedDistance: 50,
      energy: 100,
      ratioSpeedEnergy: 3,

      level: 1,
      levelLastUpdate: 0,
      distanceForLevelUpdate: 1000,

      planeDefaultHeight: 100,
      planeAmpHeight: 80,
      planeAmpWidth: 75,
      planeMoveSensivity: 0.005,
      planeRotXSensivity: 0.0008,
      planeRotZSensivity: 0.0004,
      planeFallSpeed: .001,
      planeMinSpeed: 1.2,
      planeMaxSpeed: 1.6,
      planeSpeed: 0,
      planeCollisionDisplacementX: 0,
      planeCollisionSpeedX: 0,

      planeCollisionDisplacementY: 0,
      planeCollisionSpeedY: 0,

      seaRadius: 600,
      seaLength: 800,
      wavesMinAmp: 5,
      wavesMaxAmp: 20,
      wavesMinSpeed: 0.001,
      wavesMaxSpeed: 0.003,

      cameraFarPos: 500,
      cameraNearPos: 150,
      cameraSensivity: 0.002,

      coinDistanceTolerance: 15,
      coinValue: 3,
      coinsSpeed: .5,
      coinLastSpawn: 0,
      distanceForCoinsSpawn: 100,

      ennemyDistanceTolerance: 10,
      ennemyValue: 10,
      ennemiesSpeed: .6,
      ennemyLastSpawn: 0,
      distanceForEnnemiesSpawn: 50,

      status: "playing",
    };

    // Update HUD
    if (this.hud) {
      this.hud.updateLevel(this.game.level);
    }

    // Make banner and ropes visible again when game resets
    if (this.bannerSystem) {
      this.bannerSystem.setVisible(true);
    }

    // Make airplane visible again when game resets
    if (this.airplane && this.airplane.mesh) {
      this.airplane.mesh.visible = true;
    }

    // Restart background sounds when game resets (only if user has interacted)
    if (this.audioManager && this.audioManager.userInteracted) {
      var propellerLoaded = this.audioManager.sounds['propeller'] ||
                           (this.audioManager.threeJSSupported && this.audioManager.buffers['propeller']);
      var oceanLoaded = this.audioManager.sounds['ocean'] ||
                       (this.audioManager.threeJSSupported && this.audioManager.buffers['ocean']);
      console.log('[ClassicGame] resetGame called - propellerLoaded =', propellerLoaded, 'oceanLoaded =', oceanLoaded);

      if (propellerLoaded && oceanLoaded) {
        // Use the persistent propeller system
        if (this.audioManager.propellerGain) {
          this.audioManager.propellerGain.gain.value = 0.6;
        }
        this.audioManager.play('ocean', {loop: true, volume: 0.4});
      } else {
        console.warn('[ClassicGame] resetGame: Sounds not loaded, skipping');
      }
    } else {
      console.log('[ClassicGame] resetGame: Audio not interacted yet');
    }
  }

  /**
   * Start the game
   */
  start() {
    console.log('[ClassicGame] Starting game loop');
    this.resetGame();
    this.gameEngine.start();
  }

  /**
   * Update game logic
   */
  update(deltaTime) {
    this.deltaTime = deltaTime;

    if (this.game && this.game.status === "playing") {
      // Add energy coins every 100m
      if (Math.floor(this.game.distance) % this.game.distanceForCoinsSpawn == 0 &&
          Math.floor(this.game.distance) > this.game.coinLastSpawn) {
        this.game.coinLastSpawn = Math.floor(this.game.distance);
        this.coinsHolder.spawnCoins();
      }

      if (Math.floor(this.game.distance) % this.game.distanceForSpeedUpdate == 0 &&
          Math.floor(this.game.distance) > this.game.speedLastUpdate) {
        this.game.speedLastUpdate = Math.floor(this.game.distance);
        this.game.targetBaseSpeed += this.game.incrementSpeedByTime * deltaTime;
      }

      if (Math.floor(this.game.distance) % this.game.distanceForEnnemiesSpawn == 0 &&
          Math.floor(this.game.distance) > this.game.ennemyLastSpawn) {
        this.game.ennemyLastSpawn = Math.floor(this.game.distance);
        this.ennemiesHolder.spawnEnnemies();
      }

      if (Math.floor(this.game.distance) % this.game.distanceForLevelUpdate == 0 &&
          Math.floor(this.game.distance) > this.game.levelLastUpdate) {
        this.game.levelLastUpdate = Math.floor(this.game.distance);
        this.game.level++;
        if (this.hud) {
          this.hud.updateLevel(this.game.level);
        }

        this.game.targetBaseSpeed = this.game.initSpeed + this.game.incrementSpeedByLevel * this.game.level;
      }

      this.updatePlane();
      this.updateBanner();

      // Update HUD
      if (this.hud) {
        this.hud.updateDistance(this.game.distance, this.game.distanceForLevelUpdate);
        this.hud.updateEnergy(this.game.energy, this.game.energy < 30);
      }

      this.game.baseSpeed += (this.game.targetBaseSpeed - this.game.baseSpeed) * deltaTime * 0.02;
      this.game.speed = this.game.baseSpeed * this.game.planeSpeed;

    } else if (this.game && this.game.status === "gameover") {
      this.game.speed *= .99;
      if (this.airplane && this.airplane.mesh) {
        this.airplane.mesh.rotation.z += (-Math.PI/2 - this.airplane.mesh.rotation.z) * .0002 * deltaTime;
        this.airplane.mesh.rotation.x += 0.0003 * deltaTime;
        this.game.planeFallSpeed *= 1.05;
        this.airplane.mesh.position.y -= this.game.planeFallSpeed * deltaTime;
      }

      // Hide ropes when game ends
      if (this.bannerSystem) {
        this.bannerSystem.setRopesVisible(false);
      }

      // Update banner animation during gameover
      this.updatePlane();

      if (this.airplane && this.airplane.mesh && this.airplane.mesh.position.y < -200) {
        // Hide airplane when it falls below screen
        this.airplane.mesh.visible = false;
        if (this.hud) this.hud.showReplay();
        this.game.status = "waitingReplay";
      }
    } else if (this.game && this.game.status === "waitingReplay") {
      // Keep ropes hidden during replay wait
      if (this.bannerSystem) {
        this.bannerSystem.setRopesVisible(false);
      }

      // Keep airplane hidden during replay wait
      if (this.airplane && this.airplane.mesh) {
        this.airplane.mesh.visible = false;
      }

      // Update banner animation during waiting replay
      this.updatePlane();
    }

    // Update propeller animation
    if (this.airplane && this.airplane.propeller) {
      this.airplane.propeller.rotation.x += .2 + this.game.planeSpeed * deltaTime * .005;
    }

    // Update sea rotation
    if (this.sea && this.sea.mesh) {
      this.sea.mesh.rotation.z += this.game.speed * deltaTime;
      if (this.sea.mesh.rotation.z > 2 * Math.PI) {
        this.sea.mesh.rotation.z -= 2 * Math.PI;
      }
    }

    // Update lighting
    if (typeof ambientLight !== 'undefined' && ambientLight) {
      ambientLight.intensity += (.5 - ambientLight.intensity) * deltaTime * 0.005;
    }

    // Update game objects
    if (this.coinsHolder) this.coinsHolder.rotateCoins();
    if (this.ennemiesHolder) this.ennemiesHolder.rotateEnnemies();

    if (this.sky) this.sky.moveClouds();
    if (this.sea) this.sea.moveWaves();
  }

  /**
   * Handle mouse/touch input
   */
  handleMouseMove(event) {
    var tx = -1 + (event.clientX / this.WIDTH) * 2;
    var ty = 1 - (event.clientY / this.HEIGHT) * 2;
    this.mousePos = {x: tx, y: ty};
  }

  handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / this.WIDTH) * 2;
    var ty = 1 - (event.touches[0].pageY / this.HEIGHT) * 2;
    this.mousePos = {x: tx, y: ty};
  }

  handleMouseUp() {
    if (this.game && this.game.status === "waitingReplay") {
      this.resetGame();
      if (this.hud) this.hud.hideReplay();
    }
  }

  handleTouchEnd() {
    if (this.game && this.game.status === "waitingReplay") {
      this.resetGame();
      if (this.hud) this.hud.hideReplay();
    }
  }

  /**
   * Window resize handling
   */
  handleWindowResize() {
    this.HEIGHT = window.innerHeight;
    this.WIDTH = window.innerWidth;

    if (this.gameEngine.sceneManager.camera) {
      this.gameEngine.sceneManager.camera.aspect = this.WIDTH / this.HEIGHT;
      this.gameEngine.sceneManager.camera.updateProjectionMatrix();
    }

    if (typeof renderer !== 'undefined' && renderer) {
      renderer.setSize(this.WIDTH, this.HEIGHT);
    }
  }

  /**
   * Save game state
   */
  saveState() {
    if (!this.game) return null;

    return {
      game: { ...this.game },
      mousePos: { ...this.mousePos },
      // Don't save 3D objects, they'll be recreated
    };
  }

  /**
   * Load game state
   */
  loadState(state) {
    if (!state) return;

    if (state.game) {
      this.game = { ...state.game };
    }

    if (state.mousePos) {
      this.mousePos = { ...state.mousePos };
    }

    // Update UI to reflect loaded state
    this.updateUI();
  }

  /**
   * Update UI elements via HUD
   */
  updateUI() {
    if (this.hud && this.game) {
      this.hud.update(this.game);
    }
  }

  /**
   * Create the 3D scene
   */
  createScene() {
    // Scene setup is handled by the scene manager
    // Just ensure we have the right camera position
    if (this.gameEngine.sceneManager.camera) {
      this.gameEngine.sceneManager.camera.position.x = 0;
      this.gameEngine.sceneManager.camera.position.z = 200;
      this.gameEngine.sceneManager.camera.position.y = this.game.planeDefaultHeight;
    }
  }

  /**
   * Create lighting
   */
  createLights() {
    // Create hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);

    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0xdc8874, .5);

    // Create directional light (shadow light)
    const shadowLight = new THREE.DirectionalLight(0xffffff, .9);
    shadowLight.position.set(150, 350, 350);
    shadowLight.castShadow = true;
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;
    shadowLight.shadow.mapSize.width = 4096;
    shadowLight.shadow.mapSize.height = 4096;

    // Add lights to scene
    this.gameEngine.sceneManager.scene.add(hemisphereLight);
    this.gameEngine.sceneManager.scene.add(shadowLight);
    this.gameEngine.sceneManager.scene.add(ambientLight);

    // Store references for updates
    this.hemisphereLight = hemisphereLight;
    this.ambientLight = ambientLight;
    this.shadowLight = shadowLight;
  }

  /**
   * Create the airplane
   */
  createPlane() {
    this.airplane = new AirPlane(this);
    this.airplane.mesh.scale.set(.25, .25, .25);
    this.airplane.mesh.position.y = this.game.planeDefaultHeight;
    this.gameEngine.sceneManager.scene.add(this.airplane.mesh);
  }

  /**
   * Create the banner system
   */
  async createBannerSystem() {
    // Import BannerSystem dynamically to avoid circular dependencies
    let BannerSystem;
    if (typeof require !== 'undefined') {
      BannerSystem = require('./BannerSystem.js');
    } else {
      BannerSystem = window.BannerSystem;
    }

    if (!BannerSystem) {
      console.error('[ClassicGame] BannerSystem not available');
      return;
    }

    this.bannerSystem = new BannerSystem(this.gameEngine, this.textureManager, this.airplane);
    await this.bannerSystem.init();
  }

  /**
   * Create the sea
   */
  createSea() {
    this.sea = new Sea(this);
    this.sea.mesh.position.y = -this.game.seaRadius;
    this.gameEngine.sceneManager.scene.add(this.sea.mesh);
  }

  /**
   * Create the sky
   */
  createSky() {
    this.sky = new Sky(this);
    this.sky.mesh.position.y = -this.game.seaRadius;
    this.gameEngine.sceneManager.scene.add(this.sky.mesh);
  }

  /**
   * Create coins system
   */
  createCoins() {
    this.coinsHolder = new CoinsHolder(this, 20);
    this.gameEngine.sceneManager.scene.add(this.coinsHolder.mesh);
  }

  /**
   * Create enemies system
   */
  createEnnemies() {
    // Initialize enemy pool
    for (var i = 0; i < 10; i++) {
      var ennemy = new Ennemy();
      this.ennemiesPool.push(ennemy);
    }
    this.ennemiesHolder = new EnnemiesHolder(this);
    this.gameEngine.sceneManager.scene.add(this.ennemiesHolder.mesh);
  }

  /**
   * Create particles system
   */
  createParticles() {
    // Initialize particle pool
    for (var i = 0; i < 10; i++) {
      var particle = new Particle();
      this.particlesPool.push(particle);
    }
    this.particlesHolder = new ParticlesHolder(this);
    this.gameEngine.sceneManager.scene.add(this.particlesHolder.mesh);
  }

  /**
   * Setup input controls
   */
  setupControls() {
    // Event listeners will be set up by the game controller
    // This method is for any game-specific control setup
  }

  /**
   * Update energy (called by HUD system)
   */
  updateEnergy() {
    if (!this.game) return;

    this.game.energy -= this.game.speed * this.deltaTime * this.game.ratioSpeedEnergy;
    this.game.energy = Math.max(0, this.game.energy);

    if (this.game.energy < 1) {
      this.game.status = "gameover";

      // Save high score and statistics
      this.saveGameResults();

      if (this.audioManager) {
        this.audioManager.stop('ocean');
        this.audioManager.play('airplane-crash', {volume: 1.0});
      }
    }
  }

  /**
   * Add energy (coin collected)
   */
  addEnergy() {
    if (this.game) {
      this.game.energy += this.game.coinValue;
      this.game.energy = Math.min(this.game.energy, 100);
    }
  }

  /**
   * Remove energy (enemy collision)
   */
  removeEnergy() {
    if (this.game) {
      this.game.energy -= this.game.ennemyValue;
      this.game.energy = Math.max(0, this.game.energy);
    }
  }

  /**
   * Update plane position and physics
   */
  updatePlane() {
    if (!this.airplane || !this.game) return;

    this.game.planeSpeed = this.normalize(this.mousePos.x, -.5, .5, this.game.planeMinSpeed, this.game.planeMaxSpeed);
    var targetY = this.normalize(this.mousePos.y, -.75, .75, this.game.planeDefaultHeight - this.game.planeAmpHeight, this.game.planeDefaultHeight + this.game.planeAmpHeight);
    var targetX = this.normalize(this.mousePos.x, -1, 1, -this.game.planeAmpWidth * .7, -this.game.planeAmpWidth);

    this.game.planeCollisionDisplacementX += this.game.planeCollisionSpeedX;
    targetX += this.game.planeCollisionDisplacementX;

    this.game.planeCollisionDisplacementY += this.game.planeCollisionSpeedY;
    targetY += this.game.planeCollisionDisplacementY;

    this.airplane.mesh.position.y += (targetY - this.airplane.mesh.position.y) * this.deltaTime * this.game.planeMoveSensivity;
    this.airplane.mesh.position.x += (targetX - this.airplane.mesh.position.x) * this.deltaTime * this.game.planeMoveSensivity;

    this.airplane.mesh.rotation.z = (targetY - this.airplane.mesh.position.y) * this.deltaTime * this.game.planeRotXSensivity;
    this.airplane.mesh.rotation.x = (this.airplane.mesh.position.y - targetY) * this.deltaTime * this.game.planeRotZSensivity;

    var targetCameraZ = this.normalize(this.game.planeSpeed, this.game.planeMinSpeed, this.game.planeMaxSpeed, this.game.cameraNearPos, this.game.cameraFarPos);
    if (this.gameEngine.sceneManager.camera) {
      this.gameEngine.sceneManager.camera.fov = this.normalize(this.mousePos.x, -1, 1, 40, 80);
      this.gameEngine.sceneManager.camera.updateProjectionMatrix();
      this.gameEngine.sceneManager.camera.position.y += (this.airplane.mesh.position.y - this.gameEngine.sceneManager.camera.position.y) * this.deltaTime * this.game.cameraSensivity;
    }

    this.game.planeCollisionSpeedX += (0 - this.game.planeCollisionSpeedX) * this.deltaTime * 0.03;
    this.game.planeCollisionDisplacementX += (0 - this.game.planeCollisionDisplacementX) * this.deltaTime * 0.01;
    this.game.planeCollisionSpeedY += (0 - this.game.planeCollisionSpeedY) * this.deltaTime * 0.03;
    this.game.planeCollisionDisplacementY += (0 - this.game.planeCollisionDisplacementY) * this.deltaTime * 0.01;

    if (this.airplane.pilot) {
      this.airplane.pilot.updateHairs();
    }

    // Banner is updated separately via BannerSystem
  }

  /**
   * Update banner via BannerSystem
   */
  updateBanner() {
    if (this.bannerSystem) {
      this.bannerSystem.update(this.deltaTime, this.game ? this.game.status : 'playing');
    }
  }


  /**
   * Normalize value function
   */
  normalize(v, vmin, vmax, tmin, tmax) {
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;
  }

  /**
   * Save game results (high score, statistics)
   */
  saveGameResults() {
    if (!this.game) return;

    // Calculate final score (distance * level)
    const finalScore = Math.floor(this.game.distance * this.game.level);

    // Save high score
    if (window.getGameController) {
      const controller = window.getGameController();
      if (controller.saveHighScore) {
        controller.saveHighScore(finalScore, this.game.level);
      }

      // Update statistics
      if (controller.updateStats) {
        controller.updateStats({
          gamesPlayed: 1,
          totalScore: finalScore,
          totalDistance: Math.floor(this.game.distance),
          coinsCollected: this.game.coinsCollected || 0,
          timePlayed: Math.floor((Date.now() - this.gameStartTime) / 1000) || 0
        });
      }
    }

    console.log(`[ClassicGame] Game ended - Score: ${finalScore}, Distance: ${Math.floor(this.game.distance)}, Level: ${this.game.level}`);
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('[ClassicGame] Disposing resources');

    // Dispose HUD
    if (this.hud) {
      this.hud.dispose();
      this.hud = null;
    }

    // Dispose banner system
    if (this.bannerSystem) {
      this.bannerSystem.dispose();
      this.bannerSystem = null;
    }

    // Clear object pools
    this.ennemiesPool = [];
    this.particlesPool = [];
    this.particlesInUse = [];

    // Remove from scene (scene manager will handle)
    // 3D objects will be disposed by scene manager
  }
}

// ====================
// GAME CLASSES & OBJECTS
// ====================

// Colors
const Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  brownDark: 0x23190f,
  pink: 0xF5986E,
  yellow: 0xf4ce93,
  blue: 0x68c3c0,
};

// Pilot class
function Pilot(parentGame) {
  this.parentGame = parentGame;
  this.mesh = new THREE.Object3D();
  this.mesh.name = "pilot";
  this.angleHairs = 0;

  var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
  var bodyMat = new THREE.MeshPhongMaterial({color: Colors.brown, flatShading: true});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2, -12, 0);
  this.mesh.add(body);

  var faceGeom = new THREE.BoxGeometry(10, 10, 10);
  var faceMat = new THREE.MeshLambertMaterial({color: Colors.pink});
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  var hairGeom = new THREE.BoxGeometry(4, 4, 4);
  var hairMat = new THREE.MeshLambertMaterial({color: Colors.brown});
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2, 0));
  var hairs = new THREE.Object3D();

  this.hairsTop = new THREE.Object3D();

  for (var i = 0; i < 12; i++) {
    var h = hair.clone();
    var col = i % 3;
    var row = Math.floor(i / 3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
    h.geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1));
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);

  var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
  hairSideGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(-6, 0, 0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8, -2, 6);
  hairSideL.position.set(8, -2, -6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);

  var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1, -4, 0);
  hairs.add(hairBack);
  hairs.position.set(-5, 5, 0);

  this.mesh.add(hairs);

  var glassGeom = new THREE.BoxGeometry(5, 5, 5);
  var glassMat = new THREE.MeshLambertMaterial({color: Colors.brown});
  var glassR = new THREE.Mesh(glassGeom, glassMat);
  glassR.position.set(6, 0, 3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z;

  var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  var earGeom = new THREE.BoxGeometry(2, 3, 2);
  var earL = new THREE.Mesh(earGeom, faceMat);
  earL.position.set(0, 0, -6);
  var earR = earL.clone();
  earR.position.set(0, 0, 6);
  this.mesh.add(earL);
  this.mesh.add(earR);
}

Pilot.prototype.updateHairs = function() {
  var hairs = this.hairsTop.children;
  var l = hairs.length;
  for (var i = 0; i < l; i++) {
    var h = hairs[i];
    h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
  }
  this.angleHairs += this.parentGame.game.speed * this.parentGame.deltaTime * 40;
};

// Airplane class
function AirPlane(parentGame) {
  this.parentGame = parentGame;
  this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";

  // Cabin
  var matCabin = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true, side: THREE.DoubleSide});

  const frontUR = [40, 25, -25];
  const frontUL = [40, 25, 25];
  const frontLR = [40, -25, -25];
  const frontLL = [40, -25, 25];
  const backUR = [-40, 15, -5];
  const backUL = [-40, 15, 5];
  const backLR = [-40, 5, -5];
  const backLL = [-40, 5, 5];

  const vertices = new Float32Array(
    [].concat(
      makeTetrahedron(frontUL, frontUR, frontLL, frontLR),   // front
      makeTetrahedron(backUL, backUR, backLL, backLR),       // back
      makeTetrahedron(backUR, backLR, frontUR, frontLR),     // side
      makeTetrahedron(backUL, backLL, frontUL, frontLL),     // side
      makeTetrahedron(frontUL, backUL, frontUR, backUR),     // top
      makeTetrahedron(frontLL, backLL, frontLR, backLR)      // bottom
    )
  );

  const geomCabin = new THREE.BufferGeometry();
  geomCabin.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  var cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  this.mesh.add(cabin);

  // Engine
  var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  var matEngine = new THREE.MeshPhongMaterial({color: Colors.white, flatShading: true});
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // Tail Plane
  var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  var matTailPlane = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true});
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-40, 20, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // Wings
  var geomSideWing = new THREE.BoxGeometry(30, 5, 120, 1, 1, 1);
  var matSideWing = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true});
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0, 15, 0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  var geomWindshield = new THREE.BoxGeometry(3, 15, 20, 1, 1, 1);
  var matWindshield = new THREE.MeshPhongMaterial({color: Colors.white, transparent: true, opacity: .3, flatShading: true});
  var windshield = new THREE.Mesh(geomWindshield, matWindshield);
  windshield.position.set(20, 27, 0);
  windshield.castShadow = true;
  windshield.receiveShadow = true;
  this.mesh.add(windshield);

  var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  if (geomPropeller.attributes && geomPropeller.attributes.position) {
    var pos = geomPropeller.attributes.position.array;
    pos[4 * 3 + 1] -= 5;
    pos[4 * 3 + 2] += 5;
    pos[5 * 3 + 1] -= 5;
    pos[5 * 3 + 2] -= 5;
    pos[6 * 3 + 1] += 5;
    pos[6 * 3 + 2] += 5;
    pos[7 * 3 + 1] += 5;
    pos[7 * 3 + 2] -= 5;
    geomPropeller.attributes.position.needsUpdate = true;
  }
  var matPropeller = new THREE.MeshPhongMaterial({color: Colors.brown, flatShading: true});
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  var geomBlade = new THREE.BoxGeometry(1, 80, 10, 1, 1, 1);
  var matBlade = new THREE.MeshPhongMaterial({color: Colors.brownDark, flatShading: true});
  var blade1 = new THREE.Mesh(geomBlade, matBlade);
  blade1.position.set(8, 0, 0);
  blade1.castShadow = true;
  blade1.receiveShadow = true;

  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI / 2;
  blade2.castShadow = true;
  blade2.receiveShadow = true;

  this.propeller.add(blade1);
  this.propeller.add(blade2);
  this.propeller.position.set(60, 0, 0);
  this.mesh.add(this.propeller);

  // Landing gear
  var wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
  var wheelProtecMat = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true});
  var wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
  wheelProtecR.position.set(25, -20, 25);
  this.mesh.add(wheelProtecR);

  var wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
  var wheelTireMat = new THREE.MeshPhongMaterial({color: Colors.brownDark, flatShading: true});
  var wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
  wheelTireR.position.set(25, -28, 25);

  var wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
  var wheelAxisMat = new THREE.MeshPhongMaterial({color: Colors.brown, flatShading: true});
  var wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
  wheelTireR.add(wheelAxis);
  this.mesh.add(wheelTireR);

  var wheelProtecL = wheelProtecR.clone();
  wheelProtecL.position.z = -wheelProtecR.position.z;
  this.mesh.add(wheelProtecL);

  var wheelTireL = wheelTireR.clone();
  wheelTireL.position.z = -wheelTireR.position.z;
  this.mesh.add(wheelTireL);

  var wheelTireB = wheelTireR.clone();
  wheelTireB.scale.set(.5, .5, .5);
  wheelTireB.position.set(-35, -5, 0);
  this.mesh.add(wheelTireB);

  var suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
  suspensionGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 10, 0));
  var suspensionMat = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true});
  var suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
  suspension.position.set(-35, -5, 0);
  suspension.rotation.z = -.3;
  this.mesh.add(suspension);

  this.pilot = new Pilot(this.parentGame);
  this.pilot.mesh.position.set(-10, 27, 0);
  this.mesh.add(this.pilot.mesh);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
}

// Helper function for tetrahedron creation
function makeTetrahedron(a, b, c, d) {
  return [
    a[0], a[1], a[2],
    b[0], b[1], b[2],
    c[0], c[1], c[2],
    b[0], b[1], b[2],
    c[0], c[1], c[2],
    d[0], d[1], d[2],
  ];
}

// Sky class
function Sky(parentGame) {
  this.parentGame = parentGame;
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI * 2 / this.nClouds;

  for (var i = 0; i < this.nClouds; i++) {
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle * i;
    var h = 600 + 150 + Math.random() * 200; // seaRadius + 150 + random
    c.mesh.position.y = Math.sin(a) * h;
    c.mesh.position.x = Math.cos(a) * h;
    c.mesh.position.z = -300 - Math.random() * 500;
    c.mesh.rotation.z = a + Math.PI / 2;
    var s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);
    this.mesh.add(c.mesh);
  }
}

Sky.prototype.moveClouds = function() {
  for (var i = 0; i < this.nClouds; i++) {
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += this.parentGame.game.speed * this.parentGame.deltaTime;
};

// Sea class
function Sea(parentGame) {
  this.parentGame = parentGame;
  var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
  geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  // Handle BufferGeometry vs Geometry
  var l, vertices;
  if (geom.attributes && geom.attributes.position) {
    l = geom.attributes.position.count;
    vertices = [];
    var pos = geom.attributes.position.array;
    for (var i = 0; i < l; i++) {
      vertices.push({
        x: pos[i * 3],
        y: pos[i * 3 + 1],
        z: pos[i * 3 + 2]
      });
    }
  } else if (geom.vertices) {
    geom.mergeVertices();
    l = geom.vertices.length;
    vertices = geom.vertices;
  } else {
    l = 0;
    vertices = [];
  }

  this.waves = [];

  for (var i = 0; i < l; i++) {
    var v = vertices[i];
    this.waves.push({
      y: v.y,
      x: v.x,
      z: v.z,
      ang: Math.random() * Math.PI * 2,
      amp: 5 + Math.random() * (20 - 5), // wavesMinAmp + random * (wavesMaxAmp - wavesMinAmp)
      speed: 0.001 + Math.random() * (0.003 - 0.001) // wavesMinSpeed + random * (wavesMaxSpeed - wavesMinSpeed)
    });
  }

  var mat = new THREE.MeshPhongMaterial({
    color: Colors.blue,
    transparent: true,
    opacity: .8,
    flatShading: true,
  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;
}

Sea.prototype.moveWaves = function() {
  var geom = this.mesh.geometry;
  var l = this.waves.length;

  if (geom.attributes && geom.attributes.position) {
    var pos = geom.attributes.position.array;
    for (var i = 0; i < l; i++) {
      var vprops = this.waves[i];
      pos[i * 3] = vprops.x + Math.cos(vprops.ang) * vprops.amp;
      pos[i * 3 + 1] = vprops.y + Math.sin(vprops.ang) * vprops.amp;
      pos[i * 3 + 2] = vprops.z;
      vprops.ang += vprops.speed * this.parentGame.deltaTime;
    }
    geom.attributes.position.needsUpdate = true;
  } else if (geom.vertices) {
    var verts = geom.vertices;
    for (var i = 0; i < l; i++) {
      var v = verts[i];
      var vprops = this.waves[i];
      v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
      v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
      v.z = vprops.z;
      vprops.ang += vprops.speed * this.parentGame.deltaTime;
    }
    geom.verticesNeedUpdate = true;
  }
};

// Cloud class
function Cloud() {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.BoxGeometry(20, 20, 20);
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.white,
  });

  var nBlocs = 3 + Math.floor(Math.random() * 3);
  for (var i = 0; i < nBlocs; i++) {
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.rotation.y = Math.random() * Math.PI * 2;
    var s = .1 + Math.random() * .9;
    m.scale.set(s, s, s);
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;
  }
}

Cloud.prototype.rotate = function() {
  var l = this.mesh.children.length;
  for (var i = 0; i < l; i++) {
    var m = this.mesh.children[i];
    m.rotation.z += Math.random() * .005 * (i + 1);
    m.rotation.y += Math.random() * .002 * (i + 1);
  }
};

// Enemy class
function Ennemy() {
  var geom = new THREE.TetrahedronGeometry(8, 2);
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shininess: 0,
    specular: 0xffffff,
    flatShading: true
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

// Enemies holder
function EnnemiesHolder(parentGame) {
  this.parentGame = parentGame;
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function() {
  var parentGame = this.parentGame;
  var nEnnemies = parentGame.game.level;

  for (var i = 0; i < nEnnemies; i++) {
    var ennemy;
    if (parentGame.ennemiesPool.length) {
      ennemy = parentGame.ennemiesPool.pop();
    } else {
      ennemy = new Ennemy();
    }

    ennemy.angle = -(i * 0.1);
    ennemy.distance = parentGame.game.seaRadius + parentGame.game.planeDefaultHeight +
                     (-1 + Math.random() * 2) * (parentGame.game.planeAmpHeight - 20);
    ennemy.mesh.position.y = -parentGame.game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
};

EnnemiesHolder.prototype.rotateEnnemies = function(parentGame) {
  for (var i = 0; i < this.ennemiesInUse.length; i++) {
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += parentGame.game.speed * parentGame.deltaTime * parentGame.game.ennemiesSpeed;

    if (ennemy.angle > Math.PI * 2) ennemy.angle -= Math.PI * 2;

    ennemy.mesh.position.y = -parentGame.game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
    ennemy.mesh.rotation.z += Math.random() * .1;
    ennemy.mesh.rotation.y += Math.random() * .1;

    // Only check collisions during gameplay
    if (parentGame.game.status === "playing" && parentGame.airplane && parentGame.airplane.mesh) {
      var diffPos = parentGame.airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
      var d = diffPos.length();
      if (d < parentGame.game.ennemyDistanceTolerance) {
        parentGame.particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

        parentGame.ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
        this.mesh.remove(ennemy.mesh);

        parentGame.game.planeCollisionSpeedX = 100 * diffPos.x / d;
        parentGame.game.planeCollisionSpeedY = 100 * diffPos.y / d;

        if (typeof ambientLight !== 'undefined' && ambientLight) {
          ambientLight.intensity = 2;
        }

        parentGame.removeEnergy();

        if (parentGame.audioManager) {
          parentGame.audioManager.play('airplane-crash', {volume: 0.8});
        }
        i--;
      }
    }

    // Remove enemies that have passed behind
    if (ennemy.angle > Math.PI) {
      parentGame.ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
};

// Particle class
function Particle() {
  var geom = new THREE.TetrahedronGeometry(3, 0);
  var mat = new THREE.MeshPhongMaterial({
    color: 0x009999,
    shininess: 0,
    specular: 0xffffff,
    flatShading: true
  });
  this.mesh = new THREE.Mesh(geom, mat);
}

Particle.prototype.explode = function(pos, color, scale, parentGame) {
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color(color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random() * 2) * 50;
  var targetY = pos.y + (-1 + Math.random() * 2) * 50;
  var speed = .6 + Math.random() * .2;
  TweenMax.to(this.mesh.rotation, speed, {x: Math.random() * 12, y: Math.random() * 12});
  TweenMax.to(this.mesh.scale, speed, {x: .1, y: .1, z: .1});
  TweenMax.to(this.mesh.position, speed, {x: targetX, y: targetY, delay: Math.random() * .1, ease: Power2.easeOut, onComplete: function() {
    if (_p) _p.remove(_this.mesh);
    _this.mesh.scale.set(1, 1, 1);
    parentGame.particlesPool.unshift(_this);
  }});
};

// Particles holder
function ParticlesHolder(parentGame) {
  this.parentGame = parentGame;
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale) {
  var nPArticles = density;
  for (var i = 0; i < nPArticles; i++) {
    var particle;
    if (this.parentGame.particlesPool.length) {
      particle = this.parentGame.particlesPool.pop();
    } else {
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos, color, scale, this.parentGame);
  }
};

// Coin class
function Coin() {
  var geom = new THREE.TetrahedronGeometry(5, 0);
  var mat = new THREE.MeshPhongMaterial({
    color: 0x009999,
    shininess: 0,
    specular: 0xffffff,
    flatShading: true
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

// Coins holder
function CoinsHolder(parentGame, nCoins) {
  this.parentGame = parentGame;
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i = 0; i < nCoins; i++) {
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

CoinsHolder.prototype.spawnCoins = function() {
  var parentGame = this.parentGame;
  var nCoins = 1 + Math.floor(Math.random() * 10);
  var d = parentGame.game.seaRadius + parentGame.game.planeDefaultHeight +
         (-1 + Math.random() * 2) * (parentGame.game.planeAmpHeight - 20);
  var amplitude = 10 + Math.round(Math.random() * 10);

  for (var i = 0; i < nCoins; i++) {
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    } else {
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = -(i * 0.02);
    coin.distance = d + Math.cos(i * .5) * amplitude;
    coin.mesh.position.y = -parentGame.game.seaRadius + Math.sin(coin.angle) * coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
  }
};

CoinsHolder.prototype.rotateCoins = function(parentGame) {
  for (var i = 0; i < this.coinsInUse.length; i++) {
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += parentGame.game.speed * parentGame.deltaTime * parentGame.game.coinsSpeed;
    if (coin.angle > Math.PI * 2) coin.angle -= Math.PI * 2;
    coin.mesh.position.y = -parentGame.game.seaRadius + Math.sin(coin.angle) * coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
    coin.mesh.rotation.z += Math.random() * .1;
    coin.mesh.rotation.y += Math.random() * .1;

    var diffPos = parentGame.airplane.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d < parentGame.game.coinDistanceTolerance) {
      this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
      parentGame.scene.remove(coin.mesh);
      parentGame.particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
      parentGame.addEnergy();

      if (parentGame.audioManager) {
        parentGame.audioManager.play('coin', {volume: 0.5});
      }
      i--;
    } else if (coin.angle > Math.PI) {
      this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
      parentGame.scene.remove(coin.mesh);
      i--;
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClassicGame;
} else if (typeof window !== 'undefined') {
  window.ClassicGame = ClassicGame;
}
