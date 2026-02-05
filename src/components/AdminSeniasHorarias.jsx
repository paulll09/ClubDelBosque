import React, { useEffect, useMemo, useState } from "react";

function uid() {
  return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

function toHHMMSS(hhmm) {
  if (!hhmm) return "";
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

function parseMonto(v) {
  if (v == null) return NaN;
  const s = String(v).trim();
  if (!s) return NaN;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

async function readErrorMessage(r) {
  try {
    const j = await r.json();
    return j?.message || j?.error || j?.status || "";
  } catch {
    return "";
  }
}

export default function AdminSeniasHorarias({ apiUrl, adminToken }) {
  const API_BASE = apiUrl;
  const ADMIN_TOKEN = adminToken;

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [senias, setSenias] = useState([]);
  const [filtroCancha, setFiltroCancha] = useState("1");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "X-Admin-Token": ADMIN_TOKEN,
    }),
    [ADMIN_TOKEN]
  );

  async function cargarSenias() {
    setLoading(true);
    setError("");

    try {
      const url = `${API_BASE}/admin/senias-horarias?id_cancha=${encodeURIComponent(
        filtroCancha
      )}`;

      const r = await fetch(url, { headers });
      if (!r.ok) {
        throw new Error(
          (await readErrorMessage(r)) || "No se pudieron cargar las señas."
        );
      }

      const data = await r.json();

      const filas = (data || []).map((s) => ({
        ...s,
        _hora_desde: String(s.hora_desde || "").slice(0, 5),
        _hora_hasta: String(s.hora_hasta || "").slice(0, 5),
        _monto: String(s.monto_senia ?? ""),
        _id_cancha: String(s.id_cancha ?? filtroCancha),
      }));

      setSenias(filas);
    } catch (e) {
      setError(e.message || "Error cargando señas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarSenias();
    // eslint-disable-next-line
  }, [filtroCancha]);

  function onChangeRow(id, patch) {
    setSenias((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function agregarLocal() {
    setSenias((prev) => [
      {
        id: uid(),
        _isNew: true,
        _id_cancha: filtroCancha,
        _hora_desde: "08:00",
        _hora_hasta: "09:00",
        _monto: "",
        activo: 1,
      },
      ...prev,
    ]);
  }

  function descartarLocal(id) {
    setSenias((prev) => prev.filter((s) => s.id !== id));
  }

  async function guardar(s) {
    setSavingId(s.id);
    setError("");

    try {
      const monto = parseMonto(s._monto);

      const payload = {
        id_cancha: Number(s._id_cancha || filtroCancha),
        hora_desde: toHHMMSS(s._hora_desde),
        hora_hasta: toHHMMSS(s._hora_hasta),
        monto_senia: monto,
        activo: 1,
      };

      if (!payload.id_cancha || !payload.hora_desde || !payload.hora_hasta) {
        throw new Error("Completá cancha, hora desde y hora hasta.");
      }
      if (!Number.isFinite(payload.monto_senia) || payload.monto_senia < 0) {
        throw new Error("Ingresá un monto válido.");
      }
      if (payload.hora_desde === payload.hora_hasta) {
        throw new Error("Desde y hasta no pueden ser iguales.");
      }

      const url = s._isNew
        ? `${API_BASE}/admin/senias-horarias`
        : `${API_BASE}/admin/senias-horarias/${s.id}`;

      const method = s._isNew ? "POST" : "PUT";

      const r = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const msg = await readErrorMessage(r);
        throw new Error(msg || "No se pudo guardar la seña.");
      }

      await cargarSenias();
    } catch (e) {
      setError(e.message || "Error guardando seña");
    } finally {
      setSavingId(null);
    }
  }

  async function eliminar(s) {
    if (s._isNew) {
      descartarLocal(s.id);
      return;
    }

    if (!confirm("¿Eliminar esta franja de seña?")) return;

    setSavingId(s.id);
    setError("");

    try {
      const r = await fetch(`${API_BASE}/admin/senias-horarias/${s.id}`, {
        method: "DELETE",
        headers,
      });

      if (!r.ok) {
        const msg = await readErrorMessage(r);
        throw new Error(msg || "No se pudo eliminar.");
      }

      await cargarSenias();
    } catch (e) {
      setError(e.message || "Error eliminando seña");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="w-full pb-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Señas por horario
          </h2>
          <p className="text-xs sm:text-sm text-white/70">
            Definí franjas y el monto de seña por cancha.
          </p>

          <div className="mt-3 flex items-center gap-3">
            <label className="text-xs font-semibold text-white/70">
              Cancha
            </label>
            <select
              value={filtroCancha}
              onChange={(e) => setFiltroCancha(e.target.value)}
              className="w-[160px] h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-white
                         focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="1">Cancha 1</option>
              <option value="2">Cancha 2</option>
              <option value="3">Cancha 3</option>
            </select>
          </div>
        </div>

        <button
          onClick={agregarLocal}
          className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          + Agregar franja
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-500/20 border border-red-400/30 text-red-100 text-sm">
          {error}
        </div>
      )}

      {/* Desktop (FIX: overflow + min-width para que Acciones no quede “afuera”) */}
      <div className="hidden sm:block rounded-2xl border border-white/10 bg-black/30 overflow-x-auto">
        <div className="min-w-[980px]">
          {/* Header */}
          <div
            className="grid gap-3 px-4 py-3 text-white/80 text-sm border-b border-white/10"
            style={{
              gridTemplateColumns: "140px 160px 160px minmax(200px,1fr) 260px",
            }}
          >
            <div className="font-semibold">Cancha</div>
            <div className="font-semibold">Desde</div>
            <div className="font-semibold">Hasta</div>
            <div className="font-semibold">Seña</div>
            <div className="font-semibold text-right">Acciones</div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="p-4 text-white/70">Cargando...</div>
          ) : senias.length === 0 ? (
            <div className="p-4 text-white/70">No hay señas configuradas.</div>
          ) : (
            senias.map((s) => (
              <div
                key={s.id}
                className="grid gap-3 px-4 py-4 border-b border-white/5 items-center"
                style={{
                  gridTemplateColumns:
                    "140px 160px 160px minmax(200px,1fr) 260px",
                }}
              >
                <select
                  value={s._id_cancha}
                  onChange={(e) =>
                    onChangeRow(s.id, { _id_cancha: e.target.value })
                  }
                  className="h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white"
                >
                  <option value="1">Cancha 1</option>
                  <option value="2">Cancha 2</option>
                  <option value="3">Cancha 3</option>
                </select>

                <input
                  type="time"
                  value={s._hora_desde}
                  onChange={(e) =>
                    onChangeRow(s.id, { _hora_desde: e.target.value })
                  }
                  className="h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white"
                />

                <input
                  type="time"
                  value={s._hora_hasta}
                  onChange={(e) =>
                    onChangeRow(s.id, { _hora_hasta: e.target.value })
                  }
                  className="h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white"
                />

                <div>
                  <input
                    type="text"
                    value={s._monto}
                    onChange={(e) =>
                      onChangeRow(s.id, { _monto: e.target.value })
                    }
                    className="h-10 w-full px-3 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                  <div className="text-[11px] text-white/40 mt-1">
                    5000 / 5.000 / 5,000
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => guardar(s)}
                    disabled={savingId === s.id}
                    className="h-10 w-[120px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                  >
                    {savingId === s.id ? "Guardando..." : "Guardar"}
                  </button>

                  <button
                    onClick={() => eliminar(s)}
                    disabled={savingId === s.id}
                    className="h-10 w-[120px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60"
                  >
                    {s._isNew ? "Descartar" : "Eliminar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="p-4 text-white/70 rounded-2xl border border-white/10 bg-black/30">
            Cargando...
          </div>
        ) : senias.length === 0 ? (
          <div className="p-4 text-white/70 rounded-2xl border border-white/10 bg-black/30">
            No hay señas configuradas.
          </div>
        ) : (
          senias.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70">Cancha</label>
                  <select
                    value={s._id_cancha}
                    onChange={(e) =>
                      onChangeRow(s.id, { _id_cancha: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white"
                  >
                    <option value="1">Cancha 1</option>
                    <option value="2">Cancha 2</option>
                    <option value="3">Cancha 3</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/70">Seña</label>
                  <input
                    type="text"
                    value={s._monto}
                    onChange={(e) =>
                      onChangeRow(s.id, { _monto: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70">Desde</label>
                  <input
                    type="time"
                    value={s._hora_desde}
                    onChange={(e) =>
                      onChangeRow(s.id, { _hora_desde: e.target.value })
                    }
                    className="h-10 w-full px-3 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/70">Hasta</label>
                  <input
                    type="time"
                    value={s._hora_hasta}
                    onChange={(e) =>
                      onChangeRow(s.id, { _hora_hasta: e.target.value })
                    }
                    className="h-10 w-full px-3 rounded-xl bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => guardar(s)}
                  disabled={savingId === s.id}
                  className="h-10 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                >
                  {savingId === s.id ? "Guardando..." : "Guardar"}
                </button>

                <button
                  onClick={() => eliminar(s)}
                  disabled={savingId === s.id}
                  className="h-10 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60"
                >
                  {s._isNew ? "Descartar" : "Eliminar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}