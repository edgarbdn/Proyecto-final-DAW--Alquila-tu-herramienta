"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Stats = {
  totalUsuarios: number;
  totalHerramientas: number;
  totalAlquileres: number;
  totalIngresos: number;
};

type PuntoGrafico = {
  fecha: string;
  alquileres: number;
  ingresos: number;
  comision: number;
};

type CategoriaGrafico = {
  nombre: string;
  total: number;
};

type Periodo = "dia" | "mes" | "año" | "rango";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "dia", label: "Últimos 30 días" },
  { value: "mes", label: "Últimos 12 meses" },
  { value: "año", label: "Por año" },
  { value: "rango", label: "Rango personalizado" },
];

const STAT_CARDS = [
  {
    key: "totalUsuarios",
    label: "Usuarios",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: (
      <svg
        className="w-5 h-5 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
  {
    key: "totalHerramientas",
    label: "Herramientas",
    color: "text-orange-600",
    bg: "bg-orange-50",
    icon: (
      <svg
        className="w-5 h-5 text-orange-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
        />
      </svg>
    ),
  },
  {
    key: "totalAlquileres",
    label: "Alquileres",
    color: "text-purple-600",
    bg: "bg-purple-50",
    icon: (
      <svg
        className="w-5 h-5 text-purple-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
        />
      </svg>
    ),
  },
  {
    key: "totalIngresos",
    label: "Ingresos (comisiones)",
    color: "text-green-600",
    bg: "bg-green-50",
    esMoney: true,
    icon: (
      <svg
        className="w-5 h-5 text-green-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
        />
      </svg>
    ),
  },
];

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [graficoPrincipal, setGraficoPrincipal] = useState<PuntoGrafico[]>([]);
  const [graficoCategorias, setGraficoCategorias] = useState<
    CategoriaGrafico[]
  >([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingGraficos, setLoadingGraficos] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [token, setToken] = useState<string | null>(null);

  // Obtener token una sola vez
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setToken(session.access_token);
    });
  }, []);

  // Cargar stats
  useEffect(() => {
    if (!token) return;
    setLoadingStats(true);
    fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoadingStats(false);
      });
  }, [token]);

  // Cargar gráficos
  const cargarGraficos = useCallback(async () => {
    if (!token) return;
    setLoadingGraficos(true);

    const params = new URLSearchParams({ periodo });
    if (periodo === "rango" && desde && hasta) {
      params.set("desde", desde);
      params.set("hasta", hasta);
    }

    const res = await fetch(`/api/admin/graficos?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setGraficoPrincipal(data.graficoPrincipal ?? []);
    setGraficoCategorias(data.graficoCategorias ?? []);
    setLoadingGraficos(false);
  }, [token, periodo, desde, hasta]);

  useEffect(() => {
    if (periodo !== "rango") cargarGraficos();
  }, [token, periodo]);

  function formatearFecha(fecha: string) {
    if (fecha.length === 4) return fecha; // año
    if (fecha.length === 7) {
      const [y, m] = fecha.split("-");
      return `${["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][parseInt(m) - 1]} ${y}`;
    }
    // día
    const d = new Date(fecha);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  const datosFormateados = graficoPrincipal.map((p) => ({
    ...p,
    fecha: formatearFecha(p.fecha),
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((card) => (
            <div
              key={card.key}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div
                className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center text-xl mb-3`}
              >
                {card.icon}
              </div>
              {loadingStats ? (
                <div className="h-8 bg-gray-100 rounded animate-pulse mb-1" />
              ) : (
                <p className={`text-2xl sm:text-3xl font-bold ${card.color}`}>
                  {card.esMoney
                    ? `${(stats as any)?.[card.key]?.toFixed(2) ?? "0.00"}€`
                    : ((stats as any)?.[card.key] ?? 0)}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* Selector de período */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-sm font-semibold text-gray-700 shrink-0">
              Ver datos por:
            </span>
            <div className="flex flex-wrap gap-2">
              {PERIODOS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriodo(p.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    periodo === p.value
                      ? "bg-[#F97316] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* Date pickers para rango */}
            {periodo === "rango" && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#F97316]"
                />
                <span className="text-gray-400 text-sm">→</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#F97316]"
                />
                <button
                  onClick={cargarGraficos}
                  disabled={!desde || !hasta}
                  className="bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de alquileres e ingresos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alquileres — Simple Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              Alquileres
            </h2>
            {loadingGraficos ? (
              <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
            ) : datosFormateados.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                Sin datos para este período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={datosFormateados}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="alquileres"
                    fill="#F97316"
                    radius={[4, 4, 0, 0]}
                    name="Alquileres"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Ingresos — Stacked Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              Ingresos (€)
            </h2>
            {loadingGraficos ? (
              <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
            ) : datosFormateados.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                Sin datos para este período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={datosFormateados}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}€`} />
                  <Legend />
                  <Bar
                    dataKey="ingresos"
                    stackId="a"
                    fill="#22c55e"
                    radius={[0, 0, 0, 0]}
                    name="Vendedor"
                  />
                  <Bar
                    dataKey="comision"
                    stackId="a"
                    fill="#F97316"
                    radius={[4, 4, 0, 0]}
                    name="Comisión (20%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Herramientas por categoría — Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Herramientas por categoría
          </h2>
          {loadingGraficos ? (
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          ) : graficoCategorias.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={graficoCategorias}
                  dataKey="total"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {graficoCategorias.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        [
                          "#F97316",
                          "#FB923C",
                          "#FDBA74",
                          "#3B82F6",
                          "#8B5CF6",
                          "#22C55E",
                          "#EF4444",
                          "#EC4899",
                        ][i % 8]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} herramientas`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </main>
  );
}
