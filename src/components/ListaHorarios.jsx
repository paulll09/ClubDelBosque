// src/components/ListaHorarios.jsx
import React from "react";

export default function ListaHorarios({
  horarios,
  fechaSeleccionada,
  estaReservado,
  esHorarioPasado,
  esBloqueado,
  seleccionarHorario,
}) {
  if (!fechaSeleccionada) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
        <div className="flex justify-center mb-3">
          <svg
            className="w-6 h-6 text-slate-400"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.8"
          >
            <rect
              x="3"
              y="5"
              width="18"
              height="16"
              rx="2"
              ry="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 3v4M8 3v4M3 10h18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-400">
          Seleccioná una fecha arriba
          <br />
          para ver los turnos.
        </p>
      </div>
    );
  }

  // Para calcular si hay pocos horarios disponibles y agrandar la grilla
  const disponibilidadLibre = (h) => {
    const reservado = estaReservado ? estaReservado(h) : false;
    const bloqueado = esBloqueado ? esBloqueado(h) : false;
    const pasado = esHorarioPasado ? esHorarioPasado(h) : false;
    return !reservado && !bloqueado && !pasado;
  };

  const horariosDisponibles = horarios.filter(disponibilidadLibre);
  const pocosHorarios = horariosDisponibles.length <= 3;
  const claseGrid = pocosHorarios ? "grid-cols-2" : "grid-cols-3";

  // Renderizado
  return (
    <div className={`grid grid-cols-3 sm:grid-cols-4 gap-3`}>
      {horarios.map((hora) => {
        const reservado = estaReservado ? estaReservado(hora) : false;
        const bloqueado = esBloqueado ? esBloqueado(hora) : false;
        const pasado = esHorarioPasado ? esHorarioPasado(hora) : false;

        const deshabilitado = reservado || bloqueado || pasado;
        const disponible = !deshabilitado;

        return (
          <button
            key={hora}
            type="button"
            onClick={() => disponible && seleccionarHorario(hora)}
            disabled={deshabilitado}
            className={`
              relative group overflow-hidden rounded-xl border py-3 flex flex-col items-center justify-center gap-0.5
              transition-all duration-300
              ${deshabilitado
                ? "bg-slate-900/40 text-slate-600 border-slate-800/50 cursor-not-allowed opacity-60"
                : "bg-slate-800/60 text-white border-white/5 hover:border-emerald-500/50 hover:bg-emerald-900/20 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-95"
              }
            `}
          >
            {disponible && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}

            <span className={`text-sm font-bold tracking-tight z-10 ${disponible ? "text-emerald-50 group-hover:text-emerald-300" : ""}`}>
              {hora}
            </span>

            {disponible ? (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/80 z-10 group-hover:text-emerald-300">
                Libre
              </span>
            ) : (
              <span className="text-[9px] font-medium uppercase tracking-wider text-slate-600 z-10">
                {reservado ? "Ocupado" : bloqueado ? "Bloqueado" : "Pasado"}
              </span>
            )}

            {disponible && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}

