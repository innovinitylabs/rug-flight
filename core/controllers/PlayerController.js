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

    // Vertical movement step size
    this.verticalStep = 15;

    if (DebugConfig.ENABLE_LANE_LOGS) {
      console.log('[PlayerController] Player controller created');
    }
  }

  // Process axis-based intent and update player entity
  processIntent(intent) {
    if (!intent) return;

    // Handle horizontal (lane) movement
    if (intent.horizontal !== 0) {
      const laneDelta = intent.horizontal; // -1 or +1

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

    // Handle vertical movement (always allowed)
    if (intent.vertical !== 0) {
      const verticalDelta = intent.vertical * this.verticalStep; // -15 or +15
      const currentY = this.playerEntity.getPosition().y;
      const targetY = currentY + verticalDelta;

      // Command player entity to move vertically
      this.playerEntity.setTargetY(targetY);

      // Log vertical movement when enabled
      if (DebugConfig.ENABLE_LANE_LOGS) {
        console.log(`[PlayerController] Vertical ${currentY} → ${targetY}`);
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
