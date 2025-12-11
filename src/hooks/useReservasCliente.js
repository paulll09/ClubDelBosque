// src/hooks/useReservasCliente.js
import { useCallback, useEffect, useState } from "react";
import { obtenerReservasYBloqueos } from "../services/apiReservas";
import {
  getFechaHoy,
  esHorarioPasado as esHorarioPasadoHelper,
} from "../helpers/fecha";

/**
 * Hook: useReservasCliente
 *
 * - Carga reservas y bloqueos para la fecha y cancha seleccionadas.
 * - Expone:
 *    - reservas, bloqueos
 *    - cargandoReservas
 *    - recargarReservas()
 *    - estaReservado(hora)
 *    - esHorarioPasado(hora)
 *    - esBloqueado(hora)
 *
 * Se asume que el backend devuelve:
 *  reservas: [
 *    { hora: 'HH:MM:SS', estado: 'pendiente|confirmada|cancelada', ... }
 *  ]
 *  bloqueos: [
 *    { tipo, hora_desde, hora_hasta, ... } o bloqueos de día completo
 *  ]
 */
export function useReservasCliente(apiUrl, fechaSeleccionada, canchaSeleccionada) {
  const [reservas, setReservas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(false);

  /**
   * Carga reservas y bloqueos desde el backend.
   */
  const recargarReservas = useCallback(
    async (opts = {}) => {
      const { fecha: fechaOverride, idCancha: canchaOverride } = opts;

      const fecha = fechaOverride || fechaSeleccionada || getFechaHoy();
      const idCancha = canchaOverride || canchaSeleccionada;

      if (!fecha || !idCancha) {
        setReservas([]);
        setBloqueos([]);
        return;
      }

      setCargandoReservas(true);

      try {
        const { reservas: r, bloqueos: b } = await obtenerReservasYBloqueos({
          fecha,
          idCancha,
          apiUrl,
        });

        setReservas(Array.isArray(r) ? r : []);
        setBloqueos(Array.isArray(b) ? b : []);

        // Útil para debug si querés ver qué trae el back:
        // console.log("Reservas recibidas:", r);
        // console.log("Bloqueos recibidos:", b);
      } catch (error) {
        console.error("Error cargando reservas/bloqueos:", error);
        setReservas([]);
        setBloqueos([]);
      } finally {
        setCargandoReservas(false);
      }
    },
    [apiUrl, fechaSeleccionada, canchaSeleccionada]
  );

  /**
   * Carga inicial y recarga cuando cambia fecha/cancha.
   */
  useEffect(() => {
    recargarReservas();
  }, [recargarReservas]);

  /**
   * Indica si un horario está reservado.
   *
   * Regla actual:
   *  - SOLO se considera reservado si el estado es 'confirmada'.
   *  - Así, una vez que el pago se aprueba y el back cambia a confirmada,
   *    ese horario queda bloqueado para todos los usuarios.
   */
  const estaReservado = (horaSeleccionada) => {
    if (!horaSeleccionada) return false;

    const horaNorm = String(horaSeleccionada).slice(0, 5); // 'HH:MM'

    return reservas.some((r) => {
      if (!r || !r.hora) return false;

      const horaReserva = String(r.hora).slice(0, 5);
      if (horaReserva !== horaNorm) return false;

      const estado = (r.estado || "").toLowerCase();
      return estado === "confirmada";
    });
  };

  /**
   * Wrapper que delega en el helper global de fechas.
   */
  const esHorarioPasado = (hora) => {
    if (!fechaSeleccionada || !hora) return false;
    return esHorarioPasadoHelper(fechaSeleccionada, hora);
  };

  /**
   * Indica si un horario está bloqueado por configuración.
   *
   * Soporta:
   *  - bloqueos de día completo (tipo 'dia_completo' o campo dia_completo = 1)
   *  - bloqueos por rango [hora_desde, hora_hasta]
   */
// ¿Este horario está bloqueado por algún torneo/cierre/etc?
const esBloqueado = (horaStr) => {
  if (!bloqueos || bloqueos.length === 0) return false;
  if (!fechaSeleccionada) return false;

  const horaClienteMin = horaStrToMinutes(horaStr);

  // Helper para convertir "HH:MM" o "HH:MM:SS" a minutos
  const parseHoraToMinutes = (h) => {
    if (!h) return null;
    const partes = h.split(":").map(Number);
    const HH = partes[0] ?? 0;
    const MM = partes[1] ?? 0;
    return HH * 60 + MM;
  };

  const parseFecha = (f) => new Date(`${f}T00:00:00`);

  return bloqueos.some((b) => {
    // Filtro por rango de fecha del bloqueo
    const fechaDesde = b.fecha_desde ? parseFecha(b.fecha_desde) : null;
    const fechaHasta = b.fecha_hasta ? parseFecha(b.fecha_hasta) : null;
    const fechaSel = parseFecha(fechaSeleccionada);

    if (fechaDesde && fechaSel < fechaDesde) return false;
    if (fechaHasta && fechaSel > fechaHasta) return false;

    // -------- CASO: BLOQUEO DE DÍA COMPLETO --------
    // Si no hay horas, es bloqueo de todo el día.
    if (!b.hora_desde && !b.hora_hasta) {
      return true;
    }

    
    // 00:00:00 a 23:59:59 (o 23:59)
    const desdeMin = parseHoraToMinutes(b.hora_desde);
    const hastaMin = parseHoraToMinutes(b.hora_hasta);

    if (
      (desdeMin === 0 || desdeMin === null) &&
      (hastaMin === 24 * 60 - 1 || hastaMin === 24 * 60 || hastaMin === null)
    ) {
      // Cubre todo el día
      return true;
    }

    // -------- CASO: BLOQUEO PARCIAL --------
    if (desdeMin !== null && hastaMin !== null) {
      // Rango clásico dentro del mismo día
      return horaClienteMin >= desdeMin && horaClienteMin < hastaMin;
    }

    
    return false;
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
