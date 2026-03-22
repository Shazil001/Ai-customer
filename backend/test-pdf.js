import fs from 'fs';
import * as pdfParseModule from 'pdf-parse';
const pdfParse = pdfParseModule.default || pdfParseModule;

async function testPdfParse() {
  try {
    // I need a dummy PDF to test. Since I can't generate a raw correct PDF easily by typing text, 
    // I'll check if pdf-parse crashes when passed a fake buffer.
    const fakeBuffer = Buffer.from('this is not a real pdf');
    await pdfParse(fakeBuffer);
    console.log('Parsed successfully');
  } catch (err) {
    console.error('Crash error:', err.message);
  }
}
testPdfParse();
