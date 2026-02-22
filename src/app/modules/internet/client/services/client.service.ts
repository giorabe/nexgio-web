export async function login(username: string, password: string) {
  const res = await fetch("/api/client/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  return res;
}

export async function logout() {
  await fetch("/api/client/logout", { method: "POST", credentials: "include" });
}

export async function getDashboard() {
  const res = await fetch("/api/client/dashboard", { credentials: "include" });
  return res.json();
}

export async function getInvoices() {
  const res = await fetch("/api/client/invoices", { credentials: "include" });
  return res.json();
}

export async function getPayments() {
  const res = await fetch("/api/client/payments", { credentials: "include" });
  return res.json();
}

export async function getProfile() {
  const res = await fetch("/api/client/me", { credentials: "include" });
  return res.json();
}

export async function patchProfile(payload: any) {
  const res = await fetch("/api/client/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return res.json();
}
