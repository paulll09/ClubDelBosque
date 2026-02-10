import React, { useEffect } from "react";

export default function Toast({ message, type = "info", onClose }) {
  // Cerrar automáticamente a los 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Estilos base y específicos por tipo
  // Fix centering: use left-0 right-0 mx-auto w-fit to avoid conflict with animate-fadeIn transform
  const baseStyles = "fixed top-6 left-0 right-0 mx-auto w-fit z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all animate-fadeIn border backdrop-blur-md";

  const typeStyles = {
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10",
    error: "bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/10",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/10",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-blue-500/10",
  };

  // Iconos SVG profesionales en lugar de emojis
  const iconos = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`${baseStyles} ${typeStyles[type]}`}>
      <div className="shrink-0">
        {iconos[type]}
      </div>
      <span className="text-sm font-semibold tracking-wide text-slate-100">
        {message}
      </span>
    </div>
  );
}