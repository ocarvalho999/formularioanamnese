import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    preset: "vercel",
    entry: "src/server.ts",
  },
  vite: {
    plugins: [
      tsConfigPaths(),
      tailwindcss(),
    ],
  },
});
