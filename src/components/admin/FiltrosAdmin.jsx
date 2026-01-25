// FiltrosAdmin.jsx
import React from "react";

export default function FiltrosAdmin({
  filtroEstado,
  setFiltroEstado,
  filtroCancha,
  setFiltroCancha
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Estado */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
            Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-2"
          >
            <option value="todas">Todas</option>
            <option value="confirmadas">Confirmadas</option>
            <option value="canceladas">Canceladas</option>
          </select>
        </div>

        {/* Cancha */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
            Cancha
          </label>
          <select
            value={filtroCancha}
            onChange={(e) => setFiltroCancha(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-2"
          >
            <option value="todas">Todas</option>
            <option value="1">Cancha 1</option>
            <option value="2">Cancha 2</option>
            <option value="3">Cancha 3</option>
          </select>
        </div>

      </div>
    </div>
  );
}

