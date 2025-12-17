import React, { useEffect, useState } from "react";

import {
  obtenerBloqueosFijosAdmin,
  crearBloqueoFijoAdmin,
  eliminarBloqueoFijoAdmin,
} from "../services/apiReservas";


/**
 * Vista para gestionar bloqueos de horarios (torneos, cierres, etc.).
 *
 * Permite:
 *  - Crear bloqueos por rango de fechas y horas.
 *  - Aplicarlos a una cancha específica o a todas.
 *  - Listar y eliminar bloqueos existentes.
 *
 * + NUEVO:
 *  - Bloqueos fijos semanales (ej: Lun/Mié/Jue 19:00–22:00 para Juan Pérez)
 */
export default function AdminBloqueos({ apiUrl, adminToken }) {
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

  // ===== NUEVO: Bloqueos fijos =====
  const [bloqueosFijos, setBloqueosFijos] = useState([]);
  const [creandoFijo, setCreandoFijo] = useState(false);

  // Form fijo
  const [fijoCancha, setFijoCancha] = useState("todas");
  const [fijoNombre, setFijoNombre] = useState("");
  const [fijoTelefono, setFijoTelefono] = useState("");
  const [fijoDias, setFijoDias] = useState([1]); // por defecto lunes
  const [fijoHoraDesde, setFijoHoraDesde] = useState("");
  const [fijoHoraHasta, setFijoHoraHasta] = useState("");
  const [fijoMotivo, setFijoMotivo] = useState("");

  // Helpers (NUEVO): formateo días y horas
  const diasHumanos = (dias) => {
    const map = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 7: "Dom" };
    return String(dias || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => map[Number(n)] || n)
      .join(", ");
  };

  const hhmm = (t) => (t ? String(t).slice(0, 5) : "");

  // =========================
  // Bloqueos normales
  // =========================
  const cargarBloqueos = async () => {
    if (!adminToken) return;

    setCargandoLista(true);
    try {
      const res = await fetch(`${apiUrl}/admin/bloqueos`, {
        headers: { "X-Admin-Token": adminToken },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.mensaje || "No se pudieron cargar los bloqueos.");
        return;
      }

      const data = await res.json();
      setBloqueos(data || []);
    } catch (error) {
      console.error("Error al cargar bloqueos:", error);
      alert("Error de conexión.");
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    cargarBloqueos();
  }, [adminToken, apiUrl]);

  const crearBloqueo = async (e) => {
    e.preventDefault();
    if (!adminToken) return;

    // Validación básica de fechas
    if (!fechaDesde || !fechaHasta) {
      alert("Debe seleccionar fecha desde y fecha hasta.");
      return;
    }

    // Normalización de horas opcionales
    let horaDesdeNormalizada = horaDesde || null;
    let horaHastaNormalizada = horaHasta || null;

    // Caso: solo una de las dos horas
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

    // Si es bloqueo parcial, validar rango hora
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
        // Si no se cargaron horas, van como null, bloqueo de día completo
        hora_desde: horaDesdeNormalizada,
        hora_hasta: horaHastaNormalizada,
        motivo: motivo || null,
        tipo,
      };

      const res = await fetch(`${apiUrl}/admin/bloqueos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify(cuerpo),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.mensaje || "No se pudo crear el bloqueo.");
        return;
      }

      alert(data.mensaje || "Bloqueo creado correctamente.");

      // Limpiar formulario
      setMotivo("");
      setHoraDesde("");
      setHoraHasta("");

      // Refrescar lista
      cargarBloqueos();
    } catch (error) {
      console.error("Error al crear bloqueo:", error);
      alert("Error de conexión.");
    } finally {
      setCreando(false);
    }
  };

  const eliminarBloqueo = async (id) => {
    if (!window.confirm("¿Eliminar este bloqueo de forma permanente?")) return;

    try {
      const res = await fetch(`${apiUrl}/admin/bloqueos/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.mensaje || "No se pudo eliminar el bloqueo.");
        return;
      }

      alert(data.mensaje || "Bloqueo eliminado.");
      setBloqueos((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Error al eliminar bloqueo:", error);
      alert("Error de conexión.");
    }
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

  const etiquetaTipo = (t) => {
    if (t === "torneo") return "Torneo";
    if (t === "cierre") return "Cierre";
    return "Otro";
  };

  // =========================
  // NUEVO: Bloqueos fijos
  // =========================
  const cargarBloqueosFijos = async () => {
    if (!adminToken) return;

    try {
      const data = await obtenerBloqueosFijosAdmin(adminToken, apiUrl);
      setBloqueosFijos(data);
    } catch (error) {
      alert(error.message || "Error de conexión cargando bloqueos fijos.");
    }
  };



  useEffect(() => {
    cargarBloqueosFijos();
  }, [adminToken, apiUrl]);

  const toggleDia = (dia) => {
    setFijoDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()
    );
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
      nombre: fijoNombre,
      telefono: fijoTelefono || null,
      dias_semana: fijoDias.join(","), // ej: "1,3,4"
      hora_desde: fijoHoraDesde,
      hora_hasta: fijoHoraHasta,
      motivo: fijoMotivo || null,
      activo: 1,
    };

    const data = await crearBloqueoFijoAdmin(payload, adminToken, apiUrl);
    alert(data.mensaje || "Bloqueo fijo creado correctamente.");

    // Limpiar formulario
    setFijoNombre("");
    setFijoTelefono("");
    setFijoHoraDesde("");
    setFijoHoraHasta("");
    setFijoMotivo("");
    setFijoDias([1]);

    cargarBloqueosFijos();
  } catch (error) {
    alert(error.message || "Error de conexión creando bloqueo fijo.");
  } finally {
    setCreandoFijo(false);
  }
};


const eliminarBloqueoFijo = async (id) => {
  if (!window.confirm("¿Eliminar este bloqueo fijo?")) return;

  try {
    const data = await eliminarBloqueoFijoAdmin(id, adminToken, apiUrl);
    alert(data.mensaje || "Bloqueo fijo eliminado.");

    setBloqueosFijos((prev) => prev.filter((b) => b.id !== id));
  } catch (error) {
    alert(error.message || "Error de conexión eliminando bloqueo fijo.");
  }
};


  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-slate-800/50">
        <h2 className="text-xl font-bold text-white">Bloqueos de horarios</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Use esta sección para bloquear horarios por torneos o cierres del club.
          Los horarios bloqueados no estarán disponibles para reservas de clientes.
        </p>
      </div>

      {/* Formulario de creación */}
      <form
        onSubmit={crearBloqueo}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4"
      >
        <h3 className="text-sm font-semibold text-slate-100 mb-1">Nuevo bloqueo</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cancha */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cancha</label>
            <select
              value={idCancha}
              onChange={(e) => setIdCancha(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="todas">Todas las canchas</option>
              <option value="1">Cancha 1</option>
              <option value="2">Cancha 2</option>
              <option value="3">Cancha 3</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              “Todas las canchas” bloqueará el horario para todo el club.
            </p>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de bloqueo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="torneo">Torneo</option>
              <option value="cierre">Cierre</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Horas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hora desde (opcional)
            </label>
            <input
              type="time"
              value={horaDesde}
              onChange={(e) => setHoraDesde(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hora hasta (opcional)
            </label>
            <input
              type="time"
              value={horaHasta}
              onChange={(e) => setHoraHasta(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Si no se especifican horas, el bloqueo aplica a todo el día.
            </p>
          </div>
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Motivo (opcional)
          </label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Torneo de verano, mantenimiento, feriado..."
            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creando}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors"
          >
            {creando ? "Creando bloqueo..." : "Crear bloqueo"}
          </button>
        </div>
      </form>

      {/* Lista de bloqueos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-100">Bloqueos existentes</h3>
          <button
            onClick={cargarBloqueos}
            className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
          >
            {cargandoLista ? (
              "Actualizando..."
            ) : (
              <>
                Actualizar <span className="text-xs">↻</span>
              </>
            )}
          </button>
        </div>

        {bloqueos.length === 0 ? (
          <p className="text-xs text-slate-500">No hay bloqueos registrados.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {bloqueos.map((b) => (
              <div
                key={b.id}
                className="border border-slate-800 rounded-xl p-3 flex justify-between items-start bg-slate-950/50"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 font-semibold uppercase tracking-wide">
                      {b.id_cancha ? `Cancha ${b.id_cancha}` : "Todas"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/20 text-emerald-300 border border-emerald-500/20 font-semibold uppercase tracking-wide">
                      {etiquetaTipo(b.tipo)}
                    </span>
                  </div>
                  <p className="text-slate-200">
                    {formatoRangoFecha(b)} · <span className="text-slate-400">{formatoRangoHora(b)}</span>
                  </p>
                  {b.motivo && <p className="text-slate-400 italic">“{b.motivo}”</p>}
                </div>

                <button
                  onClick={() => eliminarBloqueo(b.id)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== BLOQUEOS FIJOS ===== */}
      <div className="pt-4 border-t border-slate-800/60 space-y-4">
        <div className="pb-2">
          <h2 className="text-xl font-bold text-white">Bloqueos fijos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bloquea horarios semanales recurrentes (ej: Lun/Mié/Jue 19:00–22:00).
          </p>
        </div>

        <form
          onSubmit={crearBloqueoFijo}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-100">Nuevo bloqueo fijo</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cancha</label>
              <select
                value={fijoCancha}
                onChange={(e) => setFijoCancha(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
              >
                <option value="todas">Todas las canchas</option>
                <option value="1">Cancha 1</option>
                <option value="2">Cancha 2</option>
                <option value="3">Cancha 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre</label>
              <input
                value={fijoNombre}
                onChange={(e) => setFijoNombre(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
                placeholder="Ej: Juan Pérez"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono (opcional)</label>
              <input
                value={fijoTelefono}
                onChange={(e) => setFijoTelefono(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
                placeholder="Ej: 3794..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo (opcional)</label>
              <input
                value={fijoMotivo}
                onChange={(e) => setFijoMotivo(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
                placeholder="Ej: Horario fijo"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Días de la semana</label>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                [1, "Lun"], [2, "Mar"], [3, "Mié"], [4, "Jue"], [5, "Vie"], [6, "Sáb"], [7, "Dom"],
              ].map(([num, label]) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => toggleDia(num)}
                  className={`px-3 py-1 rounded-full border ${
                    fijoDias.includes(num)
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                      : "bg-slate-950 border-slate-700 text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Seleccioná uno o más días (ej: Lun/Mié/Jue).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hora desde</label>
              <input
                type="time"
                value={fijoHoraDesde}
                onChange={(e) => setFijoHoraDesde(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hora hasta</label>
              <input
                type="time"
                value={fijoHoraHasta}
                onChange={(e) => setFijoHoraHasta(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creandoFijo}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white"
            >
              {creandoFijo ? "Creando..." : "Crear bloqueo fijo"}
            </button>
          </div>
        </form>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Bloqueos fijos existentes</h3>
            <button
              onClick={cargarBloqueosFijos}
              className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              Actualizar ↻
            </button>
          </div>

          {bloqueosFijos.length === 0 ? (
            <p className="text-xs text-slate-500">No hay bloqueos fijos registrados.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {bloqueosFijos.map((b) => (
                <div
                  key={b.id}
                  className="border border-slate-800 rounded-xl p-3 flex justify-between items-start bg-slate-950/50"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 font-semibold uppercase">
                        {b.id_cancha ? `Cancha ${b.id_cancha}` : "Todas"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/20 text-indigo-300 border border-indigo-500/20 font-semibold uppercase">
                        Fijo
                      </span>
                    </div>

                    <p className="text-slate-200">
                      {b.nombre} ·{" "}
                      <span className="text-slate-400">
                        {hhmm(b.hora_desde)} a {hhmm(b.hora_hasta)}
                      </span>
                    </p>

                    <p className="text-slate-400">Días: {diasHumanos(b.dias_semana)}</p>

                    {b.motivo && <p className="text-slate-400 italic">“{b.motivo}”</p>}
                  </div>

                  <button
                    onClick={() => eliminarBloqueoFijo(b.id)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
