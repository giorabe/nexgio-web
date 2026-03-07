import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/app/shared/components/AuthLayout";
import { Button } from "@/app/shared/ui/button";
import { Input } from "@/app/shared/ui/input";
import { Label } from "@/app/shared/ui/label";
import { supabase } from "@/app/shared/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<{ accessToken?: string; refreshToken?: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.location.hash && window.location.hash.startsWith("#") ? `?${window.location.hash.slice(1)}` : window.location.search;
      const params = new URLSearchParams(raw);
      const type = params.get("type");
      if (type === "recovery") {
        const accessToken = params.get("access_token") || params.get("access-token");
        const refreshToken = params.get("refresh_token");
        setRecovery({ accessToken: accessToken ?? undefined, refreshToken: refreshToken ?? undefined });
        const clean = window.location.origin + window.location.pathname + window.location.search;
        window.history.replaceState({}, document.title, clean);
      }
    } catch (err) {
      console.error("Error parsing recovery params", err);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!newPassword) {
      setMsg("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (!recovery?.accessToken) {
        setMsg("Invalid or expired recovery link.");
        return;
      }

      await supabase.auth.setSession({ access_token: recovery.accessToken!, refresh_token: recovery.refreshToken ?? "" });
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setMsg(error.message);
        return;
      }

      await supabase.auth.signOut();
      setMsg("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-white">New Password</Label>
          <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-[#161616] border-[#2A2A2A] text-white" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
          <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-[#161616] border-[#2A2A2A] text-white" />
        </div>

        {msg && <div className="rounded-md border border-[#F5C400]/30 bg-[#F5C400]/10 px-4 py-3 text-sm text-[#F5C400]">{msg}</div>}

        <Button type="submit" disabled={loading} className="w-full bg-[#F5C400] py-4">{loading ? "Updating..." : "Set new password"}</Button>
      </form>
    </AuthLayout>
  );
}
