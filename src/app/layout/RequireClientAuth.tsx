import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireClientAuth({
  children,
  redirectTo = "/client/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      const clientId = localStorage.getItem("clientId");
      setAuthed(!!clientId);
    } catch (e) {
      setAuthed(false);
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!authed) {
    const next = encodeURIComponent(location.pathname + location.search);
    const sep = redirectTo.includes("?") ? "&" : "?";
    return <Navigate to={`${redirectTo}${sep}next=${next}`} replace />;
  }

  return <>{children}</>;
}
