import React from 'react';
import { BrainIcon } from './Icons';

export const Header: React.FC = () => {
    return (
        <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-center">
                <a href="/" className="flex items-center group">
                    <BrainIcon className="w-8 h-8 mr-3 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight transition-colors duration-300 group-hover:text-primary/90">
                        Obsidian Knowledge Architect
                    </h1>
                </a>
            </div>
        </header>
    );
};