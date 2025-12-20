/**
 * CombatEnemy - Enemy class for Combat mode
 * Adapted from maverick Enemy class
 */
class CombatEnemy {
  constructor() {
    const geom = new THREE.TetrahedronGeometry(8, 2);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.red,
      shininess: 0,
      specular: 0xffffff,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.distance = 0;
    this.hitpoints = 3;
    this.alive = true;

    // Set up user data for collision detection
    this.mesh.userData = { type: 'enemy' };

    console.log('[CombatEnemy] Created with', this.hitpoints, 'HP');
  }

  /**
   * Update enemy position and check collisions
   */
  update(speed, deltaTime) {
    if (!this.alive) return;

    // Move enemy backward
    this.angle += speed * deltaTime;

    // Update position
    this.mesh.position.y = -600 + Math.sin(this.angle) * this.distance; // seaRadius = 600
    this.mesh.position.x = Math.cos(this.angle) * this.distance;

    // Rotate for visual effect
    this.mesh.rotation.y += Math.random() * 0.1;
    this.mesh.rotation.z += Math.random() * 0.1;

    // Check if passed by player (cleanup)
    if (this.angle > Math.PI) {
      this.kill();
    }
  }

  /**
   * Handle getting hit by projectile
   */
  hit(damage = 1) {
    this.hitpoints -= damage;
    console.log('[CombatEnemy] Hit! HP remaining:', this.hitpoints);

    if (this.hitpoints <= 0) {
      this.explode();
    }
  }

  /**
   * Explode enemy when destroyed
   */
  explode() {
    console.log('[CombatEnemy] Exploded!');
    this.kill();

    // TODO: Spawn particles
    // TODO: Play explosion sound
    // TODO: Update score
  }

  /**
   * Kill the enemy (remove it)
   */
  kill() {
    this.alive = false;
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }

  /**
   * Spawn particles when destroyed
   */
  spawnParticles() {
    // TODO: Implement particle system
    console.log('[CombatEnemy] Explosion particles spawned');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatEnemy;
} else if (typeof window !== 'undefined') {
  window.CombatEnemy = CombatEnemy;
}
