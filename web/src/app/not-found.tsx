import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Número 404 */}
        <h1 className="text-[120px] font-black text-[#F97316] leading-none">
          404
        </h1>

        {/* Icono herramienta */}
        <div className="flex justify-center my-4">
          <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Página no encontrada
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Parece que esta herramienta se ha perdido. La página que buscas no existe o ha sido movida.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Volver al inicio
          </Link>
          <Link
            href="/herramientas"
            className="border-2 border-[#F97316] text-[#F97316] hover:bg-orange-50 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Ver herramientas
          </Link>
        </div>
      </div>
    </main>
  );
}
