import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = async () => {
    await api.post("/auth/logout");
    navigate("/", { replace: true });
  };

  return (
    <div className="adm-shell">
      <aside className="adm-aside">
        <div className="adm-brand">
          <div className="logo-dot" />
          <div className="brand-text">
            <strong>NAVA</strong>
            <span>Admin panel</span>
          </div>
        </div>

        <nav className="adm-nav" aria-label="Navegação administrativa">
          <NavLink end to="/admin" className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </NavLink>

          <div className="nav-section">Gestão</div>

          <NavLink to="/admin/users" className="nav-item">
            <span className="nav-icon">👤</span>
            <span className="nav-label">Motoristas</span>
          </NavLink>
        </nav>

        <div className="adm-aside-foot">
          <button className="btn-ghost" type="button" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <header className="adm-header">
          <div className="h-left">
            <h1>Área Administrativa</h1>
            <p className="muted">Gerencie motoristas, acessos e operações.</p>
          </div>
          <div className="h-right">
            {/* espaço para busca/ações futuras */}
          </div>
        </header>

        <section className="adm-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
