import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/app/shared/ui/input";
import { Button } from "@/app/shared/ui/button";
import Logo from "@/assets/NexGio LOGO B.png";
import { authenticateClient } from "@/app/modules/internet/admin/services/clients.service";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const params = new URLSearchParams(location.search);
      const next = params.get("next") || "/client/dashboard";

      const { data, error } = await authenticateClient(username.trim(), password);
      setLoading(false);

      if (error || !data) {
        setErrorMsg("Invalid username or password.");
        return;
      }

      try {
        localStorage.setItem("clientId", data.id ?? data.account_username);
      } catch {}

      navigate(next);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message ?? String(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5C400]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F5C400]/5 rounded-full blur-3xl" />
        {/* WiFi signal illustration */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-10">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 border-4 border-[#F5C400] rounded-full animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-8 border-4 border-[#F5C400] rounded-full animate-ping" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
            <div className="absolute inset-16 border-4 border-[#F5C400] rounded-full animate-ping" style={{ animationDuration: "3s", animationDelay: "1s" }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={() => navigate("/client/services")}
            className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#F5C400] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to services</span>
          </button>

          {/* Login card */}
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
            {/* Logo and title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 mb-4 shadow-lg shadow-[#F5C400]/50">
                <img src={Logo} alt="NexGio Logo" className="w-16 h-auto" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Client Portal Login</h1>
              <p className="text-[#A0A0A0]">Access your NexGio internet account</p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-white">
                  Username or Account ID
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400] h-12"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-white">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400] h-12 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#F5C400] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me and forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#2A2A2A] bg-[#161616] text-[#F5C400] focus:ring-[#F5C400] focus:ring-offset-[#1E1E1E]"
                  />
                  <span className="text-sm text-[#A0A0A0]">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotMessage("Please contact your administrator to reset your password or username.")}
                  className="text-sm text-[#F5C400] hover:text-[#F5C400]/80 transition-colors"
                >
                  Forgot password or username?
                </button>
              </div>

              {/* Login button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F] font-semibold text-base shadow-lg shadow-[#F5C400]/30 disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login to Portal"}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              {forgotMessage && (
                <div className="rounded-md border border-[#F5C400]/30 bg-[#F5C400]/10 px-4 py-3 text-sm text-[#F5C400]">
                  {forgotMessage}
                </div>
              )}
              {errorMsg && (
                <div className="rounded-md border border-[#EA5455]/40 bg-[#EA5455]/10 px-4 py-3 text-sm text-[#EA5455] mt-4">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* Additional info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#A0A0A0]">
              By logging in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}