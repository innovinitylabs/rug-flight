/**
 * ModeController - Handles seamless switching between game modes
 * Manages mode lifecycle, state preservation, and smooth transitions
 */
class ModeController {
  constructor(gameController) {
    this.gameController = gameController;
    this.gameEngine = gameController.gameEngine;
    this.uiManager = gameController.uiManager;
    this.audioManager = gameController.audioManager;

    // Mode state
    this.currentMode = null;
    this.previousMode = null;
    this.availableModes = ['classic', 'combat'];

    // Transition state
    this.isTransitioning = false;
    this.transitionDuration = 500; // ms

    // Saved states for each mode
    this.modeStates = {
      classic: null,
      combat: null
    };

    // Transition callbacks
    this.onModeSwitchStart = null;
    this.onModeSwitchComplete = null;

    console.log('[ModeController] Initialized with modes:', this.availableModes);
  }

  /**
   * Switch to a different game mode
   */
  async switchMode(targetMode, options = {}) {
    if (this.isTransitioning) {
      console.warn('[ModeController] Mode switch already in progress');
      return false;
    }

    if (!this.availableModes.includes(targetMode)) {
      console.error('[ModeController] Unknown mode:', targetMode);
      return false;
    }

    if (this.currentMode === targetMode) {
      console.log('[ModeController] Already in target mode');
      return true;
    }

    console.log(`[ModeController] Switching from ${this.currentMode} to ${targetMode}`);

    this.isTransitioning = true;
    this.previousMode = this.currentMode;

    try {
      // Start transition
      await this.startTransition();

      // Save current mode state
      if (this.currentMode) {
        await this.saveModeState(this.currentMode);
      }

      // Deactivate current mode
      if (this.currentMode) {
        await this.deactivateMode(this.currentMode);
      }

      // Activate target mode
      await this.activateMode(targetMode, options);

      // Restore saved state if available
      if (this.modeStates[targetMode] && options.restoreState !== false) {
        await this.restoreModeState(targetMode);
      }

      // Complete transition
      await this.completeTransition();

      this.currentMode = targetMode;
      console.log(`[ModeController] Successfully switched to ${targetMode}`);

      // Trigger callback
      if (this.onModeSwitchComplete) {
        this.onModeSwitchComplete(targetMode, this.previousMode);
      }

      return true;

    } catch (error) {
      console.error('[ModeController] Mode switch failed:', error);
      this.isTransitioning = false;
      return false;
    }
  }

  /**
   * Start the transition process
   */
  async startTransition() {
    console.log('[ModeController] Starting transition');

    // Trigger callback
    if (this.onModeSwitchStart) {
      this.onModeSwitchStart(this.currentMode, this.previousMode);
    }

    // Fade out current UI
    if (this.uiManager) {
      await this.fadeOutCurrentUI();
    }

    // Prepare audio transition
    if (this.audioManager) {
      await this.prepareAudioTransition();
    }
  }

  /**
   * Complete the transition process
   */
  async completeTransition() {
    console.log('[ModeController] Completing transition');

    // Fade in new UI
    if (this.uiManager) {
      await this.fadeInNewUI();
    }

    // Complete audio transition
    if (this.audioManager) {
      await this.completeAudioTransition();
    }

    this.isTransitioning = false;
  }

  /**
   * Fade out current UI elements
   */
  async fadeOutCurrentUI() {
    return new Promise(resolve => {
      // Create fade overlay
      const overlay = document.createElement('div');
      overlay.id = 'mode-transition-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        z-index: 9999;
        pointer-events: none;
        transition: background-color ${this.transitionDuration}ms ease;
      `;
      document.body.appendChild(overlay);

      // Start fade
      setTimeout(() => {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      }, 10);

      // Resolve after transition
      setTimeout(() => {
        resolve();
      }, this.transitionDuration);
    });
  }

  /**
   * Fade in new UI elements
   */
  async fadeInNewUI() {
    return new Promise(resolve => {
      const overlay = document.getElementById('mode-transition-overlay');
      if (overlay) {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';

        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          resolve();
        }, this.transitionDuration);
      } else {
        resolve();
      }
    });
  }

  /**
   * Prepare audio for transition
   */
  async prepareAudioTransition() {
    // Fade out current audio
    if (this.audioManager.propellerGain) {
      // Smooth fade out
      const currentVolume = this.audioManager.propellerGain.gain.value;
      this.fadeAudio(this.audioManager.propellerGain, currentVolume, 0, this.transitionDuration);
    }
  }

  /**
   * Complete audio transition
   */
  async completeAudioTransition() {
    // The new mode will handle its own audio startup
    // Audio will fade in naturally when the new mode starts
  }

  /**
   * Fade audio volume over time
   */
  fadeAudio(gainNode, startVolume, endVolume, duration) {
    if (!gainNode) return;

    const startTime = performance.now();
    const fade = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentVolume = startVolume + (endVolume - startVolume) * progress;

      gainNode.gain.value = currentVolume;

      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };

    requestAnimationFrame(fade);
  }

  /**
   * Save the state of a mode
   */
  async saveModeState(mode) {
    console.log(`[ModeController] Saving state for mode: ${mode}`);

    const modeInstance = this.gameEngine.getModeSystem(mode, 'game');
    if (modeInstance && typeof modeInstance.getState === 'function') {
      this.modeStates[mode] = await modeInstance.getState();
      console.log(`[ModeController] State saved for ${mode}`);
    }
  }

  /**
   * Restore the state of a mode
   */
  async restoreModeState(mode) {
    console.log(`[ModeController] Restoring state for mode: ${mode}`);

    const modeInstance = this.gameEngine.getModeSystem(mode, 'game');
    const savedState = this.modeStates[mode];

    if (modeInstance && savedState && typeof modeInstance.setState === 'function') {
      await modeInstance.setState(savedState);
      console.log(`[ModeController] State restored for ${mode}`);
    }
  }

  /**
   * Deactivate a mode
   */
  async deactivateMode(mode) {
    console.log(`[ModeController] Deactivating mode: ${mode}`);

    const modeInstance = this.gameEngine.getModeSystem(mode, 'game');
    if (modeInstance && typeof modeInstance.deactivate === 'function') {
      await modeInstance.deactivate();
    }

    // Hide mode-specific UI
    if (this.uiManager) {
      this.uiManager.hideModeUI(mode);
    }
  }

  /**
   * Activate a mode
   */
  async activateMode(mode, options = {}) {
    console.log(`[ModeController] Activating mode: ${mode}`);

    const modeInstance = this.gameEngine.getModeSystem(mode, 'game');
    if (modeInstance) {
      // Initialize if not already initialized
      if (!modeInstance.isInitialized) {
        await modeInstance.init();
      }

      // Activate the mode
      if (typeof modeInstance.activate === 'function') {
        await modeInstance.activate(options);
      }
    }

    // Show mode-specific UI
    if (this.uiManager) {
      this.uiManager.showModeUI(mode);
    }
  }

  /**
   * Check if a mode switch is possible
   */
  canSwitchTo(mode) {
    if (this.isTransitioning) return false;
    if (!this.availableModes.includes(mode)) return false;
    if (this.currentMode === mode) return false;

    // Check if the target mode is available
    const modeInstance = this.gameEngine.getModeSystem(mode, 'game');
    return !!modeInstance;
  }

  /**
   * Get current mode status
   */
  getStatus() {
    return {
      currentMode: this.currentMode,
      previousMode: this.previousMode,
      isTransitioning: this.isTransitioning,
      availableModes: this.availableModes,
      hasSavedStates: Object.keys(this.modeStates).filter(mode => this.modeStates[mode] !== null)
    };
  }

  /**
   * Force reset a mode (clear saved state)
   */
  resetMode(mode) {
    console.log(`[ModeController] Resetting mode: ${mode}`);
    this.modeStates[mode] = null;
  }

  /**
   * Set transition duration
   */
  setTransitionDuration(duration) {
    this.transitionDuration = Math.max(100, Math.min(2000, duration)); // 100ms to 2s
  }

  /**
   * Set transition callbacks
   */
  setCallbacks(onStart, onComplete) {
    this.onModeSwitchStart = onStart;
    this.onModeSwitchComplete = onComplete;
  }

  /**
   * Emergency stop transition
   */
  emergencyStop() {
    console.warn('[ModeController] Emergency stop triggered');
    this.isTransitioning = false;

    // Remove transition overlay if it exists
    const overlay = document.getElementById('mode-transition-overlay');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModeController;
} else if (typeof window !== 'undefined') {
  window.ModeController = ModeController;
}
