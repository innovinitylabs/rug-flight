/**
 * EnemySystem - Enemy spawning and management system for Combat mode
 * Handles enemy spawning, AI, and wave management
 */
class EnemySystem {
  constructor(combatGame, audioManager) {
    this.combatGame = combatGame;
    this.audioManager = audioManager;

    // Enemy spawning parameters
    this.spawnTimer = 0;
    this.spawnInterval = 2000; // ms between spawns
    this.maxEnemies = 6;
    this.enemiesPerWave = 3;

    console.log('[EnemySystem] Initialized');
  }

  /**
   * Update enemy system
   */
  update(deltaTime) {
    // Update spawn timer
    this.spawnTimer += deltaTime * 1000;

    // Spawn enemies if needed
    if (this.spawnTimer >= this.spawnInterval &&
        this.combatGame.enemies.filter(e => e.alive).length < this.maxEnemies) {
      this.spawnEnemies(this.enemiesPerWave);
      this.spawnTimer = 0;
    }

    // Increase difficulty over time
    this.updateDifficulty();
  }

  /**
   * Spawn a group of enemies
   */
  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      const enemy = new CombatEnemy();

      // Position enemy in front of player
      const baseDistance = 800; // Distance in front of player
      const angleOffset = (i - (count - 1) / 2) * 0.5; // Spread them out
      const randomAngle = (Math.random() - 0.5) * 0.5; // Add some randomness

      enemy.angle = -0.5 + angleOffset + randomAngle; // Start behind player
      enemy.distance = baseDistance + Math.random() * 200;

      // Set initial position
      enemy.mesh.position.x = Math.cos(enemy.angle) * enemy.distance;
      enemy.mesh.position.y = -600 + Math.sin(enemy.angle) * enemy.distance; // seaRadius = 600
      enemy.mesh.position.z = -100 - Math.random() * 100;

      // Add to game
      this.combatGame.enemies.push(enemy);
      this.combatGame.sceneManager.scene.add(enemy.mesh);

      console.log(`[EnemySystem] Spawned enemy ${i + 1}/${count}`);
    }
  }

  /**
   * Update difficulty based on game progress
   */
  updateDifficulty() {
    const level = this.combatGame.game?.level || 1;

    // Increase spawn rate and enemy count with level
    this.spawnInterval = Math.max(500, 2000 - (level - 1) * 200); // Faster spawning
    this.maxEnemies = Math.min(12, 6 + Math.floor((level - 1) / 2)); // More enemies
    this.enemiesPerWave = Math.min(5, 3 + Math.floor((level - 1) / 3)); // Larger waves
  }

  /**
   * Get current enemy statistics
   */
  getStats() {
    const activeEnemies = this.combatGame.enemies.filter(e => e.alive).length;
    const totalSpawned = this.combatGame.enemies.length;

    return {
      active: activeEnemies,
      total: totalSpawned,
      max: this.maxEnemies,
      spawnRate: this.spawnInterval
    };
  }

  /**
   * Clear all enemies
   */
  clearEnemies() {
    this.combatGame.enemies.forEach(enemy => {
      enemy.kill();
    });
    this.combatGame.enemies = [];
  }

  /**
   * Spawn a boss enemy (for future use)
   */
  spawnBoss() {
    console.log('[EnemySystem] Boss spawning not implemented yet');
    // TODO: Implement boss enemy spawning
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnemySystem;
} else if (typeof window !== 'undefined') {
  window.EnemySystem = EnemySystem;
}
