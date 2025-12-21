// ClassicGame - Classic mode extending BaseGame
// Collect pills, avoid obstacles, NFT banner

(function() {
  'use strict';

  class ClassicGame extends BaseGame {
    constructor(engine, config = {}) {
      super(engine, {
        mode: 'classic',
        gameState: {
          energy: 100,
          level: 1,
          levelProgress: 0,
          coinDistanceTolerance: 15,
          coinValue: 3,
          coinLastSpawn: 0,
          distanceForCoinsSpawn: 100,
          enemyDistanceTolerance: 10,
          enemyValue: 10,
          enemyLastSpawn: 0,
          distanceForEnemiesSpawn: 50
        },
        ...config
      });

      // Classic-specific properties
      this.energy = 100;
      this.coinsCollected = 0;
      this.bannerSystem = null;

      console.log('[ClassicGame] Classic mode initialized');
    }

    async init() {
      // Call parent init
      await super.init();

      // Initialize classic-specific HUD elements
      this.uiElements.energyBar = 'energyBar';

      console.log('[ClassicGame] Classic mode fully initialized');
    }

    async createAirplane() {
      // Create classic airplane
      const airplane = new window.Airplane();
      airplane.mesh.position.y = this.gameState.planeDefaultHeight;

      this.engine.addAirplane(airplane);
    }

    async createModeSpecificScene() {
      // Create banner system
      await this.createBannerSystem();
    }

    async createBannerSystem() {
      // Import BannerSystem dynamically
      if (typeof window.BannerSystem !== 'undefined') {
        this.bannerSystem = new window.BannerSystem(this.engine.scene, this.engine.textureManager);
        await this.bannerSystem.init();
        console.log('[ClassicGame] Banner system initialized');
      } else {
        console.warn('[ClassicGame] BannerSystem not available');
      }
    }

    async loadModeSpecificAudio() {
      const classicAudioFiles = [
        { name: 'coin-1', url: 'games/top-rug/assets/audio/coin-1.mp3' },
        { name: 'coin-2', url: 'games/top-rug/assets/audio/coin-2.mp3' },
        { name: 'coin-3', url: 'games/top-rug/assets/audio/coin-3.mp3' },
        { name: 'airplane-crash-1', url: 'games/top-rug/assets/audio/airplane-crash-1.mp3' }
      ];

      for (const audio of classicAudioFiles) {
        await this.engine.audioManager.load(audio.name, audio.url);
      }
    }

    update(deltaTime) {
      // Call parent update
      super.update(deltaTime);

      // Update banner
      if (this.bannerSystem && this.bannerSystem.update) {
        this.bannerSystem.update(deltaTime);
      }

      // Spawn coins and enemies
      this.spawnObjects();

      // Check collisions
      this.checkCollisions();

      // Update energy
      this.energy = Math.max(0, Math.min(100, this.energy));
    }

    spawnObjects() {
      // Spawn coins
      if (this.gameState.distance - this.gameState.coinLastSpawn > this.gameState.distanceForCoinsSpawn) {
        this.spawnCoin();
        this.gameState.coinLastSpawn = this.gameState.distance;
      }

      // Spawn enemies
      if (this.gameState.distance - this.gameState.enemyLastSpawn > this.gameState.distanceForEnemiesSpawn) {
        this.spawnEnemy();
        this.gameState.enemyLastSpawn = this.gameState.distance;
      }
    }

    spawnCoin() {
      // Create a simple coin mesh
      const geomCoin = new THREE.CylinderGeometry(5, 5, 2, 16, 1);
      const matCoin = new THREE.MeshPhongMaterial({
        color: this.getGameUtils().Colors.yellow,
        emissive: this.getGameUtils().Colors.yellow,
        emissiveIntensity: 0.3,
        shininess: 100
      });

      const coin = new THREE.Mesh(geomCoin, matCoin);

      // Random position
      coin.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 50 + 50,
        -300
      );

      const coinObj = {
        mesh: coin,
        collected: false,
        value: this.gameState.coinValue,
        update: function(deltaTime) {
          if (!this.collected) {
            // Move toward player
            this.mesh.position.z += 50 * deltaTime;

            // Simple animation
            this.mesh.rotation.y += deltaTime * 2;
          }
        }
      };

      this.engine.addCoin(coinObj);
    }

    spawnEnemy() {
      // Create a simple enemy mesh
      const geomEnemy = new THREE.BoxGeometry(30, 20, 60);
      const matEnemy = new THREE.MeshPhongMaterial({
        color: this.getGameUtils().Colors.red,
        flatShading: true
      });

      const enemy = new THREE.Mesh(geomEnemy, matEnemy);

      // Random position
      enemy.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 30 + 40,
        -300
      );

      const enemyObj = {
        mesh: enemy,
        alive: true,
        update: function(deltaTime) {
          if (this.alive) {
            // Move toward player
            this.mesh.position.z += 30 * deltaTime;
          }
        }
      };

      this.engine.addEnemy(enemyObj);
    }

    checkCollisions() {
      // Check coin collisions
      for (let i = this.engine.coins.length - 1; i >= 0; i--) {
        const coin = this.engine.coins[i];
        if (this.engine.airplane && this.checkCollision(coin)) {
          this.collectCoin(coin);
          this.engine.removeCoin(coin);
        }
      }

      // Check enemy collisions
      for (let i = this.engine.enemies.length - 1; i >= 0; i--) {
        const enemy = this.engine.enemies[i];
        if (this.engine.airplane && this.checkCollision(enemy)) {
          this.hitEnemy(enemy);
          this.engine.removeEnemy(enemy);
        }
      }

      // Remove objects that are too far
      this.cleanupObjects();
    }

    checkCollision(obj) {
      if (!this.engine.airplane) return false;
      const distance = this.engine.airplane.mesh.position.distanceTo(obj.mesh.position);
      return distance < 20; // Collision tolerance
    }

    collectCoin(coin) {
      this.coinsCollected += coin.value;
      this.energy = Math.min(100, this.energy + coin.value);

      // Play sound
      this.playSound('coin-1');

      console.log(`[ClassicGame] Coin collected! Energy: ${this.energy}`);
    }

    hitEnemy(enemy) {
      this.energy -= 20;

      // Play sound
      this.playSound('airplane-crash-1');

      if (this.energy <= 0) {
        this.gameState.status = 'gameover';
        console.log('[ClassicGame] Game Over!');
      }

      console.log(`[ClassicGame] Hit enemy! Energy: ${this.energy}`);
    }

    cleanupObjects() {
      // Remove coins that are behind camera
      this.engine.coins = this.engine.coins.filter(coin => {
        if (coin.mesh.position.z > 50) {
          this.engine.scene.remove(coin.mesh);
          return false;
        }
        return true;
      });

      // Remove enemies that are behind camera
      this.engine.enemies = this.engine.enemies.filter(enemy => {
        if (enemy.mesh.position.z > 50) {
          this.engine.scene.remove(enemy.mesh);
          return false;
        }
        return true;
      });
    }

    updateUI() {
      // Call parent update
      super.updateUI();

      // Update energy bar
      if (this.uiElements.energyBar) {
        const energyBar = document.getElementById(this.uiElements.energyBar);
        if (energyBar) {
          energyBar.style.width = `${this.energy}%`;
        }
      }
    }

    getGameState() {
      return {
        ...super.getGameState(),
        energy: this.energy,
        coinsCollected: this.coinsCollected
      };
    }

    setGameState(state) {
      super.setGameState(state);
      if (state.energy !== undefined) this.energy = state.energy;
      if (state.coinsCollected !== undefined) this.coinsCollected = state.coinsCollected;
    }
  }

  // Export globally
  window.ClassicGame = ClassicGame;

  console.log('[ClassicGame] Classic mode implementation loaded');

})();
