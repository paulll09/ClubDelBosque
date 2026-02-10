import React, { useState } from "react";
import { useToast } from "../context/ToastContext";

/**
 * Formulario de login para administrador.
 *
 * Recibe:
 *  - apiUrl: URL base del backend
 *  - onLoginCorrecto(token): callback que recibe el token de admin
 */
function LoginAdmin({ apiUrl, onLoginCorrecto }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const { mostrarToast } = useToast();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const respuesta = await fetch(`${apiUrl}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        mostrarToast(data.mensaje || "Login incorrecto.", "error");
        return;
      }

      if (!data.token) {
        mostrarToast("No se recibió token de autenticación.", "error");
        return;
      }

      mostrarToast("¡Bienvenido al panel de administración!", "success");
      onLoginCorrecto(data.token);
    } catch (error) {
      console.error("Error en login admin:", error);
      mostrarToast("No se pudo iniciar sesión. Verificá tu conexión.", "error");
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="w-full space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-white">
          Bienvenido
        </h2>
        <p className="text-xs text-slate-400">
          Ingresá tus credenciales para continuar
        </p>
      </div>

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">Usuario</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full rounded-xl bg-slate-900/50 border border-slate-700/50 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-600"
            placeholder="Ej: admin"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 pl-1 uppercase tracking-wider">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-slate-900/50 border border-slate-700/50 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-600"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full mt-2 btn-primary-pro py-3 text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/20"
        >
          {cargando ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verificando...
            </span>
          ) : "Ingresar al Panel"}
        </button>
      </form>
    </section>
  );
}

export default LoginAdmin;
