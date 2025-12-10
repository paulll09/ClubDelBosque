// src/components/ListaHorarios.jsx
import React from "react";

/**
 * ListaHorarios
 *
 * Muestra los horarios disponibles/ocupados/bloqueados para una cancha y fecha.
 *
 * Props:
 *  - horarios: array de strings "HH:MM"
 *  - horaSeleccionada: string "HH:MM" (selección actual)
 *  - estaReservado(hora): bool → true si está reservado (pendiente o confirmada)
 *  - esHorarioPasado(hora): bool → true si es un horario en el pasado
 *  - esBloqueado(hora): bool → true si está bloqueado por cierre/torneo
 *  - seleccionarHorario(hora): callback al hacer click en un horario disponible
 */
export default function ListaHorarios({
  horarios,
  horaSeleccionada,
  estaReservado,
  esHorarioPasado,
  esBloqueado,
  seleccionarHorario,
}) {
  if (!horarios || horarios.length === 0) {
    return (
      <div className="mt-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 px-4 py-3 text-center text-emerald-100 text-sm">
        No hay horarios configurados para este día.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-medium text-emerald-100">
        Horarios disponibles
      </h3>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {horarios.map((hora) => {
          const reservado = estaReservado && estaReservado(hora);
          const pasado = esHorarioPasado && esHorarioPasado(hora);
          const bloqueado = esBloqueado && esBloqueado(hora);

          const deshabilitado = reservado || pasado || bloqueado;
          const esSeleccionada = horaSeleccionada === hora;

          let labelEstado = "";
          if (reservado) labelEstado = "Ocupado";
          else if (bloqueado) labelEstado = "Bloqueado";
          else if (pasado) labelEstado = "Pasado";

          return (
            <button
              key={hora}
              type="button"
              disabled={deshabilitado}
              onClick={() => {
                if (!deshabilitado) {
                  seleccionarHorario(hora);
                }
              }}
              className={[
                "relative flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs sm:text-sm transition-all duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                deshabilitado
                  ? "bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed"
                  : esSeleccionada
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-50 shadow-[0_0_0_1px_rgba(45,212,191,0.5)] scale-[1.03]"
                  : "bg-slate-900/40 border-emerald-500/20 text-emerald-50 hover:border-emerald-400 hover:bg-emerald-500/10",
              ].join(" ")}
            >
              <span className="font-semibold leading-none">
                {hora} hs
              </span>

              {labelEstado && (
                <span className="mt-1 text-[0.65rem] uppercase tracking-wide font-semibold">
                  {labelEstado}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
