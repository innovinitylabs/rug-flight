// CombatGame - Combat mode extending BaseGame
// Shoot enemies, collect coins, health system

(function() {
  'use strict';

  class CombatGame extends BaseGame {
    constructor(engine, config = {}) {
      super(engine, {
        mode: 'combat',
        gameState: {
          coins: 0,
          hitpoints: 3,
          maxHitpoints: 3,
          level: 1,
          levelProgress: 0,
          coinDistanceTolerance: 15,
          coinValue: 10,
          coinLastSpawn: 0,
          distanceForCoinsSpawn: 100,
          enemyDistanceTolerance: 10,
          enemyValue: 10,
          enemyLastSpawn: 0,
          distanceForEnemiesSpawn: 75,
          projectileSpeed: 0.8,
          projectileDamage: 1
        },
        ...config
      });

      // Combat-specific properties
      this.coins = 0;
      this.hitpoints = 3;
      this.projectiles = [];
      this.mousePos = { x: 0, y: 0 };

      console.log('[CombatGame] Combat mode initialized');
    }

    async init() {
      // Call parent init
      await super.init();

      // Setup input handling
      this.setupInput();

      console.log('[CombatGame] Combat mode fully initialized');
    }

    async createAirplane() {
      // Create combat airplane with weapons
      const airplane = new window.CombatAirplane();
      airplane.mesh.position.y = this.gameState.planeDefaultHeight;

      this.engine.addAirplane(airplane);
    }

    async createModeSpecificScene() {
      // Combat mode specific scene setup can go here
    }

    async loadModeSpecificAudio() {
      const combatAudioFiles = [
        { name: 'coin', url: 'games/top-rug-maverick/assets/audio/coin.mp3' },
        { name: 'bullet-impact', url: 'games/top-rug-maverick/assets/audio/bullet-impact-rock.mp3' },
        { name: 'shot-soft', url: 'games/top-rug-maverick/assets/audio/shot-soft.mp3' },
        { name: 'airplane-crash-1', url: 'games/top-rug-maverick/assets/audio/airplane-crash-1.mp3' }
      ];

      for (const audio of combatAudioFiles) {
        await this.engine.audioManager.load(audio.name, audio.url);
      }
    }

    setupInput() {
      // Mouse controls for airplane
      document.addEventListener('mousemove', (event) => {
        this.mousePos.x = event.clientX;
        this.mousePos.y = event.clientY;
      });

      // Shooting controls
      document.addEventListener('mousedown', (event) => {
        if (event.button === 0 && this.gameState.status === 'playing') { // Left click
          this.handleShoot();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && this.gameState.status === 'playing') {
          event.preventDefault();
          this.handleShoot();
        }
      });
    }

    handleShoot() {
      if (!this.engine.airplane) return;

      // Create projectile
      const projectile = new window.CombatProjectile();
      projectile.mesh.position.copy(this.engine.airplane.mesh.position);
      projectile.mesh.position.z -= 10; // Start in front of plane

      // Set direction (forward)
      projectile.direction.set(0, 0, -1);

      this.engine.scene.add(projectile.mesh);
      this.projectiles.push(projectile);

      // Play shooting sound
      this.playSound('shot-soft');

      console.log('[CombatGame] Fired projectile');
    }

    update(deltaTime) {
      // Call parent update
      super.update(deltaTime);

      // Handle mouse controls
      this.handleMouseControls();

      // Update projectiles
      this.updateProjectiles(deltaTime);

      // Spawn objects
      this.spawnObjects();

      // Check collisions
      this.checkCollisions();

      // Cleanup objects
      this.cleanupObjects();
    }

    handleMouseControls() {
      if (!this.engine.airplane) return;

      // Convert mouse position to 3D world coordinates
      const mouseX = (this.mousePos.x / window.innerWidth) * 2 - 1;
      const mouseY = -(this.mousePos.y / window.innerHeight) * 2 + 1;

      // Update airplane position based on mouse
      const targetX = mouseX * this.gameState.planeAmpWidth;
      const targetY = this.gameState.planeDefaultHeight + mouseY * this.gameState.planeAmpHeight;

      // Smooth movement
      this.engine.airplane.mesh.position.x += (targetX - this.engine.airplane.mesh.position.x) * 0.1;
      this.engine.airplane.mesh.position.y += (targetY - this.engine.airplane.mesh.position.y) * 0.1;
    }

    updateProjectiles(deltaTime) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const projectile = this.projectiles[i];
        projectile.update(deltaTime);

        // Remove if out of bounds
        if (projectile.mesh.position.z < -500) {
          this.engine.scene.remove(projectile.mesh);
          this.projectiles.splice(i, 1);
        }
      }
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
      const coin = new window.CombatCoin();

      // Random position
      coin.mesh.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 50 + 50,
        -300
      );

      this.engine.addCoin(coin);
    }

    spawnEnemy() {
      const enemy = new window.CombatEnemy();

      // Random position
      enemy.mesh.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 50 + 50,
        -300
      );

      this.engine.addEnemy(enemy);
    }

    checkCollisions() {
      // Check projectile-enemy collisions
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const projectile = this.projectiles[i];

        for (let j = this.engine.enemies.length - 1; j >= 0; j--) {
          const enemy = this.engine.enemies[j];

          if (this.checkCollision(projectile)) {
            // Hit!
            this.engine.scene.remove(projectile.mesh);
            this.engine.scene.remove(enemy.mesh);

            this.projectiles.splice(i, 1);
            this.engine.enemies.splice(j, 1);

            this.coins += this.gameState.enemyValue;
            this.playSound('bullet-impact');

            console.log(`[CombatGame] Enemy destroyed! Coins: ${this.coins}`);
            break;
          }
        }
      }

      // Check airplane-coin collisions
      for (let i = this.engine.coins.length - 1; i >= 0; i--) {
        const coin = this.engine.coins[i];

        if (this.checkCollision(coin)) {
          this.engine.removeCoin(coin);
          this.coins += coin.value;
          this.playSound('coin');

          console.log(`[CombatGame] Coin collected! Coins: ${this.coins}`);
        }
      }

      // Check airplane-enemy collisions
      for (let i = this.engine.enemies.length - 1; i >= 0; i--) {
        const enemy = this.engine.enemies[i];

        if (this.checkCollision(enemy)) {
          this.hitEnemy(enemy);
          this.engine.removeEnemy(enemy);
        }
      }
    }

    checkCollision(obj) {
      if (!this.engine.airplane) return false;
      const distance = this.engine.airplane.mesh.position.distanceTo(obj.mesh.position);
      return distance < 20;
    }

    hitEnemy(enemy) {
      this.hitpoints--;

      this.playSound('airplane-crash-1');

      if (this.hitpoints <= 0) {
        this.gameState.status = 'gameover';
        console.log('[CombatGame] Game Over!');
      }

      console.log(`[CombatGame] Hit by enemy! Hitpoints: ${this.hitpoints}`);
    }

    cleanupObjects() {
      // Remove projectiles that are too far
      this.projectiles = this.projectiles.filter(projectile => {
        if (projectile.mesh.position.z < -500) {
          this.engine.scene.remove(projectile.mesh);
          return false;
        }
        return true;
      });

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

      // Update coins display
      if (this.uiElements.coins) {
        this.updateUIElement(this.uiElements.coins, this.coins);
      }

      // Update hearts display
      this.updateHearts();
    }

    updateHearts() {
      for (let i = 1; i <= this.gameState.maxHitpoints; i++) {
        const heartImg = document.getElementById(`heart-${i}`);
        if (heartImg) {
          const heartSrc = i <= this.hitpoints ?
            'games/top-rug-maverick/assets/images/hearts.png' :
            'games/top-rug-maverick/assets/images/heart.png';
          heartImg.src = heartSrc;
        }
      }
    }

    getGameState() {
      return {
        ...super.getGameState(),
        coins: this.coins,
        hitpoints: this.hitpoints
      };
    }

    setGameState(state) {
      super.setGameState(state);
      if (state.coins !== undefined) this.coins = state.coins;
      if (state.hitpoints !== undefined) this.hitpoints = state.hitpoints;
    }
  }

  // Export globally
  window.CombatGame = CombatGame;

  console.log('[CombatGame] Combat mode implementation loaded');

})();
