/**
 * ClassicHUD - UI management for Classic mode
 * Handles energy bar, level circle, distance counter, and replay messages
 */
class ClassicHUD {
  constructor(uiManager) {
    this.uiManager = uiManager;

    // UI element references
    this.fieldDistance = null;
    this.energyBar = null;
    this.replayMessage = null;
    this.fieldLevel = null;
    this.levelCircle = null;

    // Animation state
    this.isInitialized = false;

    console.log('[ClassicHUD] Initialized');
  }

  /**
   * Initialize the HUD elements
   */
  async init() {
    if (this.isInitialized) {
      console.log('[ClassicHUD] Already initialized');
      return;
    }

    console.log('[ClassicHUD] Initializing HUD elements');

    // Get UI elements from DOM
    this.fieldDistance = document.getElementById("distValue-toprug1");
    this.energyBar = document.getElementById("energyBar-toprug1");
    this.replayMessage = document.getElementById("replayMessage-toprug1");
    this.fieldLevel = document.getElementById("levelValue-toprug1");
    this.levelCircle = document.getElementById("levelCircleStroke-toprug1");

    // Validate elements exist
    const elements = {
      fieldDistance: this.fieldDistance,
      energyBar: this.energyBar,
      replayMessage: this.replayMessage,
      fieldLevel: this.fieldLevel,
      levelCircle: this.levelCircle
    };

    console.log('[ClassicHUD] Found elements:', Object.keys(elements).reduce((acc, key) => {
      acc[key] = !!elements[key];
      return acc;
    }, {}));

    // Register with UIManager
    if (this.uiManager) {
      this.uiManager.registerHUDElement('classic', 'fieldDistance', this.fieldDistance);
      this.uiManager.registerHUDElement('classic', 'energyBar', this.energyBar);
      this.uiManager.registerHUDElement('classic', 'replayMessage', this.replayMessage);
      this.uiManager.registerHUDElement('classic', 'fieldLevel', this.fieldLevel);
      this.uiManager.registerHUDElement('classic', 'levelCircle', this.levelCircle);

      console.log('[ClassicHUD] Registered with UIManager');
    }

    this.isInitialized = true;
    console.log('[ClassicHUD] Initialization complete');
  }

  /**
   * Update the distance display
   */
  updateDistance(distance, levelUpdateDistance) {
    if (!this.fieldDistance || !this.levelCircle) return;

    // Update distance text
    this.fieldDistance.innerHTML = Math.floor(distance);

    // Update level circle progress
    const progress = (distance % levelUpdateDistance) / levelUpdateDistance;
    const strokeDashoffset = 502 * (1 - progress);

    this.levelCircle.setAttribute("stroke-dashoffset", strokeDashoffset);
  }

  /**
   * Update the energy bar display
   */
  updateEnergy(energy, isLow = false) {
    if (!this.energyBar) return;

    // Update energy bar width
    this.energyBar.style.right = (100 - Math.max(0, Math.min(100, energy))) + "%";

    // Update color based on energy level
    if (energy < 50) {
      this.energyBar.style.backgroundColor = "#f25346"; // Red when low
    } else {
      this.energyBar.style.backgroundColor = "#68c3c0"; // Teal when normal
    }

    // Add blinking animation when critically low
    if (energy < 30) {
      this.energyBar.style.animationName = "blinking";
    } else {
      this.energyBar.style.animationName = "none";
    }
  }

  /**
   * Update the level display
   */
  updateLevel(level) {
    if (this.fieldLevel) {
      this.fieldLevel.innerHTML = Math.floor(level);
    }
  }

  /**
   * Show the replay message
   */
  showReplay() {
    if (this.replayMessage) {
      this.replayMessage.style.display = "block";
    }
  }

  /**
   * Hide the replay message
   */
  hideReplay() {
    if (this.replayMessage) {
      this.replayMessage.style.display = "none";
    }
  }

  /**
   * Update all HUD elements with game state
   */
  update(gameState) {
    if (!gameState) return;

    this.updateDistance(gameState.distance || 0, gameState.distanceForLevelUpdate || 1000);
    this.updateEnergy(gameState.energy || 100);
    this.updateLevel(gameState.level || 1);
  }

  /**
   * Reset HUD to initial state
   */
  reset() {
    this.updateDistance(0, 1000);
    this.updateEnergy(100);
    this.updateLevel(1);
    this.hideReplay();
  }

  /**
   * Show the HUD
   */
  show() {
    // HUD visibility is managed by UIManager
    console.log('[ClassicHUD] Show requested');
  }

  /**
   * Hide the HUD
   */
  hide() {
    // HUD visibility is managed by UIManager
    console.log('[ClassicHUD] Hide requested');
  }

  /**
   * Get current HUD state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      elements: {
        fieldDistance: !!this.fieldDistance,
        energyBar: !!this.energyBar,
        replayMessage: !!this.replayMessage,
        fieldLevel: !!this.fieldLevel,
        levelCircle: !!this.levelCircle
      }
    };
  }

  /**
   * Add CSS animations for Classic HUD
   */
  static addCSSAnimations() {
    const existingStyle = document.getElementById('classic-hud-styles');
    if (existingStyle) return;

    // Get the visual design system
    const vds = getVisualDesignSystem ? getVisualDesignSystem() :
               (window.getVisualDesignSystem ? window.getVisualDesignSystem() : null);

    const style = document.createElement('style');
    style.id = 'classic-hud-styles';
    style.textContent = `
      /* Classic HUD - Legacy styles with unified design system */

      /* Energy bar blinking animation */
      @keyframes blinking {
        0% { opacity: 1; }
        50% { opacity: 0; }
        100% { opacity: 1; }
      }

      .energy-bar {
        animation-duration: 150ms;
        animation-iteration-count: infinite;
        background: ${vds ? vds.getColor('energy') : '#68c3c0'};
      }

      .energy-bar.low {
        background: ${vds ? vds.getColor('energyLow') : '#f25346'};
      }

      /* Level circle styling */
      .level-circle {
        transform: rotate(-90deg);
        transition: stroke-dashoffset 0.3s ease;
      }

      /* HUD element positioning - Classic specific */
      .score__value--dist {
        font-size: ${vds ? vds.typography.sizes.xxl : '30px'};
        font-family: ${vds ? vds.typography.fontFamily : "'Playfair Display', serif"};
        font-weight: ${vds ? vds.typography.weights.bold : 'bold'};
        color: ${vds ? vds.getColor('secondary') : '#d1b790'};
      }

      .score__value--level {
        font-size: ${vds ? vds.typography.sizes.xl : '26px'};
        font-family: ${vds ? vds.typography.fontFamily : "'Playfair Display', serif"};
        font-weight: ${vds ? vds.typography.weights.bold : 'bold'};
        color: ${vds ? vds.getColor('secondary') : '#d1b790'};
      }

      .score__value--energy {
        position: relative;
        width: 60px;
        height: 8px;
        margin-top: ${vds ? vds.getSpacing('xl') : '20px'};
        border-radius: ${vds ? vds.borderRadius.sm : '3px'};
        background-color: ${vds ? vds.getColor('surface') : '#d1b790'};
      }

      .energy-bar {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: 2px;
        border-radius: ${vds ? vds.borderRadius.sm : '3px'};
        transition: all ${vds ? vds.animations.normal : '0.3s ease'};
      }

      /* Replay message styling */
      .message--replay {
        font-size: ${vds ? vds.typography.sizes.lg : '1.25vw'};
        bottom: 40vh;
        display: none;
        text-indent: 0.5em;
        letter-spacing: 0.5em;
        color: ${vds ? vds.getColor('secondary') : '#d1b790'};
        font-weight: ${vds ? vds.typography.weights.bold : 'bold'};
        position: absolute;
        left: 0;
        width: 100%;
        text-align: center;
        text-transform: uppercase;
        pointer-events: none;
        font-family: ${vds ? vds.typography.fontFamily : "'Playfair Display', serif"};
      }

      /* Responsive design */
      @media screen and (max-width: ${vds ? vds.breakpoints.mobile : '768px'}) {
        .message--replay {
          font-size: 4vw;
          bottom: 30vh;
        }

        .score__value--dist {
          font-size: ${vds ? vds.typography.sizes.xl : '24px'};
        }

        .score__value--level {
          font-size: ${vds ? vds.typography.sizes.lg : '20px'};
        }
      }
    `;
    document.head.appendChild(style);
    console.log('[ClassicHUD] CSS animations added with unified design system');
  }

  /**
   * Create HUD HTML structure (if needed)
   */
  static createHUDStructure(container) {
    // The HUD structure is already in index.html
    // This method could be used to dynamically create HUD if needed
    console.log('[ClassicHUD] HUD structure creation requested (already exists in HTML)');
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('[ClassicHUD] Disposing resources');

    // Clear references
    this.fieldDistance = null;
    this.energyBar = null;
    this.replayMessage = null;
    this.fieldLevel = null;
    this.levelCircle = null;

    this.isInitialized = false;
  }
}

// Add CSS animations when the class is loaded
ClassicHUD.addCSSAnimations();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClassicHUD;
} else if (typeof window !== 'undefined') {
  window.ClassicHUD = ClassicHUD;
}
