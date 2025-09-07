
import React from 'react';
import type { HistoryItem } from '../hooks/useHistory';
import { HistoryIcon, TrashIcon, XIcon } from './Icons';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onLoad: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
    onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onLoad, onDelete, onClear }) => {

    const handleLoad = (item: HistoryItem) => {
        onLoad(item);
        onClose();
    };

    return (
        <>
            <div 
                className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            ></div>
            <div className={`fixed top-0 left-0 h-full w-full max-w-sm bg-card border-r border-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <header className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <HistoryIcon className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-semibold">History</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="flex-grow p-4 overflow-y-auto">
                    {history.length > 0 ? (
                        <ul className="space-y-3">
                            {history.map(item => (
                                <li key={item.id} className="group relative bg-background/50 border border-input rounded-lg p-3 pr-10 transition-colors hover:border-primary/50">
                                    <button onClick={() => handleLoad(item)} className="w-full text-left">
                                        <p className="font-medium truncate text-foreground" title={item.topic}>{item.topic || 'Untitled Note'}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
                                    </button>
                                    <button 
                                        onClick={() => onDelete(item.id)} 
                                        className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                        aria-label="Delete item"
                                        title="Delete item"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <HistoryIcon className="w-12 h-12 mb-4 opacity-50" />
                            <h3 className="font-semibold">No History Yet</h3>
                            <p className="text-sm">Generated notes will appear here.</p>
                        </div>
                    )}
                </div>

                {history.length > 0 && (
                     <footer className="p-4 border-t border-border flex-shrink-0">
                        <button 
                            onClick={onClear}
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-destructive/80 text-destructive-foreground hover:bg-destructive disabled:opacity-50 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Clear All History
                        </button>
                    </footer>
                )}
            </div>
        </>
    );
};
