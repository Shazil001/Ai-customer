import fs from 'fs';
import pool from './db.js';

// let's do a dry run of the logic
async function testLogic() {
  console.log('Testing upload logic internally...');
  const textFilePath = '../test_document.txt';

  try {
    const buffer = fs.readFileSync(textFilePath);
    console.log('Buffer size:', buffer.length);
    const text = buffer.toString('utf8');
    
    console.log('Text extracted:', text.substring(0, 50) + '...');
    
    if (!text || text.trim().length < 10) {
      console.error('Text extraction failed.');
      return;
    }
    
    // Test chunks
    function chunkText(text, chunkSize = 500, overlap = 50) {
      const chunks = [];
      let start = 0;
      while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end).trim());
        start += chunkSize - overlap;
      }
      return chunks.filter((c) => c.length > 20);
    }
    const chunks = chunkText(text);
    console.log('Chunks generated:', chunks.length);
    if (chunks.length > 0) {
      console.log('First chunk:', chunks[0]);
    }
    
    console.log('All local logic succeeded. The problem must be the OpenAI API key, Postgres pgvector DB connection, or foreign key (auth/users sync) when running in production environment.');
  } catch(e) {
    console.error('Logic threw Error:', e);
  }
}

testLogic();
