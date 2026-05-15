"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

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

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("configuracion")
      .select("clave, valor, descripcion")
      .order("clave");

    if (error) {
      setError("Error al cargar la configuración");
      return;
    }

    setConfig(data ?? []);
  }

  async function handleGuardar(clave: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("configuracion")
      .update({ valor: valorTemp })
      .eq("clave", clave);

    if (error) {
      setError("Error al guardar");
      return;
    }

    setSuccess("Configuración actualizada");
    setEditando(null);
    loadConfig();
  }

  return (
    <div>
      <h1>Configuración de la plataforma</h1>
      <Link href="/admin">← Volver al panel</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <table>
        <thead>
          <tr>
            <th>Clave</th>
            <th>Valor</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {config.map((item) => (
            <tr key={item.clave}>
              <td>{item.clave}</td>
              <td>
                {editando === item.clave ? (
                  <input
                    value={valorTemp}
                    onChange={(e) => setValorTemp(e.target.value)}
                  />
                ) : (
                  item.valor
                )}
              </td>
              <td>{item.descripcion}</td>
              <td>
                {editando === item.clave ? (
                  <>
                    <button onClick={() => handleGuardar(item.clave)}>
                      Guardar
                    </button>
                    <button onClick={() => setEditando(null)}>Cancelar</button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditando(item.clave);
                      setValorTemp(item.valor);
                    }}
                  >
                    Editar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
