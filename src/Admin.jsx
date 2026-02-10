import React, { useState } from "react";
import AdminPanel from "./components/AdminPanel";
import LoginAdmin from "./components/LoginAdmin";
import AdminConfig from "./components/AdminConfig";
import AdminBloqueos from "./components/AdminBloqueos";
import { API_URL } from "./config";

/**
 * Contenedor principal del área de administración.
 *
 * Maneja:
 *  - Login del administrador.
 *  - Token de admin.
 *  - Pestañas: Reservas / Configuración / Bloqueos.
 */
export default function Admin() {
  const [logueado, setLogueado] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [tabActiva, setTabActiva] = useState("reservas"); // reservas | config | bloqueos

  const manejarLogout = () => {
    setLogueado(false);
    setAdminToken(null);
    setTabActiva("reservas");
  };

  const manejarLoginCorrecto = (token) => {
    setAdminToken(token);
    setLogueado(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="w-full max-w-7xl px-4 py-8 space-y-6">
        {!logueado ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 mb-3 drop-shadow-lg">
              Panel Administrativo
            </h1>
            <p className="text-sm text-slate-400 text-center mb-8 max-w-md">
              Gestioná las reservas, configuraciones y bloqueos del club desde un solo lugar.
            </p>

            <div className="glass-panel p-8 rounded-3xl w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
              <LoginAdmin
                apiUrl={API_URL}
                onLoginCorrecto={manejarLoginCorrecto}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Tabs superiores */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 animate-slideUp">
              <div className="inline-flex bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-lg">
                {[
                  { id: "reservas", label: "Reservas" },
                  { id: "config", label: "Configuración" },
                  { id: "bloqueos", label: "Bloqueos" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${tabActiva === tab.id
                        ? "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={manejarLogout}
                className="group flex items-center gap-2 bg-slate-900/50 border border-slate-700/50 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
              >
                <span>Cerrar sesión</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
              </button>
            </div>

            {/* Contenido según pestaña */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              {tabActiva === "reservas" && (
                <AdminPanel
                  apiUrl={API_URL}
                  adminToken={adminToken}
                  onLogout={manejarLogout}
                />
              )}

              {tabActiva === "config" && (
                <AdminConfig apiUrl={API_URL} adminToken={adminToken} />
              )}

              {tabActiva === "bloqueos" && (
                <AdminBloqueos apiUrl={API_URL} adminToken={adminToken} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

