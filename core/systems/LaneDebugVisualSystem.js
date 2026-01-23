// LaneDebugVisualSystem - Visual debugging for lane system
// Responsibilities:
// - Renders vertical lines for each lane
// - Colors current lane green
// - Colors target lane yellow
// - Updates colors every frame based on player state

(function() {
  'use strict';

  class LaneDebugVisualSystem {
  constructor(laneSystem, playerMovementPipeline, world) {
    this.laneSystem = laneSystem;
    this.playerMovementPipeline = playerMovementPipeline;
    this.world = world;

    this.lines = [];
    this.lineLength = 200; // Height of debug lines

    this.initDebugLines();
    console.log('[LaneDebugVisual] Debug visualization system established');
  }

  initDebugLines() {
    // Create a line for each lane
    for (let i = 0; i < this.laneSystem.getLaneCount(); i++) {
      const laneCenterX = this.laneSystem.getLaneCenter(i);

      // Create line geometry (vertical line at lane center)
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array([
        laneCenterX, -this.lineLength / 2, 0, // Bottom point
        laneCenterX, this.lineLength / 2, 0   // Top point
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Create material (will be updated based on lane state)
      const material = new THREE.LineBasicMaterial({ color: 0x666666 });

      // Create line mesh
      const line = new THREE.Line(geometry, material);
      this.lines.push(line);
      this.world.add(line);
    }

    console.log(`[LaneDebugVisual] Created ${this.lines.length} debug lines`);
  }

  update(deltaTime) {
    const currentLane = this.playerMovementPipeline.getCurrentLane();
    const targetLane = this.playerMovementPipeline.getTargetLane();

    // Update color for each line based on lane state
    this.lines.forEach((line, index) => {
      const material = line.material;

      if (index === currentLane) {
        // Current lane: green
        material.color.setHex(0x00ff00);
      } else if (index === targetLane && targetLane !== currentLane) {
        // Target lane (when different from current): yellow
        material.color.setHex(0xffff00);
      } else {
        // Other lanes: gray
        material.color.setHex(0x666666);
      }
    });
  }

  destroy() {
    this.lines.forEach(line => {
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
      if (this.world) this.world.remove(line);
    });
    this.lines = [];
  }
}

  // Expose globally
  window.LaneDebugVisualSystem = LaneDebugVisualSystem;

})();
