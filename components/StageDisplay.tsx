import React, { useState, useEffect, useRef } from 'react';
import { CopyIcon, CheckIcon, ErrorIcon, SkipIcon } from './Icons';

interface StageDisplayProps {
    title: string;
    content: string;
    isLoading: boolean;
    isFinalizer?: boolean;
    hasPipelineStarted: boolean;
    isFailed?: boolean;
    errorMessage?: string;
}

export const StageDisplay: React.FC<StageDisplayProps> = ({ title, content, isLoading, isFinalizer, hasPipelineStarted, isFailed, errorMessage }) => {
    const [copied, setCopied] = useState(false);
    const isSkipped = content === 'Skipped';
    const scrollRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom as content streams in
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [content]);

    const handleCopy = () => {
        if (content) {
            navigator.clipboard.writeText(content);
            setCopied(true);
        }
    };

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    if (isFailed) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-destructive p-4">
                <ErrorIcon className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-semibold">Stage Failed: {title}</h3>
                <p className="text-sm max-w-md">{errorMessage || "An unexpected error occurred at this stage."}</p>
            </div>
        );
    }
    
    if (isSkipped) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <SkipIcon className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-semibold">Stage Skipped</h3>
                <p className="text-sm max-w-md">This stage was intentionally skipped based on your configuration.</p>
            </div>
        );
    }

    if (isLoading && !content) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <svg className="animate-spin w-12 h-12 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h3 className="text-lg font-semibold">Working on {title}...</h3>
                <p>The AI is processing the information.</p>
            </div>
        );
    }
    
    const displayText = hasPipelineStarted ? (content || 'Waiting for previous stage to complete...') : '';

    return (
        <div className="relative h-full">
            {isFinalizer && content && (
                 <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="h-9 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-primary/50 text-primary bg-background hover:bg-primary/10 hover:text-primary"
                        >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                        <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                 </div>
            )}
            <pre ref={scrollRef} className="w-full h-full overflow-auto whitespace-pre-wrap break-words text-sm text-foreground/80 font-mono bg-transparent rounded-md p-1">
                <code>
                    {displayText}
                </code>
            </pre>
        </div>
    );
};