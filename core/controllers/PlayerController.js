// PlayerController - Handles player lane logic and intent processing
// Responsibilities:
// - Owns currentLaneIndex and targetLaneIndex
// - Converts lane indices to target X positions using LaneSystem
// - Processes intents from PlayerIntentSystem
// - Commands PlayerEntity to move

import DebugConfig from '/core/config/DebugConfig.js';

class PlayerController {
  constructor(playerEntity, laneSystem) {
    this.playerEntity = playerEntity;
    this.laneSystem = laneSystem;

    this.currentLaneIndex = 1; // Start in center lane
    this.targetLaneIndex = 1;

    console.log('[PlayerController] Lane controller created');
  }

  // Process intent and update player entity
  processIntent(intent) {
    if (!intent) return;

    let laneDelta = 0;
    switch (intent.type) {
      case 'MOVE_LEFT':
        laneDelta = -1;
        break;
      case 'MOVE_RIGHT':
        laneDelta = 1;
        break;
      case 'HOLD':
      default:
        laneDelta = 0;
        break;
    }

    // Calculate new target lane
    const newLaneIndex = Math.max(0, Math.min(this.laneSystem.getLaneCount() - 1,
      this.currentLaneIndex + laneDelta));

    // Only update if lane actually changed
    if (newLaneIndex !== this.currentLaneIndex) {
      this.targetLaneIndex = newLaneIndex;

      // Convert lane index to world X position
      const targetX = this.laneSystem.getLaneCenter(this.targetLaneIndex);

      // Command player entity to move
      this.playerEntity.setTargetX(targetX);

      // Log lane changes when enabled
      if (DebugConfig.ENABLE_LANE_LOGS) {
        console.log(`[PlayerController] Lane ${this.currentLaneIndex} → ${this.targetLaneIndex} (X: ${targetX})`);
      }
    }
  }

  // Update lane tracking when player reaches target
  update(deltaTime) {
    const playerPos = this.playerEntity.getPosition();
    const targetX = this.laneSystem.getLaneCenter(this.targetLaneIndex);

    // Update current lane when close enough to target
    if (Math.abs(playerPos.x - targetX) < 1.0) {
      this.currentLaneIndex = this.targetLaneIndex;
    }
  }

  getCurrentLane() {
    return this.currentLaneIndex;
  }

  getTargetLane() {
    return this.targetLaneIndex;
  }
}

export default PlayerController;
