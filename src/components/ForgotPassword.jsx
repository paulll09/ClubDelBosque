import React, { useState } from "react";
import { API_URL } from "../config";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    const emailTrim = email.trim();

    if (!emailTrim) {
      setErrMsg("⚠️ Ingresá tu email.");
      return;
    }

    setLoading(true);
    try {
      // Por seguridad el backend devuelve siempre un mensaje genérico
      await fetch(`${API_URL}/cliente/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: emailTrim }),
      }).catch(() => null);

      setOkMsg("Si el email existe, te llegará un enlace de recuperación.");
      setEmail("");
    } catch (err) {
      // Aun si falla, mostramos el mismo mensaje genérico
      setOkMsg("Si el email existe, te llegará un enlace de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-fadeIn">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-6">
            <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
              Recuperación
            </p>
            <h1 className="text-xl font-extrabold text-white mt-1">
              Recuperar contraseña
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-3">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="tuemail@gmail.com"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>

          {errMsg && (
            <div className="mt-4 text-xs bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl">
              {errMsg}
            </div>
          )}

          {okMsg && (
            <div className="mt-4 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 px-4 py-3 rounded-2xl">
              {okMsg}
            </div>
          )}

          <div className="mt-5 text-center">
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-emerald-300 transition-colors"
            >
              ← Volver al sistema de reservas
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
