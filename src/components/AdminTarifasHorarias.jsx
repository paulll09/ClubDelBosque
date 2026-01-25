import { useEffect, useMemo, useState } from "react";

const DEFAULT_API_BASE =
  import.meta.env.VITE_API_URL || "https://api.clubdelbosquepadel.com";
const DEFAULT_ADMIN_TOKEN = "clubdelbosque_admin_123";

function toHHMMSS(value) {
  if (!value) return "";
  return value.length === 5 ? `${value}:00` : value;
}

function toHHMM(value) {
  if (!value) return "";
  return value.slice(0, 5);
}

function parsePrecio(input) {
  if (input === null || input === undefined) return NaN;
  let s = String(input).trim();
  if (!s) return NaN;

  s = s.replace(/\s+/g, "");

  if (s.includes(",")) {
    s = s.replace(/\./g, "");
    s = s.replace(",", ".");
  } else {
    s = s.replace(/\./g, "");
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

async function readErrorMessage(r) {
  try {
    const data = await r.json();
    return data?.message || data?.mensaje || JSON.stringify(data);
  } catch {
    try {
      const txt = await r.text();
      return txt || `HTTP ${r.status}`;
    } catch {
      return `HTTP ${r.status}`;
    }
  }
}

function uid() {
  return `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Props opcionales (recomendado):
 * - apiUrl
 * - adminToken
 */
export default function AdminTarifasHorarias({ apiUrl, adminToken }) {
  const API_BASE = apiUrl || DEFAULT_API_BASE;
  const ADMIN_TOKEN = adminToken || DEFAULT_ADMIN_TOKEN;

  const [idCancha, setIdCancha] = useState("1");

  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [tarifas, setTarifas] = useState([]);

  const headers = useMemo(
    () => ({
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Admin-Token": ADMIN_TOKEN,
    }),
    [ADMIN_TOKEN]
  );

  async function cargarTarifas(cancha = idCancha) {
    setLoading(true);
    setError("");

    try {
      const r = await fetch(
        `${API_BASE}/admin/tarifas-horarias?id_cancha=${encodeURIComponent(
          cancha
        )}`,
        { headers }
      );

      if (!r.ok) {
        const msg = await readErrorMessage(r);
        throw new Error(msg || "No se pudieron cargar las tarifas");
      }

      const data = await r.json();

      setTarifas(
        Array.isArray(data)
          ? data.map((t) => ({
              ...t,
              _isNew: false,
              _hora_desde: toHHMM(t.hora_desde),
              _hora_hasta: toHHMM(t.hora_hasta),
              _precio_hora: String(
                Number.isFinite(parseFloat(t.precio_hora))
                  ? parseFloat(t.precio_hora)
                  : 0
              ),
            }))
          : []
      );
    } catch (e) {
      setError(e.message || "Error cargando tarifas");
      setTarifas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarTarifas("1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarTarifas(idCancha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCancha]);

  function onChangeRow(id, patch) {
    setTarifas((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function agregarTarifaLocal() {
    setError("");
    setTarifas((prev) => [
      {
        id: uid(),
        _isNew: true,
        _hora_desde: "08:00",
        _hora_hasta: "09:00",
        _precio_hora: "",
      },
      ...prev,
    ]);
  }

  function descartarTarifaLocal(id) {
    setTarifas((prev) => prev.filter((t) => t.id !== id));
  }

  async function guardarTarifa(t) {
    setSavingId(t.id);
    setError("");

    try {
      const precio = parsePrecio(t._precio_hora);

      const payload = {
        id_cancha: Number(idCancha),
        hora_desde: toHHMMSS(t._hora_desde),
        hora_hasta: toHHMMSS(t._hora_hasta),
        precio_hora: precio,
        activo: 1,
      };

      if (!payload.hora_desde || !payload.hora_hasta) {
        throw new Error("Completá hora desde y hora hasta.");
      }
      if (payload.hora_desde === payload.hora_hasta) {
        throw new Error("La hora desde y hasta no pueden ser iguales.");
      }
      if (!Number.isFinite(payload.precio_hora) || payload.precio_hora <= 0) {
        throw new Error("Ingresá un precio válido (mayor a 0).");
      }

      const url = t._isNew
        ? `${API_BASE}/admin/tarifas-horarias`
        : `${API_BASE}/admin/tarifas-horarias/${t.id}`;

      const method = t._isNew ? "POST" : "PUT";

      const r = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const msg = await readErrorMessage(r);
        throw new Error(msg || "No se pudo guardar la tarifa.");
      }

      await cargarTarifas(idCancha);
    } catch (e) {
      setError(e.message || "Error guardando tarifa");
    } finally {
      setSavingId(null);
    }
  }

  async function eliminarTarifa(t) {
    if (t._isNew) {
      descartarTarifaLocal(t.id);
      return;
    }

    if (!confirm("¿Eliminar esta franja?")) return;

    setSavingId(t.id);
    setError("");

    try {
      const r = await fetch(`${API_BASE}/admin/tarifas-horarias/${t.id}`, {
        method: "DELETE",
        headers,
      });

      if (!r.ok) {
        const msg = await readErrorMessage(r);
        throw new Error(msg || "No se pudo eliminar.");
      }

      await cargarTarifas(idCancha);
    } catch (e) {
      setError(e.message || "Error eliminando");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="w-full pb-6">
      {/* Header + selector cancha */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Tarifas horarias
          </h2>
          <p className="text-xs sm:text-sm text-white/70">
            Definí franjas (desde / hasta) y el precio por hora.
          </p>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-semibold text-white/70">Cancha</label>
            <select
              value={idCancha}
              onChange={(e) => setIdCancha(e.target.value)}
              className="w-full sm:w-[220px] h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-white
                         focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="1">Cancha 1</option>
              <option value="2">Cancha 2</option>
              <option value="3">Cancha 3</option>
            </select>

            <div className="text-[11px] text-white/40">
              Mostrando tarifas de la cancha {idCancha}
            </div>
          </div>
        </div>

        <button
          onClick={agregarTarifaLocal}
          className="w-full lg:w-auto px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          + Agregar franja
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-500/20 border border-red-400/30 text-red-100 text-sm">
          {error}
        </div>
      )}

      {/* Desktop / tablet */}
      <div className="hidden sm:block rounded-2xl border border-white/10 bg-black/30">
        {/* FIX recorte: sin overflow-hidden y sin min-width gigante */}
        <div className="w-full">
          {/* Header */}
          <div
            className="grid items-center gap-3 px-4 py-3 text-white/80 text-sm border-b border-white/10"
            style={{
              gridTemplateColumns: "140px 140px minmax(180px, 1fr) 260px",
            }}
          >
            <div className="font-semibold">Desde</div>
            <div className="font-semibold">Hasta</div>
            <div className="font-semibold">Precio/hora</div>
            <div className="font-semibold text-right">Acciones</div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="p-4 text-white/70">Cargando...</div>
          ) : tarifas.length === 0 ? (
            <div className="p-4 text-white/70">No hay tarifas cargadas.</div>
          ) : (
            tarifas.map((t) => (
              <div
                key={t.id}
                className="grid items-center gap-3 px-4 py-4 border-b border-white/5"
                style={{
                  gridTemplateColumns: "140px 140px minmax(180px, 1fr) 260px",
                }}
              >
                <input
                  type="time"
                  step="60"
                  value={t._hora_desde}
                  onChange={(e) => onChangeRow(t.id, { _hora_desde: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white
                             focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <input
                  type="time"
                  step="60"
                  value={t._hora_hasta}
                  onChange={(e) => onChangeRow(t.id, { _hora_hasta: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white
                             focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="min-w-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ej: 15000 ó 15.000"
                    value={t._precio_hora}
                    onChange={(e) => onChangeRow(t.id, { _precio_hora: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white
                               focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="text-[11px] text-white/40 mt-1">
                    15000 / 15.000 / 15,000
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => guardarTarifa(t)}
                    disabled={savingId === t.id}
                    className="h-10 w-[120px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold
                               disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingId === t.id ? "Guardando..." : "Guardar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => eliminarTarifa(t)}
                    disabled={savingId === t.id}
                    className="h-10 w-[120px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold
                               disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {t._isNew ? "Descartar" : "Eliminar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="p-4 text-white/70 rounded-2xl border border-white/10 bg-black/30">
            Cargando...
          </div>
        ) : tarifas.length === 0 ? (
          <div className="p-4 text-white/70 rounded-2xl border border-white/10 bg-black/30">
            No hay tarifas cargadas.
          </div>
        ) : (
          tarifas.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/70 mb-1">Desde</label>
                  <input
                    type="time"
                    step="60"
                    value={t._hora_desde}
                    onChange={(e) => onChangeRow(t.id, { _hora_desde: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white
                               focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/70 mb-1">Hasta</label>
                  <input
                    type="time"
                    step="60"
                    value={t._hora_hasta}
                    onChange={(e) => onChangeRow(t.id, { _hora_hasta: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white
                               focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/70 mb-1">
                  Precio por hora
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 15000 ó 15.000"
                  value={t._precio_hora}
                  onChange={(e) => onChangeRow(t.id, { _precio_hora: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white
                             focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="text-[11px] text-white/40 mt-1">
                  15000 / 15.000 / 15,000
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => guardarTarifa(t)}
                  disabled={savingId === t.id}
                  className="h-10 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingId === t.id ? "Guardando..." : "Guardar"}
                </button>

                <button
                  type="button"
                  onClick={() => eliminarTarifa(t)}
                  disabled={savingId === t.id}
                  className="h-10 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t._isNew ? "Descartar" : "Eliminar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}