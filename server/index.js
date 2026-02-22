import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
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

function signSession(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

function verifySession(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Login: verify against clients table
app.post("/api/client/login", async (req, res) => {
  const { username, password } = req.body;
  const u = (username || "").trim();
  const p = (password || "").trim();
  console.log("[login] input", { u, p });

  if (!u || !p) return res.status(400).json({ error: "Missing credentials" });

  // Strict, exact username match (trimmed). Select only the needed columns including password for comparison.
  const { data, error } = await supabase
    .from("clients")
    .select("id, account_username, account_password, room, tier_id, status, start_date, next_due_date")
    .eq("account_username", u)
    .maybeSingle();

  console.log("[login] supabase response", { data, error });

  if (error) {
    // If error looks like RLS or permission denied, log and return 500
    console.error("[login] supabase error", error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    console.log("[login] no client row found for", u);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Trim stored password as well to avoid hidden-space mismatches
  const storedPwd = (data.account_password || "").trim();
  console.log("[login] stored password (trimmed)", storedPwd ? "<redacted>" : "(empty)");
  const ok = storedPwd === p;
  console.log("[login] password match", ok);

  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signSession({ client_id: data.id });

  res.cookie("client_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
  });

  // Return minimal client info (no password)
  const { account_password, ...clientSafe } = data;
  return res.json({ ok: true, client: clientSafe, client_id: data.id });
});

app.post("/api/client/logout", (req, res) => {
  res.clearCookie("client_session");
  res.json({ ok: true });
});

// Middleware to authenticate session cookie
async function authMiddleware(req, res, next) {
  const token = req.cookies.client_session || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifySession(token);
  if (!payload || !payload.client_id) return res.status(401).json({ error: "Unauthorized" });
  req.client = { id: payload.client_id };
  next();
}

// Get profile
app.get("/api/client/me", authMiddleware, async (req, res) => {
  const clientId = req.client.id;
  const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// Patch profile (name, email, contact, account_username, account_password)
app.patch("/api/client/profile", authMiddleware, async (req, res) => {
  const clientId = req.client.id;
  const { name, email, contact, account_username, account_password } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (contact !== undefined) updates.contact = contact;
  if (account_username !== undefined) updates.account_username = account_username;
  if (account_password !== undefined) updates.account_password = account_password; // see security note

  const { data, error } = await supabase.from("clients").update(updates).eq("id", clientId).select().maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// Get invoices for client
app.get("/api/client/invoices", authMiddleware, async (req, res) => {
  const clientId = req.client.id;
  const { data, error } = await supabase.from("invoices").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// Get payments for client
app.get("/api/client/payments", authMiddleware, async (req, res) => {
  const clientId = req.client.id;
  const { data, error } = await supabase.from("payments").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// Dashboard summary
app.get("/api/client/dashboard", authMiddleware, async (req, res) => {
  const clientId = req.client.id;
  const { data: client, error: clientErr } = await supabase.from("clients").select("*, tiers(*)").eq("id", clientId).maybeSingle();
  if (clientErr) return res.status(500).json({ error: clientErr.message });

  const { data: invoices } = await supabase.from("invoices").select("amount,status,created_at,due_date").eq("client_id", clientId);
  const { data: payments } = await supabase.from("payments").select("amount,created_at").eq("client_id", clientId);

  const invoiceTotal = (invoices || []).reduce((s, i) => s + Number(i.amount || 0), 0);
  const paymentTotal = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const balance = invoiceTotal - paymentTotal;

  res.json({
    client,
    summary: {
      invoiceTotal,
      paymentTotal,
      balance,
      recentActivity: [ ...(invoices || []).slice(0,5), ...(payments || []).slice(0,5) ].sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)).slice(0,5),
    }
  });
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`Client API server listening on ${PORT}`);
});
