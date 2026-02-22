import React from 'react';
import { Navigate } from 'react-router-dom';

type Role = 'admin' | 'client';

export default function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  if (typeof window === 'undefined') return <>{children}</>;
  const storedRole = localStorage.getItem('role');

  if (!storedRole) {
    // no role, redirect to public landing or login depending on required role
    if (role === 'admin') return <Navigate to='/' replace />;
    return <Navigate to='/internet/client/login' replace />;
  }

  if (storedRole !== role) {
    // block access and redirect to appropriate area
    if (role === 'admin') return <Navigate to='/' replace />;
    return <Navigate to='/internet/client/login' replace />;
  }

  return <>{children}</>;
}
