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

  return (
    <div className={`grid ${claseGrid} gap-3`}>
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
              relative aspect-[4/3] rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-1
              transition-all duration-200
              ${
                deshabilitado
                  ? "bg-slate-950/70 text-slate-500 border-slate-800 cursor-default"
                  : "bg-slate-800 text-emerald-50 border-slate-700 hover:bg-emerald-600 hover:border-emerald-500 hover:shadow-lg hover:scale-105 active:scale-95"
              }
            `}
          >
            <span className="text-lg font-bold tracking-tight">{hora}</span>

            {disponible && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/90">
                Disponible
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

