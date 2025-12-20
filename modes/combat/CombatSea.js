/**
 * CombatSea - Sea class for Combat mode
 * Adapted from maverick Sea class
 */
class CombatSea {
  constructor() {
    // Sea geometry parameters
    const seaRadius = 600;
    const seaLength = 800;

    const geom = new THREE.CylinderGeometry(seaRadius, seaRadius, seaLength, 40, 10);
    geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    this.waves = [];
    const arr = geom.attributes.position.array;
    for (let i = 0; i < arr.length / 3; i++) {
      this.waves.push({
        x: arr[i * 3 + 0],
        y: arr[i * 3 + 1],
        z: arr[i * 3 + 2],
        ang: Math.random() * Math.PI * 2,
        amp: 5 + Math.random() * 15, // wavesMinAmp + Math.random()*(wavesMaxAmp-wavesMinAmp)
        speed: 0.001 + Math.random() * 0.002 // wavesMinSpeed + Math.random()*(wavesMaxSpeed - wavesMinSpeed)
      });
    }

    const mat = new THREE.MeshPhongMaterial({
      color: COLOR_SEA_LEVEL[0],
      transparent: true,
      opacity: 0.8,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;

    console.log('[CombatSea] Created');
  }

  /**
   * Update sea waves
   */
  update(speed, deltaTime) {
    const arr = this.mesh.geometry.attributes.position.array;
    for (let i = 0; i < arr.length / 3; i++) {
      const wave = this.waves[i];
      arr[i * 3 + 0] = wave.x + Math.cos(wave.ang) * wave.amp;
      arr[i * 3 + 1] = wave.y + Math.sin(wave.ang) * wave.amp;
      wave.ang += wave.speed * deltaTime;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Update sea color based on level
   */
  updateColor(level) {
    const colorIndex = (level - 1) % COLOR_SEA_LEVEL.length;
    this.mesh.material = new THREE.MeshPhongMaterial({
      color: COLOR_SEA_LEVEL[colorIndex],
      transparent: true,
      opacity: 0.8,
      flatShading: true,
    });
  }
}

// Sea color levels (from original code)
const COLOR_SEA_LEVEL = [
  0x006994, // Level 1
  0x005a7d, // Level 2
  0x004d66, // Level 3
  0x004050, // Level 4
  0x003342, // Level 5
];

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatSea;
} else if (typeof window !== 'undefined') {
  window.CombatSea = CombatSea;
  window.COLOR_SEA_LEVEL = COLOR_SEA_LEVEL;
}
