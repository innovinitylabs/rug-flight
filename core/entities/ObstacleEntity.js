// ObstacleEntity - Simple obstacle entity with no self-movement
// Responsibilities:
// - Owns obstacle state (id, type, laneIndex, z, mesh)
// - No self-movement logic - Z position controlled externally
// - Only syncs mesh position to current state

import DebugConfig from '/core/config/DebugConfig.js';

class ObstacleEntity {
  constructor(id, laneIndex, baseZ, mesh = null, laneSystem = null, worldScrollerSystem = null) {
    this.id = id;
    this.type = 'OBSTACLE';
    this.laneIndex = laneIndex;
    this.baseZ = baseZ; // Fixed Z position at spawn time
    this.z = baseZ; // Current Z position (satisfies EntityRegistry contract)
    this.mesh = mesh; // Optional visual representation
    this.laneSystem = laneSystem; // For proper lane positioning
    this.worldScrollerSystem = worldScrollerSystem; // For computing visual Z position

    if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
      console.log(`[ObstacleEntity] Created obstacle ${id} at lane ${laneIndex}, baseZ=${baseZ}`);
    }
  }

  // Only syncs mesh position - no self-movement logic
  update(deltaTime) {
    if (this.mesh) {
      // Compute visual Z position: baseZ - world scroll offset
      // This makes obstacles appear to move toward player as world scrolls
      if (this.worldScrollerSystem) {
        const visualZ = this.baseZ - this.worldScrollerSystem.getZoneZ('GROUND_PLANE');
        this.mesh.position.z = visualZ;
        this.z = visualZ; // Update z property to satisfy EntityRegistry contract
      } else {
        // Fallback - shouldn't happen in normal operation
        this.mesh.position.z = this.baseZ;
        this.z = this.baseZ; // Update z property to satisfy EntityRegistry contract
      }

      // X position determined by lane center (if laneSystem available)
      if (this.laneSystem) {
        const laneCenterX = this.laneSystem.getLaneCenter(this.laneIndex);
        this.mesh.position.x = laneCenterX;
      } else {
        // Fallback to simple lane index (shouldn't happen in normal operation)
        this.mesh.position.x = this.laneIndex;
      }

      // Y position - same height as player collision envelope
      this.mesh.position.y = 100; // Match player height
    }
  }

  // Destroy method for cleanup
  destroy() {
    if (this.mesh) {
      if (this.mesh.parent) {
        this.mesh.parent.remove(this.mesh);
      }
      console.log(`[ObstacleEntity] Destroyed obstacle ${this.id}`);
    }
  }
}

export default ObstacleEntity;
