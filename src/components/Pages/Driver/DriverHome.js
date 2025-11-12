import React from "react";
import "./driver.css";

export default function DriverHome() {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Área do Motorista</h2>
        <p className="muted">Bem-vindo! Aqui ficarão seus recursos operacionais.</p>
      </div>

      <div style={{ padding: 8 }}>
        <ul className="muted" style={{ margin: 0 }}>
          <li>Painel com viagens/rotas</li>
          <li>Minhas entregas</li>
          <li>Comprovantes / documentos</li>
          <li>Perfil e alteração de senha</li>
        </ul>
      </div>
    </div>
  );
}
