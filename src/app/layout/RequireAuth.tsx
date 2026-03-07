import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/app/shared/supabaseClient";
import { signOut as signOutService } from "@/app/modules/internet/admin/services/auth.service";

export default function RequireAuth({
  children,
  redirectTo = "/",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  // Absolute session lifetime in milliseconds (1 hour)
  const SESSION_MAX_AGE_MS = 1000 * 60 * 60;

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

    // Enforce absolute session expiry based on login timestamp saved at sign-in
    try {
      const loginAtRaw = localStorage.getItem("loginAt");
      if (loginAtRaw) {
        const loginAt = Number(loginAtRaw);
        if (!Number.isNaN(loginAt)) {
          const elapsed = Date.now() - loginAt;
          if (elapsed >= SESSION_MAX_AGE_MS) {
            // Session expired — sign out immediately
            signOutService().then(() => {
              setAuthed(false);
              setLoading(false);
              try {
                localStorage.removeItem("loginAt");
                localStorage.removeItem("role");
              } catch {}
              navigate("/", { replace: true });
            });
          } else {
            // Schedule sign-out when the max age is reached
            const remaining = SESSION_MAX_AGE_MS - elapsed;
            setTimeout(() => {
              signOutService().then(() => {
                setAuthed(false);
                try {
                  localStorage.removeItem("loginAt");
                  localStorage.removeItem("role");
                } catch {}
                navigate("/", { replace: true });
              });
            }, remaining);
          }
        }
      }
    } catch (e) {
      // If localStorage isn't available or parsing fails, ignore and continue
      console.warn("RequireAuth: failed to check local login timestamp", e);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      sub.subscription.unsubscribe();
    };
  }, []);

  const location = useLocation();

  if (loading) return null;
  if (!authed) {
    const next = encodeURIComponent(location.pathname + location.search);
    const sep = redirectTo.includes("?") ? "&" : "?";
    return <Navigate to={`${redirectTo}${sep}next=${next}`} replace />;
  }

  return <>{children}</>;
}