import { createBrowserRouter } from "react-router-dom";
import RequireAuth from "./layout/RequireAuth";
import RequireRole from "./shared/guards/RequireRole";

import Login from "./pages/Login";
import ServiceSelector from "./pages/ServiceSelector";
import ClientModuleServiceSelector from "./modules/internet/client/pages/ServiceSelector";

import DashboardLayout from "./layout/DashboardLayout";

import DashboardHome from "./modules/internet/admin/pages/DashboardHome";
import ClientList from "./modules/internet/admin/pages/ClientList";
import Tiers from "./modules/internet/admin/pages/Tiers";
import Invoice from "./modules/internet/admin/pages/Invoice";
import InvoiceHistory from "./modules/internet/admin/pages/InvoiceHistory";
import ReceiptHistory from "./modules/internet/admin/pages/ReceiptHistory";
import PaymentsEntry from "./modules/internet/admin/pages/PaymentsEntry";
import Settings from "./modules/internet/admin/pages/Settings";

import ClientLogin from "./modules/internet/client/pages/Login";
import ClientDashboard from "./modules/internet/client/pages/Dashboard";
import ClientInvoices from "./modules/internet/client/pages/Invoices";
import ClientPayments from "./modules/internet/client/pages/Payments";
import ClientSettings from "./modules/internet/client/pages/Settings";
import ClientDashboardLayout from "./modules/internet/client/layout/ClientDashboardLayout";

export const router = createBrowserRouter([
  { path: "/", element: <ClientModuleServiceSelector /> },
  { path: "/internet", element: <ClientModuleServiceSelector /> },
  { path: "/login", element: <Login /> },

  // Client public pages (use /internet/client/*)
  { path: "/internet/client", element: <ClientModuleServiceSelector /> },
  { path: "/internet/client/login", element: <ClientLogin /> },

  // Client area (uses ClientDashboardLayout)
  {
    path: "/internet/client",
    element: (
      <RequireRole role="client">
        <ClientDashboardLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <ClientDashboard /> },
      { path: "dashboard", element: <ClientDashboard /> },
      { path: "invoices", element: <ClientInvoices /> },
      { path: "payments", element: <ClientPayments /> },
      { path: "settings", element: <ClientSettings /> },
    ],
  },

  // Admin login
  { path: "/admin/login", element: <Login /> },

  // Admin protected dashboard and children
  {
    path: "/dashboard",
    element: (
      <RequireRole role="admin">
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <DashboardHome />, handle: { title: "Dashboard" } },
      { path: "clients", element: <ClientList />, handle: { title: "Client List" } },
      { path: "tiers", element: <Tiers />, handle: { title: "Internet Tiers" } },
      { path: "invoice", element: <Invoice />, handle: { title: "Invoice Generation" } },
      { path: "payments", element: <InvoiceHistory />, handle: { title: "Invoice History" } },
      { path: "receipts", element: <ReceiptHistory />, handle: { title: "Receipt History" } },
      { path: "payments-entry", element: <PaymentsEntry />, handle: { title: "Payments Entry" } },
      { path: "settings", element: <Settings />, handle: { title: "Settings" } },
    ],
  },
  // fallback
  { path: "*", element: <div>Page Not Found</div> },
]);