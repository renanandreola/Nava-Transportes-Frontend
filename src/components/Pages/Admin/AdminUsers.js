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
  const [editingUser, setEditingUser] = useState(null); // <- novo
  
  const roleLabel = {
    driver: "Motorista",
    admin: "Administrador",
  };

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

  const openCreateModal = () => {
    setError("");
    setEditingUser(null);
    setFName("");
    setFEmail("");
    setFPass("");
    setOpen(true);
    setAllowBackdropClose(false);

    setTimeout(() => setAllowBackdropClose(true), 150);
  };

  const openEditModal = (user) => {
    setError("");
    setEditingUser(user);
    setFName(user.name || "");
    setFEmail(user.email || "");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setError("");
    setSaving(true);

    try {
      const payload = {
        name: fName.trim(),
        email: fEmail.trim(),
        role: "driver",
        active: true,
      };

      if (fPass) {
        payload.password = fPass;
      }

      if (editingUser && editingUser._id) {
        await api.put(`/admin/users/${editingUser._id}`, payload);
      } else {
        if (!payload.password) {
          setError("Senha é obrigatória para novo usuário.");
          setSaving(false);
          return;
        }
        await api.post("/admin/users", payload);
      }

      setOpen(false);
      await fetchData();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Erro ao salvar usuário"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const ok = window.confirm(
      `Tem certeza que deseja excluir o usuário "${user.name}"?`
    );
    if (!ok) return;

    try {
      await api.delete(`/admin/users/${user._id}`);
      await fetchData();
    } catch (err) {
      alert(
        err?.response?.data?.message || "Erro ao excluir usuário"
      );
    }
  };

  return (
    <div className="admin-page">
      <div className="card admin-main-card">
        <div className="card-head row">
          <div>
            <h2>Motoristas</h2>
            <p className="muted">
              Cadastre, edite e gerencie os acessos dos motoristas.
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
              onClick={openCreateModal}
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
                <th className="users-actions-col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan="5" className="muted users-center-cell">
                    Sem resultados
                  </td>
                </tr>
              )}

              {list.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                 <td>{roleLabel[u.role] || "-"}</td>
                  <td>{u.active ? "Ativo" : "Inativo"}</td>
                  <td className="users-row-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openEditModal(u)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(u)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td colSpan="5" className="muted users-center-cell">
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de criação / edição */}
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
              <h3>{editingUser ? "Editar usuário" : "Novo usuário"}</h3>
              <button
                className="btn btn-sm btn-outline-light"
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                Fechar
              </button>
            </div>

            <hr></hr>

            <form className="users-form" onSubmit={handleSubmit}>
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
                <label>Placa / Usuário</label>
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
                <label>
                  Senha{" "}
                  {editingUser && (
                    <span className="muted">
                      (preencha apenas se desejar alterar)
                    </span>
                  )}
                </label>
                <input
                  className="form-control"
                  type="password"
                  value={fPass}
                  onChange={(e) => setFPass(e.target.value)}
                  placeholder={editingUser ? "Deixar em branco para manter" : ""}
                  required={!editingUser}
                />
              </div>

              {error && <div className="alert error-alert">{error}</div>}
            
              <hr></hr>

              <div className="users-modal-actions">
                <button
                  className="btn btn-outline-light"
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? editingUser
                      ? "Atualizando..."
                      : "Salvando..."
                    : editingUser
                    ? "Atualizar"
                    : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
