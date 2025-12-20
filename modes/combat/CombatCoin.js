/**
 * CombatCoin - Coin class for Combat mode
 * Adapted from maverick Coin class
 */
class CombatCoin {
  constructor() {
    const geom = new THREE.CylinderGeometry(4, 4, 1, 10);
    const mat = new THREE.MeshPhongMaterial({
      color: COLOR_COINS,
      shininess: 1,
      specular: 0xffffff,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.distance = 0;
    this.alive = true;

    // Set up user data for collision detection
    this.mesh.userData = { type: 'coin' };

    console.log('[CombatCoin] Created');
  }

  /**
   * Update coin position and check collisions
   */
  update(speed, deltaTime) {
    if (!this.alive) return;

    // Move coin backward
    this.angle += speed * deltaTime;

    // Update position
    this.mesh.position.y = -600 + Math.sin(this.angle) * this.distance; // seaRadius = 600
    this.mesh.position.x = Math.cos(this.angle) * this.distance;

    // Rotate for visual effect
    this.mesh.rotation.z += Math.random() * 0.1;
    this.mesh.rotation.y += Math.random() * 0.1;

    // Check if passed by player (cleanup)
    if (this.angle > Math.PI) {
      this.kill();
    }
  }

  /**
   * Kill the coin (remove it)
   */
  kill() {
    this.alive = false;
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }

  /**
   * Spawn particles when collected
   */
  spawnParticles() {
    // TODO: Implement particle system
    console.log('[CombatCoin] Particles spawned');
  }
}

// Coin color constant
const COLOR_COINS = 0xffd700; // Gold color

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatCoin;
} else if (typeof window !== 'undefined') {
  window.CombatCoin = CombatCoin;
  window.COLOR_COINS = COLOR_COINS;
}
