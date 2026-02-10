import httpClient from './httpClient';

const authService = {
    /**
     * Login cliente
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        return httpClient.post('/cliente/login', { email, password });
    },

    /**
     * Registro cliente
     * @param {object} userData { nombre_cliente, telefono_cliente, email, password }
     */
    async registro(userData) {
        return httpClient.post('/cliente/registro', userData);
    },

    /**
     * Solicitar recuperación de contraseña
     * @param {string} email 
     */
    async forgotPassword(email) {
        return httpClient.post('/cliente/forgot-password', { email });
    },

    /**
     * Restablecer contraseña con token
     * @param {string} email 
     * @param {string} token 
     * @param {string} password 
     */
    async resetPassword(email, token, password) {
        return httpClient.post('/cliente/reset-password', { email, token, password });
    }
};

export default authService;
