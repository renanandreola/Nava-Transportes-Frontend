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
                <th>Total Pago</th>
                <th>Premiação</th>
                <th>Criado em</th>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
