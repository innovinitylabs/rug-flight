// Game Mode Controller
// Handles game mode selection and loading

(function() {
  'use strict';

  var GameModeController = {
    currentMode: null,
    aviator1Loaded: false,
    aviator2Loaded: false,

    init: function() {
      var selector = document.getElementById('gameModeSelector');
      if (!selector) {
        console.error('Game mode selector not found');
        return;
      }

      // Add event listeners to mode buttons
      var buttons = selector.querySelectorAll('.mode-button');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', this.handleModeSelection.bind(this));
      }
    },

    handleModeSelection: function(event) {
      var mode = event.currentTarget.getAttribute('data-mode');
      if (!mode) {
        console.error('No mode specified');
        return;
      }

      this.loadGameMode(mode);
    },

    loadGameMode: function(mode) {
      if (this.currentMode === mode) {
        return; // Already loaded
      }

      // Hide selector
      var selector = document.getElementById('gameModeSelector');
      if (selector) {
        selector.style.display = 'none';
      }

      this.currentMode = mode;

      if (mode === 'aviator1') {
        this.loadAviator1();
      } else if (mode === 'aviator2') {
        this.loadAviator2();
      }
    },

    loadAviator1: function() {
      var container = document.getElementById('gameHolderAviator1');
      if (!container) {
        console.error('Aviator1 container not found');
        return;
      }

      // Hide Aviator2 if it's showing
      var aviator2Container = document.getElementById('gameHolderAviator2');
      if (aviator2Container) {
        aviator2Container.style.display = 'none';
      }

      container.style.display = 'block';

      if (!this.aviator1Loaded) {
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
        script.src = 'games/top-rug/js/game.js?v=7';
        script.onload = function() {
          console.log('Aviator1 game loaded');
          // Initialize the game
          if (typeof window.Aviator1Game !== 'undefined' && window.Aviator1Game.init) {
            window.Aviator1Game.init();
          }
        };
        script.onerror = function() {
          console.error('Failed to load Aviator1 game script');
        };
        document.head.appendChild(script);
        this.aviator1Loaded = true;
      } else {
        // Game already loaded, just show it
        if (typeof window.Aviator1Game !== 'undefined' && window.Aviator1Game.show) {
          window.Aviator1Game.show();
        }
      }
    },

    loadAviator2: function() {
      var container = document.getElementById('gameHolderAviator2');
      if (!container) {
        console.error('Aviator2 container not found');
        return;
      }

      // Hide Aviator1 if it's showing
      var aviator1Container = document.getElementById('gameHolderAviator1');
      if (aviator1Container) {
        aviator1Container.style.display = 'none';
      }

      container.style.display = 'block';

      if (!this.aviator2Loaded) {
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
          script.src = 'games/top-rug-maverick/js/game.js';
          script.onload = function() {
            console.log('Aviator2 game loaded');
            // Initialize the game
            if (typeof window.Aviator2Game !== 'undefined' && window.Aviator2Game.init) {
              window.Aviator2Game.init();
            } else if (typeof window.onWebsiteLoaded === 'function') {
              // Fallback: call the original initialization function
              window.onWebsiteLoaded();
            }
          };
          script.onerror = function() {
            console.error('Failed to load Aviator2 game script');
          };
          document.head.appendChild(script);
        });

        this.aviator2Loaded = true;
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

