import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClientRow, ClientRowPatch, ClientUI } from "../types/client.types";
import { createClient, deleteClient, fetchClients, updateClient } from "../services/clients.service";
import { useTiers } from "./useTiers";
function toClientStatus(v: string): ClientUI["status"] {
  if (v === "active" || v === "late" || v === "suspended") return v;
  return "active";
}

export function useClients() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { tiers } = useTiers();

  const clients: ClientUI[] = useMemo(() => {
    const tierNameById = new Map(tiers.map((t) => [t.id, t.name]));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      room: r.room,
      tierId: r.tier_id,
      tier: tierNameById.get(r.tier_id) ?? "Unknown",
      devices: r.devices,
      status: toClientStatus(r.status),
      contact: r.contact ?? "",
      email: r.email ?? "",
      startDate: r.start_date,
        // Prefer explicit next_due_date from DB (ISO YYYY-MM-DD). Do NOT compute from start_date.
        nextDueDate: r.next_due_date ?? "",
        // dueDate is ISO YYYY-MM-DD when available; otherwise empty string
        dueDate: r.next_due_date ?? "",
      hasDeposit: r.deposit_enabled,
      depositAmount: r.deposit_amount ?? 0,
      account: {
        username: r.account_username,
        password: r.account_password,
        status: "active",
      },
    }));
  }, [rows, tiers]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await fetchClients();
    if (err) {
      setError(err.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(async (input: {
    name: string;
    room: string;
    tierId: string; // uuid
    devices: number;
    contact: string;
    email: string;
    startDate: string;
    nextDueDate: string;
    hasDeposit: boolean;
    depositAmount: number;
    username: string;
    password: string;
  }) => {
    setError(null);

    const { data, error: err } = await createClient({
      name: input.name.trim(),
      room: input.room.trim(),
      tier_id: input.tierId,
      devices: input.devices,
      status: "active",
      contact: input.contact,
      email: input.email,
      start_date: input.startDate,
      next_due_date: input.nextDueDate,
      deposit_enabled: input.hasDeposit,
      deposit_amount: input.depositAmount,
      account_username: input.username.trim(),
      account_password: input.password,
    });

    if (err) {
      setError(err.message);
      return { ok: false as const };
    }

    if (data) setRows((prev) => [data, ...prev]);
    return { ok: true as const };
  }, []);

  const edit = useCallback(async (id: string, patch: {
    name?: string;
    room?: string;
    tierId?: string;
    devices?: number;
    status?: "active" | "late" | "suspended";
    contact?: string;
    email?: string;
    startDate?: string;
    nextDueDate?: string;
    hasDeposit?: boolean;
    depositAmount?: number;
    username?: string;
    password?: string;
  }) => {
    setError(null);

    const dbPatch: ClientRowPatch = {};

    if (patch.name !== undefined) dbPatch.name = patch.name.trim();
    if (patch.room !== undefined) dbPatch.room = patch.room.trim();
    if (patch.tierId !== undefined) dbPatch.tier_id = patch.tierId;
    if (patch.devices !== undefined) dbPatch.devices = patch.devices;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.contact !== undefined) dbPatch.contact = patch.contact.trim() || null;
    if (patch.email !== undefined) dbPatch.email = patch.email.trim() || null;
    if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
    if (patch.nextDueDate !== undefined) dbPatch.next_due_date = patch.nextDueDate;

    if (patch.hasDeposit !== undefined) dbPatch.deposit_enabled = patch.hasDeposit;
    if (patch.depositAmount !== undefined) dbPatch.deposit_amount = patch.depositAmount;

    if (patch.hasDeposit === false) dbPatch.deposit_amount = 0;

    if (patch.username !== undefined) dbPatch.account_username = patch.username.trim();
    if (patch.password !== undefined) dbPatch.account_password = patch.password;

    const { data, error: err } = await updateClient(id, dbPatch);
    if (err) {
      setError(err.message);
      return { ok: false as const };
    }

    if (data) {
    setRows((prev) => prev.map((r) => (r.id === id ? data : r)));
    }
    return { ok: true as const };
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);

    const { error: err } = await deleteClient(id);
    if (err) {
      const msg = err.message || "Delete failed";
      setError(msg);
      return { ok: false as const, error: msg };
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
    return { ok: true as const };
  }, []);

  return { clients, loading, error, reload, add, edit, remove, tiers };
}
