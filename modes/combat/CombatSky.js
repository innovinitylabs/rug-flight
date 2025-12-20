/**
 * CombatSky - Sky class for Combat mode
 * Adapted from maverick Sky class
 */
class CombatSky {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.nClouds = 20;
    this.clouds = [];

    const stepAngle = Math.PI * 2 / this.nClouds;
    for (let i = 0; i < this.nClouds; i++) {
      const c = new CombatCloud();
      this.clouds.push(c);
      const a = stepAngle * i;
      const h = 750 + Math.random() * 200; // seaRadius + 150 + Math.random()*200
      c.mesh.position.y = Math.sin(a) * h;
      c.mesh.position.x = Math.cos(a) * h;
      c.mesh.position.z = -300 - Math.random() * 500;
      c.mesh.rotation.z = a + Math.PI / 2;
      const scale = 1 + Math.random() * 2;
      c.mesh.scale.set(scale, scale, scale);
      this.mesh.add(c.mesh);
    }

    console.log('[CombatSky] Created with', this.nClouds, 'clouds');
  }

  /**
   * Update sky rotation
   */
  update(deltaTime) {
    for (let i = 0; i < this.nClouds; i++) {
      const c = this.clouds[i];
      c.update(deltaTime);
    }
    this.mesh.rotation.z += (window.game?.speed || 0.001) * deltaTime;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatSky;
} else if (typeof window !== 'undefined') {
  window.CombatSky = CombatSky;
}
