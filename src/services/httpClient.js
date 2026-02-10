import { API_URL } from '../config';

/**
 * Custom Error class for API response errors
 */
export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Base HTTP client for API requests
 */
const httpClient = {
    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;

        // Default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new ApiError(
                    data.message || 'Ocurrió un error en la solicitud',
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            // Network errors or other fetch issues
            throw new ApiError(error.message, 0, null);
        }
    },

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    },
};

export default httpClient;
