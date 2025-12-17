import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import "./AdminTrips.css";

// util simples para número e moeda
const n = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const brCurrency = (v) =>
  n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminTrips() {
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filtros
  const [driverId, setDriverId] = useState("");
  const [plate, setPlate] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  // edição
  const [editOpen, setEditOpen] = useState(false);
  const [allowBackdropClose, setAllowBackdropClose] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editingTrip, setEditingTrip] = useState(null);

  // campos do modal de edição
  const [fDriverId, setFDriverId] = useState("");
  const [fDriverName, setFDriverName] = useState("");
  const [fPlate, setFPlate] = useState("");
  const [fTotalFrete, setFTotalFrete] = useState(0);
  const [fTotalPago, setFTotalPago] = useState(0);
  const [fPremiacao, setFPremiacao] = useState(0);
  const [fTotalAssinado, setFTotalAssinado] = useState(0);

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get("/admin/users", {
        params: { role: "driver", limit: 200 },
      });
      setDrivers(data.items || []);
    } catch {
      // se falhar, só não mostra o select de motorista
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    setErr("");

    try {
      const { data } = await api.get("/admin/trips", {
        params: {
          driverId: driverId || undefined,
          plate: plate || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
          q: q || undefined,
          limit: 100,
        },
      });

      setTrips(data.items || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Falha ao carregar controles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitFilters = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  const clearFilters = () => {
    setDriverId("");
    setPlate("");
    setDateFrom("");
    setDateTo("");
    setQ("");
    fetchTrips();
  };

  const formatDateTime = (v) => {
    if (!v) return "-";
    try {
      return new Date(v).toLocaleString("pt-BR");
    } catch {
      return "-";
    }
  };

  const formatDate = (v) => {
    if (!v) return "-";
    try {
      return new Date(v).toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
  };

  // ---------- EDIÇÃO ----------

  const openEditModal = (trip) => {
    setEditError("");
    setEditingTrip(trip || null);

    setFDriverId(trip.driverId || "");
    setFDriverName(trip.driverName || "");
    setFPlate(trip.plate || "");
    setFTotalFrete(trip.totalDoFrete || trip.totalFrete || 0);
    setFTotalPago(trip.totalPago || 0);
    setFPremiacao(trip.premiacao || 0);
    setFTotalAssinado(trip.totalAssinado || 0);

    setEditOpen(true);
    setAllowBackdropClose(false);
    setTimeout(() => setAllowBackdropClose(true), 150);
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditOpen(false);
  };

  // atualizar nome do driver ao trocar no select
  useEffect(() => {
    if (!fDriverId) {
      return;
    }
    const d = drivers.find((x) => x._id === fDriverId);
    if (d) {
      setFDriverName(d.name || d.email || "");
    }
  }, [fDriverId, drivers]);

  // ESC fecha modal
  useEffect(() => {
    if (!editOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeEditModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editOpen, savingEdit]);

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingTrip || savingEdit) return;

    setEditError("");
    setSavingEdit(true);

    try {
      const payload = {
        driverId: fDriverId || undefined,
        driverName: fDriverName || undefined,
        plate: fPlate.trim(),
        totalDoFrete: n(fTotalFrete),
        totalPago: n(fTotalPago),
        premiacao: n(fPremiacao),
        totalAssinado: n(fTotalAssinado),
      };

      await api.put(`/admin/trips/${editingTrip._id}`, payload);

      setEditOpen(false);
      await fetchTrips();
    } catch (e2) {
      setEditError(
        e2?.response?.data?.message || "Erro ao atualizar controle"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (trip) => {
    const ok = window.confirm(
      `Tem certeza que deseja excluir o controle da placa "${trip.plate}"?`
    );
    if (!ok) return;

    try {
      await api.delete(`/admin/trips/${trip._id}`);
      await fetchTrips();
    } catch (e2) {
      alert(
        e2?.response?.data?.message || "Erro ao excluir controle"
      );
    }
  };

  // ---------- RENDER ----------

  return (
    <div className="card admin-trips-card">
      <div className="card-head row">
        <div>
          <h2>Controles de Saída (Motoristas)</h2>
          <p className="muted">
            Monitore os registros lançados pelos motoristas e aplique filtros
            por motorista, placa e período.
          </p>
        </div>

        <div className="row gap">
          <button
            type="button"
            className="btn"
            onClick={fetchTrips}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <form className="admin-trips-filters" onSubmit={handleSubmitFilters}>
        <div className="filters-row">
          <div className="filter-field">
            <label>Motorista</label>
            <select
              className="inp"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">Todos</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name || d.email}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Placa</label>
            <input
              className="inp"
              placeholder="Ex: ABC1D23"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
            />
          </div>

          <div className="filter-field">
            <label>Período (início)</label>
            <input
              className="inp"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label>Período (fim)</label>
            <input
              className="inp"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-field filter-grow">
            <label>Busca geral</label>
            <input
              className="inp"
              placeholder="Buscar por origem, destino, posto..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="filters-actions">
            <button
              type="button"
              className="btn"
              onClick={clearFilters}
              disabled={loading}
            >
              Limpar
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={loading}
            >
              Filtrar
            </button>
          </div>
        </div>
      </form>

      {err && (
        <div className="alert" style={{ marginBottom: 12 }}>
          {err}
        </div>
      )}

      {/* Tabela */}
      <div className="table-wrap admin-trips-table-wrap">
        {loading ? (
          <p className="muted">Carregando controles…</p>
        ) : trips.length === 0 ? (
          <p className="muted">
            Nenhum controle encontrado com os filtros atuais.
          </p>
        ) : (
          <table className="table admin-trips-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Motorista</th>
                <th>Placa</th>
                <th>KM Inicial</th>
                <th>KM Final</th>
                <th>KM Rodado</th>
                <th>Total Frete</th>
                <th>Total Pago</th>
                <th>Premiação</th>
                <th>Criado em</th>
                <th className="admin-trips-actions-col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => {
                const kmIni = n(t.kmInicial);
                const kmFim = n(t.kmFinal);
                const kmRodado = kmFim - kmIni;

                const dataPrincipal =
                  t.trechos && t.trechos.length
                    ? t.trechos[0].data
                    : t.data || t.createdAt;

                return (
                  <tr key={t._id}>
                    <td>{formatDate(dataPrincipal)}</td>
                    <td>{t.driverName || "-"}</td>
                    <td>{t.plate || "-"}</td>
                    <td>{kmIni || "-"}</td>
                    <td>{kmFim || "-"}</td>
                    <td>{kmRodado || "-"}</td>
                    <td>{brCurrency(t.totalDoFrete || t.totalFrete)}</td>
                    <td>{brCurrency(t.totalPago)}</td>
                    <td>{brCurrency(t.premiacao)}</td>
                    <td>{formatDateTime(t.createdAt)}</td>
                    <td className="admin-trips-row-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEditModal(t)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(t)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de edição */}
      {editOpen && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (allowBackdropClose && e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div
            className="admin-modal-card pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Editar controle de saída</h3>
              <button
                className="btn btn-sm btn-outline-light"
                type="button"
                onClick={closeEditModal}
                disabled={savingEdit}
              >
                Fechar
              </button>
            </div>

            <form className="admin-trips-form" onSubmit={submitEdit}>
              <div className="form-field">
                <label>Motorista</label>
                <select
                  className="form-control"
                  value={fDriverId}
                  onChange={(e) => setFDriverId(e.target.value)}
                >
                  <option value="">(manter atual)</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name || d.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Nome do motorista (exibição)</label>
                <input
                  className="form-control"
                  value={fDriverName}
                  onChange={(e) => setFDriverName(e.target.value)}
                  placeholder="Vai para o campo driverName"
                />
              </div>

              <div className="form-field">
                <label>Placa</label>
                <input
                  className="form-control"
                  value={fPlate}
                  onChange={(e) => setFPlate(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="admin-trips-form-grid">
                <div className="form-field">
                  <label>Total do Frete</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    value={fTotalFrete}
                    onChange={(e) => setFTotalFrete(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Total Pago</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    value={fTotalPago}
                    onChange={(e) => setFTotalPago(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Premiação</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    value={fPremiacao}
                    onChange={(e) => setFPremiacao(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Total Assinado</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    value={fTotalAssinado}
                    onChange={(e) => setFTotalAssinado(e.target.value)}
                  />
                </div>
              </div>

              {editError && (
                <div className="alert error-alert">{editError}</div>
              )}

              <div className="row end gap admin-trips-modal-actions">
                <button
                  className="btn btn-outline-light btn-sm"
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  type="submit"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
