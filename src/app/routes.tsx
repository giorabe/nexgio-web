import { createBrowserRouter } from "react-router-dom";
import RequireAuth from "./layout/RequireAuth";

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

// Client-side portal (public)
import ClientPortalLayout from "./modules/internet/client/pages/ClientPortalLayout";
import ClientDashboard from "./modules/internet/client/pages/ClientDashboard";
import ClientInvoices from "./modules/internet/client/pages/ClientInvoices";
import ClientReceipts from "./modules/internet/client/pages/ClientReceipts";
import ClientServiceInfo from "./modules/internet/client/pages/ClientServiceInfo";
import ClientSettings from "./modules/internet/client/pages/ClientSettings";
import ClientLogin from "./modules/internet/client/pages/ClientLogin";
import ClientServiceSelector from "./modules/internet/client/pages/ClientServiceSelector";

export const router = createBrowserRouter([
  { path: "/", element: <ClientServiceSelector /> },
  { path: "/login", element: <Login /> },
  { path: "/admin", element: <ServiceSelector /> },

  // Admin login
  { path: "/admin/login", element: <Login /> },

  // Admin dashboard and protected routes
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "clients", element: <ClientList /> },
      { path: "tiers", element: <Tiers /> },
      { path: "invoice", element: <Invoice /> },
      { path: "invoice-history", element: <InvoiceHistory /> },
      { path: "payments", element: <PaymentsEntry /> },
      { path: "receipts", element: <ReceiptHistory /> },
      { path: "settings", element: <Settings /> },
    ],
  },

  // Client portal routes
  { path: "/client/login", element: <ClientLogin /> },
  { path: "/client/services", element: <ClientServiceSelector /> },
  {
    path: "/client",
    element: <ClientPortalLayout />,
    children: [
      { index: true, element: <ClientServiceSelector /> },
      { path: "dashboard", element: <ClientDashboard /> },
      { path: "invoices", element: <ClientInvoices /> },
      { path: "receipts", element: <ClientReceipts /> },
      { path: "service-info", element: <ClientServiceInfo /> },
      { path: "settings", element: <ClientSettings /> },
    ],
  },

  // fallback
  { path: "*", element: <div>Page Not Found</div> },
]);