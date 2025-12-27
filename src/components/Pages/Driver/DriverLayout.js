import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./DriverLayout.css";

export default function DriverLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setMe(data?.user || null);
      } catch {}
    })();
  }, []);

  // Fecha menu com ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const logout = async () => {
    await api.post("/auth/logout");
    navigate("/", { replace: true });
  };

  return (
    <div className="drv-shell">
      {/* Backdrop mobile */}
      {menuOpen && (
        <div className="drv-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`drv-aside ${menuOpen ? "open" : ""}`}>
        <div className="drv-brand">
          <div className="drv-logo-dot" />
          <div className="drv-brand-text">
            <strong>NAVA</strong>
            <span>Motorista</span>
          </div>
        </div>

        <nav className="drv-nav">
          <NavLink
            end
            to="/driver"
            className="drv-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>🏠</span> Início
          </NavLink>

          <div className="drv-nav-section">Viagens</div>

          <NavLink
            to="/driver/trips/new"
            className="drv-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>📝</span> Novo controle
          </NavLink>

          <NavLink
            to="/driver/trips"
            end
            className="drv-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>📄</span> Minhas viagens
          </NavLink>
        </nav>

        <div className="drv-aside-foot">
          {me && (
            <div className="drv-user">
              <span className="drv-user-name">{me.name}</span>
              <span className="drv-user-role"> - Motorista</span>
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
            <button
              className="drv-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
            >
              ☰
            </button>

            <div>
              <h1>Área do Motorista</h1>
              {me && (
                <p className="drv-header-sub">
                  Logado como <strong>{me.name}</strong>
                </p>
              )}
            </div>
          </div>
        </header>

        <section className="drv-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
