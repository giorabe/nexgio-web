import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://msufhiktdbuhwtaacfdy.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const JWT_SECRET = process.env.SERVER_JWT_SECRET || "dev-secret";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase service env vars. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// session helpers removed (were used by client endpoints)

// Login: verify against clients table
// Minimal Client API endpoints used by the frontend. These use the
// service role key and are intended for local dev only.

app.post("/api/client/update-profile", async (req, res) => {
  try {
    const { identifier, patch } = req.body ?? {};
    if (!identifier || !patch) return res.status(400).json({ error: "Missing identifier or patch" });

    // Build match object for supabase
    const match = identifier.account_username ? { account_username: String(identifier.account_username) } : { id: identifier.id };
    const { data, error } = await supabase.from("clients").update(patch).match(match).select().single();
    if (error) return res.status(500).json({ error: error.message, details: error });
    if (!data) return res.status(404).json({ error: "No row updated" });
    return res.json({ data });
  } catch (err) {
    console.error("/api/client/update-profile error", err);
    return res.status(500).json({ error: String(err) });
  }
});

app.post("/api/client/change-password", async (req, res) => {
  try {
    const { identifier, currentPassword, newPassword } = req.body ?? {};
    if (!identifier || !newPassword) return res.status(400).json({ error: "Missing identifier or newPassword" });

    const match = identifier.account_username ? { account_username: String(identifier.account_username) } : { id: identifier.id };
    const { data: existing, error: fetchErr } = await supabase.from("clients").select("id,account_password").match(match).single();
    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!existing) return res.status(404).json({ error: "Client not found" });

    // If a currentPassword is provided and the row has a password field, perform a basic check.
    if (currentPassword && existing.account_password && existing.account_password !== currentPassword) {
      return res.status(400).json({ error: "Current password does not match" });
    }

    const { data, error } = await supabase.from("clients").update({ account_password: newPassword }).match({ id: existing.id }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  } catch (err) {
    console.error("/api/client/change-password error", err);
    return res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`Client API server listening on ${PORT}`);
});
