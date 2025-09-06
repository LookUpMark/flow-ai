import { jsPDF } from 'jspdf';
import type { ExportFormat, Template } from '../types';

const generateSlug = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const exportPreviewToPdf = async (element: HTMLElement, topic: string) => {
    const fileName = generateSlug(topic) || 'exported-note';
    
    // jsPDF uses 'pt' by default. An A4 page is 595.28 x 841.89 points.
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
    });

    await pdf.html(element, {
        callback: function (pdfInstance) {
            pdfInstance.save(`${fileName}.pdf`);
        },
        margin: [40, 40, 40, 40],
        autoPaging: 'text',
        width: 515, // A4 width (595) - margins (40*2)
        windowWidth: element.scrollWidth,
    });
};

// FIX: Add missing exportDocument function to resolve import error in PreviewModal.
export const exportDocument = async (format: ExportFormat, template: Template, content: string, topic: string) => {
    const slug = generateSlug(topic) || 'exported-note';
    const cleanMarkdown = content.replace(/---[\s\S]*?---/, '').trim();

    if (format === 'markdown') {
        const blob = new Blob([cleanMarkdown], { type: 'text/markdown;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${slug}.md`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
    }

    alert(`Export to ${format} is not yet implemented. Please use the PDF export from the Preview tab.`);
};
