/**
 * CombatProjectile - Projectile class for Combat mode
 * Adapted from maverick Projectile class
 */
class CombatProjectile {
  constructor(damage = 1) {
    const geom = new THREE.CylinderGeometry(1, 1, 4, 8);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.yellow,
      emissive: Colors.yellow,
      emissiveIntensity: 0.5,
      flatShading: true
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;

    this.damage = damage;
    this.speed = 0.8;
    this.direction = new THREE.Vector3(1, 0, 0);
    this.alive = true;
    this.distanceTraveled = 0;
    this.maxDistance = 1000;

    // Set up user data for collision detection
    this.mesh.userData = { type: 'projectile', damage: this.damage };

    console.log('[CombatProjectile] Created with', damage, 'damage');
  }

  /**
   * Set projectile direction
   */
  setDirection(direction) {
    this.direction.copy(direction).normalize();
  }

  /**
   * Update projectile position
   */
  update(deltaTime) {
    if (!this.alive) return;

    // Move projectile
    const movement = this.direction.clone().multiplyScalar(this.speed * deltaTime * 60);
    this.mesh.position.add(movement);

    this.distanceTraveled += movement.length();

    // Check if out of bounds or traveled too far
    if (this.distanceTraveled > this.maxDistance ||
        Math.abs(this.mesh.position.x) > 2000 ||
        Math.abs(this.mesh.position.y) > 2000 ||
        this.mesh.position.z < -2000) {
      this.kill();
    }
  }

  /**
   * Kill the projectile (remove it)
   */
  kill() {
    this.alive = false;
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatProjectile;
} else if (typeof window !== 'undefined') {
  window.CombatProjectile = CombatProjectile;
}
