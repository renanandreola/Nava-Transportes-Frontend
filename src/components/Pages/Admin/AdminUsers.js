import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import "./AdminUsers.css";

export default function AdminUsers() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [allowBackdropClose, setAllowBackdropClose] = useState(false);
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPass, setFPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", {
        params: { q, limit: 50 },
      });
      setList(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = () => {
    setError("");
    setFName("");
    setFEmail("");
    setFPass("");
    setOpen(true);
    setAllowBackdropClose(false);

    setTimeout(() => setAllowBackdropClose(true), 150);
  };

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, saving]);

  const submitCreate = async (e) => {
    e.preventDefault();
    if (saving) return;

    setError("");
    setSaving(true);
    try {
      await api.post("/admin/users", {
        name: fName.trim(),
        email: fEmail.trim(),
        password: fPass,
        role: "driver",
        active: true,
      });
      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao criar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="card admin-main-card">
        <div className="card-head row">
          <div>
            <h2>Motoristas</h2>
            <p className="muted">
              Cadastre e gerencie os acessos dos motoristas.
            </p>
          </div>

          <div className="row gap users-actions">
            <input
              className="form-control users-search-input"
              placeholder="Buscar por nome ou usuário"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              className="btn btn-secondary"
              type="button"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={openModal}
              aria-haspopup="dialog"
              aria-expanded={open ? "true" : "false"}
            >
              Novo usuário
            </button>
          </div>
        </div>

        <div className="users-table-wrap">
          <table className="table table-striped users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário</th>
                <th>Função</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan="4" className="muted users-center-cell">
                    Sem resultados
                  </td>
                </tr>
              )}
              {list.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.active ? "Ativo" : "Inativo"}</td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan="4" className="muted users-center-cell">
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (allowBackdropClose && e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-modal-card pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Novo usuário</h3>
              <button
                className="btn btn-sm btn-outline-light"
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                Fechar
              </button>
            </div>

            <form className="users-form" onSubmit={submitCreate}>
              <div className="form-field">
                <label>Nome</label>
                <input
                  className="form-control"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label>Placa</label>
                <input
                  className="form-control"
                  type="text"
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-field">
                <label>Senha</label>
                <input
                  className="form-control"
                  type="password"
                  value={fPass}
                  onChange={(e) => setFPass(e.target.value)}
                  required
                />
              </div>

              {error && <div className="alert error-alert">{error}</div>}

              <div className="row end gap users-modal-actions">
                <button
                  className="btn btn-outline-light btn-sm"
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
