import { useMemo, useState } from "react";
import type React from "react";

import { useClients } from "../hooks/useClients";
import { Button } from "@/app/shared/ui/button";
import { Input } from "@/app/shared/ui/input";
import { Label } from "@/app/shared/ui/label";

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

import StatusBadge from "@/app/components/StatusBadge";
import { formatDateMMDDYY } from "@/app/utils/formatDate";

import { Plus, Search, Eye } from "lucide-react";

interface ClientAccount {
  username: string;
  password: string;
  status: "active";
}

interface Client {
  id: string;
  name: string;
  room: string;
  tier: string;
  tierId: string;
  devices: number;
  status: "active" | "late" | "suspended";
  contact: string;
  email: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // MM/DD/YYYY (display)

  hasDeposit: boolean;
  depositAmount: number;

  account?: ClientAccount;
}

function calcNextDueDate(startDateISO: string, now = new Date()) {
  const start = new Date(startDateISO);
  if (Number.isNaN(start.getTime())) return "";

  // Build an "anchor" date with the same day-of-month as start
  const day = start.getDate();

  // Start from current month/year
  let y = now.getFullYear();
  let m = now.getMonth(); // 0-11

  // helper: last day in a month
  const lastDayOfMonth = (year: number, monthIndex: number) =>
    new Date(year, monthIndex + 1, 0).getDate();

  // candidate due date in current month
  const candidateDay = Math.min(day, lastDayOfMonth(y, m));
  let due = new Date(y, m, candidateDay);

  // If already past today (or earlier today), move to next month
  // (We compare date-only by zeroing time)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueDateOnly <= today) {
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    const nextDay = Math.min(day, lastDayOfMonth(y, m));
    due = new Date(y, m, nextDay);
  }

  const mm = String(due.getMonth() + 1).padStart(2, "0");
  const dd = String(due.getDate()).padStart(2, "0");
  const yyyy = due.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function ClientList() {
  const { clients, loading, error, add, edit, remove, tiers } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("all");

  // Add Client modal (2 steps)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);

  const [newClient, setNewClient] = useState({
    name: "",
    room: "",
    tierId: "",
    devices: "1",
    contact: "",
    email: "",
    startDate: "",
    hasDeposit: false,
    depositAmount: 0,
  });

  const [newAccount, setNewAccount] = useState<ClientAccount>({
    username: "",
    password: "",
    status: "active",
  });

  // View Details dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Edit inside View Details
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Client | null>(null);

  // Password show/hide in View Details
  const [showPassword, setShowPassword] = useState(false);
  const [editDevicesText, setEditDevicesText] = useState<string>("");

  const computedDueDate = useMemo(
    () => calcNextDueDate(newClient.startDate),
    [newClient.startDate]
  );

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.room.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = filterTier === "all" || client.tier === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [clients, searchTerm, filterTier]);

  // Create tier options from tiers hook
  const tierOptions = useMemo(() => {
    return tiers.map((t) => ({ id: t.id, name: t.name }));
  }, [tiers]);

  const resetAddFlow = () => {
    setAddStep(1);
    setNewClient({
      name: "",
      room: "",
      tierId: "",
      devices: "1",
      contact: "",
      email: "",
      startDate: "",
      hasDeposit: false,
      depositAmount: 0,
    });
    setNewAccount({
      username: "",
      password: "",
      status: "active",
    });
  };

  const openDetails = (client: Client) => {
    setSelectedClient(client);
    setEditDraft(null);
    setIsEditing(false);
    setShowPassword(false);
    setViewOpen(true);
  };

  const closeDetails = () => {
    setViewOpen(false);
    setSelectedClient(null);
    setEditDraft(null);
    setIsEditing(false);
    setShowPassword(false);
  };

  const canGoNext =
    newClient.name.trim() !== "" &&
    newClient.room.trim() !== "" &&
    newClient.tierId.trim() !== "" &&
    newClient.devices.trim() !== "" &&
    newClient.startDate.trim() !== "" &&
    (!newClient.hasDeposit || newClient.depositAmount > 0);

  const canSaveAccount =
    newAccount.username.trim() !== "" && newAccount.password.trim() !== "";

  const handleNext = () => {
    if (!canGoNext) return;
    setAddStep(2);
  };

  const handleCreateClient = async () => {
    if (!canGoNext || !canSaveAccount) return;

    const res = await add({
      name: newClient.name.trim(),
      room: newClient.room.trim(),
      tierId: newClient.tierId,
      devices: Math.max(1, parseInt(newClient.devices || "1", 10)),
      contact: newClient.contact.trim(),
      email: newClient.email.trim(),
      startDate: newClient.startDate,
      hasDeposit: newClient.hasDeposit,
      depositAmount: newClient.hasDeposit ? Number(newClient.depositAmount) || 0 : 0,
      username: newAccount.username.trim(),
      password: newAccount.password,
    });

    if (res.ok) {
      setIsAddModalOpen(false);
      resetAddFlow();
    }
  };

  const startEdit = () => {
    if (!selectedClient) return;
    setIsEditing(true);
    setEditDraft(JSON.parse(JSON.stringify(selectedClient)) as Client);
    setEditDevicesText(String(selectedClient.devices));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!selectedClient || !editDraft) return;

    const res = await edit(selectedClient.id, {
      name: editDraft.name,
      room: editDraft.room,
      tierId: editDraft.tierId,
      devices: Math.max(1, parseInt(editDevicesText || String(editDraft.devices || 1), 10)),
      status: editDraft.status,
      contact: editDraft.contact,
      email: editDraft.email,
      startDate: editDraft.startDate,
      hasDeposit: editDraft.hasDeposit,
      depositAmount: editDraft.hasDeposit ? Number(editDraft.depositAmount) || 0 : 0,
      username: editDraft.account?.username || "",
      password: editDraft.account?.password || "",
    });

    if (res.ok) {
      setIsEditing(false);
      setEditDraft(null);
      setSelectedClient(null);
      setViewOpen(false);
    }
  };

  const deleteClient = async () => {
    if (!selectedClient) return;
    const res = await remove(selectedClient.id);
    if (res.ok) {
      closeDetails();
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading & Error States */}
      {loading && (
        <div className="text-center text-[#A0A0A0] py-8">
          Loading clients...
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
            <Input
              type="search"
              placeholder="Search clients or rooms..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="pl-10 bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400]"
            />
          </div>

          {/* Tier Filter */}
          <Select value={filterTier} onValueChange={setFilterTier}>
            <SelectTrigger
              aria-label="Filter by tier"
              className="w-40 bg-[#161616] border-[#2A2A2A] text-white"
            >
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Client Button */}
        <Dialog
          open={isAddModalOpen}
          onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) resetAddFlow();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F] font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">
                {addStep === 1 ? "Add New Client" : "Create Client Account"}
              </DialogTitle>
            </DialogHeader>

            {addStep === 1 && (
              <form
                className="space-y-4 mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      Client Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={newClient.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewClient((p) => ({ ...p, name: e.target.value }))
                      }
                      className="bg-[#161616] border-[#2A2A2A] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room" className="text-white">
                      Room Number
                    </Label>
                    <Input
                      id="room"
                      placeholder="e.g., Room 101"
                      value={newClient.room}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewClient((p) => ({ ...p, room: e.target.value }))
                      }
                      className="bg-[#161616] border-[#2A2A2A] text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact" className="text-white">
                      Contact Number
                    </Label>
                    <Input
                      id="contact"
                      placeholder="0917-123-4567"
                      value={newClient.contact}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewClient((p) => ({ ...p, contact: e.target.value }))
                      }
                      className="bg-[#161616] border-[#2A2A2A] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={newClient.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewClient((p) => ({ ...p, email: e.target.value }))
                      }
                      className="bg-[#161616] border-[#2A2A2A] text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-white">
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newClient.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewClient((p) => ({
                          ...p,
                          startDate: e.target.value,
                        }))
                      }
                      className="bg-[#161616] border-[#2A2A2A] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-white">
                      Due Date (Auto)
                    </Label>
                    <Input
                      id="dueDate"
                      type="text"
                      value={computedDueDate}
                      readOnly
                      className="bg-[#161616] border-[#2A2A2A] text-white opacity-80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label id="tierLabel" className="text-white">
                      Internet Tier
                    </Label>
                    <Select
                      value={newClient.tierId}
                      onValueChange={(v: string) =>
                        setNewClient((p) => ({ ...p, tierId: v }))
                      }
                    >
                      <SelectTrigger
                        aria-label="Internet tier"
                        aria-labelledby="tierLabel"
                        className="bg-[#161616] border-[#2A2A2A] text-white"
                      >
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {tierOptions.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="devices" className="text-white">
                      Device Count
                    </Label>
                    <Input
                      id="devices"
                      type="number"
                      value={newClient.devices}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = e.target.value;
                        if (v === "" || /^\d+$/.test(v)) {
                          setNewClient((p) => ({ ...p, devices: v }));
                        }
                      }}
                      className="bg-[#161616] border-[#2A2A2A] text-white"
                    />
                  </div>
                </div>

                {/* Deposit */}
                <div className="border-t border-[#2A2A2A] pt-4 space-y-3">
                  {/* FIX axe/forms: wrap input inside Label */}
                  <Label className="flex items-center gap-3 text-white cursor-pointer">
                    <input
                      id="hasDeposit"
                      type="checkbox"
                      checked={newClient.hasDeposit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const checked = e.target.checked;
                        setNewClient((prev) => ({
                          ...prev,
                          hasDeposit: checked,
                          depositAmount: checked ? prev.depositAmount : 0,
                        }));
                      }}
                      aria-label="Has deposit"
                    />
                    Has deposit?
                  </Label>

                  {newClient.hasDeposit && (
                    <div className="space-y-2">
                      <Label htmlFor="depositAmount" className="text-white">
                        Deposit Amount
                      </Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        inputMode="numeric"
                        placeholder="Enter deposit amount"
                        value={String(newClient.depositAmount)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewClient((prev) => ({
                            ...prev,
                            depositAmount: Number(e.target.value) || 0,
                          }))
                        }
                        className="bg-[#161616] border-[#2A2A2A] text-white"
                      />
                    </div>
                  )}
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
                    disabled={!canGoNext}
                    className="flex-1 bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]"
                  >
                    Next
                  </Button>
                </div>
              </form>
            )}

            {addStep === 2 && (
              <form
                className="space-y-4 mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateClient();
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">
                      Username
                    </Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={newAccount.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewAccount((p) => ({ ...p, username: e.target.value }))
                      }
                      className="bg-[#161616] border-[#2A2A2A] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={newAccount.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewAccount((p) => ({ ...p, password: e.target.value }))
                      }
                      className="bg-[#161616] border-[#2A2A2A] text-white"
                    />
                  </div>
                </div>

                {/* Status auto active - no selector */}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddStep(1)}
                    className="flex-1 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSaveAccount}
                    className="flex-1 bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]"
                  >
                    Save
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients Table */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#161616]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Client Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Room / Unit
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Internet Tier
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Devices
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-[#161616] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{client.name}</p>
                      <p className="text-[#A0A0A0] text-sm">{client.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">{client.room}</td>
                  <td className="px-6 py-4">
                    <span className="text-[#F5C400] font-medium">
                      {client.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{client.devices}</td>
                  <td className="px-6 py-4 text-white">{formatDateMMDDYY(client.dueDate)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
                      onClick={() => openDetails(client)}
                      type="button"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={(o) => (o ? null : closeDetails())}>
        <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isEditing ? "Edit Client" : "Client Details"}
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <>
              {/* DETAILS MODE */}
              {!isEditing && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Client Name</p>
                      <p className="text-white font-semibold">{selectedClient.name}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Room / Unit</p>
                      <p className="text-white font-semibold">{selectedClient.room}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Contact</p>
                      <p className="text-white">{selectedClient.contact || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Email</p>
                      <p className="text-white">{selectedClient.email || "-"}</p>
                    </div>
                  </div>

                  <div className="border-t border-[#2A2A2A] pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Tier</p>
                      <p className="text-white">{selectedClient.tier}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Devices</p>
                      <p className="text-white">{selectedClient.devices}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Start Date</p>
                      <p className="text-white">{formatDateMMDDYY(selectedClient.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Due Date</p>
                      <p className="text-white">{formatDateMMDDYY(selectedClient.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Status</p>
                      <StatusBadge status={selectedClient.status} />
                    </div>
                  </div>

                  <div className="border-t border-[#2A2A2A] pt-4">
                    <p className="text-white font-semibold mb-2">Deposit</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#A0A0A0]">Has deposit</span>
                      <span className="text-white">
                        {selectedClient.hasDeposit ? "Yes" : "No"}
                      </span>
                    </div>
                    {selectedClient.hasDeposit && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[#A0A0A0]">Deposit amount</span>
                        <span className="text-white">₱{selectedClient.depositAmount}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#2A2A2A] pt-4">
                    <p className="text-white font-semibold mb-2">Account</p>
                    {selectedClient.account ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[#A0A0A0]">Username</span>
                          <span className="text-white">{selectedClient.account.username}</span>
                        </div>

                        {/* ADMIN: SHOW PASSWORD (with toggle) */}
                        <div className="space-y-2">
                          <Label htmlFor="viewPassword" className="text-[#A0A0A0] text-sm">
                            Password
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="viewPassword"
                              type={showPassword ? "text" : "password"}
                              readOnly
                              value={selectedClient.account.password}
                              className="bg-[#161616] border-[#2A2A2A] text-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
                              onClick={() => setShowPassword((p) => !p)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? "Hide" : "Show"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#A0A0A0]">No account yet.</p>
                    )}
                  </div>

                  {/* FOOTER BUTTONS (THIS is where Edit/Delete should be) */}
                  <div className="pt-2 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
                      onClick={startEdit}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-[#2A2A2A] text-[#EA5455] hover:bg-[#EA5455]/10"
                      onClick={deleteClient}
                    >
                      Delete
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]"
                      onClick={closeDetails}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}

              {/* EDIT MODE */}
              {isEditing && editDraft && (
                <form
                  className="space-y-4 mt-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit();
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editName" className="text-white">
                        Client Name
                      </Label>
                      <Input
                        id="editName"
                        value={editDraft.name}
                        onChange={(e) =>
                          setEditDraft((p) => (p ? { ...p, name: e.target.value } : p))
                        }
                        className="bg-[#161616] border-[#2A2A2A] text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editRoom" className="text-white">
                        Room Number
                      </Label>
                      <Input
                        id="editRoom"
                        value={editDraft.room}
                        onChange={(e) =>
                          setEditDraft((p) => (p ? { ...p, room: e.target.value } : p))
                        }
                        className="bg-[#161616] border-[#2A2A2A] text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editContact" className="text-white">
                        Contact
                      </Label>
                      <Input
                        id="editContact"
                        value={editDraft.contact}
                        onChange={(e) =>
                          setEditDraft((p) => (p ? { ...p, contact: e.target.value } : p))
                        }
                        className="bg-[#161616] border-[#2A2A2A] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editEmail" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="editEmail"
                        type="email"
                        value={editDraft.email}
                        onChange={(e) =>
                          setEditDraft((p) => (p ? { ...p, email: e.target.value } : p))
                        }
                        className="bg-[#161616] border-[#2A2A2A] text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editStartDate" className="text-white">
                        Start Date
                      </Label>
                      <Input
                        id="editStartDate"
                        type="date"
                        value={editDraft.startDate}
                        onChange={(e) =>
                          setEditDraft((p) => (p ? { ...p, startDate: e.target.value } : p))
                        }
                        className="bg-[#161616] border-[#2A2A2A] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editDueDate" className="text-white">
                        Due Date (Auto)
                      </Label>
                      <Input
                        id="editDueDate"
                        readOnly
                        value={calcNextDueDate(editDraft.startDate)}
                        className="bg-[#161616] border-[#2A2A2A] text-white opacity-80"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Tier</Label>
                      <Select
                        value={editDraft.tierId}
                        onValueChange={(v) =>
                          setEditDraft((p) => (p ? { ...p, tierId: v } : p))
                        }
                      >
                        <SelectTrigger
                          aria-label="Edit tier"
                          className="bg-[#161616] border-[#2A2A2A] text-white"
                        >
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {tierOptions.map((tier) => (
                            <SelectItem key={tier.id} value={tier.id}>
                              {tier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editDevices" className="text-white">
                        Devices
                      </Label>
                      <Input
                        id="editDevices"
                        type="number"
                        value={editDevicesText}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || /^\d+$/.test(v)) {
                            setEditDevicesText(v);
                            if (v !== "") {
                              const n = parseInt(v, 10);
                              setEditDraft((p) => (p ? { ...p, devices: n } : p));
                            }
                          }
                        }}
                        className="bg-[#161616] border-[#2A2A2A] text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Client Status</Label>
                      <Select
                        value={editDraft.status}
                        onValueChange={(v) =>
                          setEditDraft((p) =>
                            p ? { ...p, status: v as Client["status"] } : p
                          )
                        }
                      >
                        <SelectTrigger
                          aria-label="Edit status"
                          className="bg-[#161616] border-[#2A2A2A] text-white"
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Deposit</Label>
                      <div className="space-y-3 border border-[#2A2A2A] rounded-lg p-3">
                        <Label className="flex items-center gap-3 text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editDraft.hasDeposit}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p
                                  ? {
                                      ...p,
                                      hasDeposit: e.target.checked,
                                      depositAmount: e.target.checked ? p.depositAmount : 0,
                                    }
                                  : p
                              )
                            }
                            aria-label="Edit has deposit"
                          />
                          Has deposit?
                        </Label>

                        {editDraft.hasDeposit && (
                          <div className="space-y-2">
                            <Label htmlFor="editDepositAmount" className="text-white">
                              Deposit Amount
                            </Label>
                            <Input
                              id="editDepositAmount"
                              type="number"
                              placeholder="Enter deposit amount"
                              value={String(editDraft.depositAmount)}
                              onChange={(e) =>
                                setEditDraft((p) =>
                                  p
                                    ? { ...p, depositAmount: Number(e.target.value) || 0 }
                                    : p
                                )
                              }
                              className="bg-[#161616] border-[#2A2A2A] text-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#2A2A2A] pt-4 space-y-3">
                    <p className="text-white font-semibold">Account</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editUsername" className="text-white">
                          Username
                        </Label>
                        <Input
                          id="editUsername"
                          value={editDraft.account?.username || ""}
                          onChange={(e) =>
                            setEditDraft((p) =>
                              p
                                ? {
                                    ...p,
                                    account: {
                                      username: e.target.value,
                                      password: p.account?.password || "",
                                      status: "active",
                                    },
                                  }
                                : p
                            )
                          }
                          className="bg-[#161616] border-[#2A2A2A] text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editPassword" className="text-white">
                          Password
                        </Label>
                        <Input
                          id="editPassword"
                          type="text"
                          value={editDraft.account?.password || ""}
                          onChange={(e) =>
                            setEditDraft((p) =>
                              p
                                ? {
                                    ...p,
                                    account: {
                                      username: p.account?.username || "",
                                      password: e.target.value,
                                      status: "active",
                                    },
                                  }
                                : p
                            )
                          }
                          className="bg-[#161616] border-[#2A2A2A] text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      className="flex-1 border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]"
                    >
                      Save
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Results Info */}
      <div className="flex items-center justify-between text-[#A0A0A0] text-sm">
        <p>
          Showing {filteredClients.length} of {clients.length} clients
        </p>
      </div>
    </div>
  );
}