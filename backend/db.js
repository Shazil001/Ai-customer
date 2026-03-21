import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // wait 5 seconds max for a connection
});

export async function initDB() {
  console.log('⏳ Connecting to PostgreSQL database...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL in environment variables.');
    throw new Error('DATABASE_URL environment variable is required');
  }

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connection to DB successful. Setting up vector schema...');

    // Enable pgvector extension (REQUIRED: Make sure your DB supports this)
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    } catch (e) {
      console.warn('⚠️  Could not create "vector" extension automatically. This may fail if your DB is missing pgvector.', e.message);
    }

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
  } catch (err) {
    console.error('❌ Database Initialization Error:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('👉 Suggestion: Check if your database host is correct and accessible.');
    } else if (err.message.includes('authentication failed')) {
      console.error('👉 Suggestion: Check if your DB password/username is correct.');
    }
    throw err; // Cause server crash so Render realizes there is a problem
  } finally {
    if (client) client.release();
  }
}

export default pool;
