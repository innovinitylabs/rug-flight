// Game Mode Controller
// Handles game mode selection and loading

(function() {
  'use strict';

  var GameModeController = {
    currentMode: null,
    toprug1Loaded: false,
    toprug2Loaded: false,

    init: function() {
      console.log('[Game Controller] Initializing...');
      var selector = document.getElementById('gameModeSelector');
      if (!selector) {
        console.error('Game mode selector not found');
        return;
      }

      console.log('[Game Controller] Found selector, setting up buttons...');

      // Add event listeners to mode buttons
      var buttons = selector.querySelectorAll('.mode-button');
      console.log('[Game Controller] Found', buttons.length, 'mode buttons');

      for (var i = 0; i < buttons.length; i++) {
        var mode = buttons[i].getAttribute('data-mode');
        console.log('[Game Controller] Button', i, 'has mode:', mode);
        buttons[i].addEventListener('click', this.handleModeSelection.bind(this));
      }

      console.log('[Game Controller] Initialization complete');
    },

    handleModeSelection: function(event) {
      console.log('[Game Controller] Button clicked');
      var mode = event.currentTarget.getAttribute('data-mode');
      console.log('[Game Controller] Mode selected:', mode);

      if (!mode) {
        console.error('No mode specified');
        return;
      }

      this.loadGameMode(mode);
    },

    loadGameMode: function(mode) {
      console.log('[Game Controller] Loading game mode:', mode);

      if (this.currentMode === mode) {
        console.log('[Game Controller] Mode already loaded, skipping');
        return; // Already loaded
      }

      console.log('[Game Controller] Hiding selector and setting current mode to:', mode);

      // Hide selector
      var selector = document.getElementById('gameModeSelector');
      if (selector) {
        selector.style.display = 'none';
      }

      this.currentMode = mode;

      if (mode === 'toprug1') {
        this.loadTopRug1();
      } else if (mode === 'toprug2') {
        this.loadTopRug2();
      }
    },

    loadTopRug1: function() {
      var container = document.getElementById('gameHolderTopRug1');
      if (!container) {
        console.error('Top Rug container not found');
        return;
      }

      // Hide Top Rug Maverick if it's showing
      var maverickContainer = document.getElementById('gameHolderTopRug2');
      if (maverickContainer) {
        maverickContainer.style.display = 'none';
      }

      container.style.display = 'block';

      if (!this.toprug1Loaded) {
        // Load the game script and CSS
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.type = 'text/css';
        css.href = 'games/top-rug/css/styles.css';
        css.onload = function() {
          console.log('[Game Controller] Top Rug CSS loaded successfully');
        };
        css.onerror = function() {
          console.error('[Game Controller] Failed to load Top Rug CSS');
        };
        document.head.appendChild(css);

        var script = document.createElement('script');
        script.src = 'games/top-rug/js/game.js?v=20241222';
        script.onload = function() {
          console.log('Top Rug game loaded');
          // Initialize the game
          if (typeof window.Aviator1Game !== 'undefined' && window.Aviator1Game.init) {
            window.Aviator1Game.init();
          }
        };
        script.onerror = function() {
          console.error('Failed to load Top Rug game script');
        };
        document.head.appendChild(script);
        this.toprug1Loaded = true;
      } else {
        // Game already loaded, just show it
        if (typeof window.Aviator1Game !== 'undefined' && window.Aviator1Game.show) {
          window.Aviator1Game.show();
        }
      }
    },

    loadTopRug2: function() {
      var container = document.getElementById('gameHolderTopRug2');
      if (!container) {
        console.error('Top Rug Maverick container not found');
        return;
      }

      // Hide Top Rug if it's showing
      var classicContainer = document.getElementById('gameHolderTopRug1');
      if (classicContainer) {
        classicContainer.style.display = 'none';
      }

      container.style.display = 'block';

      if (!this.toprug2Loaded) {
        // Check if we need to load additional scripts for Aviator2
        var scriptsToLoad = [
          'https://cdn.jsdelivr.net/npm/three@0.139.2/examples/js/loaders/OBJLoader.js',
          'https://cdn.jsdelivr.net/npm/three@0.139.2/examples/js/controls/OrbitControls.js',
          'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.10.2/gsap.min.js'
        ];

        // Also need to load Aviator2 CSS if not already loaded
        var existingLink = document.querySelector('link[href="games/top-rug-maverick/css/styles.css"]');
        if (!existingLink) {
          var link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = 'games/top-rug-maverick/css/styles.css';
          document.head.appendChild(link);
        }

        // Load additional fonts if needed
        var existingFontLink = document.querySelector('link[href*="Dela+Gothic+One"]');
        if (!existingFontLink) {
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
        }

        // Load scripts sequentially
        this.loadScriptsSequentially(scriptsToLoad, function() {
          // Now load the Aviator2 game script
          var script = document.createElement('script');
          script.src = 'games/top-rug-maverick/js/game.js?v=20241222';
          script.onload = function() {
            console.log('Top Rug Maverick game loaded');
            // Initialize the game
            if (typeof window.Aviator2Game !== 'undefined' && window.Aviator2Game.init) {
              window.Aviator2Game.init();
            } else if (typeof window.onWebsiteLoaded === 'function') {
              // Fallback: call the original initialization function
              window.onWebsiteLoaded();
            }
          };
          script.onerror = function() {
            console.error('Failed to load Top Rug Maverick game script');
          };
          document.head.appendChild(script);
        });

        this.toprug2Loaded = true;
      } else {
        // Game already loaded, just show it
        if (typeof window.Aviator2Game !== 'undefined' && window.Aviator2Game.show) {
          window.Aviator2Game.show();
        }
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
      GameModeController.init();
    });
  } else {
    GameModeController.init();
  }

  // Expose to window for debugging
  window.GameModeController = GameModeController;
})();

