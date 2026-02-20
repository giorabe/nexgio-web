import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor = "#F5C400",
}: StatCardProps) {
  return (
    <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#F5C400]/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
        {trend && (
          <span
            className={`text-sm font-medium px-2 py-1 rounded ${
              trend.isPositive
                ? "text-[#28C76F] bg-[#28C76F]/10"
                : "text-[#EA5455] bg-[#EA5455]/10"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}
          </span>
        )}
      </div>
      <h3 className="text-[#A0A0A0] text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
