export default function TerminosPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y condiciones</h1>
      <p className="text-gray-500 text-sm mb-10">Última actualización: mayo 2025</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Aceptación de los términos</h2>
          <p>
            Al acceder y usar eitool, aceptas quedar vinculado por estos términos y condiciones. Si no
            estás de acuerdo con alguna parte de los mismos, no debes usar la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Descripción del servicio</h2>
          <p>
            eitool es una plataforma que permite a los usuarios publicar herramientas para alquilar y
            alquilar herramientas de otros usuarios. eitool actúa como intermediario y no es propietario
            de ninguna de las herramientas publicadas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Registro y cuenta</h2>
          <p>
            Para usar ciertas funciones de la plataforma es necesario registrarse. El usuario es
            responsable de mantener la confidencialidad de sus credenciales y de toda la actividad
            realizada desde su cuenta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Publicación de herramientas</h2>
          <p>
            El propietario es responsable de que la información de sus herramientas sea veraz y de que
            estas estén en buen estado para el uso. eitool se reserva el derecho de retirar cualquier
            publicación que incumpla estas condiciones.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Pagos y comisiones</h2>
          <p>
            eitool cobra una comisión sobre cada transacción completada. El precio final que ve el
            arrendatario ya incluye dicha comisión. Los pagos se procesan de forma segura a través
            de Stripe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Responsabilidad</h2>
          <p>
            eitool no se hace responsable de los daños o pérdidas que puedan surgir del uso de las
            herramientas alquiladas a través de la plataforma. Los usuarios acuerdan entre sí las
            condiciones del alquiler y son responsables de su cumplimiento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Modificaciones</h2>
          <p>
            eitool se reserva el derecho de modificar estos términos en cualquier momento. Los cambios
            serán notificados a los usuarios registrados y entrarán en vigor a los 15 días de su
            publicación.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Contacto</h2>
          <p>
            Para cualquier consulta sobre estos términos puedes escribirnos a{" "}
            <a href="mailto:legal@eitool.es" className="text-[#F97316] hover:underline">
              legal@eitool.es
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
