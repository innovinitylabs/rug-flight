/**
 * VisualDesignSystem - Unified visual design system for consistent UI across game modes
 * Provides standardized colors, typography, spacing, and component styles
 */
class VisualDesignSystem {
  constructor() {
    // Color palette
    this.colors = {
      // Primary brand colors
      primary: '#68c3c0',      // Teal
      secondary: '#d1b790',    // Gold
      accent: '#f25346',       // Red

      // UI colors
      background: 'rgba(0, 0, 0, 0.8)',
      surface: 'rgba(0, 0, 0, 0.9)',
      text: '#d1b790',
      textSecondary: '#999',
      textMuted: '#666',

      // Status colors
      success: '#68c3c0',
      warning: '#f4ce93',
      error: '#f25346',
      info: '#68c3c0',

      // Game-specific colors
      energy: '#68c3c0',
      energyLow: '#f25346',
      score: '#ffd700',
      level: '#d1b790'
    };

    // Typography
    this.typography = {
      fontFamily: "'Playfair Display', serif",
      fontFamilyMono: "'Courier New', monospace",

      sizes: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '24px',
        xxl: '30px',
        huge: '36px'
      },

      weights: {
        normal: '400',
        medium: '500',
        bold: '700',
        black: '900'
      }
    };

    // Spacing
    this.spacing = {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      xxl: '24px',
      huge: '32px'
    };

    // Border radius
    this.borderRadius = {
      sm: '3px',
      md: '5px',
      lg: '8px',
      xl: '12px',
      full: '50%'
    };

    // Shadows
    this.shadows = {
      sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
      md: '0 2px 4px rgba(0, 0, 0, 0.3)',
      lg: '0 4px 8px rgba(0, 0, 0, 0.4)',
      glow: '0 0 10px rgba(104, 195, 192, 0.5)'
    };

    // Animations
    this.animations = {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    };

    // Breakpoints
    this.breakpoints = {
      mobile: '768px',
      tablet: '1024px',
      desktop: '1200px'
    };

    console.log('[VisualDesignSystem] Initialized');
  }

  /**
   * Get a color by key
   */
  getColor(key) {
    return this.colors[key] || this.colors.text;
  }

  /**
   * Get typography style object
   */
  getTypography(size = 'md', weight = 'normal', color = 'text') {
    return {
      fontFamily: this.typography.fontFamily,
      fontSize: this.typography.sizes[size],
      fontWeight: this.typography.weights[weight],
      color: this.getColor(color)
    };
  }

  /**
   * Get spacing value
   */
  getSpacing(size = 'md') {
    return this.spacing[size];
  }

  /**
   * Create unified HUD styles
   */
  createUnifiedHUDStyles() {
    const styles = `
      /* ===== UNIFIED HUD SYSTEM ===== */

      /* Base HUD Container */
      .game-hud {
        position: absolute;
        font-family: ${this.typography.fontFamily};
        color: ${this.colors.text};
        user-select: none;
        pointer-events: none;
      }

      /* Score/Value Displays */
      .hud-value {
        font-weight: ${this.typography.weights.bold};
        color: ${this.colors.secondary};
        text-shadow: ${this.shadows.sm};
        transition: all ${this.animations.fast} ${this.animations.ease};
      }

      .hud-value--primary {
        color: ${this.colors.primary};
      }

      .hud-value--accent {
        color: ${this.colors.accent};
      }

      .hud-value--warning {
        color: ${this.colors.warning};
        animation: pulse-warning 2s infinite;
      }

      /* Bars and Progress Indicators */
      .hud-bar {
        background: ${this.colors.surface};
        border: 1px solid ${this.colors.primary};
        border-radius: ${this.borderRadius.sm};
        overflow: hidden;
        transition: all ${this.animations.fast} ${this.animations.ease};
      }

      .hud-bar-fill {
        height: 100%;
        background: ${this.colors.primary};
        transition: width ${this.animations.normal} ${this.animations.ease};
      }

      .hud-bar-fill--low {
        background: ${this.colors.accent};
        animation: blink-critical 0.5s infinite;
      }

      /* Circular Progress Indicators */
      .hud-circle {
        transform: rotate(-90deg);
        transition: stroke-dashoffset ${this.animations.normal} ${this.animations.ease};
      }

      .hud-circle-bg {
        fill: none;
        stroke: ${this.colors.surface};
        stroke-width: 24px;
      }

      .hud-circle-fill {
        fill: none;
        stroke: ${this.colors.primary};
        stroke-width: 14px;
        stroke-linecap: round;
      }

      /* Buttons */
      .hud-button {
        background: ${this.colors.surface};
        border: 1px solid ${this.colors.primary};
        color: ${this.colors.text};
        border-radius: ${this.borderRadius.md};
        padding: ${this.spacing.sm} ${this.spacing.md};
        font-family: ${this.typography.fontFamily};
        font-size: ${this.typography.sizes.md};
        font-weight: ${this.typography.weights.medium};
        cursor: pointer;
        transition: all ${this.animations.fast} ${this.animations.ease};
        box-shadow: ${this.shadows.sm};
      }

      .hud-button:hover {
        background: ${this.colors.primary};
        color: white;
        transform: translateY(-1px);
        box-shadow: ${this.shadows.md};
      }

      .hud-button:active {
        transform: translateY(0);
        box-shadow: ${this.shadows.sm};
      }

      .hud-button--primary {
        background: ${this.colors.primary};
        color: white;
      }

      .hud-button--secondary {
        background: ${this.colors.secondary};
        color: black;
        border-color: ${this.colors.secondary};
      }

      /* Messages and Notifications */
      .hud-message {
        background: ${this.colors.surface};
        border: 1px solid ${this.colors.primary};
        border-radius: ${this.borderRadius.md};
        padding: ${this.spacing.md};
        font-size: ${this.typography.sizes.lg};
        font-weight: ${this.typography.weights.bold};
        color: ${this.colors.text};
        text-align: center;
        box-shadow: ${this.shadows.lg};
        animation: slide-in 0.5s ${this.animations.easeOut};
      }

      .hud-message--success {
        border-color: ${this.colors.success};
        background: rgba(104, 195, 192, 0.1);
      }

      .hud-message--warning {
        border-color: ${this.colors.warning};
        background: rgba(244, 206, 147, 0.1);
      }

      .hud-message--error {
        border-color: ${this.colors.error};
        background: rgba(242, 83, 70, 0.1);
      }

      /* Animations */
      @keyframes blink-critical {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      @keyframes pulse-warning {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* ===== MODE-SPECIFIC OVERRIDES ===== */

      /* Classic Mode HUD */
      .classic-mode .hud-value {
        font-size: ${this.typography.sizes.xxl};
      }

      .classic-mode .hud-bar {
        height: 8px;
        margin-top: ${this.spacing.xl};
      }

      /* Combat Mode HUD */
      .combat-mode .game-hud {
        position: absolute;
        top: ${this.spacing.xl};
        left: ${this.spacing.xl};
        right: ${this.spacing.xl};
      }

      .combat-mode .hud-value {
        font-size: ${this.typography.sizes.lg};
        font-weight: ${this.typography.weights.bold};
      }

      .combat-mode .hud-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: ${this.spacing.md};
      }

      /* ===== GAME CONTAINER & CANVAS STYLES ===== */

      .game-holder {
        position: relative;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        background: #000;
      }

      .game-holder canvas {
        display: block;
        width: 100% !important;
        height: 100% !important;
        position: absolute;
        top: 0;
        left: 0;
      }

      /* Game mode selector should be hidden when game starts */
      .game-mode-selector.game-hidden,
      .game-mode-selector[style*="display: none"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* Game container should be visible when game starts */
      .game-holder.game-visible,
      .game-holder[style*="display: block"] {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      /* ===== TEST PANEL STYLES ===== */

      .test-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${this.colors.surface};
        border: 2px solid ${this.colors.primary};
        border-radius: ${this.borderRadius.lg};
        padding: ${this.spacing.xl};
        z-index: 10000;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: ${this.shadows.lg};
      }

      .test-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: ${this.spacing.lg};
        border-bottom: 1px solid ${this.colors.primary};
        padding-bottom: ${this.spacing.md};
      }

      .test-header h3 {
        margin: 0;
        color: ${this.colors.secondary};
        font-family: ${this.typography.fontFamily};
      }

      .test-close {
        background: none;
        border: none;
        color: ${this.colors.text};
        font-size: ${this.typography.sizes.xl};
        cursor: pointer;
        padding: ${this.spacing.xs};
        border-radius: ${this.borderRadius.sm};
        transition: all ${this.animations.fast} ${this.animations.ease};
      }

      .test-close:hover {
        background: ${this.colors.error};
        color: white;
      }

      .test-controls {
        display: flex;
        gap: ${this.spacing.md};
        margin-bottom: ${this.spacing.lg};
        flex-wrap: wrap;
      }

      .test-button {
        background: ${this.colors.primary};
        color: white;
        border: none;
        border-radius: ${this.borderRadius.md};
        padding: ${this.spacing.sm} ${this.spacing.md};
        font-family: ${this.typography.fontFamily};
        font-size: ${this.typography.sizes.md};
        font-weight: ${this.typography.weights.medium};
        cursor: pointer;
        transition: all ${this.animations.fast} ${this.animations.ease};
        box-shadow: ${this.shadows.sm};
      }

      .test-button:hover {
        background: ${this.colors.secondary};
        color: black;
        transform: translateY(-1px);
        box-shadow: ${this.shadows.md};
      }

      .test-button:active {
        transform: translateY(0);
        box-shadow: ${this.shadows.sm};
      }

      .test-results {
        font-family: ${this.typography.fontFamily};
        font-size: ${this.typography.sizes.sm};
        line-height: 1.5;
      }

      .test-status {
        color: ${this.colors.text};
        margin-bottom: ${this.spacing.md};
      }

      .test-item {
        margin-bottom: ${this.spacing.sm};
        padding: ${this.spacing.sm};
        border-radius: ${this.borderRadius.sm};
        border-left: 4px solid ${this.colors.textMuted};
      }

      .test-item.passed {
        border-left-color: ${this.colors.success};
        background: rgba(104, 195, 192, 0.1);
      }

      .test-item.failed {
        border-left-color: ${this.colors.error};
        background: rgba(242, 83, 70, 0.1);
      }

      .test-item.running {
        border-left-color: ${this.colors.warning};
        background: rgba(244, 206, 147, 0.1);
      }

      .test-summary {
        margin-top: ${this.spacing.lg};
        padding: ${this.spacing.md};
        background: ${this.colors.surface};
        border-radius: ${this.borderRadius.md};
        border: 1px solid ${this.colors.primary};
      }

      .test-summary h4 {
        margin: 0 0 ${this.spacing.sm} 0;
        color: ${this.colors.secondary};
      }

      /* ===== RESPONSIVE DESIGN ===== */

      @media screen and (max-width: ${this.breakpoints.mobile}) {
        .hud-value {
          font-size: ${this.typography.sizes.lg} !important;
        }

        .hud-button {
          padding: ${this.spacing.xs} ${this.spacing.sm};
          font-size: ${this.typography.sizes.sm};
        }

        .game-hud {
          font-size: 14px;
        }
      }

      @media screen and (max-width: ${this.breakpoints.tablet}) {
        .hud-value {
          font-size: ${this.typography.sizes.xl} !important;
        }
      }
    `;

    return styles;
  }

  /**
   * Apply unified styles to the document
   */
  applyStyles() {
    const existingStyle = document.getElementById('unified-hud-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'unified-hud-styles';
    style.textContent = this.createUnifiedHUDStyles();
    document.head.appendChild(style);

    console.log('[VisualDesignSystem] Unified styles applied');
  }

  /**
   * Create a consistent button element
   */
  createButton(text, variant = 'primary', onClick = null) {
    const button = document.createElement('button');
    button.className = `hud-button hud-button--${variant}`;
    button.textContent = text;

    if (onClick) {
      button.addEventListener('click', onClick);
    }

    return button;
  }

  /**
   * Create a consistent progress bar
   */
  createProgressBar(value = 100, max = 100, color = 'primary') {
    const container = document.createElement('div');
    container.className = 'hud-bar';

    const fill = document.createElement('div');
    fill.className = `hud-bar-fill hud-bar-fill--${color}`;

    const percentage = (value / max) * 100;
    fill.style.width = `${percentage}%`;

    container.appendChild(fill);
    return container;
  }

  /**
   * Create a consistent value display
   */
  createValueDisplay(value, label = '', variant = 'primary') {
    const container = document.createElement('div');
    container.className = 'hud-value-container';

    if (label) {
      const labelElement = document.createElement('div');
      labelElement.className = 'hud-label';
      labelElement.textContent = label;
      container.appendChild(labelElement);
    }

    const valueElement = document.createElement('div');
    valueElement.className = `hud-value hud-value--${variant}`;
    valueElement.textContent = value;
    container.appendChild(valueElement);

    return container;
  }

  /**
   * Set the current game mode for styling
   */
  setMode(mode) {
    // Remove existing mode classes
    document.body.classList.remove('classic-mode', 'combat-mode');

    // Add current mode class
    if (mode) {
      document.body.classList.add(`${mode}-mode`);
    }

    console.log(`[VisualDesignSystem] Mode set to: ${mode}`);
  }

  /**
   * Get all design tokens
   */
  getTokens() {
    return {
      colors: { ...this.colors },
      typography: { ...this.typography },
      spacing: { ...this.spacing },
      borderRadius: { ...this.borderRadius },
      shadows: { ...this.shadows },
      animations: { ...this.animations },
      breakpoints: { ...this.breakpoints }
    };
  }
}

// Global instance
let visualDesignSystemInstance = null;

/**
 * Get or create the global visual design system
 */
function getVisualDesignSystem() {
  if (!visualDesignSystemInstance) {
    visualDesignSystemInstance = new VisualDesignSystem();
  }
  return visualDesignSystemInstance;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VisualDesignSystem, getVisualDesignSystem };
} else if (typeof window !== 'undefined') {
  window.VisualDesignSystem = VisualDesignSystem;
  window.getVisualDesignSystem = getVisualDesignSystem;
}
