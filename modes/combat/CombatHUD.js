/**
 * CombatHUD - UI management for Combat mode
 * Handles lives, score, ammo, weapon info, and combat-specific UI
 */
class CombatHUD {
  constructor(uiManager) {
    this.uiManager = uiManager;

    // UI element references
    this.livesContainer = null;
    this.scoreDisplay = null;
    this.ammoDisplay = null;
    this.weaponDisplay = null;
    this.levelDisplay = null;

    // Animation state
    this.isInitialized = false;

    console.log('[CombatHUD] Initialized');
  }

  /**
   * Initialize the HUD elements
   */
  async init() {
    if (this.isInitialized) {
      console.log('[CombatHUD] Already initialized');
      return;
    }

    console.log('[CombatHUD] Initializing combat HUD elements');

    // Get UI elements from DOM (these need to be added to index.html)
    this.livesContainer = document.getElementById("combat-lives");
    this.scoreDisplay = document.getElementById("combat-score");
    this.ammoDisplay = document.getElementById("combat-ammo");
    this.weaponDisplay = document.getElementById("combat-weapon");
    this.levelDisplay = document.getElementById("combat-level");

    // Validate elements exist
    const elements = {
      livesContainer: this.livesContainer,
      scoreDisplay: this.scoreDisplay,
      ammoDisplay: this.ammoDisplay,
      weaponDisplay: this.weaponDisplay,
      levelDisplay: this.levelDisplay
    };

    console.log('[CombatHUD] Found elements:', Object.keys(elements).reduce((acc, key) => {
      acc[key] = !!elements[key];
      return acc;
    }, {}));

    // Register with UIManager
    if (this.uiManager) {
      this.uiManager.registerHUDElement('combat', 'lives', this.livesContainer);
      this.uiManager.registerHUDElement('combat', 'score', this.scoreDisplay);
      this.uiManager.registerHUDElement('combat', 'ammo', this.ammoDisplay);
      this.uiManager.registerHUDElement('combat', 'weapon', this.weaponDisplay);
      this.uiManager.registerHUDElement('combat', 'level', this.levelDisplay);

      console.log('[CombatHUD] Registered with UIManager');
    }

    this.isInitialized = true;
    console.log('[CombatHUD] Initialization complete');
  }

  /**
   * Update lives display
   */
  updateLives(lives) {
    if (!this.livesContainer) return;

    // Clear existing hearts
    this.livesContainer.innerHTML = '';

    // Create heart elements
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('div');
      heart.className = 'combat-heart';

      if (i < lives) {
        heart.classList.add('full');
        heart.innerHTML = '❤️';
      } else {
        heart.classList.add('empty');
        heart.innerHTML = '🤍';
      }

      this.livesContainer.appendChild(heart);
    }
  }

  /**
   * Update score display
   */
  updateScore(score) {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = score.toLocaleString();
    }
  }

  /**
   * Update ammo display
   */
  updateAmmo(ammo) {
    if (this.ammoDisplay) {
      this.ammoDisplay.textContent = ammo;
    }
  }

  /**
   * Update weapon display
   */
  updateWeapon(weaponInfo) {
    if (this.weaponDisplay) {
      this.weaponDisplay.textContent = weaponInfo.name.toUpperCase();
    }
  }

  /**
   * Update level display
   */
  updateLevel(level) {
    if (this.levelDisplay) {
      this.levelDisplay.textContent = level;
    }
  }

  /**
   * Show weapon upgrade notification
   */
  showWeaponUpgrade(newWeapon) {
    // TODO: Implement upgrade notification
    console.log('[CombatHUD] Weapon upgraded to:', newWeapon);
  }

  /**
   * Show level up notification
   */
  showLevelUp(level) {
    // TODO: Implement level up notification
    console.log('[CombatHUD] Level up to:', level);
  }

  /**
   * Update all HUD elements with game state
   */
  update(gameState) {
    if (!gameState) return;

    this.updateLives(gameState.lives || 3);
    this.updateScore(gameState.score || 0);
    this.updateAmmo(gameState.ammo || 100);
    this.updateLevel(gameState.level || 1);

    // Weapon info would come from weapon system
    if (gameState.weapon) {
      this.updateWeapon(gameState.weapon);
    }
  }

  /**
   * Reset HUD to initial state
   */
  reset() {
    this.updateLives(3);
    this.updateScore(0);
    this.updateAmmo(100);
    this.updateLevel(1);
    this.updateWeapon({name: 'simple'});
  }

  /**
   * Show the HUD
   */
  show() {
    // HUD visibility is managed by UIManager
    console.log('[CombatHUD] Show requested');
  }

  /**
   * Hide the HUD
   */
  hide() {
    // HUD visibility is managed by UIManager
    console.log('[CombatHUD] Hide requested');
  }

  /**
   * Get current HUD state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      elements: {
        livesContainer: !!this.livesContainer,
        scoreDisplay: !!this.scoreDisplay,
        ammoDisplay: !!this.ammoDisplay,
        weaponDisplay: !!this.weaponDisplay,
        levelDisplay: !!this.levelDisplay
      }
    };
  }

  /**
   * Add CSS for combat HUD
   */
  static addCSS() {
    const existingStyle = document.getElementById('combat-hud-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'combat-hud-styles';
    style.textContent = `
      /* Combat HUD Styles */
      .combat-hud {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        font-family: 'Playfair Display', serif;
        color: #d1b790;
        z-index: 100;
      }

      .combat-lives {
        display: flex;
        gap: 5px;
        margin-bottom: 10px;
      }

      .combat-heart {
        font-size: 24px;
        transition: all 0.3s ease;
      }

      .combat-heart.full {
        color: #ff4757;
        text-shadow: 0 0 5px rgba(255, 71, 87, 0.5);
      }

      .combat-heart.empty {
        color: #ddd;
        opacity: 0.5;
      }

      .combat-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .combat-score, .combat-ammo, .combat-level {
        font-size: 18px;
        font-weight: bold;
      }

      .combat-weapon {
        font-size: 16px;
        color: #68c3c0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Level up animation */
      @keyframes levelUp {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); color: #ffd700; }
        100% { transform: scale(1); }
      }

      .level-up {
        animation: levelUp 0.5s ease;
      }

      /* Weapon upgrade animation */
      @keyframes weaponUpgrade {
        0% { transform: scale(1); }
        25% { transform: scale(1.1) rotate(5deg); color: #ff6b6b; }
        50% { transform: scale(1.2) rotate(-5deg); color: #ffd700; }
        75% { transform: scale(1.1) rotate(5deg); color: #68c3c0; }
        100% { transform: scale(1); }
      }

      .weapon-upgrade {
        animation: weaponUpgrade 1s ease;
      }

      /* Responsive design */
      @media screen and (max-width: 768px) {
        .combat-hud {
          top: 10px;
          left: 10px;
          right: 10px;
        }

        .combat-heart {
          font-size: 20px;
        }

        .combat-score, .combat-ammo, .combat-level {
          font-size: 14px;
        }

        .combat-weapon {
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
    console.log('[CombatHUD] CSS added');
  }

  /**
   * Create HUD HTML structure
   */
  static createHUDStructure(container) {
    const hudHTML = `
      <div class="combat-hud" id="combat-hud">
        <div class="combat-lives" id="combat-lives"></div>
        <div class="combat-stats">
          <div class="combat-score" id="combat-score">0</div>
          <div class="combat-weapon" id="combat-weapon">SIMPLE</div>
          <div class="combat-ammo" id="combat-ammo">100</div>
          <div class="combat-level" id="combat-level">1</div>
        </div>
      </div>
    `;

    if (container) {
      container.insertAdjacentHTML('beforeend', hudHTML);
    }

    console.log('[CombatHUD] HUD structure created');
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('[CombatHUD] Disposing resources');

    // Clear references
    this.livesContainer = null;
    this.scoreDisplay = null;
    this.ammoDisplay = null;
    this.weaponDisplay = null;
    this.levelDisplay = null;

    this.isInitialized = false;
  }
}

// Add CSS when the class is loaded
CombatHUD.addCSS();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatHUD;
} else if (typeof window !== 'undefined') {
  window.CombatHUD = CombatHUD;
}
