import { useEffect } from 'react';
import reservasService from '../services/reservas.service';

/**
 * Hook to handle Mercado Pago return flow
 * @param {Function} mostrarToast - Function to show notifications
 * @param {Function} onPaymentProcessed - Callback to refresh bookings
 */
export function usePaymentFlow(mostrarToast, onPaymentProcessed) {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const estado = params.get("estado");
        const idReserva = params.get("id_reserva");

        if (!idReserva) return;

        const procesarPago = async () => {
            // Cleanup URL params immediately to avoid double processing
            window.history.replaceState({}, document.title, "/");

            if (estado === "exito") {
                try {
                    await reservasService.confirmarReserva(idReserva);
                    mostrarToast("¡Pago exitoso! Tu reserva quedó confirmada.", "success");
                } catch (err) {
                    console.error("Error confirmando pago:", err);
                    mostrarToast("Hubo un problema confirmando el pago. Contactanos.", "error");
                }
            } else if (["failure", "error", "pending"].includes(estado)) {
                try {
                    // Si falla, liberamos el turno (cancelamos reserva)
                    await reservasService.cancelarReserva(idReserva, "fallo_pago");
                    mostrarToast("El pago no se completó. El turno fue liberado.", "warning");
                } catch (err) {
                    console.error("Error cancelando reserva tras fallo:", err);
                }
            }

            // Always reload bookings
            if (onPaymentProcessed) {
                onPaymentProcessed();
            }
        };

        procesarPago();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount
}
