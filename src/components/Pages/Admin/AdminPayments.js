import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import "./AdminPayments.css";

const n = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const brCurrency = (v) =>
  n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminPayments() {
  const [drivers, setDrivers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // form
  const [driverId, setDriverId] = useState("");
  const [amount, setAmount] = useState(0);
  const [proofSent, setProofSent] = useState(false);
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState("");

  // filtros
  const [fDriver, setFDriver] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const loadDrivers = async () => {
    const { data } = await api.get("/admin/users", {
      params: { role: "driver", limit: 200 },
    });
    setDrivers(data.items || []);
  };

  const loadPayments = async () => {
    setLoading(true);
    const { data } = await api.get("/admin/payments", {
      params: {
        driverId: fDriver || undefined,
        from: from || undefined,
        to: to || undefined,
      },
    });
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    loadDrivers();
    loadPayments();
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    await api.post("/admin/payments", {
      driverId,
      amount: n(amount),
      proofSent,
      note,
      paidAt,
    });

    setDriverId("");
    setAmount(0);
    setProofSent(false);
    setNote("");
    setPaidAt("");

    loadPayments();
  };

  return (
    <div className="card admin-main-card">
        <div className="card-head row">
            <div>
                <h2>Pagamentos</h2>
                <p className="muted">
                    Cadastre os pagamentos enviados aos motoristas.
                </p>
            </div>

        {/* FORM */}
        <form className="admin-payments-form" onSubmit={submit}>
            <select className="form-control" value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
                <option value="">Selecione o motorista</option>
                {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                    {d.name || d.email}
                    </option>
                ))}
            </select>

            <input
                className="form-control"
                type="number"
                step="0.01"
                placeholder="Valor pago"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
            />

            <input
                className="form-control"
                type="datetime-local"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                required
            />

            <label className="chk">
                <input
                    type="checkbox"
                    checked={proofSent}
                    onChange={(e) => setProofSent(e.target.checked)}
                />
                Comprovante enviado
            </label>

            <textarea
                className="form-control"
                placeholder="Observação"
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />

            <button className="btn btn-primary">Registrar pagamento</button>
        </form>

        {/* FILTROS */}
        <div className="admin-payments-filters row">
            <select className="form-control" value={fDriver} onChange={(e) => setFDriver(e.target.value)}>
                <option value="">Todos os motoristas</option>
                {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                    {d.name || d.email}
                    </option>
                ))}
            </select>

            <input className="form-control" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input className="form-control" type="date" value={to} onChange={(e) => setTo(e.target.value)} />

            <button onClick={loadPayments} className="btn btn-secondary">
                Filtrar
            </button>
        </div>

        {/* TABELA */}
        {loading ? (
            <p>Carregando…</p>
        ) : (
            <table className="table">
            <thead>
                <tr>
                <th>Data</th>
                <th>Motorista</th>
                <th>Valor</th>
                <th>Comprovante</th>
                <th>Obs</th>
                </tr>
            </thead>
            <tbody>
                {items.map((p) => (
                <tr key={p._id}>
                    <td>{new Date(p.paidAt).toLocaleString("pt-BR")}</td>
                    <td>{p.driverName}</td>
                    <td>{brCurrency(p.amount)}</td>
                    <td>{p.proofSent ? "Sim" : "Não"}</td>
                    <td>{p.note || "-"}</td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        </div>
    </div>
  );
}
