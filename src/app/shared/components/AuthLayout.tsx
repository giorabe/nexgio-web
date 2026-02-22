import React from "react";
import Logo from "@/assets/NexGio LOGO B.png";

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AuthLayout({ title, children }: AuthLayoutProps) {
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
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at center, transparent 0%, #0F0F0F 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 mb-6 shadow-lg shadow-[#F5C400]/20">
            <img src={Logo} alt="NexGio Logo" className="w-20 h-auto rounded-xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">NexGio Solutions</h1>
          <p className="text-[#A0A0A0] text-lg">Where Connection Meets Creation.</p>
        </div>

        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">{title}</h2>
          {children}
        </div>

        <p className="text-center text-[#A0A0A0] text-sm mt-8">© 2026 NexGio Solutions. All rights reserved.</p>
      </div>
    </div>
  );
}
