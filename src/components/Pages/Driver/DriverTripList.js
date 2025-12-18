import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import "./DriverTripList.css";

// util simples
const n = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const brCurrency = (v) =>
  n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DriverTripList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // edição
  const [editOpen, setEditOpen] = useState(false);
  const [allowBackdropClose, setAllowBackdropClose] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editingTrip, setEditingTrip] = useState(null);

  // campos do modal
  const [fPlate, setFPlate] = useState("");
  const [fKmInicial, setFKmInicial] = useState(0);
  const [fKmFinal, setFKmFinal] = useState(0);
  const [fTotalFrete, setFTotalFrete] = useState(0);
  const [fPremiacao, setFPremiacao] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const { data } = await api.get("/driver/trips");
      setItems(data.items || []);
    } catch (e) {
      setErr("Erro ao carregar viagens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ----- editar / deletar -----

  const openEditModal = (trip) => {
    setEditingTrip(trip);
    setEditError("");

    setFPlate(trip.plate || "");
    setFKmInicial(trip.kmInicial || 0);
    setFKmFinal(trip.kmFinal || 0);
    setFTotalFrete(trip.totalDoFrete || 0);
    setFPremiacao(trip.premiacao || 0);

    setEditOpen(true);
    setAllowBackdropClose(false);
    setTimeout(() => setAllowBackdropClose(true), 150);
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditOpen(false);
  };

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
        plate: fPlate.trim(),
        kmInicial: n(fKmInicial),
        kmFinal: n(fKmFinal),
        totalDoFrete: n(fTotalFrete),
        premiacao: n(fPremiacao),
      };

      await api.put(`/driver/trips/${editingTrip._id}`, payload);

      setEditOpen(false);
      await load();
    } catch (e2) {
      setEditError(
        e2?.response?.data?.message || "Erro ao atualizar viagem"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (trip) => {
    const ok = window.confirm(
      `Tem certeza que deseja excluir a viagem da placa "${trip.plate}"?`
    );
    if (!ok) return;

    try {
      await api.delete(`/driver/trips/${trip._id}`);
      await load();
    } catch (e2) {
      alert(e2?.response?.data?.message || "Erro ao excluir viagem");
    }
  };

  // ----- render -----

  if (loading) {
    return (
      <div className="driver-page driver-trip-list-page">
        <div className="card driver-card">
          <div className="driver-trip-head">
            <h2>Minhas Viagens</h2>
            <p className="muted">Carregando suas viagens…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-page driver-trip-list-page">
      <div className="card driver-card">
        <div className="driver-trip-head">
          <div>
            <h2>Minhas Viagens</h2>
            <p className="muted">Listagem de controles já enviados.</p>
          </div>
        </div>

        {err && <div className="alert error-alert">{err}</div>}

        {items.length === 0 ? (
          <p className="muted driver-trip-empty">
            Nenhuma viagem cadastrada.
          </p>
        ) : (
          <div className="driver-trip-table-wrap">
            <table className="table table-striped driver-trip-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Placa</th>
                  <th>KM Inicial</th>
                  <th>KM Final</th>
                  <th>KM Rodado</th>
                  <th>Total Frete</th>
                  <th>Premiação</th>
                  <th className="driver-trip-actions-col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => {
                  const kmIni = n(t.kmInicial);
                  const kmFim = n(t.kmFinal);
                  const kmRodado = kmFim - kmIni;

                  return (
                    <tr key={t._id}>
                      <td>{t.trechos?.[0]?.data || "-"}</td>
                      <td>{t.plate || "-"}</td>
                      <td>{kmIni}</td>
                      <td>{kmFim}</td>
                      <td>{kmRodado}</td>
                      <td>{brCurrency(t.totalDoFrete || 0)}</td>
                      <td>{brCurrency(t.premiacao || 0)}</td>
                      <td className="driver-trip-row-actions">
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
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {editOpen && (
        <div
          className="driver-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (allowBackdropClose && e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div
            className="driver-modal-card pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="driver-modal-head">
              <h3>Editar viagem</h3>
              <button
                className="btn btn-sm btn-outline-light"
                type="button"
                onClick={closeEditModal}
                disabled={savingEdit}
              >
                Fechar
              </button>
            </div>

            <form className="driver-modal-form" onSubmit={submitEdit}>
              <div className="form-field">
                <label>Placa</label>
                <input
                  className="form-control"
                  value={fPlate}
                  onChange={(e) => setFPlate(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="driver-modal-grid">
                <div className="form-field">
                  <label>KM Inicial</label>
                  <input
                    className="form-control"
                    type="number"
                    value={fKmInicial}
                    onChange={(e) => setFKmInicial(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>KM Final</label>
                  <input
                    className="form-control"
                    type="number"
                    value={fKmFinal}
                    onChange={(e) => setFKmFinal(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Total Frete</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    value={fTotalFrete}
                    onChange={(e) => setFTotalFrete(e.target.value)}
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
              </div>

              {editError && (
                <div className="alert error-alert">{editError}</div>
              )}

              <div className="row end gap driver-modal-actions">
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
