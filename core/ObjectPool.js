/**
 * ObjectPool - Efficient object pooling system for game performance
 * Reuses objects instead of creating/destroying them frequently
 */
class ObjectPool {
  constructor(createFunc, resetFunc = null, initialSize = 10) {
    this.createFunc = createFunc;
    this.resetFunc = resetFunc;
    this.pool = [];
    this.active = new Set();
    this.maxSize = 100; // Prevent unlimited growth

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFunc());
    }

    console.log(`[ObjectPool] Created with initial size: ${initialSize}`);
  }

  /**
   * Get an object from the pool
   */
  get() {
    let obj;

    if (this.pool.length > 0) {
      // Reuse existing object
      obj = this.pool.pop();
      if (this.resetFunc) {
        this.resetFunc(obj);
      }
    } else {
      // Create new object if pool is empty
      obj = this.createFunc();
      console.log('[ObjectPool] Created new object (pool empty)');
    }

    this.active.add(obj);
    return obj;
  }

  /**
   * Return an object to the pool
   */
  release(obj) {
    if (!this.active.has(obj)) {
      console.warn('[ObjectPool] Attempted to release inactive object');
      return;
    }

    this.active.delete(obj);

    // Only keep objects if pool isn't too large
    if (this.pool.length < this.maxSize) {
      if (this.resetFunc) {
        this.resetFunc(obj);
      }
      this.pool.push(obj);
    } else {
      // Dispose of excess objects
      this.disposeObject(obj);
    }
  }

  /**
   * Release all active objects
   */
  releaseAll() {
    const activeObjects = Array.from(this.active);
    activeObjects.forEach(obj => this.release(obj));
  }

  /**
   * Dispose of an object (override in subclasses)
   */
  disposeObject(obj) {
    // Default disposal - can be overridden
    if (obj.dispose && typeof obj.dispose === 'function') {
      obj.dispose();
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      pooled: this.pool.length,
      active: this.active.size,
      total: this.pool.length + this.active.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Resize the pool
   */
  resize(newSize) {
    this.maxSize = newSize;

    // Remove excess objects if needed
    while (this.pool.length > this.maxSize) {
      const obj = this.pool.pop();
      this.disposeObject(obj);
    }
  }

  /**
   * Clear the pool
   */
  clear() {
    // Dispose of all pooled objects
    this.pool.forEach(obj => this.disposeObject(obj));
    this.pool = [];

    // Note: Active objects are not disposed here as they're still in use
    console.log('[ObjectPool] Pool cleared');
  }
}

/**
 * Three.js specific object pool for meshes and geometries
 */
class ThreeObjectPool extends ObjectPool {
  constructor(createFunc, resetFunc = null, initialSize = 10) {
    super(createFunc, resetFunc, initialSize);
  }

  /**
   * Dispose of Three.js objects properly
   */
  disposeObject(obj) {
    if (obj && typeof obj === 'object') {
      // Dispose of mesh and its components
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => {
            if (mat.dispose) mat.dispose();
          });
        } else if (obj.material.dispose) {
          obj.material.dispose();
        }
      }
      if (obj.texture) {
        obj.texture.dispose();
      }
      if (obj.dispose) {
        obj.dispose();
      }
    }
  }
}

/**
 * Projectile pool for combat mode
 */
class ProjectilePool extends ThreeObjectPool {
  constructor() {
    super(
      () => new CombatProjectile(1), // Create function
      (projectile) => { // Reset function
        projectile.mesh.position.set(0, 0, 0);
        projectile.mesh.rotation.set(0, 0, 0);
        projectile.alive = false;
        projectile.distanceTraveled = 0;
      },
      20 // Initial size
    );
  }
}

/**
 * Enemy pool for combat mode
 */
class EnemyPool extends ThreeObjectPool {
  constructor() {
    super(
      () => new CombatEnemy(),
      (enemy) => {
        enemy.mesh.position.set(0, 0, 0);
        enemy.mesh.rotation.set(0, 0, 0);
        enemy.angle = 0;
        enemy.distance = 0;
        enemy.hitpoints = 3;
        enemy.alive = false;
      },
      10
    );
  }
}

/**
 * Coin pool for both modes
 */
class CoinPool extends ThreeObjectPool {
  constructor() {
    super(
      () => new CombatCoin(), // Reuse CombatCoin for both modes
      (coin) => {
        coin.mesh.position.set(0, 0, 0);
        coin.mesh.rotation.set(0, 0, 0);
        coin.angle = 0;
        coin.distance = 0;
        coin.alive = false;
      },
      15
    );
  }
}

/**
 * Particle pool for effects
 */
class ParticlePool extends ThreeObjectPool {
  constructor() {
    super(
      () => {
        const geom = new THREE.TetrahedronGeometry(3, 0);
        const mat = new THREE.MeshPhongMaterial({
          color: 0x009999,
          shininess: 0,
          specular: 0xffffff,
          flatShading: true,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        return mesh;
      },
      (mesh) => {
        mesh.position.set(0, 0, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.scale.set(1, 1, 1);
        mesh.visible = false;
      },
      30
    );
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ObjectPool,
    ThreeObjectPool,
    ProjectilePool,
    EnemyPool,
    CoinPool,
    ParticlePool
  };
} else if (typeof window !== 'undefined') {
  window.ObjectPool = ObjectPool;
  window.ThreeObjectPool = ThreeObjectPool;
  window.ProjectilePool = ProjectilePool;
  window.EnemyPool = EnemyPool;
  window.CoinPool = CoinPool;
  window.ParticlePool = ParticlePool;
}
