import React, { useMemo, useState } from "react";

/**
 * CalendarioAdmin
 * Props esperadas:
 * - reservas: array de reservas del día
 * - bloqueosFijos: array de bloqueos fijos (pueden venir sin filtrar)
 * - fechaAdmin: "YYYY-MM-DD"
 * - configClub: { hora_apertura, hora_cierre, duracion_turno, cantidad_canchas? }
 * - onCancelar(id)
 * - onEliminar(id)
 */
export default function CalendarioAdmin({
  reservas = [],
  bloqueosFijos = [],
  fechaAdmin,
  configClub,
  onCancelar,
  onEliminar,
}) {
  const [menuAbierto, setMenuAbierto] = useState(null);

  const horaApertura = configClub?.hora_apertura || "14:00";
  const horaCierre = configClub?.hora_cierre || "02:00";
  const duracionTurno = Number(configClub?.duracion_turno || 60);

  const cantidadCanchas = Number(configClub?.cantidad_canchas || 3);
  const canchas = useMemo(
    () => Array.from({ length: cantidadCanchas }, (_, i) => i + 1),
    [cantidadCanchas]
  );

  // dia de semana de fechaAdmin en formato 1..7 (Lun=1 ... Dom=7)
  const diaSemanaFechaAdmin = useMemo(() => {
    if (!fechaAdmin) return null;

    const m = String(fechaAdmin).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d);

    // JS: 0=Dom ... 6=Sab
    const js = dt.getDay();
    // nuestro: 1=Lun ... 7=Dom
    return js === 0 ? 7 : js;
  }, [fechaAdmin]);

  // b.dias_semana viene como "1,3,4"
  const bloqueoFijoAplicaHoy = (b) => {
    if (diaSemanaFechaAdmin === null) return true;

    const diasRaw = (b?.dias_semana ?? "").toString().trim();
    if (!diasRaw) return true;

    const dias = diasRaw
      .split(",")
      .map((x) => Number(String(x).trim()))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 7);

    if (dias.length === 0) return true;

    return dias.includes(diaSemanaFechaAdmin);
  };

  const horas = useMemo(() => {
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

    if (end <= start) end += 1440;

    const list = [];
    for (let t = start; t < end; t += duracionTurno) {
      list.push(fromMinutes(t));
    }
    return list;
  }, [horaApertura, horaCierre, duracionTurno]);

  const index = useMemo(() => {
    const key = (idCancha, hora) => `${idCancha}__${hora}`;
    const idx = new Map();

    // 1) Reservas (sin pendientes)
    for (const r of reservas || []) {
      const idCancha = Number(r.id_cancha);
      const hora = (r.hora || "").slice(0, 5);
      if (!idCancha || !hora) continue;

      const estado = (r.estado || "").toLowerCase();
      if (estado === "pendiente") continue;

      idx.set(key(idCancha, hora), {
        tipo: "reserva",
        id: r.id,
        estado,
        nombre: r.nombre_cliente || "Reserva",
        telefono: r.telefono_cliente || null,
      });
    }

    // 2) Bloqueos fijos (solo si aplican al día seleccionado)
    for (const b of bloqueosFijos || []) {
      if (!bloqueoFijoAplicaHoy(b)) continue;

      const idCancha = b.id_cancha ? Number(b.id_cancha) : null;
      const horaDesde = (b.hora_desde || "").slice(0, 5);
      const horaHasta = (b.hora_hasta || "").slice(0, 5);
      if (!horaDesde || !horaHasta) continue;

      const aplicaACancha = (c) => (idCancha ? c === idCancha : true);

      for (const c of canchas) {
        if (!aplicaACancha(c)) continue;

        for (const h of horas) {
          const inRange = h >= horaDesde && h < horaHasta;
          if (!inRange) continue;

          const k = key(c, h);
          if (idx.has(k)) continue;

          idx.set(k, {
            tipo: "fijo",
            estado: "bloqueado",
            nombre: b.nombre || "Horario fijo",
            motivo: b.motivo || null,
          });
        }
      }
    }

    return idx;
  }, [reservas, bloqueosFijos, canchas, horas, diaSemanaFechaAdmin]);

  const badgeClass = (tipo, estado) => {
    if (tipo === "fijo")
      return "bg-indigo-500/15 text-indigo-200 border border-indigo-500/25";
    if (estado === "confirmada")
      return "bg-emerald-500/15 text-emerald-200 border border-emerald-500/25";
    if (estado === "cancelada")
      return "bg-rose-500/15 text-rose-200 border border-rose-500/25";
    return "bg-slate-500/15 text-slate-200 border border-slate-500/25";
  };

  const labelEstado = (tipo, estado) => {
    if (tipo === "fijo") return "Bloqueado";
    if (estado === "confirmada") return "Reservado";
    if (estado === "cancelada") return "Cancelado";
    return "Ocupado";
  };

  return (
    <div
      className="glass-panel rounded-3xl overflow-hidden animate-slideUp"
      style={{ animationDelay: '0.3s' }}
      onClick={() => menuAbierto && setMenuAbierto(null)}
    >
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Calendario de turnos
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 pl-4">
            {fechaAdmin || "Fecha"} · <span className="text-slate-300 font-semibold">{horas.length}</span> turnos por cancha
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          {/* Header */}
          <div
            className="grid border-b border-white/5"
            style={{
              gridTemplateColumns: `90px repeat(${canchas.length}, minmax(170px, 1fr))`,
            }}
          >
            <div className="px-4 py-3 text-[10px] uppercase font-bold text-slate-400 bg-white/5 sticky left-0 z-10 backdrop-blur-sm border-r border-white/5">
              Hora
            </div>
            {canchas.map((c) => (
              <div
                key={c}
                className="px-4 py-3 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-900/10 border-r border-white/5 last:border-r-0 text-center"
              >
                Cancha {c}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="divide-y divide-white/5">
            {horas.map((h) => (
              <div
                key={h}
                className="grid hover:bg-white/5 transition-colors"
                style={{
                  gridTemplateColumns: `90px repeat(${canchas.length}, minmax(170px, 1fr))`,
                }}
              >
                <div className="px-4 h-16 flex items-center text-xs font-semibold text-slate-400 bg-slate-900/20 sticky left-0 z-10 border-r border-white/5">
                  {h}
                </div>

                {canchas.map((c) => {
                  const k = `${c}__${h}`;
                  const item = index.get(k);

                  if (!item) {
                    return (
                      <div
                        key={k}
                        className="h-16 border-r border-white/5 last:border-r-0 flex items-center px-2 relative group"
                      >
                        <div className="absolute inset-2 rounded-lg border-2 border-dashed border-slate-800 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none">
                          <span className="text-[10px] text-slate-600 font-semibold">Disponible</span>
                        </div>
                      </div>
                    );
                  }

                  const badge = badgeClass(item.tipo, item.estado);
                  const estadoTxt = labelEstado(item.tipo, item.estado);

                  // Colors for card background based on status
                  let cardBg = "bg-slate-800/40 border-slate-700/50";
                  if (item.tipo === "fijo") cardBg = "bg-indigo-900/20 border-indigo-500/20";
                  else if (item.estado === "confirmada") cardBg = "bg-emerald-900/20 border-emerald-500/20";
                  else if (item.estado === "cancelada") cardBg = "bg-red-900/10 border-red-500/10 opacity-60";

                  return (
                    <div
                      key={k}
                      className="h-16 border-r border-white/5 last:border-r-0 flex items-center px-2"
                    >
                      <div className={`w-full h-[90%] rounded-xl border ${cardBg} p-2 flex flex-col justify-center relative group transition-all hover:scale-[1.02] hover:shadow-lg`}>
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] font-bold text-slate-200 truncate pr-4">
                            {item.nombre}
                          </p>

                          {/* Menu Acciones (visible on hover or active) */}
                          {item.tipo === "reserva" && item.estado !== 'cancelada' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuAbierto((prev) => (prev === k ? null : k));
                              }}
                              className={`absolute top-1 right-1 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 ${menuAbierto === k ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                              title="Opciones"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          {item.tipo === "reserva" ? (
                            <span className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                              {item.telefono || "-"}
                            </span>
                          ) : (
                            <span className="text-[9px] text-indigo-300/70 truncate flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                              Fijo
                            </span>
                          )}

                          <div className={`w-1.5 h-1.5 rounded-full ${item.estado === 'confirmada' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]' :
                              item.estado === 'cancelada' ? 'bg-red-400' :
                                item.tipo === 'fijo' ? 'bg-indigo-400' : 'bg-slate-400'
                            }`}></div>
                        </div>


                        {/* Context Menu */}
                        {menuAbierto === k && (
                          <div className="absolute right-0 top-8 z-50 w-32 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl overflow-hidden animate-fadeIn origin-top-right">
                            {item.estado !== "cancelada" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAbierto(null);
                                  onCancelar?.(item.id);
                                }}
                                className="w-full text-left px-4 py-2 text-[10px] uppercase font-bold text-amber-500 hover:bg-white/5 transition-colors"
                              >
                                Cancelar
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setMenuAbierto(null);
                                onEliminar?.(item.id);
                              }}
                              className="w-full text-left px-4 py-2 text-[10px] uppercase font-bold text-rose-500 hover:bg-white/5 transition-colors border-t border-white/5"
                            >
                              Eliminar
                            </button>
                          </div>
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
