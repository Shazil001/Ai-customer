import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db.js';
import documentRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration for local and production
const allowedOrigins = [
  'http://localhost:5173', // Vite local
  /\.vercel\.app$/,        // Any Vercel subdomain
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      return allowed.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV || 'development',
    db_connected: true 
  });
});

// Robust startup
console.log('🚀 Starting AI Document Chat Server...');
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is LIVE and listening on port ${PORT}`);
      console.log(`👉 Backend URL: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('💥 FATAL ERROR during startup:', err.stack);
    process.exit(1);
  });
