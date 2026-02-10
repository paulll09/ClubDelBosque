import httpClient from './httpClient';

const reservasService = {
    /**
     * Obtener reservas (disponibilidad)
     * @param {string} fecha YYYY-MM-DD
     * @param {string|number} idCancha 
     */
    async getReservas(fecha, idCancha) {
        return httpClient.get(`/reservas?fecha=${fecha}&id_cancha=${idCancha}`);
    },

    /**
     * Crear nueva reserva
     * @param {object} reservaData 
     */
    async crearReserva(reservaData) {
        return httpClient.post('/reservas', reservaData);
    },

    /**
     * Obtener reservas de un usuario
     * @param {string|number} usuarioId 
     */
    async getReservasUsuario(usuarioId) {
        return httpClient.get(`/reservas/usuario/${usuarioId}`);
    },

    /**
     * Confirmar reserva (pago manual/backend)
     * @param {string|number} idReserva 
     */
    async confirmarReserva(idReserva) {
        return httpClient.post(`/reservas/confirmar/${idReserva}`);
    },

    /**
     * Cancelar reserva
     * @param {string|number} idReserva 
     * @param {string} motivo 
     */
    async cancelarReserva(idReserva, motivo = 'cancelado_usuario') {
        return httpClient.post(`/reservas/cancelar/${idReserva}`, { motivo });
    },

    /**
     * Eliminar reserva (si aplica)
     * @param {string|number} idReserva 
     */
    async eliminarReserva(idReserva) {
        return httpClient.delete(`/reservas/${idReserva}`);
    }
};

export default reservasService;
