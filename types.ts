import type { Packer } from 'docx';

export type Stage = 'synthesizer' | 'condenser' | 'enhancer' | 'mermaidValidator' | 'diagramGenerator' | 'finalizer' | 'htmlTranslator';

// Provides context for where an error occurred in the application.
export type ErrorContext = Stage | 'title_generation' | 'setup';

// A structured object for handling application-wide errors.
export interface AppError {
    context: ErrorContext;
    message: string;
    details?: string; // For technical details, stack trace, etc.
}

export interface StageOutputs {
    synthesizer: string;
    condenser: string;
    enhancer: string;
    mermaidValidator: string;
    diagramGenerator: string;
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
export type ApiProvider = 'gemini' | 'openrouter' | 'ollama';

// Defines the configuration structure for each API provider.
export interface ProviderSettings {
    gemini: {}; // No specific config needed, API key is from env
    openrouter: {
        apiKey: string;
        model: string;
    };
    ollama: {
        baseUrl: string;
        model: string;
    };
}

// Defines the top-level application settings structure.
export interface AppSettings {
    provider: ApiProvider;
    config: ProviderSettings;
    reasoningModeEnabled: boolean;
}