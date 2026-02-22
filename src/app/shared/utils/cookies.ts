export type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  path?: string;
  maxAge?: number;
};

export function setCookieHeader(name: string, value: string, opts: CookieOptions = {}): string {
  const parts: string[] = [];
  parts.push(`${name}=${value}`);
  parts.push(`Path=${opts.path ?? '/'}`);
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (typeof opts.maxAge === 'number') parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookieHeader(name: string, opts: Partial<CookieOptions> = {}): string {
  return setCookieHeader(name, '', { ...opts, maxAge: 0 });
}
