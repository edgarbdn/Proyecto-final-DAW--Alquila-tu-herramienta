"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NotificationBell from "./NotificationBell";

type Sugerencia = {
  id: string;
  nombre: string;
};

export default function Navbar() {
  const [nombre, setNombre] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      const { data } = await supabase
        .from("users")
        .select("nombre, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) {
        setNombre(data.nombre);
        setAvatarUrl(data.avatar_url ?? null);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoggedIn(!!session);
        if (!session) { setNombre(null); setAvatarUrl(null); }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSugerencias(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleBusqueda(valor: string) {
    setBusqueda(valor);
    if (valor.length < 2) {
      setSugerencias([]);
      setShowSugerencias(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("herramientas")
      .select("id, nombre")
      .ilike("nombre", `%${valor}%`)
      .limit(5);

    setSugerencias(data ?? []);
    setShowSugerencias(true);
  }

  function handleSeleccion(herramienta: Sugerencia) {
    setBusqueda(herramienta.nombre);
    setShowSugerencias(false);
    setMenuAbierto(false);
    router.push(`/herramientas/${herramienta.id}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowSugerencias(false);
    setMenuAbierto(false);
    router.push(`/herramientas?nombre=${encodeURIComponent(busqueda)}`);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className="bg-white shadow-[0_2px_8px_rgba(249,115,22,0.3)] px-4 md:px-6 py-4 sticky top-0 z-50">
      {/* Fila principal */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="font-bold text-2xl text-gray-900 shrink-0">
          ei<span className="text-[#F97316]">tool</span>
        </Link>

        {/* Buscador — visible en md+ */}
        <div ref={searchRef} className="relative flex-1 max-w-xl mx-auto hidden md:block">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center bg-white border-2 border-[#F97316] rounded-full px-4 py-2.5 gap-2">
              <svg className="w-4 h-4 text-[#F97316] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => handleBusqueda(e.target.value)}
                placeholder="Busca herramientas..."
                className="bg-transparent flex-1 text-sm font-bold text-gray-900 outline-none placeholder-gray-500"
              />
            </div>
          </form>

          {showSugerencias && sugerencias.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              {sugerencias.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSeleccion(s)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {s.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Acciones desktop — visible en md+ */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {loggedIn ? (
            <>
              <Link href="/herramientas/nueva" className="text-sm font-semibold text-gray-700 hover:text-gray-900">
                Publicar
              </Link>
              <span className="text-gray-200">|</span>
              <Link href="/mis-herramientas" className="text-sm font-semibold text-gray-700 hover:text-gray-900">
                Mis herramientas
              </Link>
              <NotificationBell />
              <Link
                href="/perfil"
                className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" width={32} height={32} className="object-cover w-full h-full" />
                ) : (
                  nombre ? nombre[0].toUpperCase() : "?"
                )}
              </Link>
            </>
          ) : (
            <Link
              href="/register"
              className="bg-white text-black border-2 border-[#F97316] text-base font-semibold px-7 py-2 rounded-full hover:border-[#EA580C] transition-colors duration-500 whitespace-nowrap"
            >
              Regístrate o inicia sesión
            </Link>
          )}
        </div>

        {/* Acciones móvil — visible solo en móvil */}
        <div className="flex md:hidden items-center gap-2 ml-auto shrink-0">
          {loggedIn && <NotificationBell />}
          {loggedIn && (
            <Link
              href="/perfil"
              className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0"
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={32} height={32} className="object-cover w-full h-full" />
              ) : (
                nombre ? nombre[0].toUpperCase() : "?"
              )}
            </Link>
          )}
          {/* Hamburguesa */}
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            {menuAbierto ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <div className="md:hidden mt-3 flex flex-col gap-3 pb-2">
          {/* Buscador móvil */}
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => handleBusqueda(e.target.value)}
                  placeholder="Busca herramientas..."
                  className="bg-transparent flex-1 text-sm text-gray-700 outline-none placeholder-gray-400"
                />
              </div>
            </form>

            {showSugerencias && sugerencias.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                {sugerencias.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSeleccion(s)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {s.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Links móvil */}
          {loggedIn ? (
            <>
              <Link
                href="/herramientas/nueva"
                onClick={() => setMenuAbierto(false)}
                className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-1"
              >
                Publicar herramienta
              </Link>
              <Link
                href="/mis-herramientas"
                onClick={() => setMenuAbierto(false)}
                className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-1"
              >
                Mis herramientas
              </Link>
            </>
          ) : (
            <Link
              href="/register"
              onClick={() => setMenuAbierto(false)}
              className="w-full text-center bg-white text-black border-2 border-[#F97316] text-sm font-semibold px-6 py-2 rounded-full hover:border-[#EA580C] transition-colors duration-300"
            >
              Regístrate o inicia sesión
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
