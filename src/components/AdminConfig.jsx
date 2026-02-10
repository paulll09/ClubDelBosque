import React, { useEffect, useState } from "react";

/**
 * Vista de configuración general del sistema.
 *
 * Permite:
 *  - Ver el precio de la seña.
 *  - Ver horarios de apertura/cierre.
 *  - Ver duración del turno.
 *  - Modificar y guardar estos valores.
 */
export default function AdminConfig({ apiUrl, adminToken }) {
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [precioSenia, setPrecioSenia] = useState("");
  const [horaApertura, setHoraApertura] = useState("");
  const [horaCierre, setHoraCierre] = useState("");
  const [duracionTurno, setDuracionTurno] = useState("");

  const cargarConfig = async () => {
    if (!adminToken) return;

    setCargando(true);
    try {
      const res = await fetch(`${apiUrl}/admin/config`, {
        headers: {
          "X-Admin-Token": adminToken,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.mensaje || "No se pudo cargar la configuración.");
        return;
      }

      const data = await res.json();

      setPrecioSenia(data.precio_senia ?? "");
      setHoraApertura(data.hora_apertura ?? "");
      setHoraCierre(data.hora_cierre ?? "");
      setDuracionTurno(data.duracion_turno_minutos ?? "");
    } catch (error) {
      console.error("Error al cargar configuración:", error);
      alert("Error de conexión.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConfig();
  }, [adminToken]);

  const guardarConfig = async (e) => {
    e.preventDefault();
    if (!adminToken) return;

    setGuardando(true);
    try {
      const cuerpo = {
        precio_senia: Number(precioSenia) || 0,
        hora_apertura: horaApertura,
        hora_cierre: horaCierre,
        duracion_turno_minutos: Number(duracionTurno) || 60,
      };

      const res = await fetch(`${apiUrl}/admin/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify(cuerpo),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.mensaje || "No se pudo guardar la configuración.");
        return;
      }

      alert(data.mensaje || "Configuración guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      alert("Error de conexión.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl animate-fadeIn space-y-6">
      <div className="pb-4 border-b border-white/5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Configuración general
        </h2>
        <p className="text-xs text-slate-400 mt-1 pl-4">
          Ajustes de precio de seña y horarios de funcionamiento del club.
        </p>
      </div>

      <form
        onSubmit={guardarConfig}
        className="space-y-6"
      >
        {cargando && (
          <p className="text-xs text-slate-400 mb-2 animate-pulse">
            Cargando configuración...
          </p>
        )}

        {/* Precio seña */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">
            Precio de la seña (ARS)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <input
              type="number"
              min="0"
              step="10"
              value={precioSenia}
              onChange={(e) => setPrecioSenia(e.target.value)}
              className="w-full text-sm bg-slate-900/50 text-white border border-slate-700/50 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-600"
              placeholder="Monto de la seña"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 pl-1">
            Este valor se utiliza como monto a cobrar en Mercado Pago por cada reserva.
          </p>
        </div>

        {/* Horarios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">
              Hora de apertura
            </label>
            <input
              type="time"
              value={horaApertura}
              onChange={(e) => setHoraApertura(e.target.value)}
              className="w-full text-sm bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">
              Hora de cierre
            </label>
            <input
              type="time"
              value={horaCierre}
              onChange={(e) => setHoraCierre(e.target.value)}
              className="w-full text-sm bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Duración turno */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">
            Duración del turno (minutos)
          </label>
          <input
            type="number"
            min="30"
            step="15"
            value={duracionTurno}
            onChange={(e) => setDuracionTurno(e.target.value)}
            className="w-full text-sm bg-slate-900/50 text-white border border-slate-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-600"
            placeholder="Ej: 60"
          />
          <p className="text-[10px] text-slate-500 mt-1 pl-1">
            Este valor se puede usar más adelante para generar automáticamente los horarios disponibles.
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={guardando}
            className="btn-primary-pro px-6 py-2.5 text-xs font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
          >
            {guardando ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Guardando...
              </span>
            ) : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
