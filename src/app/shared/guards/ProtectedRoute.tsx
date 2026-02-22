import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: "admin" | "client";
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const storedRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  if (!storedRole) return <Navigate to="/" replace />;
  if (storedRole !== role) {
    // If a client tries to access admin routes, send them to the client dashboard.
    if (storedRole === "client") return <Navigate to="/internet/client/dashboard" replace />;
    // If an admin tries to access client-only routes, send to admin dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
