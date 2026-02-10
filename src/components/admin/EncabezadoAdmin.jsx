import React from "react";

/**
 * Encabezado superior del panel administrativo.
 *
 * Muestra el título del panel y el botón para cerrar sesión.
 *
 * Props:
 * - onLogout: función para cerrar sesión del administrador.
 */
export default function EncabezadoAdmin({ onLogout }) {
  return (
    <div className="flex justify-between items-center pb-4 border-b border-white/5">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
          Panel de Control
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          Administración de turnos <span className="text-emerald-500">•</span> Club del Bosque
        </p>
      </div>

      <button
        onClick={onLogout}
        className="group relative bg-slate-800/40 hover:bg-red-900/20 text-slate-400 hover:text-red-400 p-2.5 rounded-xl transition-all border border-white/5 hover:border-red-500/30 overflow-hidden"
        title="Cerrar Sesión"
      >
        <div className="absolute inset-0 bg-red-500/10 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
        <svg
          className="w-5 h-5 relative z-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
