import { useNavigate } from "react-router";
import { Wifi, Palette, Wrench } from "lucide-react";

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive?: boolean;
  onClick: () => void;
}

function ServiceCard({ icon, title, description, isActive, onClick }: ServiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative group p-8 rounded-xl border-2 transition-all duration-300 text-left
        ${
          isActive
            ? "bg-[#F5C400]/10 border-[#F5C400] shadow-lg shadow-[#F5C400]/20"
            : "bg-[#1E1E1E] border-[#2A2A2A] hover:border-[#F5C400]/50"
        }
      `}
    >
      {isActive && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-[#F5C400] text-[#0F0F0F] text-xs font-semibold rounded-full">
          Active
        </div>
      )}

      <div
        className={`
        inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 transition-colors
        ${
          isActive
            ? "bg-[#F5C400] text-[#0F0F0F]"
            : "bg-[#161616] text-[#F5C400] group-hover:bg-[#F5C400] group-hover:text-[#0F0F0F]"
        }
      `}
      >
        {icon}
      </div>

      <h3 className="text-2xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-[#A0A0A0] leading-relaxed">{description}</p>

      <div className="mt-6 flex items-center text-[#F5C400] font-medium">
        <span className="group-hover:translate-x-1 transition-transform">
          {isActive ? "Continue" : "Select Service"} →
        </span>
      </div>
    </button>
  );
}

export default function ServiceSelector() {
  const navigate = useNavigate();

  const services = [
    {
      icon: <Wifi className="w-8 h-8" />,
      title: "Internet Provider",
      description:
        "Manage clients, bandwidth plans, invoices, and payments for your WiFi internet service.",
      isActive: true,
      path: "/login",
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Design Services",
      description:
        "Manage design orders and creative projects for your clients.",
      path: "#",
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Repair Services",
      description:
        "Manage repair jobs and service requests efficiently.",
      path: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 mb-6">
            <Wifi className="w-8 h-8 text-[#0F0F0F]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to NexGio Admin Panel
          </h1>
          <p className="text-[#A0A0A0] text-lg max-w-2xl mx-auto">
            Select which service module you'd like to manage. You can switch
            between services anytime.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              isActive={service.isActive}
              onClick={() =>
                service.path !== "#" && navigate(service.path)
              }
            />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-[#A0A0A0] text-sm">
            Need help?{" "}
            <a href="#" className="text-[#F5C400] hover:text-[#F5C400]/80">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
