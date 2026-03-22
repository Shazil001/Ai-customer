import express from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: split text into chunks of ~500 chars with overlap
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

// REAL HELPER: Generate embeddings via Gemini
async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  // Truncate the 3072 dimension vector down to 768 (Matryoshka representation) to fit our vector column limits
  return result.embedding.values.slice(0, 768);
}

// GET /api/documents - list user's documents
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, file_type, created_at FROM documents
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST /api/documents/upload - upload and process file
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const allowedTypes = ['application/pdf', 'text/plain'];
  if (!allowedTypes.includes(file.mimetype) && !file.originalname.endsWith('.txt')) {
    return res.status(400).json({ error: 'Only PDF and TXT files are allowed' });
  }

  try {
    let text = '';
    const fileType = file.mimetype === 'application/pdf' ? 'pdf' : 'txt';

    if (fileType === 'pdf') {
      const parser = new PDFParse({ data: file.buffer });
      const pdfData = await parser.getText();
      text = pdfData.text;
      await parser.destroy();
    } else {
      text = file.buffer.toString('utf8');
    }

    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    // Insert document record
    const docResult = await pool.query(
      `INSERT INTO documents (user_id, name, file_type) VALUES ($1, $2, $3) RETURNING id`,
      [req.userId, file.originalname, fileType]
    );
    const documentId = docResult.rows[0].id;

    // Chunk text and generate embeddings
    const chunks = chunkText(text);
    console.log(`🚀 Real processing for ${file.originalname}: ${chunks.length} embeddings being generated.`);
    
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);
      const vectorStr = `[${embedding.join(',')}]`;
      await pool.query(
        `INSERT INTO embeddings (document_id, text, vector) VALUES ($1, $2, $3::vector)`,
        [documentId, chunk, vectorStr]
      );
    }

    res.json({ id: documentId, name: file.originalname, chunks: chunks.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: `Upload failed: ${err.message || 'Unknown error'}` });
  }
});

// DELETE /api/documents/:id - delete a document
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
