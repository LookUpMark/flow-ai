import type { 
    EnhancedError, 
    ErrorCategory, 
    ErrorSeverity, 
    ErrorContext, 
    ErrorLogEntry, 
    ErrorNotification, 
    NotificationType 
} from '../types';

// Error code mappings for unique identification
const ERROR_CODES = {
    // API Errors (API_xxx)
    API_KEY_MISSING: 'API_001',
    API_KEY_INVALID: 'API_002',
    API_RATE_LIMIT: 'API_003',
    API_QUOTA_EXCEEDED: 'API_004',
    API_SERVICE_UNAVAILABLE: 'API_005',
    API_TIMEOUT: 'API_006',
    API_RESPONSE_INVALID: 'API_007',
    
    // Network Errors (NET_xxx)
    NETWORK_CONNECTION_FAILED: 'NET_001',
    NETWORK_TIMEOUT: 'NET_002',
    NETWORK_DNS_ERROR: 'NET_003',
    
    // File Processing Errors (FILE_xxx)
    FILE_TOO_LARGE: 'FILE_001',
    FILE_INVALID_FORMAT: 'FILE_002',
    FILE_CORRUPTED: 'FILE_003',
    FILE_READ_ERROR: 'FILE_004',
    FILE_UPLOAD_FAILED: 'FILE_005',
    
    // Validation Errors (VAL_xxx)
    VALIDATION_INPUT_EMPTY: 'VAL_001',
    VALIDATION_INPUT_TOO_LONG: 'VAL_002',
    VALIDATION_INVALID_FORMAT: 'VAL_003',
    VALIDATION_REQUIRED_FIELD: 'VAL_004',
    
    // Configuration Errors (CFG_xxx)
    CONFIG_MISSING_SETTING: 'CFG_001',
    CONFIG_INVALID_VALUE: 'CFG_002',
    CONFIG_SAVE_FAILED: 'CFG_003',
    
    // Processing Errors (PROC_xxx)
    PROCESSING_PIPELINE_FAILED: 'PROC_001',
    PROCESSING_STAGE_FAILED: 'PROC_002',
    PROCESSING_TIMEOUT: 'PROC_003',
    PROCESSING_MEMORY_ERROR: 'PROC_004',
    
    // UI Errors (UI_xxx)
    UI_COMPONENT_ERROR: 'UI_001',
    UI_RENDER_ERROR: 'UI_002',
    UI_STATE_ERROR: 'UI_003',
    
    // System Errors (SYS_xxx)
    SYSTEM_UNKNOWN: 'SYS_001',
    SYSTEM_MEMORY_LOW: 'SYS_002',
    SYSTEM_STORAGE_FULL: 'SYS_003'
} as const;

type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Error severity mapping based on error codes
const ERROR_SEVERITY_MAP: Record<string, ErrorSeverity> = {
    // Critical errors
    'API_001': 'critical', // Missing API key
    'API_002': 'critical', // Invalid API key
    'SYS_002': 'critical', // Memory low
    'SYS_003': 'critical', // Storage full
    
    // High severity
    'API_005': 'high', // Service unavailable
    'PROC_001': 'high', // Pipeline failed
    'FILE_003': 'high', // File corrupted
    'CFG_001': 'high', // Missing config
    
    // Medium severity
    'API_003': 'medium', // Rate limit
    'NET_001': 'medium', // Connection failed
    'FILE_001': 'medium', // File too large
    'VAL_002': 'medium', // Input too long
    
    // Low severity (default)
};

// User action suggestions for common errors
const USER_ACTION_MAP: Record<string, string> = {
    'API_001': 'Configure your API key in settings',
    'API_002': 'Verify that your API key is correct in settings',
    'API_003': 'Wait a few minutes before trying again',
    'API_005': 'The AI service is temporarily overloaded. Try again in a few minutes',
    'NET_001': 'Check your internet connection',
    'FILE_001': 'Try with a smaller file',
    'FILE_002': 'Make sure the file is in a supported format (PDF, DOCX, TXT)',
    'VAL_001': 'Enter some text or upload a file',
    'CFG_001': 'Complete the configuration in settings'
};

class ErrorManager {
    private static instance: ErrorManager;
    private errorLog: ErrorLogEntry[] = [];
    private sessionId: string;
    private errorListeners: Array<(error: EnhancedError) => void> = [];
    private notificationListeners: Array<(notification: ErrorNotification) => void> = [];
    
    private constructor() {
        this.sessionId = this.generateSessionId();
        this.setupGlobalErrorHandlers();
    }
    
    public static getInstance(): ErrorManager {
        if (!ErrorManager.instance) {
            ErrorManager.instance = new ErrorManager();
        }
        return ErrorManager.instance;
    }
    
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    private generateErrorId(): string {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    private setupGlobalErrorHandlers(): void {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                originalError: event.reason,
                context: 'system',
                category: 'system',
                message: 'Unhandled error detected'
            });
        });
        
        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                originalError: event.error,
                context: 'system',
                category: 'system',
                message: 'Global JavaScript error'
            });
        });
    }
    
    public handleError(errorInput: {
        originalError?: any;
        context: ErrorContext;
        category: ErrorCategory;
        message: string;
        code?: ErrorCode;
        metadata?: Record<string, any>;
        userId?: string;
    }): EnhancedError {
        const errorCode = errorInput.code || this.inferErrorCode(errorInput);
        const severity = ERROR_SEVERITY_MAP[errorCode] || 'low';
        const userAction = USER_ACTION_MAP[errorCode];
        
        const enhancedError: EnhancedError = {
            id: this.generateErrorId(),
            code: errorCode,
            category: errorInput.category,
            severity,
            context: errorInput.context,
            message: errorInput.message,
            details: this.extractErrorDetails(errorInput.originalError),
            timestamp: Date.now(),
            userId: errorInput.userId,
            sessionId: this.sessionId,
            stackTrace: this.extractStackTrace(errorInput.originalError),
            metadata: errorInput.metadata,
            retryable: this.isRetryable(errorCode),
            userAction
        };
        
        // Log the error
        this.logError(enhancedError);
        
        // Notify listeners
        this.notifyErrorListeners(enhancedError);
        
        // Create notification for critical/high severity errors
        if (severity === 'critical' || severity === 'high') {
            this.createNotification(enhancedError);
        }
        
        return enhancedError;
    }
    
    private inferErrorCode(errorInput: any): ErrorCode {
        const message = errorInput.originalError?.message || errorInput.message || '';
        const lowerMessage = message.toLowerCase();
        
        // API errors
        if (lowerMessage.includes('api key not configured') || lowerMessage.includes('api key is not configured')) {
            return ERROR_CODES.API_KEY_MISSING;
        }
        if (lowerMessage.includes('api key not valid') || lowerMessage.includes('invalid api key')) {
            return ERROR_CODES.API_KEY_INVALID;
        }
        if (lowerMessage.includes('rate limit') || lowerMessage.includes('429') || lowerMessage.includes('resource_exhausted')) {
            return ERROR_CODES.API_RATE_LIMIT;
        }
        if (lowerMessage.includes('quota exceeded')) {
            return ERROR_CODES.API_QUOTA_EXCEEDED;
        }
        if (lowerMessage.includes('service unavailable') || 
            lowerMessage.includes('503') || 
            lowerMessage.includes('unavailable') ||
            lowerMessage.includes('overloaded') ||
            lowerMessage.includes('temporarily unavailable')) {
            return ERROR_CODES.API_SERVICE_UNAVAILABLE;
        }
        
        // Network errors
        if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('network error')) {
            return ERROR_CODES.NETWORK_CONNECTION_FAILED;
        }
        if (lowerMessage.includes('timeout')) {
            return ERROR_CODES.NETWORK_TIMEOUT;
        }
        
        // File errors
        if (lowerMessage.includes('file too large') || lowerMessage.includes('exceeds')) {
            return ERROR_CODES.FILE_TOO_LARGE;
        }
        if (lowerMessage.includes('invalid format') || lowerMessage.includes('unsupported format')) {
            return ERROR_CODES.FILE_INVALID_FORMAT;
        }
        if (lowerMessage.includes('corrupt') || lowerMessage.includes('damaged')) {
            return ERROR_CODES.FILE_CORRUPTED;
        }
        
        // Processing errors
        if (errorInput.context && errorInput.context !== 'setup' && errorInput.context !== 'title_generation') {
            return ERROR_CODES.PROCESSING_STAGE_FAILED;
        }
        
        return ERROR_CODES.SYSTEM_UNKNOWN;
    }
    
    private extractErrorDetails(error: any): string | undefined {
        if (!error) return undefined;
        
        if (error instanceof Error) {
            return error.message;
        }
        
        if (typeof error === 'string') {
            return error;
        }
        
        if (error.message) {
            return error.message;
        }
        
        return JSON.stringify(error);
    }
    
    private extractStackTrace(error: any): string | undefined {
        if (error instanceof Error && error.stack) {
            return error.stack;
        }
        return undefined;
    }
    
    private isRetryable(code: ErrorCode): boolean {
        const retryableCodes: ErrorCode[] = [
            ERROR_CODES.API_RATE_LIMIT,
            ERROR_CODES.API_TIMEOUT,
            ERROR_CODES.API_SERVICE_UNAVAILABLE,
            ERROR_CODES.NETWORK_CONNECTION_FAILED,
            ERROR_CODES.NETWORK_TIMEOUT,
            ERROR_CODES.PROCESSING_TIMEOUT
        ];
        return retryableCodes.includes(code);
    }
    
    private logError(error: EnhancedError): void {
        const logEntry: ErrorLogEntry = {
            error,
            environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
            userAgent: navigator.userAgent,
            url: window.location.href,
            additionalContext: {
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                timestamp: new Date().toISOString()
            }
        };
        
        this.errorLog.push(logEntry);
        
        // Console logging with structured format
        const logLevel = this.getLogLevel(error.severity);
        console[logLevel](
            `[${error.code}] ${error.category.toUpperCase()} ERROR:`,
            {
                message: error.message,
                context: error.context,
                severity: error.severity,
                details: error.details,
                metadata: error.metadata,
                timestamp: new Date(error.timestamp).toISOString(),
                sessionId: error.sessionId,
                retryable: error.retryable
            }
        );
        
        // Send to external logging service in production
        if (process.env.NODE_ENV === 'production') {
            this.sendToExternalLogger(logEntry);
        }
    }
    
    private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
        switch (severity) {
            case 'critical':
            case 'high':
                return 'error';
            case 'medium':
                return 'warn';
            case 'low':
            default:
                return 'info';
        }
    }
    
    private sendToExternalLogger(logEntry: ErrorLogEntry): void {
        // Placeholder for external logging service integration
        // This could be Sentry, LogRocket, or custom analytics
        try {
            // Example: Send to analytics endpoint
            fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            }).catch(() => {
                // Silently fail to avoid recursive errors
            });
        } catch {
            // Silently fail to avoid recursive errors
        }
    }
    
    private createNotification(error: EnhancedError): void {
        const notification: ErrorNotification = {
            id: `notification_${error.id}`,
            type: error.severity === 'critical' ? 'modal' : 'toast',
            title: this.getNotificationTitle(error),
            message: error.userAction || error.message,
            severity: error.severity,
            timestamp: Date.now(),
            dismissed: false,
            actions: this.getNotificationActions(error)
        };
        
        this.notifyNotificationListeners(notification);
    }
    
    private getNotificationTitle(error: EnhancedError): string {
        switch (error.severity) {
            case 'critical':
                return 'Critical Error';
            case 'high':
                return 'Important Error';
            case 'medium':
                return 'Warning';
            case 'low':
            default:
                return 'Information';
        }
    }
    
    private getNotificationActions(error: EnhancedError): Array<{ label: string; action: () => void }> {
        const actions: Array<{ label: string; action: () => void }> = [];
        
        if (error.retryable) {
            actions.push({
                label: 'Retry',
                action: () => {
                    // Emit retry event
                    window.dispatchEvent(new CustomEvent('error-retry', { detail: error }));
                }
            });
        }
        
        if (error.code === ERROR_CODES.API_KEY_MISSING || error.code === ERROR_CODES.API_KEY_INVALID) {
            actions.push({
                label: 'Open Settings',
                action: () => {
                    window.dispatchEvent(new CustomEvent('open-settings'));
                }
            });
        }
        
        return actions;
    }
    
    // Public API methods
    public onError(listener: (error: EnhancedError) => void): () => void {
        this.errorListeners.push(listener);
        return () => {
            const index = this.errorListeners.indexOf(listener);
            if (index > -1) {
                this.errorListeners.splice(index, 1);
            }
        };
    }
    
    public onNotification(listener: (notification: ErrorNotification) => void): () => void {
        this.notificationListeners.push(listener);
        return () => {
            const index = this.notificationListeners.indexOf(listener);
            if (index > -1) {
                this.notificationListeners.splice(index, 1);
            }
        };
    }
    
    private notifyErrorListeners(error: EnhancedError): void {
        this.errorListeners.forEach(listener => {
            try {
                listener(error);
            } catch (e) {
                console.error('Error in error listener:', e);
            }
        });
    }
    
    private notifyNotificationListeners(notification: ErrorNotification): void {
        this.notificationListeners.forEach(listener => {
            try {
                listener(notification);
            } catch (e) {
                console.error('Error in notification listener:', e);
            }
        });
    }
    
    public getErrorLog(): ErrorLogEntry[] {
        return [...this.errorLog];
    }
    
    public getErrorStats(): {
        total: number;
        bySeverity: Record<ErrorSeverity, number>;
        byCategory: Record<ErrorCategory, number>;
        byCode: Record<string, number>;
    } {
        const stats = {
            total: this.errorLog.length,
            bySeverity: { low: 0, medium: 0, high: 0, critical: 0 } as Record<ErrorSeverity, number>,
            byCategory: { api: 0, validation: 0, network: 0, file: 0, configuration: 0, processing: 0, ui: 0, system: 0 } as Record<ErrorCategory, number>,
            byCode: {} as Record<string, number>
        };
        
        this.errorLog.forEach(entry => {
            const error = entry.error;
            stats.bySeverity[error.severity]++;
            stats.byCategory[error.category]++;
            stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
        });
        
        return stats;
    }
    
    public clearErrorLog(): void {
        this.errorLog = [];
    }
}

// Export singleton instance
export const errorManager = ErrorManager.getInstance();

// Export error codes for use in other modules
export { ERROR_CODES };
export type { ErrorCode };

// Utility functions for common error scenarios
export const createApiError = (message: string, originalError?: any, metadata?: Record<string, any>) => {
    return errorManager.handleError({
        originalError,
        context: 'setup',
        category: 'api',
        message,
        metadata
    });
};

export const createValidationError = (message: string, context: ErrorContext = 'validation', metadata?: Record<string, any>) => {
    return errorManager.handleError({
        context,
        category: 'validation',
        message,
        metadata
    });
};

export const createFileError = (message: string, originalError?: any, metadata?: Record<string, any>) => {
    return errorManager.handleError({
        originalError,
        context: 'file_processing',
        category: 'file',
        message,
        metadata
    });
};

export const createProcessingError = (message: string, stage: ErrorContext, originalError?: any, metadata?: Record<string, any>) => {
    return errorManager.handleError({
        originalError,
        context: stage,
        category: 'processing',
        message,
        metadata
    });
};