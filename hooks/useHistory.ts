
import { useState, useCallback } from 'react';
import type { StageOutputs } from '../types';

export interface HistoryItem {
    id: string;
    topic: string;
    date: string;
    outputs: StageOutputs;
}

const HISTORY_KEY = 'flowai-history';

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
                id: crypto.randomUUID(),
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
