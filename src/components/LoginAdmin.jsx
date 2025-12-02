import React, { useState } from "react";

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

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const respuesta = await fetch(`${apiUrl}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // No dependemos de cookies, solo de token
        body: JSON.stringify({ usuario, password }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        alert(data.mensaje || "Login incorrecto.");
        return;
      }

      if (!data.token) {
        alert("No se recibió token de autenticación desde el servidor.");
        return;
      }

      alert("Login correcto.");
      onLoginCorrecto(data.token);
    } catch (error) {
      console.error("Error en login admin:", error);
      alert("No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
      <h2 className="text-lg font-semibold mb-3 text-center">
        Ingreso administrador
      </h2>

      <form onSubmit={manejarSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">Usuario</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="admin"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold py-2 rounded-xl transition-colors"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </section>
  );
}

export default LoginAdmin;
