import React, { useEffect, useMemo, useState } from "react";

/**
 * AdminBloqueos
 * - Bloqueos normales (rango de fechas + horas opcionales)
 * - Bloqueos fijos semanales (días de semana + rango horario)
 * + Filtros en bloqueos fijos: nombre, cancha, día de semana
 */
export default function AdminBloqueos({ apiUrl, adminToken }) {
  // =========================
  // Bloqueos normales
  // =========================
  const [bloqueos, setBloqueos] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [creando, setCreando] = useState(false);

  // Formulario (bloqueos normales)
  const [idCancha, setIdCancha] = useState("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [horaDesde, setHoraDesde] = useState("");
  const [horaHasta, setHoraHasta] = useState("");
  const [motivo, setMotivo] = useState("");
  const [tipo, setTipo] = useState("torneo"); // torneo | cierre | otro

  // =========================
  // Bloqueos fijos
  // =========================
  const [bloqueosFijos, setBloqueosFijos] = useState([]);
  const [cargandoFijos, setCargandoFijos] = useState(false);
  const [creandoFijo, setCreandoFijo] = useState(false);

  // Form fijo
  const [fijoCancha, setFijoCancha] = useState("todas");
  const [fijoNombre, setFijoNombre] = useState("");
  const [fijoTelefono, setFijoTelefono] = useState("");
  const [fijoDias, setFijoDias] = useState([1]); // por defecto lunes
  const [fijoHoraDesde, setFijoHoraDesde] = useState("");
  const [fijoHoraHasta, setFijoHoraHasta] = useState("");
  const [fijoMotivo, setFijoMotivo] = useState("");

  // =========================
  // Filtros bloqueos fijos
  // =========================
  const [filtroNombre, setFiltroNombre] = useState("");
  // "todas" = mostrar todo, "club" = solo bloqueos para todo el club (id_cancha null), "1|2|3" cancha específica
  const [filtroCancha, setFiltroCancha] = useState("todas");
  // "todos" o 1..7
  const [filtroDia, setFiltroDia] = useState("todos");

  // =========================
  // Helpers
  // =========================
  const hhmm = (t) => (t ? String(t).slice(0, 5) : "");

  const diasMap = useMemo(
    () => ({
      1: "Lun",
      2: "Mar",
      3: "Mié",
      4: "Jue",
      5: "Vie",
      6: "Sáb",
      7: "Dom",
    }),
    []
  );

  const parseDias = (diasSemana) => {
    // viene "1,3,4" (string). Devolvemos [1,3,4]
    const raw = String(diasSemana || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 7);

    // uniq
    return Array.from(new Set(raw)).sort((a, b) => a - b);
  };

  const diasHumanos = (diasSemana) => {
    const arr = parseDias(diasSemana);
    if (arr.length === 0) return "-";
    return arr.map((n) => diasMap[n] || String(n)).join(", ");
  };

  const etiquetaTipo = (t) => {
    if (t === "torneo") return "Torneo";
    if (t === "cierre") return "Cierre";
    return "Otro";
  };

  const formatoRangoFecha = (b) => {
    if (b.fecha_desde === b.fecha_hasta) return b.fecha_desde;
    return `${b.fecha_desde} → ${b.fecha_hasta}`;
  };

  const formatoRangoHora = (b) => {
    if (!b.hora_desde && !b.hora_hasta) return "Todo el día";
    if (b.hora_desde && b.hora_hasta) return `${hhmm(b.hora_desde)} a ${hhmm(b.hora_hasta)}`;
    if (b.hora_desde) return `Desde ${hhmm(b.hora_desde)}`;
    if (b.hora_hasta) return `Hasta ${hhmm(b.hora_hasta)}`;
    return "Todo el día";
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroCancha("todas");
    setFiltroDia("todos");
  };

  // =========================
  // Fetch helpers (sin services)
  // =========================
  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, {
      ...opts,
      headers: {
        Accept: "application/json",
        ...(opts.headers || {}),
      },
    });

    // Si hay body JSON, intentamos parsear
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (data && (data.mensaje || data.message || data.error)) ||
        `Error HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  };

  // =========================
  // Bloqueos normales
  // =========================
  const cargarBloqueos = async () => {
    if (!adminToken) return;
    setCargandoLista(true);
    try {
      const data = await fetchJson(`${apiUrl}/admin/bloqueos`, {
        headers: { "X-Admin-Token": adminToken },
      });
      setBloqueos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar bloqueos:", error);
      alert(error.message || "No se pudieron cargar los bloqueos.");
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    cargarBloqueos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, apiUrl]);

  const crearBloqueo = async (e) => {
    e.preventDefault();
    if (!adminToken) return;

    if (!fechaDesde || !fechaHasta) {
      alert("Debe seleccionar fecha desde y fecha hasta.");
      return;
    }

    // Normalización horas opcionales
    let horaDesdeNormalizada = horaDesde || null;
    let horaHastaNormalizada = horaHasta || null;

    if (horaDesdeNormalizada && !horaHastaNormalizada) {
      alert(
        "Para un bloqueo parcial debe indicar 'hora desde' y 'hora hasta'.\n" +
        "Si quiere bloquear todo el día, deje ambos campos vacíos."
      );
      return;
    }

    if (!horaDesdeNormalizada && horaHastaNormalizada) {
      alert(
        "Para un bloqueo parcial debe indicar 'hora desde' y 'hora hasta'.\n" +
        "Si quiere bloquear todo el día, deje ambos campos vacíos."
      );
      return;
    }

    if (horaDesdeNormalizada && horaHastaNormalizada && horaDesdeNormalizada >= horaHastaNormalizada) {
      alert("La hora 'desde' debe ser menor que la hora 'hasta'.");
      return;
    }

    setCreando(true);

    try {
      const cuerpo = {
        id_cancha: idCancha === "todas" || idCancha === "" ? null : Number(idCancha),
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        hora_desde: horaDesdeNormalizada,
        hora_hasta: horaHastaNormalizada,
        motivo: motivo || null,
        tipo,
      };

      const data = await fetchJson(`${apiUrl}/admin/bloqueos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify(cuerpo),
      });

      alert(data?.mensaje || "Bloqueo creado correctamente.");
      setMotivo("");
      setHoraDesde("");
      setHoraHasta("");
      await cargarBloqueos();
    } catch (error) {
      console.error("Error al crear bloqueo:", error);
      alert(error.message || "No se pudo crear el bloqueo.");
    } finally {
      setCreando(false);
    }
  };

  const eliminarBloqueo = async (id) => {
    if (!window.confirm("¿Eliminar este bloqueo de forma permanente?")) return;
    try {
      const data = await fetchJson(`${apiUrl}/admin/bloqueos/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken },
      });

      alert(data?.mensaje || "Bloqueo eliminado.");
      setBloqueos((prev) => prev.filter((b) => String(b.id) !== String(id)));
    } catch (error) {
      console.error("Error al eliminar bloqueo:", error);
      alert(error.message || "No se pudo eliminar el bloqueo.");
    }
  };

  // =========================
  // Bloqueos fijos
  // =========================
  const cargarBloqueosFijos = async () => {
    if (!adminToken) return;
    setCargandoFijos(true);
    try {
      const data = await fetchJson(`${apiUrl}/admin/bloqueos-fijos`, {
        headers: { "X-Admin-Token": adminToken },
      });

      // importante: si viene algo raro, lo convertimos a []
      setBloqueosFijos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando bloqueos fijos:", error);
      alert(error.message || "Error de conexión cargando bloqueos fijos.");
      setBloqueosFijos([]); // evita quedarte con estado corrupto
    } finally {
      setCargandoFijos(false);
    }
  };

  useEffect(() => {
    cargarBloqueosFijos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, apiUrl]);

  const toggleDia = (dia) => {
    setFijoDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()));
  };

  const crearBloqueoFijo = async (e) => {
    e.preventDefault();
    if (!adminToken) return;

    if (!fijoNombre || fijoDias.length === 0 || !fijoHoraDesde || !fijoHoraHasta) {
      alert("Completá nombre, días y rango horario.");
      return;
    }

    if (fijoHoraDesde >= fijoHoraHasta) {
      alert("La hora 'desde' debe ser menor que la hora 'hasta'.");
      return;
    }

    setCreandoFijo(true);

    try {
      const payload = {
        id_cancha: fijoCancha === "todas" ? null : Number(fijoCancha),
        nombre: fijoNombre.trim(),
        telefono: fijoTelefono || null,
        dias_semana: fijoDias.join(","), // "1,3,4"
        hora_desde: fijoHoraDesde, // "19:00"
        hora_hasta: fijoHoraHasta,
        motivo: fijoMotivo || null,
        activo: 1,
      };

      const data = await fetchJson(`${apiUrl}/admin/bloqueos-fijos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify(payload),
      });

      alert(data?.mensaje || "Bloqueo fijo creado correctamente.");

      // limpiar form
      setFijoNombre("");
      setFijoTelefono("");
      setFijoHoraDesde("");
      setFijoHoraHasta("");
      setFijoMotivo("");
      setFijoDias([1]);
      setFijoCancha("todas");

      await cargarBloqueosFijos();
    } catch (error) {
      console.error("Error creando bloqueo fijo:", error);
      alert(error.message || "Error creando bloqueo fijo.");
    } finally {
      setCreandoFijo(false);
    }
  };

  const eliminarBloqueoFijo = async (id) => {
    if (!window.confirm("¿Eliminar este bloqueo fijo?")) return;

    try {
      const data = await fetchJson(`${apiUrl}/admin/bloqueos-fijos/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken },
      });

      alert(data?.mensaje || "Bloqueo fijo eliminado.");
      setBloqueosFijos((prev) => prev.filter((b) => String(b.id) !== String(id)));
    } catch (error) {
      console.error("Error eliminando bloqueo fijo:", error);
      alert(error.message || "Error eliminando bloqueo fijo.");
    }
  };

  // =========================
  // Aplicar filtros bloqueos fijos (sin romper listado)
  // =========================
  const bloqueosFijosFiltrados = useMemo(() => {
    const term = filtroNombre.trim().toLowerCase();
    const diaNum = filtroDia === "todos" ? null : Number(filtroDia);

    let arr = Array.isArray(bloqueosFijos) ? [...bloqueosFijos] : [];

    // filtro nombre (nombre o motivo)
    if (term) {
      arr = arr.filter((b) => {
        const nombre = String(b?.nombre || "").toLowerCase();
        const mot = String(b?.motivo || "").toLowerCase();
        return nombre.includes(term) || mot.includes(term);
      });
    }

    // filtro cancha
    if (filtroCancha !== "todas") {
      if (filtroCancha === "club") {
        arr = arr.filter((b) => !b?.id_cancha); // null/0/undefined => club
      } else {
        arr = arr.filter((b) => String(b?.id_cancha || "") === String(filtroCancha));
      }
    }

    // filtro día
    if (diaNum && Number.isFinite(diaNum)) {
      arr = arr.filter((b) => parseDias(b?.dias_semana).includes(diaNum));
    }

    // Orden pro: primero club, luego cancha 1/2/3; y por nombre
    arr.sort((a, b) => {
      const ca = a?.id_cancha ? Number(a.id_cancha) : 0;
      const cb = b?.id_cancha ? Number(b.id_cancha) : 0;
      if (ca !== cb) return ca - cb;
      const na = String(a?.nombre || "").toLowerCase();
      const nb = String(b?.nombre || "").toLowerCase();
      return na.localeCompare(nb);
    });

    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bloqueosFijos, filtroNombre, filtroCancha, filtroDia]);

  const totalFijos = Array.isArray(bloqueosFijos) ? bloqueosFijos.length : 0;
  const totalFijosFiltrados = bloqueosFijosFiltrados.length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================= */}
      {/* Bloqueos normales */}
      {/* ========================= */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="pb-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Bloqueos de horarios
          </h2>
          <p className="text-xs text-slate-400 mt-1 pl-4">
            Use esta sección para bloquear horarios por torneos o cierres del club.
          </p>
        </div>

        <form onSubmit={crearBloqueo} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Nuevo bloqueo</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Cancha</label>
              <div className="relative">
                <select
                  value={idCancha}
                  onChange={(e) => setIdCancha(e.target.value)}
                  className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="todas">Todas las canchas</option>
                  <option value="1">Cancha 1</option>
                  <option value="2">Cancha 2</option>
                  <option value="3">Cancha 3</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 pl-1">“Todas” bloqueará el horario para todo el club.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Tipo de bloqueo</label>
              <div className="relative">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="torneo">Torneo</option>
                  <option value="cierre">Cierre</option>
                  <option value="otro">Otro</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Fecha desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Fecha hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Hora desde (opcional)</label>
              <input
                type="time"
                value={horaDesde}
                onChange={(e) => setHoraDesde(e.target.value)}
                className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Hora hasta (opcional)</label>
              <input
                type="time"
                value={horaHasta}
                onChange={(e) => setHoraHasta(e.target.value)}
                className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              <p className="text-[10px] text-slate-500 mt-1 pl-1">Si no se especifican horas, el bloqueo aplica a todo el día.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Motivo (opcional)</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Torneo, mantenimiento, feriado..."
              className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creando}
              className="btn-primary-pro px-6 py-2.5 text-xs font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
            >
              {creando ? "Creando bloqueo..." : "Crear bloqueo"}
            </button>
          </div>
        </form>

        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-200">Bloqueos existentes</h3>
            <button
              onClick={cargarBloqueos}
              className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 border border-white/5 flex items-center gap-1 transition-all"
            >
              {cargandoLista ? "Actualizando..." : <>Actualizar <span className="text-xs">↻</span></>}
            </button>
          </div>

          {bloqueos.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-500">No hay bloqueos registrados.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {bloqueos.map((b) => (
                <div
                  key={b.id}
                  className="border border-white/5 rounded-xl p-3 flex justify-between items-start bg-slate-900/30 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold uppercase tracking-wide border border-white/5">
                        {b.id_cancha ? `Cancha ${b.id_cancha}` : "Todas"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/20 text-emerald-300 border border-emerald-500/20 font-bold uppercase tracking-wide">
                        {etiquetaTipo(b.tipo)}
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium mt-1">
                      {formatoRangoFecha(b)} · <span className="text-slate-400 font-normal">{formatoRangoHora(b)}</span>
                    </p>
                    {b.motivo && <p className="text-slate-400 italic">“{b.motivo}”</p>}
                  </div>

                  <button
                    onClick={() => eliminarBloqueo(b.id)}
                    className="text-[10px] px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-semibold"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================= */}
      {/* Bloqueos fijos */}
      {/* ========================= */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="pb-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Bloqueos fijos
          </h2>
          <p className="text-xs text-slate-400 mt-1 pl-4">
            Bloquea horarios semanales recurrentes (ej: Lun/Mié/Jue 19:00–22:00).
          </p>
        </div>

        <form onSubmit={crearBloqueoFijo} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Nuevo bloqueo fijo</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Cancha</label>
              <div className="relative">
                <select
                  value={fijoCancha}
                  onChange={(e) => setFijoCancha(e.target.value)}
                  className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="todas">Todas las canchas</option>
                  <option value="1">Cancha 1</option>
                  <option value="2">Cancha 2</option>
                  <option value="3">Cancha 3</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Nombre</label>
              <input
                value={fijoNombre}
                onChange={(e) => setFijoNombre(e.target.value)}
                className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-600"
                placeholder="Ej: Juan Pérez"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Teléfono (opcional)</label>
              <input
                value={fijoTelefono}
                onChange={(e) => setFijoTelefono(e.target.value)}
                className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-600"
                placeholder="Ej: 3794..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Motivo (opcional)</label>
              <input
                value={fijoMotivo}
                onChange={(e) => setFijoMotivo(e.target.value)}
                className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-600"
                placeholder="Ej: Horario fijo"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 pl-1 uppercase tracking-wider">Días de la semana</label>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                [1, "Lun"],
                [2, "Mar"],
                [3, "Mié"],
                [4, "Jue"],
                [5, "Vie"],
                [6, "Sáb"],
                [7, "Dom"],
              ].map(([num, label]) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => toggleDia(num)}
                  className={`px-4 py-2 rounded-xl border transition-all font-semibold ${fijoDias.includes(num)
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 shadow-md shadow-emerald-900/20"
                      : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 pl-1">Seleccioná uno o más días (ej: Lun/Mié/Jue).</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Hora desde</label>
              <input
                type="time"
                value={fijoHoraDesde}
                onChange={(e) => setFijoHoraDesde(e.target.value)}
                className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Hora hasta</label>
              <input
                type="time"
                value={fijoHoraHasta}
                onChange={(e) => setFijoHoraHasta(e.target.value)}
                className="w-full text-xs bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creandoFijo}
              className="btn-primary-pro px-6 py-2.5 text-xs font-bold rounded-xl disabled:opacity-60 shadow-lg shadow-emerald-900/20"
            >
              {creandoFijo ? "Creando..." : "Crear bloqueo fijo"}
            </button>
          </div>
        </form>

        {/* LISTA + FILTROS */}
        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Bloqueos fijos existentes</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mostrando <span className="text-white font-bold">{totalFijosFiltrados}</span> de{" "}
                <span className="text-white font-bold">{totalFijos}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={limpiarFiltros}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all"
              >
                Limpiar filtros
              </button>
              <button
                onClick={cargarBloqueosFijos}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all"
              >
                {cargandoFijos ? "Actualizando..." : "Actualizar ↻"}
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/30 p-3 rounded-xl border border-white/5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Buscar por nombre</label>
              <input
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                placeholder="Ej: Juan"
                className="w-full text-xs bg-slate-950/50 text-white border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cancha</label>
              <select
                value={filtroCancha}
                onChange={(e) => setFiltroCancha(e.target.value)}
                className="w-full text-xs bg-slate-950/50 text-white border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                <option value="todas">Todas (club + canchas)</option>
                <option value="club">Solo todo el club</option>
                <option value="1">Cancha 1</option>
                <option value="2">Cancha 2</option>
                <option value="3">Cancha 3</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Día</label>
              <select
                value={filtroDia}
                onChange={(e) => setFiltroDia(e.target.value)}
                className="w-full text-xs bg-slate-950/50 text-white border border-slate-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                <option value="todos">Todos</option>
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
                <option value="7">Domingo</option>
              </select>
            </div>
          </div>

          {totalFijos === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-500">No hay bloqueos fijos registrados.</p>
            </div>
          ) : totalFijosFiltrados === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No hay resultados con esos filtros.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {bloqueosFijosFiltrados.map((b) => (
                <div
                  key={b.id}
                  className="border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 bg-slate-900/30 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5 font-bold uppercase">
                        {b.id_cancha ? `Cancha ${b.id_cancha}` : "Todo el club"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/20 text-indigo-300 border border-indigo-500/20 font-bold uppercase">
                        Fijo
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/40 text-slate-300 border border-slate-700/60 font-semibold">
                        {diasHumanos(b.dias_semana)}
                      </span>
                    </div>

                    <p className="text-slate-200 mt-1">
                      <span className="font-bold text-white text-sm">{b.nombre}</span>{" "}
                      <span className="text-slate-400 block sm:inline">
                        — {hhmm(b.hora_desde)} a {hhmm(b.hora_hasta)}
                      </span>
                    </p>

                    {b.motivo && <p className="text-slate-400 italic">“{b.motivo}”</p>}
                  </div>

                  <div className="flex sm:justify-end">
                    <button
                      onClick={() => eliminarBloqueoFijo(b.id)}
                      className="w-full sm:w-auto text-[10px] px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-semibold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
