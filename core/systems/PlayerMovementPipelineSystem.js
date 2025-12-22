// PlayerMovementPipelineSystem - Orchestrates complete player movement pipeline
// Responsibilities:
// - Manages the complete player movement update cycle
// - Processes intents through action states
// - Coordinates PlayerController and PlayerEntity updates
// - Maintains strict update order for deterministic behavior

class PlayerMovementPipelineSystem {
  constructor(playerIntentSystem, playerActionStateSystem, playerController, playerEntity) {
    this.playerIntentSystem = playerIntentSystem;
    this.playerActionStateSystem = playerActionStateSystem;
    this.playerController = playerController;
    this.playerEntity = playerEntity;

    console.log('[PlayerMovementPipeline] Movement pipeline established');
  }

  // Execute complete player movement pipeline
  update(input, deltaTime) {
    // 1. Update intent system with current input
    this.playerIntentSystem.update(input, deltaTime);

    // 2. Update action state system for cooldowns
    this.playerActionStateSystem.update(deltaTime);

    // 3. Process intents through action state gating
    const intents = this.playerIntentSystem.getIntents();
    if (intents.length > 0) {
      const intent = intents[0];

      // Check if action can be executed (cooldowns, state, etc.)
      if (this.playerActionStateSystem.canExecute(intent.type)) {
        // Execute the intent
        this.playerController.processIntent(intent);

        // Notify action state system that intent was executed
        this.playerActionStateSystem.onIntentExecuted(intent.type);
      }
    }

    // 4. Update controller state (lane tracking)
    this.playerController.update(deltaTime);

    // 5. Update entity visuals (smooth interpolation)
    this.playerEntity.update(deltaTime);
  }

  // Get current lane information for debugging
  getCurrentLane() {
    return this.playerController.getCurrentLane();
  }

  getTargetLane() {
    return this.playerController.getTargetLane();
  }
}

export default PlayerMovementPipelineSystem;
