import React, { useState, useRef } from 'react';
import { exportPreviewToPdf } from '../services/exportService';
import { DownloadIcon } from './Icons';

interface PreviewDisplayProps {
    htmlContent: string;
    topic: string;
}

export const PreviewDisplay: React.FC<PreviewDisplayProps> = ({ htmlContent, topic }) => {
    const [isExporting, setIsExporting] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    const handleExport = async () => {
        if (!previewRef.current) return;
        setIsExporting(true);
        try {
            await exportPreviewToPdf(previewRef.current, topic);
        } catch (error) {
            console.error("PDF Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    if (!htmlContent) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <h3 className="text-lg font-semibold">Preview will appear here once the pipeline is complete.</h3>
            </div>
        )
    }

    return (
        <div className="relative h-full flex flex-col">
            <div className="absolute top-[-0.5rem] right-[-0.5rem] z-10">
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isExporting ? (
                        <>
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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

            <div className="flex-grow overflow-y-auto bg-white text-black p-8 rounded-md">
                 <div
                    ref={previewRef}
                    className="preview-content"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </div>
        </div>
    );
};
