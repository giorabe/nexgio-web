import { Wifi, Zap, Users, TrendingUp, Check, ArrowRight } from "lucide-react";
import { Button } from "@/app/shared/ui/button";
import { useTiers } from "@/app/modules/internet/admin/hooks/useTiers";
import { useClientPortal } from "../hooks/useClientPortal";

// Defensive helper: resolve a client's tier from many possible shapes
function resolveClientTier(client: any, tiers: any[] = []) {
  if (!client) return null;

  const tierId =
    client.tier_id ??
    client.client_tier_id ??
    client.tierId ??
    client.id ?? // sometimes client object itself may have id referencing tier
    client.tier?.id ??
    null;

  const tierName =
    client.tier_name ??
    client.client_tier ??
    client.plan_name ??
    client.tier?.name ??
    null;

  // Try to find by id
  if (tierId) {
    const foundById = tiers.find((t) => String(t.id) === String(tierId));
    if (foundById) return { ...foundById, isCurrent: true };
  }

  // Try to find by name
  if (tierName) {
    const foundByName = tiers.find(
      (t) => String(t.name).toLowerCase() === String(tierName).toLowerCase()
    );
    if (foundByName) return { ...foundByName, isCurrent: true };
  }

  // If client has device/price info, synthesize a plan-like object
  if (client.tier_device_limit !== undefined || client.current_devices !== undefined || client.price !== undefined) {
    return {
      id: tierId ?? `client-${client.id ?? "unknown"}`,
      name: tierName ?? client.tier ?? "Client Plan",
      speed: client.speed ?? null,
      price: Number(client.price ?? 0),
      devices: Number(client.tier_device_limit ?? client.device_limit ?? client.devices ?? 0),
      features: [],
      isCurrent: true,
      isHighlighted: false,
    };
  }

  // Fallback null (component will handle default/fallback)
  return null;
}

export default function ClientServiceInfo() {
  const { tiers, loading: tiersLoading } = useTiers();
  const { client } = useClientPortal();

  // Debug: surface tiers loading/state to help diagnose empty list
  // Remove or reduce verbosity once verified in the browser console
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("ClientServiceInfo: tiers, loading", { tiers, tiersLoading });
  }

  // Map admin `tiers` to the UI shape used here
  // Accept either the UI-mapped shape (deviceLimit) or raw DB shape (device_limit)
  const availablePlans = (tiers ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    speed: t.speed,
    price: Number(t.price ?? 0),
    devices: t.deviceLimit ?? t.device_limit ?? 0,
    features: [],
    isCurrent: false,
    isHighlighted: false,
  }));

  // Try to detect current plan from client info (best-effort)
  const currentPlan = (() => {
    if (client) {
      // match by tier id first (client may store tier_id)
      const tierId = client.tier_id as string | undefined;
      if (tierId) {
        const byId = availablePlans.find((p) => p.id === tierId);
        if (byId) return { ...byId, isCurrent: true };
      }
      // match by name if available
      const name = (client.tier_name ?? client.client_tier ?? client.tier) as string | undefined;
      if (name) {
        const m = availablePlans.find((p) => p.name === name);
        if (m) return { ...m, isCurrent: true };
      }
    }
    // fallback to first highlighted or first plan
    if (availablePlans.length > 0) return { ...availablePlans[0], isCurrent: true };
    return { name: "—", speed: "—", price: 0, devices: 0 };
  })();

  const displayedPlans = availablePlans.map((p) => ({ ...p, isCurrent: p.id === (currentPlan as any).id || p.name === currentPlan.name }));

  const announcements = [
    {
      title: "Network Maintenance Schedule",
      date: "Feb 15, 2026",
      content: "Scheduled maintenance on February 20, 2026 from 2:00 AM to 4:00 AM. Minimal service interruption expected.",
      type: "info",
    },
    {
      title: "Speed Upgrade Promo",
      date: "Feb 10, 2026",
      content: "Upgrade to our Ultimate Plan and get 20% off for the first 3 months! Limited time offer.",
      type: "promo",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Current Plan Overview */}
      <div className="bg-gradient-to-br from-[#F5C400]/10 via-[#F5C400]/5 to-transparent border border-[#F5C400]/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[#F5C400] text-sm font-semibold mb-2">YOUR CURRENT PLAN</p>
            <h2 className="text-3xl font-bold text-white mb-2">{currentPlan.name}</h2>
            <div className="flex items-center gap-6 text-[#A0A0A0]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#F5C400]" />
                <span>{currentPlan.speed}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F5C400]" />
                <span>{currentPlan.devices} Devices</span>
              </div>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[#A0A0A0] text-sm mb-1">Monthly Fee</p>
            <p className="text-4xl font-bold text-white">₱{currentPlan.price}</p>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Available Internet Plans</h3>
          <p className="text-[#A0A0A0]">Choose the plan that fits your needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedPlans.length === 0 ? (
            <div className="col-span-1 md:col-span-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
              <p className="text-[#A0A0A0]">No plans found. Please check your tiers configuration or try reloading.</p>
            </div>
          ) : displayedPlans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 transition-all ${
                plan.isHighlighted
                  ? "bg-gradient-to-br from-[#F5C400]/10 to-[#F5C400]/5 border-2 border-[#F5C400] shadow-xl shadow-[#F5C400]/20 scale-105"
                  : "bg-[#1E1E1E] border border-[#2A2A2A] hover:border-[#F5C400]/50"
              }`}
            >
              {plan.isCurrent && (
                <div className="inline-block px-3 py-1 bg-[#F5C400] text-[#0F0F0F] text-xs font-semibold rounded-full mb-4">
                  Current Plan
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="text-2xl font-bold text-white mb-2">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-white">₱{plan.price}</span>
                  <span className="text-[#A0A0A0]">/month</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#A0A0A0]">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#F5C400]" />
                    <span>{plan.speed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#F5C400]" />
                    <span>{plan.devices} devices</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#28C76F] flex-shrink-0 mt-0.5" />
                    <span className="text-[#A0A0A0] text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full ${
                  plan.isCurrent
                    ? "bg-[#2A2A2A] text-white cursor-default hover:bg-[#2A2A2A]"
                    : "bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]"
                }`}
                disabled={plan.isCurrent}
              >
                {plan.isCurrent ? "Active Plan" : "Upgrade Now"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
