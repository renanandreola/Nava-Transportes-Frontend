import React, { useMemo, useState, useEffect } from "react";
import api from "../../../services/api";
import "./driver.css";

// util
const n = (v) => (isNaN(Number(v)) ? 0 : Number(v));
const brCurrency = (v) =>
  (n(v)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DriverTripForm() {
  const [me, setMe] = useState(null);

  // cabeçalho
  const [plate, setPlate] = useState("");

  // totais/rodapé
  const [premiacao, setPremiacao] = useState(0);
  const [totalAssinado, setTotalAssinado] = useState(0);
  const [totalPago, setTotalPago] = useState(0);
  const [totalDoFrete, setTotalDoFrete] = useState(0);

  // extras
  const [extras, setExtras] = useState([{ descricao: "", valor: 0 }]);

  // trechos (linhas)
  const [rows, setRows] = useState([{
    data: new Date().toISOString().slice(0,10),
    origem: "", destino: "",
    frete: 0, adiantamento: 0, saldo: 0,
    kmInicial: 0, kmFinal: 0,
    posto: "", litros: 0, mediaTrecho: 0,
    assinador: "", pago: false,
  }]);

  const addRow = () => setRows((r) => [...r, {
    data: new Date().toISOString().slice(0,10),
    origem: "", destino: "",
    frete: 0, adiantamento: 0, saldo: 0,
    kmInicial: 0, kmFinal: 0,
    posto: "", litros: 0, mediaTrecho: 0,
    assinador: "", pago: false,
  }]);

  const rmRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx));

  const setRow = (idx, field, value) => {
    setRows((r) => {
      const clone = [...r];
      const item = { ...clone[idx], [field]: value };
      // cálculos por linha
      const kmPerc = n(item.kmFinal) - n(item.kmInicial);
      item.mediaTrecho = n(item.litros) > 0 ? +(kmPerc / n(item.litros)).toFixed(2) : 0;
      item.saldo = +(n(item.frete) - n(item.adiantamento)).toFixed(2);
      clone[idx] = item;
      return clone;
    });
  };

  // agregados
  const kmInicial = useMemo(() => (rows.length ? n(rows[0].kmInicial) : 0), [rows]);
  const kmFinal   = useMemo(() => (rows.length ? n(rows[rows.length-1].kmFinal) : 0), [rows]);
  const litrosTotal = useMemo(() => rows.reduce((s, r) => s + n(r.litros), 0), [rows]);
  const mediaGeral  = useMemo(() => {
    const totalKm = rows.reduce((s, r) => s + (n(r.kmFinal)-n(r.kmInicial)), 0);
    return litrosTotal > 0 ? +(totalKm / litrosTotal).toFixed(2) : 0;
  }, [rows, litrosTotal]);

  const totalFreteLinhas = useMemo(() => rows.reduce((s, r) => s + n(r.frete), 0), [rows]);
  const totalAdiantado   = useMemo(() => rows.reduce((s, r) => s + n(r.adiantamento), 0), [rows]);

  // carrega /auth/me para mostrar o motorista
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setMe(data?.user || null);
      } catch {}
    })();
  }, []);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    setSaving(true);
    try {
      const payload = {
        driverId: me?._id, // o back vai sobrescrever se não for admin
        driverName: me?.name,
        plate,

        kmInicial, kmFinal,
        litrosTotal, mediaGeral,

        totalAssinado: n(totalAssinado),
        totalPago: n(totalPago),
        premiacao: n(premiacao),
        totalDoFrete: n(totalDoFrete) || totalFreteLinhas,

        extras: extras.filter(x => (x.descricao || n(x.valor) > 0)).map(x => ({ descricao: x.descricao, valor: n(x.valor) })),

        trechos: rows.map(r => ({
          ...r,
          frete: n(r.frete),
          adiantamento: n(r.adiantamento),
          saldo: n(r.saldo),
          kmInicial: n(r.kmInicial),
          kmFinal: n(r.kmFinal),
          litros: n(r.litros),
          mediaTrecho: n(r.mediaTrecho),
        })),
      };

      await api.post("/driver/trips", payload);
      setOk("Viagem cadastrada com sucesso.");
      // limpa só as linhas
      setRows([{
        data: new Date().toISOString().slice(0,10),
        origem: "", destino: "",
        frete: 0, adiantamento: 0, saldo: 0,
        kmInicial: 0, kmFinal: 0,
        posto: "", litros: 0, mediaTrecho: 0,
        assinador: "", pago: false,
      }]);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>Controle de Saída de Veículo</h2>
        <p className="muted">
          Motorista: <b>{me?.name || "-"}</b> • Perfil: <b>{me?.role || "-"}</b>
        </p>
      </div>

      <form className="form" onSubmit={onSubmit}>
        <div className="row gap">
          <label style={{flex:1}}>Placa
            <input className="inp" value={plate} onChange={(e)=>setPlate(e.target.value)} placeholder="ABC-1D23" />
          </label>

          <label>KM Inicial (geral)
            <input className="inp" type="number" value={kmInicial} readOnly />
          </label>
          <label>KM Final (geral)
            <input className="inp" type="number" value={kmFinal} readOnly />
          </label>
          <label>Litros total
            <input className="inp" type="number" value={litrosTotal} readOnly />
          </label>
          <label>Média geral (km/l)
            <input className="inp" type="number" value={mediaGeral} readOnly />
          </label>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{minWidth:120}}>Data</th>
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
                <th>Assinador</th>
                <th>Pago?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><input className="inp" type="date" value={r.data} onChange={e=>setRow(i,"data",e.target.value)} /></td>
                  <td><input className="inp" value={r.origem} onChange={e=>setRow(i,"origem",e.target.value)} /></td>
                  <td><input className="inp" value={r.destino} onChange={e=>setRow(i,"destino",e.target.value)} /></td>
                  <td><input className="inp" type="number" step="0.01" value={r.frete} onChange={e=>setRow(i,"frete",e.target.value)} /></td>
                  <td><input className="inp" type="number" step="0.01" value={r.adiantamento} onChange={e=>setRow(i,"adiantamento",e.target.value)} /></td>
                  <td><input className="inp" type="number" step="0.01" value={r.saldo} onChange={e=>setRow(i,"saldo",e.target.value)} /></td>
                  <td><input className="inp" type="number" value={r.kmInicial} onChange={e=>setRow(i,"kmInicial",e.target.value)} /></td>
                  <td><input className="inp" type="number" value={r.kmFinal} onChange={e=>setRow(i,"kmFinal",e.target.value)} /></td>
                  <td><input className="inp" value={r.posto} onChange={e=>setRow(i,"posto",e.target.value)} /></td>
                  <td><input className="inp" type="number" step="0.01" value={r.litros} onChange={e=>setRow(i,"litros",e.target.value)} /></td>
                  <td><input className="inp" type="number" step="0.01" value={r.mediaTrecho} readOnly /></td>
                  <td><input className="inp" value={r.assinador} onChange={e=>setRow(i,"assinador",e.target.value)} /></td>
                  <td style={{textAlign:"center"}}>
                    <input type="checkbox" checked={!!r.pago} onChange={e=>setRow(i,"pago",e.target.checked)} />
                  </td>
                  <td>
                    {rows.length > 1 && (
                      <button type="button" className="btn-ghost" onClick={()=>rmRow(i)}>Remover</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row gap" style={{marginTop:12}}>
          <button type="button" className="btn" onClick={addRow}>+ Adicionar trecho</button>
          <div className="muted">Total frete (linhas): <b>{brCurrency(totalFreteLinhas)}</b> • Adiantado: <b>{brCurrency(totalAdiantado)}</b></div>
        </div>

        <hr style={{border:'none', borderTop:'1px solid var(--line)', margin:'14px 0'}} />

        <div className="row gap">
          <label>Premiação
            <input className="inp" type="number" step="0.01" value={premiacao} onChange={e=>setPremiacao(e.target.value)} />
          </label>
          <label>Total Assinado
            <input className="inp" type="number" step="0.01" value={totalAssinado} onChange={e=>setTotalAssinado(e.target.value)} />
          </label>
          <label>Total Pago
            <input className="inp" type="number" step="0.01" value={totalPago} onChange={e=>setTotalPago(e.target.value)} />
          </label>
          <label>Total do Frete
            <input className="inp" type="number" step="0.01" value={totalDoFrete} onChange={e=>setTotalDoFrete(e.target.value)} />
          </label>
        </div>

        {err && <div className="alert">{err}</div>}
        {ok && <div className="alert" style={{background:'#e7f9ed', borderColor:'#bbf7d0', color:'#166534'}}>{ok}</div>}

        <div className="row end gap">
          <button className="btn-ghost" type="button" onClick={()=>window.history.back()}>Cancelar</button>
          <button className="btn primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    </div>
  );
}
