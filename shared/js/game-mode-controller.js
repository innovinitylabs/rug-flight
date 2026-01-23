// Game Controller - Mode selection for unified game
// Logger will be loaded globally

(function() {
  'use strict';

  var GameController = {
    gameLoaded: false,
    selectedMode: null, // 'endless' or 'combat'

    init: function() {
      window.logger.info('Initializing mode selection...');

      // Load additional dependencies first (using local npm versions when available)
      var scriptsToLoad = [
        // Three.js addons - try local first, fallback to CDN
        '/node_modules/three/examples/js/loaders/OBJLoader.js',
        '/node_modules/three/examples/js/controls/OrbitControls.js',
        '/node_modules/gsap/dist/gsap.min.js'
      ];

      // Load CSS
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = 'games/top-rug/css/styles.css';
      document.head.appendChild(link);

      // Load fonts
      var fontLink = document.createElement('link');
      fontLink.rel = 'preconnect';
      fontLink.href = 'https://fonts.googleapis.com';
      document.head.appendChild(fontLink);

      var fontLink2 = document.createElement('link');
      fontLink2.rel = 'preconnect';
      fontLink2.href = 'https://fonts.gstatic.com';
      fontLink2.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink2);

      var fontLink3 = document.createElement('link');
      fontLink3.href = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap';
      fontLink3.rel = 'stylesheet';
      document.head.appendChild(fontLink3);

      // Load scripts sequentially
      this.loadScriptsSequentially(scriptsToLoad, function() {
        // Dependencies loaded, now setup mode selection
        GameController.setupModeSelection();
      });

      window.logger.info('Initialization complete');
    },

    setupModeSelection: function() {
      window.logger.info('Setting up mode selection...');

      var endlessBtn = document.getElementById('endless-mode-btn');
      var combatBtn = document.getElementById('combat-mode-btn');
      var modeScreen = document.getElementById('mode-selection-screen');

      if (!endlessBtn || !combatBtn || !modeScreen) {
        window.logger.error('Mode selection elements not found');
        return;
      }

      endlessBtn.addEventListener('click', function() {
        GameController.selectMode('endless');
      });

      combatBtn.addEventListener('click', function() {
        GameController.selectMode('combat');
      });

      // Show mode selection screen
      modeScreen.classList.add('visible');

      // Force visibility with inline styles to override CSS conflicts
      modeScreen.style.display = 'flex';
      modeScreen.style.position = 'fixed';
      modeScreen.style.top = '0';
      modeScreen.style.left = '0';
      modeScreen.style.width = '100%';
      modeScreen.style.height = '100%';
      modeScreen.style.zIndex = '9999';
      modeScreen.style.pointerEvents = 'auto';
      modeScreen.style.background = 'rgba(0,0,0,0.6)';

      window.logger.info('Mode selection screen ready');
    },

    selectMode: function(mode) {
      window.logger.info('Mode selected:', mode);
      this.selectedMode = mode;

      // Hide mode selection screen
      var modeScreen = document.getElementById('mode-selection-screen');
      if (modeScreen) {
        modeScreen.classList.remove('visible');
        modeScreen.style.display = 'none';
        modeScreen.style.pointerEvents = 'none';
      }

      // Load appropriate CSS for the selected mode
      this.loadModeCSS(mode);

      // Hide unified UI and show appropriate mode UI
      this.showModeUI(mode);

      // Determine which game script to load based on mode
      var gameScriptPath;
      if (mode === 'combat') {
        gameScriptPath = 'games/top-rug-maverick/js/game.js';
      } else if (mode === 'endless') {
        // Endless mode uses ES modules only - no script path needed
        gameScriptPath = null;
      } else {
        window.logger.error('Unknown game mode:', mode);
        return;
      }

      // Load dependencies based on mode
      if (mode === 'endless') {
        // Endless mode: ES module loading (no script injection)
        // Show intro screen
        var introScreen = document.getElementById('intro-screen');
        if (introScreen) {
          introScreen.classList.add('visible');
        }

        // Load Endless mode as script (fallback for browsers without full ES module support)
      var endlessScript = document.createElement('script');
      endlessScript.src = 'games/top-rug/js/game.js';
      endlessScript.onload = function() {
        window.logger.info('Endless script loaded correctly');
        try {
          // Assume the script creates a global AviatorEndlessGame
          if (typeof AviatorEndlessGame !== 'undefined') {
            AviatorEndlessGame.init();
          } else {
            throw new Error('AviatorEndlessGame global not found');
          }
        } catch (initError) {
          window.logger.error('Failed to initialize Endless mode', initError);
          GameController.showError('Failed to start Endless mode. Falling back to Combat mode...', initError.message);
          // Fallback to combat mode
          setTimeout(() => {
            GameController.selectMode('combat');
          }, 2000);
        }
      };
      endlessScript.onerror = function() {
        window.logger.error('Failed to load Endless script');
        GameController.showError('Endless mode failed to load. Starting Combat mode instead...', 'Script loading failed');
        // Fallback to combat mode
        setTimeout(() => {
          GameController.selectMode('combat');
        }, 2000);
      };
      document.head.appendChild(endlessScript);

      } else if (mode === 'combat') {
        // Combat mode: Legacy script loading
        // Load utils first, then MovementModel, then the game script
        var utilsScript = document.createElement('script');
        utilsScript.src = 'shared/js/utils.js';
        utilsScript.onload = function() {
          window.logger.info('utils loaded');

          // Now load MovementModel
        var movementScript = document.createElement('script');
        movementScript.src = 'core/MovementModel.js';
        movementScript.onload = function() {
          window.logger.info('MovementModel loaded');

          // Now load the game script
          var script = document.createElement('script');
          script.src = gameScriptPath;
          script.onload = function() {
            window.logger.info('Game loaded for mode:', mode);

            // Show intro screen
            var introScreen = document.getElementById('intro-screen');
            if (introScreen) {
              introScreen.classList.add('visible');
            }

            // Initialize the game
            if (typeof window.Aviator2Game !== 'undefined') {
              try {
                window.Aviator2Game.init();
              } catch (initError) {
                console.error('[Game Controller] Failed to initialize combat mode', initError);
                GameController.showError('Failed to start Combat mode. Please refresh the page.', initError.message);
              }
            } else {
              console.error('[Game Controller] Game namespace not found for mode:', mode);
              GameController.showError('Combat mode failed to load. Please refresh the page.', 'Game namespace not found');
            }
          };
          script.onerror = function() {
            console.error('[Game Controller] Failed to load game script for mode:', mode, 'path:', gameScriptPath);
            GameController.showError('Failed to load ' + mode + ' mode. Please refresh the page.', 'Script loading failed: ' + gameScriptPath);
          };
          document.head.appendChild(script);
        };
        movementScript.onerror = function() {
          console.error('[Game Controller] Failed to load MovementModel script');
          GameController.showError('Failed to load movement system. Please refresh the page.', 'MovementModel script loading failed');
        };
        document.head.appendChild(movementScript);
        };
        utilsScript.onerror = function() {
          console.error('[Game Controller] Failed to load utils script');
          GameController.showError('Failed to load game utilities. Please refresh the page.', 'Utils script loading failed');
        };
        document.head.appendChild(utilsScript);
      }
    },

    loadModeCSS: function(mode) {
      var cssPath;
      if (mode === 'endless') {
        cssPath = 'games/top-rug/css/styles.css';
      } else if (mode === 'combat') {
        cssPath = 'games/top-rug-maverick/css/styles.css';
      } else {
        console.error('[Game Controller] Unknown game mode for CSS:', mode);
        return;
      }

      // Check if CSS is already loaded
      var existingLink = document.querySelector('link[href="' + cssPath + '"]');
      if (existingLink) {
        window.logger.info('CSS already loaded for mode:', mode);
        return;
      }

      // Load the CSS
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = cssPath;
      document.head.appendChild(link);
      window.logger.info('CSS loaded for mode:', mode, 'path:', cssPath);
    },

    showModeUI: function(mode) {
      window.logger.info('Configuring UI for mode:', mode);

      // Get unified UI elements
      var gameUI = document.getElementById('game-ui');
      var gameWorld = document.getElementById('game-world');
      var replayMessage = document.getElementById('replayMessage');
      var secondaryUI = document.getElementById('secondary-ui');
      var secondaryLabel = document.getElementById('secondaryLabel');
      var energyBar = document.getElementById('energyBar');
      var header = document.querySelector('.header');

      // Configure UI based on mode
      if (mode === 'endless') {
        // Endless mode: show coins, hide energy bar
        if (secondaryLabel) secondaryLabel.textContent = 'coins';
        if (energyBar) energyBar.style.display = 'none';
        if (secondaryUI) secondaryUI.style.display = 'block';
      } else if (mode === 'combat') {
        // Combat mode: show coins, keep energy bar hidden
        if (secondaryLabel) secondaryLabel.textContent = 'coins';
        if (energyBar) energyBar.style.display = 'none';
        if (secondaryUI) secondaryUI.style.display = 'block';
      }

      // Hide header for clean game view (show only game world)
      if (header) header.style.display = 'none';

      // Show unified UI elements
      if (gameUI) gameUI.style.display = 'none'; // Hide UI overlays for clean view
      if (gameWorld) {
        gameWorld.style.display = 'block';
        gameWorld.style.zIndex = '10';
        gameWorld.style.pointerEvents = 'auto';
      }
      if (replayMessage) replayMessage.style.display = 'none';

      window.logger.info('UI configured for mode:', mode);

      // Create compatibility aliases for existing game code
      this.createUIAliases(mode);
    },

    createUIAliases: function(mode) {
      window.logger.info('Creating UI aliases for mode:', mode);

      // Map old IDs to new unified IDs based on mode
      var idMappings = {};

      if (mode === 'endless') {
        idMappings = {
          'world-toprug1': 'game-world',
          'distValue-toprug1': 'distValue',
          'levelValue-toprug1': 'levelValue',
          'levelCircleStroke-toprug1': 'levelCircleStroke',
          'coinsValue-toprug1': 'secondaryValue',
          'replayMessage-toprug1': 'replayMessage'
        };
      } else if (mode === 'combat') {
        idMappings = {
          'world-toprug2': 'game-world',
          'distValue-toprug2': 'distValue',
          'levelValue-toprug2': 'levelValue',
          'levelCircleStroke-toprug2': 'levelCircleStroke',
          'coinsValue-toprug2': 'secondaryValue',
          'replayMessage-toprug2': 'replayMessage'
        };
      }

      // Create aliases by overriding getElementById temporarily
      var originalGetElementById = document.getElementById;
      document.getElementById = function(id) {
        if (idMappings[id]) {
          window.logger.debug('UI alias:', id, '->', idMappings[id]);
          return originalGetElementById.call(document, idMappings[id]);
        }
        return originalGetElementById.call(document, id);
      };

      window.logger.info('UI aliases created for mode:', mode);
    },

    loadScriptsSequentially: function(scripts, callback) {
      if (scripts.length === 0) {
        if (callback) callback();
        return;
      }

      var script = document.createElement('script');
      script.src = scripts[0];
      script.onload = function() {
        window.logger.info('Loaded script:', scripts[0]);
        this.loadScriptsSequentially(scripts.slice(1), callback);
      }.bind(this);
      script.onerror = function() {
        window.logger.warn('Failed to load script:', scripts[0], '- trying CDN fallback');
        // Try CDN fallback for failed local scripts
        var fallbackUrls = {
          '/node_modules/three/examples/js/loaders/OBJLoader.js': 'https://cdn.jsdelivr.net/npm/three@0.139.2/examples/js/loaders/OBJLoader.js',
          '/node_modules/three/examples/js/controls/OrbitControls.js': 'https://cdn.jsdelivr.net/npm/three@0.139.2/examples/js/controls/OrbitControls.js',
          '/node_modules/gsap/dist/gsap.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.10.2/gsap.min.js'
        };

        if (fallbackUrls[scripts[0]]) {
          window.logger.info('Trying CDN fallback for:', scripts[0]);
          script.src = fallbackUrls[scripts[0]];
          script.onerror = function() {
            window.logger.error('CDN fallback also failed for:', scripts[0]);
            this.loadScriptsSequentially(scripts.slice(1), callback);
          }.bind(this);
          // Re-append the script with new src
          document.head.appendChild(script);
        } else {
          this.loadScriptsSequentially(scripts.slice(1), callback);
        }
      }.bind(this);
      document.head.appendChild(script);
    },

    showError: function(message, details) {
      console.error('[Game Controller] Error:', message, details);

      // Show error in the error display element
      var errorElement = document.getElementById('error-message');
      var errorContainer = document.getElementById('error');

      if (errorElement && errorContainer) {
        errorElement.textContent = message + (details ? '\nDetails: ' + details : '');
        errorContainer.style.display = 'block';

        // Auto-hide error after 5 seconds
        setTimeout(function() {
          errorContainer.style.display = 'none';
        }, 5000);
      }

      // Also show in console with more details
      console.error('[Game Controller] User-visible error:', message);
      if (details) {
        console.error('[Game Controller] Error details:', details);
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      GameController.init();
    });
  } else {
    GameController.init();
  }

  // Expose to window for debugging
  window.GameController = GameController;
})();

