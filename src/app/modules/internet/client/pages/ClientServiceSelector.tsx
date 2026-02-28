import { useNavigate } from "react-router-dom";
import { Button } from "@/app/shared/ui/button";
import { Wifi, Wrench, Printer, Repeat } from "lucide-react";
import Logo from "@/assets/NexGio LOGO B.png";

export default function ClientServiceSelector() {
  const navigate = useNavigate();

  const services = [
    {
      id: "internet",
      name: "Internet Service",
      description: "Manage your WiFi subscription, view invoices, and pay bills",
      icon: Wifi,
      color: "#F5C400",
      path: "/client/login?next=/client/dashboard",
    },
    {
      id: "repair",
      name: "Repair Services",
      description: "Track your device repairs and service requests",
      icon: Wrench,
      color: "#28C76F",
      path: "#",
      disabled: true,
    },
    {
      id: "printing",
      name: "Printing Services",
      description: "View printing jobs and order history",
      icon: Printer,
      color: "#FF9F43",
      path: "#",
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] via-[#161616] to-[#0F0F0F] flex items-center justify-center p-6">
      <div className="max-w-5xl w-full relative">
        {/* Switch to Admin button (top-right) */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-[#2A2A2A] text-[#F5C400] rounded-full hover:bg-white/10 transition-colors"
          >
            <Repeat className="w-4 h-4" />
            <span className="text-sm font-medium">Switch to Admin</span>
          </button>
        </div>
        {/* back button intentionally removed — client login is reached by selecting Internet */}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 flex items-center justify-center shadow-lg shadow-[#F5C400]/20">
              <img src={Logo} alt="NexGio Logo" className="w-16 h-auto" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Welcome to NexGio Client Portal</h1>
          <p className="text-lg text-[#A0A0A0]">
            Select a service to manage your account
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className={`bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-8 transition-all ${
                  service.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-[#F5C400]/30 hover:scale-105 cursor-pointer"
                }`}
                onClick={() => {
                  if (!service.disabled) {
                    navigate(service.path);
                  }
                }}
              >
                {/* Icon */}
                <div className="mb-6">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background: `linear-gradient(to bottom right, ${service.color}, ${service.color}CC)`,
                      boxShadow: `0 10px 40px ${service.color}33`,
                    }}
                  >
                    <Icon className="w-8 h-8 text-[#0F0F0F]" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white">{service.name}</h3>
                  <p className="text-[#A0A0A0] leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Button */}
                <div className="mt-6">
                  {service.disabled ? (
                    <div className="text-[#A0A0A0] text-sm font-medium">
                      Coming Soon
                    </div>
                  ) : (
                    <Button
                      onClick={() => navigate(service.path)}
                      className="w-full text-[#0F0F0F] font-semibold shadow-lg"
                      style={{
                        background: service.color,
                        boxShadow: `0 4px 14px ${service.color}33`,
                      }}
                    >
                      Access Portal
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[#A0A0A0] text-sm">
            © 2026 NexGio Solutions. Where Connection Meets Creation.
          </p>
        </div>
      </div>
    </div>
  );
}
