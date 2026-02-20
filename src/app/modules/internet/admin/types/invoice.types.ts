export type InvoiceStatus = "pending" | "paid" | "overdue";

export type InvoiceRow = {
  id: string; // uuid
  client_id: string; // uuid
  client_name?: string | null;
  client_room?: string | null;
  client_contact?: string | null;
  client_email?: string | null;
  invoice_number: string;
  billing_month: string; // YYYY-MM
  invoice_date: string; // DATE YYYY-MM-DD
  due_date: string; // DATE YYYY-MM-DD
  base_price: number;
  extra_device_charge: number;
  unregistered_overcharge: number;
  rebate: number;
  previous_balance: number;
  deposit_applied: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  payment_status: InvoiceStatus;
  payment_date?: string | null; // DATE
  paid_at?: string | null; // timestamptz
  payment_method?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InvoiceRowWithClient = InvoiceRow & {
  clients?: {
    name: string;
    room: string;
    contact: string;
    email: string;
  } | null;
};

export type InvoiceUI = {
  id: string;
  clientId: string;
  invoiceNumber: string;
  billingMonth: string; // YYYY-MM
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  basePrice: number;
  extraDeviceCharge: number;
  unregisteredOvercharge: number;
  rebate: number;
  previousBalance: number;
  depositApplied: number;
  totalAmount: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus: InvoiceStatus;
  paymentDate?: string | null;
  paymentMethod?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoiceCreateInput = {
  clientId: string;
  invoiceNumber: string;
  billingMonth: string; // YYYY-MM
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  basePrice: number;
  extraDeviceCharge?: number;
  unregisteredOvercharge?: number;
  rebate?: number;
  previousBalance?: number;
  depositApplied?: number;
  totalAmount: number;
  paymentStatus?: InvoiceStatus;
  paymentDate?: string | null;
  paymentMethod?: string | null;
};
