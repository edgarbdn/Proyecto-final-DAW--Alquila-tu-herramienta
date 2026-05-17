import Image from "next/image";
import Link from "next/link";
import PalabraAnimada from "@/components/PalabraAnimada";
import ComoFunciona from "@/components/ComoFunciona";
import HerramientasDestacadas from "@/components/HerramientasDestacadas";

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#F97316] flex items-center overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Texto */}
          <div className="flex-1 py-12 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Alquila y publica <br />
              <PalabraAnimada /> <br />
              cerca de ti.
            </h1>
            <p className="text-white/80 text-base sm:text-lg mb-8 max-w-md mx-auto md:mx-0">
              Encuentra la herramienta que necesitas o gana dinero alquilando
              las tuyas.
            </p>
            <div className="flex gap-3 flex-wrap justify-center md:justify-start">
               <Link
                href="/herramientas"
                className="inline-flex items-center gap-2 bg-white text-[#F97316] font-semibold px-6 py-3 rounded-full hover:bg-orange-50 transition-colors"
              >
                Ver herramientas
              </Link>
              <Link
                href="/herramientas/nueva"
                className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                Publicar la mía
              </Link>
            </div>
          </div>

          {/* Imagen — oculta en móvil, visible desde md */}
          <div className="hidden md:flex flex-1 justify-center items-end self-end h-[500px] relative">
            <Image
              src="/hero2.png"
              alt="Herramientas"
              fill
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </section>

      <ComoFunciona />
      <HerramientasDestacadas />
    </main>
  );
}
