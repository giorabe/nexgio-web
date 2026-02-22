import { useEffect, useState } from "react";

export function useClientAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    setLoading(true);
    try {
      const res = await fetch("/api/client/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setUser(json.data);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  return { user, loading, fetchMe };
}

export default useClientAuth;
