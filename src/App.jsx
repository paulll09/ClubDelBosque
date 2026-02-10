import React, { useState, useEffect } from "react";
import { UserCircle2 } from "lucide-react";
import { API_URL } from "./config";
import Footer from "./components/Footer.jsx";


// Hooks y helpers

import { useConfigClub } from "./hooks/useConfigClub";
import { useReservaFlow } from "./hooks/useReservaFlow";
import { usePaymentFlow } from "./hooks/usePaymentFlow";
import { formatearFechaLarga, getFechaHoy } from "./helpers/fecha";
import { useUser } from "./context/UserContext";
import reservasService from "./services/reservas.service";
import { useToast } from "./context/ToastContext";

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

// Canchas
const CANCHAS = [
  { id: "1", nombre: "Cancha 1", descripcion: "Blindex | Césped" },
  { id: "2", nombre: "Cancha 2", descripcion: "Blindex | Césped" },
  { id: "3", nombre: "Cancha 3", descripcion: "Muro | Césped" },
];

export default function App() {
  // Config del club
  const {
    config,
    horariosConfig,
    cargandoConfig,
    errorConfig,
  } = useConfigClub(); // No args needed now

  // UI feedback (Moved up to avoid ReferenceError)
  const { mostrarToast } = useToast();

  // Lógica de reservas (State moved to hook)
  const {
    fechaSeleccionada,
    setFechaSeleccionada,
    canchaSeleccionada,
    setCanchaSeleccionada,
    reservas,
    bloqueos,
    cargando: cargandoReservas,
    recargar: recargarReservas,
    estaReservado,
    esBloqueado,
    esPasado: esHorarioPasadoHook, // Rename to avoid conflict if helper is imported
    validarDisponibilidad,
    error: errorReservas // Destructure error
  } = useReservaFlow(getFechaHoy(), "1");

  // Show toast if reservation loading fails
  useEffect(() => {
    if (errorReservas) {
      mostrarToast(errorReservas, "error");
    }
  }, [errorReservas, mostrarToast]);

  // Selection state specific to UI (not flow)
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [duracionHoras, setDuracionHoras] = useState(1);
  const [seccionActiva, setSeccionActiva] = useState("reservar");

  // const [toast, setToast] = useState(null); // Managed by context
  const [confirmModal, setConfirmModal] = useState(null);

  // const mostrarToast ... (removed)
  // const cerrarToast ... (removed)

  // Usuario
  const { usuario, login, logout, mostrarLogin, setMostrarLogin } = useUser();

  // Handle Payment Flow
  usePaymentFlow(mostrarToast, recargarReservas);


  // Helper para mostrar si horario pasó (usando el hook por consistencia, o manteniendo el helper visual si se prefiere)
  // El hook useReservaFlow ya trae 'esPasado', pero aquí abajo se usa 'esHorarioPasado'.
  // Podemos hacer un wrapper simple:
  const esHorarioPasado = (hora) => esHorarioPasadoHook(hora);


  // Crear reserva + MP
  const confirmarReserva = async (hora, user, duracionHoras = 1) => {
    // helper: suma N horas a "HH:MM" (con wrap 24h)
    const sumarHoras = (hhmm, n) => {
      const [h, m] = hhmm.split(":").map(Number);
      const total = (h * 60 + m + n * 60) % (24 * 60);
      const hh = String(Math.floor(total / 60)).padStart(2, "0");
      const mm = String(total % 60).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    // Si el usuario elige 2 horas => ["18:00","19:00"]
    const horas = Array.from({ length: duracionHoras }, (_, i) => sumarHoras(hora, i));

    const reserva = {
      id_cancha: canchaSeleccionada,
      fecha: fechaSeleccionada,

      // compatibilidad (tu backend viejo usa "hora")
      hora,

      // NUEVO: para 2 horas
      duracion_horas: duracionHoras,
      horas,

      nombre_cliente: user.nombre,
      telefono_cliente: user.telefono || "", // evita null
      usuario_id: user.id,
      estado: "pendiente",
    };

    try {
      mostrarToast("Generando link de pago...", "info");

      const json = await reservasService.crearReserva(reserva);

      // Redirección a Mercado Pago
      if (json && json.init_point) {
        window.location.href = json.init_point;
      } else {
        // Si no hay init_point pero salió todo bien (ej. precio 0), recargar
        mostrarToast("Reserva creada correctamente.", "success");
        recargarReservas();
        setSeccionActiva("turnos");
      }
    } catch (err) {
      console.error("Error creando reserva:", err);
      // Validar si es error de "ya existe" (409) si el servicio lo propaga
      // El servicio lanza ApiError con message. 
      const msg = err.message || "Error desconocido";

      if (msg.includes("ya existe") || msg.includes("ocupado")) {
        mostrarToast("Ese turno ya no está disponible.", "error");
        recargarReservas();
        return;
      }

      mostrarToast("Error: " + msg, "error");
    }
  };

  // Helper para obtener horas rango (visual)
  const obtenerHorasRango = (horaInicio, duracionHoras) => {
    const idx = horariosConfig.indexOf(horaInicio);
    if (idx < 0) return [];
    return horariosConfig.slice(idx, idx + duracionHoras);
  };

  // Selección de horario
  const seleccionarHorario = (hora) => {
    if (!fechaSeleccionada) return mostrarToast("Seleccioná una fecha.", "warning");
    if (esHorarioPasado(hora)) return mostrarToast("Ese horario ya pasó.", "warning");

    const puede1h = validarDisponibilidad(hora, 1, horariosConfig);

    if (!puede1h) {
      mostrarToast("Ese turno ya no está disponible (ocupado o pasado).", "error");
      recargarReservas();
      return;
    }

    if (!usuario) {
      setHoraSeleccionada(hora);
      setMostrarLogin(true);
      return;
    }

    const puede2h = validarDisponibilidad(hora, 2, horariosConfig);
    setDuracionHoras(1);

    const mensajeBase = `Vas a reservar la Cancha ${canchaSeleccionada} desde las ${hora} hs.`;
    const detalle2h = puede2h
      ? `\nTambién podés elegir 2 horas seguidas (${obtenerHorasRango(hora, 2).join(" y ")}).`
      : `\n(2 horas no disponibles desde este horario).`;

    setConfirmModal({
      titulo: "Reservar y pagar",
      mensaje: `${mensajeBase}${detalle2h}\nSe abrirá Mercado Pago para abonar la seña.`,
      puede2h,
      onConfirm: (duracionElegida = 1) => {
        const duracionFinal = duracionElegida === 2 && !puede2h ? 1 : duracionElegida;
        confirmarReserva(hora, usuario, duracionFinal);
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null),
    });
  };


  // Login exitoso
  const manejarLoginSuccess = () => {
    // login(u); // YA NO ES NECESARIO: El context ya se actualizó en loginAPI/registerAPI

    // Mostramos toast genérico o leemos del context si quisiéramos (pero aquí 'usuario' podría no estar actualizado aun en este render cycle)
    mostrarToast(`¡Sesión iniciada!`, "success");

    if (horaSeleccionada) {
      setConfirmModal({
        titulo: "Completar reserva",
        mensaje: `¿Confirmamos el turno de las ${horaSeleccionada} y vamos al pago?`,
        onConfirm: () => {
          // Nota: usuario podría ser null en este cierre, pero confirmarReserva lo recibirá del render o args
          // Mejor pasar 'usuario' del scope superior o esperar re-render.
          // Sin embargo, al cerrar el modal de login, App se re-renderiza con el nuevo usuario.
          // El modal de confirmación se queda abierto.
          // Al hacer click en "confirmar" dentro del modal, usaremos el 'usuario' del sccope de App (que ya se actualizó).
          setConfirmModal((prev) => ({ ...prev, onConfirm: () => confirmarReserva(horaSeleccionada, usuario) }));
        },
      });

      // Fix simplificado: Simplemente cerramos el login. El usuario verá el modal de confirmación.
      // Al darle "Confirmar" en ese modal, ejecutará la lógica con el usuario ya logueado.
    }
    setMostrarLogin(false);
  };

  // Logout (usa el contexto)
  const manejarLogout = () => {
    logout();
    setSeccionActiva("reservar");
  };

  // Render por sección
  const renderSeccion = () => {
    if (seccionActiva === "turnos") {
      return usuario ? (
        <MisTurnos
          usuario={usuario}
          apiUrl={API_URL}
          mostrarToast={mostrarToast}
        />
      ) : (
        <div className="text-center mt-10 text-slate-400">
          Iniciá sesión para ver tus turnos.
        </div>
      );
    }

    if (seccionActiva === "perfil") {
      return usuario ? (
        <Perfil usuario={usuario} onLogout={manejarLogout} />
      ) : (
        <div className="text-center mt-10 text-slate-400">
          Iniciá sesión para ver tu perfil.
        </div>
      );
    }

    // Sección "reservar"
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Paso 1: Día */}
        <section className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold border border-emerald-500/20 shadow-sm shadow-emerald-900/20">
              1
            </span>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              Seleccioná el día
            </h2>
          </div>

          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <SelectorDiaCarrusel
              fechaSeleccionada={fechaSeleccionada}
              onSeleccionarFecha={setFechaSeleccionada}
            />
            <div className="mt-6 flex justify-center">
              <div className="relative">
                <input
                  type="date"
                  min={getFechaHoy()}
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  className="bg-slate-950/50 text-slate-300 text-xs font-medium rounded-full px-5 py-2.5 border border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all hover:bg-slate-900"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Paso 2: Cancha */}
        <section className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-4 px-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold border border-emerald-500/20 shadow-sm shadow-emerald-900/20">
              2
            </span>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              Elegí tu cancha
            </h2>
          </div>

          <SelectorCancha
            canchas={CANCHAS}
            canchaSeleccionada={canchaSeleccionada}
            onSeleccionarCancha={setCanchaSeleccionada}
          />
        </section>

        {/* Paso 3: Disponibilidad */}
        <section className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold border border-emerald-500/20 shadow-sm shadow-emerald-900/20">
                3
              </span>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                Disponibilidad
              </h2>
            </div>

            {(cargandoReservas || cargandoConfig) && (
              <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Actualizando
                </span>
                <Loader size={14} />
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl p-6 min-h-[300px]">
            <div className="mb-6 pb-4 border-b border-white/5 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">
                  Fecha
                </p>
                <p className="text-emerald-300 font-medium text-sm">
                  {formatearFechaLarga(fechaSeleccionada)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold">
                  Cancha
                </p>
                <p className="text-white font-medium text-sm">
                  #{canchaSeleccionada}
                </p>
              </div>
            </div>

            {errorConfig ? (
              <p className="text-xs text-red-400">
                No se pudo cargar la configuración del club.
              </p>
            ) : (
              <ListaHorarios
                horarios={horariosConfig}
                fechaSeleccionada={fechaSeleccionada}
                estaReservado={estaReservado}
                esHorarioPasado={esHorarioPasado}
                esBloqueado={esBloqueado}
                seleccionarHorario={seleccionarHorario}
              />
            )}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      <header className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-black pb-12 pt-10 rounded-b-[3rem] shadow-2xl mb-10 overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-emerald-900/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <WeatherWidget />
          <span className="text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase mt-4 mb-2 animate-fadeIn">
            Sistema de Reservas
          </span>
          <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight animate-slideUp">
            Club del{" "}
            <span className="text-gradient-pro drop-shadow-lg">
              Bosque
            </span>
          </h1>
          {usuario ? (
            <div className="mt-3 flex items-center gap-3 text-sm font-medium text-emerald-100 bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-500/20 backdrop-blur-sm animate-fadeIn">
              <UserCircle2 size={20} className="text-emerald-400" />
              <span>Hola, <span className="text-white">{usuario.nombre}</span></span>
            </div>
          ) : (
            <button
              onClick={() => setMostrarLogin(true)}
              className="mt-4 text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-full border border-white/10 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-lg animate-fadeIn"
            >
              Iniciar Sesión / Registrarse
            </button>
          )}

        </div>
      </header>

      <main className="max-w-md mx-auto px-4">{renderSeccion()}</main>

      <Footer />



      {
        confirmModal && (
          <ModalConfirmacion
            titulo={confirmModal.titulo}
            mensaje={confirmModal.mensaje}
            onConfirm={() => confirmModal.onConfirm(duracionHoras)}
            onCancel={confirmModal.onCancel}
            mostrarDuracion={true}
            puede2h={confirmModal.puede2h}
            duracionHoras={duracionHoras}
            setDuracionHoras={setDuracionHoras}
          />
        )
      }


      {
        mostrarLogin && (
          <LoginCliente
            onLoginSuccess={manejarLoginSuccess}
            onCancelar={() => setMostrarLogin(false)}
          />
        )
      }

      <BottomNav
        seccionActiva={seccionActiva}
        setSeccionActiva={(sec) => {
          if (sec !== "reservar" && !usuario) setMostrarLogin(true);
          else setSeccionActiva(sec);
        }}
      />
    </div >
  );
}

