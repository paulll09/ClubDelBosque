// src/components/MisTurnos.jsx
import React, { useEffect, useState } from "react";
import Loader from "./Loader";

/**
 * Componente MisTurnos
 * Muestra las reservas confirmadas del usuario y permite cancelarlas.
 */
export default function MisTurnos({ usuario, apiUrl }) {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // Helpers de fecha y hora
  // ---------------------------
  const esFuturoOHoy = (fechaStr, horaStr) => {
    if (!fechaStr) return false;

    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    const [h, m] = (horaStr || "00:00").split(":").map(Number);

    const fechaTurno = new Date(anio, mes - 1, dia, h, m, 0);
    const ahora = new Date();

    return fechaTurno >= ahora;
  };

  const procesarFecha = (fechaStr) => {
    if (!fechaStr) return { nombreDia: "-", fechaCorta: "-" };
    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    const fechaObj = new Date(anio, mes - 1, dia);

    const nombreDia = fechaObj.toLocaleDateString("es-AR", {
      weekday: "long",
    });
    const fechaCorta = `${String(dia).padStart(2, "0")}/${String(
      mes
    ).padStart(2, "0")}/${anio}`;

    return {
      nombreDia: nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1),
      fechaCorta,
    };
  };

  const formatearHora = (horaStr) => {
    if (!horaStr) return "-";
    const partes = horaStr.split(":"); // "14:00:00" -> ["14","00","00"]
    const [h, m] = partes;
    return `${h}:${m} hs`;
  };

  // ---------------------------
  // Cargar turnos del backend
  // ---------------------------
  const cargarTurnos = async () => {
    if (!usuario?.id) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/reservas/usuario/${usuario.id}`);
      if (!res.ok) {
        throw new Error("Error al obtener las reservas");
      }
      const data = await res.json();

      // Solo confirmadas y en el futuro
      const futurasConfirmadas = (data || [])
        .filter((t) => t.estado === "confirmada")
        .filter((t) => esFuturoOHoy(t.fecha, t.hora))
        .sort((a, b) => {
          if (a.fecha === b.fecha) return a.hora.localeCompare(b.hora);
          return a.fecha.localeCompare(b.fecha);
        });

      setTurnos(futurasConfirmadas);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar tus turnos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTurnos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  // ---------------------------
  // Cancelar turno (DELETE /reservas/{id})
  // ---------------------------
  const cancelarTurno = async (id) => {
    if (!window.confirm("¿Seguro que querés cancelar este turno?")) return;

    try {
      const res = await fetch(`${apiUrl}/reservas/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error al cancelar turno");
      }

      alert("Turno cancelado correctamente.");
      cargarTurnos();
    } catch (e) {
      console.error(e);
      alert("Error al cancelar el turno.");
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="p-4 pb-24 max-w-lg mx-auto text-slate-50">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Mis próximos turnos
      </h2>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Loader />
        </div>
      ) : turnos.length === 0 ? (
        <p className="text-center text-slate-400 mt-8">
          No tenés turnos confirmados próximos.
        </p>
      ) : (
        <div className="space-y-3">
          {turnos.map((t) => {
            const { nombreDia, fechaCorta } = procesarFecha(t.fecha);
            const horaFormateada = formatearHora(t.hora);

            return (
              <div
                key={t.id}
                className="flex items-stretch gap-3 bg-slate-950/80 border border-slate-800 rounded-3xl px-4 py-3 shadow-lg"
              >
                {/* Columna izquierda: hora + cancha en formato destacado */}
                <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 min-w-[84px]">
                  <span className="text-sm font-semibold text-slate-50">
                    {horaFormateada}
                  </span>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    Cancha {t.id_cancha}
                  </span>
                </div>

                {/* Columna derecha: fecha + estado + botón */}
                <div className="flex-1 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">
                      {nombreDia} · {fechaCorta}
                    </span>
                    <span className="mt-1 text-xs font-semibold text-emerald-400">
                      Estado: Confirmada
                    </span>
                  </div>

                  <button
                    onClick={() => cancelarTurno(t.id)}
                    className="ml-1 flex items-center justify-center p-2 rounded-full border border-slate-700 hover:border-red-500/60 hover:bg-red-500/10 transition-colors"
                    title="Cancelar turno"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
