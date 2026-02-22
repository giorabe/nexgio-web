import { NowRequest, NowResponse } from '@vercel/node';
import { clearCookieHeader } from '../../src/app/shared/utils/cookies';

const COOKIE_NAME = 'client_session';

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    const secure = process.env.NODE_ENV === 'production';
    const cookie = clearCookieHeader(COOKIE_NAME, { path: '/', sameSite: 'Lax', httpOnly: true, secure });
    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[api/logout] error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
