export default function ContactoPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contáctanos</h1>
      <p className="text-gray-500 text-sm mb-10">
        ¿Tienes alguna duda o sugerencia? Estamos aquí para ayudarte.
      </p>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Nombre
          </label>
          <input
            type="text"
            placeholder="Tu nombre"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="tu@email.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Asunto
          </label>
          <input
            type="text"
            placeholder="¿En qué podemos ayudarte?"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Mensaje
          </label>
          <textarea
            rows={5}
            placeholder="Escribe tu mensaje aquí..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400 resize-none"
          />
        </div>

        <button
          type="button"
          className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 rounded-xl transition-colors duration-200"
        >
          Enviar mensaje
        </button>

        <p className="text-center text-sm text-gray-400">
          También puedes escribirnos directamente a{" "}
          <a
            href="mailto:hola@eitool.es"
            className="text-[#F97316] hover:underline"
          >
            hola@eitool.es
          </a>
        </p>
      </div>
    </main>
  );
}
