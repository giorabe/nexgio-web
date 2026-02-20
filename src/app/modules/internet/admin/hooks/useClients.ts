import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClientRow, ClientRowPatch, ClientUI } from "../types/client.types";
import { createClient, deleteClient, fetchClients, updateClient } from "../services/clients.service";
import { useTiers } from "./useTiers";

function calcNextDueDate(startDateISO: string, now = new Date()) {
  const start = new Date(startDateISO);
  if (Number.isNaN(start.getTime())) return "";

  const day = start.getDate();

  const lastDayOfMonth = (year: number, monthIndex: number) =>
    new Date(year, monthIndex + 1, 0).getDate();

  let y = now.getFullYear();
  let m = now.getMonth();

  const candidateDay = Math.min(day, lastDayOfMonth(y, m));
  let due = new Date(y, m, candidateDay);

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
        // Prefer explicit next_due_date from DB (ISO YYYY-MM-DD), fallback to computed MM/DD/YYYY
        nextDueDate: r.next_due_date ?? "",
        dueDate: r.next_due_date ? (() => {
          const d = new Date(r.next_due_date as string);
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const yyyy = d.getFullYear();
          return `${mm}/${dd}/${yyyy}`;
        })() : calcNextDueDate(r.start_date),
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
      setError(err.message);
      return { ok: false as const };
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
    return { ok: true as const };
  }, []);

  return { clients, loading, error, reload, add, edit, remove, tiers };
}
