import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// mantenho seu path exatamente como você enviou:
import api from "../../../services/api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("admin");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      await api.post("/auth/login", { email, password });
      // confirmação opcional da sessão (evita qualquer corrida)
      await api.get("/auth/me");
      navigate("/home", { replace: true });
    } catch (error) {
      setErr(error?.response?.data?.message || "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nava-login">
      {/* Lado visual / hero */}
      <div className="nava-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="brand-mark">NAVA TRANSPORTES</div>
          <p className="brand-sub">• Acesso</p>
          <h1>Bem-vindo de volta</h1>
          <p className="hero-text">
            Acesse o painel com segurança para gerenciar operações,
            rotas e integrações.
          </p>
        </div>
        <div className="bg-blob blob-a" />
        <div className="bg-blob blob-b" />
      </div>

      {/* Card de login */}
      <div className="nava-card">
        <header className="card-head">
          <div className="card-logo">🔐</div>
          <div>
            <h2>Entrar</h2>
            <p>Acesso restrito</p>
          </div>
        </header>

        <form className={`nava-form ${err ? "shake" : ""}`} onSubmit={onSubmit}>
          <label className="field">
            <span>E-mail</span>
            <div className="field-box with-icon">
              <span className="icon" aria-hidden>📧</span>
              <input
                type="email"
                placeholder="email@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                autoComplete="username"
              />
            </div>
          </label>

          <label className="field">
            <span>Senha</span>
            <div className="field-box with-icon">
              <span className="icon" aria-hidden>🔒</span>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle"
                onClick={() => setShowPwd((s) => !s)}
                aria-label="Mostrar/ocultar senha"
                title={showPwd ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </label>

          {err && <div className="alert">{err}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner" aria-live="polite" aria-busy="true" />
            ) : (
              "Entrar"
            )}
          </button>

          <div className="form-footer">
            <span className="muted">Suporte: TI • interno</span>
          </div>
        </form>

        <footer className="card-foot">
          <span className="badge">v1.0</span>
          <span className="sep" />
          <span className="muted">© {new Date().getFullYear()} Nava</span>
        </footer>
      </div>
    </div>
  );
}
