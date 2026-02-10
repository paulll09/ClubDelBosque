import React from "react";

/**
 * Tarjetas de métricas rápidas del panel admin.
 *
 * Props:
 * - estadisticas: objeto con { total, activas, canceladas, confirmadas, pendientes }
 */
export default function EstadisticasAdmin({ estadisticas }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center border-l-4 border-l-slate-600">
        <span className="text-3xl font-black text-white mb-1 drop-shadow-sm">
          {estadisticas.total}
        </span>
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
          Total
        </span>
      </div>
      <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center border-l-4 border-l-emerald-500">
        <span className="text-3xl font-black text-emerald-400 mb-1 drop-shadow-sm">
          {estadisticas.activas}
        </span>
        <span className="text-[10px] text-emerald-500/70 uppercase font-bold tracking-widest">
          Activas
        </span>
      </div>
      <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center border-l-4 border-l-sky-500">
        <span className="text-3xl font-black text-sky-400 mb-1 drop-shadow-sm">
          {estadisticas.confirmadas}
        </span>
        <span className="text-[10px] text-sky-500/70 uppercase font-bold tracking-widest">
          Confirmadas
        </span>
      </div>
      <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center border-l-4 border-l-red-500">
        <span className="text-3xl font-black text-red-400 mb-1 drop-shadow-sm">
          {estadisticas.canceladas}
        </span>
        <span className="text-[10px] text-red-500/70 uppercase font-bold tracking-widest">
          Canceladas
        </span>
      </div>
    </div>
  );
}
