import React, { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import api from "../../services/api";

export default function RequireAuth({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const triedRef = useRef(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (alive && data?.user) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch {
        if (alive) setAuthorized(false);
      } finally {
        if (alive) {
          triedRef.current = true;
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading || !triedRef.current) return null;

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return children;
}
