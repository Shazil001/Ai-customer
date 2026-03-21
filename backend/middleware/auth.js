import { createClerkClient } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';
import pool from '../db.js';

dotenv.config();

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token with Clerk
    const payload = await clerk.verifyToken(token);
    const userId = payload.sub;

    // Get user details from Clerk to sync in our DB
    const clerkUser = await clerk.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    // Upsert user into our DB
    await pool.query(
      `INSERT INTO users (id, email) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [userId, email]
    );

    req.userId = userId;
    req.userEmail = email;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
