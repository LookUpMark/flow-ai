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
        <div className="bg-card text-card-foreground border rounded-lg p-6 flex flex-col gap-6 h-full shadow-lg shadow-black/20">
            <h2 className="text-2xl font-semibold text-foreground">1. Provide Input</h2>
            
            {error && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-md relative flex items-center gap-2" role="alert">
                    <div className="font-bold">Error:</div>
                    <span className="text-sm">{error}</span>
                    <button onClick={handleClearError} className="absolute top-0.5 right-0.5 p-2 text-destructive/80 hover:text-destructive">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
            )}
            
            <div className="flex flex-col gap-2">
                <label htmlFor="topic" className="text-sm font-medium text-muted-foreground">Topic / Main Context</label>
                <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., 'Introduction to React Hooks'"
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary"
                />
            </div>

            <div className="flex flex-col gap-2 flex-grow">
                <label htmlFor="rawText" className="text-sm font-medium text-muted-foreground">Raw Text Input</label>
                <textarea
                    id="rawText"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your notes, article content, or any raw text here..."
                    className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[16rem] resize-y focus-visible:border-primary"
                />
            </div>
            
            <div className="flex flex-col gap-2">
                 <label htmlFor="file" className="text-sm font-medium text-muted-foreground">Or Upload a File</label>
                 <input
                    id="file"
                    type="file"
                    accept=".txt,.md,.js,.ts,.tsx,.py,.html,.css"
                    onChange={onFileChange}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />
                <p className="text-xs text-muted-foreground">.txt, .md and other plain text files work best.</p>
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