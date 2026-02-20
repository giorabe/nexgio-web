interface StatusBadgeProps {
  status: "active" | "late" | "suspended" | "paid" | "pending" | "overdue";
  children?: React.ReactNode;
}

export default function StatusBadge({ status, children }: StatusBadgeProps) {
  const variants = {
    active: "bg-[#28C76F]/10 text-[#28C76F] border-[#28C76F]/20",
    late: "bg-[#FF9F43]/10 text-[#FF9F43] border-[#FF9F43]/20",
    suspended: "bg-[#EA5455]/10 text-[#EA5455] border-[#EA5455]/20",
    paid: "bg-[#28C76F]/10 text-[#28C76F] border-[#28C76F]/20",
    pending: "bg-[#FF9F43]/10 text-[#FF9F43] border-[#FF9F43]/20",
    overdue: "bg-[#EA5455]/10 text-[#EA5455] border-[#EA5455]/20",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variants[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2" />
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
