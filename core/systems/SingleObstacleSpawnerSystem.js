// SingleObstacleSpawnerSystem - Deterministic single obstacle spawning
// Responsibilities:
// - Spawns exactly one obstacle per run
// - Fixed laneIndex = 1, spawn Z = +250
// - Registers entity with EntityRegistrySystem
// - No randomness, no complexity

import DebugConfig from '/core/config/DebugConfig.js';

class SingleObstacleSpawnerSystem {
  constructor(entityRegistrySystem, laneSystem, worldScrollerSystem) {
    this.entityRegistrySystem = entityRegistrySystem;
    this.laneSystem = laneSystem;
    this.worldScrollerSystem = worldScrollerSystem;

    // Deterministic spawn parameters
    this.spawnLane = 1; // Fixed lane index
    this.spawnZ = 250; // Fixed spawn Z position

    // State tracking
    this.hasSpawned = false;
    this.spawnedObstacleId = null;

    console.log('[SingleObstacleSpawner] Deterministic single obstacle spawner established');
    console.log(`[SingleObstacleSpawner] Will spawn one obstacle at lane ${this.spawnLane}, Z=${this.spawnZ}`);
  }

  // Spawn the single obstacle if not already spawned
  spawnObstacle() {
    if (this.hasSpawned) {
      console.log('[SingleObstacleSpawner] Obstacle already spawned, skipping');
      return null;
    }

    // Create obstacle entity
    const obstacleId = `obstacle_single_${Date.now()}`;
    const obstacle = {
      id: obstacleId,
      type: 'OBSTACLE',
      laneIndex: this.spawnLane,
      z: this.spawnZ,
      mesh: null // No visual for now - will be added later if needed
    };

    // Register with entity registry
    this.entityRegistrySystem.register(obstacle);
    this.spawnedObstacleId = obstacleId;
    this.hasSpawned = true;

    console.log(`[SingleObstacleSpawner] Spawned single obstacle ${obstacleId} at lane ${this.spawnLane}, Z=${this.spawnZ}`);
    return obstacle;
  }

  // Update obstacle position using WorldScrollerSystem
  updateObstaclePosition() {
    if (!this.hasSpawned || !this.spawnedObstacleId) return;

    const obstacle = this.entityRegistrySystem.entities.get(this.spawnedObstacleId);
    if (!obstacle) return;

    // Update Z position using WorldScrollerSystem - obstacle moves with world
    // The obstacle's Z decreases as the world scrolls forward
    obstacle.z = this.spawnZ - this.worldScrollerSystem.getZoneZ('GROUND_PLANE');

    // Log position periodically (not every frame)
    if (DebugConfig.ENABLE_OBSTACLE_LOGS && Math.abs(obstacle.z) % 50 < 1) {
      console.log(`[SingleObstacleSpawner] Obstacle ${this.spawnedObstacleId} at Z=${obstacle.z.toFixed(2)}`);
    }
  }

  // Get the spawned obstacle (for external systems)
  getObstacle() {
    if (!this.hasSpawned || !this.spawnedObstacleId) return null;
    return this.entityRegistrySystem.entities.get(this.spawnedObstacleId) || null;
  }

  // Reset for new run (cleanup)
  reset() {
    if (this.hasSpawned && this.spawnedObstacleId) {
      // Unregister obstacle if it still exists
      this.entityRegistrySystem.unregister(this.spawnedObstacleId);
    }

    this.hasSpawned = false;
    this.spawnedObstacleId = null;

    console.log('[SingleObstacleSpawner] Reset for new run');
  }
}

export default SingleObstacleSpawnerSystem;
