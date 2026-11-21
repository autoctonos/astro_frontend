import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

const adapter =
  process.env.ASTRO_ADAPTER === "node" ? node({ mode: "standalone" }) : vercel();

export default defineConfig({
  output: "server",
  adapter,
  security: { checkOrigin: false },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  },
});
