const puppeteer = require('puppeteer');
const HTMLtoDOCX = require('html-to-docx');

// Wraps note content in minimal HTML page for PDF rendering
const buildHtmlDocument = (title, content) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 14px;
            line-height: 1.7;
            margin: 40px 60px;
            color: #1a1a1a;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 8px;
            color: #4a1538;
          }
          hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 16px 0 24px;
          }
          img {
            max-width: 100%;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          td, th {
            border: 1px solid #ccc;
            padding: 6px 10px;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <hr />
        ${content || '<p><em>This note has no content.</em></p>'}
      </body>
    </html>
  `;
};

// Generates PDF buffer from the note's HTML content
const generatePdf = async (title, content) => {
  const htmlContent = buildHtmlDocument(title, content);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

// Generates DOCX buffer from the note's HTML content
const generateDocx = async (title, content) => {
  const htmlContent = buildHtmlDocument(title, content);
  const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
    title,
    margin: { top: 1440, bottom: 1440, right: 1440, left: 1440 },
  });
  return docxBuffer;
};

module.exports = { generatePdf, generateDocx };