import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../shared/ui/button";
import { Input } from "../shared/ui/input";
import { Label } from "../shared/ui/label";
import { signIn, recoverPassword } from "@/app/modules/internet/admin/services/auth.service";
import AuthLayout from "@/app/shared/components/AuthLayout";
import { supabase } from "@/app/shared/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<{ accessToken?: string; refreshToken?: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { data, error } = await signIn(email.trim(), password);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.session) {
      try {
        localStorage.setItem("role", "admin");
        // Record the login timestamp so we can enforce an absolute session expiry
        try {
          localStorage.setItem("loginAt", String(Date.now()));
        } catch {}
      } catch {}
      navigate("/dashboard");
    }
  };

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
        // remove tokens from URL without reloading
        const clean = window.location.origin + window.location.pathname + window.location.search;
        window.history.replaceState({}, document.title, clean);
      }
    } catch (err) {
      console.error("Error parsing recovery params", err);
    }
  }, []);

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetMsg(null);
    if (!newPassword) {
      setResetMsg("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetMsg("Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      if (!recovery?.accessToken) {
        setResetMsg("Invalid or expired recovery link.");
        return;
      }

      // Set the session from the recovery token so updateUser works
      await supabase.auth.setSession({ access_token: recovery.accessToken!, refresh_token: recovery.refreshToken ?? "" });

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setResetMsg(error.message);
        return;
      }

      // Optional: sign out to force a fresh login, and show success
      await supabase.auth.signOut();
      setResetMsg("Password updated. You can now log in with your new password.");
      setRecovery(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      setResetMsg(err?.message ?? String(err));
    } finally {
      setResetLoading(false);
    }
  };

  const handleForgot = async () => {
    setForgotMsg(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setForgotMsg("Please enter your email or username before requesting a reset.");
      return;
    }

    setLoading(true);
    try {
      const redirect = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
      const res = (await recoverPassword(trimmed, redirect)) as any;
      setLoading(false);
      console.log("recoverPassword response:", res);
      const { data, error } = res ?? {};
      if (error) {
        // Rate limit or other server-side issues
        const msg = error?.message ?? "Unable to send reset link. Please contact admin support.";
        if (/rate limit/i.test(msg)) {
          setForgotMsg("Password reset emails are temporarily rate-limited. Please wait a few minutes, or contact admin support to reset your password.");
        } else {
          setForgotMsg(msg);
        }
        return;
      }

      setForgotMsg("If an account with that email exists, a password reset link has been sent. Check your inbox or spam folder.");
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      setForgotMsg(err?.message ?? String(err) ?? "An unknown error occurred.");
    }
  };

  return (
    <AuthLayout title="Admin Login">
      {/* Back button to service selector */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#F5C400] transition-colors"
        >
          <span className="text-sm">← Back to Services</span>
        </button>
      </div>
      {recovery ? (
        <form onSubmit={handleResetSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-white">
              New Password
            </Label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400] focus:ring-[#F5C400]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-white">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400] focus:ring-[#F5C400]"
            />
          </div>

          {resetMsg && (
            <div className="rounded-md border border-[#F5C400]/30 bg-[#F5C400]/10 px-4 py-3 text-sm text-[#F5C400]">
              {resetMsg}
            </div>
          )}

          <Button
            type="submit"
            disabled={resetLoading}
            className="w-full bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F] font-semibold py-6 shadow-lg shadow-[#F5C400]/20 disabled:opacity-70"
          >
            {resetLoading ? "Updating..." : "Set new password"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setRecovery(null)}
              className="text-sm text-[#F5C400] hover:text-[#F5C400]/80 transition-colors"
            >
              Back to login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email / Username
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="admin@nexgio.com or admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400] focus:ring-[#F5C400]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400] focus:ring-[#F5C400]"
            />
          </div>

          {errorMsg && (
            <div className="rounded-md border border-[#EA5455]/40 bg-[#EA5455]/10 px-4 py-3 text-sm text-[#EA5455]">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F] font-semibold py-6 shadow-lg shadow-[#F5C400]/20 disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleForgot}
              className="text-sm text-[#F5C400] hover:text-[#F5C400]/80 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {forgotMsg && (
            <div className="mt-4 text-center">
              <div className="rounded-md border border-[#F5C400]/30 bg-[#F5C400]/10 px-4 py-3 text-sm text-[#F5C400]">
                {forgotMsg}
              </div>
            </div>
          )}
        </form>
      )}
    </AuthLayout>
  );
}