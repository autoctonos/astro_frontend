import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

// Vercel is the deploy target. The Docker image builds with ASTRO_ADAPTER=node so the
// SSR server runs standalone (node ./dist/server/entry.mjs).
const adapter =
  process.env.ASTRO_ADAPTER === "node" ? node({ mode: "standalone" }) : vercel();

export default defineConfig({
  output: "server",
  adapter,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  },
});
