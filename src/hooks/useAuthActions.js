import { useState, useCallback } from 'react';
import authService from '../services/auth.service';

export function useAuthActions(loginContextFn, logoutContextFn) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loginCliente = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.login(email, password);
            // Expected response: { status: 'success', usuario: {...} }
            if (response.usuario) {
                loginContextFn(response.usuario);
                return true;
            }
            return false;
        } catch (err) {
            setError(err.message || "Error al iniciar sesión");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loginContextFn]);

    const registroCliente = useCallback(async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.registro(userData);
            if (response.usuario) {
                loginContextFn(response.usuario);
                return true;
            }
            return false;
        } catch (err) {
            setError(err.message || "Error al registrarse");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loginContextFn]);

    const logoutCliente = useCallback(() => {
        logoutContextFn();
        // Here we could also call an API endpoint if backend requires server-side logout
    }, [logoutContextFn]);

    return {
        loginCliente,
        registroCliente,
        logoutCliente,
        loading,
        error
    };
}
