/**
 * PerformanceMonitor - Tracks game performance metrics
 * Monitors FPS, memory usage, and provides optimization recommendations
 */
class PerformanceMonitor {
  constructor() {
    this.enabled = true;
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0
    };

    // FPS tracking
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];

    // Memory tracking
    this.memoryHistory = [];

    // Performance thresholds
    this.thresholds = {
      minFPS: 30,
      maxFrameTime: 33, // ~30 FPS
      maxMemoryMB: 100
    };

    console.log('[PerformanceMonitor] Initialized');
  }

  /**
   * Update performance metrics
   */
  update(deltaTime, renderer = null, scene = null) {
    if (!this.enabled) return;

    // Update FPS
    this.frameCount++;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.fpsHistory.push(this.metrics.fps);
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift(); // Keep last 60 seconds
      }

      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    // Update frame time
    this.metrics.frameTime = deltaTime;

    // Update memory usage
    if (performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      this.memoryHistory.push(this.metrics.memoryUsage);
      if (this.memoryHistory.length > 60) {
        this.memoryHistory.shift();
      }
    }

    // Update renderer stats if available
    if (renderer && renderer.info) {
      this.metrics.drawCalls = renderer.info.render.calls;
      this.metrics.triangles = renderer.info.render.triangles;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const fpsAvg = this.fpsHistory.length > 0 ?
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length : 0;

    const memoryAvg = this.memoryHistory.length > 0 ?
      this.memoryHistory.reduce((a, b) => a + b, 0) / this.memoryHistory.length : 0;

    return {
      currentFPS: this.metrics.fps,
      averageFPS: Math.round(fpsAvg),
      minFPS: Math.min(...this.fpsHistory),
      maxFPS: Math.max(...this.fpsHistory),
      currentFrameTime: Math.round(this.metrics.frameTime * 1000) / 1000,
      memoryUsageMB: Math.round(this.metrics.memoryUsage * 100) / 100,
      averageMemoryMB: Math.round(memoryAvg * 100) / 100,
      drawCalls: this.metrics.drawCalls,
      triangles: this.metrics.triangles
    };
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceGood() {
    return this.metrics.fps >= this.thresholds.minFPS &&
           this.metrics.frameTime <= this.thresholds.maxFrameTime &&
           (!performance.memory || this.metrics.memoryUsage < this.thresholds.maxMemoryMB);
  }

  /**
   * Get performance recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (this.metrics.fps < this.thresholds.minFPS) {
      recommendations.push('Low FPS detected. Consider reducing visual quality or object count.');
    }

    if (this.metrics.frameTime > this.thresholds.maxFrameTime) {
      recommendations.push('High frame times detected. Check for performance bottlenecks.');
    }

    if (performance.memory && this.metrics.memoryUsage > this.thresholds.maxMemoryMB) {
      recommendations.push('High memory usage detected. Consider texture cleanup or object pooling.');
    }

    if (this.metrics.drawCalls > 1000) {
      recommendations.push('High draw calls detected. Consider reducing scene complexity.');
    }

    if (this.metrics.triangles > 100000) {
      recommendations.push('High triangle count detected. Consider LOD or culling.');
    }

    return recommendations;
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[PerformanceMonitor] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Update performance thresholds
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
    console.log('[PerformanceMonitor] Thresholds updated:', this.thresholds);
  }

  /**
   * Reset performance history
   */
  reset() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.memoryHistory = [];
    console.log('[PerformanceMonitor] Reset');
  }

  /**
   * Create performance overlay for debugging
   */
  createOverlay(container = document.body) {
    if (this.overlay) {
      this.destroyOverlay();
    }

    this.overlay = document.createElement('div');
    this.overlay.id = 'performance-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      pointer-events: none;
      max-width: 200px;
    `;

    container.appendChild(this.overlay);
    this.updateOverlay();

    console.log('[PerformanceMonitor] Performance overlay created');
  }

  /**
   * Update performance overlay
   */
  updateOverlay() {
    if (!this.overlay) return;

    const stats = this.getStats();
    const recommendations = this.getRecommendations();

    this.overlay.innerHTML = `
      <div>FPS: ${stats.currentFPS} (${stats.averageFPS} avg)</div>
      <div>Frame: ${stats.currentFrameTime}ms</div>
      <div>Memory: ${stats.memoryUsageMB}MB</div>
      <div>Draw: ${stats.drawCalls}</div>
      <div>Triangles: ${stats.triangles}</div>
      ${recommendations.length > 0 ? '<div style="color: #ffaa00; margin-top: 5px;">⚠️ Issues detected</div>' : ''}
    `;

    // Update color based on performance
    const isGood = this.isPerformanceGood();
    this.overlay.style.color = isGood ? '#00ff00' : '#ffaa00';
  }

  /**
   * Destroy performance overlay
   */
  destroyOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
      this.overlay = null;
      console.log('[PerformanceMonitor] Performance overlay destroyed');
    }
  }

  /**
   * Auto-update overlay (call this in game loop)
   */
  autoUpdateOverlay() {
    if (this.overlay && this.enabled) {
      this.updateOverlay();
    }
  }
}

// Global performance monitor instance
let performanceMonitorInstance = null;

/**
 * Get or create the global performance monitor
 */
function getPerformanceMonitor() {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceMonitor, getPerformanceMonitor };
} else if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
  window.getPerformanceMonitor = getPerformanceMonitor;
}
