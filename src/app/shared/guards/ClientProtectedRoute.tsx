import React from "react";
import { Navigate } from "react-router-dom";

export default function ClientProtectedRoute({ children }: { children: React.ReactNode }) {
  const cid = typeof window !== "undefined" ? localStorage.getItem("client_id") : null;
  if (!cid) return <Navigate to="/internet/client/login" replace />;
  return <>{children}</>;
}

