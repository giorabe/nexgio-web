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
    console.log("[DEBUG] /api/client/change-password: req.body", req.body);
    const { identifier, currentPassword, newPassword } = req.body ?? {};
    console.log("[DEBUG] /api/client/change-password: identifier", identifier);
    if (!identifier || !newPassword) {
      console.log("[DEBUG] Missing identifier or newPassword", { identifier, newPassword });
      return res.status(400).json({ error: "Missing identifier or newPassword" });
    }

    const match = identifier.account_username ? { account_username: String(identifier.account_username) } : { id: identifier.id };
    console.log("[DEBUG] /api/client/change-password: match", match);
    const { data: existing, error: fetchErr } = await supabase.from("clients").select("id,account_password").match(match).single();
    console.log("[DEBUG] /api/client/change-password: fetched client", { existing, fetchErr });
    if (fetchErr) {
      console.log("[DEBUG] fetchErr", fetchErr);
      return res.status(500).json({ error: fetchErr.message });
    }
    if (!existing) {
      console.log("[DEBUG] Client not found for match", match);
      return res.status(404).json({ error: "Client not found" });
    }

    // Removed current password matching for simple edit mode

    const { data, error } = await supabase.from("clients").update({ account_password: newPassword }).match({ id: existing.id }).select().single();
    console.log("[DEBUG] /api/client/change-password: update result", { data, error });
    if (error) {
      console.log("[DEBUG] update error", error);
      return res.status(500).json({ error: error.message });
    }
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
