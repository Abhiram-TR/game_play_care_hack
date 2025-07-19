/**
 * Centralized error handling utility
 * Manages error logging, reporting, and user notifications
 */

export class ErrorHandler {
  static errorLog = [];
  static maxLogSize = 100;
  static isInitialized = false;

  /**
   * Initialize error handler
   */
  static init() {
    if (this.isInitialized) return;
    
    // Set up global error listeners
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'Global Error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled Promise Rejection');
      event.preventDefault();
    });

    this.isInitialized = true;
    console.log('✅ ErrorHandler initialized');
  }

  /**
   * Handle an error with logging and user notification
   */
  static handleError(error, context = 'Unknown', metadata = {}) {
    const errorInfo = this.createErrorInfo(error, context, metadata);
    
    // Log error
    this.logError(errorInfo);
    
    // Determine severity
    const severity = this.determineSeverity(error, context);
    
    // Handle based on severity
    switch (severity) {
      case 'critical':
        this.handleCriticalError(errorInfo);
        break;
      case 'warning':
        this.handleWarning(errorInfo);
        break;
      case 'info':
        this.handleInfo(errorInfo);
        break;
    }
    
    // Report to analytics if enabled
    if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      this.reportError(errorInfo);
    }
  }

  /**
   * Create structured error information
   */
  static createErrorInfo(error, context, metadata) {
    return {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      context,
      message: error?.message || String(error),
      stack: error?.stack,
      name: error?.name,
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata,
      severity: this.determineSeverity(error, context)
    };
  }

  /**
   * Determine error severity
   */
  static determineSeverity(error, context) {
    const criticalContexts = ['GameEngine', 'System Initialization', 'Canvas Setup'];
    const warningContexts = ['Input System', 'Audio', 'Network'];
    
    if (criticalContexts.some(ctx => context.includes(ctx))) {
      return 'critical';
    }
    
    if (warningContexts.some(ctx => context.includes(ctx))) {
      return 'warning';
    }
    
    if (error?.name === 'TypeError' || error?.name === 'ReferenceError') {
      return 'critical';
    }
    
    return 'info';
  }

  /**
   * Log error to console and internal log
   */
  static logError(errorInfo) {
    // Add to internal log
    this.errorLog.push(errorInfo);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
    
    // Console logging based on severity
    const logMessage = `[${errorInfo.severity.toUpperCase()}] ${errorInfo.context}: ${errorInfo.message}`;
    
    switch (errorInfo.severity) {
      case 'critical':
        console.error(logMessage, errorInfo);
        break;
      case 'warning':
        console.warn(logMessage, errorInfo);
        break;
      case 'info':
        console.info(logMessage, errorInfo);
        break;
    }
  }

  /**
   * Handle critical errors
   */
  static handleCriticalError(errorInfo) {
    // Show error to user
    this.showUserError(
      'A critical error occurred',
      'The game encountered a serious problem. Please refresh the page to continue.',
      'error'
    );
    
    // Stop game if possible
    if (window.gameEngine) {
      window.gameEngine.stop();
    }
  }

  /**
   * Handle warning-level errors
   */
  static handleWarning(errorInfo) {
    // Log for debugging but don't interrupt user
    console.warn('Non-critical error occurred:', errorInfo.message);
    
    // Could show subtle notification to user
    this.showUserError(
      'Warning',
      'A minor issue was detected but the game should continue normally.',
      'warning',
      3000 // Auto-dismiss after 3 seconds
    );
  }

  /**
   * Handle info-level errors
   */
  static handleInfo(errorInfo) {
    // Just log, no user notification needed
    console.info('Minor issue detected:', errorInfo.message);
  }

  /**
   * Show error message to user
   */
  static showUserError(title, message, type = 'error', autoDismiss = null) {
    // Try to use accessibility manager if available
    if (window.gameEngine?.accessibilityManager) {
      window.gameEngine.accessibilityManager.announce(`${title}: ${message}`, 'assertive');
    }
    
    // Create or update error notification
    this.showErrorNotification(title, message, type, autoDismiss);
  }

  /**
   * Show error notification in UI
   */
  static showErrorNotification(title, message, type, autoDismiss) {
    // Remove existing notifications
    const existing = document.querySelector('.error-notification');
    if (existing) {
      existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `error-notification error-notification--${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    notification.innerHTML = `
      <div class="error-notification__content">
        <h3 class="error-notification__title">${title}</h3>
        <p class="error-notification__message">${message}</p>
        <button class="error-notification__close" aria-label="Close notification">×</button>
      </div>
    `;
    
    // Add styles
    this.addNotificationStyles(notification, type);
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Set up close button
    const closeBtn = notification.querySelector('.error-notification__close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-dismiss if specified
    if (autoDismiss) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, autoDismiss);
    }
  }

  /**
   * Add notification styles
   */
  static addNotificationStyles(element, type) {
    const colors = {
      error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
      warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
      info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
    };
    
    const color = colors[type] || colors.error;
    
    Object.assign(element.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      maxWidth: '400px',
      padding: '16px',
      backgroundColor: color.bg,
      border: `1px solid ${color.border}`,
      borderRadius: '4px',
      color: color.text,
      fontSize: '14px',
      zIndex: '10000',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    });
    
    const content = element.querySelector('.error-notification__content');
    Object.assign(content.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    });
    
    const title = element.querySelector('.error-notification__title');
    Object.assign(title.style, {
      margin: '0',
      fontSize: '16px',
      fontWeight: 'bold'
    });
    
    const message = element.querySelector('.error-notification__message');
    Object.assign(message.style, {
      margin: '0',
      lineHeight: '1.4'
    });
    
    const closeBtn = element.querySelector('.error-notification__close');
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '8px',
      right: '8px',
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '4px',
      lineHeight: '1'
    });
  }

  /**
   * Report error to analytics service
   */
  static reportError(errorInfo) {
    // Placeholder for analytics reporting
    // In a real implementation, this would send to your analytics service
    console.log('📊 Error reported to analytics:', errorInfo.id);
  }

  /**
   * Generate unique error ID
   */
  static generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error log
   */
  static getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  static clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      critical: 0,
      warning: 0,
      info: 0,
      byContext: {}
    };
    
    this.errorLog.forEach(error => {
      stats[error.severity]++;
      stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;
    });
    
    return stats;
  }
}

// Initialize on import
ErrorHandler.init();