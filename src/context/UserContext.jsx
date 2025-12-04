// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext(null);

/**
 * UserProvider
 *
 * Maneja:
 *  - usuario (datos del cliente logueado)
 *  - mostrarLogin (modal de login abierto/cerrado)
 *  - login(usuarioData): guarda en estado + localStorage
 *  - logout(): limpia estado + localStorage
 */
export function UserProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  // Restaurar sesión desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem("club_usuario");
    if (stored) {
      try {
        setUsuario(JSON.parse(stored));
      } catch {
        // Si se rompe el parse, limpiamos
        localStorage.removeItem("club_usuario");
      }
    }
  }, []);

  const login = (usuarioData) => {
    setUsuario(usuarioData);
    localStorage.setItem("club_usuario", JSON.stringify(usuarioData));
    setMostrarLogin(false);
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("club_usuario");
    setMostrarLogin(false);
  };

  return (
    <UserContext.Provider
      value={{
        usuario,
        mostrarLogin,
        setMostrarLogin,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook de conveniencia para usar el contexto:
 * const { usuario, login, logout, mostrarLogin, setMostrarLogin } = useUser();
 */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser debe usarse dentro de <UserProvider>");
  }
  return ctx;
}
