import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./DriverHome.css";
import { tokenService } from "../../../services/tokenService";

export default function DriverHome() {
  const navigate = useNavigate();

  const logout = () => {
    tokenService.clear();
    navigate("/", { replace: true });
  };

  // const logout = async () => {
  //   await api.post("/auth/logout", {}, { withCredentials: true });
  //   navigate("/", { replace: true });
  // };

  return (
    <div className="driver-page">
      <div className="card driver-card">
        <div className="driver-card-head">
          <div>
            <h2>Área do Motorista</h2>
            <p className="muted">
              Bem-vindo! Aqui ficarão seus recursos operacionais.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm driver-logout-btn w-100"
            type="button"
            onClick={logout}
          >
            Sair
          </button>
        </div>

        <div className="driver-card-body">
          <p className="driver-helper">
            Escolha uma opção abaixo para iniciar um novo controle de saída ou
            consultar suas viagens.
          </p>

          <div className="driver-actions">
            <button
              type="button"
              className="btn btn-primary driver-main-btn"
              onClick={() => navigate("/driver/trips/new")}
            >
              Novo Controle de Saída
            </button>

            <button
              type="button"
              className="btn btn-info driver-secondary-btn"
              onClick={() => navigate("/driver/trips")}
            >
              Minhas Viagens
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
