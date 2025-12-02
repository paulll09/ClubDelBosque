import React, { useState } from "react";

export default function LoginCliente({ onLoginSuccess, onCancelar, apiUrl }) {
  const [esRegistro, setEsRegistro] = useState(false);

  // 🔥 Campos adaptados al backend
  const [form, setForm] = useState({
    nombre_cliente: "",
    telefono_cliente: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si el usuario cambia nombre o teléfono en registro
    // los mapeamos al formato correcto del backend
    if (esRegistro) {
      if (name === "nombre") {
        setForm({ ...form, nombre_cliente: value });
        return;
      }
      if (name === "telefono") {
        setForm({ ...form, telefono_cliente: value });
        return;
      }
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const endpoint = esRegistro
      ? `${apiUrl}/cliente/registro`
      : `${apiUrl}/cliente/login`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        // 🔥 Enviamos EXACTAMENTE lo que el backend necesita
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        const mensajeError =
          data.messages?.error ||
          data.messages ||
          data.message ||
          "Error en la solicitud";

        throw new Error(
          typeof mensajeError === "object"
            ? Object.values(mensajeError).join(", ")
            : mensajeError
        );
      }

      onLoginSuccess(data.usuario);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
        <h2 className="text-xl font-bold text-white text-center mb-4">
          {esRegistro ? "Crear Cuenta" : "Iniciar Sesión"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 animate-pulse">
            <span className="text-red-400 mt-0.5">⚠️</span>
            <p className="text-red-400 text-xs font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {esRegistro && (
            <>
              <input
                name="nombre"
                placeholder="Nombre completo"
                required
                onChange={handleChange}
                className="w-full p-3 bg-slate-800 rounded-xl text-white border border-slate-700 focus:border-emerald-500 placeholder-slate-500 text-sm"
              />
              <input
                name="telefono"
                placeholder="Teléfono"
                required
                onChange={handleChange}
                className="w-full p-3 bg-slate-800 rounded-xl text-white border border-slate-700 focus:border-emerald-500 placeholder-slate-500 text-sm"
              />
            </>
          )}

          <input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            required
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 rounded-xl text-white border border-slate-700 focus:border-emerald-500 placeholder-slate-500 text-sm"
          />

          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 rounded-xl text-white border border-slate-700 focus:border-emerald-500 placeholder-slate-500 text-sm"
          />

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 mt-2"
          >
            {cargando
              ? "Procesando..."
              : esRegistro
              ? "Registrarme"
              : "Ingresar"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError("");
            }}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            {esRegistro
              ? "¿Ya tenés cuenta? Iniciá sesión"
              : "¿No tenés cuenta? Registrate gratis"}
          </button>
        </div>

        <button
          onClick={onCancelar}
          className="mt-4 w-full text-xs text-slate-500 hover:text-slate-300 py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
