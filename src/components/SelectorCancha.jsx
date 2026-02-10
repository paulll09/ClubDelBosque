// src/components/SelectorCancha.jsx
import React from "react";

export default function SelectorCancha({
  canchas = [],
  canchaSeleccionada,
  onSeleccionarCancha,
}) {
  if (!Array.isArray(canchas)) {
    console.warn("SelectorCancha recibió datos inválidos:", canchas);
    return null;
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pt-1 pb-2 no-scrollbar">
      {canchas.map((cancha) => {
        const activa = String(canchaSeleccionada) === String(cancha.id);

        return (
          <button
            key={cancha.id}
            type="button"
            onClick={() => onSeleccionarCancha(cancha.id)}
            className={`
              relative min-w-[160px] h-28 flex flex-col justify-end p-4 rounded-3xl border text-left overflow-hidden group
              transition-all duration-300
              ${activa
                ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-400/50 shadow-xl shadow-emerald-900/30 ring-1 ring-emerald-400/50 scale-[1.02]"
                : "glass-card text-slate-300 border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/60"
              }
            `}
          >
            {/* Decorative background gradient */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-all duration-500 ${activa ? 'bg-emerald-400/30' : 'bg-emerald-500/5 group-hover:bg-emerald-500/10'}`}></div>

            <span className={`relative text-lg font-bold tracking-tight mb-1 transition-colors ${activa ? 'text-white' : 'text-slate-200 group-hover:text-emerald-300'}`}>
              {cancha.nombre || `Cancha ${cancha.id}`}
            </span>

            {cancha.descripcion && (
              <span
                className={`relative text-[11px] leading-tight font-medium ${activa ? "text-emerald-100/90" : "text-slate-500 group-hover:text-slate-400"
                  }`}
              >
                {cancha.descripcion}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
