
import { useState, useCallback } from 'react';
import type { StageOutputs } from '../types';

export interface HistoryItem {
    id: string;
    topic: string;
    date: string;
    outputs: StageOutputs;
}

const HISTORY_KEY = 'flowai-history';

// Utility function to generate UUID with fallback for older browsers
const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback UUID generation for older browsers or insecure contexts
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const useHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const storedHistory = localStorage.getItem(HISTORY_KEY);
            return storedHistory ? JSON.parse(storedHistory) : [];
        } catch (error) {
            console.error("Failed to parse history from localStorage", error);
            return [];
        }
    });

    const saveHistory = (newHistory: HistoryItem[]) => {
        try {
            // Sort by date descending before saving
            const sortedHistory = newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            localStorage.setItem(HISTORY_KEY, JSON.stringify(sortedHistory));
            setHistory(sortedHistory);
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
    };

    const addHistoryItem = useCallback((topic: string, outputs: StageOutputs) => {
        setHistory(prevHistory => {
            const newItem: HistoryItem = {
                id: generateUUID(),
                topic,
                outputs,
                date: new Date().toISOString(),
            };
            const newHistory = [newItem, ...prevHistory];
            saveHistory(newHistory);
            return newHistory;
        });
    }, []);

    const deleteHistoryItem = useCallback((id: string) => {
        setHistory(prevHistory => {
            const newHistory = prevHistory.filter(item => item.id !== id);
            saveHistory(newHistory);
            return newHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        saveHistory([]);
    }, []);

    return { history, addHistoryItem, deleteHistoryItem, clearHistory };
};
