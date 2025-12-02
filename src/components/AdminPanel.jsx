import React, { useState, useEffect, useMemo } from "react";

/**
 * Panel administrativo.
 *
 * Recibe:
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

  // Filtros avanzados
  const [filtroEstado, setFiltroEstado] = useState("todas"); // todas | activas | confirmadas | canceladas
  const [filtroCancha, setFiltroCancha] = useState("todas"); // todas | 1 | 2 | 3 ...
  const [busqueda, setBusqueda] = useState(""); // nombre / teléfono

  /**
   * Cargar reservas del backend para la fecha seleccionada.
   */
  const cargarReservas = async () => {
    if (!adminToken) {
      console.warn("No adminToken → No se puede cargar reservas.");
    }

    setCargando(true);

    try {
      const res = await fetch(
        `${apiUrl}/admin/reservas?fecha=${fechaAdmin}`,
        {
          headers: {
            "X-Admin-Token": adminToken,
          },
        }
      );

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
        setReservas((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, estado: "cancelada" } : r
          )
        );
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
    if (
      !window.confirm(
        "¿Borrar permanentemente? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      const res = await fetch(`${apiUrl}/reservas/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Token": adminToken,
        },
      });

      if (res.ok) {
        setReservas((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert("No se pudo eliminar la reserva.");
      }
    } catch (error) {
      alert("Error de conexión.");
    }
  };

  /**
   * Métricas globales.
   */
  const stats = useMemo(() => {
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
  const reservasVisibles = reservas.filter((r) => {
    // Filtro por estado
    if (filtroEstado === "activas" && r.estado === "cancelada") return false;
    if (filtroEstado === "confirmadas" && r.estado !== "confirmada") return false;
    if (filtroEstado === "canceladas" && r.estado !== "cancelada") return false;

    // Filtro por cancha
    if (filtroCancha !== "todas" && String(r.id_cancha) !== filtroCancha) {
      return false;
    }

    // Búsqueda por nombre o teléfono
    if (busqueda.trim() !== "") {
      const texto = busqueda.toLowerCase();
      const nombre = (r.nombre_cliente || "").toLowerCase();
      const telefono = (r.telefono_cliente || "").toLowerCase();
      if (!nombre.includes(texto) && !telefono.includes(texto)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="animate-fadeIn space-y-6 pb-16 w-full max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Panel de Control
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Administración de turnos
          </p>
        </div>

        <button
          onClick={onLogout}
          className="bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 p-2.5 rounded-xl transition-all border border-slate-700 hover:border-red-500/20"
          title="Cerrar Sesión"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* FECHA + BOTÓN ACTUALIZAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
              Fecha seleccionada
            </label>
            <input
              type="date"
              value={fechaAdmin}
              onChange={(e) => setFechaAdmin(e.target.value)}
              className="bg-transparent text-white font-bold text-lg focus:outline-none w-full cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={cargarReservas}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700"
          title="Actualizar lista"
        >
          <svg
            className={`w-5 h-5 ${cargando ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white mb-1">
            {stats.total}
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            Total
          </span>
        </div>
        <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-emerald-400 mb-1">
            {stats.activas}
          </span>
          <span className="text-[10px] text-emerald-500/70 uppercase font-bold tracking-wider">
            Activas
          </span>
        </div>
        <div className="bg-sky-900/10 border border-sky-500/20 p-4 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-sky-400 mb-1">
            {stats.confirmadas}
          </span>
          <span className="text-[10px] text-sky-500/70 uppercase font-bold tracking-wider">
            Confirmadas
          </span>
        </div>
        <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-red-400 mb-1">
            {stats.canceladas}
          </span>
          <span className="text-[10px] text-red-500/70 uppercase font-bold tracking-wider">
            Canceladas
          </span>
        </div>
      </div>

      {/* FILTROS AVANZADOS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filtro estado */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="todas">Todas</option>
              <option value="activas">Activas</option>
              <option value="confirmadas">Confirmadas</option>
              <option value="canceladas">Canceladas</option>
            </select>
          </div>

          {/* Filtro cancha */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
              Cancha
            </label>
            <select
              value={filtroCancha}
              onChange={(e) => setFiltroCancha(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="todas">Todas</option>
              <option value="1">Cancha 1</option>
              <option value="2">Cancha 2</option>
              <option value="3">Cancha 3</option>
              {/* Podés agregar más si en el futuro hay más canchas */}
            </select>
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o teléfono"
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        {reservasVisibles.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
            <p className="text-slate-400 text-sm">
              No hay reservas para mostrar
            </p>
          </div>
        ) : (
          reservasVisibles.map((reserva) => {
            const esCancelada = reserva.estado === "cancelada";

            return (
              <div
                key={reserva.id}
                className={`relative p-5 rounded-2xl border transition-all duration-300 group ${
                  esCancelada
                    ? "bg-slate-950 border-slate-800/50 opacity-60 hover:opacity-100"
                    : "bg-slate-900 border-slate-700 hover:border-emerald-500/40 shadow-lg"
                }`}
              >
                {/* Hora + Cancha */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        esCancelada
                          ? "text-slate-500 line-through"
                          : "text-white"
                      }`}
                    >
                      {reserva.hora?.slice(0, 5)}
                    </span>

                    <span
                      className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                        esCancelada
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      Cancha {reserva.id_cancha}
                    </span>
                  </div>

                  {esCancelada && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-900/10 px-2 py-1 rounded border border-red-500/10">
                      Cancelada
                    </span>
                  )}
                </div>

                {/* Datos + Acciones */}
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p
                      className={`text-sm font-semibold flex items-center gap-2 ${
                        esCancelada
                          ? "text-slate-500"
                          : "text-emerald-300"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 opacity-70"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {reserva.nombre_cliente || "Sin Nombre"}
                    </p>

                    <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                      <svg
                        className="w-3 h-3 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {reserva.telefono_cliente || "---"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!esCancelada ? (
                      <button
                        onClick={() => cancelarReserva(reserva.id)}
                        className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                      >
                        Cancelar
                      </button>
                    ) : (
                      <button
                        onClick={() => eliminarReserva(reserva.id)}
                        className="text-xs font-semibold bg-red-900/10 hover:bg-red-900/30 text-red-400 px-4 py-2 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-2"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
