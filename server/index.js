import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const JWT_SECRET = process.env.SERVER_JWT_SECRET || "dev-secret";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase service env vars. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// session helpers removed (were used by client endpoints)

// Login: verify against clients table
// Client API endpoints removed as part of rollback to prior project state.
// If you need a local dev backend, restore these endpoints or use the server/api/ files.

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`Client API server listening on ${PORT}`);
});
