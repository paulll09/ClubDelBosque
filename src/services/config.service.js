import httpClient from './httpClient';

const configService = {
    /**
     * Obtener configuración pública del club
     */
    async getConfig() {
        return httpClient.get('/config');
    }
};

export default configService;
