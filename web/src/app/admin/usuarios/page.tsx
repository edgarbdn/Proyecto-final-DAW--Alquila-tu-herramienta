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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

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
        prev.map((u) => (u.id === usuarioId ? { ...u, rol: nuevoRol } : u)),
      );
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Usuarios</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Ciudad</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-gray-700">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {u.nombre} {u.apellidos}
                  </td>
                  <td className="px-4 py-3">{u.ciudad ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        u.rol === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(u.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.rol}
                      onChange={(e) => handleRol(u.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
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
      )}
    </main>
  );
}
