export function encodeSession(payload: Record<string, any>): string {
  try {
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString('base64');
  } catch (e) {
    return '';
  }
}

export function decodeSession(token?: string): Record<string, any> | null {
  if (!token) return null;
  try {
    const json = Buffer.from(token, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}
