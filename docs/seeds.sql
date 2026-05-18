-- Seeds: datos de prueba iniciales

-- Categorías predefinidas por la plataforma
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Construcción', 'Herramientas para obras y construcción'),
  ('Jardín', 'Herramientas para jardinería y exterior'),
  ('Electricidad', 'Herramientas eléctricas y de fontanería'),
  ('Pintura', 'Herramientas para pintar y decorar'),
  ('Limpieza', 'Máquinas y herramientas de limpieza'),
  ('Automoción', 'Herramientas para vehículos'),
  ('Medición', 'Herramientas de medición y topografía'),
  ('Soldadura', 'Equipos de soldadura y corte');

-- =============================================
-- USUARIOS (creados previamente en Supabase Auth)
-- vendedor1: f576164e-f9bc-478b-b768-a0beb54a6d64
-- vendedor2: 13559337-2ecd-4433-837f-1a850215c62d
-- cliente1:  3e454712-b3e5-47ec-bbb8-87546c18d8cb
-- cliente2:  fa8390d6-c23a-46d4-ba16-dc230735cdb1
-- =============================================

UPDATE users SET
  nombre = 'Carlos',
  apellidos = 'Martínez López',
  telefono = '612345678',
  ciudad = 'Barcelona',
  direccion = 'Calle Mayor 12, 3º 2ª',
  direccion_publica = 'Zona Eixample, Barcelona'
WHERE id = 'f576164e-f9bc-478b-b768-a0beb54a6d64';

UPDATE users SET
  nombre = 'María',
  apellidos = 'García Fernández',
  telefono = '623456789',
  ciudad = 'Madrid',
  direccion = 'Avenida de la Paz 45, 1º A',
  direccion_publica = 'Zona Retiro, Madrid'
WHERE id = '13559337-2ecd-4433-837f-1a850215c62d';

UPDATE users SET
  nombre = 'Juan',
  apellidos = 'Pérez Sánchez',
  telefono = '634567890',
  ciudad = 'Valencia',
  direccion = 'Calle del Mar 8, 2º B'
WHERE id = '3e454712-b3e5-47ec-bbb8-87546c18d8cb';

UPDATE users SET
  nombre = 'Ana',
  apellidos = 'López Ruiz',
  telefono = '645678901',
  ciudad = 'Sevilla',
  direccion = 'Plaza de España 3, 4º C'
WHERE id = 'fa8390d6-c23a-46d4-ba16-dc230735cdb1';

-- =============================================
-- HERRAMIENTAS (3 por vendedor)
-- =============================================

INSERT INTO herramientas (id, vendedor_id, categoria_id, nombre, descripcion, precio_dia, disponible) VALUES
  -- Carlos (vendedor1) - Construcción, Electricidad, Jardín
  ('a1000001-0000-0000-0000-000000000001', 'f576164e-f9bc-478b-b768-a0beb54a6d64', '43bca606-4f0e-426d-bf68-17dbf9320599', 'Martillo perforador Bosch', 'Martillo perforador profesional 800W con maletín y juego de brocas. Ideal para obra.', 15.00, true),
  ('a1000001-0000-0000-0000-000000000002', 'f576164e-f9bc-478b-b768-a0beb54a6d64', '4b7ef2f4-2989-49f1-8853-4afc6886d7bc', 'Taladro eléctrico DeWalt', 'Taladro percutor 1010W con maletín y juego de brocas y puntas. Perfecto para bricolaje.', 10.00, true),
  ('a1000001-0000-0000-0000-000000000003', 'f576164e-f9bc-478b-b768-a0beb54a6d64', '39697a50-e07d-453b-bed7-ee5c9f902945', 'Cortacésped Honda', 'Cortacésped autopropulsado con recogedor. Motor Honda 4 tiempos. Ancho de corte 46cm.', 25.00, true),

  -- María (vendedor2) - Limpieza, Pintura, Soldadura
  ('a1000001-0000-0000-0000-000000000004', '13559337-2ecd-4433-837f-1a850215c62d', '541ad604-12a4-4684-9f17-8f4cf7d2570f', 'Hidrolimpiadora Kärcher K5', 'Hidrolimpiadora de alta presión 145 bar. Incluye lanza, pistola y cepillo.', 20.00, true),
  ('a1000001-0000-0000-0000-000000000005', '13559337-2ecd-4433-837f-1a850215c62d', '2e6180b7-0351-4a5c-a6de-9783bc9e74c8', 'Pistola de pintura Wagner', 'Pistola de pintura eléctrica con deposito 800ml. Ideal para paredes y muebles.', 12.00, true),
  ('a1000001-0000-0000-0000-000000000006', '13559337-2ecd-4433-837f-1a850215c62d', 'eb1c8c31-7a8b-4cee-aa0e-d7a1ec456520', 'Soldadora inverter 160A', 'Soldadora inverter profesional 160A con máscara, guantes y electrodos incluidos.', 30.00, true);

-- =============================================
-- FOTOS
-- =============================================

INSERT INTO fotos (herramienta_id, url, es_principal, orden) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800', true, 0),
  ('a1000001-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800', true, 0),
  ('a1000001-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', true, 0),
  ('a1000001-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', true, 0),
  ('a1000001-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800', true, 0),
  ('a1000001-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', true, 0);

-- =============================================
-- DESCUENTOS
-- =============================================

INSERT INTO descuentos (herramienta_id, dias_minimos, porcentaje, activo) VALUES
  ('a1000001-0000-0000-0000-000000000001', 3, 10.00, true),
  ('a1000001-0000-0000-0000-000000000001', 7, 20.00, true),
  ('a1000001-0000-0000-0000-000000000003', 5, 15.00, true),
  ('a1000001-0000-0000-0000-000000000004', 3, 10.00, true),
  ('a1000001-0000-0000-0000-000000000006', 3, 10.00, true);

-- =============================================
-- ALQUILERES
-- =============================================

INSERT INTO alquileres (id, herramienta_id, cliente_id, fecha_inicio, fecha_fin, dias, precio_dia, comision_plataforma, precio_final, estado) VALUES
  -- Juan alquila martillo perforador (activo/pagado)
  ('b1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', '3e454712-b3e5-47ec-bbb8-87546c18d8cb', '2026-05-01', '2026-05-04', 3, 15.00, 0.20, 40.50, 'activo'),
  -- Ana alquila hidrolimpiadora (confirmado, pendiente de pago)
  ('b1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000004', 'fa8390d6-c23a-46d4-ba16-dc230735cdb1', '2026-05-10', '2026-05-12', 2, 20.00, 0.20, 32.00, 'confirmado'),
  -- Juan alquila cortacésped (pendiente)
  ('b1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003', '3e454712-b3e5-47ec-bbb8-87546c18d8cb', '2026-05-15', '2026-05-17', 2, 25.00, 0.20, 40.00, 'pendiente'),
  -- Ana alquila taladro (finalizado)
  ('b1000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000002', 'fa8390d6-c23a-46d4-ba16-dc230735cdb1', '2026-04-20', '2026-04-22', 2, 10.00, 0.20, 16.00, 'finalizado'),
  -- Juan alquila pistola de pintura (cancelado)
  ('b1000001-0000-0000-0000-000000000005', 'a1000001-0000-0000-0000-000000000005', '3e454712-b3e5-47ec-bbb8-87546c18d8cb', '2026-05-08', '2026-05-09', 1, 12.00, 0.20, 9.60, 'cancelado');

-- =============================================
-- PAGOS
-- =============================================

INSERT INTO pagos (alquiler_id, importe, estado, metodo, transaccion_id) VALUES
  ('b1000001-0000-0000-0000-000000000001', 40.50, 'completado', 'tarjeta', 'pi_seed_0000000001'),
  ('b1000001-0000-0000-0000-000000000004', 16.00, 'completado', 'tarjeta', 'pi_seed_0000000004');

-- =============================================
-- NOTIFICACIONES
-- =============================================

INSERT INTO notificaciones (usuario_id, titulo, mensaje, leida) VALUES
  ('f576164e-f9bc-478b-b768-a0beb54a6d64', 'Nueva solicitud de alquiler', 'Juan Pérez ha solicitado alquilar tu "Cortacésped Honda".', false),
  ('3e454712-b3e5-47ec-bbb8-87546c18d8cb', 'Alquiler confirmado', 'Tu solicitud de alquiler para "Martillo perforador Bosch" ha sido confirmada.', true),
  ('fa8390d6-c23a-46d4-ba16-dc230735cdb1', 'Alquiler confirmado', 'Tu solicitud de alquiler para "Hidrolimpiadora Kärcher K5" ha sido confirmada.', false),
  ('3e454712-b3e5-47ec-bbb8-87546c18d8cb', 'Pago completado', 'Tu pago se ha procesado correctamente. ¡Disfruta del alquiler!', true);
