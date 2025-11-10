import React, { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import api from "../../services/api";

export default function RequireAuth({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const triedRef = useRef(false); // evita corridas

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await api.get("/auth/me", { withCredentials: true });
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

  // Enquanto não terminou a checagem, não decide rota
  if (loading || !triedRef.current) return null; // ou um spinner

  if (!authorized) return <Navigate to="/" replace />;

  return children;
}
