"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

type Stats = {
  totalUsuarios: number;
  totalHerramientas: number;
  totalAlquileres: number;
  totalIngresos: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (res.ok) setStats(data);
    setLoading(false);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        Panel de administración
      </h1>

      {/* Estadísticas */}
      {loading ? (
        <p className="text-gray-500">Cargando estadísticas...</p>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border rounded-lg p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalUsuarios}
            </p>
            <p className="text-sm text-gray-500 mt-1">Usuarios</p>
          </div>
          <div className="bg-white border rounded-lg p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalHerramientas}
            </p>
            <p className="text-sm text-gray-500 mt-1">Herramientas</p>
          </div>
          <div className="bg-white border rounded-lg p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalAlquileres}
            </p>
            <p className="text-sm text-gray-500 mt-1">Alquileres</p>
          </div>
          <div className="bg-white border rounded-lg p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">
              {stats.totalIngresos.toFixed(2)}€
            </p>
            <p className="text-sm text-gray-500 mt-1">Ingresos totales</p>
          </div>
        </div>
      ) : null}

      {/* Navegación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/usuarios"
          className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="font-bold text-gray-800 text-lg mb-1">Usuarios</h2>
          <p className="text-sm text-gray-500">Gestiona usuarios y roles</p>
        </Link>
        <Link
          href="/admin/herramientas"
          className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="font-bold text-gray-800 text-lg mb-1">Herramientas</h2>
          <p className="text-sm text-gray-500">
            Listado de herramientas publicadas
          </p>
        </Link>
        <Link
          href="/admin/alquileres"
          className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="font-bold text-gray-800 text-lg mb-1">Alquileres</h2>
          <p className="text-sm text-gray-500">
            Listado de todos los alquileres
          </p>
        </Link>
      </div>
    </main>
  );
}
