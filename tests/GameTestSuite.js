/**
 * GameTestSuite - Comprehensive testing suite for the unified Top Rug game
 * Tests edge cases, error handling, and system integration
 */
class GameTestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
    this.isRunning = false;

    console.log('[GameTestSuite] Initialized');
  }

  /**
   * Add a test to the suite
   */
  addTest(name, testFunction) {
    this.tests.push({
      name: name,
      func: testFunction,
      status: 'pending'
    });
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    if (this.isRunning) {
      console.warn('[GameTestSuite] Tests already running');
      return;
    }

    this.isRunning = true;
    this.results = [];

    console.log('[GameTestSuite] Starting test suite...');

    for (const test of this.tests) {
      try {
        console.log(`[GameTestSuite] Running: ${test.name}`);
        test.status = 'running';

        const result = await test.func();
        test.status = 'passed';
        test.result = result;

        this.results.push({
          name: test.name,
          status: 'passed',
          result: result,
          error: null
        });

        console.log(`✅ ${test.name}: PASSED`);

      } catch (error) {
        test.status = 'failed';
        test.error = error;

        this.results.push({
          name: test.name,
          status: 'failed',
          result: null,
          error: error.message
        });

        console.error(`❌ ${test.name}: FAILED - ${error.message}`);
      }
    }

    this.isRunning = false;
    this.printSummary();
  }

  /**
   * Print test results summary
   */
  printSummary() {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(50));
    console.log('TEST SUITE SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);

    if (failed > 0) {
      console.log('\nFAILED TESTS:');
      this.results.filter(r => r.status === 'failed').forEach(result => {
        console.log(`❌ ${result.name}: ${result.error}`);
      });
    }

    console.log('='.repeat(50));
  }

  /**
   * Get test results
   */
  getResults() {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      results: this.results
    };
  }
}

// Global test suite instance
let gameTestSuite = null;

/**
 * Get or create the global test suite
 */
function getGameTestSuite() {
  if (!gameTestSuite) {
    gameTestSuite = new GameTestSuite();
    setupTests(gameTestSuite);
  }
  return gameTestSuite;
}

/**
 * Set up all tests
 */
function setupTests(suite) {
  // ===== CORE SYSTEM TESTS =====

  suite.addTest('Core Systems Initialization', async () => {
    const controller = window.getGameController && window.getGameController();
    if (!controller) throw new Error('GameController not available');

    if (!controller.audioManager) throw new Error('AudioManager not initialized');
    if (!controller.textureManager) throw new Error('TextureManager not initialized');
    if (!controller.storageManager) throw new Error('StorageManager not initialized');
    if (!controller.modeController) throw new Error('ModeController not initialized');

    return 'All core systems initialized successfully';
  });

  suite.addTest('Visual Design System', async () => {
    const vds = window.getVisualDesignSystem && window.getVisualDesignSystem();
    if (!vds) throw new Error('VisualDesignSystem not available');

    const colors = vds.getColor('primary');
    if (!colors) throw new Error('Color system not working');

    const button = vds.createButton('Test', 'primary');
    if (!button || button.tagName !== 'BUTTON') throw new Error('Button creation failed');

    return 'Visual design system working correctly';
  });

  suite.addTest('Object Pool System', async () => {
    const pools = {
      projectilePool: window.ProjectilePool,
      enemyPool: window.EnemyPool,
      coinPool: window.CoinPool,
      particlePool: window.ParticlePool
    };

    for (const [name, PoolClass] of Object.entries(pools)) {
      if (!PoolClass) throw new Error(`${name} not available`);
    }

    const projectilePool = new window.ProjectilePool();
    const obj1 = projectilePool.get();
    projectilePool.release(obj1);
    const obj2 = projectilePool.get();

    if (!obj2) throw new Error('Object pool reuse failed');

    return 'Object pooling system working correctly';
  });

  // ===== MODE SWITCHING TESTS =====

  suite.addTest('Mode Switching - Classic to Combat', async () => {
    const controller = window.getGameController && window.getGameController();
    if (!controller) throw new Error('GameController not available');

    // Start Classic mode
    await controller.start('classic');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Switch to Combat
    const success = await controller.modeController.switchMode('combat');
    if (!success) throw new Error('Mode switch failed');

    if (controller.currentMode !== 'combat') throw new Error('Mode not switched correctly');

    return 'Classic to Combat mode switch successful';
  });

  suite.addTest('Mode Switching - Combat to Classic', async () => {
    const controller = window.getGameController && window.getGameController();
    if (!controller) throw new Error('GameController not available');

    // Ensure we're in combat mode first
    if (controller.currentMode !== 'combat') {
      await controller.modeController.switchMode('combat');
    }

    // Switch back to Classic
    const success = await controller.modeController.switchMode('classic');
    if (!success) throw new Error('Mode switch failed');

    if (controller.currentMode !== 'classic') throw new Error('Mode not switched correctly');

    return 'Combat to Classic mode switch successful';
  });

  suite.addTest('Rapid Mode Switching', async () => {
    const controller = window.getGameController && window.getGameController();
    if (!controller) throw new Error('GameController not available');

    // Rapid switching between modes
    for (let i = 0; i < 5; i++) {
      await controller.modeController.switchMode('classic');
      await controller.modeController.switchMode('combat');
    }

    return 'Rapid mode switching handled correctly';
  });

  // ===== STORAGE TESTS =====

  suite.addTest('Storage System', async () => {
    const storage = window.getStorageManager && window.getStorageManager();
    if (!storage) throw new Error('StorageManager not available');

    // Test basic storage
    const testKey = 'test_key_' + Date.now();
    const testData = { score: 12345, level: 5 };

    const setSuccess = storage.set(testKey, testData);
    if (!setSuccess) throw new Error('Storage set failed');

    const retrievedData = storage.get(testKey);
    if (!retrievedData || retrievedData.score !== testData.score) {
      throw new Error('Storage get failed');
    }

    // Clean up
    storage.remove(testKey);

    return 'Storage system working correctly';
  });

  suite.addTest('High Score Persistence', async () => {
    const storage = window.getStorageManager && window.getStorageManager();
    if (!storage) throw new Error('StorageManager not available');

    // Save a high score
    const isNewRecord = storage.saveHighScore('classic', 99999);
    if (!isNewRecord) throw new Error('High score save failed');

    // Retrieve it
    const highScore = storage.getHighScore('classic');
    if (highScore.score !== 99999) throw new Error('High score retrieval failed');

    return 'High score persistence working correctly';
  });

  // ===== AUDIO TESTS =====

  suite.addTest('Audio System', async () => {
    const audioManager = window.AudioManager && new window.AudioManager();
    if (!audioManager) throw new Error('AudioManager not available');

    // Test audio state
    const state = audioManager.getAudioState();
    if (typeof state !== 'object') throw new Error('Audio state invalid');

    return 'Audio system state tracking working';
  });

  suite.addTest('Audio Crossfading', async () => {
    const audioManager = window.AudioManager && new window.AudioManager();
    if (!audioManager) throw new Error('AudioManager not available');

    // Create mock audio sources
    const mockSource1 = { gain: { value: 1 } };
    const mockSource2 = { gain: { value: 0 } };

    audioManager.crossfade(mockSource1, mockSource2, 100);

    return 'Audio crossfading system available';
  });

  // ===== PERFORMANCE TESTS =====

  suite.addTest('Performance Monitoring', async () => {
    const monitor = window.getPerformanceMonitor && window.getPerformanceMonitor();
    if (!monitor) throw new Error('PerformanceMonitor not available');

    const metrics = monitor.getMetrics();
    if (typeof metrics !== 'object') throw new Error('Performance metrics invalid');

    return 'Performance monitoring system working';
  });

  // ===== EDGE CASE TESTS =====

  suite.addTest('Browser Resize Handling', async () => {
    const controller = window.getGameController && window.getGameController();
    if (!controller) throw new Error('GameController not available');

    // Simulate window resize
    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);

    // Test should not crash
    await new Promise(resolve => setTimeout(resolve, 100));

    return 'Browser resize handled without errors';
  });

  suite.addTest('Rapid UI Interactions', async () => {
    const modeButtons = document.querySelectorAll('.mode-button');
    if (modeButtons.length === 0) throw new Error('No mode buttons found');

    // Rapidly click buttons (should be debounced)
    for (let i = 0; i < 10; i++) {
      modeButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return 'Rapid UI interactions handled gracefully';
  });

  suite.addTest('Memory Leak Prevention', async () => {
    const controller = window.getGameController && window.getGameController();
    if (!controller) throw new Error('GameController not available');

    // Start and stop game multiple times
    for (let i = 0; i < 3; i++) {
      await controller.start('classic');
      await new Promise(resolve => setTimeout(resolve, 50));
      controller.stop();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return 'Memory leak prevention working (no crashes on repeated start/stop)';
  });

  suite.addTest('Error Recovery', async () => {
    const controller = window.getGameController && window.getGameController();
    if (!controller) throw new Error('GameController not available');

    // Try to switch to invalid mode
    try {
      await controller.modeController.switchMode('invalid_mode');
      throw new Error('Should have failed with invalid mode');
    } catch (error) {
      if (error.message.includes('invalid_mode')) {
        return 'Error recovery working correctly';
      }
      throw error;
    }
  });

  suite.addTest('Network Failure Simulation', async () => {
    // Simulate offline state
    const originalOnline = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

    // Test storage operations still work
    const storage = window.getStorageManager && window.getStorageManager();
    if (storage) {
      const testData = { offline: true };
      const success = storage.set('offline_test', testData);
      const retrieved = storage.get('offline_test');

      if (!success || !retrieved || !retrieved.offline) {
        throw new Error('Storage failed in offline simulation');
      }

      storage.remove('offline_test');
    }

    // Restore online state
    Object.defineProperty(navigator, 'onLine', { value: originalOnline, writable: true });

    return 'Network failure handled gracefully';
  });

  console.log(`[GameTestSuite] Set up ${suite.tests.length} comprehensive tests`);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameTestSuite, getGameTestSuite };
} else if (typeof window !== 'undefined') {
  window.GameTestSuite = GameTestSuite;
  window.getGameTestSuite = getGameTestSuite;
}
