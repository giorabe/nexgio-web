import { supabase } from "@/app/shared/supabaseClient";
import type { TierRow } from "../types/tier.types";

export async function fetchTiers() {
  return supabase
    .from("tiers")
    .select("id,name,speed,device_limit,price,created_at,updated_at")
    .order("price", { ascending: true });
}

export async function createTier(input: {
  name: string;
  speed: string;
  device_limit: number;
  price: number;
}) {
  return supabase
    .from("tiers")
    .insert({
      name: input.name,
      speed: input.speed,
      device_limit: input.device_limit,
      price: input.price,
    })
    .select("id,name,speed,device_limit,price,created_at,updated_at")
    .single();
}

export async function updateTier(
  id: string,
  patch: Partial<Pick<TierRow, "name" | "speed" | "device_limit" | "price">>
) {
  return supabase
    .from("tiers")
    .update(patch)
    .eq("id", id)
    .select("id,name,speed,device_limit,price,created_at,updated_at")
    .single();
}

export async function deleteTier(id: string) {
  return supabase.from("tiers").delete().eq("id", id);
}

export async function fetchTierById(tierId: string) {
  return supabase
    .from("tiers")
    .select("id, price, device_limit")
    .eq("id", tierId)
    .maybeSingle();
}