import React, { useState } from "react";
import AdminPanel from "./components/AdminPanel";
import LoginAdmin from "./components/LoginAdmin";
import { API_URL } from "./config";

/**
 * Contenedor principal del área de administración.
 *
 * Maneja:
 *  - Estado de login del administrador.
 *  - Almacenamiento del token de admin.
 *  - Renderizado condicional entre login y panel.
 */
export default function Admin() {
  const [logueado, setLogueado] = useState(false);
  const [adminToken, setAdminToken] = useState(null);

  const manejarLogout = () => {
    setLogueado(false);
    setAdminToken(null);
  };

  const manejarLoginCorrecto = (token) => {
    setAdminToken(token);
    setLogueado(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-xl px-4 py-6 space-y-4">
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
          <AdminPanel
            apiUrl={API_URL}
            adminToken={adminToken}
            onLogout={manejarLogout}
          />
        )}
      </div>
    </div>
  );
}
