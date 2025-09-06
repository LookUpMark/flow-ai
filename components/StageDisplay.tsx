
import React, { useState, useEffect } from 'react';

interface StageDisplayProps {
    title: string;
    content: string;
    isLoading: boolean;
    isFinal?: boolean;
}

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 6 9 17l-5-5" />
    </svg>
);


export const StageDisplay: React.FC<StageDisplayProps> = ({ title, content, isLoading, isFinal }) => {
    const [copied, setCopied] = useState(false);

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


    if (isLoading && !content) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-brand-muted animate-pulse">
                <svg className="w-12 h-12 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h3 className="text-lg font-semibold">Working on {title}...</h3>
                <p>The AI is processing the information.</p>
            </div>
        );
    }
    
    return (
        <div className="relative h-full">
            {isFinal && (
                 <button
                    onClick={handleCopy}
                    className="absolute top-0 right-0 mt-[-1rem] mr-[-0.5rem] bg-brand-surface hover:bg-brand-muted text-brand-text font-semibold py-1 px-3 border border-brand-muted/50 rounded-md text-sm flex items-center gap-2 transition-colors z-10"
                    >
                    {copied ? <CheckIcon className="w-4 h-4 text-brand-green" /> : <CopyIcon className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            )}
            <pre className="w-full h-full overflow-auto whitespace-pre-wrap break-words text-sm text-brand-text-muted font-mono bg-brand-bg rounded-md">
                <code>
                    {content || 'Waiting for previous stage to complete...'}
                </code>
            </pre>
        </div>
    );
};
