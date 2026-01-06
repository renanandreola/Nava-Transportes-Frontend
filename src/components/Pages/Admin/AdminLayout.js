import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async () => {
    await api.post("/auth/logout", { withCredentials: true });
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="adm-shell">
      {menuOpen && (
        <div className="adm-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`adm-aside ${menuOpen ? "open" : ""}`}>
        <div className="adm-brand">
          <div className="logo-dot" />
          <div className="brand-text">
            <strong>NAVA</strong>
            <span>Admin</span>
          </div>
        </div>

        <nav className="adm-nav">
          <NavLink
            end
            to="/admin"
            className="nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>📊</span> Dashboard
          </NavLink>

          <div className="nav-section">Gestão</div>

          <NavLink
            to="/admin/users"
            className="nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>👤</span> Usuários (Motoristas)
          </NavLink>

          <NavLink
            to="/admin/trips"
            className="nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>🚚</span> Controles de Saída
          </NavLink>

          {/* <div className="nav-section">Análises</div>

          <NavLink
            to="/admin/analytics"
            className="nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>📈</span> Indicadores
          </NavLink> */}
        </nav>

        <div className="drv-aside-foot">
          <button className="btn-ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="adm-main">
        <header className="adm-header">
          <div className="h-left">
            <button
              className="adm-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
            >
              ☰
            </button>

            <h1>Área Administrativa</h1>
          </div>

          <div className="h-right">{/* espaço futuro */}</div>
        </header>

        <section className="adm-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
