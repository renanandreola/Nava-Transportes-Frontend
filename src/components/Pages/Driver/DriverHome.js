import React from "react";
import "./driver.css";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";

export default function DriverHome() {
    const navigate = useNavigate();

    const logout = async () => {
      await api.post("/auth/logout");
      navigate("/", { replace: true });
    };
    
  return (
    <div className="card">
      <div className="card-head">
        <h2>Área do Motorista</h2>
        <p className="muted">Bem-vindo! Aqui ficarão seus recursos operacionais.</p>
        <button className="btn-ghost" onClick={logout}>Sair</button>
      </div>

      <div style={{ padding: 8 }}>
        <button className="btn primary" onClick={() => navigate("/driver/trips/new")}>
          Novo Controle de Saída
        </button>

        <button
          className="btn"
          onClick={() => navigate("/driver/trips")}
        >
          Minhas Viagens
        </button>
      </div>
    </div>
  );
}
