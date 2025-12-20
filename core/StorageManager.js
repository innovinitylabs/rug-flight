/**
 * StorageManager - Handles persistent data storage for the game
 * Manages localStorage for game states, high scores, settings, and preferences
 */
class StorageManager {
  constructor() {
    this.storagePrefix = 'toprug_';
    this.isAvailable = this.checkStorageAvailability();

    if (!this.isAvailable) {
      console.warn('[StorageManager] localStorage not available, using fallback');
    }

    console.log('[StorageManager] Initialized');
  }

  /**
   * Check if localStorage is available
   */
  checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get storage key with prefix
   */
  getKey(key) {
    return this.storagePrefix + key;
  }

  /**
   * Set a value in storage
   */
  set(key, value) {
    if (!this.isAvailable) return false;

    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serializedValue);
      return true;
    } catch (error) {
      console.error('[StorageManager] Failed to save:', key, error);
      return false;
    }
  }

  /**
   * Get a value from storage
   */
  get(key, defaultValue = null) {
    if (!this.isAvailable) return defaultValue;

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error('[StorageManager] Failed to load:', key, error);
      return defaultValue;
    }
  }

  /**
   * Remove a value from storage
   */
  remove(key) {
    if (!this.isAvailable) return false;

    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('[StorageManager] Failed to remove:', key, error);
      return false;
    }
  }

  /**
   * Clear all game-related storage
   */
  clear() {
    if (!this.isAvailable) return false;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log('[StorageManager] Cleared all stored data');
      return true;
    } catch (error) {
      console.error('[StorageManager] Failed to clear storage:', error);
      return false;
    }
  }

  // ===== GAME STATE MANAGEMENT =====

  /**
   * Save game state for a specific mode
   */
  saveGameState(mode, gameState) {
    const key = `gamestate_${mode}`;
    return this.set(key, {
      data: gameState,
      timestamp: Date.now(),
      version: '1.0'
    });
  }

  /**
   * Load game state for a specific mode
   */
  loadGameState(mode) {
    const key = `gamestate_${mode}`;
    const saved = this.get(key);

    if (saved && saved.data) {
      // Validate saved data
      if (this.validateGameState(saved.data)) {
        console.log(`[StorageManager] Loaded game state for ${mode}`);
        return saved.data;
      } else {
        console.warn(`[StorageManager] Invalid game state for ${mode}, discarding`);
        this.remove(key);
      }
    }

    return null;
  }

  /**
   * Validate game state structure
   */
  validateGameState(state) {
    // Basic validation - check for required properties
    return state && typeof state === 'object';
  }

  // ===== HIGH SCORES =====

  /**
   * Save high score for a mode
   */
  saveHighScore(mode, score, level = 1) {
    const key = `highscore_${mode}`;
    const current = this.get(key, { score: 0, level: 1 });

    if (score > current.score) {
      const newRecord = {
        score: score,
        level: level,
        timestamp: Date.now(),
        mode: mode
      };

      this.set(key, newRecord);
      console.log(`[StorageManager] New high score for ${mode}: ${score}`);
      return true;
    }

    return false;
  }

  /**
   * Get high score for a mode
   */
  getHighScore(mode) {
    const key = `highscore_${mode}`;
    return this.get(key, { score: 0, level: 1 });
  }

  /**
   * Get all high scores
   */
  getAllHighScores() {
    const scores = {};
    const modes = ['classic', 'combat'];

    modes.forEach(mode => {
      scores[mode] = this.getHighScore(mode);
    });

    return scores;
  }

  // ===== SETTINGS =====

  /**
   * Save game settings
   */
  saveSettings(settings) {
    return this.set('settings', {
      ...settings,
      timestamp: Date.now()
    });
  }

  /**
   * Load game settings
   */
  loadSettings() {
    const defaultSettings = {
      audioEnabled: true,
      musicVolume: 0.5,
      sfxVolume: 0.7,
      showTutorial: true,
      preferredMode: 'classic',
      graphicsQuality: 'high'
    };

    const saved = this.get('settings');
    if (saved) {
      // Merge saved settings with defaults
      return { ...defaultSettings, ...saved };
    }

    return defaultSettings;
  }

  // ===== STATISTICS =====

  /**
   * Save game statistics
   */
  saveStats(stats) {
    const key = 'statistics';
    const current = this.get(key, {});

    const updated = {
      ...current,
      ...stats,
      lastPlayed: Date.now()
    };

    return this.set(key, updated);
  }

  /**
   * Load game statistics
   */
  loadStats() {
    const defaultStats = {
      gamesPlayed: 0,
      totalScore: 0,
      totalDistance: 0,
      enemiesKilled: 0,
      coinsCollected: 0,
      timePlayed: 0,
      lastPlayed: null
    };

    const saved = this.get('statistics');
    if (saved) {
      return { ...defaultStats, ...saved };
    }

    return defaultStats;
  }

  /**
   * Update statistics
   */
  updateStats(updates) {
    const current = this.loadStats();
    const updated = { ...current };

    // Update numeric values
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'number' && typeof current[key] === 'number') {
        updated[key] += updates[key];
      } else {
        updated[key] = updates[key];
      }
    });

    return this.saveStats(updated);
  }

  // ===== ACHIEVEMENTS =====

  /**
   * Save achievement progress
   */
  saveAchievement(achievementId, progress = 1) {
    const key = 'achievements';
    const achievements = this.get(key, {});

    achievements[achievementId] = {
      unlocked: true,
      progress: progress,
      timestamp: Date.now()
    };

    return this.set(key, achievements);
  }

  /**
   * Load achievements
   */
  loadAchievements() {
    return this.get('achievements', {});
  }

  /**
   * Check if achievement is unlocked
   */
  isAchievementUnlocked(achievementId) {
    const achievements = this.loadAchievements();
    return achievements[achievementId] && achievements[achievementId].unlocked;
  }

  // ===== UTILITY METHODS =====

  /**
   * Get storage usage information
   */
  getStorageInfo() {
    if (!this.isAvailable) {
      return { available: false };
    }

    let used = 0;
    let items = 0;

    try {
      for (let key in localStorage) {
        if (key.startsWith(this.storagePrefix)) {
          const value = localStorage.getItem(key);
          used += key.length + value.length;
          items++;
        }
      }
    } catch (error) {
      console.error('[StorageManager] Error calculating storage usage:', error);
    }

    return {
      available: true,
      used: used,
      items: items,
      usedKB: Math.round(used / 1024 * 100) / 100
    };
  }

  /**
   * Export all data as JSON
   */
  exportData() {
    if (!this.isAvailable) return null;

    const data = {};

    try {
      for (let key in localStorage) {
        if (key.startsWith(this.storagePrefix)) {
          const cleanKey = key.replace(this.storagePrefix, '');
          data[cleanKey] = this.get(cleanKey);
        }
      }
    } catch (error) {
      console.error('[StorageManager] Error exporting data:', error);
      return null;
    }

    return data;
  }

  /**
   * Import data from JSON
   */
  importData(data) {
    if (!this.isAvailable || !data || typeof data !== 'object') {
      return false;
    }

    try {
      Object.keys(data).forEach(key => {
        this.set(key, data[key]);
      });

      console.log('[StorageManager] Data imported successfully');
      return true;
    } catch (error) {
      console.error('[StorageManager] Error importing data:', error);
      return false;
    }
  }

  /**
   * Reset all data to defaults
   */
  resetToDefaults() {
    console.log('[StorageManager] Resetting to defaults');

    // Clear all data
    this.clear();

    // Save default settings
    this.saveSettings(this.loadSettings());

    // Save default stats
    this.saveStats(this.loadStats());

    console.log('[StorageManager] Reset to defaults complete');
  }
}

// Global instance
let storageManagerInstance = null;

/**
 * Get or create the global storage manager
 */
function getStorageManager() {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager();
  }
  return storageManagerInstance;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager, getStorageManager };
} else if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
  window.getStorageManager = getStorageManager;
}
