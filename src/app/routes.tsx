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

// client routes removed

export const router = createBrowserRouter([
  { path: "/", element: <ServiceSelector /> },
  { path: "/login", element: <Login /> },

  // Admin login
  { path: "/admin/login", element: <Login /> },

  // client routes removed

  
  // fallback
  { path: "*", element: <div>Page Not Found</div> },
]);