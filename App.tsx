
import React, { useState, useCallback } from 'react';
import { runKnowledgePipeline } from './services/geminiService';
import type { Stage, StageOutputs } from './types';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

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
    });

    const [loadingStage, setLoadingStage] = useState<Stage | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        setError(null);
        setOutputs({ synthesizer: '', condenser: '', enhancer: '', mermaidValidator: '', finalizer: '' });

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
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed during pipeline execution: ${errorMessage}`);
            setLoadingStage(null);
        }
    }, [topic, rawText, fileContent]);

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
                />
                <OutputPanel
                    outputs={outputs}
                    loadingStage={loadingStage}
                />
            </main>
            <Footer />
        </div>
    );
};

export default App;
