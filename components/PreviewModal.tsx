import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { marked } from 'marked';
import type { ExportFormat, Template } from '../types';
import { TEMPLATES } from '../constants';
import { exportDocument } from '../services/exportService';
import { DownloadIcon } from './Icons';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    topic: string;
}

const FORMATS: { id: ExportFormat; name: string }[] = [
    { id: 'pdf', name: 'PDF' },
    { id: 'docx', name: 'DOCX' },
    { id: 'markdown', name: 'Markdown' },
    { id: 'latex', name: 'LaTeX' },
];

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, content, topic }) => {
    const [format, setFormat] = useState<ExportFormat>('pdf');
    const [template, setTemplate] = useState<Template>('default');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportDocument(format, template, content, topic);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
            onClose();
        }
    };
    
    const templateStyle = useMemo(() => {
        const { style } = TEMPLATES[template];
        return {
            fontFamily: style.fontFamily,
            fontSize: `${style.fontSize}px`,
            lineHeight: style.lineHeight,
        };
    }, [template]);

    const isTemplateSelectionDisabled = format === 'markdown' || format === 'latex';
    
    const cleanContent = useMemo(() => content.replace(/---[\s\S]*?---/, '').trim(), [content]);
    const previewHtml = useMemo(() => marked.parse(cleanContent), [cleanContent]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <>
            <div className="modal-backdrop animate-in fade-in-0" onClick={onClose}></div>
            <div className="modal-content bg-card border border-border rounded-lg shadow-2xl w-[90vw] max-w-4xl h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
                <header className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-semibold">Export Preview</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </header>
                
                <div className="flex-grow p-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 overflow-hidden">
                    {/* Controls */}
                    <div className="flex flex-col gap-6">
                         <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-muted-foreground">Format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                                className="h-9 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {FORMATS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        
                         <div className="flex flex-col gap-2">
                            <label className={`text-sm font-medium text-muted-foreground transition-opacity ${isTemplateSelectionDisabled ? 'opacity-50' : ''}`}>Template</label>
                             <select
                                value={template}
                                onChange={(e) => setTemplate(e.target.value as Template)}
                                disabled={isTemplateSelectionDisabled}
                                className="h-9 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                {Object.entries(TEMPLATES).map(([key, { name }]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                             </select>
                             <p className={`text-xs text-muted-foreground transition-opacity ${isTemplateSelectionDisabled ? 'opacity-50' : ''}`}>
                                 Styling only applies to PDF & DOCX formats.
                             </p>
                        </div>

                         <div className="mt-auto">
                             <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {isExporting ? 'Exporting...' : <><DownloadIcon className="w-4 h-4 mr-2"/> Download {FORMATS.find(f=>f.id===format)?.name}</>}
                            </button>
                         </div>
                    </div>

                    {/* Preview Pane */}
                    <div className="bg-background/50 border border-input rounded-md overflow-hidden">
                         <div className="h-full overflow-y-auto p-8 bg-white text-black">
                             <div 
                                style={templateStyle}
                                className="preview-content"
                                dangerouslySetInnerHTML={{ __html: previewHtml }} 
                             />
                         </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};
