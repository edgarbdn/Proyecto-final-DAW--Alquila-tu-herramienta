"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

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
  const [loadingProfile, setLoadingProfile] = useState(true);
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
      setLoadingProfile(false);
    }
    loadProfile();
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const extension = file.name.split(".").pop();
    const fileName = `${user.id}/avatar.${extension}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (error) {
      setError("Error al subir el avatar");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    await supabase
      .from("users")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);
    setProfile((prev) => ({ ...prev, avatar_url: data.publicUrl }));
  }

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

    if (error) setError("Error al guardar los cambios");
    else setSuccess("Perfil actualizado correctamente");
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  }

  if (loadingProfile) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      {/* Cabecera */}
      <div className="text-center mb-8">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div className="w-20 h-20 rounded-full bg-[#F97316] flex items-center justify-center text-white text-3xl font-bold overflow-hidden mx-auto">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              (profile.nombre?.[0]?.toUpperCase() ?? "?")
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-6 h-6 bg-[#F97316] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#EA580C] transition-colors">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
              />
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          {profile.nombre} {profile.apellidos}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Mi perfil</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre y apellidos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nombre
            </label>
            <input
              name="nombre"
              value={profile.nombre}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Apellidos
            </label>
            <input
              name="apellidos"
              value={profile.apellidos}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Teléfono
          </label>
          <input
            name="telefono"
            value={profile.telefono}
            onChange={handleChange}
            placeholder="+34 600 000 000"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Ciudad
          </label>
          <input
            name="ciudad"
            value={profile.ciudad}
            onChange={handleChange}
            placeholder="Barcelona"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Dirección privada
          </label>
          <input
            name="direccion"
            value={profile.direccion}
            onChange={handleChange}
            placeholder="Calle, número, piso..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Dirección pública
            <span className="ml-1 text-xs text-gray-400 font-normal">
              (visible para quienes alquilen tus herramientas)
            </span>
          </label>
          <input
            name="direccion_publica"
            value={profile.direccion_publica}
            onChange={handleChange}
            placeholder="Barrio o zona aproximada"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-600 text-sm bg-green-50 px-4 py-3 rounded-xl">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>

        <LogoutButton />
      </form>
    </div>
  );
}
