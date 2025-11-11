import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../services/api";

export default function RequireRole({ role = "admin", children }) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/auth/me", { withCredentials: true });
        if (alive && data?.user?.role === role) setOk(true);
      } catch {}
      if (alive) setLoading(false);
    })();
    return () => { alive = false };
  }, [role]);

  if (loading) return null;
  if (!ok) return <Navigate to="/" replace />;
  return children;
}
