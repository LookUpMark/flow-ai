

import React from 'react';
import { BrainIcon, SettingsIcon, HistoryIcon, PlusIcon, DashboardIcon } from './Icons';

interface HeaderProps {
    onOpenSettings: () => void;
    onOpenHistory: () => void;
    onNewNote: () => void;
    onOpenErrorDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenHistory, onNewNote, onOpenErrorDashboard }) => {
    return (
        <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
                <a href="/" className="flex items-center group">
                    <BrainIcon className="w-8 h-8 mr-3 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight transition-colors duration-300 group-hover:text-primary/90">
                        FlowAI
                    </h1>
                </a>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onNewNote}
                        className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Start new note"
                        title="Start new note"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onOpenHistory}
                        className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Open history"
                        title="Open history"
                    >
                        <HistoryIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onOpenErrorDashboard}
                        className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Open error dashboard"
                        title="Error Dashboard"
                    >
                        <DashboardIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Open settings"
                        title="Open settings"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};