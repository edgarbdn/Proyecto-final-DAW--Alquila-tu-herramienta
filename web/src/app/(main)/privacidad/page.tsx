export default function PrivacidadPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de privacidad</h1>
      <p className="text-gray-500 text-sm mb-10">Última actualización: mayo 2025</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de los datos personales recogidos en eitool es el titular
            de la plataforma. Para cualquier consulta relacionada con la privacidad puedes contactar
            en{" "}
            <a href="mailto:privacidad@eitool.es" className="text-[#F97316] hover:underline">
              privacidad@eitool.es
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Datos que recogemos</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Nombre y apellidos</li>
            <li>Dirección de correo electrónico</li>
            <li>Número de teléfono (opcional)</li>
            <li>Ciudad y dirección (para publicar herramientas)</li>
            <li>Datos de pago procesados por Stripe (no almacenamos datos de tarjeta)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Finalidad del tratamiento</h2>
          <p>Usamos tus datos para:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
            <li>Gestionar tu cuenta y acceso a la plataforma</li>
            <li>Procesar reservas y pagos</li>
            <li>Comunicarte información relevante sobre tus alquileres</li>
            <li>Mejorar el servicio y la experiencia de usuario</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Base legal</h2>
          <p>
            El tratamiento de tus datos se basa en la ejecución del contrato de uso de la plataforma
            y, en su caso, en tu consentimiento expreso para comunicaciones opcionales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Conservación de datos</h2>
          <p>
            Tus datos se conservarán mientras mantengas una cuenta activa en eitool. Tras la
            cancelación de la cuenta, los datos se eliminarán en un plazo máximo de 30 días, salvo
            obligación legal de conservación.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Tus derechos</h2>
          <p>Tienes derecho a:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
            <li>Acceder a tus datos personales</li>
            <li>Rectificar datos inexactos</li>
            <li>Solicitar la eliminación de tus datos</li>
            <li>Oponerte al tratamiento</li>
            <li>Solicitar la portabilidad de tus datos</li>
          </ul>
          <p className="mt-3">
            Para ejercer estos derechos escríbenos a{" "}
            <a href="mailto:privacidad@eitool.es" className="text-[#F97316] hover:underline">
              privacidad@eitool.es
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Cookies</h2>
          <p>
            eitool utiliza cookies técnicas necesarias para el funcionamiento de la plataforma,
            como las de sesión de autenticación. No utilizamos cookies de seguimiento ni publicidad.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Terceros</h2>
          <p>
            Utilizamos Supabase para la gestión de autenticación y base de datos, y Stripe para el
            procesamiento de pagos. Ambos proveedores cumplen con el RGPD y tienen sus propias
            políticas de privacidad.
          </p>
        </section>
      </div>
    </main>
  );
}
