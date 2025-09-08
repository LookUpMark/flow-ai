import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { marked } from 'marked';
import type { Template } from '../types';
import { TEMPLATES } from '../constants';
import { DownloadIcon, ExternalLinkIcon } from './Icons';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    topic: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, content, topic }) => {
    const [template, setTemplate] = useState<Template>('default');

    const handleDownloadHtml = () => {
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${topic}</title>
                <style>
                    body {
                        font-family: ${templateStyle.fontFamily};
                        font-size: ${templateStyle.fontSize};
                        line-height: ${templateStyle.lineHeight};
                        padding: 2rem;
                    }
                </style>
            </head>
            <body>
                ${previewHtml}
            </body>
            </html>
        `;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${topic}.html`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleOpenInNewTab = () => {
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${topic}</title>
                <style>
                    body {
                        font-family: ${templateStyle.fontFamily};
                        font-size: ${templateStyle.fontSize};
                        line-height: ${templateStyle.lineHeight};
                        padding: 2rem;
                    }
                </style>
            </head>
            <body>
                ${previewHtml}
            </body>
            </html>
        `;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };
    
    const templateStyle = useMemo(() => {
        const { style } = TEMPLATES[template];
        return {
            fontFamily: style.fontFamily,
            fontSize: `${style.fontSize}px`,
            lineHeight: style.lineHeight,
        };
    }, [template]);

    const cleanContent = useMemo(() => content.replace(/---[\s\S]*?---/, '').trim(), [content]);
    const previewHtml = useMemo(() => marked.parse(cleanContent), [cleanContent]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <>
            <div className="modal-backdrop animate-in fade-in-0" onClick={onClose}></div>
            <div className="modal-content bg-card border border-border rounded-lg shadow-2xl w-[90vw] max-w-4xl h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
                <header className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-semibold">HTML Preview</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </header>
                
                <div className="flex-grow p-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 overflow-hidden">
                    {/* Controls */}
                    <div className="flex flex-col gap-6">
                         <div className="flex flex-col gap-2">
                            <label className='text-sm font-medium text-muted-foreground'>Template</label>
                             <select
                                value={template}
                                onChange={(e) => setTemplate(e.target.value as Template)}
                                className="h-9 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring"
                             >
                                {Object.entries(TEMPLATES).map(([key, { name }]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                             </select>
                        </div>

                         <div className="mt-auto flex flex-col gap-2">
                             <button
                                onClick={handleDownloadHtml}
                                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <DownloadIcon className="w-4 h-4 mr-2"/> Download HTML
                            </button>
                            <button
                                onClick={handleOpenInNewTab}
                                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                            >
                                <ExternalLinkIcon className="w-4 h-4 mr-2"/> Open in New Tab
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