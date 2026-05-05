import { useState, useEffect } from "react";

const TOTAL = 400;
const PRECIO = "10.000";
const ADMIN_PASS = "Saz2014zoe//*";
const STORAGE_KEY = "rifa-numeros-v1";

function getOcupados() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveOcupados(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function Rifa() {
  const [step, setStep] = useState("grid");
  const [numElegido, setNumElegido] = useState(null);
  const [ocupados, setOcupados] = useState({});
  const [form, setForm] = useState({ nombre: "", apellido: "", celular: "" });
  const [comprobante, setComprobante] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [animNum, setAnimNum] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminSelected, setAdminSelected] = useState(null);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    setOcupados(getOcupados());
  }, []);

  const handleFooterTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) { setShowAdminLogin(true); setTapCount(0); }
  };

  const handleAdminLogin = () => {
    if (adminInput === ADMIN_PASS) {
      setAdminMode(true);
      setShowAdminLogin(false);
      setAdminInput("");
      setAdminError(false);
    } else {
      setAdminError(true);
    }
  };

  const handleMarcarVendido = (n) => {
    if (ocupados[n]) return;
    const datos = { nombre: "— Admin —", apellido: "", celular: "—", fecha: new Date().toLocaleString("es-AR"), manual: true };
    const nuevo = { ...ocupados, [n]: datos };
    setOcupados(nuevo);
    saveOcupados(nuevo);
    setAdminSelected(null);
  };

  const handleLiberarNumero = (n) => {
    const nuevo = { ...ocupados };
    delete nuevo[n];
    setOcupados(nuevo);
    saveOcupados(nuevo);
    setAdminSelected(null);
  };

  const handleElegir = (n) => {
    if (adminMode) { setAdminSelected(n); return; }
    if (ocupados[n]) return;
    setAnimNum(n);
    setTimeout(() => setAnimNum(null), 400);
    setNumElegido(n);
    setStep("form");
    setForm({ nombre: "", apellido: "", celular: "" });
    setComprobante(null);
    setComprobantePreview(null);
    setErrors({});
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setComprobante(file);
    const reader = new FileReader();
    reader.onload = (ev) => setComprobantePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.apellido.trim()) e.apellido = "Requerido";
    if (!/^\d{8,15}$/.test(form.celular.replace(/\s/g, ""))) e.celular = "Número inválido";
    if (!comprobante) e.comprobante = "Adjuntá el comprobante";
    return e;
  };

  const handleConfirmar = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const datos = { ...form, fecha: new Date().toLocaleString("es-AR") };
    const nuevo = { ...ocupados, [numElegido]: datos };
    setOcupados(nuevo);
    saveOcupados(nuevo);
    setStep("confirm");
  };

  const libres = TOTAL - Object.keys(ocupados).length;

  const statusColor = (n) => {
    if (ocupados[n]) return "taken";
    if (n === numElegido && step === "form") return "selecting";
    return "free";
  };

  if (adminMode) {
    const participantes = Object.entries(ocupados).sort((a, b) => Number(a[0]) - Number(b[0]));
    return (
      <div style={styles.root}>
        <div style={{ ...styles.header, background: "linear-gradient(135deg, #1a0a2e, #0f172a)" }}>
          <div style={styles.headerInner}>
            <div style={{ ...styles.badge, color: "#a78bfa", borderColor: "#7c3aed66", background: "#7c3aed22" }}>🔐 PANEL ADMIN</div>
            <h1 style={styles.title}>Rifa <span style={{ color: "#a78bfa" }}>iPhone 15</span></h1>
            <div style={styles.stats}>
              <div style={styles.stat}><span style={{ ...styles.statNum, color: "#a78bfa" }}>{libres}</span><span style={styles.statLabel}>disponibles</span></div>
              <div style={styles.statDiv} />
              <div style={styles.stat}><span style={{ ...styles.statNum, color: "#a78bfa" }}>{participantes.length}</span><span style={styles.statLabel}>vendidos</span></div>
            </div>
            <button style={{ ...styles.btnSecondary, marginTop: 12 }} onClick={() => setAdminMode(false)}>Salir del admin</button>
          </div>
        </div>
        <div style={{ padding: "12px 12px 4px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Tocá un número para marcarlo vendido o liberarlo
        </div>
        <div style={styles.grid}>
          {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => {
            const taken = !!ocupados[n];
            const sel = adminSelected === n;
            return (
              <button key={n} onClick={() => handleElegir(n)} style={{
                ...styles.cell,
                ...(sel ? styles.cellSelecting : taken ? styles.cellTaken : styles.cellFree),
                outline: sel ? "2px solid #a78bfa" : "none",
              }}>
                {String(n).padStart(3, "0")}
              </button>
            );
          })}
        </div>
        {adminSelected && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalNum}>#{String(adminSelected).padStart(3, "0")}</div>
              {ocupados[adminSelected] ? (
                <>
                  <div style={styles.modalInfo}>
                    <b>{ocupados[adminSelected].nombre} {ocupados[adminSelected].apellido}</b><br />
                    📱 {ocupados[adminSelected].celular}<br />
                    🕐 {ocupados[adminSelected].fecha}
                  </div>
                  <button style={{ ...styles.btnPrimary, background: "#ef4444", marginBottom: 8 }}
                    onClick={() => handleLiberarNumero(adminSelected)}>
                    🔓 Liberar número
                  </button>
                </>
              ) : (
                <>
                  <div style={{ color: "#94a3b8", marginBottom: 12, fontSize: 14 }}>Número disponible</div>
                  <button style={{ ...styles.btnPrimary, background: "#22c55e", marginBottom: 8 }}
                    onClick={() => handleMarcarVendido(adminSelected)}>
                    ✅ Marcar como vendido
                  </button>
                </>
              )}
              <button style={styles.btnSecondary} onClick={() => setAdminSelected(null)}>Cancelar</button>
            </div>
          </div>
        )}
        <div style={{ maxWidth: 500, margin: "16px auto 40px", padding: "0 12px" }}>
          <div style={{ fontWeight: 700, color: "#a78bfa", marginBottom: 10, fontSize: 15 }}>
            📋 Lista de participantes ({participantes.length})
          </div>
          {participantes.length === 0 && (
            <div style={{ color: "#64748b", fontSize: 14, textAlign: "center", padding: 20 }}>Sin participantes aún</div>
          )}
          {participantes.map(([num, d]) => (
            <div key={num} style={styles.participanteRow}>
              <span style={styles.participanteNum}>#{String(num).padStart(3, "0")}</span>
              <div style={styles.participanteInfo}>
                <div style={{ fontWeight: 600 }}>{d.nombre} {d.apellido}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>📱 {d.celular} · {d.fecha}</div>
              </div>
              <button style={styles.btnLiberar} onClick={() => handleLiberarNumero(num)}>✕</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showAdminLogin) {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <h3 style={{ margin: "0 0 16px", color: "#f8fafc" }}>Acceso Admin</h3>
          <input
            type="password"
            placeholder="Contraseña"
            value={adminInput}
            onChange={e => { setAdminInput(e.target.value); setAdminError(false); }}
            onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
            style={{ ...inputStyle(adminError), marginBottom: 8, color: "#1a1a1a" }}
          />
          {adminError && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>Contraseña incorrecta</div>}
          <button style={styles.btnPrimary} onClick={handleAdminLogin}>Entrar</button>
          <button style={{ ...styles.btnSecondary, marginTop: 8 }} onClick={() => { setShowAdminLogin(false); setAdminInput(""); setAdminError(false); }}>Cancelar</button>
        </div>
      </div>
    );
  }

  if (step === "confirm") return (
    <div style={styles.root}>
      <div style={styles.confirmBox}>
        <div style={styles.confirmIcon}>🎉</div>
        <h2 style={styles.confirmTitle}>¡Número reservado!</h2>
        <div style={styles.confirmNum}>#{String(numElegido).padStart(3, "0")}</div>
        <p style={styles.confirmText}>
          <b>{form.nombre} {form.apellido}</b>, tu número está reservado.<br />
          Te contactaremos al <b>{form.celular}</b> para confirmar el pago.
        </p>
        <button style={styles.btnPrimary} onClick={() => { setStep("grid"); setNumElegido(null); }}>
          Volver al tablero
        </button>
      </div>
    </div>
  );

  if (step === "form") return (
    <div style={styles.root}>
      <div style={styles.formBox}>
        <button style={styles.backBtn} onClick={() => { setStep("grid"); setNumElegido(null); }}>← Volver</button>
        <div style={styles.formHeader}>
          <span style={styles.formNumBadge}>#{String(numElegido).padStart(3, "0")}</span>
          <h2 style={styles.formTitle}>Completá tus datos</h2>
          <p style={styles.formSub}>iPhone 15 · <strong>${PRECIO}</strong> por número</p>
        </div>
        <div style={styles.fieldGroup}>
          <Field label="Nombre" error={errors.nombre}
            input={<input style={inputStyle(errors.nombre)} placeholder="Tu nombre" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />} />
          <Field label="Apellido" error={errors.apellido}
            input={<input style={inputStyle(errors.apellido)} placeholder="Tu apellido" value={form.apellido}
              onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />} />
          <Field label="Celular (WhatsApp)" error={errors.celular}
            input={<input style={inputStyle(errors.celular)} placeholder="Ej: 11 1234 5678" value={form.celular}
              onChange={e => setForm(f => ({ ...f, celular: e.target.value }))} />} />
        </div>
        <div style={styles.transferBox}>
          <div style={styles.transferTitle}>📲 Datos de transferencia</div>
          <div style={styles.transferRow}><span>Alias</span><strong>ZOEALVEZ.15</strong></div>
          <div style={styles.transferRow}><span>CVU</span><strong>0000147800000001928091</strong></div>
          <div style={styles.transferRow}><span>Titular</span><strong>Sandro Antonio Alvez de Olivera</strong></div>
          <div style={styles.transferRow}><span>App</span><strong>Ripio</strong></div>
          <div style={styles.transferRow}><span>Monto</span><strong>${PRECIO}</strong></div>
        </div>
        <Field label="Comprobante de pago" error={errors.comprobante}
          input={
            <label style={styles.fileLabel}>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
              {comprobantePreview
                ? <img src={comprobantePreview} alt="comprobante" style={styles.preview} />
                : <div style={styles.filePlaceholder}>📎 Tocá para subir imagen</div>}
            </label>
          } />
        <button style={styles.btnPrimary} onClick={handleConfirmar}>Confirmar reserva →</button>
      </div>
    </div>
  );

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.badge}>🎟️ RIFA OFICIAL</div>
          <h1 style={styles.title}>Sorteamos un<br /><span style={styles.titleAccent}>iPhone 15</span> 📱</h1>
          <p style={styles.subtitle}>$10.000 por número · 400 participantes</p>
          <div style={styles.stats}>
            <div style={styles.stat}><span style={styles.statNum}>{libres}</span><span style={styles.statLabel}>disponibles</span></div>
            <div style={styles.statDiv} />
            <div style={styles.stat}><span style={styles.statNum}>{Object.keys(ocupados).length}</span><span style={styles.statLabel}>vendidos</span></div>
            <div style={styles.statDiv} />
            <div style={styles.stat}><span style={styles.statNum}>400</span><span style={styles.statLabel}>totales</span></div>
          </div>
        </div>
      </div>
      <div style={styles.legend}>
        <span style={styles.legendItem}><span style={{ ...styles.dot, background: "#22c55e" }} />Disponible</span>
        <span style={styles.legendItem}><span style={{ ...styles.dot, background: "#ef4444" }} />Vendido</span>
      </div>
      <div style={styles.grid}>
        {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => {
          const s = statusColor(n);
          return (
            <button key={n} style={{
              ...styles.cell,
              ...(s === "taken" ? styles.cellTaken : s === "selecting" ? styles.cellSelecting : styles.cellFree),
              transform: animNum === n ? "scale(1.3)" : "scale(1)",
            }}
              onClick={() => handleElegir(n)}
              disabled={s === "taken"}
            >
              {String(n).padStart(3, "0")}
            </button>
          );
        })}
      </div>
      <div style={{ ...styles.footer, cursor: "default" }} onClick={handleFooterTap}>
        Tocá un número verde para reservarlo
      </div>
    </div>
  );
}

function Field({ label, error, input }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={styles.label}>{label}</label>
      {input}
      {error && <div style={styles.errorMsg}>{error}</div>}
    </div>
  );
}

const inputStyle = (err) => ({
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `2px solid ${err ? "#ef4444" : "#e2e8f0"}`,
  fontSize: 15, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", background: err ? "#fff5f5" : "#fff",
});

const styles = {
  root: { minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#f8fafc" },
  header: { background: "linear-gradient(135deg, #1e3a5f, #0f172a)", borderBottom: "2px solid #f59e0b33", padding: "28px 16px 20px", textAlign: "center" },
  headerInner: { maxWidth: 500, margin: "0 auto" },
  badge: { display: "inline-block", background: "#f59e0b22", border: "1px solid #f59e0b66", color: "#fbbf24", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 },
  title: { margin: "0 0 4px", fontSize: 28, fontWeight: 900, lineHeight: 1.2 },
  titleAccent: { color: "#f59e0b" },
  subtitle: { color: "#94a3b8", fontSize: 14, margin: "0 0 14px" },
  stats: { display: "flex", justifyContent: "center", gap: 8, alignItems: "center" },
  stat: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: 800, color: "#fbbf24" },
  statLabel: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  statDiv: { width: 1, height: 30, background: "#334155" },
  legend: { display: "flex", justifyContent: "center", gap: 16, padding: "12px 16px", fontSize: 13, color: "#94a3b8" },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(54px, 1fr))", gap: 6, padding: "8px 12px 24px", maxWidth: 560, margin: "0 auto" },
  cell: { height: 44, borderRadius: 8, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", letterSpacing: 0.3 },
  cellFree: { background: "#14532d", color: "#86efac", boxShadow: "0 2px 8px #16a34a22" },
  cellTaken: { background: "#1c0a0a", color: "#7f1d1d", cursor: "not-allowed" },
  cellSelecting: { background: "#f59e0b", color: "#1a1a1a", boxShadow: "0 4px 16px #f59e0b55" },
  footer: { textAlign: "center", color: "#64748b", fontSize: 13, paddingBottom: 24 },
  formBox: { maxWidth: 420, margin: "0 auto", padding: "20px 16px 40px" },
  backBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: 14, cursor: "pointer", marginBottom: 16, padding: 0 },
  formHeader: { textAlign: "center", marginBottom: 24 },
  formNumBadge: { display: "inline-block", background: "#f59e0b", color: "#1a1a1a", fontWeight: 900, fontSize: 22, borderRadius: 12, padding: "4px 18px", marginBottom: 8 },
  formTitle: { margin: "10px 0 4px", fontSize: 22, fontWeight: 800 },
  formSub: { color: "#94a3b8", fontSize: 14, margin: 0 },
  fieldGroup: { background: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 },
  errorMsg: { color: "#f87171", fontSize: 12, marginTop: 4 },
  transferBox: { background: "#0f172a", border: "1px solid #f59e0b44", borderRadius: 14, padding: 16, marginBottom: 16 },
  transferTitle: { fontWeight: 700, color: "#fbbf24", marginBottom: 10, fontSize: 14 },
  transferRow: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #1e293b", color: "#cbd5e1" },
  fileLabel: { display: "block", cursor: "pointer", borderRadius: 10, border: "2px dashed #334155", overflow: "hidden" },
  filePlaceholder: { padding: "24px 16px", textAlign: "center", color: "#64748b", fontSize: 14 },
  preview: { width: "100%", maxHeight: 200, objectFit: "contain", display: "block" },
  btnPrimary: { width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(90deg, #f59e0b, #d97706)", color: "#1a1a1a", fontWeight: 800, fontSize: 16, cursor: "pointer", marginTop: 8, letterSpacing: 0.3 },
  btnSecondary: { width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  confirmBox: { maxWidth: 380, margin: "40px auto", padding: "0 16px", textAlign: "center" },
  confirmIcon: { fontSize: 64, marginBottom: 12 },
  confirmTitle: { fontSize: 26, fontWeight: 800, marginBottom: 4 },
  confirmNum: { fontSize: 48, fontWeight: 900, color: "#f59e0b", background: "#f59e0b15", borderRadius: 16, padding: "10px 0", marginBottom: 16 },
  confirmText: { color: "#94a3b8", lineHeight: 1.7, marginBottom: 24 },
  modalOverlay: { position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 },
  modal: { background: "#1e293b", borderRadius: 20, padding: 24, width: "100%", maxWidth: 340, textAlign: "center", boxShadow: "0 20px 60px #000" },
  modalNum: { fontSize: 36, fontWeight: 900, color: "#f59e0b", marginBottom: 8 },
  modalInfo: { background: "#0f172a", borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13, color: "#cbd5e1", lineHeight: 1.8, textAlign: "left" },
  participanteRow: { display: "flex", alignItems: "center", gap: 10, background: "#1e293b", borderRadius: 10, padding: "10px 12px", marginBottom: 8 },
  participanteNum: { fontWeight: 800, color: "#fbbf24", fontSize: 13, minWidth: 36 },
  participanteInfo: { flex: 1, fontSize: 13, color: "#f8fafc" },
  btnLiberar: { background: "#7f1d1d", border: "none", color: "#fca5a5", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13 },
};
