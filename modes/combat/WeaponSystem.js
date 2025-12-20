/**
 * WeaponSystem - Weapon and shooting system for Combat mode
 * Handles weapon equipping, shooting, and projectile management
 */
class WeaponSystem {
  constructor(combatGame, audioManager) {
    this.combatGame = combatGame;
    this.audioManager = audioManager;

    // Current weapon
    this.weapon = null;

    // Available weapons
    this.weapons = {
      simple: new SimpleGun(),
      double: new DoubleGun(),
      better: new BetterGun()
    };

    // Set default weapon
    this.equipWeapon('simple');

    console.log('[WeaponSystem] Initialized');
  }

  /**
   * Equip a weapon by name
   */
  equipWeapon(weaponName) {
    if (this.weapons[weaponName]) {
      this.weapon = this.weapons[weaponName];
      console.log('[WeaponSystem] Equipped weapon:', weaponName);
    } else {
      console.warn('[WeaponSystem] Unknown weapon:', weaponName);
    }
  }

  /**
   * Shoot with current weapon
   */
  shoot() {
    if (!this.weapon) return;

    // Rate limiting is handled by the weapon itself
    const projectile = this.weapon.shoot(this.combatGame.airplane.mesh.position, this.combatGame.airplane.mesh.rotation);

    if (projectile) {
      // Add to projectiles array
      this.combatGame.projectiles.push(projectile);

      // Add to scene
      this.combatGame.sceneManager.scene.add(projectile.mesh);

      // Play sound
      if (this.audioManager) {
        this.audioManager.play('shot-soft', {volume: 0.5});
      }

      console.log('[WeaponSystem] Shot fired');
    }
  }

  /**
   * Update weapon system
   */
  update(deltaTime) {
    // Update weapons if needed
    if (this.weapon && typeof this.weapon.update === 'function') {
      this.weapon.update(deltaTime);
    }
  }

  /**
   * Upgrade to next weapon level
   */
  upgradeWeapon() {
    const weaponLevels = ['simple', 'double', 'better'];
    const currentIndex = weaponLevels.indexOf(this.weapon?.name);

    if (currentIndex >= 0 && currentIndex < weaponLevels.length - 1) {
      const nextWeapon = weaponLevels[currentIndex + 1];
      this.equipWeapon(nextWeapon);
      return true;
    }

    return false; // Already at max level
  }

  /**
   * Get current weapon info
   */
  getWeaponInfo() {
    return {
      name: this.weapon?.name || 'none',
      damage: this.weapon?.damage() || 0,
      downtime: this.weapon?.downtime() || 0
    };
  }
}

/**
 * Base Weapon class
 */
class BaseWeapon {
  constructor(name) {
    this.name = name;
    this.mesh = new THREE.Object3D();
    this.lastShot = 0;
  }

  /**
   * Get weapon damage
   */
  damage() {
    return 1;
  }

  /**
   * Get weapon cooldown in seconds
   */
  downtime() {
    return 0.2; // 5 shots per second
  }

  /**
   * Shoot method - override in subclasses
   */
  shoot(position, rotation) {
    // Rate limiting
    const now = Date.now() / 1000;
    if (now - this.lastShot < this.downtime()) {
      return null;
    }
    this.lastShot = now;

    // Create projectile
    const projectile = new CombatProjectile(this.damage());
    projectile.mesh.position.copy(position);

    // Set direction based on rotation
    const direction = new THREE.Vector3(10, 0, 0);
    direction.applyEuler(rotation);
    projectile.setDirection(direction);

    return projectile;
  }

  /**
   * Update weapon
   */
  update(deltaTime) {
    // Override in subclasses if needed
  }
}

/**
 * Simple Gun - Single shot weapon
 */
class SimpleGun extends BaseWeapon {
  constructor() {
    super('simple');
    this.createMesh();
  }

  createMesh() {
    const geom = new THREE.CylinderGeometry(2, 2, 8, 8);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true
    });
    const barrel = new THREE.Mesh(geom, mat);
    barrel.rotation.z = Math.PI / 2;
    this.mesh.add(barrel);
  }

  damage() {
    return 1;
  }

  downtime() {
    return 0.2;
  }
}

/**
 * Double Gun - Two parallel shots
 */
class DoubleGun extends BaseWeapon {
  constructor() {
    super('double');
    this.createMesh();
  }

  createMesh() {
    // Left barrel
    const geom1 = new THREE.CylinderGeometry(2, 2, 8, 8);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true
    });
    const barrel1 = new THREE.Mesh(geom1, mat);
    barrel1.position.set(-3, 0, 0);
    barrel1.rotation.z = Math.PI / 2;
    this.mesh.add(barrel1);

    // Right barrel
    const barrel2 = new THREE.Mesh(geom1, mat);
    barrel2.position.set(3, 0, 0);
    barrel2.rotation.z = Math.PI / 2;
    this.mesh.add(barrel2);
  }

  damage() {
    return 1;
  }

  downtime() {
    return 0.15;
  }

  shoot(position, rotation) {
    // Rate limiting
    const now = Date.now() / 1000;
    if (now - this.lastShot < this.downtime()) {
      return null;
    }
    this.lastShot = now;

    const projectiles = [];

    // Left shot
    const projectile1 = new CombatProjectile(this.damage());
    projectile1.mesh.position.copy(position).add(new THREE.Vector3(-3, 0, 0));
    const direction1 = new THREE.Vector3(10, 0, 0);
    direction1.applyEuler(rotation);
    projectile1.setDirection(direction1);
    projectiles.push(projectile1);

    // Right shot
    const projectile2 = new CombatProjectile(this.damage());
    projectile2.mesh.position.copy(position).add(new THREE.Vector3(3, 0, 0));
    const direction2 = new THREE.Vector3(10, 0, 0);
    direction2.applyEuler(rotation);
    projectile2.setDirection(direction2);
    projectiles.push(projectile2);

    return projectiles; // Return array for double gun
  }
}

/**
 * Better Gun - Faster firing, more damage
 */
class BetterGun extends BaseWeapon {
  constructor() {
    super('better');
    this.createMesh();
  }

  createMesh() {
    const geom = new THREE.CylinderGeometry(3, 3, 12, 8);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true
    });
    const barrel = new THREE.Mesh(geom, mat);
    barrel.rotation.z = Math.PI / 2;
    this.mesh.add(barrel);

    // Add some detail
    const detailGeom = new THREE.CylinderGeometry(4, 4, 2, 8);
    const detailMat = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true
    });
    const detail = new THREE.Mesh(detailGeom, detailMat);
    detail.position.set(0, 0, -6);
    detail.rotation.z = Math.PI / 2;
    this.mesh.add(detail);
  }

  damage() {
    return 2;
  }

  downtime() {
    return 0.1;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeaponSystem;
} else if (typeof window !== 'undefined') {
  window.WeaponSystem = WeaponSystem;
  window.SimpleGun = SimpleGun;
  window.DoubleGun = DoubleGun;
  window.BetterGun = BetterGun;
}
