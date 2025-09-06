import saveAs from 'file-saver';
import type { ExportFormat, Template } from '../types';
import { TEMPLATES } from '../constants';
import { marked } from 'marked';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';


// TypeScript declarations for libraries loaded from CDN
declare const docx: any;

const generateSlug = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const exportMarkdown = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${fileName}.md`);
};

const exportPdf = (content: string, fileName: string, template: Template) => {
    const { style } = TEMPLATES[template];
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const page_width = pdf.internal.pageSize.getWidth();
    const margin = 50;
    const max_width = page_width - margin * 2;
    let y = margin;

    const checkPageBreak = (spaceNeeded: number) => {
        if (y + spaceNeeded > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            y = margin;
        }
    };

    const mdContent = content.replace(/---[\s\S]*?---/, '').trim();
    const lines = mdContent.split('\n');

    pdf.setFont(style.font, 'normal');

    for (const line of lines) {
        if (line.trim() === '') {
            const space = style.fontSize * style.lineHeight * 0.5;
            checkPageBreak(space);
            y += space;
            continue;
        }

        let currentSize = style.fontSize;
        let textToRender = line;
        
        pdf.setFont(style.font, 'normal'); // Reset to normal for each line

        if (line.startsWith('### ')) {
            currentSize = style.fontSize * 1.2;
            textToRender = line.substring(4);
            pdf.setFont(style.font, 'bold');
        } else if (line.startsWith('## ')) {
            currentSize = style.fontSize * 1.4;
            textToRender = line.substring(3);
            pdf.setFont(style.font, 'bold');
        } else if (line.startsWith('# ')) {
            currentSize = style.fontSize * 1.8;
            textToRender = line.substring(2);
            pdf.setFont(style.font, 'bold');
        } else if (line.trim().startsWith('* ')) {
            textToRender = `• ${line.trim().substring(2)}`;
        } else if (line.trim().match(/^\d+\.\s/)) {
            textToRender = `  ${line.trim()}`;
        }
        
        pdf.setFontSize(currentSize);
        const splitText = pdf.splitTextToSize(textToRender, max_width);
        
        const spaceForText = splitText.length * (currentSize * style.lineHeight * 0.7);

        checkPageBreak(spaceForText);
        
        pdf.text(splitText, margin, y, { lineHeightFactor: style.lineHeight * 0.7 });

        y += spaceForText + 4; // Add a small gap between lines
    }

    pdf.save(`${fileName}.pdf`);
};


const exportDocx = async (content: string, fileName: string, template: Template) => {
    const { style } = TEMPLATES[template];
    const paragraphs: (Paragraph | any)[] = [];

    const lines = content.replace(/---[\s\S]*?---/, '').split('\n');

    lines.forEach(line => {
        if (line.startsWith('### ')) {
            paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: line.substring(4), font: { name: style.font === 'times' ? 'Times New Roman' : 'Helvetica' } })], spacing: { after: 120 } }));
        } else if (line.startsWith('## ')) {
            paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: line.substring(3), font: { name: style.font === 'times' ? 'Times New Roman' : 'Helvetica' } })], spacing: { after: 150 } }));
        } else if (line.startsWith('# ')) {
            paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: line.substring(2), font: { name: style.font === 'times' ? 'Times New Roman' : 'Helvetica' } })], spacing: { after: 200 } }));
        } else if (line.startsWith('* ')) {
             paragraphs.push(new Paragraph({ text: line.substring(2), bullet: { level: 0 }, style: "default" }));
        } 
        else {
            paragraphs.push(new Paragraph({ children: [new TextRun(line)], style: "default" }));
        }
    });

    const doc = new Document({
        styles: {
            paragraphStyles: [{
                id: "default",
                name: "Default",
                run: {
                    size: style.fontSize * 2, // docx uses half-points
                    font: { name: style.font === 'times' ? 'Times New Roman' : 'Helvetica' },
                },
                paragraph: {
                    spacing: { line: style.lineHeight * 240 } // docx uses 1/240th of a line
                }
            }]
        },
        sections: [{ children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
};

const exportLatex = (content: string, fileName:string) => {
    const latexPreamble = `\\documentclass{article}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\title{${fileName.replace(/-/g, ' ')}}
\\author{Generated by Obsidian Knowledge Architect}
\\date{\\today}

\\begin{document}
\\maketitle

`;
    
    // Basic conversion from Markdown to LaTeX
    let latexContent = content
        .replace(/---[\s\S]*?---/, '') // Remove YAML
        .replace(/## (.*)/g, '\\section*{$1}')
        .replace(/### (.*)/g, '\\subsection*{$1}')
        .replace(/\*\*(.*)\*\*/g, '\\textbf{$1}')
        .replace(/\*(.*)\*/g, '\\textit{$1}')
        // Escape special LaTeX characters
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/\$/g, '\\$')
        .replace(/#/g, '\\#')
        .replace(/_/g, '\\_')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}');


    const latexPostamble = `
\\end{document}
`;
    
    const fullLatexDoc = `${latexPreamble}${latexContent}${latexPostamble}`;
    const blob = new Blob([fullLatexDoc], { type: 'application/x-latex;charset=utf-8' });
    saveAs(blob, `${fileName}.tex`);
};


export const exportDocument = async (
    format: ExportFormat,
    template: Template,
    content: string,
    topic: string
) => {
    const fileName = generateSlug(topic) || 'exported-note';

    switch (format) {
        case 'markdown':
            exportMarkdown(content, fileName);
            break;
        case 'pdf':
            exportPdf(content, fileName, template);
            break;
        case 'docx':
            await exportDocx(content, fileName, template);
            break;
        case 'latex':
            exportLatex(content, fileName);
            break;
        default:
            console.error('Unsupported export format');
    }
};