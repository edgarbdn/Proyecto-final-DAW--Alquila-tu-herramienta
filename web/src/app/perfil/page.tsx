"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

type UserProfile = {
  nombre: string;
  apellidos: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  direccion_publica: string;
  avatar_url: string;
};

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile>({
    nombre: "",
    apellidos: "",
    telefono: "",
    ciudad: "",
    direccion: "",
    direccion_publica: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select(
          "nombre, apellidos, telefono, ciudad, direccion, direccion_publica, avatar_url",
        )
        .eq("id", user.id)
        .single();

      if (error) {
        setError("Error al cargar el perfil");
        return;
      }

      setProfile({
        nombre: data.nombre ?? "",
        apellidos: data.apellidos ?? "",
        telefono: data.telefono ?? "",
        ciudad: data.ciudad ?? "",
        direccion: data.direccion ?? "",
        direccion_publica: data.direccion_publica ?? "",
        avatar_url: data.avatar_url ?? "",
      });
    }

    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({
        nombre: profile.nombre,
        apellidos: profile.apellidos,
        telefono: profile.telefono,
        ciudad: profile.ciudad,
        direccion: profile.direccion,
        direccion_publica: profile.direccion_publica,
      })
      .eq("id", user.id);

    if (error) {
      setError("Error al guardar los cambios");
    } else {
      setSuccess("Perfil actualizado correctamente");
    }

    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  }

  return (
    <div>
      <h1>Mi perfil</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre</label>
          <input name="nombre" value={profile.nombre} onChange={handleChange} />
        </div>
        <div>
          <label>Apellidos</label>
          <input
            name="apellidos"
            value={profile.apellidos}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Teléfono</label>
          <input
            name="telefono"
            value={profile.telefono}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Ciudad</label>
          <input name="ciudad" value={profile.ciudad} onChange={handleChange} />
        </div>
        <div>
          <label>Dirección privada</label>
          <input
            name="direccion"
            value={profile.direccion}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Dirección pública (para publicar herramientas)</label>
          <input
            name="direccion_publica"
            value={profile.direccion_publica}
            onChange={handleChange}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
