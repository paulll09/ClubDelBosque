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
 * Responsabilidad:
 *  - Cargar reservas y bloqueos para la fecha y cancha seleccionadas.
 *  - Exponer helpers:
 *      - estaReservado(hora)
 *      - esHorarioPasado(hora)
 *      - esBloqueado(hora)
 *  - Volver a cargar automáticamente cuando cambian fecha o cancha.
 */
export function useReservasCliente(
  apiUrl,
  fechaSeleccionada,
  canchaSeleccionada,
  usuarioActual // puede ser null si no hay login
) {
  const [reservas, setReservas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(false);

  const usuarioActualId =
    usuarioActual && usuarioActual.id ? Number(usuarioActual.id) : null;

  /**
   * Carga reservas y bloqueos desde el backend.
   */
  const cargarReservasYBloqueos = useCallback(async () => {
    if (!fechaSeleccionada || !canchaSeleccionada) {
      // Si por algún motivo llegan undefined, dejamos todo vacío
      console.warn(
        "useReservasCliente: fechaSeleccionada o canchaSeleccionada indefinidos",
        { fechaSeleccionada, canchaSeleccionada }
      );
      setReservas([]);
      setBloqueos([]);
      return;
    }

    try {
      setCargandoReservas(true);

      const { reservas: resApi, bloqueos: bloqApi } =
        await obtenerReservasYBloqueos(apiUrl, fechaSeleccionada, canchaSeleccionada);

      setReservas(resApi || []);
      setBloqueos(bloqApi || []);
    } catch (error) {
      console.error("Error cargando reservas/bloqueos:", error);
    } finally {
      setCargandoReservas(false);
    }
  }, [apiUrl, fechaSeleccionada, canchaSeleccionada]);


  /**
   * Recarga manual, por ejemplo luego de cancelar o crear reserva.
   */
  const recargarReservas = useCallback(() => {
    cargarReservasYBloqueos();
  }, [cargarReservasYBloqueos]);

  /**
   * Efecto: carga inicial y cada vez que cambian fecha o cancha.
   */
  useEffect(() => {
    if (!fechaSeleccionada || !canchaSeleccionada) {
      console.warn("No se cargan reservas porque falta fecha o cancha.");
      return;
    }

    cargarReservas();
  }, [fecha, canchaId]);

  /**
   * Verifica si una hora está reservada para el usuario actual:
   *  - 'confirmada' bloquea siempre.
   *  - 'pendiente' bloquea para otros usuarios, pero NO para el mismo usuario
   *    (para que pueda reintentar pagar la seña).
   */
  const estaReservado = (horaSeleccionada) => {
    if (!horaSeleccionada) return false;

    const horaNorm = String(horaSeleccionada).slice(0, 5); // "HH:MM"

    return reservas.some((r) => {
      const horaReserva = String(r.hora).slice(0, 5);
      if (horaReserva !== horaNorm) return false;

      const estado = r.estado;
      const reservaUsuarioId = r.usuario_id ? Number(r.usuario_id) : null;

      switch (estado) {
        case "confirmada":
          // Siempre bloquea para todos
          return true;

        case "pendiente":
          // Si es la reserva pendiente del mismo usuario, NO bloquea visualmente
          if (
            usuarioActualId !== null &&
            reservaUsuarioId !== null &&
            reservaUsuarioId === usuarioActualId
          ) {
            return false;
          }
          // Para otros usuarios sí bloquea
          return true;

        case "expirada":
        case "cancelada":
        default:
          return false;
      }
    });
  };

  /**
   * Envuelve el helper global para comprobar si un horario ya pasó.
   */
  const esHorarioPasado = (hora) => {
    return esHorarioPasadoHelper(fechaSeleccionada, hora);
  };

  /**
   * Verifica si una hora está bloqueada por torneo/cierre parcial.
   */
  const esBloqueado = (hora) => {
    if (!bloqueos || bloqueos.length === 0) return false;
    if (!hora) return false;

    const [h, m] = hora.split(":").map(Number);
    const minutosHora = h * 60 + m;

    return bloqueos.some((b) => {
      const [hDesde, mDesde] = b.hora_desde.split(":").map(Number);
      const [hHasta, mHasta] = b.hora_hasta.split(":").map(Number);

      const desdeMin = hDesde * 60 + mDesde;
      const hastaMin = hHasta * 60 + mHasta;

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
