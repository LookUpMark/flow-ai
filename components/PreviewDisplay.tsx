import React, { useState, useRef, useEffect } from 'react';
import { DownloadIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from './Icons';

interface PreviewDisplayProps {
    htmlContent: string;
    topic: string;
}

export const PreviewDisplay: React.FC<PreviewDisplayProps> = ({ htmlContent, topic }) => {
    const [copied, setCopied] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleDownloadHtml = () => {
        if (htmlContent) {
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${topic || 'preview'}.html`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const handleOpenInNewTab = () => {
        if (htmlContent) {
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        }
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
                    onClick={handleDownloadHtml}
                    disabled={!htmlContent}
                    className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Download HTML
                </button>
                <button
                    onClick={handleOpenInNewTab}
                    disabled={!htmlContent}
                    className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                    <ExternalLinkIcon className="w-4 h-4 mr-2" />
                    Open in New Tab
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