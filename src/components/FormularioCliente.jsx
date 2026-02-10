import React, { useState } from "react";

export default function FormularioCliente({ fechaSeleccionada, canchaSeleccionada, horaSeleccionada, onConfirmar, onCancelar }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      alert("⚠️ Por favor completá tu nombre y teléfono.");
      return;
    }
    onConfirmar({ nombre: nombre.trim(), telefono: telefono.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slideUp relative overflow-hidden">

        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white">Confirmar Reserva</h3>
            <p className="text-xs text-emerald-400 font-medium mt-1">
              {fechaSeleccionada} • {horaSeleccionada} hs
            </p>
          </div>
          <button
            onClick={onCancelar}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={manejarSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 ml-3">Cancha</label>
            <div className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-300 text-sm flex items-center gap-2">
              <span>🎾</span> Cancha {canchaSeleccionada}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 ml-3">Nombre completo</label>
            <input
              name="nombre"
              id="nombre"
              autoComplete="name"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              placeholder="Tu nombre"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 ml-3">Teléfono (WhatsApp)</label>
            <input
              name="telefono"
              id="telefono"
              autoComplete="tel"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              placeholder="Ej: 3794..."
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              ¡Reservar Ahora!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}