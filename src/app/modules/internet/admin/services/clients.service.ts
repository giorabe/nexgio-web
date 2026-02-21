import { supabase } from "@/app/shared/supabaseClient";
import type { ClientRow, ClientRowPatch } from "../types/client.types";

const SELECT_FIELDS =
  "id,name,room,tier_id,devices,status,contact,email," +
  "start_date,next_due_date,deposit_enabled,deposit_amount," +
  "account_username,account_password,account_status," +
  "created_at,updated_at";

export async function fetchClients() {
  return supabase
    .from("clients")
    .select(SELECT_FIELDS)
    .order("created_at", { ascending: false })
    .returns<ClientRow[]>();
}

export async function createClient(input: {
  name: string;
  room: string;
  tier_id: string; // uuid
  devices: number;
  status: "active" | "late" | "suspended";
  contact: string;
  email: string;
  start_date: string;
  next_due_date: string | null; 
  deposit_enabled: boolean;
  deposit_amount: number;
  account_username: string;
  account_password: string;
}) {
  return supabase
    .from("clients")
    .insert({
      name: input.name,
      room: input.room,
      tier_id: input.tier_id,
      devices: input.devices,
      status: input.status,
      contact: input.contact.trim() || null,
      email: input.email.trim() || null,
      start_date: input.start_date,
      deposit_enabled: input.deposit_enabled,
      deposit_amount: input.deposit_enabled ? input.deposit_amount : 0,
      account_username: input.account_username,
      account_password: input.account_password,
      account_status: "active",
    })
    .select(SELECT_FIELDS)
    .single()
    .returns<ClientRow>();
}

export async function updateClient(id: string, patch: ClientRowPatch) {
  // Enforce account_status always active
  const nextPatch: ClientRowPatch = { ...patch, account_status: "active" };

  return supabase
    .from("clients")
    .update(nextPatch satisfies ClientRowPatch)
    .eq("id", id)
    .select(SELECT_FIELDS)
    .single()
    .returns<ClientRow>();
}

export async function deleteClient(id: string) {
  return supabase.from("clients").delete().eq("id", id);
}

/**
 * Lightweight fetch for tier subscriber counting.
 * Only fetches id, tier_id, status (minimal data for counting active clients per tier).
 */
export type ClientCountRow = {
  id: string;
  tier_id: string;
  status: string;
};

export async function fetchClientsForTierCounts() {
  return supabase
    .from("clients")
    .select("id,tier_id,status")
    .returns<ClientCountRow[]>();
}
