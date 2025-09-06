
import React from 'react';

interface InputPanelProps {
    topic: string;
    setTopic: (topic: string) => void;
    rawText: string;
    setRawText: (text: string) => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
}

const GenerateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        <path d="m13 13-1-4-4 1 1 4 4-1z" />
    </svg>
);


export const InputPanel: React.FC<InputPanelProps> = ({
    topic, setTopic, rawText, setRawText, onFileChange, onGenerate, isLoading, error, setError
}) => {

    const handleClearError = () => {
        setError(null);
    }
    
    return (
        <div className="bg-brand-surface rounded-lg p-6 flex flex-col gap-6 h-full shadow-lg border border-brand-muted/30">
            <h2 className="text-2xl font-semibold text-brand-text-muted">1. Provide Input</h2>
            
            {error && (
                <div className="bg-brand-red/20 border border-brand-red text-brand-red px-4 py-3 rounded-md relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <button onClick={handleClearError} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                        <span className="text-xl">×</span>
                    </button>
                </div>
            )}
            
            <div className="flex flex-col gap-2">
                <label htmlFor="topic" className="font-medium text-brand-text-muted">Topic / Main Context</label>
                <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., 'Introduction to React Hooks'"
                    className="w-full bg-brand-bg border border-brand-muted rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-accent focus:outline-none transition-shadow"
                />
            </div>

            <div className="flex flex-col gap-2 flex-grow">
                <label htmlFor="rawText" className="font-medium text-brand-text-muted">Raw Text Input</label>
                <textarea
                    id="rawText"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your notes, article content, or any raw text here..."
                    className="w-full h-64 min-h-[16rem] bg-brand-bg border border-brand-muted rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-accent focus:outline-none transition-shadow resize-y"
                />
            </div>
            
            <div className="flex flex-col gap-2">
                 <label htmlFor="file" className="font-medium text-brand-text-muted">Or Upload a File</label>
                 <input
                    id="file"
                    type="file"
                    accept=".txt,.md,.js,.ts,.tsx,.py,.html,.css"
                    onChange={onFileChange}
                    className="w-full text-sm text-brand-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-accent/20 file:text-brand-accent hover:file:bg-brand-accent/30 transition-colors"
                />
                <p className="text-xs text-brand-muted">.txt, .md and other plain text files work best.</p>
            </div>

            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="w-full bg-brand-accent hover:bg-brand-accent-dark disabled:bg-brand-muted disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </>
                ) : (
                    <>
                        <GenerateIcon className="w-5 h-5" />
                        Generate Knowledge Note
                    </>
                )}
            </button>
        </div>
    );
};
