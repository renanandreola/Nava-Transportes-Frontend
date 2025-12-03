import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Checa sessão existente apenas uma vez ao montar
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (!alive || !data?.user) return;

        const role = data.user.role;
        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/driver", { replace: true });
        }
      } catch {
        // usuário não autenticado -> permanece na tela de login
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErr("");
    setLoading(true);
    try {
      // login
      const resp = await api.post("/auth/login", { email, password });

      // opção A: role vindo do login
      let role = resp?.data?.user?.role;

      // opção B: confirmar com /auth/me
      try {
        const me = await api.get("/auth/me");
        role = me?.data?.user?.role || role;
      } catch {
        // se /auth/me falhar, segue com o role do login
      }

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/driver", { replace: true });
      }
    } catch (error) {
      setErr(error?.response?.data?.message || "Falha ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim() && password.trim() && !loading;
  const year = new Date().getFullYear();

  return (
    <div className="nava-login">
      {/* Card central de login */}
      <main className="login-main">
        <div className="nava-card">
          <h1 className="login-title">Entre em sua conta</h1>

          <form
            className={`nava-form ${err ? "shake" : ""}`}
            onSubmit={onSubmit}
            noValidate
          >
            <label className="field">
              <span className="field-label">Usuário</span>
              <div className="field-box with-icon">
                <input
                  type="text"
                  placeholder="Usuário"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  autoComplete="username"
                  inputMode="email"
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">Senha</span>
              <div className="field-box with-icon">
                <input
                  type='password'
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </label>

            {err && <div className="alert">{err}</div>}

            <button className="btn-primary" type="submit" disabled={!canSubmit}>
              {loading ? (
                <span
                  className="spinner"
                  aria-live="polite"
                  aria-busy="true"
                />
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <footer className="login-footer">
          <span className="muted">
            © {year} Nava Transportes • Rio Grande do Sul
          </span>
        </footer>
      </main>
    </div>
  );
}
