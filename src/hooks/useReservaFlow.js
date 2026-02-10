import { useState, useCallback, useEffect } from 'react';
import reservasService from '../services/reservas.service';
import bloqueosService from '../services/bloqueos.service';
import { getFechaHoy, esHorarioPasado as esHorarioPasadoHelper } from '../helpers/fecha';

/**
 * Hook to manage the booking flow logic
 */
export function useReservaFlow(fechaInicial = getFechaHoy(), canchaInicial = "1") {
    const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaInicial);
    const [canchaSeleccionada, setCanchaSeleccionada] = useState(canchaInicial);

    const [reservas, setReservas] = useState([]);
    const [bloqueos, setBloqueos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    // Load availability
    const cargarDisponibilidad = useCallback(async () => {
        if (!fechaSeleccionada || !canchaSeleccionada) return;

        setCargando(true);
        setError(null);

        try {
            const [dataReservas, dataBloqueos] = await Promise.all([
                reservasService.getReservas(fechaSeleccionada, canchaSeleccionada),
                bloqueosService.getBloqueos(fechaSeleccionada, canchaSeleccionada)
            ]);

            setReservas(Array.isArray(dataReservas) ? dataReservas : []);
            setBloqueos(Array.isArray(dataBloqueos) ? dataBloqueos : []);
        } catch (err) {
            console.error("Error cargando disponibilidad:", err);
            setError("No se pudo cargar la disponibilidad. Intenta nuevamente.");
            setReservas([]);
            setBloqueos([]);
        } finally {
            setCargando(false);
        }
    }, [fechaSeleccionada, canchaSeleccionada]);

    // Initial load and reload on change
    useEffect(() => {
        cargarDisponibilidad();
    }, [cargarDisponibilidad]);

    // Check if a slot is booked
    const estaReservado = useCallback((horaStr) => {
        if (!horaStr) return false;
        const horaNorm = horaStr.slice(0, 5); // HH:MM

        return reservas.some(r => {
            const horaReserva = (r.hora || '').slice(0, 5);
            // Only confirmed bookings block the slot
            return horaReserva === horaNorm && (r.estado || '').toLowerCase() === 'confirmada';
        });
    }, [reservas]);

    // Check if a slot is blocked
    const esBloqueado = useCallback((horaStr) => {
        if (!bloqueos.length || !horaStr) return false;

        // Helper to convert HH:MM to minutes
        const toMin = (h) => {
            const [HH, MM] = h.split(':').map(Number);
            return HH * 60 + MM;
        };

        const horaMin = toMin(horaStr);

        return bloqueos.some(b => {
            // Full day block
            if (!b.hora_desde && !b.hora_hasta) return true;

            const desde = toMin(b.hora_desde);
            const hasta = toMin(b.hora_hasta);

            return horaMin >= desde && horaMin < hasta;
        });
    }, [bloqueos]);

    // Check if slot is in the past
    const esPasado = useCallback((horaStr) => {
        return esHorarioPasadoHelper(fechaSeleccionada, horaStr);
    }, [fechaSeleccionada]);

    // Check availability for a duration (1 or 2 hours)
    const validarDisponibilidad = useCallback((horaInicio, duracionHoras, horariosDisponibles) => {
        if (!horariosDisponibles.includes(horaInicio)) return false;

        const idx = horariosDisponibles.indexOf(horaInicio);
        const slotsNecesarios = horariosDisponibles.slice(idx, idx + duracionHoras);

        if (slotsNecesarios.length !== duracionHoras) return false;

        return slotsNecesarios.every(h =>
            !estaReservado(h) && !esBloqueado(h) && !esPasado(h)
        );
    }, [estaReservado, esBloqueado, esPasado]);

    return {
        fechaSeleccionada,
        setFechaSeleccionada,
        canchaSeleccionada,
        setCanchaSeleccionada,
        reservas,
        bloqueos,
        cargando,
        error,
        recargar: cargarDisponibilidad,
        estaReservado,
        esBloqueado,
        esPasado,
        validarDisponibilidad
    };
}
