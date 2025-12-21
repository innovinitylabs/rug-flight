// Game Mode Controller
// Handles game mode selection using shared architecture

(function() {
  'use strict';

  var GameModeController = {
    currentMode: null,
    engine: null,
    classicGame: null,
    combatGame: null,

    init: function() {
      console.log('[Game Controller] Initializing shared architecture...');

      var selector = document.getElementById('gameModeSelector');
      if (!selector) {
        console.error('Game mode selector not found');
        return;
      }

      // Initialize the shared game engine
      this.engine = new BaseGameEngine({
        containerId: 'gameHolder',
        onUpdate: this.update.bind(this),
        onRender: this.render.bind(this)
      });

      // Create game instances
      this.classicGame = new ClassicGame(this.engine);
      this.combatGame = new CombatGame(this.engine);

      console.log('[Game Controller] Found selector, setting up buttons...');

      // Add event listeners to mode buttons
      var buttons = selector.querySelectorAll('.mode-button');
      console.log('[Game Controller] Found', buttons.length, 'mode buttons');

      for (var i = 0; i < buttons.length; i++) {
        var mode = buttons[i].getAttribute('data-mode');
        console.log('[Game Controller] Button', i, 'has mode:', mode);
        buttons[i].addEventListener('click', this.handleModeSelection.bind(this));
      }

      console.log('[Game Controller] Shared architecture initialization complete');
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
      console.log('[Game Controller] Loading Classic mode...');

      // Hide mode selector
      var selector = document.getElementById('gameModeSelector');
      if (selector) {
        selector.style.display = 'none';
      }

      // Show game container
      var container = document.getElementById('gameHolder');
      if (container) {
        container.style.display = 'block';
      }

      // Initialize engine and start classic game
      this.currentMode = 'classic';
      this.startGame();
    },

    loadTopRug2: function() {
      console.log('[Game Controller] Loading Combat mode...');

      // Hide mode selector
      var selector = document.getElementById('gameModeSelector');
      if (selector) {
        selector.style.display = 'none';
      }

      // Show game container
      var container = document.getElementById('gameHolder');
      if (container) {
        container.style.display = 'block';
      }

      // Initialize engine and start combat game
      this.currentMode = 'combat';
      this.startGame();
    },

    startGame: async function() {
      console.log('[Game Controller] Starting game for mode:', this.currentMode);

      try {
        // Initialize the engine
        await this.engine.init();

        // Initialize the appropriate game
        if (this.currentMode === 'classic') {
          await this.classicGame.init();
        } else if (this.currentMode === 'combat') {
          await this.combatGame.init();
        }

        // Start the engine
        this.engine.start();

        console.log('[Game Controller] Game started successfully for mode:', this.currentMode);

      } catch (error) {
        console.error('[Game Controller] Failed to start game:', error);
      }
    },

    update: function(deltaTime) {
      // Update the current game mode
      if (this.currentMode === 'classic' && this.classicGame) {
        this.classicGame.update(deltaTime);
      } else if (this.currentMode === 'combat' && this.combatGame) {
        this.combatGame.update(deltaTime);
      }
    },

    render: function() {
      // Additional rendering logic if needed
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

