import React, { useEffect, useState } from "react";
import api from "../../../services/api";

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
        params: { q, limit: 50 }
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
        active: true
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
    <div className="card">
      <div className="card-head row">
        <div>
          <h2>Usuários (Motoristas)</h2>
          <p className="muted">Cadastre e gerencie os acessos dos motoristas.</p>
        </div>

        <div className="row gap">
          <input
            className="inp"
            placeholder="Buscar por nome ou e-mail"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn" type="button" onClick={fetchData}>
            Buscar
          </button>
          <button
            className="btn primary"
            type="button"
            onClick={openModal}
            aria-haspopup="dialog"
            aria-expanded={open ? "true" : "false"}
          >
            Novo usuário
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Função</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan="4" className="muted">
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
          </tbody>
        </table>
      </div>

      {open && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (allowBackdropClose && e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="modal-card pop" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Novo usuário</h3>
              <button className="btn-ghost" type="button" onClick={closeModal}>
                Fechar
              </button>
            </div>

            <form className="form" onSubmit={submitCreate}>
              <label>
                Nome
                <input
                  className="inp"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  required
                  autoFocus
                />
              </label>

              <label>
                E-mail
                <input
                  className="inp"
                  type="email"
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </label>

              <label>
                Senha
                <input
                  className="inp"
                  type="password"
                  value={fPass}
                  onChange={(e) => setFPass(e.target.value)}
                  required
                />
              </label>

              {error && <div className="alert">{error}</div>}

              <div className="row end gap">
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button className="btn primary" type="submit" disabled={saving}>
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
