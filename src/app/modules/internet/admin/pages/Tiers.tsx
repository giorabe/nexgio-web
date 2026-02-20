import { useMemo, useState } from "react";
import { Button } from "@/app/shared/ui/button";
import { Input } from "@/app/shared/ui/input";
import { Label } from "@/app/shared/ui/label";
import { useTiers } from "../hooks/useTiers";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/shared/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/ui/select";

import { Wifi, Edit, Trash2, Plus } from "lucide-react";

type SortKey =
  | "newest"
  | "name_asc"
  | "price_asc"
  | "price_desc"
  | "devices_asc"
  | "devices_desc";

type TierUI = {
  id: string;
  name: string;
  speed: string;
  deviceLimit: number;
  price: number;
  subscribers: number;
};

export default function Tiers() {
  const { tiers, loading, error, add, edit, remove } = useTiers();

  // --- UI Controls
  const [showAll, setShowAll] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  // --- Add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);

  // Use string states so user can clear number inputs (fixes “0 can’t erase”)
  const [tierName, setTierName] = useState("");
  const [speed, setSpeed] = useState("");
  const [deviceLimitInput, setDeviceLimitInput] = useState<string>("1");
  const [priceInput, setPriceInput] = useState<string>("");

  // --- Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [editName, setEditName] = useState("");
  const [editSpeed, setEditSpeed] = useState("");
  const [editDeviceLimitInput, setEditDeviceLimitInput] = useState<string>("1");
  const [editPriceInput, setEditPriceInput] = useState<string>("");

  // --- Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<{ id: string; name: string } | null>(
    null
  );

  const resetAddForm = () => {
    setTierName("");
    setSpeed("");
    setDeviceLimitInput("1");
    setPriceInput("");
  };

  const openEdit = (tier: TierUI) => {
    setEditingId(tier.id);
    setEditName(tier.name ?? "");
    setEditSpeed(tier.speed ?? "");
    setEditDeviceLimitInput(String(tier.deviceLimit ?? 1));
    setEditPriceInput(String(tier.price ?? 0));
    setIsEditOpen(true);
  };

  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierName.trim() || !speed.trim()) return;

    const deviceLimit = Math.max(1, Number(deviceLimitInput || 1));
    const price = Math.max(0, Number(priceInput || 0));

    setSavingAdd(true);
    const res = await add({
      name: tierName.trim(),
      speed: speed.trim(),
      deviceLimit,
      price,
    });
    setSavingAdd(false);

    if (res.ok) {
      setIsAddModalOpen(false);
      resetAddForm();
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editName.trim() || !editSpeed.trim()) return;

    const deviceLimit = Math.max(1, Number(editDeviceLimitInput || 1));
    const price = Math.max(0, Number(editPriceInput || 0));

    setSavingEdit(true);
    const res = await edit(editingId, {
      name: editName.trim(),
      speed: editSpeed.trim(),
      deviceLimit,
      price,
    });
    setSavingEdit(false);

    if (res.ok) {
      setIsEditOpen(false);
      setEditingId(null);
    }
  };

  // --- Sorting (rearrange)
  const sortedTiers = useMemo(() => {
    const arr = [...(tiers as TierUI[])];

    switch (sortKey) {
      case "name_asc":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price_asc":
        arr.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case "price_desc":
        arr.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case "devices_asc":
        arr.sort((a, b) => (a.deviceLimit || 0) - (b.deviceLimit || 0));
        break;
      case "devices_desc":
        arr.sort((a, b) => (b.deviceLimit || 0) - (a.deviceLimit || 0));
        break;
      case "newest":
      default:
        // Keep fetch order as default
        break;
    }

    return arr;
  }, [tiers, sortKey]);

  // --- Max display 4
  const visibleTiers = useMemo(() => {
    if (showAll) return sortedTiers;
    return sortedTiers.slice(0, 4);
  }, [sortedTiers, showAll]);

  const totalSubscribers = useMemo(
    () => (tiers as TierUI[]).reduce((sum, t) => sum + (t.subscribers ?? 0), 0),
    [tiers]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-1">
            Internet Tier Plans
          </h2>
          <p className="text-[#A0A0A0]">Manage your service packages and pricing</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Rearrange / Sort */}
          <div className="min-w-[220px]">
            <Label className="text-white text-xs mb-2 block">Rearrange</Label>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger
                className="bg-[#161616] border-[#2A2A2A] text-white"
                aria-label="Rearrange tiers"
              >
                <SelectValue placeholder="Choose order" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white">
                <SelectItem value="newest">Newest (default)</SelectItem>
                <SelectItem value="name_asc">Name (A–Z)</SelectItem>
                <SelectItem value="price_asc">Price (Low → High)</SelectItem>
                <SelectItem value="price_desc">Price (High → Low)</SelectItem>
                <SelectItem value="devices_asc">Device Limit (Low → High)</SelectItem>
                <SelectItem value="devices_desc">Device Limit (High → Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add Tier */}
          <Dialog
            open={isAddModalOpen}
            onOpenChange={(open) => {
              setIsAddModalOpen(open);
              if (!open) resetAddForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F] font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add Tier
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl text-white">Add New Tier</DialogTitle>
              </DialogHeader>

              {error && (
                <div className="rounded-md border border-[#EA5455]/40 bg-[#EA5455]/10 px-4 py-3 text-sm text-[#EA5455]">
                  {error}
                </div>
              )}

              <form className="space-y-4 mt-4" onSubmit={handleAddTier}>
                <div className="space-y-2">
                  <Label htmlFor="tierName" className="text-white">
                    Tier Name
                  </Label>
                  <Input
                    id="tierName"
                    placeholder="e.g., Premium Plus"
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    className="bg-[#161616] border-[#2A2A2A] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speed" className="text-white">
                    Speed Allocation
                  </Label>
                  <Input
                    id="speed"
                    placeholder="e.g., Up to 100 Mbps"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    className="bg-[#161616] border-[#2A2A2A] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="devices" className="text-white">
                    Device Limit
                  </Label>
                  <Input
                    id="devices"
                    type="number"
                    min={1}
                    value={deviceLimitInput}
                    onChange={(e) => setDeviceLimitInput(e.target.value)}
                    className="bg-[#161616] border-[#2A2A2A] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white">
                    Monthly Price (₱)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="bg-[#161616] border-[#2A2A2A] text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingAdd || !tierName.trim() || !speed.trim()}
                    className="flex-1 bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F] disabled:opacity-70"
                  >
                    {savingAdd ? "Adding..." : "Add Tier"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Edit Tier</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="rounded-md border border-[#EA5455]/40 bg-[#EA5455]/10 px-4 py-3 text-sm text-[#EA5455]">
              {error}
            </div>
          )}

          <form className="space-y-4 mt-4" onSubmit={handleSaveEdit}>
            <div className="space-y-2">
              <Label htmlFor="editTierName" className="text-white">
                Tier Name
              </Label>
              <Input
                id="editTierName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-[#161616] border-[#2A2A2A] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSpeed" className="text-white">
                Speed Allocation
              </Label>
              <Input
                id="editSpeed"
                value={editSpeed}
                onChange={(e) => setEditSpeed(e.target.value)}
                className="bg-[#161616] border-[#2A2A2A] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDevices" className="text-white">
                Device Limit
              </Label>
              <Input
                id="editDevices"
                type="number"
                min={1}
                value={editDeviceLimitInput}
                onChange={(e) => setEditDeviceLimitInput(e.target.value)}
                className="bg-[#161616] border-[#2A2A2A] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPrice" className="text-white">
                Monthly Price (₱)
              </Label>
              <Input
                id="editPrice"
                type="number"
                min={0}
                value={editPriceInput}
                onChange={(e) => setEditPriceInput(e.target.value)}
                className="bg-[#161616] border-[#2A2A2A] text-white"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit || !editName.trim() || !editSpeed.trim()}
                className="flex-1 bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F] disabled:opacity-70"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setTierToDelete(null);
        }}
      >
        <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Delete Tier</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="w-12 h-12 rounded-full bg-[#EA5455]/20 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-[#EA5455]" />
            </div>

            <p className="text-[#A0A0A0] text-center">
              Are you sure you want to delete{" "}
              <span className="text-white font-semibold">{tierToDelete?.name}</span>?
            </p>

            <p className="text-sm text-[#EA5455] text-center">
              This action cannot be undone.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  if (!tierToDelete) return;
                  await remove(tierToDelete.id);
                  setIsDeleteOpen(false);
                  setTierToDelete(null);
                }}
                className="flex-1 bg-[#EA5455] hover:bg-[#EA5455]/90 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global error / loading */}
      {error && (
        <div className="rounded-md border border-[#EA5455]/40 bg-[#EA5455]/10 px-4 py-3 text-sm text-[#EA5455]">
          {error}
        </div>
      )}
      {loading && <div className="text-sm text-[#A0A0A0]">Loading tiers...</div>}

      {/* Tier Cards (max 4 unless showAll) */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#A0A0A0]">
          Showing {visibleTiers.length} of {sortedTiers.length}
        </div>
        {sortedTiers.length > 4 && (
          <Button
            variant="outline"
            className="border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show less" : "Show all"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleTiers.map((tier) => (
          <div
            key={tier.id}
            className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden hover:border-[#F5C400]/30 transition-all"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#0F0F0F]/20 backdrop-blur-sm flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-[#0F0F0F]" />
                </div>
                <div className="px-3 py-1 bg-[#0F0F0F]/20 backdrop-blur-sm rounded-full text-[#0F0F0F] text-xs font-semibold">
                  {tier.subscribers} Active
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#0F0F0F] mb-1">{tier.name}</h3>
              <p className="text-[#0F0F0F]/70 font-medium">{tier.speed}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Price */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">₱{tier.price}</span>
                  <span className="text-[#A0A0A0]">/month</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-t border-[#2A2A2A]">
                  <span className="text-[#A0A0A0]">Speed</span>
                  <span className="text-white font-semibold">{tier.speed}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-t border-[#2A2A2A]">
                  <span className="text-[#A0A0A0]">Device Limit</span>
                  <span className="text-white font-semibold">{tier.deviceLimit} devices</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2A2A2A] text-[#F5C400] hover:bg-[#F5C400]/10"
                  onClick={() => openEdit(tier)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  className="border-[#2A2A2A] text-[#EA5455] hover:bg-[#EA5455]/10"
                  onClick={() => {
                    setTierToDelete({ id: tier.id, name: tier.name });
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tier Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-[#A0A0A0] text-sm mb-1">Total Tiers</p>
            <p className="text-3xl font-bold text-white">{(tiers as TierUI[]).length}</p>
          </div>
          <div>
            <p className="text-[#A0A0A0] text-sm mb-1">Total Subscribers</p>
            <p className="text-3xl font-bold text-white">{totalSubscribers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}