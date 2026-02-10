import httpClient from './httpClient';

const bloqueosService = {
    /**
     * Obtener bloqueos de disponibilidad
     * @param {string} fecha YYYY-MM-DD
     * @param {string|number} idCancha 
     */
    async getBloqueos(fecha, idCancha) {
        return httpClient.get(`/bloqueos-disponibilidad?fecha=${fecha}&id_cancha=${idCancha}`);
    }
};

export default bloqueosService;
