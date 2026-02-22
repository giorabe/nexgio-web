Client auth serverless endpoints

Required environment variables (set these in Vercel):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- CLIENT_SESSION_SECRET

Short local testing note:
- Vite alone does not serve Vercel serverless `/api` routes.
- Recommended: use `npx vercel dev` at the repo root to run serverless functions locally (then open the Vercel dev URL and run the SPA there).
- Alternative: run a local backend that exposes the same `/api` endpoints and point the Vite proxy to it (see `vite.config.ts`).

Install runtime deps before testing locally:

```bash
npm install
```

Security:
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `CLIENT_SESSION_SECRET` only in server environment variables.
- This implementation uses HS256-signed tokens via `jose`. Consider stronger key management and hashed passwords for production.
