import React, { useState } from 'react';
import { DownloadIcon } from './Icons';
import { PreviewModal } from './PreviewModal';

interface ExportControlsProps {
    content: string;
    topic: string;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ content, topic }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="h-9 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
                <DownloadIcon className="w-4 h-4" />
                <span className="ml-2">Export</span>
            </button>

            <PreviewModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                content={content}
                topic={topic}
            />
        </>
    );
};
