# Usar Node.js 18 Alpine como imagen base
FROM node:18-alpine AS base

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Etapa de desarrollo
FROM base AS dev

# Argumentos para variables de entorno en desarrollo
ARG PUBLIC_API_BASE
ARG SERVER_API_BASE
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE
ENV SERVER_API_BASE=$SERVER_API_BASE

EXPOSE 4321
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Etapa de build
FROM base AS build

# Argumentos para variables de entorno en build time
ARG PUBLIC_API_BASE
ARG SERVER_API_BASE
ENV PUBLIC_API_BASE=$PUBLIC_API_BASE
ENV SERVER_API_BASE=$SERVER_API_BASE

RUN pnpm build

# Etapa de producción
FROM nginx:alpine AS production

# Copiar archivos build desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto 80
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]
