import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente con SERVICE_ROLE (saltar RLS, crear usuarios, etc.)
export function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Cliente con ANON KEY (como un usuario normal)
export function getAnonClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Login y devuelve el access_token para usar en Authorization header
export async function loginAndGetToken(
  email: string,
  password: string,
): Promise<{ token: string; userId: string }> {
  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    throw new Error(`Login fallido para ${email}: ${error?.message}`);
  }
  return {
    token: data.session.access_token,
    userId: data.user.id,
  };
}
