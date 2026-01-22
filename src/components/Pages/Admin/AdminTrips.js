import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import "./AdminTrips.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const n = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const brCurrency = (v) =>
  n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const asArray = (v) => (Array.isArray(v) ? v : []);

const toDateTimeLocal = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [allowBackdropClose, setAllowBackdropClose] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [, setEditingTrip] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
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

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get("/admin/users", {
        params: { role: "driver", limit: 200 },
      });
      setDrivers(data.items || []);
    } catch {}
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
    doc.text("Gerado em: " + new Date().toLocaleString("pt-BR"), 14, 28);

    const body = trips.map((t) => {
      const kmIni = n(t.kmInicial);
      const kmFim = n(t.kmFinal);
      const kmRodado = kmFim - kmIni;

      const dataPrincipal =
        t.trechos && t.trechos.length ? t.trechos[0].data : t.data || t.createdAt;

      return [
        formatDate(dataPrincipal),
        t.driverName || "-",
        t.plate || "-",
        kmIni || "-",
        kmFim || "-",
        kmRodado || "-",
        brCurrency(t.totalDoFrete || t.totalFrete),
        `${brCurrency(t.premiacaoValor || 0)} (${t.premiacaoPercentual || 0}%)`,
        formatDateTime(t.createdAt),
      ];
    });

    autoTable(doc, {
      startY: 34,
      head: [
        [
          "Data",
          "Motorista",
          "Placa",
          "KM Inicial",
          "KM Final",
          "KM Rodado",
          "Total Frete",
          "Premiação",
          "Criado em",
        ],
      ],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save("controles_saida.pdf");
  };

  const openEditModal = async (trip) => {
    setEditError("");
    setEditingTrip(trip || null);

    setEditOpen(true);
    setAllowBackdropClose(false);
    setTimeout(() => setAllowBackdropClose(true), 150);

    setEditForm(null);

    try {
      const { data } = await api.get(`/admin/trips/${trip._id}`);
      const full = data?.item || data;

      setEditForm({
        _id: full._id,

        driverId: full.driverId || "",
        driverName: full.driverName || "",
        plate: (full.plate || "").toUpperCase(),

        data: full.data || "",
        createdAt: full.createdAt || "",

        latitude: full.latitude ?? "",
        longitude: full.longitude ?? "",

        kmInicial: full.kmInicial ?? "",
        kmFinal: full.kmFinal ?? "",
        litrosTotal: full.litrosTotal ?? "",
        mediaGeral: full.mediaGeral ?? "",

        totalDoFrete: full.totalDoFrete ?? full.totalFrete ?? "",
        premiacaoValor: full.premiacaoValor ?? "",
        premiacaoPercentual: full.premiacaoPercentual ?? "",

        extras: asArray(full.extras).map((x) => ({
          descricao: x?.descricao || "",
          valor: x?.valor ?? "",
        })),

        trechos: asArray(full.trechos).map((r) => ({
          data: r?.data || "",
          origem: r?.origem || "",
          destino: r?.destino || "",
          frete: r?.frete ?? "",
          adiantamento: r?.adiantamento ?? "",
          saldo: r?.saldo ?? "",
          kmInicial: r?.kmInicial ?? "",
          kmFinal: r?.kmFinal ?? "",
          posto: r?.posto || "",
          litros: r?.litros ?? "",
          mediaTrecho: r?.mediaTrecho ?? "",
          pago: !!r?.pago,
        })),
      });
    } catch (e) {
      setEditError(
        e?.response?.data?.message ||
          "Não foi possível carregar o controle completo para edição."
      );
    }
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditOpen(false);
    setEditingTrip(null);
    setEditForm(null);
  };

  useEffect(() => {
    if (!editOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeEditModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen, savingEdit]);

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editForm || savingEdit) return;

    setEditError("");
    setSavingEdit(true);

    try {
      const payload = {
        driverId: editForm.driverId || undefined,
        driverName: editForm.driverName || undefined,
        plate: (editForm.plate || "").trim().toUpperCase(),

        data: editForm.data ? new Date(editForm.data) : undefined,

        latitude:
          editForm.latitude === "" || editForm.latitude === null
            ? undefined
            : Number(editForm.latitude),
        longitude:
          editForm.longitude === "" || editForm.longitude === null
            ? undefined
            : Number(editForm.longitude),

        kmInicial: editForm.kmInicial === "" ? undefined : n(editForm.kmInicial),
        kmFinal: editForm.kmFinal === "" ? undefined : n(editForm.kmFinal),
        litrosTotal:
          editForm.litrosTotal === "" ? undefined : n(editForm.litrosTotal),
        mediaGeral:
          editForm.mediaGeral === "" ? undefined : n(editForm.mediaGeral),

        totalDoFrete:
          editForm.totalDoFrete === "" ? undefined : n(editForm.totalDoFrete),
        premiacaoValor:
          editForm.premiacaoValor === "" ? undefined : n(editForm.premiacaoValor),
        premiacaoPercentual:
          editForm.premiacaoPercentual === ""
            ? undefined
            : n(editForm.premiacaoPercentual),

        extras: asArray(editForm.extras).map((x) => ({
          descricao: x.descricao || "",
          valor: x.valor === "" ? 0 : n(x.valor),
        })),

        trechos: asArray(editForm.trechos).map((r) => ({
          data: r.data ? new Date(r.data) : undefined,
          origem: r.origem || "",
          destino: r.destino || "",
          frete: r.frete === "" ? 0 : n(r.frete),
          adiantamento: r.adiantamento === "" ? 0 : n(r.adiantamento),
          saldo: r.saldo === "" ? 0 : n(r.saldo),
          kmInicial: r.kmInicial === "" ? 0 : n(r.kmInicial),
          kmFinal: r.kmFinal === "" ? 0 : n(r.kmFinal),
          posto: r.posto || "",
          litros: r.litros === "" ? 0 : n(r.litros),
          mediaTrecho: r.mediaTrecho === "" ? 0 : n(r.mediaTrecho),
          pago: !!r.pago,
        })),
      };

      await api.put(`/admin/trips/${editForm._id}`, payload);

      setEditOpen(false);
      setEditForm(null);
      setEditingTrip(null);
      await fetchTrips();
    } catch (e2) {
      setEditError(e2?.response?.data?.message || "Erro ao atualizar controle");
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
    setViewingTrip(null);
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
    const extras = asArray(t.extras);
    const trechos = asArray(t.trechos);

    const dataPrincipal =
      trechos && trechos.length ? trechos[0].data : t.data || t.createdAt;

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
              </div>
              <div className="details-kv">
                <div>
                  <span>Premiação</span>
                  <strong>
                    {brCurrency(t.premiacaoValor || 0)}
                    <span className="muted"> ({t.premiacaoPercentual || 0}%)</span>
                  </strong>
                </div>
              </div>

              <p className="muted small created-at">
                Criado em: {formatDateTime(t.createdAt)}
              </p>
            </div>
          </div>

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

          <div className="admin-trips-details-section">
            <h4>Trechos cadastrados</h4>
            {trechos.length === 0 ? (
              <p className="muted small">Nenhum trecho cadastrado.</p>
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
                      <th>Pago?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trechos.map((r, idx) => (
                      <tr key={idx}>
                        <td>{formatDate(r.data)}</td>
                        <td>{r.origem || "-"}</td>
                        <td>{r.destino || "-"}</td>
                        <td>{brCurrency(r.frete)}</td>
                        <td>{brCurrency(r.adiantamento)}</td>
                        <td>{brCurrency(r.saldo)}</td>
                        <td>{r.kmInicial || "-"}</td>
                        <td>{r.kmFinal || "-"}</td>
                        <td>{r.posto || "-"}</td>
                        <td>{r.litros || 0}</td>
                        <td>{r.mediaTrecho || 0}</td>
                        <td>{r.pago ? "Sim" : "Não"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const addExtra = () => {
    setEditForm((p) => ({
      ...p,
      extras: [...asArray(p.extras), { descricao: "", valor: "" }],
    }));
  };

  const removeExtra = (idx) => {
    setEditForm((p) => ({
      ...p,
      extras: asArray(p.extras).filter((_, i) => i !== idx),
    }));
  };

  const updateExtra = (idx, key, value) => {
    setEditForm((p) => ({
      ...p,
      extras: asArray(p.extras).map((x, i) =>
        i === idx ? { ...x, [key]: value } : x
      ),
    }));
  };

  const addTrecho = () => {
    setEditForm((p) => ({
      ...p,
      trechos: [
        ...asArray(p.trechos),
        {
          data: "",
          origem: "",
          destino: "",
          frete: "",
          adiantamento: "",
          saldo: "",
          kmInicial: "",
          kmFinal: "",
          posto: "",
          litros: "",
          mediaTrecho: "",
          pago: false,
        },
      ],
    }));
  };

  const removeTrecho = (idx) => {
    setEditForm((p) => ({
      ...p,
      trechos: asArray(p.trechos).filter((_, i) => i !== idx),
    }));
  };

  const updateTrecho = (idx, key, value) => {
    setEditForm((p) => ({
      ...p,
      trechos: asArray(p.trechos).map((r, i) =>
        i === idx ? { ...r, [key]: value } : r
      ),
    }));
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
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
          <p className="muted">Nenhum controle encontrado com os filtros atuais.</p>
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
                  t.trechos && t.trechos.length ? t.trechos[0].data : t.data || t.createdAt;

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
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openDetailsModal(t)}
                      >
                        Detalhes
                      </button>

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
          className="admin-modal admin-trips-edit-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (allowBackdropClose && e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div className="admin-modal-card pop admin-trips-edit-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head admin-trips-edit-head">
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

            <hr />

            {!editForm ? (
              <p className="muted">Carregando dados completos…</p>
            ) : (
              <form className="admin-trips-form" onSubmit={submitEdit}>
                <div className="admin-trips-form-grid">
                  <div className="form-field">
                    <label>Motorista</label>
                    <select
                      className="form-control"
                      value={editForm.driverId}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, driverId: e.target.value }))
                      }
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
                      value={editForm.driverName}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, driverName: e.target.value }))
                      }
                      placeholder="Vai para o campo driverName"
                    />
                  </div>

                  <div className="form-field">
                    <label>Placa</label>
                    <input
                      className="form-control"
                      value={editForm.plate}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          plate: e.target.value.toUpperCase(),
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Data do controle</label>
                    <input
                      className="form-control"
                      type="datetime-local"
                      value={toDateTimeLocal(editForm.data || editForm.createdAt)}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, data: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="admin-trips-form-grid">
                  <div className="form-field">
                    <label>KM Inicial</label>
                    <input
                      className="form-control"
                      type="number"
                      value={editForm.kmInicial}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, kmInicial: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>KM Final</label>
                    <input
                      className="form-control"
                      type="number"
                      value={editForm.kmFinal}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, kmFinal: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>Litros total</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      value={editForm.litrosTotal}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, litrosTotal: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>Média geral (km/l)</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      value={editForm.mediaGeral}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, mediaGeral: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="admin-trips-form-grid">
                  <div className="form-field">
                    <label>Total do Frete</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      value={editForm.totalDoFrete}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, totalDoFrete: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>Premiação (R$)</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      value={editForm.premiacaoValor}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, premiacaoValor: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>Premiação (%)</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      value={editForm.premiacaoPercentual}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          premiacaoPercentual: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="admin-trips-form-grid">
                  <div className="form-field">
                    <label>Latitude</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.00001"
                      value={editForm.latitude}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, latitude: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label>Longitude</label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.00001"
                      value={editForm.longitude}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, longitude: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* EXTRAS */}
                <div className="admin-trips-section">
                  <div className="row gap" style={{ justifyContent: "space-between" }}>
                    <h4 style={{ margin: 0 }}>Extras</h4>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={addExtra}
                    >
                      + Adicionar extra
                    </button>
                  </div>

                  {asArray(editForm.extras).length === 0 ? (
                    <p className="muted small">Sem extras.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Descrição</th>
                            <th style={{ width: 160 }}>Valor</th>
                            <th style={{ width: 120 }}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editForm.extras.map((ex, idx) => (
                            <tr key={idx}>
                              <td>
                                <input
                                  className="form-control"
                                  value={ex.descricao}
                                  onChange={(e) =>
                                    updateExtra(idx, "descricao", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  type="number"
                                  step="0.01"
                                  value={ex.valor}
                                  onChange={(e) =>
                                    updateExtra(idx, "valor", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeExtra(idx)}
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* TRECHOS */}
                <div className="admin-trips-section">
                  <div className="row gap" style={{ justifyContent: "space-between" }}>
                    <h4 style={{ margin: 0 }}>Trechos</h4>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={addTrecho}
                    >
                      + Adicionar trecho
                    </button>
                  </div>

                  {asArray(editForm.trechos).length === 0 ? (
                    <p className="muted small">Sem trechos.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Origem</th>
                            <th>Destino</th>
                            <th>Frete</th>
                            <th>Adiant.</th>
                            <th>Saldo</th>
                            <th>KM Ini</th>
                            <th>KM Fin</th>
                            <th>Posto</th>
                            <th>Litros</th>
                            <th>Média</th>
                            <th>Pago?</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editForm.trechos.map((r, idx) => (
                            <tr key={idx}>
                              <td>
                                <input
                                  className="form-control"
                                  type="date"
                                  value={r.data ? toDateTimeLocal(r.data).slice(0, 10) : ""}
                                  onChange={(e) => updateTrecho(idx, "data", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  value={r.origem}
                                  onChange={(e) => updateTrecho(idx, "origem", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  value={r.destino}
                                  onChange={(e) => updateTrecho(idx, "destino", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  type="number"
                                  step="0.01"
                                  value={r.frete}
                                  onChange={(e) => updateTrecho(idx, "frete", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  type="number"
                                  step="0.01"
                                  value={r.adiantamento}
                                  onChange={(e) =>
                                    updateTrecho(idx, "adiantamento", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  type="number"
                                  step="0.01"
                                  value={r.saldo}
                                  onChange={(e) => updateTrecho(idx, "saldo", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  type="number"
                                  value={r.kmInicial}
                                  onChange={(e) =>
                                    updateTrecho(idx, "kmInicial", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  type="number"
                                  value={r.kmFinal}
                                  onChange={(e) =>
                                    updateTrecho(idx, "kmFinal", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  value={r.posto}
                                  onChange={(e) => updateTrecho(idx, "posto", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  type="number"
                                  step="0.01"
                                  value={r.litros}
                                  onChange={(e) => updateTrecho(idx, "litros", e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  type="number"
                                  step="0.01"
                                  value={r.mediaTrecho}
                                  onChange={(e) =>
                                    updateTrecho(idx, "mediaTrecho", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <label className="chk">
                                  <input
                                    type="checkbox"
                                    checked={!!r.pago}
                                    onChange={(e) =>
                                      updateTrecho(idx, "pago", e.target.checked)
                                    }
                                  />
                                  Pago
                                </label>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeTrecho(idx)}
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {editError && <div className="alert error-alert">{editError}</div>}

                <hr />

                <div className="admin-trips-modal-actions">
                  <button
                    className="btn btn-outline-light"
                    type="button"
                    onClick={closeEditModal}
                    disabled={savingEdit}
                  >
                    Cancelar
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={savingEdit}>
                    {savingEdit ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </form>
            )}
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
                  Coordenadas: {Number(mapTrip.latitude).toFixed(5)},{" "}
                  {Number(mapTrip.longitude).toFixed(5)}
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
