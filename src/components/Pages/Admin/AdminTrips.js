import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import "./AdminTrips.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const n = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const brCurrency = (v) =>
  n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminTrips() {
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [driverId, setDriverId] = useState("");
  const [plate, setPlate] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [allowBackdropClose, setAllowBackdropClose] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editingTrip, setEditingTrip] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewingTrip, setViewingTrip] = useState(null);

  const [fDriverId, setFDriverId] = useState("");
  const [fDriverName, setFDriverName] = useState("");
  const [fPlate, setFPlate] = useState("");
  const [fTotalFrete, setFTotalFrete] = useState(0);
  // const [fTotalPago, setFTotalPago] = useState(0);
const [fPremiacaoValor, setFPremiacaoValor] = useState(0);
  // const [fTotalAssinado, setFTotalAssinado] = useState(0);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapTrip, setMapTrip] = useState(null);

  const openMapModal = (trip) => {
    if (!trip || !trip.latitude || !trip.longitude) return;
    setMapTrip(trip);
    setMapOpen(true);
    setAllowBackdropClose(false);
    setTimeout(() => setAllowBackdropClose(true), 150);
  };

  const closeMapModal = () => {
    setMapOpen(false);
    setMapTrip(null);
  };

  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeMapModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapOpen]);

  const handleExportPdf = () => {
    if (!trips || trips.length === 0) {
      alert("Não há controles para exportar com os filtros atuais.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(14);
    doc.text("Controles de Saída - Nava Transportes", 14, 14);

    const filtros = [];
    if (driverId) {
      const d = drivers.find((x) => x._id === driverId);
      filtros.push("Motorista: " + (d?.name || d?.email || driverId));
    }
    if (plate) filtros.push("Placa: " + plate);
    if (dateFrom) filtros.push("De: " + formatDate(dateFrom));
    if (dateTo) filtros.push("Até: " + formatDate(dateTo));
    if (q) filtros.push("Busca: " + q);

    doc.setFontSize(10);
    doc.text(
      "Filtros: " + (filtros.length ? filtros.join(" | ") : "Nenhum"),
      14,
      22
    );
    doc.text(
      "Gerado em: " + new Date().toLocaleString("pt-BR"),
      14,
      28
    );

    const body = trips.map((t) => {
      const kmIni = n(t.kmInicial);
      const kmFim = n(t.kmFinal);
      const kmRodado = kmFim - kmIni;

      const dataPrincipal =
        t.trechos && t.trechos.length
          ? t.trechos[0].data
          : t.data || t.createdAt;

      return [
        formatDate(dataPrincipal),
        t.driverName || "-",
        t.plate || "-",
        kmIni || "-",
        kmFim || "-",
        kmRodado || "-",
        brCurrency(t.totalDoFrete || t.totalFrete),
        // brCurrency(t.totalPago),
        `${brCurrency(t.premiacaoValor || 0)} (${t.premiacaoPercentual || 0}%)`,
        // brCurrency(t.totalAssinado),
        formatDateTime(t.createdAt),
      ];
    });

    autoTable(doc, {
      startY: 34,
      head: [[
        "Data",
        "Motorista",
        "Placa",
        "KM Inicial",
        "KM Final",
        "KM Rodado",
        "Total Frete",
        // "Total Pago",
        "Premiação",
        // "Total Assinado",
        "Criado em",
      ]],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save("controles_saida.pdf");
  };

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get("/admin/users", {
        params: { role: "driver", limit: 200 },
      });
      setDrivers(data.items || []);
    } catch {
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

  const openEditModal = (trip) => {
    setEditError("");
    setEditingTrip(trip || null);

    setFDriverId(trip.driverId || "");
    setFDriverName(trip.driverName || "");
    setFPlate(trip.plate || "");
    setFTotalFrete(trip.totalDoFrete || trip.totalFrete || 0);
    // setFTotalPago(trip.totalPago || 0);
    setFPremiacaoValor(trip.premiacaoValor || 0);
    // setFTotalAssinado(trip.totalAssinado || 0);

    setEditOpen(true);
    setAllowBackdropClose(false);
    setTimeout(() => setAllowBackdropClose(true), 150);
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditOpen(false);
  };

  useEffect(() => {
    if (!fDriverId) {
      return;
    }
    const d = drivers.find((x) => x._id === fDriverId);
    if (d) {
      setFDriverName(d.name || d.email || "");
    }
  }, [fDriverId, drivers]);

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
        // totalPago: n(fTotalPago),
        premiacaoValor: n(fPremiacaoValor),
        // totalAssinado: n(fTotalAssinado),
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
      alert(e2?.response?.data?.message || "Erro ao excluir controle");
    }
  };

  const openDetailsModal = (trip) => {
    setViewingTrip(trip || null);
    setDetailsOpen(true);
    setAllowBackdropClose(false);
    setTimeout(() => setAllowBackdropClose(true), 150);
  };

  const closeDetailsModal = () => {
    setDetailsOpen(false);
  };

  useEffect(() => {
    if (!detailsOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeDetailsModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailsOpen]);

  const renderDetailsModal = () => {
    if (!detailsOpen || !viewingTrip) return null;

    const t = viewingTrip;
    const kmIni = n(t.kmInicial);
    const kmFim = n(t.kmFinal);
    const kmRodado = kmFim - kmIni;
    const litrosTotal = n(t.litrosTotal);
    const mediaGeral = n(t.mediaGeral);
    const extras = Array.isArray(t.extras) ? t.extras : [];
    const trechos = Array.isArray(t.trechos) ? t.trechos : [];

    const dataPrincipal =
      trechos && trechos.length
        ? trechos[0].data
        : t.data || t.createdAt;

    return (
      <div
        className="admin-modal admin-trips-details-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (allowBackdropClose && e.target === e.currentTarget) {
            closeDetailsModal();
          }
        }}
      >
        <div
          className="admin-modal-card admin-trips-details-card pop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-head admin-trips-details-head">
            <div>
              <h3>Detalhes do controle de saída</h3>
              <p className="muted small">
                Motorista: <b>{t.driverName || "-"}</b> • Placa:{" "}
                <b>{t.plate || "-"}</b> • Data principal:{" "}
                <b>{formatDate(dataPrincipal)}</b>
              </p>
            </div>
            <button
              className="btn btn-sm btn-outline-light"
              type="button"
              onClick={closeDetailsModal}
            >
              Fechar
            </button>
          </div>

          {/* Resumo geral */}
          <div className="admin-trips-details-grid">
            <div className="admin-trips-details-section">
              <h4>Resumo do veículo</h4>
              <div className="details-kv">
                <div>
                  <span>KM Inicial</span>
                  <strong>{kmIni || "-"}</strong>
                </div>
                <div>
                  <span>KM Final</span>
                  <strong>{kmFim || "-"}</strong>
                </div>
                <div>
                  <span>KM Rodado</span>
                  <strong>{kmRodado || "-"}</strong>
                </div>
              </div>

              <div className="details-kv">
                <div>
                  <span>Litros total</span>
                  <strong>{litrosTotal || "-"}</strong>
                </div>
                <div>
                  <span>Média geral (km/l)</span>
                  <strong>{mediaGeral || "-"}</strong>
                </div>
              </div>
            </div>

            <div className="admin-trips-details-section">
              <h4>Resumo financeiro</h4>
              <div className="details-kv">
                <div>
                  <span>Total do Frete</span>
                  <strong>{brCurrency(t.totalDoFrete || t.totalFrete)}</strong>
                </div>
                {/* <div>
                  <span>Total Pago</span>
                  <strong>{brCurrency(t.totalPago)}</strong>
                </div> */}
              </div>
              <div className="details-kv">
                <div>
                  <span>Premiação</span>
                  <strong>
                    {brCurrency(t.premiacaoValor || 0)}
                    <span className="muted"> ({t.premiacaoPercentual || 0}%)</span>
                  </strong>
                </div>
                {/* <div>
                  <span>Total Assinado</span>
                  <strong>{brCurrency(t.totalAssinado)}</strong>
                </div> */}
              </div>

              <p className="muted small created-at">
                Criado em: {formatDateTime(t.createdAt)}
              </p>
            </div>
          </div>

          {/* Extras */}
          {extras.length > 0 && (
            <div className="admin-trips-details-section admin-trips-extras">
              <h4>Extras</h4>
              <table className="table admin-trips-details-extras-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th style={{ width: 140 }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {extras.map((ex, idx) => (
                    <tr key={idx}>
                      <td>{ex.descricao || "-"}</td>
                      <td>{brCurrency(ex.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Trechos */}
          <div className="admin-trips-details-section">
            <h4>Trechos cadastrados</h4>
            {trechos.length === 0 ? (
              <p className="muted small">
                Nenhum trecho cadastrado para este controle.
              </p>
            ) : (
              <div className="table-wrap admin-trips-details-table-wrap">
                <table className="table admin-trips-details-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Origem</th>
                      <th>Destino</th>
                      <th>Frete (R$)</th>
                      <th>Adiant. (R$)</th>
                      <th>Saldo (R$)</th>
                      <th>KM Ini</th>
                      <th>KM Fin</th>
                      <th>Posto</th>
                      <th>Litros</th>
                      <th>Média</th>
                      {/* <th>Assinador</th> */}
                      <th>Pago?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trechos.map((r, idx) => {
                      const linhaKmIni = n(r.kmInicial);
                      const linhaKmFim = n(r.kmFinal);
                      const linhaSaldo = n(r.saldo);
                      const linhaFrete = n(r.frete);
                      const linhaAdto = n(r.adiantamento);

                      return (
                        <tr key={idx}>
                          <td>{formatDate(r.data)}</td>
                          <td>{r.origem || "-"}</td>
                          <td>{r.destino || "-"}</td>
                          <td>{brCurrency(linhaFrete)}</td>
                          <td>{brCurrency(linhaAdto)}</td>
                          <td>{brCurrency(linhaSaldo)}</td>
                          <td>{linhaKmIni || "-"}</td>
                          <td>{linhaKmFim || "-"}</td>
                          <td>{r.posto || "-"}</td>
                          <td>{r.litros || 0}</td>
                          <td>{r.mediaTrecho || 0}</td>
                          {/* <td>{r.assinador || "-"}</td> */}
                          <td>{r.pago ? "Sim" : "Não"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
            className="btn btn-primary"
            onClick={fetchTrips}
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportPdf}
            disabled={loading || !trips.length}
          >
            Exportar PDF
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
              className="btn btn-danger"
              onClick={clearFilters}
              disabled={loading}
            >
              Limpar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
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
                {/* <th>Total Pago</th> */}
                <th>Premiação</th>
                <th>Local</th>
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

                const hasCoords = t.latitude && t.longitude;

                return (
                  <tr key={t._id}>
                    <td>{formatDate(dataPrincipal)}</td>
                    <td>{t.driverName || "-"}</td>
                    <td>{t.plate || "-"}</td>
                    <td>{kmIni || "-"}</td>
                    <td>{kmFim || "-"}</td>
                    <td>{kmRodado || "-"}</td>
                    <td>{brCurrency(t.totalDoFrete || t.totalFrete)}</td>
                    {/* <td>{brCurrency(t.totalPago)}</td> */}
                    <td>
                      {brCurrency(t.premiacaoValor || 0)}
                      <span className="muted"> ({t.premiacaoPercentual || 0}%)</span>
                    </td>
                    <td>
                      {hasCoords ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openMapModal(t)}
                        >
                          Ver mapa
                        </button>
                      ) : (
                        <span className="muted">Sem local</span>
                      )}
                    </td>
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
            
            <hr></hr>

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

                {/* <div className="form-field">
                  <label>Total Pago</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    value={fTotalPago}
                    onChange={(e) => setFTotalPago(e.target.value)}
                  />
                </div> */}

                <div className="form-field">
                  <label>Premiação (R$)</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    value={fPremiacaoValor}
                    onChange={(e) => setFPremiacaoValor(e.target.value)}
                  />
                </div>
{/* 
                <div className="form-field">
                  <label>Total Assinado</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    value={fTotalAssinado}
                    onChange={(e) => setFTotalAssinado(e.target.value)}
                  />
                </div> */}
              </div>

              {editError && (
                <div className="alert error-alert">{editError}</div>
              )}

              <hr></hr>

              <div className="admin-trips-modal-actions">
                <button
                  className="btn btn-outline-light"
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
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

      {/* Modal de mapa */}
      {mapOpen && mapTrip && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (allowBackdropClose && e.target === e.currentTarget) {
              closeMapModal();
            }
          }}
        >
          <div
            className="admin-modal-card pop admin-map-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Local do registro</h3>
              <button
                className="btn btn-sm btn-outline-light"
                type="button"
                onClick={closeMapModal}
              >
                Fechar
              </button>
            </div>

            <div className="admin-map-info">
              <p className="muted">
                Motorista: <strong>{mapTrip.driverName || "-"}</strong> • Placa:{" "}
                <strong>{mapTrip.plate || "-"}</strong>
              </p>
              {mapTrip.latitude && mapTrip.longitude && (
                <p className="muted">
                  Coordenadas:{" "}
                  {mapTrip.latitude.toFixed(5)}, {mapTrip.longitude.toFixed(5)}
                </p>
              )}
            </div>

            <div className="admin-map-container">
              {mapTrip.latitude && mapTrip.longitude ? (
                <iframe
                  title="Mapa do local do registro"
                  src={`https://www.google.com/maps?q=${mapTrip.latitude},${mapTrip.longitude}&z=15&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <p className="muted">Sem coordenadas para este controle.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      {renderDetailsModal()}
    </div>
  );
}
