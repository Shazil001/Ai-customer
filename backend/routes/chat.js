import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  // Truncate the 3072 dimension vector down to 768 (Matryoshka representation)
  return result.embedding.values.slice(0, 768);
}

// GET /api/chat/history/:documentId - load chat history
router.get('/history/:documentId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, role, content, source_doc, created_at FROM messages
       WHERE user_id = $1 AND document_id = $2
       ORDER BY created_at ASC`,
      [req.userId, req.params.documentId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// POST /api/chat - send a message and get AI response (RAG)
router.post('/', requireAuth, async (req, res) => {
  const { question, documentId } = req.body;
  if (!question || !documentId) {
    return res.status(400).json({ error: 'question and documentId are required' });
  }

  try {
    // Verify document belongs to user
    const docCheck = await pool.query(
      `SELECT id, name FROM documents WHERE id = $1 AND user_id = $2`,
      [documentId, req.userId]
    );
    if (docCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const docName = docCheck.rows[0].name;

    // Convert question to embedding
    const questionEmbedding = await getEmbedding(question);
    const vectorStr = `[${questionEmbedding.join(',')}]`;

    // Similarity search — top 5 chunks via pgvector <=> operator
    const similar = await pool.query(
      `SELECT text, 1 - (vector <=> $1::vector) AS similarity
       FROM embeddings
       WHERE document_id = $2
       ORDER BY vector <=> $1::vector
       LIMIT 5`,
      [vectorStr, documentId]
    );

    const context = similar.rows.map((r) => r.text).join('\n\n');

    if (!context) {
      return res.json({
        answer: "I couldn't find relevant content in the document to answer your question.",
        sourceDoc: docName,
      });
    }

    // Build prompt for real RAG
    const systemPrompt = `You are a helpful assistant that answers questions based ONLY on the provided document context.
If the answer is NOT in the context, say "I don't know based on the provided document." 
Be concise and accurate. Do NOT use outside knowledge.`;

    const userPrompt = `Context from document "${docName}":\n\n${context}\n\nQuestion: ${question}`;

    // Call Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });
    
    const result = await model.generateContent(userPrompt);
    const answer = result.response.text();

    // Save message pair to DB
    await pool.query(
      `INSERT INTO messages (user_id, document_id, role, content) VALUES ($1, $2, 'user', $3)`,
      [req.userId, documentId, question]
    );
    await pool.query(
      `INSERT INTO messages (user_id, document_id, role, content, source_doc) VALUES ($1, $2, 'assistant', $3, $4)`,
      [req.userId, documentId, answer, docName]
    );

    res.json({ answer, sourceDoc: docName });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: `AI error: ${err.message}` });
  }
});

export default router;
