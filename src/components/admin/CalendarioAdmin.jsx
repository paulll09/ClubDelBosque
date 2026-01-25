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
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
      onClick={() => menuAbierto && setMenuAbierto(null)}
    >
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Calendario</h3>
          <p className="text-[11px] text-slate-400">
            {fechaAdmin || "Fecha"} · {horas.length} turnos
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Header */}
          <div
            className="grid border-b border-slate-800"
            style={{
              gridTemplateColumns: `110px repeat(${canchas.length}, minmax(170px, 1fr))`,
            }}
          >
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
                style={{
                  gridTemplateColumns: `110px repeat(${canchas.length}, minmax(170px, 1fr))`,
                }}
              >
                <div className="px-3 h-14 flex items-center text-sm text-slate-200 bg-slate-950/40 sticky left-0 z-10 border-r border-slate-800">
                  <span className="font-semibold">{h}</span>
                </div>

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

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge}`}>
                              {estadoTxt}
                            </span>

                            {/* ✅ Menú acciones SOLO para reservas */}
                            {item.tipo === "reserva" && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuAbierto((prev) => (prev === k ? null : k));
                                  }}
                                  className="text-[12px] px-2 py-0.5 rounded-lg bg-slate-800/60 text-slate-200 border border-slate-700 hover:bg-slate-700/60"
                                  title="Acciones"
                                >
                                  ⋯
                                </button>

                                {menuAbierto === k && (
                                  <div className="absolute right-0 top-6 z-50 w-28 rounded-xl border border-slate-700 bg-slate-950 shadow-lg overflow-hidden">
                                    {item.estado !== "cancelada" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuAbierto(null);
                                          onCancelar?.(item.id);
                                        }}
                                        className="w-full text-left px-3 py-2 text-[11px] text-amber-200 hover:bg-slate-800"
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
                                      className="w-full text-left px-3 py-2 text-[11px] text-rose-200 hover:bg-slate-800"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
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
