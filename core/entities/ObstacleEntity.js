// ObstacleEntity - Simple obstacle entity with no self-movement
// Responsibilities:
// - Owns obstacle state (id, type, laneIndex, z, mesh)
// - No self-movement logic - Z position controlled externally
// - Only syncs mesh position to current state

class ObstacleEntity {
  constructor(id, laneIndex, z, mesh = null) {
    this.id = id;
    this.type = 'OBSTACLE';
    this.laneIndex = laneIndex;
    this.z = z; // Z position (will be updated by WorldScrollerSystem)
    this.mesh = mesh; // Optional visual representation

    console.log(`[ObstacleEntity] Created obstacle ${id} at lane ${laneIndex}, Z=${z}`);
  }

  // Only syncs mesh position - no self-movement logic
  update(deltaTime) {
    if (this.mesh) {
      // Position is managed externally by WorldScrollerSystem
      this.mesh.position.z = this.z;
      // X position is determined by lane
      this.mesh.position.x = this.laneIndex; // Simplified - will be replaced with proper lane positioning
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
