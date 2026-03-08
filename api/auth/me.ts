import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

/**
 * Returns the currently authenticated user based on the token cookie.
 *
 * This function reads the `token` cookie, verifies it using the JWT secret,
 * and returns the decoded payload. If no valid token is present the request
 * is rejected with a 401.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';
  try {
    const cookie = req.headers.cookie || '';
    const tokenCookie = cookie
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('token='));
    if (!tokenCookie) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const token = tokenCookie.substring('token='.length);
    const user = jwt.verify(token, JWT_SECRET) as any;
    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Not authenticated' });
  }
}