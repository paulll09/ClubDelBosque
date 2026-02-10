// src/hooks/useConfigClub.js
import { useEffect, useState } from "react";
import { generarHorariosDesdeConfig } from "../helpers/horarios";
import configService from "../services/config.service";

/**
 * Hook: useConfigClub
 */
const HORARIOS_FALLBACK = [
  "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00", "23:00"
];

export function useConfigClub() {
  const [config, setConfig] = useState(null);
  const [horariosConfig, setHorariosConfig] = useState(HORARIOS_FALLBACK);
  const [cargandoConfig, setCargandoConfig] = useState(false);
  const [errorConfig, setErrorConfig] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setCargandoConfig(true);
      setErrorConfig(null);

      try {
        const data = await configService.getConfig();
        setConfig(data);

        const horariosGenerados = generarHorariosDesdeConfig(
          data.hora_apertura,
          data.hora_cierre,
          data.duracion_turno_minutos || 60
        );

        if (horariosGenerados.length > 0) {
          setHorariosConfig(horariosGenerados);
        }
      } catch (error) {
        console.error("Error cargando configuración pública:", error);
        setErrorConfig(error);
      } finally {
        setCargandoConfig(false);
      }
    };

    cargar();
  }, []);

  return {
    config,
    horariosConfig,
    cargandoConfig,
    errorConfig,
  };
}
