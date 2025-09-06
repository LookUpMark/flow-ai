import React, { useState, useRef, useEffect } from 'react';
import { exportPreviewToPdf } from '../services/exportService';
import { DownloadIcon, CopyIcon, CheckIcon } from './Icons';

interface PreviewDisplayProps {
    htmlContent: string;
    topic: string;
}

export const PreviewDisplay: React.FC<PreviewDisplayProps> = ({ htmlContent, topic }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [copied, setCopied] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleExport = async () => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow?.document.body) return;

        setIsExporting(true);

        // Wait for a short period to allow async libraries like Mermaid.js to render.
        setTimeout(async () => {
            try {
                // We pass the body of the iframe's document to the exporter
                await exportPreviewToPdf(iframe.contentWindow.document.body, topic);
            } catch (error) {
                console.error("PDF Export failed:", error);
            } finally {
                setIsExporting(false);
            }
        }, 500); // 500ms delay for rendering
    };

    const handleCopyHtml = () => {
        if (htmlContent) {
            navigator.clipboard.writeText(htmlContent);
            setCopied(true);
        }
    };

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    if (!htmlContent) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <h3 className="text-lg font-semibold">Generating styled HTML preview...</h3>
            </div>
        )
    }

    return (
        <div className="relative h-full flex flex-col">
            <div className="absolute top-[-0.5rem] right-[-0.5rem] z-10 flex items-center gap-2">
                 <button
                    onClick={handleCopyHtml}
                    disabled={!htmlContent}
                    className="h-9 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                 >
                    {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                    <span className="ml-2">{copied ? 'Copied!' : 'Copy HTML'}</span>
                </button>
                <button
                    onClick={handleExport}
                    disabled={isExporting || !htmlContent}
                    className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isExporting ? (
                        <>
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exporting...
                        </>
                    ) : (
                        <>
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Export to PDF
                        </>
                    )}
                </button>
            </div>

            <div className="flex-grow bg-background border border-input rounded-md overflow-hidden">
                 <iframe
                    ref={iframeRef}
                    srcDoc={htmlContent}
                    title="WYSIWYG Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin" // allow-scripts is needed for mermaid/mathjax
                />
            </div>
        </div>
    );
};