"use client";

//Recordar que tengo el Confirm Email de Supabase desactivado para poder crear cuentas

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, apellidos } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/herramientas");
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-gray-900">
            ei<span className="text-[#F97316]">tool</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Crea tu cuenta gratis</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Nombre
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Apellidos
              </label>
              <input
                type="text"
                placeholder="Tus apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        {/* Login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-[#F97316] font-semibold hover:text-[#EA580C] transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
