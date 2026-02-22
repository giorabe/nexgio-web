import { useNavigate } from "react-router-dom";
import { Wifi, Palette, Wrench } from "lucide-react";

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  onClick?: () => void;
}

function ServiceCard({ icon, title, description, disabled, onClick }: ServiceCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group p-8 rounded-xl border-2 transition-all duration-300 text-left ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 bg-[#161616] text-[#F5C400]">
        {icon}
      </div>

      <h3 className="text-2xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-[#A0A0A0] leading-relaxed">{description}</p>

      <div className="mt-6 flex items-center text-[#F5C400] font-medium">
        <span className="group-hover:translate-x-1 transition-transform">
          {disabled ? "Coming Soon" : "Continue →"}
        </span>
      </div>
    </button>
  );
}

export default function ClientServiceSelector() {
  const navigate = useNavigate();

  const services = [
    {
      icon: <Wifi className="w-8 h-8" />,
      title: "Internet",
      description: "Access your invoices, payments and account details.",
      disabled: false,
      path: "/internet/client/login",
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Design",
      description: "Coming Soon",
      disabled: true,
      path: "#",
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Repair",
      description: "Coming Soon",
      disabled: true,
      path: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 mb-6">
            <Wifi className="w-8 h-8 text-[#0F0F0F]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Client Services</h1>
          <p className="text-[#A0A0A0] text-lg max-w-2xl mx-auto">Choose the client-facing service area to continue.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              disabled={service.disabled}
              onClick={() => !service.disabled && navigate(service.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
