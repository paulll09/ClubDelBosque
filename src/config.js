// Configuración de la API
// En producción, usa la variable de entorno VITE_API_URL
// En desarrollo, usa localhost o la IP de red local definida en .env.local

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Validación simple para advertir en consola si falta la URL
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
    console.warn("⚠️ ADVERTENCIA: VITE_API_URL no está definida en el entorno de producción.");
}