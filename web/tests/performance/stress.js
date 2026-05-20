/**
 * Test de estrés con k6 — averigua el punto de ruptura.
 *
 * Ejecución:
 *   k6 run tests/performance/stress.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    estres: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "1m", target: 100 },
        { duration: "1m", target: 200 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"], // toleramos hasta 10% de errores bajo estrés
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/herramientas?limite=9`);
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(Math.random() * 2);
}
