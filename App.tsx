import React, { useState, useCallback } from 'react';
import { runKnowledgePipeline, generateTitle, PipelineError } from './services/aiService';
import type { Stage, StageOutputs, AppError, ModelConfigType, AppSettings } from './types';
import { useSettings } from './hooks/useSettings';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SettingsModal } from './components/SettingsModal';

const getFriendlyErrorMessage = (err: unknown): AppError => {
    const friendlyError: AppError = {
        context: 'setup',
        message: 'An unexpected error occurred. Please check the console for more details.',
        details: err instanceof Error ? err.message : String(err),
    };

    if (err instanceof PipelineError) {
        friendlyError.context = err.stage;
        const details = err.originalError instanceof Error ? err.originalError.message : String(err.originalError);
        friendlyError.details = details;

        if (details.includes('rate limit') || details.includes('RESOURCE_EXHAUSTED') || details.includes('429')) {
            friendlyError.message = 'The AI service is busy (rate limit exceeded). Please wait a moment and try again.';
        } else if (details.includes('token') && details.includes('exceeds')) {
            friendlyError.message = 'The input provided is too large for the AI. Please try with smaller text or a smaller file.';
        } else if (details.includes('API key not valid')) {
            friendlyError.message = 'The provided API key is invalid. Please check your configuration.';
        } else if (details.includes('Failed to fetch')) {
            friendlyError.message = 'Could not connect to the AI service. If using Ollama, ensure it is running. Otherwise, check your network.';
        } else {
            friendlyError.message = `The process failed at the "${err.stage}" stage. Please try again.`;
        }
    } else if (err instanceof Error) {
        friendlyError.context = 'title_generation';
        friendlyError.message = 'Failed to communicate with the AI service. Please check your network and try again.';
    }

    return friendlyError;
};

const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('');
    const [rawText, setRawText] = useState<string>('');
    const [fileContent, setFileContent] = useState<string>('');
    const [generateDiagrams, setGenerateDiagrams] = useState<boolean>(true);
    const [generateHtmlPreview, setGenerateHtmlPreview] = useState<boolean>(true);
    const [modelConfig, setModelConfig] = useState<ModelConfigType>('pro');
    
    const [outputs, setOutputs] = useState<StageOutputs>({
        synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', 
        diagramGenerator: '', finalizer: '', htmlTranslator: '',
    });

    const [loadingStage, setLoadingStage] = useState<Stage | null>(null);
    const [error, setError] = useState<AppError | null>(null);
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

    const [settings, saveSettings] = useSettings();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleGenerate = useCallback(async () => {
        setError(null);
        setOutputs({ synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', diagramGenerator: '', finalizer: '', htmlTranslator: '' });

        const combinedInput = `File Content:\n${fileContent}\n\nUser Text:\n${rawText}`;
        if (!topic.trim() || !combinedInput.trim()) {
            setError({ context: 'setup', message: 'Please provide a topic and some input text or a file.' });
            return;
        }

        try {
            await runKnowledgePipeline(
                combinedInput,
                topic,
                (stage, data) => {
                    setOutputs(prev => ({ ...prev, [stage]: data }));
                    setLoadingStage(stage);
                },
                generateDiagrams && settings.provider === 'gemini',
                generateHtmlPreview,
                modelConfig,
                settings
            );
            setLoadingStage(null);
        } catch (err) {
            console.error("Pipeline execution failed:", err);
            setError(getFriendlyErrorMessage(err));
            setLoadingStage(null);
        }
    }, [topic, rawText, fileContent, generateDiagrams, generateHtmlPreview, modelConfig, settings]);
    
    const handleGenerateTitle = useCallback(async () => {
        setError(null);
        const combinedInput = `File Content:\n${fileContent}\n\nUser Text:\n${rawText}`;
        if (!combinedInput.trim()) {
            setError({ context: 'setup', message: 'Please provide some input text or a file to generate a title.' });
            return;
        }

        setIsGeneratingTitle(true);
        try {
            const newTitle = await generateTitle(combinedInput, modelConfig, settings);
            setTopic(newTitle);
        } catch (err) {
            console.error("Title generation failed:", err);
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsGeneratingTitle(false);
        }
    }, [rawText, fileContent, modelConfig, settings]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setFileContent(e.target?.result as string);
            reader.onerror = () => {
                setError({ context: 'setup', message: "Failed to read the file." });
                setFileContent('');
            }
            reader.readAsText(file);
        }
    };

    const isLoading = loadingStage !== null;
    const hasContent = !!(fileContent.trim() || rawText.trim());

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Header onOpenSettings={() => setIsSettingsOpen(true)} />
            <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InputPanel
                    topic={topic}
                    setTopic={setTopic}
                    rawText={rawText}
                    setRawText={setRawText}
                    onFileChange={handleFileChange}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                    error={error}
                    setError={setError}
                    onGenerateTitle={handleGenerateTitle}
                    isGeneratingTitle={isGeneratingTitle}
                    hasContent={hasContent}
                    generateDiagrams={generateDiagrams}
                    setGenerateDiagrams={setGenerateDiagrams}
                    generateHtmlPreview={generateHtmlPreview}
                    setGenerateHtmlPreview={setGenerateHtmlPreview}
                    provider={settings.provider}
                    modelConfig={modelConfig}
                    setModelConfig={setModelConfig}
                />
                <OutputPanel
                    outputs={outputs}
                    loadingStage={loadingStage}
                    topic={topic}
                    error={error}
                    generateDiagrams={generateDiagrams && settings.provider === 'gemini'}
                    generateHtmlPreview={generateHtmlPreview}
                />
            </main>
            <Footer />
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSave={(newSettings) => {
                    saveSettings(newSettings);
                    setIsSettingsOpen(false);
                }}
            />
        </div>
    );
};

export default App;
