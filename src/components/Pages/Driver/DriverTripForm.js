import React, { useMemo, useState, useEffect } from "react";
import api from "../../../services/api";
import "./DriverTripForm.css";

const STORAGE_KEY = "driver_trip_draft";
const CHECKLIST_STORAGE_KEY = "driver_trip_checklist";

const saveDraft = (data) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.warn("Erro ao salvar rascunho", e);
  }
};

const n = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const brCurrency = (v) =>
  n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getCurrentPosition = (options) =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      return reject(new Error("Geolocalização não suportada"));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

export default function DriverTripForm() {
  const [checklist, setChecklist] = useState({
    pneusCalibrados: false,
    freiosVerificados: false,
    luzesFuncionando: false,
    nivelOleo: false,
    cargaConferida: false,
    documentosConferidos: false,
  });

  const todosSelecionados = Object.values(checklist).every(Boolean);

  const [checklistSalvo, setChecklistSalvo] = useState(false);

  const [me, setMe] = useState(null);
  const [plate, setPlate] = useState("");

  const [premiacao, setPremiacao] = useState(0);
  // const [totalAssinado, setTotalAssinado] = useState(0);
  // const [totalPago, setTotalPago] = useState(0);

  const [extras] = useState([{ descricao: "", valor: 0 }]);

  const [rows, setRows] = useState([
    {
      data: new Date().toISOString().slice(0, 10),
      origem: "",
      destino: "",
      frete: 0,
      adiantamento: 0,
      saldo: 0,
      kmInicial: 0,
      kmFinal: 0,
      posto: "",
      litros: 0,
      mediaTrecho: 0,
      // assinador: "",
      pago: false,
    },
  ]);

  // const addRow = () =>
  //   setRows((r) => [
  //     ...r,
  //     {
  //       data: new Date().toISOString().slice(0, 10),
  //       origem: "",
  //       destino: "",
  //       frete: 0,
  //       adiantamento: 0,
  //       saldo: 0,
  //       kmInicial: 0,
  //       kmFinal: 0,
  //       posto: "",
  //       litros: 0,
  //       mediaTrecho: 0,
  //       // assinador: "",
  //       pago: false,
  //     },
  //   ]);

  const addRow = () =>
    setRows((r) => {
      const updated = [
        ...r,
        {
          data: new Date().toISOString().slice(0, 10),
          origem: "",
          destino: "",
          frete: 0,
          adiantamento: 0,
          saldo: 0,
          kmInicial: 0,
          kmFinal: 0,
          posto: "",
          litros: 0,
          mediaTrecho: 0,
          pago: false,
        },
      ];

      saveDraft({ rows: updated, premiacao, plate });
      return updated;
    });

  // const rmRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx));

  const rmRow = (idx) =>
    setRows((r) => {
      const updated = r.filter((_, i) => i !== idx);
      saveDraft({ rows: updated, premiacao, plate });
      return updated;
    });

  // const setRow = (idx, field, value) => {
  //   setRows((r) => {
  //     const clone = [...r];
  //     const current = { ...clone[idx], [field]: value };
  //     const kmInicioReal = idx === 0 ? n(current.kmInicial) : n(clone[idx - 1].kmFinal);
  //     const kmFinalAtual = n(current.kmFinal);
  //     const kmPercorrido = Math.max(0, kmFinalAtual - kmInicioReal);
  //     current.mediaTrecho = n(current.litros) > 0 && kmPercorrido > 0 ? +(kmPercorrido / n(current.litros)).toFixed(2) : 0;
  //     current.saldo = +(n(current.frete) - n(current.adiantamento)).toFixed(2);
  //     clone[idx] = current;
  //     return clone;
  //   });
  // };

  const setRow = (idx, field, value) => {
    setRows((r) => {
      const clone = [...r];
      const current = { ...clone[idx], [field]: value };

      const kmInicioReal =
        idx === 0 ? n(current.kmInicial) : n(clone[idx - 1].kmFinal);

      const kmFinalAtual = n(current.kmFinal);
      const kmPercorrido = Math.max(0, kmFinalAtual - kmInicioReal);

      current.mediaTrecho =
        n(current.litros) > 0 && kmPercorrido > 0
          ? +(kmPercorrido / n(current.litros)).toFixed(2)
          : 0;

      current.saldo = +(n(current.frete) - n(current.adiantamento)).toFixed(2);

      clone[idx] = current;

      // 🔥 SALVA IMEDIATAMENTE
      saveDraft({
        rows: clone,
        premiacao,
        plate,
      });

      return clone;
    });
  };

  const kmInicial = useMemo(
    () => (rows.length ? n(rows[0].kmInicial) : 0),
    [rows]
  );
  const kmFinal = useMemo(
    () => (rows.length ? n(rows[rows.length - 1].kmFinal) : 0),
    [rows]
  );
  const litrosTotal = useMemo(
    () => rows.reduce((s, r) => s + n(r.litros), 0),
    [rows]
  );
  const mediaGeral = useMemo(() => {
    if (!rows.length) return 0;

    const kmRodado =
      n(rows[rows.length - 1].kmFinal) - n(rows[0].kmInicial);

    return litrosTotal > 0 ? +(kmRodado / litrosTotal).toFixed(2) : 0;
  }, [rows, litrosTotal]);

  const totalFreteLinhas = useMemo(
    () => rows.reduce((s, r) => s + n(r.frete), 0),
    [rows]
  );
  const totalAdiantado = useMemo(
    () => rows.reduce((s, r) => s + n(r.adiantamento), 0),
    [rows]
  );

  const totalSaldo = useMemo(
    () => rows.reduce((s, r) => s + n(r.saldo), 0),
    [rows]
  );


  const totalFreteCalculado = totalFreteLinhas;

  const valorPremiacao = useMemo(() => {
    return +(totalFreteCalculado * (n(premiacao) / 100)).toFixed(2);
  }, [totalFreteCalculado, premiacao]);

  function handleChange(event) {
    const { name, checked } = event.target;

    setChecklist((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  function salvarChecklist() {
    if (!todosSelecionados) return;

    const payload = {
      checklist,
      checklistSalvo: true,
      dataChecklist: new Date().toISOString(),
    };

    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(payload));

    setChecklistSalvo(true);

    console.log("Checklist salvo:", payload);
    alert("Checklist salvo com sucesso!");
  }

  useEffect(() => {
    const savedChecklist = localStorage.getItem(CHECKLIST_STORAGE_KEY);

    if (savedChecklist) {
      try {
        const parsed = JSON.parse(savedChecklist);

        if (parsed.checklist) {
          setChecklist(parsed.checklist);
        }

        if (parsed.checklistSalvo === true) {
          setChecklistSalvo(true);
        }
      } catch (e) {
        console.warn("Erro ao restaurar checklist", e);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
    try {
      const { data } = await api.get("/auth/me");
      const user = data?.user || null;
      setMe(user);

      if (user?.email) {
        setPlate(user.email);
      }

      if (user?.commission !== undefined) {
        setPremiacao(user.commission);
      }
    } catch {}
    })();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed.rows?.length) setRows(parsed.rows);
        if (parsed.premiacao !== undefined) setPremiacao(parsed.premiacao);
        if (parsed.plate) setPlate(parsed.plate);
      } catch (e) {
        console.warn("Erro ao restaurar viagem em aberto", e);
      }
    }
  }, []);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setSaving(true);

    let geo = null;

    try {
      const pos = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
      geo = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch (eGeo) {
      console.warn("Não foi possível obter localização:", eGeo?.message);
    }

    try {
      const payload = {
        driverId: me?.id,
        driverName: me?.name,
        plate,

        kmInicial,
        kmFinal,
        litrosTotal,
        mediaGeral,
        // totalAssinado: n(totalAssinado),
        // totalPago: n(totalPago),
        premiacaoPercentual: n(premiacao),
        premiacaoValor: valorPremiacao,
        totalViagem: totalFreteCalculado,
        totalDoFrete: totalFreteCalculado,

        extras: extras
          .filter((x) => x.descricao || n(x.valor) > 0)
          .map((x) => ({ descricao: x.descricao, valor: n(x.valor) })),

        trechos: rows.map((r) => ({
          ...r,
          frete: n(r.frete),
          adiantamento: n(r.adiantamento),
          saldo: n(r.saldo),
          kmInicial: n(r.kmInicial),
          kmFinal: n(r.kmFinal),
          litros: n(r.litros),
          mediaTrecho: n(r.mediaTrecho),
        })),
        latitude: geo?.latitude,
        longitude: geo?.longitude,
        locationAccuracy: geo?.accuracy,
      };

      await api.post("/driver/trips", payload);
      
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CHECKLIST_STORAGE_KEY);

      setOk("Viagem cadastrada com sucesso.");
      setRows([
        {
          data: new Date().toISOString().slice(0, 10),
          origem: "",
          destino: "",
          frete: 0,
          adiantamento: 0,
          saldo: 0,
          kmInicial: 0,
          kmFinal: 0,
          posto: "",
          litros: 0,
          mediaTrecho: 0,
          // assinador: "",
          pago: false,
        },
      ]);

      setTimeout(() => {
        setChecklistSalvo(false);
      }, 4000);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="driver-page driver-trip-form-page">
      <div className="card driver-card driver-trip-form-card">
        <div className="driver-trip-header">
          <div>
            <h2>Controle de Saída de Veículo</h2>
            <p className="muted">
              • Motorista: <b>{me?.name || "-"}</b>
            </p>

            {/* <p className="muted">
              • Perfil:{" "}<b>{me?.role || "-"}</b>
            </p> */}
          </div>
        </div>

        {!checklistSalvo && (
          <div style={{ maxWidth: "400px" }} className="form-check">
            <h5>Checklist do Caminhão</h5>

            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                name="pneusCalibrados"
                checked={checklist.pneusCalibrados}
                onChange={handleChange}
              />
              Pneus calibrados
            </label>

            <br />

            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                name="freiosVerificados"
                checked={checklist.freiosVerificados}
                onChange={handleChange}
              />
              Freios verificados
            </label>

            <br />

            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                name="luzesFuncionando"
                checked={checklist.luzesFuncionando}
                onChange={handleChange}
              />
              Luzes funcionando
            </label>

            <br />

            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                name="nivelOleo"
                checked={checklist.nivelOleo}
                onChange={handleChange}
              />
              Nível de óleo verificado
            </label>

            <br />

            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                name="cargaConferida"
                checked={checklist.cargaConferida}
                onChange={handleChange}
              />
              Carga conferida
            </label>

            <br />

            <label className="form-check-label">
              <input
                className="form-check-input"
                type="checkbox"
                name="documentosConferidos"
                checked={checklist.documentosConferidos}
                onChange={handleChange}
              />
              Documentos conferidos
            </label>

            <br />
            <br />

            <button
              type="button"
              onClick={salvarChecklist}
              disabled={!todosSelecionados}
              className="btn btn-primary"
            >
              Salvar
            </button>

            {!todosSelecionados && (
              <p style={{ color: "red" }}>
                Marque todos os itens para habilitar o salvamento.
              </p>
            )}
          </div>
        )}

        {checklistSalvo && (
          <form className="form driver-trip-form" onSubmit={onSubmit}>
            {/* Tabela de trechos */}
            <div className="driver-trip-form-table-wrap">
              <table className="table driver-trip-form-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 120 }}>Data</th>
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
                    {/* <th>Assinador</th> */}
                    <th>Pago?</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          className="inp"
                          type="date"
                          value={r.data}
                          onChange={(e) => setRow(i, "data", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="inp"
                          value={r.origem}
                          onChange={(e) => setRow(i, "origem", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="inp"
                          value={r.destino}
                          onChange={(e) => setRow(i, "destino", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="inp"
                          type="number"
                          step="0.01"
                          value={r.frete}
                          onChange={(e) => setRow(i, "frete", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="inp"
                          type="number"
                          step="0.01"
                          value={r.adiantamento}
                          onChange={(e) =>
                            setRow(i, "adiantamento", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="inp"
                          type="number"
                          step="0.01"
                          value={r.saldo}
                          onChange={(e) => setRow(i, "saldo", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="inp"
                          type="number"
                          value={r.kmInicial}
                          onChange={(e) =>
                            setRow(i, "kmInicial", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="inp"
                          type="number"
                          value={r.kmFinal}
                          onChange={(e) => setRow(i, "kmFinal", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="inp"
                          value={r.posto}
                          onChange={(e) => setRow(i, "posto", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="inp"
                          type="number"
                          step="0.01"
                          value={r.litros}
                          onChange={(e) => setRow(i, "litros", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="inp disabled"
                          type="number"
                          step="0.01"
                          value={r.mediaTrecho}
                          readOnly
                        />
                      </td>
                      {/* <td>
                        <input
                          className="inp"
                          value={r.assinador}
                          onChange={(e) =>
                            setRow(i, "assinador", e.target.value)
                          }
                        />
                      </td> */}
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!r.pago}
                          onChange={(e) => setRow(i, "pago", e.target.checked)}
                        />
                      </td>
                      <td>
                        {rows.length > 1 && (
                          <button
                            type="button"
                            className="btn-ghost driver-row-remove"
                            onClick={() => rmRow(i)}
                            style={{color: 'gray'}}
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totais por linhas */}
            <div className="row gap driver-trip-lines-summary">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addRow}
              >
                + Adicionar trecho
              </button>
              <div className="muted">
                Total frete (linhas):{" "}
                <b>{brCurrency(totalFreteLinhas)}</b>
                {" • "}
                Adiantado:{" "}
                <b>{brCurrency(totalAdiantado)}</b>
                {" • "}
                Saldo a receber:{" "}
                <b style={{ color: totalSaldo > 0 ? "#c62828" : "inherit" }}>
                  {brCurrency(totalSaldo)}
                </b>
              </div>

            </div>

            <hr className="driver-trip-separator" />

            <div className="driver-trip-summary-row">
              <label className="driver-field-grow">
                <span>Placa</span>
                <input
                  className="inp disabled"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="ABC-1D23"
                  readOnly
                />
              </label>

              <label>
                <span>KM Inicial (geral)</span>
                <input
                  className="inp disabled"
                  type="number"
                  value={kmInicial}
                  readOnly
                />
              </label>
              <label>
                <span>KM Final (geral)</span>
                <input className="inp disabled" type="number" value={kmFinal} readOnly />
              </label>
              <label>
                <span>Litros total</span>
                <input
                  className="inp disabled"
                  type="number"
                  value={litrosTotal}
                  readOnly
                />
              </label>
              <label>
                <span>Média geral (km/l)</span>
                <input
                  className="inp"
                  type="number"
                  value={mediaGeral}
                  // readOnly
                />
              </label>
              <label>
                <span>Premiação (R$)</span>
                <input
                  className="inp disabled"
                  type="number"
                  value={valorPremiacao}
                  readOnly
                />
              </label>
              {/* <label>
                <span>Total Assinado</span>
                <input
                  className="inp"
                  type="number"
                  step="0.01"
                  value={totalAssinado}
                  onChange={(e) => setTotalAssinado(e.target.value)}
                />
              </label> */}
              {/* <label>
                <span>Total Pago</span>
                <input
                  className="inp"
                  type="number"
                  step="0.01"
                  value={totalPago}
                  onChange={(e) => setTotalPago(e.target.value)}
                />
              </label> */}
              <label>
                <span>Total do Frete</span>
                <input
                  className="inp"
                  type="number"
                  value={totalFreteCalculado}
                  // readOnly
                />
              </label>
            </div>

            {/* Totais finais
            <div className="row gap driver-trip-totals">

            </div> */}

            {err && <div className="alert alert-danger">{err}</div>}
            {ok && <div className="alert alert-success">{ok}</div>}

            <div className="row end gap driver-trip-actions">
              <button
                className="btn-ghost"
                type="button"
                onClick={() => window.history.back()}
                disabled={saving}
                style={{color: "black"}}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
