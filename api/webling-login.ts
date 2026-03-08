import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

/**
 * Serverless function to authenticate a user via the Webling API.
 *
 * This function expects a JSON body containing a `member_id` string. It calls
 * the Webling REST API to fetch the corresponding member record and, if found,
 * issues a signed JWT and HTTP‑only cookie containing the user's identity.
 *
 * Required environment variables:
 * - WEBLING_API_KEY: your Webling API key.
 * - WEBLING_API_URL: base URL for your Webling instance (optional).
 * - JWT_SECRET: secret used to sign the JWT.
 *
 * On success, the response will include `{ user: { id, username, email, role } }`.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const WEBLING_API_KEY = process.env.WEBLING_API_KEY;
  const WEBLING_API_URL = process.env.WEBLING_API_URL || 'https://dzkbbayern.webling.eu/api/1';
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';

  try {
    const { member_id } = req.body || {};
    if (!member_id) {
      res.status(400).json({ error: 'member_id is required' });
      return;
    }
    if (!WEBLING_API_KEY) {
      res.status(500).json({ error: 'WEBLING_API_KEY is not configured' });
      return;
    }

    // Fetch member data from Webling. This call uses the API key as a query
    // parameter. Adjust as needed if your Webling instance expects the key
    // via HTTP basic auth or a header.
    const response = await fetch(`${WEBLING_API_URL}/member/${member_id}?apikey=${WEBLING_API_KEY}`);
    if (!response.ok) {
      res.status(401).json({ error: 'Mitglied nicht gefunden' });
      return;
    }

    const member = await response.json();
    const props = member.properties || {};
    const id: string = String(member.id ?? member.memberId ?? member.memberID ?? member_id);
    const firstname: string =
      props.Vorname ||
      props.vorname ||
      member.firstname ||
      member.firstName ||
      member.fields?.firstname ||
      member.fields?.firstName ||
      member.Vorname ||
      member.vorname ||
      member.fields?.Vorname ||
      member.fields?.vorname ||
      '';
    const lastname: string =
      props.Name ||
      props.name ||
      props.Nachname ||
      props.nachname ||
      member.lastname ||
      member.lastName ||
      member.fields?.lastname ||
      member.fields?.lastName ||
      member.Nachname ||
      member.nachname ||
      member.fields?.Nachname ||
      member.fields?.nachname ||
      '';
    const email: string | undefined =
      props['E-Mail'] ||
      props['E-mail'] ||
      props.email ||
      member.email ||
      member.fields?.email ||
      member.fields?.Email ||
      undefined;
    const fullName = `${firstname} ${lastname}`.trim();
    const username: string = fullName || email || `member-${id}`;
    const role = 'member';

    // Build a payload for the JWT. We include id, username, email and role.
    const payload = { id, username, email, role };

    // Sign the JWT. The expiration is set to 24 hours; adjust as needed.
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    // Top-level navigation from the portal works most reliably with Lax.
    const cookieParts = [
      `token=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Secure'
    ];
    res.setHeader('Set-Cookie', cookieParts.join('; '));
    res.status(200).json({ user: payload });
  } catch (err) {
    console.error('Webling login error', err);
    res.status(500).json({ error: 'Webling Login Fehler' });
  }
}