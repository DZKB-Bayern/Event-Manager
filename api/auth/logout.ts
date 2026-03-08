import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Clears the authentication cookie and returns a success message.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Expire the token cookie immediately. We use SameSite Lax for safety.
  const cookieParts = [
    'token=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ];
  if (process.env.NODE_ENV === 'production') {
    cookieParts.push('Secure');
  }
  res.setHeader('Set-Cookie', cookieParts.join('; '));
  res.status(200).json({ message: 'Logged out' });
}