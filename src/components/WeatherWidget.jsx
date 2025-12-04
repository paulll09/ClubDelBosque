import React, { useEffect, useState } from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudLightning
} from "lucide-react";

export default function WeatherWidget() {
  const [clima, setClima] = useState(null);
  const [estado, setEstado] = useState("loading"); // loading | success | error

  const cargarClima = async () => {
    try {
      setEstado("loading");

      const LAT = -24.7;
      const LON = -60.59;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&timezone=auto`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Error en clima");

      const data = await res.json();
      if (!data.current_weather) throw new Error("Sin datos de clima");

      setClima(data.current_weather);
      setEstado("success");
    } catch (err) {
      console.error(err);
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarClima();
  }, []);

  // Íconos según código WMO (profesionales)
  const getIcono = (codigo) => {
    if (codigo === 0) return <Sun size={22} strokeWidth={2} className="text-yellow-300" />;
    if (codigo >= 1 && codigo <= 3) return <CloudSun size={22} strokeWidth={2} className="text-slate-200" />;
    if (codigo >= 45 && codigo <= 48) return <CloudFog size={22} strokeWidth={2} className="text-slate-400" />;
    if (codigo >= 51 && codigo <= 67) return <CloudRain size={22} strokeWidth={2} className="text-blue-300" />;
    if (codigo >= 80 && codigo <= 99) return <CloudLightning size={22} strokeWidth={2} className="text-yellow-300" />;
    return <Cloud size={22} strokeWidth={2} className="text-slate-300" />;
  };

  // Loading
  if (estado === "loading") {
    return (
      <div className="inline-flex h-9 w-32 rounded-full bg-white/5 animate-pulse"></div>
    );
  }

  // Error
  if (estado === "error") {
    return (
      <button
        onClick={cargarClima}
        className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-slate-900/80 px-3 py-1.5 text-[10px] text-red-300"
      >
        Error clima — Reintentar
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-teal-500/40 bg-slate-900/70 px-5 py-1.5 shadow-lg backdrop-blur-sm">
      {getIcono(clima.weathercode)}

      <div className="flex flex-col leading-tight">
        <span className="text-xs font-semibold text-slate-50">
          {Math.round(clima.temperature)}°C
        </span>

        <span className="text-[9px] tracking-wide text-teal-400 uppercase font-semibold">
          Las Lomitas
        </span>
      </div>
    </div>
  );
}
