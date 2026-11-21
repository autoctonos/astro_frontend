# Imagen para correr el storefront fuera de Vercel (desarrollo local y SSR con Node).
# Vercel sigue siendo el deploy de producción y no usa este archivo.
#
# Se instala con npm porque package-lock.json es el lockfile que se mantiene;
# pnpm-lock.yaml está desactualizado.

FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .

# Etapa de desarrollo (hot reload; el código se monta como volumen en docker-compose)
FROM base AS dev
ARG PUBLIC_API_BASE
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE
EXPOSE 4321
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Etapa de build: adapter Node standalone en vez de Vercel (ver astro.config.mjs).
# Las variables PUBLIC_* se incrustan en el bundle del cliente, por eso van en build time.
FROM base AS build
ARG PUBLIC_API_BASE
ARG PUBLIC_ASSETS_ORIGIN
ARG PUBLIC_SHIPPING_MOCK
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE \
    PUBLIC_ASSETS_ORIGIN=$PUBLIC_ASSETS_ORIGIN \
    PUBLIC_SHIPPING_MOCK=$PUBLIC_SHIPPING_MOCK \
    ASTRO_ADAPTER=node
RUN npm run build

# Etapa de producción: servidor SSR (páginas server-side + rutas api/payu/*).
# Las credenciales PAYU_* NO se pasan en build: se leen en runtime (env_file / -e).
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
