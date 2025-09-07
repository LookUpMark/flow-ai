

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
            <div className="container mx-auto px-3 md:px-4 lg:px-5 py-2.5 flex items-center justify-between">
                <a href="/" className="flex items-center group">
                    <BrainIcon className="w-6 h-6 mr-2 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                    <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight transition-colors duration-300 group-hover:text-primary/90">
                        FlowAI
                    </h1>
                </a>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onNewNote}
                        className="p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Start new note"
                        title="Start new note"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onOpenHistory}
                        className="p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Open history"
                        title="Open history"
                    >
                        <HistoryIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onOpenErrorDashboard}
                        className="p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Open error dashboard"
                        title="Error Dashboard"
                    >
                        <DashboardIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label="Open settings"
                        title="Open settings"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};