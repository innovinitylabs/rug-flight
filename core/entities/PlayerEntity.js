// PlayerEntity - Pure visual/physical entity with NO lane math
// Responsibilities:
// - Owns mesh and position state
// - Does NOT read input directly
// - Can swap mesh implementation easily
// - Handles smooth X position interpolation toward any target

(function() {
  'use strict';

  class PlayerEntity {
  constructor(mesh) {
    this.mesh = mesh;

    // Movement parameters
    this.lerpSpeed = 8.0; // Units per second interpolation speed
    this.targetX = 0; // Target X position set by external systems
    this.targetY = 100; // Target Y position set by external systems

    // Vertical movement bounds
    this.minY = 60;
    this.maxY = 160;

    // Position state (player always at Z=0, world moves around them)
    this.position = { x: 0, y: 100, z: 0 };

    console.log('[PlayerEntity] Pure visual entity created');
  }

  // Set target X position (called by external controller systems)
  setTargetX(x) {
    this.targetX = x;
  }

  // Set target Y position (called by external controller systems)
  setTargetY(y) {
    this.targetY = Math.max(this.minY, Math.min(this.maxY, y));
  }

  // Smooth interpolation toward target X and Y
  update(deltaTime) {
    if (!this.mesh) return;

    // Smooth lerp toward target X
    const lerpAmount = Math.min(this.lerpSpeed * deltaTime, 1.0);
    this.position.x += (this.targetX - this.position.x) * lerpAmount;

    // Smooth lerp toward target Y
    this.position.y += (this.targetY - this.position.y) * lerpAmount;

    // Apply to mesh (Z stays fixed at 0)
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
    this.mesh.position.z = this.position.z;

    // Simple rotation for visual feedback
    this.mesh.rotation.y += deltaTime * 0.5;
  }

  getPosition() {
    return { ...this.position };
  }

  getMesh() {
    return this.mesh;
  }

  // Collision profile - defines collision properties for this player type
  // Future: Different plane types can override this
  getCollisionProfile() {
    return {
      zCollisionThreshold: 10,  // Distance in Z where collision is detected
      laneWidth: 40,            // Effective collision width (lane-based)
      collisionHeight: 20       // Effective collision height
    };
  }
}

  // Expose globally
  window.PlayerEntity = PlayerEntity;

})();

