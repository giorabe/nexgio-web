import { NowRequest, NowResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const CLIENT_SESSION_SECRET = process.env.CLIENT_SESSION_SECRET as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function parseCookie(header?: string) {
  if (!header) return {};
  return header.split(';').map(p => p.trim()).reduce((acc: any, part) => {
    const [k, v] = part.split('='); acc[k] = v; return acc;
  }, {});
}

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    const cookies = parseCookie(req.headers.cookie);
    const token = cookies['client_session'];
    if (!token) return res.status(401).json({ error: 'Invalid session' });

    if (!CLIENT_SESSION_SECRET) {
      console.error('Missing CLIENT_SESSION_SECRET');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const secret = new TextEncoder().encode(CLIENT_SESSION_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const clientId = (payload as any).client_id || payload.sub;
    if (!clientId) return res.status(401).json({ error: 'Invalid session' });

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, room, tier_id, status, start_date, next_due_date, contact, email, account_username')
      .eq('id', clientId)
      .maybeSingle();

    if (error) {
      console.error('[api/me] supabase error', error.message);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!data) return res.status(401).json({ error: 'Invalid session' });

    return res.status(200).json({ client: data });
  } catch (err: any) {
    console.error('[api/me] error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
