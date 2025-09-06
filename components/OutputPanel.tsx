import React, { useState, useEffect } from 'react';
import type { Stage, StageOutputs } from '../types';
import { StageDisplay } from './StageDisplay';
import { BrainIcon, FilterIcon, WandIcon, ValidatorIcon, ObsidianIcon } from './Icons';


interface OutputPanelProps {
    outputs: StageOutputs;
    loadingStage: Stage | null;
    topic: string;
}

const STAGES: { id: Stage; title: string; icon: JSX.Element }[] = [
    { id: 'synthesizer', title: 'Synthesize', icon: <BrainIcon /> },
    { id: 'condenser', title: 'Condense', icon: <FilterIcon /> },
    { id: 'enhancer', title: 'Enhance', icon: <WandIcon /> },
    { id: 'mermaidValidator', title: 'Validate', icon: <ValidatorIcon /> },
    { id: 'finalizer', title: 'Finalize', icon: <ObsidianIcon /> },
];

export const OutputPanel: React.FC<OutputPanelProps> = ({ outputs, loadingStage, topic }) => {
    const [activeTab, setActiveTab] = useState<Stage>('synthesizer');
    
    const isPipelineRunning = loadingStage !== null;
    const isPipelineFinished = loadingStage === null && !!outputs.finalizer;

    // When the pipeline finishes, switch to the finalizer tab
    useEffect(() => {
        if (isPipelineFinished) {
            setActiveTab('finalizer');
        }
    }, [isPipelineFinished]);

    const getTabClassName = (stage: Stage) => {
        const base = "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 gap-2";
        
        const isActive = activeTab === stage;
        const isDisabled = !outputs[stage] && loadingStage !== stage;

        if (isActive) {
            return `${base} bg-background text-foreground shadow-[0_2px_8px_hsl(var(--primary)/20%)]`;
        }
        if (isDisabled) {
            return `${base} pointer-events-none opacity-50`;
        }
        return `${base} hover:bg-accent/50 hover:text-accent-foreground`;
    };

    return (
        <div className="bg-card text-card-foreground border rounded-lg p-6 flex flex-col shadow-lg shadow-black/20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. View Output</h2>
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4">
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

            <div className="flex-grow bg-background/50 rounded-md p-4 min-h-[30rem] relative border border-input">
                 {!isPipelineRunning && !isPipelineFinished ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <div className="w-16 h-16 mb-4 opacity-50">{STAGES.find(s => s.id === 'synthesizer')?.icon}</div>
                        <h3 className="text-lg font-semibold">Your generated note will appear here.</h3>
                        <p>Fill in the input fields and click "Generate" to start the process.</p>
                    </div>
                 ) : (
                    STAGES.map(({ id, title }) => (
                         <div key={id} className={activeTab === id ? 'block h-full' : 'hidden'}>
                            <StageDisplay
                                title={`${title} Stage Output`}
                                content={outputs[id]}
                                isLoading={loadingStage === id}
                                isFinal={id === 'finalizer' && isPipelineFinished}
                                topic={topic}
                            />
                        </div>
                    ))
                 )}
            </div>
        </div>
    );
};