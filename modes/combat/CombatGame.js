/**
 * CombatGame - Combat mode for Top Rug game
 * Enhanced version with weapons, enemies, and combat mechanics
 */
class CombatGame {
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

    // 3D Objects and Systems
    this.sceneManager = null;
    this.airplane = null;
    this.sky = null;
    this.sea = null;
    this.pilot = null;
    this.clouds = [];
    this.coins = [];
    this.enemies = [];
    this.projectiles = [];
    this.collectibles = [];

    // Combat systems
    this.weaponSystem = null;
    this.enemySystem = null;

    // UI
    this.hud = null;

    // Game state
    this.isInitialized = false;

    console.log('[CombatGame] Initialized');
  }

  /**
   * Initialize the combat game mode
   */
  async init() {
    if (this.isInitialized) {
      console.log('[CombatGame] Already initialized');
      return;
    }

    console.log('[CombatGame] Initializing combat mode...');

    try {
      // Set up screen dimensions
      this.HEIGHT = window.innerHeight;
      this.WIDTH = window.innerWidth;

      // Initialize HUD
      await this.initHUD();

      // Initialize audio with our core AudioManager
      if (this.audioManager) {
        await this.audioManager.init(this.gameEngine.sceneManager.camera);
      }

      // Load combat-specific sounds
      await this.loadSounds();

      // Initialize scene manager (adapted from maverick SceneManager)
      this.sceneManager = new CombatSceneManager(this.gameEngine.sceneManager.scene);

      // Create game world
      this.createWorld();

      // Initialize weapon system
      this.weaponSystem = new WeaponSystem(this, this.audioManager);

      // Initialize enemy system
      this.enemySystem = new EnemySystem(this, this.audioManager);

      // Set up controls
      this.setupControls();

      // Initialize game state
      this.initializeGameState();

      this.isInitialized = true;
      console.log('[CombatGame] Combat mode initialization complete');

    } catch (error) {
      console.error('[CombatGame] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize the HUD system
   */
  async initHUD() {
    // Import CombatHUD dynamically
    let CombatHUD;
    if (typeof require !== 'undefined') {
      CombatHUD = require('./CombatHUD.js');
    } else {
      CombatHUD = window.CombatHUD;
    }

    if (!CombatHUD) {
      console.error('[CombatGame] CombatHUD not available');
      return;
    }

    this.hud = new CombatHUD(this.uiManager);
    await this.hud.init();
  }

  /**
   * Load combat-specific sounds
   */
  async loadSounds() {
    console.log('[CombatGame] Loading combat sounds...');

    // Ocean and propeller (shared with classic)
    await this.audioManager.load('ocean', null, 'modes/combat/assets/audio/ocean.mp3');
    await this.audioManager.load('propeller', null, 'modes/combat/assets/audio/propeller.mp3');

    // Coin sounds (shared with classic)
    await this.audioManager.load('coin-1', 'coin', 'modes/combat/assets/audio/coin-1.mp3');
    await this.audioManager.load('coin-2', 'coin', 'modes/combat/assets/audio/coin-2.mp3');
    await this.audioManager.load('coin-3', 'coin', 'modes/combat/assets/audio/coin-3.mp3');
    await this.audioManager.load('jar-1', 'coin', 'modes/combat/assets/audio/jar-1.mp3');
    await this.audioManager.load('jar-2', 'coin', 'modes/combat/assets/audio/jar-2.mp3');
    await this.audioManager.load('jar-3', 'coin', 'modes/combat/assets/audio/jar-3.mp3');
    await this.audioManager.load('jar-4', 'coin', 'modes/combat/assets/audio/jar-4.mp3');
    await this.audioManager.load('jar-5', 'coin', 'modes/combat/assets/audio/jar-5.mp3');
    await this.audioManager.load('jar-6', 'coin', 'modes/combat/assets/audio/jar-6.mp3');
    await this.audioManager.load('jar-7', 'coin', 'modes/combat/assets/audio/jar-7.mp3');

    // Crash sounds
    await this.audioManager.load('airplane-crash-1', 'airplane-crash', 'modes/combat/assets/audio/airplane-crash-1.mp3');
    await this.audioManager.load('airplane-crash-2', 'airplane-crash', 'modes/combat/assets/audio/airplane-crash-2.mp3');
    await this.audioManager.load('airplane-crash-3', 'airplane-crash', 'modes/combat/assets/audio/airplane-crash-3.mp3');

    // Combat-specific sounds
    await this.audioManager.load('bubble', 'bubble', 'modes/combat/assets/audio/bubble.mp3');
    await this.audioManager.load('shot-soft', 'shot-soft', 'modes/combat/assets/audio/shot-soft.mp3');
    await this.audioManager.load('shot-hard', 'shot-hard', 'modes/combat/assets/audio/shot-hard.mp3');
    await this.audioManager.load('bullet-impact', 'bullet-impact', 'modes/combat/assets/audio/bullet-impact-rock.mp3');
    await this.audioManager.load('water-splash', 'water-splash', 'modes/combat/assets/audio/water-splash.mp3');
    await this.audioManager.load('rock-shatter-1', 'rock-shatter', 'modes/combat/assets/audio/rock-shatter-1.mp3');
    await this.audioManager.load('rock-shatter-2', 'rock-shatter', 'modes/combat/assets/audio/rock-shatter-2.mp3');
  }

  /**
   * Initialize game state
   */
  initializeGameState() {
    this.game = {
      speed: 0,
      initSpeed: 0.00035,
      baseSpeed: 0.00035,
      targetBaseSpeed: 0.00035,
      incrementSpeedByTime: 0.0000025,
      incrementSpeedByLevel: 0.000005,
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
      planeAmpWidth: 70,
      planeMoveSensivity: 0.005,
      planeRotXSensivity: 0.0008,
      planeRotZSensivity: 0.0004,
      planeFallSpeed: 0.001,
      planeMinSpeed: 1.2,
      planeMaxSpeed: 1.6,
      planeSpeed: 0,
      planeCollisionDisplacementX: 0,
      planeCollisionSpeedX: 0,
      planeCollisionDisplacementY: 0,
      planeCollisionSpeedY: 0,
      seaRadius: 600,
      planeCollisionDisplacementZ: 0,
      planeCollisionSpeedZ: 0,

      seaRotationSpeed: 0.006,
      wavesMinAmp: 5,
      wavesMaxAmp: 20,
      wavesMinSpeed: 0.001,
      wavesMaxSpeed: 0.003,

      cameraFarPos: 500,
      cameraNearPos: 150,
      cameraSensivity: 0.002,

      coinDistanceTolerance: 15,
      coinValue: 3,
      coinsSpeed: { x: 0, y: 0, z: 0.01 },
      coinLastSpawn: 0,
      distanceForCoinsSpawn: 100,

      enemyDistanceTolerance: 10,
      enemyValue: 10,
      enemiesSpeed: { x: 0, y: 0, z: 0.005 },
      enemyLastSpawn: 0,
      distanceForEnemiesSpawn: 50,

      collectibleDistanceTolerance: 15,
      collectibleValue: 30,
      collectiblesSpeed: { x: 0, y: 0, z: 0.008 },
      collectibleLastSpawn: 0,
      distanceForCollectiblesSpawn: 100,

      status: "waitingReplay",

      // Combat-specific state
      lives: 3,
      score: 0,
      ammo: 100,
      weaponLevel: 1,
      paused: true
    };

    // Reset collections
    this.clouds = [];
    this.coins = [];
    this.enemies = [];
    this.projectiles = [];
    this.collectibles = [];
  }

  /**
   * Create the game world
   */
  createWorld() {
    console.log('[CombatGame] Creating combat world...');

    // Create airplane
    this.createAirplane();

    // Create environment
    this.createSea();
    this.createSky();
    this.createLights();

    // Create initial objects
    this.createCoins();
    this.createEnemies();
    this.createCollectibles();
    this.createClouds();

    console.log('[CombatGame] Combat world created');
  }

  /**
   * Create the airplane
   */
  createAirplane() {
    this.airplane = new CombatAirplane();
    this.airplane.mesh.scale.set(0.25, 0.25, 0.25);
    this.airplane.mesh.position.y = this.game.planeDefaultHeight;
    this.sceneManager.scene.add(this.airplane.mesh);

    // Create pilot
    this.pilot = new CombatPilot();
    this.pilot.mesh.position.set(-10, 27, 0);
    this.airplane.mesh.add(this.pilot.mesh);
  }

  /**
   * Create sea
   */
  createSea() {
    this.sea = new CombatSea();
    this.sea.mesh.position.y = -600;
    this.sceneManager.scene.add(this.sea.mesh);
  }

  /**
   * Create sky
   */
  createSky() {
    this.sky = new CombatSky();
    this.sky.mesh.position.y = -500;
    this.sceneManager.scene.add(this.sky.mesh);
  }

  /**
   * Create lights
   */
  createLights() {
    // Hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
    this.sceneManager.scene.add(hemisphereLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
    this.sceneManager.scene.add(ambientLight);

    // Directional light
    const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
    shadowLight.position.set(150, 350, 350);
    shadowLight.castShadow = true;
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;
    this.sceneManager.scene.add(shadowLight);
  }

  /**
   * Create coins
   */
  createCoins() {
    for (let i = 0; i < 10; i++) {
      const coin = new CombatCoin();
      this.coins.push(coin);
    }
  }

  /**
   * Create enemies
   */
  createEnemies() {
    for (let i = 0; i < 6; i++) {
      const enemy = new CombatEnemy();
      this.enemies.push(enemy);
    }
  }

  /**
   * Create collectibles
   */
  createCollectibles() {
    for (let i = 0; i < 3; i++) {
      const collectible = new CombatCollectible();
      this.collectibles.push(collectible);
    }
  }

  /**
   * Create clouds
   */
  createClouds() {
    for (let i = 0; i < 20; i++) {
      const cloud = new CombatCloud();
      this.clouds.push(cloud);
    }
  }

  /**
   * Set up controls
   */
  setupControls() {
    this.mousePos = { x: 0, y: 0 };
    this.keys = {};

    document.addEventListener('keydown', this.handleKeyDown.bind(this), false);
    document.addEventListener('keyup', this.handleKeyUp.bind(this), false);
    document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
    document.addEventListener('mouseup', this.handleMouseUp.bind(this), false);
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
    document.addEventListener('blur', this.handleBlur.bind(this), false);

    // Touch controls
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
  }

  /**
   * Update game loop
   */
  update(deltaTime) {
    this.deltaTime = deltaTime;

    if (this.game.status === "playing") {
      this.updateGame();
    } else if (this.game.status === "waitingReplay") {
      // Handle replay waiting state
    }

    // Update HUD
    if (this.hud) {
      this.hud.update(this.game);
    }

    // Update scene manager
    if (this.sceneManager) {
      this.sceneManager.update(deltaTime);
    }
  }

  /**
   * Update game logic
   */
  updateGame() {
    // Update game state
    this.updateSpeed();
    this.updateDistance();
    this.updateEnergy();
    this.updateLevel();

    // Update airplane
    this.updateAirplane();

    // Update environment
    this.updateSea();
    this.updateSky();

    // Update objects
    this.updateCoins();
    this.updateEnemies();
    this.updateCollectibles();
    this.updateClouds();
    this.updateProjectiles();

    // Update camera
    this.updateCamera();

    // Check collisions
    this.checkCollisions();
  }

  /**
   * Update airplane
   */
  updateAirplane() {
    if (!this.airplane) return;

    // Update airplane position and rotation based on mouse
    const targetX = this.mousePos.x * this.game.planeAmpWidth;
    const targetY = this.game.planeDefaultHeight + this.mousePos.y * this.game.planeAmpHeight;

    this.airplane.mesh.position.x += (targetX - this.airplane.mesh.position.x) * this.deltaTime * this.game.planeMoveSensivity * 60;
    this.airplane.mesh.position.y += (targetY - this.airplane.mesh.position.y) * this.deltaTime * this.game.planeMoveSensivity * 60;

    // Update rotation
    this.airplane.mesh.rotation.x = (this.airplane.mesh.position.y - targetY) * this.game.planeRotXSensivity;
    this.airplane.mesh.rotation.z = (targetX - this.airplane.mesh.position.x) * this.game.planeRotZSensivity;

    // Update pilot
    if (this.pilot) {
      this.pilot.updateHairs();
    }
  }

  /**
   * Update camera
   */
  updateCamera() {
    const targetZ = this.airplane.mesh.position.z - this.game.cameraFarPos;
    this.gameEngine.camera.position.z += (targetZ - this.gameEngine.camera.position.z) * this.deltaTime * this.game.cameraSensivity * 60;

    this.gameEngine.camera.position.x = this.airplane.mesh.position.x;
    this.gameEngine.camera.position.y = this.airplane.mesh.position.y + this.game.cameraNearPos;

    this.gameEngine.camera.lookAt(this.airplane.mesh.position);
  }

  /**
   * Update speed
   */
  updateSpeed() {
    this.game.speed += (this.game.targetBaseSpeed - this.game.speed) * this.deltaTime * 60;
    this.game.planeSpeed = this.game.speed * this.game.planeMaxSpeed;
  }

  /**
   * Update distance
   */
  updateDistance() {
    this.game.distance += this.game.speed * this.deltaTime * this.game.ratioSpeedDistance * 60;
  }

  /**
   * Update energy
   */
  updateEnergy() {
    this.game.energy -= this.game.speed * this.deltaTime * this.game.ratioSpeedEnergy * 60;
    this.game.energy = Math.max(0, this.game.energy);

    if (this.game.energy <= 0) {
      this.game.status = "gameover";
      if (this.audioManager) {
        this.audioManager.stop('ocean');
        this.audioManager.stop('propeller');
        this.audioManager.play('airplane-crash', {volume: 1.0});
      }
    }
  }

  /**
   * Update level
   */
  updateLevel() {
    if (Math.floor(this.game.distance) % this.game.distanceForLevelUpdate == 0 &&
        Math.floor(this.game.distance) > this.game.levelLastUpdate) {
      this.game.levelLastUpdate = Math.floor(this.game.distance);
      this.game.level++;
      this.game.targetBaseSpeed = this.game.initSpeed + this.game.incrementSpeedByLevel * this.game.level;

      if (this.hud) {
        this.hud.onLevelUp(this.game.level);
      }
    }
  }

  /**
   * Update sea
   */
  updateSea() {
    if (this.sea) {
      this.sea.update(this.game.speed, this.deltaTime);
    }
  }

  /**
   * Update sky
   */
  updateSky() {
    if (this.sky) {
      this.sky.update(this.deltaTime);
    }
  }

  /**
   * Update coins
   */
  updateCoins() {
    this.coins.forEach(coin => {
      coin.update(this.game.speed, this.deltaTime);
    });
  }

  /**
   * Update enemies
   */
  updateEnemies() {
    this.enemies.forEach(enemy => {
      enemy.update(this.game.speed, this.deltaTime);
    });
  }

  /**
   * Update collectibles
   */
  updateCollectibles() {
    this.collectibles.forEach(collectible => {
      collectible.update(this.game.speed, this.deltaTime);
    });
  }

  /**
   * Update clouds
   */
  updateClouds() {
    this.clouds.forEach(cloud => {
      cloud.update(this.game.speed, this.deltaTime);
    });
  }

  /**
   * Update projectiles
   */
  updateProjectiles() {
    this.projectiles.forEach(projectile => {
      projectile.update(this.deltaTime);
    });

    // Remove dead projectiles
    this.projectiles = this.projectiles.filter(projectile => !projectile.dead);
  }

  /**
   * Check collisions
   */
  checkCollisions() {
    // Check coin collisions
    this.coins.forEach(coin => {
      if (coin.alive && this.checkCollision(this.airplane.mesh, coin.mesh)) {
        coin.kill();
        this.game.score += this.game.coinValue;
        if (this.audioManager) {
          this.audioManager.play('coin', {volume: 0.5});
        }
      }
    });

    // Check enemy collisions
    this.enemies.forEach(enemy => {
      if (enemy.alive && this.checkCollision(this.airplane.mesh, enemy.mesh)) {
        enemy.kill();
        this.game.lives--;
        if (this.game.lives <= 0) {
          this.game.status = "gameover";
        }
        if (this.audioManager) {
          this.audioManager.play('airplane-crash', {volume: 1.0});
        }
      }
    });

    // Check collectible collisions
    this.collectibles.forEach(collectible => {
      if (collectible.alive && this.checkCollision(this.airplane.mesh, collectible.mesh)) {
        collectible.kill();
        this.game.score += this.game.collectibleValue;
        // TODO: Apply collectible effects (extra life, weapon upgrade, etc.)
      }
    });

    // Check projectile collisions with enemies
    this.projectiles.forEach(projectile => {
      this.enemies.forEach(enemy => {
        if (projectile.alive && enemy.alive && this.checkCollision(projectile.mesh, enemy.mesh)) {
          projectile.kill();
          enemy.hit(projectile.damage);
          if (!enemy.alive) {
            this.game.score += this.game.enemyValue;
          }
        }
      });
    });
  }

  /**
   * Check collision between two meshes
   */
  checkCollision(mesh1, mesh2) {
    const distance = mesh1.position.distanceTo(mesh2.position);
    return distance < this.game.coinDistanceTolerance;
  }

  /**
   * Handle key down events
   */
  handleKeyDown(event) {
    this.keys[event.keyCode] = true;

    // Space bar to shoot
    if (event.keyCode === 32 && this.weaponSystem) { // Space
      this.weaponSystem.shoot();
      event.preventDefault();
    }
  }

  /**
   * Handle key up events
   */
  handleKeyUp(event) {
    this.keys[event.keyCode] = false;
  }

  /**
   * Handle mouse down events
   */
  handleMouseDown(event) {
    if (this.weaponSystem) {
      this.weaponSystem.shoot();
    }
  }

  /**
   * Handle mouse up events
   */
  handleMouseUp(event) {
    // Handle replay restart
    if (this.game.status === "waitingReplay") {
      this.resetGame();
    }
  }

  /**
   * Handle mouse move events
   */
  handleMouseMove(event) {
    const rect = this.gameEngine.renderer.domElement.getBoundingClientRect();
    this.mousePos.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    this.mousePos.y = -(event.clientY - rect.top) / rect.height * 2 + 1;
  }

  /**
   * Handle touch events
   */
  handleTouchStart(event) {
    if (this.weaponSystem) {
      this.weaponSystem.shoot();
    }
  }

  handleTouchEnd(event) {
    if (this.game.status === "waitingReplay") {
      this.resetGame();
    }
  }

  handleTouchMove(event) {
    if (event.touches.length > 0) {
      const rect = this.gameEngine.renderer.domElement.getBoundingClientRect();
      this.mousePos.x = (event.touches[0].clientX - rect.left) / rect.width * 2 - 1;
      this.mousePos.y = -(event.touches[0].clientY - rect.top) / rect.height * 2 + 1;
    }
  }

  /**
   * Handle window blur
   */
  handleBlur(event) {
    // Pause game when window loses focus
    this.game.paused = true;
  }

  /**
   * Reset game
   */
  resetGame() {
    console.log('[CombatGame] Resetting game');

    this.initializeGameState();

    // Reset airplane position
    if (this.airplane) {
      this.airplane.mesh.position.set(0, this.game.planeDefaultHeight, 0);
      this.airplane.mesh.rotation.set(0, 0, 0);
    }

    // Reset camera
    if (this.gameEngine.camera) {
      this.gameEngine.camera.position.set(0, this.game.planeDefaultHeight + this.game.cameraNearPos, -this.game.cameraFarPos);
    }

    // Clear all objects
    this.clearObjects();

    // Start new game
    this.startGame();
  }

  /**
   * Start game
   */
  startGame() {
    console.log('[CombatGame] Starting game');

    this.game.status = "playing";
    this.game.paused = false;

    // Start audio
    if (this.audioManager && !this.soundPlaying) {
      this.audioManager.play('propeller', {loop: true, volume: 1.0});
      this.audioManager.play('ocean', {loop: true, volume: 1.0});
      this.soundPlaying = true;
    }

    // Show HUD
    if (this.hud) {
      this.hud.show();
    }
  }

  /**
   * Clear all game objects
   */
  clearObjects() {
    // Clear coins
    this.coins.forEach(coin => {
      if (coin.mesh.parent) {
        coin.mesh.parent.remove(coin.mesh);
      }
    });

    // Clear enemies
    this.enemies.forEach(enemy => {
      if (enemy.mesh.parent) {
        enemy.mesh.parent.remove(enemy.mesh);
      }
    });

    // Clear collectibles
    this.collectibles.forEach(collectible => {
      if (collectible.mesh.parent) {
        collectible.mesh.parent.remove(collectible.mesh);
      }
    });

    // Clear projectiles
    this.projectiles.forEach(projectile => {
      if (projectile.mesh.parent) {
        projectile.mesh.parent.remove(projectile.mesh);
      }
    });

    // Clear clouds
    this.clouds.forEach(cloud => {
      if (cloud.mesh.parent) {
        cloud.mesh.parent.remove(cloud.mesh);
      }
    });
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    this.HEIGHT = window.innerHeight;
    this.WIDTH = window.innerWidth;
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('[CombatGame] Disposing resources');

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown.bind(this), false);
    document.removeEventListener('keyup', this.handleKeyUp.bind(this), false);
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this), false);
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this), false);
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this), false);
    document.removeEventListener('blur', this.handleBlur.bind(this), false);
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this), false);
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this), false);
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this), false);

    // Dispose HUD
    if (this.hud) {
      this.hud.dispose();
      this.hud = null;
    }

    // Clear objects
    this.clearObjects();

    // Clear references
    this.airplane = null;
    this.sky = null;
    this.sea = null;
    this.pilot = null;
    this.sceneManager = null;
    this.weaponSystem = null;
    this.enemySystem = null;

    this.isInitialized = false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatGame;
} else if (typeof window !== 'undefined') {
  window.CombatGame = CombatGame;
}
