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

  // --- Helpers replicando la lógica actual de App.jsx ---

  const estaReservado = (hora) => {
    return reservas.some((r) => {
      const mismaHora = String(r.hora).slice(0, 5) === hora;

      if (!mismaHora) return false;

      // Confirmada → siempre bloquear
      if (r.estado === "confirmada") return true;

      // Pendiente → bloquear, a menos que esté vencida (depende de backend)
      if (r.estado === "pendiente") return true;

      // Cancelada o expirada → NO bloquear
      return false;
    });
  };


  const esHorarioPasado = (hora) => {
    return esHorarioPasadoHelper(fechaSeleccionada, hora);
  };

  /**
   * Verifica si una hora está bloqueada por torneo/cierre parcial.
   * Lógica copiada de App.jsx (adaptada a este hook).
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
