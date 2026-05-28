"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";
import { useSearchParams } from "next/navigation";

type UserProfile = {
  nombre: string;
  apellidos: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  direccion_publica: string;
  avatar_url: string;
};

function PerfilContent() {
  const searchParams = useSearchParams();
  const completar = searchParams.get("completar") === "true";
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
      {/* Banner perfil incompleto */}
      {completar && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-orange-800">Completa tu perfil para publicar herramientas</p>
            <p className="text-xs text-orange-600 mt-0.5">Necesitas rellenar teléfono, ciudad, dirección privada y dirección pública antes de publicar.</p>
          </div>
        </div>
      )}
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
          <label className="absolute bottom-0 right-0 w-6 h-6 bg-[#F97316] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#EA580C] transition-colors" aria-label="Cambiar foto de perfil">
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
            <label htmlFor="nombre" className="text-sm font-medium text-gray-700 block mb-1">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              value={profile.nombre}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
            />
          </div>
          <div>
            <label htmlFor="apellidos" className="text-sm font-medium text-gray-700 block mb-1">
              Apellidos
            </label>
            <input
              id="apellidos"
              name="apellidos"
              value={profile.apellidos}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="telefono" className="text-sm font-medium text-gray-700 block mb-1">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            value={profile.telefono}
            onChange={handleChange}
            placeholder="+34 600 000 000"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        <div>
          <label htmlFor="ciudad" className="text-sm font-medium text-gray-700 block mb-1">
            Ciudad
          </label>
          <input
            id="ciudad"
            name="ciudad"
            value={profile.ciudad}
            onChange={handleChange}
            placeholder="Barcelona"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Dirección privada</p>
              <p className="text-xs text-gray-400">Solo la ve el equipo de <span className="font-semibold text-gray-600">Eitool</span>. Nunca se muestra públicamente.</p>
            </div>
          </div>
          <input
            id="direccion"
            name="direccion"
            value={profile.direccion}
            onChange={handleChange}
            placeholder="Calle, número, piso..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Dirección pública</p>
              <p className="text-xs text-gray-400">Visible para quienes alquilen tus herramientas. Usa una zona aproximada, no tu dirección exacta.</p>
            </div>
          </div>
          <input
            id="direccion_publica"
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

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>}>
      <PerfilContent />
    </Suspense>
  );
}
