"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import LogoutButton from "@/components/LogoutButton";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    //Uso el onAuthStateChange como listener, se queda escuchando en todo momento y cada vez que cambia el estado de autenticación, se ejecuta el callback.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      <main>
        <h1>Página pruebas - Home</h1>
        {user ? (
          <div>
            <p>Bienvenido, {user.user_metadata.nombre}</p>
            <LogoutButton />
          </div>
        ) : (
          <p>
            No has iniciado sesión. <a href="/login">Inicia sesión</a>
          </p>
        )}
      </main>
    </div>
  );
}
