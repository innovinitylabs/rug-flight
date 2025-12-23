// SingleObstacleSpawnerSystem - Deterministic single obstacle spawning
// Responsibilities:
// - Spawns exactly one obstacle per run
// - Fixed laneIndex = 1, spawn Z = +250
// - Registers entity with EntityRegistrySystem
// - Monitors recycling to know when to spawn next obstacle
// - No collision awareness, no health logic, no randomness

import DebugConfig from '/core/config/DebugConfig.js';
import ObstacleEntity from '/core/entities/ObstacleEntity.js';

class SingleObstacleSpawnerSystem {
  constructor(entityRegistrySystem, laneSystem, worldScrollerSystem, world) {
    this.entityRegistrySystem = entityRegistrySystem;
    this.laneSystem = laneSystem;
    this.worldScrollerSystem = worldScrollerSystem;
    this.world = world; // THREE.js scene reference

    // Deterministic spawn parameters
    this.spawnLane = 1; // Fixed lane index
    this.spawnZ = 250; // Fixed spawn Z position

    // State tracking
    this.hasSpawned = false;
    this.spawnedObstacleId = null;

    if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
      console.log('[SingleObstacleSpawner] Deterministic single obstacle spawner established');
      console.log(`[SingleObstacleSpawner] Will spawn one obstacle at lane ${this.spawnLane}, Z=${this.spawnZ}`);
    }
  }

  // Create a highly visible debug mesh for obstacles
  createObstacleMesh() {
    // Very large, bright yellow box - much larger than player, impossible to miss
    const geometry = new THREE.BoxGeometry(12, 8, 6); // Very large: 12x8x6 (larger than player capsule)
    const material = new THREE.MeshLambertMaterial({
      color: 0xffff00, // Bright yellow for obstacle identification
      transparent: false,
      wireframe: false // Solid fill for maximum visibility
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Position at origin initially (will be updated by ObstacleEntity)
    mesh.position.set(0, 0, 0);

    if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
      console.log('[SingleObstacleSpawner] Created highly visible yellow obstacle mesh (12x8x6)');
    }

    return mesh;
  }

  // Spawn the single obstacle if not already spawned
  spawnObstacle() {
    if (this.hasSpawned) {
      if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
        console.log('[SingleObstacleSpawner] Obstacle already spawned, skipping');
      }
      return null;
    }

    // Create highly visible debug mesh
    const obstacleMesh = this.createObstacleMesh();

    // Create obstacle entity with mesh and lane system for positioning
    const obstacleId = `obstacle_single_${Date.now()}`;
    const obstacle = new ObstacleEntity(
      obstacleId,
      this.spawnLane,
      this.spawnZ,
      obstacleMesh,
      this.laneSystem
    );

    // Add mesh to world scene for visibility
    this.world.add(obstacleMesh);

    // Register with entity registry
    this.entityRegistrySystem.register(obstacle);
    this.spawnedObstacleId = obstacleId;
    this.hasSpawned = true;

    if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
      console.log(`[SingleObstacleSpawner] Spawned single obstacle ${obstacleId} at lane ${this.spawnLane}, Z=${this.spawnZ}`);
    }
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

  // Check if obstacle has been cleaned up and is ready for respawn
  // Returns true if obstacle was recycled and spawner is ready to spawn again
  checkObstacleRecycled(spawnBandSystem) {
    if (!this.hasSpawned || !this.spawnedObstacleId) return false;

    // Check if obstacle still exists in registry
    const obstacle = this.entityRegistrySystem.entities.get(this.spawnedObstacleId);
    if (obstacle) {
      // Obstacle still exists, check if it should be recycled
      if (spawnBandSystem.shouldRecycle(obstacle.z)) {
        // Obstacle should be recycled - unregister it
        this.entityRegistrySystem.unregister(this.spawnedObstacleId);
        if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
          console.log(`[SingleObstacleSpawner] Obstacle ${this.spawnedObstacleId} recycled in BEHIND_CLEANUP`);
        }

        // Reset state to allow respawning
        this.hasSpawned = false;
        this.spawnedObstacleId = null;
        return true;
      }
      return false;
    } else {
      // Obstacle no longer exists in registry (already cleaned up)
      if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
        console.log(`[SingleObstacleSpawner] Obstacle ${this.spawnedObstacleId} already cleaned up`);
      }

      // Reset state to allow respawning
      this.hasSpawned = false;
      this.spawnedObstacleId = null;
      return true;
    }
  }

  // Reset system state for fresh game run
  // Destroys and unregisters any active obstacle, clears spawn flags
  reset() {
    // Destroy and unregister any active obstacle
    if (this.hasSpawned && this.spawnedObstacleId) {
      // Check if obstacle still exists (might have been cleaned up already)
      const obstacle = this.entityRegistrySystem.entities.get(this.spawnedObstacleId);
      if (obstacle) {
        // Unregister from entity registry
        this.entityRegistrySystem.unregister(this.spawnedObstacleId);

        // Call destroy method if obstacle has one
        if (obstacle.destroy) {
          obstacle.destroy();
        }

        if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
          console.log(`[SingleObstacleSpawner] Reset: destroyed obstacle ${this.spawnedObstacleId}`);
        }
      }
    }

    // Clear internal spawn flags and state
    this.hasSpawned = false;
    this.spawnedObstacleId = null;

    if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
      console.log('[SingleObstacleSpawner] Reset complete - ready for new game run');
    }
  }
}

export default SingleObstacleSpawnerSystem;
