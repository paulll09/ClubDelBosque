import React, { useState, useEffect } from "react";
import { UserCircle2 } from "lucide-react";
import { API_URL } from "./config";

// Hooks y helpers
import { useConfigClub } from "./hooks/useConfigClub";
import { useReservasCliente } from "./hooks/useReservasCliente";
import { formatearFechaLarga, getFechaHoy } from "./helpers/fecha";
import { useUser } from "./context/UserContext";

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
  // Selección actual
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [canchaSeleccionada, setCanchaSeleccionada] = useState("1");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  // Navegación interna
  const [seccionActiva, setSeccionActiva] = useState("reservar"); // reservar | turnos | perfil

  // UI feedback
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  // Usuario desde contexto
  const { usuario, login, logout, mostrarLogin, setMostrarLogin } = useUser();

  // Config del club
  const {
    config,
    horariosConfig,
    cargandoConfig,
    errorConfig,
  } = useConfigClub(API_URL);

  // Reservas y bloqueos
  const {
    reservas,
    bloqueos,
    cargandoReservas,
    recargarReservas,
    estaReservado,
    esBloqueado,
  } = useReservasCliente(API_URL, fechaSeleccionada, canchaSeleccionada);

  // Indica si la jornada cruza medianoche
  const cruzaMedianoche = (() => {
    if (!config?.hora_apertura || !config?.hora_cierre) return false;
    const [hA, mA] = config.hora_apertura.split(":").map(Number);
    const [hC, mC] = config.hora_cierre.split(":").map(Number);
    const inicio = hA * 60 + mA;
    const fin = hC * 60 + mC;
    return fin <= inicio;
  })();

  /**
   * Determina si un horario ya pasó teniendo en cuenta:
   *  - La fecha seleccionada
   *  - Si la jornada cruza medianoche o no
   *
   * Si la jornada cruza medianoche y la hora es menor a la apertura,
   * el turno corresponde al día siguiente.
   */
  const esHorarioPasado = (horaStr) => {
    if (!fechaSeleccionada) return false;

    const [year, month, day] = fechaSeleccionada.split("-").map(Number);
    const [h, m] = horaStr.split(":").map(Number);

    let fechaTurno = new Date(year, month - 1, day, h, m);

    if (config?.hora_apertura && cruzaMedianoche) {
      const [hA, mA] = config.hora_apertura.split(":").map(Number);
      const aperturaMin = hA * 60 + mA;
      const totalMin = h * 60 + m;

      if (totalMin < aperturaMin) {
        const ajustada = new Date(fechaTurno);
        ajustada.setDate(ajustada.getDate() + 1);
        fechaTurno = ajustada;
      }
    }

    const ahora = new Date();
    return fechaTurno < ahora;
  };

  // Toast
  const mostrarToast = (message, type = "info") =>
    setToast({ message, type });
  const cerrarToast = () => setToast(null);

  // Manejo de retorno de Mercado Pago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const estado = params.get("estado");
    const idReserva = params.get("id_reserva");

    if (estado === "exito" && idReserva) {
      confirmarPagoBackend(idReserva);
    } else if (
      (estado === "failure" || estado === "error" || estado === "pending") &&
      idReserva
    ) {
      liberarTurnoFallido(idReserva);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmarPagoBackend = async (idReserva) => {
    try {
      await fetch(`${API_URL}/reservas/confirmar/${idReserva}`, {
        method: "POST",
      });

      mostrarToast("¡Pago exitoso! Tu reserva quedó confirmada.", "success");
      setSeccionActiva("turnos");
    } catch (err) {
      mostrarToast("Error confirmando el pago.", "error");
    } finally {
      window.history.replaceState({}, document.title, "/");
      recargarReservas();
    }
  };

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

  // Selección de horario
  const seleccionarHorario = (hora) => {
    if (!fechaSeleccionada)
      return mostrarToast("Seleccioná una fecha.", "warning");
    if (esHorarioPasado(hora))
      return mostrarToast("Ese horario ya pasó.", "warning");

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

  // Login exitoso
  const manejarLoginSuccess = (u) => {
    login(u); // va al contexto + localStorage
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

  // Logout (usa el contexto)
  const manejarLogout = () => {
    logout();
    setSeccionActiva("reservar");
  };

  // Crear reserva + MP
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
        mostrarToast("Ese turno ya fue reservado.", "error");
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

  // Render por sección
  const renderSeccion = () => {
    if (seccionActiva === "turnos") {
      return usuario ? (
        <MisTurnos usuario={usuario} apiUrl={API_URL} />
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
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              1
            </span>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
              Seleccioná el día
            </h2>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 shadow-lg">
            <SelectorDiaCarrusel
              fechaSeleccionada={fechaSeleccionada}
              onSeleccionarFecha={setFechaSeleccionada}
            />
            <div className="mt-4 flex justify-center">
              <input
                type="date"
                min={getFechaHoy()}
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs rounded-full px-4 py-2 border border-slate-700 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Paso 2: Cancha */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              2
            </span>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
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
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                3
              </span>
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                Disponibilidad
              </h2>
            </div>

            {(cargandoReservas || cargandoConfig) && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400">
                  Actualizando
                </span>
                <Loader size={16} />
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="mb-4 pb-4 border-b border-slate-800 flex justify-between">
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
      <header className="relative bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 pb-10 pt-8 rounded-b-[2.5rem] shadow-xl mb-8">
        <div className="relative z-10 flex flex-col items-center text-center">
          <WeatherWidget />
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mt-2">
            Sistema de Reservas
          </span>
          <h1 className="text-4xl font-extrabold text-white mb-1">
            Club del{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              Bosque
            </span>
          </h1>
          {usuario ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-emerald-300">
              <UserCircle2 size={18} className="text-emerald-300" />
              <span>Hola, {usuario.nombre}.</span>
            </div>
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

      <main className="max-w-md mx-auto px-4">{renderSeccion()}</main>

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

