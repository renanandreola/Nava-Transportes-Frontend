import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../services/api";

export default function RequireRole({ role, children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await api.get("/auth/me");

        if (alive && data?.user?.role === role) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch {
        if (alive) setAuthorized(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [role]);

  if (loading) return null;

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return children;
}
