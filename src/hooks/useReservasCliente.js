// src/hooks/useReservasCliente.js
import { useCallback, useEffect, useState } from "react";
import { obtenerReservasYBloqueos } from "../services/apiReservas";
import { getFechaHoy, esHorarioPasado as esHorarioPasadoHelper } from "../helpers/fecha";

/**
 * Hook: useReservasCliente
 *
 * Responsabilidad:
 *  - Cargar reservas y bloqueos para la fecha y cancha seleccionadas.
 *  - Exponer helpers:
 *      - estaReservado(hora)
 *      - esHorarioPasado(hora)
 *      - esBloqueado(hora)
 *  - Volver a cargar automáticamente cuando cambian fecha o cancha.
 *
 * Devuelve:
 *  - reservas: array de reservas del backend.
 *  - bloqueos: array de bloqueos.
 *  - cargandoReservas: boolean de carga.
 *  - recargarReservas: función manual para refrescar.
 *  - estaReservado, esHorarioPasado, esBloqueado: helpers de estado.
 */
export function useReservasCliente(apiUrl, fechaSeleccionada, canchaSeleccionada) {
  const [reservas, setReservas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(false);

  // Carga reservas + bloqueos desde el backend
  const recargarReservas = useCallback(async () => {
    if (!canchaSeleccionada) return;

    const fecha = fechaSeleccionada || getFechaHoy();

    setCargandoReservas(true);
    try {
      const { reservas: r, bloqueos: b } = await obtenerReservasYBloqueos({
        fecha,
        idCancha: canchaSeleccionada,
        apiUrl,
      });

      setReservas(r);
      setBloqueos(b);
    } catch (error) {
      console.error("Error al cargar reservas/bloqueos:", error);
    } finally {
      setCargandoReservas(false);
    }
  }, [apiUrl, fechaSeleccionada, canchaSeleccionada]);

  useEffect(() => {
    recargarReservas();
  }, [recargarReservas]);

  // --- Helpers ---

  // Normaliza cualquier string de hora a "HH:MM" (ej: "15:00:00" → "15:00", "15:00 hs" → "15:00")
  const normalizarHora = (h) => String(h).slice(0, 5);

  /**
   * Devuelve true si la hora está reservada (pendiente o confirmada) por
   * cualquier usuario. Estados cancelada/expirada NO bloquean.
   */
  const estaReservado = (horaSeleccionada) => {
    const horaNorm = normalizarHora(horaSeleccionada);

    return reservas.some((r) => {
      const horaReserva = normalizarHora(r.hora);
      if (horaReserva !== horaNorm) return false;

      const estado = String(r.estado || "").toLowerCase();

      if (estado === "confirmada") return true; // siempre bloquea
      if (estado === "pendiente") return true;  // también bloquea visualmente

      // expirada / cancelada / otro → no bloquea
      return false;
    });
  };

  const esHorarioPasado = (hora) => {
    return esHorarioPasadoHelper(fechaSeleccionada, hora);
  };

  /**
   * Verifica si una hora está bloqueada por torneo/cierre parcial.
   */
  const esBloqueado = (hora) => {
    if (!fechaSeleccionada) return false;
    if (!bloqueos || bloqueos.length === 0) return false;

    // hora en minutos (ej: "18:00" → 1080)
    const [h, m] = hora.split(":").map(Number);
    const minutosHora = h * 60 + m;

    return bloqueos.some((b) => {
      // Si no hay horas => bloqueo todo el día
      if (!b.hora_desde && !b.hora_hasta) {
        return true;
      }

      let desdeMin = 0;
      let hastaMin = 24 * 60;

      if (b.hora_desde) {
        const [dh, dm] = b.hora_desde.split(":").map(Number);
        desdeMin = dh * 60 + dm;
      }

      if (b.hora_hasta) {
        const [hh, hm] = b.hora_hasta.split(":").map(Number);
        hastaMin = hh * 60 + hm;
      }

      return minutosHora >= desdeMin && minutosHora <= hastaMin;
    });
  };

  return {
    reservas,
    bloqueos,
    cargandoReservas,
    recargarReservas,
    estaReservado,
    esHorarioPasado,
    esBloqueado,
  };
}

