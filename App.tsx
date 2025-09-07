import React, { useState, useCallback, useRef } from 'react';
import { runKnowledgePipeline, generateTitle, PipelineError } from './services/aiService';
import type { Stage, StageOutputs, AppError, ModelConfigType } from './types';
import { useSettings } from './hooks/useSettings';
import { useHistory } from './hooks/useHistory';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SettingsModal } from './components/SettingsModal';
import { HistoryPanel } from './components/HistoryPanel';
import type { HistoryItem } from './hooks/useHistory';

declare const pdfjsLib: any;
declare const mammoth: any;
declare const JSZip: any;

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
    const [throughput, setThroughput] = useState<number>(0);

    const [settings, saveSettings] = useSettings();
    const { history, addHistoryItem, deleteHistoryItem, clearHistory } = useHistory();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleNewNote = useCallback(() => {
        setTopic('');
        setRawText('');
        setFileContent('');
        setOutputs({
            synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', 
            diagramGenerator: '', finalizer: '', htmlTranslator: '',
        });
        setError(null);
        setLoadingStage(null);
        setThroughput(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleGenerate = useCallback(async () => {
        setError(null);
        setOutputs({ synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', diagramGenerator: '', finalizer: '', htmlTranslator: '' });
        setThroughput(0);

        const combinedInput = `File Content:\n${fileContent}\n\nUser Text:\n${rawText}`;
        if (!topic.trim() || !combinedInput.trim()) {
            setError({ context: 'setup', message: 'Please provide a topic and some input text or a file.' });
            return;
        }

        let totalChars = 0;
        const startTime = Date.now();
        const finalOutputs: StageOutputs = { synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', diagramGenerator: '', finalizer: '', htmlTranslator: '' };

        try {
            const pipelineStream = runKnowledgePipeline(
                combinedInput,
                topic,
                generateDiagrams && settings.provider === 'gemini',
                generateHtmlPreview,
                modelConfig,
                settings
            );

            for await (const update of pipelineStream) {
                switch (update.type) {
                    case 'stage_start':
                        setLoadingStage(update.stage);
                        break;
                    case 'chunk':
                        setOutputs(prev => ({
                            ...prev,
                            [update.stage]: (prev[update.stage] || '') + update.content
                        }));
                         finalOutputs[update.stage] = (finalOutputs[update.stage] || '') + update.content;
                        totalChars += update.content.length;
                        const elapsedSeconds = (Date.now() - startTime) / 1000;
                        if (elapsedSeconds > 0.2) { // Avoid division by zero and noisy initial values
                           const charsPerSecond = totalChars / elapsedSeconds;
                           const tokensPerSecond = charsPerSecond / 4; // Approx. 4 chars per token
                           setThroughput(tokensPerSecond);
                        }
                        break;
                    case 'stage_end':
                        // Final content is built from chunks, but we could use this if needed
                        break;
                    case 'skipped':
                        setOutputs(prev => ({ ...prev, [update.stage]: 'Skipped' }));
                        finalOutputs[update.stage] = 'Skipped';
                        break;
                }
            }
            setLoadingStage(null);
            if (finalOutputs.finalizer && finalOutputs.finalizer !== 'Skipped') {
                addHistoryItem(topic, finalOutputs);
            }
        } catch (err) {
            console.error("Pipeline execution failed:", err);
            setError(getFriendlyErrorMessage(err));
            setLoadingStage(null);
        }
    }, [topic, rawText, fileContent, generateDiagrams, generateHtmlPreview, modelConfig, settings, addHistoryItem]);
    
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

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileContent(`Parsing ${file.name}...`);
            setError(null);
            try {
                const extension = file.name.split('.').pop()?.toLowerCase() || 'file';
                const reader = new FileReader();

                const content = await new Promise<string>((resolve, reject) => {
                    reader.onload = async (e) => {
                        try {
                            const buffer = e.target?.result;
                            if (!buffer) return reject(new Error('File buffer is empty.'));

                            if (extension === 'pdf') {
                                const typedarray = new Uint8Array(buffer as ArrayBuffer);
                                const loadingTask = pdfjsLib.getDocument(typedarray);
                                const pdf = await loadingTask.promise;
                                let text = '';
                                for (let i = 1; i <= pdf.numPages; i++) {
                                    const page = await pdf.getPage(i);
                                    const textContent = await page.getTextContent();
                                    text += textContent.items.map((item: any) => item.str).join(' ');
                                    text += '\n\n'; // Add space between pages
                                }
                                resolve(text);
                            } else if (extension === 'docx') {
                                const result = await mammoth.extractRawText({ arrayBuffer: buffer as ArrayBuffer });
                                resolve(result.value);
                            } else if (extension === 'pptx') {
                                const zip = await JSZip.loadAsync(buffer as ArrayBuffer);
                                const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
                                slideFiles.sort((a, b) => {
                                    const numA = parseInt(a.match(/(\d+)\.xml$/)?.[1] || '0');
                                    const numB = parseInt(b.match(/(\d+)\.xml$/)?.[1] || '0');
                                    return numA - numB;
                                });

                                let text = '';
                                for (const slideFile of slideFiles) {
                                    const slideXml = await zip.file(slideFile).async('string');
                                    const textNodes = slideXml.match(/<a:t>.*?<\/a:t>/g) || [];
                                    const slideText = textNodes.map(node => node.replace(/<\/?a:t>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')).join(' ');
                                    if (slideText.trim()) {
                                        text += `--- Slide ${slideFiles.indexOf(slideFile) + 1} ---\n${slideText}\n\n`;
                                    }
                                }
                                resolve(text);
                            } else {
                                resolve(buffer as string); // Fallback for text files
                            }
                        } catch (err) {
                            console.error(`Error parsing ${extension} file:`, err);
                            reject(new Error(`Failed to parse ${extension} file. It may be corrupt or in an unsupported format.`));
                        }
                    };

                    reader.onerror = () => reject(new Error('Failed to read the file.'));
                    
                    if (['pdf', 'docx', 'pptx'].includes(extension)) {
                        reader.readAsArrayBuffer(file);
                    } else {
                        reader.readAsText(file);
                    }
                });

                setFileContent(content);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "An unknown error occurred during file parsing.";
                setError({ context: 'setup', message });
                setFileContent('');
            }
        }
    };

    const handleLoadHistory = (item: HistoryItem) => {
        setError(null);
        setTopic(item.topic);
        setOutputs(item.outputs);
        setThroughput(0);
        setLoadingStage(null);
    };

    const isLoading = loadingStage !== null;
    const hasContent = !!(fileContent.trim() || rawText.trim());

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <HistoryPanel
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onLoad={handleLoadHistory}
                onDelete={deleteHistoryItem}
                onClear={clearHistory}
            />
            <Header onOpenSettings={() => setIsSettingsOpen(true)} onOpenHistory={() => setIsHistoryOpen(true)} onNewNote={handleNewNote} />
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
                    reasoningModeEnabled={settings.reasoningModeEnabled}
                    setReasoningModeEnabled={(value) => saveSettings({ ...settings, reasoningModeEnabled: value })}
                    settings={settings}
                    saveSettings={saveSettings}
                    fileInputRef={fileInputRef}
                />
                <OutputPanel
                    outputs={outputs}
                    loadingStage={loadingStage}
                    topic={topic}
                    error={error}
                    generateDiagrams={generateDiagrams && settings.provider === 'gemini'}
                    generateHtmlPreview={generateHtmlPreview}
                    throughput={throughput}
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