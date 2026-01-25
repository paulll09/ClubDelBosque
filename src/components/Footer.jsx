import React from "react";
import { MapPin, Phone, MessageCircle } from "lucide-react";

export default function Footer() {
  const clubNombre = "Club del Bosque";
  const telefonoWhatsapp = "5493704379332";
  const telefonoMostrado = "+54 9 3704 379332";

  const googleMapsUrl =
    "https://maps.app.goo.gl/jWLQikgkhvCgHotNA";

  const direccion = "Las Lomitas Formosa – Argentina";

  const whatsappUrl = `https://wa.me/${telefonoWhatsapp}?text=${encodeURIComponent(
    `Hola! Quiero hacer una consulta sobre reservas en ${clubNombre}.`
  )}`;

  return (
    <footer className="mt-16 border-t border-slate-800/60 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto max-w-md px-4 py-8 text-center space-y-6">

        {/* Nombre */}
        <h3 className="text-lg font-extrabold text-white tracking-wide">
          {clubNombre}
        </h3>

        {/* Dirección */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <MapPin size={14} className="text-emerald-400" />
          <span>{direccion}</span>
        </div>

        {/* Teléfono */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Phone size={14} className="text-emerald-400" />
          <span>{telefonoMostrado}</span>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4 pt-2">

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center justify-center gap-2
              rounded-2xl bg-emerald-500/90 px-5 py-3
              text-sm font-semibold text-white
              shadow-lg shadow-emerald-500/20
              transition-all duration-300
              hover:bg-emerald-500 hover:scale-[1.03]
              active:scale-95"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>

          {/* Maps */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2
              rounded-2xl border border-slate-700 bg-slate-900
              px-5 py-3 text-sm font-semibold text-slate-200
              transition-all duration-300
              hover:bg-slate-800 hover:scale-[1.03]
              active:scale-95"
          >
            <MapPin size={18} />
            Ver ubicación
          </a>
        </div>

        {/* Línea final */}
        <div className="pt-5 border-t border-slate-800/60">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} {clubNombre} · Sistema de reservas online
          </p>
        </div>
      </div>
    </footer>
  );
}
