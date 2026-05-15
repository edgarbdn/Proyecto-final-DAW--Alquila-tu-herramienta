"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

type ConfigItem = {
  clave: string;
  valor: string;
  descripcion: string;
};

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [valorTemp, setValorTemp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("configuracion")
      .select("clave, valor, descripcion")
      .order("clave");
    if (error) setError("Error al cargar la configuración");
    else setConfig(data ?? []);
    setLoading(false);
  }

  async function handleGuardar(clave: string) {
    setGuardando(true);
    setError("");
    setSuccess("");
    const supabase = createClient();
    const { error } = await supabase.from("configuracion").update({ valor: valorTemp }).eq("clave", clave);
    if (error) setError("Error al guardar");
    else {
      setSuccess("Configuración actualizada correctamente");
      setEditando(null);
      loadConfig();
    }
    setGuardando(false);
  }

  return (
    <div className="px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Ajustes generales de la plataforma</p>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
      {success && <p className="text-green-600 text-sm bg-green-50 px-4 py-3 rounded-xl">{success}</p>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {config.map((item) => (
            <div key={item.clave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.clave}</p>
                  <p className="text-sm text-gray-500">{item.descripcion}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {editando === item.clave ? (
                    <>
                      <input
                        value={valorTemp}
                        onChange={(e) => setValorTemp(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-32 outline-none focus:border-[#F97316] transition-colors"
                      />
                      <button
                        onClick={() => handleGuardar(item.clave)}
                        disabled={guardando}
                        className="bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {guardando ? "..." : "Guardar"}
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-gray-900">
                        {item.clave === "comision"
                          ? `${(parseFloat(item.valor) * 100).toFixed(0)}%`
                          : item.valor}
                      </span>
                      <button
                        onClick={() => { setEditando(item.clave); setValorTemp(item.valor); }}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
