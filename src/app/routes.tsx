import { createBrowserRouter } from "react-router-dom";
import RequireAuth from "./layout/RequireAuth";
import RequireAdmin from "./shared/guards/RequireAdmin";

import Login from "./pages/Login";
import ServiceSelector from "./pages/ServiceSelector";

import DashboardLayout from "./layout/DashboardLayout";

import DashboardHome from "./modules/internet/admin/pages/DashboardHome";
import ClientList from "./modules/internet/admin/pages/ClientList";
import Tiers from "./modules/internet/admin/pages/Tiers";
import Invoice from "./modules/internet/admin/pages/Invoice";
import InvoiceHistory from "./modules/internet/admin/pages/InvoiceHistory";
import ReceiptHistory from "./modules/internet/admin/pages/ReceiptHistory";
import PaymentsEntry from "./modules/internet/admin/pages/PaymentsEntry";
import Settings from "./modules/internet/admin/pages/Settings";

// client routes removed

export const router = createBrowserRouter([
  { path: "/", element: <ServiceSelector /> },
  { path: "/login", element: <Login /> },

  // Admin login
  { path: "/admin/login", element: <Login /> },

  // Admin protected dashboard and children
  {
    path: "/dashboard",
    element: (
      <RequireAdmin>
        <DashboardLayout />
      </RequireAdmin>
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