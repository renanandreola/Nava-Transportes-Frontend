import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function AdminAnalytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/analytics/drivers");
      setData(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Indicadores por Motorista</h2>
          <p className="muted">
            Comparativo de desempenho dos motoristas
          </p>
        </div>
      </div>

      {loading ? (
        <p className="muted">Carregando indicadores…</p>
      ) : data.length === 0 ? (
        <p className="muted">Nenhum dado encontrado.</p>
      ) : (
        <div style={{ height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="driverName" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar dataKey="totalFrete" name="Total Frete" fill="#2563eb" />
              <Bar dataKey="totalPago" name="Total Pago" fill="#16a34a" />
              <Bar dataKey="premiacao" name="Premiação" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
