
import React from 'react';

const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.5 2.3.96 2.87.73.09-.57.34-1.03.6-1.26-2.2-.25-4.5-1.1-4.5-4.9 0-1.08.39-1.96 1.03-2.65-.1-.25-.45-1.25.1-2.6 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.35.1 2.6 1.06.7 1.03 1.57 1.03 2.65 0 3.81-2.31 4.65-4.51 4.9.36.31.68.92.68 1.85v2.75c0 .27.16.59.67.5A10 10 0 0 0 22 12 10 10 0 0 0 12 2Z"/>
        <path d="M12 20.5c.03-.01.06-.02.09-.03" />
        <path d="M12 20.5c-.03-.01-.06-.02-.09-.03" />
        <path d="M15 9.5a2.5 2.5 0 1 0-5 0" />
        <path d="M12 15a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path d="M12 15v1" />
        <path d="M12 8.5V8" />
        <path d="m4.93 16.5 1.4-1.4" />
        <path d="M17.67 8.93l1.4-1.4" />
        <path d="m4.93 8.93 1.4 1.4" />
        <path d="M17.67 16.5l1.4 1.4" />
    </svg>
);


export const Header: React.FC = () => {
    return (
        <header className="bg-brand-surface/50 backdrop-blur-sm border-b border-brand-muted/50 sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-center">
                <BrainCircuitIcon className="w-8 h-8 mr-3 text-brand-accent" />
                <h1 className="text-2xl md:text-3xl font-bold text-brand-text tracking-tight">
                    Obsidian Knowledge Architect
                </h1>
            </div>
        </header>
    );
};
