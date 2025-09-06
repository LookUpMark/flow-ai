

import React, { useState, useEffect, useMemo } from 'react';
import type { Stage, StageOutputs, AppError, StageStatus } from '../types';
import { StageDisplay } from './StageDisplay';
import { PreviewDisplay } from './PreviewDisplay';
import { BrainIcon, FilterIcon, WandIcon, ValidatorIcon, ObsidianIcon, EyeIcon, CheckCircleIcon, DiagramIcon, ErrorIcon, SkipIcon } from './Icons';

interface OutputPanelProps {
    outputs: StageOutputs;
    loadingStage: Stage | null;
    topic: string;
    error: AppError | null;
    generateDiagrams: boolean;
    generateHtmlPreview: boolean;
    throughput: number;
}

const ALL_STAGES: { id: Stage; title: string; icon: JSX.Element }[] = [
    { id: 'synthesizer', title: 'Synthesize', icon: <BrainIcon /> },
    { id: 'condenser', title: 'Condense', icon: <FilterIcon /> },
    { id: 'enhancer', title: 'Enhance', icon: <WandIcon /> },
    { id: 'mermaidValidator', title: 'Validate', icon: <ValidatorIcon /> },
    { id: 'finalizer', title: 'Finalize', icon: <ObsidianIcon /> },
    { id: 'diagramGenerator', title: 'Diagrams', icon: <DiagramIcon /> },
    { id: 'htmlTranslator', title: 'Preview', icon: <EyeIcon /> },
];

const PIPELINE_STAGES: Stage[] = ['synthesizer', 'condenser', 'enhancer', 'mermaidValidator', 'finalizer', 'diagramGenerator', 'htmlTranslator'];

export const OutputPanel: React.FC<OutputPanelProps> = ({ outputs, loadingStage, topic, error, generateDiagrams, generateHtmlPreview, throughput }) => {
    const [activeTab, setActiveTab] = useState<Stage>('synthesizer');
    
    const visibleStages = useMemo(() => {
        return ALL_STAGES.filter(stage => {
            if (stage.id === 'diagramGenerator' && !generateDiagrams) return false;
            if (stage.id === 'htmlTranslator' && !generateHtmlPreview) return false;
            return true;
        });
    }, [generateDiagrams, generateHtmlPreview]);

    const isPipelineRunning = loadingStage !== null;
    const hasPipelineStarted = Object.values(outputs).some(val => val) || isPipelineRunning || !!error;
    const isPipelineFinished = !loadingStage && hasPipelineStarted && !error;

    const stageStatus = useMemo(() => {
        const status: Record<Stage, StageStatus> = {} as any;
        PIPELINE_STAGES.forEach((id) => {
            const outputExists = !!outputs[id];
            const isSkipped = outputs[id] === 'Skipped';

            if (error && error.context === id) {
                status[id] = 'failed';
            } else if (loadingStage === id) {
                status[id] = 'running';
            } else if (isSkipped) {
                status[id] = 'skipped';
            } else if (outputExists) {
                status[id] = 'completed';
            } else {
                status[id] = 'pending';
            }
        });
        return status;
    }, [outputs, loadingStage, error]);

    // Effect to automatically switch tabs based on pipeline progress or failure
    useEffect(() => {
        if (error) {
            if (PIPELINE_STAGES.includes(error.context as Stage)) {
                setActiveTab(error.context as Stage);
            }
        } else if (loadingStage) {
            setActiveTab(loadingStage);
        } else if (isPipelineFinished) {
            const visibleStageIds = visibleStages.map(s => s.id);
            const lastCompletedStage = [...PIPELINE_STAGES].reverse().find(stage => 
                stageStatus[stage] === 'completed' && visibleStageIds.includes(stage)
            );
            if (lastCompletedStage) {
                setActiveTab(lastCompletedStage);
            }
        }
    }, [loadingStage, isPipelineFinished, error, stageStatus, visibleStages]);

    const activeStagesCount = useMemo(() => {
        // Base stages that always run
        let count = 5; // synthesizer, condenser, enhancer, mermaidValidator, finalizer
        if (generateDiagrams) count++;
        if (generateHtmlPreview) count++;
        return count;
    }, [generateDiagrams, generateHtmlPreview]);

    const completedPipelineStagesCount = PIPELINE_STAGES.filter(id => stageStatus[id] === 'completed').length;
    const progress = activeStagesCount > 0 ? (completedPipelineStagesCount / activeStagesCount) * 100 : 0;

    const getTabClassName = (stage: Stage) => {
        const base = "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 gap-2";
        const status = stageStatus[stage];

        if (status === 'failed') {
            return `${base} bg-destructive/10 text-destructive shadow-sm`;
        }
        if (activeTab === stage) {
            return `${base} bg-background text-foreground shadow-[0_2px_8px_hsl(var(--primary)/20%)]`;
        }
        if (status === 'completed' || status === 'skipped') {
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
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-primary/90">
                            {error ? 'Pipeline Failed' : loadingStage ? `Running: ${loadingStage}` : 'Pipeline Complete'}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}% Complete</span>
                    </div>
                    <div className="h-5 mb-2 flex items-center justify-center">
                        {throughput > 0 && (
                            <p className="text-center text-sm text-muted-foreground animate-in fade-in-0">
                                ~{throughput.toFixed(0)} tokens/sec
                            </p>
                        )}
                    </div>
                    <div className={`w-full bg-muted rounded-full h-2 ${error ? 'bg-destructive/20' : ''}`}>
                        <div className={`${error ? 'bg-destructive' : 'bg-primary'} h-2 rounded-full transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-4 gap-1">
                {visibleStages.map(({ id, title, icon }) => {
                    const status = stageStatus[id];
                    const IconComponent = 
                        status === 'failed' ? <ErrorIcon className="w-5 h-5 text-destructive" /> :
                        status === 'skipped' ? <SkipIcon className="w-5 h-5 text-muted-foreground" /> :
                        status === 'completed' ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> :
                        icon;

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
                    <div className="w-16 h-16 mb-4 opacity-50">{ALL_STAGES[0].icon}</div>
                    <h3 className="text-lg font-semibold">Your generated note will appear here.</h3>
                    <p>Fill in the input fields and click "Generate" to start the process.</p>
                </div>
                 
                {ALL_STAGES.map(({ id, title }) => (
                     <div key={id} className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${activeTab === id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="h-full w-full">
                           {id === 'htmlTranslator' ? (
                                <PreviewDisplay
                                    htmlContent={outputs.htmlTranslator}
                                    topic={topic}
                                />
                            ) : (
                                <StageDisplay
                                    title={`${title} Stage Output`}
                                    content={outputs[id as Exclude<Stage, 'htmlTranslator'>]}
                                    isLoading={loadingStage === id}
                                    isFinalizer={id === 'finalizer'}
                                    hasPipelineStarted={hasPipelineStarted}
                                    isFailed={error?.context === id}
                                    errorMessage={error?.context === id ? error.message : undefined}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
