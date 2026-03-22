import pdfParse from 'pdf-parse';

async function testPdf() {
  console.log('typeof pdfParse:', typeof pdfParse);
  if (typeof pdfParse === 'function') {
    try {
      await pdfParse(Buffer.from('not a real pdf'));
      console.log('Worked!');
    } catch (e) {
      console.error('Caught error expected for fake pdf:', e.message);
    }
  } else {
    console.log('Keys of pdfParse:', Object.keys(pdfParse));
  }
}
testPdf();
