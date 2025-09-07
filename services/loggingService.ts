import type { EnhancedError, ErrorLogEntry, ErrorSeverity, ErrorCategory, LogLevel, LogEntry } from '../types';
import { errorManager } from './errorService';

// Performance metrics interface
export interface PerformanceMetrics {
    startTime: number;
    endTime?: number;
    duration?: number;
    memoryBefore?: number;
    memoryAfter?: number;
    networkCalls?: number;
    cacheHits?: number;
    cacheMisses?: number;
}

// Analytics event interface
export interface AnalyticsEvent {
    id: string;
    name: string;
    category: string;
    timestamp: number;
    properties?: Record<string, any>;
    userId?: string;
    sessionId: string;
}

class LoggingService {
    private static instance: LoggingService;
    private logs: LogEntry[] = [];
    private sessionId: string;
    private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
    private analyticsEvents: AnalyticsEvent[] = [];
    private logLevel: LogLevel = 'info';
    private maxLogEntries = 1000;
    private logListeners: Array<(entry: LogEntry) => void> = [];
    
    private constructor() {
        this.sessionId = this.generateSessionId();
        this.setupPerformanceMonitoring();
        this.initializeLogLevel();
    }
    
    public static getInstance(): LoggingService {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    }
    
    private generateSessionId(): string {
        return `log_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    private generateLogId(): string {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    private initializeLogLevel(): void {
        // Set log level based on environment
        if (process.env.NODE_ENV === 'development') {
            this.logLevel = 'debug';
        } else if (process.env.NODE_ENV === 'production') {
            this.logLevel = 'warn';
        }
        
        // Allow override via localStorage for debugging
        const storedLevel = localStorage.getItem('flowai-log-level') as LogLevel;
        if (storedLevel && ['debug', 'info', 'warn', 'error', 'critical'].includes(storedLevel)) {
            this.logLevel = storedLevel;
        }
    }
    
    private setupPerformanceMonitoring(): void {
        // Monitor page load performance
        if (typeof window !== 'undefined' && window.performance) {
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                this.logPerformance('page_load', {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    networkLatency: navigation.responseStart - navigation.requestStart
                });
            });
        }
    }
    
    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    
    private createLogEntry(
        level: LogLevel,
        message: string,
        category: string,
        context?: string,
        metadata?: Record<string, any>,
        userId?: string
    ): LogEntry {
        const entry: LogEntry = {
            id: this.generateLogId(),
            level,
            message,
            timestamp: Date.now(),
            category,
            context,
            metadata: {
                ...metadata,
                url: typeof window !== 'undefined' ? window.location.href : undefined,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                viewport: typeof window !== 'undefined' ? {
                    width: window.innerWidth,
                    height: window.innerHeight
                } : undefined
            },
            sessionId: this.sessionId,
            userId,
            performance: this.getCurrentPerformanceMetrics()
        };
        
        // Add stack trace for errors
        if (level === 'error' || level === 'critical') {
            entry.stackTrace = new Error().stack;
        }
        
        return entry;
    }
    
    private getCurrentPerformanceMetrics(): LogEntry['performance'] {
        if (typeof window === 'undefined' || !window.performance) {
            return undefined;
        }
        
        const memory = (performance as any).memory;
        return {
            memoryUsage: memory ? memory.usedJSHeapSize : undefined,
            networkLatency: this.getAverageNetworkLatency()
        };
    }
    
    private getAverageNetworkLatency(): number | undefined {
        if (typeof window === 'undefined' || !window.performance) {
            return undefined;
        }
        
        const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        if (resourceEntries.length === 0) return undefined;
        
        const latencies = resourceEntries
            .filter(entry => entry.responseStart > 0 && entry.requestStart > 0)
            .map(entry => entry.responseStart - entry.requestStart);
            
        return latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : undefined;
    }
    
    private addLogEntry(entry: LogEntry): void {
        this.logs.push(entry);
        
        // Maintain max log entries limit
        if (this.logs.length > this.maxLogEntries) {
            this.logs = this.logs.slice(-this.maxLogEntries);
        }
        
        // Console output with structured format
        this.outputToConsole(entry);
        
        // Notify listeners
        this.notifyLogListeners(entry);
        
        // Send to external services in production
        if (process.env.NODE_ENV === 'production') {
            this.sendToExternalServices(entry);
        }
    }
    
    private outputToConsole(entry: LogEntry): void {
        const timestamp = new Date(entry.timestamp).toISOString();
        const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
        
        const consoleMethod = this.getConsoleMethod(entry.level);
        
        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            console[consoleMethod](`${prefix} ${entry.message}`, {
                context: entry.context,
                metadata: entry.metadata,
                performance: entry.performance,
                sessionId: entry.sessionId
            });
        } else {
            console[consoleMethod](`${prefix} ${entry.message}`);
        }
    }
    
    private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
        switch (level) {
            case 'debug':
            case 'info':
                return 'info';
            case 'warn':
                return 'warn';
            case 'error':
            case 'critical':
                return 'error';
            default:
                return 'log';
        }
    }
    
    private notifyLogListeners(entry: LogEntry): void {
        this.logListeners.forEach(listener => {
            try {
                listener(entry);
            } catch (error) {
                console.error('Error in log listener:', error);
            }
        });
    }
    
    private sendToExternalServices(entry: LogEntry): void {
        // Send to external logging services (e.g., Sentry, LogRocket)
        try {
            // Example: Send to analytics endpoint
            fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            }).catch(() => {
                // Silently fail to avoid recursive logging
            });
        } catch {
            // Silently fail to avoid recursive logging
        }
    }
    
    // Public logging methods
    public debug(message: string, category: string = 'general', context?: string, metadata?: Record<string, any>, userId?: string): void {
        if (this.shouldLog('debug')) {
            const entry = this.createLogEntry('debug', message, category, context, metadata, userId);
            this.addLogEntry(entry);
        }
    }
    
    public info(message: string, category: string = 'general', context?: string, metadata?: Record<string, any>, userId?: string): void {
        if (this.shouldLog('info')) {
            const entry = this.createLogEntry('info', message, category, context, metadata, userId);
            this.addLogEntry(entry);
        }
    }
    
    public warn(message: string, category: string = 'general', context?: string, metadata?: Record<string, any>, userId?: string): void {
        if (this.shouldLog('warn')) {
            const entry = this.createLogEntry('warn', message, category, context, metadata, userId);
            this.addLogEntry(entry);
        }
    }
    
    public error(message: string, category: string = 'general', context?: string, metadata?: Record<string, any>, userId?: string): void {
        if (this.shouldLog('error')) {
            const entry = this.createLogEntry('error', message, category, context, metadata, userId);
            this.addLogEntry(entry);
        }
    }
    
    public critical(message: string, category: string = 'general', context?: string, metadata?: Record<string, any>, userId?: string): void {
        if (this.shouldLog('critical')) {
            const entry = this.createLogEntry('critical', message, category, context, metadata, userId);
            this.addLogEntry(entry);
        }
    }
    
    // Performance tracking methods
    public startPerformanceTracking(operationId: string, metadata?: Record<string, any>): void {
        const metrics: PerformanceMetrics = {
            startTime: performance.now(),
            memoryBefore: this.getMemoryUsage()
        };
        
        this.performanceMetrics.set(operationId, metrics);
        
        this.debug(`Started performance tracking for: ${operationId}`, 'performance', 'tracking', {
            operationId,
            ...metadata
        });
    }
    
    public endPerformanceTracking(operationId: string, metadata?: Record<string, any>): PerformanceMetrics | null {
        const metrics = this.performanceMetrics.get(operationId);
        if (!metrics) {
            this.warn(`No performance tracking found for operation: ${operationId}`, 'performance', 'tracking');
            return null;
        }
        
        metrics.endTime = performance.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.memoryAfter = this.getMemoryUsage();
        
        this.info(`Completed performance tracking for: ${operationId}`, 'performance', 'tracking', {
            operationId,
            duration: metrics.duration,
            memoryDelta: metrics.memoryAfter && metrics.memoryBefore ? 
                metrics.memoryAfter - metrics.memoryBefore : undefined,
            ...metadata
        });
        
        this.performanceMetrics.delete(operationId);
        return metrics;
    }
    
    private getMemoryUsage(): number | undefined {
        if (typeof window !== 'undefined' && (performance as any).memory) {
            return (performance as any).memory.usedJSHeapSize;
        }
        return undefined;
    }
    
    public logPerformance(operationName: string, metrics: Record<string, number>): void {
        this.info(`Performance metrics for: ${operationName}`, 'performance', 'metrics', metrics);
    }
    
    // Analytics tracking
    public trackEvent(name: string, category: string, properties?: Record<string, any>, userId?: string): void {
        const event: AnalyticsEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            category,
            timestamp: Date.now(),
            properties,
            userId,
            sessionId: this.sessionId
        };
        
        this.analyticsEvents.push(event);
        
        this.debug(`Analytics event: ${name}`, 'analytics', category, {
            eventId: event.id,
            properties
        }, userId);
        
        // Send to analytics service
        if (process.env.NODE_ENV === 'production') {
            this.sendAnalyticsEvent(event);
        }
    }
    
    private sendAnalyticsEvent(event: AnalyticsEvent): void {
        try {
            fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            }).catch(() => {
                // Silently fail
            });
        } catch {
            // Silently fail
        }
    }
    
    // Integration with error manager
    public logError(error: EnhancedError): void {
        const level = this.mapErrorSeverityToLogLevel(error.severity);
        
        this.addLogEntry({
            id: `error_log_${error.id}`,
            level,
            message: `[${error.code}] ${error.message}`,
            timestamp: error.timestamp,
            category: error.category,
            context: error.context,
            metadata: {
                errorId: error.id,
                errorCode: error.code,
                severity: error.severity,
                retryable: error.retryable,
                userAction: error.userAction,
                ...error.metadata
            },
            sessionId: error.sessionId || this.sessionId,
            userId: error.userId,
            stackTrace: error.stackTrace
        });
    }
    
    private mapErrorSeverityToLogLevel(severity: ErrorSeverity): LogLevel {
        switch (severity) {
            case 'critical':
                return 'critical';
            case 'high':
                return 'error';
            case 'medium':
                return 'warn';
            case 'low':
            default:
                return 'info';
        }
    }
    
    // Listener management
    public onLog(listener: (entry: LogEntry) => void): () => void {
        this.logListeners.push(listener);
        return () => {
            const index = this.logListeners.indexOf(listener);
            if (index > -1) {
                this.logListeners.splice(index, 1);
            }
        };
    }
    
    // Data access methods
    public getLogs(filter?: {
        level?: LogLevel;
        category?: string;
        context?: string;
        startTime?: number;
        endTime?: number;
    }): LogEntry[] {
        let filteredLogs = [...this.logs];
        
        if (filter) {
            if (filter.level) {
                filteredLogs = filteredLogs.filter(log => log.level === filter.level);
            }
            if (filter.category) {
                filteredLogs = filteredLogs.filter(log => log.category === filter.category);
            }
            if (filter.context) {
                filteredLogs = filteredLogs.filter(log => log.context === filter.context);
            }
            if (filter.startTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!);
            }
            if (filter.endTime) {
                filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!);
            }
        }
        
        return filteredLogs;
    }
    
    public getLogStats(): {
        total: number;
        byLevel: Record<LogLevel, number>;
        byCategory: Record<string, number>;
        recentErrors: number;
    } {
        const stats = {
            total: this.logs.length,
            byLevel: { debug: 0, info: 0, warn: 0, error: 0, critical: 0 } as Record<LogLevel, number>,
            byCategory: {} as Record<string, number>,
            recentErrors: 0
        };
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        this.logs.forEach(log => {
            stats.byLevel[log.level]++;
            stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
            
            if ((log.level === 'error' || log.level === 'critical') && log.timestamp > oneHourAgo) {
                stats.recentErrors++;
            }
        });
        
        return stats;
    }
    
    public getAnalyticsEvents(): AnalyticsEvent[] {
        return [...this.analyticsEvents];
    }
    
    public clearLogs(): void {
        this.logs = [];
        this.analyticsEvents = [];
        this.performanceMetrics.clear();
    }
    
    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
        localStorage.setItem('flowai-log-level', level);
        this.info(`Log level changed to: ${level}`, 'logging', 'configuration');
    }
    
    public getLogLevel(): LogLevel {
        return this.logLevel;
    }
    
    public exportLogs(): string {
        const exportData = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            logs: this.logs,
            analyticsEvents: this.analyticsEvents,
            stats: this.getLogStats()
        };
        
        return JSON.stringify(exportData, null, 2);
    }
}

// Export singleton instance
export const loggingService = LoggingService.getInstance();

// Setup integration with error manager
errorManager.onError((error) => {
    loggingService.logError(error);
});

// Utility functions for common logging scenarios
export const logApiCall = (endpoint: string, method: string, duration: number, status: number, metadata?: Record<string, any>) => {
    loggingService.info(`API call: ${method} ${endpoint}`, 'api', 'request', {
        endpoint,
        method,
        duration,
        status,
        ...metadata
    });
};

export const logUserAction = (action: string, context: string, metadata?: Record<string, any>) => {
    loggingService.info(`User action: ${action}`, 'user', context, metadata);
    loggingService.trackEvent(action, 'user_interaction', metadata);
};

export const logPerformanceMetric = (operation: string, duration: number, metadata?: Record<string, any>) => {
    loggingService.logPerformance(operation, { duration, ...metadata });
};

export const logComponentRender = (componentName: string, renderTime: number, metadata?: Record<string, any>) => {
    loggingService.debug(`Component rendered: ${componentName}`, 'ui', 'render', {
        componentName,
        renderTime,
        ...metadata
    });
};