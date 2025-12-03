import React, { useState, useEffect } from "react";
import { API_URL } from "./config";

// UI
import SelectorCancha from "./components/SelectorCancha";
import ListaHorarios from "./components/ListaHorarios";
import SelectorDiaCarrusel from "./components/SelectorDiaCarrusel";
import WeatherWidget from "./components/WeatherWidget";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";
import ModalConfirmacion from "./components/ModalConfirmacion";
import Loader from "./components/Loader";

// Usuario
import LoginCliente from "./components/LoginCliente";
import MisTurnos from "./components/MisTurnos";
import Perfil from "./components/Perfil";
import FormularioCliente from "./components/FormularioCliente";

// Constantes
const HORARIOS = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
const CANCHAS = [
  { id: "1", nombre: "Cancha 1", descripcion: "Cristal | Césped Pro" },
  { id: "2", nombre: "Cancha 2", descripcion: "Cristal | Césped Pro" },
  { id: "3", nombre: "Cancha 3", descripcion: "Muro | Césped Std" },
];


// Genera la lista de horarios dinámicamente a partir de la configuración
// global de apertura/cierre y duración de turno.
function generarHorariosDesdeConfig(horaApertura, horaCierre, duracionMinutos) {
  if (!horaApertura || !horaCierre || !duracionMinutos) return [];

  const [hA, mA] = horaApertura.split(":").map(Number);
  const [hC, mC] = horaCierre.split(":").map(Number);

  let inicio = hA * 60 + mA;
  let fin = hC * 60 + mC;

  // Si el cierre es menor o igual que la apertura, asumimos que cierra al día siguiente
  // (por ejemplo: 13:00 → 02:00)
  if (fin <= inicio) {
    fin += 24 * 60;
  }

  const slots = [];

  for (let t = inicio; t < fin; t += duracionMinutos) {
    const hora = Math.floor(t / 60) % 24;
    const min = t % 60;

    const hh = String(hora).padStart(2, "0");
    const mm = String(min).padStart(2, "0");

    slots.push(`${hh}:${mm}`);
  }

  return slots;
}

// Utilidades
const formatearFechaLarga = (fecha) => {
  if (!fecha) return "Seleccioná una fecha";
  const d = new Date(`${fecha}T00:00:00`);
  const opt = { weekday: "long", day: "numeric", month: "long" };
  const txt = d.toLocaleDateString("es-AR", opt);
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};

const getFechaHoy = () => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
};

export default function App() {
  const [config, setConfig] = useState(null);
  const [horariosConfig, setHorariosConfig] = useState(HORARIOS);

  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [canchaSeleccionada, setCanchaSeleccionada] = useState("1");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  const [reservasBackend, setReservasBackend] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(false);

  const [bloqueosBackend, setBloqueosBackend] = useState([]);

  const [usuario, setUsuario] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState("reservar");
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  // Carga la configuración global (horarios, duración de turno, seña)
  // y genera el arreglo de horarios que se muestra al cliente.
  useEffect(() => {
    const cargarConfigPublica = async () => {
      try {
        const res = await fetch(`${API_URL}/config`);
        if (!res.ok) {
          console.error("No se pudo cargar la configuración pública");
          return;
        }

        const data = await res.json();
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
      }
    };

    cargarConfigPublica();
  }, []);

  // -----------------------------------
  // Toast
  // -----------------------------------
  const mostrarToast = (msg, type = "info") => setToast({ message: msg, type });
  const cerrarToast = () => setToast(null);

  // -----------------------------------
  // Manejo del retorno de Mercado Pago
  // -----------------------------------
  useEffect(() => {
    const u = localStorage.getItem("club_usuario");
    if (u) setUsuario(JSON.parse(u));

    const params = new URLSearchParams(window.location.search);
    const estado = params.get("estado");
    const idReserva = params.get("id_reserva");

    if (estado === "exito" && idReserva) {
      confirmarPagoBackend(idReserva);
    } else if (
      (estado === "failure" || estado === "error" || estado === "pending") &&
      idReserva
    ) {
      // Cualquier cosa que NO sea éxito, lo tomamos como que NO se pagó
      liberarTurnoFallido(idReserva);
    }
  }, []);

  // Confirma reserva pagada con éxito
  const confirmarPagoBackend = async (idReserva) => {
    try {
      await fetch(`${API_URL}/reservas/confirmar/${idReserva}`, { method: "POST" });

      mostrarToast("¡Pago exitoso! Tu reserva quedó confirmada.", "success");
      setSeccionActiva("turnos");
    } catch (err) {
      mostrarToast("Error confirmando el pago.", "error");
    } finally {
      window.history.replaceState({}, document.title, "/");
      recargarReservas();
    }
  };

  // Si la persona sale del pago → se cancela la reserva
  const liberarTurnoFallido = async (idReserva) => {
    try {
      await fetch(`${API_URL}/reservas/${idReserva}`, { method: "DELETE" });
      mostrarToast("El pago no se completó. Turno liberado.", "warning");
    } catch (error) {
      console.error(error);
    } finally {
      window.history.replaceState({}, document.title, "/");
      recargarReservas();
    }
  };

  // -----------------------------------
  // Obtener reservas backend
  // -----------------------------------
  const recargarReservas = async () => {
    if (!canchaSeleccionada) return;

    const fecha = fechaSeleccionada || getFechaHoy();

    setCargandoReservas(true);
    try {
      const [resReservas, resBloqueos] = await Promise.all([
        fetch(`${API_URL}/reservas?fecha=${fecha}&id_cancha=${canchaSeleccionada}`),
        fetch(`${API_URL}/bloqueos-disponibilidad?fecha=${fecha}&id_cancha=${canchaSeleccionada}`),
      ]);

      const dataReservas = await resReservas.json().catch(() => []);
      const dataBloqueos = await resBloqueos.json().catch(() => []);

      setReservasBackend(Array.isArray(dataReservas) ? dataReservas : []);
      setBloqueosBackend(Array.isArray(dataBloqueos) ? dataBloqueos : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoReservas(false);
    }
  };

  useEffect(() => {
    recargarReservas();
  }, [fechaSeleccionada, canchaSeleccionada]);

  // -----------------------------------
  // Helpers horarios
  // -----------------------------------
  const estaReservado = (hora) =>
    reservasBackend.some(
      (r) =>
        r.estado === "confirmada" && String(r.hora).slice(0, 5) === hora
    );

const esHorarioPasado = (hora) => {
  if (!fechaSeleccionada) return false;

  const ahora = new Date();
  const hoySinHora = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );

  const [Y, M, D] = fechaSeleccionada.split("-").map(Number);
  const fechaSelSinHora = new Date(Y, M - 1, D);

  // Si la fecha seleccionada es anterior a hoy → todo pasado
  if (fechaSelSinHora < hoySinHora) return true;

  // Si la fecha seleccionada es posterior a hoy → nada pasado
  if (fechaSelSinHora > hoySinHora) return false;

  // Acá: fechaSeleccionada es HOY
  const [h, m] = hora.split(":").map(Number);
  const slotMin = h * 60 + m;
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();

  // Si no hay config, hacemos comparación simple
  if (!config || !config.hora_apertura || !config.hora_cierre) {
    return slotMin <= ahoraMin;
  }

  // Detectar si la jornada cruza medianoche
  const [hA, mA] = config.hora_apertura.split(":").map(Number);
  const [hC, mC] = config.hora_cierre.split(":").map(Number);
  const aperturaMin = hA * 60 + mA;
  const cierreMin = hC * 60 + mC;

  // Jornada NORMAL (no cruza medianoche) → comparación simple en el día
  if (cierreMin > aperturaMin) {
    return slotMin <= ahoraMin;
  }

  // Jornada que CRUZA medianoche (ej: 14:00 → 02:00)
  // Los horarios con minutos < aperturaMin son de la "madrugada siguiente".
  const slotEsMadrugada = slotMin < aperturaMin;

  let slotComparacion = slotMin;
  let ahoraComparacion = ahoraMin;

  // Si el horario es de madrugada, lo llevamos al "día siguiente" sumando 24h
  if (slotEsMadrugada) {
    slotComparacion += 24 * 60;
  }

  // En el día de hoy, desde el punto de vista del usuario:
  // - 14:00..23:59 se comparan normal
  // - 00:00..01:59 (cuando config cruza medianoche) se consideran futuro
  //   mientras no haya pasado el horario real.
  return slotComparacion <= ahoraComparacion;
};


  // Verifica si la hora está bloqueada por torneo/cierre
  const esBloqueado = (hora) => {
    if (!fechaSeleccionada) return false;
    if (!bloqueosBackend || bloqueosBackend.length === 0) return false;

    // hora en minutos (ej: "18:00" → 1080)
    const [h, m] = hora.split(":").map(Number);
    const minutosHora = h * 60 + m;

    return bloqueosBackend.some((b) => {
      // Si no hay horas => bloqueo todo el día
      if (!b.hora_desde && !b.hora_hasta) {
        return true;
      }

      let desdeMin = 0;
      let hastaMin = 24 * 60;

      if (b.hora_desde) {
        const [dh, dm] = b.hora_desde.split(":").map(Number);
        desdeMin = dh * 60 + dm;
      }

      if (b.hora_hasta) {
        const [hh, hm] = b.hora_hasta.split(":").map(Number);
        hastaMin = hh * 60 + hm;
      }

      return minutosHora >= desdeMin && minutosHora <= hastaMin;
    });
  };

  // -----------------------------------
  // Selección de horario
  // -----------------------------------
  const seleccionarHorario = (hora) => {
    if (!fechaSeleccionada) return mostrarToast("📅 Seleccioná una fecha.", "warning");
    if (esHorarioPasado(hora)) return mostrarToast("⏳ Ese horario ya pasó.", "warning");

    if (!usuario) {
      setHoraSeleccionada(hora);
      setMostrarLogin(true);
      return;
    }

    setConfirmModal({
      titulo: "Reservar y pagar",
      mensaje: `Vas a reservar la Cancha ${canchaSeleccionada} a las ${hora} hs.\nSe abrirá Mercado Pago para abonar la seña.`,
      onConfirm: () => {
        confirmarReserva(hora, usuario);
        setConfirmModal(null);
      },
    });
  };

  // -----------------------------------
  // Cuando el usuario inicia sesión
  // -----------------------------------
  const manejarLoginSuccess = (u) => {
    setUsuario(u);
    localStorage.setItem("club_usuario", JSON.stringify(u));
    setMostrarLogin(false);

    mostrarToast(`¡Bienvenido, ${u.nombre}!`, "success");

    if (horaSeleccionada) {
      setConfirmModal({
        titulo: "Completar reserva",
        mensaje: `¿Confirmamos el turno de las ${horaSeleccionada} y vamos al pago?`,
        onConfirm: () => {
          confirmarReserva(horaSeleccionada, u);
          setConfirmModal(null);
        },
      });
    }
  };

  // -----------------------------------
  // Confirmar reserva → crear preferencia en backend
  // -----------------------------------
  const confirmarReserva = async (hora, user) => {
    const reserva = {
      id_cancha: canchaSeleccionada,
      fecha: fechaSeleccionada,
      hora,
      nombre_cliente: user.nombre,
      telefono_cliente: user.telefono,
      usuario_id: user.id,
      estado: "pendiente",
    };

    try {
      mostrarToast("Generando link de pago...", "info");

      const res = await fetch(`${API_URL}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reserva),
      });

      const json = await res.json();

      if (res.status === 409) {
        mostrarToast("⚠️ Ese turno ya fue reservado.", "error");
        recargarReservas();
        return;
      }

      if (!res.ok) throw new Error(json.mensaje || "Error creando reserva");

      if (json.init_point) {
        window.location.href = json.init_point;
      } else {
        mostrarToast("No se generó link de pago.", "error");
      }
    } catch (err) {
      mostrarToast("Error: " + err.message, "error");
    }
  };

  // -----------------------------------
  // Logout
  // -----------------------------------
  const manejarLogout = () => {
    localStorage.removeItem("club_usuario");
    setUsuario(null);
    setSeccionActiva("reservar");
  };

  // -----------------------------------
  // Render principal
  // -----------------------------------
  const renderSeccion = () => {
    if (seccionActiva === "turnos") {
      return usuario ? (
        <MisTurnos usuario={usuario} apiUrl={API_URL} />
      ) : (
        <div className="text-center mt-10 text-slate-400">Iniciá sesión para ver tus turnos.</div>
      );
    }

    if (seccionActiva === "perfil") {
      return usuario ? (
        <Perfil usuario={usuario} onLogout={manejarLogout} />
      ) : (
        <div className="text-center mt-10 text-slate-400">Iniciá sesión para ver tu perfil.</div>
      );
    }

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Paso 1: Día */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">1</span>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Seleccioná el día</h2>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 shadow-lg">
            <SelectorDiaCarrusel fechaSeleccionada={fechaSeleccionada} onSeleccionarFecha={setFechaSeleccionada} />
            <div className="mt-4 flex justify-center">
              <input type="date" min={getFechaHoy()} value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs rounded-full px-4 py-2 border border-slate-700 focus:border-emerald-500 outline-none" />
            </div>
          </div>
        </section>

        {/* Paso 2: Cancha */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">2</span>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Elegí tu cancha</h2>
          </div>

          <SelectorCancha
            canchas={CANCHAS}
            canchaSeleccionada={canchaSeleccionada}
            onSeleccionarCancha={setCanchaSeleccionada}
          />
        </section>

        {/* Paso 3: Disponibilidad */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">3</span>
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Disponibilidad</h2>
            </div>

            {cargandoReservas && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400">Actualizando</span>
                <Loader size={16} />
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="mb-4 pb-4 border-b border-slate-800 flex justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Fecha</p>
                <p className="text-emerald-300 font-medium text-sm">{formatearFechaLarga(fechaSeleccionada)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Cancha</p>
                <p className="text-white font-medium text-sm">#{canchaSeleccionada}</p>
              </div>
            </div>

            <ListaHorarios
              horarios={horariosConfig}
              fechaSeleccionada={fechaSeleccionada}
              estaReservado={estaReservado}
              esHorarioPasado={esHorarioPasado}
              esBloqueado={esBloqueado}
              seleccionarHorario={seleccionarHorario}
            />
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      <header className="relative bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 pb-10 pt-8 rounded-b-[2.5rem] shadow-xl mb-8">
        <div className="relative z-10 flex flex-col items-center textcenter">
          <WeatherWidget />
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mt-2">
            Sistema de Reservas
          </span>
          <h1 className="text-4xl font-extrabold text-white mb-1">
            Club del <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Bosque</span>
          </h1>

          {usuario ? (
            <p className="text-sm text-emerald-300">👋 ¡Hola, {usuario.nombre}!</p>
          ) : (
            <button
              onClick={() => setMostrarLogin(true)}
              className="text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 mt-3"
            >
              Iniciar Sesión / Registrarse
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4">
        {renderSeccion()}
      </main>

      {toast && <Toast {...toast} onClose={cerrarToast} />}
      {confirmModal && (
        <ModalConfirmacion
          titulo={confirmModal.titulo}
          mensaje={confirmModal.mensaje}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {mostrarLogin && (
        <LoginCliente
          apiUrl={API_URL}
          onLoginSuccess={manejarLoginSuccess}
          onCancelar={() => setMostrarLogin(false)}
        />
      )}
      {mostrarFormulario && (
        <FormularioCliente
          fechaSeleccionada={fechaSeleccionada}
          canchaSeleccionada={canchaSeleccionada}
          horaSeleccionada={horaSeleccionada}
          onConfirmar={confirmarReserva}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      <BottomNav
        seccionActiva={seccionActiva}
        setSeccionActiva={(sec) => {
          if (sec !== "reservar" && !usuario) setMostrarLogin(true);
          else setSeccionActiva(sec);
        }}
      />
    </div>
  );
}
