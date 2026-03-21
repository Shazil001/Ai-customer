import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDB() {
  const client = await pool.connect();
  try {
    // Enable pgvector extension (REQUIRED: Make sure your DB supports this)
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Embeddings table (1536 dimensions for text-embedding-3-small)
    await client.query(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        vector vector(1536),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        source_doc TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('✅ PostgreSQL Database Initialized with pgvector');
  } finally {
    client.release();
  }
}

export default pool;
