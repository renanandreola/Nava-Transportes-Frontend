import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./DriverLayout.css";

export default function DriverLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setMe(data?.user || null);
      } catch {
        // se der erro, só não mostra o nome
      }
    })();
  }, []);

  const logout = async () => {
    await api.post("/auth/logout");
    navigate("/", { replace: true });
  };

  return (
    <div className="drv-shell">
      {/* Lateral */}
      <aside className="drv-aside">
        <div className="drv-brand">
          <div className="drv-logo-dot" />
          <div className="drv-brand-text">
            <strong>NAVA</strong>
            <span>Motorista</span>
          </div>
        </div>

        <nav className="drv-nav">
          <NavLink end to="/driver" className="drv-nav-item">
            <span>🏠</span> Início
          </NavLink>

          <div className="drv-nav-section">Viagens</div>

          <NavLink to="/driver/trips/new" className="drv-nav-item">
            <span>📝</span> Novo controle
          </NavLink>

          <NavLink
            to="/driver/trips"
            end
            className="drv-nav-item"
          >
            <span>📄</span> Minhas viagens
          </NavLink>
        </nav>

        <div className="drv-aside-foot">
          {me && (
            <div className="drv-user">
              <span className="drv-user-name">{me.name}</span>
              <span className="drv-user-role">
                {me.role === "driver" ? "Motorista" : me.role}
              </span>
            </div>
          )}

          <button
            className="drv-logout btn-ghost"
            type="button"
            onClick={logout}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="drv-main">
        <header className="drv-header">
          <div className="drv-h-left">
            <h1>Área do Motorista</h1>
            {me && (
              <p className="drv-header-sub">
                Logado como <strong>{me.name}</strong>
              </p>
            )}
          </div>
          <div className="drv-h-right">{/* espaço para futuro filtro/busca */}</div>
        </header>

        <section className="drv-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
