// DebugConfig - Centralized debug logging configuration
// Controls which debug logging categories are enabled
// Default: All disabled for clean console during gameplay

(function() {
  'use strict';

  const DebugConfig = {
    // Frame timing and performance logs
    ENABLE_FRAME_LOGS: false,

    // World scrolling and positioning logs
    ENABLE_WORLD_SCROLL_LOGS: false,

    // Obstacle spawning and movement logs
    ENABLE_OBSTACLE_LOGS: false,

    // Lane switching and movement logs
    ENABLE_LANE_LOGS: false,

    // Player action state and cooldown logs
    ENABLE_ACTION_STATE_LOGS: false
  };

  // Expose globally
  window.DebugConfig = DebugConfig;

})();
