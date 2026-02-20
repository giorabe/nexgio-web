import { useCallback, useEffect, useMemo, useState } from "react";
import type { TierRow, TierUI } from "../types/tier.types";
import { createTier, deleteTier, fetchTiers, updateTier } from "../services/tiers.service";
import { fetchClientsForTierCounts, type ClientCountRow } from "../services/clients.service";

function countActiveSubscribers(tierId: string, clients: ClientCountRow[]): number {
  return clients.filter((c) => c.tier_id === tierId && c.status === "active").length;
}

function toUI(row: TierRow, clients: ClientCountRow[]): TierUI {
  return {
    id: row.id,
    name: row.name,
    speed: row.speed,
    deviceLimit: row.device_limit,
    price: Number(row.price ?? 0),
    subscribers: countActiveSubscribers(row.id, clients),
  };
}

export function useTiers() {
  const [rows, setRows] = useState<TierRow[]>([]);
  const [clientCounts, setClientCounts] = useState<ClientCountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tiers = useMemo(() => rows.map((r) => toUI(r, clientCounts)), [rows, clientCounts]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Fetch tiers and client counts in parallel
    const [tiersResult, clientCountsResult] = await Promise.all([
      fetchTiers(),
      fetchClientsForTierCounts(),
    ]);

    // Handle tiers error
    if (tiersResult.error) {
      setError(tiersResult.error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    // Set tiers (required)
    setRows((tiersResult.data ?? []) as TierRow[]);

    // Handle client counts error gracefully (don't block tiers, just set empty)
    if (clientCountsResult.error) {
      console.error("Failed to fetch client counts:", clientCountsResult.error.message);
      setClientCounts([]);
    } else {
      setClientCounts(clientCountsResult.data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(async (input: { name: string; speed: string; deviceLimit: number; price: number }) => {
    setError(null);
    const { data, error } = await createTier({
      name: input.name.trim(),
      speed: input.speed.trim(),
      device_limit: Number(input.deviceLimit) || 1,
      price: Number(input.price) || 0,
    });

    if (error) {
      setError(error.message);
      return { ok: false as const };
    }

    setRows((prev) => [data as TierRow, ...prev]);
    return { ok: true as const };
  }, []);

  const edit = useCallback(async (id: string, patch: { name?: string; speed?: string; deviceLimit?: number; price?: number }) => {
    setError(null);

    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name.trim();
    if (patch.speed !== undefined) dbPatch.speed = patch.speed.trim();
    if (patch.deviceLimit !== undefined) dbPatch.device_limit = Number(patch.deviceLimit) || 1;
    if (patch.price !== undefined) dbPatch.price = Number(patch.price) || 0;

    const { data, error } = await updateTier(id, dbPatch);
    if (error) {
      setError(error.message);
      return { ok: false as const };
    }

    setRows((prev) => prev.map((r) => (r.id === id ? (data as TierRow) : r)));
    return { ok: true as const };
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    const { error } = await deleteTier(id);
    if (error) {
      setError(error.message);
      return { ok: false as const };
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
    return { ok: true as const };
  }, []);

  return { tiers, loading, error, reload, add, edit, remove };
}