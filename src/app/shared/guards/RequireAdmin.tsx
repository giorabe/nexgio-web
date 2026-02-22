import React from "react";
import RequireAuth from "@/app/layout/RequireAuth";
import ProtectedRoute from "@/app/shared/guards/ProtectedRoute";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ProtectedRoute role="admin">{children}</ProtectedRoute>
    </RequireAuth>
  );
}
