/**
 * ClientRow: Database model (snake_case, matches Supabase table)
 */
export type ClientRow = {
  id: string; // uuid
  name: string;
  room: string;
  tier_id: string; // uuid (FK to tiers.id)
  devices: number;
  status: string;
  contact: string | null;
  email: string | null;
  start_date: string; // YYYY-MM-DD
  next_due_date?: string | null; // YYYY-MM-DD
  deposit_enabled: boolean;
  deposit_amount: number | null;
  account_username: string;
  account_password: string;
  account_status: string;
  created_at?: string;
  updated_at?: string;
};

/**
 * ClientAccount: Nested account object used in UI
 */
export type ClientAccount = {
  username: string;
  password: string;
  status: "active";
};

/**
 * ClientUI: UI-facing model (camelCase)
 */
export type ClientUI = {
  id: string; // uuid
  name: string;
  room: string;
  tier: string;     // tier name for display
  tierId: string;   // tier uuid
  devices: number;
  status: "active" | "late" | "suspended";
  contact: string;
  email: string;
  startDate: string;  // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD (ISO) prefer this when present
  nextDueDate: string; // YYYY-MM-DD (ISO) authoritative when present
  hasDeposit: boolean;
  depositAmount: number;
  account: ClientAccount;
};

/**
 * Patch type for updates (snake_case)
 */
export type ClientRowPatch = Partial<
  Omit<ClientRow, "id" | "created_at" | "updated_at">
>;