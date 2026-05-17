export default function SobreNosotrosPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Sobre nosotros</h1>
      <p className="text-gray-500 text-sm mb-10">Conoce el proyecto detrás de eitool</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">¿Qué es eitool?</h2>
          <p>
            eitool es una plataforma de alquiler de herramientas entre particulares. Nació con una idea
            simple: hay millones de herramientas en casas y garajes que solo se usan unos pocos días al año.
            Al mismo tiempo, muchas personas necesitan una herramienta puntualmente y no quieren comprarla.
          </p>
          <p className="mt-3">
            eitool conecta a ambos. El propietario gana dinero con lo que ya tiene, y el que necesita
            la herramienta la consigue cerca, rápido y a un precio justo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">¿Cómo funciona?</h2>
          <p>
            Cualquier usuario puede publicar sus herramientas en la plataforma fijando su precio por día.
            Otros usuarios pueden buscar, reservar y recoger la herramienta directamente con el propietario.
            eitool gestiona el pago y cobra una pequeña comisión por cada transacción completada.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nuestros valores</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Economía colaborativa y sostenible</li>
            <li>Confianza entre usuarios</li>
            <li>Sencillez y transparencia</li>
            <li>Apoyo a la comunidad local</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contacto</h2>
          <p>
            Para cualquier consulta puedes escribirnos a{" "}
            <a href="mailto:hola@eitool.es" className="text-[#F97316] hover:underline">
              hola@eitool.es
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
