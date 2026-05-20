/**
 * Test de carga (load test) con k6
 *
 * Simula tráfico real al catálogo público y endpoints clave.
 *
 * Ejecución:
 *   k6 run tests/performance/load.js
 *
 * Variables de entorno:
 *   BASE_URL — por defecto http://localhost:3000
 */
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend, Rate } from "k6/metrics";

// Métricas personalizadas
const tiempoCatalogo = new Trend("tiempo_catalogo_ms");
const tiempoDetalle = new Trend("tiempo_detalle_ms");
const tasaErrores = new Rate("errores");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    // Escenario 1: ramp-up suave hasta 20 usuarios concurrentes
    carga_normal: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 20 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    // El 95% de las peticiones deben completarse en menos de 500ms
    http_req_duration: ["p(95)<500"],
    // Tasa de errores menor al 1%
    errores: ["rate<0.01"],
    // Tiempo medio del catálogo bajo 300ms
    tiempo_catalogo_ms: ["avg<300"],
  },
};

export default function () {
  group("Catálogo de herramientas", () => {
    const res = http.get(`${BASE_URL}/api/herramientas?limite=9`);
    tiempoCatalogo.add(res.timings.duration);
    const ok = check(res, {
      "status 200": (r) => r.status === 200,
      "tiene array herramientas": (r) => {
        try {
          return Array.isArray(r.json("herramientas"));
        } catch {
          return false;
        }
      },
    });
    tasaErrores.add(!ok);
  });

  sleep(1);

  group("Detalle de herramienta", () => {
    // Primero obtenemos un id real
    const lista = http.get(`${BASE_URL}/api/herramientas?limite=1`);
    let id;
    try {
      const arr = lista.json("herramientas");
      id = Array.isArray(arr) && arr.length > 0 ? arr[0].id : null;
    } catch {
      id = null;
    }
    if (id) {
      const res = http.get(`${BASE_URL}/api/herramientas/${id}`);
      tiempoDetalle.add(res.timings.duration);
      const ok = check(res, { "status 200": (r) => r.status === 200 });
      tasaErrores.add(!ok);
    }
  });

  sleep(1);

  group("Filtros del catálogo", () => {
    const res = http.get(`${BASE_URL}/api/herramientas?nombre=taladro&limite=9`);
    check(res, { "status 200": (r) => r.status === 200 });
  });

  sleep(1);

  group("Categorías y ciudades", () => {
    const cat = http.get(`${BASE_URL}/api/categorias`);
    check(cat, { "categorias status 200": (r) => r.status === 200 });

    const ciu = http.get(`${BASE_URL}/api/ciudades`);
    check(ciu, { "ciudades status 200": (r) => r.status === 200 });
  });

  sleep(2);
}
