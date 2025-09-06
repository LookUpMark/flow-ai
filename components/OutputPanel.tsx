
import React, { useState } from 'react';
import type { Stage, StageOutputs } from '../types';
import { StageDisplay } from './StageDisplay';
import { BrainIcon, FilterIcon, WandIcon, ValidatorIcon, ObsidianIcon } from './Icons';


interface OutputPanelProps {
    outputs: StageOutputs;
    loadingStage: Stage | null;
}

const STAGES: { id: Stage; title: string; icon: JSX.Element }[] = [
    { id: 'synthesizer', title: 'Synthesize', icon: <BrainIcon /> },
    { id: 'condenser', title: 'Condense', icon: <FilterIcon /> },
    { id: 'enhancer', title: 'Enhance', icon: <WandIcon /> },
    { id: 'mermaidValidator', title: 'Validate', icon: <ValidatorIcon /> },
    { id: 'finalizer', title: 'Finalize', icon: <ObsidianIcon /> },
];

export const OutputPanel: React.FC<OutputPanelProps> = ({ outputs, loadingStage }) => {
    const [activeTab, setActiveTab] = useState<Stage>('synthesizer');
    
    const isPipelineRunning = loadingStage !== null;
    const isPipelineFinished = loadingStage === null && !!outputs.finalizer;

    const getTabClassName = (stage: Stage) => {
        const base = "flex-1 text-center px-4 py-3 font-medium rounded-t-lg transition-all duration-300 flex items-center justify-center gap-2";
        const isActive = activeTab === stage;
        const isDisabled = !outputs[stage] && loadingStage !== stage;

        if (isActive) {
            return `${base} bg-brand-surface text-brand-accent border-b-2 border-brand-accent`;
        }
        if (isDisabled) {
            return `${base} text-brand-muted cursor-not-allowed`;
        }
        return `${base} text-brand-text-muted hover:bg-brand-muted/20 hover:text-brand-text`;
    };

    return (
        <div className="bg-brand-surface rounded-lg p-6 flex flex-col shadow-lg border border-brand-muted/30">
            <h2 className="text-2xl font-semibold text-brand-text-muted mb-4">2. View Output</h2>
            <div className="flex border-b border-brand-muted/50 mb-4">
                {STAGES.map(({ id, title, icon }) => (
                     <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={getTabClassName(id)}
                        disabled={!outputs[id] && loadingStage !== id}
                     >
                        {icon}
                        {title}
                    </button>
                ))}
            </div>

            <div className="flex-grow bg-brand-bg rounded-md p-4 min-h-[30rem] relative">
                 {!isPipelineRunning && !isPipelineFinished ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-brand-muted">
                        <div className="w-16 h-16 mb-4">{STAGES.find(s => s.id === 'synthesizer')?.icon}</div>
                        <h3 className="text-lg font-semibold">Your generated note will appear here.</h3>
                        <p>Fill in the input fields and click "Generate" to start the process.</p>
                    </div>
                 ) : (
                    STAGES.map(({ id, title }) => (
                         <div key={id} className={activeTab === id ? 'block' : 'hidden'}>
                            <StageDisplay
                                title={`${title} Stage Output`}
                                content={outputs[id]}
                                isLoading={loadingStage === id}
                                isFinal={id === 'finalizer' && isPipelineFinished}
                            />
                        </div>
                    ))
                 )}
            </div>
        </div>
    );
};
