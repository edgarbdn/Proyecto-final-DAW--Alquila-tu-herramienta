"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = "/";
      }
    });
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    //Aquí solo llamo a error ya que Supabase, cuando llamas a signInWithPassword, devuelve un objeto con data y error.
    //Data no se necesita ahora. Si rellena error, es que ha habido un error de login, si no, es null por defecto.

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Consultamos su rol en la tabla users
    const { data: perfil } = await supabase
      .from("users")
      .select("rol")
      .eq("id", user!.id)
      .single();

    if (perfil?.rol === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
