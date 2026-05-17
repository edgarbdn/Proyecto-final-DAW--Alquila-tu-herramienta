"use client";

import { useState, useEffect } from "react";

const PALABRAS = [
  "lijadoras",
  "pulidoras",
  "soldadores",
  "cortacéspedes",
  "herramientas",
];

export default function PalabraAnimada() {
  const [indice, setIndice] = useState(0);
  const [animando, setAnimando] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAnimando(true);
      setTimeout(() => {
        setIndice((i) => (i + 1) % PALABRAS.length);
        setAnimando(false);
      }, 400);
    }, 2500);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <span
      className="inline-block overflow-hidden align-bottom"
      style={{ width: "7em" }}
    >
      <span
        className="inline-block text-white/80 transition-transform duration-400"
        style={{
          transform: animando ? "translateY(-100%)" : "translateY(0%)",
        }}
      >
        {PALABRAS[indice]}
      </span>
    </span>
  );
}
