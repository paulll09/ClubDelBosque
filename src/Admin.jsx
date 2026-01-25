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
    <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-7xl px-4 py-6 space-y-4">
        {!logueado ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">
              Panel administrativo
            </h1>
            <p className="text-xs text-slate-400 text-center mb-4">
              Ingrese con las credenciales de administrador para gestionar los turnos.
            </p>

            <LoginAdmin
              apiUrl={API_URL}
              onLoginCorrecto={manejarLoginCorrecto}
            />
          </>
        ) : (
          <>
            {/* Tabs superiores */}
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex bg-slate-900 border border-slate-800 rounded-2xl p-1">
                {[
                  { id: "reservas", label: "Reservas" },
                  { id: "config", label: "Configuración" },
                  { id: "bloqueos", label: "Bloqueos" },
                  // más adelante: { id: "usuarios", label: "Usuarios" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      tabActiva === tab.id
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={manejarLogout}
                className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/5 transition-all"
              >
                Cerrar sesión
              </button>
            </div>

            {/* Contenido según pestaña */}
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
          </>
        )}
      </div>
    </div>
  );
}

