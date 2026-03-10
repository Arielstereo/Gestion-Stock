"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState("enter"); // enter | exit

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase("exit"), 4200);
    const doneTimer = setTimeout(() => onComplete?.(), 5000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes logoReveal {
          from { opacity: 0; transform: translateY(24px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes splashOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.04); }
        }
        .anim-logo     { animation: logoReveal 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .anim-tagline  { animation: fadeUp 0.5s ease forwards; animation-delay: 0.5s; opacity: 0; }
        .anim-bar-wrap { animation: fadeUp 0.4s ease forwards; animation-delay: 0.7s; opacity: 0; }
        .anim-bar      { animation: barGrow 3.8s cubic-bezier(0.4,0,0.2,1) forwards; animation-delay: 0.8s; width: 0%; }
        .anim-footer   { animation: fadeUp 0.4s ease forwards; animation-delay: 1s; opacity: 0; }
        .anim-out      { animation: splashOut 0.8s ease forwards; }
      `}</style>

      <div
        className={`fixed inset-0 z-9999 flex flex-col items-center justify-center bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 ${phase === "exit" ? "anim-out" : ""}`}
      >
        {/* Círculos decorativos */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/4 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-white/4 pointer-events-none" />

        {/* Contenido */}
        <div className="relative flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="anim-logo">
            <Image
              src="/tredi-blanco.png"
              alt="Trédi Argentina"
              width={220}
              height={80}
              priority
              className="w-52 h-auto drop-shadow-2xl"
            />
          </div>

          {/* Tagline */}
          <p className="anim-tagline text-white/70 text-xs tracking-[0.18em] uppercase font-light">
            Control de Stock
          </p>

          {/* Barra de progreso */}
          <div className="anim-bar-wrap w-44">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="anim-bar h-full bg-white/80 rounded-full" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="anim-footer absolute bottom-8 text-white/30 text-[11px] tracking-wide">
          Trédi Argentina · Depósito
        </p>
      </div>
    </>
  );
}
