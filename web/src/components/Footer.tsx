import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#F97316] text-white/80 pt-12 pb-6 px-6 mt-auto">
      <div className="max-w-[1320px] mx-auto">
        {/* Grid principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10 text-center sm:text-left">
          {/* Logo y descripción */}
          <div className="flex flex-col items-center sm:items-start">
            <Link href="/" className="font-bold text-2xl text-white">
              ei<span className="text-white/60">tool</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white font-medium">
              Plataforma de alquiler de herramientas entre particulares. Alquila lo que necesitas o gana dinero con lo que ya tienes.
            </p>
          </div>

          {/* Links útiles */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Plataforma
            </h3>
            <ul className="space-y-2 text-sm font-semibold">
              <li>
                <Link href="/herramientas" className="hover:text-white transition-colors">
                  Explorar herramientas
                </Link>
              </li>
              <li>
                <Link href="/herramientas/nueva" className="hover:text-white transition-colors">
                  Publicar herramienta
                </Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="hover:text-white transition-colors">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link href="/sobre-nosotros" className="hover:text-white transition-colors">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-white transition-colors">
                  Contáctanos
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2 text-sm font-semibold">
              <li>
                <Link href="/terminos" className="hover:text-white transition-colors">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-white transition-colors">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} eitool. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
