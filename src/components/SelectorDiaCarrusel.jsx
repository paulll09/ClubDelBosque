// src/components/SelectorDiaCarrusel.jsx
import React, { useEffect } from "react";

function generarDiasProximos(cantidad) {
  const hoy = new Date();
  const diasSemana = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const mesesCortos = [
    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
  ];

  const dias = [];
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const valor = `${y}-${m}-${day}`;

    dias.push({
      valor,
      diaSemana: diasSemana[d.getDay()],
      numeroDia: day,
      mesCorto: mesesCortos[d.getMonth()],
    });
  }

  return dias;
}

export default function SelectorDiaCarrusel({ fechaSeleccionada, onSeleccionarFecha }) {
  const dias = generarDiasProximos(15);

  useEffect(() => {
    if (!fechaSeleccionada && dias.length > 0) {
      onSeleccionarFecha(dias[0].valor);
    }
  }, [fechaSeleccionada, dias, onSeleccionarFecha]);

  return (
    <div className="flex gap-3 overflow-x-auto pt-2 pb-4 px-4 no-scrollbar snap-x snap-mandatory">
      {dias.map((dia) => {
        const seleccionado = fechaSeleccionada === dia.valor;

        return (
          <button
            key={dia.valor}
            type="button"
            onClick={() => onSeleccionarFecha(dia.valor)}
            className={`
              relative min-w-[76px] flex flex-col items-center justify-center rounded-2xl border 
              snap-start py-4 transition-all duration-300 group
              ${seleccionado
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/40 scale-105"
                : "glass-card text-slate-400 border-white/5 hover:border-emerald-500/30 hover:bg-slate-800/80"
              }
            `}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${seleccionado ? "text-emerald-100" : "text-slate-500 group-hover:text-emerald-400/80 transition-colors"
                }`}
            >
              {dia.diaSemana}
            </span>

            <span
              className={`text-2xl font-black leading-none tracking-tight ${seleccionado ? "text-white drop-shadow-md" : "text-slate-300 group-hover:text-white transition-colors"
                }`}
            >
              {dia.numeroDia}
            </span>

            <span
              className={`text-[10px] font-medium mt-1 ${seleccionado ? "text-emerald-100/80" : "text-slate-500 group-hover:text-slate-400"
                }`}
            >
              {dia.mesCorto}
            </span>

            {seleccionado && (
              <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400/50 pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
}
