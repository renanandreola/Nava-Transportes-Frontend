import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import "./driver.css";

export default function DriverTripList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
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

  if (loading) return <div className="card"><p>Carregando...</p></div>;

  return (
    <div className="card">
      <div className="card-head">
        <h2>Minhas Viagens</h2>
        <p className="muted">Listagem de controles já enviados.</p>
      </div>

      {err && <div className="alert">{err}</div>}

      {items.length === 0 ? (
        <p className="muted" style={{ padding: 8 }}>Nenhuma viagem cadastrada.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Placa</th>
              <th>KM Inicial</th>
              <th>KM Final</th>
              <th>Total Frete</th>
              <th>Premiação</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t._id}>
                <td>{t.trechos?.[0]?.data || "-"}</td>
                <td>{t.plate || "-"}</td>
                <td>{t.kmInicial}</td>
                <td>{t.kmFinal}</td>
                <td>R$ {Number(t.totalDoFrete || 0).toFixed(2)}</td>
                <td>R$ {Number(t.premiacao || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
