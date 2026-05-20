import { defineConfig } from "vitest/config";
import { config } from "dotenv";

// Carga variables de entorno desde .env.test
config({ path: ".env.test" });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/helpers/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Ejecutamos secuencialmente para evitar conflictos en BD
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    include: ["tests/integration/**/*.test.ts", "tests/security/**/*.test.ts"],
  },
});
