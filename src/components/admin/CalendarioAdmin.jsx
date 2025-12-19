import React, { useMemo } from "react";

/**
 * CalendarioAdmin
 * Props esperadas:
 * - reservas: array de reservas del día (confirmada/pendiente/cancelada, etc.)
 * - bloqueosFijos: array de bloqueos fijos aplicados a la fecha (ya filtrados por backend o frontend)
 * - fechaAdmin: "YYYY-MM-DD"
 * - configClub: { hora_apertura, hora_cierre, duracion_turno, cantidad_canchas? }
 */
export default function CalendarioAdmin({
  reservas = [],
  bloqueosFijos = [],
  fechaAdmin,
  configClub,
}) {
  const horaApertura = configClub?.hora_apertura || "14:00";
  const horaCierre = configClub?.hora_cierre || "02:00";
  const duracionTurno = Number(configClub?.duracion_turno || 60);

  // Si tu club puede tener N canchas, idealmente viene en configClub.
  // Si no viene, dejamos 3 por defecto (como venís usando).
  const cantidadCanchas = Number(configClub?.cantidad_canchas || 3);
  const canchas = useMemo(
    () => Array.from({ length: cantidadCanchas }, (_, i) => i + 1),
    [cantidadCanchas]
  );

  const horas = useMemo(() => {
    // genera lista de horas desde apertura a cierre (con cruce de medianoche)
    const toMinutes = (hhmm) => {
      const [h, m] = hhmm.split(":").map(Number);
      return h * 60 + m;
    };

    const pad2 = (n) => String(n).padStart(2, "0");
    const fromMinutes = (mins) => {
      const h = Math.floor((mins % 1440) / 60);
      const m = (mins % 1440) % 60;
      return `${pad2(h)}:${pad2(m)}`;
    };

    const start = toMinutes(horaApertura);
    let end = toMinutes(horaCierre);

    // si cierre es "menor" que apertura, cruza medianoche
    if (end <= start) end += 1440;

    const list = [];
    for (let t = start; t < end; t += duracionTurno) {
      list.push(fromMinutes(t));
    }
    return list;
  }, [horaApertura, horaCierre, duracionTurno]);

  // Index rápido por cancha+hora
  const index = useMemo(() => {
    const key = (idCancha, hora) => `${idCancha}__${hora}`;

    const idx = new Map();

    // 1) reservas (prioridad más alta)
    for (const r of reservas || []) {
      const idCancha = Number(r.id_cancha);
      // hora puede venir "18:00:00" -> "18:00"
      const hora = (r.hora || "").slice(0, 5);
      if (!idCancha || !hora) continue;

      // ignorar canceladas en el calendario (si querés mostrarlas, avisame)
      if ((r.estado || "").toLowerCase() === "cancelada") continue;

      idx.set(key(idCancha, hora), {
        tipo: "reserva",
        estado: (r.estado || "").toLowerCase(),
        nombre: r.nombre_cliente || "Reserva",
        telefono: r.telefono_cliente || null,
        grupoId: r.grupo_id || null,
      });
    }

    // 2) bloqueos fijos (si no hay reserva en ese slot)
    for (const b of bloqueosFijos || []) {
      const idCancha = b.id_cancha ? Number(b.id_cancha) : null;
      const horaDesde = (b.hora_desde || "").slice(0, 5);
      const horaHasta = (b.hora_hasta || "").slice(0, 5);

      if (!horaDesde || !horaHasta) continue;

      const aplicaACancha = (c) => (idCancha ? c === idCancha : true);

      // marcamos todas las horas dentro del rango [desde, hasta) en base al array "horas"
      for (const c of canchas) {
        if (!aplicaACancha(c)) continue;

        for (const h of horas) {
          const inRange = h >= horaDesde && h < horaHasta;
          if (!inRange) continue;

          const k = key(c, h);
          if (idx.has(k)) continue; // si ya hay reserva, no pisamos

          idx.set(k, {
            tipo: "fijo",
            estado: "bloqueado",
            nombre: b.nombre || "Horario fijo",
            telefono: b.telefono || null,
            motivo: b.motivo || null,
          });
        }
      }
    }

    return idx;
  }, [reservas, bloqueosFijos, canchas, horas]);

  const badgeClass = (tipo, estado) => {
    // colores suaves, sin sobrecargar
    if (tipo === "fijo") {
      return "bg-indigo-500/15 text-indigo-200 border border-indigo-500/25";
    }
    if (estado === "confirmada") {
      return "bg-emerald-500/15 text-emerald-200 border border-emerald-500/25";
    }
    if (estado === "pendiente") {
      return "bg-amber-500/15 text-amber-200 border border-amber-500/25";
    }
    return "bg-slate-500/15 text-slate-200 border border-slate-500/25";
  };

  const labelEstado = (tipo, estado) => {
    if (tipo === "fijo") return "Bloqueado";
    if (estado === "confirmada") return "Reservado";
    if (estado === "pendiente") return "Pendiente";
    return "Ocupado";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Calendario</h3>
          <p className="text-[11px] text-slate-400">
            {fechaAdmin || "Fecha"} · {horas.length} turnos
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/25">
            Reservado
          </span>
          <span className="px-2 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/25">
            Pendiente
          </span>
          <span className="px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-500/25">
            Bloqueado
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Header */}
          <div className="grid border-b border-slate-800"
               style={{ gridTemplateColumns: `110px repeat(${canchas.length}, minmax(170px, 1fr))` }}>
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-300 bg-slate-950/40 sticky left-0 z-10 border-r border-slate-800">
              Hora
            </div>
            {canchas.map((c) => (
              <div
                key={c}
                className="px-3 py-2 text-[11px] font-semibold text-slate-200 bg-slate-950/20 border-r border-slate-800 last:border-r-0"
              >
                Cancha {c}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="divide-y divide-slate-800">
            {horas.map((h) => (
              <div
                key={h}
                className="grid"
                style={{ gridTemplateColumns: `110px repeat(${canchas.length}, minmax(170px, 1fr))` }}
              >
                {/* Col hora */}
                <div className="px-3 h-14 flex items-center text-sm text-slate-200 bg-slate-950/40 sticky left-0 z-10 border-r border-slate-800">
                  <span className="font-semibold">{h}</span>
                </div>

                {/* Celdas */}
                {canchas.map((c) => {
                  const k = `${c}__${h}`;
                  const item = index.get(k);

                  if (!item) {
                    return (
                      <div
                        key={k}
                        className="h-14 border-r border-slate-800 last:border-r-0 bg-slate-950/10 flex items-center px-3"
                      >
                        <span className="text-[11px] text-slate-500">Libre</span>
                      </div>
                    );
                  }

                  const badge = badgeClass(item.tipo, item.estado);
                  const estadoTxt = labelEstado(item.tipo, item.estado);

                  return (
                    <div
                      key={k}
                      className="h-14 border-r border-slate-800 last:border-r-0 bg-slate-950/20 flex items-center px-3"
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-semibold text-slate-100 truncate">
                            {item.nombre}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge}`}>
                            {estadoTxt}
                          </span>
                        </div>

                        {item.tipo === "reserva" ? (
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.telefono ? item.telefono : "Sin teléfono"}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.motivo ? item.motivo : "Horario fijo"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
