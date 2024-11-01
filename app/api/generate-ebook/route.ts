import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { title, author, content } = await req.json();

    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();

    // Set the title and author metadata
    pdfDoc.setTitle(title);
    pdfDoc.setAuthor(author);

    // Embed a font
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // Set the font size and margins
    const fontSize = 12;
    const margin = 50;
    const lineHeight = 14; // Adjust line height based on fontSize

    // Add a page to the PDF document
    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();

    // Define a function to draw text and handle new page creation if needed
    const drawText = (text: string, x: number, y: number) => {
      const lines = text.split('\n');
      lines.forEach(line => {
        if (y <= margin) {
          page = pdfDoc.addPage();
          ({ width, height } = page.getSize());
          y = height - margin;
        }
        page.drawText(line, { x, y, size: fontSize, font: timesRomanFont, color: rgb(0, 0, 0) });
        y -= lineHeight;
      });
      return y;
    };

    // Start drawing text on the first page
    let yPosition = height - margin;

    // Add the title to the PDF
    yPosition = drawText(title, margin, yPosition - fontSize * 2);

    // Add the author to the PDF
    yPosition = drawText(`By: ${author}`, margin, yPosition - fontSize * 1.5);

    // Add a line break between the title/author and the content
    yPosition -= lineHeight * 2;

    // Add content chapters to the PDF
    for (let i = 0; i < content.length; i++) {
      const chapter = content[i];

      // Add chapter title
      yPosition = drawText(`Chapter ${i + 1}: ${chapter.title}`, margin, yPosition - fontSize * 2);

      // Add chapter content (split into lines to handle long text)
      const chapterContent = chapter.description;
      yPosition = drawText(chapterContent, margin, yPosition - fontSize * 1.5);

      // Add some space between chapters
      yPosition -= lineHeight * 2;
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Define the output path for the PDF
    const tempDir = path.join(process.cwd(), '.next', 'server', 'tempDir');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const pdfPath = path.join(tempDir, `${title.replace(/\s+/g, '_')}.pdf`);

    // Write the PDF to the temp directory
    fs.writeFileSync(pdfPath, pdfBytes);

    // Serve the PDF file for download
    const fileBuffer = fs.readFileSync(pdfPath);
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${path.basename(pdfPath)}"`,
    });

    // Send the PDF file as a response and delete it from the temp directory
    setTimeout(() => fs.unlinkSync(pdfPath), 5000); // Clean up after 5 seconds
    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return new NextResponse(JSON.stringify({ success: false, message: error.message }), { status: 500 });
  }
}
