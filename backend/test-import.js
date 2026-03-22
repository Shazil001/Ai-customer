import * as pdfParseModule from 'pdf-parse';

console.log('pdfParseModule:', Object.keys(pdfParseModule));
console.log('typeof pdfParseModule.default:', typeof pdfParseModule.default);
if (pdfParseModule.default) {
   console.log('default properties:', Object.keys(pdfParseModule.default));
}
