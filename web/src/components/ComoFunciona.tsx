"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const PASOS = {
  alquilar: [
    {
      icono: "🔍",
      titulo: "Busca",
      descripcion: "Encuentra la herramienta que necesitas cerca de ti.",
    },
    {
      icono: "📅",
      titulo: "Reserva",
      descripcion: "Elige las fechas y paga de forma segura.",
    },
    {
      icono: "🤝",
      titulo: "Recoge",
      descripcion: "Queda con el propietario y ponte manos a la obra.",
    },
  ],
  publicar: [
    {
      icono: "📸",
      titulo: "Publica",
      descripcion: "Sube tus herramientas en minutos con fotos y precio.",
    },
    {
      icono: "✅",
      titulo: "Acepta",
      descripcion: "Recibe solicitudes y confirma las que quieras.",
    },
    {
      icono: "💰",
      titulo: "Cobra",
      descripcion: "El dinero llega directamente a tu cuenta.",
    },
  ],
};

export default function ComoFunciona() {
  const [tab, setTab] = useState<"alquilar" | "publicar">("alquilar");
  const pasos = PASOS[tab];

  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Título */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
          ¿Cómo funciona?
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm sm:text-base">
          Es muy sencillo, tanto si quieres alquilar como si quieres ganar
          dinero.
        </p>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-gray-100 rounded-full p-1 gap-1">
            <button
              onClick={() => setTab("alquilar")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                tab === "alquilar"
                  ? "bg-[#F97316] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Quiero alquilar
            </button>
            <button
              onClick={() => setTab("publicar")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                tab === "publicar"
                  ? "bg-[#F97316] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Quiero publicar
            </button>
          </div>
        </div>

        {/* Pasos — solo móvil */}
        <div className="sm:hidden grid grid-cols-1 gap-6">
          {pasos.map((paso, i) => (
            <div
              key={paso.titulo}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-3xl">
                  {paso.icono}
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F97316] text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">
                {paso.titulo}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {paso.descripcion}
              </p>
            </div>
          ))}
        </div>

        {/* Imagen flujo — tablet y desktop */}
        <div className="hidden sm:block relative w-full h-64 md:h-80 lg:h-96">
          <Image
            src={
              tab === "alquilar"
                ? "/diagrama-alquilar.png"
                : "/diagrama-vender.png"
            }
            alt="Cómo funciona"
            fill
            className="object-contain"
          />
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          {tab === "alquilar" ? (
            <Link
              href="/herramientas"
              className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold px-8 py-3 rounded-full transition-colors"
            >
              Ver herramientas disponibles
            </Link>
          ) : (
            <Link
              href="/herramientas/nueva"
              className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold px-8 py-3 rounded-full transition-colors"
            >
              Publicar mi herramienta
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
