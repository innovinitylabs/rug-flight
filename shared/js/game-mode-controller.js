// Game Controller - Mode selection for unified game

(function() {
  'use strict';

  var GameController = {
    gameLoaded: false,
    selectedMode: null, // 'endless' or 'combat'

    init: function() {
      console.log('[Game Controller] Initializing mode selection...');

      // Load additional dependencies first
      var scriptsToLoad = [
        'https://cdn.jsdelivr.net/npm/three@0.139.2/examples/js/loaders/OBJLoader.js',
        'https://cdn.jsdelivr.net/npm/three@0.139.2/examples/js/controls/OrbitControls.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.10.2/gsap.min.js'
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

      console.log('[Game Controller] Initialization complete');
    },

    setupModeSelection: function() {
      console.log('[Game Controller] Setting up mode selection...');

      var endlessBtn = document.getElementById('endless-mode-btn');
      var combatBtn = document.getElementById('combat-mode-btn');
      var modeScreen = document.getElementById('mode-selection-screen');

      if (!endlessBtn || !combatBtn || !modeScreen) {
        console.error('[Game Controller] Mode selection elements not found');
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

      console.log('[Game Controller] Mode selection screen ready');
    },

    selectMode: function(mode) {
      console.log('[Game Controller] Mode selected:', mode);
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
      if (mode === 'endless') {
        gameScriptPath = 'games/top-rug/js/game.js';
      } else if (mode === 'combat') {
        gameScriptPath = 'games/top-rug-maverick/js/game.js';
      } else {
        console.error('[Game Controller] Unknown game mode:', mode);
        return;
      }

      // Load utils first, then MovementModel, then the game script
      var utilsScript = document.createElement('script');
      utilsScript.src = 'shared/js/utils.js';
      utilsScript.onload = function() {
        console.log('[Game Controller] utils loaded');

        // Now load MovementModel
      var movementScript = document.createElement('script');
      movementScript.src = 'core/MovementModel.js';
      movementScript.onload = function() {
        console.log('[Game Controller] MovementModel loaded');

        // Now load the game script
        var script = document.createElement('script');
        script.src = gameScriptPath;
        script.onload = function() {
          console.log('[Game Controller] Game loaded for mode:', mode);

          // Show intro screen
          var introScreen = document.getElementById('intro-screen');
          if (introScreen) {
            introScreen.classList.add('visible');
          }

          // Initialize the game (different namespaces for different modes)
          if (mode === 'endless' && typeof window.Aviator1Game !== 'undefined') {
            window.Aviator1Game.init();

            // System initialization now handled by mode.init()
          } else if (mode === 'combat' && typeof window.Aviator2Game !== 'undefined') {
            window.Aviator2Game.init();
          } else {
            console.error('[Game Controller] Game namespace not found for mode:', mode);
          }
        };
        script.onerror = function() {
          console.error('[Game Controller] Failed to load game script for mode:', mode, 'path:', gameScriptPath);
        };
        document.head.appendChild(script);
      };
      movementScript.onerror = function() {
        console.error('[Game Controller] Failed to load MovementModel script');
      };
      document.head.appendChild(movementScript);
      };
      utilsScript.onerror = function() {
        console.error('[Game Controller] Failed to load utils script');
      };
      document.head.appendChild(utilsScript);
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
        console.log('[Game Controller] CSS already loaded for mode:', mode);
        return;
      }

      // Load the CSS
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = cssPath;
      document.head.appendChild(link);
      console.log('[Game Controller] CSS loaded for mode:', mode, 'path:', cssPath);
    },

    showModeUI: function(mode) {
      // Hide all game UIs first
      var unifiedUI = document.getElementById('score-toprug');
      var endlessUI = document.getElementById('score-toprug1');
      var combatUI = document.getElementById('score-toprug2');
      var unifiedWorld = document.getElementById('world-toprug');
      var endlessWorld = document.getElementById('world-toprug1');
      var combatWorld = document.getElementById('world-toprug2');
      var unifiedReplay = document.getElementById('replayMessage-toprug');
      var endlessReplay = document.getElementById('replayMessage-toprug1');
      var combatReplay = document.getElementById('replayMessage-toprug2');

      if (unifiedUI) unifiedUI.style.display = 'none';
      if (endlessUI) endlessUI.style.display = 'none';
      if (combatUI) combatUI.style.display = 'none';
      if (unifiedWorld) unifiedWorld.style.display = 'none';
      if (endlessWorld) endlessWorld.style.display = 'none';
      if (combatWorld) combatWorld.style.display = 'none';
      if (unifiedReplay) unifiedReplay.style.display = 'none';
      if (endlessReplay) endlessReplay.style.display = 'none';
      if (combatReplay) combatReplay.style.display = 'none';

      // Show the appropriate UI based on mode
      if (mode === 'endless') {
        if (endlessUI) endlessUI.style.display = 'flex';
        if (endlessWorld) endlessWorld.style.display = 'block';
        if (endlessReplay) endlessReplay.style.display = 'block';
      } else if (mode === 'combat') {
        if (combatUI) combatUI.style.display = 'flex';
        if (combatWorld) combatWorld.style.display = 'block';
        if (combatReplay) combatReplay.style.display = 'block';
      }

      // Enforce world layering with z-index and pointer-events
      if (unifiedWorld) {
        unifiedWorld.style.zIndex = '0';
        unifiedWorld.style.pointerEvents = 'none';
      }
      if (endlessWorld) {
        endlessWorld.style.zIndex = mode === 'endless' ? '10' : '0';
        endlessWorld.style.pointerEvents = mode === 'endless' ? 'auto' : 'none';
      }
      if (combatWorld) {
        combatWorld.style.zIndex = mode === 'combat' ? '10' : '0';
        combatWorld.style.pointerEvents = mode === 'combat' ? 'auto' : 'none';
      }
    },

    loadScriptsSequentially: function(scripts, callback) {
      if (scripts.length === 0) {
        if (callback) callback();
        return;
      }

      var script = document.createElement('script');
      script.src = scripts[0];
      script.onload = function() {
        this.loadScriptsSequentially(scripts.slice(1), callback);
      }.bind(this);
      script.onerror = function() {
        console.warn('Failed to load script:', scripts[0]);
        this.loadScriptsSequentially(scripts.slice(1), callback);
      }.bind(this);
      document.head.appendChild(script);
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

