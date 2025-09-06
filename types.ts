
export type Stage = 'synthesizer' | 'condenser' | 'enhancer' | 'mermaidValidator' | 'finalizer' | 'preview';

export interface StageOutputs {
    synthesizer: string;
    condenser: string;
    enhancer: string;
    mermaidValidator: string;
    finalizer: string;
    preview: string;
}

// FIX: Add ExportFormat and Template types for the export modal component.
export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'latex';

export type Template = 'default';
