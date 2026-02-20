import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../shared/ui/button";
import { Input } from "../shared/ui/input";
import { Label } from "../shared/ui/label";
import { Wifi } from "lucide-react";
import Logo from "@/assets/NexGio LOGO B.png";
import { signIn } from "@/app/modules/internet/admin/services/auth.service";

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
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0F0F0F] flex items-center justify-center">
      {/* Network Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(#F5C400 1px, transparent 1px),
              linear-gradient(90deg, #F5C400 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
        {/* Radial overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, transparent 0%, #0F0F0F 70%)",
          }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo and Tagline */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 mb-6 shadow-lg shadow-[#F5C400]/20">
            <img src={Logo} alt="NexGio Logo" className="w-20 h-auto rounded-xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            NexGio Solutions
          </h1>
          <p className="text-[#A0A0A0] text-lg">
            Where Connection Meets Creation.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Admin Login
          </h2>

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
        </div>

        <p className="text-center text-[#A0A0A0] text-sm mt-8">
          © 2026 NexGio Solutions. All rights reserved.
        </p>
      </div>
    </div>
  );
}