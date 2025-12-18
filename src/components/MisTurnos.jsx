// src/components/MisTurnos.jsx
import React, { useEffect, useState } from "react";
import Loader from "./Loader";
import ModalConfirmacion from "./ModalConfirmacion";

/**
 * Componente MisTurnos
 * Muestra las reservas confirmadas del usuario y permite cancelarlas.
 *
 * Soporta "grupos" (grupo_id) para reservas de 2 horas:
 * - Si varias filas comparten grupo_id, se agrupan en una sola tarjeta.
 */
export default function MisTurnos({ usuario, apiUrl, mostrarToast }) {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCancel, setModalCancel] = useState(null);

  // -----------------------------------
  // Helpers de fecha y hora
  // -----------------------------------
  const esFuturoOHoy = (fechaStr, horaStr) => {
    if (!fechaStr) return false;

    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    const [h, m] = (horaStr || "00:00").split(":").map(Number);

    const fechaTurno = new Date(anio, mes - 1, dia, h, m, 0);
    const ahora = new Date();

    return fechaTurno >= ahora;
  };

  const procesarFecha = (fechaStr) => {
    if (!fechaStr)
      return { diaSemana: "", dia: "", mes: "", anio: "" };

    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    const date = new Date(anio, mes - 1, dia);

    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    return {
      diaSemana: dias[date.getDay()],
      dia: String(dia).padStart(2, "0"),
      mes: meses[mes - 1],
      anio: String(anio),
    };
  };

  const normalizarHora = (horaStr) => {
    if (!horaStr) return "00:00";
    // "18:00:00" -> "18:00"
    const partes = horaStr.split(":");
    return `${partes[0] || "00"}:${partes[1] || "00"}`;
  };

  const sumarHoras = (horaHHMM, horas) => {
    const [h, m] = (horaHHMM || "00:00").split(":").map(Number);
    const d = new Date(2000, 0, 1, h || 0, m || 0, 0);
    d.setHours(d.getHours() + (horas || 0));
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  // -----------------------------------
  // Cargar turnos
  // -----------------------------------
  const cargarTurnos = async () => {
    if (!usuario?.id) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/reservas/usuario/${usuario.id}`);
      if (!res.ok) throw new Error("Error al obtener las reservas");

      const data = await res.json();

      // 1) Normalizar estado y quedarnos con confirmadas (robusto)
      const confirmadas = (data || [])
        .map((t) => {
          const estadoNorm = String(t.estado || "")
            .trim()
            .toLowerCase();
          const mpNorm = String(t.mp_status || "")
            .trim()
            .toLowerCase();

          const esConfirmada =
            estadoNorm === "confirmada" || mpNorm === "approved";

          return {
            ...t,
            __estadoNorm: estadoNorm,
            __mpNorm: mpNorm,
            __esConfirmada: esConfirmada,
            __horaHHMM: normalizarHora(t.hora),
          };
        })
        .filter((t) => t.__esConfirmada)
        .filter((t) => esFuturoOHoy(t.fecha, t.__horaHHMM));

      // 2) Agrupar por grupo_id (si existe) para que 2h aparezca como 1 tarjeta
      const grupos = new Map();

      for (const t of confirmadas) {
        const key = t.grupo_id ? `g-${t.grupo_id}` : `i-${t.id}`;
        if (!grupos.has(key)) grupos.set(key, []);
        grupos.get(key).push(t);
      }

      const agrupados = Array.from(grupos.values()).map((items) => {
        items.sort((a, b) => a.__horaHHMM.localeCompare(b.__horaHHMM));

        const primero = items[0];
        const ultimo = items[items.length - 1];

        const horaDesde = primero.__horaHHMM;
        const horaHasta = sumarHoras(ultimo.__horaHHMM, 1); // asumiendo turnos de 1h por fila

        return {
          idPrincipal: primero.id, // para cancelar (tu backend ya maneja grupo_id en cancelar si existe)
          grupo_id: primero.grupo_id || null,
          id_cancha: primero.id_cancha,
          fecha: primero.fecha,
          nombre_cliente: primero.nombre_cliente,
          telefono_cliente: primero.telefono_cliente,
          estado: "confirmada",
          mp_status: "approved",
          hora_desde: horaDesde,
          hora_hasta: items.length > 1 ? horaHasta : null,
          horas: items.map((x) => x.__horaHHMM),
          cantidad_hs: items.length,
        };
      });

      // 3) Ordenar por fecha y hora
      agrupados.sort((a, b) => {
        if (a.fecha === b.fecha) {
          return a.hora_desde.localeCompare(b.hora_desde);
        }
        return a.fecha.localeCompare(b.fecha);
      });

      setTurnos(agrupados);
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
  }, [usuario?.id]);

  // -----------------------------------
  // Cancelación
  // -----------------------------------
  const abrirModalCancelacion = (t) => {
    const rango =
      t.cantidad_hs > 1 && t.hora_hasta
        ? `${t.hora_desde} a ${t.hora_hasta}`
        : `${t.hora_desde}`;

    setModalCancel({
      id: t.idPrincipal,
      titulo: "Cancelar turno",
      mensaje: `¿Querés cancelar tu turno de la Cancha ${t.id_cancha} el ${t.fecha} (${rango} hs)?`,
    });
  };

  const ejecutarCancelacion = async () => {
    if (!modalCancel?.id) return;

    try {
      const res = await fetch(`${apiUrl}/reservas/cancelar/${modalCancel.id}`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        mostrarToast?.(data.message || "No se pudo cancelar.", "error");
        return;
      }

      mostrarToast?.("Turno cancelado correctamente.", "success");
      setModalCancel(null);
      cargarTurnos();
    } catch (e) {
      console.error(e);
      mostrarToast?.("Error de conexión al cancelar.", "error");
    }
  };

  // -----------------------------------
  // Render
  // -----------------------------------
  return (
    <div className="w-full">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-white">Mis turnos</h2>
        <p className="text-xs text-slate-400">
          Acá vas a ver tus reservas confirmadas.
        </p>
      </div>

      {loading ? (
        <div className="py-10">
          <Loader />
        </div>
      ) : turnos.length === 0 ? (
        <p className="text-sm text-center text-slate-400 mt-8">
          No tenés turnos confirmados.
        </p>
      ) : (
        <div className="space-y-3">
          {turnos.map((t) => {
            const f = procesarFecha(t.fecha);
            const rango =
              t.cantidad_hs > 1 && t.hora_hasta
                ? `${t.hora_desde} a ${t.hora_hasta}`
                : `${t.hora_desde}`;

            return (
              <div
                key={t.grupo_id ? `g-${t.grupo_id}` : `i-${t.idPrincipal}`}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-400">
                      {f.diaSemana} {f.dia} {f.mes} {f.anio}
                    </p>
                    <p className="text-base font-bold text-white">
                      Cancha {t.id_cancha} · {rango} hs
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/20 text-emerald-300 border border-emerald-500/20 font-semibold uppercase">
                        Confirmada
                      </span>
                      {t.cantidad_hs > 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/20 text-indigo-300 border border-indigo-500/20 font-semibold uppercase">
                          {t.cantidad_hs} horas
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => abrirModalCancelacion(t)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      {modalCancel && (
        <ModalConfirmacion
          titulo={modalCancel.titulo}
          mensaje={modalCancel.mensaje}
          onConfirm={ejecutarCancelacion}
          onCancel={() => setModalCancel(null)}
        />
      )}
    </div>
  );
}
