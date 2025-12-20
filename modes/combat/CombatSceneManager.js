/**
 * CombatSceneManager - Scene management for Combat mode
 * Adapted from maverick SceneManager class
 */
class CombatSceneManager {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];

    console.log('[CombatSceneManager] Initialized');
  }

  /**
   * Add object to scene
   */
  add(object) {
    this.scene.add(object);
    this.objects.push(object);
  }

  /**
   * Remove object from scene
   */
  remove(object) {
    this.scene.remove(object);
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }

  /**
   * Clear all objects from scene
   */
  clear() {
    this.objects.forEach(object => {
      this.scene.remove(object);
    });
    this.objects = [];
  }

  /**
   * Update scene manager
   */
  update(deltaTime) {
    // Update any scene-wide effects
  }

  /**
   * Get all objects
   */
  getObjects() {
    return this.objects;
  }

  /**
   * Find objects by type
   */
  findObjectsByType(type) {
    return this.objects.filter(obj => obj.userData && obj.userData.type === type);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatSceneManager;
} else if (typeof window !== 'undefined') {
  window.CombatSceneManager = CombatSceneManager;
}
