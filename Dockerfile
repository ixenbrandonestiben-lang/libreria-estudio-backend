# ==============================================================================
# Librería Estudio - Backend API Dockerfile
# ==============================================================================
FROM node:20-alpine

# Entorno de producción
ENV NODE_ENV=production

# Directorio de trabajo
WORKDIR /usr/src/app

# Crear usuario y grupo no-root para ejecución segura
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar manifiestos e instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar código fuente con permisos adecuados para appuser
COPY --chown=appuser:appgroup src/ ./src/

# Cambiar a usuario no-root
USER appuser

# Puerto expuesto por la API
EXPOSE 3000

# Verificación de salud usando fetch nativo de Node 20
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Comando de inicio
CMD ["node", "src/server.js"]
