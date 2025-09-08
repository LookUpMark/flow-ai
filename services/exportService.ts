import { jsPDF } from 'jspdf';

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
        html2canvas: {
            backgroundColor: '#FFFFFF', // Force a white background for the PDF export
        }
    });
};