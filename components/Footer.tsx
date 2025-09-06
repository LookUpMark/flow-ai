import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-background/50 mt-auto">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                    Powered by Google Gemini. Designed for clarity and knowledge synthesis.
                </p>
            </div>
        </footer>
    );
};