import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/app/shared/supabaseClient";
import AuthLayout from "@/app/shared/components/AuthLayout";
import { Input } from "@/app/shared/ui/input";
import { Label } from "@/app/shared/ui/label";
import { Button } from "@/app/shared/ui/button";

export default function ClientLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const u = (username || "").trim();
    const p = (password || "").trim();

    if (!u || !p) {
      setError("Invalid username or password");
      return;
    }

    // Call server-side login endpoint which uses the service role key to query the clients table.
    try {
      console.log('[login] POST /api/client/login', { url: '/api/client/login' });
      const resp = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: u, password: p }),
      });

      console.log('[login] response status', resp.status);
      const text = await resp.text();
      console.log('[login] response body text', text);

      if (resp.status === 404) {
        setError('Login API not found (404). Server route missing.');
        return;
      }
      if (resp.status === 500) {
        setError('Server error (500). Check API logs.');
        return;
      }

      let body: any = {};
      try { body = JSON.parse(text); } catch (e) { body = {}; }

      if (!resp.ok) {
        setError(body?.error ?? 'Invalid username or password');
        return;
      }

      // store minimal session info locally for UI scoping
      try {
        if (body.client_id) localStorage.setItem('client_id', String(body.client_id));
        localStorage.setItem('role', 'client');
      } catch {}

      console.log('[login] success, redirecting');
      navigate('/internet/client/dashboard');
    } catch (err) {
      console.error('Login request failed', err);
      setError('Invalid username or password');
    }
  }

  return (
    <AuthLayout title="Client Login">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-white">Username</Label>
          <Input id="username" name="username" value={username} onChange={(e)=>setUsername(e.target.value)} className="bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400] focus:ring-[#F5C400]" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">Password</Label>
          <Input id="password" name="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400] focus:ring-[#F5C400]" />
        </div>

        {error && <div className="rounded-md border border-[#EA5455]/40 bg-[#EA5455]/10 px-4 py-3 text-sm text-[#EA5455]">{error}</div>}

        <Button type="submit" className="w-full bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F] font-semibold py-6 shadow-lg shadow-[#F5C400]/20 disabled:opacity-70">Sign in</Button>
      </form>
    </AuthLayout>
  );
}
