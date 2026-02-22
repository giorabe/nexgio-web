import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireClient({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") return <>{children}</>;
  const role = localStorage.getItem("role");
  const cid = localStorage.getItem("client_id");
  if (!cid || role !== "client") return <Navigate to="/internet/client/login" replace />;
  return <>{children}</>;
}
