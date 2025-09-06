
export type Stage = 'synthesizer' | 'condenser' | 'enhancer' | 'mermaidValidator' | 'finalizer';

export interface StageOutputs {
    synthesizer: string;
    condenser: string;
    enhancer: string;
    mermaidValidator: string;
    finalizer: string;
}
