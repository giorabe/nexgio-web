import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    const body = await parseJsonBody(req);
    const username = (body?.username || '').toString().trim();
    const password = (body?.password || '').toString().trim();

    console.log('[api/client/login] received username:', username);

    if (!username || !password) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing username or password' }));
      return;
    }

    // Query clients table using service role key
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('account_username', username)
      .eq('account_password', password)
      .maybeSingle();

    console.log('[api/client/login] query result:', { data: !!data, error: error ? error.message : null });

    if (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message }));
      return;
    }

    if (!data) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid username or password' }));
      return;
    }

    // Don't return password in response
    const clientRow = { ...data } as any;
    if (clientRow.account_password) delete clientRow.account_password;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, client_id: data.id, data: clientRow }));
  } catch (err: any) {
    console.error('[api/client/login] handler error', err?.message || err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server error' }));
  }
}
