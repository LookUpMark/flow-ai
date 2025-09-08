import React, { useState, useCallback, useRef, useEffect } from 'react';
import { runKnowledgePipeline, generateTitle, PipelineError } from './services/aiService';
import type { Stage, StageOutputs, AppError, ModelConfigType, EnhancedError } from './types';
import { useSettings } from './hooks/useSettings';
import { useHistory } from './hooks/useHistory';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SettingsModal } from './components/SettingsModal';
import { HistoryPanel } from './components/HistoryPanel';
import { NotificationSystem } from './components/NotificationSystem';
import ErrorDashboard from './components/ErrorDashboard';
import type { HistoryItem } from './hooks/useHistory';
import { errorManager, createFileError, createValidationError } from './services/errorService';
import { loggingService, logUserAction, logPerformanceMetric } from './services/loggingService';

declare const pdfjsLib: any;
declare const mammoth: any;
declare const JSZip: any;

const getFriendlyErrorMessage = (err: unknown): AppError => {
    // Handle enhanced errors from the new error system
    if (err instanceof PipelineError && err.enhancedError) {
        const enhancedError = err.enhancedError as EnhancedError;
        return {
            context: enhancedError.context,
            message: enhancedError.userAction || enhancedError.message,
            details: enhancedError.details
        };
    }
    
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

    const [generateHtmlPreview, setGenerateHtmlPreview] = useState<boolean>(true);
    const [modelConfig, setModelConfig] = useState<ModelConfigType>('pro');
    
    // Setup error handling and logging
    useEffect(() => {
        // Log application startup
        loggingService.info('Application started', 'app', 'startup', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
        
        // Setup custom event listeners for error system integration
        const handleOpenSettingsModal = () => {
            setIsSettingsOpen(true);
            logUserAction('open_settings_modal', 'error_action');
        };
        
        window.addEventListener('open-settings-modal', handleOpenSettingsModal);
        
        return () => {
            window.removeEventListener('open-settings-modal', handleOpenSettingsModal);
        };
    }, []);
    
    const [outputs, setOutputs] = useState<StageOutputs>({
        synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', 
        finalizer: '', htmlTranslator: '',
    });

    const [loadingStage, setLoadingStage] = useState<Stage | null>(null);
    const [error, setError] = useState<AppError | null>(null);
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
    const [throughput, setThroughput] = useState<number>(0);

    const [settings, saveSettings] = useSettings();
    const { history, addHistoryItem, deleteHistoryItem, clearHistory } = useHistory();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isErrorDashboardOpen, setIsErrorDashboardOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleNewNote = useCallback(() => {
        setTopic('');
        setRawText('');
        setFileContent('');
        setOutputs({
            synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', 
            finalizer: '', htmlTranslator: '',
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
        setOutputs({ synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', finalizer: '', htmlTranslator: '' });
        setThroughput(0);

        const combinedInput = `File Content:\n${fileContent}\n\nUser Text:\n${rawText}`;
        if (!topic.trim() || !combinedInput.trim()) {
            const validationError = createValidationError(
                'Please provide a topic and some input text or a file.',
                'setup',
                { topicLength: topic.length, inputLength: combinedInput.length, hasFile: !!fileContent, hasText: !!rawText }
            );
            setError({ context: 'setup', message: validationError.message });
            return;
        }
        
        // Log pipeline start
        const pipelineId = `pipeline_${Date.now()}`;
        logUserAction('start_pipeline', 'pipeline', {
            pipelineId,
            topic,
            inputLength: combinedInput.length,
            provider: settings.provider,
            modelConfig,

            generateHtmlPreview
        });
        
        loggingService.startPerformanceTracking(pipelineId, {
            inputLength: combinedInput.length,
            provider: settings.provider,
            modelConfig,
            stages: ['synthesizer', 'condenser', 'enhancer', 'mermaidValidator', 'finalizer', 'htmlTranslator']
        });

        let totalChars = 0;
        const startTime = Date.now();
        const finalOutputs: StageOutputs = { synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', finalizer: '', htmlTranslator: '' };

        try {
            const pipelineStream = runKnowledgePipeline(
                combinedInput,
                topic,
                generateHtmlPreview,
                modelConfig,
                settings
            );

            for await (const update of pipelineStream) {
                switch (update.type) {
                    case 'stage_start':
                        setLoadingStage(update.stage);
                        loggingService.info(`Pipeline stage started: ${update.stage}`, 'pipeline', 'stage_start', {
                            pipelineId,
                            stage: update.stage,
                            provider: settings.provider
                        });
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
                        loggingService.info(`Pipeline stage completed: ${update.stage}`, 'pipeline', 'stage_completion', {
                            pipelineId,
                            stage: update.stage,
                            outputLength: finalOutputs[update.stage]?.length || 0,
                            provider: settings.provider
                        });
                        break;
                    case 'skipped':
                        setOutputs(prev => ({ ...prev, [update.stage]: 'Skipped' }));
                        finalOutputs[update.stage] = 'Skipped';
                        loggingService.info(`Pipeline stage skipped: ${update.stage}`, 'pipeline', 'stage_skipped', {
                            pipelineId,
                            stage: update.stage,
                            provider: settings.provider
                        });
                        break;
                }
            }
            
            setLoadingStage(null);
            
            // Log successful pipeline completion
            const metrics = loggingService.endPerformanceTracking(pipelineId, {
                success: true,
                finalOutputLength: finalOutputs.finalizer?.length || 0,
                stagesCompleted: Object.keys(finalOutputs).filter(key => finalOutputs[key as keyof StageOutputs] && finalOutputs[key as keyof StageOutputs] !== 'Skipped').length
            });
            
            logPerformanceMetric('pipeline_completion', metrics?.duration || 0, {
                pipelineId,
                provider: settings.provider,
                success: true
            });
            
            if (finalOutputs.finalizer && finalOutputs.finalizer !== 'Skipped') {
                addHistoryItem(topic, finalOutputs);
                logUserAction('save_to_history', 'pipeline', {
                    pipelineId,
                    topic,
                    outputLength: finalOutputs.finalizer.length
                });
            }
        } catch (err) {
            loggingService.error(
                `Pipeline execution failed: ${err instanceof Error ? err.message : String(err)}`,
                'pipeline',
                'execution_failure',
                {
                    pipelineId,
                    provider: settings.provider,
                    modelConfig,
                    inputLength: combinedInput.length,
                    error: err instanceof Error ? err.message : String(err)
                }
            );
            
            loggingService.endPerformanceTracking(pipelineId, {
                success: false,
                error: err instanceof Error ? err.message : String(err)
            });
            
            setError(getFriendlyErrorMessage(err));
            setLoadingStage(null);
        }
    }, [topic, rawText, fileContent, generateHtmlPreview, modelConfig, settings, addHistoryItem]);
    
    const handleGenerateTitle = useCallback(async () => {
        setError(null);
        const combinedInput = `File Content:\n${fileContent}\n\nUser Text:\n${rawText}`;
        
        if (!combinedInput.trim()) {
            const validationError = createValidationError(
                'Please provide some input text or a file to generate a title.',
                'title_generation',
                { inputLength: combinedInput.length, hasFile: !!fileContent, hasText: !!rawText }
            );
            setError({ context: 'setup', message: validationError.message });
            return;
        }
        
        const titleGenerationId = `title_gen_${Date.now()}`;
        logUserAction('generate_title', 'title_generation', {
            titleGenerationId,
            inputLength: combinedInput.length,
            provider: settings.provider,
            modelConfig
        });
        
        loggingService.startPerformanceTracking(titleGenerationId, {
            inputLength: combinedInput.length,
            provider: settings.provider,
            modelConfig
        });

        setIsGeneratingTitle(true);
        try {
            const newTitle = await generateTitle(combinedInput, modelConfig, settings);
            setTopic(newTitle);
            
            loggingService.endPerformanceTracking(titleGenerationId, {
                success: true,
                titleLength: newTitle.length
            });
            
            loggingService.info('Title generated successfully', 'title_generation', 'success', {
                titleGenerationId,
                titleLength: newTitle.length,
                provider: settings.provider
            });
        } catch (err) {
            loggingService.error(
                `Title generation failed: ${err instanceof Error ? err.message : String(err)}`,
                'title_generation',
                'failure',
                {
                    titleGenerationId,
                    provider: settings.provider,
                    modelConfig,
                    inputLength: combinedInput.length,
                    error: err instanceof Error ? err.message : String(err)
                }
            );
            
            loggingService.endPerformanceTracking(titleGenerationId, {
                success: false,
                error: err instanceof Error ? err.message : String(err)
            });
            
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
            
            const fileProcessingId = `file_${Date.now()}`;
            logUserAction('start_file_processing', 'file_processing', {
                fileProcessingId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });
            
            loggingService.startPerformanceTracking(fileProcessingId, {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });
            
            try {
                const extension = file.name.split('.').pop()?.toLowerCase() || 'file';
                const reader = new FileReader();

                const content = await new Promise<string>((resolve, reject) => {
                    reader.onload = async (e) => {
                        try {
                            const buffer = e.target?.result;
                            if (!buffer) {
                                const fileError = createFileError(
                                    'File buffer is empty.',
                                    'file_processing',
                                    { fileName: file.name, fileSize: file.size }
                                );
                                return reject(fileError);
                            }

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
                            const fileError = createFileError(
                                `Failed to parse ${extension} file. It may be corrupt or in an unsupported format.`,
                                'file_processing',
                                { fileName: file.name, fileSize: file.size, extension, error: err instanceof Error ? err.message : String(err) }
                            );
                            reject(fileError);
                        }
                    };

                    reader.onerror = () => {
                        const fileError = createFileError(
                            'Failed to read the file.',
                            'file_processing',
                            { fileName: file.name, fileSize: file.size }
                        );
                        reject(fileError);
                    };
                    
                    if (['pdf', 'docx', 'pptx'].includes(extension)) {
                        reader.readAsArrayBuffer(file);
                    } else {
                        reader.readAsText(file);
                    }
                });

                setFileContent(content);
                
                // Log successful file processing
                loggingService.endPerformanceTracking(fileProcessingId, {
                    success: true,
                    contentLength: content.length
                });
                
                loggingService.info('File processed successfully', 'file_processing', 'success', {
                    fileProcessingId,
                    fileName: file.name,
                    contentLength: content.length
                });
                
            } catch (err: unknown) {
                loggingService.error(
                    `File processing failed: ${err instanceof Error ? err.message : String(err)}`,
                    'file_processing',
                    'failure',
                    {
                        fileProcessingId,
                        fileName: file.name,
                        fileSize: file.size,
                        error: err instanceof Error ? err.message : String(err)
                    }
                );
                
                loggingService.endPerformanceTracking(fileProcessingId, {
                    success: false,
                    error: err instanceof Error ? err.message : String(err)
                });
                
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
            <Header 
                onOpenSettings={() => setIsSettingsOpen(true)} 
                onOpenHistory={() => setIsHistoryOpen(true)} 
                onOpenErrorDashboard={() => {
                    setIsErrorDashboardOpen(true);
                    logUserAction('open_error_dashboard', 'monitoring');
                }}
                onNewNote={handleNewNote} 
            />
            <main className="flex-grow container mx-auto p-3 md:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <ErrorDashboard
                isOpen={isErrorDashboardOpen}
                onClose={() => setIsErrorDashboardOpen(false)}
            />
            <NotificationSystem />
        </div>
    );
};

export default App;