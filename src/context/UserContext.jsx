import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import authService from "../services/auth.service";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [errorAuth, setErrorAuth] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("club_usuario");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // [SEGURIDAD] Validación CRÍTICA:
        // Si el objeto tiene "password" (bug frontend anterior) o no tiene nombre,
        // descartamos la sesión para 'curar' el estado corrupto.
        if (parsed.password || (!parsed.nombre && !parsed.nombre_cliente)) {
          console.warn("Sesión corrupta detectada (password/nombre vacío), cerrando sesión.");
          localStorage.removeItem("club_usuario");
          return;
        }

        // Normalizar también al cargar del storage para arreglar sesiones viejas
        const normalizedUser = {
          ...parsed,
          nombre: parsed.nombre || parsed.nombre_cliente || "",
          telefono: parsed.telefono || parsed.telefono_cliente || "",
        };

        // Limpieza extra por si acaso
        if (normalizedUser.password) delete normalizedUser.password;

        setUsuario(normalizedUser);

        // Actualizamos el storage por si estaba viejo
        if (normalizedUser.nombre !== parsed.nombre || normalizedUser.telefono !== parsed.telefono) {
          localStorage.setItem("club_usuario", JSON.stringify(normalizedUser));
        }
      } catch {
        localStorage.removeItem("club_usuario");
      }
    }
  }, []);

  const guardUser = (userData) => {
    console.log("UserContext: guardUser received:", userData);

    // [SEGURIDAD] Nunca guardar el password
    const safeData = { ...userData };
    if (safeData.password) delete safeData.password;

    // Entandarizar campos para asegurar compatibilidad con versiones previas de la BD
    const normalizedUser = {
      ...safeData,
      nombre: safeData.nombre || safeData.nombre_cliente || "",
      telefono: safeData.telefono || safeData.telefono_cliente || "",
    };

    setUsuario(normalizedUser);
    localStorage.setItem("club_usuario", JSON.stringify(normalizedUser));
    setMostrarLogin(false);
    setErrorAuth(null);
  };

  const loginAPI = async (email, password) => {
    setLoadingAuth(true);
    setErrorAuth(null);
    try {
      const res = await authService.login(email, password);
      console.log("Respuesta login:", res);
      // Backend returns { status: 'success', usuario: {...} }
      if (res.usuario) {
        guardUser(res.usuario);
        return true;
      }
      return false;
    } catch (err) {
      setErrorAuth(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  const registerAPI = async (userData) => {
    setLoadingAuth(true);
    setErrorAuth(null);
    try {
      const res = await authService.registro(userData);
      if (res.usuario) {
        guardUser(res.usuario);
        return true;
      }
      return false;
    } catch (err) {
      setErrorAuth(err.message || 'Error al registrarse');
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem("club_usuario");
    setMostrarLogin(false);
    setErrorAuth(null);
  }, []);

  // For compatibility with existing code that might just set user manually
  const loginManual = (u) => guardUser(u);

  return (
    <UserContext.Provider
      value={{
        usuario,
        mostrarLogin,
        setMostrarLogin,
        login: loginManual, // Deprecated, prefer loginAPI
        loginAPI,
        registerAPI,
        logout,
        loadingAuth,
        errorAuth
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser debe usarse dentro de <UserProvider>");
  }
  return ctx;
}

