// BaseGameEngine - Shared Three.js game engine for both modes
// Handles common scene setup, rendering, audio, and game loop

(function() {
  'use strict';

  class BaseGameEngine {
    constructor(config = {}) {
      // Configuration
      this.config = {
        containerId: config.containerId || 'gameHolder',
        width: config.width || window.innerWidth,
        height: config.height || window.innerHeight,
        backgroundColor: config.backgroundColor || 0xf7d9aa,
        fogColor: config.fogColor || 0xf7d9aa,
        fogNear: config.fogNear || 100,
        fogFar: config.fogFar || 950,
        ...config
      };

      // Three.js core
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.lights = {};

      // Game state
      this.isInitialized = false;
      this.isRunning = false;
      this.lastTime = 0;

      // Audio
      this.audioManager = null;
      this.listener = null;

      // Game objects
      this.airplane = null;
      this.sea = null;
      this.coins = [];
      this.enemies = [];
      this.particles = [];

      // Callbacks for mode-specific logic
      this.onUpdate = config.onUpdate || (() => {});
      this.onRender = config.onRender || (() => {});
      this.onInit = config.onInit || (() => {});

      console.log('[BaseGameEngine] Initialized with config:', this.config);
    }

    async init() {
      console.log('[BaseGameEngine] Starting initialization...');

      // Create Three.js scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(this.config.backgroundColor);
      this.scene.fog = new THREE.Fog(this.config.fogColor, this.config.fogNear, this.config.fogFar);

      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.config.width / this.config.height,
        0.1,
        1000
      );
      this.camera.position.set(0, 100, 200);
      this.camera.lookAt(0, 0, 0);

      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(this.config.width, this.config.height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Attach renderer to DOM
      const container = document.getElementById(this.config.containerId);
      if (container) {
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);
      }

      // Setup lights
      this.setupLights();

      // Setup audio
      await this.setupAudio();

      // Setup event listeners
      this.setupEventListeners();

      // Call mode-specific initialization
      await this.onInit();

      this.isInitialized = true;
      console.log('[BaseGameEngine] Initialization complete');
    }

    setupLights() {
      // Hemisphere light
      this.lights.hemisphere = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
      this.scene.add(this.lights.hemisphere);

      // Ambient light
      this.lights.ambient = new THREE.AmbientLight(0xdc8874, 0.5);
      this.scene.add(this.lights.ambient);

      // Directional light (shadow caster)
      this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.9);
      this.lights.directional.position.set(150, 350, 350);
      this.lights.directional.castShadow = true;
      this.lights.directional.shadow.camera.left = -400;
      this.lights.directional.shadow.camera.right = 400;
      this.lights.directional.shadow.camera.top = 400;
      this.lights.directional.shadow.camera.bottom = -400;
      this.lights.directional.shadow.camera.near = 1;
      this.lights.directional.shadow.camera.far = 1000;
      this.lights.directional.shadow.mapSize.width = 2048;
      this.lights.directional.shadow.mapSize.height = 2048;
      this.scene.add(this.lights.directional);
    }

    async setupAudio() {
      // Create audio listener
      this.listener = new THREE.AudioListener();
      this.camera.add(this.listener);

      // Create audio manager if not provided
      if (!this.audioManager) {
        this.audioManager = new window.AudioManager();
        await this.audioManager.init(this.camera);
      }
    }

    setupEventListeners() {
      // Window resize
      window.addEventListener('resize', () => {
        this.handleResize();
      });
    }

    handleResize() {
      if (!this.camera || !this.renderer) return;

      this.config.width = window.innerWidth;
      this.config.height = window.innerHeight;

      this.camera.aspect = this.config.width / this.config.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.config.width, this.config.height);
    }

    // Game objects management
    addAirplane(airplane) {
      this.airplane = airplane;
      this.scene.add(airplane.mesh);
    }

    addSea(sea) {
      this.sea = sea;
      this.scene.add(sea.mesh);
    }

    addCoin(coin) {
      this.coins.push(coin);
      this.scene.add(coin.mesh);
    }

    removeCoin(coin) {
      const index = this.coins.indexOf(coin);
      if (index > -1) {
        this.coins.splice(index, 1);
        this.scene.remove(coin.mesh);
      }
    }

    addEnemy(enemy) {
      this.enemies.push(enemy);
      this.scene.add(enemy.mesh);
    }

    removeEnemy(enemy) {
      const index = this.enemies.indexOf(enemy);
      if (index > -1) {
        this.enemies.splice(index, 1);
        this.scene.remove(enemy.mesh);
      }
    }

    // Main game loop
    start() {
      if (this.isRunning) return;

      console.log('[BaseGameEngine] Starting game loop');
      this.isRunning = true;
      this.lastTime = performance.now();
      this.gameLoop();
    }

    stop() {
      console.log('[BaseGameEngine] Stopping game loop');
      this.isRunning = false;
    }

    gameLoop = (currentTime) => {
      if (!this.isRunning) return;

      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30);
      this.lastTime = currentTime;

      // Update game logic
      this.update(deltaTime);

      // Render scene
      this.render();

      // Continue loop
      requestAnimationFrame(this.gameLoop);
    };

    update(deltaTime) {
      // Update audio listener position
      if (this.audioManager) {
        this.audioManager.updateListenerPosition(this.camera);
      }

      // Update game objects
      if (this.airplane && this.airplane.update) {
        this.airplane.update(deltaTime);
      }

      // Update coins
      this.coins.forEach(coin => {
        if (coin.update) coin.update(deltaTime);
      });

      // Update enemies
      this.enemies.forEach(enemy => {
        if (enemy.update) enemy.update(deltaTime);
      });

      // Update particles
      this.particles.forEach(particle => {
        if (particle.update) particle.update(deltaTime);
      });

      // Call mode-specific update
      this.onUpdate(deltaTime);
    }

    render() {
      // Call mode-specific render
      this.onRender();

      // Render the scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    // Camera controls
    updateCamera(target = null) {
      if (!this.airplane) return;

      if (!target) {
        target = this.airplane.mesh.position;
      }

      this.camera.position.y = target.y + 100;
      this.camera.position.x = target.x;
      this.camera.position.z = target.z + 150;
      this.camera.lookAt(target);
    }

    // Utility methods
    getGameUtils() {
      return window.GameUtils || {
        Colors: { red: 0xf25346, white: 0xd8d0d1, blue: 0x68c3c0 },
        Constants: {}
      };
    }

    // Cleanup
    dispose() {
      this.stop();

      if (this.renderer) {
        this.renderer.dispose();
      }

      // Dispose of geometries and materials
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      console.log('[BaseGameEngine] Disposed');
    }
  }

  // Export globally
  window.BaseGameEngine = BaseGameEngine;

  console.log('[BaseGameEngine] Shared game engine loaded');

})();
