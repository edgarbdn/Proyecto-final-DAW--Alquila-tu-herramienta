"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PagoExitoso() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/mis-alquileres?pago=exitoso");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago completado!</h1>
        <p className="text-gray-500 text-sm">Redirigiendo a tus alquileres...</p>
        <div className="mt-4 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
