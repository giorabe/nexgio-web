export type TierRow = {
  id: string;
  name: string;
  speed: string;
  device_limit: number;
  price: number;
  created_at?: string;
  updated_at?: string;
};

export type TierUI = {
  id: string;
  name: string;
  speed: string;
  deviceLimit: number;
  price: number;
  subscribers: number; // will be computed later; 0 for now
};