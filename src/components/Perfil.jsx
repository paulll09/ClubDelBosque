import React from "react";

export default function Perfil({ usuario, onLogout }) {
  return (
    <div className="p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-emerald-400 mb-4 border border-emerald-500/50">
          {(usuario.nombre || usuario.email || "?").charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-white">{usuario.nombre || "Usuario"}</h2>
        <p className="text-slate-400 text-sm mb-6">{usuario.email}</p>

        <div className="text-left space-y-3 mb-8">
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Teléfono</p>
            <p className="text-slate-200 text-sm">{usuario.telefono || "-"}</p>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">ID de Socio</p>
            <p className="text-slate-200 text-sm">#{usuario.id}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-semibold hover:bg-red-500/20 transition-colors border border-red-500/20"
        >
          Cerrar Sesión
        </button>


      </div>
    </div>
  );
}