import React, { useState, useEffect, useMemo } from 'react';
import type { Stage, StageOutputs } from '../types';
import { StageDisplay } from './StageDisplay';
import { PreviewDisplay } from './PreviewDisplay';
import { BrainIcon, FilterIcon, WandIcon, ValidatorIcon, ObsidianIcon, EyeIcon, CheckCircleIcon } from './Icons';


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
    { id: 'preview', title: 'Preview', icon: <EyeIcon /> },
];

const PIPELINE_STAGES: Exclude<Stage, 'preview'>[] = ['synthesizer', 'condenser', 'enhancer', 'mermaidValidator', 'finalizer'];

export const OutputPanel: React.FC<OutputPanelProps> = ({ outputs, loadingStage, topic }) => {
    const [activeTab, setActiveTab] = useState<Stage>('synthesizer');
    
    const isPipelineRunning = loadingStage !== null;
    const isPipelineFinished = loadingStage === null && !!outputs.finalizer;
    const hasPipelineStarted = isPipelineRunning || isPipelineFinished;

    // Effect to automatically switch tabs based on pipeline progress
    useEffect(() => {
        if (loadingStage) {
            setActiveTab(loadingStage);
        } else if (isPipelineFinished && outputs.preview) {
            setActiveTab('preview');
        }
    }, [loadingStage, isPipelineFinished, outputs.preview]);


    const stageStatus = useMemo(() => {
        const status: Record<Stage, 'completed' | 'running' | 'pending'> = {} as any;
        STAGES.forEach(({ id }) => {
            if (loadingStage === id) {
                status[id] = 'running';
            } else if (outputs[id]) {
                status[id] = 'completed';
            } else {
                status[id] = 'pending';
            }
        });
        return status;
    }, [outputs, loadingStage]);

    const completedPipelineStagesCount = PIPELINE_STAGES.filter(id => !!outputs[id]).length;
    const progress = (completedPipelineStagesCount / PIPELINE_STAGES.length) * 100;

    const getTabClassName = (stage: Stage) => {
        const base = "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 gap-2";
        
        const status = stageStatus[stage];

        if (activeTab === stage) {
            return `${base} bg-background text-foreground shadow-[0_2px_8px_hsl(var(--primary)/20%)]`;
        }
        if (status === 'completed') {
            return `${base} text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground`;
        }
        if (status === 'pending') {
             return `${base} pointer-events-none opacity-50`;
        }
        return `${base} hover:bg-accent/50 hover:text-accent-foreground`;
    };

    return (
        <div className="bg-card text-card-foreground border rounded-lg p-6 flex flex-col shadow-lg shadow-black/20">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. View Output</h2>

            {hasPipelineStarted && (
                 <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-primary/90">Pipeline Progress</span>
                        <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}% Complete</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4 gap-1">
                {STAGES.map(({ id, title, icon }) => {
                    const status = stageStatus[id];
                    const isCompleted = status === 'completed';
                    // Use a green checkmark for completed stages, otherwise the default icon
                    const IconComponent = isCompleted ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : icon;

                    return (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={getTabClassName(id)}
                            disabled={status === 'pending'}
                        >
                            {IconComponent}
                            {title}
                        </button>
                    );
                })}
            </div>

            <div className="flex-grow bg-background/50 rounded-md p-4 min-h-[30rem] relative border border-input overflow-hidden">
                <div className={`absolute inset-0 transition-opacity duration-300 ease-in-out flex flex-col items-center justify-center h-full text-center text-muted-foreground ${!hasPipelineStarted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="w-16 h-16 mb-4 opacity-50">{STAGES[0].icon}</div>
                    <h3 className="text-lg font-semibold">Your generated note will appear here.</h3>
                    <p>Fill in the input fields and click "Generate" to start the process.</p>
                </div>
                 
                {STAGES.map(({ id, title }) => (
                     <div key={id} className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${activeTab === id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="h-full w-full">
                           {id === 'preview' ? (
                                <PreviewDisplay
                                    htmlContent={outputs.preview}
                                    topic={topic}
                                />
                            ) : (
                                <StageDisplay
                                    title={`${title} Stage Output`}
                                    content={outputs[id as Exclude<Stage, 'preview'>]}
                                    isLoading={loadingStage === id}
                                    isFinalizer={id === 'finalizer'}
                                    hasPipelineStarted={hasPipelineStarted}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};