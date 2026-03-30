import { useState } from "react";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { ArrowLeft, Upload, User, FileText, Phone, Church, Shield, Save, X } from "lucide-react";

interface PersonalDataFormProps {
  onBack: () => void;
}

const S: Record<string, React.CSSProperties> = {
  page: { background: "#f8fafc", width: "100%", fontFamily: "inherit" },
  desktopHeader: {
    position: "sticky", top: 0, zIndex: 10, background: "white",
    borderBottom: "1px solid #e2e8f0", padding: "0.75rem 1.5rem",
    display: "flex", alignItems: "center", gap: "0.75rem",
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: "0.4rem",
    padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
    border: "1px solid #e2e8f0", background: "white",
    cursor: "pointer", fontSize: "0.875rem", color: "#475569",
    fontWeight: 500,
  },
  headerTitle: {
    fontWeight: 700, fontSize: "1rem", color: "#1e293b",
  },
  headerSub: { fontSize: "0.75rem", color: "#94a3b8", marginTop: "1px" },
  mobileBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.6rem 1rem", borderBottom: "1px solid #e2e8f0", background: "white",
  },
  form: { padding: "1.25rem 1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  card: {
    background: "white", borderRadius: "1rem", border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden",
  },
  cardHeader: {
    display: "flex", alignItems: "center", gap: "0.875rem",
    padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9",
    background: "#f9fafb",
  },
  iconBox: {
    width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem",
    background: "#f3f4f6",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: { fontWeight: 700, fontSize: "0.9375rem", color: "#1e293b" },
  cardDesc: { fontSize: "0.75rem", color: "#94a3b8", marginTop: "1px" },
  cardBody: { padding: "1.25rem" },
  // photo area
  photoRow: {
    display: "flex", alignItems: "center", gap: "1.25rem",
    padding: "1rem", borderRadius: "0.875rem",
    background: "#f8fafc", border: "1px solid #e2e8f0",
  },
  avatar: {
    width: "5rem", height: "5rem", borderRadius: "50%",
    border: "3px solid #e2e8f0", background: "white",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", flexShrink: 0,
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  uploadBtn: {
    display: "inline-flex", alignItems: "center", gap: "0.45rem",
    padding: "0.45rem 1rem", borderRadius: "0.5rem",
    border: "1px solid #ddd6fe", background: "white",
    color: "#7c3aed", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600,
    marginTop: "0.5rem",
  },
  // form grid
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.375rem" },
  label: { fontSize: "0.8125rem", fontWeight: 600, color: "#374151" },
  required: { color: "#ef4444" },
  input: {
    height: "2.625rem", borderRadius: "0.625rem",
    border: "1px solid #e2e8f0", padding: "0 0.75rem",
    fontSize: "0.875rem", color: "#1e293b", background: "white",
    outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  textarea: {
    borderRadius: "0.625rem", border: "1px solid #e2e8f0",
    padding: "0.625rem 0.75rem", fontSize: "0.875rem",
    color: "#1e293b", background: "white", outline: "none",
    resize: "vertical", minHeight: "5rem", width: "100%",
    boxSizing: "border-box",
  },
  hint: { fontSize: "0.7rem", color: "#94a3b8" },
  divider: { height: "1px", background: "#f1f5f9", margin: "0.75rem 0" },
  // radio group
  radioGroup: { display: "flex", gap: "0.625rem", flexWrap: "wrap", marginTop: "0.375rem" },
  radioOption: {
    flex: "1 1 8rem",
    display: "flex", alignItems: "center", gap: "0.6rem",
    padding: "0.6rem 0.875rem", borderRadius: "0.625rem",
    border: "1.5px solid #e2e8f0", background: "white",
    cursor: "pointer", fontSize: "0.875rem", fontWeight: 500,
    color: "#374151", transition: "all 0.15s",
  },
  radioOptionActive: {
    flex: "1 1 8rem",
    display: "flex", alignItems: "center", gap: "0.6rem",
    padding: "0.6rem 0.875rem", borderRadius: "0.625rem",
    border: "1.5px solid #7c3aed", background: "#faf5ff",
    cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
    color: "#7c3aed", transition: "all 0.15s",
  },
  radioCircle: {
    width: "1rem", height: "1rem", borderRadius: "50%",
    border: "2px solid #d1d5db", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  radioCircleActive: {
    width: "1rem", height: "1rem", borderRadius: "50%",
    border: "2px solid #7c3aed", flexShrink: 0, background: "#7c3aed",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  radioDot: { width: "0.4rem", height: "0.4rem", borderRadius: "50%", background: "white" },
  // upload doc
  docCard: {
    borderRadius: "0.875rem", border: "1px solid #e2e8f0",
    background: "#f8fafc", padding: "1rem",
  },
  docPreview: {
    height: "9rem", borderRadius: "0.625rem", overflow: "hidden",
    border: "1px solid #e2e8f0", background: "white", marginTop: "0.75rem",
  },
  // actions
  actionsRow: {
    display: "flex", gap: "0.875rem", flexWrap: "wrap",
  },
  btnCancel: {
    flex: 1, minWidth: "7rem", height: "2.75rem",
    borderRadius: "0.625rem", border: "1px solid #e2e8f0",
    background: "white", color: "#475569", cursor: "pointer",
    fontSize: "0.875rem", fontWeight: 600, display: "flex",
    alignItems: "center", justifyContent: "center", gap: "0.4rem",
  },
  btnSave: {
    flex: 2, minWidth: "10rem", height: "2.75rem",
    borderRadius: "0.625rem", border: "none",
    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
    color: "white", cursor: "pointer", fontSize: "0.875rem",
    fontWeight: 600, display: "flex", alignItems: "center",
    justifyContent: "center", gap: "0.5rem",
    boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
  },
  btnSaveDisabled: {
    flex: 2, minWidth: "10rem", height: "2.75rem",
    borderRadius: "0.625rem", border: "none",
    background: "#c4b5fd", color: "white", cursor: "not-allowed",
    fontSize: "0.875rem", fontWeight: 600, display: "flex",
    alignItems: "center", justifyContent: "center", gap: "0.5rem",
  },
};

function RadioField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={S.field}>
      <span style={S.label}>{label} <span style={S.required}>*</span></span>
      <div style={S.radioGroup}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            style={value === opt.value ? S.radioOptionActive : S.radioOption}
            onClick={() => onChange(opt.value)}
          >
            <span style={value === opt.value ? S.radioCircleActive : S.radioCircle}>
              {value === opt.value && <span style={S.radioDot} />}
            </span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div style={S.field}>
      <label style={S.label}>
        {label} {required && <span style={S.required}>*</span>}
      </label>
      {children}
      {hint && <span style={S.hint}>{hint}</span>}
    </div>
  );
}

export function PersonalDataForm({ onBack }: PersonalDataFormProps) {
  const isDesktop = useIsDesktop();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recetaPreview, setRecetaPreview] = useState<string | null>(null);
  const [permisoPreview, setPermisoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [recetaFile, setRecetaFile] = useState<File | null>(null);
  const [permisoFile, setPermisoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    codigoExplorador: "",
    nombre: "",
    apellidos: "",
    fechaNacimiento: "",
    direccion: "",
    telefono: "",
    alergias: "",
    medicinaControlada: "",
    estudia: "",
    nivelEducativo: "",
    nombreResponsable: "",
    telefonoResponsable: "",
    aceptoCristo: "",
    bautizado: "",
    asisteCelula: "",
    nombreLiderCelula: "",
  });

  const handle = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleFile = (
    setter: (f: File | null) => void,
    previewSetter: (s: string | null) => void,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setter(file);
    const reader = new FileReader();
    reader.onloadend = () => previewSetter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File, token: string) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("https://x-production-e359.up.railway.app/api/upload", {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.msg || data?.error || "Error al subir archivo");
    return data?.url || data?.fileUrl || data?.path || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { alert("No hay token. Inicia sesión otra vez."); return; }
      const [fotoUrl, recetaUrl, permisoUrl] = await Promise.all([
        photoFile ? uploadFile(photoFile, token) : null,
        recetaFile ? uploadFile(recetaFile, token) : null,
        permisoFile ? uploadFile(permisoFile, token) : null,
      ]);
      const payload = {
        codigoInterno: formData.codigoExplorador, nombre: formData.nombre,
        apellidos: formData.apellidos, fechaNacimiento: formData.fechaNacimiento,
        direccion: formData.direccion, telefono: formData.telefono,
        alergias: formData.alergias || null, medicinaControlada: formData.medicinaControlada || null,
        estudia: formData.estudia === "si",
        nivelEducativo: formData.estudia === "si" ? formData.nivelEducativo || null : null,
        nombreResponsable: formData.nombreResponsable,
        telefonoResponsable: formData.telefonoResponsable,
        aceptoCristo: formData.aceptoCristo === "si",
        bautizado: formData.bautizado === "si",
        asisteCelula: formData.asisteCelula === "si",
        nombreLiderCelula: formData.asisteCelula === "si" ? formData.nombreLiderCelula || null : null,
        fotoUrl, recetaUrl, permisoUrl,
      };
      const res = await fetch("https://x-production-e359.up.railway.app/api/explorers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { alert(data?.msg || data?.error || "Error al guardar explorador"); return; }
      alert("Explorador guardado correctamente");
      setFormData({ codigoExplorador: "", nombre: "", apellidos: "", fechaNacimiento: "", direccion: "", telefono: "", alergias: "", medicinaControlada: "", estudia: "", nivelEducativo: "", nombreResponsable: "", telefonoResponsable: "", aceptoCristo: "", bautizado: "", asisteCelula: "", nombreLiderCelula: "" });
      setPhotoFile(null); setRecetaFile(null); setPermisoFile(null);
      setPhotoPreview(null); setRecetaPreview(null); setPermisoPreview(null);
      onBack();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error de conexión con el servidor");
    } finally { setLoading(false); }
  };

  const YES_NO = [{ value: "si", label: "Sí" }, { value: "no", label: "No" }];

  return (
    <div style={S.page}>
      {/* ── Header ─────────────────────────────────────── */}
      {isDesktop ? (
        <div style={S.desktopHeader}>
          <button type="button" onClick={onBack} style={S.backBtn}>
            <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
            Volver
          </button>
          <div>
            <p style={S.headerTitle}>Registro de explorador</p>
            <p style={S.headerSub}>Completa la información personal, familiar y eclesiástica</p>
          </div>
        </div>
      ) : (
        <div style={S.mobileBar}>
          <button type="button" onClick={onBack} style={S.backBtn}>
            <ArrowLeft style={{ width: "0.875rem", height: "0.875rem" }} />
            Cancelar
          </button>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
            Nuevo explorador
          </span>
        </div>
      )}

      {/* ── Form ───────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={S.form}>

        {/* Card: Datos personales */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.iconBox}>
              <User style={{ width: "1.25rem", height: "1.25rem", color: "#4b5563" }} />
            </div>
            <div>
              <p style={S.cardTitle}>Datos personales</p>
              <p style={S.cardDesc}>Información general del explorador</p>
            </div>
          </div>
          <div style={S.cardBody}>
            {/* Photo upload */}
            <div style={S.photoRow}>
              <div style={S.avatar}>
                {photoPreview
                  ? <img src={photoPreview} alt="Preview" style={S.avatarImg} />
                  : <User style={{ width: "2rem", height: "2rem", color: "#cbd5e1" }} />}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" }}>Fotografía</p>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>Sube una foto del explorador</p>
                <input type="file" id="photo" accept="image/*" onChange={handleFile(setPhotoFile, setPhotoPreview)} style={{ display: "none" }} />
                <button type="button" style={S.uploadBtn} onClick={() => document.getElementById("photo")?.click()}>
                  <Upload style={{ width: "0.875rem", height: "0.875rem" }} />
                  {photoPreview ? "Cambiar foto" : "Subir foto"}
                </button>
              </div>
            </div>

            <div style={S.divider} />

            {/* Fields grid */}
            <div style={S.grid2}>
              <Field label="Código de Explorador" required hint="Formato: 000 (Ej: 001)">
              <input
                style={S.input}
                value={formData.codigoExplorador}
                onChange={e => {
                  // Solo permite números y lo corta al llegar a 3 caracteres
                  const val = e.target.value.replace(/[^0-9]/g, "").substring(0, 3);
                  handle("codigoExplorador", val);
                }}
                placeholder="000"
                maxLength={3}
                required
              />
            </Field>

              <Field label="Fecha de Nacimiento" required>
                <input style={S.input} type="date" value={formData.fechaNacimiento}
                  onChange={e => handle("fechaNacimiento", e.target.value)} required />
              </Field>

              <Field label="Nombre" required>
                <input style={S.input} value={formData.nombre}
                  onChange={e => handle("nombre", e.target.value)}
                  placeholder="Ingrese el nombre" required />
              </Field>

              <Field label="Apellidos" required>
                <input style={S.input} value={formData.apellidos}
                  onChange={e => handle("apellidos", e.target.value)}
                  placeholder="Ingrese los apellidos" required />
              </Field>

              <Field label="Teléfono" required>
                <input style={S.input} type="tel" value={formData.telefono}
                  onChange={e => handle("telefono", e.target.value)}
                  placeholder="+503 0000-0000" required />
              </Field>
            </div>

            <div style={{ ...S.grid2, marginTop: "1rem" }}>
              <Field label="Dirección" required>
                <textarea style={S.textarea} value={formData.direccion}
                  onChange={e => handle("direccion", e.target.value)}
                  placeholder="Calle, número, colonia, ciudad" required />
              </Field>

              <Field label="Alergias">
                <textarea style={S.textarea} value={formData.alergias}
                  onChange={e => handle("alergias", e.target.value)}
                  placeholder="Especifique alergias conocidas" />
              </Field>

              <div style={{ ...S.field, gridColumn: "1/-1" }}>
                <Field label="Medicina Controlada">
                  <textarea style={{ ...S.textarea, minHeight: "4rem" }}
                    value={formData.medicinaControlada}
                    onChange={e => handle("medicinaControlada", e.target.value)}
                    placeholder="Medicamentos regulares que consume" />
                </Field>
              </div>
            </div>

            {/* Receta / permiso (condicional) */}
            {formData.medicinaControlada && (
              <>
                <div style={S.divider} />
                <div style={S.grid2}>
                  <div style={S.docCard}>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" }}>Foto de receta médica</p>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>Adjunta la receta para respaldar el tratamiento</p>
                    {recetaPreview && <div style={S.docPreview}><img src={recetaPreview} alt="Receta" style={S.avatarImg} /></div>}
                    <input type="file" id="receta" accept="image/*" onChange={handleFile(setRecetaFile, setRecetaPreview)} style={{ display: "none" }} />
                    <button type="button" style={{ ...S.uploadBtn, marginTop: "0.75rem", width: "100%", justifyContent: "center" }} onClick={() => document.getElementById("receta")?.click()}>
                      <Upload style={{ width: "0.875rem", height: "0.875rem" }} />
                      {recetaPreview ? "Cambiar receta" : "Subir receta"}
                    </button>
                  </div>
                  <div style={S.docCard}>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" }}>Documento de permiso firmado</p>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>Permiso del padre o tutor</p>
                    {permisoPreview && <div style={S.docPreview}><img src={permisoPreview} alt="Permiso" style={S.avatarImg} /></div>}
                    <input type="file" id="permiso" accept="image/*,application/pdf" onChange={handleFile(setPermisoFile, setPermisoPreview)} style={{ display: "none" }} />
                    <button type="button" style={{ ...S.uploadBtn, marginTop: "0.75rem", width: "100%", justifyContent: "center" }} onClick={() => document.getElementById("permiso")?.click()}>
                      <Upload style={{ width: "0.875rem", height: "0.875rem" }} />
                      {permisoPreview ? "Cambiar documento" : "Subir documento"}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div style={S.divider} />

            {/* ¿Estudia? */}
            <RadioField label="¿Estudia actualmente?" value={formData.estudia} onChange={v => handle("estudia", v)} options={YES_NO} />

            {formData.estudia === "si" && (
              <div style={{ marginTop: "1rem" }}>
                <RadioField
                  label="Nivel educativo"
                  value={formData.nivelEducativo}
                  onChange={v => handle("nivelEducativo", v)}
                  options={[
                    { value: "parvularia", label: "Parvularia" },
                    { value: "basica", label: "Básica" },
                    { value: "media", label: "Media" },
                    { value: "superior", label: "Superior" },
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Card: Datos familiares */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.iconBox}>
              <Phone style={{ width: "1.25rem", height: "1.25rem", color: "#4b5563" }} />
            </div>
            <div>
              <p style={S.cardTitle}>Datos familiares</p>
              <p style={S.cardDesc}>Contacto responsable y de emergencia</p>
            </div>
          </div>
          <div style={S.cardBody}>
            <div style={S.grid2}>
              <Field label="Nombre del Responsable" required>
                <input style={S.input} value={formData.nombreResponsable}
                  onChange={e => handle("nombreResponsable", e.target.value)}
                  placeholder="Nombre completo" required />
              </Field>
              <Field label="Teléfono del Responsable" required>
                <input style={S.input} type="tel" value={formData.telefonoResponsable}
                  onChange={e => handle("telefonoResponsable", e.target.value)}
                  placeholder="+503 0000-0000" required />
              </Field>
            </div>
          </div>
        </div>

        {/* Card: Datos eclesiásticos */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.iconBox}>
              <Church style={{ width: "1.25rem", height: "1.25rem", color: "#4b5563" }} />
            </div>
            <div>
              <p style={S.cardTitle}>Datos eclesiásticos</p>
              <p style={S.cardDesc}>Información espiritual y de participación</p>
            </div>
          </div>
          <div style={{ ...S.cardBody, display: "flex", flexDirection: "column", gap: "1rem" }}>
            <RadioField label="¿Aceptó a Cristo en su corazón?" value={formData.aceptoCristo} onChange={v => handle("aceptoCristo", v)} options={YES_NO} />
            <RadioField label="¿Bautizado en agua?" value={formData.bautizado} onChange={v => handle("bautizado", v)} options={YES_NO} />
            <RadioField label="¿Asiste a célula?" value={formData.asisteCelula} onChange={v => handle("asisteCelula", v)} options={YES_NO} />

            {formData.asisteCelula === "si" && (
              <Field label="Nombre del Líder de Célula" required={formData.asisteCelula === "si"}>
                <input style={S.input} value={formData.nombreLiderCelula}
                  onChange={e => handle("nombreLiderCelula", e.target.value)}
                  placeholder="Nombre completo del líder"
                  required={formData.asisteCelula === "si"} />
              </Field>
            )}
          </div>
        </div>

        {/* Card: Acciones */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.iconBox}>
              <Shield style={{ width: "1.25rem", height: "1.25rem", color: "#4b5563" }} />
            </div>
            <div>
              <p style={S.cardTitle}>Guardar registro</p>
              <p style={S.cardDesc}>Confirma los datos antes de guardar</p>
            </div>
          </div>
          <div style={S.cardBody}>
            <div style={S.actionsRow}>
              <button type="button" onClick={onBack} style={S.btnCancel}>
                <X style={{ width: "1rem", height: "1rem" }} />
                Cancelar
              </button>
              <button type="submit" style={loading ? S.btnSaveDisabled : S.btnSave} disabled={loading}>
                {loading
                  ? <><FileText style={{ width: "1rem", height: "1rem" }} /> Guardando...</>
                  : <><Save style={{ width: "1rem", height: "1rem" }} /> Guardar explorador</>
                }
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}