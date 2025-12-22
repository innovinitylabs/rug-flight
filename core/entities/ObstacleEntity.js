// ObstacleEntity - Simple obstacle entity with no self-movement
// Responsibilities:
// - Owns obstacle state (id, type, laneIndex, z, mesh)
// - No self-movement logic - Z position controlled externally
// - Only syncs mesh position to current state

class ObstacleEntity {
  constructor(id, laneIndex, z, mesh = null, laneSystem = null) {
    this.id = id;
    this.type = 'OBSTACLE';
    this.laneIndex = laneIndex;
    this.z = z; // Z position (will be updated by WorldScrollerSystem)
    this.mesh = mesh; // Optional visual representation
    this.laneSystem = laneSystem; // For proper lane positioning

    console.log(`[ObstacleEntity] Created obstacle ${id} at lane ${laneIndex}, Z=${z}`);
  }

  // Only syncs mesh position - no self-movement logic
  update(deltaTime) {
    if (this.mesh) {
      // Position is managed externally by WorldScrollerSystem
      this.mesh.position.z = this.z;

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
