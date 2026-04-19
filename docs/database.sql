CREATE TYPE "rol_enum" AS ENUM (
  'cliente',
  'vendedor',
  'admin'
);

CREATE TYPE "estado_alquiler" AS ENUM (
  'pendiente',
  'confirmado',
  'activo',
  'finalizado',
  'cancelado'
);

CREATE TYPE "estado_pago" AS ENUM (
  'pendiente',
  'completado',
  'fallido',
  'reembolsado'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "email" varchar UNIQUE NOT NULL,
  "nombre" varchar NOT NULL,
  "apellidos" varchar NOT NULL,
  "rol" rol_enum NOT NULL DEFAULT 'cliente',
  "telefono" varchar,
  "ciudad" varchar,
  "direccion" varchar,
  "direccion_publica" varchar,
  "avatar_url" varchar,
  "created_at" timestamp DEFAULT (now())
);

-- Trigger para crear el perfil automáticamente cuando alguien se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nombre, apellidos, rol)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre', ''),
    COALESCE(new.raw_user_meta_data->>'apellidos', ''),
    COALESCE((new.raw_user_meta_data->>'rol')::rol_enum, 'cliente')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE "categorias" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "nombre" varchar UNIQUE NOT NULL,
  "descripcion" varchar,
  "icono_url" varchar,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "herramientas" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "vendedor_id" uuid NOT NULL REFERENCES users(id),
  "categoria_id" uuid NOT NULL REFERENCES categorias(id),
  "nombre" varchar NOT NULL,
  "descripcion" text,
  "precio_dia" decimal NOT NULL,
  "disponible" boolean DEFAULT true,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "fotos" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "herramienta_id" uuid NOT NULL REFERENCES herramientas(id),
  "url" varchar NOT NULL,
  "es_principal" boolean DEFAULT false,
  "orden" int DEFAULT 0,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "alquileres" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "herramienta_id" uuid NOT NULL REFERENCES herramientas(id),
  "cliente_id" uuid NOT NULL REFERENCES users(id),
  "fecha_inicio" date NOT NULL,
  "fecha_fin" date NOT NULL,
  "dias" int NOT NULL,
  "precio_dia" decimal NOT NULL,
  "comision_plataforma" decimal NOT NULL,
  "precio_final" decimal NOT NULL,
  "estado" estado_alquiler NOT NULL DEFAULT 'pendiente',
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "valoraciones" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "alquiler_id" uuid NOT NULL REFERENCES alquileres(id),
  "autor_id" uuid NOT NULL REFERENCES users(id),
  "destinatario_id" uuid NOT NULL REFERENCES users(id),
  "nota" int NOT NULL CHECK (nota >= 1 AND nota <= 5),
  "comentario" text,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "pagos" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "alquiler_id" uuid NOT NULL REFERENCES alquileres(id),
  "importe" decimal NOT NULL,
  "estado" estado_pago NOT NULL DEFAULT 'pendiente',
  "metodo" varchar,
  "transaccion_id" varchar,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "descuentos" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "herramienta_id" uuid NOT NULL REFERENCES herramientas(id),
  "dias_minimos" int NOT NULL,
  "porcentaje" decimal NOT NULL,
  "activo" boolean DEFAULT true,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "notificaciones" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "usuario_id" uuid NOT NULL REFERENCES users(id),
  "titulo" varchar NOT NULL,
  "mensaje" text NOT NULL,
  "leida" boolean DEFAULT false,
  "created_at" timestamp DEFAULT (now())
);
