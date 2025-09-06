import React, { useState } from 'react';
import type { ExportFormat, Template } from '../types';
import { TEMPLATES } from '../constants';
import { exportDocument } from '../services/exportService';
import { DownloadIcon } from './Icons';

interface ExportControlsProps {
    content: string;
    topic: string;
}

const FORMATS: { id: ExportFormat; name: string }[] = [
    { id: 'markdown', name: 'MD' },
    { id: 'pdf', name: 'PDF' },
    { id: 'docx', name: 'DOCX' },
    { id: 'latex', name: 'TEX' },
];

export const ExportControls: React.FC<ExportControlsProps> = ({ content, topic }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [format, setFormat] = useState<ExportFormat>('markdown');
    const [template, setTemplate] = useState<Template>('default');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportDocument(format, template, content, topic);
        } catch (error) {
            console.error('Export failed:', error);
            // Here you could set an error state to show in the UI
        } finally {
            setIsExporting(false);
            setShowOptions(false);
        }
    };

    const isTemplateSelectionDisabled = format === 'markdown' || format === 'latex';

    if (!showOptions) {
        return (
            <button
                onClick={() => setShowOptions(true)}
                className="h-9 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
                <DownloadIcon className="w-4 h-4" />
                <span className="ml-2">Export</span>
            </button>
        );
    }
    
    return (
        <div className="bg-muted border border-border rounded-lg p-2 flex flex-col gap-2 shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="grid grid-cols-2 gap-1">
                <label className="text-xs font-medium text-muted-foreground col-span-2">Format</label>
                 {FORMATS.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-2 transition-colors ${format === f.id ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
                    >
                        {f.name}
                    </button>
                ))}
            </div>
            
            <div className="flex flex-col gap-1">
                <label htmlFor="template" className={`text-xs font-medium text-muted-foreground ${isTemplateSelectionDisabled ? 'opacity-50' : ''}`}>Template</label>
                 <select
                    id="template"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as Template)}
                    disabled={isTemplateSelectionDisabled}
                    className="h-7 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                 >
                    {Object.entries(TEMPLATES).map(([key, { name }]) => (
                        <option key={key} value={key}>{name}</option>
                    ))}
                 </select>
            </div>

            <div className="flex items-center gap-2 mt-1">
                <button
                    onClick={() => setShowOptions(false)}
                    className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                    Cancel
                </button>
                 <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {isExporting ? 'Exporting...' : 'Download'}
                </button>
            </div>
        </div>
    );
};