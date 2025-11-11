import React, { useEffect, useState } from "react";
import api from "../../../services/api";

export default function AdminDashboard() {
  const [me, setMe] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);

  const [latest, setLatest] = useState([]);

  const formatDateTime = (v) => {
    if (!v) return "-";
    try {
      return new Date(v).toLocaleString("pt-BR");
    } catch {
      return "-";
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setErr("");

    try {
      const meResp = await api.get("/auth/me");
      setMe(meResp?.data?.user || null);

      const [all, drivers, admins, latestResp] = await Promise.all([
        api.get("/admin/users", { params: { limit: 1 } }),
        api.get("/admin/users", { params: { role: "driver", limit: 1 } }),
        api.get("/admin/users", { params: { role: "admin", limit: 1 } }),
        api.get("/admin/users", { params: { limit: 5 } }),
      ]);

      setTotalUsers(all?.data?.total ?? 0);
      setTotalDrivers(drivers?.data?.total ?? 0);
      setTotalAdmins(admins?.data?.total ?? 0);
      setLatest(latestResp?.data?.items || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div className="card">
      <div className="card-head row">
        <div>
          <h2>Visão geral</h2>
          <p className="muted">
            {me ? (
              <>Bem-vindo, <strong>{me.name}</strong> — perfil <b>{me.role}</b>.</>
            ) : (
              <>Bem-vindo ao painel administrativo.</>
            )}
          </p>
        </div>
        <div className="row gap">
          <button className="btn" type="button" onClick={fetchAll} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      {err && (
        <div className="alert" style={{ marginBottom: 12 }}>
          {err}
        </div>
      )}

      {/* KPIs */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="stat">
          <div className="stat-num">{loading ? "—" : totalDrivers}</div>
          <div className="stat-label">Motoristas ativos (role: driver)</div>
        </div>
        <div className="stat">
          <div className="stat-num">{loading ? "—" : totalAdmins}</div>
          <div className="stat-label">Administradores</div>
        </div>
        <div className="stat">
          <div className="stat-num">{loading ? "—" : totalUsers}</div>
          <div className="stat-label">Total de usuários</div>
        </div>
      </div>

      {/* Últimos cadastrados */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-head" style={{ margin: 0, padding: "12px 16px" }}>
          <div>
            <h3 style={{ margin: 0 }}>Últimos cadastrados</h3>
            <p className="muted" style={{ margin: 0 }}>
              Mostrando até 5 mais recentes
            </p>
          </div>
        </div>
        <div className="table-wrap" style={{ padding: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Função</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {!loading && latest.length === 0 && (
                <tr>
                  <td colSpan="4" className="muted">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              )}
              {latest.map((u) => (
                <tr key={u._id}>
                  <td>{u.name || "-"}</td>
                  <td>{u.email || "-"}</td>
                  <td>{u.role || "-"}</td>
                  <td>{formatDateTime(u.createdAt)}</td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan="4" className="muted">
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
