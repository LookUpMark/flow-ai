import React from 'react';
import { BrainIcon, SettingsIcon } from './Icons';

interface HeaderProps {
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
    return (
        <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
                <a href="/" className="flex items-center group">
                    <BrainIcon className="w-8 h-8 mr-3 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight transition-colors duration-300 group-hover:text-primary/90">
                        Obsidian Knowledge Architect
                    </h1>
                </a>
                <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label="Open settings"
                    title="Open settings"
                >
                    <SettingsIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};
