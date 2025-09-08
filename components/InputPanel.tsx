import React from 'react';
import { SparklesIcon, AlertTriangleIcon } from './Icons';
import type { AppError, ModelConfigType, ApiProvider, AppSettings } from '../types';

interface InputPanelProps {
    topic: string;
    setTopic: (topic: string) => void;
    rawText: string;
    setRawText: (text: string) => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onGenerate: () => void;
    isLoading: boolean;
    error: AppError | null;
    setError: (error: AppError | null) => void;
    onGenerateTitle: () => void;
    isGeneratingTitle: boolean;
    hasContent: boolean;

    generateHtmlPreview: boolean;
    setGenerateHtmlPreview: (value: boolean) => void;
    provider: ApiProvider;
    modelConfig: ModelConfigType;
    setModelConfig: (value: ModelConfigType) => void;
    reasoningModeEnabled: boolean;
    setReasoningModeEnabled: (value: boolean) => void;
    settings: AppSettings;
    saveSettings: (settings: AppSettings) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

const GenerateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        <path d="m13 13-1-4-4 1 1 4 4-1z" />
    </svg>
);

export const InputPanel: React.FC<InputPanelProps> = ({
    topic, setTopic, rawText, setRawText, onFileChange, onGenerate, isLoading, error, setError,
    onGenerateTitle, isGeneratingTitle, hasContent,
    generateHtmlPreview, setGenerateHtmlPreview, provider, modelConfig, setModelConfig,
    reasoningModeEnabled, setReasoningModeEnabled, settings, saveSettings, fileInputRef
}) => {

    const handleClearError = () => {
        setError(null);
    }

    const handleSelectedModelChange = (newModel: string) => {
        if (provider === 'openrouter' || provider === 'ollama') {
            saveSettings({
                ...settings,
                config: {
                    ...settings.config,
                    [provider]: {
                        ...settings.config[provider],
                        selectedModel: newModel,
                    }
                }
            });
        }
    };

    const canGenerateTitle = hasContent && !isLoading && !isGeneratingTitle;

    const isReasoningModeDisabled = provider === 'ollama';
    
    return (
        <div className="bg-card text-card-foreground border rounded-lg p-2 flex flex-col gap-2 h-full shadow-lg shadow-black/20">
            <h2 className="text-lg font-semibold text-foreground">1. Provide Input</h2>
            
            {error && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive-foreground px-4 py-3 rounded-md relative flex items-start gap-3" role="alert">
                    <AlertTriangleIcon className="w-5 h-5 mt-0.5 text-destructive flex-shrink-0"/>
                    <div className="flex-grow">
                        <div className="font-bold">An Error Occurred</div>
                        <p className="text-sm opacity-90">{error.message}</p>
                    </div>
                    <button onClick={handleClearError} className="absolute top-1 right-1 p-2 text-destructive/80 hover:text-destructive">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
            )}
            
            <div className="flex flex-col gap-1.5">
                <label htmlFor="topic" className="text-sm font-medium text-muted-foreground">Topic / Main Context</label>
                <div className="relative flex items-center">
                    <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., 'Introduction to React Hooks'"
                        className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-3 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary"
                    />
                     <button
                        onClick={onGenerateTitle}
                        disabled={!canGenerateTitle}
                        className="absolute right-1.5 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                        aria-label="Generate title from content"
                        title="Generate title from content"
                    >
                        {isGeneratingTitle ? (
                             <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                           <SparklesIcon className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-grow">
                <label htmlFor="rawText" className="text-sm font-medium text-muted-foreground">Raw Text Input</label>
                <textarea
                    id="rawText"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your notes, article content, or any raw text here..."
                    className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[6rem] resize-y focus-visible:border-primary"
                />
            </div>
            
            <div className="flex flex-col gap-1.5">
                 <label htmlFor="file" className="text-sm font-medium text-muted-foreground">Or Upload a File</label>
                 <input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".txt,.md,.js,.ts,.tsx,.py,.html,.css,.pdf,.docx,.pptx"
                    onChange={onFileChange}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />

            </div>

            <div className="space-y-2">
                 {provider === 'gemini' && (
                    <div className="flex flex-col gap-1.5 bg-muted/30 p-2.5 rounded-lg border border-input">
                        <label htmlFor="model-select" className="font-medium text-foreground">Model Selection</label>
                        <select
                            id="model-select"
                            value={modelConfig}
                            onChange={(e) => setModelConfig(e.target.value as ModelConfigType)}
                            disabled={isLoading}
                            className="h-10 w-full rounded-md border border-input bg-background/80 pl-3 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:opacity-50"
                        >
                            <option value="pro">Gemini 2.5 Pro (Higher Quality)</option>
                            <option value="flash">Gemini 2.5 Flash (Faster)</option>
                        </select>

                    </div>
                 )}
                {(provider === 'openrouter' || provider === 'ollama') && (
                    <div className="flex flex-col gap-1.5 bg-muted/30 p-2.5 rounded-lg border border-input">
                        <label htmlFor="model-name-select" className="font-medium text-foreground">Model</label>
                        <select
                            id="model-name-select"
                            value={settings.config[provider].selectedModel}
                            onChange={(e) => handleSelectedModelChange(e.target.value)}
                            disabled={isLoading || settings.config[provider].models.length === 0}
                            className="h-10 w-full rounded-md border border-input bg-background/80 pl-3 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:opacity-50"
                        >
                            {settings.config[provider].models.length > 0 ? (
                                settings.config[provider].models.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))
                            ) : (
                                <option value="">No models configured</option>
                            )}
                        </select>
                        {settings.config[provider].models.length === 0 && (
                            <p className="text-sm text-muted-foreground">Please add one or more models in the settings panel.</p>
                        )}
                    </div>
                )}
                <div 
                    className={`flex items-center justify-between bg-muted/30 p-2 rounded-md border border-input transition-opacity ${isReasoningModeDisabled ? 'opacity-60' : ''}`}
                    title={isReasoningModeDisabled ? "Reasoning mode is not available for the Ollama provider." : "Toggles creative/reasoning capabilities. Disabling it may result in faster, more deterministic responses."}
                >
                    <label htmlFor="reasoning-mode-toggle" className={`flex items-center flex-grow pr-3 ${isReasoningModeDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <span className="text-sm font-medium text-foreground">Reasoning Mode</span>
                    </label>
                    <button
                        type="button"
                        id="reasoning-mode-toggle"
                        onClick={() => !isReasoningModeDisabled && setReasoningModeEnabled(!reasoningModeEnabled)}
                        className={`${reasoningModeEnabled && !isReasoningModeDisabled ? 'bg-primary' : 'bg-muted'} relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 focus:ring-offset-card disabled:cursor-not-allowed`}
                        role="switch"
                        aria-checked={reasoningModeEnabled}
                        disabled={isLoading || isReasoningModeDisabled}
                    >
                        <span
                            aria-hidden="true"
                            className={`${reasoningModeEnabled && !isReasoningModeDisabled ? 'translate-x-3' : 'translate-x-0'} pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                    </button>
                </div>

                 <div className="flex items-center justify-between bg-muted/30 p-2 rounded-md border border-input">
                    <label htmlFor="generate-html-toggle" className="flex items-center cursor-pointer flex-grow pr-3">
                        <span className="text-sm font-medium text-foreground">HTML Preview</span>
                    </label>
                    <button
                        type="button"
                        id="generate-html-toggle"
                        onClick={() => setGenerateHtmlPreview(!generateHtmlPreview)}
                        className={`${generateHtmlPreview ? 'bg-primary' : 'bg-muted'} relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 focus:ring-offset-card`}
                        role="switch"
                        aria-checked={generateHtmlPreview}
                        disabled={isLoading}
                    >
                        <span
                            aria-hidden="true"
                            className={`${generateHtmlPreview ? 'translate-x-3' : 'translate-x-0'} pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                    </button>
                </div>
            </div>

            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-4 py-2 w-full shadow-[0_4px_14px_0_hsl(var(--primary)/25%)] hover:shadow-[0_6px_20px_0_hsl(var(--primary)/30%)] active:scale-[0.98]"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </>
                ) : (
                    <>
                        <GenerateIcon className="w-5 h-5 mr-2" />
                        Generate Knowledge Note
                    </>
                )}
            </button>
        </div>
    );
};