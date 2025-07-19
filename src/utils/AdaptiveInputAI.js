/**
 * Adaptive AI system for input method optimization
 * Learns user patterns and recommends optimal input methods and settings
 */

export class AdaptiveInputAI {
  constructor() {
    this.userProfile = {
      inputPreferences: {},
      performanceMetrics: {},
      adaptationHistory: [],
      sessionData: [],
      fatiguePatterns: {}
    };
    
    this.analysisConfig = {
      minDataPoints: 10,
      analysisWindow: 100, // Number of recent events to analyze
      adaptationThreshold: 0.15, // Minimum improvement needed to recommend change
      confidenceThreshold: 0.7,
      maxRecommendationsPerSession: 5
    };
    
    this.currentSessionRecommendations = 0;
  }

  /**
   * Analyze input history and provide recommendations
   */
  analyze(inputHistory, calibrationData, context) {
    if (inputHistory.length < this.analysisConfig.minDataPoints) {
      return [];
    }
    
    // Get recent input events for analysis
    const recentEvents = inputHistory.slice(-this.analysisConfig.analysisWindow);
    
    // Update user profile with new data
    this.updateUserProfile(recentEvents, context);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(recentEvents, context);
    
    // Filter and prioritize recommendations
    return this.filterRecommendations(recommendations);
  }

  /**
   * Update user profile with new input data
   */
  updateUserProfile(recentEvents, context) {
    // Analyze input method performance
    this.analyzeInputPerformance(recentEvents);
    
    // Track contextual preferences
    this.trackContextualPreferences(recentEvents, context);
    
    // Detect fatigue patterns
    this.detectFatiguePatterns(recentEvents, context);
    
    // Update session data
    this.updateSessionData(recentEvents, context);
  }

  /**
   * Analyze performance metrics for each input method
   */
  analyzeInputPerformance(events) {
    const methodStats = {};
    
    events.forEach(event => {
      const method = event.method;
      
      if (!methodStats[method]) {
        methodStats[method] = {
          count: 0,
          totalAccuracy: 0,
          totalResponseTime: 0,
          errorCount: 0,
          successCount: 0
        };
      }
      
      const stats = methodStats[method];
      stats.count++;
      stats.totalAccuracy += event.accuracy || 0;
      stats.totalResponseTime += event.responseTime || 0;
      
      if (event.accuracy < 0.5) {
        stats.errorCount++;
      } else {
        stats.successCount++;
      }
    });
    
    // Calculate metrics for each method
    Object.keys(methodStats).forEach(method => {
      const stats = methodStats[method];
      
      this.userProfile.performanceMetrics[method] = {
        averageAccuracy: stats.totalAccuracy / stats.count,
        averageResponseTime: stats.totalResponseTime / stats.count,
        successRate: stats.successCount / stats.count,
        errorRate: stats.errorCount / stats.count,
        totalEvents: stats.count,
        lastUpdated: Date.now()
      };
    });
  }

  /**
   * Track preferences based on context
   */
  trackContextualPreferences(events, context) {
    const contextKey = this.getContextKey(context);
    
    if (!this.userProfile.inputPreferences[contextKey]) {
      this.userProfile.inputPreferences[contextKey] = {};
    }
    
    const contextPrefs = this.userProfile.inputPreferences[contextKey];
    
    // Count usage by input method in this context
    events.forEach(event => {
      const method = event.method;
      contextPrefs[method] = (contextPrefs[method] || 0) + 1;
    });
  }

  /**
   * Detect user fatigue patterns
   */
  detectFatiguePatterns(events, context) {
    const timeSlots = this.groupEventsByTime(events);
    
    timeSlots.forEach((slotEvents, timeSlot) => {
      const averageAccuracy = slotEvents.reduce((sum, e) => sum + (e.accuracy || 0), 0) / slotEvents.length;
      const averageResponseTime = slotEvents.reduce((sum, e) => sum + (e.responseTime || 0), 0) / slotEvents.length;
      
      if (!this.userProfile.fatiguePatterns[timeSlot]) {
        this.userProfile.fatiguePatterns[timeSlot] = {
          accuracyHistory: [],
          responseTimeHistory: [],
          samples: 0
        };
      }
      
      const pattern = this.userProfile.fatiguePatterns[timeSlot];
      pattern.accuracyHistory.push(averageAccuracy);
      pattern.responseTimeHistory.push(averageResponseTime);
      pattern.samples++;
      
      // Keep only recent history
      if (pattern.accuracyHistory.length > 20) {
        pattern.accuracyHistory.shift();
        pattern.responseTimeHistory.shift();
      }
    });
  }

  /**
   * Group events by time slots for fatigue analysis
   */
  groupEventsByTime(events) {
    const timeSlots = new Map();
    const slotDuration = 5 * 60 * 1000; // 5 minutes
    
    events.forEach(event => {
      const slot = Math.floor(event.timestamp / slotDuration);
      
      if (!timeSlots.has(slot)) {
        timeSlots.set(slot, []);
      }
      
      timeSlots.get(slot).push(event);
    });
    
    return timeSlots;
  }

  /**
   * Update session data for learning
   */
  updateSessionData(events, context) {
    const sessionSummary = {
      timestamp: Date.now(),
      context: this.getContextKey(context),
      eventCount: events.length,
      inputMethods: [...new Set(events.map(e => e.method))],
      averageAccuracy: events.reduce((sum, e) => sum + (e.accuracy || 0), 0) / events.length,
      averageResponseTime: events.reduce((sum, e) => sum + (e.responseTime || 0), 0) / events.length,
      userFatigue: context.userFatigue || 0
    };
    
    this.userProfile.sessionData.push(sessionSummary);
    
    // Keep only recent sessions
    if (this.userProfile.sessionData.length > 50) {
      this.userProfile.sessionData.shift();
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(recentEvents, context) {
    const recommendations = [];
    
    // Check if we should recommend input method switch
    const inputSwitchRec = this.analyzeInputMethodSwitching(recentEvents, context);
    if (inputSwitchRec) {
      recommendations.push(inputSwitchRec);
    }
    
    // Check if we should adjust timing parameters
    const timingRec = this.analyzeTimingAdjustments(recentEvents, context);
    if (timingRec) {
      recommendations.push(timingRec);
    }
    
    // Check if recalibration is needed
    const calibrationRec = this.analyzeCalibrationNeeds(recentEvents, context);
    if (calibrationRec) {
      recommendations.push(calibrationRec);
    }
    
    // Check for fatigue-based recommendations
    const fatigueRec = this.analyzeFatigueRecommendations(recentEvents, context);
    if (fatigueRec) {
      recommendations.push(fatigueRec);
    }
    
    return recommendations;
  }

  /**
   * Analyze whether to recommend input method switching
   */
  analyzeInputMethodSwitching(events, context) {
    const currentMethod = this.getCurrentPrimaryMethod(events);
    const methodPerformance = this.userProfile.performanceMetrics;
    
    // Find the best performing method for current context
    const contextKey = this.getContextKey(context);
    const contextPrefs = this.userProfile.inputPreferences[contextKey] || {};
    
    let bestMethod = currentMethod;
    let bestScore = this.calculateMethodScore(currentMethod, methodPerformance, contextPrefs);
    
    Object.keys(methodPerformance).forEach(method => {
      if (method !== currentMethod) {
        const score = this.calculateMethodScore(method, methodPerformance, contextPrefs);
        
        if (score > bestScore + this.analysisConfig.adaptationThreshold) {
          bestMethod = method;
          bestScore = score;
        }
      }
    });
    
    if (bestMethod !== currentMethod) {
      return {
        type: 'switch_input',
        confidence: Math.min(bestScore - this.calculateMethodScore(currentMethod, methodPerformance, contextPrefs), 1.0),
        data: {
          from: currentMethod,
          to: bestMethod,
          reason: 'performance_optimization'
        }
      };
    }
    
    return null;
  }

  /**
   * Calculate a score for an input method
   */
  calculateMethodScore(method, methodPerformance, contextPrefs) {
    const perf = methodPerformance[method];
    if (!perf) return 0;
    
    const usage = contextPrefs[method] || 0;
    const totalUsage = Object.values(contextPrefs).reduce((sum, count) => sum + count, 0);
    const usageRatio = totalUsage > 0 ? usage / totalUsage : 0;
    
    // Weighted score combining performance and user preference
    return (
      perf.averageAccuracy * 0.4 +
      perf.successRate * 0.3 +
      (1 - Math.min(perf.averageResponseTime / 1000, 1)) * 0.2 + // Normalize response time
      usageRatio * 0.1
    );
  }

  /**
   * Analyze timing adjustments needed
   */
  analyzeTimingAdjustments(events, context) {
    const currentMethod = this.getCurrentPrimaryMethod(events);
    const methodEvents = events.filter(e => e.method === currentMethod);
    
    if (methodEvents.length < 5) return null;
    
    const averageResponseTime = methodEvents.reduce((sum, e) => sum + (e.responseTime || 0), 0) / methodEvents.length;
    const errorRate = methodEvents.filter(e => (e.accuracy || 0) < 0.5).length / methodEvents.length;
    
    // If error rate is high and response time is low, suggest slowing down
    if (errorRate > 0.3 && averageResponseTime < 500) {
      return {
        type: 'adjust_timing',
        confidence: Math.min(errorRate, 1.0),
        data: {
          method: currentMethod,
          adjustment: 'increase_dwell_time',
          amount: Math.min(500, errorRate * 1000),
          reason: 'reduce_errors'
        }
      };
    }
    
    // If error rate is low and response time is high, suggest speeding up
    if (errorRate < 0.1 && averageResponseTime > 2000) {
      return {
        type: 'adjust_timing',
        confidence: Math.min(1 - errorRate, 1.0),
        data: {
          method: currentMethod,
          adjustment: 'decrease_dwell_time',
          amount: Math.min(500, (averageResponseTime - 1000) * 0.5),
          reason: 'improve_speed'
        }
      };
    }
    
    return null;
  }

  /**
   * Analyze if recalibration is needed
   */
  analyzeCalibrationNeeds(events, context) {
    const currentMethod = this.getCurrentPrimaryMethod(events);
    
    // Only for methods that require calibration
    if (!['eyeTracking', 'breath'].includes(currentMethod)) {
      return null;
    }
    
    const methodEvents = events.filter(e => e.method === currentMethod);
    const recentAccuracy = methodEvents.slice(-20).reduce((sum, e) => sum + (e.accuracy || 0), 0) / Math.min(methodEvents.length, 20);
    
    // If accuracy has dropped significantly, suggest recalibration
    if (recentAccuracy < 0.6) {
      return {
        type: 'recalibrate',
        confidence: 1 - recentAccuracy,
        data: {
          method: currentMethod,
          reason: 'accuracy_degradation',
          currentAccuracy: recentAccuracy
        }
      };
    }
    
    return null;
  }

  /**
   * Analyze fatigue-based recommendations
   */
  analyzeFatigueRecommendations(events, context) {
    const fatigue = context.userFatigue || 0;
    
    if (fatigue > 0.7) {
      // High fatigue - recommend break or easier input method
      const currentMethod = this.getCurrentPrimaryMethod(events);
      
      // Suggest switching to more reliable method
      const reliableMethods = ['keyboard', 'switch'];
      if (!reliableMethods.includes(currentMethod)) {
        return {
          type: 'switch_input',
          confidence: fatigue,
          data: {
            from: currentMethod,
            to: 'keyboard',
            reason: 'fatigue_management'
          }
        };
      }
      
      // Or suggest a break
      return {
        type: 'suggest_break',
        confidence: fatigue,
        data: {
          reason: 'high_fatigue',
          recommendedDuration: Math.min(300, fatigue * 600) // 0-10 minutes
        }
      };
    }
    
    return null;
  }

  /**
   * Filter and prioritize recommendations
   */
  filterRecommendations(recommendations) {
    // Filter by confidence threshold
    const filtered = recommendations.filter(rec => 
      rec.confidence >= this.analysisConfig.confidenceThreshold
    );
    
    // Limit recommendations per session
    if (this.currentSessionRecommendations >= this.analysisConfig.maxRecommendationsPerSession) {
      return [];
    }
    
    // Sort by confidence (highest first)
    filtered.sort((a, b) => b.confidence - a.confidence);
    
    // Take only top recommendations
    const selected = filtered.slice(0, Math.min(2, this.analysisConfig.maxRecommendationsPerSession - this.currentSessionRecommendations));
    
    this.currentSessionRecommendations += selected.length;
    
    return selected;
  }

  /**
   * Get input method recommendation
   */
  getInputRecommendation(inputHistory, context) {
    const recommendations = this.analyze(inputHistory, {}, context);
    const switchRec = recommendations.find(rec => rec.type === 'switch_input');
    
    if (switchRec) {
      return {
        method: switchRec.data.to,
        confidence: switchRec.confidence,
        reason: switchRec.data.reason
      };
    }
    
    return null;
  }

  /**
   * Get current primary input method from recent events
   */
  getCurrentPrimaryMethod(events) {
    const methodCounts = {};
    
    events.slice(-10).forEach(event => {
      methodCounts[event.method] = (methodCounts[event.method] || 0) + 1;
    });
    
    return Object.keys(methodCounts).reduce((a, b) => 
      methodCounts[a] > methodCounts[b] ? a : b
    );
  }

  /**
   * Get context key for grouping preferences
   */
  getContextKey(context) {
    return `${context.currentScene || 'unknown'}_${Math.floor((context.timeOfDay || 12) / 4)}`;
  }

  /**
   * Reset session recommendations counter
   */
  resetSessionRecommendations() {
    this.currentSessionRecommendations = 0;
  }

  /**
   * Get user profile summary
   */
  getUserProfile() {
    return {
      ...this.userProfile,
      summary: {
        totalSessions: this.userProfile.sessionData.length,
        preferredMethods: this.getPreferredMethods(),
        averagePerformance: this.getAveragePerformance(),
        adaptationCount: this.userProfile.adaptationHistory.length
      }
    };
  }

  /**
   * Get preferred input methods
   */
  getPreferredMethods() {
    const methodTotals = {};
    
    Object.values(this.userProfile.inputPreferences).forEach(contextPrefs => {
      Object.entries(contextPrefs).forEach(([method, count]) => {
        methodTotals[method] = (methodTotals[method] || 0) + count;
      });
    });
    
    return Object.entries(methodTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([method]) => method);
  }

  /**
   * Get average performance across all methods
   */
  getAveragePerformance() {
    const metrics = Object.values(this.userProfile.performanceMetrics);
    
    if (metrics.length === 0) return null;
    
    return {
      accuracy: metrics.reduce((sum, m) => sum + m.averageAccuracy, 0) / metrics.length,
      responseTime: metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length,
      successRate: metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
    };
  }
}