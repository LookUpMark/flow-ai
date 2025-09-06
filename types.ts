
export type Stage = 'synthesizer' | 'condenser' | 'enhancer' | 'mermaidValidator' | 'finalizer';

export interface StageOutputs {
    synthesizer: string;
    condenser: string;
    enhancer: string;
    mermaidValidator: string;
    finalizer: string;
}

export type ExportFormat = 'markdown' | 'pdf' | 'docx' | 'latex';
export type Template = 'default' | 'academic' | 'modern';

export interface TemplateStyle {
    font: 'helvetica' | 'times' | 'courier';
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
}