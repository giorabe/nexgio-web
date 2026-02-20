import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/app/shared/supabaseClient";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Fallback: if session check takes too long (network issues), fail closed to Login
    timeoutId = setTimeout(() => {
      console.warn("RequireAuth: session check timed out. Redirecting to login.");
      setAuthed(false);
      setLoading(false);
    }, 3000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (timeoutId) clearTimeout(timeoutId);
        setAuthed(!!data.session);
        setLoading(false);
      })
      .catch((error) => {
        if (timeoutId) clearTimeout(timeoutId);
        console.error("RequireAuth: failed to check session:", error);
        // Fail closed (treat as not authenticated)
        setAuthed(false);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;
  if (!authed) return <Navigate to="/" replace />;

  return <>{children}</>;
}