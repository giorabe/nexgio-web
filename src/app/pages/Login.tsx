import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../shared/ui/button";
import { Input } from "../shared/ui/input";
import { Label } from "../shared/ui/label";
import { signIn } from "@/app/modules/internet/admin/services/auth.service";
import AuthLayout from "@/app/shared/components/AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      } catch {}
      navigate("/dashboard");
    }
  };

  return (
    <AuthLayout title="Admin Login">
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
          <a
            href="#"
            className="text-sm text-[#F5C400] hover:text-[#F5C400]/80 transition-colors"
          >
            Forgot Password?
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}