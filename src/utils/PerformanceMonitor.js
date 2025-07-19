/**
 * Performance monitoring utility for GazeQuest Adventures
 * Tracks FPS, memory usage, and other performance metrics
 */

export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = 0;
    this.fps = 0;
    this.frameTimes = [];
    this.memoryUsage = [];
    this.isMonitoring = false;
    
    // Performance thresholds
    this.thresholds = {
      minFPS: 30,
      maxFrameTime: 33.33, // ~30 FPS
      memoryWarning: 100 * 1024 * 1024, // 100MB
      maxFrameTimeHistory: 100
    };
    
    this.callbacks = {
      lowFPS: [],
      highMemory: [],
      performanceWarning: []
    };
  }

  /**
   * Start performance monitoring
   */
  start() {
    this.isMonitoring = true;
    this.lastTime = performance.now();
    console.log('📊 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
  }

  /**
   * Update performance metrics
   */
  update(currentTime) {
    if (!this.isMonitoring) return;
    
    this.frameCount++;
    const deltaTime = currentTime - this.lastTime;
    
    // Update FPS every second
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Check for low FPS
      if (this.fps < this.thresholds.minFPS) {
        this.triggerCallback('lowFPS', { fps: this.fps });
      }
    }
    
    // Track frame times
    this.trackFrameTime(deltaTime);
    
    // Track memory usage (if available)
    this.trackMemoryUsage();
  }

  /**
   * Track individual frame times
   */
  trackFrameTime(deltaTime) {
    this.frameTimes.push(deltaTime);
    
    // Keep only recent frame times
    if (this.frameTimes.length > this.thresholds.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }
    
    // Check for frame time spikes
    if (deltaTime > this.thresholds.maxFrameTime * 2) {
      this.triggerCallback('performanceWarning', {
        type: 'frame_spike',
        frameTime: deltaTime,
        threshold: this.thresholds.maxFrameTime
      });
    }
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    if (!performance.memory) return;
    
    const memory = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      timestamp: performance.now()
    };
    
    this.memoryUsage.push(memory);
    
    // Keep only recent memory data (last 60 measurements)
    if (this.memoryUsage.length > 60) {
      this.memoryUsage.shift();
    }
    
    // Check for high memory usage
    if (memory.used > this.thresholds.memoryWarning) {
      this.triggerCallback('highMemory', memory);
    }
  }

  /**
   * Get current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 0;
    
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Get frame time statistics
   */
  getFrameTimeStats() {
    if (this.frameTimes.length === 0) {
      return { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
    }
    
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      min: sorted[0],
      max: sorted[len - 1],
      avg: this.getAverageFrameTime(),
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    if (!performance.memory || this.memoryUsage.length === 0) {
      return null;
    }
    
    const latest = this.memoryUsage[this.memoryUsage.length - 1];
    const memoryHistory = this.memoryUsage.map(m => m.used);
    const avg = memoryHistory.reduce((a, b) => a + b, 0) / memoryHistory.length;
    
    return {
      current: latest.used,
      total: latest.total,
      limit: latest.limit,
      average: avg,
      percentage: (latest.used / latest.limit) * 100
    };
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics() {
    return {
      fps: this.getFPS(),
      frameTime: this.getFrameTimeStats(),
      memory: this.getMemoryStats(),
      isMonitoring: this.isMonitoring,
      timestamp: performance.now()
    };
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable() {
    const frameTimeStats = this.getFrameTimeStats();
    const memoryStats = this.getMemoryStats();
    
    const checks = {
      fps: this.fps >= this.thresholds.minFPS,
      frameTime: frameTimeStats.p95 <= this.thresholds.maxFrameTime,
      memory: !memoryStats || memoryStats.percentage < 80
    };
    
    return Object.values(checks).every(check => check);
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations() {
    const recommendations = [];
    const metrics = this.getMetrics();
    
    if (metrics.fps < this.thresholds.minFPS) {
      recommendations.push({
        type: 'fps',
        severity: 'high',
        message: 'Low frame rate detected. Consider reducing visual effects.',
        action: 'reduce_effects'
      });
    }
    
    if (metrics.frameTime.p95 > this.thresholds.maxFrameTime) {
      recommendations.push({
        type: 'frameTime',
        severity: 'medium',
        message: 'Frame time spikes detected. Consider optimizing update loops.',
        action: 'optimize_updates'
      });
    }
    
    if (metrics.memory && metrics.memory.percentage > 80) {
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: 'High memory usage detected. Consider reducing asset quality.',
        action: 'reduce_assets'
      });
    }
    
    return recommendations;
  }

  /**
   * Add performance callback
   */
  onPerformanceEvent(eventType, callback) {
    if (this.callbacks[eventType]) {
      this.callbacks[eventType].push(callback);
    }
  }

  /**
   * Remove performance callback
   */
  offPerformanceEvent(eventType, callback) {
    if (this.callbacks[eventType]) {
      const index = this.callbacks[eventType].indexOf(callback);
      if (index > -1) {
        this.callbacks[eventType].splice(index, 1);
      }
    }
  }

  /**
   * Trigger performance callbacks
   */
  triggerCallback(eventType, data) {
    if (this.callbacks[eventType]) {
      this.callbacks[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in performance callback:', error);
        }
      });
    }
  }

  /**
   * Set performance thresholds
   */
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.frameCount = 0;
    this.fps = 0;
    this.frameTimes = [];
    this.memoryUsage = [];
    this.lastTime = performance.now();
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const recommendations = this.getPerformanceRecommendations();
    
    return {
      timestamp: new Date().toISOString(),
      metrics,
      recommendations,
      acceptable: this.isPerformanceAcceptable(),
      duration: this.isMonitoring ? performance.now() - this.lastTime : 0
    };
  }
}