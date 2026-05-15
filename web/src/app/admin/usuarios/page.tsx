"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Usuario = {
  id: string;
  nombre: string;
  apellidos: string;
  ciudad: string;
  rol: string;
  created_at: string;
};

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        loadUsuarios(session.access_token);
      }
    });
  }, []);

  async function loadUsuarios(t: string) {
    setLoading(true);
    const res = await fetch("/api/admin/usuarios", {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) setUsuarios(data.usuarios ?? []);
    else setError(data.error);
    setLoading(false);
  }

  async function handleRol(usuarioId: string, nuevoRol: string) {
    if (!token) return;
    setCambiando(usuarioId);
    const res = await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ usuario_id: usuarioId, rol: nuevoRol }),
    });
    if (res.ok) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuarioId ? { ...u, rol: nuevoRol } : u))
      );
    }
    setCambiando(null);
  }

  return (
    <div className="px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona los usuarios y sus roles</p>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ciudad</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cambiar rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.nombre[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{u.nombre} {u.apellidos}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{u.ciudad ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        u.rol === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.rol === "admin" ? "bg-purple-500" : "bg-gray-400"}`} />
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={u.rol}
                        onChange={(e) => handleRol(u.id, e.target.value)}
                        disabled={cambiando === u.id}
                        className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#F97316] transition-colors disabled:opacity-50 bg-white"
                      >
                        <option value="usuario">usuario</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {usuarios.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">No hay usuarios registrados</p>
          )}
        </div>
      )}
    </div>
  );
}
