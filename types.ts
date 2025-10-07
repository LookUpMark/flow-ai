import type { Packer } from 'docx';

export type Stage = 'synthesizer' | 'condenser' | 'enhancer' | 'mermaidValidator' | 'finalizer' | 'htmlTranslator';

// Provides context for where an error occurred in the application.
export type ErrorContext = Stage | 'title_generation' | 'setup' | 'file_processing' | 'export' | 'settings' | 'network' | 'validation' | 'system';

// Error severity levels for classification
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories for better organization
export type ErrorCategory = 'api' | 'validation' | 'network' | 'file' | 'configuration' | 'processing' | 'ui' | 'system';

// Enhanced error interface with unique codes and structured information
export interface EnhancedError {
    id: string; // Unique error identifier
    code: string; // Unique error code (e.g., 'API_001', 'VAL_002')
    category: ErrorCategory;
    severity: ErrorSeverity;
    context: ErrorContext;
    message: string;
    details?: string;
    timestamp: number;
    userId?: string;
    sessionId?: string;
    stackTrace?: string;
    metadata?: Record<string, any>;
    retryable: boolean;
    userAction?: string; // Suggested action for the user
}

// Legacy error interface for backward compatibility
export interface AppError {
    context: ErrorContext;
    message: string;
    details?: string; // For technical details, stack trace, etc.
}

// Error log entry for structured logging
export interface ErrorLogEntry {
    error: EnhancedError;
    environment: 'development' | 'production';
    userAgent?: string;
    url?: string;
    additionalContext?: Record<string, any>;
}

// Notification types for real-time error alerts
export type NotificationType = 'toast' | 'modal' | 'banner' | 'silent';

export interface ErrorNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    severity: ErrorSeverity;
    timestamp: number;
    dismissed: boolean;
    actions?: Array<{
        label: string;
        action: () => void;
    }>;
}

// Log levels for different types of information
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Structured log entry interface
export interface LogEntry {
    id: string;
    level: LogLevel;
    message: string;
    timestamp: number;
    category: string;
    context?: string;
    metadata?: Record<string, any>;
    sessionId: string;
    userId?: string;
    performance?: {
        duration?: number;
        memoryUsage?: number;
        networkLatency?: number;
    };
    stackTrace?: string;
}

export interface StageOutputs {
    synthesizer: string;
    condenser: string;
    enhancer: string;
    mermaidValidator: string;
    finalizer: string;
    htmlTranslator: string;
}

export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'latex';

export type Template = 'default';

// Explicitly defines the possible states for a pipeline stage in the UI.
export type StageStatus = 'completed' | 'running' | 'pending' | 'failed' | 'skipped';

// Defines the user's choice between a fast or high-quality model configuration.
export type ModelConfigType = 'flash' | 'pro';

// Defines the available API providers for the AI service.
export type ApiProvider = 'gemini' | 'openrouter' | 'ollama' | 'zai' | 'lmstudio';

// Defines the configuration structure for each API provider.
export interface ProviderSettings {
    gemini: {
        apiKey: string;
    };
    openrouter: {
        apiKey: string;
        models: string[];
        selectedModel: string;
    };
    ollama: {
        baseUrl: string;
        models: string[];
        selectedModel: string;
    };
    zai: {
        apiKey: string;
    };
    lmstudio: {
        baseUrl: string;
        models: string[];
        selectedModel: string;
    };
}

// Defines the top-level application settings structure.
export interface AppSettings {
    provider: ApiProvider;
    config: ProviderSettings;
    reasoningModeEnabled: boolean;
    streamingEnabled: boolean;
}

// Supported output languages for generated text
export type OutputLanguage = 'auto' | 'it' | 'en' | 'es' | 'fr' | 'de' | 'pt';