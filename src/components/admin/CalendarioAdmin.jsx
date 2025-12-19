import React, { useEffect, useMemo, useState } from "react";

/**
 * Vista calendario del panel admin.
 *
 * - Filas: horas
 * - Columnas: canchas
 * - Celdas: Reserva / Fijo / Libre
 *
 * Props:
 * - reservas: array de reservas (del backend)
 * - fechaAdmin: "YYYY-MM-DD"
 * - configClub: { hora_apertura, hora_cierre, ... }
 * - apiUrl: URL base del backend
 * - adminToken: token admin (X-Admin-Token)
 */
export default function CalendarioAdmin({
  reservas = [],
  fechaAdmin,
  configClub,
  apiUrl,
  adminToken,
}) {
  const [bloqueosFijos, setBloqueosFijos] = useState([]);
  const [cargandoFijos, setCargandoFijos] = useState(false);

  // =========================
  // Cargar bloqueos fijos
  // =========================
  const cargarBloqueosFijos = async () => {
    if (!adminToken) return;
    setCargandoFijos(true);

    try {
      const res = await fetch(`${apiUrl}/admin/bloqueos-fijos`, {
        headers: { "X-Admin-Token": adminToken },
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        console.warn("No se pudieron cargar bloqueos fijos:", data);
        setBloqueosFijos([]);
        return;
      }

      setBloqueosFijos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Error de conexión cargando bloqueos fijos:", e);
      setBloqueosFijos([]);
    } finally {
      setCargandoFijos(false);
    }
  };

  useEffect(() => {
    if (!adminToken) return;
    cargarBloqueosFijos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, apiUrl]);

  // =========================
  // Helpers de jornada
  // =========================
  const cruzaMedianoche = useMemo(() => {
    if (!configClub?.hora_apertura || !configClub?.hora_cierre) return false;
    const [hA, mA] = configClub.hora_apertura.split(":").map(Number);
    const [hC, mC] = configClub.hora_cierre.split(":").map(Number);
    const ini = hA * 60 + mA;
    const fin = hC * 60 + mC;
    return fin <= ini;
  }, [configClub]);

  const valorOrdenHora = (horaStr) => {
    const [h, m] = horaStr.split(":").map(Number);
    const total = h * 60 + m;

    if (!configClub?.hora_apertura || !cruzaMedianoche) return total;

    const [hA, mA] = configClub.hora_apertura.split(":").map(Number);
    const aperturaMin = hA * 60 + mA;

    // Si cruza medianoche, las horas "madrugada" van al final (sumamos 24h)
    if (total < aperturaMin) return total + 24 * 60;
    return total;
  };

  const hhmmToMin = (hhmm) => {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };

  const getDiaSemana1a7 = (yyyyMMdd) => {
    // JS: 0=Dom,1=Lun,...6=Sáb → lo convertimos a 1..7 (Dom=7)
    const d = new Date(`${yyyyMMdd}T00:00:00`);
    const js = d.getDay();
    return js === 0 ? 7 : js;
  };

  // =========================
  // Estructura de tabla
  // =========================
  const canchasUnicas = useMemo(() => {
    // Si por algún motivo no vienen reservas en la fecha, al menos mostramos 1..3
    const ids = reservas
      .map((r) => r.id_cancha)
      .filter((v) => v !== null && v !== undefined);

    const set = Array.from(new Set(ids)).sort((a, b) => Number(a) - Number(b));
    return set.length > 0 ? set : [1, 2, 3];
  }, [reservas]);

  const horasUnicas = useMemo(() => {
    const hs = reservas
      .map((r) => (r.hora ? r.hora.slice(0, 5) : null))
      .filter(Boolean);

    const set = Array.from(new Set(hs));
    return set.sort((a, b) => valorOrdenHora(a) - valorOrdenHora(b));
  }, [reservas, configClub, cruzaMedianoche]);

  const obtenerReservaCelda = (hora, cancha) =>
    reservas.find(
      (r) =>
        String(r.id_cancha) === String(cancha) &&
        r.hora &&
        r.hora.slice(0, 5) === hora
    );

  // =========================
  // Bloqueos fijos: aplica a celda?
  // =========================
  const obtenerFijoCelda = (hora, cancha) => {
    if (!fechaAdmin || !bloqueosFijos?.length) return null;

    const dia = getDiaSemana1a7(fechaAdmin);
    const hCeldaMin = hhmmToMin(hora);

    for (const b of bloqueosFijos) {
      if (String(b.activo ?? 1) === "0") continue;

      // Si bloqueo fijo es de cancha específica, matchea; si es null => todas
      if (b.id_cancha && String(b.id_cancha) !== String(cancha)) continue;

      // Días de semana
      const dias = String(b.dias_semana || "")
        .split(",")
        .map((x) => Number(String(x).trim()))
        .filter(Boolean);

      if (!dias.includes(dia)) continue;

      const desde = hhmmToMin(String(b.hora_desde || "").slice(0, 5));
      const hasta = hhmmToMin(String(b.hora_hasta || "").slice(0, 5));
      if (desde === null || hasta === null || hCeldaMin === null) continue;

      // Hora dentro del rango: [desde, hasta)
      if (hCeldaMin >= desde && hCeldaMin < hasta) {
        return b;
      }
    }

    return null;
  };

  // =========================
  // UI helpers
  // =========================
  const chipEstado = (estado) => {
    const e = String(estado || "").toLowerCase();
    if (e === "confirmada")
      return "bg-emerald-500/15 text-emerald-200 border-emerald-500/25";
    if (e === "pendiente")
      return "bg-sky-500/15 text-sky-200 border-sky-500/25";
    if (e === "cancelada")
      return "bg-red-500/15 text-red-200 border-red-500/25";
    if (e === "fijo")
      return "bg-violet-500/15 text-violet-200 border-violet-500/25";
    return "bg-slate-500/10 text-slate-200 border-slate-500/20";
  };

  if (!reservas || reservas.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Calendario del día
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {fechaAdmin || "—"} · Vista por cancha y hora
            </p>
          </div>

          {adminToken ? (
            <button
              onClick={cargarBloqueosFijos}
              disabled={cargandoFijos}
              className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 disabled:opacity-60"
            >
              {cargandoFijos ? "Cargando..." : "Actualizar fijos ↻"}
            </button>
          ) : null}
        </div>

        <p className="text-sm text-slate-500 mt-4">
          No hay reservas para mostrar en esta fecha.
          <br />
          <span className="text-xs">
            (Los bloqueos fijos se ven cuando el calendario tiene horas/canchas
            para renderizar.)
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Calendario del día
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {fechaAdmin} · Vista por cancha y hora
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
            <span
              className={`px-2 py-0.5 rounded-full border ${chipEstado(
                "confirmada"
              )}`}
            >
              Confirmada
            </span>
            <span
              className={`px-2 py-0.5 rounded-full border ${chipEstado(
                "pendiente"
              )}`}
            >
              Pendiente
            </span>
            <span
              className={`px-2 py-0.5 rounded-full border ${chipEstado(
                "cancelada"
              )}`}
            >
              Cancelada
            </span>
            <span
              className={`px-2 py-0.5 rounded-full border ${chipEstado("fijo")}`}
            >
              Fijo
            </span>
          </div>
        </div>

        {adminToken ? (
          <button
            onClick={cargarBloqueosFijos}
            disabled={cargandoFijos}
            className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 disabled:opacity-60"
            title="Recargar bloqueos fijos"
          >
            {cargandoFijos ? "Cargando..." : "Actualizar fijos ↻"}
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full text-xs border-separate border-spacing-y-1">
          <thead className="sticky top-0 bg-slate-950/90 backdrop-blur border-b border-slate-800">
            <tr>
              <th className="text-left text-[10px] text-slate-400 uppercase tracking-wider px-3 py-3">
                Hora
              </th>
              {canchasUnicas.map((cancha) => (
                <th
                  key={`head-cancha-${cancha}`}
                  className="text-center text-[10px] text-slate-300 uppercase tracking-wider px-3 py-3"
                >
                  Cancha {cancha}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="px-2">
            {horasUnicas.map((hora) => (
              <tr key={`fila-hora-${hora}`} className="group">
                <td className="align-top px-3 py-1.5 text-[11px] text-slate-200 font-mono">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-2 inline-flex">
                    {hora}
                  </div>
                </td>

                {canchasUnicas.map((cancha) => {
                  const r = obtenerReservaCelda(hora, cancha);

                  // Si no hay reserva, probamos bloqueo fijo
                  const fijo = !r ? obtenerFijoCelda(hora, cancha) : null;

                  if (!r && !fijo) {
                    return (
                      <td
                        key={`celda-${hora}-${cancha}`}
                        className="align-top px-2 py-1.5"
                      >
                        <div className="border border-dashed border-slate-800 rounded-xl h-14 flex items-center justify-center text-[11px] text-slate-500 bg-slate-950/20 group-hover:bg-slate-950/35 transition">
                          Libre
                        </div>
                      </td>
                    );
                  }

                  // Celda ocupada por reserva real
                  if (r) {
                    const estado = String(r.estado || "").toLowerCase();
                    const chip = chipEstado(estado);

                    return (
                      <td
                        key={`celda-${hora}-${cancha}`}
                        className="align-top px-2 py-1.5"
                      >
                        <div className="h-14 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 flex flex-col justify-center gap-1 group-hover:bg-slate-950/60 transition">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-semibold text-slate-100 truncate">
                              {r.nombre_cliente || "Sin nombre"}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${chip} whitespace-nowrap`}
                            >
                              {estado || "—"}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-300/80 truncate">
                            {r.telefono_cliente ? `📞 ${r.telefono_cliente}` : ""}
                          </div>
                        </div>
                      </td>
                    );
                  }

                  // Celda ocupada por fijo
                  const estado = "fijo";
                  const chip = chipEstado(estado);

                  return (
                    <td
                      key={`celda-${hora}-${cancha}`}
                      className="align-top px-2 py-1.5"
                    >
                      <div className="h-14 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 flex flex-col justify-center gap-1 group-hover:bg-slate-950/60 transition">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold text-slate-100 truncate">
                            {fijo?.nombre || "Fijo"}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${chip} whitespace-nowrap`}
                          >
                            Fijo
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-300/80 truncate">
                          {fijo?.telefono ? `📞 ${fijo.telefono}` : fijo?.motivo ? `📝 ${fijo.motivo}` : ""}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
