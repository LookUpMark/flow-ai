import React, { useState, useCallback, useEffect } from 'react';
import { runKnowledgePipeline, generateTitle } from './services/geminiService';
import type { Stage, StageOutputs } from './types';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { marked } from 'marked';

const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('');
    const [rawText, setRawText] = useState<string>('');
    const [fileContent, setFileContent] = useState<string>('');
    
    const [outputs, setOutputs] = useState<StageOutputs>({
        synthesizer: '',
        condenser: '',
        enhancer: '',
        mermaidValidator: '',
        finalizer: '',
        preview: '',
    });

    const [loadingStage, setLoadingStage] = useState<Stage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

    const handleGenerate = useCallback(async () => {
        setError(null);
        setOutputs({ synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', finalizer: '', preview: '' });

        const combinedInput = `File Content:\n${fileContent}\n\nUser Text:\n${rawText}`;
        if (!topic.trim() || !combinedInput.trim()) {
            setError('Please provide a topic and some input text or a file.');
            return;
        }

        try {
            await runKnowledgePipeline(
                combinedInput,
                topic,
                (stage, data) => {
                    setOutputs(prev => ({ ...prev, [stage]: data }));
                    setLoadingStage(stage);
                }
            );
            setLoadingStage(null);
        } catch (err) {
            // Log the detailed technical error for developers/debugging.
            console.error("Pipeline execution failed:", err);
            
            // Provide a more user-friendly message based on the error type.
            let userMessage = "An unexpected error occurred while generating the note. Please try again.";
            if (err instanceof Error) {
                if (err.message.includes('API call failed')) {
                    userMessage = "Failed to communicate with the AI service. Please check your network and try again.";
                } else if (err.message.includes('empty or invalid response')) {
                    userMessage = "The AI service returned an unexpected response. Please try modifying your input or try again later.";
                }
            }
            setError(userMessage);
            setLoadingStage(null);
        }
    }, [topic, rawText, fileContent]);
    
     useEffect(() => {
        if (outputs.finalizer && !loadingStage) {
            const finalMarkdown = outputs.finalizer;
            const cleanMarkdown = finalMarkdown.replace(/---[\s\S]*?---/, '').trim();
            const html = marked.parse(cleanMarkdown);
            setOutputs(prev => ({ ...prev, preview: html as string }));
        }
    }, [outputs.finalizer, loadingStage]);

    const handleGenerateTitle = useCallback(async () => {
        setError(null);
        const combinedInput = `File Content:\n${fileContent}\n\nUser Text:\n${rawText}`;
        if (!combinedInput.trim()) {
            setError('Please provide some input text or a file to generate a title.');
            return;
        }

        setIsGeneratingTitle(true);
        try {
            const newTitle = await generateTitle(combinedInput);
            setTopic(newTitle);
        } catch (err) {
            console.error("Title generation failed:", err);
            let userMessage = "Failed to generate title. Please try again.";
            if (err instanceof Error && err.message.includes('API call failed')) {
                userMessage = "Could not connect to the AI service to generate a title.";
            }
            setError(userMessage);
        } finally {
            setIsGeneratingTitle(false);
        }
    }, [rawText, fileContent]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setFileContent(text);
            };
            reader.onerror = () => {
                setError("Failed to read the file.");
                setFileContent('');
            }
            reader.readAsText(file);
        }
    };

    const isLoading = loadingStage !== null;
    const hasContent = !!(fileContent.trim() || rawText.trim());

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Header />
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
                />
                <OutputPanel
                    outputs={outputs}
                    loadingStage={loadingStage}
                    topic={topic}
                />
            </main>
            <Footer />
        </div>
    );
};

export default App;