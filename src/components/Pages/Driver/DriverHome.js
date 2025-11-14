import React from "react";
import "./driver.css";
import { useNavigate } from "react-router-dom";

export default function DriverHome() {
    const navigate = useNavigate();
    
  return (
    <div className="card">
      <div className="card-head">
        <h2>Área do Motorista</h2>
        <p className="muted">Bem-vindo! Aqui ficarão seus recursos operacionais.</p>
      </div>

      <div style={{ padding: 8 }}>
        <button className="btn primary" onClick={() => navigate("/driver/trips/new")}>
          Novo Controle de Saída
        </button>
      </div>
    </div>
  );
}
