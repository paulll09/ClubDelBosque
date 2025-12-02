import React, { useState, useEffect, useMemo } from "react";

export default function AdminPanel({ apiUrl, onLogout }) {
  const [fechaAdmin, setFechaAdmin] = useState(new Date().toISOString().slice(0, 10));
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState("todas"); 

  // --- CARGAR Y ORDENAR ---
    const cargarReservas = async () => {
    if (!fechaAdmin || !adminToken) return;
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
      alert("Error de conexión al cargar reservas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, [fechaAdmin, adminToken]);

  // --- ACCIONES ---
  
  // 1. Cancelar (Lógica de negocio: liberar el turno)
  const cancelarReserva = async (id) => {
    if (!window.confirm("¿Cancelar esta reserva? Pasará a estado 'cancelada'.")) return;
    try {
      const res = await fetch(`${apiUrl}/reservas/cancelar/${id}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setReservas((prev) =>
          prev.map((r) => (r.id === id ? { ...r, estado: "cancelada" } : r))
        );
      } else {
        alert("No se pudo cancelar.");
      }
    } catch (error) {
      alert("Error de conexión.");
    }
  };

  // 2. Eliminar (Lógica de limpieza: borrar de la BD)
  const eliminarReserva = async (id) => {
    if (!window.confirm("⚠️ ¿Borrar permanentemente del historial? Esta acción no se puede deshacer.")) return;
    
    try {
      // Asumimos que tu backend tiene un método DELETE o usamos una ruta específica
      // Nota: Si tu backend no soporta DELETE, necesitarás agregar el método delete($id) en ReservasController.
      const res = await fetch(`${apiUrl}/reservas/${id}`, {
        method: "DELETE", 
        credentials: "include",
      });

      if (res.ok) {
        setReservas((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert("Error al eliminar. Verificá que el backend tenga el método delete implementado.");
      }
    } catch (error) {
      alert("Error de conexión al intentar borrar.");
    }
  };

  // --- MÉTRICAS ---
  const stats = useMemo(() => {
    const total = reservas.length;
    const canceladas = reservas.filter((r) => r.estado === "cancelada").length;
    const activas = total - canceladas;
    return { total, activas, canceladas };
  }, [reservas]);

  // --- FILTRO VISUAL ---
  const reservasVisibles = reservas.filter((r) => {
    if (filtro === "activas") return r.estado !== "cancelada";
    if (filtro === "canceladas") return r.estado === "cancelada";
    return true;
  });

  return (
    <div className="animate-fadeIn space-y-6 pb-16 w-full max-w-2xl mx-auto">
      
      {/* HEADER */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Panel de Control</h2>
          <p className="text-xs text-slate-400 mt-0.5">Administración de turnos</p>
        </div>
        <button 
          onClick={onLogout}
          className="bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 p-2.5 rounded-xl transition-all border border-slate-700 hover:border-red-500/20"
          title="Cerrar Sesión"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* FILTRO DE FECHA */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Fecha seleccionada</label>
                <input
                    type="date"
                    value={fechaAdmin}
                    onChange={(e) => setFechaAdmin(e.target.value)}
                    className="bg-transparent text-white font-bold text-lg focus:outline-none w-full cursor-pointer color-scheme-dark"
                />
            </div>
        </div>
        
        <button 
            onClick={cargarReservas}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700"
            title="Actualizar lista"
        >
            <svg className={`w-5 h-5 ${cargando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* KPIs / MÉTRICAS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white mb-1">{stats.total}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total</span>
        </div>
        <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-emerald-400 mb-1">{stats.activas}</span>
            <span className="text-[10px] text-emerald-500/70 uppercase font-bold tracking-wider">Activas</span>
        </div>
        <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-red-400 mb-1">{stats.canceladas}</span>
            <span className="text-[10px] text-red-500/70 uppercase font-bold tracking-wider">Bajas</span>
        </div>
      </div>

      {/* PESTAÑAS DE FILTRO */}
      <div className="bg-slate-900/50 p-1 rounded-xl flex border border-slate-800">
        {["todas", "activas", "canceladas"].map(f => (
            <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
                    filtro === f 
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
            >
                {f}
            </button>
        ))}
      </div>

      {/* LISTA DE RESERVAS */}
      <div className="space-y-3">
        {reservasVisibles.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                <p className="text-slate-400 text-sm">No hay reservas para mostrar</p>
            </div>
        ) : (
            reservasVisibles.map((reserva) => {
                const esCancelada = reserva.estado === 'cancelada';
                return (
                    <div 
                        key={reserva.id} 
                        className={`relative p-5 rounded-2xl border transition-all duration-300 group ${
                            esCancelada 
                            ? 'bg-slate-950 border-slate-800/50 opacity-60 hover:opacity-100' 
                            : 'bg-slate-900 border-slate-700 hover:border-emerald-500/40 shadow-lg'
                        }`}
                    >
                        {/* Fila Superior: Hora y Estado */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className={`text-2xl font-black tracking-tight ${esCancelada ? 'text-slate-500 line-through' : 'text-white'}`}>
                                    {reserva.hora?.slice(0, 5)}
                                </span>
                                <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                                    esCancelada 
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}>
                                    Cancha {reserva.id_cancha}
                                </span>
                            </div>
                            
                            {/* Etiqueta de Estado */}
                            {esCancelada && (
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-900/10 px-2 py-1 rounded border border-red-500/10">
                                    Cancelada
                                </span>
                            )}
                        </div>

                        {/* Fila Inferior: Datos y Acciones */}
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className={`text-sm font-semibold flex items-center gap-2 ${esCancelada ? 'text-slate-500' : 'text-emerald-300'}`}>
                                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    {reserva.nombre_cliente || "Sin Nombre"}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                                    <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    {reserva.telefono_cliente || "---"}
                                </p>
                            </div>

                            {/* Botones de Acción */}
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
                                        title="Borrar permanentemente"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
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