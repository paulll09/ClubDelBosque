import React, { useState, useEffect, useMemo } from "react";
import EncabezadoAdmin from "./admin/EncabezadoAdmin";
import BarraFechaAdmin from "./admin/BarraFechaAdmin";
import EstadisticasAdmin from "./admin/EstadisticasAdmin";
import CalendarioAdmin from "./admin/CalendarioAdmin";
import AdminTarifasHorarias from "./AdminTarifasHorarias";
import AdminSeniasHorarias from "./AdminSeniasHorarias";


/**
 * Panel administrativo.
 *
 * Responsabilidades:
 *  - Gestionar estado global del panel (fecha, reservas, config del club).
 *  - Cargar datos desde el backend (reservas y configuración).
 *  - Aplicar filtros y métricas.
 *  - Delegar el renderizado en subcomponentes de presentación.
 *
 * Props:
 * - apiUrl: URL base del backend
 * - adminToken: token de administrador
 * - onLogout: callback para cerrar sesión
 */
export default function AdminPanel({ apiUrl, adminToken, onLogout }) {
  const [fechaAdmin, setFechaAdmin] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Configuración del club (hora_apertura, hora_cierre, etc.)
  const [configClub, setConfigClub] = useState(null);


  // ====== NUEVO: Reserva manual (admin) ======
  const [manualCancha, setManualCancha] = useState("1");
  const [manualHoraDesde, setManualHoraDesde] = useState("");
  const [manualHoraHasta, setManualHoraHasta] = useState("");
  const [manualNombre, setManualNombre] = useState("");
  const [manualTelefono, setManualTelefono] = useState("");
  const [creandoManual, setCreandoManual] = useState(false);


  const [bloqueosFijos, setBloqueosFijos] = useState([]);

  const [eliminandoIds, setEliminandoIds] = useState(new Set());

  const [vistaAdmin, setVistaAdmin] = useState("calendario");
  // posibles valores: "calendario" | "tarifas"


  /**
   * Cargar configuración del club (para entender jornadas que cruzan medianoche).
   */
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const res = await fetch(`${apiUrl}/config`);
        if (!res.ok) return;
        const data = await res.json();
        setConfigClub(data);
      } catch (error) {
        console.warn("No se pudo cargar config del club:", error);
      }
    };

    cargarConfig();
  }, [apiUrl]);

  const cargarBloqueosFijos = async () => {
    if (!adminToken) return;

    const res = await fetch(`${apiUrl}/admin/bloqueos-fijos`, {
      headers: { "X-Admin-Token": adminToken },
    });

    const data = await res.json().catch(() => []);
    if (res.ok) setBloqueosFijos(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!adminToken) return;
    cargarBloqueosFijos();
  }, [adminToken]);

  /**
   * Cargar reservas del backend para la fecha seleccionada.
   */
  const cargarReservas = async () => {
    if (!adminToken) {
      console.warn("No adminToken → No se puede cargar reservas.");
    }

    setCargando(true);

    try {
      const res = await fetch(`${apiUrl}/admin/reservas?fecha=${fechaAdmin}`, {
        headers: {
          "X-Admin-Token": adminToken,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.mensaje || "No se pudieron cargar las reservas.");
        return;
      }

      const data = await res.json();
      setReservas(data || []);
    } catch (error) {
      console.error("Error al cargar reservas admin:", error);
      alert("Error de conexión.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, [fechaAdmin, adminToken]);

  /**
   * NUEVO: Crear reserva manual (admin) - confirmada, sin MP.
   */
  const crearReservaManual = async (e) => {
    e.preventDefault();
    if (!adminToken) return;

    if (
      !fechaAdmin ||
      !manualHoraDesde ||
      !manualHoraHasta ||
      !manualNombre.trim()
    ) {
      alert("Completá fecha, hora desde, hora hasta y nombre.");
      return;
    }

    // Validación básica en front: hasta > desde
    if (manualHoraHasta <= manualHoraDesde) {
      alert("La hora 'hasta' debe ser mayor que la hora 'desde'.");
      return;
    }

    setCreandoManual(true);

    try {
      const payload = {
        id_cancha: Number(manualCancha),
        fecha: fechaAdmin,
        hora_desde: manualHoraDesde, // "HH:MM"
        hora_hasta: manualHoraHasta, // "HH:MM"
        nombre_cliente: manualNombre.trim(),
        telefono_cliente: manualTelefono.trim() || "-", // <- importante
      };

      const res = await fetch(`${apiUrl}/admin/reservas/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(
          data.message || data.mensaje || "No se pudo crear la reserva manual."
        );
        return;
      }

      alert(
        data.message ||
        `Reserva manual creada (${data.cantidad_hs || "?"} hs).`
      );

      // Limpiar campos (mantengo cancha y fecha)
      setManualHoraDesde("");
      setManualHoraHasta("");
      setManualNombre("");
      setManualTelefono("");

      // Refrescar reservas del día actual
      cargarReservas();
    } catch (error) {
      console.error("Error creando reserva manual:", error);
      alert("Error de conexión.");
    } finally {
      setCreandoManual(false);
    }
  };

  /**
   * Cancelar reserva (cambia estado a "cancelada").
   */
  const cancelarReserva = async (id) => {
    if (!window.confirm("¿Cancelar esta reserva?")) return;

    try {
      const res = await fetch(`${apiUrl}/reservas/cancelar/${id}`, {
        method: "POST",
        headers: {
          "X-Admin-Token": adminToken,
        },
      });

      if (res.ok) {
        await cargarReservas();
      } else {
        alert("No se pudo cancelar la reserva.");
      }
    } catch (error) {
      alert("Error de conexión.");
    }
  };

  /**
   * Eliminar reserva de forma permanente.
   */
  const eliminarReserva = async (id) => {
    if (!window.confirm("¿Borrar permanentemente? Esta acción no se puede deshacer.")) return;

    // Evita doble click / doble request
    if (eliminandoIds.has(id)) return;
    setEliminandoIds(prev => new Set(prev).add(id));

    try {
      const res = await fetch(`${apiUrl}/reservas/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken },
      });

      //Si da 404, considerarlo OK (ya no existe)
      if (res.ok || res.status === 404) {
        setReservas(prev => prev.filter(r => r.id !== id));
      } else {
        alert("No se pudo eliminar la reserva.");
      }
    } catch (e) {
      alert("Error de conexión.");
    } finally {
      setEliminandoIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  };

  /**
   * Métricas globales.
   */
  const estadisticas = useMemo(() => {
    const total = reservas.length;
    const canceladas = reservas.filter((r) => r.estado === "cancelada").length;
    const confirmadas = reservas.filter((r) => r.estado === "confirmada").length;
    const pendientes = reservas.filter((r) => r.estado === "pendiente").length;

    return {
      total,
      activas: total - canceladas,
      canceladas,
      confirmadas,
      pendientes,
    };
  }, [reservas]);

  /**
   * Aplicar filtros avanzados sobre la lista de reservas.
   */
  const reservasVisibles = reservas;

  return (
    <div className="animate-fadeIn space-y-6 pb-16 w-full mx-auto px-2 sm:px-4 max-w-7xl">
      <EncabezadoAdmin onLogout={onLogout} />

      {/* Tabs */}
      <div className="flex gap-2 px-2">
        <button
          type="button"
          onClick={() => setVistaAdmin("calendario")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold ${vistaAdmin === "calendario"
              ? "bg-emerald-500 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
        >
          Calendario
        </button>

        <button
          type="button"
          onClick={() => setVistaAdmin("tarifas")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold ${vistaAdmin === "tarifas"
              ? "bg-emerald-500 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
        >
          Tarifas
        </button>

        <button
          type="button"
          onClick={() => setVistaAdmin("senias")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold ${vistaAdmin === "senias"
              ? "bg-emerald-500 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
        >
          Señas
        </button>

      </div>

      {/* ===================== */}
      {/* VISTA: CALENDARIO */}
      {/* ===================== */}
      {vistaAdmin === "calendario" && (
        <>
          <BarraFechaAdmin
            fechaAdmin={fechaAdmin}
            onFechaChange={setFechaAdmin}
            cargando={cargando}
            onRefrescar={cargarReservas}
          />

          <EstadisticasAdmin estadisticas={estadisticas} />

          {/* ====== Form reserva manual (desde / hasta) ====== */}
          <form
            onSubmit={crearReservaManual}
            className="glass-panel p-6 rounded-3xl space-y-5 animate-slideUp"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Crear reserva manual
                </h3>
                <p className="text-xs text-slate-400 mt-1 pl-4">
                  Para reservas por teléfono/mostrador. Se crea como{" "}
                  <span className="text-emerald-400 font-semibold">confirmada</span>.
                </p>
              </div>

              <button
                type="button"
                onClick={cargarReservas}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all"
              >
                Actualizar ↻
              </button>
            </div>

            {/* Fila 1: Cancha + Desde + Hasta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 pl-1">
                  Cancha
                </label>
                <div className="relative">
                  <select
                    value={manualCancha}
                    onChange={(e) => setManualCancha(e.target.value)}
                    className="w-full text-xs bg-slate-900/50 text-white border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                  >
                    <option value="1">Cancha 1</option>
                    <option value="2">Cancha 2</option>
                    <option value="3">Cancha 3</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 pl-1">
                  Fecha: <span className="text-slate-300 font-medium">{fechaAdmin}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 pl-1">
                  Hora desde
                </label>
                <input
                  type="time"
                  value={manualHoraDesde}
                  onChange={(e) => setManualHoraDesde(e.target.value)}
                  className="w-full text-xs bg-slate-900/50 text-white border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 pl-1">
                  Hora hasta
                </label>
                <input
                  type="time"
                  value={manualHoraHasta}
                  onChange={(e) => setManualHoraHasta(e.target.value)}
                  className="w-full text-xs bg-slate-900/50 text-white border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1 pl-1">
                  Ej: 20:00 a 22:00 crea 20:00 y 21:00
                </p>
              </div>
            </div>

            {/* Fila 2: Nombre + Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 pl-1">
                  Nombre del cliente
                </label>
                <input
                  value={manualNombre}
                  onChange={(e) => setManualNombre(e.target.value)}
                  placeholder="Ej: Juan Perez"
                  className="w-full text-xs bg-slate-900/50 text-white border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 pl-1">
                  Teléfono (opcional)
                </label>
                <input
                  value={manualTelefono}
                  onChange={(e) => setManualTelefono(e.target.value)}
                  placeholder="Ej: 3794..."
                  className="w-full text-xs bg-slate-900/50 text-white border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creandoManual}
                className="btn-primary-pro px-6 py-2.5 text-xs rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creandoManual ? "Creando..." : "Crear reserva"}
              </button>
            </div>
          </form>

          {/* SOLO CALENDARIO (sin lista) */}
          <CalendarioAdmin
            reservas={reservasVisibles}
            fechaAdmin={fechaAdmin}
            configClub={configClub}
            bloqueosFijos={bloqueosFijos}
            onCancelar={cancelarReserva}
            onEliminar={eliminarReserva}
          />
        </>
      )}

      {/* ===================== */}
      {/* VISTA: TARIFAS */}
      {/* ===================== */}
      {vistaAdmin === "tarifas" && (
        <AdminTarifasHorarias apiUrl={apiUrl} adminToken={adminToken} />
      )}

      {/* ===================== */}
      {/* VISTA: SENIAS */}
      {/* ===================== */}
      {vistaAdmin === "senias" && (
        <AdminSeniasHorarias apiUrl={apiUrl} adminToken={adminToken} />
      )}
    </div>
  );

}
