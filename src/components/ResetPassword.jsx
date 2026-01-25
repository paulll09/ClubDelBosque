import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../config";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => params.get("token") || "", [params]);
  const email = useMemo(() => params.get("email") || "", [params]);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    if (!email || !token) {
      setErrMsg("Link inválido. Volvé a solicitar la recuperación.");
      return;
    }

    if (password.length < 8) {
      setErrMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== password2) {
      setErrMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cliente/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrMsg(data?.message || "Token inválido o expirado.");
        return;
      }

      setOkMsg("Contraseña actualizada. Ya podés iniciar sesión.");
      setPassword("");
      setPassword2("");

      // Redirigir al inicio (tu app no tiene /login como página aparte)
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setErrMsg("Error de conexión. Intentá nuevamente.");
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
              Seguridad
            </p>
            <h1 className="text-xl font-extrabold text-white mt-1">
              Restablecer contraseña
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Creá una nueva contraseña para tu cuenta.
            </p>
          </div>

          {!email || !token ? (
            <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl">
              Link inválido o incompleto. Volvé a solicitar la recuperación de contraseña.
              <div className="mt-3">
                <a
                  href="/forgot-password"
                  className="inline-block px-4 py-2 rounded-2xl font-semibold text-xs bg-transparent border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Ir a “Recuperar contraseña”
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 ml-3">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 ml-3">
                  Repetir contraseña
                </label>
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="Repetí la contraseña"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}

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
