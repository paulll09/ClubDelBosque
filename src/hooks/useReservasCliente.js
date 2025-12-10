// src/hooks/useReservasCliente.js
import { useCallback, useEffect, useState } from "react";
import { obtenerReservasYBloqueos } from "../services/apiReservas";
import { esHorarioPasado as esHorarioPasadoHelper } from "../helpers/fecha";

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
        await obtenerReservasYBloqueos({
          apiUrl,
          fecha: fechaSeleccionada,
          idCancha: canchaSeleccionada,
        });

      setReservas(resApi || []);
      setBloqueos(bloqApi || []);
    } catch (error) {
      console.error("Error cargando reservas/bloqueos:", error);
      setReservas([]);
      setBloqueos([]);
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
    cargarReservasYBloqueos();
  }, [cargarReservasYBloqueos]);

  /**
   * Verifica si una hora está reservada para el usuario actual:
   *  - 'confirmada' bloquea siempre.
   *  - 'pendiente' bloquea para otros usuarios, pero no para el mismo usuario
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
          // Si es la reserva pendiente del mismo usuario, no bloquea visualmente
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
   * Verifica si una hora está bloqueada por torneo/cierre parcial o total.
   *
   * Casos:
   *  - Bloqueo de día completo: hora_desde y hora_hasta vienen null → bloquea todo el día.
   *  - Bloqueo parcial: se evalúa el rango hora_desde/hora_hasta.
   *  - Datos incompletos: por seguridad, se ignora ese bloqueo (no rompe el front).
   */
  const esBloqueado = (hora) => {
    if (!bloqueos || bloqueos.length === 0) return false;
    if (!hora) return false;

    const [h, m] = hora.split(":").map(Number);
    const minutosHora = h * 60 + m;

    return bloqueos.some((b) => {
      const desde = b.hora_desde;
      const hasta = b.hora_hasta;

      // Bloqueo de día completo → bloquea todas las horas de ese día
      if ((!desde || desde === "") && (!hasta || hasta === "")) {
        return true;
      }

      // Datos incompletos → no bloquea nada para no romper la lógica
      if (!desde || !hasta) {
        return false;
      }

      const [hDesde, mDesde] = String(desde).split(":").map(Number);
      const [hHasta, mHasta] = String(hasta).split(":").map(Number);

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
