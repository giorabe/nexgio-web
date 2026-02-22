import { NowRequest, NowResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';
import { setCookieHeader } from '../../src/app/shared/utils/cookies';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const CLIENT_SESSION_SECRET = process.env.CLIENT_SESSION_SECRET as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const COOKIE_NAME = 'client_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export default async function handler(req: NowRequest, res: NowResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body || {};
    const u = (username || '').toString();
    const p = (password || '').toString();
    if (!u || !p) return res.status(401).json({ error: 'Invalid username or password' });

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, room, tier_id, status, start_date, next_due_date, contact, email, account_username, account_password')
      .eq('account_username', u)
      .maybeSingle();

    if (error) {
      console.error('[api/login] supabase error', error.message);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!data) return res.status(401).json({ error: 'Invalid username or password' });

    const stored = (data.account_password || '').toString();
    if (stored !== p) return res.status(401).json({ error: 'Invalid username or password' });

    if (!CLIENT_SESSION_SECRET) {
      console.error('Missing CLIENT_SESSION_SECRET');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const secret = new TextEncoder().encode(CLIENT_SESSION_SECRET);
    const token = await new SignJWT({ client_id: data.id, role: 'client' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(data.id))
      .setExpirationTime('7d')
      .sign(secret);

    const secure = process.env.NODE_ENV === 'production';
    const cookie = setCookieHeader(COOKIE_NAME, token, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: COOKIE_MAX_AGE, secure });
    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ client_id: data.id, ok: true });
  } catch (err: any) {
    console.error('[api/login] error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
