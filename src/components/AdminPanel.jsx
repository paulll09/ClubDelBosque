import React, { useState, useEffect, useMemo } from "react";
import EncabezadoAdmin from "./admin/EncabezadoAdmin";
import BarraFechaAdmin from "./admin/BarraFechaAdmin";
import EstadisticasAdmin from "./admin/EstadisticasAdmin";
import FiltrosAdmin from "./admin/FiltrosAdmin";
import ListaReservasAdmin from "./admin/ListaReservasAdmin";
import CalendarioAdmin from "./admin/CalendarioAdmin";

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

  // Filtros avanzados
  const [filtroEstado, setFiltroEstado] = useState("todas"); // todas | activas | confirmadas | canceladas
  const [filtroCancha, setFiltroCancha] = useState("todas"); // todas | 1 | 2 | 3 ...
  const [busqueda, setBusqueda] = useState(""); // nombre / teléfono

  // Vista: lista o calendario
  const [vista, setVista] = useState("lista"); // "lista" | "calendario"

  // ====== NUEVO: Reserva manual (admin) ======
  const [manualCancha, setManualCancha] = useState("1");
  const [manualHora, setManualHora] = useState("");
  const [manualNombre, setManualNombre] = useState("");
  const [manualTelefono, setManualTelefono] = useState("");
  const [creandoManual, setCreandoManual] = useState(false);
  const [bloqueosFijos, setBloqueosFijos] = useState([]);
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

    if (!fechaAdmin || !manualHora || !manualNombre.trim()) {
      alert("Completá fecha, hora y nombre.");
      return;
    }

    setCreandoManual(true);

    try {
      const payload = {
        id_cancha: Number(manualCancha),
        fecha: fechaAdmin,
        hora: manualHora, // "HH:MM"
        nombre_cliente: manualNombre.trim(),
        telefono_cliente: manualTelefono.trim() || ""
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
        alert(data.message || data.mensaje || "No se pudo crear la reserva manual.");
        return;
      }

      alert(data.message || data.mensaje || "Reserva manual creada.");

      // Limpiar campos (mantengo la cancha y la fecha para cargar varias rápido)
      setManualHora("");
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
  const reservasVisibles = reservas.filter((r) => {
    // Filtro por estado
    if (filtroEstado === "activas" && r.estado === "cancelada") return false;
    if (filtroEstado === "confirmadas" && r.estado !== "confirmada")
      return false;
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
      <EncabezadoAdmin onLogout={onLogout} />

      <BarraFechaAdmin
        fechaAdmin={fechaAdmin}
        onFechaChange={setFechaAdmin}
        cargando={cargando}
        onRefrescar={cargarReservas}
      />

      <EstadisticasAdmin estadisticas={estadisticas} />

      <FiltrosAdmin
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        filtroCancha={filtroCancha}
        setFiltroCancha={setFiltroCancha}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        vista={vista}
        setVista={setVista}
      />

      {/* ====== NUEVO: Form reserva manual ====== */}
      <form
        onSubmit={crearReservaManual}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Crear reserva manual
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Para reservas tomadas por teléfono / mostrador. Se crea como{" "}
              <span className="text-slate-200 font-semibold">confirmada</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={cargarReservas}
            className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Actualizar ↻
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cancha
            </label>
            <select
              value={manualCancha}
              onChange={(e) => setManualCancha(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
            >
              <option value="1">Cancha 1</option>
              <option value="2">Cancha 2</option>
              <option value="3">Cancha 3</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Fecha tomada de la barra superior:{" "}
              <span className="text-slate-300">{fechaAdmin}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hora
            </label>
            <input
              type="time"
              value={manualHora}
              onChange={(e) => setManualHora(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre
            </label>
            <input
              value={manualNombre}
              onChange={(e) => setManualNombre(e.target.value)}
              placeholder="Ej: Juan Perez"
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Teléfono (opcional)
            </label>
            <input
              value={manualTelefono}
              onChange={(e) => setManualTelefono(e.target.value)}
              placeholder="Ej: 3794..."
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creandoManual}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors"
          >
            {creandoManual ? "Creando..." : "Crear reserva"}
          </button>
        </div>
      </form>

      {vista === "lista" ? (
        <ListaReservasAdmin
          reservas={reservasVisibles}
          onCancelar={cancelarReserva}
          onEliminar={eliminarReserva}
        />
      ) : (
        <CalendarioAdmin
          reservas={reservasVisibles}
          fechaAdmin={fechaAdmin}
          configClub={configClub}
          bloqueosFijos={bloqueosFijos}
        />
      )}
    </div>
  );
}
