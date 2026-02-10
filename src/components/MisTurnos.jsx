// src/components/MisTurnos.jsx
import React, { useEffect, useState } from "react";
import Loader from "./Loader";
import ModalConfirmacion from "./ModalConfirmacion";
import MisTurnosSkeleton from "./MisTurnosSkeleton";

import {
  CalendarDays,
  Clock,
  BadgeCheck,
  Hourglass,
  CreditCard,
  XCircle,
  Receipt,
} from "lucide-react";

/**
 * MisTurnos (PRO)
 * - Trae /reservas/usuario/:id
 * - Agrupa por grupo_id (2h) para mostrar 1 card
 * - Muestra confirmadas y pendientes futuras
 * - Iconos lucide-react
 * - Responsive
 * - SIN teléfono
 * - Botón Cancelar al final de la tarjeta
 */
import reservasService from "../services/reservas.service";
import { useToast } from "../context/ToastContext";

/**
 * MisTurnos (PRO)
 */
export default function MisTurnos({ usuario }) { // Removed apiUrl, mostrarToast props
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCancel, setModalCancel] = useState(null);
  const { mostrarToast } = useToast();
  const normalizarHora = (horaStr) => {
    if (!horaStr) return "00:00";
    const partes = String(horaStr).split(":");
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

  const esFuturoOHoy = (fechaStr, horaStr) => {
    if (!fechaStr) return false;
    const [anio, mes, dia] = String(fechaStr).split("-").map(Number);
    const [h, m] = String(horaStr || "00:00").split(":").map(Number);
    const fechaTurno = new Date(
      anio,
      (mes || 1) - 1,
      dia || 1,
      h || 0,
      m || 0,
      0
    );
    return fechaTurno >= new Date();
  };

  const procesarFecha = (fechaStr) => {
    if (!fechaStr) return { diaSemana: "", dia: "", mes: "", anio: "" };

    const [anio, mes, dia] = String(fechaStr).split("-").map(Number);
    const date = new Date(anio, (mes || 1) - 1, dia || 1);

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
      mes: meses[(mes || 1) - 1],
      anio: String(anio),
    };
  };

  const money = (n) => {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return null;
    return Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 });
  };

  const pickFirst = (obj, keys) => {
    for (const k of keys) {
      if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "")
        return obj[k];
    }
    return null;
  };

  // -------------------------
  // Cargar turnos
  // -------------------------
  const cargarTurnos = async () => {
    if (!usuario?.id) return;

    setLoading(true);
    try {
      // Use service
      const data = await reservasService.getReservasUsuario(usuario.id);

      const filas = (data || [])
        .map((t) => {
          const estadoNorm = String(t.estado || "").trim().toLowerCase();
          const mpNorm = String(t.mp_status || "").trim().toLowerCase();

          const esConfirmada = estadoNorm === "confirmada" || mpNorm.includes("approved");
          const esPendiente = estadoNorm === "pendiente" || mpNorm.includes("pending");

          return {
            ...t,
            __estadoNorm: estadoNorm,
            __mpNorm: mpNorm,
            __esConfirmada: esConfirmada,
            __esPendiente: esPendiente,
            __horaHHMM: normalizarHora(t.hora),
          };
        })
        .filter((t) => esFuturoOHoy(t.fecha, t.__horaHHMM))
        .filter((t) => t.__esConfirmada || t.__esPendiente);

      // Agrupar por grupo_id
      const grupos = new Map();
      for (const t of filas) {
        const key = t.grupo_id ? `g-${t.grupo_id}` : `i-${t.id}`;
        if (!grupos.has(key)) grupos.set(key, []);
        grupos.get(key).push(t);
      }

      const agrupados = Array.from(grupos.values()).map((items) => {
        items.sort((a, b) => a.__horaHHMM.localeCompare(b.__horaHHMM));

        const primero = items[0];
        const ultimo = items[items.length - 1];

        const horaDesde = primero.__horaHHMM;
        const horaHasta =
          items.length > 1 ? sumarHoras(ultimo.__horaHHMM, 1) : null;

        const grupoConfirmado = items.some((x) => x.__esConfirmada);
        const estadoGrupo = grupoConfirmado ? "confirmada" : "pendiente";

        const initPoint =
          pickFirst(primero, ["init_point"]) ||
          pickFirst(ultimo, ["init_point"]) ||
          null;

        const totalGrupo = pickFirst(primero, ["total_grupo", "total", "precio_total"]);
        const seniaPagada = pickFirst(primero, ["senia_pagada", "monto_senia", "senia"]);
        const saldoGrupo = pickFirst(primero, ["saldo_grupo", "saldo", "saldo_a_cobrar"]);

        return {
          key: primero.grupo_id ? `g-${primero.grupo_id}` : `i-${primero.id}`,
          idPrincipal: primero.id,
          grupo_id: primero.grupo_id || null,
          id_cancha: primero.id_cancha,
          fecha: primero.fecha,
          nombre_cliente: primero.nombre_cliente,
          estado: estadoGrupo,
          hora_desde: horaDesde,
          hora_hasta: horaHasta,
          cantidad_hs: items.length,
          init_point: initPoint,
          total_grupo: totalGrupo,
          senia_pagada: seniaPagada,
          saldo_grupo: saldoGrupo,
        };
      });

      agrupados.sort((a, b) => {
        if (a.fecha === b.fecha) return a.hora_desde.localeCompare(b.hora_desde);
        return a.fecha.localeCompare(b.fecha);
      });

      setTurnos(agrupados);
    } catch (e) {
      console.error(e);
      mostrarToast?.("No se pudieron cargar tus turnos.", "error");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  useEffect(() => {
    if (usuario?.id) {
      cargarTurnos();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id]);

  // -------------------------
  // Acciones
  // -------------------------
  const abrirModalCancelacion = (t) => {
    const rango =
      t.cantidad_hs > 1 && t.hora_hasta
        ? `${t.hora_desde} a ${t.hora_hasta}`
        : `${t.hora_desde}`;

    setModalCancel({
      id: t.idPrincipal,
      titulo: "Cancelar turno",
      mensaje: `¿Querés cancelar tu turno de la Cancha ${t.id_cancha} el ${t.fecha} (${rango})?`,
    });
  };

  const ejecutarCancelacion = async () => {
    if (!modalCancel?.id) return;

    try {
      await reservasService.cancelarReserva(modalCancel.id);

      mostrarToast?.("Turno cancelado correctamente.", "success");
      setModalCancel(null);
      cargarTurnos();
    } catch (e) {
      console.error(e);
      mostrarToast?.("No se pudo cancelar el turno.", "error");
    }
  };

  const abrirPago = (initPoint) => {
    if (!initPoint) {
      mostrarToast?.("No se encontró el link de pago.", "error");
      return;
    }
    window.open(initPoint, "_blank", "noopener,noreferrer");
  };

  // -------------------------
  // UI helpers
  // -------------------------
  const badge = (estado) => {
    const isOk = estado === "confirmada";
    return (
      <span
        className={[
          "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase",
          isOk
            ? "bg-emerald-900/20 text-emerald-300 border-emerald-500/20"
            : "bg-amber-900/20 text-amber-300 border-amber-500/20",
        ].join(" ")}
      >
        {isOk ? <BadgeCheck size={12} /> : <Hourglass size={12} />}
        {isOk ? "Confirmada" : "Pendiente"}
      </span>
    );
  };

  const resumenPagoDisponible = (t) =>
    t.total_grupo !== null && t.senia_pagada !== null && t.saldo_grupo !== null;

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="w-full">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-white">Mis turnos</h2>
        <p className="text-xs text-slate-400">
          Acá vas a ver tus reservas futuras (confirmadas y pendientes).
        </p>
      </div>

      {loading ? (
        <MisTurnosSkeleton items={3} />
      ) : turnos.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-300 font-semibold">
            No tenés turnos futuros.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Cuando reserves, te van a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {turnos.map((t) => {
            const f = procesarFecha(t.fecha);
            const rango =
              t.cantidad_hs > 1 && t.hora_hasta
                ? `${t.hora_desde} a ${t.hora_hasta}`
                : `${t.hora_desde}`;

            const pagoOk = resumenPagoDisponible(t);

            return (
              <div
                key={t.key}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {badge(t.estado)}
                      {t.cantidad_hs > 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase bg-indigo-900/20 text-indigo-300 border-indigo-500/20">
                          <Clock size={12} />
                          {t.cantidad_hs} horas
                        </span>
                      )}
                    </div>

                    <p className="text-base font-bold text-white">Cancha {t.id_cancha}</p>

                    {/* Fecha + Horario MÁS GRANDES EN CELULAR */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-2 text-sm sm:text-xs text-slate-200">
                        <CalendarDays size={18} className="text-slate-300" />
                        <span className="font-semibold">
                          {f.diaSemana} {f.dia} {f.mes} {f.anio}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm sm:text-xs text-slate-200">
                        <Clock size={18} className="text-slate-300" />
                        <span className="font-semibold">{rango} hs</span>
                      </div>
                    </div>
                  </div>

                  {/* Solo botón de pagar arriba si está pendiente */}
                  <div className="flex flex-row sm:flex-col gap-2 sm:min-w-[160px]">
                    {t.estado === "pendiente" && (
                      <button
                        onClick={() => abrirPago(t.init_point)}
                        className="w-full inline-flex items-center justify-center gap-2 text-[12px] px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
                      >
                        <CreditCard size={16} />
                        Pagar seña
                      </button>
                    )}
                  </div>
                </div>

                {/* Pago (si backend lo devuelve) */}
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-2">
                    <Receipt size={16} className="text-slate-400" />
                    Detalle de pago
                  </div>

                  {pagoOk ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400">Total</p>
                        <p className="text-sm font-bold text-white">
                          ${money(t.total_grupo)}
                        </p>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400">Seña pagada</p>
                        <p className="text-sm font-bold text-emerald-300">
                          ${money(t.senia_pagada)}
                        </p>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400">Saldo a cobrar</p>
                        <p className="text-sm font-bold text-amber-300">
                          ${money(t.saldo_grupo)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      (Opcional PRO) Cuando el backend devuelva{" "}
                      <span className="text-slate-300">total_grupo</span>,{" "}
                      <span className="text-slate-300">senia_pagada</span> y{" "}
                      <span className="text-slate-300">saldo_grupo</span>, acá se
                      van a mostrar automáticamente.
                    </p>
                  )}
                </div>

                {/* Botón Cancelar al FINAL */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => abrirModalCancelacion(t)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-[12px] px-4 py-2 rounded-xl bg-red-900/20 hover:bg-red-900/35 text-red-300 border border-red-500/30 font-semibold transition-colors"
                  >
                    <XCircle size={16} />
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal confirmación cancelación */}
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
