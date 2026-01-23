// Logger utility for the game
// Supports different log levels and can be configured for production

(function() {
  'use strict';

  const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  };

  class Logger {
    constructor() {
      this.level = LOG_LEVELS.INFO; // Default to INFO level
      this.prefix = '[RugFlight]';
    }

    setLevel(level) {
      this.level = level;
    }

    error(message, ...args) {
      if (this.level >= LOG_LEVELS.ERROR) {
        console.error(`${this.prefix} ERROR:`, message, ...args);
      }
    }

    warn(message, ...args) {
      if (this.level >= LOG_LEVELS.WARN) {
        console.warn(`${this.prefix} WARN:`, message, ...args);
      }
    }

    info(message, ...args) {
      if (this.level >= LOG_LEVELS.INFO) {
        console.log(`${this.prefix} INFO:`, message, ...args);
      }
    }

    debug(message, ...args) {
      if (this.level >= LOG_LEVELS.DEBUG) {
        console.log(`${this.prefix} DEBUG:`, message, ...args);
      }
    }
  }

  // Create global logger instance
  const logger = new Logger();

  // Make it available globally for easy access
  window.logger = logger;

  // Also expose as a global for direct access
  window.Logger = Logger;

})();